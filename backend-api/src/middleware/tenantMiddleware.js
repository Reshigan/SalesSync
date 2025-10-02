const { getOneQuery } = require('../database/init');
const { AppError } = require('./errorHandler');

const tenantMiddleware = async (req, res, next) => {
  try {
    // Get tenant ID from header or subdomain
    let tenantId = req.headers['x-tenant-id'];
    
    if (!tenantId) {
      // Try to extract from subdomain
      const host = req.get('host');
      if (host && host.includes('.')) {
        const subdomain = host.split('.')[0];
        if (subdomain !== 'www' && subdomain !== 'api') {
          // Look up tenant by subdomain/code
          const tenant = await getOneQuery(
            'SELECT id FROM tenants WHERE code = ? AND status = ?',
            [subdomain.toUpperCase(), 'active']
          );
          if (tenant) {
            tenantId = tenant.id;
          }
        }
      }
    }
    
    if (!tenantId) {
      return next(new AppError('Tenant ID is required', 400, 'TENANT_REQUIRED'));
    }
    
    // Validate tenant exists and is active
    const tenant = await getOneQuery(
      'SELECT * FROM tenants WHERE id = ? AND status = ?',
      [tenantId, 'active']
    );
    
    if (!tenant) {
      return next(new AppError('Invalid or inactive tenant', 403, 'INVALID_TENANT'));
    }
    
    // Check tenant limits and subscription
    const features = tenant.features ? JSON.parse(tenant.features) : {};
    
    // Attach tenant context to request
    req.tenantId = tenantId;
    req.tenant = tenant;
    req.tenantFeatures = features;
    
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