const express = require('express');
const router = express.Router();
const { authTenantMiddleware } = require('../middleware/authTenantMiddleware');

/**
 * @swagger
 * components:
 *   schemas:
 *     Van:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         registration_number:
 *           type: string
 *         model:
 *           type: string
 *         capacity_units:
 *           type: integer
 *         assigned_salesman_id:
 *           type: string
 *         status:
 *           type: string
 *           enum: [active, inactive, maintenance]
 *     VanLoad:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         van_id:
 *           type: string
 *         salesman_id:
 *           type: string
 *         load_date:
 *           type: string
 *           format: date
 *         stock_loaded:
 *           type: array
 *           items:
 *             type: object
 *         cash_float:
 *           type: number
 *         status:
 *           type: string
 *           enum: [loading, in_field, returning, reconciling, completed]
 */

// Apply authentication middleware to all routes
router.use(authTenantMiddleware);

/**
 * @swagger
 * /api/van-sales:
 *   get:
 *     summary: Get van sales module info
 *     tags: [Van Sales]
 *     responses:
 *       200:
 *         description: Van sales module info
 */
router.get('/', async (req, res) => {
  try {
    res.json({ 
      success: true, 
      message: 'Van Sales module active',
      endpoints: {
        vans: '/vans',
        loads: '/loads',
        dashboard: '/dashboard'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /api/van-sales/vans:
 *   get:
 *     summary: Get all vans for tenant
 *     tags: [Van Sales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by van status
 *       - in: query
 *         name: salesman_id
 *         schema:
 *           type: string
 *         description: Filter by assigned salesman
 *     responses:
 *       200:
 *         description: List of vans
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     vans:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Van'
 */
router.get('/vans', async (req, res) => {
  try {
    const { getQuery } = await import('../utils/database.js');
    const { status, salesman_id } = req.query;
    
    let query = `
      SELECT v.*, 
             u.first_name || ' ' || u.last_name as salesman_name,
             COUNT(vl.id) as total_loads,
             MAX(vl.load_date) as last_load_date
      FROM vans v
      LEFT JOIN users a ON v.assigned_salesman_id = a.id
      LEFT JOIN users u ON a.user_id = u.id
      LEFT JOIN van_loads vl ON v.id = vl.van_id
      WHERE v.tenant_id = ?
    `;
    
    const params = [req.user.tenantId];
    
    if (status) {
      query += ' AND v.status = ?';
      params.push(status);
    }
    
    if (salesman_id) {
      query += ' AND v.assigned_salesman_id = ?';
      params.push(salesman_id);
    }
    
    query += ' GROUP BY v.id ORDER BY v.registration_number';
    
    const vans = await getQuery(query, params);
    
    res.json({
      success: true,
      data: { vans }
    });
  } catch (error) {
    console.error('Error fetching vans:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch vans', code: 'FETCH_ERROR' }
    });
  }
});

/**
 * @swagger
 * /api/van-sales/vans:
 *   post:
 *     summary: Create a new van
 *     tags: [Van Sales]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - registration_number
 *               - model
 *               - capacity_units
 *             properties:
 *               registration_number:
 *                 type: string
 *               model:
 *                 type: string
 *               capacity_units:
 *                 type: integer
 *               assigned_salesman_id:
 *                 type: string
 *     responses:
 *       201:
 *         description: Van created successfully
 */
router.post('/vans', async (req, res) => {
  try {
    const { runQuery } = await import('../utils/database.js');
    const { registration_number, model, capacity_units, assigned_salesman_id } = req.body;
    
    if (!registration_number || !model || !capacity_units) {
      return res.status(400).json({
        success: false,
        error: { message: 'Missing required fields', code: 'VALIDATION_ERROR' }
      });
    }
    
    const result = await runQuery(`
      INSERT INTO vans (tenant_id, registration_number, model, capacity_units, assigned_salesman_id)
      VALUES (?, ?, ?, ?, ?)
    `, [req.user.tenantId, registration_number, model, capacity_units, assigned_salesman_id || null]);
    
    res.status(201).json({
      success: true,
      data: { 
        id: result.lastID,
        message: 'Van created successfully'
      }
    });
  } catch (error) {
    console.error('Error creating van:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to create van', code: 'CREATE_ERROR' }
    });
  }
});

/**
 * @swagger
 * /api/van-sales/loads:
 *   get:
 *     summary: Get van loads
 *     tags: [Van Sales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: van_id
 *         schema:
 *           type: string
 *         description: Filter by van ID
 *       - in: query
 *         name: salesman_id
 *         schema:
 *           type: string
 *         description: Filter by salesman ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by load status
 *       - in: query
 *         name: date_from
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter from date
 *       - in: query
 *         name: date_to
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter to date
 *     responses:
 *       200:
 *         description: List of van loads
 */
router.get('/loads', async (req, res) => {
  try {
    const { getQuery } = await import('../utils/database.js');
    const { van_id, salesman_id, status, date_from, date_to } = req.query;
    
    let query = `
      SELECT vl.*, 
             v.registration_number,
             u.first_name || ' ' || u.last_name as salesman_name,
             json_array_length(vl.stock_loaded) as items_loaded,
             json_array_length(vl.stock_sold) as items_sold
      FROM van_loads vl
      JOIN vans v ON vl.van_id = v.id
      JOIN users a ON vl.salesman_id = a.id
      JOIN users u ON a.user_id = u.id
      WHERE vl.tenant_id = ?
    `;
    
    const params = [req.user.tenantId];
    
    if (van_id) {
      query += ' AND vl.van_id = ?';
      params.push(van_id);
    }
    
    if (salesman_id) {
      query += ' AND vl.salesman_id = ?';
      params.push(salesman_id);
    }
    
    if (status) {
      query += ' AND vl.status = ?';
      params.push(status);
    }
    
    if (date_from) {
      query += ' AND vl.load_date >= ?';
      params.push(date_from);
    }
    
    if (date_to) {
      query += ' AND vl.load_date <= ?';
      params.push(date_to);
    }
    
    query += ' ORDER BY vl.load_date DESC, vl.created_at DESC';
    
    const loads = await getQuery(query, params);
    
    // Parse JSON fields
    loads.forEach(load => {
      if (load.stock_loaded) load.stock_loaded = JSON.parse(load.stock_loaded);
      if (load.stock_returned) load.stock_returned = JSON.parse(load.stock_returned);
      if (load.stock_sold) load.stock_sold = JSON.parse(load.stock_sold);
      if (load.stock_damaged) load.stock_damaged = JSON.parse(load.stock_damaged);
    });
    
    res.json({
      success: true,
      data: { loads }
    });
  } catch (error) {
    console.error('Error fetching van loads:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch van loads', code: 'FETCH_ERROR' }
    });
  }
});

/**
 * @swagger
 * /api/van-sales/loads:
 *   post:
 *     summary: Create a new van load
 *     tags: [Van Sales]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - van_id
 *               - salesman_id
 *               - load_date
 *               - stock_loaded
 *               - cash_float
 *             properties:
 *               van_id:
 *                 type: string
 *               salesman_id:
 *                 type: string
 *               load_date:
 *                 type: string
 *                 format: date
 *               stock_loaded:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     product_id:
 *                       type: string
 *                     quantity:
 *                       type: integer
 *                     batch_number:
 *                       type: string
 *               cash_float:
 *                 type: number
 *     responses:
 *       201:
 *         description: Van load created successfully
 */
router.post('/loads', async (req, res) => {
  try {
    const { runQuery } = await import('../utils/database.js');
    const { van_id, salesman_id, load_date, stock_loaded, cash_float } = req.body;
    
    if (!van_id || !salesman_id || !load_date || !stock_loaded || cash_float === undefined) {
      return res.status(400).json({
        success: false,
        error: { message: 'Missing required fields', code: 'VALIDATION_ERROR' }
      });
    }
    
    const result = await runQuery(`
      INSERT INTO van_loads (
        tenant_id, van_id, salesman_id, load_date, 
        stock_loaded, cash_float, status
      )
      VALUES (?, ?, ?, ?, ?, ?, 'loading')
    `, [
      req.user.tenantId, 
      van_id, 
      salesman_id, 
      load_date,
      JSON.stringify(stock_loaded),
      cash_float
    ]);
    
    res.status(201).json({
      success: true,
      data: { 
        id: result.lastID,
        message: 'Van load created successfully'
      }
    });
  } catch (error) {
    console.error('Error creating van load:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to create van load', code: 'CREATE_ERROR' }
    });
  }
});

