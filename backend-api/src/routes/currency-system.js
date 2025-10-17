const express = require('express');
const router = express.Router();
const { authTenantMiddleware } = require('../middleware/authTenantMiddleware');

// Apply authentication middleware
router.use(authTenantMiddleware);

/**
 * @swagger
 * components:
 *   schemas:
 *     Currency:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         code:
 *           type: string
 *           description: ISO 4217 currency code
 *         name:
 *           type: string
 *         symbol:
 *           type: string
 *         decimal_places:
 *           type: integer
 *         exchange_rate:
 *           type: number
 *           description: Exchange rate to base currency
 *         is_base_currency:
 *           type: boolean
 *         is_active:
 *           type: boolean
 *     LocationCurrency:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         country_code:
 *           type: string
 *         country_name:
 *           type: string
 *         region:
 *           type: string
 *         currency_id:
 *           type: string
 *         is_default:
 *           type: boolean
 *     ExchangeRate:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         from_currency_id:
 *           type: string
 *         to_currency_id:
 *           type: string
 *         rate:
 *           type: number
 *         effective_date:
 *           type: string
 *           format: date
 *         source:
 *           type: string
 */

// CURRENCY MANAGEMENT ENDPOINTS

/**
 * @swagger
 * /api/currency-system/currencies:
 *   get:
 *     summary: Get all available currencies
 *     tags: [Currency System]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: active_only
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Only return active currencies
 *     responses:
 *       200:
 *         description: List of currencies
 */
router.get('/currencies', async (req, res) => {
  try {
    const { getQuery } = await import('../utils/database.js');
    const { active_only = true } = req.query;
    
    let query = `
      SELECT c.*, 
             COUNT(lc.id) as location_count,
             CASE WHEN c.is_base_currency = 1 THEN 'Base Currency' ELSE 'Secondary' END as currency_type
      FROM currencies c
      LEFT JOIN location_currencies lc ON c.id = lc.currency_id
      WHERE c.tenant_id = ?
    `;
    
    const params = [req.user.tenantId];
    
    if (active_only) {
      query += ' AND c.is_active = 1';
    }
    
    query += ' GROUP BY c.id ORDER BY c.is_base_currency DESC, c.name ASC';
    
    const currencies = await getQuery(query, params);
    
    res.json({
      success: true,
      data: { currencies }
    });
  } catch (error) {
    console.error('Error fetching currencies:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch currencies', code: 'FETCH_ERROR' }
    });
  }
});

/**
 * @swagger
 * /api/currency-system/currencies:
 *   post:
 *     summary: Add a new currency
 *     tags: [Currency System]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - name
 *               - symbol
 *             properties:
 *               code:
 *                 type: string
 *               name:
 *                 type: string
 *               symbol:
 *                 type: string
 *               decimal_places:
 *                 type: integer
 *                 default: 2
 *               exchange_rate:
 *                 type: number
 *                 default: 1
 *               is_base_currency:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       201:
 *         description: Currency added successfully
 */
router.post('/currencies', async (req, res) => {
  try {
    const { runQuery, getOneQuery } = await import('../utils/database.js');
    const { 
      code, 
      name, 
      symbol, 
      decimal_places = 2, 
      exchange_rate = 1, 
      is_base_currency = false 
    } = req.body;
    
    if (!code || !name || !symbol) {
      return res.status(400).json({
        success: false,
        error: { message: 'Currency code, name, and symbol are required', code: 'VALIDATION_ERROR' }
      });
    }
    
    // Check if currency code already exists
    const existingCurrency = await getOneQuery(
      'SELECT id FROM currencies WHERE code = ? AND tenant_id = ?',
      [code.toUpperCase(), req.user.tenantId]
    );
    
    if (existingCurrency) {
      return res.status(409).json({
        success: false,
        error: { message: 'Currency code already exists', code: 'DUPLICATE_ERROR' }
      });
    }
    
    // If this is set as base currency, update existing base currency
    if (is_base_currency) {
      await runQuery(
        'UPDATE currencies SET is_base_currency = 0 WHERE tenant_id = ?',
        [req.user.tenantId]
      );
    }
    
    const result = await runQuery(`
      INSERT INTO currencies (
        tenant_id, code, name, symbol, decimal_places, 
        exchange_rate, is_base_currency, is_active
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `, [
      req.user.tenantId, 
      code.toUpperCase(), 
      name, 
      symbol, 
      decimal_places, 
      exchange_rate, 
      is_base_currency ? 1 : 0
    ]);
    
    res.status(201).json({
      success: true,
      data: { 
        id: result.lastID,
        message: 'Currency added successfully'
      }
    });
  } catch (error) {
    console.error('Error adding currency:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to add currency', code: 'CREATE_ERROR' }
    });
  }
});

