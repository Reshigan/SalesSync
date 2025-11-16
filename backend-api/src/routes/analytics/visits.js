const express = require('express');
const router = express.Router();
const { getQuery, getOneQuery } = require('../../utils/database');

router.get('/', async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { from, to, interval = 'daily' } = req.query;

    const fromDate = from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const toDate = to || new Date().toISOString().split('T')[0];

    const kpis = await getOneQuery(`
      SELECT 
        SUM(visit_count) as total_visits,
        SUM(completed_visits) as completed_visits,
        SUM(planned_visits) as planned_visits,
        SUM(productive_visits) as productive_visits,
        AVG(avg_visits_per_agent) as avg_visits_per_agent
      FROM analytics.agg_visits_daily
      WHERE tenant_id = $1 AND date_id BETWEEN $2 AND $3
    `, [tenantId, fromDate, toDate]);

    const completionRate = kpis?.planned_visits > 0
      ? (kpis.completed_visits / kpis.planned_visits * 100).toFixed(2)
      : 0;
    
    const productivityRate = kpis?.completed_visits > 0
      ? (kpis.productive_visits / kpis.completed_visits * 100).toFixed(2)
      : 0;

    let dateGrouping;
    if (interval === 'weekly') {
      dateGrouping = "DATE_TRUNC('week', date_id)";
    } else if (interval === 'monthly') {
      dateGrouping = "DATE_TRUNC('month', date_id)";
    } else {
      dateGrouping = 'date_id';
    }

    const timeSeries = await getQuery(`
      SELECT 
        ${dateGrouping} as date,
        SUM(visit_count) as total_visits,
        SUM(completed_visits) as completed_visits,
        SUM(planned_visits) as planned_visits,
        SUM(productive_visits) as productive_visits
      FROM analytics.agg_visits_daily
      WHERE tenant_id = $1 AND date_id BETWEEN $2 AND $3
      GROUP BY ${dateGrouping}
      ORDER BY date
    `, [tenantId, fromDate, toDate]);

    const topAgents = await getQuery(`
      SELECT 
        u.id,
        CONCAT(u.first_name, ' ', u.last_name) as agent_name,
        COUNT(v.id) as visit_count,
        COUNT(CASE WHEN v.status = 'completed' THEN 1 END) as completed_visits,
        COUNT(CASE WHEN v.is_productive = true THEN 1 END) as productive_visits
      FROM users u
      JOIN visits v ON v.agent_id = u.id
      WHERE v.tenant_id = $1 AND v.created_at::date BETWEEN $2 AND $3
      GROUP BY u.id, u.first_name, u.last_name
      ORDER BY visit_count DESC
      LIMIT 10
    `, [tenantId, fromDate, toDate]);

    res.json({
      success: true,
      data: {
        kpis: {
          total_visits: parseInt(kpis?.total_visits || 0),
          completed_visits: parseInt(kpis?.completed_visits || 0),
          planned_visits: parseInt(kpis?.planned_visits || 0),
          productive_visits: parseInt(kpis?.productive_visits || 0),
          avg_visits_per_agent: parseFloat(kpis?.avg_visits_per_agent || 0),
          completion_rate: parseFloat(completionRate),
          productivity_rate: parseFloat(productivityRate)
        },
        time_series: timeSeries,
        top_agents: topAgents,
        period: {
          from: fromDate,
          to: toDate,
          interval
        }
      }
    });
  } catch (error) {
    console.error('Error fetching visits analytics:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
