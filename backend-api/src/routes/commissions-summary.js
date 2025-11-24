const express = require('express');
const router = express.Router();
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const { authMiddleware } = require('../middleware/authMiddleware');

// GET /api/commissions/summary - Get commission summary with targets
router.get('/summary', authMiddleware, asyncHandler(async (req, res) => {
  const { getQuery } = require('../utils/database');
  
  const { agent_id } = req.query;
  
  let query = `
    SELECT * FROM commission_summary
    WHERE tenant_id = $1
  `;
  
  const params = [req.tenantId];
  
  if (agent_id) {
    query += ` AND agent_id = $2`;
    params.push(agent_id);
  }
  
  query += ` ORDER BY agent_name`;
  
  const summary = await getQuery(query, params);
  
  res.json({
    success: true,
    data: summary
  });
}));

// GET /api/commissions/summary/:agent_id - Get commission summary for specific agent
router.get('/summary/:agent_id', authMiddleware, asyncHandler(async (req, res) => {
  const { getOneQuery } = require('../utils/database');
  
  const { agent_id } = req.params;
  
  const summary = await getOneQuery(`
    SELECT * FROM commission_summary
    WHERE tenant_id = $1 AND agent_id = $2
  `, [req.tenantId, agent_id]);
  
  if (!summary) {
    throw new AppError('Commission summary not found for this agent', 404);
  }
  
  res.json({
    success: true,
    data: summary
  });
}));

module.exports = router;
