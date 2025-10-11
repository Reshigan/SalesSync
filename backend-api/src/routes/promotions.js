const express = require('express');
const router = express.Router();
const { authTenantMiddleware } = require('../middleware/authTenantMiddleware');

// Apply authentication middleware
router.use(authTenantMiddleware);

/**
 * @swagger
 * components:
 *   schemas:
 *     Campaign:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         campaign_type:
 *           type: string
 *           enum: [sampling, activation, display, education]
 *         start_date:
 *           type: string
 *           format: date
 *         end_date:
 *           type: string
 *           format: date
 *         budget:
 *           type: number
 *         target_activations:
 *           type: integer
 *         status:
 *           type: string
 *           enum: [planned, active, paused, completed, cancelled]
 *     PromoterActivity:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         promoter_id:
 *           type: string
 *         campaign_id:
 *           type: string
 *         customer_id:
 *           type: string
 *         activity_date:
 *           type: string
 *           format: date
 *         activity_type:
 *           type: string
 *           enum: [sampling, demo, display_setup, survey]
 *         samples_distributed:
 *           type: integer
 *         contacts_made:
 *           type: integer
 *         surveys_completed:
 *           type: integer
 */

// Apply authentication middleware to all routes
router.use(authTenantMiddleware);

/**
 * @swagger
 * /api/promotions:
 *   get:
 *     summary: Get promotions module info
 *     tags: [Promotions]
 *     responses:
 *       200:
 *         description: Promotions module info
 */
