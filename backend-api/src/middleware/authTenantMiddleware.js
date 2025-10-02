const jwt = require('jsonwebtoken');
const { AppError } = require('./errorHandler');

/**
 * Unified Authentication and Tenant Middleware
 * Handles JWT verification, tenant validation, user loading, and permissions in one place
 * This eliminates circular dependencies and simplifies the auth flow
 */
const authTenantMiddleware = async (req, res, next) => {
  try {
    // Lazy-load database functions to avoid circular dependencies
    const { getOneQuery, getQuery } = require('../database/init');
    
    // Extract JWT token
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return next(new AppError('Access token is required', 401, 'TOKEN_REQUIRED'));
    }

    // Verify and decode JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return next(new AppError('Invalid or expired token', 401, 'INVALID_TOKEN'));
    }

    // Validate required fields in JWT
    if (!decoded.userId || !decoded.tenantId || !decoded.role) {
      return next(new AppError('Invalid token format', 401, 'INVALID_TOKEN_FORMAT'));
    }

    // Validate tenant exists and is active
    const tenant = await getOneQuery(
      'SELECT * FROM tenants WHERE id = ? AND status = ?',
      [decoded.tenantId, 'active']
    );

    if (!tenant) {
      return next(new AppError('Invalid or inactive tenant', 403, 'INVALID_TENANT'));
    }

    // Get user from database
    const user = await getOneQuery(
      'SELECT * FROM users WHERE id = ? AND tenant_id = ? AND status = ?',
      [decoded.userId, decoded.tenantId, 'active']
    );

    if (!user) {
      return next(new AppError('User not found or inactive', 401, 'USER_NOT_FOUND'));
    }

    // Verify user role matches JWT
    if (user.role !== decoded.role) {
      return next(new AppError('Token role mismatch', 401, 'ROLE_MISMATCH'));
    }

    // Load user permissions
    const permissions = await getQuery(`
      SELECT 
        m.code as module_code,
        f.code as function_code,
        rp.can_view,
        rp.can_create,
        rp.can_edit,
        rp.can_delete,
        rp.can_approve,
        rp.can_export
      FROM role_permissions rp
      JOIN modules m ON m.id = rp.module_id
      JOIN functions f ON f.id = rp.function_id
      WHERE rp.tenant_id = ? AND rp.role = ?
    `, [decoded.tenantId, user.role]);
    
    // Organize permissions by module
    const userPermissions = {};
    permissions.forEach(p => {
      if (!userPermissions[p.module_code]) {
        userPermissions[p.module_code] = {};
      }
      userPermissions[p.module_code][p.function_code] = {
        view: p.can_view,
        create: p.can_create,
        edit: p.can_edit,
        delete: p.can_delete,
        approve: p.can_approve,
        export: p.can_export
      };
    });

    // Parse tenant features
    const tenantFeatures = tenant.features ? JSON.parse(tenant.features) : {};
    
    // Attach all context to request
    req.user = {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      tenantId: user.tenant_id,
      tenantCode: tenant.code,
      tenantName: tenant.name,
      status: user.status,
      lastLogin: user.last_login,
      createdAt: user.created_at
    };
    
    req.tenant = tenant;
    req.tenantId = decoded.tenantId;
    req.tenantFeatures = tenantFeatures;
    req.permissions = userPermissions;
    req.tokenData = decoded; // Keep original token data for reference

    next();
  } catch (error) {
    console.error('Auth/Tenant middleware error:', error);
    next(error);
  }
};

// Middleware to check if user has specific permission
const requirePermission = (module, action) => {
  return (req, res, next) => {
    if (!req.permissions || !req.permissions[module] || !req.permissions[module][action]) {
      return next(new AppError(`Permission denied: ${module}.${action}`, 403, 'PERMISSION_DENIED'));
    }
    
    if (!req.permissions[module][action][action]) {
      return next(new AppError(`Permission denied: ${module}.${action}`, 403, 'PERMISSION_DENIED'));
    }
    
    next();
  };
};

// Middleware to check if tenant has access to specific feature
const requireFeature = (featureName) => {
  return (req, res, next) => {
    if (!req.tenantFeatures || !req.tenantFeatures[featureName]) {
      return next(new AppError(`Feature '${featureName}' not available in your subscription`, 403, 'FEATURE_NOT_AVAILABLE'));
    }
    next();
  };
};

// Middleware to check tenant user limits
const checkUserLimits = async (req, res, next) => {
  try {
    // Lazy-load database functions
    const { getOneQuery } = require('../database/init');
    
    if (req.method === 'POST' && req.path.includes('/users')) {
      const userCount = await getOneQuery(
        'SELECT COUNT(*) as count FROM users WHERE tenant_id = ? AND status = ?',
        [req.tenantId, 'active']
      );
      
      if (userCount.count >= req.tenant.max_users) {
        return next(new AppError('User limit exceeded for your subscription', 403, 'USER_LIMIT_EXCEEDED'));
      }
    }
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  authTenantMiddleware,
  requirePermission,
  requireFeature,
  checkUserLimits
};