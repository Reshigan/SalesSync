const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { getQuery, getOneQuery, runQuery } = require('../utils/database');

// Board Management
router.get('/boards', asyncHandler(async (req, res) => {
  const boards = await getQuery(`SELECT * FROM boards WHERE tenant_id = $1 ORDER BY name`, [req.user.tenantId]);
  res.json({ success: true, boards: boards || [] });
}));

router.post('/boards', asyncHandler(async (req, res) => {
  const { name, type, width, height, commissionRate, installCost } = req.body;
  const result = await runQuery(`INSERT INTO boards (tenant_id, name, type, width, height, commission_rate, install_cost) VALUES ($1, $2, $3, $4, $5, $6, $7)`, [req.user.tenantId, name, type, width, height, commissionRate, installCost]);
  res.json({ success: true, id: result.lastID });
}));

router.put('/boards/:id', asyncHandler(async (req, res) => {
  const { name, type, width, height, commissionRate, installCost } = req.body;
  await runQuery(`UPDATE boards SET name = $1, type = $2, width = $3, height = $4, commission_rate = $5, install_cost = $6 WHERE id = $7 AND tenant_id = $8`, [name, type, width, height, commissionRate, installCost, req.params.id, req.user.tenantId]);
  res.json({ success: true });
}));

router.delete('/boards/:id', asyncHandler(async (req, res) => {
  await runQuery(`DELETE FROM boards WHERE id = $1 AND tenant_id = $2`, [req.params.id, req.user.tenantId]);
  res.json({ success: true });
}));

// Campaign Management
router.get('/campaigns', asyncHandler(async (req, res) => {
  const campaigns = await getQuery(`SELECT * FROM campaigns WHERE tenant_id = $1 ORDER BY start_date DESC`, [req.user.tenantId]);
  res.json({ success: true, campaigns: campaigns || [] });
}));

router.post('/campaigns', asyncHandler(async (req, res) => {
  const { name, startDate, endDate, budget, status, target } = req.body;
  const result = await runQuery(`INSERT INTO campaigns (tenant_id, name, start_date, end_date, budget, status, target) VALUES ($1, $2, $3, $4, $5, $6, $7)`, [req.user.tenantId, name, startDate, endDate, budget, status, target]);
  res.json({ success: true, id: result.lastID });
}));

router.put('/campaigns/:id', asyncHandler(async (req, res) => {
  const { name, startDate, endDate, budget, status, target } = req.body;
  await runQuery(`UPDATE campaigns SET name = $1, start_date = $2, end_date = $3, budget = $4, status = $5, target = $6 WHERE id = $7 AND tenant_id = $8`, [name, startDate, endDate, budget, status, target, req.params.id, req.user.tenantId]);
  res.json({ success: true });
}));

router.delete('/campaigns/:id', asyncHandler(async (req, res) => {
  await runQuery(`DELETE FROM campaigns WHERE id = $1 AND tenant_id = $2`, [req.params.id, req.user.tenantId]);
  res.json({ success: true });
}));

// POS Material Library
router.get('/pos-library', asyncHandler(async (req, res) => {
  const materials = await getQuery(`SELECT * FROM pos_materials_library WHERE tenant_id = $1 ORDER BY name`, [req.user.tenantId]);
  res.json({ success: true, materials: materials || [] });
}));

router.post('/pos-library', asyncHandler(async (req, res) => {
  const { name, type, brand, stockQty, cost, supplier } = req.body;
  const result = await runQuery(`INSERT INTO pos_materials_library (tenant_id, name, type, brand, stock_qty, cost, supplier) VALUES ($1, $2, $3, $4, $5, $6, $7)`, [req.user.tenantId, name, type, brand, stockQty, cost, supplier]);
  res.json({ success: true, id: result.lastID });
}));

router.put('/pos-library/:id', asyncHandler(async (req, res) => {
  const { name, type, brand, stockQty, cost, supplier } = req.body;
  await runQuery(`UPDATE pos_materials_library SET name = $1, type = $2, brand = $3, stock_qty = $4, cost = $5, supplier = $6 WHERE id = $7 AND tenant_id = $8`, [name, type, brand, stockQty, cost, supplier, req.params.id, req.user.tenantId]);
  res.json({ success: true });
}));

