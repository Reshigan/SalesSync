const express = require('express');
const router = express.Router();
const { authTenantMiddleware } = require('../middleware/authTenantMiddleware');

// Apply authentication middleware
router.use(authTenantMiddleware);

/**
 * @swagger
 * /api/performance/agents/{agentId}/metrics:
 *   get:
 *     summary: Get performance metrics for an agent
 *     tags: [Performance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: agentId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: metric_type
 *         schema:
 *           type: string
 *           enum: [sales, visits, conversion, efficiency]
 *       - in: query
 *         name: from_date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: to_date
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Agent performance metrics
 */
router.get('/agents/:agentId/metrics', async (req, res) => {
  try {
    const { getQuery } = await import('../utils/database.js');
    const { agentId } = req.params;
    const { metric_type, from_date, to_date } = req.query;
    
    let query = `
      SELECT *
      FROM performance_metrics
      WHERE tenant_id = ? AND agent_id = ?
    `;
    
    const params = [req.user.tenantId, agentId];
    
    if (metric_type) {
      query += ' AND metric_type = ?';
      params.push(metric_type);
    }
    
    if (from_date) {
      query += ' AND metric_date >= ?';
      params.push(from_date);
    }
    
    if (to_date) {
      query += ' AND metric_date <= ?';
      params.push(to_date);
    }
    
    query += ' ORDER BY metric_date DESC';
    
    const metrics = await getQuery(query, params);
    
    // Calculate statistics
    const stats = {
      total_metrics: metrics.length,
      avg_score: metrics.length > 0 ? metrics.reduce((sum, m) => sum + m.score, 0) / metrics.length : 0,
      max_score: metrics.length > 0 ? Math.max(...metrics.map(m => m.score)) : 0,
      min_score: metrics.length > 0 ? Math.min(...metrics.map(m => m.score)) : 0
    };
    
    res.json({
      success: true,
      data: metrics,
      stats
    });
  } catch (error) {
    console.error('Error fetching agent metrics:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch agent metrics', code: 'FETCH_ERROR' }
    });
  }
});

/**
 * @swagger
 * /api/performance/leaderboard:
 *   get:
 *     summary: Get performance leaderboard
 *     tags: [Performance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: metric_type
 *         schema:
 *           type: string
 *           enum: [sales, visits, conversion, efficiency]
 *         default: sales
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [today, week, month, quarter, year]
 *         default: month
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         default: 10
 *     responses:
 *       200:
 *         description: Performance leaderboard
 */
router.get('/leaderboard', async (req, res) => {
  try {
    const { getQuery } = await import('../utils/database.js');
    const { metric_type = 'sales', period = 'month', limit = 10 } = req.query;
    
    // Calculate date range based on period
    let dateFilter = '';
    switch (period) {
      case 'today':
        dateFilter = "AND metric_date = CURRENT_DATE";
        break;
      case 'week':
        dateFilter = "AND metric_date >= CURRENT_DATE - INTERVAL '7 days'";
        break;
      case 'month':
        dateFilter = "AND metric_date >= CURRENT_DATE - INTERVAL '30 days'";
        break;
      case 'quarter':
        dateFilter = "AND metric_date >= CURRENT_DATE - INTERVAL '90 days'";
        break;
      case 'year':
        dateFilter = "AND metric_date >= CURRENT_DATE - INTERVAL '365 days'";
        break;
    }
    
    const leaderboard = await getQuery(`
      SELECT 
        pm.agent_id,
        u.first_name || ' ' || u.last_name as agent_name,
        COUNT(*) as data_points,
        AVG(pm.value) as avg_value,
        SUM(pm.value) as total_value,
        AVG(pm.score) as avg_score,
        MAX(pm.score) as best_score
      FROM performance_metrics pm
      JOIN users a ON pm.agent_id = a.id
      JOIN users u ON a.user_id = u.id
      WHERE pm.tenant_id = ?
        AND pm.metric_type = ?
        ${dateFilter}
      GROUP BY pm.agent_id, agent_name
      ORDER BY avg_score DESC
      LIMIT ?
    `, [req.user.tenantId, metric_type, parseInt(limit)]);
    
    // Add ranks
    leaderboard.forEach((agent, index) => {
      agent.rank = index + 1;
      agent.badge = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : ''; 
    });
    
    res.json({
      success: true,
      data: leaderboard,
      meta: {
        metric_type,
        period,
        total_agents: leaderboard.length
      }
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch leaderboard', code: 'FETCH_ERROR' }
    });
  }
});

