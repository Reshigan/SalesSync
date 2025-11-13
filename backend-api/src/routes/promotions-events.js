const express = require('express');
const router = express.Router();
const { authTenantMiddleware } = require('../middleware/authTenantMiddleware');

// Apply authentication middleware
router.use(authTenantMiddleware);

/**
 * @swagger
 * components:
 *   schemas:
 *     Promotion:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         promotion_type:
 *           type: string
 *           enum: [discount, bogo, cashback, loyalty, sampling]
 *         start_date:
 *           type: string
 *           format: date
 *         end_date:
 *           type: string
 *           format: date
 *         budget:
 *           type: number
 *         target_audience:
 *           type: string
 *         status:
 *           type: string
 *           enum: [draft, active, paused, completed, cancelled]
 *         roi_target:
 *           type: number
 *         actual_roi:
 *           type: number
 *     Event:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         event_type:
 *           type: string
 *           enum: [activation, sampling, demo, training, launch]
 *         location:
 *           type: string
 *         start_datetime:
 *           type: string
 *           format: date-time
 *         end_datetime:
 *           type: string
 *           format: date-time
 *         assigned_agents:
 *           type: array
 *           items:
 *             type: string
 *         budget:
 *           type: number
 *         status:
 *           type: string
 *           enum: [planned, active, completed, cancelled]
 */

// PROMOTIONS ENDPOINTS

/**
 * @swagger
 * /api/promotions-events/promotions:
 *   get:
 *     summary: Get all promotions
 *     tags: [Promotions & Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by promotion status
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filter by promotion type
 *       - in: query
 *         name: date_from
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter from date
 *       - in: query
 *         name: date_to
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter to date
 *     responses:
 *       200:
 *         description: List of promotions
 */
router.get('/promotions', async (req, res) => {
  try {
    const { getQuery } = await import('../utils/database.js');
    const { status, type, date_from, date_to } = req.query;
    
    let query = `
      SELECT p.*, 
             COUNT(pa.id) as total_assignments,
             0 as total_spent,
             0 as avg_satisfaction
      FROM promotions p
      LEFT JOIN promotion_assignments pa ON p.id = pa.promotion_id
      WHERE p.tenant_id = ?
    `;
    
    const params = [req.user.tenantId];
    
    if (status) {
      query += ' AND p.status = ?';
      params.push(status);
    }
    
    if (type) {
      query += ' AND p.promotion_type = ?';
      params.push(type);
    }
    
    if (date_from) {
      query += ' AND p.start_date >= ?';
      params.push(date_from);
    }
    
    if (date_to) {
      query += ' AND p.end_date <= ?';
      params.push(date_to);
    }
    
    query += ' GROUP BY p.id ORDER BY p.created_at DESC';
    
    const promotions = await getQuery(query, params);
    
    // Calculate ROI for each promotion
    promotions.forEach(promotion => {
      if (promotion.total_spent > 0 && promotion.budget > 0) {
        promotion.actual_roi = (promotion.total_spent / promotion.budget) * 100;
      } else {
        promotion.actual_roi = 0;
      }
    });
    
    res.json({
      success: true,
      data: { promotions }
    });
  } catch (error) {
    console.error('Error fetching promotions:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch promotions', code: 'FETCH_ERROR' }
    });
  }
});

/**
 * @swagger
 * /api/promotions-events/promotions:
 *   post:
 *     summary: Create a new promotion
 *     tags: [Promotions & Events]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - promotion_type
 *               - start_date
 *               - end_date
 *               - budget
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               promotion_type:
 *                 type: string
 *               start_date:
 *                 type: string
 *                 format: date
 *               end_date:
 *                 type: string
 *                 format: date
 *               budget:
 *                 type: number
 *               target_audience:
 *                 type: string
 *               roi_target:
 *                 type: number
 *     responses:
 *       201:
 *         description: Promotion created successfully
 */
router.post('/promotions', async (req, res) => {
  try {
    const { runQuery } = await import('../utils/database.js');
    const { 
      name, 
      description, 
      promotion_type, 
      start_date, 
      end_date, 
      budget, 
      target_audience, 
      roi_target 
    } = req.body;
    
    if (!name || !promotion_type || !start_date || !end_date || !budget) {
      return res.status(400).json({
        success: false,
        error: { message: 'Missing required fields', code: 'VALIDATION_ERROR' }
      });
    }
    
    const result = await runQuery(`
      INSERT INTO promotions (
        tenant_id, name, description, promotion_type, 
        start_date, end_date, budget, target_audience, 
        roi_target, status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft')
    `, [
      req.user.tenantId, 
      name, 
      description, 
      promotion_type, 
      start_date, 
      end_date, 
      budget, 
      target_audience, 
      roi_target || 0
    ]);
    
    res.status(201).json({
      success: true,
      data: { 
        id: result.lastID,
        message: 'Promotion created successfully'
      }
    });
  } catch (error) {
    console.error('Error creating promotion:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to create promotion', code: 'CREATE_ERROR' }
    });
  }
});

