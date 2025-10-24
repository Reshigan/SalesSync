const express = require('express');
const router = express.Router();
const { authenticateToken } = require('./auth-complete');

// GET /api/widgets - Get all available widgets
router.get('/', authenticateToken, (req, res) => {
  const widgets = [
    {
      id: 'sales_overview',
      name: 'Sales Overview',
      category: 'sales',
      description: 'Total sales, revenue, and growth metrics',
      default_size: { width: 4, height: 2 }
    },
    {
      id: 'top_products',
      name: 'Top Products',
      category: 'sales',
      description: 'Best selling products',
      default_size: { width: 3, height: 2 }
    },
    {
      id: 'recent_orders',
      name: 'Recent Orders',
      category: 'orders',
      description: 'Latest customer orders',
      default_size: { width: 4, height: 3 }
    },
    {
      id: 'inventory_status',
      name: 'Inventory Status',
      category: 'inventory',
      description: 'Stock levels and alerts',
      default_size: { width: 3, height: 2 }
    },
    {
      id: 'revenue_chart',
      name: 'Revenue Chart',
      category: 'finance',
      description: 'Revenue trends over time',
      default_size: { width: 6, height: 3 }
    },
    {
      id: 'customer_growth',
      name: 'Customer Growth',
      category: 'crm',
      description: 'New customers over time',
      default_size: { width: 3, height: 2 }
    },
    {
      id: 'pending_invoices',
      name: 'Pending Invoices',
      category: 'finance',
      description: 'Unpaid invoices',
      default_size: { width: 3, height: 2 }
    },
    {
      id: 'field_agents_map',
      name: 'Field Agents Map',
      category: 'field_ops',
      description: 'Live agent locations',
      default_size: { width: 6, height: 4 }
    },
    {
      id: 'tasks_today',
      name: 'Tasks Today',
      category: 'general',
      description: 'Today\'s pending tasks',
      default_size: { width: 3, height: 2 }
    },
    {
      id: 'notifications_feed',
      name: 'Notifications',
      category: 'general',
      description: 'Recent notifications',
      default_size: { width: 3, height: 3 }
    },
    {
      id: 'kpi_summary',
      name: 'KPI Summary',
      category: 'general',
      description: 'Key performance indicators',
      default_size: { width: 12, height: 2 }
    },
    {
      id: 'low_stock_alerts',
      name: 'Low Stock Alerts',
      category: 'inventory',
      description: 'Products running low',
      default_size: { width: 3, height: 2 }
    },
    {
      id: 'commission_tracker',
      name: 'Commission Tracker',
      category: 'commissions',
      description: 'Agent commissions this month',
      default_size: { width: 4, height: 2 }
    },
    {
      id: 'campaign_performance',
      name: 'Campaign Performance',
      category: 'marketing',
      description: 'Marketing campaign metrics',
      default_size: { width: 6, height: 3 }
    },
    {
      id: 'territory_coverage',
      name: 'Territory Coverage',
      category: 'territories',
      description: 'Territory assignment status',
      default_size: { width: 4, height: 3 }
    }
  ];

  res.json({
    success: true,
    widgets
  });
});

// GET /api/widgets/user-layout - Get user's dashboard layout
router.get('/user-layout', authenticateToken, (req, res) => {
  const db = req.app.locals.db;

  db.get(
    'SELECT * FROM dashboard_layouts WHERE user_id = ?',
    [req.user.id],
    (err, layout) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!layout) {
        // Return default layout
        return res.json({
          success: true,
          layout: {
            widgets: [
              { id: 'sales_overview', position: { x: 0, y: 0, w: 4, h: 2 } },
              { id: 'recent_orders', position: { x: 4, y: 0, w: 4, h: 2 } },
              { id: 'inventory_status', position: { x: 8, y: 0, w: 4, h: 2 } },
              { id: 'revenue_chart', position: { x: 0, y: 2, w: 6, h: 3 } },
              { id: 'tasks_today', position: { x: 6, y: 2, w: 3, h: 2 } },
              { id: 'notifications_feed', position: { x: 9, y: 2, w: 3, h: 2 } }
            ]
          }
        });
      }

      res.json({
        success: true,
        layout: JSON.parse(layout.layout_data)
      });
    }
  );
});

// POST /api/widgets/user-layout - Save user's dashboard layout
router.post('/user-layout', authenticateToken, (req, res) => {
  const db = req.app.locals.db;
  const { widgets } = req.body;

  if (!widgets || !Array.isArray(widgets)) {
    return res.status(400).json({ error: 'Widgets array is required' });
  }

  const layoutData = JSON.stringify({ widgets });

  db.run(
    `INSERT INTO dashboard_layouts (user_id, layout_data) 
     VALUES (?, ?)
     ON CONFLICT(user_id) DO UPDATE SET layout_data = ?, updated_at = datetime('now')`,
    [req.user.id, layoutData, layoutData],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Error saving layout' });
      }

      res.json({
        success: true,
        message: 'Dashboard layout saved'
      });
    }
  );
});

