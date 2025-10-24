const { AppError } = require('./errorHandler');

/**
 * Middleware to check if user has superadmin role
 * Must be used after authentication middleware
 */
const requireSuperAdmin = (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
  }

  if (req.user.role !== 'superadmin') {
    return next(new AppError('SuperAdmin access required', 403, 'FORBIDDEN'));
  }

  next();
};

/**
 * Middleware to check if user has superadmin or admin role
 */
const requireAdminOrSuperAdmin = (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
  }

  if (!['admin', 'superadmin'].includes(req.user.role)) {
    return next(new AppError('Admin access required', 403, 'FORBIDDEN'));
  }

  next();
};

module.exports = {
  requireSuperAdmin,
  requireAdminOrSuperAdmin
};