/**
 * @swagger
 * /api/van-sales/loads/{id}/reconcile:
 *   put:
 *     summary: Reconcile van load
 *     tags: [Van Sales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Van load ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               stock_returned:
 *                 type: array
 *               stock_sold:
 *                 type: array
 *               stock_damaged:
 *                 type: array
 *               cash_collected:
 *                 type: number
 *               end_odometer:
 *                 type: integer
 *               discrepancy_notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Van load reconciled successfully
 */
router.put('/loads/:id/reconcile', async (req, res) => {
  try {
    const { runQuery, getOneQuery } = await import('../utils/database.js');
    const { id } = req.params;
    const { 
      stock_returned, 
      stock_sold, 
      stock_damaged, 
      cash_collected, 
      end_odometer,
      discrepancy_notes 
    } = req.body;
    
    // Verify load exists and belongs to tenant
    const load = await getOneQuery(
      'SELECT * FROM van_loads WHERE id = ? AND tenant_id = ?',
      [id, req.user.tenantId]
    );
    
    if (!load) {
      return res.status(404).json({
        success: false,
        error: { message: 'Van load not found', code: 'NOT_FOUND' }
      });
    }
    
    // Calculate reconciliation status
    let reconciliation_status = 'completed';
    if (discrepancy_notes && discrepancy_notes.trim()) {
      reconciliation_status = 'discrepancy';
    }
    
    await runQuery(`
      UPDATE van_loads 
      SET stock_returned = ?, 
          stock_sold = ?, 
          stock_damaged = ?,
          cash_collected = ?,
          end_odometer = ?,
          discrepancy_notes = ?,
          status = 'completed',
          reconciliation_status = ?,
          return_time = CURRENT_TIMESTAMP
      WHERE id = ? AND tenant_id = ?
    `, [
      JSON.stringify(stock_returned || []),
      JSON.stringify(stock_sold || []),
      JSON.stringify(stock_damaged || []),
      cash_collected || 0,
      end_odometer,
      discrepancy_notes,
      reconciliation_status,
      id,
      req.user.tenantId
    ]);
    
    res.json({
      success: true,
      data: { message: 'Van load reconciled successfully' }
    });
  } catch (error) {
    console.error('Error reconciling van load:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to reconcile van load', code: 'RECONCILE_ERROR' }
    });
  }
});