// GET /api/widgets/:widgetId/data - Get data for a specific widget
router.get('/:widgetId/data', authenticateToken, async (req, res) => {
  const db = req.app.locals.db;
  const { widgetId } = req.params;

  try {
    let data = {};

    switch (widgetId) {
      case 'sales_overview':
        // Get total sales, revenue, growth
        const salesData = await new Promise((resolve, reject) => {
          db.get(
            `SELECT 
              COUNT(*) as total_orders,
              SUM(total_amount) as total_revenue,
              AVG(total_amount) as avg_order_value
            FROM orders 
            WHERE status != 'cancelled'`,
            [],
            (err, row) => err ? reject(err) : resolve(row)
          );
        });
        data = salesData;
        break;

      case 'top_products':
        data = await new Promise((resolve, reject) => {
          db.all(
            `SELECT p.name, SUM(oi.quantity) as total_sold 
            FROM order_items oi
            JOIN products p ON p.id = oi.product_id
            GROUP BY p.id
            ORDER BY total_sold DESC
            LIMIT 5`,
            [],
            (err, rows) => err ? reject(err) : resolve(rows)
          );
        });
        break;

      case 'recent_orders':
        data = await new Promise((resolve, reject) => {
          db.all(
            `SELECT o.*, c.name as customer_name
            FROM orders o
            LEFT JOIN customers c ON c.id = o.customer_id
            ORDER BY o.order_date DESC
            LIMIT 10`,
            [],
            (err, rows) => err ? reject(err) : resolve(rows)
          );
        });
        break;

      case 'inventory_status':
        data = await new Promise((resolve, reject) => {
          db.get(
            `SELECT 
              COUNT(*) as total_products,
              SUM(CASE WHEN quantity < 10 THEN 1 ELSE 0 END) as low_stock_count,
              SUM(CASE WHEN quantity = 0 THEN 1 ELSE 0 END) as out_of_stock_count
            FROM inventory`,
            [],
            (err, row) => err ? reject(err) : resolve(row)
          );
        });
        break;

      case 'revenue_chart':
        data = await new Promise((resolve, reject) => {
          db.all(
            `SELECT 
              DATE(order_date) as date,
              SUM(total_amount) as revenue
            FROM orders
            WHERE order_date >= date('now', '-30 days')
            GROUP BY DATE(order_date)
            ORDER BY date`,
            [],
            (err, rows) => err ? reject(err) : resolve(rows)
          );
        });
        break;

      case 'customer_growth':
        data = await new Promise((resolve, reject) => {
          db.all(
            `SELECT 
              DATE(created_at) as date,
              COUNT(*) as new_customers
            FROM customers
            WHERE created_at >= date('now', '-30 days')
            GROUP BY DATE(created_at)
            ORDER BY date`,
            [],
            (err, rows) => err ? reject(err) : resolve(rows)
          );
        });
        break;

      case 'pending_invoices':
        data = await new Promise((resolve, reject) => {
          db.all(
            `SELECT invoice_number, amount, due_date, status
            FROM invoices
            WHERE status IN ('sent', 'overdue')
            ORDER BY due_date
            LIMIT 10`,
            [],
            (err, rows) => err ? reject(err) : resolve(rows)
          );
        });
        break;

      case 'low_stock_alerts':
        data = await new Promise((resolve, reject) => {
          db.all(
            `SELECT p.name, i.quantity, p.unit_price
            FROM inventory i
            JOIN products p ON p.id = i.product_id
            WHERE i.quantity < 10
            ORDER BY i.quantity
            LIMIT 10`,
            [],
            (err, rows) => err ? reject(err) : resolve(rows)
          );
        });
        break;

      case 'kpi_summary':
        // Get multiple KPIs
        const kpis = await new Promise((resolve, reject) => {
          Promise.all([
            new Promise((res, rej) => db.get('SELECT COUNT(*) as count FROM orders WHERE status = "pending"', [], (e, r) => e ? rej(e) : res(r))),
            new Promise((res, rej) => db.get('SELECT SUM(total_amount) as revenue FROM orders WHERE order_date >= date("now", "-30 days")', [], (e, r) => e ? rej(e) : res(r))),
            new Promise((res, rej) => db.get('SELECT COUNT(*) as count FROM customers WHERE status = "active"', [], (e, r) => e ? rej(e) : res(r))),
            new Promise((res, rej) => db.get('SELECT COUNT(*) as count FROM products WHERE status = "active"', [], (e, r) => e ? rej(e) : res(r)))
          ])
            .then(results => resolve({
              pending_orders: results[0].count,
              monthly_revenue: results[1].revenue || 0,
              active_customers: results[2].count,
              active_products: results[3].count
            }))
            .catch(reject);
        });
        data = kpis;
        break;

      default:
        return res.status(404).json({ error: 'Widget not found' });
    }

    res.json({
      success: true,
      widgetId,
      data
    });
  } catch (error) {
    console.error(`Error fetching widget data for ${widgetId}:`, error);
    res.status(500).json({ error: 'Error fetching widget data' });
  }
});

// POST /api/widgets/:widgetId/refresh - Trigger widget data refresh
router.post('/:widgetId/refresh', authenticateToken, (req, res) => {
  // In a real implementation, this might trigger a background job
  // For now, just return success
  res.json({
    success: true,
    message: 'Widget refresh triggered'
  });
});

module.exports = router;
