const express = require('express');
const router = express.Router();
const { authTenantMiddleware } = require('../middleware/authTenantMiddleware');
const { validateAgentLocation, findNearbyCustomers, validateVisitLocation } = require('../utils/gpsValidation');

// Apply authentication middleware
router.use(authTenantMiddleware);

/**
 * @swagger
 * components:
 *   schemas:
 *     FieldAgent:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         phone:
 *           type: string
 *         email:
 *           type: string
 *         status:
 *           type: string
 *           enum: [active, inactive, suspended]
 *         current_location:
 *           type: object
 *           properties:
 *             latitude:
 *               type: number
 *             longitude:
 *               type: number
 *             accuracy:
 *               type: number
 *             timestamp:
 *               type: string
 *     VisitValidation:
 *       type: object
 *       properties:
 *         isValid:
 *           type: boolean
 *         distance:
 *           type: number
 *         accuracy:
 *           type: number
 *         confidenceLevel:
 *           type: string
 *           enum: [HIGH, MEDIUM, LOW, VERY_LOW]
 */

/**
 * @swagger
 * /api/field-agents:
 *   get:
 *     summary: Get all field agents
 *     tags: [Field Agents]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of field agents
 */
router.get('/', async (req, res, next) => {
  try {
    const { getQuery } = require('../database/init');
    
    const agents = await getQuery(
      `SELECT a.*, u.name, u.email, u.phone, u.status
       FROM agents a
       JOIN users u ON a.user_id = u.id
       WHERE a.tenant_id = ? AND a.agent_type = 'field_marketing'
       ORDER BY u.name`,
      [req.tenantId]
    );
    
    res.json({
      success: true,
      data: agents
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/field-agents/validate-location:
 *   post:
 *     summary: Validate agent location against customer location
 *     tags: [Field Agents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               agentLocation:
 *                 type: object
 *                 properties:
 *                   latitude:
 *                     type: number
 *                   longitude:
 *                     type: number
 *                   accuracy:
 *                     type: number
 *               customerId:
 *                 type: string
 *               radiusMeters:
 *                 type: number
 *                 default: 10
 *     responses:
 *       200:
 *         description: Location validation result
 */
router.post('/validate-location', async (req, res, next) => {
  try {
    const { agentLocation, customerId, radiusMeters = 10 } = req.body;
    const { getQuery } = require('../database/init');

    // Get customer location
    const customer = await getQuery(
      'SELECT latitude, longitude FROM customers WHERE id = ? AND tenant_id = ?',
      [customerId, req.tenantId]
    );

    if (!customer || customer.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    const customerLocation = {
      latitude: customer[0].latitude,
      longitude: customer[0].longitude
    };

    // Validate location
    const validation = validateAgentLocation(agentLocation, customerLocation, radiusMeters);

    res.json({
      success: true,
      data: validation
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/field-agents/nearby-customers:
 *   post:
 *     summary: Find nearby customers within specified radius
 *     tags: [Field Agents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               agentLocation:
 *                 type: object
 *                 properties:
 *                   latitude:
 *                     type: number
 *                   longitude:
 *                     type: number
 *               radiusMeters:
 *                 type: number
 *                 default: 1000
 *     responses:
 *       200:
 *         description: List of nearby customers with distances
 */
router.post('/nearby-customers', async (req, res, next) => {
  try {
    const { agentLocation, radiusMeters = 1000 } = req.body;
    const { getQuery } = require('../database/init');

    // Get all customers with GPS coordinates
    const customers = await getQuery(
      `SELECT id, name, phone, address, latitude, longitude, last_visit_date
       FROM customers 
       WHERE tenant_id = ? AND latitude IS NOT NULL AND longitude IS NOT NULL`,
      [req.tenantId]
    );

    // Find nearby customers
    const nearbyCustomers = findNearbyCustomers(agentLocation, customers, radiusMeters);

    res.json({
      success: true,
      data: nearbyCustomers,
      count: nearbyCustomers.length
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/field-agents/start-visit:
 *   post:
 *     summary: Start a field agent visit with location validation
 *     tags: [Field Agents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               agentId:
 *                 type: string
 *               customerId:
 *                 type: string
 *               agentLocation:
 *                 type: object
 *               brands:
 *                 type: array
 *                 items:
 *                   type: string
 *               visitType:
 *                 type: string
 *                 enum: [survey, board_placement, product_distribution, merchandising]
 *     responses:
 *       200:
 *         description: Visit started successfully
 */
router.post('/start-visit', async (req, res, next) => {
  try {
    const { agentId, customerId, agentLocation, brands = [], visitType } = req.body;
    const { getQuery, runQuery } = require('../database/init');

    // Get customer location
    const customer = await getQuery(
      'SELECT latitude, longitude, name FROM customers WHERE id = ? AND tenant_id = ?',
      [customerId, req.tenantId]
    );

    if (!customer || customer.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    const customerLocation = {
      latitude: customer[0].latitude,
      longitude: customer[0].longitude
    };

    // Validate visit location
    const locationValidation = validateVisitLocation({
      agentLocation,
      customerLocation,
      visitStartTime: new Date(),
      radiusMeters: 10
    });

    if (!locationValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Location validation failed',
        validation: locationValidation
      });
    }

    // Create visit record
    const visitId = require('crypto').randomUUID();
    await runQuery(
      `INSERT INTO visits (
        id, tenant_id, agent_id, customer_id, visit_date, visit_type,
        start_time, agent_latitude, agent_longitude, gps_accuracy,
        brands, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        visitId,
        req.tenantId,
        agentId,
        customerId,
        new Date().toISOString().split('T')[0],
        visitType,
        new Date().toISOString(),
        agentLocation.latitude,
        agentLocation.longitude,
        agentLocation.accuracy || null,
        JSON.stringify(brands),
        'in_progress'
      ]
    );

    res.json({
      success: true,
      data: {
        visitId,
        locationValidation,
        customer: customer[0],
        startTime: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/field-agents/complete-visit:
 *   post:
 *     summary: Complete a field agent visit
 *     tags: [Field Agents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               visitId:
 *                 type: string
 *               activities:
 *                 type: array
 *                 items:
 *                   type: object
 *               notes:
 *                 type: string
 *               photos:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Visit completed successfully
 */
router.post('/complete-visit', async (req, res, next) => {
  try {
    const { visitId, activities = [], notes, photos = [] } = req.body;
    const { runQuery, getQuery } = require('../database/init');

    // Update visit record
    await runQuery(
      `UPDATE visits SET 
        end_time = ?, 
        notes = ?, 
        photos = ?, 
        activities = ?,
        status = 'completed'
       WHERE id = ? AND tenant_id = ?`,
      [
        new Date().toISOString(),
        notes,
        JSON.stringify(photos),
        JSON.stringify(activities),
        visitId,
        req.tenantId
      ]
    );

    // Calculate commission based on activities
    let totalCommission = 0;
    activities.forEach(activity => {
      switch (activity.type) {
        case 'survey':
          totalCommission += 5.00; // $5 per survey
          break;
        case 'board_placement':
          totalCommission += 10.00; // $10 per board placement
          break;
        case 'product_distribution':
          totalCommission += activity.quantity * 0.50; // $0.50 per product
          break;
        default:
          totalCommission += 2.00; // $2 for other activities
      }
    });

    // Record commission
    if (totalCommission > 0) {
      const visit = await getQuery(
        'SELECT agent_id FROM visits WHERE id = ? AND tenant_id = ?',
        [visitId, req.tenantId]
      );

      if (visit && visit.length > 0) {
        await runQuery(
          `INSERT INTO commissions (
            id, tenant_id, agent_id, visit_id, commission_amount,
            calculation_date, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            require('crypto').randomUUID(),
            req.tenantId,
            visit[0].agent_id,
            visitId,
            totalCommission,
            new Date().toISOString(),
            'calculated'
          ]
        );
      }
    }

    res.json({
      success: true,
      data: {
        visitId,
        completedAt: new Date().toISOString(),
        totalCommission,
        activitiesCount: activities.length
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/field-agents/{agentId}/visits:
 *   get:
 *     summary: Get visits for a specific field agent
 *     tags: [Field Agents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: agentId
 *         required: true
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
 *         description: List of agent visits
 */
router.get('/:agentId/visits', async (req, res, next) => {
  try {
    const { agentId } = req.params;
    const { status, date_from, date_to } = req.query;
    const { getQuery } = require('../database/init');

    let query = `
      SELECT v.*, c.name as customer_name, c.phone as customer_phone,
             u.name as agent_name
      FROM visits v
      JOIN customers c ON v.customer_id = c.id
      JOIN agents a ON v.agent_id = a.id
      JOIN users u ON a.user_id = u.id
      WHERE v.tenant_id = ? AND v.agent_id = ?
    `;
    const params = [req.tenantId, agentId];

    if (status) {
      query += ' AND v.status = ?';
      params.push(status);
    }

    if (date_from) {
      query += ' AND v.visit_date >= ?';
      params.push(date_from);
    }

    if (date_to) {
      query += ' AND v.visit_date <= ?';
      params.push(date_to);
    }

    query += ' ORDER BY v.visit_date DESC, v.start_time DESC';

    const visits = await getQuery(query, params);

    res.json({
      success: true,
      data: visits
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
