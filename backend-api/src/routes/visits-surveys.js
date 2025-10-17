const express = require('express');
const router = express.Router();
const { authTenantMiddleware } = require('../middleware/authTenantMiddleware');

// Apply authentication middleware
router.use(authTenantMiddleware);

/**
 * @swagger
 * components:
 *   schemas:
 *     Visit:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         customer_id:
 *           type: string
 *         assigned_agent_id:
 *           type: string
 *         visit_type:
 *           type: string
 *           enum: [routine, follow_up, new_customer, complaint, survey, audit]
 *         scheduled_date:
 *           type: string
 *           format: date-time
 *         actual_start_time:
 *           type: string
 *           format: date-time
 *         actual_end_time:
 *           type: string
 *           format: date-time
 *         status:
 *           type: string
 *           enum: [scheduled, in_progress, completed, cancelled, no_show]
 *         gps_location:
 *           type: object
 *         notes:
 *           type: string
 *         pictures:
 *           type: array
 *           items:
 *             type: string
 *     Survey:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         survey_type:
 *           type: string
 *           enum: [mandatory, adhoc, feedback, audit, brand_specific]
 *         brand_id:
 *           type: string
 *         questions:
 *           type: array
 *           items:
 *             type: object
 *         assigned_agents:
 *           type: array
 *           items:
 *             type: string
 *         due_date:
 *           type: string
 *           format: date
 *         status:
 *           type: string
 *           enum: [draft, active, completed, expired]
 */

// VISITS ENDPOINTS

/**
 * @swagger
 * /api/visits-surveys/visits:
 *   get:
 *     summary: Get all visits
 *     tags: [Visits & Surveys]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: agent_id
 *         schema:
 *           type: string
 *         description: Filter by assigned agent
 *       - in: query
 *         name: customer_id
 *         schema:
 *           type: string
 *         description: Filter by customer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by visit status
 *       - in: query
 *         name: visit_type
 *         schema:
 *           type: string
 *         description: Filter by visit type
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
 *         description: List of visits
 */
router.get('/visits', async (req, res) => {
  try {
    const { getQuery } = await import('../utils/database.js');
    const { agent_id, customer_id, status, visit_type, date_from, date_to } = req.query;
    
    let query = `
      SELECT v.*, 
             '' as customer_name,
             '' as customer_address,
             '' as agent_name,
             '' as agent_phone,
             0 as total_pictures
      FROM visits v
      WHERE v.tenant_id = ?
    `;
    
    const params = [req.user.tenantId];
    
    if (agent_id) {
      query += ' AND v.agent_id = ?';
      params.push(agent_id);
    }
    
    if (customer_id) {
      query += ' AND v.customer_id = ?';
      params.push(customer_id);
    }
    
    if (status) {
      query += ' AND v.status = ?';
      params.push(status);
    }
    
    if (visit_type) {
      query += ' AND v.visit_type = ?';
      params.push(visit_type);
    }
    
    if (date_from) {
      query += ' AND DATE(v.scheduled_date) >= ?';
      params.push(date_from);
    }
    
    if (date_to) {
      query += ' AND DATE(v.scheduled_date) <= ?';
      params.push(date_to);
    }
    
    query += ' ORDER BY v.visit_date DESC';
    
    const visits = await getQuery(query, params);
    
    // Parse GPS location JSON
    visits.forEach(visit => {
      if (visit.gps_location) {
        try {
          visit.gps_location = JSON.parse(visit.gps_location);
        } catch (e) {
          visit.gps_location = null;
        }
      }
    });
    
    res.json({
      success: true,
      data: { visits }
    });
  } catch (error) {
    console.error('Error fetching visits:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch visits', code: 'FETCH_ERROR' }
    });
  }
});

/**
 * @swagger
 * /api/visits-surveys/visits:
 *   post:
 *     summary: Create a new visit
 *     tags: [Visits & Surveys]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customer_id
 *               - assigned_agent_id
 *               - visit_type
 *               - scheduled_date
 *             properties:
 *               customer_id:
 *                 type: string
 *               assigned_agent_id:
 *                 type: string
 *               visit_type:
 *                 type: string
 *               scheduled_date:
 *                 type: string
 *                 format: date-time
 *               notes:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, urgent]
 *     responses:
 *       201:
 *         description: Visit created successfully
 */
