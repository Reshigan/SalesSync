/**
 * Settings Service
 * Makes system settings affect runtime behavior across the application
 */

const { getQuery, getOneQuery, runQuery } = require('../utils/database');

// In-memory cache for settings (refreshed periodically)
const settingsCache = new Map();
const CACHE_TTL = 60000; // 1 minute
let lastCacheRefresh = 0;

/**
 * Get all settings for a tenant (with caching)
 */
async function getSettings(tenantId) {
  const cacheKey = `tenant:${tenantId}`;
  const now = Date.now();
  
  // Return cached settings if still valid
  if (settingsCache.has(cacheKey) && (now - lastCacheRefresh) < CACHE_TTL) {
    return settingsCache.get(cacheKey);
  }
  
  try {
    const settings = await getQuery(`
      SELECT setting_key, setting_value, setting_type
      FROM system_settings
      WHERE tenant_id = ?
    `, [tenantId]);
    
    const settingsObject = {};
    if (settings) {
      settings.forEach(setting => {
        settingsObject[setting.setting_key] = parseSettingValue(setting.setting_value, setting.setting_type);
      });
    }
    
    // Apply defaults for missing settings
    const defaults = getDefaultSettings();
    for (const [key, value] of Object.entries(defaults)) {
      if (!(key in settingsObject)) {
        settingsObject[key] = value;
      }
    }
    
    settingsCache.set(cacheKey, settingsObject);
    lastCacheRefresh = now;
    
    return settingsObject;
  } catch (error) {
    console.error('Error fetching settings:', error);
    return getDefaultSettings();
  }
}

/**
 * Get a specific setting value
 */
async function getSetting(tenantId, key, defaultValue = null) {
  const settings = await getSettings(tenantId);
  return settings[key] !== undefined ? settings[key] : defaultValue;
}

/**
 * Update a setting and invalidate cache
 */
