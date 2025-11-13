const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { authTenantMiddleware } = require('../middleware/authTenantMiddleware');

// Apply authentication middleware
router.use(authTenantMiddleware);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/pictures');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

/**
 * @swagger
 * components:
 *   schemas:
 *     PictureAssignment:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         assignment_type:
 *           type: string
 *           enum: [board_placement, storefront, product_display, competitor_analysis, customer_visit, event_coverage, audit, general]
 *         assigned_agent_id:
 *           type: string
 *         customer_id:
 *           type: string
 *         location_required:
 *           type: boolean
 *         due_date:
 *           type: string
 *           format: date-time
 *         priority:
 *           type: string
 *           enum: [low, medium, high, urgent]
 *         status:
 *           type: string
 *           enum: [assigned, in_progress, completed, overdue]
 *         instructions:
 *           type: string
 *     Picture:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         assignment_id:
 *           type: string
 *         filename:
 *           type: string
 *         original_name:
 *           type: string
 *         file_path:
 *           type: string
 *         file_size:
 *           type: integer
 *         mime_type:
 *           type: string
 *         gps_location:
 *           type: object
 *         captured_at:
 *           type: string
 *           format: date-time
 *         notes:
 *           type: string
 */

// PICTURE ASSIGNMENTS ENDPOINTS

/**
 * @swagger
 * /api/picture-assignments/assignments:
 *   get:
 *     summary: Get all picture assignments
 *     tags: [Picture Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: agent_id
 *         schema:
 *           type: string
 *         description: Filter by assigned agent
 *       - in: query
 *         name: assignment_type
 *         schema:
 *           type: string
 *         description: Filter by assignment type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by assignment status
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *         description: Filter by priority
 *       - in: query
 *         name: customer_id
 *         schema:
 *           type: string
 *         description: Filter by customer
 *       - in: query
 *         name: due_date_from
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter from due date
 *       - in: query
 *         name: due_date_to
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter to due date
 *     responses:
 *       200:
 *         description: List of picture assignments
 */
router.get('/assignments', async (req, res) => {
  try {
    const { getQuery } = await import('../utils/database.js');
    const { 
      agent_id, 
      assignment_type, 
      status, 
      priority, 
      customer_id, 
      due_date_from, 
      due_date_to 
    } = req.query;
    
    let query = `
      SELECT pa.*, 
             u.first_name || ' ' || u.last_name as agent_name,
             u.phone as agent_phone,
             c.business_name as customer_name,
             c.address as customer_address,
             COUNT(p.id) as total_pictures,
             COUNT(CASE WHEN p.id IS NOT NULL THEN 1 END) as completed_pictures
      FROM picture_assignments pa
      LEFT JOIN users a ON pa.assigned_agent_id = a.id
      LEFT JOIN users u ON a.user_id = u.id
      LEFT JOIN customers c ON pa.customer_id = c.id
      LEFT JOIN pictures p ON pa.id = p.assignment_id
      WHERE pa.tenant_id = ?
    `;
    
    const params = [req.user.tenantId];
    
    if (agent_id) {
      query += ' AND pa.assigned_agent_id = ?';
      params.push(agent_id);
    }
    
    if (assignment_type) {
      query += ' AND pa.assignment_type = ?';
      params.push(assignment_type);
    }
    
    if (status) {
      query += ' AND pa.status = ?';
      params.push(status);
    }
    
    if (priority) {
      query += ' AND pa.priority = ?';
      params.push(priority);
    }
    
    if (customer_id) {
      query += ' AND pa.customer_id = ?';
      params.push(customer_id);
    }
    
    if (due_date_from) {
      query += ' AND pa.due_date::date >= ?';
      params.push(due_date_from);
    }
    
    if (due_date_to) {
      query += ' AND pa.due_date::date <= ?';
      params.push(due_date_to);
    }
    
    query += ' GROUP BY pa.id ORDER BY pa.due_date ASC, pa.priority DESC';
    
    const assignments = await getQuery(query, params);
    
    res.json({
      success: true,
      data: { assignments }
    });
  } catch (error) {
    console.error('Error fetching picture assignments:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch picture assignments', code: 'FETCH_ERROR' }
    });
  }
});