router.post('/visits', async (req, res) => {
  try {
    const { runQuery } = await import('../utils/database.js');
    const { 
      customer_id, 
      assigned_agent_id, 
      visit_type, 
      scheduled_date, 
      notes, 
      priority 
    } = req.body;
    
    if (!customer_id || !assigned_agent_id || !visit_type || !scheduled_date) {
      return res.status(400).json({
        success: false,
        error: { message: 'Missing required fields', code: 'VALIDATION_ERROR' }
      });
    }
    
    const result = await runQuery(`
      INSERT INTO visits (
        tenant_id, customer_id, assigned_agent_id, 
        visit_type, scheduled_date, notes, priority, status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, 'scheduled')
    `, [
      req.user.tenantId, 
      customer_id, 
      assigned_agent_id, 
      visit_type, 
      scheduled_date, 
      notes, 
      priority || 'medium'
    ]);
    
    res.status(201).json({
      success: true,
      data: { 
        id: result.lastID,
        message: 'Visit created successfully'
      }
    });
  } catch (error) {
    console.error('Error creating visit:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to create visit', code: 'CREATE_ERROR' }
    });
  }
});

/**
 * @swagger
 * /api/visits-surveys/visits/{id}/start:
 *   put:
 *     summary: Start a visit
 *     tags: [Visits & Surveys]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Visit ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - gps_location
 *             properties:
 *               gps_location:
 *                 type: object
 *                 properties:
 *                   latitude:
 *                     type: number
 *                   longitude:
 *                     type: number
 *                   accuracy:
 *                     type: number
 *     responses:
 *       200:
 *         description: Visit started successfully
 */
router.put('/visits/:id/start', async (req, res) => {
  try {
    const { runQuery, getOneQuery } = await import('../utils/database.js');
    const { id } = req.params;
    const { gps_location } = req.body;
    
    // Verify visit exists
    const visit = await getOneQuery(
      'SELECT * FROM visits WHERE id = ? AND tenant_id = ?',
      [id, req.user.tenantId]
    );
    
    if (!visit) {
      return res.status(404).json({
        success: false,
        error: { message: 'Visit not found', code: 'NOT_FOUND' }
      });
    }
    
    if (!gps_location || !gps_location.latitude || !gps_location.longitude) {
      return res.status(400).json({
        success: false,
        error: { message: 'GPS location is required', code: 'VALIDATION_ERROR' }
      });
    }
    
    await runQuery(`
      UPDATE visits 
      SET status = 'in_progress', 
          actual_start_time = CURRENT_TIMESTAMP,
          gps_location = ?
      WHERE id = ? AND tenant_id = ?
    `, [JSON.stringify(gps_location), id, req.user.tenantId]);
    
    res.json({
      success: true,
      data: { message: 'Visit started successfully' }
    });
  } catch (error) {
    console.error('Error starting visit:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to start visit', code: 'START_ERROR' }
    });
  }
});

/**
 * @swagger
 * /api/visits-surveys/visits/{id}/complete:
 *   put:
 *     summary: Complete a visit
 *     tags: [Visits & Surveys]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Visit ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notes:
 *                 type: string
 *               outcome:
 *                 type: string
 *                 enum: [successful, unsuccessful, rescheduled, cancelled]
 *               next_visit_date:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Visit completed successfully
 */
