const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { getQuery, getOneQuery, runQuery } = require('../utils/database');

// Get all van sales
router.get('/', asyncHandler(async (req, res) => {
  const tenantId = req.tenantId;
  const { start_date, end_date, van_id, agent_id, status } = req.query;
  
  let query = `
    SELECT 
      vs.id,
      vs.sale_number,
      vs.van_id,
      vs.agent_id,
      vs.customer_id,
      vs.sale_date,
      vs.sale_type,
      vs.subtotal,
      vs.tax_amount,
      vs.discount_amount,
      vs.total_amount,
      vs.amount_paid,
      vs.amount_due,
      vs.payment_method,
      vs.status,
      vs.created_at,
      v.registration_number as van_registration,
      c.name as customer_name,
      u.first_name || ' ' || u.last_name as agent_name
    FROM van_sales vs
    LEFT JOIN vans v ON vs.van_id = v.id
    LEFT JOIN customers c ON vs.customer_id = c.id
    LEFT JOIN users u ON vs.agent_id = u.id
    WHERE vs.tenant_id = ?
  `;
  
  const params = [tenantId];
  
  if (start_date) {
    query += ` AND vs.sale_date >= ?`;
    params.push(start_date);
  }
  
  if (end_date) {
    query += ` AND vs.sale_date <= ?`;
    params.push(end_date);
  }
  
  if (van_id) {
    query += ` AND vs.van_id = ?`;
    params.push(van_id);
  }
  
  if (agent_id) {
    query += ` AND vs.agent_id = ?`;
    params.push(agent_id);
  }
  
  if (status) {
    query += ` AND vs.status = ?`;
    params.push(status);
  }
  
  query += ` ORDER BY vs.created_at DESC`;
  
  const vanSales = await getQuery(query, params);

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
    payment_method,
    payment_reference,
    location_lat,
    location_lng,
    notes,
    items
  } = req.body;

  if (!van_id || !agent_id || !items || items.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'van_id, agent_id, and items are required'
    });
  }

  // Calculate totals
  let subtotal = 0;
  let tax_amount = 0;
  let discount_amount = 0;
  
  items.forEach(item => {
    const itemSubtotal = item.quantity * item.unit_price;
    const itemDiscount = itemSubtotal * (item.discount_rate || 0) / 100;
    const itemTaxable = itemSubtotal - itemDiscount;
    const itemTax = itemTaxable * (item.tax_rate || 0) / 100;
    
    subtotal += itemSubtotal;
    discount_amount += itemDiscount;
    tax_amount += itemTax;
  });
  
  const total_amount = subtotal - discount_amount + tax_amount;
  const amount_paid = req.body.amount_paid || (sale_type === 'cash' ? total_amount : 0);
  const amount_due = total_amount - amount_paid;

  const saleNumber = `VS-${Date.now()}`;
  
  const saleResult = await runQuery(
    `INSERT INTO van_sales (
      tenant_id, sale_number, van_id, agent_id, customer_id, sale_date,
      sale_type, subtotal, tax_amount, discount_amount, total_amount, 
      amount_paid, amount_due, payment_method, payment_reference,
      location_lat, location_lng, notes, status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      req.tenantId,
      saleNumber,
      van_id,
      agent_id,
      customer_id || null,
      sale_date || new Date().toISOString().split('T')[0],
      sale_type || 'cash',
      subtotal,
      tax_amount,
      discount_amount,
      total_amount,
      amount_paid,
      amount_due,
      payment_method || (sale_type === 'cash' ? 'cash' : 'credit'),
      payment_reference || null,
      location_lat || null,
      location_lng || null,
      notes || null,
      'completed',
      new Date().toISOString()
    ]
  );

  const saleId = saleResult.lastID;

  for (const item of items) {
    const itemSubtotal = item.quantity * item.unit_price;
    const itemDiscount = itemSubtotal * (item.discount_rate || 0) / 100;
    const itemTaxable = itemSubtotal - itemDiscount;
    const itemTax = itemTaxable * (item.tax_rate || 0) / 100;
    const line_total = itemTaxable + itemTax;
    
    await runQuery(
      `INSERT INTO van_sale_items (
        van_sale_id, product_id, quantity, unit_price, 
        discount_rate, tax_rate, line_total
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        saleId,
        item.product_id,
        item.quantity,
        item.unit_price,
        item.discount_rate || 0,
        item.tax_rate || 0,
        line_total
      ]
    );
  }

  res.status(201).json({
    success: true,
    data: {
      id: saleId,
      sale_number: saleNumber,
      van_id,
      agent_id,
      customer_id,
      total_amount,
      amount_paid,
      amount_due,
      status: 'completed'
    }
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
  const { start_date, end_date } = req.query;
  
  // Get van statistics
  const vanStats = await getOneQuery(`
    SELECT 
      COUNT(*) as total_vans,
      SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_vans
    FROM vans
    WHERE tenant_id = ?
  `, [tenantId]);
  
  // Get sales statistics
  let salesQuery = `
    SELECT 
      COUNT(*) as total_sales,
      COALESCE(SUM(total_amount), 0) as total_revenue,
      COALESCE(AVG(total_amount), 0) as avg_sale_value,
      COUNT(DISTINCT customer_id) as customers_served
    FROM van_sales
    WHERE tenant_id = ?
  `;
  
  const salesParams = [tenantId];
  
  if (start_date) {
    salesQuery += ` AND sale_date >= ?`;
    salesParams.push(start_date);
  }
  
  if (end_date) {
    salesQuery += ` AND sale_date <= ?`;
    salesParams.push(end_date);
  }
  
  const salesStats = await getOneQuery(salesQuery, salesParams);
  
  let topVansQuery = `
    SELECT 
      v.id,
      v.registration_number,
      COUNT(vs.id) as total_sales,
      COALESCE(SUM(vs.total_amount), 0) as total_revenue
    FROM vans v
    LEFT JOIN van_sales vs ON v.id = vs.van_id AND vs.tenant_id = ?
  `;
  
  const topVansParams = [tenantId];
  
  if (start_date) {
    topVansQuery += ` AND vs.sale_date >= ?`;
    topVansParams.push(start_date);
  }
  
  if (end_date) {
    topVansQuery += ` AND vs.sale_date <= ?`;
    topVansParams.push(end_date);
  }
  
  topVansQuery += `
    WHERE v.tenant_id = ?
    GROUP BY v.id, v.registration_number
    ORDER BY total_revenue DESC
    LIMIT 5
  `;
  topVansParams.push(tenantId);
  
  const topVans = await getQuery(topVansQuery, topVansParams);
  
  res.json({
    success: true,
    data: {
      active_vans: vanStats?.active_vans || 0,
      total_vans: vanStats?.total_vans || 0,
      vans_on_route: 0,
      vans_idle: (vanStats?.total_vans || 0) - (vanStats?.active_vans || 0),
      total_sales: salesStats?.total_sales || 0,
      total_revenue: salesStats?.total_revenue || 0,
      avg_sale_value: salesStats?.avg_sale_value || 0,
      customers_served: salesStats?.customers_served || 0,
      total_routes: 0,
      active_routes: 0,
      completed_routes: 0,
      avg_route_distance: 0,
      vans: {
        total_vans: vanStats?.total_vans || 0,
        active_vans: vanStats?.active_vans || 0,
        vans_on_route: 0
      },
      sales: {
        total_sales: salesStats?.total_sales || 0,
        total_revenue: salesStats?.total_revenue || 0,
        avg_sale_value: salesStats?.avg_sale_value || 0,
        customers_served: salesStats?.customers_served || 0
      },
      routes: {
        total_routes: 0,
        avg_route_distance: 0,
        completed_routes: 0
      },
      topVans: topVans || []
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
  
  const vanSale = await getOneQuery(`
    SELECT 
      vs.*,
      v.registration_number as van_registration,
      c.name as customer_name,
      c.phone as customer_phone,
      u.first_name || ' ' || u.last_name as agent_name
    FROM van_sales vs
    LEFT JOIN vans v ON vs.van_id = v.id
    LEFT JOIN customers c ON vs.customer_id = c.id
    LEFT JOIN users u ON vs.agent_id = u.id
    WHERE vs.id = ? AND vs.tenant_id = ?
  `, [id, tenantId]);

  if (!vanSale) {
    return res.status(404).json({
      success: false,
      message: 'Van sale not found'
    });
  }
  
  const items = await getQuery(`
    SELECT 
      vsi.*,
      p.name as product_name,
      p.sku as product_sku
    FROM van_sale_items vsi
    LEFT JOIN products p ON vsi.product_id = p.id
    WHERE vsi.van_sale_id = ?
  `, [id]);
  
  vanSale.items = items || [];

  res.json({
    success: true,
    data: vanSale
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
