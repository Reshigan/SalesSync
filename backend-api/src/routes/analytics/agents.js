const express = require('express');
const router = express.Router();
const { getQuery, getOneQuery } = require('../../utils/database');

router.get('/', async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { from, to } = req.query;

    const fromDate = from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const toDate = to || new Date().toISOString().split('T')[0];

    const kpis = await getOneQuery(`
      SELECT 
        COUNT(DISTINCT u.id) as total_agents,
        COUNT(DISTINCT CASE WHEN u.status = 'active' THEN u.id END) as active_agents
      FROM users u
      WHERE u.tenant_id = $1 AND u.role = 'agent'
    `, [tenantId]);

    const agentPerformance = await getQuery(`
      SELECT 
        u.id,
        CONCAT(u.first_name, ' ', u.last_name) as agent_name,
        u.email,
        u.status,
        COUNT(DISTINCT v.id) as visit_count,
        COUNT(DISTINCT o.id) as order_count,
        COALESCE(SUM(o.total_amount), 0) as total_sales,
        COUNT(DISTINCT bp.id) as board_placements,
        COUNT(DISTINCT pd.id) as product_distributions,
        COALESCE(SUM(cl.amount), 0) as total_commissions
      FROM users u
      LEFT JOIN visits v ON v.agent_id = u.id AND v.created_at::date BETWEEN $2 AND $3
      LEFT JOIN orders o ON o.salesman_id = u.id AND o.created_at::date BETWEEN $2 AND $3
      LEFT JOIN board_placements bp ON bp.created_by = u.id AND bp.created_at::date BETWEEN $2 AND $3
      LEFT JOIN product_distributions pd ON pd.created_by = u.id AND pd.created_at::date BETWEEN $2 AND $3
      LEFT JOIN commission_ledgers cl ON cl.agent_id = u.id AND cl.created_at::date BETWEEN $2 AND $3
      WHERE u.tenant_id = $1 AND u.role = 'agent'
      GROUP BY u.id, u.first_name, u.last_name, u.email, u.status
      ORDER BY total_sales DESC
    `, [tenantId, fromDate, toDate]);

    const agentPerformanceWithScore = agentPerformance.map(agent => ({
      ...agent,
      productivity_score: parseInt(agent.visit_count) + parseInt(agent.order_count) + 
                         parseInt(agent.board_placements) + parseInt(agent.product_distributions),
      total_sales: parseFloat(agent.total_sales),
      total_commissions: parseFloat(agent.total_commissions)
    }));

    const topPerformers = agentPerformanceWithScore
      .sort((a, b) => b.productivity_score - a.productivity_score)
      .slice(0, 10);

    const agentsByTerritory = await getQuery(`
      SELECT 
        t.name as territory_name,
        COUNT(DISTINCT u.id) as agent_count,
        COUNT(DISTINCT CASE WHEN u.status = 'active' THEN u.id END) as active_agents
      FROM territories t
      LEFT JOIN users u ON u.territory_id = t.id AND u.role = 'agent'
      WHERE t.tenant_id = $1
      GROUP BY t.id, t.name
      ORDER BY agent_count DESC
    `, [tenantId]);

    res.json({
      success: true,
      data: {
        kpis: {
          total_agents: parseInt(kpis?.total_agents || 0),
          active_agents: parseInt(kpis?.active_agents || 0)
        },
        agent_performance: agentPerformanceWithScore,
        top_performers: topPerformers,
        agents_by_territory: agentsByTerritory,
        period: {
          from: fromDate,
          to: toDate
        }
      }
    });
  } catch (error) {
    console.error('Error fetching agents analytics:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
