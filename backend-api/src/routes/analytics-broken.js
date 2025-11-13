const express = require('express');
const { getQuery, getOneQuery, runQuery } = require('../utils/database');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { getQuery, getOneQuery } = require('../utils/database');

// Sales Analytics
router.get('/sales', asyncHandler(async (req, res) => {
  const tenantId = req.user.tenantId;
  const { date_from, date_to, agent_id, customer_id } = req.query;
  
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
    WHERE o.tenant_id = $1 ${dateFilter}
  `, params);
  
  // Daily sales trend
  const dailySales = await getQuery(`
    SELECT 
      o.order_date::date as date,
      COUNT(*) as orders,
      COALESCE(SUM(o.total_amount), 0) as revenue
    FROM orders o
    WHERE o.tenant_id = $1 ${dateFilter}
    GROUP BY o.order_date::date
    ORDER BY o.order_date::date
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
    WHERE o.tenant_id = $1 ${dateFilter}
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
    JOIN users a ON o.salesman_id = a.id
    JOIN users u ON a.user_id = u.id
    WHERE o.tenant_id = $1 ${dateFilter}
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
    WHERE v.tenant_id = $1 ${dateFilter}
  `, params);
  
  // Daily visit trend
  const dailyVisits = await getQuery(`
    SELECT 
      v.visit_date::date as date,
      COUNT(*) as total_visits,
      SUM(CASE WHEN v.status = 'completed' THEN 1 ELSE 0 END) as completed_visits
    FROM visits v
    WHERE v.tenant_id = $1 ${dateFilter}
    GROUP BY v.visit_date::date
    ORDER BY v.visit_date::date
  `, params);
  
  // Agent performance
  const agentPerformance = await getQuery(`
    SELECT 
      u.first_name || ' ' || u.last_name as agent_name,
      COUNT(v.id) as total_visits,
      SUM(CASE WHEN v.status = 'completed' THEN 1 ELSE 0 END) as completed_visits,
      COALESCE(ROUND(AVG(CASE WHEN v.check_in_time IS NOT NULL AND v.check_out_time IS NOT NULL 
          THEN (julianday(v.check_out_time) - julianday(v.check_in_time)) * 24 * 60 
          ELSE NULL END), 2), 0) as avg_duration_minutes
    FROM visits v
    JOIN users a ON v.agent_id = a.id
    JOIN users u ON a.user_id = u.id
    WHERE v.tenant_id = $1 ${dateFilter}
    GROUP BY a.id, u.first_name, u.last_name
    ORDER BY completed_visits DESC
    LIMIT 10
  `, params);
  
  res.json({
    success: true,
    data: {
      summary: visitSummary || { total_visits: 0, completed_visits: 0, avg_duration_minutes: 0, active_agents: 0, customers_visited: 0 },
      daily_trend: dailyVisits || [],
      agent_performance: agentPerformance || []
    }
  });
}));

// Customer Analytics
router.get('/customers', asyncHandler(async (req, res) => {
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
  
  // Customer summary
  const customerSummary = await getOneQuery(`
    SELECT 
      COUNT(DISTINCT c.id) as total_customers,
      COUNT(DISTINCT CASE WHEN customer_orders.order_count IS NOT NULL THEN c.id END) as active_customers,
      COALESCE(AVG(customer_orders.order_count), 0) as avg_orders_per_customer,
      COALESCE(AVG(customer_orders.total_spent), 0) as avg_spent_per_customer
    FROM customers c
    LEFT JOIN (
      SELECT 
        customer_id,
        COUNT(*) as order_count,
        SUM(total_amount) as total_spent
      FROM orders o
      WHERE o.tenant_id = $1 ${dateFilter}
      GROUP BY customer_id
    ) customer_orders ON c.id = customer_orders.customer_id
    WHERE c.tenant_id = $1
  `, [...params, tenantId]);
  
  // Top customers by revenue
  const topCustomers = await getQuery(`
    SELECT 
      c.name as customer_name,
      COUNT(o.id) as total_orders,
      COALESCE(SUM(o.total_amount), 0) as total_spent,
      MAX(o.order_date) as last_order_date
    FROM customers c
    JOIN orders o ON c.id = o.customer_id
    WHERE c.tenant_id = $1 ${dateFilter}
    GROUP BY c.id, c.name
    ORDER BY total_spent DESC
    LIMIT 10
  `, params);
  
  // Customer segmentation by order frequency
  const customerSegmentation = await getQuery(`
    SELECT 
      CASE 
        WHEN order_count >= 10 THEN 'High Frequency'
        WHEN order_count >= 5 THEN 'Medium Frequency'
        WHEN order_count >= 1 THEN 'Low Frequency'
        ELSE 'No Orders'
      END as segment,
      COUNT(*) as customer_count,
      COALESCE(AVG(total_spent), 0) as avg_spent
    FROM (
      SELECT 
        c.id,
        COUNT(o.id) as order_count,
        COALESCE(SUM(o.total_amount), 0) as total_spent
      FROM customers c
      LEFT JOIN orders o ON c.id = o.customer_id AND o.tenant_id = $1 ${dateFilter}
      WHERE c.tenant_id = $1
      GROUP BY c.id
    ) customer_stats
    GROUP BY segment
    ORDER BY customer_count DESC
  `, [...params, tenantId]);
  
  res.json({
    success: true,
    data: {
      summary: customerSummary || { total_customers: 0, active_customers: 0, avg_orders_per_customer: 0, avg_spent_per_customer: 0 },
      top_customers: topCustomers || [],
      segmentation: customerSegmentation || []
    }
  });
}));

// Product Analytics
router.get('/products', async (req, res) => {
  try {
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
    
    // Product performance
    const productPerformance = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          p.name as product_name,
          c.name as category_name,
          SUM(oi.quantity) as total_quantity_sold,
          SUM(oi.line_total) as total_revenue,
          COUNT(DISTINCT o.customer_id) as unique_customers,
          AVG(oi.unit_price) as avg_selling_price
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN order_items oi ON p.id = oi.product_id
        LEFT JOIN orders o ON oi.order_id = o.id AND o.tenant_id = $1 ${dateFilter}
        WHERE p.tenant_id = $1
        GROUP BY p.id, p.name, c.name
        ORDER BY total_revenue DESC
        LIMIT 20
      `, [...params, tenantId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    // Category performance
    const categoryPerformance = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          COALESCE(c.name, 'Uncategorized') as category_name,
          COUNT(DISTINCT p.id) as product_count,
          SUM(oi.quantity) as total_quantity_sold,
          SUM(oi.line_total) as total_revenue
        FROM categories c
        RIGHT JOIN products p ON c.id = p.category_id
        LEFT JOIN order_items oi ON p.id = oi.product_id
        LEFT JOIN orders o ON oi.order_id = o.id AND o.tenant_id = $1 ${dateFilter}
        WHERE p.tenant_id = $1
        GROUP BY c.id, c.name
        ORDER BY total_revenue DESC
      `, [...params, tenantId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    res.json({
      success: true,
      data: {
        product_performance: productPerformance,
        category_performance: categoryPerformance
      }
    });
  } catch (error) {
    console.error('Error fetching product analytics:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Inventory Analytics
router.get('/inventory', async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    
    // Inventory summary
    const inventorySummary = await new Promise((resolve, reject) => {
      db.get(`
        SELECT 
          COUNT(DISTINCT p.id) as total_products,
          SUM(i.quantity_on_hand) as total_stock_units,
          SUM(i.quantity_on_hand * i.cost_price) as total_stock_value,
          COUNT(CASE WHEN i.quantity_on_hand <= 10 THEN 1 END) as low_stock_products,
          COUNT(CASE WHEN i.quantity_on_hand = 0 THEN 1 END) as out_of_stock_products
        FROM products p
        LEFT JOIN inventory_stock i ON p.id = i.product_id
        WHERE p.tenant_id = $1
      `, [tenantId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    // Low stock alerts
    const lowStockProducts = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          p.name as product_name,
          w.name as warehouse_name,
          i.quantity_on_hand,
          i.quantity_reserved,
          i.cost_price,
          (i.quantity_on_hand * i.cost_price) as stock_value
        FROM products p
        JOIN inventory_stock i ON p.id = i.product_id
        JOIN warehouses w ON i.warehouse_id = w.id
        WHERE p.tenant_id = $1 AND i.quantity_on_hand <= 10
        ORDER BY i.quantity_on_hand ASC
        LIMIT 20
      `, [tenantId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    // Warehouse stock levels
    const warehouseStock = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          w.name as warehouse_name,
          COUNT(DISTINCT i.product_id) as product_count,
          SUM(i.quantity_on_hand) as total_units,
          SUM(i.quantity_on_hand * i.cost_price) as total_value
        FROM warehouses w
        LEFT JOIN inventory_stock i ON w.id = i.warehouse_id
        WHERE w.tenant_id = $1
        GROUP BY w.id, w.name
        ORDER BY total_value DESC
      `, [tenantId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    res.json({
      success: true,
      data: {
        summary: inventorySummary,
        low_stock_alerts: lowStockProducts,
        warehouse_stock: warehouseStock
      }
    });
  } catch (error) {
    console.error('Error fetching inventory analytics:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Dashboard overview
router.get('/dashboard', async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    
    // Today's metrics
    const todayMetrics = await new Promise((resolve, reject) => {
      db.get(`
        SELECT 
          COUNT(DISTINCT o.id) as today_orders,
          COALESCE(SUM(o.total_amount), 0) as today_revenue,
          COUNT(DISTINCT v.id) as today_visits,
          COUNT(DISTINCT CASE WHEN v.status = 'completed' THEN v.id END) as today_completed_visits
        FROM orders o
        FULL OUTER JOIN visits v ON o.order_date::date = v.visit_date::date AND o.tenant_id = v.tenant_id
        WHERE (o.tenant_id = $1 OR v.tenant_id = $2) 
          AND (o.order_date::date = DATE('now') OR v.visit_date::date = DATE('now'))
      `, [tenantId, tenantId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    // Recent activity
    const recentOrders = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          o.order_number,
          c.name as customer_name,
          o.total_amount,
          o.order_status,
          o.created_at
        FROM orders o
        JOIN customers c ON o.customer_id = c.id
        WHERE o.tenant_id = $1
        ORDER BY o.created_at DESC
        LIMIT 5
      `, [tenantId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    const recentVisits = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          c.name as customer_name,
          u.first_name || ' ' || u.last_name as agent_name,
          v.visit_type,
          v.status,
          v.created_at
        FROM visits v
        JOIN customers c ON v.customer_id = c.id
        JOIN users a ON v.agent_id = a.id
        JOIN users u ON a.user_id = u.id
        WHERE v.tenant_id = $1
        ORDER BY v.created_at DESC
        LIMIT 5
      `, [tenantId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    res.json({
      success: true,
      data: {
        today_metrics: todayMetrics,
        recent_orders: recentOrders,
        recent_visits: recentVisits
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard analytics:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Revenue Analytics - specific endpoint for tests
router.get('/revenue', async (req, res) => {
  try {
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
    
    const revenueData = await new Promise((resolve, reject) => {
      db.get(`
        SELECT 
          SUM(o.total_amount) as total_revenue,
          COUNT(*) as total_orders,
          AVG(o.total_amount) as avg_order_value,
          COUNT(DISTINCT o.customer_id) as unique_customers
        FROM orders o
        WHERE o.tenant_id = $1 ${dateFilter}
      `, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    const dailyRevenue = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          o.order_date::date as date,
          SUM(o.total_amount) as revenue,
          COUNT(*) as orders
        FROM orders o
        WHERE o.tenant_id = $1 ${dateFilter}
        GROUP BY o.order_date::date
        ORDER BY o.order_date::date
      `, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    res.json({
      success: true,
      data: {
        summary: revenueData,
        daily_breakdown: dailyRevenue
      }
    });
  } catch (error) {
    console.error('Error fetching revenue analytics:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Order Analytics - specific endpoint for tests
router.get('/orders', async (req, res) => {
  try {
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
    
    const orderStats = await new Promise((resolve, reject) => {
      db.get(`
        SELECT 
          COUNT(*) as total_orders,
          SUM(CASE WHEN o.order_status = 'completed' THEN 1 ELSE 0 END) as completed_orders,
          SUM(CASE WHEN o.order_status = 'pending' THEN 1 ELSE 0 END) as pending_orders,
          SUM(CASE WHEN o.order_status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_orders,
          AVG(o.total_amount) as avg_order_value
        FROM orders o
        WHERE o.tenant_id = $1 ${dateFilter}
      `, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    const ordersByStatus = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          o.order_status as status,
          COUNT(*) as count,
          SUM(o.total_amount) as total_value
        FROM orders o
        WHERE o.tenant_id = $1 ${dateFilter}
        GROUP BY o.order_status
        ORDER BY count DESC
      `, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    res.json({
      success: true,
      data: {
        summary: orderStats,
        by_status: ordersByStatus
      }
    });
  } catch (error) {
    console.error('Error fetching order analytics:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Top Products - specific endpoint for tests
router.get('/top-products', async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { date_from, date_to, limit = 10 } = req.query;
    
    let dateFilter = '';
    const params = [tenantId];
    
    if (date_from && date_to) {
      dateFilter = 'AND o.order_date BETWEEN ? AND ?';
      params.push(date_from, date_to);
    } else {
      dateFilter = 'AND o.order_date >= DATE("now", "-30 days")';
    }
    
    params.push(parseInt(limit));
    
    const topProducts = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          p.id,
          p.name as product_name,
          p.code as product_code,
          SUM(oi.quantity) as total_quantity_sold,
          SUM(oi.line_total) as total_revenue,
          COUNT(DISTINCT o.customer_id) as unique_customers,
          AVG(oi.unit_price) as avg_price
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        JOIN products p ON oi.product_id = p.id
        WHERE o.tenant_id = $1 ${dateFilter}
        GROUP BY p.id, p.name, p.code
        ORDER BY total_revenue DESC
        LIMIT ?
      `, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    res.json({
      success: true,
      data: {
        top_products: topProducts,
        period: date_from && date_to $1 `${date_from} to ${date_to}` : 'Last 30 days'
      }
    });
  } catch (error) {
    console.error('Error fetching top products:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Top Customers - specific endpoint for tests
router.get('/top-customers', async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { date_from, date_to, limit = 10 } = req.query;
    
    let dateFilter = '';
    const params = [tenantId];
    
    if (date_from && date_to) {
      dateFilter = 'AND o.order_date BETWEEN ? AND ?';
      params.push(date_from, date_to);
    } else {
      dateFilter = 'AND o.order_date >= DATE("now", "-30 days")';
    }
    
    params.push(parseInt(limit));
    
    const topCustomers = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          c.id,
          c.name as customer_name,
          c.code as customer_code,
          COUNT(o.id) as total_orders,
          SUM(o.total_amount) as total_spent,
          AVG(o.total_amount) as avg_order_value,
          MAX(o.order_date) as last_order_date
        FROM customers c
        JOIN orders o ON c.id = o.customer_id
        WHERE c.tenant_id = $1 ${dateFilter}
        GROUP BY c.id, c.name, c.code
        ORDER BY total_spent DESC
        LIMIT ?
      `, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    res.json({
      success: true,
      data: {
        top_customers: topCustomers,
        period: date_from && date_to $1 `${date_from} to ${date_to}` : 'Last 30 days'
      }
    });
  } catch (error) {
    console.error('Error fetching top customers:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Agent Performance - specific endpoint for tests
router.get('/agent-performance', async (req, res) => {
  try {
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
    
    const agentPerformance = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          a.id as agent_id,
          u.first_name || ' ' || u.last_name as agent_name,
          u.email as agent_email,
          COUNT(DISTINCT o.id) as total_orders,
          SUM(o.total_amount) as total_revenue,
          AVG(o.total_amount) as avg_order_value,
          COUNT(DISTINCT o.customer_id) as unique_customers,
          COUNT(DISTINCT v.id) as total_visits
        FROM users WHERE role IN ('agent', 'sales_agent', 'field_agent') a
        JOIN users u ON a.user_id = u.id
        LEFT JOIN orders o ON a.id = o.salesman_id AND o.tenant_id = $1 ${dateFilter}
        LEFT JOIN visits v ON a.id = v.agent_id AND v.tenant_id = $1 ${dateFilter.replace('o.order_date', 'v.visit_date')}
        WHERE a.tenant_id = $1
        GROUP BY a.id, u.first_name, u.last_name, u.email
        ORDER BY total_revenue DESC
      `, [...params, ...params, tenantId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    res.json({
      success: true,
      data: {
        agent_performance: agentPerformance,
        period: date_from && date_to $1 `${date_from} to ${date_to}` : 'Last 30 days'
      }
    });
  } catch (error) {
    console.error('Error fetching agent performance:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
