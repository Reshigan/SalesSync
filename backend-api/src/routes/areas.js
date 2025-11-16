const express = require('express');
const { getQuery, getOneQuery, runQuery } = require('../utils/database');
const { selectOne, selectMany, insertRow, updateRow, deleteRow } = require('../utils/pg-helpers');
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
      WHERE a.tenant_id = $1
      GROUP BY a.id, r.name, u.first_name, u.last_name
      ORDER BY a.name
    `;
    
    const areas = await getQuery(query, [req.tenantId]);
    
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
    
    const { id } = req.params;
    
    const query = `
      SELECT 
        a.*,
        r.name as region_name,
        u.first_name || ' ' || u.last_name as manager_name
      FROM areas a
      LEFT JOIN regions r ON a.region_id = r.id
      LEFT JOIN users u ON a.manager_id = u.id
      WHERE a.id = $1 AND a.tenant_id = $2
    `;
    
    const area = await getOneQuery(query, [id, req.tenantId]);
    
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
    
    const { code, name, region_id, manager_id, description, status = 'active' } = req.body;
    
    // Validate required fields
    if (!code || !name || !region_id) {
      return res.status(400).json({
        success: false,
        error: 'Code, name, and region_id are required'
      });
    }
    
    // Check if code already exists
    const existingArea = await getOneQuery('SELECT id FROM areas WHERE code = $1 AND tenant_id = $2', [code, req.tenantId]);
    if (existingArea) {
      return res.status(400).json({
        success: false,
        error: 'Area code already exists'
      });
    }
    
    const areaData = {
      code,
      name,
      region_id,
      manager_id: manager_id || null,
      description: description || null,
      status
    };
    
    const newArea = await insertRow('areas', areaData, req.tenantId);
    
    // Fetch the created area with joined data
    const query = `
      SELECT 
        a.*,
        r.name as region_name,
        u.first_name || ' ' || u.last_name as manager_name
      FROM areas a
      LEFT JOIN regions r ON a.region_id = r.id
      LEFT JOIN users u ON a.manager_id = u.id
      WHERE a.id = $1
    `;
    
    const area = await getOneQuery(query, [newArea.id]);
    
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
    
    const { id } = req.params;
    const { code, name, region_id, manager_id, description, status } = req.body;
    
    // Check if area exists
    const existingArea = await getOneQuery('SELECT id FROM areas WHERE id = $1 AND tenant_id = $2', [id, req.tenantId]);
    if (!existingArea) {
      return res.status(404).json({
        success: false,
        error: 'Area not found'
      });
    }
    
    // Check if code already exists (excluding current area)
    if (code) {
      const duplicateArea = await getOneQuery('SELECT id FROM areas WHERE code = $1 AND tenant_id = $2 AND id != $3', [code, req.tenantId, id]);
      if (duplicateArea) {
        return res.status(400).json({
          success: false,
          error: 'Area code already exists'
        });
      }
    }
    
    const updateData = {};
    if (code !== undefined) updateData.code = code;
    if (name !== undefined) updateData.name = name;
    if (region_id !== undefined) updateData.region_id = region_id;
    if (manager_id !== undefined) updateData.manager_id = manager_id;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;
    
    await updateRow('areas', updateData, { id }, req.tenantId);
    
    // Fetch the updated area with joined data
    const query = `
      SELECT 
        a.*,
        r.name as region_name,
        u.first_name || ' ' || u.last_name as manager_name
      FROM areas a
      LEFT JOIN regions r ON a.region_id = r.id
      LEFT JOIN users u ON a.manager_id = u.id
      WHERE a.id = $1
    `;
    
    const area = await getOneQuery(query, [id]);
    
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
    
    const { id } = req.params;
    
    // Check if area exists
    const existingArea = await getOneQuery('SELECT id FROM areas WHERE id = $1 AND tenant_id = $2', [id, req.tenantId]);
    if (!existingArea) {
      return res.status(404).json({
        success: false,
        error: 'Area not found'
      });
    }
    
    // Check if area has associated routes
    const routeCount = await getOneQuery('SELECT COUNT(*) as count FROM routes WHERE area_id = $1', [id]);
    if (routeCount.count > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete area with associated routes'
      });
    }
    
    await deleteRow('areas', { id }, req.tenantId);
    
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
