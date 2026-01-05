const express = require('express');
const { getQuery, getOneQuery, runQuery } = require('../utils/database');
const { selectOne, selectMany, insertRow, updateRow, deleteRow } = require('../utils/pg-helpers');
const settingsService = require('../services/settings.service');
const masterdataService = require('../services/masterdata.service');
const notificationService = require('../services/notification.service');
const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Order:
 *       type: object
 *       required:
 *         - customer_id
 *         - order_date
 *         - items
 *       properties:
 *         id:
 *           type: string
 *           description: Order ID
 *         order_number:
 *           type: string
 *           description: Order number
 *         customer_id:
 *           type: string
 *           description: Customer ID
 *         salesman_id:
 *           type: string
 *           description: Salesman ID
 *         order_date:
 *           type: string
 *           format: date
 *           description: Order date
 *         delivery_date:
 *           type: string
 *           format: date
 *           description: Delivery date
 *         subtotal:
 *           type: number
 *           description: Subtotal amount
 *         tax_amount:
 *           type: number
 *           description: Tax amount
 *         discount_amount:
 *           type: number
 *           description: Discount amount
 *         total_amount:
 *           type: number
 *           description: Total amount
 *         payment_method:
 *           type: string
 *           description: Payment method
 *         payment_status:
 *           type: string
 *           enum: [pending, paid, partial, cancelled]
 *           description: Payment status
 *         order_status:
 *           type: string
 *           enum: [pending, confirmed, processing, shipped, delivered, cancelled]
 *           description: Order status
 *         notes:
 *           type: string
 *           description: Order notes
 *         items:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               product_id:
 *                 type: string
 *               quantity:
 *                 type: integer
 *               unit_price:
 *                 type: number
 *               discount_percentage:
 *                 type: number
 *               tax_percentage:
 *                 type: number
 */

// Generate order number
const generateOrderNumber = async (tenantId) => {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  
  const row = await getOneQuery(`
    SELECT COUNT(*) as count 
    FROM orders 
    WHERE tenant_id = ? AND DATE(created_at) = DATE('now')
  `, [tenantId]);
  
  const sequence = String(row.count + 1).padStart(4, '0');
  return `ORD-${today}-${sequence}`;
};

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Get all orders
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: customer_id
 *         schema:
 *           type: string
 *         description: Filter by customer ID
 *       - in: query
 *         name: salesman_id
 *         schema:
 *           type: string
 *         description: Filter by salesman ID
 *       - in: query
 *         name: order_status
 *         schema:
 *           type: string
 *         description: Filter by order status
 *       - in: query
 *         name: payment_status
 *         schema:
 *           type: string
 *         description: Filter by payment status
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
 *     responses:
 *       200:
 *         description: List of orders
 */
