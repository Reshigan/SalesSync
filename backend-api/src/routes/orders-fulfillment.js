const express = require('express');
const router = express.Router();

// Module 1: Sales & Orders - Backend Enhancement (75% → 100%)
// This file adds the missing features for complete order fulfillment

const getDatabase = () => require('../utils/database').getDatabase();

// ============================================================================
// ORDER FULFILLMENT WORKFLOW
// ============================================================================

/**
 * @route   POST /api/orders/:id/status-transition
 * @desc    Transition order through fulfillment stages
 * @access  Private
 * 
 * Workflow: Draft → Pending → Confirmed → Processing → 
 *           Picking → Packing → Ready → Shipped → Delivered → Completed
 */
router.post('/:id/status-transition', async (req, res) => {
  try {
    const { id } = req.params;
    const {from_status, to_status, action, metadata, notes} = req.body;
    const tenantId = req.user.tenantId;
    const db = getDatabase();

    // Get current order
    const order = await new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM orders WHERE id = ? AND tenant_id = ?',
        [id, tenantId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Validate transition
    const validTransitions = {
      'draft': ['pending', 'cancelled'],
      'pending': ['confirmed', 'cancelled'],
      'confirmed': ['processing', 'cancelled'],
      'processing': ['picking', 'on_hold', 'cancelled'],
      'picking': ['packing', 'processing'],
      'packing': ['ready', 'picking'],
      'ready': ['shipped', 'packing'],
      'shipped': ['delivered', 'in_transit'],
      'in_transit': ['delivered', 'failed'],
      'delivered': ['completed'],
      'on_hold': ['processing', 'cancelled'],
      'failed': ['processing', 'cancelled']
    };

    const currentStatus = order.status || 'draft';
    const allowedTransitions = validTransitions[currentStatus] || [];

    if (!allowedTransitions.includes(to_status)) {
      return res.status(400).json({
        error: 'Invalid status transition',
        currentStatus,
        requestedStatus: to_status,
        allowedTransitions
      });
    }

    // Perform transition actions based on status
    switch (to_status) {
      case 'confirmed':
        // Reserve inventory
        await reserveInventoryForOrder(order.id, tenantId, db);
        break;
      
      case 'processing':
        // Validate inventory availability
        await validateInventoryAvailability(order.id, tenantId, db);
        break;
      
      case 'cancelled':
        // Release inventory reservations
        await releaseInventoryReservations(order.id, tenantId, db);
        break;
      
      case 'shipped':
        // Commit inventory (deduct from available)
        await commitInventoryForOrder(order.id, tenantId, db);
        break;
      
      case 'completed':
        // Finalize order
        await finalizeOrder(order.id, tenantId, db);
        break;
    }

    // Update order status
    await new Promise((resolve, reject) => {
      db.run(
        `UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND tenant_id = ?`,
        [to_status, id, tenantId],
        function(err) {
          if (err) reject(err);
          else resolve({ changes: this.changes });
        }
      );
    });

    // Create status transition log
    await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO order_status_history (
          order_id, from_status, to_status, action, 
          metadata, notes, changed_by, tenant_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id, currentStatus, to_status, action,
          JSON.stringify(metadata || {}), notes, req.user.userId, tenantId
        ],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID });
        }
      );
    });

    // Get updated order
    const updatedOrder = await new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM orders WHERE id = ? AND tenant_id = ?',
        [id, tenantId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    res.json({
      success: true,
      order: updatedOrder,
      transition: {
        from: currentStatus,
        to: to_status,
        action,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Status transition error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/orders/:id/status-history
 * @desc    Get order status history
 * @access  Private
 */
router.get('/:id/status-history', async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;
    const db = getDatabase();

    const history = await new Promise((resolve, reject) => {
      db.all(
        `SELECT h.*, u.username as changed_by_name 
         FROM order_status_history h
         LEFT JOIN users u ON h.changed_by = u.id
         WHERE h.order_id = ? AND h.tenant_id = ?
         ORDER BY h.created_at DESC`,
        [id, tenantId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    res.json(history);
  } catch (error) {
    console.error('Get status history error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// ORDER-INVOICE-PAYMENT FINANCIAL SUMMARY
// ============================================================================

/**
 * @route   GET /api/orders/:id/financial-summary
 * @desc    Get complete financial summary (order + invoices + payments)
 * @access  Private
 */
router.get('/:id/financial-summary', async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;
    const db = getDatabase();

    // Get order
    const order = await new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM orders WHERE id = ? AND tenant_id = ?',
        [id, tenantId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Get related invoices
    const invoices = await new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM invoices WHERE order_id = ? AND tenant_id = ?',
        [id, tenantId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });

    // Get related payments
    const payments = await new Promise((resolve, reject) => {
      db.all(
        `SELECT p.* FROM payments p
         JOIN invoices i ON p.invoice_id = i.id
         WHERE i.order_id = ? AND p.tenant_id = ?
         ORDER BY p.payment_date DESC`,
        [id, tenantId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });

    const totalPaid = payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    const totalInvoiced = invoices.reduce((sum, inv) => sum + (parseFloat(inv.total) || 0), 0);
    const balance = totalInvoiced - totalPaid;

    res.json({
      order: {
        id: order.id,
        orderNumber: order.order_number,
        total: parseFloat(order.total) || 0,
        status: order.status,
        orderDate: order.order_date
      },
      invoices: invoices.map(inv => ({
        id: inv.id,
        invoiceNumber: inv.invoice_number,
        amount: parseFloat(inv.total) || 0,
        status: inv.status,
        dueDate: inv.due_date
      })),
      payments: payments.map(p => ({
        id: p.id,
        amount: parseFloat(p.amount) || 0,
        method: p.payment_method,
        date: p.payment_date,
        status: p.status
      })),
      summary: {
        orderTotal: parseFloat(order.total) || 0,
        totalInvoiced,
        totalPaid,
        balance,
        fullyPaid: balance <= 0.01,
        paymentStatus: balance <= 0.01 ? 'paid' : (totalPaid > 0 ? 'partial' : 'unpaid')
      }
    });

  } catch (error) {
    console.error('Financial summary error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// BACKORDERS & PARTIAL FULFILLMENT
// ============================================================================

/**
 * @route   POST /api/orders/:id/partial-fulfill
 * @desc    Handle partial fulfillment and backorders
 * @access  Private
 */
router.post('/:id/partial-fulfill', async (req, res) => {
  try {
    const { id } = req.params;
    const { fulfilled, backorders, notes } = req.body;
    const tenantId = req.user.tenantId;
    const db = getDatabase();

    // Get order
    const order = await new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM orders WHERE id = ? AND tenant_id = ?',
        [id, tenantId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Create fulfilled shipment
    const shipmentId = await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO order_shipments (
          order_id, shipment_type, status, notes, tenant_id
        ) VALUES (?, 'partial', 'preparing', ?, ?)`,
        [id, notes, tenantId],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });

    // Add fulfilled items to shipment
    for (const item of fulfilled) {
      await new Promise((resolve, reject) => {
        db.run(
          `INSERT INTO shipment_items (
            shipment_id, product_id, quantity, tenant_id
          ) VALUES (?, ?, ?, ?)`,
          [shipmentId, item.productId, item.quantity, tenantId],
          function(err) {
            if (err) reject(err);
            else resolve(this.lastID);
          }
        );
      });

      // Deduct from inventory
      await deductInventory(item.productId, item.quantity, tenantId, db);
    }

    // Create backorders
    for (const item of backorders) {
      await new Promise((resolve, reject) => {
        db.run(
          `INSERT INTO order_backorders (
            order_id, product_id, quantity, expected_date, status, tenant_id
          ) VALUES (?, ?, ?, ?, 'pending', ?)`,
          [id, item.productId, item.quantity, item.expectedDate, tenantId],
          function(err) {
            if (err) reject(err);
            else resolve(this.lastID);
          }
        );
      });
    }

    // Update order status
    await new Promise((resolve, reject) => {
      db.run(
        `UPDATE orders SET status = 'partially_fulfilled', updated_at = CURRENT_TIMESTAMP 
         WHERE id = ? AND tenant_id = ?`,
        [id, tenantId],
        function(err) {
          if (err) reject(err);
          else resolve({ changes: this.changes });
        }
      );
    });

    res.json({
      success: true,
      shipmentId,
      fulfilledItems: fulfilled.length,
      backorderedItems: backorders.length,
      message: 'Order partially fulfilled'
    });

  } catch (error) {
    console.error('Partial fulfillment error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/orders/:id/backorders
 * @desc    Get backorders for an order
 * @access  Private
 */
router.get('/:id/backorders', async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;
    const db = getDatabase();

    const backorders = await new Promise((resolve, reject) => {
      db.all(
        `SELECT b.*, p.name as product_name, p.sku
         FROM order_backorders b
         JOIN products p ON b.product_id = p.id
         WHERE b.order_id = ? AND b.tenant_id = ?
         ORDER BY b.expected_date ASC`,
        [id, tenantId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });

    res.json(backorders);
  } catch (error) {
    console.error('Get backorders error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// ORDER MODIFICATIONS
// ============================================================================

/**
 * @route   POST /api/orders/:id/modify
 * @desc    Modify order after creation
 * @access  Private
 */
router.post('/:id/modify', async (req, res) => {
  try {
    const { id } = req.params;
    const { action, item, reason, recalculate } = req.body;
    const tenantId = req.user.tenantId;
    const db = getDatabase();

    // Get order
    const order = await new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM orders WHERE id = ? AND tenant_id = ?',
        [id, tenantId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check if order can be modified
    const modifiableStatuses = ['draft', 'pending', 'confirmed'];
    if (!modifiableStatuses.includes(order.status)) {
      return res.status(400).json({
        error: 'Order cannot be modified in current status',
        currentStatus: order.status,
        message: 'Order must be in draft, pending, or confirmed status'
      });
    }

    let modificationResult;

    switch (action) {
      case 'add_item':
        modificationResult = await addOrderItem(id, item, tenantId, db);
        break;
      
      case 'remove_item':
        modificationResult = await removeOrderItem(id, item.orderItemId, tenantId, db);
        break;
      
      case 'change_quantity':
        modificationResult = await changeOrderItemQuantity(
          id, item.orderItemId, item.newQuantity, tenantId, db
        );
        break;
      
      case 'update_shipping':
        modificationResult = await updateOrderShipping(id, item, tenantId, db);
        break;
      
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

    // Log modification
    await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO order_modifications (
          order_id, action, details, reason, modified_by, tenant_id
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          id, action, JSON.stringify(item), reason, req.user.userId, tenantId
        ],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });

    // Recalculate order totals if requested
    if (recalculate) {
      await recalculateOrderTotals(id, tenantId, db);
    }

    // Get updated order
    const updatedOrder = await new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM orders WHERE id = ? AND tenant_id = ?',
        [id, tenantId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    res.json({
      success: true,
      order: updatedOrder,
      modification: modificationResult,
      message: 'Order modified successfully'
    });

  } catch (error) {
    console.error('Order modification error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/orders/:id/modifications
 * @desc    Get order modification history
 * @access  Private
 */
router.get('/:id/modifications', async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;
    const db = getDatabase();

    const modifications = await new Promise((resolve, reject) => {
      db.all(
        `SELECT m.*, u.username as modified_by_name
         FROM order_modifications m
         LEFT JOIN users u ON m.modified_by = u.id
         WHERE m.order_id = ? AND m.tenant_id = ?
         ORDER BY m.created_at DESC`,
        [id, tenantId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });

    res.json(modifications);
  } catch (error) {
    console.error('Get modifications error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// RECURRING ORDERS / SUBSCRIPTIONS
// ============================================================================

/**
 * @route   POST /api/orders/recurring
 * @desc    Create recurring order subscription
 * @access  Private
 */
router.post('/recurring', async (req, res) => {
  try {
    const {
      customerId, schedule, items, startDate, endDate,
      billingDay, shippingAddress, notes
    } = req.body;
    const tenantId = req.user.tenantId;
    const db = getDatabase();

    // Validate schedule
    const validSchedules = ['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'];
    if (!validSchedules.includes(schedule)) {
      return res.status(400).json({ error: 'Invalid schedule' });
    }

    // Create recurring order
    const recurringOrderId = await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO recurring_orders (
          customer_id, schedule, billing_day, start_date, end_date,
          shipping_address, status, notes, created_by, tenant_id
        ) VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?, ?)`,
        [
          customerId, schedule, billingDay, startDate, endDate,
          JSON.stringify(shippingAddress), notes, req.user.userId, tenantId
        ],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });

    // Add recurring order items
    for (const item of items) {
      await new Promise((resolve, reject) => {
        db.run(
          `INSERT INTO recurring_order_items (
            recurring_order_id, product_id, quantity, unit_price, tenant_id
          ) VALUES (?, ?, ?, ?, ?)`,
          [
            recurringOrderId, item.productId, item.quantity,
            item.unitPrice, tenantId
          ],
          function(err) {
            if (err) reject(err);
            else resolve(this.lastID);
          }
        );
      });
    }

    res.json({
      success: true,
      recurringOrderId,
      message: 'Recurring order created successfully',
      nextOrderDate: calculateNextOrderDate(schedule, startDate, billingDay)
    });

  } catch (error) {
    console.error('Create recurring order error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/orders/recurring
 * @desc    Get all recurring orders
 * @access  Private
 */
router.get('/recurring', async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { status, customerId } = req.query;
    const db = getDatabase();

    let sql = `
      SELECT ro.*, c.name as customer_name
      FROM recurring_orders ro
      JOIN customers c ON ro.customer_id = c.id
      WHERE ro.tenant_id = ?
    `;
    const params = [tenantId];

    if (status) {
      sql += ' AND ro.status = ?';
      params.push(status);
    }

    if (customerId) {
      sql += ' AND ro.customer_id = ?';
      params.push(customerId);
    }

    sql += ' ORDER BY ro.created_at DESC';

    const recurringOrders = await new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });

    res.json(recurringOrders);
  } catch (error) {
    console.error('Get recurring orders error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   POST /api/orders/recurring/:id/pause
 * @desc    Pause recurring order
 * @access  Private
 */
router.post('/recurring/:id/pause', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, pauseUntil } = req.body;
    const tenantId = req.user.tenantId;
    const db = getDatabase();

    await new Promise((resolve, reject) => {
      db.run(
        `UPDATE recurring_orders 
         SET status = 'paused', pause_reason = ?, pause_until = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ? AND tenant_id = ?`,
        [reason, pauseUntil, id, tenantId],
        function(err) {
          if (err) reject(err);
          else resolve({ changes: this.changes });
        }
      );
    });

    res.json({
      success: true,
      message: 'Recurring order paused',
      resumeDate: pauseUntil
    });
  } catch (error) {
    console.error('Pause recurring order error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   POST /api/orders/recurring/:id/resume
 * @desc    Resume paused recurring order
 * @access  Private
 */
router.post('/recurring/:id/resume', async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;
    const db = getDatabase();

    await new Promise((resolve, reject) => {
      db.run(
        `UPDATE recurring_orders 
         SET status = 'active', pause_reason = NULL, pause_until = NULL, updated_at = CURRENT_TIMESTAMP
         WHERE id = ? AND tenant_id = ?`,
        [id, tenantId],
        function(err) {
          if (err) reject(err);
          else resolve({ changes: this.changes });
        }
      );
    });

    res.json({
      success: true,
      message: 'Recurring order resumed'
    });
  } catch (error) {
    console.error('Resume recurring order error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// ORDER NOTES & HISTORY
// ============================================================================

/**
 * @route   POST /api/orders/:id/notes
 * @desc    Add note to order
 * @access  Private
 */
router.post('/:id/notes', async (req, res) => {
  try {
    const { id } = req.params;
    const { note, visibility } = req.body;
    const tenantId = req.user.tenantId;
    const db = getDatabase();

    const noteId = await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO order_notes (
          order_id, note, visibility, created_by, tenant_id
        ) VALUES (?, ?, ?, ?, ?)`,
        [id, note, visibility || 'internal', req.user.userId, tenantId],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });

    res.json({
      success: true,
      noteId,
      message: 'Note added successfully'
    });
  } catch (error) {
    console.error('Add note error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/orders/:id/notes
 * @desc    Get order notes
 * @access  Private
 */
router.get('/:id/notes', async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;
    const db = getDatabase();

    const notes = await new Promise((resolve, reject) => {
      db.all(
        `SELECT n.*, u.username as created_by_name
         FROM order_notes n
         LEFT JOIN users u ON n.created_by = u.id
         WHERE n.order_id = ? AND n.tenant_id = ?
         ORDER BY n.created_at DESC`,
        [id, tenantId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });

    res.json(notes);
  } catch (error) {
    console.error('Get notes error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/orders/:id/history
 * @desc    Get complete order history (all changes)
 * @access  Private
 */
router.get('/:id/history', async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;
    const db = getDatabase();

    // Get all history items (status changes, modifications, notes)
    const statusHistory = await new Promise((resolve, reject) => {
      db.all(
        `SELECT 'status_change' as type, from_status, to_status, action, created_at, changed_by as user_id
         FROM order_status_history
         WHERE order_id = ? AND tenant_id = ?`,
        [id, tenantId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });

    const modifications = await new Promise((resolve, reject) => {
      db.all(
        `SELECT 'modification' as type, action, details, reason, created_at, modified_by as user_id
         FROM order_modifications
         WHERE order_id = ? AND tenant_id = ?`,
        [id, tenantId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });

    const notes = await new Promise((resolve, reject) => {
      db.all(
        `SELECT 'note' as type, note, visibility, created_at, created_by as user_id
         FROM order_notes
         WHERE order_id = ? AND tenant_id = ?`,
        [id, tenantId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });

    // Combine and sort by date
    const allHistory = [...statusHistory, ...modifications, ...notes]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json(allHistory);
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function reserveInventoryForOrder(orderId, tenantId, db) {
  // Get order items
  const items = await new Promise((resolve, reject) => {
    db.all(
      'SELECT * FROM order_items WHERE order_id = ? AND tenant_id = ?',
      [orderId, tenantId],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      }
    );
  });

  // Reserve each product
  for (const item of items) {
    await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO inventory_reservations (
          order_id, product_id, quantity, expires_at, tenant_id
        ) VALUES (?, ?, ?, datetime('now', '+24 hours'), ?)`,
        [orderId, item.product_id, item.quantity, tenantId],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  }
}

async function releaseInventoryReservations(orderId, tenantId, db) {
  await new Promise((resolve, reject) => {
    db.run(
      `DELETE FROM inventory_reservations WHERE order_id = ? AND tenant_id = ?`,
      [orderId, tenantId],
      function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      }
    );
  });
}

async function validateInventoryAvailability(orderId, tenantId, db) {
  const items = await new Promise((resolve, reject) => {
    db.all(
      `SELECT oi.*, i.available_quantity
       FROM order_items oi
       JOIN inventory_stock i ON oi.product_id = i.product_id AND oi.tenant_id = i.tenant_id
       WHERE oi.order_id = ? AND oi.tenant_id = ?`,
      [orderId, tenantId],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      }
    );
  });

  for (const item of items) {
    if (item.quantity > item.available_quantity) {
      throw new Error(`Insufficient inventory for product ${item.product_id}`);
    }
  }
}

async function commitInventoryForOrder(orderId, tenantId, db) {
  const items = await new Promise((resolve, reject) => {
    db.all(
      'SELECT * FROM order_items WHERE order_id = ? AND tenant_id = ?',
      [orderId, tenantId],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      }
    );
  });

  for (const item of items) {
    await deductInventory(item.product_id, item.quantity, tenantId, db);
  }

  await releaseInventoryReservations(orderId, tenantId, db);
}

async function deductInventory(productId, quantity, tenantId, db) {
  await new Promise((resolve, reject) => {
    db.run(
      `UPDATE inventory_stock 
       SET available_quantity = available_quantity - ?, updated_at = CURRENT_TIMESTAMP
       WHERE product_id = ? AND tenant_id = ?`,
      [quantity, productId, tenantId],
      function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      }
    );
  });
}

async function finalizeOrder(orderId, tenantId, db) {
  await new Promise((resolve, reject) => {
    db.run(
      `UPDATE orders 
       SET completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND tenant_id = ?`,
      [orderId, tenantId],
      function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      }
    );
  });
}

async function addOrderItem(orderId, item, tenantId, db) {
  const itemId = await new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO order_items (
        order_id, product_id, quantity, unit_price, total, tenant_id
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        orderId, item.productId, item.quantity,
        item.unitPrice, item.quantity * item.unitPrice, tenantId
      ],
      function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      }
    );
  });

  return { itemId, action: 'added' };
}

async function removeOrderItem(orderId, orderItemId, tenantId, db) {
  await new Promise((resolve, reject) => {
    db.run(
      `DELETE FROM order_items WHERE id = ? AND order_id = ? AND tenant_id = ?`,
      [orderItemId, orderId, tenantId],
      function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      }
    );
  });

  return { orderItemId, action: 'removed' };
}

async function changeOrderItemQuantity(orderId, orderItemId, newQuantity, tenantId, db) {
  // Get current item
  const item = await new Promise((resolve, reject) => {
    db.get(
      `SELECT * FROM order_items WHERE id = ? AND order_id = ? AND tenant_id = ?`,
      [orderItemId, orderId, tenantId],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });

  if (!item) {
    throw new Error('Order item not found');
  }

  const newTotal = newQuantity * item.unit_price;

  await new Promise((resolve, reject) => {
    db.run(
      `UPDATE order_items SET quantity = ?, total = ? WHERE id = ? AND tenant_id = ?`,
      [newQuantity, newTotal, orderItemId, tenantId],
      function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      }
    );
  });

  return { orderItemId, oldQuantity: item.quantity, newQuantity, action: 'quantity_changed' };
}

async function updateOrderShipping(orderId, shippingInfo, tenantId, db) {
  await new Promise((resolve, reject) => {
    db.run(
      `UPDATE orders SET shipping_address = ?, shipping_method = ?, shipping_cost = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND tenant_id = ?`,
      [
        JSON.stringify(shippingInfo.address),
        shippingInfo.method,
        shippingInfo.cost,
        orderId,
        tenantId
      ],
      function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      }
    );
  });

  return { action: 'shipping_updated' };
}

async function recalculateOrderTotals(orderId, tenantId, db) {
  const items = await new Promise((resolve, reject) => {
    db.all(
      'SELECT * FROM order_items WHERE order_id = ? AND tenant_id = ?',
      [orderId, tenantId],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      }
    );
  });

  const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0);

  // Get current order for tax and shipping
  const order = await new Promise((resolve, reject) => {
    db.get(
      'SELECT * FROM orders WHERE id = ? AND tenant_id = ?',
      [orderId, tenantId],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });

  const tax = subtotal * ((order.tax_rate || 0) / 100);
  const shippingCost = parseFloat(order.shipping_cost) || 0;
  const discount = parseFloat(order.discount) || 0;
  const total = subtotal + tax + shippingCost - discount;

  await new Promise((resolve, reject) => {
    db.run(
      `UPDATE orders SET subtotal = ?, tax = ?, total = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND tenant_id = ?`,
      [subtotal, tax, total, orderId, tenantId],
      function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      }
    );
  });
}

function calculateNextOrderDate(schedule, startDate, billingDay) {
  const start = new Date(startDate);
  const today = new Date();
  
  if (start > today) {
    return startDate;
  }

  const next = new Date(today);

  switch (schedule) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      break;
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'biweekly':
      next.setDate(next.getDate() + 14);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      if (billingDay) {
        next.setDate(billingDay);
      }
      break;
    case 'quarterly':
      next.setMonth(next.getMonth() + 3);
      break;
    case 'yearly':
      next.setFullYear(next.getFullYear() + 1);
      break;
  }

  return next.toISOString().split('T')[0];
}

module.exports = router;