async function updateSetting(tenantId, key, value, type = 'string') {
  const settingValue = serializeSettingValue(value, type);
  
  const existing = await getOneQuery(`
    SELECT id FROM system_settings WHERE tenant_id = ? AND setting_key = ?
  `, [tenantId, key]);
  
  if (existing) {
    await runQuery(`
      UPDATE system_settings 
      SET setting_value = ?, setting_type = ?, updated_at = ?
      WHERE tenant_id = ? AND setting_key = ?
    `, [settingValue, type, new Date().toISOString(), tenantId, key]);
  } else {
    const id = require('crypto').randomUUID();
    await runQuery(`
      INSERT INTO system_settings (id, tenant_id, setting_key, setting_value, setting_type, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [id, tenantId, key, settingValue, type, new Date().toISOString(), new Date().toISOString()]);
  }
  
  // Invalidate cache
  settingsCache.delete(`tenant:${tenantId}`);
  
  return { key, value, type };
}

/**
 * Clear settings cache (call when settings are updated externally)
 */
function clearCache(tenantId = null) {
  if (tenantId) {
    settingsCache.delete(`tenant:${tenantId}`);
  } else {
    settingsCache.clear();
  }
  lastCacheRefresh = 0;
}

/**
 * Parse setting value based on type
 */
function parseSettingValue(value, type) {
  switch (type) {
    case 'boolean':
      return value === 'true' || value === '1' || value === true;
    case 'number':
      return parseFloat(value) || 0;
    case 'json':
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    default:
      return value;
  }
}

/**
 * Serialize setting value for storage
 */
function serializeSettingValue(value, type) {
  switch (type) {
    case 'boolean':
      return value ? 'true' : 'false';
    case 'json':
      return JSON.stringify(value);
    default:
      return String(value);
  }
}

/**
 * Default settings with their types
 */
function getDefaultSettings() {
  return {
    // Order Settings
    'order.require_approval_above': 10000,
    'order.auto_approve_below': 1000,
    'order.allow_negative_inventory': false,
    'order.default_payment_terms': 30,
    'order.max_credit_limit': 50000,
    
    // Customer Settings
    'customer.require_kyc': true,
    'customer.credit_check_enabled': true,
    'customer.default_credit_limit': 10000,
    'customer.duplicate_check_enabled': true,
    'customer.duplicate_check_fields': ['phone', 'email', 'tax_id'],
    
    // Product Settings
    'product.require_sku': true,
    'product.sku_unique_per_tenant': true,
    'product.allow_negative_stock': false,
    'product.low_stock_threshold': 10,
    'product.require_category': true,
    
    // Pricing Settings
    'pricing.require_approval': true,
    'pricing.approval_threshold_percent': 10,
    'pricing.allow_below_cost': false,
    'pricing.default_margin_percent': 20,
    
    // Commission Settings
    'commission.auto_calculate': true,
    'commission.require_approval': true,
    'commission.payout_frequency': 'monthly',
    'commission.min_payout_amount': 100,
    
    // Visit Settings
    'visit.require_gps': true,
    'visit.gps_accuracy_threshold': 100,
    'visit.require_photo': false,
    'visit.min_visit_duration_minutes': 5,
    'visit.max_distance_from_customer_meters': 500,
    
    // Security Settings
    'security.password_min_length': 8,
    'security.password_require_special': true,
    'security.session_timeout_minutes': 480,
    'security.max_login_attempts': 5,
    'security.lockout_duration_minutes': 30,
    
    // Notification Settings
    'notification.email_enabled': true,
    'notification.sms_enabled': false,
    'notification.push_enabled': true,
    'notification.order_confirmation': true,
    'notification.low_stock_alert': true,
    
    // Integration Settings
    'integration.sync_interval_minutes': 15,
    'integration.retry_attempts': 3,
    'integration.webhook_timeout_seconds': 30,
    
    // Backup Settings
    'backup.auto_backup_enabled': true,
    'backup.backup_frequency': 'daily',
    'backup.retention_days': 30,
    'backup.include_attachments': true
  };
}

// ============================================
// Runtime Behavior Functions
// These functions use settings to affect app behavior
// ============================================

/**
 * Check if order requires approval based on amount
 */
async function orderRequiresApproval(tenantId, orderAmount) {
  const threshold = await getSetting(tenantId, 'order.require_approval_above', 10000);
  const autoApproveBelow = await getSetting(tenantId, 'order.auto_approve_below', 1000);
  
  if (orderAmount <= autoApproveBelow) {
    return { required: false, reason: 'Below auto-approve threshold' };
  }
  
  if (orderAmount > threshold) {
    return { required: true, reason: `Order amount ${orderAmount} exceeds approval threshold ${threshold}` };
  }
  
  return { required: false, reason: 'Within normal limits' };
}

/**
 * Check if customer credit is within limits
 */
async function checkCustomerCredit(tenantId, customerId, orderAmount) {
  const creditCheckEnabled = await getSetting(tenantId, 'customer.credit_check_enabled', true);
  
  if (!creditCheckEnabled) {
    return { allowed: true, reason: 'Credit check disabled' };
  }
  
  const customer = await getOneQuery(`
    SELECT credit_limit, COALESCE(outstanding_balance, 0) as outstanding_balance
    FROM customers
    WHERE id = ? AND tenant_id = ?
  `, [customerId, tenantId]);
  
  if (!customer) {
    return { allowed: false, reason: 'Customer not found' };
  }
  
  const defaultLimit = await getSetting(tenantId, 'customer.default_credit_limit', 10000);
  const creditLimit = customer.credit_limit || defaultLimit;
  const availableCredit = creditLimit - customer.outstanding_balance;
  
  if (orderAmount > availableCredit) {
    return { 
      allowed: false, 
      reason: `Order amount ${orderAmount} exceeds available credit ${availableCredit}`,
      availableCredit,
      creditLimit
    };
  }
  
  return { allowed: true, availableCredit, creditLimit };
}

/**
 * Check for duplicate customer
 */
async function checkDuplicateCustomer(tenantId, customerData) {
  const enabled = await getSetting(tenantId, 'customer.duplicate_check_enabled', true);
  
  if (!enabled) {
    return { isDuplicate: false };
  }
  
  const checkFields = await getSetting(tenantId, 'customer.duplicate_check_fields', ['phone', 'email', 'tax_id']);
  const conditions = [];
  const params = [tenantId];
  
  for (const field of checkFields) {
    if (customerData[field]) {
      conditions.push(`${field} = ?`);
      params.push(customerData[field]);
    }
  }
  
  if (conditions.length === 0) {
    return { isDuplicate: false };
  }
  
  const existing = await getOneQuery(`
    SELECT id, name, ${checkFields.join(', ')}
    FROM customers
    WHERE tenant_id = ? AND (${conditions.join(' OR ')})
    LIMIT 1
  `, params);
  
  if (existing) {
    return { 
      isDuplicate: true, 
      existingCustomer: existing,
      matchedFields: checkFields.filter(f => customerData[f] && existing[f] === customerData[f])
    };
  }
  
  return { isDuplicate: false };
}

/**
 * Validate product SKU uniqueness
 */
async function validateProductSKU(tenantId, sku, excludeProductId = null) {
  const requireSKU = await getSetting(tenantId, 'product.require_sku', true);
  const uniquePerTenant = await getSetting(tenantId, 'product.sku_unique_per_tenant', true);
  
  if (!sku && requireSKU) {
    return { valid: false, reason: 'SKU is required' };
  }
  
  if (!sku) {
    return { valid: true };
  }
  
  if (uniquePerTenant) {
    let query = `SELECT id FROM products WHERE tenant_id = ? AND code = ?`;
    const params = [tenantId, sku];
    
    if (excludeProductId) {
      query += ` AND id != ?`;
      params.push(excludeProductId);
    }
    
    const existing = await getOneQuery(query, params);
    
    if (existing) {
      return { valid: false, reason: `SKU '${sku}' already exists` };
    }
  }
  
  return { valid: true };
}

/**
 * Check if inventory allows order
 */
async function checkInventoryForOrder(tenantId, items) {
  const allowNegative = await getSetting(tenantId, 'product.allow_negative_stock', false);
  
  if (allowNegative) {
    return { allowed: true, reason: 'Negative stock allowed' };
  }
  
  const insufficientItems = [];
  
  for (const item of items) {
    const stock = await getOneQuery(`
      SELECT COALESCE(SUM(quantity_on_hand), 0) as available
      FROM inventory_stock
      WHERE tenant_id = ? AND product_id = ?
    `, [tenantId, item.product_id]);
    
    const available = stock?.available || 0;
    
    if (item.quantity > available) {
      insufficientItems.push({
        product_id: item.product_id,
        requested: item.quantity,
        available
      });
    }
  }
  
  if (insufficientItems.length > 0) {
    return { 
      allowed: false, 
      reason: 'Insufficient inventory',
      insufficientItems
    };
  }
  
  return { allowed: true };
}

/**
 * Check if price change requires approval
 */
async function priceChangeRequiresApproval(tenantId, oldPrice, newPrice) {
  const requireApproval = await getSetting(tenantId, 'pricing.require_approval', true);
  
  if (!requireApproval) {
    return { required: false };
  }
  
  const threshold = await getSetting(tenantId, 'pricing.approval_threshold_percent', 10);
  const percentChange = Math.abs((newPrice - oldPrice) / oldPrice * 100);
  
  if (percentChange > threshold) {
    return { 
      required: true, 
      reason: `Price change of ${percentChange.toFixed(1)}% exceeds ${threshold}% threshold`
    };
  }
  
  return { required: false };
}

/**
 * Validate visit GPS location
 */
async function validateVisitLocation(tenantId, visitLat, visitLng, customerLat, customerLng) {
  const requireGPS = await getSetting(tenantId, 'visit.require_gps', true);
  
  if (!requireGPS) {
    return { valid: true };
  }
  
  if (!visitLat || !visitLng) {
    return { valid: false, reason: 'GPS coordinates required' };
  }
  
  const maxDistance = await getSetting(tenantId, 'visit.max_distance_from_customer_meters', 500);
  
  // Calculate distance using Haversine formula
  const distance = calculateDistance(visitLat, visitLng, customerLat, customerLng);
  
  if (distance > maxDistance) {
    return { 
      valid: false, 
      reason: `Visit location ${distance.toFixed(0)}m from customer exceeds ${maxDistance}m limit`,
      distance
    };
  }
  
  return { valid: true, distance };
}

/**
 * Calculate distance between two GPS coordinates (Haversine formula)
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Get notification preferences
 */
async function getNotificationPreferences(tenantId) {
  return {
    emailEnabled: await getSetting(tenantId, 'notification.email_enabled', true),
    smsEnabled: await getSetting(tenantId, 'notification.sms_enabled', false),
    pushEnabled: await getSetting(tenantId, 'notification.push_enabled', true),
    orderConfirmation: await getSetting(tenantId, 'notification.order_confirmation', true),
    lowStockAlert: await getSetting(tenantId, 'notification.low_stock_alert', true)
  };
}

module.exports = {
  // Core settings functions
  getSettings,
  getSetting,
  updateSetting,
  clearCache,
  getDefaultSettings,
  
  // Runtime behavior functions
  orderRequiresApproval,
  checkCustomerCredit,
  checkDuplicateCustomer,
  validateProductSKU,
  checkInventoryForOrder,
  priceChangeRequiresApproval,
  validateVisitLocation,
  getNotificationPreferences,
  
  // Utility
  calculateDistance
};
