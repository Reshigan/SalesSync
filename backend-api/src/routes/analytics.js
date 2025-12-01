const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { getQuery, getOneQuery } = require('../utils/database');

router.get('/sales', asyncHandler(async (req, res) => {
  const tenantId = req.tenantId;
  const { start_date, end_date, period = 'daily' } = req.query;
  
  let dateFilter = '';
  const params = [tenantId];
  let paramIndex = 2;
  
  if (start_date) {
    dateFilter += ` AND o.order_date >= $${paramIndex}`;
    params.push(start_date);
    paramIndex++;
  }
  
  if (end_date) {
    dateFilter += ` AND o.order_date <= $${paramIndex}`;
    params.push(end_date);
    paramIndex++;
  }
  
  let groupBy = 'DATE(o.order_date)';
  let dateFormat = 'YYYY-MM-DD';
  if (period === 'weekly') {
    groupBy = 'DATE_TRUNC(\'week\', o.order_date)';
    dateFormat = 'YYYY-"W"IW';
  } else if (period === 'monthly') {
    groupBy = 'DATE_TRUNC(\'month\', o.order_date)';
    dateFormat = 'YYYY-MM';
  }
  
  const salesTrend = await getQuery(`
    SELECT 
      ${groupBy} as period,
      TO_CHAR(${groupBy}, '${dateFormat}') as period_label,
      COUNT(o.id) as order_count,
      COALESCE(SUM(o.total_amount), 0) as total_revenue,
      COALESCE(AVG(o.total_amount), 0) as avg_order_value,
      COUNT(DISTINCT o.customer_id) as unique_customers
    FROM orders o
    WHERE o.tenant_id = $1 AND o.order_status != $${paramIndex}${dateFilter}
    GROUP BY ${groupBy}
    ORDER BY period DESC
    LIMIT 30
  `, [...params, 'cancelled']);
  
  const summary = await getOneQuery(`
    SELECT 
      COUNT(o.id) as total_orders,
      COALESCE(SUM(o.total_amount), 0) as total_revenue,
      COALESCE(AVG(o.total_amount), 0) as avg_order_value,
      COUNT(DISTINCT o.customer_id) as unique_customers
    FROM orders o
    WHERE o.tenant_id = $1 AND o.order_status != $${paramIndex}${dateFilter}
  `, [...params, 'cancelled']);
  
  res.json({
    success: true,
    data: {
      summary: summary || { total_orders: 0, total_revenue: 0, avg_order_value: 0, unique_customers: 0 },
      trend: salesTrend || []
    }
  });
}));

router.get('/finance', asyncHandler(async (req, res) => {
  const tenantId = req.tenantId;
  const { start_date, end_date } = req.query;
  
  let dateFilter = '';
  const params = [tenantId];
  let paramIndex = 2;
  
  if (start_date) {
    dateFilter += ` AND o.order_date >= $${paramIndex}`;
    params.push(start_date);
    paramIndex++;
  }
  
  if (end_date) {
    dateFilter += ` AND o.order_date <= $${paramIndex}`;
    params.push(end_date);
  }
  
  const stats = await getOneQuery(`
    SELECT 
      COUNT(*) as total_orders,
      COALESCE(SUM(total_amount), 0) as total_revenue,
      COALESCE(AVG(total_amount), 0) as avg_order_value,
      COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END), 0) as paid_amount,
      COALESCE(SUM(CASE WHEN payment_status = 'pending' THEN total_amount ELSE 0 END), 0) as pending_amount,
      COALESCE(SUM(CASE WHEN payment_status = 'overdue' THEN total_amount ELSE 0 END), 0) as overdue_amount
    FROM orders o
    WHERE tenant_id = $1 AND order_status != 'cancelled'${dateFilter}
  `, params);
  
  const byPaymentMethod = await getQuery(`
    SELECT 
      payment_method,
      COUNT(*) as order_count,
      COALESCE(SUM(total_amount), 0) as total_amount
    FROM orders
    WHERE tenant_id = $1 AND order_status != 'cancelled'${dateFilter}
    GROUP BY payment_method
    ORDER BY total_amount DESC
  `, params);
  
  const byStatus = await getQuery(`
    SELECT 
      payment_status,
      COUNT(*) as order_count,
      COALESCE(SUM(total_amount), 0) as total_amount
    FROM orders
    WHERE tenant_id = $1 AND order_status != 'cancelled'${dateFilter}
    GROUP BY payment_status
    ORDER BY total_amount DESC
  `, params);
  
  res.json({
    success: true,
    data: {
      summary: stats || { total_orders: 0, total_revenue: 0, avg_order_value: 0, paid_amount: 0, pending_amount: 0, overdue_amount: 0 },
      by_payment_method: byPaymentMethod || [],
      by_status: byStatus || []
    }
  });
}));

