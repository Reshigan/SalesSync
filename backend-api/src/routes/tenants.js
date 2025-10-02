const express = require('express');
const bcrypt = require('bcryptjs');
const Joi = require('joi');
const { v4: uuidv4 } = require('uuid');
// Database functions will be lazy-loaded to avoid circular dependencies
const { AppError, asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// Validation schemas
const createTenantSchema = Joi.object({
  name: Joi.string().required().min(2).max(255),
  code: Joi.string().required().min(2).max(50).uppercase(),
  domain: Joi.string().optional(),
  subscriptionPlan: Joi.string().valid('basic', 'professional', 'enterprise').default('basic'),
  maxUsers: Joi.number().integer().min(1).default(10),
  maxTransactionsPerDay: Joi.number().integer().min(100).default(1000),
  features: Joi.object().optional(),
  adminUser: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    phone: Joi.string().optional()
  }).required()
});

const updateTenantSchema = Joi.object({
  name: Joi.string().min(2).max(255).optional(),
  domain: Joi.string().optional(),
  subscriptionPlan: Joi.string().valid('basic', 'professional', 'enterprise').optional(),
  maxUsers: Joi.number().integer().min(1).optional(),
  maxTransactionsPerDay: Joi.number().integer().min(100).optional(),
  features: Joi.object().optional(),
  status: Joi.string().valid('active', 'suspended', 'inactive').optional()
});

/**
 * @swagger
 * /api/tenants:
 *   post:
 *     summary: Create a new tenant
 *     tags: [Tenants]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - code
 *               - adminUser
 *             properties:
 *               name:
 *                 type: string
 *               code:
 *                 type: string
 *               domain:
 *                 type: string
 *               subscriptionPlan:
 *                 type: string
 *                 enum: [basic, professional, enterprise]
 *               adminUser:
 *                 type: object
 *                 properties:
 *                   email:
 *                     type: string
 *                   password:
 *                     type: string
 *                   firstName:
 *                     type: string
 *                   lastName:
 *                     type: string
 *     responses:
 *       201:
 *         description: Tenant created successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: Tenant code already exists
 */
