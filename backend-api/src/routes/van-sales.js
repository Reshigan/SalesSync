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
    WHERE vs.tenant_id = $1
  `;
  
  const params = [tenantId];
  let paramIndex = 2;
  
  if (start_date) {
    query += ` AND vs.sale_date >= $${paramIndex}`;
    params.push(start_date);
    paramIndex++;
  }
  
  if (end_date) {
    query += ` AND vs.sale_date <= $${paramIndex}`;
    params.push(end_date);
    paramIndex++;
  }
  
  if (van_id) {
    query += ` AND vs.van_id = $${paramIndex}`;
    params.push(van_id);
    paramIndex++;
  }
  
  if (agent_id) {
    query += ` AND vs.agent_id = $${paramIndex}`;
    params.push(agent_id);
    paramIndex++;
  }
  
  if (status) {
    query += ` AND vs.status = $${paramIndex}`;
    params.push(status);
    paramIndex++;
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
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20) RETURNING id`,
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

  const saleId = saleResult.rows?.[0]?.id || saleResult.lastID;

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
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
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
    WHERE tenant_id = $1
  `, [tenantId]);
  
  // Get sales statistics
  let salesQuery = `
    SELECT 
      COUNT(*) as total_sales,
      COALESCE(SUM(total_amount), 0) as total_revenue,
      COALESCE(AVG(total_amount), 0) as avg_sale_value,
      COUNT(DISTINCT customer_id) as customers_served
    FROM van_sales
    WHERE tenant_id = $1
  `;
  
  const salesParams = [tenantId];
  let salesParamIndex = 2;
  
  if (start_date) {
    salesQuery += ` AND sale_date >= $${salesParamIndex}`;
    salesParams.push(start_date);
    salesParamIndex++;
  }
  
  if (end_date) {
    salesQuery += ` AND sale_date <= $${salesParamIndex}`;
    salesParams.push(end_date);
    salesParamIndex++;
  }
  
  const salesStats = await getOneQuery(salesQuery, salesParams);
  
  const topVansParams = [tenantId];
  let topVansParamIndex = 2;
  
  let dateConditions = '';
  if (start_date) {
    dateConditions += ` AND vs.sale_date >= $${topVansParamIndex}`;
    topVansParams.push(start_date);
    topVansParamIndex++;
  }
  
  if (end_date) {
    dateConditions += ` AND vs.sale_date <= $${topVansParamIndex}`;
    topVansParams.push(end_date);
    topVansParamIndex++;
  }
  
  const topVansQuery = `
    SELECT 
      v.id,
      v.registration_number,
      COUNT(vs.id) as total_sales,
      COALESCE(SUM(vs.total_amount), 0) as total_revenue
    FROM vans v
    LEFT JOIN van_sales vs ON v.id = vs.van_id AND vs.tenant_id = $1${dateConditions}
    WHERE v.tenant_id = $${topVansParamIndex}
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
  const { start_date, end_date } = req.query;

  let dateFilter = '';
  const params = [tenantId];
  let paramIndex = 2;

  if (start_date) {
    dateFilter += ` AND vs.sale_date >= $${paramIndex}`;
    params.push(start_date);
    paramIndex++;
  }

  if (end_date) {
    dateFilter += ` AND vs.sale_date <= $${paramIndex}`;
    params.push(end_date);
    paramIndex++;
  }

  const topProductsQuery = `
    SELECT 
      p.id,
      p.name,
      p.sku,
      COUNT(DISTINCT vsi.id) as total_sales,
      SUM(vsi.quantity) as total_quantity,
      SUM(vsi.subtotal) as total_revenue
    FROM products p
    INNER JOIN van_sale_items vsi ON p.id = vsi.product_id
    INNER JOIN van_sales vs ON vsi.van_sale_id = vs.id
    WHERE vs.tenant_id = $1${dateFilter}
    GROUP BY p.id, p.name, p.sku
    ORDER BY total_revenue DESC
    LIMIT 10
  `;
  const topProducts = await getQuery(topProductsQuery, params);

  // Get sales by region
  const salesByRegionQuery = `
    SELECT 
      r.id,
      r.name as region_name,
      COUNT(DISTINCT vs.id) as total_sales,
      COALESCE(SUM(vs.total_amount), 0) as total_revenue,
      COUNT(DISTINCT vs.customer_id) as unique_customers
    FROM regions r
    LEFT JOIN routes rt ON r.id = rt.region_id
    LEFT JOIN vans v ON rt.id = v.route_id
    LEFT JOIN van_sales vs ON v.id = vs.van_id AND vs.tenant_id = $1${dateFilter}
    WHERE r.tenant_id = $1
    GROUP BY r.id, r.name
    ORDER BY total_revenue DESC
  `;
  const salesByRegion = await getQuery(salesByRegionQuery, params);

  const revenueTrendsQuery = `
    SELECT 
      DATE(vs.sale_date) as date,
      COUNT(vs.id) as sales_count,
      SUM(vs.total_amount) as revenue,
      AVG(vs.total_amount) as avg_order_value
    FROM van_sales vs
    WHERE vs.tenant_id = $1${dateFilter}
    GROUP BY DATE(vs.sale_date)
    ORDER BY date DESC
    LIMIT 30
  `;
  const revenueTrends = await getQuery(revenueTrendsQuery, params);

  res.json({
    success: true,
    data: {
      top_products: topProducts || [],
      top_vans: [],
      sales_by_region: salesByRegion || [],
      revenue_trend: revenueTrends || []
    }
  });
}));

