/**
 * Enhanced Orders API with Inventory Integration
 * Adds transactional capabilities to order management
 * Includes Returns, Refunds, and Credit Notes management
 */

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getQuery, getOneQuery, runQuery } = require('../utils/database');
let orderService;
try {
  orderService = require('../services/order.service');
} catch (e) {
  orderService = null;
}

/**
 * Update order status (with inventory handling)
 * POST /api/orders/:id/status
 */
router.post('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const tenantId = req.user.tenantId;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const validStatuses = ['pending', 'confirmed', 'processing', 'packed', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const result = orderService.updateOrderStatus(id, status, tenantId);

    if (result.success) {
      const order = orderService.getOrderWithDetails(id, tenantId);
      res.json({
        success: true,
        data: { order },
        message: `Order status updated to ${status}`
      });
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
});

/**
 * Get order stock availability
 * GET /api/orders/:id/stock-check
 */
router.get('/:id/stock-check', async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;

    const order = orderService.getOrderWithDetails(id, tenantId);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check current stock for each item
    const Database = require('better-sqlite3');
    const path = require('path');
    const db = new Database(path.join(__dirname, '../../database/salessync.db'));

    const stockStatus = [];

    for (const item of order.items) {
      const stock = db.prepare(`
        SELECT 
          COALESCE(SUM(quantity_on_hand), 0) as total_stock,
          COALESCE(SUM(quantity_reserved), 0) as reserved_stock,
          COALESCE(SUM(quantity_on_hand - quantity_reserved), 0) as available_stock
        FROM inventory_stock
        WHERE product_id = ? AND tenant_id = ?
      `).get(item.product_id, tenantId);

      stockStatus.push({
        product_id: item.product_id,
        product_name: item.product_name,
        ordered_quantity: item.quantity,
        total_stock: stock.total_stock,
        reserved_stock: stock.reserved_stock,
        available_stock: stock.available_stock,
        can_fulfill: stock.available_stock >= item.quantity
      });
    }

    db.close();

    res.json({
      success: true,
      data: { stockStatus }
    });
  } catch (error) {
    console.error('Error checking stock:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// ==================== RETURNS MANAGEMENT ====================

/**
 * GET /api/orders-enhanced/returns
 * List all returns with filtering
 */
router.get('/returns', async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const { status, order_id, customer_id, date_from, date_to, limit = 50, offset = 0 } = req.query;

    let whereClause = 'WHERE r.tenant_id = ?';
    let params = [tenantId];

    if (status) {
      whereClause += ' AND r.status = ?';
      params.push(status);
    }
    if (order_id) {
      whereClause += ' AND r.order_id = ?';
      params.push(order_id);
    }
    if (customer_id) {
      whereClause += ' AND o.customer_id = ?';
      params.push(customer_id);
    }
    if (date_from) {
      whereClause += ' AND r.return_date >= ?';
      params.push(date_from);
    }
    if (date_to) {
      whereClause += ' AND r.return_date <= ?';
      params.push(date_to);
    }

    const returns = await getQuery(`
      SELECT r.*, 
             o.order_number,
             c.name as customer_name,
             c.email as customer_email
      FROM returns r
      LEFT JOIN orders o ON r.order_id = o.id
      LEFT JOIN customers c ON o.customer_id = c.id
      ${whereClause}
      ORDER BY r.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), parseInt(offset)]);

    const countResult = await getOneQuery(`
      SELECT COUNT(*) as total FROM returns r
      LEFT JOIN orders o ON r.order_id = o.id
      ${whereClause}
    `, params);

    res.json({
      success: true,
      data: { returns },
      pagination: { total: countResult?.total || 0, limit: parseInt(limit), offset: parseInt(offset) }
    });
  } catch (error) {
    console.error('Error fetching returns:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch returns' });
  }
});

/**
 * GET /api/orders-enhanced/returns/:id
 * Get return by ID with items
 */
router.get('/returns/:id', async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const { id } = req.params;

    const returnRecord = await getOneQuery(`
      SELECT r.*, 
             o.order_number, o.total_amount as order_total,
             c.name as customer_name, c.email as customer_email
      FROM returns r
      LEFT JOIN orders o ON r.order_id = o.id
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE r.id = ? AND r.tenant_id = ?
    `, [id, tenantId]);

    if (!returnRecord) {
      return res.status(404).json({ success: false, message: 'Return not found' });
    }

    const items = await getQuery(`
      SELECT ri.*, p.name as product_name, p.sku
      FROM return_items ri
      LEFT JOIN products p ON ri.product_id = p.id
      WHERE ri.return_id = ?
    `, [id]);

    res.json({
      success: true,
      data: { return: { ...returnRecord, items } }
    });
  } catch (error) {
    console.error('Error fetching return:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch return' });
  }
});

/**
 * POST /api/orders-enhanced/returns
 * Create a new return request
 */
router.post('/returns', async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const userId = req.user?.userId;
    const { order_id, reason, items, notes } = req.body;

    if (!order_id || !items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Order ID and items are required' });
    }

    const order = await getOneQuery('SELECT * FROM orders WHERE id = ? AND tenant_id = ?', [order_id, tenantId]);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const returnId = uuidv4();
    const returnNumber = `RET-${Date.now().toString(36).toUpperCase()}`;
    let totalAmount = 0;

    for (const item of items) {
      const orderItem = await getOneQuery(
        'SELECT * FROM order_items WHERE order_id = ? AND product_id = ?',
        [order_id, item.product_id]
      );
      if (orderItem) {
        totalAmount += (parseFloat(orderItem.unit_price) || 0) * (parseInt(item.quantity) || 1);
      }
    }

    await runQuery(`
      INSERT INTO returns (id, tenant_id, order_id, return_number, return_date, reason, status, total_amount, notes, created_by, created_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, ?, 'pending', ?, ?, ?, CURRENT_TIMESTAMP)
    `, [returnId, tenantId, order_id, returnNumber, reason || '', totalAmount, notes || '', userId]);

    for (const item of items) {
      const itemId = uuidv4();
      const orderItem = await getOneQuery(
        'SELECT * FROM order_items WHERE order_id = ? AND product_id = ?',
        [order_id, item.product_id]
      );
      const unitPrice = orderItem ? parseFloat(orderItem.unit_price) : 0;

      await runQuery(`
        INSERT INTO return_items (id, return_id, product_id, quantity, unit_price, reason, condition, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `, [itemId, returnId, item.product_id, item.quantity, unitPrice, item.reason || '', item.condition || 'good']);
    }

    const newReturn = await getOneQuery('SELECT * FROM returns WHERE id = ?', [returnId]);

    res.status(201).json({
      success: true,
      data: { return: newReturn },
      message: 'Return request created successfully'
    });
  } catch (error) {
    console.error('Error creating return:', error);
    res.status(500).json({ success: false, message: 'Failed to create return' });
  }
});

/**
 * POST /api/orders-enhanced/returns/:id/approve
 * Approve a return, restock inventory, and reverse commissions
 */
router.post('/returns/:id/approve', async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const userId = req.user?.userId;
    const { id } = req.params;

    const returnRecord = await getOneQuery('SELECT * FROM returns WHERE id = ? AND tenant_id = ?', [id, tenantId]);
    if (!returnRecord) {
      return res.status(404).json({ success: false, message: 'Return not found' });
    }

    if (returnRecord.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Return is not in pending status' });
    }

    await runQuery(`
      UPDATE returns SET status = 'approved', approved_by = ?, approved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [userId, id]);

    const items = await getQuery('SELECT * FROM return_items WHERE return_id = ?', [id]);

    for (const item of items) {
      if (item.condition === 'good' || item.condition === 'resellable') {
        await runQuery(`
          UPDATE inventory_stock 
          SET quantity_on_hand = quantity_on_hand + ?, updated_at = CURRENT_TIMESTAMP
          WHERE product_id = ? AND tenant_id = ?
        `, [item.quantity, item.product_id, tenantId]);

        await runQuery(`
          INSERT INTO stock_movements (id, tenant_id, product_id, movement_type, quantity, reference_type, reference_id, notes, created_by, created_at)
          VALUES (?, ?, ?, 'return_in', ?, 'return', ?, 'Return approved - stock restored', ?, CURRENT_TIMESTAMP)
        `, [uuidv4(), tenantId, item.product_id, item.quantity, id, userId]);
      }
    }

    // Reverse commissions for the returned items
    const orderId = returnRecord.order_id;
    if (orderId) {
      // Find commissions associated with this order
      const commissions = await getQuery(`
        SELECT c.* FROM commissions c
        WHERE c.order_id = ? AND c.tenant_id = ? AND c.status IN ('pending', 'approved', 'paid')
      `, [orderId, tenantId]);

      for (const commission of commissions) {
        // Calculate reversal amount proportional to return value vs order total
        const order = await getOneQuery('SELECT total_amount FROM orders WHERE id = ?', [orderId]);
        const orderTotal = parseFloat(order?.total_amount) || 1;
        const returnTotal = parseFloat(returnRecord.total_amount) || 0;
        const reversalRatio = Math.min(returnTotal / orderTotal, 1);
        const reversalAmount = parseFloat(commission.amount) * reversalRatio;

        if (reversalAmount > 0) {
          // Create commission reversal record
          const reversalId = uuidv4();
          await runQuery(`
            INSERT INTO commission_reversals (id, tenant_id, commission_id, return_id, original_amount, reversal_amount, reason, created_by, created_at)
            VALUES (?, ?, ?, ?, ?, ?, 'Return approved - commission reversed', ?, CURRENT_TIMESTAMP)
          `, [reversalId, tenantId, commission.id, id, commission.amount, reversalAmount, userId]);

          // Update commission amount (reduce by reversal amount)
          const newAmount = Math.max(0, parseFloat(commission.amount) - reversalAmount);
          await runQuery(`
            UPDATE commissions SET amount = ?, notes = COALESCE(notes, '') || ' [Partial reversal due to return]', updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `, [newAmount, commission.id]);

          // If commission was already paid, create a deduction record for next payout
          if (commission.status === 'paid') {
            await runQuery(`
              INSERT INTO commission_deductions (id, tenant_id, agent_id, amount, reason, reference_type, reference_id, created_at)
              VALUES (?, ?, ?, ?, 'Return reversal - deducted from future payout', 'commission_reversal', ?, CURRENT_TIMESTAMP)
            `, [uuidv4(), tenantId, commission.agent_id, reversalAmount, reversalId]);
          }
        }
      }
    }

    res.json({
      success: true,
      message: 'Return approved, inventory restocked, and commissions reversed'
    });
  } catch (error) {
    console.error('Error approving return:', error);
    res.status(500).json({ success: false, message: 'Failed to approve return' });
  }
});

/**
 * POST /api/orders-enhanced/returns/:id/reject
 * Reject a return request
 */
router.post('/returns/:id/reject', async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const userId = req.user?.userId;
    const { id } = req.params;
    const { reason } = req.body;

    const returnRecord = await getOneQuery('SELECT * FROM returns WHERE id = ? AND tenant_id = ?', [id, tenantId]);
    if (!returnRecord) {
      return res.status(404).json({ success: false, message: 'Return not found' });
    }

    await runQuery(`
      UPDATE returns SET status = 'rejected', rejection_reason = ?, rejected_by = ?, rejected_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [reason || '', userId, id]);

    res.json({
      success: true,
      message: 'Return rejected'
    });
  } catch (error) {
    console.error('Error rejecting return:', error);
    res.status(500).json({ success: false, message: 'Failed to reject return' });
  }
});

/**
 * POST /api/orders-enhanced/returns/:id/credit-note
 * Generate credit note from approved return
 */
router.post('/returns/:id/credit-note', async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const userId = req.user?.userId;
    const { id } = req.params;

    const returnRecord = await getOneQuery(`
      SELECT r.*, o.customer_id FROM returns r
      LEFT JOIN orders o ON r.order_id = o.id
      WHERE r.id = ? AND r.tenant_id = ?
    `, [id, tenantId]);

    if (!returnRecord) {
      return res.status(404).json({ success: false, message: 'Return not found' });
    }

    if (returnRecord.status !== 'approved') {
      return res.status(400).json({ success: false, message: 'Return must be approved before generating credit note' });
    }

    const creditNoteId = uuidv4();
    const creditNoteNumber = `CN-${Date.now().toString(36).toUpperCase()}`;

    await runQuery(`
      INSERT INTO credit_notes (id, tenant_id, return_id, customer_id, credit_note_number, amount, status, issued_date, created_by, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 'issued', CURRENT_TIMESTAMP, ?, CURRENT_TIMESTAMP)
    `, [creditNoteId, tenantId, id, returnRecord.customer_id, creditNoteNumber, returnRecord.total_amount, userId]);

    await runQuery(`
      UPDATE returns SET credit_note_id = ?, status = 'completed', updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `, [creditNoteId, id]);

    const creditNote = await getOneQuery('SELECT * FROM credit_notes WHERE id = ?', [creditNoteId]);

    res.json({
      success: true,
      data: { creditNote },
      message: 'Credit note generated successfully'
    });
  } catch (error) {
    console.error('Error generating credit note:', error);
    res.status(500).json({ success: false, message: 'Failed to generate credit note' });
  }
});

// ==================== REFUNDS MANAGEMENT ====================

/**
 * GET /api/orders-enhanced/refunds
 * List all refunds with filtering
 */
router.get('/refunds', async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const { status, order_id, customer_id, limit = 50, offset = 0 } = req.query;

    let whereClause = 'WHERE rf.tenant_id = ?';
    let params = [tenantId];

    if (status) {
      whereClause += ' AND rf.status = ?';
      params.push(status);
    }
    if (order_id) {
      whereClause += ' AND rf.order_id = ?';
      params.push(order_id);
    }
    if (customer_id) {
      whereClause += ' AND o.customer_id = ?';
      params.push(customer_id);
    }

    const refunds = await getQuery(`
      SELECT rf.*, 
             o.order_number,
             c.name as customer_name
      FROM refunds rf
      LEFT JOIN orders o ON rf.order_id = o.id
      LEFT JOIN customers c ON o.customer_id = c.id
      ${whereClause}
      ORDER BY rf.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), parseInt(offset)]);

    const countResult = await getOneQuery(`
      SELECT COUNT(*) as total FROM refunds rf
      LEFT JOIN orders o ON rf.order_id = o.id
      ${whereClause}
    `, params);

    res.json({
      success: true,
      data: { refunds },
      pagination: { total: countResult?.total || 0, limit: parseInt(limit), offset: parseInt(offset) }
    });
  } catch (error) {
    console.error('Error fetching refunds:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch refunds' });
  }
});

