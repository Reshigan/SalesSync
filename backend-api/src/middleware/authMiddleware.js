const jwt = require('jsonwebtoken');
const { AppError } = require('./errorHandler');

const authMiddleware = async (req, res, next) => {
  try {
    // Lazy-load database functions
    const { getOneQuery, getQuery } = require('../utils/database');
    
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return next(new AppError('Access token is required', 401, 'TOKEN_REQUIRED'));
    }
    
    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database using tenantId from JWT token
    const user = await getOneQuery(
      'SELECT * FROM users WHERE id = $1 AND tenant_id = $2 AND status = $3',
      [decoded.userId, decoded.tenantId, 'active']
    );
    
    if (!user) {
      return next(new AppError('Invalid token or user not found', 401, 'INVALID_TOKEN'));
    }
    
    // Load user permissions
    const permissions = await getQuery(`
      SELECT 
        m.code as module_code,
        rp.can_view,
        rp.can_create,
        rp.can_edit,
        rp.can_delete,
        rp.can_approve,
        rp.can_export
      FROM role_permissions rp
      JOIN modules m ON m.id = rp.module_id
      WHERE rp.tenant_id = $1 AND rp.role = $2
    `, [decoded.tenantId, user.role]);
    
    // Organize permissions by module
    const userPermissions = {};
    permissions.forEach(p => {
      userPermissions[p.module_code] = {
        view: p.can_view,
        create: p.can_create,
        edit: p.can_edit,
        delete: p.can_delete,
        approve: p.can_approve,
        export: p.can_export
      };
    });
    
    // Attach user and permissions to request
    req.user = {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      tenantId: user.tenant_id
    };
    req.userPermissions = userPermissions;
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Invalid token', 401, 'INVALID_TOKEN'));
    } else if (error.name === 'TokenExpiredError') {
      return next(new AppError('Token expired', 401, 'TOKEN_EXPIRED'));
    }
    next(error);
  }
};

// Middleware to check specific permissions
const requirePermission = (module, action) => {
  return (req, res, next) => {
    const hasPermission = req.userPermissions[module]?.[action]?.[action] || 
                         req.user.role === 'admin'; // Admin has all permissions
    
    if (!hasPermission) {
      return next(new AppError(`Insufficient permissions for ${module}:${action}`, 403, 'INSUFFICIENT_PERMISSIONS'));
    }
    
    next();
  };
};

// Middleware to check if user can access specific function
const requireFunction = (module, functionCode, action = 'view') => {
  return (req, res, next) => {
    // Admin users have access to everything
    if (req.user?.role === 'admin') {
      return next();
    }
    
    // Check permissions if they exist (support both req.permissions and req.userPermissions for compatibility)
    const permissions = req.permissions || req.userPermissions;
    const hasPermission = permissions?.[module]?.[functionCode]?.[action];
    
    if (!hasPermission && process.env.NODE_ENV === 'production') {
      console.log('[requireFunction] Permission check failed:', {
        module,
        functionCode,
        action,
        userRole: req.user?.role,
        hasReqPermissions: !!req.permissions,
        hasReqUserPermissions: !!req.userPermissions,
        permissionsKeys: permissions ? Object.keys(permissions) : [],
        modulePermissions: permissions?.[module] ? Object.keys(permissions[module]) : [],
        hasPermission
      });
    }
    
    if (!hasPermission) {
      return next(new AppError(`Access denied to ${module}:${functionCode}:${action}`, 403, 'ACCESS_DENIED'));
    }
    
    next();
  };
};

// Optional auth middleware (for public endpoints that can benefit from user context)
const optionalAuth = async (req, res, next) => {
  try {
    const { getOneQuery } = require('../utils/database');
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await getOneQuery(
        'SELECT * FROM users WHERE id = $1 AND tenant_id = $2 AND status = $3',
        [decoded.userId, req.tenantId, 'active']
      );
      
      if (user) {
        req.user = {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          tenantId: user.tenant_id
        };
      }
    }
    
    next();
  } catch (error) {
    // Ignore auth errors for optional auth
    next();
  }
};

module.exports = {
  authMiddleware,
  requirePermission,
  requireFunction,
  optionalAuth
};
