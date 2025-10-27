const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const router = express.Router();
const { getQuery, getOneQuery } = require('../utils/database');

// Sales Analytics
router.get('/sales', asyncHandler(async (req, res) => {
  const tenantId = req.user.tenantId;
  const { date_from, date_to } = req.query;
  
  // Build date filter
  let dateFilter = '';
  const params = [tenantId];
  
  if (date_from && date_to) {
    dateFilter = 'AND o.order_date BETWEEN ? AND ?';
    params.push(date_from, date_to);
  } else {
    dateFilter = 'AND o.order_date >= DATE("now", "-30 days")';
  }
  
  // Sales summary
  const salesSummary = await getOneQuery(`
    SELECT 
      COUNT(*) as total_orders,
      COALESCE(SUM(o.total_amount), 0) as total_revenue,
      COALESCE(AVG(o.total_amount), 0) as avg_order_value,
      COUNT(DISTINCT o.customer_id) as unique_customers,
      COUNT(DISTINCT o.salesman_id) as active_agents
    FROM orders o
    WHERE o.tenant_id = ? ${dateFilter}
  `, params);
  
  // Daily sales trend
  const dailySales = await getQuery(`
    SELECT 
      DATE(o.order_date) as date,
      COUNT(*) as orders,
      COALESCE(SUM(o.total_amount), 0) as revenue
    FROM orders o
    WHERE o.tenant_id = ? ${dateFilter}
    GROUP BY DATE(o.order_date)
    ORDER BY DATE(o.order_date)
  `, params);
  
  // Top products
  const topProducts = await getQuery(`
    SELECT 
      p.name as product_name,
      SUM(oi.quantity) as total_quantity,
      COALESCE(SUM(oi.line_total), 0) as total_revenue
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    JOIN products p ON oi.product_id = p.id
    WHERE o.tenant_id = ? ${dateFilter}
    GROUP BY p.id, p.name
    ORDER BY total_revenue DESC
    LIMIT 10
  `, params);
  
  // Top agents
  const topAgents = await getQuery(`
    SELECT 
      u.first_name || ' ' || u.last_name as agent_name,
      COUNT(o.id) as total_orders,
      COALESCE(SUM(o.total_amount), 0) as total_revenue
    FROM orders o
    JOIN agents a ON o.salesman_id = a.id
    JOIN users u ON a.user_id = u.id
    WHERE o.tenant_id = ? ${dateFilter}
    GROUP BY a.id, u.first_name, u.last_name
    ORDER BY total_revenue DESC
    LIMIT 10
  `, params);
  
  res.json({
    success: true,
    data: {
      summary: salesSummary || { total_orders: 0, total_revenue: 0, avg_order_value: 0, unique_customers: 0, active_agents: 0 },
      daily_trend: dailySales || [],
      top_products: topProducts || [],
      top_agents: topAgents || []
    }
  });
}));

// Visit Analytics
router.get('/visits', asyncHandler(async (req, res) => {
  const tenantId = req.user.tenantId;
  const { date_from, date_to } = req.query;
  
  let dateFilter = '';
  const params = [tenantId];
  
  if (date_from && date_to) {
    dateFilter = 'AND v.visit_date BETWEEN ? AND ?';
    params.push(date_from, date_to);
  } else {
    dateFilter = 'AND v.visit_date >= DATE("now", "-30 days")';
  }
  
  // Visit summary
  const visitSummary = await getOneQuery(`
    SELECT 
      COUNT(*) as total_visits,
      SUM(CASE WHEN v.status = 'completed' THEN 1 ELSE 0 END) as completed_visits,
      COALESCE(AVG(CASE WHEN v.check_in_time IS NOT NULL AND v.check_out_time IS NOT NULL 
          THEN (julianday(v.check_out_time) - julianday(v.check_in_time)) * 24 * 60 
          ELSE NULL END), 0) as avg_duration_minutes,
      COUNT(DISTINCT v.agent_id) as active_agents,
      COUNT(DISTINCT v.customer_id) as customers_visited
    FROM visits v
    WHERE v.tenant_id = ? ${dateFilter}
  `, params);
  
  res.json({
    success: true,
    data: {
      summary: visitSummary || { total_visits: 0, completed_visits: 0, avg_duration_minutes: 0, active_agents: 0, customers_visited: 0 }
    }
  });
}));

// Revenue Analytics
router.get('/revenue', asyncHandler(async (req, res) => {
  const tenantId = req.user.tenantId;
  const { date_from, date_to } = req.query;
  
  let dateFilter = '';
  const params = [tenantId];
  
  if (date_from && date_to) {
    dateFilter = 'AND o.order_date BETWEEN ? AND ?';
    params.push(date_from, date_to);
  } else {
    dateFilter = 'AND o.order_date >= DATE("now", "-30 days")';
  }
  
  const revenueData = await getOneQuery(`
    SELECT 
      COALESCE(SUM(o.total_amount), 0) as total_revenue,
      COUNT(*) as total_orders,
      COALESCE(AVG(o.total_amount), 0) as avg_order_value,
      COUNT(DISTINCT o.customer_id) as unique_customers
    FROM orders o
    WHERE o.tenant_id = ? ${dateFilter}
  `, params);
  
  res.json({
    success: true,
    data: {
      summary: revenueData || { total_revenue: 0, total_orders: 0, avg_order_value: 0, unique_customers: 0 }
    }
  });
}));