/**
 * @swagger
 * /api/performance/dashboard:
 *   get:
 *     summary: Get performance dashboard overview
 *     tags: [Performance]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Performance dashboard data
 */
router.get('/dashboard', async (req, res) => {
  try {
    const { getQuery } = await import('../utils/database.js');
    
    // Get today's metrics summary
    const todayMetrics = await getQuery(`
      SELECT 
        metric_type,
        COUNT(*) as agent_count,
        AVG(value) as avg_value,
        AVG(score) as avg_score,
        SUM(CASE WHEN score >= 80 THEN 1 ELSE 0 END) as excellent_count,
        SUM(CASE WHEN score >= 60 AND score < 80 THEN 1 ELSE 0 END) as good_count,
        SUM(CASE WHEN score < 60 THEN 1 ELSE 0 END) as needs_improvement_count
      FROM performance_metrics
      WHERE tenant_id = ?
        AND metric_date = CURRENT_DATE
      GROUP BY metric_type
    `, [req.user.tenantId]);
    
    // Get weekly trends
    const weeklyTrends = await getQuery(`
      SELECT 
        metric_date,
        metric_type,
        AVG(score) as avg_score,
        COUNT(*) as metric_count
      FROM performance_metrics
      WHERE tenant_id = ?
        AND metric_date >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY metric_date, metric_type
      ORDER BY metric_date DESC
    `, [req.user.tenantId]);
    
    // Get top performers
    const topPerformers = await getQuery(`
      SELECT 
        pm.agent_id,
        u.first_name || ' ' || u.last_name as agent_name,
        AVG(pm.score) as overall_score,
        COUNT(DISTINCT pm.metric_type) as metrics_tracked
      FROM performance_metrics pm
      JOIN users a ON pm.agent_id = a.id
      JOIN users u ON a.user_id = u.id
      WHERE pm.tenant_id = ?
        AND pm.metric_date >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY pm.agent_id, agent_name
      ORDER BY overall_score DESC
      LIMIT 5
    `, [req.user.tenantId]);
    
    // Get underperformers (need support)
    const needsSupport = await getQuery(`
      SELECT 
        pm.agent_id,
        u.first_name || ' ' || u.last_name as agent_name,
        AVG(pm.score) as overall_score,
        pm.metric_type as weakest_metric
      FROM performance_metrics pm
      JOIN users a ON pm.agent_id = a.id
      JOIN users u ON a.user_id = u.id
      WHERE pm.tenant_id = ?
        AND pm.metric_date >= CURRENT_DATE - INTERVAL '7 days'
        AND pm.score < 60
      GROUP BY pm.agent_id, agent_name, pm.metric_type
      ORDER BY overall_score ASC
      LIMIT 5
    `, [req.user.tenantId]);
    
    res.json({
      success: true,
      data: {
        today_metrics: todayMetrics,
        weekly_trends: weeklyTrends,
        top_performers: topPerformers,
        needs_support: needsSupport
      }
    });
  } catch (error) {
    console.error('Error fetching performance dashboard:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch dashboard data', code: 'FETCH_ERROR' }
    });
  }
});

/**
 * @swagger
 * /api/performance/analytics:
 *   get:
 *     summary: Get advanced analytics and insights
 *     tags: [Performance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [week, month, quarter, year]
 *         default: month
 *     responses:
 *       200:
 *         description: Advanced analytics data
 */
