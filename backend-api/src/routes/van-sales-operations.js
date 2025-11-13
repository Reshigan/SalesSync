const express = require('express');
const { getQuery, getOneQuery, runQuery } = require('../utils/database');
const router = express.Router();
const getDatabase = () => require('../utils/database').getDatabase();

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
        customerVisit: '/customer-visit'
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
      WHERE vsr.tenant_id = $1`;
    const params = [tenantId];

    if (status) { sql += ' AND vsr.status = ?'; params.push(status); }
    if (agent_id) { sql += ' AND vsr.agent_id = ?'; params.push(agent_id); }
    if (date) { sql += ' AND vsr.route_date = ?'; params.push(date); }
    if (van_id) { sql += ' AND vsr.van_id = ?'; params.push(van_id); }

    sql += ' ORDER BY vsr.route_date DESC, vsr.start_time DESC';

    db.all(sql, params, (err, rows) => {
      if (err) return res.status(500).json({ error: 'Failed to fetch routes' });
      res.json({ success: true, data: rows || [] });
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/van-sales-operations/routes - Create new route
router.post('/routes', async (req, res) => {
  try {
    const { agent_id, van_id, route_date, route_name, customers, start_time } = req.body;
    const tenantId = req.tenantId || 1;
    const userId = req.userId || 1;

    if (!agent_id || !van_id || !route_date || !customers || customers.length === 0) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const routeNumber = `ROUTE-${Date.now()}`;
    db.run(`INSERT INTO van_sales_routes (tenant_id, route_number, agent_id, van_id, route_date, route_name, start_time, status, created_by, created_at) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'planned', $8, CURRENT_TIMESTAMP)`,
      [tenantId, routeNumber, agent_id, van_id, route_date, route_name, start_time, userId],
      function(err) {
        if (err) return res.status(500).json({ error: 'Failed to create route' });
        const routeId = this.lastID;

        let inserted = 0;
        customers.forEach((customer, idx) => {
          db.run(`INSERT INTO route_customers (route_id, customer_id, sequence, planned_arrival, notes) VALUES ($1, $2, $3, $4, $5)`,
            [routeId, customer.customer_id, idx + 1, customer.planned_arrival, customer.notes],
            () => { if (++inserted === customers.length) res.status(201).json({ success: true, data: { id: routeId, route_number: routeNumber } }); }
          );
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/van-sales-operations/routes/:id/start - Start route
router.post('/routes/:id/start', async (req, res) => {
  try {
    const { id } = req.params;
    const { start_odometer } = req.body;
    const tenantId = req.tenantId || 1;

    db.run(`UPDATE van_sales_routes SET status = 'in_progress', start_time = CURRENT_TIMESTAMP, start_odometer = $1 WHERE id = $2 AND tenant_id = $3 AND status = 'planned'`,
      [start_odometer, id, tenantId],
      function(err) {
        if (err || this.changes === 0) return res.status(500).json({ error: 'Failed to start route' });
        res.json({ success: true, message: 'Route started successfully' });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/van-sales-operations/routes/:id/complete - Complete route
router.post('/routes/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;
    const { end_odometer, total_cash, total_orders } = req.body;
    const tenantId = req.tenantId || 1;

    db.run(`UPDATE van_sales_routes SET status = 'completed', end_time = CURRENT_TIMESTAMP, end_odometer = $1, total_cash = $2, total_orders = $3 WHERE id = $4 AND tenant_id = $5 AND status = 'in_progress'`,
      [end_odometer, total_cash, total_orders, id, tenantId],
      function(err) {
        if (err || this.changes === 0) return res.status(500).json({ error: 'Failed to complete route' });
        res.json({ success: true, message: 'Route completed successfully' });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/van-sales-operations/loading - Create van loading record
router.post('/loading', async (req, res) => {
  try {
    const { route_id, warehouse_id, loading_date, items } = req.body;
    const tenantId = req.tenantId || 1;
    const userId = req.userId || 1;

    if (!route_id || !warehouse_id || !items || items.length === 0) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const loadNumber = `LOAD-${Date.now()}`;
    db.run(`INSERT INTO van_loadings (tenant_id, load_number, route_id, warehouse_id, loading_date, status, created_by, created_at) VALUES ($1, $2, $3, $4, $5, 'completed', $6, CURRENT_TIMESTAMP)`,
      [tenantId, loadNumber, route_id, warehouse_id, loading_date || new Date().toISOString().split('T')[0], userId],
      function(err) {
        if (err) return res.status(500).json({ error: 'Failed to create loading record' });
        const loadId = this.lastID;

        let inserted = 0;
        items.forEach(item => {
          db.run(`INSERT INTO van_loading_items (loading_id, product_id, quantity, created_at) VALUES ($1, $2, $3, CURRENT_TIMESTAMP)`,
            [loadId, item.product_id, item.quantity],
            function(err) { 
              if (err) console.error('Error inserting item:', err);
              if (++inserted === items.length) res.status(201).json({ success: true, data: { id: loadId, load_number: loadNumber } }); 
            }
          );
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/van-sales-operations/customer-visit - Record customer visit
router.post('/customer-visit', async (req, res) => {
  try {
    const { route_id, customer_id, visit_time, order_created, order_amount, notes } = req.body;
    const tenantId = req.tenantId || 1;
    const userId = req.userId || 1;

    db.run(`INSERT INTO route_visits (tenant_id, route_id, customer_id, visit_time, order_created, order_amount, notes, created_by, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)`,
      [tenantId, route_id, customer_id, visit_time || new Date().toISOString(), order_created || false, order_amount || 0, notes, userId],
      function(err) {
        if (err) return res.status(500).json({ error: 'Failed to record visit' });
        res.status(201).json({ success: true, data: { id: this.lastID } });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
