/**
 * Notification Service
 * Handles actual delivery of notifications via email, SMS, and push
 */

const { getQuery, getOneQuery, runQuery } = require('../utils/database');
const settingsService = require('./settings.service');
const crypto = require('crypto');

// ============================================
// EMAIL DELIVERY
// ============================================

/**
 * Send email notification
 * Uses nodemailer if configured, otherwise logs to database
 */
async function sendEmail(tenantId, to, subject, htmlBody, textBody = null) {
  const emailEnabled = await settingsService.getSetting(tenantId, 'notification.email_enabled', true);
  
  if (!emailEnabled) {
    return { sent: false, reason: 'Email notifications disabled' };
  }
  
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  
  try {
    // Check if nodemailer is configured
    const smtpHost = process.env.SMTP_HOST;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    
    if (smtpHost && smtpUser && smtpPass) {
      // Use nodemailer for actual delivery
      const nodemailer = require('nodemailer');
      
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: smtpUser,
          pass: smtpPass
        }
      });
      
      const fromEmail = process.env.SMTP_FROM || smtpUser;
      
      await transporter.sendMail({
        from: fromEmail,
        to,
        subject,
        html: htmlBody,
        text: textBody || stripHtml(htmlBody)
      });
      
      // Log successful delivery
      await logNotification(tenantId, id, 'email', to, subject, 'sent', null);
      
      return { sent: true, id, method: 'smtp' };
    } else {
      // No SMTP configured - log to database for manual processing or webhook
      await logNotification(tenantId, id, 'email', to, subject, 'queued', { htmlBody, textBody });
      
      // Check if webhook is configured for email delivery
      const webhookUrl = process.env.EMAIL_WEBHOOK_URL;
      if (webhookUrl) {
        await sendWebhook(webhookUrl, {
          type: 'email',
          to,
          subject,
          htmlBody,
          textBody,
          tenantId,
          notificationId: id
        });
        
        await updateNotificationStatus(id, 'sent');
        return { sent: true, id, method: 'webhook' };
      }
      
      return { sent: false, id, reason: 'SMTP not configured, notification queued', method: 'queued' };
    }
  } catch (error) {
    console.error('Email send error:', error);
    await logNotification(tenantId, id, 'email', to, subject, 'failed', { error: error.message });
    return { sent: false, id, error: error.message };
  }
}

// ============================================
// SMS DELIVERY
// ============================================

/**
 * Send SMS notification
 * Supports Twilio, Nexmo, or webhook-based delivery
 */
async function sendSMS(tenantId, phoneNumber, message) {
  const smsEnabled = await settingsService.getSetting(tenantId, 'notification.sms_enabled', false);
  
  if (!smsEnabled) {
    return { sent: false, reason: 'SMS notifications disabled' };
  }
  
  const id = crypto.randomUUID();
  
  try {
    // Normalize phone number
    const normalizedPhone = normalizePhoneNumber(phoneNumber);
    
    // Check for Twilio configuration
    const twilioSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioFrom = process.env.TWILIO_PHONE_NUMBER;
    
    if (twilioSid && twilioToken && twilioFrom) {
      const twilio = require('twilio')(twilioSid, twilioToken);
      
      const result = await twilio.messages.create({
        body: message,
        from: twilioFrom,
        to: normalizedPhone
      });
      
      await logNotification(tenantId, id, 'sms', normalizedPhone, message.substring(0, 50), 'sent', { 
        twilioSid: result.sid 
      });
      
      return { sent: true, id, method: 'twilio', externalId: result.sid };
    }
    
    // Check for SMS webhook
    const smsWebhookUrl = process.env.SMS_WEBHOOK_URL;
    if (smsWebhookUrl) {
      await sendWebhook(smsWebhookUrl, {
        type: 'sms',
        to: normalizedPhone,
        message,
        tenantId,
        notificationId: id
      });
      
      await logNotification(tenantId, id, 'sms', normalizedPhone, message.substring(0, 50), 'sent', null);
      return { sent: true, id, method: 'webhook' };
    }
    
    // Queue for manual processing
    await logNotification(tenantId, id, 'sms', normalizedPhone, message.substring(0, 50), 'queued', { message });
    return { sent: false, id, reason: 'SMS provider not configured, notification queued', method: 'queued' };
    
  } catch (error) {
    console.error('SMS send error:', error);
    await logNotification(tenantId, id, 'sms', phoneNumber, message.substring(0, 50), 'failed', { error: error.message });
    return { sent: false, id, error: error.message };
  }
}

