const { getOneQuery } = require('../database/init');
const { AppError } = require('./errorHandler');

const jwt = require('jsonwebtoken');

const tenantMiddleware = async (req, res, next) => {
  try {
    // Get tenant from header (code or ID), subdomain, or JWT token
    let tenantIdentifier = req.headers['x-tenant-code'] || req.headers['x-tenant-id'];
    let tenantId = null;
    
    if (tenantIdentifier) {
      // Look up tenant by code or UUID
      const tenant = await getOneQuery(
        'SELECT * FROM tenants WHERE (code = ? OR id = ?) AND status = ?',
        [tenantIdentifier.toUpperCase(), tenantIdentifier, 'active']
      );
      if (tenant) {
        tenantId = tenant.id;
        req.tenant = tenant;
        req.tenantFeatures = tenant.features ? JSON.parse(tenant.features) : {};
      }
    }
    
    if (!tenantId) {
      // Try to extract from subdomain
      const host = req.get('host');
      if (host && host.includes('.')) {
        const subdomain = host.split('.')[0];
        if (subdomain !== 'www' && subdomain !== 'api') {
          // Look up tenant by subdomain/code
          const tenant = await getOneQuery(
            'SELECT * FROM tenants WHERE code = ? AND status = ?',
            [subdomain.toUpperCase(), 'active']
          );
          if (tenant) {
            tenantId = tenant.id;
            req.tenant = tenant;
            req.tenantFeatures = tenant.features ? JSON.parse(tenant.features) : {};
          }
        }
      }
    }
    
    if (!tenantId) {
      // Try to extract from JWT token
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          tenantId = decoded.tenantId;
          
          // Still need to fetch tenant details
          const tenant = await getOneQuery(
            'SELECT * FROM tenants WHERE id = ? AND status = ?',
            [tenantId, 'active']
          );
          if (tenant) {
            req.tenant = tenant;
            req.tenantFeatures = tenant.features ? JSON.parse(tenant.features) : {};
          }
        } catch (error) {
          // JWT verification failed, but we'll let auth middleware handle this
          console.log('JWT verification failed in tenant middleware:', error.message);
        }
      }
    }
    
    if (!tenantId) {
      return next(new AppError('Tenant code or ID is required', 400, 'TENANT_REQUIRED'));
    }
    
    if (!req.tenant) {
      return next(new AppError('Invalid or inactive tenant', 403, 'INVALID_TENANT'));
    }
    
    // Attach tenant context to request
    req.tenantId = tenantId;
    
    next();
  } catch (error) {
    next(error);
  }
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
  tenantMiddleware,
  requireFeature,
  checkUserLimits
};