router.get('/', async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { 
      customer_id, 
      salesman_id, 
      order_status, 
      payment_status, 
      date_from, 
      date_to,
      page = 1, 
      limit = 50 
    } = req.query;
    let sql = `
      SELECT o.*, c.name as customer_name, c.phone as customer_phone,
             u.first_name || ' ' || u.last_name as salesman_name,
             COUNT(oi.id) as item_count
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN users u ON o.salesman_id = u.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.tenant_id = ?
    `;
    const params = [tenantId];
    
    // Apply filters
    if (customer_id) {
      sql += ` AND o.customer_id = ?`;
      params.push(customer_id);
    }
    if (salesman_id) {
      sql += ` AND o.salesman_id = ?`;
      params.push(salesman_id);
    }
    if (order_status) {
      sql += ` AND o.order_status = ?`;
      params.push(order_status);
    }
    if (payment_status) {
      sql += ` AND o.payment_status = ?`;
      params.push(payment_status);
    }
    if (date_from) {
      sql += ` AND o.order_date >= ?`;
      params.push(date_from);
    }
    if (date_to) {
      sql += ` AND o.order_date <= ?`;
      params.push(date_to);
    }
    
    sql += ` 
      GROUP BY o.id, c.name, c.phone, u.first_name, u.last_name
      ORDER BY o.created_at DESC 
      LIMIT ? OFFSET ?
    `;
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));
    
    const orders = await getQuery(sql, params);
    
    // Get total count
    let countSql = 'SELECT COUNT(*) as count FROM orders WHERE tenant_id = ?';
    const countParams = [tenantId];
    
    if (customer_id) {
      countSql += ` AND customer_id = ?`;
      countParams.push(customer_id);
    }
    if (salesman_id) {
      countSql += ` AND salesman_id = ?`;
      countParams.push(salesman_id);
    }
    if (order_status) {
      countSql += ` AND order_status = ?`;
      countParams.push(order_status);
    }
    if (payment_status) {
      countSql += ` AND payment_status = ?`;
      countParams.push(payment_status);
    }
    if (date_from) {
      countSql += ` AND order_date >= ?`;
      countParams.push(date_from);
    }
    if (date_to) {
      countSql += ` AND order_date <= ?`;
      countParams.push(date_to);
    }
    
    const countRow = await getOneQuery(countSql, countParams);
    const totalCount = countRow.count;
    
    // Get summary statistics
    const stats = await getOneQuery(`
      SELECT 
        COUNT(*) as total_orders,
        SUM(CASE WHEN order_status = 'pending' THEN 1 ELSE 0 END) as pending_orders,
        SUM(CASE WHEN order_status = 'confirmed' THEN 1 ELSE 0 END) as confirmed_orders,
        SUM(CASE WHEN order_status = 'delivered' THEN 1 ELSE 0 END) as delivered_orders,
        SUM(total_amount) as total_value,
        AVG(total_amount) as average_order_value
      FROM orders 
      WHERE tenant_id = ? AND DATE(order_date) = DATE('now')
    `, [tenantId]);
    
    res.json({
      success: true,
      data: {
        orders,
        total: totalCount,
        stats,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount,
          pages: Math.ceil(totalCount / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Create a new order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Order'
 *     responses:
 *       201:
 *         description: Order created successfully
 *       400:
 *         description: Invalid input
 */
router.post('/', async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const {
      customer_id,
      salesman_id,
      order_date,
      delivery_date,
      payment_method,
      notes,
      items
    } = req.body;
    
    // Validation
    if (!customer_id || !order_date || !items || items.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Customer ID, order date, and items are required' 
      });
    }
    
    // Validate customer exists
    const customer = await selectOne('customers', { id: customer_id }, tenantId);
    if (!customer) {
      return res.status(400).json({ 
        success: false, 
        message: 'Customer not found' 
      });
    }
    
    // Calculate preliminary total for credit check
    let preliminaryTotal = 0;
    for (const item of items) {
      const product = await selectOne('products', { id: item.product_id }, tenantId);
      if (product) {
        const price = parseFloat(item.unit_price || product.selling_price || 0);
        preliminaryTotal += price * parseInt(item.quantity || 1);
      }
    }
    
    // Check customer credit using settings service
    const creditCheck = await masterdataService.checkCustomerCreditForOrder(tenantId, customer_id, preliminaryTotal);
    if (!creditCheck.allowed) {
      return res.status(400).json({
        success: false,
        message: creditCheck.reason,
        creditInfo: {
          availableCredit: creditCheck.availableCredit,
          creditLimit: creditCheck.creditLimit,
          orderAmount: preliminaryTotal
        }
      });
    }
    
    // Check inventory availability using settings service
    const inventoryItems = items.map(item => ({
      product_id: item.product_id,
      quantity: parseInt(item.quantity || 1)
    }));
    const inventoryCheck = await settingsService.checkInventoryForOrder(tenantId, inventoryItems);
    if (!inventoryCheck.allowed) {
      return res.status(400).json({
        success: false,
        message: inventoryCheck.reason,
        insufficientItems: inventoryCheck.insufficientItems
      });
    }
    
    // Validate salesman if provided
    if (salesman_id) {
      const salesman = await selectOne('users', { id: salesman_id }, tenantId);
      if (!salesman) {
        return res.status(400).json({ 
          success: false, 
          message: 'Salesman not found' 
        });
      }
    }
    
    // Calculate totals
    let subtotal = 0;
    let tax_amount = 0;
    let discount_amount = 0;
    
    // Validate products and calculate amounts
    for (const item of items) {
      const product = await selectOne('products', { id: item.product_id }, tenantId);
      
      if (!product) {
        return res.status(400).json({ 
          success: false, 
          message: `Product ${item.product_id} not found` 
        });
      }
      
      const quantity = parseInt(item.quantity);
      const unit_price = parseFloat(item.unit_price || product.selling_price);
      const discount_percentage = parseFloat(item.discount_percentage || 0);
      const tax_percentage = parseFloat(item.tax_percentage || product.tax_rate || 0);
      
      const line_subtotal = quantity * unit_price;
      const line_discount = line_subtotal * (discount_percentage / 100);
      const line_taxable = line_subtotal - line_discount;
      const line_tax = line_taxable * (tax_percentage / 100);
      
      subtotal += line_subtotal;
      discount_amount += line_discount;
      tax_amount += line_tax;
      
      // Update item with calculated values
      item.unit_price = unit_price;
      item.discount_percentage = discount_percentage;
      item.tax_percentage = tax_percentage;
      item.line_total = line_taxable + line_tax;
    }
    
    const total_amount = subtotal - discount_amount + tax_amount;
    
    // Check if order requires approval based on settings
    const approvalCheck = await settingsService.orderRequiresApproval(tenantId, total_amount);
    const initialStatus = approvalCheck.required ? 'pending_approval' : 'pending';
    
    // Generate order number
    const order_number = await generateOrderNumber(tenantId);
    
    // Create order
    const orderData = {
      tenant_id: tenantId,
      order_number,
      customer_id,
      salesman_id,
      order_date,
      delivery_date,
      subtotal: subtotal.toFixed(2),
      tax_amount: tax_amount.toFixed(2),
      discount_amount: discount_amount.toFixed(2),
      total_amount: total_amount.toFixed(2),
      payment_method,
      payment_status: 'pending',
      order_status: initialStatus,
      notes,
      requires_approval: approvalCheck.required ? 1 : 0,
      approval_reason: approvalCheck.reason
    };
    
    const newOrder = await insertRow('orders', orderData, tenantId);
    
    // Create order items
    for (const item of items) {
      const itemData = {
        order_id: newOrder.id,
        product_id: item.product_id,
        quantity: parseInt(item.quantity),
        unit_price: parseFloat(item.unit_price),
        discount_percentage: parseFloat(item.discount_percentage || 0),
        tax_percentage: parseFloat(item.tax_percentage || 0),
        line_total: parseFloat(item.line_total)
      };
      
      await insertRow('order_items', itemData, tenantId);
    }
    
    // Get complete order with items
    const completeOrder = await getOrderWithDetails(newOrder.id, tenantId);
    
    // Send order confirmation notification (async, don't block response)
    notificationService.sendOrderConfirmation(tenantId, newOrder.id).catch(err => {
      console.error('Failed to send order confirmation:', err);
    });
    
    // Emit Socket.IO event for real-time update
    const io = req.app.get('io');
    if (io) {
      const { emitNewOrder, emitActivityUpdate } = require('../utils/socketEmitter');
      emitNewOrder(io, tenantId, completeOrder);
      
      // Also emit as activity update
      emitActivityUpdate(io, tenantId, {
        id: completeOrder.id,
        type: 'order',
        reference: completeOrder.order_number,
        description: 'New order created',
        customer_name: completeOrder.customer_name,
        agent_name: completeOrder.salesman_name,
        amount: completeOrder.total_amount,
        status: completeOrder.order_status,
        timestamp: completeOrder.order_date,
        icon: 'Package',
        color: 'green'
      });
    }
    
    res.status(201).json({
      success: true,
      data: { 
        order: completeOrder,
        requiresApproval: approvalCheck.required,
        approvalReason: approvalCheck.reason
      },
      message: approvalCheck.required 
        ? 'Order created and pending approval' 
        : 'Order created successfully'
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Helper function to get order with details
const getOrderWithDetails = async (orderId, tenantId) => {
  const order = await getOneQuery(`
    SELECT o.*, c.name as customer_name, c.phone as customer_phone, c.address as customer_address,
           u.first_name || ' ' || u.last_name as salesman_name
    FROM orders o
    LEFT JOIN customers c ON o.customer_id = c.id
    LEFT JOIN users u ON o.salesman_id = u.id
    WHERE o.id = ? AND o.tenant_id = ?
  `, [orderId, tenantId]);
  
  const items = await getQuery(`
    SELECT oi.*, p.name as product_name, p.code as product_code, p.unit_of_measure
    FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    WHERE oi.order_id = ?
    ORDER BY p.name
  `, [orderId]);
  
  return { ...order, items };
};

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Get an order by ID
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order details
 *       404:
 *         description: Order not found
 */
router.get('/:id', async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;
    
    const order = await getOrderWithDetails(id, tenantId);
    
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found' 
      });
    }
    
    res.json({
      success: true,
      data: { order }
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/orders/{id}:
 *   put:
 *     summary: Update an order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               order_status:
 *                 type: string
 *               payment_status:
 *                 type: string
 *               delivery_date:
 *                 type: string
 *                 format: date
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Order updated successfully
 *       404:
 *         description: Order not found
 */
router.put('/:id', async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;
    const { order_status, payment_status, delivery_date, notes } = req.body;
    
    // Check if order exists
    const existingOrder = await selectOne('orders', { id }, tenantId);
    if (!existingOrder) {
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found' 
      });
    }
    
    // Update order
    const updateData = {};
    if (order_status) updateData.order_status = order_status;
    if (payment_status) updateData.payment_status = payment_status;
    if (delivery_date) updateData.delivery_date = delivery_date;
    if (notes !== undefined) updateData.notes = notes;
    
    await updateRow('orders', updateData, { id }, tenantId);
    
    // Get updated order
    const updatedOrder = await getOrderWithDetails(id, tenantId);
    
    res.json({
      success: true,
      data: { order: updatedOrder },
      message: 'Order updated successfully'
    });
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/orders/{id}:
 *   delete:
 *     summary: Cancel an order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order cancelled successfully
 *       404:
 *         description: Order not found
 */
router.delete('/:id', async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;
    
    // Check if order exists
    const existingOrder = await selectOne('orders', { id }, tenantId);
    if (!existingOrder) {
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found' 
      });
    }
    
    // Check if order can be cancelled
    if (['delivered', 'cancelled'].includes(existingOrder.order_status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Order cannot be cancelled' 
      });
    }
    
    // Cancel order (soft delete)
    await updateRow('orders', { 
      order_status: 'cancelled',
      payment_status: 'cancelled'
    }, { id }, tenantId);
    
    res.json({
      success: true,
      message: 'Order cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.get('/:orderId/items', async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { orderId } = req.params;
    
    const items = await getQuery(`
      SELECT oi.*, p.name as product_name, p.code as product_code, p.sku as product_sku, 
             p.unit_of_measure, p.brand_id,
             (oi.quantity * oi.unit_price) as line_total,
             (oi.quantity * oi.unit_price * (oi.discount_percentage / 100)) as discount_amount,
             ((oi.quantity * oi.unit_price) - (oi.quantity * oi.unit_price * (oi.discount_percentage / 100))) as subtotal,
             ((oi.quantity * oi.unit_price) - (oi.quantity * oi.unit_price * (oi.discount_percentage / 100))) * (oi.tax_percentage / 100) as tax_amount,
             oi.line_total as total
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
      ORDER BY oi.created_at
    `, [orderId]);
    
    res.json({
      success: true,
      data: { items }
    });
  } catch (error) {
    console.error('Error fetching order items:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.get('/:orderId/items/:itemId', async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { orderId, itemId } = req.params;
    
    const item = await getOneQuery(`
      SELECT oi.*, p.name as product_name, p.code as product_code, p.sku as product_sku,
             p.unit_of_measure, p.brand_id,
             (oi.quantity * oi.unit_price) as line_total,
             (oi.quantity * oi.unit_price * (oi.discount_percentage / 100)) as discount_amount,
             ((oi.quantity * oi.unit_price) - (oi.quantity * oi.unit_price * (oi.discount_percentage / 100))) as subtotal,
             ((oi.quantity * oi.unit_price) - (oi.quantity * oi.unit_price * (oi.discount_percentage / 100))) * (oi.tax_percentage / 100) as tax_amount,
             oi.line_total as total,
             COALESCE(oi.fulfilled_quantity, 0) as fulfilled_quantity,
             (oi.quantity - COALESCE(oi.fulfilled_quantity, 0)) as pending_quantity,
             CASE 
               WHEN COALESCE(oi.fulfilled_quantity, 0) = 0 THEN 'pending'
               WHEN COALESCE(oi.fulfilled_quantity, 0) >= oi.quantity THEN 'fulfilled'
               ELSE 'partially_fulfilled'
             END as fulfillment_status
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.id = ? AND oi.order_id = ?
    `, [itemId, orderId]);
    
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Order item not found'
      });
    }
    
    res.json({
      success: true,
      data: { item }
    });
  } catch (error) {
    console.error('Error fetching order item:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.put('/:orderId/items/:itemId', async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { orderId, itemId } = req.params;
    const { quantity, unit_price, discount_percentage, tax_percentage, notes, price_override_reason } = req.body;
    
    const existingItem = await getOneQuery(
      'SELECT * FROM order_items WHERE id = ? AND order_id = ?',
      [itemId, orderId]
    );
    
    if (!existingItem) {
      return res.status(404).json({
        success: false,
        message: 'Order item not found'
      });
    }
    
    const updateData = {};
    if (quantity !== undefined) updateData.quantity = parseInt(quantity);
    if (unit_price !== undefined) updateData.unit_price = parseFloat(unit_price);
    if (discount_percentage !== undefined) updateData.discount_percentage = parseFloat(discount_percentage);
    if (tax_percentage !== undefined) updateData.tax_percentage = parseFloat(tax_percentage);
    if (notes !== undefined) updateData.notes = notes;
    if (price_override_reason !== undefined) updateData.price_override_reason = price_override_reason;
    
    const qty = quantity !== undefined ? parseInt(quantity) : existingItem.quantity;
    const price = unit_price !== undefined ? parseFloat(unit_price) : existingItem.unit_price;
    const discount = discount_percentage !== undefined ? parseFloat(discount_percentage) : existingItem.discount_percentage;
    const tax = tax_percentage !== undefined ? parseFloat(tax_percentage) : existingItem.tax_percentage;
    
    const lineSubtotal = qty * price;
    const lineDiscount = lineSubtotal * (discount / 100);
    const lineTaxable = lineSubtotal - lineDiscount;
    const lineTax = lineTaxable * (tax / 100);
    updateData.line_total = lineTaxable + lineTax;
    
    await runQuery(
      `UPDATE order_items SET ${Object.keys(updateData).map(k => `${k} = ?`).join(', ')}, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ? AND order_id = ?`,
      [...Object.values(updateData), itemId, orderId]
    );
    
    const items = await getQuery('SELECT * FROM order_items WHERE order_id = ?', [orderId]);
    let orderSubtotal = 0;
    let orderTax = 0;
    let orderDiscount = 0;
    
    items.forEach(item => {
      const itemSubtotal = item.quantity * item.unit_price;
      const itemDiscount = itemSubtotal * (item.discount_percentage / 100);
      const itemTaxable = itemSubtotal - itemDiscount;
      const itemTax = itemTaxable * (item.tax_percentage / 100);
      
      orderSubtotal += itemSubtotal;
      orderDiscount += itemDiscount;
      orderTax += itemTax;
    });
    
    const orderTotal = orderSubtotal - orderDiscount + orderTax;
    
    await runQuery(
      `UPDATE orders SET subtotal = ?, discount_amount = ?, tax_amount = ?, total_amount = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [orderSubtotal.toFixed(2), orderDiscount.toFixed(2), orderTax.toFixed(2), orderTotal.toFixed(2), orderId]
    );
    
    const updatedItem = await getOneQuery(`
      SELECT oi.*, p.name as product_name, p.code as product_code, p.sku as product_sku
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.id = ? AND oi.order_id = ?
    `, [itemId, orderId]);
    
    res.json({
      success: true,
      data: { item: updatedItem },
      message: 'Order item updated successfully'
    });
  } catch (error) {
    console.error('Error updating order item:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Additional endpoints for order management
router.get('/customer/:customerId', async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { customerId } = req.params;
    const { limit = 10 } = req.query;
    const orders = await getQuery(`
      SELECT o.*, COUNT(oi.id) as item_count
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.tenant_id = ? AND o.customer_id = ?
      GROUP BY o.id
      ORDER BY o.created_at DESC
      LIMIT ?
    `, [tenantId, customerId, parseInt(limit)]);
    
    res.json({
      success: true,
      data: { orders }
    });
  } catch (error) {
    console.error('Error fetching customer orders:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.get('/salesman/:salesmanId', async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { salesmanId } = req.params;
    const { date_from, date_to, limit = 50 } = req.query;
    let sql = `
      SELECT o.*, c.name as customer_name, COUNT(oi.id) as item_count
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.tenant_id = ? AND o.salesman_id = ?
    `;
    const params = [tenantId, salesmanId];
    
    if (date_from) {
      sql += ` AND o.order_date >= ?`;
      params.push(date_from);
    }
    if (date_to) {
      sql += ` AND o.order_date <= ?`;
      params.push(date_to);
    }
    
    sql += ` GROUP BY o.id, c.name ORDER BY o.created_at DESC LIMIT ?`;
    params.push(parseInt(limit));
    
    const orders = await getQuery(sql, params);
    
    res.json({
      success: true,
      data: { orders }
    });
  } catch (error) {
    console.error('Error fetching salesman orders:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/orders/stats - Order statistics
router.get('/stats', async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    
    const [totalOrdersRow, ordersByStatus, revenueStats, topCustomers] = await Promise.all([
      getOneQuery('SELECT COUNT(*) as count FROM orders WHERE tenant_id = ?', [tenantId]),
      getQuery(`SELECT order_status, COUNT(*) as count, SUM(total_amount) as total_value
                FROM orders WHERE tenant_id = ? GROUP BY order_status`, [tenantId]),
      getOneQuery(`SELECT SUM(total_amount) as total_revenue, AVG(total_amount) as average_order_value
                FROM orders WHERE tenant_id = ?`, [tenantId]),
      getQuery(`SELECT c.id, c.name, COUNT(o.id) as order_count, SUM(o.total_amount) as total_spent
                FROM customers c INNER JOIN orders o ON c.id = o.customer_id
                WHERE o.tenant_id = ? GROUP BY c.id, c.name ORDER BY total_spent DESC LIMIT 10`, [tenantId])
    ]);
    
    const totalOrders = totalOrdersRow.count;
    
    res.json({
      success: true,
      data: { totalOrders, ordersByStatus, revenue: revenueStats, topCustomers }
    });
  } catch (error) {
    console.error('Error fetching order stats:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch order statistics' });
  }
});

// PUT /api/orders/:id/status - Update order status
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const tenantId = req.user.tenantId;
    
    const validStatuses = ['draft', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'completed', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    
    const result = await runQuery('UPDATE orders SET order_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND tenant_id = ?',
      [status, id, tenantId]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    
    res.json({ success: true, message: `Order status updated to ${status}` });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to update order status' });
  }
});

// GET /api/orders/:orderId/deliveries - Get deliveries for an order
router.get('/:orderId/deliveries', async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { orderId } = req.params;
    
    const deliveries = await getQuery(`
      SELECT d.*, u.first_name || ' ' || u.last_name as driver_name, v.registration_number as vehicle_number
      FROM deliveries d
      LEFT JOIN users u ON d.driver_id = u.id
      LEFT JOIN vehicles v ON d.vehicle_id = v.id
      WHERE d.order_id = ? AND d.tenant_id = ?
      ORDER BY d.scheduled_date DESC
    `, [orderId, tenantId]);
    
    res.json({
      success: true,
      data: { deliveries }
    });
  } catch (error) {
    console.error('Error fetching deliveries:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/orders/:orderId/deliveries/:deliveryId - Get delivery detail
router.get('/:orderId/deliveries/:deliveryId', async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { orderId, deliveryId } = req.params;
    
    const delivery = await getOneQuery(`
      SELECT d.*, u.first_name || ' ' || u.last_name as driver_name, v.registration_number as vehicle_number
      FROM deliveries d
      LEFT JOIN users u ON d.driver_id = u.id
      LEFT JOIN vehicles v ON d.vehicle_id = v.id
      WHERE d.id = ? AND d.order_id = ? AND d.tenant_id = ?
    `, [deliveryId, orderId, tenantId]);
    
    res.json({
      success: true,
      data: { delivery }
    });
  } catch (error) {
    console.error('Error fetching delivery:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/orders/:orderId/returns - Get returns for an order
router.get('/:orderId/returns', async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { orderId } = req.params;
    
    const returns = await getQuery(`
      SELECT r.*, u.first_name || ' ' || u.last_name as processed_by_name
      FROM returns r
      LEFT JOIN users u ON r.processed_by = u.id
      WHERE r.order_id = ? AND r.tenant_id = ?
      ORDER BY r.return_date DESC
    `, [orderId, tenantId]);
    
    res.json({
      success: true,
      data: { returns }
    });
  } catch (error) {
    console.error('Error fetching returns:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/orders/:orderId/status-history - Get status history for an order
router.get('/:orderId/status-history', async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { orderId } = req.params;
    
    const statusHistory = await getQuery(`
      SELECT osh.*, u.first_name || ' ' || u.last_name as changed_by_name
      FROM order_status_history osh
      LEFT JOIN users u ON osh.changed_by = u.id
      WHERE osh.order_id = ? AND osh.tenant_id = ?
      ORDER BY osh.changed_at DESC
    `, [orderId, tenantId]);
    
    res.json({
      success: true,
      data: { statusHistory }
    });
  } catch (error) {
    console.error('Error fetching status history:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
