const express = require('express');
// Database functions will be lazy-loaded to avoid circular dependencies
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
  // Lazy-load database functions
  const { getOneQuery, getQuery } = require('../database/init');
  
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
  // Lazy-load database functions
  const { getOneQuery } = require('../database/init');
  
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

/**
 * @swagger
 * /api/dashboard/activities:
 *   get:
 *     summary: Get recent activities feed
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Recent activities retrieved successfully
 */
router.get('/activities', asyncHandler(async (req, res, next) => {
  // Lazy-load database functions
  const { getQuery } = require('../database/init');
  
  const limit = parseInt(req.query.limit) || 20;
  
  try {
    // Get recent activities from multiple sources and combine them
    
    // 1. Recent Orders
    const recentOrders = await getQuery(`
      SELECT 
        'order' as type,
        o.id,
        o.order_number as reference,
        'Order ' || o.order_number || ' placed' as description,
        c.name as customer_name,
        u.first_name || ' ' || u.last_name as agent_name,
        o.total_amount as amount,
        o.order_status as status,
        o.created_at as timestamp,
        'Order placed by ' || u.first_name || ' ' || u.last_name || ' for ' || c.name as detail
      FROM orders o
      JOIN customers c ON c.id = o.customer_id
      LEFT JOIN agents a ON a.id = o.salesman_id
      LEFT JOIN users u ON u.id = a.user_id
      WHERE o.tenant_id = ?
      ORDER BY o.created_at DESC
      LIMIT ?
    `, [req.tenantId, Math.floor(limit / 3)]);

    // 2. Recent Visits
    const recentVisits = await getQuery(`
      SELECT 
        'visit' as type,
        v.id,
        'VISIT-' || substr(v.id, 1, 8) as reference,
        'Customer visit completed' as description,
        c.name as customer_name,
        u.first_name || ' ' || u.last_name as agent_name,
        NULL as amount,
        v.status,
        v.created_at as timestamp,
        u.first_name || ' ' || u.last_name || ' visited ' || c.name || ' (' || v.visit_type || ')' as detail
      FROM visits v
      JOIN customers c ON c.id = v.customer_id
      JOIN agents a ON a.id = v.agent_id
      JOIN users u ON u.id = a.user_id
      WHERE v.tenant_id = ?
      ORDER BY v.created_at DESC
      LIMIT ?
    `, [req.tenantId, Math.floor(limit / 3)]);

    // 3. Recent Van Loads
    const recentVanLoads = await getQuery(`
      SELECT 
        'van_load' as type,
        vl.id,
        'VL-' || substr(vl.id, 1, 8) as reference,
        'Van loaded for the day' as description,
        NULL as customer_name,
        u.first_name || ' ' || u.last_name as agent_name,
        vl.cash_float as amount,
        vl.status,
        vl.created_at as timestamp,
        'Van loaded by ' || u.first_name || ' ' || u.last_name || ' on ' || date(vl.load_date) as detail
      FROM van_loads vl
      JOIN agents a ON a.id = vl.salesman_id
      JOIN users u ON u.id = a.user_id
      WHERE vl.tenant_id = ?
      ORDER BY vl.created_at DESC
      LIMIT ?
    `, [req.tenantId, Math.floor(limit / 3)]);

    // Combine all activities and sort by timestamp
    const allActivities = [
      ...recentOrders.map(a => ({
        ...a,
        icon: 'package',
        color: a.status === 'delivered' ? 'green' : a.status === 'pending' ? 'yellow' : 'blue'
      })),
      ...recentVisits.map(a => ({
        ...a,
        icon: 'map-pin',
        color: a.status === 'completed' ? 'green' : 'blue'
      })),
      ...recentVanLoads.map(a => ({
        ...a,
        icon: 'truck',
        color: a.status === 'loading' ? 'yellow' : a.status === 'loaded' ? 'green' : 'blue'
      }))
    ];

    // Sort by timestamp descending
    allActivities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Limit to requested amount
    const activities = allActivities.slice(0, limit);

    // Calculate time ago for each activity
    const activitiesWithTimeAgo = activities.map(activity => {
      const now = new Date();
      const activityDate = new Date(activity.timestamp);
      const diffMs = now - activityDate;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      let timeAgo;
      if (diffMins < 1) {
        timeAgo = 'Just now';
      } else if (diffMins < 60) {
        timeAgo = `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
      } else if (diffHours < 24) {
        timeAgo = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      } else {
        timeAgo = `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
      }

      return {
        ...activity,
        timeAgo,
        timestamp: activity.timestamp // Keep original timestamp
      };
    });

    res.json({
      success: true,
      data: {
        activities: activitiesWithTimeAgo,
        total: activitiesWithTimeAgo.length
      }
    });

  } catch (error) {
    console.error('Activities fetch error:', error);
    next(error);
  }
}));

module.exports = router;