/**
 * @swagger
 * /api/promotions-events/promotions/{id}/activate:
 *   put:
 *     summary: Activate a promotion
 *     tags: [Promotions & Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Promotion ID
 *     responses:
 *       200:
 *         description: Promotion activated successfully
 */
router.put('/promotions/:id/activate', async (req, res) => {
  try {
    const { runQuery, getOneQuery } = await import('../utils/database.js');
    const { id } = req.params;
    
    // Verify promotion exists
    const promotion = await getOneQuery(
      'SELECT * FROM promotions WHERE id = ? AND tenant_id = ?',
      [id, req.user.tenantId]
    );
    
    if (!promotion) {
      return res.status(404).json({
        success: false,
        error: { message: 'Promotion not found', code: 'NOT_FOUND' }
      });
    }
    
    await runQuery(
      'UPDATE promotions SET status = ?, activated_at = CURRENT_TIMESTAMP WHERE id = ? AND tenant_id = ?',
      ['active', id, req.user.tenantId]
    );
    
    res.json({
      success: true,
      data: { message: 'Promotion activated successfully' }
    });
  } catch (error) {
    console.error('Error activating promotion:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to activate promotion', code: 'ACTIVATE_ERROR' }
    });
  }
});

// EVENTS ENDPOINTS

/**
 * @swagger
 * /api/promotions-events/events:
 *   get:
 *     summary: Get all events
 *     tags: [Promotions & Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by event status
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filter by event type
 *       - in: query
 *         name: agent_id
 *         schema:
 *           type: string
 *         description: Filter by assigned agent
 *       - in: query
 *         name: date_from
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter from date
 *       - in: query
 *         name: date_to
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter to date
 *     responses:
 *       200:
 *         description: List of events
 */
router.get('/events', async (req, res) => {
  try {
    const { getQuery } = await import('../utils/database.js');
    const { status, type, agent_id, date_from, date_to } = req.query;
    
    let query = `
      SELECT e.*, 
             '' as assigned_agent_names,
             0 as total_assigned_agents
      FROM events e
      WHERE e.tenant_id = ?
    `;
    
    const params = [req.user.tenantId];
    
    if (status) {
      query += ' AND e.status = ?';
      params.push(status);
    }
    
    if (type) {
      query += ' AND e.event_type = ?';
      params.push(type);
    }
    
    if (agent_id) {
      query += ' AND ea.agent_id = ?';
      params.push(agent_id);
    }
    
    if (date_from) {
      query += ' AND e.start_date::date >= ?';
      params.push(date_from);
    }
    
    if (date_to) {
      query += ' AND e.end_date::date <= ?';
      params.push(date_to);
    }
    
    query += ' ORDER BY e.start_date DESC';
    
    const events = await getQuery(query, params);
    
    res.json({
      success: true,
      data: { events }
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch events', code: 'FETCH_ERROR' }
    });
  }
});

/**
 * @swagger
 * /api/promotions-events/events:
 *   post:
 *     summary: Create a new event
 *     tags: [Promotions & Events]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - event_type
 *               - location
 *               - start_datetime
 *               - end_datetime
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               event_type:
 *                 type: string
 *               location:
 *                 type: string
 *               start_datetime:
 *                 type: string
 *                 format: date-time
 *               end_datetime:
 *                 type: string
 *                 format: date-time
 *               budget:
 *                 type: number
 *               assigned_agents:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Event created successfully
 */