/**
 * GET /api/orders-enhanced/refunds/:id
 * Get refund by ID
 */
router.get('/refunds/:id', async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const { id } = req.params;

    const refund = await getOneQuery(`
      SELECT rf.*, 
             o.order_number, o.total_amount as order_total,
             c.name as customer_name, c.email as customer_email,
             p.reference_number as payment_reference
      FROM refunds rf
      LEFT JOIN orders o ON rf.order_id = o.id
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN payments p ON rf.payment_id = p.id
      WHERE rf.id = ? AND rf.tenant_id = ?
    `, [id, tenantId]);

    if (!refund) {
      return res.status(404).json({ success: false, message: 'Refund not found' });
    }

    res.json({
      success: true,
      data: { refund }
    });
  } catch (error) {
    console.error('Error fetching refund:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch refund' });
  }
});

/**
 * POST /api/orders-enhanced/refunds
 * Create a new refund request
 */
router.post('/refunds', async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const userId = req.user?.userId;
    const { order_id, payment_id, amount, reason, refund_method } = req.body;

    if (!order_id || !amount) {
      return res.status(400).json({ success: false, message: 'Order ID and amount are required' });
    }

    const order = await getOneQuery('SELECT * FROM orders WHERE id = ? AND tenant_id = ?', [order_id, tenantId]);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (parseFloat(amount) > parseFloat(order.total_amount)) {
      return res.status(400).json({ success: false, message: 'Refund amount cannot exceed order total' });
    }

    const refundId = uuidv4();
    const refundNumber = `REF-${Date.now().toString(36).toUpperCase()}`;

    await runQuery(`
      INSERT INTO refunds (id, tenant_id, order_id, payment_id, refund_number, amount, reason, refund_method, status, request_date, created_by, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', CURRENT_TIMESTAMP, ?, CURRENT_TIMESTAMP)
    `, [refundId, tenantId, order_id, payment_id || null, refundNumber, amount, reason || '', refund_method || 'original_payment', userId]);

    const newRefund = await getOneQuery('SELECT * FROM refunds WHERE id = ?', [refundId]);

    res.status(201).json({
      success: true,
      data: { refund: newRefund },
      message: 'Refund request created successfully'
    });
  } catch (error) {
    console.error('Error creating refund:', error);
    res.status(500).json({ success: false, message: 'Failed to create refund' });
  }
});

