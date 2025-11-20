const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const router = express.Router();
const { getQuery, getOneQuery } = require('../utils/database');

router.get('/', asyncHandler(async (req, res) => {
  const tenantId = req.user?.tenantId || req.tenantId;
  const { start_date, end_date } = req.query;
  
  const startDate = start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const endDate = end_date || new Date().toISOString().split('T')[0];
  
  const [salesMetrics, visitMetrics, customerMetrics, productMetrics] = await Promise.all([
    getOneQuery(`
      SELECT 
        COUNT(*)::int as total_orders,
        COALESCE(SUM(o.total_amount), 0)::float8 as total_revenue,
        COALESCE(AVG(o.total_amount), 0)::float8 as avg_order_value
      FROM orders o
      WHERE o.tenant_id = $1 
        AND o.order_date >= $2 
        AND o.order_date <= $3
    `, [tenantId, startDate, endDate]),
    
    getOneQuery(`
      SELECT 
        COUNT(*)::int as total_visits,
        SUM(CASE WHEN v.status = 'completed' THEN 1 ELSE 0 END)::int as completed_visits
      FROM visits v
      WHERE v.tenant_id = $1 
        AND v.visit_date >= $2 
        AND v.visit_date <= $3
    `, [tenantId, startDate, endDate]),
    
    getOneQuery(`
      SELECT 
        COUNT(DISTINCT c.id)::int as total_customers,
        COUNT(DISTINCT CASE WHEN o.order_date >= $2 AND o.order_date <= $3 THEN c.id END)::int as active_customers
      FROM customers c
      LEFT JOIN orders o ON c.id = o.customer_id AND o.tenant_id = $1
      WHERE c.tenant_id = $1 AND c.status = 'active'
    `, [tenantId, startDate, endDate]),
    
    getOneQuery(`
      SELECT 
        COUNT(DISTINCT p.id)::int as total_products,
        COUNT(DISTINCT oi.product_id)::int as products_sold
      FROM products p
      LEFT JOIN order_items oi ON p.id = oi.product_id
      LEFT JOIN orders o ON oi.order_id = o.id AND o.tenant_id = $1 AND o.order_date >= $2 AND o.order_date <= $3
      WHERE p.tenant_id = $1 AND p.status = 'active'
    `, [tenantId, startDate, endDate])
  ]);
  
  res.json({
    success: true,
    data: {
      sales: {
        total_orders: salesMetrics?.total_orders || 0,
        total_revenue: salesMetrics?.total_revenue || 0,
        avg_order_value: salesMetrics?.avg_order_value || 0
      },
      visits: {
        total_visits: visitMetrics?.total_visits || 0,
        completed_visits: visitMetrics?.completed_visits || 0
      },
      customers: {
        total_customers: customerMetrics?.total_customers || 0,
        active_customers: customerMetrics?.active_customers || 0
      },
      products: {
        total_products: productMetrics?.total_products || 0,
        products_sold: productMetrics?.products_sold || 0
      },
      period: {
        start_date: startDate,
        end_date: endDate
      }
    }
  });
}));