router.put('/visits/:id/complete', async (req, res) => {
  try {
    const { runQuery, getOneQuery } = await import('../utils/database.js');
    const { id } = req.params;
    const { notes, outcome, next_visit_date } = req.body;
    
    // Verify visit exists
    const visit = await getOneQuery(
      'SELECT * FROM visits WHERE id = ? AND tenant_id = ?',
      [id, req.user.tenantId]
    );
    
    if (!visit) {
      return res.status(404).json({
        success: false,
        error: { message: 'Visit not found', code: 'NOT_FOUND' }
      });
    }
    
    await runQuery(`
      UPDATE visits 
      SET status = 'completed', 
          actual_end_time = CURRENT_TIMESTAMP,
          notes = ?,
          outcome = ?,
          next_visit_date = ?
      WHERE id = ? AND tenant_id = ?
    `, [notes, outcome || 'successful', next_visit_date, id, req.user.tenantId]);
    
    res.json({
      success: true,
      data: { message: 'Visit completed successfully' }
    });
  } catch (error) {
    console.error('Error completing visit:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to complete visit', code: 'COMPLETE_ERROR' }
    });
  }
});

/**
 * @swagger
 * /api/visits-surveys/visits/{id}/reassign:
 *   put:
 *     summary: Reassign a visit to another agent
 *     tags: [Visits & Surveys]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Visit ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - new_agent_id
 *             properties:
 *               new_agent_id:
 *                 type: string
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Visit reassigned successfully
 */