/**
 * @swagger
 * /api/picture-assignments/assignments:
 *   post:
 *     summary: Create a new picture assignment
 *     tags: [Picture Assignments]
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
 *               - assignment_type
 *               - assigned_agent_id
 *               - due_date
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               assignment_type:
 *                 type: string
 *               assigned_agent_id:
 *                 type: string
 *               customer_id:
 *                 type: string
 *               location_required:
 *                 type: boolean
 *               due_date:
 *                 type: string
 *                 format: date-time
 *               priority:
 *                 type: string
 *               instructions:
 *                 type: string
 *               required_pictures:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Picture assignment created successfully
 */
router.post('/assignments', async (req, res) => {
  try {
    const { runQuery } = await import('../utils/database.js');
    const { 
      title, 
      description, 
      assignment_type, 
      assigned_agent_id, 
      customer_id, 
      location_required, 
      due_date, 
      priority, 
      instructions,
      required_pictures
    } = req.body;
    
    if (!title || !assignment_type || !assigned_agent_id || !due_date) {
      return res.status(400).json({
        success: false,
        error: { message: 'Missing required fields', code: 'VALIDATION_ERROR' }
      });
    }
    
    const result = await runQuery(`
      INSERT INTO picture_assignments (
        tenant_id, title, description, assignment_type, 
        assigned_agent_id, customer_id, location_required, 
        due_date, priority, instructions, required_pictures, status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'assigned')
    `, [
      req.user.tenantId, 
      title, 
      description, 
      assignment_type, 
      assigned_agent_id, 
      customer_id, 
      location_required || false, 
      due_date, 
      priority || 'medium', 
      instructions,
      required_pictures || 1
    ]);
    
    res.status(201).json({
      success: true,
      data: { 
        id: result.lastID,
        message: 'Picture assignment created successfully'
      }
    });
  } catch (error) {
    console.error('Error creating picture assignment:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to create picture assignment', code: 'CREATE_ERROR' }
    });
  }
});

/**
 * @swagger
 * /api/picture-assignments/assignments/{id}/reassign:
 *   put:
 *     summary: Reassign a picture assignment to another agent
 *     tags: [Picture Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Assignment ID
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
 *         description: Assignment reassigned successfully
 */