// Sales Analytics
router.get('/sales', asyncHandler(async (req, res) => {
  const tenantId = req.user.tenantId;
  const { date_from, date_to } = req.query;
  
  // Build date filter
  let dateFilter = '';
  const params = [tenantId];
  
  if (date_from && date_to) {
    dateFilter = `AND o.order_date BETWEEN $${params.length + 1} AND $${params.length + 2}`;
    params.push(date_from, date_to);
  } else {
    dateFilter = `AND o.order_date >= CURRENT_DATE - INTERVAL '30 days'`;
  }
  
  // Sales summary
  const salesSummary = await getOneQuery(`
    SELECT 
      COUNT(*)::int as total_orders,
      COALESCE(SUM(o.total_amount), 0)::float8 as total_revenue,
      COALESCE(AVG(o.total_amount), 0)::float8 as avg_order_value,
      COUNT(DISTINCT o.customer_id)::int as unique_customers,
      COUNT(DISTINCT o.salesman_id)::int as active_agents
    FROM orders o
    WHERE o.tenant_id = $1 ${dateFilter}
  `, params);
  
  // Daily sales trend
  const dailySales = await getQuery(`
    SELECT 
      o.order_date::date as date,
      COUNT(*)::int as orders,
      COALESCE(SUM(o.total_amount), 0)::float8 as revenue
    FROM orders o
    WHERE o.tenant_id = $1 ${dateFilter}
    GROUP BY o.order_date::date
    ORDER BY o.order_date::date
  `, params);
  
  // Top products
  const topProducts = await getQuery(`
    SELECT 
      p.name as product_name,
      SUM(oi.quantity)::float8 as total_quantity,
      COALESCE(SUM(oi.line_total), 0)::float8 as total_revenue
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    JOIN products p ON oi.product_id = p.id
    WHERE o.tenant_id = $1 ${dateFilter}
    GROUP BY p.id, p.name
    ORDER BY total_revenue DESC
    LIMIT 10
  `, params);
  
  // Top agents
  const topAgents = await getQuery(`
    SELECT 
      u.first_name || ' ' || u.last_name as agent_name,
      COUNT(o.id)::int as total_orders,
      COALESCE(SUM(o.total_amount), 0)::float8 as total_revenue
    FROM orders o
    JOIN users u ON o.salesman_id = u.id
    WHERE o.tenant_id = $1 ${dateFilter}
      AND u.role = 'agent'
    GROUP BY u.id, u.first_name, u.last_name
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
    dateFilter = `AND v.visit_date BETWEEN $${params.length + 1} AND $${params.length + 2}`;
    params.push(date_from, date_to);
  } else {
    dateFilter = `AND v.visit_date >= CURRENT_DATE - INTERVAL '30 days'`;
  }
  
  // Visit summary
  const visitSummary = await getOneQuery(`
    SELECT 
      COUNT(*)::int as total_visits,
      SUM(CASE WHEN v.status = 'completed' THEN 1 ELSE 0 END)::int as completed_visits,
      COALESCE(AVG(CASE WHEN v.check_in_time IS NOT NULL AND v.check_out_time IS NOT NULL 
          THEN EXTRACT(EPOCH FROM (v.check_out_time - v.check_in_time)) / 60
          ELSE NULL END), 0)::float8 as avg_duration_minutes,
      COUNT(DISTINCT v.agent_id)::int as active_agents,
      COUNT(DISTINCT v.customer_id)::int as customers_visited
    FROM visits v
    WHERE v.tenant_id = $1 ${dateFilter}
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
    dateFilter = `AND o.order_date BETWEEN $${params.length + 1} AND $${params.length + 2}`;
    params.push(date_from, date_to);
  } else {
    dateFilter = `AND o.order_date >= CURRENT_DATE - INTERVAL '30 days'`;
  }
  
  const revenueData = await getOneQuery(`
    SELECT 
      COALESCE(SUM(o.total_amount), 0)::float8 as total_revenue,
      COUNT(*)::int as total_orders,
      COALESCE(AVG(o.total_amount), 0)::float8 as avg_order_value,
      COUNT(DISTINCT o.customer_id)::int as unique_customers
    FROM orders o
    WHERE o.tenant_id = $1 ${dateFilter}
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
  const { start_date, end_date, date_from, date_to } = req.query;
  
  const startDate = start_date || date_from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const endDate = end_date || date_to || new Date().toISOString().split('T')[0];
  
  const [orderStats, customerStats, agentStats, productStats] = await Promise.all([
    getOneQuery(`
      SELECT 
        COUNT(*)::int as total_orders,
        COALESCE(SUM(o.total_amount), 0)::float8 as total_revenue,
        COALESCE(AVG(o.total_amount), 0)::float8 as average_order_value
      FROM orders o
      WHERE o.tenant_id = $1 
        AND o.order_date >= $2::date 
        AND o.order_date <= $3::date
    `, [tenantId, startDate, endDate]),
    
    getOneQuery(`
      SELECT 
        COUNT(DISTINCT c.id)::int as total_customers,
        COUNT(DISTINCT CASE WHEN o.order_date >= $2::date AND o.order_date <= $3::date THEN c.id END)::int as active_customers,
        COUNT(DISTINCT CASE WHEN c.created_at >= $2::date AND c.created_at <= $3::date THEN c.id END)::int as new_customers
      FROM customers c
      LEFT JOIN orders o ON c.id = o.customer_id AND o.tenant_id = $1
      WHERE c.tenant_id = $1
    `, [tenantId, startDate, endDate]),
    
    getOneQuery(`
      SELECT 
        COUNT(DISTINCT u.id)::int as total_agents,
        COUNT(DISTINCT CASE 
          WHEN o.order_date >= $2::date AND o.order_date <= $3::date THEN o.salesman_id
          WHEN v.visit_date >= $2::date AND v.visit_date <= $3::date THEN v.agent_id
        END)::int as active_agents
      FROM users u
      LEFT JOIN orders o ON u.id = o.salesman_id AND o.tenant_id = $1
      LEFT JOIN visits v ON u.id = v.agent_id AND v.tenant_id = $1
      WHERE u.tenant_id = $1 AND u.role = 'agent'
    `, [tenantId, startDate, endDate]),
    
    getOneQuery(`
      SELECT 
        COUNT(DISTINCT oi.product_id)::int as products_sold,
        COUNT(DISTINCT p.id)::int as unique_products
      FROM products p
      LEFT JOIN order_items oi ON p.id = oi.product_id
      LEFT JOIN orders o ON oi.order_id = o.id AND o.tenant_id = $1 AND o.order_date >= $2::date AND o.order_date <= $3::date
      WHERE p.tenant_id = $1
    `, [tenantId, startDate, endDate])
  ]);
  
  const [dailyRevenue, dailyOrders] = await Promise.all([
    getQuery(`
      SELECT 
        o.order_date::date as date,
        COALESCE(SUM(o.total_amount), 0)::float8 as revenue
      FROM orders o
      WHERE o.tenant_id = $1 
        AND o.order_date >= $2::date 
        AND o.order_date <= $3::date
      GROUP BY o.order_date::date
      ORDER BY o.order_date::date
    `, [tenantId, startDate, endDate]),
    
    getQuery(`
      SELECT 
        o.order_date::date as date,
        COUNT(*)::int as orders
      FROM orders o
      WHERE o.tenant_id = $1 
        AND o.order_date >= $2::date 
        AND o.order_date <= $3::date
      GROUP BY o.order_date::date
      ORDER BY o.order_date::date
    `, [tenantId, startDate, endDate])
  ]);
  
  const topPerformers = await getQuery(`
    SELECT 
      u.id as agent_id,
      u.first_name || ' ' || u.last_name as agent_name,
      COUNT(o.id)::int as total_orders,
      COALESCE(SUM(o.total_amount), 0)::float8 as total_revenue,
      ROUND((COUNT(CASE WHEN o.order_status = 'completed' THEN 1 END)::float8 / NULLIF(COUNT(o.id), 0) * 100), 1) as success_rate
    FROM users u
    LEFT JOIN orders o ON u.id = o.salesman_id AND o.tenant_id = $1 AND o.order_date >= $2::date AND o.order_date <= $3::date
    WHERE u.tenant_id = $1 AND u.role = 'agent'
    GROUP BY u.id, u.first_name, u.last_name
    HAVING COUNT(o.id) > 0
    ORDER BY total_revenue DESC
    LIMIT 5
  `, [tenantId, startDate, endDate]);
  
  res.json({
    success: true,
    data: {
      stats: {
        total_revenue: orderStats?.total_revenue || 0,
        total_orders: orderStats?.total_orders || 0,
        average_order_value: orderStats?.average_order_value || 0,
        active_customers: customerStats?.active_customers || 0,
        new_customers: customerStats?.new_customers || 0,
        total_agents: agentStats?.total_agents || 0,
        active_agents: agentStats?.active_agents || 0,
        products_sold: productStats?.products_sold || 0,
        unique_products: productStats?.unique_products || 0
      },
      trends: {
        daily_revenue: dailyRevenue || [],
        daily_orders: dailyOrders || []
      },
      top_performers: topPerformers || [],
      period: {
        start_date: startDate,
        end_date: endDate
      }
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
      COUNT(DISTINCT o.id)::int as total_orders,
      COALESCE(SUM(o.total_amount), 0)::float8 as total_revenue,
      COUNT(DISTINCT o.customer_id)::int as unique_customers,
      COUNT(DISTINCT o.salesman_id)::int as active_agents
    FROM orders o
    WHERE o.tenant_id = $1
    AND o.order_date >= CURRENT_DATE - INTERVAL '30 days'
    
    UNION ALL
    
    SELECT 
      'inventory_turnover' as metric_type,
      COUNT(DISTINCT p.id)::int as total_products,
      COALESCE(SUM(i.quantity_on_hand), 0)::float8 as total_stock,
      COUNT(DISTINCT i.warehouse_id)::int as warehouses,
      0 as active_agents
    FROM products p
    LEFT JOIN inventory_stock i ON p.id = i.product_id
    WHERE p.tenant_id = $2
    
    UNION ALL
    
    SELECT 
      'customer_engagement' as metric_type,
      COUNT(DISTINCT c.id)::int as total_customers,
      COUNT(DISTINCT CASE WHEN o.order_date >= CURRENT_DATE - INTERVAL '30 days' THEN c.id END)::int as active_customers,
      COUNT(DISTINCT c.area_id)::int as coverage_areas,
      0 as active_agents
    FROM customers c
    LEFT JOIN orders o ON c.id = o.customer_id
    WHERE c.tenant_id = $3
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

router.get('/recent-activity', asyncHandler(async (req, res) => {
  const tenantId = req.user.tenantId;
  const limit = parseInt(req.query.limit) || 10;
  
  const recentOrders = await getQuery(`
    SELECT 
      'order' as type,
      o.id,
      'New order from ' || c.name as description,
      o.order_date as created_at,
      o.total_amount as value,
      c.name as customer_name,
      u.first_name || ' ' || u.last_name as agent_name
    FROM orders o
    LEFT JOIN customers c ON o.customer_id = c.id
    LEFT JOIN users u ON o.salesman_id = u.id
    WHERE o.tenant_id = $1
    ORDER BY o.order_date DESC
    LIMIT $2
  `, [tenantId, limit]);
  
  const recentVisits = await getQuery(`
    SELECT 
      'visit' as type,
      v.id,
      'Visit to ' || c.name as description,
      v.visit_date as created_at,
      NULL as value,
      c.name as customer_name,
      u.first_name || ' ' || u.last_name as agent_name
    FROM visits v
    LEFT JOIN customers c ON v.customer_id = c.id
    LEFT JOIN users u ON v.agent_id = u.id
    WHERE v.tenant_id = $1
    ORDER BY v.visit_date DESC
    LIMIT $2
  `, [tenantId, limit]);
  
  const allActivities = [...recentOrders, ...recentVisits]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, limit);
  
  res.json({
    success: true,
    data: {
      activities: allActivities
    }
  });
}));

// GET /api/analytics/stats - Analytics overview statistics
router.get('/stats', asyncHandler(async (req, res) => {
  const tenantId = req.user.tenantId;
  
  const [businessMetrics, trends, topPerformers] = await Promise.all([
    getOneQuery(`
      SELECT 
        (SELECT COUNT(*)::int FROM orders WHERE tenant_id = $1) as total_orders,
        (SELECT SUM(total_amount)::float8 FROM orders WHERE tenant_id = $1) as total_revenue,
        (SELECT COUNT(*)::int FROM visits WHERE tenant_id = $1) as total_visits,
        (SELECT COUNT(DISTINCT customer_id)::int FROM orders WHERE tenant_id = $1) as unique_customers
    `, [tenantId]),
    
    getQuery(`
      SELECT 
        o.created_at::date as date,
        COUNT(*)::int as order_count,
        SUM(o.total_amount)::float8 as daily_revenue
      FROM orders o
      WHERE o.tenant_id = $1 AND o.created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY o.created_at::date
      ORDER BY date DESC
    `, [tenantId]),
    
    getQuery(`
      SELECT 
        p.id, p.name,
        SUM(oi.quantity)::float8 as total_sold,
        SUM(oi.quantity * oi.unit_price)::float8 as revenue
      FROM order_items oi
      INNER JOIN products p ON oi.product_id = p.id
      INNER JOIN orders o ON oi.order_id = o.id
      WHERE o.tenant_id = $1
      GROUP BY p.id, p.name
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

// GET /api/analytics/agents - Agent performance analytics
router.get('/agents', asyncHandler(async (req, res) => {
  const tenantId = req.user.tenantId;
  const { start_date, end_date, date_from, date_to } = req.query;
  
  const startDate = start_date || date_from;
  const endDate = end_date || date_to;
  
  const dateFrom = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const dateTo = endDate || new Date().toISOString().split('T')[0];
  
  const agentCounts = await getOneQuery(`
    SELECT 
      COUNT(DISTINCT u.id)::int as total_agents,
      COUNT(DISTINCT CASE 
        WHEN o.order_date >= $2 AND o.order_date <= $3 THEN u.id 
        WHEN v.visit_date >= $2 AND v.visit_date <= $3 THEN u.id 
      END)::int as active_agents
    FROM users u
    LEFT JOIN orders o ON u.id = o.salesman_id AND o.tenant_id = $1
    LEFT JOIN visits v ON u.id = v.agent_id AND v.tenant_id = $1
    WHERE u.tenant_id = $1 
      AND u.role = 'agent'
      AND u.status = 'active'
  `, [tenantId, dateFrom, dateTo]);
  
  const topPerformers = await getQuery(`
    SELECT 
      u.id as agent_id,
      u.first_name || ' ' || u.last_name as agent_name,
      COALESCE(SUM(o.total_amount), 0)::float8 as total_sales,
      COUNT(DISTINCT v.id)::int as total_visits,
      CASE 
        WHEN COUNT(DISTINCT v.id) > 0 
        THEN (COUNT(DISTINCT CASE WHEN v.status = 'completed' THEN v.id END)::DECIMAL / COUNT(DISTINCT v.id)::DECIMAL * 100)::float8
        ELSE 0 
      END as success_rate,
      0 as commission_earned,
      0::float8 as conversion_rate
    FROM users u
    LEFT JOIN orders o ON u.id = o.salesman_id 
      AND o.tenant_id = $1 
      AND o.order_date >= $2 
      AND o.order_date <= $3
    LEFT JOIN visits v ON u.id = v.agent_id 
      AND v.tenant_id = $1 
      AND v.visit_date >= $2 
      AND v.visit_date <= $3
    WHERE u.tenant_id = $1 
      AND u.role = 'agent'
      AND u.status = 'active'
    GROUP BY u.id, u.first_name, u.last_name
    HAVING COUNT(DISTINCT o.id) > 0 OR COUNT(DISTINCT v.id) > 0
    ORDER BY total_sales DESC
    LIMIT 10
  `, [tenantId, dateFrom, dateTo]);
  
  const performanceDistribution = await getQuery(`
    SELECT 
      CASE 
        WHEN agent_sales = 0 THEN '0'
        WHEN agent_sales < 1000 THEN '1-999'
        WHEN agent_sales < 5000 THEN '1000-4999'
        WHEN agent_sales < 10000 THEN '5000-9999'
        ELSE '10000+'
      END as range,
      COUNT(*)::int as count,
      ROUND((COUNT(*)::DECIMAL / NULLIF(SUM(COUNT(*)) OVER (), 0) * 100)::NUMERIC, 1)::float8 as percentage
    FROM (
      SELECT 
        u.id,
        COALESCE(SUM(o.total_amount), 0)::float8 as agent_sales
      FROM users u
      LEFT JOIN orders o ON u.id = o.salesman_id 
        AND o.tenant_id = $1 
        AND o.order_date >= $2 
        AND o.order_date <= $3
      WHERE u.tenant_id = $1 
        AND u.role = 'agent'
        AND u.status = 'active'
      GROUP BY u.id
    ) agent_totals
    GROUP BY 1
    ORDER BY 
      CASE 
        WHEN CASE 
          WHEN agent_sales = 0 THEN '0'
          WHEN agent_sales < 1000 THEN '1-999'
          WHEN agent_sales < 5000 THEN '1000-4999'
          WHEN agent_sales < 10000 THEN '5000-9999'
          ELSE '10000+'
        END = '0' THEN 1
        WHEN CASE 
          WHEN agent_sales = 0 THEN '0'
          WHEN agent_sales < 1000 THEN '1-999'
          WHEN agent_sales < 5000 THEN '1000-4999'
          WHEN agent_sales < 10000 THEN '5000-9999'
          ELSE '10000+'
        END = '1-999' THEN 2
        WHEN CASE 
          WHEN agent_sales = 0 THEN '0'
          WHEN agent_sales < 1000 THEN '1-999'
          WHEN agent_sales < 5000 THEN '1000-4999'
          WHEN agent_sales < 10000 THEN '5000-9999'
          ELSE '10000+'
        END = '1000-4999' THEN 3
        WHEN CASE 
          WHEN agent_sales = 0 THEN '0'
          WHEN agent_sales < 1000 THEN '1-999'
          WHEN agent_sales < 5000 THEN '1000-4999'
          WHEN agent_sales < 10000 THEN '5000-9999'
          ELSE '10000+'
        END = '5000-9999' THEN 4
        ELSE 5
      END
  `, [tenantId, dateFrom, dateTo]);
  
  const agentActivities = await getQuery(`
    SELECT 
      activity_type,
      COUNT(*)::int as count,
      ROUND((COUNT(*)::DECIMAL / NULLIF(SUM(COUNT(*)) OVER (), 0) * 100)::NUMERIC, 1)::float8 as percentage
    FROM (
      SELECT 'order' as activity_type FROM orders 
      WHERE tenant_id = $1 AND order_date >= $2 AND order_date <= $3
      UNION ALL
      SELECT 'visit' as activity_type FROM visits 
      WHERE tenant_id = $1 AND visit_date >= $2 AND visit_date <= $3
    ) activities
    GROUP BY activity_type
  `, [tenantId, dateFrom, dateTo]);
  
  res.json({
    success: true,
    data: {
      total_agents: agentCounts?.total_agents || 0,
      active_agents: agentCounts?.active_agents || 0,
      top_performers: topPerformers || [],
      performance_distribution: performanceDistribution || [],
      agent_activities: agentActivities || []
    }
  });
}));

// GET /api/analytics/customers - Customer analytics
router.get('/customers', asyncHandler(async (req, res) => {
  const tenantId = req.user.tenantId;
  const { start_date, end_date, date_from, date_to } = req.query;
  
  const startDate = start_date || date_from;
  const endDate = end_date || date_to;
  const dateFrom = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const dateTo = endDate || new Date().toISOString().split('T')[0];
  
  const customerMetrics = await getOneQuery(`
    SELECT 
      COUNT(DISTINCT c.id)::int as total_customers,
      COUNT(DISTINCT CASE 
        WHEN o.order_date >= $2 AND o.order_date <= $3 THEN c.id 
      END)::int as active_customers,
      COUNT(DISTINCT CASE 
        WHEN c.created_at >= $2 AND c.created_at <= $3 THEN c.id 
      END)::int as new_customers,
      0 as customer_retention_rate,
      COALESCE(AVG(customer_value.total_value), 0)::float8 as customer_lifetime_value
    FROM customers c
    LEFT JOIN orders o ON c.id = o.customer_id AND o.tenant_id = $1
    LEFT JOIN (
      SELECT customer_id, SUM(total_amount)::float8 as total_value
      FROM orders
      WHERE tenant_id = $1
      GROUP BY customer_id
    ) customer_value ON c.id = customer_value.customer_id
    WHERE c.tenant_id = $1 AND c.status = 'active'
  `, [tenantId, dateFrom, dateTo]);
  
  const customersByType = await getQuery(`
    SELECT 
      COALESCE(c.type, 'unknown') as type,
      COUNT(*)::int as count,
      ROUND((COUNT(*)::DECIMAL / NULLIF(SUM(COUNT(*)) OVER (), 0) * 100)::NUMERIC, 1)::float8 as percentage
    FROM customers c
    WHERE c.tenant_id = $1 AND c.status = 'active'
    GROUP BY c.type
    ORDER BY count DESC
  `, [tenantId]);
  
  res.json({
    success: true,
    data: {
      total_customers: customerMetrics?.total_customers || 0,
      active_customers: customerMetrics?.active_customers || 0,
      new_customers: customerMetrics?.new_customers || 0,
      customer_retention_rate: customerMetrics?.customer_retention_rate || 0,
      customer_lifetime_value: parseFloat((parseFloat(customerMetrics?.customer_lifetime_value) || 0).toFixed(2)),
      customers_by_type: customersByType || []
    }
  });
}));

// GET /api/analytics/products - Product analytics
router.get('/products', asyncHandler(async (req, res) => {
  const tenantId = req.user.tenantId;
  const { start_date, end_date, date_from, date_to } = req.query;
  
  const startDate = start_date || date_from;
  const endDate = end_date || date_to;
  const dateFrom = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const dateTo = endDate || new Date().toISOString().split('T')[0];
  
  const productCounts = await getOneQuery(`
    SELECT 
      COUNT(DISTINCT p.id)::int as total_products,
      COUNT(DISTINCT oi.product_id)::int as products_sold,
      0 as inventory_turnover
    FROM products p
    LEFT JOIN order_items oi ON p.id = oi.product_id
    LEFT JOIN orders o ON oi.order_id = o.id 
      AND o.tenant_id = $1 
      AND o.order_date >= $2 
      AND o.order_date <= $3
    WHERE p.tenant_id = $1 AND p.status = 'active'
  `, [tenantId, dateFrom, dateTo]);
  
  const topSellingProducts = await getQuery(`
    SELECT 
      p.id as product_id,
      p.name as product_name,
      SUM(oi.quantity)::float8 as quantity_sold,
      COALESCE(SUM(oi.line_total), 0)::float8 as revenue,
      0 as growth_rate
    FROM products p
    INNER JOIN order_items oi ON p.id = oi.product_id
    INNER JOIN orders o ON oi.order_id = o.id
    WHERE o.tenant_id = $1 
      AND o.order_date >= $2 
      AND o.order_date <= $3
    GROUP BY p.id, p.name
    ORDER BY revenue DESC
    LIMIT 10
  `, [tenantId, dateFrom, dateTo]);
  
  const slowMovingProducts = await getQuery(`
    SELECT 
      p.id as product_id,
      p.name as product_name,
      COALESCE(SUM(oi.quantity), 0)::float8 as quantity_sold,
      COALESCE(SUM(oi.line_total), 0)::float8 as revenue,
      0 as growth_rate
    FROM products p
    LEFT JOIN order_items oi ON p.id = oi.product_id
    LEFT JOIN orders o ON oi.order_id = o.id 
      AND o.tenant_id = $1 
      AND o.order_date >= $2 
      AND o.order_date <= $3
    WHERE p.tenant_id = $1 AND p.status = 'active'
    GROUP BY p.id, p.name
    HAVING COALESCE(SUM(oi.quantity), 0) < 10
    ORDER BY quantity_sold ASC
    LIMIT 10
  `, [tenantId, dateFrom, dateTo]);
  
  const stockLevels = await getQuery(`
    SELECT 
      p.id as product_id,
      p.name as product_name,
      COALESCE(SUM(inv.quantity_on_hand), 0)::float8 as current_stock,
      10 as minimum_stock,
      CASE 
        WHEN COALESCE(SUM(inv.quantity_on_hand), 0) = 0 THEN 'out_of_stock'
        WHEN COALESCE(SUM(inv.quantity_on_hand), 0) < 10 THEN 'low_stock'
        ELSE 'in_stock'
      END as status
    FROM products p
    LEFT JOIN inventory_stock inv ON p.id = inv.product_id AND inv.tenant_id = $1
    WHERE p.tenant_id = $1 AND p.status = 'active'
    GROUP BY p.id, p.name
    ORDER BY current_stock ASC
    LIMIT 20
  `, [tenantId]);
  
  res.json({
    success: true,
    data: {
      total_products: productCounts?.total_products || 0,
      products_sold: productCounts?.products_sold || 0,
      inventory_turnover: productCounts?.inventory_turnover || 0,
      top_selling_products: topSellingProducts || [],
      slow_moving_products: slowMovingProducts || [],
      stock_levels: stockLevels || []
    }
  });
}));

module.exports = router;
