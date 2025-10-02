const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
// Database functions will be lazy-loaded to avoid circular dependencies
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const { tenantMiddleware } = require('../middleware/tenantMiddleware');

const router = express.Router();

// Validation schemas
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
  tenantCode: Joi.string().optional()
});

const refreshSchema = Joi.object({
  refreshToken: Joi.string().required()
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: User login
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *               tenantCode:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                     token:
 *                       type: string
 *                     refreshToken:
 *                       type: string
 *       400:
 *         description: Invalid credentials
 *       401:
 *         description: Authentication failed
 */
router.post('/login', asyncHandler(async (req, res, next) => {
  // Lazy-load database functions
  const { getOneQuery, runQuery } = require('../database/init');
  
  // Validate request
  const { error, value } = loginSchema.validate(req.body);
  if (error) {
    return next(new AppError(error.details[0].message, 400, 'VALIDATION_ERROR'));
  }
  
  const { email, password, tenantCode } = value;
  
  try {
    // Find user by email
    let user;
    if (tenantCode) {
      // Find user by email and tenant code
      user = await getOneQuery(`
        SELECT u.*, t.code as tenant_code, t.name as tenant_name, t.status as tenant_status
        FROM users u
        JOIN tenants t ON t.id = u.tenant_id
        WHERE u.email = ? AND t.code = ? AND u.status = 'active' AND t.status = 'active'
      `, [email, tenantCode.toUpperCase()]);
    } else {
      // Find user by email (first active tenant)
      user = await getOneQuery(`
        SELECT u.*, t.code as tenant_code, t.name as tenant_name, t.status as tenant_status
        FROM users u
        JOIN tenants t ON t.id = u.tenant_id
        WHERE u.email = ? AND u.status = 'active' AND t.status = 'active'
        ORDER BY u.created_at ASC
        LIMIT 1
      `, [email]);
    }
    
    if (!user) {
      return next(new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS'));
    }
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return next(new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS'));
    }
    
    // Generate tokens
    const tokenPayload = {
      userId: user.id,
      tenantId: user.tenant_id,
      role: user.role
    };
    
    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    });
    
    const refreshToken = jwt.sign(tokenPayload, process.env.JWT_REFRESH_SECRET, {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
    });
    
    // Update last login
    await runQuery(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
      [user.id]
    );
    
    // Return user data and tokens
    const userData = {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      tenantId: user.tenant_id,
      tenantCode: user.tenant_code,
      tenantName: user.tenant_name
    };
    
    res.json({
      success: true,
      data: {
        user: userData,
        token,
        refreshToken
      }
    });
    
  } catch (error) {
    next(error);
  }
}));

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *       401:
 *         description: Invalid refresh token
 */
router.post('/refresh', asyncHandler(async (req, res, next) => {
  // Lazy-load database functions
  const { getOneQuery } = require('../database/init');
  
  const { error, value } = refreshSchema.validate(req.body);
  if (error) {
    return next(new AppError(error.details[0].message, 400, 'VALIDATION_ERROR'));
  }
  
  const { refreshToken } = value;
  
  try {
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    // Get user to ensure they still exist and are active
    const user = await getOneQuery(
      'SELECT * FROM users WHERE id = ? AND tenant_id = ? AND status = ?',
      [decoded.userId, decoded.tenantId, 'active']
    );
    
    if (!user) {
      return next(new AppError('Invalid refresh token', 401, 'INVALID_REFRESH_TOKEN'));
    }
    
    // Generate new access token
    const tokenPayload = {
      userId: user.id,
      tenantId: user.tenant_id,
      role: user.role
    };
    
    const newToken = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    });
    
    res.json({
      success: true,
      data: {
        token: newToken
      }
    });
    
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return next(new AppError('Invalid refresh token', 401, 'INVALID_REFRESH_TOKEN'));
    }
    next(error);
  }
}));

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/me', tenantMiddleware, require('../middleware/authMiddleware').authMiddleware, asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: {
      user: req.user,
      tenant: {
        id: req.tenant.id,
        name: req.tenant.name,
        code: req.tenant.code,
        features: req.tenantFeatures
      },
      permissions: req.userPermissions
    }
  });
}));

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: User logout
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 */
router.post('/logout', asyncHandler(async (req, res) => {
  // In a production environment, you might want to blacklist the token
  // For now, we'll just return success as the client will remove the token
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
}));

module.exports = router;