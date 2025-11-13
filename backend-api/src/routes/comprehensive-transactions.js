const express = require('express');
const router = express.Router();
const { authTenantMiddleware } = require('../middleware/authTenantMiddleware');

// Apply authentication middleware
router.use(authTenantMiddleware);

/**
 * @swagger
 * components:
 *   schemas:
 *     Transaction:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         transaction_number:
 *           type: string
 *         transaction_type:
 *           type: string
 *           enum: [sale, return, refund, exchange, payment, credit, debit, adjustment]
 *         customer_id:
 *           type: string
 *         agent_id:
 *           type: string
 *         total_amount:
 *           type: number
 *         currency_id:
 *           type: string
 *         payment_method:
 *           type: string
 *           enum: [cash, card, mobile_money, bank_transfer, credit, voucher]
 *         payment_status:
 *           type: string
 *           enum: [pending, completed, failed, cancelled, refunded, partially_refunded]
 *         transaction_date:
 *           type: string
 *           format: date-time
 *         status:
 *           type: string
 *           enum: [draft, pending, completed, cancelled, reversed]
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/TransactionItem'
 *         payments:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Payment'
 *     TransactionItem:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         product_id:
 *           type: string
 *         quantity:
 *           type: number
 *         unit_price:
 *           type: number
 *         discount_amount:
 *           type: number
 *         tax_amount:
 *           type: number
 *         line_total:
 *           type: number
 *     Payment:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         payment_method:
 *           type: string
 *         amount:
 *           type: number
 *         currency_id:
 *           type: string
 *         reference_number:
 *           type: string
 *         payment_date:
 *           type: string
 *           format: date-time
 *         status:
 *           type: string
 *           enum: [pending, completed, failed, cancelled]
 */

// TRANSACTION MANAGEMENT ENDPOINTS

/**
 * @swagger
 * /api/comprehensive-transactions/transactions:
 *   get:
 *     summary: Get all transactions with advanced filtering
 *     tags: [Comprehensive Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: transaction_type
 *         schema:
 *           type: string
 *         description: Filter by transaction type
 *       - in: query
 *         name: customer_id
 *         schema:
 *           type: string
 *         description: Filter by customer
 *       - in: query
 *         name: agent_id
 *         schema:
 *           type: string
 *         description: Filter by agent
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by transaction status
 *       - in: query
 *         name: payment_status
 *         schema:
 *           type: string
 *         description: Filter by payment status
 *       - in: query
 *         name: payment_method
 *         schema:
 *           type: string
 *         description: Filter by payment method
 *       - in: query
 *         name: date_from
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter from date
 *       - in: query
 *         name: date_to
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter to date
 *       - in: query
 *         name: amount_min
 *         schema:
 *           type: number
 *         description: Minimum transaction amount
 *       - in: query
 *         name: amount_max
 *         schema:
 *           type: number
 *         description: Maximum transaction amount
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of transactions to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of transactions to skip
 *     responses:
 *       200:
 *         description: List of transactions
 */
