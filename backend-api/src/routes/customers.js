const express = require('express');
const Joi = require('joi');
const { v4: uuidv4 } = require('uuid');
// Database functions will be lazy-loaded to avoid circular dependencies
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const { requireFunction } = require('../middleware/authMiddleware');

const router = express.Router();

// Validation schemas
const createCustomerSchema = Joi.object({
  name: Joi.string().required().min(1).max(255),
  code: Joi.string().required().min(1).max(50),
  type: Joi.string().valid('retail', 'wholesale', 'distributor').default('retail'),
  phone: Joi.string().optional(),
  email: Joi.string().email().optional(),
  address: Joi.string().optional(),
  latitude: Joi.number().optional(),
  longitude: Joi.number().optional(),
  routeId: Joi.string().optional(),
  creditLimit: Joi.number().min(0).default(0),
  paymentTerms: Joi.number().integer().min(0).default(0)
});

const updateCustomerSchema = Joi.object({
  name: Joi.string().min(1).max(255).optional(),
  code: Joi.string().min(1).max(50).optional(),
  type: Joi.string().valid('retail', 'wholesale', 'distributor').optional(),
  phone: Joi.string().optional(),
  email: Joi.string().email().optional(),
  address: Joi.string().optional(),
  latitude: Joi.number().optional(),
  longitude: Joi.number().optional(),
  routeId: Joi.string().optional(),
  creditLimit: Joi.number().min(0).optional(),
  paymentTerms: Joi.number().integer().min(0).optional(),
  status: Joi.string().valid('active', 'inactive', 'suspended').optional()
});

/**
 * @swagger
 * /api/customers:
 *   get:
 *     summary: Get all customers for tenant
 *     tags: [Customers]
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
 *         name: type
 *         schema:
 *           type: string
 *       - in: query
 *         name: routeId
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
 *         description: Customers retrieved successfully
 */
