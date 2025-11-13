const express = require('express');
const { getQuery, getOneQuery, runQuery } = require('../utils/database');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
// Authentication middleware is applied globally in server.js

/**
 * @swagger
 * components:
 *   schemas:
 *     Agent:
 *       type: object
 *       required:
 *         - employeeId
 *         - firstName
 *         - lastName
 *         - email
 *         - phone
 *         - role
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier for the agent
 *         employeeId:
 *           type: string
 *           description: Employee ID
 *         firstName:
 *           type: string
 *           description: First name
 *         lastName:
 *           type: string
 *           description: Last name
 *         email:
 *           type: string
 *           description: Email address
 *         phone:
 *           type: string
 *           description: Phone number
 *         role:
 *           type: string
 *           enum: [sales_agent, merchandiser, promoter, supervisor]
 *           description: Agent role
 *         area_id:
 *           type: string
 *           description: ID of the assigned area
 *         route_id:
 *           type: string
 *           description: ID of the assigned route
 *         manager_id:
 *           type: string
 *           description: ID of the manager
 *         status:
 *           type: string
 *           enum: [active, inactive, suspended]
 *           description: Agent status
 *         hire_date:
 *           type: string
 *           format: date
 *           description: Hire date
 *         performance_rating:
 *           type: number
 *           description: Performance rating (1-5)
 *         monthly_target:
 *           type: number
 *           description: Monthly sales target
 *         ytd_sales:
 *           type: number
 *           description: Year-to-date sales
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/agents:
 *   get:
 *     summary: Get all agents
 *     tags: [Agents]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of agents
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
 *                     $ref: '#/components/schemas/Agent'
 */
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT 
        u.*,
        0 as ytd_sales,
        0 as performance_rating,
        NULL as last_activity
      FROM users u
      WHERE u.tenant_id = $1 AND u.role IN ('sales_agent', 'field_agent', 'merchandiser', 'promoter', 'supervisor', 'van_sales_agent', 'agent')
      ORDER BY u.first_name, u.last_name
    `;
    
    const agents = await getQuery(query, [req.tenantId]);
    
    res.json({
      success: true,
      data: agents
    });
  } catch (error) {
    console.error('Error fetching agents:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch agents'
    });
  }
});

/**
 * @swagger
 * /api/agents/{id}:
 *   get:
 *     summary: Get agent by ID
 *     tags: [Agents]
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
 *         description: Agent details
 *       404:
 *         description: Agent not found
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT 
        u.*,
        a.name as area_name,
        r.name as route_name,
        mgr.first_name || ' ' || mgr.last_name as manager_name
      FROM users u
      LEFT JOIN areas a ON u.area_id = a.id
      LEFT JOIN routes r ON u.route_id = r.id
      LEFT JOIN users mgr ON u.manager_id = mgr.id
      WHERE u.id = $1 AND u.tenant_id = $2 AND u.role IN ('sales_agent', 'field_agent', 'merchandiser', 'promoter', 'supervisor', 'agent')
    `;
    
    const agent = await getOneQuery(query, [id, req.tenantId]);
    
    if (!agent) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found'
      });
    }
    
    res.json({
      success: true,
      data: agent
    });
  } catch (error) {
    console.error('Error fetching agent:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch agent'
    });
  }
});

/**
 * @swagger
 * /api/agents:
 *   post:
 *     summary: Create new agent
 *     tags: [Agents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - employeeId
 *               - firstName
 *               - lastName
 *               - email
 *               - phone
 *               - role
 *               - hire_date
 *             properties:
 *               employeeId:
 *                 type: string
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [sales_agent, merchandiser, promoter, supervisor]
 *               area_id:
 *                 type: string
 *               route_id:
 *                 type: string
 *               manager_id:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [active, inactive, suspended]
 *               hire_date:
 *                 type: string
 *                 format: date
 *               monthly_target:
 *                 type: number
 *     responses:
 *       201:
 *         description: Agent created successfully
 *       400:
 *         description: Invalid input
 */
router.post('/', async (req, res) => {
  try {
    const { 
      employeeId, firstName, lastName, email, phone, role,
      area_id, route_id, manager_id, status = 'active',
      hire_date, monthly_target
    } = req.body;
    
    // Validate required fields
    if (!employeeId || !firstName || !lastName || !email || !phone || !role || !hire_date) {
      return res.status(400).json({
        success: false,
        error: 'Employee ID, first name, last name, email, phone, role, and hire date are required'
      });
    }
    
    // Check if employee ID already exists
    const existingAgent = await getOneQuery('SELECT id FROM users WHERE employee_id = $1 AND tenant_id = $2', [employeeId, req.tenantId]);
    if (existingAgent) {
      return res.status(400).json({
        success: false,
        error: 'Employee ID already exists'
      });
    }
    
    // Check if email already exists
    const existingEmail = await getOneQuery('SELECT id FROM users WHERE email = $1 AND tenant_id = $2', [email, req.tenantId]);
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        error: 'Email already exists'
      });
    }
    
    const id = uuidv4();
    const now = new Date().toISOString();
    
    // Generate a temporary password (should be changed on first login)
    const tempPassword = 'TempPass123!';
    const hashedPassword = await bcrypt.hash(tempPassword, 10);
    
    const insertQuery = `
      INSERT INTO users (
        id, tenant_id, employee_id, first_name, last_name, email, phone, password_hash,
        role, area_id, route_id, manager_id, status, hire_date, monthly_target,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
    `;
    
    await runQuery(insertQuery, [
      id, req.tenantId, employeeId, firstName, lastName, email, phone, hashedPassword,
      role, area_id || null, route_id || null, manager_id || null, status, hire_date, monthly_target || null,
      now, now
    ]);
    
    // Fetch the created agent with joined data
    const query = `
      SELECT 
        u.*,
        a.name as area_name,
        r.name as route_name,
        mgr.first_name || ' ' || mgr.last_name as manager_name
      FROM users u
      LEFT JOIN areas a ON u.area_id = a.id
      LEFT JOIN routes r ON u.route_id = r.id
      LEFT JOIN users mgr ON u.manager_id = mgr.id
      WHERE u.id = $1
    `;
    
    const agent = await getOneQuery(query, [id]);
    
    // Remove password hash from response
    delete agent.password_hash;
    
    res.status(201).json({
      success: true,
      data: agent,
      message: `Agent created with temporary password: ${tempPassword}`
    });
  } catch (error) {
    console.error('Error creating agent:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create agent'
    });
  }
});

