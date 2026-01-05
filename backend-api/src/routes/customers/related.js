/**
 * Customer Related Data Routes
 * Orders, visits, credit, notes, KYC for customers
 */

const express = require('express');
const Joi = require('joi');
const { v4: uuidv4 } = require('uuid');
const { AppError, asyncHandler } = require('../../middleware/errorHandler');
const { requireFunction } = require('../../middleware/authMiddleware');
const { sendSuccess, sendCreated, sendPaginated, sendNotFound } = require('../../utils/responseHelper');

const router = express.Router();

/**
 * @swagger
 * /api/customers/{id}/orders:
 *   get:
 *     summary: Get customer orders
 *     tags: [Customers]
 */
router.get('/:id/orders', requireFunction('customers', 'view'), asyncHandler(async (req, res, next) => {
  const { getOneQuery, getQuery } = require('../../utils/database');
  
  const { id } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;
  
  // Verify customer exists
  const customer = await getOneQuery(
    'SELECT id FROM customers WHERE id = ? AND tenant_id = ?',
    [id, req.tenantId]
  );
  
  if (!customer) {
    return sendNotFound(res, 'Customer');
  }
  
  const orders = await getQuery(`
    SELECT 
      o.*,
      (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count
    FROM orders o
    WHERE o.customer_id = ? AND o.tenant_id = ?
    ORDER BY o.created_at DESC
    LIMIT ? OFFSET ?
  `, [id, req.tenantId, limit, offset]);
  
  const totalResult = await getOneQuery(
    'SELECT COUNT(*) as total FROM orders WHERE customer_id = ? AND tenant_id = ?',
    [id, req.tenantId]
  );
  
  return sendPaginated(res, orders, {
    page,
    limit,
    total: totalResult?.total || 0
  });
}));

/**
 * @swagger
 * /api/customers/{id}/visits:
 *   get:
 *     summary: Get customer visits
 *     tags: [Customers]
 */
router.get('/:id/visits', requireFunction('customers', 'view'), asyncHandler(async (req, res, next) => {
  const { getQuery } = require('../../utils/database');
  
  const { id } = req.params;
  
  const visits = await getQuery(`
    SELECT v.*, u.name as agent_name
    FROM visits v
    LEFT JOIN users u ON v.agent_id = u.id
    WHERE v.customer_id = ? AND v.tenant_id = ?
    ORDER BY v.visit_date DESC
    LIMIT 50
  `, [id, req.tenantId]);
  
  return sendSuccess(res, visits);
}));

/**
 * @swagger
 * /api/customers/{id}/credit:
 *   get:
 *     summary: Get customer credit information
 *     tags: [Customers]
 */
router.get('/:id/credit', requireFunction('customers', 'view'), asyncHandler(async (req, res, next) => {
  const { getOneQuery } = require('../../utils/database');
  
  const { id } = req.params;
  
  const customer = await getOneQuery(
    'SELECT id, name, credit_limit FROM customers WHERE id = ? AND tenant_id = ?',
    [id, req.tenantId]
  );
  
  if (!customer) {
    return sendNotFound(res, 'Customer');
  }
  
  // Get outstanding balance
  const outstandingResult = await getOneQuery(`
    SELECT COALESCE(SUM(total_amount), 0) as outstanding
    FROM orders
    WHERE customer_id = ? AND payment_status != 'paid' AND order_status != 'cancelled'
  `, [id]);
  
  const creditInfo = {
    customer_id: id,
    customer_name: customer.name,
    credit_limit: customer.credit_limit || 0,
    outstanding_balance: outstandingResult?.outstanding || 0,
    available_credit: (customer.credit_limit || 0) - (outstandingResult?.outstanding || 0)
  };
  
  return sendSuccess(res, creditInfo);
}));

/**
 * @swagger
 * /api/customers/{id}/notes:
 *   get:
 *     summary: Get customer notes
 *     tags: [Customers]
 */
router.get('/:id/notes', requireFunction('customers', 'view'), asyncHandler(async (req, res, next) => {
  const { getQuery } = require('../../utils/database');
  
  const { id } = req.params;
  
  const notes = await getQuery(`
    SELECT cn.*, u.name as created_by_name
    FROM customer_notes cn
    LEFT JOIN users u ON cn.created_by = u.id
    WHERE cn.customer_id = ?
    ORDER BY cn.created_at DESC
  `, [id]);
  
  return sendSuccess(res, notes);
}));

/**
 * @swagger
 * /api/customers/{id}/notes:
 *   post:
 *     summary: Add customer note
 *     tags: [Customers]
 */
router.post('/:id/notes', requireFunction('customers', 'edit'), asyncHandler(async (req, res, next) => {
  const { getOneQuery, runQuery } = require('../../utils/database');
  
  const { id } = req.params;
  
  const noteSchema = Joi.object({
    note: Joi.string().required().min(1).max(2000),
    note_type: Joi.string().valid('general', 'payment', 'delivery', 'complaint', 'other').default('general')
  });
  
  const { error, value } = noteSchema.validate(req.body);
  if (error) {
    return next(new AppError(error.details[0].message, 400, 'VALIDATION_ERROR'));
  }
  
  // Verify customer exists
  const customer = await getOneQuery(
    'SELECT id FROM customers WHERE id = ? AND tenant_id = ?',
    [id, req.tenantId]
  );
  
  if (!customer) {
    return sendNotFound(res, 'Customer');
  }
  
  const noteId = uuidv4();
  await runQuery(`
    INSERT INTO customer_notes (id, customer_id, note, note_type, created_by, created_at)
    VALUES (?, ?, ?, ?, ?, datetime('now'))
  `, [noteId, id, value.note, value.note_type, req.user?.id]);
  
  const note = await getOneQuery(
    'SELECT * FROM customer_notes WHERE id = ?',
    [noteId]
  );
  
  return sendCreated(res, note, 'Note added successfully');
}));

/**
 * @swagger
 * /api/customers/{id}/kyc:
 *   get:
 *     summary: Get customer KYC information
 *     tags: [Customers]
 */
router.get('/:id/kyc', requireFunction('customers', 'view'), asyncHandler(async (req, res, next) => {
  const { getOneQuery } = require('../../utils/database');
  
  const { id } = req.params;
  
  const kyc = await getOneQuery(`
    SELECT * FROM customer_kyc WHERE customer_id = ?
  `, [id]);
  
  return sendSuccess(res, kyc || { customer_id: id, status: 'not_started' });
}));

module.exports = router;
