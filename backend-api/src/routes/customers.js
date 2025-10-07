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
  const { getQuery, getOneQuery } = require('../database/init');
  
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;
  const { type, routeId, status, search } = req.query;
  
  try {
    let whereClause = 'WHERE c.tenant_id = ?';
    let params = [req.tenantId];
    
    if (type) {
      whereClause += ' AND c.type = ?';
      params.push(type);
    }
    
    if (routeId) {
      whereClause += ' AND c.route_id = ?';
      params.push(routeId);
    }
    
    if (status) {
      whereClause += ' AND c.status = ?';
      params.push(status);
    }
    
    if (search) {
      whereClause += ' AND (c.name LIKE ? OR c.code LIKE ? OR c.phone LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }
    
    // Get customers with route information
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
      GROUP BY c.id
      ORDER BY c.created_at DESC
      LIMIT ? OFFSET ?
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
  const { getOneQuery, runQuery } = require('../database/init');
  
  const { error, value } = createCustomerSchema.validate(req.body);
  if (error) {
    return next(new AppError(error.details[0].message, 400, 'VALIDATION_ERROR'));
  }
  
  const { name, code, type, phone, email, address, latitude, longitude, routeId, creditLimit, paymentTerms } = value;
  
  try {
    // Check if customer code already exists in this tenant
    const existingCustomer = await getOneQuery(
      'SELECT id FROM customers WHERE code = ? AND tenant_id = ?',
      [code, req.tenantId]
    );
    
    if (existingCustomer) {
      return next(new AppError('Customer code already exists', 409, 'DUPLICATE_CUSTOMER_CODE'));
    }
    
    // Validate route if provided
    if (routeId) {
      const route = await getOneQuery(
        'SELECT id FROM routes WHERE id = ? AND tenant_id = ?',
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
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [customerId, req.tenantId, name, code, type, phone, email, address, latitude, longitude, routeId, creditLimit, paymentTerms, 'active']);
    
    // Get created customer with route information
    const createdCustomer = await getOneQuery(`
      SELECT 
        c.*,
        r.name as route_name,
        r.code as route_code
      FROM customers c
      LEFT JOIN routes r ON r.id = c.route_id
      WHERE c.id = ?
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
router.get('/:id', requireFunction('customers', 'view'), asyncHandler(async (req, res, next) => {
  // Lazy-load database functions
  const { getOneQuery, getQuery } = require('../database/init');
  
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
      WHERE c.id = ? AND c.tenant_id = ?
      GROUP BY c.id
    `, [id, req.tenantId]);
    
    if (!customer) {
      return next(new AppError('Customer not found', 404, 'CUSTOMER_NOT_FOUND'));
    }
    
    // Get recent orders
    const recentOrders = await getQuery(`
      SELECT id, order_number, order_date, total_amount, order_status
      FROM orders 
      WHERE customer_id = ? 
      ORDER BY order_date DESC 
      LIMIT 5
    `, [id]);
    
    // Get recent visits
    const recentVisits = await getQuery(`
      SELECT 
        v.id, v.visit_date, v.visit_type, v.outcome,
        u.first_name, u.last_name
      FROM visits v
      JOIN agents a ON a.id = v.agent_id
      JOIN users u ON u.id = a.user_id
      WHERE v.customer_id = ? 
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
  const { getOneQuery, runQuery } = require('../database/init');
  
  const { id } = req.params;
  const { error, value } = updateCustomerSchema.validate(req.body);
  
  if (error) {
    return next(new AppError(error.details[0].message, 400, 'VALIDATION_ERROR'));
  }
  
  try {
    // Check if customer exists
    const existingCustomer = await getOneQuery(
      'SELECT * FROM customers WHERE id = ? AND tenant_id = ?',
      [id, req.tenantId]
    );
    
    if (!existingCustomer) {
      return next(new AppError('Customer not found', 404, 'CUSTOMER_NOT_FOUND'));
    }
    
    // Check if code is being changed and already exists
    if (value.code && value.code !== existingCustomer.code) {
      const codeExists = await getOneQuery(
        'SELECT id FROM customers WHERE code = ? AND tenant_id = ? AND id != ?',
        [value.code, req.tenantId, id]
      );
      
      if (codeExists) {
        return next(new AppError('Customer code already exists', 409, 'DUPLICATE_CUSTOMER_CODE'));
      }
    }
    
    // Validate route if provided
    if (value.routeId) {
      const route = await getOneQuery(
        'SELECT id FROM routes WHERE id = ? AND tenant_id = ?',
        [value.routeId, req.tenantId]
      );
      
      if (!route) {
        return next(new AppError('Invalid route ID', 400, 'INVALID_ROUTE'));
      }
    }
    
    // Build update query
    const updateFields = [];
    const updateValues = [];
    
    Object.keys(value).forEach(key => {
      if (value[key] !== undefined) {
        if (key === 'routeId') {
          updateFields.push('route_id = ?');
        } else if (key === 'creditLimit') {
          updateFields.push('credit_limit = ?');
        } else if (key === 'paymentTerms') {
          updateFields.push('payment_terms = ?');
        } else {
          updateFields.push(`${key} = ?`);
        }
        updateValues.push(value[key]);
      }
    });
    
    if (updateFields.length === 0) {
      return next(new AppError('No fields to update', 400, 'NO_UPDATE_FIELDS'));
    }
    
    // Note: customers table doesn't have updated_at column in schema
    updateValues.push(id, req.tenantId);
    
    await runQuery(`
      UPDATE customers 
      SET ${updateFields.join(', ')} 
      WHERE id = ? AND tenant_id = ?
    `, updateValues);
    
    // Get updated customer
    const updatedCustomer = await getOneQuery(`
      SELECT 
        c.*,
        r.name as route_name,
        r.code as route_code
      FROM customers c
      LEFT JOIN routes r ON r.id = c.route_id
      WHERE c.id = ? AND c.tenant_id = ?
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
  const { getOneQuery, runQuery } = require('../database/init');
  
  const { id } = req.params;
  
  try {
    // Check if customer exists
    const existingCustomer = await getOneQuery(
      'SELECT * FROM customers WHERE id = ? AND tenant_id = ?',
      [id, req.tenantId]
    );
    
    if (!existingCustomer) {
      return next(new AppError('Customer not found', 404, 'CUSTOMER_NOT_FOUND'));
    }
    
    // Check if customer has orders
    const hasOrders = await getOneQuery(
      'SELECT COUNT(*) as count FROM orders WHERE customer_id = ?',
      [id]
    );
    
    if (hasOrders.count > 0) {
      // Soft delete by setting status to inactive
      await runQuery(
        'UPDATE customers SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND tenant_id = ?',
        ['inactive', id, req.tenantId]
      );
    } else {
      // Hard delete if no orders
      await runQuery(
        'DELETE FROM customers WHERE id = ? AND tenant_id = ?',
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
  const { getOneQuery, getQuery } = require('../database/init');
  
  const { id } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;
  
  try {
    // Verify customer exists
    const customer = await getOneQuery(
      'SELECT id FROM customers WHERE id = ? AND tenant_id = ?',
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
      LEFT JOIN agents a ON a.id = o.salesman_id
      LEFT JOIN users u ON u.id = a.user_id
      WHERE o.customer_id = ?
      ORDER BY o.order_date DESC
      LIMIT ? OFFSET ?
    `, [id, limit, offset]);
    
    // Get total count
    const totalResult = await getOneQuery(
      'SELECT COUNT(*) as total FROM orders WHERE customer_id = ?',
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

module.exports = router;