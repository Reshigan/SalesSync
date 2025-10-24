/**
 * Payment Service
 * Handles payment processing with multiple payment providers
 * Supports: Stripe, PayPal (extensible for others)
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy');
const { getDatabase } = require('../database/database');
const logger = require('../utils/logger');

class PaymentService {
  constructor() {
    this.providers = {
      stripe: this.processStripePayment.bind(this),
      paypal: this.processPayPalPayment.bind(this),
      cash: this.processCashPayment.bind(this),
      check: this.processCheckPayment.bind(this),
      bank_transfer: this.processBankTransferPayment.bind(this)
    };
  }

  /**
   * Process payment with specified provider
   */
  async processPayment(paymentData) {
    const {
      provider = 'stripe',
      amount,
      currency = 'USD',
      customerId,
      invoiceId,
      metadata = {},
      paymentMethod
    } = paymentData;

    try {
      // Validate payment data
      this.validatePaymentData(paymentData);

      // Get the provider processor
      const processor = this.providers[provider.toLowerCase()];
      if (!processor) {
        throw new Error(`Payment provider ${provider} not supported`);
      }

      // Process payment with provider
      const result = await processor({
        amount,
        currency,
        customerId,
        invoiceId,
        metadata,
        paymentMethod
      });

      // Record payment in database
      const paymentRecord = await this.recordPayment({
        ...paymentData,
        providerTransactionId: result.transactionId,
        status: result.status,
        providerResponse: result.raw
      });

      // Update invoice status if applicable
      if (invoiceId) {
        await this.updateInvoiceStatus(invoiceId, paymentRecord);
      }

      logger.info('Payment processed successfully', {
        paymentId: paymentRecord.id,
        provider,
        amount,
        currency
      });

      return {
        success: true,
        payment: paymentRecord,
        transaction: result
      };

    } catch (error) {
      logger.error('Payment processing failed', {
        error: error.message,
        paymentData
      });
      
      // Record failed payment attempt
      await this.recordPaymentFailure(paymentData, error);
      
      throw error;
    }
  }

  /**
   * Process Stripe payment
   */
  async processStripePayment({ amount, currency, customerId, metadata, paymentMethod }) {
    try {
      // Convert amount to cents (Stripe requirement)
      const amountInCents = Math.round(amount * 100);

      // Create payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: currency.toLowerCase(),
        customer: metadata.stripeCustomerId,
        payment_method: paymentMethod,
        confirm: true,
        metadata: {
          customerId,
          ...metadata
        }
      });

      return {
        transactionId: paymentIntent.id,
        status: this.mapStripeStatus(paymentIntent.status),
        raw: paymentIntent
      };

    } catch (error) {
      logger.error('Stripe payment failed', { error: error.message });
      throw new Error(`Stripe payment failed: ${error.message}`);
    }
  }

  /**
   * Process PayPal payment (placeholder)
   */
  async processPayPalPayment(data) {
    // TODO: Implement PayPal integration
    logger.info('PayPal payment processing (not implemented)', data);
    throw new Error('PayPal integration not yet implemented');
  }

  /**
   * Process cash payment
   */
  async processCashPayment({ amount, metadata }) {
    return {
      transactionId: `CASH-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      status: 'completed',
      raw: {
        type: 'cash',
        amount,
        receivedBy: metadata.receivedBy || 'Unknown',
        receiptNumber: metadata.receiptNumber
      }
    };
  }

  /**
   * Process check payment
   */
  async processCheckPayment({ amount, metadata }) {
    return {
      transactionId: `CHECK-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      status: 'pending',
      raw: {
        type: 'check',
        amount,
        checkNumber: metadata.checkNumber,
        bankName: metadata.bankName,
        checkDate: metadata.checkDate
      }
    };
  }

  /**
   * Process bank transfer payment
   */
  async processBankTransferPayment({ amount, metadata }) {
    return {
      transactionId: `BANK-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      status: 'pending',
      raw: {
        type: 'bank_transfer',
        amount,
        referenceNumber: metadata.referenceNumber,
        bankName: metadata.bankName,
        accountNumber: metadata.accountNumber?.slice(-4) // Store only last 4 digits
      }
    };
  }

  /**
   * Record payment in database
   */
  async recordPayment(paymentData) {
    const db = getDatabase();
    const {
      tenantId,
      customerId,
      invoiceId,
      amount,
      currency,
      provider,
      providerTransactionId,
      status,
      paymentMethod,
      metadata,
      providerResponse
    } = paymentData;

    const paymentId = this.generateId();
    const timestamp = new Date().toISOString();

    const query = `
      INSERT INTO payments (
        id, tenant_id, customer_id, invoice_id, amount, currency,
        payment_method, provider, provider_transaction_id, status,
        metadata, provider_response, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await db.run(query, [
      paymentId,
      tenantId,
      customerId,
      invoiceId,
      amount,
      currency,
      paymentMethod,
      provider,
      providerTransactionId,
      status,
      JSON.stringify(metadata || {}),
      JSON.stringify(providerResponse || {}),
      timestamp,
      timestamp
    ]);

    return {
      id: paymentId,
      tenantId,
      customerId,
      invoiceId,
      amount,
      currency,
      paymentMethod,
      provider,
      providerTransactionId,
      status,
      metadata,
      createdAt: timestamp,
      updatedAt: timestamp
    };
  }

  /**
   * Record failed payment attempt
   */
  async recordPaymentFailure(paymentData, error) {
    const db = getDatabase();
    const failureId = this.generateId();
    const timestamp = new Date().toISOString();

    const query = `
      INSERT INTO payment_failures (
        id, tenant_id, customer_id, invoice_id, amount, currency,
        provider, error_message, error_code, payment_data, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await db.run(query, [
      failureId,
      paymentData.tenantId,
      paymentData.customerId,
      paymentData.invoiceId,
      paymentData.amount,
      paymentData.currency,
      paymentData.provider,
      error.message,
      error.code || 'UNKNOWN',
      JSON.stringify(paymentData),
      timestamp
    ]);
  }

  /**
   * Update invoice status after payment
   */
  async updateInvoiceStatus(invoiceId, payment) {
    const db = getDatabase();

    // Get current invoice
    const invoice = await db.get(
      'SELECT * FROM invoices WHERE id = ?',
      [invoiceId]
    );

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    // Calculate new paid amount
    const paidAmount = parseFloat(invoice.paid_amount || 0) + parseFloat(payment.amount);
    const totalAmount = parseFloat(invoice.total_amount);
    const balance = totalAmount - paidAmount;

    // Determine new status
    let status = 'partial';
    if (balance <= 0) {
      status = 'paid';
    } else if (paidAmount === 0) {
      status = 'pending';
    }

    // Update invoice
    await db.run(
      `UPDATE invoices 
       SET paid_amount = ?, balance = ?, status = ?, updated_at = ?
       WHERE id = ?`,
      [paidAmount, balance, status, new Date().toISOString(), invoiceId]
    );

    logger.info('Invoice status updated', {
      invoiceId,
      status,
      paidAmount,
      balance
    });
  }

  /**
   * Create refund
   */
  async createRefund(refundData) {
    const {
      paymentId,
      amount,
      reason,
      tenantId
    } = refundData;

    try {
      const db = getDatabase();

      // Get original payment
      const payment = await db.get(
        'SELECT * FROM payments WHERE id = ? AND tenant_id = ?',
        [paymentId, tenantId]
      );

      if (!payment) {
        throw new Error('Payment not found');
      }

      if (payment.status !== 'completed') {
        throw new Error('Can only refund completed payments');
      }

      // Process refund with provider
      let refundResult;
      if (payment.provider === 'stripe') {
        const refund = await stripe.refunds.create({
          payment_intent: payment.provider_transaction_id,
          amount: Math.round(amount * 100) // Convert to cents
        });

        refundResult = {
          providerRefundId: refund.id,
          status: this.mapStripeStatus(refund.status)
        };
      } else {
        // For other providers, mark as pending manual refund
        refundResult = {
          providerRefundId: `REFUND-${Date.now()}`,
          status: 'pending'
        };
      }

      // Record refund
      const refundId = this.generateId();
      const timestamp = new Date().toISOString();

      await db.run(
        `INSERT INTO refunds (
          id, tenant_id, payment_id, invoice_id, amount, reason,
          provider_refund_id, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          refundId,
          tenantId,
          paymentId,
          payment.invoice_id,
          amount,
          reason,
          refundResult.providerRefundId,
          refundResult.status,
          timestamp,
          timestamp
        ]
      );

      // Update payment status
      await db.run(
        'UPDATE payments SET status = ?, updated_at = ? WHERE id = ?',
        ['refunded', timestamp, paymentId]
      );

      // Update invoice if applicable
      if (payment.invoice_id) {
        await this.updateInvoiceAfterRefund(payment.invoice_id, amount);
      }

      logger.info('Refund processed successfully', {
        refundId,
        paymentId,
        amount
      });

      return {
        success: true,
        refund: {
          id: refundId,
          paymentId,
          amount,
          status: refundResult.status,
          createdAt: timestamp
        }
      };

    } catch (error) {
      logger.error('Refund processing failed', {
        error: error.message,
        paymentId
      });
      throw error;
    }
  }

  /**
   * Update invoice after refund
   */
  async updateInvoiceAfterRefund(invoiceId, refundAmount) {
    const db = getDatabase();

    const invoice = await db.get(
      'SELECT * FROM invoices WHERE id = ?',
      [invoiceId]
    );

    if (!invoice) return;

    const paidAmount = parseFloat(invoice.paid_amount) - refundAmount;
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

  /**
   * Get payment history for customer
   */
  async getCustomerPayments(tenantId, customerId, options = {}) {
    const db = getDatabase();
    const { limit = 50, offset = 0, status } = options;

    let query = `
      SELECT p.*, i.invoice_number, c.name as customer_name
      FROM payments p
      LEFT JOIN invoices i ON p.invoice_id = i.id
      LEFT JOIN customers c ON p.customer_id = c.id
      WHERE p.tenant_id = ? AND p.customer_id = ?
    `;

    const params = [tenantId, customerId];

    if (status) {
      query += ' AND p.status = ?';
      params.push(status);
    }

    query += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const payments = await db.all(query, params);

    return payments.map(p => ({
      ...p,
      metadata: p.metadata ? JSON.parse(p.metadata) : {},
      providerResponse: p.provider_response ? JSON.parse(p.provider_response) : {}
    }));
  }

  /**
   * Validation helpers
   */
  validatePaymentData(data) {
    if (!data.amount || data.amount <= 0) {
      throw new Error('Invalid payment amount');
    }

    if (!data.customerId) {
      throw new Error('Customer ID is required');
    }

    if (!data.tenantId) {
      throw new Error('Tenant ID is required');
    }

    if (!data.currency) {
      throw new Error('Currency is required');
    }
  }

  mapStripeStatus(stripeStatus) {
    const statusMap = {
      'succeeded': 'completed',
      'pending': 'pending',
      'requires_payment_method': 'failed',
      'requires_confirmation': 'pending',
      'requires_action': 'pending',
      'processing': 'processing',
      'requires_capture': 'pending',
      'canceled': 'failed'
    };

    return statusMap[stripeStatus] || 'pending';
  }

  generateId() {
    return `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = new PaymentService();