router.get('/transactions', async (req, res) => {
  try {
    const { getQuery, getOneQuery } = await import('../utils/database.js');
    const { 
      transaction_type, 
      customer_id, 
      agent_id, 
      status, 
      payment_status, 
      payment_method,
      date_from, 
      date_to, 
      amount_min, 
      amount_max,
      limit = 50, 
      offset = 0 
    } = req.query;
    
    let query = `
      SELECT t.*, 
             c.name as customer_name,
             u.first_name || ' ' || u.last_name as agent_name,
             curr.code as currency_code,
             curr.symbol as currency_symbol,
             COUNT(ti.id) as item_count,
             0 as payment_count,
             0 as total_paid
      FROM transactions t
      LEFT JOIN customers c ON t.customer_id = c.id
      LEFT JOIN users a ON t.agent_id = a.id
      LEFT JOIN users u ON a.user_id = u.id
      LEFT JOIN currencies curr ON t.currency_id = curr.id
      LEFT JOIN transaction_items ti ON t.id = ti.transaction_id
      WHERE t.tenant_id = ?
    `;
    
    const params = [req.user.tenantId];
    
    if (transaction_type) {
      query += ' AND t.transaction_type = ?';
      params.push(transaction_type);
    }
    
    if (customer_id) {
      query += ' AND t.customer_id = ?';
      params.push(customer_id);
    }
    
    if (agent_id) {
      query += ' AND t.agent_id = ?';
      params.push(agent_id);
    }
    
    if (status) {
      query += ' AND t.status = ?';
      params.push(status);
    }
    
    if (payment_status) {
      query += ' AND t.payment_status = ?';
      params.push(payment_status);
    }
    
    if (payment_method) {
      query += ' AND t.payment_method = ?';
      params.push(payment_method);
    }
    
    if (date_from) {
      query += ' AND t.transaction_date::date >= ?';
      params.push(date_from);
    }
    
    if (date_to) {
      query += ' AND t.transaction_date::date <= ?';
      params.push(date_to);
    }
    
    if (amount_min) {
      query += ' AND t.total_amount >= ?';
      params.push(amount_min);
    }
    
    if (amount_max) {
      query += ' AND t.total_amount <= ?';
      params.push(amount_max);
    }
    
    query += ' GROUP BY t.id ORDER BY t.transaction_date DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const transactions = await getQuery(query, params);
    
    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(DISTINCT t.id) as total
      FROM transactions t
      WHERE t.tenant_id = ?
    `;
    
    const countParams = [req.user.tenantId];
    let paramIndex = 1;
    
    if (transaction_type) {
      countQuery += ' AND t.transaction_type = ?';
      countParams.push(transaction_type);
    }
    if (customer_id) {
      countQuery += ' AND t.customer_id = ?';
      countParams.push(customer_id);
    }
    if (agent_id) {
      countQuery += ' AND t.agent_id = ?';
      countParams.push(agent_id);
    }
    if (status) {
      countQuery += ' AND t.status = ?';
      countParams.push(status);
    }
    if (payment_status) {
      countQuery += ' AND t.payment_status = ?';
      countParams.push(payment_status);
    }
    if (payment_method) {
      countQuery += ' AND t.payment_method = ?';
      countParams.push(payment_method);
    }
    if (date_from) {
      countQuery += ' AND t.transaction_date::date >= ?';
      countParams.push(date_from);
    }
    if (date_to) {
      countQuery += ' AND t.transaction_date::date <= ?';
      countParams.push(date_to);
    }
    if (amount_min) {
      countQuery += ' AND t.total_amount >= ?';
      countParams.push(amount_min);
    }
    if (amount_max) {
      countQuery += ' AND t.total_amount <= ?';
      countParams.push(amount_max);
    }
    
    const totalCount = await getOneQuery(countQuery, countParams);
    
    res.json({
      success: true,
      data: { 
        transactions,
        pagination: {
          total: totalCount.total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          has_more: (parseInt(offset) + parseInt(limit)) < totalCount.total
        }
      }
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch transactions', code: 'FETCH_ERROR' }
    });
  }
});

/**
 * @swagger
 * /api/comprehensive-transactions/transactions:
 *   post:
 *     summary: Create a new transaction
 *     tags: [Comprehensive Transactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - transaction_type
 *               - customer_id
 *               - agent_id
 *               - currency_id
 *               - items
 *             properties:
 *               transaction_type:
 *                 type: string
 *               customer_id:
 *                 type: string
 *               agent_id:
 *                 type: string
 *               currency_id:
 *                 type: string
 *               payment_method:
 *                 type: string
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     product_id:
 *                       type: string
 *                     quantity:
 *                       type: number
 *                     unit_price:
 *                       type: number
 *                     discount_amount:
 *                       type: number
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Transaction created successfully
 */
router.post('/transactions', async (req, res) => {
  try {
    const { runQuery, getOneQuery } = await import('../utils/database.js');
    const { 
      transaction_type, 
      customer_id, 
      agent_id, 
      currency_id, 
      payment_method, 
      items, 
      notes 
    } = req.body;
    
    if (!transaction_type || !customer_id || !agent_id || !currency_id || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'Missing required fields', code: 'VALIDATION_ERROR' }
      });
    }
    
    // Generate transaction number
    const transactionNumber = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    // Calculate totals
    let subtotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;
    
    for (const item of items) {
      const lineTotal = (item.quantity * item.unit_price) - (item.discount_amount || 0);
      subtotal += lineTotal;
      totalDiscount += item.discount_amount || 0;
      totalTax += item.tax_amount || 0;
    }
    
    const totalAmount = subtotal + totalTax;
    
    // Create transaction
    const transactionResult = await runQuery(`
      INSERT INTO transactions (
        tenant_id, transaction_number, transaction_type, customer_id, 
        agent_id, total_amount, currency_id, payment_method, 
        payment_status, transaction_date, status, notes,
        subtotal, discount_amount, tax_amount
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', CURRENT_TIMESTAMP, 'draft', ?, ?, ?, ?)
    `, [
      req.user.tenantId, 
      transactionNumber, 
      transaction_type, 
      customer_id, 
      agent_id, 
      totalAmount, 
      currency_id, 
      payment_method || 'cash', 
      notes,
      subtotal,
      totalDiscount,
      totalTax
    ]);
    
    const transactionId = transactionResult.lastID;
    
    // Create transaction items
    for (const item of items) {
      const lineTotal = (item.quantity * item.unit_price) - (item.discount_amount || 0) + (item.tax_amount || 0);
      
      await runQuery(`
        INSERT INTO transaction_items (
          transaction_id, product_id, quantity, unit_price, 
          discount_amount, tax_amount, line_total
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        transactionId, 
        item.product_id, 
        item.quantity, 
        item.unit_price, 
        item.discount_amount || 0, 
        item.tax_amount || 0, 
        lineTotal
      ]);
    }
    
    res.status(201).json({
      success: true,
      data: { 
        id: transactionId,
        transaction_number: transactionNumber,
        total_amount: totalAmount,
        message: 'Transaction created successfully'
      }
    });
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to create transaction', code: 'CREATE_ERROR' }
    });
  }
});