// ============================================
// PUSH NOTIFICATIONS
// ============================================

/**
 * Send push notification
 * Supports Firebase Cloud Messaging (FCM)
 */
async function sendPush(tenantId, userId, title, body, data = {}) {
  const pushEnabled = await settingsService.getSetting(tenantId, 'notification.push_enabled', true);
  
  if (!pushEnabled) {
    return { sent: false, reason: 'Push notifications disabled' };
  }
  
  const id = crypto.randomUUID();
  
  try {
    // Get user's device tokens
    const devices = await getQuery(`
      SELECT device_token, device_type
      FROM user_devices
      WHERE user_id = ? AND tenant_id = ? AND is_active = 1
    `, [userId, tenantId]);
    
    if (!devices || devices.length === 0) {
      await logNotification(tenantId, id, 'push', userId, title, 'skipped', { reason: 'No registered devices' });
      return { sent: false, id, reason: 'No registered devices for user' };
    }
    
    // Check for FCM configuration
    const fcmServerKey = process.env.FCM_SERVER_KEY;
    
    if (fcmServerKey) {
      const results = [];
      
      for (const device of devices) {
        try {
          const response = await fetch('https://fcm.googleapis.com/fcm/send', {
            method: 'POST',
            headers: {
              'Authorization': `key=${fcmServerKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              to: device.device_token,
              notification: { title, body },
              data: { ...data, notificationId: id }
            })
          });
          
          const result = await response.json();
          results.push({ device: device.device_type, success: result.success === 1 });
        } catch (deviceError) {
          results.push({ device: device.device_type, success: false, error: deviceError.message });
        }
      }
      
      const successCount = results.filter(r => r.success).length;
      await logNotification(tenantId, id, 'push', userId, title, successCount > 0 ? 'sent' : 'failed', { results });
      
      return { sent: successCount > 0, id, method: 'fcm', results };
    }
    
    // Check for push webhook
    const pushWebhookUrl = process.env.PUSH_WEBHOOK_URL;
    if (pushWebhookUrl) {
      await sendWebhook(pushWebhookUrl, {
        type: 'push',
        userId,
        title,
        body,
        data,
        devices: devices.map(d => d.device_token),
        tenantId,
        notificationId: id
      });
      
      await logNotification(tenantId, id, 'push', userId, title, 'sent', null);
      return { sent: true, id, method: 'webhook' };
    }
    
    // Queue for manual processing
    await logNotification(tenantId, id, 'push', userId, title, 'queued', { body, data });
    return { sent: false, id, reason: 'Push provider not configured, notification queued', method: 'queued' };
    
  } catch (error) {
    console.error('Push send error:', error);
    await logNotification(tenantId, id, 'push', userId, title, 'failed', { error: error.message });
    return { sent: false, id, error: error.message };
  }
}

// ============================================
// NOTIFICATION TEMPLATES
// ============================================

/**
 * Send order confirmation notification
 */
async function sendOrderConfirmation(tenantId, orderId) {
  const sendConfirmation = await settingsService.getSetting(tenantId, 'notification.order_confirmation', true);
  
  if (!sendConfirmation) {
    return { sent: false, reason: 'Order confirmation notifications disabled' };
  }
  
  const order = await getOneQuery(`
    SELECT o.*, c.name as customer_name, c.email as customer_email, c.phone as customer_phone,
           u.first_name as agent_first_name, u.last_name as agent_last_name
    FROM orders o
    JOIN customers c ON o.customer_id = c.id
    LEFT JOIN users u ON o.created_by = u.id
    WHERE o.id = ? AND o.tenant_id = ?
  `, [orderId, tenantId]);
  
  if (!order) {
    return { sent: false, reason: 'Order not found' };
  }
  
  const results = [];
  
  // Send email if customer has email
  if (order.customer_email) {
    const emailResult = await sendEmail(
      tenantId,
      order.customer_email,
      `Order Confirmation - #${order.order_number}`,
      generateOrderConfirmationHtml(order),
      generateOrderConfirmationText(order)
    );
    results.push({ type: 'email', ...emailResult });
  }
  
  // Send SMS if customer has phone
  if (order.customer_phone) {
    const smsResult = await sendSMS(
      tenantId,
      order.customer_phone,
      `Your order #${order.order_number} has been confirmed. Total: ${order.total_amount}. Thank you for your business!`
    );
    results.push({ type: 'sms', ...smsResult });
  }
  
  return { sent: results.some(r => r.sent), results };
}

/**
 * Send low stock alert
 */
async function sendLowStockAlert(tenantId, productId, currentStock, threshold) {
  const sendAlert = await settingsService.getSetting(tenantId, 'notification.low_stock_alert', true);
  
  if (!sendAlert) {
    return { sent: false, reason: 'Low stock alerts disabled' };
  }
  
  const product = await getOneQuery(`
    SELECT p.*, c.name as category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.id = ? AND p.tenant_id = ?
  `, [productId, tenantId]);
  
  if (!product) {
    return { sent: false, reason: 'Product not found' };
  }
  
  // Get admin users to notify
  const admins = await getQuery(`
    SELECT u.id, u.email, u.first_name
    FROM users u
    WHERE u.tenant_id = ? AND u.role IN ('admin', 'inventory_manager') AND u.status = 'active'
  `, [tenantId]);
  
  const results = [];
  
  for (const admin of admins || []) {
    if (admin.email) {
      const emailResult = await sendEmail(
        tenantId,
        admin.email,
        `Low Stock Alert: ${product.name}`,
        `<h2>Low Stock Alert</h2>
         <p>Product <strong>${product.name}</strong> (${product.code}) is running low on stock.</p>
         <p>Current Stock: <strong>${currentStock}</strong></p>
         <p>Threshold: ${threshold}</p>
         <p>Category: ${product.category_name || 'N/A'}</p>
         <p>Please reorder soon to avoid stockouts.</p>`,
        `Low Stock Alert: ${product.name} (${product.code}) - Current: ${currentStock}, Threshold: ${threshold}`
      );
      results.push({ admin: admin.email, ...emailResult });
    }
    
    // Also send push notification
    const pushResult = await sendPush(
      tenantId,
      admin.id,
      'Low Stock Alert',
      `${product.name} is running low (${currentStock} remaining)`,
      { productId, currentStock, threshold }
    );
    results.push({ admin: admin.id, type: 'push', ...pushResult });
  }
  
  return { sent: results.some(r => r.sent), results };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

async function logNotification(tenantId, id, type, recipient, subject, status, metadata) {
  try {
    await runQuery(`
      INSERT INTO notification_logs (id, tenant_id, type, recipient, subject, status, metadata, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [id, tenantId, type, recipient, subject, status, metadata ? JSON.stringify(metadata) : null, new Date().toISOString()]);
  } catch (error) {
    console.error('Error logging notification:', error);
  }
}

async function updateNotificationStatus(id, status) {
  try {
    await runQuery(`
      UPDATE notification_logs SET status = ?, updated_at = ? WHERE id = ?
    `, [status, new Date().toISOString(), id]);
  } catch (error) {
    console.error('Error updating notification status:', error);
  }
}

async function sendWebhook(url, payload) {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return response.ok;
  } catch (error) {
    console.error('Webhook send error:', error);
    return false;
  }
}

function normalizePhoneNumber(phone) {
  // Remove all non-digit characters except +
  let normalized = phone.replace(/[^\d+]/g, '');
  // Ensure it starts with + for international format
  if (!normalized.startsWith('+')) {
    normalized = '+' + normalized;
  }
  return normalized;
}

function stripHtml(html) {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

function generateOrderConfirmationHtml(order) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #333;">Order Confirmation</h1>
      <p>Dear ${order.customer_name},</p>
      <p>Thank you for your order! Here are your order details:</p>
      
      <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Order Number:</strong> ${order.order_number}</p>
        <p><strong>Order Date:</strong> ${new Date(order.created_at).toLocaleDateString()}</p>
        <p><strong>Total Amount:</strong> ${order.total_amount}</p>
        <p><strong>Status:</strong> ${order.status}</p>
      </div>
      
      ${order.agent_first_name ? `<p>Your sales representative: ${order.agent_first_name} ${order.agent_last_name}</p>` : ''}
      
      <p>If you have any questions about your order, please don't hesitate to contact us.</p>
      
      <p>Thank you for your business!</p>
    </div>
  `;
}

function generateOrderConfirmationText(order) {
  return `
Order Confirmation

Dear ${order.customer_name},

Thank you for your order!

Order Number: ${order.order_number}
Order Date: ${new Date(order.created_at).toLocaleDateString()}
Total Amount: ${order.total_amount}
Status: ${order.status}

${order.agent_first_name ? `Your sales representative: ${order.agent_first_name} ${order.agent_last_name}` : ''}

If you have any questions about your order, please don't hesitate to contact us.

Thank you for your business!
  `.trim();
}

/**
 * Get notification history
 */
async function getNotificationHistory(tenantId, filters = {}) {
  const { type, status, recipient, limit = 50, offset = 0 } = filters;
  
  let query = `
    SELECT * FROM notification_logs
    WHERE tenant_id = ?
  `;
  const params = [tenantId];
  
  if (type) {
    query += ` AND type = ?`;
    params.push(type);
  }
  
  if (status) {
    query += ` AND status = ?`;
    params.push(status);
  }
  
  if (recipient) {
    query += ` AND recipient LIKE ?`;
    params.push(`%${recipient}%`);
  }
  
  query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), parseInt(offset));
  
  const logs = await getQuery(query, params);
  
  return (logs || []).map(log => ({
    ...log,
    metadata: log.metadata ? JSON.parse(log.metadata) : null
  }));
}

/**
 * Retry failed notifications
 */
async function retryFailedNotifications(tenantId, maxRetries = 3) {
  const failedNotifications = await getQuery(`
    SELECT * FROM notification_logs
    WHERE tenant_id = ? AND status = 'failed' AND COALESCE(retry_count, 0) < ?
    ORDER BY created_at ASC
    LIMIT 100
  `, [tenantId, maxRetries]);
  
  const results = [];
  
  for (const notification of failedNotifications || []) {
    const metadata = notification.metadata ? JSON.parse(notification.metadata) : {};
    let result;
    
    switch (notification.type) {
      case 'email':
        result = await sendEmail(tenantId, notification.recipient, notification.subject, metadata.htmlBody, metadata.textBody);
        break;
      case 'sms':
        result = await sendSMS(tenantId, notification.recipient, metadata.message);
        break;
      case 'push':
        result = await sendPush(tenantId, notification.recipient, notification.subject, metadata.body, metadata.data);
        break;
    }
    
    // Update retry count
    await runQuery(`
      UPDATE notification_logs SET retry_count = COALESCE(retry_count, 0) + 1, updated_at = ?
      WHERE id = ?
    `, [new Date().toISOString(), notification.id]);
    
    results.push({ id: notification.id, type: notification.type, ...result });
  }
  
  return results;
}

module.exports = {
  // Core delivery
  sendEmail,
  sendSMS,
  sendPush,
  
  // Templates
  sendOrderConfirmation,
  sendLowStockAlert,
  
  // Management
  getNotificationHistory,
  retryFailedNotifications,
  
  // Helpers
  logNotification,
  updateNotificationStatus
};