router.delete('/pos-library/:id', asyncHandler(async (req, res) => {
  await runQuery(`DELETE FROM pos_materials_library WHERE id = $1 AND tenant_id = $2`, [req.params.id, req.user.tenantId]);
  res.json({ success: true });
}));

// Commission Rules
router.get('/commission-rules', asyncHandler(async (req, res) => {
  const rules = await getQuery(`SELECT * FROM commission_rules WHERE tenant_id = $1 ORDER BY board_type, min_qty`, [req.user.tenantId]);
  res.json({ success: true, rules: rules || [] });
}));

router.post('/commission-rules', asyncHandler(async (req, res) => {
  const { name, boardType, minQty, maxQty, rate, bonusRate } = req.body;
  const result = await runQuery(`INSERT INTO commission_rules (tenant_id, name, board_type, min_qty, max_qty, rate, bonus_rate) VALUES ($1, $2, $3, $4, $5, $6, $7)`, [req.user.tenantId, name, boardType, minQty, maxQty, rate, bonusRate]);
  res.json({ success: true, id: result.lastID });
}));

router.delete('/commission-rules/:id', asyncHandler(async (req, res) => {
  await runQuery(`DELETE FROM commission_rules WHERE id = $1 AND tenant_id = $2`, [req.params.id, req.user.tenantId]);
  res.json({ success: true });
}));

// Territory Management
router.get('/territories', asyncHandler(async (req, res) => {
  const territories = await getQuery(`SELECT * FROM territories WHERE tenant_id = $1 ORDER BY name`, [req.user.tenantId]);
  res.json({ success: true, territories: territories || [] });
}));

router.post('/territories', asyncHandler(async (req, res) => {
  const { name, region, area, agents, coordinates } = req.body;
  const result = await runQuery(`INSERT INTO territories (tenant_id, name, region, area, agents, coordinates) VALUES ($1, $2, $3, $4, $5, $6)`, [req.user.tenantId, name, region, area, agents, coordinates]);
  res.json({ success: true, id: result.lastID });
}));

router.put('/territories/:id', asyncHandler(async (req, res) => {
  const { name, region, area, agents, coordinates } = req.body;
  await runQuery(`UPDATE territories SET name = $1, region = $2, area = $3, agents = $4, coordinates = $5 WHERE id = $6 AND tenant_id = $7`, [name, region, area, agents, coordinates, req.params.id, req.user.tenantId]);
  res.json({ success: true });
}));

router.delete('/territories/:id', asyncHandler(async (req, res) => {
  await runQuery(`DELETE FROM territories WHERE id = $1 AND tenant_id = $2`, [req.params.id, req.user.tenantId]);
  res.json({ success: true });
}));

// GET /api/admin/stats - Admin overview statistics
router.get('/stats', asyncHandler(async (req, res) => {
  const tenantId = req.user.tenantId;
  
  const [userStats, activityStats, systemHealth] = await Promise.all([
    getOneQuery(`
      SELECT 
        COUNT(*)::int as total_users,
        COUNT(CASE WHEN status = 'active' THEN 1 END)::int as active_users,
        COUNT(CASE WHEN role = 'admin' THEN 1 END)::int as admin_count,
        COUNT(CASE WHEN role = 'sales_rep' THEN 1 END)::int as sales_rep_count
      FROM users WHERE tenant_id = $1
    `, [tenantId]),
    
    getOneQuery(`
      SELECT 
        COUNT(DISTINCT created_at::date)::int as active_days,
        COUNT(*)::int as total_activities
      FROM audit_logs
      WHERE tenant_id = $1 AND created_at >= CURRENT_DATE - INTERVAL '30 days'
    `, [tenantId]),
    
    getOneQuery(`
      SELECT 
        (SELECT COUNT(*)::int FROM customers WHERE tenant_id = $1) as total_customers,
        (SELECT COUNT(*)::int FROM products WHERE tenant_id = $2) as total_products,
        (SELECT COUNT(*)::int FROM orders WHERE tenant_id = $3) as total_orders
    `, [tenantId, tenantId, tenantId])
  ]);

  res.json({
    success: true,
    data: {
      users: userStats || { total_users: 0, active_users: 0, admin_count: 0, sales_rep_count: 0 },
      activity: activityStats || { active_days: 0, total_activities: 0 },
      system: systemHealth || { total_customers: 0, total_products: 0, total_orders: 0 }
    }
  });
}));

module.exports = router;