// Dashboard overview
router.get('/dashboard', asyncHandler(async (req, res) => {
  const tenantId = req.user.tenantId;
  
  // Today's metrics
  const todayMetrics = await getOneQuery(`
    SELECT 
      COUNT(DISTINCT CASE WHEN DATE(o.order_date) = DATE('now') THEN o.id END) as today_orders,
      COALESCE(SUM(CASE WHEN DATE(o.order_date) = DATE('now') THEN o.total_amount ELSE 0 END), 0) as today_revenue,
      COUNT(DISTINCT CASE WHEN DATE(v.visit_date) = DATE('now') THEN v.id END) as today_visits,
      COUNT(DISTINCT CASE WHEN DATE(v.visit_date) = DATE('now') AND v.status = 'completed' THEN v.id END) as today_completed_visits
    FROM orders o
    CROSS JOIN visits v
    WHERE o.tenant_id = ? AND v.tenant_id = ?
  `, [tenantId, tenantId]);
  
  res.json({
    success: true,
    data: {
      today_metrics: todayMetrics || { today_orders: 0, today_revenue: 0, today_visits: 0, today_completed_visits: 0 }
    }
  });
}));

// Advanced Analytics endpoint
router.get('/advanced', asyncHandler(async (req, res) => {
  const tenantId = req.user.tenantId;
  
  // Advanced analytics combining multiple data sources
  const advancedMetrics = await getQuery(`
    SELECT 
      'sales_performance' as metric_type,
      COUNT(DISTINCT o.id) as total_orders,
      COALESCE(SUM(o.total_amount), 0) as total_revenue,
      COUNT(DISTINCT o.customer_id) as unique_customers,
      COUNT(DISTINCT o.salesman_id) as active_agents
    FROM orders o
    WHERE o.tenant_id = ?
    AND o.order_date >= DATE('now', '-30 days')
    
    UNION ALL
    
    SELECT 
      'inventory_turnover' as metric_type,
      COUNT(DISTINCT p.id) as total_products,
      COALESCE(SUM(i.quantity_on_hand), 0) as total_stock,
      COUNT(DISTINCT i.warehouse_id) as warehouses,
      0 as active_agents
    FROM products p
    LEFT JOIN inventory_stock i ON p.id = i.product_id
    WHERE p.tenant_id = ?
    
    UNION ALL
    
    SELECT 
      'customer_engagement' as metric_type,
      COUNT(DISTINCT c.id) as total_customers,
      COUNT(DISTINCT CASE WHEN o.order_date >= DATE('now', '-30 days') THEN c.id END) as active_customers,
      COUNT(DISTINCT c.area_id) as coverage_areas,
      0 as active_agents
    FROM customers c
    LEFT JOIN orders o ON c.id = o.customer_id
    WHERE c.tenant_id = ?
  `, [tenantId, tenantId, tenantId]);

  res.json({
    success: true,
    data: {
      metrics: advancedMetrics,
      generated_at: new Date().toISOString(),
      period: '30_days'
    }
  });
}));

// Simple test endpoints
router.get('/test', asyncHandler(async (req, res) => {
  res.json({
    success: true,
    message: 'Analytics API is working',
    timestamp: new Date().toISOString()
  });
}));

// GET /api/analytics/stats - Analytics overview statistics
router.get('/stats', asyncHandler(async (req, res) => {
  const tenantId = req.user.tenantId;
  
  const [businessMetrics, trends, topPerformers] = await Promise.all([
    getOneQuery(`
      SELECT 
        (SELECT COUNT(*) FROM orders WHERE tenant_id = ?) as total_orders,
        (SELECT SUM(total_amount) FROM orders WHERE tenant_id = ?) as total_revenue,
        (SELECT COUNT(*) FROM visits WHERE tenant_id = ?) as total_visits,
        (SELECT COUNT(DISTINCT customer_id) FROM orders WHERE tenant_id = ?) as unique_customers
    `, [tenantId, tenantId, tenantId, tenantId]),
    
    getQuery(`
      SELECT 
        DATE(o.created_at) as date,
        COUNT(*) as order_count,
        SUM(o.total_amount) as daily_revenue
      FROM orders o
      WHERE o.tenant_id = ? AND o.created_at >= DATE('now', '-30 days')
      GROUP BY DATE(o.created_at)
      ORDER BY date DESC
    `, [tenantId]),
    
    getQuery(`
      SELECT 
        p.id, p.name,
        SUM(oi.quantity) as total_sold,
        SUM(oi.quantity * oi.unit_price) as revenue
      FROM order_items oi
      INNER JOIN products p ON oi.product_id = p.id
      INNER JOIN orders o ON oi.order_id = o.id
      WHERE o.tenant_id = ?
      GROUP BY p.id
      ORDER BY revenue DESC
      LIMIT 10
    `, [tenantId])
  ]);

  res.json({
    success: true,
    data: {
      metrics: {
        ...businessMetrics,
        total_revenue: parseFloat((businessMetrics.total_revenue || 0).toFixed(2))
      },
      trends,
      topPerformers
    }
  });
}));

module.exports = router;