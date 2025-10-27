const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

/**
 * @swagger
 * components:
 *   schemas:
 *     Warehouse:
 *       type: object
 *       required:
 *         - name
 *         - address
 *         - capacity
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier for the warehouse
 *         name:
 *           type: string
 *           description: Warehouse name
 *         code:
 *           type: string
 *           description: Warehouse code
 *         address:
 *           type: string
 *           description: Warehouse address
 *         city:
 *           type: string
 *           description: City
 *         state:
 *           type: string
 *           description: State/Province
 *         postal_code:
 *           type: string
 *           description: Postal code
 *         country:
 *           type: string
 *           description: Country
 *         capacity:
 *           type: number
 *           description: Storage capacity
 *         current_stock:
 *           type: number
 *           description: Current stock level
 *         manager_id:
 *           type: string
 *           description: Manager user ID
 *         phone:
 *           type: string
 *           description: Contact phone
 *         email:
 *           type: string
 *           description: Contact email
 *         status:
 *           type: string
 *           enum: [active, inactive]
 *           description: Warehouse status
 */

/**
 * @swagger
 * /api/warehouses:
 *   get:
 *     summary: Get all warehouses
 *     tags: [Warehouses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of warehouses
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Warehouse'
 */
router.get('/', async (req, res, next) => {
  try {
    // Lazy-load database functions
    const { getQuery } = require('../database/init');
    
    const warehouses = await getQuery(
      'SELECT * FROM warehouses WHERE tenant_id = ? ORDER BY name',
      [req.tenantId]
    );
    
    res.json({
      success: true,
      data: warehouses
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/warehouses/{id}:
 *   get:
 *     summary: Get warehouse by ID
 *     tags: [Warehouses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Warehouse details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Warehouse'
 *       404:
 *         description: Warehouse not found
 */
router.get('/:id', async (req, res, next) => {
  try {
    // Lazy-load database functions
    const { getOneQuery } = require('../database/init');
    
    const warehouse = await getOneQuery(
      'SELECT * FROM warehouses WHERE id = ? AND tenant_id = ?',
      [req.params.id, req.tenantId]
    );
    
    if (!warehouse) {
      return res.status(404).json({ error: 'Warehouse not found' });
    }
    
    res.json(warehouse);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/warehouses:
 *   post:
 *     summary: Create new warehouse
 *     tags: [Warehouses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Warehouse'
 *     responses:
 *       201:
 *         description: Warehouse created successfully
 *       400:
 *         description: Invalid input
 */
router.post('/', async (req, res, next) => {
  try {
    // Lazy-load database functions
    const { runQuery } = require('../database/init');
    
    const {
      name,
      code,
      address,
      city,
      state,
      postal_code,
      country,
      capacity,
      manager_id,
      phone,
      email
    } = req.body;
    
    if (!name || !address || !capacity) {
      return res.status(400).json({ error: 'Name, address, and capacity are required' });
    }
    
    const warehouseId = uuidv4();
    
    await runQuery(
      `INSERT INTO warehouses (
        id, tenant_id, name, code, address, city, state, postal_code, country,
        capacity, current_stock, manager_id, phone, email, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      [
        warehouseId,
        req.tenantId,
        name,
        code || `WH-${Date.now()}`,
        address,
        city,
        state,
        postal_code,
        country,
        capacity,
        0, // current_stock
        manager_id,
        phone,
        email,
        'active'
      ]
    );
    
    res.status(201).json({ 
      message: 'Warehouse created successfully',
      id: warehouseId
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/warehouses/{id}:
 *   put:
 *     summary: Update warehouse
 *     tags: [Warehouses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Warehouse'
 *     responses:
 *       200:
 *         description: Warehouse updated successfully
 *       404:
 *         description: Warehouse not found
 */
router.put('/:id', async (req, res, next) => {
  try {
    // Lazy-load database functions
    const { runQuery, getOneQuery } = require('../database/init');
    
    const warehouse = await getOneQuery(
      'SELECT * FROM warehouses WHERE id = ? AND tenant_id = ?',
      [req.params.id, req.tenantId]
    );
    
    if (!warehouse) {
      return res.status(404).json({ error: 'Warehouse not found' });
    }
    
    const {
      name,
      code,
      address,
      city,
      state,
      postal_code,
      country,
      capacity,
      manager_id,
      phone,
      email,
      status
    } = req.body;
    
    await runQuery(
      `UPDATE warehouses SET 
        name = ?, code = ?, address = ?, city = ?, state = ?, postal_code = ?, country = ?,
        capacity = ?, manager_id = ?, phone = ?, email = ?, status = ?, updated_at = datetime('now')
      WHERE id = ? AND tenant_id = ?`,
      [
        name || warehouse.name,
        code || warehouse.code,
        address || warehouse.address,
        city || warehouse.city,
        state || warehouse.state,
        postal_code || warehouse.postal_code,
        country || warehouse.country,
        capacity || warehouse.capacity,
        manager_id || warehouse.manager_id,
        phone || warehouse.phone,
        email || warehouse.email,
        status || warehouse.status,
        req.params.id,
        req.tenantId
      ]
    );
    
    res.json({ message: 'Warehouse updated successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/warehouses/{id}:
 *   delete:
 *     summary: Delete warehouse
 *     tags: [Warehouses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Warehouse deleted successfully
 *       404:
 *         description: Warehouse not found
 */
router.delete('/:id', async (req, res, next) => {
  try {
    // Lazy-load database functions
    const { runQuery, getOneQuery } = require('../database/init');
    
    const warehouse = await getOneQuery(
      'SELECT * FROM warehouses WHERE id = ? AND tenant_id = ?',
      [req.params.id, req.tenantId]
    );
    
    if (!warehouse) {
      return res.status(404).json({ error: 'Warehouse not found' });
    }
    
    await runQuery(
      'DELETE FROM warehouses WHERE id = ? AND tenant_id = ?',
      [req.params.id, req.tenantId]
    );
    
    res.json({ message: 'Warehouse deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// GET /api/warehouses/stats - Warehouse statistics
router.get('/stats', async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const db = getDatabase();
    
    const [warehouseCounts, inventoryStats, transferStats, capacityUtilization] = await Promise.all([
      new Promise((resolve, reject) => {
        db.get(`
          SELECT 
            COUNT(*) as total_warehouses,
            COUNT(CASE WHEN status = 'active' THEN 1 END) as active_warehouses,
            SUM(CASE WHEN capacity IS NOT NULL THEN capacity ELSE 0 END) as total_capacity
          FROM warehouses WHERE tenant_id = ?
        `, [tenantId], (err, row) => err ? reject(err) : resolve(row || {}));
      }),
      
      new Promise((resolve, reject) => {
        db.get(`
          SELECT 
            COUNT(DISTINCT i.product_id) as total_products,
            SUM(i.quantity_on_hand) as total_quantity,
            SUM(i.quantity_on_hand * i.cost_price) as total_value
          FROM inventory_stock i
          WHERE i.tenant_id = ?
        `, [tenantId], (err, row) => err ? reject(err) : resolve(row || {}));
      }),
      
      new Promise((resolve, reject) => {
        db.get(`
          SELECT 
            COUNT(*) as total_transfers,
            COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_transfers,
            COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_transfers,
            SUM(CASE WHEN status = 'completed' THEN quantity ELSE 0 END) as total_transferred_quantity
          FROM stock_transfers
          WHERE tenant_id = ?
        `, [tenantId], (err, row) => err ? reject(err) : resolve(row || {}));
      }),
      
      new Promise((resolve, reject) => {
        db.all(`
          SELECT 
            w.id, w.name, w.capacity,
            COUNT(DISTINCT i.product_id) as product_count,
            SUM(i.quantity_on_hand) as current_quantity,
            SUM(i.quantity_on_hand * i.cost_price) as inventory_value
          FROM warehouses w
          LEFT JOIN inventory_stock i ON w.id = i.warehouse_id
          WHERE w.tenant_id = ?
          GROUP BY w.id
          ORDER BY inventory_value DESC
        `, [tenantId], (err, rows) => err ? reject(err) : resolve(rows || []));
      })
    ]);
    
    res.json({
      success: true,
      data: {
        warehouses: warehouseCounts,
        inventory: {
          ...inventoryStats,
          total_value: parseFloat((inventoryStats.total_value || 0).toFixed(2))
        },
        transfers: transferStats,
        capacityUtilization: capacityUtilization.map(w => ({
          ...w,
          inventory_value: parseFloat((w.inventory_value || 0).toFixed(2)),
          utilization_percentage: w.capacity > 0 
            ? parseFloat(((w.current_quantity / w.capacity) * 100).toFixed(2))
            : null
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching warehouse stats:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch warehouse statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;