router.put('/assignments/:id/reassign', async (req, res) => {
  try {
    const { runQuery, getOneQuery } = await import('../utils/database.js');
    const { id } = req.params;
    const { new_agent_id, reason } = req.body;
    
    // Verify assignment exists
    const assignment = await getOneQuery(
      'SELECT * FROM picture_assignments WHERE id = ? AND tenant_id = ?',
      [id, req.user.tenantId]
    );
    
    if (!assignment) {
      return res.status(404).json({
        success: false,
        error: { message: 'Picture assignment not found', code: 'NOT_FOUND' }
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
      INSERT INTO assignment_reassignments (
        assignment_id, assignment_type, old_agent_id, new_agent_id, reason, reassigned_at
      )
      VALUES (?, 'picture', ?, ?, ?, CURRENT_TIMESTAMP)
    `, [id, assignment.assigned_agent_id, new_agent_id, reason]);
    
    // Update the assignment
    await runQuery(`
      UPDATE picture_assignments 
      SET assigned_agent_id = ?,
          status = 'assigned',
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND tenant_id = ?
    `, [new_agent_id, id, req.user.tenantId]);
    
    res.json({
      success: true,
      data: { message: 'Picture assignment reassigned successfully' }
    });
  } catch (error) {
    console.error('Error reassigning picture assignment:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to reassign assignment', code: 'REASSIGN_ERROR' }
    });
  }
});

// PICTURE UPLOAD ENDPOINTS

/**
 * @swagger
 * /api/picture-assignments/assignments/{id}/upload:
 *   post:
 *     summary: Upload pictures for an assignment
 *     tags: [Picture Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Assignment ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               pictures:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *               gps_location:
 *                 type: string
 *                 description: JSON string of GPS coordinates
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Pictures uploaded successfully
 */
router.post('/assignments/:id/upload', upload.array('pictures', 10), async (req, res) => {
  try {
    const { runQuery, getOneQuery } = await import('../utils/database.js');
    const { id } = req.params;
    const { gps_location, notes } = req.body;
    
    // Verify assignment exists
    const assignment = await getOneQuery(
      'SELECT * FROM picture_assignments WHERE id = ? AND tenant_id = ?',
      [id, req.user.tenantId]
    );
    
    if (!assignment) {
      return res.status(404).json({
        success: false,
        error: { message: 'Picture assignment not found', code: 'NOT_FOUND' }
      });
    }
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'No pictures uploaded', code: 'VALIDATION_ERROR' }
      });
    }
    
    // Parse GPS location if provided
    let parsedGpsLocation = null;
    if (gps_location) {
      try {
        parsedGpsLocation = JSON.parse(gps_location);
      } catch (e) {
        return res.status(400).json({
          success: false,
          error: { message: 'Invalid GPS location format', code: 'VALIDATION_ERROR' }
        });
      }
    }
    
    // Validate GPS location if required
    if (assignment.location_required && !parsedGpsLocation) {
      return res.status(400).json({
        success: false,
        error: { message: 'GPS location is required for this assignment', code: 'VALIDATION_ERROR' }
      });
    }
    
    const uploadedPictures = [];
    
    // Save each uploaded file to database
    for (const file of req.files) {
      const result = await runQuery(`
        INSERT INTO pictures (
          assignment_id, filename, original_name, file_path, 
          file_size, mime_type, gps_location, notes, captured_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `, [
        id,
        file.filename,
        file.originalname,
        file.path,
        file.size,
        file.mimetype,
        parsedGpsLocation ? JSON.stringify(parsedGpsLocation) : null,
        notes
      ]);
      
      uploadedPictures.push({
        id: result.lastID,
        filename: file.filename,
        original_name: file.originalname,
        file_size: file.size
      });
    }
    
    // Update assignment status
    const totalPictures = await getOneQuery(
      'SELECT COUNT(*) as count FROM pictures WHERE assignment_id = ?',
      [id]
    );
    
    if (totalPictures.count >= assignment.required_pictures) {
      await runQuery(
        'UPDATE picture_assignments SET status = ?, completed_at = CURRENT_TIMESTAMP WHERE id = ?',
        ['completed', id]
      );
    } else {
      await runQuery(
        'UPDATE picture_assignments SET status = ? WHERE id = ?',
        ['in_progress', id]
      );
    }
    
    res.json({
      success: true,
      data: { 
        message: 'Pictures uploaded successfully',
        uploaded_pictures: uploadedPictures,
        total_pictures: totalPictures.count + req.files.length
      }
    });
  } catch (error) {
    console.error('Error uploading pictures:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to upload pictures', code: 'UPLOAD_ERROR' }
    });
  }
});

/**
 * @swagger
 * /api/picture-assignments/assignments/{id}/pictures:
 *   get:
 *     summary: Get pictures for an assignment
 *     tags: [Picture Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Assignment ID
 *     responses:
 *       200:
 *         description: List of pictures for the assignment
 */
router.get('/assignments/:id/pictures', async (req, res) => {
  try {
    const { getQuery, getOneQuery } = await import('../utils/database.js');
    const { id } = req.params;
    
    // Verify assignment exists
    const assignment = await getOneQuery(
      'SELECT * FROM picture_assignments WHERE id = ? AND tenant_id = ?',
      [id, req.user.tenantId]
    );
    
    if (!assignment) {
      return res.status(404).json({
        success: false,
        error: { message: 'Picture assignment not found', code: 'NOT_FOUND' }
      });
    }
    
    const pictures = await getQuery(`
      SELECT id, filename, original_name, file_size, mime_type, 
             gps_location, notes, captured_at
      FROM pictures
      WHERE assignment_id = ?
      ORDER BY captured_at DESC
    `, [id]);
    
    // Parse GPS location JSON
    pictures.forEach(picture => {
      if (picture.gps_location) {
        try {
          picture.gps_location = JSON.parse(picture.gps_location);
        } catch (e) {
          picture.gps_location = null;
        }
      }
    });
    
    res.json({
      success: true,
      data: { pictures }
    });
  } catch (error) {
    console.error('Error fetching assignment pictures:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch pictures', code: 'FETCH_ERROR' }
    });
  }
});

/**
 * @swagger
 * /api/picture-assignments/pictures/{id}:
 *   get:
 *     summary: Get a specific picture file
 *     tags: [Picture Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Picture ID
 *     responses:
 *       200:
 *         description: Picture file
 *         content:
 *           image/*:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get('/pictures/:id', async (req, res) => {
  try {
    const { getOneQuery } = await import('../utils/database.js');
    const { id } = req.params;
    
    const picture = await getOneQuery(`
      SELECT p.*, pa.tenant_id
      FROM pictures p
      JOIN picture_assignments pa ON p.assignment_id = pa.id
      WHERE p.id = ? AND pa.tenant_id = ?
    `, [id, req.user.tenantId]);
    
    if (!picture) {
      return res.status(404).json({
        success: false,
        error: { message: 'Picture not found', code: 'NOT_FOUND' }
      });
    }
    
    // Check if file exists
    try {
      await fs.access(picture.file_path);
    } catch (error) {
      return res.status(404).json({
        success: false,
        error: { message: 'Picture file not found', code: 'FILE_NOT_FOUND' }
      });
    }
    
    res.setHeader('Content-Type', picture.mime_type);
    res.setHeader('Content-Disposition', `inline; filename="${picture.original_name}"`);
    res.sendFile(path.resolve(picture.file_path));
  } catch (error) {
    console.error('Error serving picture:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to serve picture', code: 'SERVE_ERROR' }
    });
  }
});

/**
 * @swagger
 * /api/picture-assignments/dashboard:
 *   get:
 *     summary: Get picture assignments dashboard data
 *     tags: [Picture Assignments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data
 */
router.get('/dashboard', async (req, res) => {
  try {
    const { getQuery, getOneQuery } = await import('../utils/database.js');
    
    // Get assignment statistics
    const assignmentStats = await getOneQuery(`
      SELECT 
        COUNT(*) as total_assignments,
        COUNT(CASE WHEN status = 'assigned' THEN 1 END) as pending_assignments,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_assignments,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_assignments,
        COUNT(CASE WHEN due_date < CURRENT_TIMESTAMP AND status != 'completed' THEN 1 END) as overdue_assignments
      FROM picture_assignments
      WHERE tenant_id = ?
    `, [req.user.tenantId]);
    
    // Get picture statistics
    const pictureStats = await getOneQuery(`
      SELECT 
        COUNT(p.id) as total_pictures,
        COALESCE(SUM(p.file_size), 0) as total_file_size,
        COUNT(CASE WHEN p.captured_at::date = DATE('now') THEN 1 END) as today_pictures
      FROM pictures p
      JOIN picture_assignments pa ON p.assignment_id = pa.id
      WHERE pa.tenant_id = ?
    `, [req.user.tenantId]);
    
    // Get assignments by type
    const assignmentsByType = await getQuery(`
      SELECT assignment_type, COUNT(*) as count
      FROM picture_assignments
      WHERE tenant_id = ?
      GROUP BY assignment_type
      ORDER BY count DESC
    `, [req.user.tenantId]);
    
    // Get recent assignments
    const recentAssignments = await getQuery(`
      SELECT pa.id, pa.title, pa.assignment_type, pa.status, pa.due_date,
             u.first_name || ' ' || u.last_name as agent_name
      FROM picture_assignments pa
      LEFT JOIN users a ON pa.assigned_agent_id = a.id
      LEFT JOIN users u ON a.user_id = u.id
      WHERE pa.tenant_id = ?
      ORDER BY pa.created_at DESC
      LIMIT 10
    `, [req.user.tenantId]);
    
    res.json({
      success: true,
      data: {
        assignmentStats,
        pictureStats,
        assignmentsByType,
        recentAssignments
      }
    });
  } catch (error) {
    console.error('Error fetching picture assignments dashboard:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch dashboard data', code: 'FETCH_ERROR' }
    });
  }
});

module.exports = router;