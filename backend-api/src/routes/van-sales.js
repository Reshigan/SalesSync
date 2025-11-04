const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { getQuery, getOneQuery, runQuery } = require('../utils/database');

// Get all van sales
router.get('/', asyncHandler(async (req, res) => {
  const tenantId = req.tenantId;
  
  const vanSales = await getQuery(`
    SELECT 
      id,
      sale_number,
      van_id,
      agent_id,
      customer_id,
      sale_date,
      sale_type,
      subtotal,
      tax_amount,
      discount_amount,
      total_amount,
      amount_paid,
      amount_due,
      payment_method,
      status,
      created_at
    FROM van_sales 
    WHERE tenant_id = ?
    ORDER BY created_at DESC
  `, [tenantId]);

  res.json({
    success: true,
    data: vanSales || []
  });
}));

// Create new van sale
router.post('/', asyncHandler(async (req, res) => {
  const {
    van_id,
    agent_id,
    customer_id,
    sale_date,
    sale_type,
    subtotal,
    tax_amount,
    discount_amount,
    total_amount,
    amount_paid,
    amount_due,
    payment_method,
    payment_reference,
    location_lat,
    location_lng,
    notes,
    items
  } = req.body;

  const vanSaleId = require('crypto').randomUUID();
  const saleNumber = `VS-${Date.now()}`;
  
  const result = await runQuery(
    `INSERT INTO van_sales (
      id, tenant_id, sale_number, van_id, agent_id, customer_id, sale_date,
      sale_type, subtotal, tax_amount, discount_amount, total_amount, 
      amount_paid, amount_due, payment_method, payment_reference,
      location_lat, location_lng, notes, status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      vanSaleId,
      req.tenantId,
      saleNumber,
      van_id,
      agent_id,
      customer_id,
      sale_date || new Date().toISOString().split('T')[0],
      sale_type || 'cash',
      subtotal || 0,
      tax_amount || 0,
      discount_amount || 0,
      total_amount || 0,
      amount_paid || 0,
      amount_due || 0,
      payment_method,
      payment_reference,
      location_lat,
      location_lng,
      notes,
      'completed',
      new Date().toISOString()
    ]
  );

  res.status(201).json({
    success: true,
    data: {
      id: vanSaleId,
      sale_number: saleNumber,
      van_id,
      agent_id,
      customer_id,
      total_amount: total_amount || 0,
      status: 'completed'
    }
  });
}));

// Get van routes (MUST come before /:id to avoid route shadowing)
router.get('/routes', asyncHandler(async (req, res) => {
  const tenantId = req.tenantId;
  
  const routes = await getQuery(`
    SELECT 
      vr.id,
      vr.route_name,
      vr.van_id,
      vr.agent_id,
      vr.route_date,
      vr.start_time,
      vr.end_time,
      vr.status,
      vr.distance_km,
      vr.stops_planned,
      vr.stops_completed,
      v.registration_number as van_registration,
      v.driver_name
    FROM van_routes vr
    LEFT JOIN vans v ON vr.van_id = v.id
    WHERE v.tenant_id = ?
    ORDER BY vr.route_date DESC, vr.start_time DESC
  `, [tenantId]);

  res.json({
    success: true,
    data: routes || []
  });
}));

// Get van inventory by van ID
router.get('/vans/:vanId/inventory', asyncHandler(async (req, res) => {
  const { vanId } = req.params;
  const tenantId = req.tenantId;
  
  const inventory = await getQuery(`
    SELECT 
      vi.id,
      vi.van_id,
      vi.product_id,
      vi.quantity_loaded,
      vi.quantity_sold,
      vi.quantity_remaining,
      vi.last_updated,
      p.name as product_name,
      p.sku as product_sku,
      p.unit_price
    FROM van_inventory vi
    JOIN products p ON vi.product_id = p.id
    JOIN vans v ON vi.van_id = v.id
    WHERE vi.van_id = ? AND v.tenant_id = ?
    ORDER BY p.name
  `, [vanId, tenantId]);

  res.json({
    success: true,
    data: inventory || []
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
  const tenantId = req.user.tenantId;
  
  const [vanCounts, salesStats, routeStats, topVans] = await Promise.all([
    getOneQuery(`
      SELECT 
        COUNT(*) as total_vans,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_vans,
        COUNT(CASE WHEN status = 'on_route' THEN 1 END) as vans_on_route
      FROM vans WHERE tenant_id = ?
    `, [tenantId]),
    
    getOneQuery(`
      SELECT 
        COUNT(DISTINCT vs.id) as total_sales,
        SUM(vs.total_amount) as total_revenue,
        AVG(vs.total_amount) as avg_sale_value,
        COUNT(DISTINCT vs.customer_id) as customers_served
      FROM van_sales vs
      INNER JOIN vans v ON vs.van_id = v.id
      WHERE v.tenant_id = ?
    `, [tenantId]),
    
    getOneQuery(`
      SELECT 
        COUNT(DISTINCT r.id) as total_routes,
        AVG(r.distance_km) as avg_route_distance,
        COUNT(CASE WHEN r.status = 'completed' THEN 1 END) as completed_routes
      FROM van_routes r
      INNER JOIN vans v ON r.van_id = v.id
      WHERE v.tenant_id = ?
    `, [tenantId]),
    
    getQuery(`
      SELECT 
        v.id, v.registration_number, v.driver_name,
        COUNT(vs.id) as sale_count,
        SUM(vs.total_amount) as total_revenue
      FROM vans v
      LEFT JOIN van_sales vs ON v.id = vs.van_id
      WHERE v.tenant_id = ?
      GROUP BY v.id
      ORDER BY total_revenue DESC
      LIMIT 10
    `, [tenantId])
  ]);

  res.json({
    success: true,
    data: {
      vans: vanCounts,
      sales: {
        ...salesStats,
        total_revenue: parseFloat((salesStats.total_revenue || 0).toFixed(2)),
        avg_sale_value: parseFloat((salesStats.avg_sale_value || 0).toFixed(2))
      },
      routes: {
        ...routeStats,
        avg_route_distance: parseFloat((routeStats.avg_route_distance || 0).toFixed(2))
      },
      topVans
    }
  });
}));

// Get van sales by agent
router.get('/agent/:agentId', asyncHandler(async (req, res) => {
  const { agentId } = req.params;
  const tenantId = req.tenantId;
  
  const vanSales = await getQuery(`
    SELECT * FROM van_sales 
    WHERE agent_id = ? AND tenant_id = ?
    ORDER BY created_at DESC
  `, [agentId, tenantId]);

  res.json({
    success: true,
    data: vanSales || []
  });
}));

// Get van sale by ID (MUST come after specific routes to avoid shadowing)
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const tenantId = req.tenantId;
  
  const vanSale = await getOneQuery(`
    SELECT * FROM van_sales 
    WHERE id = ? AND tenant_id = ?
  `, [id, tenantId]);

  if (!vanSale) {
    return res.status(404).json({
      success: false,
      message: 'Van sale not found'
    });
  }

  res.json({
    success: true,
    data: vanSale
  });
}));

// Update van sale
router.put('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const tenantId = req.tenantId;
  const { van_id, agent_id, route_id, sale_date, total_amount, status } = req.body;
  
  const result = await runQuery(`
    UPDATE van_sales 
    SET van_id = ?, agent_id = ?, route_id = ?, sale_date = ?, 
        total_amount = ?, status = ?, updated_at = ?
    WHERE id = ? AND tenant_id = ?
  `, [van_id, agent_id, route_id, sale_date, total_amount, status, new Date().toISOString(), id, tenantId]);

  if (result.changes === 0) {
    return res.status(404).json({
      success: false,
      message: 'Van sale not found'
    });
  }

  res.json({
    success: true,
    message: 'Van sale updated successfully'
  });
}));

// Delete van sale
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const tenantId = req.tenantId;
  
  const result = await runQuery(`
    DELETE FROM van_sales 
    WHERE id = ? AND tenant_id = ?
  `, [id, tenantId]);

  if (result.changes === 0) {
    return res.status(404).json({
      success: false,
      message: 'Van sale not found'
    });
  }

  res.json({
    success: true,
    message: 'Van sale deleted successfully'
  });
}));

module.exports = router;
