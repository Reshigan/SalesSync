const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { requireFunction, requireRole } = require('../middleware/authMiddleware');
const crypto = require('crypto');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/mobile/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Register mobile device
router.post('/devices/register', requireFunction('mobile', 'create'), async (req, res) => {
  try {
    const {
      device_id,
      device_name,
      device_type,
      os_version,
      app_version,
      device_model,
      screen_resolution,
      device_capabilities
    } = req.body;
    
    if (!device_id || !device_type) {
      return res.status(400).json({ 
        success: false, 
        error: 'Device ID and type are required' 
      });
    }
    
    // Check if device already exists
    const existingDevice = await db.get(`
      SELECT * FROM mobile_devices 
      WHERE device_id = ? AND user_id = ?
    `, [device_id, req.user.userId]);
    
    if (existingDevice) {
      // Update existing device
      await db.run(`
        UPDATE mobile_devices 
        SET device_name = ?, os_version = ?, app_version = ?, 
            device_model = ?, screen_resolution = ?, device_capabilities = ?,
            last_seen_at = CURRENT_TIMESTAMP
        WHERE device_id = ? AND user_id = ?
      `, [
        device_name,
        os_version,
        app_version,
        device_model,
        screen_resolution,
        JSON.stringify(device_capabilities || {}),
        device_id,
        req.user.userId
      ]);
    } else {
      // Register new device
      const deviceDbId = crypto.randomBytes(16).toString('hex');
      
      await db.run(`
        INSERT INTO mobile_devices (
          id, tenant_id, user_id, device_id, device_name, device_type,
          os_version, app_version, device_model, screen_resolution, device_capabilities
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        deviceDbId,
        req.user.tenantId,
        req.user.userId,
        device_id,
        device_name,
        device_type,
        os_version,
        app_version,
        device_model,
        screen_resolution,
        JSON.stringify(device_capabilities || {})
      ]);
    }
    
    const device = await db.get(`
      SELECT * FROM mobile_devices 
      WHERE device_id = ? AND user_id = ?
    `, [device_id, req.user.userId]);
    
    res.json({
      success: true,
      data: device
    });
  } catch (error) {
    console.error('Error registering mobile device:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Subscribe to push notifications
router.post('/push/subscribe', requireFunction('mobile', 'create'), async (req, res) => {
  try {
    const {
      device_id,
      device_type,
      push_token,
      endpoint,
      p256dh_key,
      auth_key,
      subscription_data
    } = req.body;
    
    if (!device_id || !push_token) {
      return res.status(400).json({ 
        success: false, 
        error: 'Device ID and push token are required' 
      });
    }
    
    // Check if subscription already exists
    const existingSubscription = await db.get(`
      SELECT * FROM push_subscriptions 
      WHERE device_id = ? AND user_id = ?
    `, [device_id, req.user.userId]);
    
    if (existingSubscription) {
      // Update existing subscription
      await db.run(`
        UPDATE push_subscriptions 
        SET push_token = ?, endpoint = ?, p256dh_key = ?, auth_key = ?,
            subscription_data = ?, is_active = 1, last_used_at = CURRENT_TIMESTAMP
        WHERE device_id = ? AND user_id = ?
      `, [
        push_token,
        endpoint,
        p256dh_key,
        auth_key,
        JSON.stringify(subscription_data || {}),
        device_id,
        req.user.userId
      ]);
    } else {
      // Create new subscription
      const subscriptionId = crypto.randomBytes(16).toString('hex');
      
      await db.run(`
        INSERT INTO push_subscriptions (
          id, tenant_id, user_id, device_id, device_type, push_token,
          endpoint, p256dh_key, auth_key, subscription_data
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        subscriptionId,
        req.user.tenantId,
        req.user.userId,
        device_id,
        device_type,
        push_token,
        endpoint,
        p256dh_key,
        auth_key,
        JSON.stringify(subscription_data || {})
      ]);
    }
    
    res.json({
      success: true,
      message: 'Push notification subscription updated successfully'
    });
  } catch (error) {
    console.error('Error subscribing to push notifications:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Send push notification
router.post('/push/send', requireFunction('mobile', 'create'), async (req, res) => {
  try {
    const {
      notification_type,
      title,
      body,
      icon,
      badge,
      image,
      data,
      target_users,
      target_roles,
      target_devices,
      scheduled_at
    } = req.body;
    
    if (!title || !body) {
      return res.status(400).json({ 
        success: false, 
        error: 'Title and body are required' 
      });
    }
    
    const notificationId = crypto.randomBytes(16).toString('hex');
    
    await db.run(`
      INSERT INTO push_notifications (
        id, tenant_id, notification_type, title, body, icon, badge, image,
        data, target_users, target_roles, target_devices, scheduled_at, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      notificationId,
      req.user.tenantId,
      notification_type || 'general',
      title,
      body,
      icon,
      badge,
      image,
      JSON.stringify(data || {}),
      JSON.stringify(target_users || []),
      JSON.stringify(target_roles || []),
      JSON.stringify(target_devices || []),
      scheduled_at,
      req.user.userId
    ]);
    
    // If not scheduled, send immediately
    if (!scheduled_at) {
      setTimeout(async () => {
        await processPushNotification(notificationId);
      }, 100);
    }
    
    const notification = await db.get(`
      SELECT * FROM push_notifications WHERE id = ?
    `, [notificationId]);
    
    res.status(201).json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('Error sending push notification:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add to offline sync queue
router.post('/offline/queue', requireFunction('mobile', 'create'), async (req, res) => {
  try {
    const {
      device_id,
      entity_type,
      entity_id,
      action_type,
      data_payload,
      sync_priority = 5
    } = req.body;
    
    if (!device_id || !entity_type || !action_type || !data_payload) {
      return res.status(400).json({ 
        success: false, 
        error: 'Device ID, entity type, action type, and data payload are required' 
      });
    }
    
    const queueId = crypto.randomBytes(16).toString('hex');
    
    await db.run(`
      INSERT INTO offline_sync_queue (
        id, tenant_id, user_id, device_id, entity_type, entity_id,
        action_type, data_payload, sync_priority
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      queueId,
      req.user.tenantId,
      req.user.userId,
      device_id,
      entity_type,
      entity_id,
      action_type,
      JSON.stringify(data_payload),
      sync_priority
    ]);
    
    res.status(201).json({
      success: true,
      data: { id: queueId, status: 'queued' }
    });
  } catch (error) {
    console.error('Error adding to offline sync queue:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get offline sync queue
router.get('/offline/queue', requireFunction('mobile', 'view'), async (req, res) => {
  try {
    const { device_id, status, limit = 50 } = req.query;
    
    let query = `
      SELECT * FROM offline_sync_queue 
      WHERE tenant_id = ? AND user_id = ?
    `;
    
    const params = [req.user.tenantId, req.user.userId];
    
    if (device_id) {
      query += ' AND device_id = ?';
      params.push(device_id);
    }
    
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY sync_priority ASC, created_at ASC LIMIT ?';
    params.push(parseInt(limit));
    
    const queueItems = await db.all(query, params);
    
    res.json({
      success: true,
      data: queueItems.map(item => ({
        ...item,
        data_payload: JSON.parse(item.data_payload),
        sync_result: item.sync_result ? JSON.parse(item.sync_result) : null
      }))
    });
  } catch (error) {
    console.error('Error fetching offline sync queue:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Process offline sync
router.post('/offline/sync/:id', requireFunction('mobile', 'execute'), async (req, res) => {
  try {
    const queueItem = await db.get(`
      SELECT * FROM offline_sync_queue 
      WHERE id = ? AND tenant_id = ? AND user_id = ?
    `, [req.params.id, req.user.tenantId, req.user.userId]);
    
    if (!queueItem) {
      return res.status(404).json({ success: false, error: 'Queue item not found' });
    }
    
    // Update status to syncing
    await db.run(`
      UPDATE offline_sync_queue 
      SET status = 'syncing', last_sync_attempt = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [req.params.id]);
    
    // Process the sync operation
    const syncResult = await processOfflineSync(queueItem);
    
    // Update with result
    await db.run(`
      UPDATE offline_sync_queue 
      SET status = ?, sync_result = ?
      WHERE id = ?
    `, [syncResult.success ? 'synced' : 'failed', JSON.stringify(syncResult), req.params.id]);
    
    res.json({
      success: true,
      data: syncResult
    });
  } catch (error) {
    console.error('Error processing offline sync:', error);
    
    // Update status to failed
    await db.run(`
      UPDATE offline_sync_queue 
      SET status = 'failed', retry_count = retry_count + 1,
          sync_result = ?
      WHERE id = ?
    `, [JSON.stringify({ error: error.message }), req.params.id]);
    
    res.status(500).json({ success: false, error: error.message });
  }
});

// Scan barcode
router.post('/barcode/scan', requireFunction('mobile', 'create'), async (req, res) => {
  try {
    const {
      device_id,
      barcode_value,
      barcode_type,
      scan_context,
      location_data
    } = req.body;
    
    if (!device_id || !barcode_value) {
      return res.status(400).json({ 
        success: false, 
        error: 'Device ID and barcode value are required' 
      });
    }
    
    const scanId = crypto.randomBytes(16).toString('hex');
    
    // Look up product by barcode
    const product = await db.get(`
      SELECT * FROM products 
      WHERE tenant_id = ? AND (sku = ? OR barcode = ?)
    `, [req.user.tenantId, barcode_value, barcode_value]);
    
    const scanResult = {
      found: !!product,
      product: product || null,
      suggestions: []
    };
    
    // If not found, look for similar products
    if (!product) {
      const similarProducts = await db.all(`
        SELECT * FROM products 
        WHERE tenant_id = ? AND (sku LIKE ? OR name LIKE ?)
        LIMIT 5
      `, [req.user.tenantId, `%${barcode_value}%`, `%${barcode_value}%`]);
      
      scanResult.suggestions = similarProducts;
    }
    
    await db.run(`
      INSERT INTO barcode_scans (
        id, tenant_id, user_id, device_id, barcode_value, barcode_type,
        scan_context, product_id, scan_result, location_data, processed
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      scanId,
      req.user.tenantId,
      req.user.userId,
      device_id,
      barcode_value,
      barcode_type,
      scan_context,
      product ? product.id : null,
      JSON.stringify(scanResult),
      JSON.stringify(location_data || {}),
      1
    ]);
    
    res.json({
      success: true,
      data: {
        scan_id: scanId,
        ...scanResult
      }
    });
  } catch (error) {
    console.error('Error processing barcode scan:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Capture photo
router.post('/camera/capture', upload.single('photo'), requireFunction('mobile', 'create'), async (req, res) => {
  try {
    const {
      device_id,
      capture_type,
      entity_type,
      entity_id,
      location_data,
      tags
    } = req.body;
    
    if (!req.file || !device_id || !capture_type) {
      return res.status(400).json({ 
        success: false, 
        error: 'Photo file, device ID, and capture type are required' 
      });
    }
    
    const captureId = crypto.randomBytes(16).toString('hex');
    
    await db.run(`
      INSERT INTO camera_captures (
        id, tenant_id, user_id, device_id, capture_type, entity_type,
        entity_id, file_path, file_name, file_size, mime_type,
        location_data, tags
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      captureId,
      req.user.tenantId,
      req.user.userId,
      device_id,
      capture_type,
      entity_type,
      entity_id,
      req.file.path,
      req.file.filename,
      req.file.size,
      req.file.mimetype,
      JSON.stringify(location_data || {}),
      JSON.stringify(tags ? tags.split(',') : [])
    ]);
    
    // Process image asynchronously
    setTimeout(async () => {
      await processImageCapture(captureId, req.file.path);
    }, 100);
    
    res.status(201).json({
      success: true,
      data: {
        capture_id: captureId,
        file_path: req.file.path,
        processing_status: 'pending'
      }
    });
  } catch (error) {
    console.error('Error capturing photo:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get mobile app settings
router.get('/settings', requireFunction('mobile', 'view'), async (req, res) => {
  try {
    const { device_id, setting_category } = req.query;
    
    let query = `
      SELECT * FROM mobile_app_settings 
      WHERE tenant_id = ? AND user_id = ?
    `;
    
    const params = [req.user.tenantId, req.user.userId];
    
    if (device_id) {
      query += ' AND device_id = ?';
      params.push(device_id);
    }
    
    if (setting_category) {
      query += ' AND setting_category = ?';
      params.push(setting_category);
    }
    
    query += ' ORDER BY setting_category, setting_key';
    
    const settings = await db.all(query, params);
    
    // Group settings by category
    const groupedSettings = settings.reduce((acc, setting) => {
      if (!acc[setting.setting_category]) {
        acc[setting.setting_category] = {};
      }
      
      let value = setting.setting_value;
      if (setting.data_type === 'number') {
        value = parseFloat(value);
      } else if (setting.data_type === 'boolean') {
        value = value === 'true';
      } else if (setting.data_type === 'json') {
        value = JSON.parse(value);
      }
      
      acc[setting.setting_category][setting.setting_key] = value;
      return acc;
    }, {});
    
    res.json({
      success: true,
      data: groupedSettings
    });
  } catch (error) {
    console.error('Error fetching mobile app settings:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update mobile app settings
router.post('/settings', requireFunction('mobile', 'create'), async (req, res) => {
  try {
    const { device_id, settings } = req.body;
    
    if (!device_id || !settings) {
      return res.status(400).json({ 
        success: false, 
        error: 'Device ID and settings are required' 
      });
    }
    
    // Process each setting
    for (const [category, categorySettings] of Object.entries(settings)) {
      for (const [key, value] of Object.entries(categorySettings)) {
        const settingId = crypto.randomBytes(16).toString('hex');
        
        let dataType = 'string';
        let settingValue = value;
        
        if (typeof value === 'number') {
          dataType = 'number';
          settingValue = value.toString();
        } else if (typeof value === 'boolean') {
          dataType = 'boolean';
          settingValue = value.toString();
        } else if (typeof value === 'object') {
          dataType = 'json';
          settingValue = JSON.stringify(value);
        }
        
        // Upsert setting
        await db.run(`
          INSERT OR REPLACE INTO mobile_app_settings (
            id, tenant_id, user_id, device_id, setting_category,
            setting_key, setting_value, data_type
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          settingId,
          req.user.tenantId,
          req.user.userId,
          device_id,
          category,
          key,
          settingValue,
          dataType
        ]);
      }
    }
    
    res.json({
      success: true,
      message: 'Settings updated successfully'
    });
  } catch (error) {
    console.error('Error updating mobile app settings:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Track location
router.post('/location/track', requireFunction('mobile', 'create'), async (req, res) => {
  try {
    const {
      device_id,
      latitude,
      longitude,
      accuracy,
      altitude,
      heading,
      speed,
      location_source = 'gps',
      activity_type,
      visit_id
    } = req.body;
    
    if (!device_id || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ 
        success: false, 
        error: 'Device ID, latitude, and longitude are required' 
      });
    }
    
    const locationId = crypto.randomBytes(16).toString('hex');
    
    await db.run(`
      INSERT INTO location_tracking (
        id, tenant_id, user_id, device_id, latitude, longitude,
        accuracy, altitude, heading, speed, location_source,
        activity_type, visit_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      locationId,
      req.user.tenantId,
      req.user.userId,
      device_id,
      latitude,
      longitude,
      accuracy,
      altitude,
      heading,
      speed,
      location_source,
      activity_type,
      visit_id
    ]);
    
    res.status(201).json({
      success: true,
      data: { location_id: locationId }
    });
  } catch (error) {
    console.error('Error tracking location:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Record performance metric
router.post('/performance/record', requireFunction('mobile', 'create'), async (req, res) => {
  try {
    const {
      device_id,
      metric_type,
      metric_name,
      metric_value,
      metric_unit,
      context_data,
      network_type,
      battery_level,
      memory_usage
    } = req.body;
    
    if (!device_id || !metric_type || !metric_name || metric_value === undefined) {
      return res.status(400).json({ 
        success: false, 
        error: 'Device ID, metric type, name, and value are required' 
      });
    }
    
    const metricId = crypto.randomBytes(16).toString('hex');
    
    await db.run(`
      INSERT INTO mobile_performance_metrics (
        id, tenant_id, user_id, device_id, metric_type, metric_name,
        metric_value, metric_unit, context_data, network_type,
        battery_level, memory_usage
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      metricId,
      req.user.tenantId,
      req.user.userId,
      device_id,
      metric_type,
      metric_name,
      metric_value,
      metric_unit,
      JSON.stringify(context_data || {}),
      network_type,
      battery_level,
      memory_usage
    ]);
    
    res.status(201).json({
      success: true,
      data: { metric_id: metricId }
    });
  } catch (error) {
    console.error('Error recording performance metric:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Helper functions
async function processPushNotification(notificationId) {
  try {
    const notification = await db.get(`
      SELECT * FROM push_notifications WHERE id = ?
    `, [notificationId]);
    
    if (!notification) return;
    
    // Get target subscriptions
    let subscriptions = [];
    
    if (notification.target_users && notification.target_users !== '[]') {
      const targetUsers = JSON.parse(notification.target_users);
      subscriptions = await db.all(`
        SELECT * FROM push_subscriptions 
        WHERE tenant_id = ? AND user_id IN (${targetUsers.map(() => '?').join(',')}) AND is_active = 1
      `, [notification.tenant_id, ...targetUsers]);
    } else {
      // Broadcast to all active subscriptions
      subscriptions = await db.all(`
        SELECT * FROM push_subscriptions 
        WHERE tenant_id = ? AND is_active = 1
      `, [notification.tenant_id]);
    }
    
    // Simulate sending notifications
    let sentCount = 0;
    let deliveredCount = 0;
    
    for (const subscription of subscriptions) {
      const deliveryId = crypto.randomBytes(16).toString('hex');
      
      try {
        // Simulate push notification sending
        const success = Math.random() > 0.1; // 90% success rate
        
        await db.run(`
          INSERT INTO notification_deliveries (
            id, tenant_id, notification_id, user_id, device_id,
            status, sent_at, delivered_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          deliveryId,
          notification.tenant_id,
          notificationId,
          subscription.user_id,
          subscription.device_id,
          success ? 'delivered' : 'failed',
          new Date().toISOString(),
          success ? new Date().toISOString() : null
        ]);
        
        sentCount++;
        if (success) deliveredCount++;
        
      } catch (error) {
        console.error('Error sending push notification:', error);
      }
    }
    
    // Update notification status
    await db.run(`
      UPDATE push_notifications 
      SET status = 'sent', sent_at = CURRENT_TIMESTAMP,
          sent_count = ?, delivered_count = ?
      WHERE id = ?
    `, [sentCount, deliveredCount, notificationId]);
    
  } catch (error) {
    console.error('Error processing push notification:', error);
    
    await db.run(`
      UPDATE push_notifications 
      SET status = 'failed', error_details = ?
      WHERE id = ?
    `, [JSON.stringify({ error: error.message }), notificationId]);
  }
}

async function processOfflineSync(queueItem) {
  try {
    const data = JSON.parse(queueItem.data_payload);
    
    // Simulate sync processing based on entity type and action
    if (queueItem.entity_type === 'order' && queueItem.action_type === 'create') {
      // Create order
      const orderId = crypto.randomBytes(16).toString('hex');
      
      await db.run(`
        INSERT INTO orders (
          id, tenant_id, customer_id, agent_id, order_date, status, total_amount
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        orderId,
        queueItem.tenant_id,
        data.customer_id,
        queueItem.user_id,
        data.order_date || new Date().toISOString(),
        data.status || 'pending',
        data.total_amount || 0
      ]);
      
      return {
        success: true,
        entity_id: orderId,
        action: 'created',
        message: 'Order created successfully'
      };
    }
    
    // Default success response
    return {
      success: true,
      action: 'processed',
      message: 'Sync completed successfully'
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function processImageCapture(captureId, filePath) {
  try {
    // Simulate image processing (OCR, analysis, etc.)
    const processingResult = {
      processed: true,
      analysis: {
        objects_detected: ['product', 'shelf'],
        text_extracted: 'Sample text from image',
        quality_score: 0.85
      }
    };
    
    await db.run(`
      UPDATE camera_captures 
      SET processing_status = 'processed', processing_result = ?
      WHERE id = ?
    `, [JSON.stringify(processingResult), captureId]);
    
  } catch (error) {
    await db.run(`
      UPDATE camera_captures 
      SET processing_status = 'failed', processing_result = ?
      WHERE id = ?
    `, [JSON.stringify({ error: error.message }), captureId]);
  }
}

module.exports = router;