const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');

// Board Management
router.get('/boards', async (req, res) => {
  try {
    const boards = req.db.prepare(`SELECT * FROM boards WHERE tenant_id = ? ORDER BY name`).all(req.user.tenantId);
    res.json({ success: true, boards });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/boards', async (req, res) => {
  try {
    const { name, type, width, height, commissionRate, installCost } = req.body;
    const result = req.db.prepare(`INSERT INTO boards (tenant_id, name, type, width, height, commission_rate, install_cost) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(req.user.tenantId, name, type, width, height, commissionRate, installCost);
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/boards/:id', async (req, res) => {
  try {
    const { name, type, width, height, commissionRate, installCost } = req.body;
    req.db.prepare(`UPDATE boards SET name = ?, type = ?, width = ?, height = ?, commission_rate = ?, install_cost = ? WHERE id = ? AND tenant_id = ?`).run(name, type, width, height, commissionRate, installCost, req.params.id, req.user.tenantId);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/boards/:id', async (req, res) => {
  try {
    req.db.prepare(`DELETE FROM boards WHERE id = ? AND tenant_id = ?`).run(req.params.id, req.user.tenantId);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Campaign Management
router.get('/campaigns', async (req, res) => {
  try {
    const campaigns = req.db.prepare(`SELECT * FROM campaigns WHERE tenant_id = ? ORDER BY start_date DESC`).all(req.user.tenantId);
    res.json({ success: true, campaigns });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/campaigns', async (req, res) => {
  try {
    const { name, startDate, endDate, budget, status, target } = req.body;
    const result = req.db.prepare(`INSERT INTO campaigns (tenant_id, name, start_date, end_date, budget, status, target) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(req.user.tenantId, name, startDate, endDate, budget, status, target);
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/campaigns/:id', async (req, res) => {
  try {
    const { name, startDate, endDate, budget, status, target } = req.body;
    req.db.prepare(`UPDATE campaigns SET name = ?, start_date = ?, end_date = ?, budget = ?, status = ?, target = ? WHERE id = ? AND tenant_id = ?`).run(name, startDate, endDate, budget, status, target, req.params.id, req.user.tenantId);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/campaigns/:id', async (req, res) => {
  try {
    req.db.prepare(`DELETE FROM campaigns WHERE id = ? AND tenant_id = ?`).run(req.params.id, req.user.tenantId);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POS Material Library
router.get('/pos-library', async (req, res) => {
  try {
    const materials = req.db.prepare(`SELECT * FROM pos_materials_library WHERE tenant_id = ? ORDER BY name`).all(req.user.tenantId);
    res.json({ success: true, materials });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/pos-library', async (req, res) => {
  try {
    const { name, type, brand, stockQty, cost, supplier } = req.body;
    const result = req.db.prepare(`INSERT INTO pos_materials_library (tenant_id, name, type, brand, stock_qty, cost, supplier) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(req.user.tenantId, name, type, brand, stockQty, cost, supplier);
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/pos-library/:id', async (req, res) => {
  try {
    const { name, type, brand, stockQty, cost, supplier } = req.body;
    req.db.prepare(`UPDATE pos_materials_library SET name = ?, type = ?, brand = ?, stock_qty = ?, cost = ?, supplier = ? WHERE id = ? AND tenant_id = ?`).run(name, type, brand, stockQty, cost, supplier, req.params.id, req.user.tenantId);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/pos-library/:id', async (req, res) => {
  try {
    req.db.prepare(`DELETE FROM pos_materials_library WHERE id = ? AND tenant_id = ?`).run(req.params.id, req.user.tenantId);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Commission Rules
router.get('/commission-rules', async (req, res) => {
  try {
    const rules = req.db.prepare(`SELECT * FROM commission_rules WHERE tenant_id = ? ORDER BY board_type, min_qty`).all(req.user.tenantId);
    res.json({ success: true, rules });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/commission-rules', async (req, res) => {
  try {
    const { name, boardType, minQty, maxQty, rate, bonusRate } = req.body;
    const result = req.db.prepare(`INSERT INTO commission_rules (tenant_id, name, board_type, min_qty, max_qty, rate, bonus_rate) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(req.user.tenantId, name, boardType, minQty, maxQty, rate, bonusRate);
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/commission-rules/:id', async (req, res) => {
  try {
    req.db.prepare(`DELETE FROM commission_rules WHERE id = ? AND tenant_id = ?`).run(req.params.id, req.user.tenantId);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Territory Management
router.get('/territories', async (req, res) => {
  try {
    const territories = req.db.prepare(`SELECT * FROM territories WHERE tenant_id = ? ORDER BY name`).all(req.user.tenantId);
    res.json({ success: true, territories });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/territories', async (req, res) => {
  try {
    const { name, region, area, agents, coordinates } = req.body;
    const result = req.db.prepare(`INSERT INTO territories (tenant_id, name, region, area, agents, coordinates) VALUES (?, ?, ?, ?, ?, ?)`).run(req.user.tenantId, name, region, area, agents, coordinates);
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/territories/:id', async (req, res) => {
  try {
    const { name, region, area, agents, coordinates } = req.body;
    req.db.prepare(`UPDATE territories SET name = ?, region = ?, area = ?, agents = ?, coordinates = ? WHERE id = ? AND tenant_id = ?`).run(name, region, area, agents, coordinates, req.params.id, req.user.tenantId);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/territories/:id', async (req, res) => {
  try {
    req.db.prepare(`DELETE FROM territories WHERE id = ? AND tenant_id = ?`).run(req.params.id, req.user.tenantId);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/admin/stats - Admin overview statistics
router.get('/stats', asyncHandler(async (req, res) => {
  const tenantId = req.user.tenantId;
  const { getOneQuery } = require('../utils/database');
  
  const [userStats, activityStats, systemHealth] = await Promise.all([
    getOneQuery(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_users,
        COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_count,
        COUNT(CASE WHEN role = 'sales_rep' THEN 1 END) as sales_rep_count
      FROM users WHERE tenant_id = ?
    `, [tenantId]),
    
    getOneQuery(`
      SELECT 
        COUNT(DISTINCT DATE(created_at)) as active_days,
        COUNT(*) as total_activities
      FROM audit_logs
      WHERE tenant_id = ? AND created_at >= DATE('now', '-30 days')
    `, [tenantId]),
    
    getOneQuery(`
      SELECT 
        (SELECT COUNT(*) FROM customers WHERE tenant_id = ?) as total_customers,
        (SELECT COUNT(*) FROM products WHERE tenant_id = ?) as total_products,
        (SELECT COUNT(*) FROM orders WHERE tenant_id = ?) as total_orders
    `, [tenantId, tenantId, tenantId])
  ]);

  res.json({
    success: true,
    data: {
      users: userStats,
      activity: activityStats,
      system: systemHealth
    }
  });
}));

module.exports = router;