/**
 * @swagger
 * /api/van-sales/loads/{id}:
 *   get:
 *     summary: Get van load details
 *     tags: [Van Sales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Van load ID
 *     responses:
 *       200:
 *         description: Van load details
 */
router.get('/loads/:id', async (req, res) => {
  try {
    const { getOneQuery } = await import('../utils/database.js');
    const { id } = req.params;
    
    const load = await getOneQuery(`
      SELECT vl.*, 
             v.registration_number,
             v.model as van_model,
             u.first_name || ' ' || u.last_name as salesman_name,
             u.phone as salesman_phone
      FROM van_loads vl
      JOIN vans v ON vl.van_id = v.id
      JOIN users a ON vl.salesman_id = a.id
      JOIN users u ON a.user_id = u.id
      WHERE vl.id = ? AND vl.tenant_id = ?
    `, [id, req.user.tenantId]);
    
    if (!load) {
      return res.status(404).json({
        success: false,
        error: { message: 'Van load not found', code: 'NOT_FOUND' }
      });
    }
    
    // Parse JSON fields
    if (load.stock_loaded) load.stock_loaded = JSON.parse(load.stock_loaded);
    if (load.stock_returned) load.stock_returned = JSON.parse(load.stock_returned);
    if (load.stock_sold) load.stock_sold = JSON.parse(load.stock_sold);
    if (load.stock_damaged) load.stock_damaged = JSON.parse(load.stock_damaged);
    
    res.json({
      success: true,
      data: { load }
    });
  } catch (error) {
    console.error('Error fetching van load:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch van load', code: 'FETCH_ERROR' }
    });
  }
});

/**
 * @swagger
 * /api/van-sales/dashboard:
 *   get:
 *     summary: Get van sales dashboard data
 *     tags: [Van Sales]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data
 */
router.get('/dashboard', async (req, res) => {
  try {
    const { getQuery, getOneQuery } = await import('../utils/database.js');
    
    // Get summary statistics
    const stats = await getOneQuery(`
      SELECT 
        COUNT(DISTINCT v.id) as total_vans,
        COUNT(DISTINCT CASE WHEN v.status = 'active' THEN v.id END) as active_vans,
        COUNT(DISTINCT vl.id) as total_loads_today,
        COUNT(DISTINCT CASE WHEN vl.status = 'in_field' THEN vl.id END) as loads_in_field,
        COALESCE(SUM(vl.cash_collected), 0) as total_cash_collected_today
      FROM vans v
      LEFT JOIN van_loads vl ON v.id = vl.van_id AND vl.load_date::date = DATE('now')
      WHERE v.tenant_id = ?
    `, [req.user.tenantId]);
    
    // Get recent loads
    const recentLoads = await getQuery(`
      SELECT vl.id, vl.load_date, vl.status, vl.cash_collected,
             v.registration_number,
             u.first_name || ' ' || u.last_name as salesman_name
      FROM van_loads vl
      JOIN vans v ON vl.van_id = v.id
      JOIN users a ON vl.salesman_id = a.id
      JOIN users u ON a.user_id = u.id
      WHERE vl.tenant_id = ?
      ORDER BY vl.created_at DESC
      LIMIT 10
    `, [req.user.tenantId]);
    
    // Get loads by status
    const loadsByStatus = await getQuery(`
      SELECT status, COUNT(*) as count
      FROM van_loads
      WHERE tenant_id = ? AND load_date::date = DATE('now')
      GROUP BY status
    `, [req.user.tenantId]);
    
    res.json({
      success: true,
      data: {
        stats,
        recentLoads,
        loadsByStatus
      }
    });
  } catch (error) {
    console.error('Error fetching van sales dashboard:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch dashboard data', code: 'FETCH_ERROR' }
    });
  }
});

module.exports = router;