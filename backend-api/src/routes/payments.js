/**
 * Payment Processing Routes
 * Stripe integration for credit card payments
 */

const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_51QRMzI0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000');
const { authenticateToken, getTenantId } = require('../middleware/auth');
const { getDatabase } = require('../database/database');

/**
 * POST /api/payments/create-payment-intent
 * Create a payment intent for Stripe
 */
router.post('/create-payment-intent', authenticateToken, async (req, res) => {
  try {
    const { amount, currency, customerId, invoiceId, metadata } = req.body;
    const tenantId = getTenantId(req);

    // Validate input
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }

    // Create payment intent
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
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });

  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/payments/process
 * Process a payment (record in database)
 */
router.post('/process', authenticateToken, async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const db = getDatabase();
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

    // Validate required fields
    if (!customerId || !amount) {
      return res.status(400).json({ error: 'Customer ID and amount are required' });
    }

    // Insert payment record
    const paymentDate = new Date().toISOString();
    const result = await db.run(
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

    // Update invoice if provided
    if (invoiceId) {
      await updateInvoicePayment(db, invoiceId, amount, tenantId);
    }

    // Retrieve the created payment
    const payment = await db.get(
      'SELECT * FROM payments WHERE id = ?',
      [result.lastID]
    );

    res.json({
      success: true,
      payment
    });

  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/payments
 * List all payments for tenant
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const db = getDatabase();
    const { customerId, status, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT p.*, 
             c.name as customer_name,
             i.invoice_number
      FROM payments p
      LEFT JOIN customers c ON p.customer_id = c.id
      LEFT JOIN invoices i ON p.invoice_id = i.id
      WHERE p.tenant_id = ?
    `;
    const params = [tenantId];

    if (customerId) {
      query += ' AND p.customer_id = ?';
      params.push(customerId);
    }

    if (status) {
      query += ' AND p.status = ?';
      params.push(status);
    }

    query += ' ORDER BY p.payment_date DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const payments = await db.all(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM payments WHERE tenant_id = ?';
    const countParams = [tenantId];
    if (customerId) {
      countQuery += ' AND customer_id = ?';
      countParams.push(customerId);
    }
    if (status) {
      countQuery += ' AND status = ?';
      countParams.push(status);
    }

    const { total } = await db.get(countQuery, countParams);

    res.json({
      payments,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });

  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/payments/:id
 * Get payment details
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const db = getDatabase();
    const { id } = req.params;

    const payment = await db.get(
      `SELECT p.*, 
              c.name as customer_name,
              c.email as customer_email,
              i.invoice_number,
              i.total_amount as invoice_total
       FROM payments p
       LEFT JOIN customers c ON p.customer_id = c.id
       LEFT JOIN invoices i ON p.invoice_id = i.id
       WHERE p.id = ? AND p.tenant_id = ?`,
      [id, tenantId]
    );

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    res.json(payment);

  } catch (error) {
    console.error('Error fetching payment:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/payments/:id/refund
 * Create a refund
 */
router.post('/:id/refund', authenticateToken, async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const db = getDatabase();
    const { id } = req.params;
    const { amount, reason } = req.body;

    // Get original payment
    const payment = await db.get(
      'SELECT * FROM payments WHERE id = ? AND tenant_id = ?',
      [id, tenantId]
    );

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    if (payment.status !== 'completed') {
      return res.status(400).json({ error: 'Can only refund completed payments' });
    }

    const refundAmount = amount || payment.amount;

    // If payment has Stripe reference, process refund through Stripe
    if (payment.reference_number && payment.reference_number.startsWith('pi_')) {
      try {
        const refund = await stripe.refunds.create({
          payment_intent: payment.reference_number,
          amount: Math.round(refundAmount * 100)
        });

        // Update payment status
        await db.run(
          'UPDATE payments SET status = ?, notes = ? WHERE id = ?',
          ['refunded', `Refunded: ${reason || 'No reason provided'}`, id]
        );

        // Update invoice if applicable
        if (payment.invoice_id) {
          await updateInvoiceRefund(db, payment.invoice_id, refundAmount, tenantId);
        }

        res.json({
          success: true,
          refund: {
            id: refund.id,
            amount: refundAmount,
            status: refund.status
          }
        });

      } catch (stripeError) {
        console.error('Stripe refund error:', stripeError);
        return res.status(500).json({ error: `Stripe refund failed: ${stripeError.message}` });
      }
    } else {
      // Manual refund (for cash, check, etc.)
      await db.run(
        'UPDATE payments SET status = ?, notes = ? WHERE id = ?',
        ['refunded', `Manually refunded: ${reason || 'No reason provided'}`, id]
      );

      if (payment.invoice_id) {
        await updateInvoiceRefund(db, payment.invoice_id, refundAmount, tenantId);
      }

      res.json({
        success: true,
        message: 'Payment marked as refunded (manual process)'
      });
    }

  } catch (error) {
    console.error('Error processing refund:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/payments/summary/stats
 * Get payment statistics
 */
router.get('/summary/stats', authenticateToken, async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const db = getDatabase();
    const { startDate, endDate } = req.query;

    let dateFilter = '';
    const params = [tenantId];

    if (startDate && endDate) {
      dateFilter = 'AND payment_date BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }

    // Total payments by status
    const stats = await db.all(
      `SELECT 
        status,
        COUNT(*) as count,
        SUM(amount) as total_amount
       FROM payments
       WHERE tenant_id = ? ${dateFilter}
       GROUP BY status`,
      params
    );

    // Payment methods breakdown
    const methodStats = await db.all(
      `SELECT 
        payment_method,
        COUNT(*) as count,
        SUM(amount) as total_amount
       FROM payments
       WHERE tenant_id = ? ${dateFilter} AND status = 'completed'
       GROUP BY payment_method`,
      params
    );

    // Recent payments
    const recentPayments = await db.all(
      `SELECT p.*, c.name as customer_name
       FROM payments p
       LEFT JOIN customers c ON p.customer_id = c.id
       WHERE p.tenant_id = ?
       ORDER BY p.payment_date DESC
       LIMIT 10`,
      [tenantId]
    );

    res.json({
      statusBreakdown: stats,
      methodBreakdown: methodStats,
      recentPayments
    });

  } catch (error) {
    console.error('Error fetching payment stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper function to update invoice after payment
async function updateInvoicePayment(db, invoiceId, paymentAmount, tenantId) {
  const invoice = await db.get(
    'SELECT * FROM invoices WHERE id = ? AND tenant_id = ?',
    [invoiceId, tenantId]
  );

  if (!invoice) return;

  const paidAmount = parseFloat(invoice.paid_amount || 0) + parseFloat(paymentAmount);
  const balance = parseFloat(invoice.total_amount) - paidAmount;

  let status = 'partial';
  if (balance <= 0.01) {
    status = 'paid';
  } else if (paidAmount <= 0) {
    status = 'pending';
  }

  await db.run(
    `UPDATE invoices 
     SET paid_amount = ?, balance = ?, status = ?, updated_at = ?
     WHERE id = ?`,
    [paidAmount, balance, status, new Date().toISOString(), invoiceId]
  );
}

// Helper function to update invoice after refund
async function updateInvoiceRefund(db, invoiceId, refundAmount, tenantId) {
  const invoice = await db.get(
    'SELECT * FROM invoices WHERE id = ? AND tenant_id = ?',
    [invoiceId, tenantId]
  );

  if (!invoice) return;

  const paidAmount = parseFloat(invoice.paid_amount || 0) - parseFloat(refundAmount);
  const balance = parseFloat(invoice.total_amount) - paidAmount;

  let status = 'partial';
  if (paidAmount <= 0) {
    status = 'pending';
  }

  await db.run(
    `UPDATE invoices 
     SET paid_amount = ?, balance = ?, status = ?, updated_at = ?
     WHERE id = ?`,
    [paidAmount, balance, status, new Date().toISOString(), invoiceId]
  );
}

module.exports = router;
