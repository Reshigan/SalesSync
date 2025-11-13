const express = require('express');
const router = express.Router();
const db = require('../utils/database');

// Get currency settings
router.get('/currency', async (req, res) => {
  try {
    // Check if currency settings exist in mobile_app_settings
    const currencySettings = await db.all(`
      SELECT setting_key, setting_value 
      FROM mobile_app_settings 
      WHERE setting_category = 'currency' 
      AND (setting_key = 'default_currency' OR setting_key = 'currency_symbol')
    `);

    let currency = 'USD';
    let currencySymbol = '$';

    // Parse existing settings
    currencySettings.forEach(setting => {
      if (setting.setting_key === 'default_currency') {
        currency = setting.setting_value;
      } else if (setting.setting_key === 'currency_symbol') {
        currencySymbol = setting.setting_value;
      }
    });

    res.json({
      success: true,
      data: {
        currency,
        currencySymbol
      }
    });
  } catch (error) {
    console.error('Error fetching currency settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch currency settings',
      error: error.message
    });
  }
});

// Save currency settings
router.post('/currency', async (req, res) => {
  try {
    const { currency, currencySymbol } = req.body;

    if (!currency || !currencySymbol) {
      return res.status(400).json({
        success: false,
        message: 'Currency and currency symbol are required'
      });
    }

    // Get a default tenant_id and user_id for system settings
    // In a real system, you might want to use a system user or admin user
    const defaultTenant = await db.get('SELECT id FROM tenants LIMIT 1');
    const defaultUser = await db.get('SELECT id FROM users WHERE role = "admin" LIMIT 1');

    if (!defaultTenant || !defaultUser) {
      return res.status(500).json({
        success: false,
        message: 'System configuration error: No tenant or admin user found'
      });
    }

    const tenantId = defaultTenant.id;
    const userId = defaultUser.id;
    const deviceId = 'system-settings';

    // Update or insert currency settings
    const currencySettings = [
      { key: 'default_currency', value: currency },
      { key: 'currency_symbol', value: currencySymbol }
    ];

    for (const setting of currencySettings) {
      // Check if setting exists
      const existingSetting = await db.get(`
        SELECT id FROM mobile_app_settings 
        WHERE setting_category = 'currency' 
        AND setting_key = ? 
        AND tenant_id = ?
      `, [setting.key, tenantId]);

      if (existingSetting) {
        // Update existing setting
        await db.run(`
          UPDATE mobile_app_settings 
          SET setting_value = ?, last_modified_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [setting.value, existingSetting.id]);
      } else {
        // Insert new setting
        await db.run(`
          INSERT INTO mobile_app_settings (
            tenant_id, user_id, device_id, setting_category, 
            setting_key, setting_value, data_type, is_encrypted
          ) VALUES (?, ?, ?, 'currency', ?, ?, 'string', 0)
        `, [tenantId, userId, deviceId, setting.key, setting.value]);
      }
    }

    res.json({
      success: true,
      message: 'Currency settings saved successfully',
      data: {
        currency,
        currencySymbol
      }
    });
  } catch (error) {
    console.error('Error saving currency settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save currency settings',
      error: error.message
    });
  }
});

module.exports = router;