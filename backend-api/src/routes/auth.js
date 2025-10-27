const express = require('express');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
// Database functions will be lazy-loaded to avoid circular dependencies
const { tenantMiddleware } = require('../middleware/tenantMiddleware');

const router = express.Router();

// Validation schemas
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
  tenantCode: Joi.string().optional(),
  remember_me: Joi.boolean().optional()
});

const refreshSchema = Joi.object({
  refreshToken: Joi.string().required()
});

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  role: Joi.string().valid('admin', 'user', 'manager').default('user')
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: User login
 *     tags: [Authentication]
 *     parameters:
 *       - in: header
 *         name: X-Tenant-Code
 *         required: true
 *         schema:
 *           type: string
 *         description: Tenant code (e.g., DEMO)
 *         example: DEMO
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
 *                 example: admin@demo.com
 *               password:
 *                 type: string
 *                 example: admin123
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
 *         description: Invalid credentials or missing tenant code
 *       401:
 *         description: Authentication failed - invalid tenant or credentials
 */
router.post('/login', asyncHandler(async (req, res, next) => {
  // Lazy-load database functions
  const { getOneQuery, getQuery, runQuery } = require('../database/init');
  
  // SECURITY FIX: Require X-Tenant-Code header (can also accept X-Tenant-ID for backwards compatibility)
  const tenantCode = req.headers['x-tenant-code'] || req.headers['x-tenant-id'];
  
  if (!tenantCode) {
    return next(new AppError('Tenant code header (X-Tenant-Code) is required', 400, 'TENANT_REQUIRED'));
  }
  
  // Validate request
  const { error, value } = loginSchema.validate(req.body);
  if (error) {
    return next(new AppError(error.details[0].message, 400, 'VALIDATION_ERROR'));
  }
  
  const { email, password } = value;
  
  try {
    // SECURITY FIX: Validate tenant exists and is active
    // Accept either tenant code or UUID
    const tenant = await getOneQuery(
      'SELECT * FROM tenants WHERE (code = ? OR id = ?) AND status = ?',
      [tenantCode.toUpperCase(), tenantCode, 'active']
    );
    
    if (!tenant) {
      return next(new AppError('Invalid or inactive tenant', 401, 'INVALID_TENANT'));
    }
    
    // SECURITY FIX: Find user by email AND tenant_id (case-insensitive email)
    const user = await getOneQuery(`
      SELECT u.*, t.code as tenant_code, t.name as tenant_name, t.status as tenant_status
      FROM users u
      JOIN tenants t ON t.id = u.tenant_id
      WHERE LOWER(u.email) = LOWER(?) AND u.tenant_id = ? AND u.status = 'active' AND t.status = 'active'
    `, [email, tenant.id]);
    
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
    
    const expiresIn = process.env.JWT_EXPIRES_IN || '24h';
    const refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
    
    // Convert time strings to seconds for the response
    const convertToSeconds = (timeStr) => {
      if (typeof timeStr === 'number') return timeStr;
      const match = timeStr.match(/^(\d+)([smhd])$/);
      if (!match) return 86400; // default 24h
      const [, value, unit] = match;
      const multipliers = { s: 1, m: 60, h: 3600, d: 86400 };
      return parseInt(value) * (multipliers[unit] || 3600);
    };
    
    const expiresInSeconds = convertToSeconds(expiresIn);
    const refreshExpiresInSeconds = convertToSeconds(refreshExpiresIn);
    
    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
      expiresIn: expiresIn
    });
    
    const refreshToken = jwt.sign(tokenPayload, process.env.JWT_REFRESH_SECRET, {
      expiresIn: refreshExpiresIn
    });
    
    // Update last login
    await runQuery(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
      [user.id]
    );
    
    // Get full tenant data
    const tenantData = await getOneQuery(
      'SELECT id, name, code, domain, subscription_plan, max_users, max_transactions_per_day, features, status FROM tenants WHERE id = ?',
      [user.tenant_id]
    );
    
    // Parse features JSON if it's a string
    if (tenantData && typeof tenantData.features === 'string') {
      tenantData.features = JSON.parse(tenantData.features);
    }
    
    // Load user permissions
    const permissions = await getQuery(`
      SELECT
        m.code as module,
        MAX(rp.can_view) as can_view,
        MAX(rp.can_create) as can_create,
        MAX(rp.can_edit) as can_edit,
        MAX(rp.can_delete) as can_delete,
        MAX(rp.can_approve) as can_approve,
        MAX(rp.can_export) as can_export
      FROM role_permissions rp
      JOIN modules m ON m.id = rp.module_id
      WHERE rp.tenant_id = ? AND rp.role = ?
      GROUP BY m.code
    `, [user.tenant_id, user.role]);

    // Format permissions for frontend
    const formattedPermissions = permissions.map(p => ({
      module: p.module,
      canView: Boolean(p.can_view),
      canCreate: Boolean(p.can_create),
      canEdit: Boolean(p.can_edit),
      canDelete: Boolean(p.can_delete),
      canApprove: Boolean(p.can_approve),
      canExport: Boolean(p.can_export)
    }));

    // Return user data and tokens
    const userData = {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      tenantId: user.tenant_id,
      tenantCode: user.tenant_code,
      tenantName: user.tenant_name,
      areaId: user.area_id,
      routeId: user.route_id,
      managerId: user.manager_id,
      employeeId: user.employee_id,
      hireDate: user.hire_date,
      monthlyTarget: user.monthly_target,
      status: user.status,
      lastLogin: user.last_login,
      createdAt: user.created_at,
      permissions: formattedPermissions
    };
    
    res.json({
      success: true,
      data: {
        user: userData,
        tenant: tenantData,
        tokens: {
          access_token: token,
          refresh_token: refreshToken,
          expires_in: expiresInSeconds, // Send as number (seconds)
          token_type: 'Bearer'
        },
        // Keep old format for backward compatibility
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
 * /api/auth/register:
 *   post:
 *     summary: Register new user
 *     tags: [Authentication]
 *     parameters:
 *       - in: header
 *         name: X-Tenant-Code
 *         required: true
 *         schema:
 *           type: string
 *         description: Tenant code (e.g., DEMO)
 *         example: DEMO
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
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: newuser@demo.com
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 example: SecurePass123!
 *               firstName:
 *                 type: string
 *                 example: John
 *               lastName:
 *                 type: string
 *                 example: Doe
 *               role:
 *                 type: string
 *                 enum: [admin, user, manager]
 *                 default: user
 *                 example: user
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation error or user already exists
 *       500:
 *         description: Server error
 */
router.post('/register', tenantMiddleware, asyncHandler(async (req, res, next) => {
  // Lazy-load database functions
  const { getOneQuery, insertQuery } = require('../database/init');
  
  const { error, value } = registerSchema.validate(req.body);
  if (error) {
    return next(new AppError(error.details[0].message, 400, 'VALIDATION_ERROR'));
  }

  const { email, password, firstName, lastName, role = 'user' } = value;
  const tenantCode = req.headers['x-tenant-code'];

  if (!tenantCode) {
    return next(new AppError('Tenant code header (X-Tenant-Code) is required', 400, 'MISSING_TENANT'));
  }

  try {
    // Check if user already exists
    const existingUser = await getOneQuery(
      'SELECT id FROM users WHERE email = ? AND tenant_code = ?',
      [email, tenantCode]
    );

    if (existingUser) {
      return next(new AppError('User with this email already exists', 400, 'USER_EXISTS'));
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Get tenant info
    const tenant = await getOneQuery(
      'SELECT id, name FROM tenants WHERE code = ?',
      [tenantCode]
    );

    if (!tenant) {
      return next(new AppError('Invalid tenant code', 400, 'INVALID_TENANT'));
    }

    // Create new user
    const userId = await insertQuery(
      `INSERT INTO users (
        email, password, first_name, last_name, role, 
        tenant_id, tenant_code, tenant_name, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', datetime('now'))`,
      [email, hashedPassword, firstName, lastName, role, tenant.id, tenantCode, tenant.name]
    );

    // Get the created user
    const newUser = await getOneQuery(
      'SELECT id, email, first_name, last_name, role, tenant_code, tenant_name, status, created_at FROM users WHERE id = ?',
      [userId]
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.first_name,
          lastName: newUser.last_name,
          role: newUser.role,
          tenantCode: newUser.tenant_code,
          tenantName: newUser.tenant_name,
          status: newUser.status,
          createdAt: newUser.created_at
        }
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
router.get('/me', asyncHandler(async (req, res) => {
  // Lazy-load auth and tenant middleware
  const { authTenantMiddleware } = require('../middleware/authTenantMiddleware');
  
  // Use unified auth-tenant middleware which handles both auth and tenant resolution
  await new Promise((resolve, reject) => {
    authTenantMiddleware(req, res, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
  
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
      permissions: req.permissions
    }
  });
}));

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Password reset email sent
 *       404:
 *         description: User not found
 */
router.post('/forgot-password', asyncHandler(async (req, res, next) => {
  const { email } = req.body;
  
  // Validate input
  if (!email) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Email is required',
        code: 'VALIDATION_ERROR'
      }
    });
  }

  // Lazy-load database functions
  const { getOneQuery, runQuery } = require('../database/init');
  
  try {
    // Check if user exists
    const user = await getOneQuery(
      'SELECT id, email, first_name, last_name FROM users WHERE email = ? AND status = ?',
      [email.toLowerCase(), 'active']
    );

    // Always return success for security (don't reveal if email exists)
    // But only send email if user actually exists
    if (user) {
      // Generate reset token (in production, use crypto.randomBytes)
      const resetToken = Math.random().toString(36).substring(2, 15) + 
                        Math.random().toString(36).substring(2, 15);
      const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

      // Store reset token in database
      await runQuery(
        'UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE id = ?',
        [resetToken, resetTokenExpiry.toISOString(), user.id]
      );

      // In production, send actual email here
      console.log(`Password reset requested for ${email}`);
      console.log(`Reset token: ${resetToken}`);
      console.log(`Reset URL: ${req.protocol}://${req.get('host')}/reset-password?token=${resetToken}`);
    }

    res.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.'
    });

  } catch (error) {
    next(error);
  }
}));

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password with token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *             properties:
 *               token:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Invalid or expired token
 */
router.post('/reset-password', asyncHandler(async (req, res, next) => {
  const { token, newPassword } = req.body;
  
  // Validate input
  if (!token || !newPassword) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Token and new password are required',
        code: 'VALIDATION_ERROR'
      }
    });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Password must be at least 8 characters long',
        code: 'VALIDATION_ERROR'
      }
    });
  }

  // Lazy-load database functions and bcrypt
  const { getOneQuery, runQuery } = require('../database/init');
  const bcrypt = require('bcrypt');
  
  try {
    // Find user with valid reset token
    const user = await getOneQuery(
      'SELECT id, email, reset_token, reset_token_expiry FROM users WHERE reset_token = ? AND status = ?',
      [token, 'active']
    );

    if (!user) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid reset token',
          code: 'INVALID_TOKEN'
        }
      });
    }

    // Check if token is expired
    const now = new Date();
    const tokenExpiry = new Date(user.reset_token_expiry);
    
    if (now > tokenExpiry) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Reset token has expired',
          code: 'TOKEN_EXPIRED'
        }
      });
    }

    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password and clear reset token
    await runQuery(
      'UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expiry = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [hashedPassword, user.id]
    );

    console.log(`Password reset successful for user: ${user.email}`);

    res.json({
      success: true,
      message: 'Password has been reset successfully'
    });

  } catch (error) {
    next(error);
  }
}));