router.get('/', async (req, res) => {
  try {
    res.json({ 
      success: true, 
      message: 'Promotions module active',
      endpoints: {
        campaigns: '/campaigns',
        activities: '/activities',
        dashboard: '/dashboard'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /api/promotions/campaigns:
 *   get:
 *     summary: Get all promotional campaigns
 *     tags: [Promotions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by campaign status
 *       - in: query
 *         name: campaign_type
 *         schema:
 *           type: string
 *         description: Filter by campaign type
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
 *         description: List of campaigns
 */
router.get('/campaigns', async (req, res) => {
  try {
    const { getQuery } = await import('../utils/database.js');
    const { status, campaign_type, date_from, date_to } = req.query;
    
    let query = `
      SELECT pc.*, 
             COUNT(pa.id) as total_activities,
             COUNT(DISTINCT pa.promoter_id) as active_promoters,
             COALESCE(SUM(pa.samples_distributed), 0) as total_samples,
             COALESCE(SUM(pa.contacts_made), 0) as total_contacts
      FROM promotional_campaigns pc
      LEFT JOIN promoter_activities pa ON pc.id = pa.campaign_id
      WHERE pc.tenant_id = ?
    `;
    
    const params = [req.user.tenantId];
    
    if (status) {
      query += ' AND pc.status = ?';
      params.push(status);
    }
    
    if (campaign_type) {
      query += ' AND pc.campaign_type = ?';
      params.push(campaign_type);
    }
    
    if (date_from) {
      query += ' AND pc.start_date >= ?';
      params.push(date_from);
    }
    
    if (date_to) {
      query += ' AND pc.end_date <= ?';
      params.push(date_to);
    }
    
    query += ' GROUP BY pc.id ORDER BY pc.created_at DESC';
    
    const campaigns = await getQuery(query, params);
    
    // Parse JSON fields
    campaigns.forEach(campaign => {
      if (campaign.materials) campaign.materials = JSON.parse(campaign.materials);
      if (campaign.success_metrics) campaign.success_metrics = JSON.parse(campaign.success_metrics);
    });
    
    res.json({
      success: true,
      data: { campaigns }
    });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch campaigns', code: 'FETCH_ERROR' }
    });
  }
});

/**
 * @swagger
 * /api/promotions/campaigns:
 *   post:
 *     summary: Create a new promotional campaign
 *     tags: [Promotions]
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
 *               - campaign_type
 *               - start_date
 *               - end_date
 *             properties:
 *               name:
 *                 type: string
 *               campaign_type:
 *                 type: string
 *                 enum: [sampling, activation, display, education]
 *               start_date:
 *                 type: string
 *                 format: date
 *               end_date:
 *                 type: string
 *                 format: date
 *               budget:
 *                 type: number
 *               target_activations:
 *                 type: integer
 *               target_samples:
 *                 type: integer
 *               brand_id:
 *                 type: string
 *               materials:
 *                 type: array
 *                 items:
 *                   type: object
 *               success_metrics:
 *                 type: object
 *     responses:
 *       201:
 *         description: Campaign created successfully
 */
router.post('/campaigns', async (req, res) => {
  try {
    const { runQuery } = await import('../utils/database.js');
    const { 
      name, 
      campaign_type, 
      start_date, 
      end_date, 
      budget, 
      target_activations,
      target_samples,
      brand_id,
      materials,
      success_metrics
    } = req.body;
    
    if (!name || !campaign_type || !start_date || !end_date) {
      return res.status(400).json({
        success: false,
        error: { message: 'Missing required fields', code: 'VALIDATION_ERROR' }
      });
    }
    
    const result = await runQuery(`
      INSERT INTO promotional_campaigns (
        tenant_id, name, campaign_type, start_date, end_date,
        budget, target_activations, target_samples, brand_id,
        materials, success_metrics, status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'planned')
    `, [
      req.user.tenantId,
      name,
      campaign_type,
      start_date,
      end_date,
      budget || 0,
      target_activations || 0,
      target_samples || 0,
      brand_id || null,
      JSON.stringify(materials || []),
      JSON.stringify(success_metrics || {}),
    ]);
    
    res.status(201).json({
      success: true,
      data: { 
        id: result.lastID,
        message: 'Campaign created successfully'
      }
    });
  } catch (error) {
    console.error('Error creating campaign:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to create campaign', code: 'CREATE_ERROR' }
    });
  }
});

/**
 * @swagger
 * /api/promotions/campaigns/{id}:
 *   get:
 *     summary: Get campaign details
 *     tags: [Promotions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Campaign ID
 *     responses:
 *       200:
 *         description: Campaign details
 */
router.get('/campaigns/:id', async (req, res) => {
  try {
    const { getOneQuery, getQuery } = await import('../utils/database.js');
    const { id } = req.params;
    
    const campaign = await getOneQuery(`
      SELECT pc.*, b.name as brand_name
      FROM promotional_campaigns pc
      LEFT JOIN brands b ON pc.brand_id = b.id
      WHERE pc.id = ? AND pc.tenant_id = ?
    `, [id, req.user.tenantId]);
    
    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: { message: 'Campaign not found', code: 'NOT_FOUND' }
      });
    }
    
    // Parse JSON fields
    if (campaign.materials) campaign.materials = JSON.parse(campaign.materials);
    if (campaign.success_metrics) campaign.success_metrics = JSON.parse(campaign.success_metrics);
    
    // Get campaign activities
    const activities = await getQuery(`
      SELECT pa.*, 
             u.first_name || ' ' || u.last_name as promoter_name,
             c.name as customer_name
      FROM promoter_activities pa
      JOIN agents a ON pa.promoter_id = a.id
      JOIN users u ON a.user_id = u.id
      LEFT JOIN customers c ON pa.customer_id = c.id
      WHERE pa.campaign_id = ? AND pa.tenant_id = ?
      ORDER BY pa.activity_date DESC
    `, [id, req.user.tenantId]);
    
    // Parse JSON fields in activities
    activities.forEach(activity => {
      if (activity.photos) activity.photos = JSON.parse(activity.photos);
      if (activity.survey_data) activity.survey_data = JSON.parse(activity.survey_data);
    });
    
    res.json({
      success: true,
      data: { 
        campaign,
        activities
      }
    });
  } catch (error) {
    console.error('Error fetching campaign:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch campaign', code: 'FETCH_ERROR' }
    });
  }
});

/**
 * @swagger
 * /api/promotions/activities:
 *   get:
 *     summary: Get promoter activities
 *     tags: [Promotions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: promoter_id
 *         schema:
 *           type: string
 *         description: Filter by promoter ID
 *       - in: query
 *         name: campaign_id
 *         schema:
 *           type: string
 *         description: Filter by campaign ID
 *       - in: query
 *         name: activity_type
 *         schema:
 *           type: string
 *         description: Filter by activity type
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
 *         description: List of activities
 */
