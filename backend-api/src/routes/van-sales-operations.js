const express = require('express');
const { getQuery, getOneQuery, runQuery } = require('../utils/database');
const router = express.Router();

/**
 * Van Sales Operations API
 * Route management, van loading, delivery tracking, and sales recording
 */

// GET /api/van-sales-operations - Get module info
router.get('/', async (req, res) => {
  try {
    res.json({ 
      success: true, 
      message: 'Van Sales Operations module active',
      endpoints: {
        routes: '/routes',
        loading: '/loading',
        customerVisit: '/customer-visit',
        vanInventory: '/vans/:vanId/inventory'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/van-sales-operations/routes - Get all van sales routes
router.get('/routes', async (req, res) => {
  try {
    const { status, agent_id, date, van_id } = req.query;
    const tenantId = req.tenantId || 1;

    let sql = `SELECT vsr.*, u.first_name || ' ' || u.last_name as agent_name, v.plate_number FROM van_sales_routes vsr
      LEFT JOIN users u ON vsr.agent_id = u.id LEFT JOIN vans v ON vsr.van_id = v.id
      WHERE vsr.tenant_id = ?`;
    const params = [tenantId];

    if (status) { sql += ' AND vsr.status = ?'; params.push(status); }
    if (agent_id) { sql += ' AND vsr.agent_id = ?'; params.push(agent_id); }
    if (date) { sql += ' AND vsr.route_date = ?'; params.push(date); }
    if (van_id) { sql += ' AND vsr.van_id = ?'; params.push(van_id); }

    sql += ' ORDER BY vsr.route_date DESC, vsr.start_time DESC';

    const rows = await getQuery(sql, params);
    res.json({ success: true, data: rows || [] });
  } catch (error) {
    console.error('Error fetching routes:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch routes' });
  }
});

// POST /api/van-sales-operations/routes - Create new route
router.post('/routes', async (req, res) => {
  try {
    const { agent_id, van_id, route_date, route_name, customers, start_time } = req.body;
    const tenantId = req.tenantId || 1;
    const userId = req.userId || 1;

    if (!agent_id || !van_id || !route_date || !customers || customers.length === 0) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const routeNumber = `ROUTE-${Date.now()}`;
    const routeResult = await runQuery(
      `INSERT INTO van_sales_routes (tenant_id, route_number, agent_id, van_id, route_date, route_name, start_time, status, created_by, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, 'planned', ?, CURRENT_TIMESTAMP)`,
      [tenantId, routeNumber, agent_id, van_id, route_date, route_name, start_time, userId]
    );

    const routeId = routeResult.lastID || routeResult.rows?.[0]?.id;

    for (let idx = 0; idx < customers.length; idx++) {
      const customer = customers[idx];
      await runQuery(
        `INSERT INTO route_customers (route_id, customer_id, sequence, planned_arrival, notes) VALUES (?, ?, ?, ?, ?)`,
        [routeId, customer.customer_id, idx + 1, customer.planned_arrival, customer.notes]
      );
    }

    res.status(201).json({ success: true, data: { id: routeId, route_number: routeNumber } });
  } catch (error) {
    console.error('Error creating route:', error);
    res.status(500).json({ success: false, error: 'Failed to create route' });
  }
});

// POST /api/van-sales-operations/routes/:id/start - Start route
router.post('/routes/:id/start', async (req, res) => {
  try {
    const { id } = req.params;
    const { start_odometer } = req.body;
    const tenantId = req.tenantId || 1;

    const result = await runQuery(
      `UPDATE van_sales_routes SET status = 'in_progress', start_time = CURRENT_TIMESTAMP, start_odometer = ? WHERE id = ? AND tenant_id = ? AND status = 'planned'`,
      [start_odometer, id, tenantId]
    );

    if (result.changes === 0 && !result.rowCount) {
      return res.status(400).json({ success: false, error: 'Route not found or not in planned status' });
    }

    res.json({ success: true, message: 'Route started successfully' });
  } catch (error) {
    console.error('Error starting route:', error);
    res.status(500).json({ success: false, error: 'Failed to start route' });
  }
});

// POST /api/van-sales-operations/routes/:id/complete - Complete route
router.post('/routes/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;
    const { end_odometer, total_cash, total_orders } = req.body;
    const tenantId = req.tenantId || 1;

    const result = await runQuery(
      `UPDATE van_sales_routes SET status = 'completed', end_time = CURRENT_TIMESTAMP, end_odometer = ?, total_cash = ?, total_orders = ? WHERE id = ? AND tenant_id = ? AND status = 'in_progress'`,
      [end_odometer, total_cash, total_orders, id, tenantId]
    );

    if (result.changes === 0 && !result.rowCount) {
      return res.status(400).json({ success: false, error: 'Route not found or not in progress' });
    }

    res.json({ success: true, message: 'Route completed successfully' });
  } catch (error) {
    console.error('Error completing route:', error);
    res.status(500).json({ success: false, error: 'Failed to complete route' });
  }
});

// POST /api/van-sales-operations/loading - Create van loading record
router.post('/loading', async (req, res) => {
  try {
    const { route_id, van_id, warehouse_id, loading_date, items } = req.body;
    const tenantId = req.tenantId || 1;
    const userId = req.userId || 1;

    if ((!route_id && !van_id) || !warehouse_id || !items || items.length === 0) {
      return res.status(400).json({ success: false, error: 'Missing required fields (route_id or van_id, warehouse_id, items)' });
    }

    const loadNumber = `LOAD-${Date.now()}`;
    const loadResult = await runQuery(
      `INSERT INTO van_loadings (tenant_id, load_number, route_id, van_id, warehouse_id, loading_date, status, created_by, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, 'completed', ?, CURRENT_TIMESTAMP)`,
      [tenantId, loadNumber, route_id || null, van_id || null, warehouse_id, loading_date || new Date().toISOString().split('T')[0], userId]
    );

    const loadId = loadResult.lastID || loadResult.rows?.[0]?.id;

    for (const item of items) {
      await runQuery(
        `INSERT INTO van_loading_items (loading_id, product_id, quantity, created_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
        [loadId, item.product_id, item.quantity]
      );

      // Update van inventory - add stock to van
      if (van_id) {
        const existingStock = await getOneQuery(
          `SELECT id, quantity FROM van_inventory WHERE van_id = ? AND product_id = ? AND tenant_id = ?`,
          [van_id, item.product_id, tenantId]
        );

        if (existingStock) {
          await runQuery(
            `UPDATE van_inventory SET quantity = quantity + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            [item.quantity, existingStock.id]
          );
        } else {
          await runQuery(
            `INSERT INTO van_inventory (tenant_id, van_id, product_id, quantity, created_at, updated_at) 
             VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
            [tenantId, van_id, item.product_id, item.quantity]
          );
        }

        // Deduct from warehouse inventory
        await runQuery(
          `UPDATE inventory_stock SET quantity_on_hand = quantity_on_hand - ?, updated_at = CURRENT_TIMESTAMP 
           WHERE warehouse_id = ? AND product_id = ? AND tenant_id = ?`,
          [item.quantity, warehouse_id, item.product_id, tenantId]
        );
      }
    }

    res.status(201).json({ success: true, data: { id: loadId, load_number: loadNumber } });
  } catch (error) {
    console.error('Error creating loading record:', error);
    res.status(500).json({ success: false, error: 'Failed to create loading record' });
  }
});

// GET /api/van-sales-operations/vans/:vanId/inventory - Get van inventory
router.get('/vans/:vanId/inventory', async (req, res) => {
  try {
    const { vanId } = req.params;
    const tenantId = req.tenantId || 1;

    const inventory = await getQuery(`
      SELECT 
        vi.id,
        vi.van_id,
        vi.product_id,
        vi.quantity,
        vi.reserved_quantity,
        vi.updated_at,
        p.name as product_name,
        p.code as product_sku,
        p.price as unit_price,
        c.name as category_name
      FROM van_inventory vi
      LEFT JOIN products p ON vi.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE vi.van_id = ? AND vi.tenant_id = ?
      ORDER BY p.name
    `, [vanId, tenantId]);

    res.json({ success: true, data: inventory || [] });
  } catch (error) {
    console.error('Error fetching van inventory:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch van inventory' });
  }
});

// POST /api/van-sales-operations/vans/:vanId/unload - Unload items from van back to warehouse
router.post('/vans/:vanId/unload', async (req, res) => {
  try {
    const { vanId } = req.params;
    const { warehouse_id, items, reason } = req.body;
    const tenantId = req.tenantId || 1;
    const userId = req.userId || 1;

    if (!warehouse_id || !items || items.length === 0) {
      return res.status(400).json({ success: false, error: 'Missing required fields (warehouse_id, items)' });
    }

    const unloadNumber = `UNLOAD-${Date.now()}`;

    for (const item of items) {
      // Deduct from van inventory
      await runQuery(
        `UPDATE van_inventory SET quantity = quantity - ?, updated_at = CURRENT_TIMESTAMP 
         WHERE van_id = ? AND product_id = ? AND tenant_id = ? AND quantity >= ?`,
        [item.quantity, vanId, item.product_id, tenantId, item.quantity]
      );

      // Add back to warehouse inventory
      await runQuery(
        `UPDATE inventory_stock SET quantity_on_hand = quantity_on_hand + ?, updated_at = CURRENT_TIMESTAMP 
         WHERE warehouse_id = ? AND product_id = ? AND tenant_id = ?`,
        [item.quantity, warehouse_id, item.product_id, tenantId]
      );
    }

    res.json({ success: true, message: 'Van unloaded successfully', unload_number: unloadNumber });
  } catch (error) {
    console.error('Error unloading van:', error);
    res.status(500).json({ success: false, error: 'Failed to unload van' });
  }
});

// POST /api/van-sales-operations/customer-visit - Record customer visit
router.post('/customer-visit', async (req, res) => {
  try {
    const { route_id, customer_id, visit_time, order_created, order_amount, notes } = req.body;
    const tenantId = req.tenantId || 1;
    const userId = req.userId || 1;

    const result = await runQuery(
      `INSERT INTO route_visits (tenant_id, route_id, customer_id, visit_time, order_created, order_amount, notes, created_by, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [tenantId, route_id, customer_id, visit_time || new Date().toISOString(), order_created || false, order_amount || 0, notes, userId]
    );

    const visitId = result.lastID || result.rows?.[0]?.id;
    res.status(201).json({ success: true, data: { id: visitId } });
  } catch (error) {
    console.error('Error recording visit:', error);
    res.status(500).json({ success: false, error: 'Failed to record visit' });
  }
});

// GET /api/van-sales-operations/loadings - Get van loading history
router.get('/loadings', async (req, res) => {
  try {
    const { van_id, route_id, start_date, end_date } = req.query;
    const tenantId = req.tenantId || 1;

    let sql = `
      SELECT 
        vl.*,
        v.registration_number as van_registration,
        w.name as warehouse_name
      FROM van_loadings vl
      LEFT JOIN vans v ON vl.van_id = v.id
      LEFT JOIN warehouses w ON vl.warehouse_id = w.id
      WHERE vl.tenant_id = ?
    `;
    const params = [tenantId];

    if (van_id) { sql += ' AND vl.van_id = ?'; params.push(van_id); }
    if (route_id) { sql += ' AND vl.route_id = ?'; params.push(route_id); }
    if (start_date) { sql += ' AND vl.loading_date >= ?'; params.push(start_date); }
    if (end_date) { sql += ' AND vl.loading_date <= ?'; params.push(end_date); }

    sql += ' ORDER BY vl.created_at DESC';

    const loadings = await getQuery(sql, params);
    res.json({ success: true, data: loadings || [] });
  } catch (error) {
    console.error('Error fetching loadings:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch loadings' });
  }
});

// GET /api/van-sales-operations/loadings/:id - Get loading details with items
router.get('/loadings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId || 1;

    const loading = await getOneQuery(`
      SELECT 
        vl.*,
        v.registration_number as van_registration,
        w.name as warehouse_name
      FROM van_loadings vl
      LEFT JOIN vans v ON vl.van_id = v.id
      LEFT JOIN warehouses w ON vl.warehouse_id = w.id
      WHERE vl.id = ? AND vl.tenant_id = ?
    `, [id, tenantId]);

    if (!loading) {
      return res.status(404).json({ success: false, error: 'Loading not found' });
    }

    const items = await getQuery(`
      SELECT 
        vli.*,
        p.name as product_name,
        p.code as product_sku
      FROM van_loading_items vli
      LEFT JOIN products p ON vli.product_id = p.id
      WHERE vli.loading_id = ?
    `, [id]);

    loading.items = items || [];
    res.json({ success: true, data: loading });
  } catch (error) {
    console.error('Error fetching loading details:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch loading details' });
  }
});

module.exports = router;