/**
 * @swagger
 * /api/currency-system/currencies/{id}/exchange-rate:
 *   put:
 *     summary: Update currency exchange rate
 *     tags: [Currency System]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Currency ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - exchange_rate
 *             properties:
 *               exchange_rate:
 *                 type: number
 *               source:
 *                 type: string
 *                 description: Source of exchange rate (e.g., 'manual', 'api', 'bank')
 *     responses:
 *       200:
 *         description: Exchange rate updated successfully
 */
router.put('/currencies/:id/exchange-rate', async (req, res) => {
  try {
    const { runQuery, getOneQuery } = await import('../utils/database.js');
    const { id } = req.params;
    const { exchange_rate, source = 'manual' } = req.body;
    
    if (!exchange_rate || exchange_rate <= 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'Valid exchange rate is required', code: 'VALIDATION_ERROR' }
      });
    }
    
    // Verify currency exists
    const currency = await getOneQuery(
      'SELECT * FROM currencies WHERE id = ? AND tenant_id = ?',
      [id, req.user.tenantId]
    );
    
    if (!currency) {
      return res.status(404).json({
        success: false,
        error: { message: 'Currency not found', code: 'NOT_FOUND' }
      });
    }
    
    // Log the exchange rate change
    await runQuery(`
      INSERT INTO exchange_rate_history (
        tenant_id, currency_id, old_rate, new_rate, 
        source, updated_by, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [
      req.user.tenantId, 
      id, 
      currency.exchange_rate, 
      exchange_rate, 
      source, 
      req.user.userId
    ]);
    
    // Update the currency
    await runQuery(
      'UPDATE currencies SET exchange_rate = ?, last_rate_update = CURRENT_TIMESTAMP WHERE id = ? AND tenant_id = ?',
      [exchange_rate, id, req.user.tenantId]
    );
    
    res.json({
      success: true,
      data: { message: 'Exchange rate updated successfully' }
    });
  } catch (error) {
    console.error('Error updating exchange rate:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to update exchange rate', code: 'UPDATE_ERROR' }
    });
  }
});

// LOCATION-BASED CURRENCY ENDPOINTS

/**
 * @swagger
 * /api/currency-system/location-currencies:
 *   get:
 *     summary: Get location-currency mappings
 *     tags: [Currency System]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: country_code
 *         schema:
 *           type: string
 *         description: Filter by country code
 *       - in: query
 *         name: region
 *         schema:
 *           type: string
 *         description: Filter by region
 *     responses:
 *       200:
 *         description: List of location-currency mappings
 */
router.get('/location-currencies', async (req, res) => {
  try {
    const { getQuery } = await import('../utils/database.js');
    const { country_code, region } = req.query;
    
    let query = `
      SELECT lc.*, c.code as currency_code, c.name as currency_name, 
             c.symbol as currency_symbol, c.exchange_rate
      FROM location_currencies lc
      JOIN currencies c ON lc.currency_id = c.id
      WHERE lc.tenant_id = ?
    `;
    
    const params = [req.user.tenantId];
    
    if (country_code) {
      query += ' AND lc.country_code = ?';
      params.push(country_code.toUpperCase());
    }
    
    if (region) {
      query += ' AND lc.region = ?';
      params.push(region);
    }
    
    query += ' ORDER BY lc.country_name ASC';
    
    const locationCurrencies = await getQuery(query, params);
    
    res.json({
      success: true,
      data: { location_currencies: locationCurrencies }
    });
  } catch (error) {
    console.error('Error fetching location currencies:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch location currencies', code: 'FETCH_ERROR' }
    });
  }
});

/**
 * @swagger
 * /api/currency-system/location-currencies:
 *   post:
 *     summary: Add location-currency mapping
 *     tags: [Currency System]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - country_code
 *               - country_name
 *               - currency_id
 *             properties:
 *               country_code:
 *                 type: string
 *               country_name:
 *                 type: string
 *               region:
 *                 type: string
 *               currency_id:
 *                 type: string
 *               is_default:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       201:
 *         description: Location-currency mapping added successfully
 */
router.post('/location-currencies', async (req, res) => {
  try {
    const { runQuery } = await import('../utils/database.js');
    const { 
      country_code, 
      country_name, 
      region, 
      currency_id, 
      is_default = false 
    } = req.body;
    
    if (!country_code || !country_name || !currency_id) {
      return res.status(400).json({
        success: false,
        error: { message: 'Country code, name, and currency ID are required', code: 'VALIDATION_ERROR' }
      });
    }
    
    const result = await runQuery(`
      INSERT INTO location_currencies (
        tenant_id, country_code, country_name, region, 
        currency_id, is_default
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      req.user.tenantId, 
      country_code.toUpperCase(), 
      country_name, 
      region, 
      currency_id, 
      is_default ? 1 : 0
    ]);
    
    res.status(201).json({
      success: true,
      data: { 
        id: result.lastID,
        message: 'Location-currency mapping added successfully'
      }
    });
  } catch (error) {
    console.error('Error adding location-currency mapping:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to add location-currency mapping', code: 'CREATE_ERROR' }
    });
  }
});

