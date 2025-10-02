const express = require('express');
const { getQuery, getOneQuery } = require('../database/init');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * @swagger
 * /api/dashboard:
 *   get:
 *     summary: Get dashboard overview data
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data retrieved successfully
 */
router.get('/', asyncHandler(async (req, res, next) => {
  try {
    // Get basic counts
    const [
      userCount,
      customerCount,
      productCount,
      orderCount,
      todayOrderCount,
      todayRevenue,
      activeAgentCount
    ] = await Promise.all([
      getOneQuery('SELECT COUNT(*) as count FROM users WHERE tenant_id = ? AND status = ?', [req.tenantId, 'active']),
      getOneQuery('SELECT COUNT(*) as count FROM customers WHERE tenant_id = ? AND status = ?', [req.tenantId, 'active']),
      getOneQuery('SELECT COUNT(*) as count FROM products WHERE tenant_id = ? AND status = ?', [req.tenantId, 'active']),
      getOneQuery('SELECT COUNT(*) as count FROM orders WHERE tenant_id = ?', [req.tenantId]),
      getOneQuery('SELECT COUNT(*) as count FROM orders WHERE tenant_id = ? AND DATE(created_at) = DATE("now")', [req.tenantId]),
      getOneQuery('SELECT COALESCE(SUM(total_amount), 0) as revenue FROM orders WHERE tenant_id = ? AND DATE(created_at) = DATE("now") AND order_status != "cancelled"', [req.tenantId]),
      getOneQuery('SELECT COUNT(*) as count FROM agents WHERE tenant_id = ? AND status = ?', [req.tenantId, 'active'])
    ]);

    // Get recent orders
    const recentOrders = await getQuery(`
      SELECT 
        o.id, o.order_number, o.order_date, o.total_amount, o.order_status,
        c.name as customer_name,
        u.first_name as salesman_first_name, u.last_name as salesman_last_name
      FROM orders o
      JOIN customers c ON c.id = o.customer_id
      LEFT JOIN agents a ON a.id = o.salesman_id
      LEFT JOIN users u ON u.id = a.user_id
      WHERE o.tenant_id = ?
      ORDER BY o.created_at DESC
      LIMIT 5
    `, [req.tenantId]);

    // Get top customers by sales
    const topCustomers = await getQuery(`
      SELECT 
        c.id, c.name, c.type,
        COUNT(o.id) as order_count,
        COALESCE(SUM(o.total_amount), 0) as total_sales
      FROM customers c
      LEFT JOIN orders o ON o.customer_id = c.id AND o.order_status != 'cancelled'
      WHERE c.tenant_id = ? AND c.status = 'active'
      GROUP BY c.id
      ORDER BY total_sales DESC
      LIMIT 5
    `, [req.tenantId]);

    // Get sales by month (last 6 months)
    const salesByMonth = await getQuery(`
      SELECT 
        strftime('%Y-%m', o.order_date) as month,
        COUNT(o.id) as order_count,
        COALESCE(SUM(o.total_amount), 0) as total_sales
      FROM orders o
      WHERE o.tenant_id = ? 
        AND o.order_status != 'cancelled'
        AND o.order_date >= date('now', '-6 months')
      GROUP BY strftime('%Y-%m', o.order_date)
      ORDER BY month ASC
    `, [req.tenantId]);

    // Get agent performance
    const agentPerformance = await getQuery(`
      SELECT 
        u.first_name, u.last_name, a.agent_type,
        COUNT(o.id) as order_count,
        COALESCE(SUM(o.total_amount), 0) as total_sales,
        COUNT(DISTINCT v.id) as visit_count
      FROM agents a
      JOIN users u ON u.id = a.user_id
      LEFT JOIN orders o ON o.salesman_id = a.id AND o.order_status != 'cancelled'
      LEFT JOIN visits v ON v.agent_id = a.id
      WHERE a.tenant_id = ? AND a.status = 'active'
      GROUP BY a.id
      ORDER BY total_sales DESC
      LIMIT 5
    `, [req.tenantId]);

    res.json({
      success: true,
      data: {
        overview: {
          totalUsers: userCount.count,
          totalCustomers: customerCount.count,
          totalProducts: productCount.count,
          totalOrders: orderCount.count,
          todayOrders: todayOrderCount.count,
          todayRevenue: parseFloat(todayRevenue.revenue) || 0,
          activeAgents: activeAgentCount.count
        },
        recentOrders,
        topCustomers,
        salesByMonth,
        agentPerformance
      }
    });

  } catch (error) {
    next(error);
  }
}));

/**
 * @swagger
 * /api/dashboard/stats:
 *   get:
 *     summary: Get detailed dashboard statistics
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [today, week, month, quarter, year]
 *           default: month
 *     responses:
 *       200:
 *         description: Dashboard statistics retrieved successfully
 */
router.get('/stats', asyncHandler(async (req, res, next) => {
  const period = req.query.period || 'month';
  
  try {
    let dateFilter = '';
    switch (period) {
      case 'today':
        dateFilter = 'DATE(created_at) = DATE("now")';
        break;
      case 'week':
        dateFilter = 'created_at >= date("now", "-7 days")';
        break;
      case 'month':
        dateFilter = 'created_at >= date("now", "-1 month")';
        break;
      case 'quarter':
        dateFilter = 'created_at >= date("now", "-3 months")';
        break;
      case 'year':
        dateFilter = 'created_at >= date("now", "-1 year")';
        break;
      default:
        dateFilter = 'created_at >= date("now", "-1 month")';
    }

    // Get period statistics
    const [
      orderStats,
      revenueStats,
      visitStats,
      customerStats
    ] = await Promise.all([
      getOneQuery(`
        SELECT 
          COUNT(*) as total_orders,
          COUNT(CASE WHEN order_status = 'completed' THEN 1 END) as completed_orders,
          COUNT(CASE WHEN order_status = 'pending' THEN 1 END) as pending_orders,
          COUNT(CASE WHEN order_status = 'cancelled' THEN 1 END) as cancelled_orders
        FROM orders 
        WHERE tenant_id = ? AND ${dateFilter}
      `, [req.tenantId]),
      
      getOneQuery(`
        SELECT 
          COALESCE(SUM(total_amount), 0) as total_revenue,
          COALESCE(AVG(total_amount), 0) as avg_order_value,
          COALESCE(MAX(total_amount), 0) as max_order_value
        FROM orders 
        WHERE tenant_id = ? AND order_status != 'cancelled' AND ${dateFilter}
      `, [req.tenantId]),
      
      getOneQuery(`
        SELECT 
          COUNT(*) as total_visits,
          COUNT(CASE WHEN outcome = 'successful' THEN 1 END) as successful_visits,
          COUNT(DISTINCT customer_id) as unique_customers_visited
        FROM visits 
        WHERE tenant_id = ? AND ${dateFilter}
      `, [req.tenantId]),
      
      getOneQuery(`
        SELECT 
          COUNT(CASE WHEN ${dateFilter} THEN 1 END) as new_customers
        FROM customers 
        WHERE tenant_id = ?
      `, [req.tenantId])
    ]);

    res.json({
      success: true,
      data: {
        period,
        orders: orderStats,
        revenue: {
          ...revenueStats,
          total_revenue: parseFloat(revenueStats.total_revenue) || 0,
          avg_order_value: parseFloat(revenueStats.avg_order_value) || 0,
          max_order_value: parseFloat(revenueStats.max_order_value) || 0
        },
        visits: visitStats,
        customers: customerStats
      }
    });

  } catch (error) {
    next(error);
  }
}));

module.exports = router;