router.put('/visits/:id/reassign', async (req, res) => {
  try {
    const { runQuery, getOneQuery } = await import('../utils/database.js');
    const { id } = req.params;
    const { new_agent_id, reason } = req.body;
    
    // Verify visit exists
    const visit = await getOneQuery(
      'SELECT * FROM visits WHERE id = ? AND tenant_id = ?',
      [id, req.user.tenantId]
    );
    
    if (!visit) {
      return res.status(404).json({
        success: false,
        error: { message: 'Visit not found', code: 'NOT_FOUND' }
      });
    }
    
    if (!new_agent_id) {
      return res.status(400).json({
        success: false,
        error: { message: 'New agent ID is required', code: 'VALIDATION_ERROR' }
      });
    }
    
    // Log the reassignment
    await runQuery(`
      INSERT INTO visit_reassignments (
        visit_id, old_agent_id, new_agent_id, reason, reassigned_at
      )
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [id, visit.assigned_agent_id, new_agent_id, reason]);
    
    // Update the visit
    await runQuery(`
      UPDATE visits 
      SET assigned_agent_id = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND tenant_id = ?
    `, [new_agent_id, id, req.user.tenantId]);
    
    res.json({
      success: true,
      data: { message: 'Visit reassigned successfully' }
    });
  } catch (error) {
    console.error('Error reassigning visit:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to reassign visit', code: 'REASSIGN_ERROR' }
    });
  }
});

// SURVEYS ENDPOINTS

/**
 * @swagger
 * /api/visits-surveys/surveys:
 *   get:
 *     summary: Get all surveys
 *     tags: [Visits & Surveys]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: survey_type
 *         schema:
 *           type: string
 *         description: Filter by survey type
 *       - in: query
 *         name: brand_id
 *         schema:
 *           type: string
 *         description: Filter by brand
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by survey status
 *       - in: query
 *         name: agent_id
 *         schema:
 *           type: string
 *         description: Filter by assigned agent
 *     responses:
 *       200:
 *         description: List of surveys
 */
router.get('/surveys', async (req, res) => {
  try {
    const { getQuery } = await import('../utils/database.js');
    const { survey_type, brand_id, status, agent_id } = req.query;
    
    let query = `
      SELECT s.*, 
             b.name as brand_name,
             COUNT(sa.agent_id) as total_assigned_agents,
             COUNT(sr.id) as total_responses,
             GROUP_CONCAT(u.first_name || ' ' || u.last_name) as assigned_agent_names
      FROM surveys s
      LEFT JOIN brands b ON s.brand_id = b.id
      LEFT JOIN survey_assignments sa ON s.id = sa.survey_id
      LEFT JOIN survey_responses sr ON s.id = sr.survey_id
      LEFT JOIN agents a ON sa.agent_id = a.id
      LEFT JOIN users u ON a.user_id = u.id
      WHERE s.tenant_id = ?
    `;
    
    const params = [req.user.tenantId];
    
    if (survey_type) {
      query += ' AND s.survey_type = ?';
      params.push(survey_type);
    }
    
    if (brand_id) {
      query += ' AND s.brand_id = ?';
      params.push(brand_id);
    }
    
    if (status) {
      query += ' AND s.status = ?';
      params.push(status);
    }
    
    if (agent_id) {
      query += ' AND sa.agent_id = ?';
      params.push(agent_id);
    }
    
    query += ' GROUP BY s.id ORDER BY s.created_at DESC';
    
    const surveys = await getQuery(query, params);
    
    // Parse questions JSON
    surveys.forEach(survey => {
      if (survey.questions) {
        try {
          survey.questions = JSON.parse(survey.questions);
        } catch (e) {
          survey.questions = [];
        }
      }
    });
    
    res.json({
      success: true,
      data: { surveys }
    });
  } catch (error) {
    console.error('Error fetching surveys:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch surveys', code: 'FETCH_ERROR' }
    });
  }
});

/**
 * @swagger
 * /api/visits-surveys/surveys:
 *   post:
 *     summary: Create a new survey
 *     tags: [Visits & Surveys]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - survey_type
 *               - questions
 *               - due_date
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               survey_type:
 *                 type: string
 *               brand_id:
 *                 type: string
 *               questions:
 *                 type: array
 *                 items:
 *                   type: object
 *               due_date:
 *                 type: string
 *                 format: date
 *               assigned_agents:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Survey created successfully
 */
router.post('/surveys', async (req, res) => {
  try {
    const { runQuery } = await import('../utils/database.js');
    const { 
      title, 
      description, 
      survey_type, 
      brand_id, 
      questions, 
      due_date, 
      assigned_agents 
    } = req.body;
    
    if (!title || !survey_type || !questions || !due_date) {
      return res.status(400).json({
        success: false,
        error: { message: 'Missing required fields', code: 'VALIDATION_ERROR' }
      });
    }
    
    // Create survey
    const result = await runQuery(`
      INSERT INTO surveys (
        tenant_id, title, description, survey_type, 
        brand_id, questions, due_date, status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, 'draft')
    `, [
      req.user.tenantId, 
      title, 
      description, 
      survey_type, 
      brand_id, 
      JSON.stringify(questions), 
      due_date
    ]);
    
    const surveyId = result.lastID;
    
    // Assign agents if provided
    if (assigned_agents && assigned_agents.length > 0) {
      for (const agentId of assigned_agents) {
        await runQuery(`
          INSERT INTO survey_assignments (survey_id, agent_id, assigned_at)
          VALUES (?, ?, CURRENT_TIMESTAMP)
        `, [surveyId, agentId]);
      }
    }
    
    res.status(201).json({
      success: true,
      data: { 
        id: surveyId,
        message: 'Survey created successfully'
      }
    });
  } catch (error) {
    console.error('Error creating survey:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to create survey', code: 'CREATE_ERROR' }
    });
  }
});

/**
 * @swagger
 * /api/visits-surveys/surveys/{id}/assign-agents:
 *   post:
 *     summary: Assign agents to a survey
 *     tags: [Visits & Surveys]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Survey ID
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
router.post('/surveys/:id/assign-agents', async (req, res) => {
  try {
    const { runQuery, getOneQuery } = await import('../utils/database.js');
    const { id } = req.params;
    const { agent_ids } = req.body;
    
    // Verify survey exists
    const survey = await getOneQuery(
      'SELECT * FROM surveys WHERE id = ? AND tenant_id = ?',
      [id, req.user.tenantId]
    );
    
    if (!survey) {
      return res.status(404).json({
        success: false,
        error: { message: 'Survey not found', code: 'NOT_FOUND' }
      });
    }
    
    if (!agent_ids || !Array.isArray(agent_ids) || agent_ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'Agent IDs are required', code: 'VALIDATION_ERROR' }
      });
    }
    
    // Remove existing assignments
    await runQuery('DELETE FROM survey_assignments WHERE survey_id = ?', [id]);
    
    // Add new assignments
    for (const agentId of agent_ids) {
      await runQuery(`
        INSERT INTO survey_assignments (survey_id, agent_id, assigned_at)
        VALUES (?, ?, CURRENT_TIMESTAMP)
      `, [id, agentId]);
    }
    
    res.json({
      success: true,
      data: { message: 'Agents assigned successfully' }
    });
  } catch (error) {
    console.error('Error assigning agents to survey:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to assign agents', code: 'ASSIGN_ERROR' }
    });
  }
});

/**
 * @swagger
 * /api/visits-surveys/surveys/{id}/activate:
 *   put:
 *     summary: Activate a survey
 *     tags: [Visits & Surveys]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Survey ID
 *     responses:
 *       200:
 *         description: Survey activated successfully
 */
router.put('/surveys/:id/activate', async (req, res) => {
  try {
    const { runQuery, getOneQuery } = await import('../utils/database.js');
    const { id } = req.params;
    
    // Verify survey exists
    const survey = await getOneQuery(
      'SELECT * FROM surveys WHERE id = ? AND tenant_id = ?',
      [id, req.user.tenantId]
    );
    
    if (!survey) {
      return res.status(404).json({
        success: false,
        error: { message: 'Survey not found', code: 'NOT_FOUND' }
      });
    }
    
    await runQuery(
      'UPDATE surveys SET status = ?, activated_at = CURRENT_TIMESTAMP WHERE id = ? AND tenant_id = ?',
      ['active', id, req.user.tenantId]
    );
    
    res.json({
      success: true,
      data: { message: 'Survey activated successfully' }
    });
  } catch (error) {
    console.error('Error activating survey:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to activate survey', code: 'ACTIVATE_ERROR' }
    });
  }
});

/**
 * @swagger
 * /api/visits-surveys/dashboard:
 *   get:
 *     summary: Get visits and surveys dashboard data
 *     tags: [Visits & Surveys]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data
 */
router.get('/dashboard', async (req, res) => {
  try {
    const { getQuery, getOneQuery } = await import('../utils/database.js');
    
    // Get visit statistics
    const visitStats = await getOneQuery(`
      SELECT 
        COUNT(*) as total_visits,
        COUNT(CASE WHEN status = 'scheduled' THEN 1 END) as scheduled_visits,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as active_visits,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_visits,
        COUNT(CASE WHEN DATE(scheduled_date) = DATE('now') THEN 1 END) as today_visits
      FROM visits
      WHERE tenant_id = ?
    `, [req.user.tenantId]);
    
    // Get survey statistics
    const surveyStats = await getOneQuery(`
      SELECT 
        COUNT(*) as total_surveys,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_surveys,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_surveys,
        COUNT(CASE WHEN survey_type = 'mandatory' THEN 1 END) as mandatory_surveys
      FROM surveys
      WHERE tenant_id = ?
    `, [req.user.tenantId]);
    
    // Get today's visits
    const todayVisits = await getQuery(`
      SELECT v.id, v.visit_type, v.status, v.scheduled_date,
             c.business_name as customer_name,
             u.first_name || ' ' || u.last_name as agent_name
      FROM visits v
      LEFT JOIN customers c ON v.customer_id = c.id
      LEFT JOIN agents a ON v.assigned_agent_id = a.id
      LEFT JOIN users u ON a.user_id = u.id
      WHERE v.tenant_id = ? AND DATE(v.scheduled_date) = DATE('now')
      ORDER BY v.scheduled_date ASC
      LIMIT 10
    `, [req.user.tenantId]);
    
    // Get active surveys
    const activeSurveys = await getQuery(`
      SELECT id, title, survey_type, due_date, status
      FROM surveys
      WHERE tenant_id = ? AND status = 'active'
      ORDER BY due_date ASC
      LIMIT 5
    `, [req.user.tenantId]);
    
    res.json({
      success: true,
      data: {
        visitStats,
        surveyStats,
        todayVisits,
        activeSurveys
      }
    });
  } catch (error) {
    console.error('Error fetching visits/surveys dashboard:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch dashboard data', code: 'FETCH_ERROR' }
    });
  }
});

module.exports = router;