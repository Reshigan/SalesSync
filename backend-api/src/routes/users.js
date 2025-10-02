const express = require('express');
const bcrypt = require('bcryptjs');
const Joi = require('joi');
const { v4: uuidv4 } = require('uuid');
// Database functions will be lazy-loaded to avoid circular dependencies
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const { requireFunction } = require('../middleware/authMiddleware');
const { checkUserLimits } = require('../middleware/tenantMiddleware');

const router = express.Router();

// Validation schemas
const createUserSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  firstName: Joi.string().required().min(1).max(100),
  lastName: Joi.string().required().min(1).max(100),
  phone: Joi.string().optional(),
  role: Joi.string().valid('admin', 'manager', 'salesman', 'promoter', 'merchandiser', 'field_agent', 'warehouse_staff').required()
});

const updateUserSchema = Joi.object({
  email: Joi.string().email().optional(),
  firstName: Joi.string().min(1).max(100).optional(),
  lastName: Joi.string().min(1).max(100).optional(),
  phone: Joi.string().optional(),
  role: Joi.string().valid('admin', 'manager', 'salesman', 'promoter', 'merchandiser', 'field_agent', 'warehouse_staff').optional(),
  status: Joi.string().valid('active', 'inactive', 'suspended').optional()
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(6).required()
});

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users for tenant
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 */
router.get('/', requireFunction('users', 'view'), asyncHandler(async (req, res, next) => {
  // Lazy-load database functions
  const { getQuery, getOneQuery } = require('../database/init');
  
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;
  const { role, status, search } = req.query;
  
  try {
    let whereClause = 'WHERE tenant_id = ?';
    let params = [req.tenantId];
    
    if (role) {
      whereClause += ' AND role = ?';
      params.push(role);
    }
    
    if (status) {
      whereClause += ' AND status = ?';
      params.push(status);
    }
    
    if (search) {
      whereClause += ' AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }
    
    // Get users with pagination
    const users = await getQuery(`
      SELECT 
        id, email, first_name, last_name, phone, role, status, last_login, created_at
      FROM users 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, limit, offset]);
    
    // Get total count
    const totalResult = await getOneQuery(`
      SELECT COUNT(*) as total FROM users ${whereClause}
    `, params);
    
    const total = totalResult.total;
    const totalPages = Math.ceil(total / limit);
    
    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });
    
  } catch (error) {
    next(error);
  }
}));

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Create a new user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - firstName
 *               - lastName
 *               - role
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               phone:
 *                 type: string
 *               role:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created successfully
 */
router.post('/', requireFunction('users', 'create'), checkUserLimits, asyncHandler(async (req, res, next) => {
  // Lazy-load database functions
  const { getOneQuery, runQuery } = require('../database/init');
  
  const { error, value } = createUserSchema.validate(req.body);
  if (error) {
    return next(new AppError(error.details[0].message, 400, 'VALIDATION_ERROR'));
  }
  
  const { email, password, firstName, lastName, phone, role } = value;
  
  try {
    // Check if email already exists in this tenant
    const existingUser = await getOneQuery(
      'SELECT id FROM users WHERE email = ? AND tenant_id = ?',
      [email, req.tenantId]
    );
    
    if (existingUser) {
      return next(new AppError('Email already exists', 409, 'DUPLICATE_EMAIL'));
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS) || 12);
    
    // Create user
    const userId = uuidv4();
    await runQuery(`
      INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, phone, role, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [userId, req.tenantId, email, hashedPassword, firstName, lastName, phone, role, 'active']);
    
    // Get created user (without password)
    const createdUser = await getOneQuery(`
      SELECT id, email, first_name, last_name, phone, role, status, created_at
      FROM users WHERE id = ?
    `, [userId]);
    
    res.status(201).json({
      success: true,
      data: {
        user: createdUser
      }
    });
    
  } catch (error) {
    next(error);
  }
}));

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
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
 *         description: User retrieved successfully
 *       404:
 *         description: User not found
 */
router.get('/:id', requireFunction('users', 'view'), asyncHandler(async (req, res, next) => {
  // Lazy-load database functions
  const { getOneQuery } = require('../database/init');
  
  const { id } = req.params;
  
  try {
    const user = await getOneQuery(`
      SELECT 
        u.id, u.email, u.first_name, u.last_name, u.phone, u.role, u.status, u.last_login, u.created_at,
        a.id as agent_id, a.agent_type, a.employee_code, a.hire_date
      FROM users u
      LEFT JOIN agents a ON a.user_id = u.id AND a.tenant_id = u.tenant_id
      WHERE u.id = ? AND u.tenant_id = ?
    `, [id, req.tenantId]);
    
    if (!user) {
      return next(new AppError('User not found', 404, 'USER_NOT_FOUND'));
    }
    
    res.json({
      success: true,
      data: {
        user
      }
    });
    
  } catch (error) {
    next(error);
  }
}));

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Update user
 *     tags: [Users]
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
 *               email:
 *                 type: string
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               phone:
 *                 type: string
 *               role:
 *                 type: string
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: User updated successfully
 */
router.put('/:id', requireFunction('users', 'edit'), asyncHandler(async (req, res, next) => {
  // Lazy-load database functions
  const { getOneQuery, runQuery } = require('../database/init');
  
  const { id } = req.params;
  const { error, value } = updateUserSchema.validate(req.body);
  
  if (error) {
    return next(new AppError(error.details[0].message, 400, 'VALIDATION_ERROR'));
  }
  
  try {
    // Check if user exists
    const existingUser = await getOneQuery(
      'SELECT * FROM users WHERE id = ? AND tenant_id = ?',
      [id, req.tenantId]
    );
    
    if (!existingUser) {
      return next(new AppError('User not found', 404, 'USER_NOT_FOUND'));
    }
    
    // Check if email is being changed and already exists
    if (value.email && value.email !== existingUser.email) {
      const emailExists = await getOneQuery(
        'SELECT id FROM users WHERE email = ? AND tenant_id = ? AND id != ?',
        [value.email, req.tenantId, id]
      );
      
      if (emailExists) {
        return next(new AppError('Email already exists', 409, 'DUPLICATE_EMAIL'));
      }
    }
    
    // Build update query
    const updateFields = [];
    const updateValues = [];
    
    Object.keys(value).forEach(key => {
      if (value[key] !== undefined) {
        if (key === 'firstName') {
          updateFields.push('first_name = ?');
        } else if (key === 'lastName') {
          updateFields.push('last_name = ?');
        } else {
          updateFields.push(`${key} = ?`);
        }
        updateValues.push(value[key]);
      }
    });
    
    if (updateFields.length === 0) {
      return next(new AppError('No fields to update', 400, 'NO_UPDATE_FIELDS'));
    }
    
    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateValues.push(id, req.tenantId);
    
    await runQuery(`
      UPDATE users 
      SET ${updateFields.join(', ')} 
      WHERE id = ? AND tenant_id = ?
    `, updateValues);
    
    // Get updated user
    const updatedUser = await getOneQuery(`
      SELECT id, email, first_name, last_name, phone, role, status, last_login, created_at
      FROM users WHERE id = ? AND tenant_id = ?
    `, [id, req.tenantId]);
    
    res.json({
      success: true,
      data: {
        user: updatedUser
      }
    });
    
  } catch (error) {
    next(error);
  }
}));

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Delete user
 *     tags: [Users]
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
 *         description: User deleted successfully
 */
router.delete('/:id', requireFunction('users', 'delete'), asyncHandler(async (req, res, next) => {
  // Lazy-load database functions
  const { getOneQuery, runQuery } = require('../database/init');
  
  const { id } = req.params;
  
  try {
    // Check if user exists
    const existingUser = await getOneQuery(
      'SELECT * FROM users WHERE id = ? AND tenant_id = ?',
      [id, req.tenantId]
    );
    
    if (!existingUser) {
      return next(new AppError('User not found', 404, 'USER_NOT_FOUND'));
    }
    
    // Prevent deleting self
    if (id === req.user.id) {
      return next(new AppError('Cannot delete your own account', 400, 'CANNOT_DELETE_SELF'));
    }
    
    // Soft delete by setting status to inactive
    await runQuery(
      'UPDATE users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND tenant_id = ?',
      ['inactive', id, req.tenantId]
    );
    
    res.json({
      success: true,
      message: 'User deleted successfully'
    });
    
  } catch (error) {
    next(error);
  }
}));

/**
 * @swagger
 * /api/users/{id}/change-password:
 *   post:
 *     summary: Change user password
 *     tags: [Users]
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
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password changed successfully
 */
router.post('/:id/change-password', asyncHandler(async (req, res, next) => {
  // Lazy-load database functions
  const { getOneQuery, runQuery } = require('../database/init');
  
  const { id } = req.params;
  const { error, value } = changePasswordSchema.validate(req.body);
  
  if (error) {
    return next(new AppError(error.details[0].message, 400, 'VALIDATION_ERROR'));
  }
  
  const { currentPassword, newPassword } = value;
  
  try {
    // Only allow users to change their own password or admins to change any password
    if (id !== req.user.id && req.user.role !== 'admin') {
      return next(new AppError('Insufficient permissions', 403, 'INSUFFICIENT_PERMISSIONS'));
    }
    
    // Get user
    const user = await getOneQuery(
      'SELECT * FROM users WHERE id = ? AND tenant_id = ?',
      [id, req.tenantId]
    );
    
    if (!user) {
      return next(new AppError('User not found', 404, 'USER_NOT_FOUND'));
    }
    
    // Verify current password (skip for admin changing other user's password)
    if (id === req.user.id) {
      const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
      if (!isValidPassword) {
        return next(new AppError('Current password is incorrect', 400, 'INVALID_CURRENT_PASSWORD'));
      }
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, parseInt(process.env.BCRYPT_ROUNDS) || 12);
    
    // Update password
    await runQuery(
      'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND tenant_id = ?',
      [hashedPassword, id, req.tenantId]
    );
    
    res.json({
      success: true,
      message: 'Password changed successfully'
    });
    
  } catch (error) {
    next(error);
  }
}));

/**
 * @swagger
 * /api/users/roles:
 *   get:
 *     summary: Get available user roles
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Roles retrieved successfully
 */
router.get('/roles', asyncHandler(async (req, res) => {
  const roles = [
    { value: 'admin', label: 'Administrator', description: 'Full system access' },
    { value: 'manager', label: 'Manager', description: 'Regional or area management' },
    { value: 'salesman', label: 'Van Salesman', description: 'Van sales operations' },
    { value: 'promoter', label: 'Promoter', description: 'Product promotion activities' },
    { value: 'merchandiser', label: 'Merchandiser', description: 'Store merchandising' },
    { value: 'field_agent', label: 'Field Agent', description: 'Digital distribution' },
    { value: 'warehouse_staff', label: 'Warehouse Staff', description: 'Inventory management' }
  ];
  
  res.json({
    success: true,
    data: {
      roles
    }
  });
}));

module.exports = router;