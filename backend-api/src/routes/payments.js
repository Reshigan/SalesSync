/**
 * Payment Processing Routes
 * Stripe integration for credit card payments
 */

const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_51QRMzI0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000');
const { AppError, asyncHandler } = require('../middleware/errorHandler');

/**
 * POST /api/payments/create-payment-intent
 * Create a payment intent for Stripe
 */
router.post('/create-payment-intent', asyncHandler(async (req, res) => {
  const { amount, currency, customerId, invoiceId, metadata } = req.body;
  const tenantId = req.tenantId;

  if (!amount || amount <= 0) {
    throw new AppError('Valid amount is required', 400);
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // Convert to cents
    currency: currency || 'usd',
    metadata: {
      tenantId,
      customerId,
      invoiceId,
      ...metadata
    },
    automatic_payment_methods: {
      enabled: true,
    },
  });

  res.json({
    success: true,
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id
  });
}));

/**
 * POST /api/payments/process
 * Process a payment (record in database)
 */
router.post('/process', asyncHandler(async (req, res) => {
  const { runQuery, getOneQuery } = require('../database/init');
  const tenantId = req.tenantId;
  const {
    customerId,
    invoiceId,
    amount,
    currency = 'USD',
    paymentMethod,
    paymentIntentId,
    status = 'completed',
    notes
  } = req.body;

  if (!customerId || !amount) {
    throw new AppError('Customer ID and amount are required', 400);
  }

  const paymentDate = new Date().toISOString();
  const result = await runQuery(
    `INSERT INTO payments (
      tenant_id, customer_id, invoice_id, payment_date,
      amount, payment_method, reference_number, notes, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      tenantId,
      customerId,
      invoiceId || null,
      paymentDate,
      amount,
      paymentMethod || 'credit_card',
      paymentIntentId,
      notes || '',
      status
    ]
  );

  const payment = await getOneQuery(
    'SELECT * FROM payments WHERE id = ?',
    [result.lastID]
  );

  res.json({
    success: true,
    payment
  });
}));

/**
 * GET /api/payments
 * List all payments for tenant
 */
router.get('/', asyncHandler(async (req, res) => {
  const { getQuery, getOneQuery } = require('../database/init');
  const tenantId = req.tenantId;
  const { customerId, status, startDate, endDate, limit = 50, offset = 0 } = req.query;

  let whereClause = 'WHERE p.tenant_id = ?';
  let params = [tenantId];

  if (customerId) {
    whereClause += ' AND p.customer_id = ?';
    params.push(customerId);
  }

  if (status) {
    whereClause += ' AND p.status = ?';
    params.push(status);
  }

  if (startDate) {
    whereClause += ' AND p.payment_date >= ?';
    params.push(startDate);
  }

  if (endDate) {
    whereClause += ' AND p.payment_date <= ?';
    params.push(endDate);
  }

  const paymentsQuery = `
    SELECT
      p.*,
      c.name as customer_name
    FROM payments p
    LEFT JOIN customers c ON p.customer_id = c.id
    ${whereClause}
    ORDER BY p.payment_date DESC
    LIMIT ? OFFSET ?
  `;
  params.push(parseInt(limit), parseInt(offset));

  const payments = await getQuery(paymentsQuery, params);

  const countQuery = `SELECT COUNT(*) as total FROM payments p ${whereClause}`;
  const countResult = await getOneQuery(countQuery, params.slice(0, -2));
  const total = countResult.total;

  res.json({
    payments,
    pagination: {
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    }
  });
}));

/**
 * GET /api/payments/:id
 * Get payment by ID
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const { getOneQuery } = require('../database/init');
  const tenantId = req.tenantId;
  const { id } = req.params;

  const payment = await getOneQuery(
    `SELECT
      p.*,
      c.name as customer_name,
      i.invoice_number
    FROM payments p
    LEFT JOIN customers c ON p.customer_id = c.id
    LEFT JOIN invoices i ON p.invoice_id = i.id
    WHERE p.id = ? AND p.tenant_id = ?`,
    [id, tenantId]
  );

  if (!payment) {
    throw new AppError('Payment not found', 404);
  }

  res.json(payment);
}));

/**
 * POST /api/payments/:id/refund
 * Process a refund
 */
router.post('/:id/refund', asyncHandler(async (req, res) => {
  const { runQuery, getOneQuery } = require('../database/init');
  const tenantId = req.tenantId;
  const { id } = req.params;
  const { amount, reason } = req.body;

  const payment = await getOneQuery(
    'SELECT * FROM payments WHERE id = ? AND tenant_id = ?',
    [id, tenantId]
  );

  if (!payment) {
    throw new AppError('Payment not found', 404);
  }

  if (payment.status === 'refunded') {
    throw new AppError('Payment already refunded', 400);
  }

  const refundAmount = amount || payment.amount;

  // Process Stripe refund if payment has a reference number
  if (payment.reference_number && payment.reference_number.startsWith('pi_')) {
    try {
      await stripe.refunds.create({
        payment_intent: payment.reference_number,
        amount: Math.round(refundAmount * 100)
      });
    } catch (stripeError) {
      throw new AppError(`Stripe refund failed: ${stripeError.message}`, 500);
    }
  }

  // Update payment status
  await runQuery(
    `UPDATE payments 
     SET status = 'refunded', 
         notes = COALESCE(notes, '') || '\nRefund: ' || ? || ' Amount: ' || ?
     WHERE id = ?`,
    [reason || 'No reason provided', refundAmount, id]
  );

  const updatedPayment = await getOneQuery(
    'SELECT * FROM payments WHERE id = ?',
    [id]
  );

  res.json({
    success: true,
    payment: updatedPayment
  });
}));

/**
 * GET /api/payments/stats
 * Get payment statistics
 */
router.get('/tenant/stats', asyncHandler(async (req, res) => {
  const { getQuery, getOneQuery } = require('../database/init');
  const tenantId = req.tenantId;
  const { startDate, endDate } = req.query;

  let whereClause = 'WHERE tenant_id = ?';
  let params = [tenantId];

  if (startDate) {
    whereClause += ' AND payment_date >= ?';
    params.push(startDate);
  }

  if (endDate) {
    whereClause += ' AND payment_date <= ?';
    params.push(endDate);
  }

  const stats = await getOneQuery(
    `SELECT
      COUNT(*) as total_payments,
      SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as total_amount,
      SUM(CASE WHEN status = 'refunded' THEN amount ELSE 0 END) as total_refunded,
      AVG(CASE WHEN status = 'completed' THEN amount ELSE NULL END) as avg_amount
    FROM payments
    ${whereClause}`,
    params
  );

  const paymentsByMethod = await getQuery(
    `SELECT
      payment_method,
      COUNT(*) as count,
      SUM(amount) as total
    FROM payments
    ${whereClause}
    GROUP BY payment_method`,
    params
  );

  res.json({
    stats,
    paymentsByMethod
  });
}));

module.exports = router;