router.post('/events', async (req, res) => {
  try {
    const { runQuery } = await import('../utils/database.js');
    const { 
      name, 
      description, 
      event_type, 
      location, 
      start_datetime, 
      end_datetime, 
      budget, 
      assigned_agents 
    } = req.body;
    
    if (!name || !event_type || !location || !start_datetime || !end_datetime) {
      return res.status(400).json({
        success: false,
        error: { message: 'Missing required fields', code: 'VALIDATION_ERROR' }
      });
    }
    
    // Create event
    const result = await runQuery(`
      INSERT INTO events (
        tenant_id, name, description, event_type, 
        location, start_datetime, end_datetime, 
        budget, status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'planned')
    `, [
      req.user.tenantId, 
      name, 
      description, 
      event_type, 
      location, 
      start_datetime, 
      end_datetime, 
      budget || 0
    ]);
    
    const eventId = result.lastID;
    
    // Assign agents if provided
    if (assigned_agents && assigned_agents.length > 0) {
      for (const agentId of assigned_agents) {
        await runQuery(`
          INSERT INTO event_assignments (event_id, agent_id, assigned_at)
          VALUES (?, ?, CURRENT_TIMESTAMP)
        `, [eventId, agentId]);
      }
    }
    
    res.status(201).json({
      success: true,
      data: { 
        id: eventId,
        message: 'Event created successfully'
      }
    });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to create event', code: 'CREATE_ERROR' }
    });
  }
});

/**
 * @swagger
 * /api/promotions-events/events/{id}/assign-agents:
 *   post:
 *     summary: Assign agents to an event
 *     tags: [Promotions & Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - agent_ids
 *             properties:
 *               agent_ids:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Agents assigned successfully
 */
router.post('/events/:id/assign-agents', async (req, res) => {
  try {
    const { runQuery, getOneQuery } = await import('../utils/database.js');
    const { id } = req.params;
    const { agent_ids } = req.body;
    
    // Verify event exists
    const event = await getOneQuery(
      'SELECT * FROM events WHERE id = ? AND tenant_id = ?',
      [id, req.user.tenantId]
    );
    
    if (!event) {
      return res.status(404).json({
        success: false,
        error: { message: 'Event not found', code: 'NOT_FOUND' }
      });
    }
    
    if (!agent_ids || !Array.isArray(agent_ids) || agent_ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'Agent IDs are required', code: 'VALIDATION_ERROR' }
      });
    }
    
    // Remove existing assignments
    await runQuery('DELETE FROM event_assignments WHERE event_id = ?', [id]);
    
    // Add new assignments
    for (const agentId of agent_ids) {
      await runQuery(`
        INSERT INTO event_assignments (event_id, agent_id, assigned_at)
        VALUES (?, ?, CURRENT_TIMESTAMP)
      `, [id, agentId]);
    }
    
    res.json({
      success: true,
      data: { message: 'Agents assigned successfully' }
    });
  } catch (error) {
    console.error('Error assigning agents to event:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to assign agents', code: 'ASSIGN_ERROR' }
    });
  }
});

/**
 * @swagger
 * /api/promotions-events/dashboard:
 *   get:
 *     summary: Get promotions and events dashboard data
 *     tags: [Promotions & Events]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data
 */
router.get('/dashboard', async (req, res) => {
  try {
    const { getQuery, getOneQuery } = await import('../utils/database.js');
    
    // Get promotion statistics
    const promotionStats = await getOneQuery(`
      SELECT 
        COUNT(*) as total_promotions,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_promotions,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_promotions,
        COALESCE(SUM(budget), 0) as total_budget,
        COALESCE(AVG(actual_roi), 0) as avg_roi
      FROM promotions
      WHERE tenant_id = ?
    `, [req.user.tenantId]);
    
    // Get event statistics
    const eventStats = await getOneQuery(`
      SELECT 
        COUNT(*) as total_events,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_events,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_events,
        COALESCE(SUM(budget), 0) as total_event_budget
      FROM events
      WHERE tenant_id = ?
    `, [req.user.tenantId]);
    
    // Get recent promotions
    const recentPromotions = await getQuery(`
      SELECT id, name, promotion_type, status, start_date, end_date, budget
      FROM promotions
      WHERE tenant_id = ?
      ORDER BY created_at DESC
      LIMIT 5
    `, [req.user.tenantId]);
    
    // Get upcoming events
    const upcomingEvents = await getQuery(`
      SELECT id, name, event_type, location, start_datetime, end_datetime, status
      FROM events
      WHERE tenant_id = ? AND start_datetime > CURRENT_TIMESTAMP
      ORDER BY start_datetime ASC
      LIMIT 5
    `, [req.user.tenantId]);
    
    res.json({
      success: true,
      data: {
        promotionStats,
        eventStats,
        recentPromotions,
        upcomingEvents
      }
    });
  } catch (error) {
    console.error('Error fetching promotions/events dashboard:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch dashboard data', code: 'FETCH_ERROR' }
    });
  }
});

module.exports = router;