/**
 * @swagger
 * /api/currency-system/detect-currency:
 *   post:
 *     summary: Detect currency based on location
 *     tags: [Currency System]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               country_code:
 *                 type: string
 *               ip_address:
 *                 type: string
 *     responses:
 *       200:
 *         description: Detected currency information
 */
router.post('/detect-currency', async (req, res) => {
  try {
    const { getOneQuery } = await import('../utils/database.js');
    const { latitude, longitude, country_code, ip_address } = req.body;
    
    let detectedCurrency = null;
    let detectionMethod = 'default';
    
    // Try to detect by country code first
    if (country_code) {
      detectedCurrency = await getOneQuery(`
        SELECT c.*, lc.country_name, lc.region
        FROM currencies c
        JOIN location_currencies lc ON c.id = lc.currency_id
        WHERE lc.country_code = ? AND lc.tenant_id = ?
        ORDER BY lc.is_default DESC
        LIMIT 1
      `, [country_code.toUpperCase(), req.user.tenantId]);
      
      if (detectedCurrency) {
        detectionMethod = 'country_code';
      }
    }
    
    // If no currency found and we have coordinates, try reverse geocoding
    // (This would typically integrate with a geocoding service)
    if (!detectedCurrency && latitude && longitude) {
      // For now, we'll use a simple approach based on known regions
      // In production, you'd integrate with Google Maps, OpenStreetMap, etc.
      detectionMethod = 'coordinates';
    }
    
    // Fall back to tenant's base currency
    if (!detectedCurrency) {
      detectedCurrency = await getOneQuery(`
        SELECT * FROM currencies 
        WHERE tenant_id = ? AND is_base_currency = 1
        LIMIT 1
      `, [req.user.tenantId]);
      
      if (!detectedCurrency) {
        // If no base currency, get the first active currency
        detectedCurrency = await getOneQuery(`
          SELECT * FROM currencies 
          WHERE tenant_id = ? AND is_active = 1
          ORDER BY created_at ASC
          LIMIT 1
        `, [req.user.tenantId]);
      }
      
      detectionMethod = 'default';
    }
    
    if (!detectedCurrency) {
      return res.status(404).json({
        success: false,
        error: { message: 'No currency configuration found', code: 'NO_CURRENCY_FOUND' }
      });
    }
    
    res.json({
      success: true,
      data: {
        currency: detectedCurrency,
        detection_method: detectionMethod,
        location_info: {
          latitude,
          longitude,
          country_code,
          ip_address
        }
      }
    });
  } catch (error) {
    console.error('Error detecting currency:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to detect currency', code: 'DETECTION_ERROR' }
    });
  }
});

/**
 * @swagger
 * /api/currency-system/convert:
 *   post:
 *     summary: Convert amount between currencies
 *     tags: [Currency System]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - from_currency_id
 *               - to_currency_id
 *             properties:
 *               amount:
 *                 type: number
 *               from_currency_id:
 *                 type: string
 *               to_currency_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Converted amount
 */
