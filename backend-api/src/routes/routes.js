const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getQuery, getOneQuery, runQuery } = require('../utils/database');
// Authentication middleware is applied globally in server.js

/**
 * @swagger
 * components:
 *   schemas:
 *     Route:
 *       type: object
 *       required:
 *         - code
 *         - name
 *         - area_id
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier for the route
 *         code:
 *           type: string
 *           description: Route code
 *         name:
 *           type: string
 *           description: Route name
 *         area_id:
 *           type: string
 *           description: ID of the parent area
 *         agent_id:
 *           type: string
 *           description: ID of the assigned agent
 *         description:
 *           type: string
 *           description: Route description
 *         status:
 *           type: string
 *           enum: [active, inactive]
 *           description: Route status
 *         visit_frequency:
 *           type: string
 *           enum: [daily, weekly, bi-weekly, monthly]
 *           description: Visit frequency
 *         estimated_duration:
 *           type: integer
 *           description: Estimated duration in minutes
 *         target_calls:
 *           type: integer
 *           description: Target number of calls per visit
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/routes:
 *   get:
 *     summary: Get all routes
 *     tags: [Routes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of routes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Route'
 */
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT 
        r.*,
        a.name as area_name,
        reg.name as region_name,
        u.first_name || ' ' || u.last_name as agent_name,
        COUNT(DISTINCT c.id) as customer_count
      FROM routes r
      LEFT JOIN areas a ON r.area_id = a.id
      LEFT JOIN regions reg ON a.region_id = reg.id
      LEFT JOIN users u ON r.salesman_id = u.id
      LEFT JOIN customers c ON r.id = c.route_id
      WHERE r.tenant_id = $1
      GROUP BY r.id, a.name, reg.name, u.first_name, u.last_name
      ORDER BY r.name
    `;
    
    const routes = await getQuery(query, [req.tenantId]);
    
    res.json({
      success: true,
      data: routes
    });
  } catch (error) {
    console.error('Error fetching routes:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch routes'
    });
  }
});

/**
 * @swagger
 * /api/routes/{id}:
 *   get:
 *     summary: Get route by ID
 *     tags: [Routes]
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
 *         description: Route details
 *       404:
 *         description: Route not found
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT 
        r.*,
        a.name as area_name,
        reg.name as region_name,
        u.first_name || ' ' || u.last_name as agent_name
      FROM routes r
      LEFT JOIN areas a ON r.area_id = a.id
      LEFT JOIN regions reg ON a.region_id = reg.id
      LEFT JOIN users u ON r.salesman_id = u.id
      WHERE r.id = $1 AND r.tenant_id = $2
    `;
    
    const route = await getOneQuery(query, [id, req.tenantId]);
    
    if (!route) {
      return res.status(404).json({
        success: false,
        error: 'Route not found'
      });
    }
    
    res.json({
      success: true,
      data: route
    });
  } catch (error) {
    console.error('Error fetching route:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch route'
    });
  }
});

/**
 * @swagger
 * /api/routes:
 *   post:
 *     summary: Create new route
 *     tags: [Routes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - name
 *               - area_id
 *             properties:
 *               code:
 *                 type: string
 *               name:
 *                 type: string
 *               area_id:
 *                 type: string
 *               agent_id:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *               visit_frequency:
 *                 type: string
 *                 enum: [daily, weekly, bi-weekly, monthly]
 *               estimated_duration:
 *                 type: integer
 *               target_calls:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Route created successfully
 *       400:
 *         description: Invalid input
 */
router.post('/', async (req, res) => {
  try {
    const { 
      code, name, area_id, agent_id, description, status = 'active',
      visit_frequency = 'weekly', estimated_duration, target_calls
    } = req.body;
    
    // Validate required fields
    if (!code || !name || !area_id) {
      return res.status(400).json({
        success: false,
        error: 'Code, name, and area_id are required'
      });
    }
    
    // Check if code already exists
    const existingRoute = await getOneQuery('SELECT id FROM routes WHERE code = $1 AND tenant_id = $2', [code, req.tenantId]);
    if (existingRoute) {
      return res.status(400).json({
        success: false,
        error: 'Route code already exists'
      });
    }
    
    const id = uuidv4();
    const now = new Date().toISOString();
    
    await runQuery(`
      INSERT INTO routes (
        id, tenant_id, code, name, area_id, agent_id, description, status,
        visit_frequency, estimated_duration, target_calls, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    `, [
      id, req.tenantId, code, name, area_id, agent_id || null, description || null, status,
      visit_frequency, estimated_duration || null, target_calls || null, now, now
    ]);
    
    // Fetch the created route with joined data
    const route = await getOneQuery(`
      SELECT 
        r.*,
        a.name as area_name,
        reg.name as region_name,
        u.first_name || ' ' || u.last_name as agent_name
      FROM routes r
      LEFT JOIN areas a ON r.area_id = a.id
      LEFT JOIN regions reg ON a.region_id = reg.id
      LEFT JOIN users u ON r.salesman_id = u.id
      WHERE r.id = $1
    `, [id]);
    
    res.status(201).json({
      success: true,
      data: route
    });
  } catch (error) {
    console.error('Error creating route:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create route'
    });
  }
});

