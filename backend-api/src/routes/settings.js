const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { getQuery, getOneQuery, runQuery } = require('../utils/database');

// Get all settings
router.get('/', asyncHandler(async (req, res) => {
  const tenantId = req.tenantId;
  
  const settings = await getQuery(`
    SELECT 
      setting_key,
      setting_value,
      setting_type,
      description,
      updated_at
    FROM system_settings 
    WHERE tenant_id = ?
    ORDER BY setting_key
  `, [tenantId]);

  // Convert to key-value object for easier frontend consumption
  const settingsObject = {};
  if (settings) {
    settings.forEach(setting => {
      let value = setting.setting_value;
      
      // Parse JSON values
      if (setting.setting_type === 'json') {
        try {
          value = JSON.parse(value);
        } catch (e) {
          value = setting.setting_value;
        }
      }
      
      // Parse boolean values
      if (setting.setting_type === 'boolean') {
        value = value === 'true' || value === '1';
      }
      
      // Parse number values
      if (setting.setting_type === 'number') {
        value = parseFloat(value);
      }
      
      settingsObject[setting.setting_key] = {
        value: value,
        type: setting.setting_type,
        description: setting.description,
        updated_at: setting.updated_at
      };
    });
  }

  res.json({
    success: true,
    data: settingsObject
  });
}));

// Get specific setting
router.get('/:key', asyncHandler(async (req, res) => {
  const { key } = req.params;
  const tenantId = req.tenantId;
  
  const setting = await getOneQuery(`
    SELECT * FROM system_settings 
    WHERE setting_key = ? AND tenant_id = ?
  `, [key, tenantId]);

  if (!setting) {
    return res.status(404).json({
      success: false,
      message: 'Setting not found'
    });
  }

  let value = setting.setting_value;
  
  // Parse based on type
  if (setting.setting_type === 'json') {
    try {
      value = JSON.parse(value);
    } catch (e) {
      value = setting.setting_value;
    }
  } else if (setting.setting_type === 'boolean') {
    value = value === 'true' || value === '1';
  } else if (setting.setting_type === 'number') {
    value = parseFloat(value);
  }

  res.json({
    success: true,
    data: {
      key: setting.setting_key,
      value: value,
      type: setting.setting_type,
      description: setting.description
    }
  });
}));

// Update or create setting
router.put('/:key', asyncHandler(async (req, res) => {
  const { key } = req.params;
  const tenantId = req.tenantId;
  const { value, type = 'string', description = '' } = req.body;
  
  let settingValue = value;
  
  // Convert value to string for storage
  if (type === 'json') {
    settingValue = JSON.stringify(value);
  } else if (type === 'boolean') {
    settingValue = value ? 'true' : 'false';
  } else {
    settingValue = String(value);
  }
  
  // Try to update first
  const updateResult = await runQuery(`
    UPDATE system_settings 
    SET setting_value = ?, setting_type = ?, description = ?, updated_at = ?
    WHERE setting_key = ? AND tenant_id = ?
  `, [settingValue, type, description, new Date().toISOString(), key, tenantId]);

  // If no rows were updated, insert new setting
  if (updateResult.changes === 0) {
    const settingId = require('crypto').randomUUID();
    await runQuery(`
      INSERT INTO system_settings (
        id, tenant_id, setting_key, setting_value, setting_type, description, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [settingId, tenantId, key, settingValue, type, description, new Date().toISOString(), new Date().toISOString()]);
  }

  res.json({
    success: true,
    message: 'Setting updated successfully',
    data: {
      key: key,
      value: value,
      type: type
    }
  });
}));

// Delete setting
router.delete('/:key', asyncHandler(async (req, res) => {
  const { key } = req.params;
  const tenantId = req.tenantId;
  
  const result = await runQuery(`
    DELETE FROM system_settings 
    WHERE setting_key = ? AND tenant_id = ?
  `, [key, tenantId]);

  if (result.changes === 0) {
    return res.status(404).json({
      success: false,
      message: 'Setting not found'
    });
  }

  res.json({
    success: true,
    message: 'Setting deleted successfully'
  });
}));

// Bulk update settings
router.post('/bulk', asyncHandler(async (req, res) => {
  const tenantId = req.tenantId;
  const { settings } = req.body;
  
  if (!settings || typeof settings !== 'object') {
    return res.status(400).json({
      success: false,
      message: 'Settings object is required'
    });
  }

  const results = [];
  
  for (const [key, config] of Object.entries(settings)) {
    const { value, type = 'string', description = '' } = config;
    
    let settingValue = value;
    if (type === 'json') {
      settingValue = JSON.stringify(value);
    } else if (type === 'boolean') {
      settingValue = value ? 'true' : 'false';
    } else {
      settingValue = String(value);
    }
    
    // Try update first
    const updateResult = await runQuery(`
      UPDATE system_settings 
      SET setting_value = ?, setting_type = ?, description = ?, updated_at = ?
      WHERE setting_key = ? AND tenant_id = ?
    `, [settingValue, type, description, new Date().toISOString(), key, tenantId]);

    // If no rows updated, insert new
    if (updateResult.changes === 0) {
      const settingId = require('crypto').randomUUID();
      await runQuery(`
        INSERT INTO system_settings (
          id, tenant_id, setting_key, setting_value, setting_type, description, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [settingId, tenantId, key, settingValue, type, description, new Date().toISOString(), new Date().toISOString()]);
    }
    
    results.push({ key, status: 'updated' });
  }

  res.json({
    success: true,
    message: 'Settings updated successfully',
    data: results
  });
}));

// Test endpoint
router.get('/test/health', asyncHandler(async (req, res) => {
  res.json({
    success: true,
    message: 'Settings API is working',
    timestamp: new Date().toISOString()
  });
}));

module.exports = router;