router.get('/activities', async (req, res) => {
  try {
    const { getQuery } = await import('../utils/database.js');
    const { promoter_id, campaign_id, activity_type, date_from, date_to } = req.query;
    
    let query = `
      SELECT pa.*, 
             u.first_name || ' ' || u.last_name as promoter_name,
             pc.name as campaign_name,
             c.name as customer_name,
             c.address as customer_address
      FROM promoter_activities pa
      JOIN agents a ON pa.promoter_id = a.id
      JOIN users u ON a.user_id = u.id
      LEFT JOIN promotional_campaigns pc ON pa.campaign_id = pc.id
      LEFT JOIN customers c ON pa.customer_id = c.id
      WHERE pa.tenant_id = ?
    `;
    
    const params = [req.user.tenantId];
    
    if (promoter_id) {
      query += ' AND pa.promoter_id = ?';
      params.push(promoter_id);
    }
    
    if (campaign_id) {
      query += ' AND pa.campaign_id = ?';
      params.push(campaign_id);
    }
    
    if (activity_type) {
      query += ' AND pa.activity_type = ?';
      params.push(activity_type);
    }
    
    if (date_from) {
      query += ' AND pa.activity_date >= ?';
      params.push(date_from);
    }
    
    if (date_to) {
      query += ' AND pa.activity_date <= ?';
      params.push(date_to);
    }
    
    query += ' ORDER BY pa.activity_date DESC, pa.created_at DESC';
    
    const activities = await getQuery(query, params);
    
    // Parse JSON fields
    activities.forEach(activity => {
      if (activity.photos) activity.photos = JSON.parse(activity.photos);
      if (activity.survey_data) activity.survey_data = JSON.parse(activity.survey_data);
    });
    
    res.json({
      success: true,
      data: { activities }
    });
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch activities', code: 'FETCH_ERROR' }
    });
  }
});

/**
 * @swagger
 * /api/promotions/activities:
 *   post:
 *     summary: Create a new promoter activity
 *     tags: [Promotions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - promoter_id
 *               - activity_date
 *               - activity_type
 *             properties:
 *               promoter_id:
 *                 type: string
 *               campaign_id:
 *                 type: string
 *               customer_id:
 *                 type: string
 *               activity_date:
 *                 type: string
 *                 format: date
 *               activity_type:
 *                 type: string
 *                 enum: [sampling, demo, display_setup, survey]
 *               start_time:
 *                 type: string
 *                 format: date-time
 *               end_time:
 *                 type: string
 *                 format: date-time
 *               samples_distributed:
 *                 type: integer
 *               contacts_made:
 *                 type: integer
 *               surveys_completed:
 *                 type: integer
 *               photos:
 *                 type: array
 *                 items:
 *                   type: object
 *               survey_data:
 *                 type: object
 *               notes:
 *                 type: string
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *     responses:
 *       201:
 *         description: Activity created successfully
 */
router.post('/activities', async (req, res) => {
  try {
    const { runQuery } = await import('../utils/database.js');
    const { 
      promoter_id,
      campaign_id,
      customer_id,
      activity_date,
      activity_type,
      start_time,
      end_time,
      samples_distributed,
      contacts_made,
      surveys_completed,
      photos,
      survey_data,
      notes,
      latitude,
      longitude
    } = req.body;
    
    if (!promoter_id || !activity_date || !activity_type) {
      return res.status(400).json({
        success: false,
        error: { message: 'Missing required fields', code: 'VALIDATION_ERROR' }
      });
    }
    
    const result = await runQuery(`
      INSERT INTO promoter_activities (
        tenant_id, promoter_id, campaign_id, customer_id, activity_date,
        activity_type, start_time, end_time, samples_distributed,
        contacts_made, surveys_completed, photos, survey_data,
        notes, latitude, longitude, status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed')
    `, [
      req.user.tenantId,
      promoter_id,
      campaign_id || null,
      customer_id || null,
      activity_date,
      activity_type,
      start_time || null,
      end_time || null,
      samples_distributed || 0,
      contacts_made || 0,
      surveys_completed || 0,
      JSON.stringify(photos || []),
      JSON.stringify(survey_data || {}),
      notes || null,
      latitude || null,
      longitude || null
    ]);
    
    res.status(201).json({
      success: true,
      data: { 
        id: result.lastID,
        message: 'Activity created successfully'
      }
    });
  } catch (error) {
    console.error('Error creating activity:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to create activity', code: 'CREATE_ERROR' }
    });
  }
});

/**
 * @swagger
 * /api/promotions/dashboard:
 *   get:
 *     summary: Get promotions dashboard data
 *     tags: [Promotions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data
 */