// GET /api/van-sales/trends - Van sales trends
router.get('/trends', asyncHandler(async (req, res) => {
  const tenantId = req.tenantId;
  const { period = 'daily', start_date, end_date } = req.query;

  let dateFilter = '';
  const params = [tenantId];
  let paramIndex = 2;

  if (start_date) {
    dateFilter += ` AND vs.sale_date >= $${paramIndex}`;
    params.push(start_date);
    paramIndex++;
  }

  if (end_date) {
    dateFilter += ` AND vs.sale_date <= $${paramIndex}`;
    params.push(end_date);
    paramIndex++;
  }

  let trendsQuery;
  
  if (period === 'daily') {
    trendsQuery = `
      SELECT 
        DATE(vs.sale_date) as period,
        COUNT(vs.id) as sales_count,
        SUM(vs.total_amount) as total_revenue,
        AVG(vs.total_amount) as avg_order_value,
        COUNT(DISTINCT vs.customer_id) as unique_customers,
        COUNT(DISTINCT vs.van_id) as active_vans
      FROM van_sales vs
      WHERE vs.tenant_id = $1${dateFilter}
      GROUP BY DATE(vs.sale_date)
      ORDER BY period DESC
      LIMIT 30
    `;
  } else if (period === 'weekly') {
    trendsQuery = `
      SELECT 
        DATE_TRUNC('week', vs.sale_date) as period,
        COUNT(vs.id) as sales_count,
        SUM(vs.total_amount) as total_revenue,
        AVG(vs.total_amount) as avg_order_value,
        COUNT(DISTINCT vs.customer_id) as unique_customers,
        COUNT(DISTINCT vs.van_id) as active_vans
      FROM van_sales vs
      WHERE vs.tenant_id = $1${dateFilter}
      GROUP BY DATE_TRUNC('week', vs.sale_date)
      ORDER BY period DESC
      LIMIT 12
    `;
  } else if (period === 'monthly') {
    trendsQuery = `
      SELECT 
        DATE_TRUNC('month', vs.sale_date) as period,
        COUNT(vs.id) as sales_count,
        SUM(vs.total_amount) as total_revenue,
        AVG(vs.total_amount) as avg_order_value,
        COUNT(DISTINCT vs.customer_id) as unique_customers,
        COUNT(DISTINCT vs.van_id) as active_vans
      FROM van_sales vs
      WHERE vs.tenant_id = $1${dateFilter}
      GROUP BY DATE_TRUNC('month', vs.sale_date)
      ORDER BY period DESC
      LIMIT 12
    `;
  }

  const trends = await getQuery(trendsQuery, params);

  res.json({
    success: true,
    data: trends || []
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
    WHERE vs.id = $1 AND vs.tenant_id = $2
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
    WHERE vsi.van_sale_id = $1
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
