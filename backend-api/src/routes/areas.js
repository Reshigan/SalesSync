const express = require('express');
const getDatabase = () => require('../utils/database').getDatabase();
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
// Authentication middleware is applied globally in server.js

/**
 * @swagger
 * components:
 *   schemas:
 *     Area:
 *       type: object
 *       required:
 *         - code
 *         - name
 *         - region_id
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier for the area
 *         code:
 *           type: string
 *           description: Area code
 *         name:
 *           type: string
 *           description: Area name
 *         region_id:
 *           type: string
 *           description: ID of the parent region
 *         manager_id:
 *           type: string
 *           description: ID of the area manager
 *         description:
 *           type: string
 *           description: Area description
 *         status:
 *           type: string
 *           enum: [active, inactive]
 *           description: Area status
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/areas:
 *   get:
 *     summary: Get all areas
 *     tags: [Areas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of areas
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
 *                     $ref: '#/components/schemas/Area'
 */
router.get('/', async (req, res) => {
  try {
    const db = getDatabase();
    
    const query = `
      SELECT 
        a.*,
        r.name as region_name,
        u.first_name || ' ' || u.last_name as manager_name,
        COUNT(DISTINCT rt.id) as route_count,
        COUNT(DISTINCT ag.id) as agent_count
      FROM areas a
      LEFT JOIN regions r ON a.region_id = r.id
      LEFT JOIN users u ON a.manager_id = u.id
      LEFT JOIN routes rt ON a.id = rt.area_id
      LEFT JOIN users ag ON rt.salesman_id = ag.id
      WHERE a.tenant_id = ?
      GROUP BY a.id
      ORDER BY a.name
    `;
    
    const areas = db.prepare(query).all(req.tenantId);
    
    res.json({
      success: true,
      data: areas
    });
  } catch (error) {
    console.error('Error fetching areas:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch areas'
    });
  }
});

/**
 * @swagger
 * /api/areas/{id}:
 *   get:
 *     summary: Get area by ID
 *     tags: [Areas]
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
 *         description: Area details
 *       404:
 *         description: Area not found
 */
router.get('/:id', async (req, res) => {
  try {
    const db = getDatabase();
    const { id } = req.params;
    
    const query = `
      SELECT 
        a.*,
        r.name as region_name,
        u.first_name || ' ' || u.last_name as manager_name
      FROM areas a
      LEFT JOIN regions r ON a.region_id = r.id
      LEFT JOIN users u ON a.manager_id = u.id
      WHERE a.id = ? AND a.tenant_id = ?
    `;
    
    const area = db.prepare(query).get(id, req.tenantId);
    
    if (!area) {
      return res.status(404).json({
        success: false,
        error: 'Area not found'
      });
    }
    
    res.json({
      success: true,
      data: area
    });
  } catch (error) {
    console.error('Error fetching area:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch area'
    });
  }
});

/**
 * @swagger
 * /api/areas:
 *   post:
 *     summary: Create new area
 *     tags: [Areas]
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
 *               - region_id
 *             properties:
 *               code:
 *                 type: string
 *               name:
 *                 type: string
 *               region_id:
 *                 type: string
 *               manager_id:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *     responses:
 *       201:
 *         description: Area created successfully
 *       400:
 *         description: Invalid input
 */
