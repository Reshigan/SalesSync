const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { getQuery, getOneQuery } = require('../utils/database');

// GET /api/dashboards/real-time-operations
router.get('/real-time-operations', asyncHandler(async (req, res) => {
  const tenantId = req.tenantId;
  
  const activeAgents = await getOneQuery(
    `SELECT COUNT(DISTINCT a.id) as count 
     FROM users WHERE role IN ('agent', 'sales_agent', 'field_agent') a 
     JOIN visits v ON a.id = v.agent_id 
     WHERE a.tenant_id = ? AND v.status = 'in_progress' 
     AND v.visit_date::date = DATE('now')`,
    [tenantId]
  );
  
  const todayVisits = await getOneQuery(
    `SELECT 
       COUNT(*) as total,
       COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed
     FROM visits 
     WHERE tenant_id = ? AND visit_date::date = DATE('now')`,
    [tenantId]
  );
  
  res.json({
    success: true,
    data: {
      active_agents: activeAgents?.count || 0,
      today_visits: todayVisits || { total: 0, completed: 0 }
    }
  });
}));

module.exports = router;