/**
 * @swagger
 * /api/routes/{id}:
 *   put:
 *     summary: Update route
 *     tags: [Routes]
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
 *               code:
 *                 type: string
 *               name:
 *                 type: string
 *               area_id:
 *                 type: string
 *               agent_id:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *               visit_frequency:
 *                 type: string
 *                 enum: [daily, weekly, bi-weekly, monthly]
 *               estimated_duration:
 *                 type: integer
 *               target_calls:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Route updated successfully
 *       404:
 *         description: Route not found
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      code, name, area_id, agent_id, description, status,
      visit_frequency, estimated_duration, target_calls
    } = req.body;
    
    // Check if route exists
    const existingRoute = await getOneQuery('SELECT id FROM routes WHERE id = $1 AND tenant_id = $2', [id, req.tenantId]);
    if (!existingRoute) {
      return res.status(404).json({
        success: false,
        error: 'Route not found'
      });
    }
    
    // Check if code already exists (excluding current route)
    if (code) {
      const duplicateRoute = await getOneQuery('SELECT id FROM routes WHERE code = $1 AND tenant_id = $2 AND id != $3', [code, req.tenantId, id]);
      if (duplicateRoute) {
        return res.status(400).json({
          success: false,
          error: 'Route code already exists'
        });
      }
    }
    
    const now = new Date().toISOString();
    
    await runQuery(`
      UPDATE routes SET
        code = COALESCE($1, code),
        name = COALESCE($2, name),
        area_id = COALESCE($3, area_id),
        agent_id = $4,
        description = $5,
        status = COALESCE($6, status),
        visit_frequency = COALESCE($7, visit_frequency),
        estimated_duration = $8,
        target_calls = $9,
        updated_at = $10
      WHERE id = $11 AND tenant_id = $12
    `, [
      code, name, area_id, agent_id || null, description || null, status,
      visit_frequency, estimated_duration || null, target_calls || null, now, id, req.tenantId
    ]);
    
    // Fetch the updated route with joined data
    const route = await getOneQuery(`
      SELECT 
        r.*,
        a.name as area_name,
        reg.name as region_name,
        u.first_name || ' ' || u.last_name as agent_name
      FROM routes r
      LEFT JOIN areas a ON r.area_id = a.id
      LEFT JOIN regions reg ON a.region_id = reg.id
      LEFT JOIN users u ON r.salesman_id = u.id
      WHERE r.id = $1
    `, [id]);
    
    res.json({
      success: true,
      data: route
    });
  } catch (error) {
    console.error('Error updating route:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update route'
    });
  }
});

/**
 * @swagger
 * /api/routes/{id}:
 *   delete:
 *     summary: Delete route
 *     tags: [Routes]
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
 *         description: Route deleted successfully
 *       404:
 *         description: Route not found
 *       400:
 *         description: Cannot delete route with associated customers
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if route exists
    const existingRoute = await getOneQuery('SELECT id FROM routes WHERE id = $1 AND tenant_id = $2', [id, req.tenantId]);
    if (!existingRoute) {
      return res.status(404).json({
        success: false,
        error: 'Route not found'
      });
    }
    
    // Check if route has associated customers
    const customerCount = await getOneQuery('SELECT COUNT(*)::int as count FROM customers WHERE route_id = $1', [id]);
    if (customerCount.count > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete route with associated customers'
      });
    }
    
    await runQuery('DELETE FROM routes WHERE id = $1 AND tenant_id = $2', [id, req.tenantId]);
    
    res.json({
      success: true,
      message: 'Route deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting route:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete route'
    });
  }
});

module.exports = router;