/**
 * @swagger
 * /api/agents/{id}:
 *   put:
 *     summary: Update agent
 *     tags: [Agents]
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
 *               employeeId:
 *                 type: string
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [sales_agent, merchandiser, promoter, supervisor]
 *               area_id:
 *                 type: string
 *               route_id:
 *                 type: string
 *               manager_id:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [active, inactive, suspended]
 *               hire_date:
 *                 type: string
 *                 format: date
 *               monthly_target:
 *                 type: number
 *     responses:
 *       200:
 *         description: Agent updated successfully
 *       404:
 *         description: Agent not found
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      employeeId, firstName, lastName, email, phone, role,
      area_id, route_id, manager_id, status, hire_date, monthly_target
    } = req.body;
    
    // Check if agent exists
    const existingAgent = await getOneQuery('SELECT id FROM users WHERE id = $1 AND tenant_id = $2 AND role IN ($3, $4, $5, $6)', [
      id, req.tenantId, 'sales_agent', 'merchandiser', 'promoter', 'supervisor'
    ]);
    if (!existingAgent) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found'
      });
    }
    
    // Check if employee ID already exists (excluding current agent)
    if (employeeId) {
      const duplicateAgent = await getOneQuery('SELECT id FROM users WHERE employee_id = $1 AND tenant_id = $2 AND id != $3', [employeeId, req.tenantId, id]);
      if (duplicateAgent) {
        return res.status(400).json({
          success: false,
          error: 'Employee ID already exists'
        });
      }
    }
    
    // Check if email already exists (excluding current agent)
    if (email) {
      const duplicateEmail = await getOneQuery('SELECT id FROM users WHERE email = $1 AND tenant_id = $2 AND id != $3', [email, req.tenantId, id]);
      if (duplicateEmail) {
        return res.status(400).json({
          success: false,
          error: 'Email already exists'
        });
      }
    }
    
    const now = new Date().toISOString();
    
    const updateQuery = `
      UPDATE users SET
        employee_id = COALESCE($1, employee_id),
        first_name = COALESCE($2, first_name),
        last_name = COALESCE($3, last_name),
        email = COALESCE($4, email),
        phone = COALESCE($5, phone),
        role = COALESCE($6, role),
        area_id = $7,
        route_id = $8,
        manager_id = $9,
        status = COALESCE($10, status),
        hire_date = COALESCE($11, hire_date),
        monthly_target = $12,
        updated_at = $13
      WHERE id = $14 AND tenant_id = $15
    `;
    
    await runQuery(updateQuery, [
      employeeId, firstName, lastName, email, phone, role,
      area_id || null, route_id || null, manager_id || null, status, hire_date, monthly_target || null,
      now, id, req.tenantId
    ]);
    
    // Fetch the updated agent with joined data
    const query = `
      SELECT 
        u.*,
        a.name as area_name,
        r.name as route_name,
        mgr.first_name || ' ' || mgr.last_name as manager_name
      FROM users u
      LEFT JOIN areas a ON u.area_id = a.id
      LEFT JOIN routes r ON u.route_id = r.id
      LEFT JOIN users mgr ON u.manager_id = mgr.id
      WHERE u.id = $1
    `;
    
    const agent = await getOneQuery(query, [id]);
    
    // Remove password from response
    delete agent.password;
    
    res.json({
      success: true,
      data: agent
    });
  } catch (error) {
    console.error('Error updating agent:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update agent'
    });
  }
});

/**
 * @swagger
 * /api/agents/{id}:
 *   delete:
 *     summary: Delete agent
 *     tags: [Agents]
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
 *         description: Agent deleted successfully
 *       404:
 *         description: Agent not found
 *       400:
 *         description: Cannot delete agent with associated data
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if agent exists
    const existingAgent = await getOneQuery('SELECT id FROM users WHERE id = $1 AND tenant_id = $2 AND role IN ($3, $4, $5, $6)', [
      id, req.tenantId, 'sales_agent', 'merchandiser', 'promoter', 'supervisor'
    ]);
    if (!existingAgent) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found'
      });
    }
    
    // Check if agent has associated orders
    const orderCount = await getOneQuery('SELECT COUNT(*)::int as count FROM orders WHERE agent_id = $1', [id]);
    if (orderCount && orderCount.count > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete agent with associated orders'
      });
    }
    
    // Check if agent has associated visits
    const visitCount = await getOneQuery('SELECT COUNT(*)::int as count FROM visits WHERE agent_id = $1', [id]);
    if (visitCount && visitCount.count > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete agent with associated visits'
      });
    }
    
    await runQuery('DELETE FROM users WHERE id = $1 AND tenant_id = $2', [id, req.tenantId]);
    
    res.json({
      success: true,
      message: 'Agent deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting agent:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete agent'
    });
  }
});

module.exports = router;