/**
 * POST /api/orders-enhanced/refunds/:id/process
 * Process/approve a refund
 */
router.post('/refunds/:id/process', async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const userId = req.user?.userId;
    const { id } = req.params;
    const { transaction_reference } = req.body;

    const refund = await getOneQuery('SELECT * FROM refunds WHERE id = ? AND tenant_id = ?', [id, tenantId]);
    if (!refund) {
      return res.status(404).json({ success: false, message: 'Refund not found' });
    }

    if (refund.status === 'completed') {
      return res.status(400).json({ success: false, message: 'Refund already processed' });
    }

    await runQuery(`
      UPDATE refunds 
      SET status = 'completed', processed_date = CURRENT_TIMESTAMP, processed_by = ?, transaction_reference = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [userId, transaction_reference || null, id]);

    await runQuery(`
      UPDATE orders SET payment_status = 'refunded', updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `, [refund.order_id]);

    res.json({
      success: true,
      message: 'Refund processed successfully'
    });
  } catch (error) {
    console.error('Error processing refund:', error);
    res.status(500).json({ success: false, message: 'Failed to process refund' });
  }
});

// ==================== CREDIT NOTES MANAGEMENT ====================

/**
 * GET /api/orders-enhanced/credit-notes
 * List all credit notes
 */
router.get('/credit-notes', async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const { status, customer_id, limit = 50, offset = 0 } = req.query;

    let whereClause = 'WHERE cn.tenant_id = ?';
    let params = [tenantId];

    if (status) {
      whereClause += ' AND cn.status = ?';
      params.push(status);
    }
    if (customer_id) {
      whereClause += ' AND cn.customer_id = ?';
      params.push(customer_id);
    }

    const creditNotes = await getQuery(`
      SELECT cn.*, 
             c.name as customer_name,
             r.return_number
      FROM credit_notes cn
      LEFT JOIN customers c ON cn.customer_id = c.id
      LEFT JOIN returns r ON cn.return_id = r.id
      ${whereClause}
      ORDER BY cn.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), parseInt(offset)]);

    const countResult = await getOneQuery(`
      SELECT COUNT(*) as total FROM credit_notes cn ${whereClause}
    `, params);

    res.json({
      success: true,
      data: { creditNotes },
      pagination: { total: countResult?.total || 0, limit: parseInt(limit), offset: parseInt(offset) }
    });
  } catch (error) {
    console.error('Error fetching credit notes:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch credit notes' });
  }
});

