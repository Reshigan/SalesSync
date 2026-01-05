/**
 * Customer Bulk Operations Routes
 * Bulk import, export operations for customers
 */

const express = require('express');
const Joi = require('joi');
const { v4: uuidv4 } = require('uuid');
const { AppError, asyncHandler } = require('../../middleware/errorHandler');
const { requireFunction } = require('../../middleware/authMiddleware');
const { sendSuccess, sendCreated } = require('../../utils/responseHelper');

const router = express.Router();

/**
 * @swagger
 * /api/customers/bulk:
 *   post:
 *     summary: Bulk import customers
 *     tags: [Customers]
 */
router.post('/bulk', requireFunction('customers', 'create'), asyncHandler(async (req, res, next) => {
  const { getOneQuery, runQuery } = require('../../utils/database');
  
  const bulkSchema = Joi.object({
    customers: Joi.array().items(Joi.object({
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
    })).min(1).max(1000).required()
  });
  
  const { error, value } = bulkSchema.validate(req.body);
  if (error) {
    return next(new AppError(error.details[0].message, 400, 'VALIDATION_ERROR'));
  }
  
  const results = {
    success: 0,
    failed: 0,
    errors: []
  };
  
  for (const customerData of value.customers) {
    try {
      // Check if code already exists
      const existing = await getOneQuery(
        'SELECT id FROM customers WHERE code = ? AND tenant_id = ?',
        [customerData.code, req.tenantId]
      );
      
      if (existing) {
        results.failed++;
        results.errors.push({
          code: customerData.code,
          error: 'Customer code already exists'
        });
        continue;
      }
      
      const customerId = uuidv4();
      await runQuery(`
        INSERT INTO customers (id, tenant_id, name, code, type, phone, email, address, latitude, longitude, route_id, credit_limit, payment_terms, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        customerId,
        req.tenantId,
        customerData.name,
        customerData.code,
        customerData.type,
        customerData.phone,
        customerData.email,
        customerData.address,
        customerData.latitude,
        customerData.longitude,
        customerData.routeId,
        customerData.creditLimit,
        customerData.paymentTerms,
        'active'
      ]);
      
      results.success++;
    } catch (err) {
      results.failed++;
      results.errors.push({
        code: customerData.code,
        error: err.message
      });
    }
  }
  
  return sendCreated(res, results, `Imported ${results.success} customers, ${results.failed} failed`);
}));

/**
 * @swagger
 * /api/customers/export:
 *   post:
 *     summary: Export customers to CSV
 *     tags: [Customers]
 */
router.post('/export', requireFunction('customers', 'view'), asyncHandler(async (req, res, next) => {
  const { getQuery } = require('../../utils/database');
  
  const { format = 'csv', filters = {} } = req.body;
  
  let whereClause = 'WHERE c.tenant_id = ?';
  let params = [req.tenantId];
  
  if (filters.type) {
    whereClause += ' AND c.type = ?';
    params.push(filters.type);
  }
  
  if (filters.status) {
    whereClause += ' AND c.status = ?';
    params.push(filters.status);
  }
  
  if (filters.routeId) {
    whereClause += ' AND c.route_id = ?';
    params.push(filters.routeId);
  }
  
  const customers = await getQuery(`
    SELECT 
      c.code,
      c.name,
      c.type,
      c.phone,
      c.email,
      c.address,
      c.latitude,
      c.longitude,
      c.credit_limit,
      c.payment_terms,
      c.status,
      r.name as route_name,
      c.created_at
    FROM customers c
    LEFT JOIN routes r ON r.id = c.route_id
    ${whereClause}
    ORDER BY c.name
  `, params);
  
  if (format === 'csv') {
    const headers = ['Code', 'Name', 'Type', 'Phone', 'Email', 'Address', 'Latitude', 'Longitude', 'Credit Limit', 'Payment Terms', 'Status', 'Route', 'Created At'];
    const rows = customers.map(c => [
      c.code,
      c.name,
      c.type,
      c.phone || '',
      c.email || '',
      c.address || '',
      c.latitude || '',
      c.longitude || '',
      c.credit_limit || 0,
      c.payment_terms || 0,
      c.status,
      c.route_name || '',
      c.created_at
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=customers.csv');
    return res.send(csvContent);
  }
  
  return sendSuccess(res, customers);
}));

module.exports = router;
