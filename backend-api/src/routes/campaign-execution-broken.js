/**
 * Campaign Execution System for Trade Marketing
 * Handles campaign activation, promoter assignment, activity tracking, and performance monitoring
 */

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
 *           enum: [sampling, activation, display, education, merchandising]
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
 *           enum: [draft, planned, active, paused, completed, cancelled]
 *         execution_plan:
 *           type: object
 *         performance_metrics:
 *           type: object
 */

/**
 * @swagger
 * /api/campaigns:
 *   get:
 *     summary: Get all campaigns with execution status
 *     tags: [Campaign Execution]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by campaign status
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filter by campaign type
 *     responses:
 *       200:
 *         description: List of campaigns with execution metrics
 */
router.get('/', async (req, res, next) => {
  try {
    const { getQuery } = require('../database/init');
    const { status, type } = req.query;

    let query = `
      SELECT 
        pc.*,
        COUNT(DISTINCT pa.promoter_id) as assigned_promoters,
        COUNT(pa.id) as total_activities,
        COUNT(CASE WHEN pa.status = 'completed' THEN 1 END) as completed_activities,
        COALESCE(SUM(pa.samples_distributed), 0) as total_samples_distributed,
        COALESCE(SUM(pa.contacts_made), 0) as total_contacts_made,
        COALESCE(AVG(pa.surveys_completed), 0) as avg_surveys_per_activity,
        (pc.budget - COALESCE(SUM(pa.cost), 0)) as remaining_budget
      FROM promotional_campaigns pc
      LEFT JOIN promoter_activities pa ON pc.id = pa.campaign_id
      WHERE pc.tenant_id = ?
    `;
    
    const params = [req.tenantId];

    if (status) {
      query += ' AND pc.status = ?';
      params.push(status);
    }

    if (type) {
      query += ' AND pc.campaign_type = ?';
      params.push(type);
    }

    query += ' GROUP BY pc.id ORDER BY pc.created_at DESC';

    const campaigns = await getQuery(query, params);

    // Calculate execution metrics for each campaign
    const campaignsWithMetrics = campaigns.map(campaign => ({
      ...campaign,
      execution_metrics: {
        completion_rate: campaign.total_activities > 0 ? 
          Math.round((campaign.completed_activities / campaign.total_activities) * 100) : 0,
        budget_utilization: campaign.budget > 0 ? 
          Math.round(((campaign.budget - campaign.remaining_budget) / campaign.budget) * 100) : 0,
        promoter_efficiency: campaign.assigned_promoters > 0 ? 
          Math.round(campaign.completed_activities / campaign.assigned_promoters) : 0,
        target_progress: campaign.target_activations > 0 ? 
          Math.round((campaign.completed_activities / campaign.target_activations) * 100) : 0
      }
    }));

    res.json({
      success: true,
      data: campaignsWithMetrics,
      summary: {
        total_campaigns: campaigns.length,
        active_campaigns: campaigns.filter(c => c.status === 'active').length,
        total_budget: campaigns.reduce((sum, c) => sum + (c.budget || 0), 0),
        total_activities: campaigns.reduce((sum, c) => sum + c.total_activities, 0)
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/campaigns:
 *   post:
 *     summary: Create a new campaign
 *     tags: [Campaign Execution]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               campaign_type:
 *                 type: string
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
 *               execution_plan:
 *                 type: object
 *     responses:
 *       201:
 *         description: Campaign created successfully
 */
router.post('/', async (req, res, next) => {
  try {
    const { runQuery } = require('../database/init');
    const {
      name,
      campaign_type,
      start_date,
      end_date,
      budget,
      target_activations,
      execution_plan = {}
    } = req.body;

    const campaignId = require('crypto').randomUUID();

    // Create execution plan with default structure
    const defaultExecutionPlan = {
      phases: [
        {
          name: 'Planning',
          duration_days: 3,
          activities: ['promoter_assignment', 'material_preparation', 'training']
        },
        {
          name: 'Execution',
          duration_days: Math.ceil((new Date(end_date) - new Date(start_date)) / (1000 * 60 * 60 * 24)),
          activities: ['field_activities', 'monitoring', 'reporting']
        },
        {
          name: 'Evaluation',
          duration_days: 2,
          activities: ['data_analysis', 'performance_review', 'reporting']
        }
      ],
      success_criteria: {
        min_completion_rate: 80,
        max_budget_variance: 10,
        min_quality_score: 75
      },
      ...execution_plan
    };

    await runQuery(
      `INSERT INTO promotional_campaigns (
        id, tenant_id, name, campaign_type, start_date, end_date,
        budget, target_activations, status, execution_plan, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        campaignId,
        req.tenantId,
        name,
        campaign_type,
        start_date,
        end_date,
        budget,
        target_activations,
        'draft',
        JSON.stringify(defaultExecutionPlan),
        new Date().toISOString()
      ]
    );

    res.status(201).json({
      success: true,
      data: {
        id: campaignId,
        name,
        campaign_type,
        status: 'draft',
        execution_plan: defaultExecutionPlan
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/campaigns/{id}/activate:
 *   post:
 *     summary: Activate a campaign and assign promoters
 *     tags: [Campaign Execution]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               promoter_assignments:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     promoter_id:
 *                       type: string
 *                     territories:
 *                       type: array
 *                       items:
 *                         type: string
 *                     target_activities:
 *                       type: integer
 *               activation_date:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Campaign activated successfully
 */
router.post('/:id/activate', async (req, res, next) => {
  try {
    const { runQuery, getQuery } = require('../database/init');
    const { id } = req.params;
    const { promoter_assignments = [], activation_date } = req.body;

    // Get campaign details
    const campaign = await getQuery(
      'SELECT * FROM promotional_campaigns WHERE id = ? AND tenant_id = ?',
      [id, req.tenantId]
    );

    if (!campaign || campaign.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    if (campaign[0].status !== 'draft' && campaign[0].status !== 'planned') {
      return res.status(400).json({
        success: false,
        message: 'Campaign cannot be activated from current status'
      });
    }

    // Update campaign status
    await runQuery(
      `UPDATE promotional_campaigns 
       SET status = 'active', activation_date = ?, updated_at = ?
       WHERE id = ? AND tenant_id = ?`,
      [activation_date || new Date().toISOString(), new Date().toISOString(), id, req.tenantId]
    );

    // Create promoter assignments
    const assignmentPromises = promoter_assignments.map(async (assignment) => {
      const assignmentId = require('crypto').randomUUID();
      
      await runQuery(
        `INSERT INTO campaign_promoter_assignments (
          id, tenant_id, campaign_id, promoter_id, territories,
          target_activities, assigned_date, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          assignmentId,
          req.tenantId,
          id,
          assignment.promoter_id,
          JSON.stringify(assignment.territories || []),
          assignment.target_activities || 0,
          new Date().toISOString(),
          'active'
        ]
      );

      return assignmentId;
    });

    const assignmentIds = await Promise.all(assignmentPromises);

    // Create initial performance tracking record
    await runQuery(
      `INSERT INTO campaign_performance (
        id, tenant_id, campaign_id, tracking_date, metrics, created_at
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        require('crypto').randomUUID(),
        req.tenantId,
        id,
        new Date().toISOString().split('T')[0],
        JSON.stringify({
          assigned_promoters: promoter_assignments.length,
          target_activities: promoter_assignments.reduce((sum, p) => sum + (p.target_activities || 0), 0),
          actual_activities: 0,
          completion_rate: 0
        }),
        new Date().toISOString()
      ]
    );

    res.json({
      success: true,
      data: {
        campaign_id: id,
        status: 'active',
        assigned_promoters: promoter_assignments.length,
        assignment_ids: assignmentIds,
        activation_date: activation_date || new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/campaigns/{id}/activities:
 *   get:
 *     summary: Get campaign activities with real-time tracking
 *     tags: [Campaign Execution]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: promoter_id
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: date_from
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: date_to
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Campaign activities with tracking data
 */
router.get('/:id/activities', async (req, res, next) => {
  try {
    const { getQuery } = require('../database/init');
    const { id } = req.params;
    const { promoter_id, status, date_from, date_to } = req.query;

    let query = `
      SELECT 
        pa.*,
        u.name as promoter_name,
        c.name as customer_name,
        c.address as customer_address,
        pa.photos,
        pa.survey_data
      FROM promoter_activities pa
      JOIN users a ON pa.promoter_id = a.id
      JOIN users u ON a.user_id = u.id
      LEFT JOIN customers c ON pa.customer_id = c.id
      WHERE pa.campaign_id = ? AND pa.tenant_id = ?
    `;

    const params = [id, req.tenantId];

    if (promoter_id) {
      query += ' AND pa.promoter_id = ?';
      params.push(promoter_id);
    }

    if (status) {
      query += ' AND pa.status = ?';
      params.push(status);
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
    const processedActivities = activities.map(activity => ({
      ...activity,
      photos: activity.photos ? JSON.parse(activity.photos) : [],
      survey_data: activity.survey_data ? JSON.parse(activity.survey_data) : null
    }));

    // Calculate activity metrics
    const metrics = {
      total_activities: activities.length,
      completed_activities: activities.filter(a => a.status === 'completed').length,
      total_samples_distributed: activities.reduce((sum, a) => sum + (a.samples_distributed || 0), 0),
      total_contacts_made: activities.reduce((sum, a) => sum + (a.contacts_made || 0), 0),
      total_surveys_completed: activities.reduce((sum, a) => sum + (a.surveys_completed || 0), 0),
      unique_customers: new Set(activities.map(a => a.customer_id).filter(Boolean)).size,
      unique_promoters: new Set(activities.map(a => a.promoter_id)).size
    };

    res.json({
      success: true,
      data: processedActivities,
      metrics,
      campaign_id: id
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/campaigns/{id}/activities:
 *   post:
 *     summary: Record a new campaign activity
 *     tags: [Campaign Execution]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               promoter_id:
 *                 type: string
 *               customer_id:
 *                 type: string
 *               activity_type:
 *                 type: string
 *               activity_date:
 *                 type: string
 *                 format: date
 *               samples_distributed:
 *                 type: integer
 *               contacts_made:
 *                 type: integer
 *               surveys_completed:
 *                 type: integer
 *               photos:
 *                 type: array
 *                 items:
 *                   type: string
 *               survey_data:
 *                 type: object
 *               location:
 *                 type: object
 *                 properties:
 *                   latitude:
 *                     type: number
 *                   longitude:
 *                     type: number
 *     responses:
 *       201:
 *         description: Activity recorded successfully
 */
router.post('/:id/activities', async (req, res, next) => {
  try {
    const { runQuery, getQuery } = require('../database/init');
    const { id } = req.params;
    const {
      promoter_id,
      customer_id,
      activity_type,
      activity_date,
      samples_distributed = 0,
      contacts_made = 0,
      surveys_completed = 0,
      photos = [],
      survey_data = null,
      location = null
    } = req.body;

    // Validate campaign exists and is active
    const campaign = await getQuery(
      'SELECT * FROM promotional_campaigns WHERE id = ? AND tenant_id = ? AND status = ?',
      [id, req.tenantId, 'active']
    );

    if (!campaign || campaign.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Active campaign not found'
      });
    }

    // Validate promoter assignment
    const assignment = await getQuery(
      `SELECT * FROM campaign_promoter_assignments 
       WHERE campaign_id = ? AND promoter_id = ? AND tenant_id = ? AND status = 'active'`,
      [id, promoter_id, req.tenantId]
    );

    if (!assignment || assignment.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Promoter not assigned to this campaign'
      });
    }

    const activityId = require('crypto').randomUUID();

    await runQuery(
      `INSERT INTO promoter_activities (
        id, tenant_id, promoter_id, campaign_id, customer_id,
        activity_date, activity_type, samples_distributed, contacts_made,
        surveys_completed, photos, survey_data, latitude, longitude, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        activityId,
        req.tenantId,
        promoter_id,
        id,
        customer_id,
        activity_date,
        activity_type,
        samples_distributed,
        contacts_made,
        surveys_completed,
        JSON.stringify(photos),
        survey_data ? JSON.stringify(survey_data) : null,
        location?.latitude || null,
        location?.longitude || null,
        'completed',
        new Date().toISOString()
      ]
    );

    // Update campaign performance metrics
    await updateCampaignPerformance(id, req.tenantId);

    res.status(201).json({
      success: true,
      data: {
        activity_id: activityId,
        campaign_id: id,
        promoter_id,
        activity_type,
        recorded_at: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/campaigns/{id}/performance:
 *   get:
 *     summary: Get campaign performance metrics and analytics
 *     tags: [Campaign Execution]
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
 *         description: Campaign performance data
 */
router.get('/:id/performance', async (req, res, next) => {
  try {
    const { getQuery } = require('../database/init');
    const { id } = req.params;

    // Get campaign details
    const campaign = await getQuery(
      'SELECT * FROM promotional_campaigns WHERE id = ? AND tenant_id = ?',
      [id, req.tenantId]
    );

    if (!campaign || campaign.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    // Get performance metrics
    const performanceData = await getQuery(
      `SELECT 
        COUNT(DISTINCT pa.promoter_id) as active_promoters,
        COUNT(pa.id) as total_activities,
        COUNT(CASE WHEN pa.status = 'completed' THEN 1 END) as completed_activities,
        COALESCE(SUM(pa.samples_distributed), 0) as total_samples,
        COALESCE(SUM(pa.contacts_made), 0) as total_contacts,
        COALESCE(SUM(pa.surveys_completed), 0) as total_surveys,
        COUNT(DISTINCT pa.customer_id) as unique_customers,
        AVG(CASE WHEN pa.status = 'completed' THEN 1.0 ELSE 0.0 END) * 100 as completion_rate
      FROM promoter_activities pa
      WHERE pa.campaign_id = ? AND pa.tenant_id = ?`,
      [id, req.tenantId]
    );

    // Get daily performance trend
    const dailyTrend = await getQuery(
      `SELECT 
        pa.activity_date::date as date,
        COUNT(pa.id) as activities,
        COUNT(CASE WHEN pa.status = 'completed' THEN 1 END) as completed,
        COALESCE(SUM(pa.samples_distributed), 0) as samples,
        COALESCE(SUM(pa.contacts_made), 0) as contacts
      FROM promoter_activities pa
      WHERE pa.campaign_id = ? AND pa.tenant_id = ?
      GROUP BY pa.activity_date::date
      ORDER BY date DESC
      LIMIT 30`,
      [id, req.tenantId]
    );

    // Get promoter performance
    const promoterPerformance = await getQuery(
      `SELECT 
        pa.promoter_id,
        u.name as promoter_name,
        COUNT(pa.id) as total_activities,
        COUNT(CASE WHEN pa.status = 'completed' THEN 1 END) as completed_activities,
        COALESCE(SUM(pa.samples_distributed), 0) as samples_distributed,
        COALESCE(SUM(pa.contacts_made), 0) as contacts_made,
        AVG(CASE WHEN pa.status = 'completed' THEN 1.0 ELSE 0.0 END) * 100 as completion_rate
      FROM promoter_activities pa
      JOIN users a ON pa.promoter_id = a.id
      JOIN users u ON a.user_id = u.id
      WHERE pa.campaign_id = ? AND pa.tenant_id = ?
      GROUP BY pa.promoter_id, u.name
      ORDER BY completed_activities DESC`,
      [id, req.tenantId]
    );

    const campaignData = campaign[0];
    const performance = performanceData[0];

    // Calculate ROI and other advanced metrics
    const roi = campaignData.budget > 0 ? 
      ((performance.total_contacts * 2.5) - campaignData.budget) / campaignData.budget * 100 : 0; // Simplified ROI calculation

    const targetProgress = campaignData.target_activations > 0 ? 
      (performance.completed_activities / campaignData.target_activations) * 100 : 0;

    res.json({
      success: true,
      data: {
        campaign: {
          id: campaignData.id,
          name: campaignData.name,
          status: campaignData.status,
          budget: campaignData.budget,
          target_activations: campaignData.target_activations
        },
        performance: {
          ...performance,
          roi: Math.round(roi * 100) / 100,
          target_progress: Math.round(targetProgress * 100) / 100,
          cost_per_activation: performance.completed_activities > 0 ? 
            Math.round((campaignData.budget / performance.completed_activities) * 100) / 100 : 0,
          efficiency_score: calculateEfficiencyScore(performance, campaignData)
        },
        trends: {
          daily: dailyTrend,
          promoter_performance: promoterPerformance
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Update campaign performance metrics
 * @param {string} campaignId - Campaign ID
 * @param {string} tenantId - Tenant ID
 */
async function updateCampaignPerformance(campaignId, tenantId) {
  const { runQuery, getQuery } = require('../database/init');

  // Get current performance data
  const performance = await getQuery(
    `SELECT 
      COUNT(DISTINCT promoter_id) as active_promoters,
      COUNT(id) as total_activities,
      COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_activities,
      COALESCE(SUM(samples_distributed), 0) as total_samples,
      COALESCE(SUM(contacts_made), 0) as total_contacts
    FROM promoter_activities
    WHERE campaign_id = ? AND tenant_id = ?`,
    [campaignId, tenantId]
  );

  if (performance && performance.length > 0) {
    const metrics = {
      active_promoters: performance[0].active_promoters,
      total_activities: performance[0].total_activities,
      completed_activities: performance[0].completed_activities,
      completion_rate: performance[0].total_activities > 0 ? 
        (performance[0].completed_activities / performance[0].total_activities) * 100 : 0,
      total_samples: performance[0].total_samples,
      total_contacts: performance[0].total_contacts,
      updated_at: new Date().toISOString()
    };

    // Update or insert performance record
    await runQuery(
      `INSERT OR REPLACE INTO campaign_performance (
        id, tenant_id, campaign_id, tracking_date, metrics, created_at
      ) VALUES (
        COALESCE((SELECT id FROM campaign_performance WHERE campaign_id = ? AND tenant_id = ? AND tracking_date = ?), ?),
        ?, ?, ?, ?, ?
      )`,
      [
        campaignId, tenantId, new Date().toISOString().split('T')[0],
        require('crypto').randomUUID(),
        tenantId, campaignId, new Date().toISOString().split('T')[0],
        JSON.stringify(metrics), new Date().toISOString()
      ]
    );
  }
}

/**
 * Calculate campaign efficiency score
 * @param {Object} performance - Performance data
 * @param {Object} campaign - Campaign data
 * @returns {number} Efficiency score (0-100)
 */
function calculateEfficiencyScore(performance, campaign) {
  let score = 0;
  let factors = 0;

  // Completion rate factor (40% weight)
  if (performance.completion_rate !== undefined) {
    score += performance.completion_rate * 0.4;
    factors += 0.4;
  }

  // Target achievement factor (30% weight)
  if (campaign.target_activations > 0) {
    const targetAchievement = Math.min(100, (performance.completed_activities / campaign.target_activations) * 100);
    score += targetAchievement * 0.3;
    factors += 0.3;
  }

  // Cost efficiency factor (20% weight)
  if (campaign.budget > 0 && performance.completed_activities > 0) {
    const costPerActivation = campaign.budget / performance.completed_activities;
    const costEfficiency = Math.max(0, Math.min(100, 100 - (costPerActivation - 10) * 2)); // Simplified calculation
    score += costEfficiency * 0.2;
    factors += 0.2;
  }

  // Engagement factor (10% weight)
  if (performance.total_contacts > 0 && performance.completed_activities > 0) {
    const engagementRate = Math.min(100, (performance.total_contacts / performance.completed_activities) * 20);
    score += engagementRate * 0.1;
    factors += 0.1;
  }

  return factors > 0 ? Math.round(score / factors) : 0;
}

module.exports = router;