/**
 * GET /api/orders-enhanced/credit-notes/:id
 * Get credit note by ID
 */
router.get('/credit-notes/:id', async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const { id } = req.params;

    const creditNote = await getOneQuery(`
      SELECT cn.*, 
             c.name as customer_name, c.email as customer_email,
             r.return_number, r.order_id
      FROM credit_notes cn
      LEFT JOIN customers c ON cn.customer_id = c.id
      LEFT JOIN returns r ON cn.return_id = r.id
      WHERE cn.id = ? AND cn.tenant_id = ?
    `, [id, tenantId]);

    if (!creditNote) {
      return res.status(404).json({ success: false, message: 'Credit note not found' });
    }

    res.json({
      success: true,
      data: { creditNote }
    });
  } catch (error) {
    console.error('Error fetching credit note:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch credit note' });
  }
});

/**
 * POST /api/orders-enhanced/credit-notes/:id/apply
 * Apply credit note to an order
 */
router.post('/credit-notes/:id/apply', async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const userId = req.user?.userId;
    const { id } = req.params;
    const { order_id } = req.body;

    const creditNote = await getOneQuery('SELECT * FROM credit_notes WHERE id = ? AND tenant_id = ?', [id, tenantId]);
    if (!creditNote) {
      return res.status(404).json({ success: false, message: 'Credit note not found' });
    }

    if (creditNote.status !== 'issued') {
      return res.status(400).json({ success: false, message: 'Credit note is not available for use' });
    }

    await runQuery(`
      UPDATE credit_notes SET status = 'applied', applied_to_order_id = ?, applied_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [order_id, id]);

    await runQuery(`
      UPDATE orders SET discount_amount = discount_amount + ?, total_amount = total_amount - ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND tenant_id = ?
    `, [creditNote.amount, creditNote.amount, order_id, tenantId]);

    res.json({
      success: true,
      message: 'Credit note applied successfully'
    });
  } catch (error) {
    console.error('Error applying credit note:', error);
    res.status(500).json({ success: false, message: 'Failed to apply credit note' });
  }
});

module.exports = router;