router.get('/operations', asyncHandler(async (req, res) => {
  const tenantId = req.tenantId;
  const { start_date, end_date } = req.query;
  
  let dateFilter = '';
  const params = [tenantId];
  let paramIndex = 2;
  
  if (start_date) {
    dateFilter += ` AND v.visit_date >= $${paramIndex}`;
    params.push(start_date);
    paramIndex++;
  }
  
  if (end_date) {
    dateFilter += ` AND v.visit_date <= $${paramIndex}`;
    params.push(end_date);
  }
  
  const visitStats = await getOneQuery(`
    SELECT 
      COUNT(DISTINCT v.id) as total_visits,
      COUNT(DISTINCT v.customer_id) as customers_visited,
      COUNT(DISTINCT v.agent_id) as active_agents,
      COUNT(DISTINCT CASE WHEN v.visit_status = 'completed' THEN v.id END) as completed_visits,
      COUNT(DISTINCT CASE WHEN v.visit_status = 'pending' THEN v.id END) as pending_visits,
      COUNT(DISTINCT CASE WHEN v.visit_status = 'cancelled' THEN v.id END) as cancelled_visits
    FROM visits v
    WHERE v.tenant_id = $1${dateFilter}
  `, params);
  
  const visitsByAgent = await getQuery(`
    SELECT 
      u.first_name || ' ' || u.last_name as agent_name,
      COUNT(v.id) as visit_count,
      COUNT(DISTINCT v.customer_id) as unique_customers,
      COUNT(CASE WHEN v.visit_status = 'completed' THEN 1 END) as completed_count
    FROM visits v
    JOIN users u ON v.agent_id = u.id
    WHERE v.tenant_id = $1${dateFilter}
    GROUP BY u.id, u.first_name, u.last_name
    ORDER BY visit_count DESC
    LIMIT 10
  `, params);
  
  const visitsByType = await getQuery(`
    SELECT 
      visit_type,
      COUNT(*) as visit_count,
      COUNT(CASE WHEN visit_status = 'completed' THEN 1 END) as completed_count
    FROM visits
    WHERE tenant_id = $1${dateFilter}
    GROUP BY visit_type
    ORDER BY visit_count DESC
  `, params);
  
  res.json({
    success: true,
    data: {
      summary: visitStats || { total_visits: 0, customers_visited: 0, active_agents: 0, completed_visits: 0, pending_visits: 0, cancelled_visits: 0 },
      by_agent: visitsByAgent || [],
      by_type: visitsByType || []
    }
  });
}));

router.get('/products', asyncHandler(async (req, res) => {
  const tenantId = req.tenantId;
  const { start_date, end_date, limit = 10 } = req.query;
  
  let dateFilter = '';
  const params = [tenantId];
  let paramIndex = 2;
  
  if (start_date) {
    dateFilter += ` AND o.order_date >= $${paramIndex}`;
    params.push(start_date);
    paramIndex++;
  }
  
  if (end_date) {
    dateFilter += ` AND o.order_date <= $${paramIndex}`;
    params.push(end_date);
    paramIndex++;
  }
  
  const topProducts = await getQuery(`
    SELECT 
      p.id,
      p.name,
      p.sku,
      COUNT(DISTINCT o.id) as order_count,
      COALESCE(SUM(ol.quantity), 0) as total_quantity,
      COALESCE(SUM(ol.quantity * ol.unit_price), 0) as total_revenue
    FROM order_lines ol
    JOIN orders o ON ol.order_id = o.id
    JOIN products p ON ol.product_id = p.id
    WHERE o.tenant_id = $1 AND o.order_status != 'cancelled'${dateFilter}
    GROUP BY p.id, p.name, p.sku
    ORDER BY total_revenue DESC
    LIMIT $${paramIndex}
  `, [...params, parseInt(limit)]);
  
  const categoryStats = await getQuery(`
    SELECT 
      p.category,
      COUNT(DISTINCT p.id) as product_count,
      COUNT(DISTINCT o.id) as order_count,
      COALESCE(SUM(ol.quantity), 0) as total_quantity,
      COALESCE(SUM(ol.quantity * ol.unit_price), 0) as total_revenue
    FROM order_lines ol
    JOIN orders o ON ol.order_id = o.id
    JOIN products p ON ol.product_id = p.id
    WHERE o.tenant_id = $1 AND o.order_status != 'cancelled'${dateFilter}
    GROUP BY p.category
    ORDER BY total_revenue DESC
  `, params);
  
  res.json({
    success: true,
    data: {
      top_products: topProducts || [],
      by_category: categoryStats || []
    }
  });
}));