/**
 * @swagger
 * /api/comprehensive-transactions/transactions/{id}:
 *   get:
 *     summary: Get transaction details
 *     tags: [Comprehensive Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Transaction ID
 *     responses:
 *       200:
 *         description: Transaction details
 */
router.get('/transactions/:id', async (req, res) => {
  try {
    const { getQuery, getOneQuery } = await import('../utils/database.js');
    const { id } = req.params;
    
    // Get transaction details
    const transaction = await getOneQuery(`
      SELECT t.*, 
             c.business_name as customer_name,
             c.address as customer_address,
             c.phone as customer_phone,
             u.first_name || ' ' || u.last_name as agent_name,
             curr.code as currency_code,
             curr.symbol as currency_symbol,
             curr.decimal_places
      FROM transactions t
      LEFT JOIN customers c ON t.customer_id = c.id
      LEFT JOIN users a ON t.agent_id = a.id
      LEFT JOIN users u ON a.user_id = u.id
      LEFT JOIN currencies curr ON t.currency_id = curr.id
      WHERE t.id = ? AND t.tenant_id = ?
    `, [id, req.user.tenantId]);
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: { message: 'Transaction not found', code: 'NOT_FOUND' }
      });
    }
    
    // Get transaction items
    const items = await getQuery(`
      SELECT ti.*, p.name as product_name, p.sku as product_sku
      FROM transaction_items ti
      LEFT JOIN products p ON ti.product_id = p.id
      WHERE ti.transaction_id = ?
      ORDER BY ti.id
    `, [id]);
    
    // Get payments
    const payments = await getQuery(`
      SELECT p.*, curr.code as currency_code, curr.symbol as currency_symbol
      FROM payments p
      LEFT JOIN currencies curr ON p.currency_id = curr.id
      WHERE p.transaction_id = ?
      ORDER BY p.payment_date DESC
    `, [id]);
    
    // Get transaction history/audit trail
    const history = await getQuery(`
      SELECT th.*, u.first_name || ' ' || u.last_name as user_name
      FROM transaction_history th
      LEFT JOIN users u ON th.user_id = u.id
      WHERE th.transaction_id = ?
      ORDER BY th.created_at DESC
    `, [id]);
    
    transaction.items = items;
    transaction.payments = payments;
    transaction.history = history;
    
    res.json({
      success: true,
      data: { transaction }
    });
  } catch (error) {
    console.error('Error fetching transaction details:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch transaction details', code: 'FETCH_ERROR' }
    });
  }
});

/**
 * @swagger
 * /api/comprehensive-transactions/transactions/{id}/complete:
 *   put:
 *     summary: Complete a transaction
 *     tags: [Comprehensive Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Transaction ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               payment_details:
 *                 type: object
 *                 properties:
 *                   amount:
 *                     type: number
 *                   payment_method:
 *                     type: string
 *                   reference_number:
 *                     type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Transaction completed successfully
 */