router.get('/', requireFunction('customers', 'view'), asyncHandler(async (req, res, next) => {
  // Lazy-load database functions
  const { getQuery, getOneQuery } = require('../utils/database');
  
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;
  const { type, routeId, status, search } = req.query;
  
  try {
    let whereClause = 'WHERE c.tenant_id = $1';
    let params = [req.tenantId];
    let paramIndex = 2;
    
    if (type) {
      whereClause += ` AND c.type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }
    
    if (routeId) {
      whereClause += ` AND c.route_id = $${paramIndex}`;
      params.push(routeId);
      paramIndex++;
    }
    
    if (status) {
      whereClause += ` AND c.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    if (search) {
      whereClause += ` AND (c.name LIKE $${paramIndex} OR c.code LIKE $${paramIndex + 1} OR c.phone LIKE $${paramIndex + 2})`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
      paramIndex += 3;
    }
    
    // Get customers with route information
    const limitParam = paramIndex;
    const offsetParam = paramIndex + 1;
    const customers = await getQuery(`
      SELECT 
        c.*,
        r.name as route_name,
        r.code as route_code,
        a.name as area_name,
        reg.name as region_name,
        COUNT(o.id) as total_orders,
        COALESCE(SUM(o.total_amount), 0) as total_sales
      FROM customers c
      LEFT JOIN routes r ON r.id = c.route_id
      LEFT JOIN areas a ON a.id = r.area_id
      LEFT JOIN regions reg ON reg.id = a.region_id
      LEFT JOIN orders o ON o.customer_id = c.id AND o.order_status != 'cancelled'
      ${whereClause}
      GROUP BY c.id, c.created_at, c.name, c.code, c.type, c.phone, c.email, c.address, c.latitude, c.longitude, c.route_id, c.credit_limit, c.payment_terms, c.status, c.tenant_id, r.name, r.code, a.name, reg.name
      ORDER BY c.created_at DESC
      LIMIT $${limitParam} OFFSET $${offsetParam}
    `, [...params, limit, offset]);
    
    // Get total count
    const totalResult = await getOneQuery(`
      SELECT COUNT(*) as total FROM customers c ${whereClause}
    `, params);
    
    const total = totalResult.total;
    const totalPages = Math.ceil(total / limit);
    
    res.json({
      success: true,
      data: {
        customers,
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
 * /api/customers:
 *   post:
 *     summary: Create a new customer
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - code
 *             properties:
 *               name:
 *                 type: string
 *               code:
 *                 type: string
 *               type:
 *                 type: string
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *               address:
 *                 type: string
 *               routeId:
 *                 type: string
 *               creditLimit:
 *                 type: number
 *               paymentTerms:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Customer created successfully
 */
router.post('/', requireFunction('customers', 'create'), asyncHandler(async (req, res, next) => {
  // Lazy-load database functions
  const { getOneQuery, runQuery } = require('../utils/database');
  
  const { error, value } = createCustomerSchema.validate(req.body);
  if (error) {
    return next(new AppError(error.details[0].message, 400, 'VALIDATION_ERROR'));
  }
  
  const { name, code, type, phone, email, address, latitude, longitude, routeId, creditLimit, paymentTerms } = value;
  
  try {
    // Check if customer code already exists in this tenant
    const existingCustomer = await getOneQuery(
      'SELECT id FROM customers WHERE code = $1 AND tenant_id = $2',
      [code, req.tenantId]
    );
    
    if (existingCustomer) {
      return next(new AppError('Customer code already exists', 409, 'DUPLICATE_CUSTOMER_CODE'));
    }
    
    // Validate route if provided
    if (routeId) {
      const route = await getOneQuery(
        'SELECT id FROM routes WHERE id = $1 AND tenant_id = $2',
        [routeId, req.tenantId]
      );
      
      if (!route) {
        return next(new AppError('Invalid route ID', 400, 'INVALID_ROUTE'));
      }
    }
    
    // Create customer
    const customerId = uuidv4();
    await runQuery(`
      INSERT INTO customers (id, tenant_id, name, code, type, phone, email, address, latitude, longitude, route_id, credit_limit, payment_terms, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    `, [customerId, req.tenantId, name, code, type, phone, email, address, latitude, longitude, routeId, creditLimit, paymentTerms, 'active']);
    
    // Get created customer with route information
    const createdCustomer = await getOneQuery(`
      SELECT 
        c.*,
        r.name as route_name,
        r.code as route_code
      FROM customers c
      LEFT JOIN routes r ON r.id = c.route_id
      WHERE c.id = $1
    `, [customerId]);
    
    res.status(201).json({
      success: true,
      data: {
        customer: createdCustomer
      }
    });
    
  } catch (error) {
    next(error);
  }
}));

/**
 * @swagger
 * /api/customers/{id}:
 *   get:
 *     summary: Get customer by ID
 *     tags: [Customers]
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
 *         description: Customer retrieved successfully
 *       404:
 *         description: Customer not found
 */
router.get('/stats', requireFunction('customers', 'view'), asyncHandler(async (req, res, next) => {
  const { getOneQuery } = require('../utils/database');
  
  try {
    const stats = await getOneQuery(`
      SELECT 
        COUNT(*) as total_customers,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_customers,
        SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) as inactive_customers,
        SUM(CASE WHEN status = 'suspended' THEN 1 ELSE 0 END) as suspended_customers,
        SUM(CASE WHEN type = 'retail' THEN 1 ELSE 0 END) as retail_customers,
        SUM(CASE WHEN type = 'wholesale' THEN 1 ELSE 0 END) as wholesale_customers,
        SUM(CASE WHEN type = 'distributor' THEN 1 ELSE 0 END) as distributor_customers,
        SUM(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 ELSE 0 END) as new_customers_30d,
        SUM(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 ELSE 0 END) as new_customers_7d
      FROM customers
      WHERE tenant_id = $1
    `, [req.tenantId]);
    
    res.json({
      success: true,
      data: stats || {}
    });
  } catch (error) {
    next(error);
  }
}));

router.get('/:id', requireFunction('customers', 'view'), asyncHandler(async (req, res, next) => {
  // Lazy-load database functions
  const { getOneQuery, getQuery } = require('../utils/database');
  
  const { id } = req.params;
  
  try {
    const customer = await getOneQuery(`
      SELECT 
        c.*,
        r.name as route_name,
        r.code as route_code,
        a.name as area_name,
        reg.name as region_name,
        COUNT(DISTINCT o.id) as total_orders,
        COALESCE(SUM(CASE WHEN o.order_status != 'cancelled' THEN o.total_amount ELSE 0 END), 0) as total_sales,
        COUNT(DISTINCT v.id) as total_visits,
        MAX(v.visit_date) as last_visit_date
      FROM customers c
      LEFT JOIN routes r ON r.id = c.route_id
      LEFT JOIN areas a ON a.id = r.area_id
      LEFT JOIN regions reg ON reg.id = a.region_id
      LEFT JOIN orders o ON o.customer_id = c.id
      LEFT JOIN visits v ON v.customer_id = c.id
      WHERE c.id = $1 AND c.tenant_id = $2
      GROUP BY c.id, c.created_at, c.name, c.code, c.type, c.phone, c.email, c.address, c.latitude, c.longitude, c.route_id, c.credit_limit, c.payment_terms, c.status, c.tenant_id, r.name, r.code, a.name, reg.name
    `, [id, req.tenantId]);
    
    if (!customer) {
      return next(new AppError('Customer not found', 404, 'CUSTOMER_NOT_FOUND'));
    }
    
    // Get recent orders
    const recentOrders = await getQuery(`
      SELECT id, order_number, order_date, total_amount, order_status
      FROM orders 
      WHERE customer_id = $1
      ORDER BY order_date DESC 
      LIMIT 5
    `, [id]);
    
    // Get recent visits
    const recentVisits = await getQuery(`
      SELECT 
        v.id, v.visit_date, v.visit_type, v.outcome,
        u.first_name, u.last_name
      FROM visits v
      LEFT JOIN users u ON u.id = v.agent_id
      WHERE v.customer_id = $1
      ORDER BY v.visit_date DESC 
      LIMIT 5
    `, [id]);
    
    res.json({
      success: true,
      data: {
        customer,
        recentOrders,
        recentVisits
      }
    });
    
  } catch (error) {
    next(error);
  }
}));

/**
 * @swagger
 * /api/customers/{id}:
 *   put:
 *     summary: Update customer
 *     tags: [Customers]
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
 *               name:
 *                 type: string
 *               code:
 *                 type: string
 *               type:
 *                 type: string
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *               address:
 *                 type: string
 *               routeId:
 *                 type: string
 *               creditLimit:
 *                 type: number
 *               paymentTerms:
 *                 type: integer
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Customer updated successfully
 */
router.put('/:id', requireFunction('customers', 'edit'), asyncHandler(async (req, res, next) => {
  // Lazy-load database functions
  const { getOneQuery, runQuery } = require('../utils/database');
  
  const { id } = req.params;
  const { error, value } = updateCustomerSchema.validate(req.body);
  
  if (error) {
    return next(new AppError(error.details[0].message, 400, 'VALIDATION_ERROR'));
  }
  
  try {
    // Check if customer exists
    const existingCustomer = await getOneQuery(
      'SELECT * FROM customers WHERE id = $1 AND tenant_id = $2',
      [id, req.tenantId]
    );
    
    if (!existingCustomer) {
      return next(new AppError('Customer not found', 404, 'CUSTOMER_NOT_FOUND'));
    }
    
    // Check if code is being changed and already exists
    if (value.code && value.code !== existingCustomer.code) {
      const codeExists = await getOneQuery(
        'SELECT id FROM customers WHERE code = $1 AND tenant_id = $2 AND id != $3',
        [value.code, req.tenantId, id]
      );
      
      if (codeExists) {
        return next(new AppError('Customer code already exists', 409, 'DUPLICATE_CUSTOMER_CODE'));
      }
    }
    
    // Validate route if provided
    if (value.routeId) {
      const route = await getOneQuery(
        'SELECT id FROM routes WHERE id = $1 AND tenant_id = $2',
        [value.routeId, req.tenantId]
      );
      
      if (!route) {
        return next(new AppError('Invalid route ID', 400, 'INVALID_ROUTE'));
      }
    }
    
    // Build update query
    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;
    
    Object.keys(value).forEach(key => {
      if (value[key] !== undefined) {
        if (key === 'routeId') {
          updateFields.push(`route_id = $${paramIndex}`);
        } else if (key === 'creditLimit') {
          updateFields.push(`credit_limit = $${paramIndex}`);
        } else if (key === 'paymentTerms') {
          updateFields.push(`payment_terms = $${paramIndex}`);
        } else {
          updateFields.push(`${key} = $${paramIndex}`);
        }
        updateValues.push(value[key]);
        paramIndex++;
      }
    });
    
    if (updateFields.length === 0) {
      return next(new AppError('No fields to update', 400, 'NO_UPDATE_FIELDS'));
    }
    
    // Note: customers table doesn't have updated_at column in schema
    updateValues.push(id, req.tenantId);
    const idParam = paramIndex;
    const tenantParam = paramIndex + 1;
    
    await runQuery(`
      UPDATE customers 
      SET ${updateFields.join(', ')} 
      WHERE id = $${idParam} AND tenant_id = $${tenantParam}
    `, updateValues);
    
    // Get updated customer
    const updatedCustomer = await getOneQuery(`
      SELECT 
        c.*,
        r.name as route_name,
        r.code as route_code
      FROM customers c
      LEFT JOIN routes r ON r.id = c.route_id
      WHERE c.id = $1 AND c.tenant_id = $2
    `, [id, req.tenantId]);
    
    res.json({
      success: true,
      data: {
        customer: updatedCustomer
      }
    });
    
  } catch (error) {
    next(error);
  }
}));

/**
 * @swagger
 * /api/customers/{id}:
 *   delete:
 *     summary: Delete customer
 *     tags: [Customers]
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
 *         description: Customer deleted successfully
 */
router.delete('/:id', requireFunction('customers', 'delete'), asyncHandler(async (req, res, next) => {
  // Lazy-load database functions
  const { getOneQuery, runQuery } = require('../utils/database');
  
  const { id } = req.params;
  
  try {
    // Check if customer exists
    const existingCustomer = await getOneQuery(
      'SELECT * FROM customers WHERE id = $1 AND tenant_id = $2',
      [id, req.tenantId]
    );
    
    if (!existingCustomer) {
      return next(new AppError('Customer not found', 404, 'CUSTOMER_NOT_FOUND'));
    }
    
    // Check if customer has orders
    const hasOrders = await getOneQuery(
      'SELECT COUNT(*) as count FROM orders WHERE customer_id = $1',
      [id]
    );
    
    if (hasOrders.count > 0) {
      // Soft delete by setting status to inactive
      await runQuery(
        'UPDATE customers SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND tenant_id = $3',
        ['inactive', id, req.tenantId]
      );
    } else {
      // Hard delete if no orders
      await runQuery(
        'DELETE FROM customers WHERE id = $1 AND tenant_id = $2',
        [id, req.tenantId]
      );
    }
    
    res.json({
      success: true,
      message: 'Customer deleted successfully'
    });
    
  } catch (error) {
    next(error);
  }
}));

/**
 * @swagger
 * /api/customers/{id}/orders:
 *   get:
 *     summary: Get customer orders
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
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
 *     responses:
 *       200:
 *         description: Customer orders retrieved successfully
 */
router.get('/:id/orders', requireFunction('customers', 'view'), asyncHandler(async (req, res, next) => {
  // Lazy-load database functions
  const { getOneQuery, getQuery } = require('../utils/database');
  
  const { id } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;
  
  try {
    // Verify customer exists
    const customer = await getOneQuery(
      'SELECT id FROM customers WHERE id = $1 AND tenant_id = $2',
      [id, req.tenantId]
    );
    
    if (!customer) {
      return next(new AppError('Customer not found', 404, 'CUSTOMER_NOT_FOUND'));
    }
    
    // Get orders
    const orders = await getQuery(`
      SELECT 
        o.*,
        u.first_name as salesman_first_name,
        u.last_name as salesman_last_name
      FROM orders o
      LEFT JOIN users a ON a.id = o.salesman_id
      LEFT JOIN users u ON u.id = a.user_id
      WHERE o.customer_id = $1
      ORDER BY o.order_date DESC
      LIMIT $2 OFFSET $3
    `, [id, limit, offset]);
    
    // Get total count
    const totalResult = await getOneQuery(
      'SELECT COUNT(*) as total FROM orders WHERE customer_id = $1',
      [id]
    );
    
    const total = totalResult.total;
    const totalPages = Math.ceil(total / limit);
    
    res.json({
      success: true,
      data: {
        orders,
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
 * /api/customers/:id/visits:
 *   get:
 *     summary: Get customer visit history
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id/visits', requireFunction('customers', 'view'), asyncHandler(async (req, res, next) => {
  const { getQuery } = require('../utils/database');
  
  try {
    const visits = await getQuery('SELECT * FROM visits WHERE customer_id = $1 AND tenant_id = $2 ORDER BY visit_date DESC LIMIT 50', 
      [req.params.id, req.tenantId]);
    
    res.json({
      success: true,
      data: visits || []
    });
  } catch (error) {
    next(error);
  }
}));

/**
 * @swagger
 * /api/customers/:id/credit:
 *   get:
 *     summary: Get customer credit information
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id/credit', requireFunction('customers', 'view'), asyncHandler(async (req, res, next) => {
  const { getOneQuery, getQuery } = require('../utils/database');
  
  try {
    const customer = await getOneQuery('SELECT credit_limit, payment_terms FROM customers WHERE id = $1 AND tenant_id = $2', 
      [req.params.id, req.tenantId]);
    
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    
    // Calculate outstanding balance from orders
    const result = await getOneQuery(
      `SELECT 
        COALESCE(SUM(CASE WHEN payment_status IN ('pending', 'partial') THEN total_amount END), 0) as outstanding,
        COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN total_amount END), 0) as paid_amount,
        COUNT(*) as total_orders
      FROM orders 
      WHERE customer_id = $1 AND tenant_id = $2`,
      [req.params.id, req.tenantId]
    );
    
    const creditInfo = {
      credit_limit: customer.credit_limit || 0,
      outstanding_balance: result?.outstanding || 0,
      available_credit: (customer.credit_limit || 0) - (result?.outstanding || 0),
      payment_terms: customer.payment_terms || 0,
      total_paid: result?.paid_amount || 0,
      total_orders: result?.total_orders || 0
    };
    
    res.json({
      success: true,
      data: creditInfo
    });
  } catch (error) {
    next(error);
  }
}));

/**
 * @swagger
 * /api/customers/:id/notes:
 *   get:
 *     summary: Get customer notes
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id/notes', requireFunction('customers', 'view'), asyncHandler(async (req, res, next) => {
  const { getQuery } = require('../utils/database');
  
  try {
    const notes = await getQuery(
      `SELECT n.*, u.first_name || ' ' || u.last_name as created_by_name
      FROM customer_notes n
      LEFT JOIN users u ON n.created_by = u.id
      WHERE n.customer_id = $1 AND n.tenant_id = $2
      ORDER BY n.created_at DESC`,
      [req.params.id, req.tenantId]
    );
    
    res.json({
      success: true,
      data: notes || []
    });
  } catch (error) {
    next(error);
  }
}));

/**
 * @swagger
 * /api/customers/:id/notes:
 *   post:
 *     summary: Add customer note
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 */
router.post('/:id/notes', requireFunction('customers', 'edit'), asyncHandler(async (req, res, next) => {
  const { runQuery, getOneQuery } = require('../utils/database');
  
  const noteSchema = Joi.object({
    note: Joi.string().required().min(1).max(5000),
    type: Joi.string().valid('general', 'visit', 'complaint', 'feedback').default('general')
  });
  
  try {
    const { error, value } = noteSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }
    
    // Check if customer exists
    const customer = await getOneQuery('SELECT id FROM customers WHERE id = $1 AND tenant_id = $2', 
      [req.params.id, req.tenantId]);
    
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    
    const noteId = uuidv4();
    const now = new Date().toISOString();
    
    await runQuery(
      `INSERT INTO customer_notes (id, customer_id, tenant_id, note, type, created_by, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [noteId, req.params.id, req.tenantId, value.note, value.type, req.userId, now]
    );
    
    const note = await getOneQuery(
      `SELECT n.*, u.first_name || ' ' || u.last_name as created_by_name
      FROM customer_notes n
      LEFT JOIN users u ON n.created_by = u.id
      WHERE n.id = $1`,
      [noteId]
    );
    
    res.status(201).json({
      success: true,
      message: 'Note added successfully',
      data: note
    });
  } catch (error) {
    next(error);
  }
}));

/**
 * @swagger
 * /api/customers/bulk:
 *   post:
 *     summary: Bulk operations on customers
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 */
router.post('/bulk', requireFunction('customers', 'edit'), asyncHandler(async (req, res, next) => {
  const { runQuery } = require('../utils/database');
  
  const bulkSchema = Joi.object({
    customer_ids: Joi.array().items(Joi.string()).required().min(1),
    operation: Joi.string().valid('activate', 'deactivate', 'suspend', 'delete').required()
  });
  
  try {
    const { error, value } = bulkSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }
    
    const { customer_ids, operation } = value;
    const placeholders = customer_ids.map((_, i) => `$${i + 2}`).join(',');
    
    let query, params;
    
    switch (operation) {
      case 'activate':
        query = `UPDATE customers SET status = 'active', updated_at = $1 WHERE id IN (${placeholders}) AND tenant_id = $${customer_ids.length + 2}`;
        params = [new Date().toISOString(), ...customer_ids, req.tenantId];
        break;
      case 'deactivate':
        query = `UPDATE customers SET status = 'inactive', updated_at = $1 WHERE id IN (${placeholders}) AND tenant_id = $${customer_ids.length + 2}`;
        params = [new Date().toISOString(), ...customer_ids, req.tenantId];
        break;
      case 'suspend':
        query = `UPDATE customers SET status = 'suspended', updated_at = $1 WHERE id IN (${placeholders}) AND tenant_id = $${customer_ids.length + 2}`;
        params = [new Date().toISOString(), ...customer_ids, req.tenantId];
        break;
      case 'delete':
        query = `UPDATE customers SET deleted_at = $1 WHERE id IN (${placeholders}) AND tenant_id = $${customer_ids.length + 2}`;
        params = [new Date().toISOString(), ...customer_ids, req.tenantId];
        break;
      default:
        return res.status(400).json({ success: false, message: 'Invalid operation' });
    }
    
    const result = await runQuery(query, params);
    
    res.json({
      success: true,
      message: `Bulk ${operation} completed successfully`,
      data: {
        affected: result.changes || 0
      }
    });
  } catch (error) {
    next(error);
  }
}));

/**
 * @swagger
 * /api/customers/export:
 *   post:
 *     summary: Export customers to CSV
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 */
router.post('/export', requireFunction('customers', 'view'), asyncHandler(async (req, res, next) => {
  const { getQuery } = require('../utils/database');
  
  try {
    const { customer_ids, filters } = req.body;
    
    let query = `
      SELECT 
        c.code,
        c.name,
        c.type,
        c.phone,
        c.email,
        c.address,
        c.status,
        c.credit_limit,
        c.payment_terms,
        c.created_at,
        COALESCE(order_count, 0) as total_orders,
        COALESCE(order_total, 0) as total_spent
      FROM customers c
      LEFT JOIN (
        SELECT customer_id, COUNT(*) as order_count, SUM(total_amount) as order_total
        FROM orders
        WHERE tenant_id = $1
        GROUP BY customer_id
      ) o ON c.id = o.customer_id
      WHERE c.tenant_id = $2 AND c.deleted_at IS NULL
    `;
    
    let params = [req.tenantId, req.tenantId];
    let paramIndex = 3;
    
    if (customer_ids && customer_ids.length > 0) {
      const placeholders = customer_ids.map((_, i) => `$${paramIndex + i}`).join(',');
      query += ` AND c.id IN (${placeholders})`;
      params.push(...customer_ids);
      paramIndex += customer_ids.length;
    }
    
    if (filters?.status) {
      query += ` AND c.status = $${paramIndex}`;
      params.push(filters.status);
      paramIndex++;
    }
    
    if (filters?.type) {
      query += ` AND c.type = $${paramIndex}`;
      params.push(filters.type);
      paramIndex++;
    }
    
    query += ' ORDER BY c.name ASC';
    
    const customers = await getQuery(query, params);
    
    // Convert to CSV
    const headers = ['Code', 'Name', 'Type', 'Phone', 'Email', 'Address', 'Status', 'Credit Limit', 'Payment Terms', 'Created At', 'Total Orders', 'Total Spent'];
    const rows = customers.map(c => [
      c.code || '',
      c.name || '',
      c.type || '',
      c.phone || '',
      c.email || '',
      c.address || '',
      c.status || '',
      c.credit_limit || 0,
      c.payment_terms || 0,
      c.created_at || '',
      c.total_orders || 0,
      c.total_spent || 0
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=customers_export_${Date.now()}.csv`);
    res.send(csvContent);
  } catch (error) {
    next(error);
  }
}));

/**
 * @swagger
 * /api/customers/stats:
 *   get:
 *     summary: Get customer statistics
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 */


/**
 * Get customer visits history
 */
router.get('/:id/visits', requireFunction('customers', 'view'), asyncHandler(async (req, res, next) => {
  const { getQuery } = require('../utils/database');
  
  try {
    const visits = await getQuery(`
      SELECT v.*, u.first_name || ' ' || u.last_name as agent_name
      FROM visits v
      LEFT JOIN users u ON v.agent_id = u.id
      WHERE v.customer_id = $1 AND v.tenant_id = $2
      ORDER BY v.visit_date DESC
      LIMIT 50
    `, [req.params.id, req.tenantId]);
    
    res.json({ success: true, data: visits });
  } catch (error) {
    next(error);
  }
}));

/**
 * Get customer KYC information
 */
router.get('/:id/kyc', requireFunction('customers', 'view'), asyncHandler(async (req, res, next) => {
  const { getOneQuery } = require('../utils/database');
  
  try {
    const kyc = await getOneQuery(`
      SELECT * FROM customer_kyc
      WHERE customer_id = $1 AND tenant_id = $2
      ORDER BY created_at DESC
      LIMIT 1
    `, [req.params.id, req.tenantId]);
    
    res.json({ success: true, data: kyc });
  } catch (error) {
    next(error);
  }
}));

/**
 * Add customer note
 */
router.post('/:id/notes', requireFunction('customers', 'edit'), asyncHandler(async (req, res, next) => {
  const { runQuery } = require('../utils/database');
  const { note } = req.body;
  
  if (!note) {
    return res.status(400).json({ success: false, error: 'Note is required' });
  }
  
  try {
    const noteId = uuidv4();
    await runQuery(`
      INSERT INTO customer_notes (id, customer_id, tenant_id, user_id, note, created_at)
      VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
    `, [noteId, req.params.id, req.tenantId, req.userId, note]);
    
    res.json({ success: true, data: { id: noteId, note, created_at: new Date().toISOString() } });
  } catch (error) {
    next(error);
  }
}));

/**
 * Get customer notes
 */
router.get('/:id/notes', requireFunction('customers', 'view'), asyncHandler(async (req, res, next) => {
  const { getQuery } = require('../utils/database');
  
  try {
    const notes = await getQuery(`
      SELECT cn.*, u.first_name || ' ' || u.last_name as user_name
      FROM customer_notes cn
      LEFT JOIN users u ON cn.user_id = u.id
      WHERE cn.customer_id = $1 AND cn.tenant_id = $2
      ORDER BY cn.created_at DESC
    `, [req.params.id, req.tenantId]);
    
    res.json({ success: true, data: notes });
  } catch (error) {
    next(error);
  }
}));

/**
 * Get customer credit information
 */
router.get('/:id/credit', requireFunction('customers', 'view'), asyncHandler(async (req, res, next) => {
  const { getOneQuery, getQuery } = require('../utils/database');
  
  try {
    const customer = await getOneQuery(`
      SELECT credit_limit, payment_terms FROM customers
      WHERE id = $1 AND tenant_id = $2
    `, [req.params.id, req.tenantId]);
    
    if (!customer) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }
    
    // Calculate outstanding balance
    const outstandingResult = await getOneQuery(`
      SELECT COALESCE(SUM(total_amount - paid_amount), 0) as outstanding
      FROM orders
      WHERE customer_id = $1 AND tenant_id = $2 AND payment_status != 'paid'
    `, [req.params.id, req.tenantId]);
    
    const outstanding = outstandingResult?.outstanding || 0;
    const creditLimit = customer.credit_limit || 0;
    const available = creditLimit - outstanding;
    
    res.json({
      success: true,
      data: {
        credit_limit: creditLimit,
        outstanding: outstanding,
        available: available,
        utilization: creditLimit > 0 ? (outstanding / creditLimit * 100).toFixed(2) : 0,
        payment_terms: customer.payment_terms
      }
    });
  } catch (error) {
    next(error);
  }
}));

/**
 * Bulk create/update customers
 */
router.post('/bulk', requireFunction('customers', 'create'), asyncHandler(async (req, res, next) => {
  const { runQuery, getOneQuery } = require('../utils/database');
  const { customers } = req.body;
  
  if (!Array.isArray(customers) || customers.length === 0) {
    return res.status(400).json({ success: false, error: 'Customers array is required' });
  }
  
  try {
    const results = { created: 0, updated: 0, errors: [] };
    
    for (const customerData of customers) {
      try {
        // Check if customer exists by code
        const existing = await getOneQuery(`
          SELECT id FROM customers WHERE code = $1 AND tenant_id = $2
        `, [customerData.code, req.tenantId]);
        
        if (existing) {
          // Update
          await runQuery(`
            UPDATE customers
            SET name = $1, type = $2, phone = $3, email = $4, address = $5,
                latitude = $6, longitude = $7, credit_limit = $8, payment_terms = $9,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $10 AND tenant_id = $11
          `, [
            customerData.name, customerData.type || 'retail', customerData.phone,
            customerData.email, customerData.address, customerData.latitude,
            customerData.longitude, customerData.creditLimit || 0,
            customerData.paymentTerms || 0, existing.id, req.tenantId
          ]);
          results.updated++;
        } else {
          // Create
          const customerId = uuidv4();
          await runQuery(`
            INSERT INTO customers (
              id, tenant_id, code, name, type, phone, email, address,
              latitude, longitude, credit_limit, payment_terms, status, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'active', CURRENT_TIMESTAMP)
          `, [
            customerId, req.tenantId, customerData.code, customerData.name,
            customerData.type || 'retail', customerData.phone, customerData.email,
            customerData.address, customerData.latitude, customerData.longitude,
            customerData.creditLimit || 0, customerData.paymentTerms || 0
          ]);
          results.created++;
        }
      } catch (err) {
        results.errors.push({
          customer: customerData.code,
          error: err.message
        });
      }
    }
    
    res.json({ success: true, data: results });
  } catch (error) {
    next(error);
  }
}));

/**
 * Export customers to CSV
 */
router.post('/export', requireFunction('customers', 'view'), asyncHandler(async (req, res, next) => {
  const { getQuery } = require('../utils/database');
  
  try {
    const { type, status, routeId } = req.body;
    
    let whereClause = 'WHERE c.tenant_id = $1';
    let params = [req.tenantId];
    let paramIndex = 2;
    
    if (type) {
      whereClause += ` AND c.type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }
    
    if (status) {
      whereClause += ` AND c.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    if (routeId) {
      whereClause += ` AND c.route_id = $${paramIndex}`;
      params.push(routeId);
      paramIndex++;
    }
    
    const customers = await getQuery(`
      SELECT 
        c.code, c.name, c.type, c.phone, c.email, c.address,
        c.credit_limit, c.payment_terms, c.status, c.latitude, c.longitude,
        r.name as route_name, c.created_at
      FROM customers c
      LEFT JOIN routes r ON c.route_id = r.id
      ${whereClause}
      ORDER BY c.created_at DESC
    `, params);
    
    // Convert to CSV
    if (customers.length === 0) {
      return res.json({ success: true, data: { csv: '', count: 0 } });
    }
    
    const headers = Object.keys(customers[0]);
    const csvRows = [headers.join(',')];
    
    for (const customer of customers) {
      const values = headers.map(header => {
        const val = customer[header];
        return val !== null && val !== undefined ? `"${String(val).replace(/"/g, '""')}"` : '';
      });
      csvRows.push(values.join(','));
    }
    
    const csv = csvRows.join('\n');
    
    res.json({
      success: true,
      data: {
        csv: csv,
        count: customers.length,
        filename: `customers_export_${new Date().toISOString().split('T')[0]}.csv`
      }
    });
  } catch (error) {
    next(error);
  }
}));

/**
 * Get customer statistics
 */
router.get('/stats/summary', requireFunction('customers', 'view'), asyncHandler(async (req, res, next) => {
  const { getOneQuery } = require('../utils/database');
  
  try {
    const stats = await getOneQuery(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) as inactive,
        SUM(CASE WHEN type = 'retail' THEN 1 ELSE 0 END) as retail,
        SUM(CASE WHEN type = 'wholesale' THEN 1 ELSE 0 END) as wholesale,
        SUM(CASE WHEN type = 'distributor' THEN 1 ELSE 0 END) as distributor
      FROM customers
      WHERE tenant_id = $1
    `, [req.tenantId]);
    
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
}));

module.exports = router;