router.get('/customers', asyncHandler(async (req, res) => {
  const tenantId = req.tenantId;
  const { start_date, end_date, limit = 10 } = req.query;
  
  let dateFilter = '';
  const params = [tenantId];
  let paramIndex = 2;
  
  if (start_date) {
    dateFilter += ` AND o.order_date >= $${paramIndex}`;
    params.push(start_date);
    paramIndex++;
  }
  
  if (end_date) {
    dateFilter += ` AND o.order_date <= $${paramIndex}`;
    params.push(end_date);
    paramIndex++;
  }
  
  const topCustomers = await getQuery(`
    SELECT 
      c.id,
      c.name,
      c.customer_type,
      COUNT(o.id) as order_count,
      COALESCE(SUM(o.total_amount), 0) as total_revenue,
      COALESCE(AVG(o.total_amount), 0) as avg_order_value,
      MAX(o.order_date) as last_order_date
    FROM customers c
    LEFT JOIN orders o ON c.id = o.customer_id AND o.order_status != 'cancelled'
    WHERE c.tenant_id = $1${dateFilter}
    GROUP BY c.id, c.name, c.customer_type
    ORDER BY total_revenue DESC
    LIMIT $${paramIndex}
  `, [...params, parseInt(limit)]);
  
  const customerTypeStats = await getQuery(`
    SELECT 
      c.customer_type,
      COUNT(DISTINCT c.id) as customer_count,
      COUNT(o.id) as order_count,
      COALESCE(SUM(o.total_amount), 0) as total_revenue
    FROM customers c
    LEFT JOIN orders o ON c.id = o.customer_id AND o.order_status != 'cancelled'
    WHERE c.tenant_id = $1${dateFilter}
    GROUP BY c.customer_type
    ORDER BY total_revenue DESC
  `, params);
  
  res.json({
    success: true,
    data: {
      top_customers: topCustomers || [],
      by_type: customerTypeStats || []
    }
  });
}));

router.get('/agents', asyncHandler(async (req, res) => {
  const tenantId = req.tenantId;
  const { start_date, end_date } = req.query;
  
  let dateFilter = '';
  const params = [tenantId];
  let paramIndex = 2;
  
  if (start_date) {
    dateFilter += ` AND o.order_date >= $${paramIndex}`;
    params.push(start_date);
    paramIndex++;
  }
  
  if (end_date) {
    dateFilter += ` AND o.order_date <= $${paramIndex}`;
    params.push(end_date);
  }
  
  const agentPerformance = await getQuery(`
    SELECT 
      u.id as agent_id,
      u.first_name || ' ' || u.last_name as agent_name,
      u.role,
      COUNT(DISTINCT o.id) as order_count,
      COALESCE(SUM(o.total_amount), 0) as total_revenue,
      COUNT(DISTINCT v.id) as visit_count,
      COUNT(DISTINCT v.customer_id) as customers_visited
    FROM users u
    LEFT JOIN orders o ON u.id = o.agent_id AND o.order_status != 'cancelled'
    LEFT JOIN visits v ON u.id = v.agent_id
    WHERE u.tenant_id = $1 
      AND u.role IN ('agent', 'sales_agent', 'field_agent', 'van_sales_agent')
      ${dateFilter}
    GROUP BY u.id, u.first_name, u.last_name, u.role
    ORDER BY total_revenue DESC
  `, params);
  
  res.json({
    success: true,
    data: {
      agent_performance: agentPerformance || []
    }
  });
}));

module.exports = router;
