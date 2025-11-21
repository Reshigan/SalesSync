const express = require('express');
const router = express.Router();
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const { authMiddleware } = require('../middleware/authMiddleware');

/**
 * @swagger
 * /api/team-hierarchy:
 *   get:
 *     summary: Get team hierarchy
 *     tags: [Team Hierarchy]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: leader_id
 *         schema:
 *           type: string
 *         description: Filter by leader ID
 *       - in: query
 *         name: agent_id
 *         schema:
 *           type: string
 *         description: Filter by agent ID
 *     responses:
 *       200:
 *         description: Team hierarchy retrieved successfully
 */
router.get('/', authMiddleware, asyncHandler(async (req, res) => {
  const { getQuery } = require('../utils/database');
  
  const { leader_id, agent_id } = req.query;
  
  let query = `
    SELECT 
      th.*,
      l.first_name || ' ' || l.last_name as leader_name,
      l.email as leader_email,
      l.role as leader_role,
      a.first_name || ' ' || a.last_name as agent_name,
      a.email as agent_email,
      a.role as agent_role
    FROM user_hierarchy th
    JOIN users l ON l.id = th.leader_id
    JOIN users a ON a.id = th.agent_id
    WHERE th.tenant_id = $1
    AND (th.effective_end IS NULL OR th.effective_end >= CURRENT_DATE)
  `;
  
  const params = [req.tenantId];
  
  if (leader_id) {
    query += ` AND th.leader_id = $${params.length + 1}`;
    params.push(leader_id);
  }
  
  if (agent_id) {
    query += ` AND th.agent_id = $${params.length + 1}`;
    params.push(agent_id);
  }
  
  query += ` ORDER BY th.created_at DESC`;
  
  const hierarchy = await getQuery(query, params);
  
  res.json({
    success: true,
    data: hierarchy
  });
}));

/**
 * @swagger
 * /api/team-hierarchy/leader/{leader_id}/agents:
 *   get:
 *     summary: Get all agents under a team leader
 *     tags: [Team Hierarchy]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: leader_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Team agents retrieved successfully
 */
router.get('/leader/:leader_id/agents', authMiddleware, asyncHandler(async (req, res) => {
  const { getQuery } = require('../utils/database');
  
  const { leader_id } = req.params;
  
  const agents = await getQuery(`
    SELECT 
      a.*,
      th.effective_start,
      th.effective_end,
      COUNT(o.id) as order_count,
      COALESCE(SUM(o.total_amount), 0) as total_sales,
      COUNT(v.id) as visit_count
    FROM user_hierarchy th
    JOIN users a ON a.id = th.agent_id
    LEFT JOIN orders o ON o.salesman_id = a.id AND o.order_status NOT IN ('cancelled', 'rejected')
    LEFT JOIN visits v ON v.agent_id = a.id
    WHERE th.tenant_id = $1
    AND th.leader_id = $2
    AND (th.effective_end IS NULL OR th.effective_end >= CURRENT_DATE)
    GROUP BY a.id, th.effective_start, th.effective_end
    ORDER BY a.first_name, a.last_name
  `, [req.tenantId, leader_id]);
  
  res.json({
    success: true,
    data: agents
  });
}));

/**
 * @swagger
 * /api/team-hierarchy:
 *   post:
 *     summary: Assign agent to team leader
 *     tags: [Team Hierarchy]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - leader_id
 *               - agent_id
 *             properties:
 *               leader_id:
 *                 type: string
 *               agent_id:
 *                 type: string
 *               effective_start:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Agent assigned to team leader successfully
 */
router.post('/', authMiddleware, asyncHandler(async (req, res) => {
  const { getOneQuery, runQuery } = require('../utils/database');
  
  const {
    leader_id,
    agent_id,
    effective_start = new Date().toISOString().split('T')[0]
  } = req.body;
  
  if (!leader_id || !agent_id) {
    throw new AppError('Leader ID and agent ID are required', 400);
  }
  
  const leader = await getOneQuery(`
    SELECT id, role FROM users
    WHERE id = $1 AND tenant_id = $2 AND status = 'active'
  `, [leader_id, req.tenantId]);
  
  if (!leader) {
    throw new AppError('Team leader not found', 404);
  }
  
  // Validate agent exists
  const agent = await getOneQuery(`
    SELECT id, role FROM users
    WHERE id = $1 AND tenant_id = $2 AND status = 'active'
  `, [agent_id, req.tenantId]);
  
  if (!agent) {
    throw new AppError('Agent not found', 404);
  }
  
  if (leader_id === agent_id) {
    throw new AppError('Agent cannot be their own team leader', 400);
  }
  
  await runQuery(`
    UPDATE user_hierarchy
    SET effective_end = CURRENT_DATE - INTERVAL '1 day'
    WHERE tenant_id = $1
    AND agent_id = $2
    AND effective_end IS NULL
  `, [req.tenantId, agent_id]);
  
  const result = await getOneQuery(`
    INSERT INTO user_hierarchy (
      tenant_id, leader_id, agent_id, effective_start
    ) VALUES ($1, $2, $3, $4)
    RETURNING *
  `, [req.tenantId, leader_id, agent_id, effective_start]);
  
  await runQuery(`
    UPDATE users
    SET manager_id = $1, updated_at = CURRENT_TIMESTAMP
    WHERE id = $2 AND tenant_id = $3
  `, [leader_id, agent_id, req.tenantId]);
  
  res.status(201).json({
    success: true,
    data: result
  });
}));

/**
 * @swagger
 * /api/team-hierarchy/{id}:
 *   delete:
 *     summary: Remove agent from team leader
 *     tags: [Team Hierarchy]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Agent removed from team leader successfully
 */
router.delete('/:id', authMiddleware, asyncHandler(async (req, res) => {
  const { getOneQuery, runQuery } = require('../utils/database');
  
  const { id } = req.params;
  
  const hierarchy = await getOneQuery(`
    SELECT * FROM user_hierarchy
    WHERE id = $1 AND tenant_id = $2
  `, [id, req.tenantId]);
  
  if (!hierarchy) {
    throw new AppError('Team hierarchy record not found', 404);
  }
  
  await runQuery(`
    UPDATE user_hierarchy
    SET effective_end = CURRENT_DATE
    WHERE id = $1 AND tenant_id = $2
  `, [id, req.tenantId]);
  
  await runQuery(`
    UPDATE users
    SET manager_id = NULL, updated_at = CURRENT_TIMESTAMP
    WHERE id = $1 AND tenant_id = $2
  `, [hierarchy.agent_id, req.tenantId]);
  
  res.json({
    success: true,
    message: 'Agent removed from team leader successfully'
  });
}));

module.exports = router;