router.get('/dashboard', async (req, res) => {
  try {
    const { getQuery, getOneQuery } = await import('../utils/database.js');
    
    // Get summary statistics
    const stats = await getOneQuery(`
      SELECT 
        COUNT(DISTINCT pc.id) as total_campaigns,
        COUNT(DISTINCT CASE WHEN pc.status = 'active' THEN pc.id END) as active_campaigns,
        COUNT(DISTINCT pa.id) as total_activities_today,
        COUNT(DISTINCT pa.promoter_id) as active_promoters_today,
        COALESCE(SUM(pa.samples_distributed), 0) as samples_distributed_today,
        COALESCE(SUM(pa.contacts_made), 0) as contacts_made_today
      FROM promotional_campaigns pc
      LEFT JOIN promoter_activities pa ON pc.id = pa.campaign_id AND DATE(pa.activity_date) = DATE('now')
      WHERE pc.tenant_id = ?
    `, [req.user.tenantId]);
    
    // Get recent activities
    const recentActivities = await getQuery(`
      SELECT pa.id, pa.activity_date, pa.activity_type, pa.samples_distributed,
             pa.contacts_made, pa.surveys_completed,
             u.first_name || ' ' || u.last_name as promoter_name,
             pc.name as campaign_name,
             c.name as customer_name
      FROM promoter_activities pa
      JOIN agents a ON pa.promoter_id = a.id
      JOIN users u ON a.user_id = u.id
      LEFT JOIN promotional_campaigns pc ON pa.campaign_id = pc.id
      LEFT JOIN customers c ON pa.customer_id = c.id
      WHERE pa.tenant_id = ?
      ORDER BY pa.created_at DESC
      LIMIT 10
    `, [req.user.tenantId]);
    
    // Get activities by type
    const activitiesByType = await getQuery(`
      SELECT activity_type, COUNT(*) as count
      FROM promoter_activities
      WHERE tenant_id = ? AND DATE(activity_date) = DATE('now')
      GROUP BY activity_type
    `, [req.user.tenantId]);
    
    // Get campaign performance
    const campaignPerformance = await getQuery(`
      SELECT pc.name, pc.target_activations,
             COUNT(pa.id) as actual_activities,
             COALESCE(SUM(pa.samples_distributed), 0) as actual_samples,
             ROUND(
               CASE 
                 WHEN pc.target_activations > 0 
                 THEN (COUNT(pa.id) * 100.0 / pc.target_activations)
                 ELSE 0 
               END, 2
             ) as activation_percentage
      FROM promotional_campaigns pc
      LEFT JOIN promoter_activities pa ON pc.id = pa.campaign_id
      WHERE pc.tenant_id = ? AND pc.status = 'active'
      GROUP BY pc.id, pc.name, pc.target_activations
      ORDER BY activation_percentage DESC
      LIMIT 5
    `, [req.user.tenantId]);
    
    res.json({
      success: true,
      data: {
        stats,
        recentActivities,
        activitiesByType,
        campaignPerformance
      }
    });
  } catch (error) {
    console.error('Error fetching promotions dashboard:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch dashboard data', code: 'FETCH_ERROR' }
    });
  }
});

/**
 * @swagger
 * /api/promotions/campaigns/{id}/status:
 *   put:
 *     summary: Update campaign status
 *     tags: [Promotions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Campaign ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [planned, active, paused, completed, cancelled]
 *     responses:
 *       200:
 *         description: Campaign status updated successfully
 */
router.put('/campaigns/:id/status', async (req, res) => {
  try {
    const { runQuery, getOneQuery } = await import('../utils/database.js');
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        error: { message: 'Status is required', code: 'VALIDATION_ERROR' }
      });
    }
    
    // Verify campaign exists
    const campaign = await getOneQuery(
      'SELECT id FROM promotional_campaigns WHERE id = ? AND tenant_id = ?',
      [id, req.user.tenantId]
    );
    
    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: { message: 'Campaign not found', code: 'NOT_FOUND' }
      });
    }
    
    await runQuery(
      'UPDATE promotional_campaigns SET status = ? WHERE id = ? AND tenant_id = ?',
      [status, id, req.user.tenantId]
    );
    
    res.json({
      success: true,
      data: { message: 'Campaign status updated successfully' }
    });
  } catch (error) {
    console.error('Error updating campaign status:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to update campaign status', code: 'UPDATE_ERROR' }
    });
  }
});

module.exports = router;