router.post('/', async (req, res) => {
  try {
    const db = getDatabase();
    const { code, name, region_id, manager_id, description, status = 'active' } = req.body;
    
    // Validate required fields
    if (!code || !name || !region_id) {
      return res.status(400).json({
        success: false,
        error: 'Code, name, and region_id are required'
      });
    }
    
    // Check if code already exists
    const existingArea = db.prepare('SELECT id FROM areas WHERE code = ? AND tenant_id = ?').get(code, req.tenantId);
    if (existingArea) {
      return res.status(400).json({
        success: false,
        error: 'Area code already exists'
      });
    }
    
    const id = uuidv4();
    const now = new Date().toISOString();
    
    const insertQuery = `
      INSERT INTO areas (
        id, tenant_id, code, name, region_id, manager_id, description, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    db.prepare(insertQuery).run(
      id, req.tenantId, code, name, region_id, manager_id || null, description || null, status, now, now
    );
    
    // Fetch the created area with joined data
    const query = `
      SELECT 
        a.*,
        r.name as region_name,
        u.first_name || ' ' || u.last_name as manager_name
      FROM areas a
      LEFT JOIN regions r ON a.region_id = r.id
      LEFT JOIN users u ON a.manager_id = u.id
      WHERE a.id = ?
    `;
    
    const area = db.prepare(query).get(id);
    
    res.status(201).json({
      success: true,
      data: area
    });
  } catch (error) {
    console.error('Error creating area:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create area'
    });
  }
});

/**
 * @swagger
 * /api/areas/{id}:
 *   put:
 *     summary: Update area
 *     tags: [Areas]
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
 *               region_id:
 *                 type: string
 *               manager_id:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *     responses:
 *       200:
 *         description: Area updated successfully
 *       404:
 *         description: Area not found
 */
router.put('/:id', async (req, res) => {
  try {
    const db = getDatabase();
    const { id } = req.params;
    const { code, name, region_id, manager_id, description, status } = req.body;
    
    // Check if area exists
    const existingArea = db.prepare('SELECT id FROM areas WHERE id = ? AND tenant_id = ?').get(id, req.tenantId);
    if (!existingArea) {
      return res.status(404).json({
        success: false,
        error: 'Area not found'
      });
    }
    
    // Check if code already exists (excluding current area)
    if (code) {
      const duplicateArea = db.prepare('SELECT id FROM areas WHERE code = ? AND tenant_id = ? AND id != ?').get(code, req.tenantId, id);
      if (duplicateArea) {
        return res.status(400).json({
          success: false,
          error: 'Area code already exists'
        });
      }
    }
    
    const now = new Date().toISOString();
    
    const updateQuery = `
      UPDATE areas SET
        code = COALESCE(?, code),
        name = COALESCE(?, name),
        region_id = COALESCE(?, region_id),
        manager_id = ?,
        description = ?,
        status = COALESCE(?, status),
        updated_at = ?
      WHERE id = ? AND tenant_id = ?
    `;
    
    db.prepare(updateQuery).run(
      code, name, region_id, manager_id || null, description || null, status, now, id, req.tenantId
    );
    
    // Fetch the updated area with joined data
    const query = `
      SELECT 
        a.*,
        r.name as region_name,
        u.first_name || ' ' || u.last_name as manager_name
      FROM areas a
      LEFT JOIN regions r ON a.region_id = r.id
      LEFT JOIN users u ON a.manager_id = u.id
      WHERE a.id = ?
    `;
    
    const area = db.prepare(query).get(id);
    
    res.json({
      success: true,
      data: area
    });
  } catch (error) {
    console.error('Error updating area:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update area'
    });
  }
});

/**
 * @swagger
 * /api/areas/{id}:
 *   delete:
 *     summary: Delete area
 *     tags: [Areas]
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
 *         description: Area deleted successfully
 *       404:
 *         description: Area not found
 *       400:
 *         description: Cannot delete area with associated routes
 */
router.delete('/:id', async (req, res) => {
  try {
    const db = getDatabase();
    const { id } = req.params;
    
    // Check if area exists
    const existingArea = db.prepare('SELECT id FROM areas WHERE id = ? AND tenant_id = ?').get(id, req.tenantId);
    if (!existingArea) {
      return res.status(404).json({
        success: false,
        error: 'Area not found'
      });
    }
    
    // Check if area has associated routes
    const routeCount = db.prepare('SELECT COUNT(*) as count FROM routes WHERE area_id = ?').get(id);
    if (routeCount.count > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete area with associated routes'
      });
    }
    
    db.prepare('DELETE FROM areas WHERE id = ? AND tenant_id = ?').run(id, req.tenantId);
    
    res.json({
      success: true,
      message: 'Area deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting area:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete area'
    });
  }
});

module.exports = router;