router.put('/transactions/:id/complete', async (req, res) => {
  try {
    const { runQuery, getOneQuery } = await import('../utils/database.js');
    const { id } = req.params;
    const { payment_details, notes } = req.body;
    
    // Verify transaction exists and is in valid state
    const transaction = await getOneQuery(
      'SELECT * FROM transactions WHERE id = ? AND tenant_id = ?',
      [id, req.user.tenantId]
    );
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: { message: 'Transaction not found', code: 'NOT_FOUND' }
      });
    }
    
    if (transaction.status === 'completed') {
      return res.status(400).json({
        success: false,
        error: { message: 'Transaction is already completed', code: 'ALREADY_COMPLETED' }
      });
    }
    
    if (transaction.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        error: { message: 'Cannot complete cancelled transaction', code: 'INVALID_STATUS' }
      });
    }
    
    // Create payment record if payment details provided
    if (payment_details && payment_details.amount) {
      await runQuery(`
        INSERT INTO payments (
          transaction_id, payment_method, amount, currency_id,
          reference_number, payment_date, status
        )
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, 'completed')
      `, [
        id,
        payment_details.payment_method || transaction.payment_method,
        payment_details.amount,
        transaction.currency_id,
        payment_details.reference_number
      ]);
    }
    
    // Update transaction status
    await runQuery(`
      UPDATE transactions 
      SET status = 'completed', 
          payment_status = 'completed',
          completed_at = CURRENT_TIMESTAMP,
          completion_notes = ?
      WHERE id = ? AND tenant_id = ?
    `, [notes, id, req.user.tenantId]);
    
    // Log transaction history
    await runQuery(`
      INSERT INTO transaction_history (
        transaction_id, action, old_status, new_status, 
        user_id, notes, created_at
      )
      VALUES (?, 'complete', ?, 'completed', ?, ?, CURRENT_TIMESTAMP)
    `, [id, transaction.status, req.user.userId, notes]);
    
    res.json({
      success: true,
      data: { message: 'Transaction completed successfully' }
    });
  } catch (error) {
    console.error('Error completing transaction:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to complete transaction', code: 'COMPLETE_ERROR' }
    });
  }
});

/**
 * @swagger
 * /api/comprehensive-transactions/transactions/{id}/refund:
 *   post:
 *     summary: Process a refund for a transaction
 *     tags: [Comprehensive Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Transaction ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refund_amount
 *               - reason
 *             properties:
 *               refund_amount:
 *                 type: number
 *               reason:
 *                 type: string
 *               refund_method:
 *                 type: string
 *               items_to_refund:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     item_id:
 *                       type: string
 *                     quantity:
 *                       type: number
 *     responses:
 *       200:
 *         description: Refund processed successfully
 */