router.get('/analytics', async (req, res) => {
  try {
    const { getQuery } = await import('../utils/database.js');
    const { period = 'month' } = req.query;
    
    let days = 30;
    switch (period) {
      case 'week': days = 7; break;
      case 'month': days = 30; break;
      case 'quarter': days = 90; break;
      case 'year': days = 365; break;
    }
    
    // Sales trend analysis
    const salesTrend = await getQuery(`
      SELECT 
        metric_date,
        AVG(value) as avg_sales,
        MAX(value) as peak_sales,
        MIN(value) as min_sales,
        COUNT(*) as agents_active
      FROM performance_metrics
      WHERE tenant_id = ?
        AND metric_type = 'sales'
        AND metric_date >= date('now', '-${days} days')
      GROUP BY metric_date
      ORDER BY metric_date ASC
    `, [req.user.tenantId]);
    
    // Calculate growth rate
    let growthRate = 0;
    if (salesTrend.length >= 2) {
      const recent = salesTrend.slice(-7).reduce((sum, d) => sum + d.avg_sales, 0) / 7;
      const previous = salesTrend.slice(0, 7).reduce((sum, d) => sum + d.avg_sales, 0) / 7;
      growthRate = previous > 0 ? ((recent - previous) / previous) * 100 : 0;
    }
    
    // Conversion rate analysis
    const conversionAnalysis = await getQuery(`
      SELECT 
        AVG(value) * 100 as avg_conversion_rate,
        MAX(value) * 100 as best_conversion,
        MIN(value) * 100 as worst_conversion
      FROM performance_metrics
      WHERE tenant_id = ?
        AND metric_type = 'conversion'
        AND metric_date >= date('now', '-${days} days')
    `, [req.user.tenantId]);
    
    // Efficiency metrics
    const efficiencyMetrics = await getQuery(`
      SELECT 
        pm.agent_id,
        u.first_name || ' ' || u.last_name as agent_name,
        AVG(CASE WHEN pm.metric_type = 'sales' THEN pm.value ELSE 0 END) as avg_sales,
        AVG(CASE WHEN pm.metric_type = 'visits' THEN pm.value ELSE 0 END) as avg_visits,
        AVG(CASE WHEN pm.metric_type = 'conversion' THEN pm.value ELSE 0 END) as avg_conversion,
        (AVG(CASE WHEN pm.metric_type = 'sales' THEN pm.value ELSE 0 END) / 
         NULLIF(AVG(CASE WHEN pm.metric_type = 'visits' THEN pm.value ELSE 1 END), 0)) as sales_per_visit
      FROM performance_metrics pm
      JOIN users a ON pm.agent_id = a.id
      JOIN users u ON a.user_id = u.id
      WHERE pm.tenant_id = ?
        AND pm.metric_date >= date('now', '-${days} days')
      GROUP BY pm.agent_id, agent_name
      HAVING avg_visits > 0
      ORDER BY sales_per_visit DESC
      LIMIT 10
    `, [req.user.tenantId]);
    
    // Predictive insights (simple linear projection)
    const projectedSales = salesTrend.length > 0 
      ? salesTrend[salesTrend.length - 1].avg_sales * (1 + growthRate / 100) 
      : 0;
    
    res.json({
      success: true,
      data: {
        sales_trend: salesTrend,
        growth_rate: Math.round(growthRate * 100) / 100,
        projected_sales: Math.round(projectedSales),
        conversion_analysis: conversionAnalysis[0] || {},
        efficiency_metrics: efficiencyMetrics,
        insights: [
          {
            type: growthRate > 0 ? 'positive' : 'negative',
            message: `Sales are ${growthRate > 0 ? 'growing' : 'declining'} at ${Math.abs(growthRate).toFixed(1)}%`,
            priority: Math.abs(growthRate) > 10 ? 'high' : 'medium'
          },
          {
            type: 'info',
            message: `Average conversion rate is ${conversionAnalysis[0]?.avg_conversion_rate?.toFixed(1) || 0}%`,
            priority: 'medium'
          }
        ]
      },
      meta: {
        period,
        days_analyzed: days,
        data_points: salesTrend.length
      }
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch analytics', code: 'FETCH_ERROR' }
    });
  }
});

module.exports = router;
