/**
 * Enhanced Van Sales Routes with Transactional Order Flow
 * Implements SalesJump-style order management with:
 * - Stock reservation and validation
 * - Transactional order creation
 * - Commission calculation
 * - Order fulfillment and cancellation
 * - Beat planning and route optimization
 */

const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { getQuery, getOneQuery, runQuery } = require('../utils/database');
const { getDatabase } = require('../database/init');
const commissionService = require('../services/commission.service');
const { v4: uuidv4 } = require('uuid');

/**
 * POST /api/van-sales/orders - Create transactional order
 * Flow: Validate stock → Reserve → Calculate commission → Create order
 */
router.post('/orders', asyncHandler(async (req, res) => {
  const {
    van_id,
    customer_id,
    items, // [{ product_id, quantity, unit_price }]
    payment_method,
    payment_reference,
    location_lat,
    location_lng,
    notes,
    idempotency_key
  } = req.body;

  const tenantId = req.tenantId;
  
  if (!req.user?.userId) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }
  
  const agent = await getOneQuery(
    'SELECT id FROM agents WHERE user_id = ? AND tenant_id = ?',
    [req.user.userId, tenantId]
  );
  
  if (!agent) {
    return res.status(403).json({ success: false, message: 'User is not an agent' });
  }
  
  const agentId = agent.id;

  if (idempotency_key) {
    const existingOrder = await getOneQuery(
      'SELECT * FROM van_sales WHERE tenant_id = ? AND id = ?',
      [tenantId, idempotency_key]
    );
    
    if (existingOrder) {
      return res.status(200).json({ 
        success: true, 
        data: existingOrder,
        message: 'Order already exists (idempotent)'
      });
    }
  }

  const db = getDatabase();
  
  await new Promise((resolve, reject) => {
    db.run('BEGIN TRANSACTION', (err) => { if (err) reject(err); else resolve(); });
  });

  try {
    for (const item of items) {
      const product = await getOneQuery(
        'SELECT id, name, stock_quantity FROM products WHERE id = ? AND tenant_id = ?',
        [item.product_id, tenantId]
      );
      
      if (!product) {
        throw new Error(`Product ${item.product_id} not found`);
      }
      
      if (product.stock_quantity < item.quantity) {
        throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stock_quantity}, Requested: ${item.quantity}`);
      }
    }

    let subtotal = 0;
    for (const item of items) {
      subtotal += item.quantity * item.unit_price;
    }
    
    const tax_rate = 0.15; // 15% VAT for South Africa
    const tax_amount = subtotal * tax_rate;
    const total_amount = subtotal + tax_amount;

    const orderId = idempotency_key || uuidv4();
    const saleNumber = `VS-${Date.now()}`;
    
    await runQuery(
      `INSERT INTO van_sales (
        id, tenant_id, sale_number, van_id, agent_id, customer_id, sale_date,
        sale_type, subtotal, tax_amount, discount_amount, total_amount, 
        amount_paid, amount_due, payment_method, payment_reference,
        location_lat, location_lng, notes, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderId,
        tenantId,
        saleNumber,
        van_id,
        agentId,
        customer_id,
        new Date().toISOString().split('T')[0],
        'cash',
        subtotal,
        tax_amount,
        0, // discount_amount
        total_amount,
        0, // amount_paid (pending fulfillment)
        total_amount, // amount_due
        payment_method,
        payment_reference,
        location_lat,
        location_lng,
        notes,
        'pending', // Status: pending until fulfilled
        new Date().toISOString()
      ]
    );

    for (const item of items) {
      const movementId = uuidv4();
      await runQuery(
        `INSERT INTO stock_movements (
          id, tenant_id, product_id, movement_type, quantity, 
          reference_type, reference_id, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          movementId,
          tenantId,
          item.product_id,
          'sale',
          -item.quantity, // Negative for outbound
          'van_sale',
          orderId,
          'reserved', // Reserved until order is fulfilled
          new Date().toISOString()
        ]
      );
    }

    const commissionRules = await commissionService.getCommissionRules(tenantId, 'order', orderId);
    const commissionAmount = commissionService.calculateCommission('order', { total_amount }, commissionRules);

    await new Promise((resolve, reject) => {
      db.run('COMMIT', (err) => { if (err) reject(err); else resolve(); });
    });

    const order = await getOneQuery('SELECT * FROM van_sales WHERE id = ?', [orderId]);
    
    res.status(201).json({
      success: true,
      data: {
        order,
        commission_preview: {
          amount: commissionAmount,
          currency: 'ZAR',
          status: 'pending_fulfillment'
        }
      },
      message: 'Order created successfully. Stock reserved. Complete fulfillment to finalize.'
    });

  } catch (error) {
    await new Promise((resolve) => { db.run('ROLLBACK', () => resolve()); });
    throw error;
  }
}));

/**
 * PATCH /api/van-sales/orders/:id/fulfill - Fulfill order
 * Commits stock movements and creates commission event
 */
router.patch('/orders/:id/fulfill', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { amount_paid, payment_method, payment_reference } = req.body;
  const tenantId = req.tenantId;
  const db = getDatabase();

  await new Promise((resolve, reject) => {
    db.run('BEGIN TRANSACTION', (err) => { if (err) reject(err); else resolve(); });
  });

  try {
    const order = await getOneQuery(
      'SELECT * FROM van_sales WHERE id = ? AND tenant_id = ?',
      [id, tenantId]
    );
    
    if (!order) {
      throw new Error('Order not found');
    }
    
    if (order.status !== 'pending') {
      throw new Error(`Order cannot be fulfilled. Current status: ${order.status}`);
    }

    await runQuery(
      `UPDATE van_sales 
       SET status = 'completed', amount_paid = ?, payment_method = ?, 
           payment_reference = ?, updated_at = ?
       WHERE id = ? AND tenant_id = ?`,
      [amount_paid || order.total_amount, payment_method, payment_reference, 
       new Date().toISOString(), id, tenantId]
    );

    await runQuery(
      `UPDATE stock_movements 
       SET status = 'completed', updated_at = ?
       WHERE reference_id = ? AND reference_type = 'van_sale' AND status = 'reserved'`,
      [new Date().toISOString(), id]
    );

    const movements = await getQuery(
      'SELECT product_id, quantity FROM stock_movements WHERE reference_id = ? AND reference_type = ?',
      [id, 'van_sale']
    );
    
    for (const movement of movements) {
      await runQuery(
        'UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ? AND tenant_id = ?',
        [movement.quantity, movement.product_id, tenantId]
      );
    }

    const commissionRules = await commissionService.getCommissionRules(tenantId, 'order', id);
    const commissionAmount = commissionService.calculateCommission('order', { total_amount: order.total_amount }, commissionRules);
    
    if (commissionAmount > 0) {
      await commissionService.createEvent(
        tenantId,
        order.agent_id,
        null, // No visit_id for van sales
        'order',
        id,
        commissionAmount,
        'ZAR',
        `${id}-fulfill` // idempotency key
      );
    }

    await new Promise((resolve, reject) => {
      db.run('COMMIT', (err) => { if (err) reject(err); else resolve(); });
    });

    const updatedOrder = await getOneQuery('SELECT * FROM van_sales WHERE id = ?', [id]);
    
    res.json({
      success: true,
      data: {
        order: updatedOrder,
        commission: {
          amount: commissionAmount,
          currency: 'ZAR',
          status: 'pending'
        }
      },
      message: 'Order fulfilled successfully'
    });

  } catch (error) {
    await new Promise((resolve) => { db.run('ROLLBACK', () => resolve()); });
    throw error;
  }
}));

/**
 * PATCH /api/van-sales/orders/:id/cancel - Cancel order
 * Releases reserved stock
 */
router.patch('/orders/:id/cancel', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { cancellation_reason } = req.body;
  const tenantId = req.tenantId;
  const db = getDatabase();

  await new Promise((resolve, reject) => {
    db.run('BEGIN TRANSACTION', (err) => { if (err) reject(err); else resolve(); });
  });

  try {
    const order = await getOneQuery(
      'SELECT * FROM van_sales WHERE id = ? AND tenant_id = ?',
      [id, tenantId]
    );
    
    if (!order) {
      throw new Error('Order not found');
    }
    
    if (order.status !== 'pending') {
      throw new Error(`Order cannot be cancelled. Current status: ${order.status}`);
    }

    await runQuery(
      `UPDATE van_sales 
       SET status = 'cancelled', notes = ?, updated_at = ?
       WHERE id = ? AND tenant_id = ?`,
      [cancellation_reason || order.notes, new Date().toISOString(), id, tenantId]
    );

    await runQuery(
      `DELETE FROM stock_movements 
       WHERE reference_id = ? AND reference_type = 'van_sale' AND status = 'reserved'`,
      [id]
    );

    await new Promise((resolve, reject) => {
      db.run('COMMIT', (err) => { if (err) reject(err); else resolve(); });
    });

    const updatedOrder = await getOneQuery('SELECT * FROM van_sales WHERE id = ?', [id]);
    
    res.json({
      success: true,
      data: updatedOrder,
      message: 'Order cancelled successfully. Stock reservation released.'
    });

  } catch (error) {
    await new Promise((resolve) => { db.run('ROLLBACK', () => resolve()); });
    throw error;
  }
}));

/**
 * GET /api/van-sales/orders/:id - Get order details
 */
router.get('/orders/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const tenantId = req.tenantId;
  
  const order = await getOneQuery(
    'SELECT * FROM van_sales WHERE id = ? AND tenant_id = ?',
    [id, tenantId]
  );

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }

  const items = await getQuery(
    `SELECT 
      sm.id,
      sm.product_id,
      p.name as product_name,
      p.sku as product_code,
      ABS(sm.quantity) as quantity,
      p.unit_price,
      ABS(sm.quantity) * p.unit_price as line_total,
      sm.status
    FROM stock_movements sm
    JOIN products p ON sm.product_id = p.id
    WHERE sm.reference_id = ? AND sm.reference_type = 'van_sale'`,
    [id]
  );

  const commission = await getOneQuery(
    'SELECT * FROM commission_events WHERE event_ref_id = ? AND event_type = ?',
    [id, 'order']
  );

  res.json({
    success: true,
    data: {
      order,
      items,
      commission
    }
  });
}));

const legacyVanSalesRoutes = require('./van-sales');
router.use('/', legacyVanSalesRoutes);

module.exports = router;