router.post('/transactions/:id/refund', async (req, res) => {
  try {
    const { runQuery, getOneQuery } = await import('../utils/database.js');
    const { id } = req.params;
    const { refund_amount, reason, refund_method, items_to_refund } = req.body;
    
    if (!refund_amount || !reason) {
      return res.status(400).json({
        success: false,
        error: { message: 'Refund amount and reason are required', code: 'VALIDATION_ERROR' }
      });
    }
    
    // Verify original transaction
    const originalTransaction = await getOneQuery(
      'SELECT * FROM transactions WHERE id = ? AND tenant_id = ?',
      [id, req.user.tenantId]
    );
    
    if (!originalTransaction) {
      return res.status(404).json({
        success: false,
        error: { message: 'Original transaction not found', code: 'NOT_FOUND' }
      });
    }
    
    if (originalTransaction.status !== 'completed') {
      return res.status(400).json({
        success: false,
        error: { message: 'Can only refund completed transactions', code: 'INVALID_STATUS' }
      });
    }
    
    // Check if refund amount is valid
    const totalPaid = await getOneQuery(
      'SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE transaction_id = ? AND status = "completed"',
      [id]
    );
    
    const totalRefunded = await getOneQuery(
      'SELECT COALESCE(SUM(total_amount), 0) as total FROM transactions WHERE original_transaction_id = ? AND transaction_type = "refund"',
      [id]
    );
    
    const availableForRefund = totalPaid.total - totalRefunded.total;
    
    if (refund_amount > availableForRefund) {
      return res.status(400).json({
        success: false,
        error: { message: 'Refund amount exceeds available amount', code: 'INVALID_AMOUNT' }
      });
    }
    
    // Generate refund transaction number
    const refundNumber = `REF-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    // Create refund transaction
    const refundResult = await runQuery(`
      INSERT INTO transactions (
        tenant_id, transaction_number, transaction_type, customer_id, 
        agent_id, total_amount, currency_id, payment_method, 
        payment_status, transaction_date, status, notes,
        original_transaction_id
      )
      VALUES (?, ?, 'refund', ?, ?, ?, ?, ?, 'completed', CURRENT_TIMESTAMP, 'completed', ?, ?)
    `, [
      req.user.tenantId,
      refundNumber,
      originalTransaction.customer_id,
      originalTransaction.agent_id,
      refund_amount,
      originalTransaction.currency_id,
      refund_method || originalTransaction.payment_method,
      reason,
      id
    ]);
    
    const refundTransactionId = refundResult.lastID;
    
    // Create refund items if specified
    if (items_to_refund && items_to_refund.length > 0) {
      for (const refundItem of items_to_refund) {
        // Get original item details
        const originalItem = await getOneQuery(
          'SELECT * FROM transaction_items WHERE id = ? AND transaction_id = ?',
          [refundItem.item_id, id]
        );
        
        if (originalItem) {
          const refundLineTotal = (refundItem.quantity / originalItem.quantity) * originalItem.line_total;
          
          await runQuery(`
            INSERT INTO transaction_items (
              transaction_id, product_id, quantity, unit_price, 
              discount_amount, tax_amount, line_total, original_item_id
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            refundTransactionId,
            originalItem.product_id,
            -refundItem.quantity, // Negative quantity for refund
            originalItem.unit_price,
            (refundItem.quantity / originalItem.quantity) * originalItem.discount_amount,
            (refundItem.quantity / originalItem.quantity) * originalItem.tax_amount,
            -refundLineTotal, // Negative amount for refund
            originalItem.id
          ]);
        }
      }
    }
    
    // Create refund payment record
    await runQuery(`
      INSERT INTO payments (
        transaction_id, payment_method, amount, currency_id,
        reference_number, payment_date, status, payment_type
      )
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, 'completed', 'refund')
    `, [
      refundTransactionId,
      refund_method || originalTransaction.payment_method,
      refund_amount,
      originalTransaction.currency_id,
      refundNumber
    ]);
    
    // Update original transaction payment status
    const isFullRefund = refund_amount >= availableForRefund;
    const newPaymentStatus = isFullRefund ? 'refunded' : 'partially_refunded';
    
    await runQuery(
      'UPDATE transactions SET payment_status = ? WHERE id = ?',
      [newPaymentStatus, id]
    );
    
    // Log transaction history
    await runQuery(`
      INSERT INTO transaction_history (
        transaction_id, action, old_status, new_status, 
        user_id, notes, created_at, amount
      )
      VALUES (?, 'refund', ?, ?, ?, ?, CURRENT_TIMESTAMP, ?)
    `, [id, originalTransaction.payment_status, newPaymentStatus, req.user.userId, reason, refund_amount]);
    
    res.json({
      success: true,
      data: { 
        refund_transaction_id: refundTransactionId,
        refund_number: refundNumber,
        refund_amount: refund_amount,
        message: 'Refund processed successfully'
      }
    });
  } catch (error) {
    console.error('Error processing refund:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to process refund', code: 'REFUND_ERROR' }
    });
  }
});

/**
 * @swagger
 * /api/comprehensive-transactions/transactions/{id}/reverse:
 *   put:
 *     summary: Reverse a transaction
 *     tags: [Comprehensive Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Transaction ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Transaction reversed successfully
 */
router.put('/transactions/:id/reverse', async (req, res) => {
  try {
    const { runQuery, getOneQuery } = await import('../utils/database.js');
    const { id } = req.params;
    const { reason } = req.body;
    
    if (!reason) {
      return res.status(400).json({
        success: false,
        error: { message: 'Reason for reversal is required', code: 'VALIDATION_ERROR' }
      });
    }
    
    // Verify transaction exists and can be reversed
    const transaction = await getOneQuery(
      'SELECT * FROM transactions WHERE id = ? AND tenant_id = ?',
      [id, req.user.tenantId]
    );
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: { message: 'Transaction not found', code: 'NOT_FOUND' }
      });
    }
    
    if (transaction.status === 'reversed') {
      return res.status(400).json({
        success: false,
        error: { message: 'Transaction is already reversed', code: 'ALREADY_REVERSED' }
      });
    }
    
    if (transaction.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        error: { message: 'Cannot reverse cancelled transaction', code: 'INVALID_STATUS' }
      });
    }
    
    // Update transaction status
    await runQuery(`
      UPDATE transactions 
      SET status = 'reversed', 
          payment_status = 'cancelled',
          reversed_at = CURRENT_TIMESTAMP,
          reversal_reason = ?
      WHERE id = ? AND tenant_id = ?
    `, [reason, id, req.user.tenantId]);
    
    // Cancel all pending payments
    await runQuery(
      'UPDATE payments SET status = "cancelled" WHERE transaction_id = ? AND status = "pending"',
      [id]
    );
    
    // Log transaction history
    await runQuery(`
      INSERT INTO transaction_history (
        transaction_id, action, old_status, new_status, 
        user_id, notes, created_at
      )
      VALUES (?, 'reverse', ?, 'reversed', ?, ?, CURRENT_TIMESTAMP)
    `, [id, transaction.status, req.user.userId, reason]);
    
    res.json({
      success: true,
      data: { message: 'Transaction reversed successfully' }
    });
  } catch (error) {
    console.error('Error reversing transaction:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to reverse transaction', code: 'REVERSE_ERROR' }
    });
  }
});

