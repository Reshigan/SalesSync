const express = require('express');
const router = express.Router();

// Lazy load database functions to avoid circular dependencies
const getDatabase = () => require('../database/database');

// Sales Analytics
router.get('/sales', async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { date_from, date_to, agent_id, customer_id } = req.query;
    
    const db = getDatabase();
    
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
    const salesSummary = await new Promise((resolve, reject) => {
      db.get(`
        SELECT 
          COUNT(*) as total_orders,
          SUM(o.total_amount) as total_revenue,
          AVG(o.total_amount) as avg_order_value,
          COUNT(DISTINCT o.customer_id) as unique_customers,
          COUNT(DISTINCT o.salesman_id) as active_agents
        FROM orders o
        WHERE o.tenant_id = ? ${dateFilter}
      `, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    // Daily sales trend
    const dailySales = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          DATE(o.order_date) as date,
          COUNT(*) as orders,
          SUM(o.total_amount) as revenue
        FROM orders o
        WHERE o.tenant_id = ? ${dateFilter}
        GROUP BY DATE(o.order_date)
        ORDER BY DATE(o.order_date)
      `, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    // Top products
    const topProducts = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          p.name as product_name,
          SUM(oi.quantity) as total_quantity,
          SUM(oi.line_total) as total_revenue
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        JOIN products p ON oi.product_id = p.id
        WHERE o.tenant_id = ? ${dateFilter}
        GROUP BY p.id, p.name
        ORDER BY total_revenue DESC
        LIMIT 10
      `, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    // Top agents
    const topAgents = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          u.first_name || ' ' || u.last_name as agent_name,
          COUNT(o.id) as total_orders,
          SUM(o.total_amount) as total_revenue
        FROM orders o
        JOIN agents a ON o.salesman_id = a.id
        JOIN users u ON a.user_id = u.id
        WHERE o.tenant_id = ? ${dateFilter}
        GROUP BY a.id, u.first_name, u.last_name
        ORDER BY total_revenue DESC
        LIMIT 10
      `, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    res.json({
      success: true,
      data: {
        summary: salesSummary,
        daily_trend: dailySales,
        top_products: topProducts,
        top_agents: topAgents
      }
    });
  } catch (error) {
    console.error('Error fetching sales analytics:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Visit Analytics
router.get('/visits', async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { date_from, date_to } = req.query;
    
    const db = getDatabase();
    
    let dateFilter = '';
    const params = [tenantId];
    
    if (date_from && date_to) {
      dateFilter = 'AND v.visit_date BETWEEN ? AND ?';
      params.push(date_from, date_to);
    } else {
      dateFilter = 'AND v.visit_date >= DATE("now", "-30 days")';
    }
    
    // Visit summary
    const visitSummary = await new Promise((resolve, reject) => {
      db.get(`
        SELECT 
          COUNT(*) as total_visits,
          SUM(CASE WHEN v.status = 'completed' THEN 1 ELSE 0 END) as completed_visits,
          AVG(CASE WHEN v.check_in_time IS NOT NULL AND v.check_out_time IS NOT NULL 
              THEN (julianday(v.check_out_time) - julianday(v.check_in_time)) * 24 * 60 
              ELSE NULL END) as avg_duration_minutes,
          COUNT(DISTINCT v.agent_id) as active_agents,
          COUNT(DISTINCT v.customer_id) as customers_visited
        FROM visits v
        WHERE v.tenant_id = ? ${dateFilter}
      `, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    // Daily visit trend
    const dailyVisits = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          DATE(v.visit_date) as date,
          COUNT(*) as total_visits,
          SUM(CASE WHEN v.status = 'completed' THEN 1 ELSE 0 END) as completed_visits
        FROM visits v
        WHERE v.tenant_id = ? ${dateFilter}
        GROUP BY DATE(v.visit_date)
        ORDER BY DATE(v.visit_date)
      `, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    // Agent performance
    const agentPerformance = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          u.first_name || ' ' || u.last_name as agent_name,
          COUNT(v.id) as total_visits,
          SUM(CASE WHEN v.status = 'completed' THEN 1 ELSE 0 END) as completed_visits,
          ROUND(AVG(CASE WHEN v.check_in_time IS NOT NULL AND v.check_out_time IS NOT NULL 
              THEN (julianday(v.check_out_time) - julianday(v.check_in_time)) * 24 * 60 
              ELSE NULL END), 2) as avg_duration_minutes
        FROM visits v
        JOIN agents a ON v.agent_id = a.id
        JOIN users u ON a.user_id = u.id
        WHERE v.tenant_id = ? ${dateFilter}
        GROUP BY a.id, u.first_name, u.last_name
        ORDER BY completed_visits DESC
        LIMIT 10
      `, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    res.json({
      success: true,
      data: {
        summary: visitSummary,
        daily_trend: dailyVisits,
        agent_performance: agentPerformance
      }
    });
  } catch (error) {
    console.error('Error fetching visit analytics:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Customer Analytics
router.get('/customers', async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { date_from, date_to } = req.query;
    
    const db = getDatabase();
    
    let dateFilter = '';
    const params = [tenantId];
    
    if (date_from && date_to) {
      dateFilter = 'AND o.order_date BETWEEN ? AND ?';
      params.push(date_from, date_to);
    } else {
      dateFilter = 'AND o.order_date >= DATE("now", "-30 days")';
    }
    
    // Customer summary
    const customerSummary = await new Promise((resolve, reject) => {
      db.get(`
        SELECT 
          COUNT(DISTINCT c.id) as total_customers,
          COUNT(DISTINCT CASE WHEN o.id IS NOT NULL THEN c.id END) as active_customers,
          AVG(customer_orders.order_count) as avg_orders_per_customer,
          AVG(customer_orders.total_spent) as avg_spent_per_customer
        FROM customers c
        LEFT JOIN (
          SELECT 
            customer_id,
            COUNT(*) as order_count,
            SUM(total_amount) as total_spent
          FROM orders 
          WHERE tenant_id = ? ${dateFilter}
          GROUP BY customer_id
        ) customer_orders ON c.id = customer_orders.customer_id
        WHERE c.tenant_id = ?
      `, [...params, tenantId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    // Top customers by revenue
    const topCustomers = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          c.name as customer_name,
          COUNT(o.id) as total_orders,
          SUM(o.total_amount) as total_spent,
          MAX(o.order_date) as last_order_date
        FROM customers c
        JOIN orders o ON c.id = o.customer_id
        WHERE c.tenant_id = ? ${dateFilter}
        GROUP BY c.id, c.name
        ORDER BY total_spent DESC
        LIMIT 10
      `, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    // Customer segmentation by order frequency
    const customerSegmentation = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          CASE 
            WHEN order_count >= 10 THEN 'High Frequency'
            WHEN order_count >= 5 THEN 'Medium Frequency'
            WHEN order_count >= 1 THEN 'Low Frequency'
            ELSE 'No Orders'
          END as segment,
          COUNT(*) as customer_count,
          AVG(total_spent) as avg_spent
        FROM (
          SELECT 
            c.id,
            COUNT(o.id) as order_count,
            COALESCE(SUM(o.total_amount), 0) as total_spent
          FROM customers c
          LEFT JOIN orders o ON c.id = o.customer_id AND o.tenant_id = ? ${dateFilter}
          WHERE c.tenant_id = ?
          GROUP BY c.id
        ) customer_stats
        GROUP BY segment
        ORDER BY customer_count DESC
      `, [...params, tenantId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    res.json({
      success: true,
      data: {
        summary: customerSummary,
        top_customers: topCustomers,
        segmentation: customerSegmentation
      }
    });
  } catch (error) {
    console.error('Error fetching customer analytics:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Product Analytics
router.get('/products', async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { date_from, date_to } = req.query;
    
    const db = getDatabase();
    
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
        LEFT JOIN orders o ON oi.order_id = o.id AND o.tenant_id = ? ${dateFilter}
        WHERE p.tenant_id = ?
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
        LEFT JOIN orders o ON oi.order_id = o.id AND o.tenant_id = ? ${dateFilter}
        WHERE p.tenant_id = ?
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
    
    const db = getDatabase();
    
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
        WHERE p.tenant_id = ?
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
        WHERE p.tenant_id = ? AND i.quantity_on_hand <= 10
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
        WHERE w.tenant_id = ?
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
    
    const db = getDatabase();
    
    // Today's metrics
    const todayMetrics = await new Promise((resolve, reject) => {
      db.get(`
        SELECT 
          COUNT(DISTINCT o.id) as today_orders,
          COALESCE(SUM(o.total_amount), 0) as today_revenue,
          COUNT(DISTINCT v.id) as today_visits,
          COUNT(DISTINCT CASE WHEN v.status = 'completed' THEN v.id END) as today_completed_visits
        FROM orders o
        FULL OUTER JOIN visits v ON DATE(o.order_date) = DATE(v.visit_date) AND o.tenant_id = v.tenant_id
        WHERE (o.tenant_id = ? OR v.tenant_id = ?) 
          AND (DATE(o.order_date) = DATE('now') OR DATE(v.visit_date) = DATE('now'))
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
        WHERE o.tenant_id = ?
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
        JOIN agents a ON v.agent_id = a.id
        JOIN users u ON a.user_id = u.id
        WHERE v.tenant_id = ?
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

module.exports = router;