router.post('/', asyncHandler(async (req, res, next) => {
  // Lazy-load database functions
  const { getOneQuery, runQuery } = require('../database/init');
  
  const { error, value } = createTenantSchema.validate(req.body);
  if (error) {
    return next(new AppError(error.details[0].message, 400, 'VALIDATION_ERROR'));
  }
  
  const { name, code, domain, subscriptionPlan, maxUsers, maxTransactionsPerDay, features, adminUser } = value;
  
  try {
    // Check if tenant code already exists
    const existingTenant = await getOneQuery('SELECT id FROM tenants WHERE code = ?', [code]);
    if (existingTenant) {
      return next(new AppError('Tenant code already exists', 409, 'DUPLICATE_TENANT_CODE'));
    }
    
    // Check if admin email already exists
    const existingUser = await getOneQuery('SELECT id FROM users WHERE email = ?', [adminUser.email]);
    if (existingUser) {
      return next(new AppError('Admin email already exists', 409, 'DUPLICATE_EMAIL'));
    }
    
    // Default features based on subscription plan
    const defaultFeatures = {
      basic: {
        vanSales: true,
        promotions: false,
        merchandising: false,
        digitalDistribution: false,
        warehouse: true,
        backOffice: true,
        aiPredictions: false,
        advancedReporting: false,
        multiWarehouse: false,
        customWorkflows: false
      },
      professional: {
        vanSales: true,
        promotions: true,
        merchandising: true,
        digitalDistribution: false,
        warehouse: true,
        backOffice: true,
        aiPredictions: true,
        advancedReporting: true,
        multiWarehouse: true,
        customWorkflows: false
      },
      enterprise: {
        vanSales: true,
        promotions: true,
        merchandising: true,
        digitalDistribution: true,
        warehouse: true,
        backOffice: true,
        aiPredictions: true,
        advancedReporting: true,
        multiWarehouse: true,
        customWorkflows: true
      }
    };
    
    const tenantFeatures = features || defaultFeatures[subscriptionPlan];
    
    // Create tenant
    const tenantId = uuidv4();
    await runQuery(`
      INSERT INTO tenants (id, name, code, domain, status, subscription_plan, max_users, max_transactions_per_day, features)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      tenantId,
      name,
      code,
      domain,
      'active',
      subscriptionPlan,
      maxUsers,
      maxTransactionsPerDay,
      JSON.stringify(tenantFeatures)
    ]);
    
    // Create admin user
    const adminId = uuidv4();
    const hashedPassword = await bcrypt.hash(adminUser.password, parseInt(process.env.BCRYPT_ROUNDS) || 12);
    
    await runQuery(`
      INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, phone, role, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      adminId,
      tenantId,
      adminUser.email,
      hashedPassword,
      adminUser.firstName,
      adminUser.lastName,
      adminUser.phone || null,
      'admin',
      'active'
    ]);
    
    // Create license record
    const licenseId = uuidv4();
    const monthlyCost = {
      basic: 50,
      professional: 150,
      enterprise: 300
    }[subscriptionPlan];
    
    await runQuery(`
      INSERT INTO tenant_licenses (id, tenant_id, license_type, user_count, monthly_cost, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [licenseId, tenantId, subscriptionPlan, 1, monthlyCost, 'active']);
    
    // Return created tenant (without sensitive data)
    const createdTenant = await getOneQuery(`
      SELECT id, name, code, domain, status, subscription_plan, max_users, max_transactions_per_day, features, created_at
      FROM tenants WHERE id = ?
    `, [tenantId]);
    
    res.status(201).json({
      success: true,
      data: {
        tenant: {
          ...createdTenant,
          features: JSON.parse(createdTenant.features)
        },
        adminUser: {
          id: adminId,
          email: adminUser.email,
          firstName: adminUser.firstName,
          lastName: adminUser.lastName,
          role: 'admin'
        }
      }
    });
    
  } catch (error) {
    next(error);
  }
}));

/**
 * @swagger
 * /api/tenants:
 *   get:
 *     summary: Get all tenants (system admin only)
 *     tags: [Tenants]
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, suspended, inactive]
 *     responses:
 *       200:
 *         description: Tenants retrieved successfully
 */
router.get('/', asyncHandler(async (req, res, next) => {
  // Lazy-load database functions
  const { getQuery, getOneQuery } = require('../database/init');
  
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;
  const status = req.query.status;
  
  try {
    let whereClause = '';
    let params = [];
    
    if (status) {
      whereClause = 'WHERE status = ?';
      params.push(status);
    }
    
    // Get tenants with pagination
    const tenants = await getQuery(`
      SELECT 
        t.*,
        COUNT(u.id) as user_count,
        tl.license_type,
        tl.monthly_cost,
        tl.status as license_status
      FROM tenants t
      LEFT JOIN users u ON u.tenant_id = t.id AND u.status = 'active'
      LEFT JOIN tenant_licenses tl ON tl.tenant_id = t.id AND tl.status = 'active'
      ${whereClause}
      GROUP BY t.id
      ORDER BY t.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, limit, offset]);
    
    // Get total count
    const totalResult = await getOneQuery(`
      SELECT COUNT(*) as total FROM tenants ${whereClause}
    `, params);
    
    const total = totalResult.total;
    const totalPages = Math.ceil(total / limit);
    
    // Format response
    const formattedTenants = tenants.map(tenant => ({
      ...tenant,
      features: tenant.features ? JSON.parse(tenant.features) : {},
      user_count: parseInt(tenant.user_count) || 0
    }));
    
    res.json({
      success: true,
      data: {
        tenants: formattedTenants,
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
 * /api/tenants/{id}:
 *   get:
 *     summary: Get tenant by ID
 *     tags: [Tenants]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tenant retrieved successfully
 *       404:
 *         description: Tenant not found
 */
router.get('/:id', asyncHandler(async (req, res, next) => {
  // Lazy-load database functions
  const { getOneQuery, getQuery } = require('../database/init');
  
  const { id } = req.params;
  
  try {
    const tenant = await getOneQuery(`
      SELECT 
        t.*,
        COUNT(u.id) as user_count,
        tl.license_type,
        tl.monthly_cost,
        tl.status as license_status,
        tl.expires_at
      FROM tenants t
      LEFT JOIN users u ON u.tenant_id = t.id AND u.status = 'active'
      LEFT JOIN tenant_licenses tl ON tl.tenant_id = t.id AND tl.status = 'active'
      WHERE t.id = ?
      GROUP BY t.id
    `, [id]);
    
    if (!tenant) {
      return next(new AppError('Tenant not found', 404, 'TENANT_NOT_FOUND'));
    }
    
    // Get recent billing records
    const billingRecords = await getQuery(`
      SELECT * FROM billing_records 
      WHERE tenant_id = ? 
      ORDER BY created_at DESC 
      LIMIT 5
    `, [id]);
    
    res.json({
      success: true,
      data: {
        tenant: {
          ...tenant,
          features: tenant.features ? JSON.parse(tenant.features) : {},
          user_count: parseInt(tenant.user_count) || 0
        },
        billingRecords
      }
    });
    
  } catch (error) {
    next(error);
  }
}));

/**
 * @swagger
 * /api/tenants/{id}:
 *   put:
 *     summary: Update tenant
 *     tags: [Tenants]
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
 *               name:
 *                 type: string
 *               domain:
 *                 type: string
 *               subscriptionPlan:
 *                 type: string
 *               maxUsers:
 *                 type: integer
 *               features:
 *                 type: object
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Tenant updated successfully
 *       404:
 *         description: Tenant not found
 */
router.put('/:id', asyncHandler(async (req, res, next) => {
  // Lazy-load database functions
  const { getOneQuery, runQuery } = require('../database/init');
  
  const { id } = req.params;
  const { error, value } = updateTenantSchema.validate(req.body);
  
  if (error) {
    return next(new AppError(error.details[0].message, 400, 'VALIDATION_ERROR'));
  }
  
  try {
    // Check if tenant exists
    const existingTenant = await getOneQuery('SELECT * FROM tenants WHERE id = ?', [id]);
    if (!existingTenant) {
      return next(new AppError('Tenant not found', 404, 'TENANT_NOT_FOUND'));
    }
    
    // Build update query
    const updateFields = [];
    const updateValues = [];
    
    Object.keys(value).forEach(key => {
      if (value[key] !== undefined) {
        if (key === 'subscriptionPlan') {
          updateFields.push('subscription_plan = ?');
        } else if (key === 'maxUsers') {
          updateFields.push('max_users = ?');
        } else if (key === 'maxTransactionsPerDay') {
          updateFields.push('max_transactions_per_day = ?');
        } else if (key === 'features') {
          updateFields.push('features = ?');
          updateValues.push(JSON.stringify(value[key]));
          return;
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
    updateValues.push(id);
    
    await runQuery(`
      UPDATE tenants 
      SET ${updateFields.join(', ')} 
      WHERE id = ?
    `, updateValues);
    
    // Get updated tenant
    const updatedTenant = await getOneQuery(`
      SELECT * FROM tenants WHERE id = ?
    `, [id]);
    
    res.json({
      success: true,
      data: {
        tenant: {
          ...updatedTenant,
          features: updatedTenant.features ? JSON.parse(updatedTenant.features) : {}
        }
      }
    });
    
  } catch (error) {
    next(error);
  }
}));

/**
 * @swagger
 * /api/tenants/{id}/billing:
 *   post:
 *     summary: Create billing record for tenant
 *     tags: [Tenants]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Billing record created successfully
 */
router.post('/:id/billing', asyncHandler(async (req, res, next) => {
  // Lazy-load database functions
  const { getOneQuery, runQuery } = require('../database/init');
  
  const { id } = req.params;
  
  try {
    // Get tenant and license info
    const tenant = await getOneQuery(`
      SELECT t.*, tl.id as license_id, tl.monthly_cost, tl.user_count
      FROM tenants t
      JOIN tenant_licenses tl ON tl.tenant_id = t.id AND tl.status = 'active'
      WHERE t.id = ? AND t.status = 'active'
    `, [id]);
    
    if (!tenant) {
      return next(new AppError('Tenant or license not found', 404, 'TENANT_NOT_FOUND'));
    }
    
    // Get current user count
    const userCountResult = await getOneQuery(
      'SELECT COUNT(*) as count FROM users WHERE tenant_id = ? AND status = ?',
      [id, 'active']
    );
    
    const currentUserCount = userCountResult.count;
    
    // Calculate billing amount (per user pricing)
    const perUserCost = tenant.monthly_cost / tenant.user_count;
    const billingAmount = perUserCost * currentUserCount;
    
    // Create billing record
    const billingId = uuidv4();
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    await runQuery(`
      INSERT INTO billing_records (id, tenant_id, license_id, billing_period_start, billing_period_end, user_count, amount, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      billingId,
      id,
      tenant.license_id,
      periodStart.toISOString().split('T')[0],
      periodEnd.toISOString().split('T')[0],
      currentUserCount,
      billingAmount,
      'pending'
    ]);
    
    const billingRecord = await getOneQuery('SELECT * FROM billing_records WHERE id = ?', [billingId]);
    
    res.status(201).json({
      success: true,
      data: {
        billingRecord
      }
    });
    
  } catch (error) {
    next(error);
  }
}));

module.exports = router;