/**
 * @swagger
 * /api/comprehensive-transactions/dashboard:
 *   get:
 *     summary: Get comprehensive transactions dashboard data
 *     tags: [Comprehensive Transactions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data
 */
router.get('/dashboard', async (req, res) => {
  try {
    const { getQuery, getOneQuery } = await import('../utils/database.js');
    
    // Get transaction statistics
    const transactionStats = await getOneQuery(`
      SELECT 
        COUNT(*) as total_transactions,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_transactions,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_transactions,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_transactions,
        COUNT(CASE WHEN status = 'reversed' THEN 1 END) as reversed_transactions,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN total_amount END), 0) as total_revenue,
        COALESCE(AVG(CASE WHEN status = 'completed' THEN total_amount END), 0) as avg_transaction_value
      FROM transactions
      WHERE tenant_id = ?
    `, [req.user.tenantId]);
    
    // Get payment statistics
    const paymentStats = await getOneQuery(`
      SELECT 
        COUNT(*) as total_payments,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful_payments,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_payments,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN amount END), 0) as total_payments_amount
      FROM payments p
      JOIN transactions t ON p.transaction_id = t.id
      WHERE t.tenant_id = ?
    `, [req.user.tenantId]);
    
    // Get transactions by type
    const transactionsByType = await getQuery(`
      SELECT transaction_type, 
             COUNT(*) as count,
             COALESCE(SUM(total_amount), 0) as total_amount
      FROM transactions
      WHERE tenant_id = ?
      GROUP BY transaction_type
      ORDER BY count DESC
    `, [req.user.tenantId]);
    
    // Get payment methods breakdown
    const paymentMethods = await getQuery(`
      SELECT payment_method, 
             COUNT(*) as count,
             COALESCE(SUM(amount), 0) as total_amount
      FROM payments p
      JOIN transactions t ON p.transaction_id = t.id
      WHERE t.tenant_id = ? AND p.status = 'completed'
      GROUP BY payment_method
      ORDER BY count DESC
    `, [req.user.tenantId]);
    
    // Get recent transactions
    const recentTransactions = await getQuery(`
      SELECT t.id, t.transaction_number, t.transaction_type, t.total_amount, 
             t.status, t.payment_status, t.transaction_date,
             c.business_name as customer_name,
             curr.symbol as currency_symbol
      FROM transactions t
      LEFT JOIN customers c ON t.customer_id = c.id
      LEFT JOIN currencies curr ON t.currency_id = curr.id
      WHERE t.tenant_id = ?
      ORDER BY t.transaction_date DESC
      LIMIT 10
    `, [req.user.tenantId]);
    
    // Get daily transaction trends (last 30 days)
    const dailyTrends = await getQuery(`
      SELECT transaction_date::date as date,
             COUNT(*) as transaction_count,
             COALESCE(SUM(total_amount), 0) as daily_revenue
      FROM transactions
      WHERE tenant_id = ? 
        AND transaction_date >= CURRENT_DATE - INTERVAL '30 days'
        AND status = 'completed'
      GROUP BY transaction_date::date
      ORDER BY date DESC
    `, [req.user.tenantId]);
    
    res.json({
      success: true,
      data: {
        transactionStats,
        paymentStats,
        transactionsByType,
        paymentMethods,
        recentTransactions,
        dailyTrends
      }
    });
  } catch (error) {
    console.error('Error fetching comprehensive transactions dashboard:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch dashboard data', code: 'FETCH_ERROR' }
    });
  }
});

module.exports = router;