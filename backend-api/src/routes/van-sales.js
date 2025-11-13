const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { getQuery, getOneQuery, runQuery } = require('../utils/database');

// Get all van sales
router.get('/', asyncHandler(async (req, res) => {
  const tenantId = req.tenantId;
  
  res.json({
    success: true,
    data: []
  });
}));

// Create new van sale
router.post('/', asyncHandler(async (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Van Sales module not yet implemented. Tables need to be created in database.'
  });
}));

// Get van routes (MUST come before /:id to avoid route shadowing)
router.get('/routes', asyncHandler(async (req, res) => {
  const tenantId = req.tenantId;
  
  const routes = await getQuery(`
    SELECT 
      r.id,
      r.name,
      r.code,
      r.status,
      r.created_at,
      r.salesman_id as driver_id,
      u.first_name || ' ' || u.last_name as driver_name
    FROM routes r
    LEFT JOIN users u ON r.salesman_id = u.id
    WHERE r.tenant_id = $1
    ORDER BY r.created_at DESC
  `, [tenantId]);

  res.json({
    success: true,
    data: routes || []
  });
}));

// Get van inventory by van ID (MUST come before /:id to avoid route shadowing)
router.get('/vans/:vanId/inventory', asyncHandler(async (req, res) => {
  const { vanId } = req.params;
  const tenantId = req.tenantId;
  
  res.json({
    success: true,
    data: []
  });
}));

// Test endpoint
router.get('/test/health', asyncHandler(async (req, res) => {
  res.json({
    success: true,
    message: 'Van Sales API is working',
    timestamp: new Date().toISOString()
  });
}));

// GET /api/van-sales/stats - Van sales statistics
router.get('/stats', asyncHandler(async (req, res) => {
  const tenantId = req.tenantId;
  
  res.json({
    success: true,
    data: {
      active_vans: 0,
      total_vans: 0,
      vans_on_route: 0,
      vans_idle: 0,
      total_sales: 0,
      total_revenue: 0,
      avg_sale_value: 0,
      customers_served: 0,
      total_routes: 0,
      active_routes: 0,
      completed_routes: 0,
      avg_route_distance: 0,
      vans: {
        total_vans: 0,
        active_vans: 0,
        vans_on_route: 0
      },
      sales: {
        total_sales: 0,
        total_revenue: 0,
        avg_sale_value: 0,
        customers_served: 0
      },
      routes: {
        total_routes: 0,
        avg_route_distance: 0,
        completed_routes: 0
      },
      topVans: []
    }
  });
}));

// GET /api/van-sales/analytics - Van sales analytics
router.get('/analytics', asyncHandler(async (req, res) => {
  const tenantId = req.tenantId;
  
  res.json({
    success: true,
    data: {
      total_sales: 0,
      total_revenue: 0,
      avg_order_value: 0,
      total_orders: 0,
      total_customers: 0,
      top_products: [],
      top_vans: [],
      sales_by_region: [],
      revenue_trend: []
    }
  });
}));

// GET /api/van-sales/trends - Van sales trends
router.get('/trends', asyncHandler(async (req, res) => {
  const tenantId = req.tenantId;
  const { start_date, end_date } = req.query;
  
  res.json({
    success: true,
    data: {
      daily_sales: [],
      daily_revenue: [],
      weekly_summary: [],
      monthly_summary: []
    }
  });
}));

// Get van sales by agent
router.get('/agent/:agentId', asyncHandler(async (req, res) => {
  const { agentId } = req.params;
  const tenantId = req.tenantId;
  
  res.json({
    success: true,
    data: []
  });
}));

// Get van sale by ID (MUST come after specific routes to avoid shadowing)
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const tenantId = req.tenantId;
  
  return res.status(404).json({
    success: false,
    message: 'Van sale not found'
  });
}));

// Update van sale
router.put('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const tenantId = req.tenantId;
  
  return res.status(404).json({
    success: false,
    message: 'Van sale not found'
  });
}));

// Delete van sale
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const tenantId = req.tenantId;
  
  return res.status(404).json({
    success: false,
    message: 'Van sale not found'
  });
}));

module.exports = router;