/**
 * @swagger
 * /api/auth/change-password:
 *   post:
 *     summary: Change user password
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
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
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized or incorrect current password
 */
router.post('/change-password', asyncHandler(async (req, res) => {
  // Lazy-load auth and tenant middleware
  const { authTenantMiddleware } = require('../middleware/authTenantMiddleware');
  const { getOneQuery, runQuery } = require('../database/init');
  
  // Use unified auth-tenant middleware which handles both auth and tenant resolution
  await new Promise((resolve, reject) => {
    authTenantMiddleware(req, res, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  const { currentPassword, newPassword } = req.body;

  // Validate input
  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      error: { message: 'Current password and new password are required', code: 'MISSING_FIELDS' }
    });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({
      success: false,
      error: { message: 'New password must be at least 8 characters long', code: 'WEAK_PASSWORD' }
    });
  }

  try {
    // Get user with current password
    const user = await getOneQuery(
      'SELECT id, email, password_hash FROM users WHERE id = ? AND status = ?',
      [req.user.id, 'active']
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'User not found', code: 'USER_NOT_FOUND' }
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        success: false,
        error: { message: 'Current password is incorrect', code: 'INVALID_CURRENT_PASSWORD' }
      });
    }

    // Hash new password
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await runQuery(
      'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [hashedNewPassword, user.id]
    );

    console.log(`Password changed successfully for user: ${user.email}`);

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to change password', code: 'CHANGE_PASSWORD_ERROR' }
    });
  }
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