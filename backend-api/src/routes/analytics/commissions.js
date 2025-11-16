const express = require('express');
const router = express.Router();
const { getQuery, getOneQuery } = require('../../utils/database');

router.get('/', async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { from, to, interval = 'daily', status } = req.query;

    const fromDate = from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const toDate = to || new Date().toISOString().split('T')[0];

    const kpis = await getOneQuery(`
      SELECT 
        SUM(total_commissions) as total_commissions,
        SUM(pending_commissions) as pending_commissions,
        SUM(approved_commissions) as approved_commissions,
        SUM(paid_commissions) as paid_commissions,
        SUM(commission_count) as total_commission_count,
        AVG(avg_commission_per_agent) as avg_commission_per_agent
      FROM analytics.agg_commissions_daily
      WHERE tenant_id = $1 AND date_id BETWEEN $2 AND $3
    `, [tenantId, fromDate, toDate]);

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
        SUM(total_commissions) as total,
        SUM(pending_commissions) as pending,
        SUM(approved_commissions) as approved,
        SUM(paid_commissions) as paid
      FROM analytics.agg_commissions_daily
      WHERE tenant_id = $1 AND date_id BETWEEN $2 AND $3
      GROUP BY ${dateGrouping}
      ORDER BY date
    `, [tenantId, fromDate, toDate]);

    const topAgents = await getQuery(`
      SELECT 
        u.id,
        CONCAT(u.first_name, ' ', u.last_name) as agent_name,
        COUNT(cl.id) as commission_count,
        SUM(cl.amount) as total_earnings,
        SUM(CASE WHEN cl.status = 'pending' THEN cl.amount ELSE 0 END) as pending,
        SUM(CASE WHEN cl.status = 'approved' THEN cl.amount ELSE 0 END) as approved,
        SUM(CASE WHEN cl.status = 'paid' THEN cl.amount ELSE 0 END) as paid
      FROM users u
      JOIN commission_ledgers cl ON cl.agent_id = u.id
      WHERE cl.tenant_id = $1 AND cl.created_at::date BETWEEN $2 AND $3
      GROUP BY u.id, u.first_name, u.last_name
      ORDER BY total_earnings DESC
      LIMIT 10
    `, [tenantId, fromDate, toDate]);

    const byType = await getQuery(`
      SELECT 
        type,
        COUNT(*) as count,
        SUM(amount) as total_amount
      FROM commission_ledgers
      WHERE tenant_id = $1 AND created_at::date BETWEEN $2 AND $3
      GROUP BY type
      ORDER BY total_amount DESC
    `, [tenantId, fromDate, toDate]);

    res.json({
      success: true,
      data: {
        kpis: {
          total_commissions: parseFloat(kpis?.total_commissions || 0),
          pending_commissions: parseFloat(kpis?.pending_commissions || 0),
          approved_commissions: parseFloat(kpis?.approved_commissions || 0),
          paid_commissions: parseFloat(kpis?.paid_commissions || 0),
          total_commission_count: parseInt(kpis?.total_commission_count || 0),
          avg_commission_per_agent: parseFloat(kpis?.avg_commission_per_agent || 0)
        },
        time_series: timeSeries,
        top_agents: topAgents,
        by_type: byType,
        period: {
          from: fromDate,
          to: toDate,
          interval
        }
      }
    });
  } catch (error) {
    console.error('Error fetching commissions analytics:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