router.post('/convert', async (req, res) => {
  try {
    const { getOneQuery } = await import('../utils/database.js');
    const { amount, from_currency_id, to_currency_id } = req.body;
    
    if (!amount || !from_currency_id || !to_currency_id) {
      return res.status(400).json({
        success: false,
        error: { message: 'Amount, from currency, and to currency are required', code: 'VALIDATION_ERROR' }
      });
    }
    
    // Get both currencies
    const fromCurrency = await getOneQuery(
      'SELECT * FROM currencies WHERE id = ? AND tenant_id = ?',
      [from_currency_id, req.user.tenantId]
    );
    
    const toCurrency = await getOneQuery(
      'SELECT * FROM currencies WHERE id = ? AND tenant_id = ?',
      [to_currency_id, req.user.tenantId]
    );
    
    if (!fromCurrency || !toCurrency) {
      return res.status(404).json({
        success: false,
        error: { message: 'One or both currencies not found', code: 'CURRENCY_NOT_FOUND' }
      });
    }
    
    // Convert via base currency
    // First convert from source to base currency, then from base to target
    let convertedAmount;
    
    if (fromCurrency.is_base_currency) {
      // From base currency to target
      convertedAmount = amount * toCurrency.exchange_rate;
    } else if (toCurrency.is_base_currency) {
      // From source to base currency
      convertedAmount = amount / fromCurrency.exchange_rate;
    } else {
      // From source to base, then base to target
      const baseAmount = amount / fromCurrency.exchange_rate;
      convertedAmount = baseAmount * toCurrency.exchange_rate;
    }
    
    // Round to appropriate decimal places
    convertedAmount = Math.round(convertedAmount * Math.pow(10, toCurrency.decimal_places)) / Math.pow(10, toCurrency.decimal_places);
    
    res.json({
      success: true,
      data: {
        original_amount: amount,
        converted_amount: convertedAmount,
        from_currency: {
          id: fromCurrency.id,
          code: fromCurrency.code,
          symbol: fromCurrency.symbol,
          exchange_rate: fromCurrency.exchange_rate
        },
        to_currency: {
          id: toCurrency.id,
          code: toCurrency.code,
          symbol: toCurrency.symbol,
          exchange_rate: toCurrency.exchange_rate
        },
        conversion_rate: fromCurrency.is_base_currency ? toCurrency.exchange_rate : 
                        toCurrency.is_base_currency ? (1 / fromCurrency.exchange_rate) :
                        (toCurrency.exchange_rate / fromCurrency.exchange_rate),
        converted_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error converting currency:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to convert currency', code: 'CONVERSION_ERROR' }
    });
  }
});

/**
 * @swagger
 * /api/currency-system/dashboard:
 *   get:
 *     summary: Get currency system dashboard data
 *     tags: [Currency System]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data
 */
router.get('/dashboard', async (req, res) => {
  try {
    const { getQuery, getOneQuery } = await import('../utils/database.js');
    
    // Get currency statistics
    const currencyStats = await getOneQuery(`
      SELECT 
        COUNT(*) as total_currencies,
        COUNT(CASE WHEN is_active = 1 THEN 1 END) as active_currencies,
        COUNT(CASE WHEN is_base_currency = 1 THEN 1 END) as base_currencies
      FROM currencies
      WHERE tenant_id = ?
    `, [req.user.tenantId]);
    
    // Get location mappings
    const locationStats = await getOneQuery(`
      SELECT 
        COUNT(*) as total_locations,
        COUNT(DISTINCT currency_id) as currencies_in_use,
        COUNT(CASE WHEN is_default = 1 THEN 1 END) as default_locations
      FROM location_currencies
      WHERE tenant_id = ?
    `, [req.user.tenantId]);
    
    // Get active currencies
    const activeCurrencies = await getQuery(`
      SELECT c.*, 
             COUNT(lc.id) as location_count,
             c.last_rate_update
      FROM currencies c
      LEFT JOIN location_currencies lc ON c.id = lc.currency_id
      WHERE c.tenant_id = ? AND c.is_active = 1
      GROUP BY c.id
      ORDER BY c.is_base_currency DESC, c.name ASC
    `, [req.user.tenantId]);
    
    // Get recent exchange rate updates
    const recentRateUpdates = await getQuery(`
      SELECT erh.*, c.code as currency_code, c.name as currency_name,
             u.first_name || ' ' || u.last_name as updated_by_name
      FROM exchange_rate_history erh
      JOIN currencies c ON erh.currency_id = c.id
      LEFT JOIN users u ON erh.updated_by = u.id
      WHERE erh.tenant_id = ?
      ORDER BY erh.updated_at DESC
      LIMIT 10
    `, [req.user.tenantId]);
    
    res.json({
      success: true,
      data: {
        currencyStats,
        locationStats,
        activeCurrencies,
        recentRateUpdates
      }
    });
  } catch (error) {
    console.error('Error fetching currency system dashboard:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch dashboard data', code: 'FETCH_ERROR' }
    });
  }
});

module.exports = router;