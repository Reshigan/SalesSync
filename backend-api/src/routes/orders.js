const express = require('express');
const router = express.Router();

// Lazy load database functions to avoid circular dependencies
const getDatabase = () => require('../database/database');
const { getQuery, getOneQuery, insertQuery, updateQuery, deleteQuery } = (() => {
  try {
    return require('../database/queries');
  } catch (error) {
    console.warn('Queries module not found, using fallback functions');
    return {
      getQuery: (table, conditions = {}, tenantId) => {
        const db = getDatabase();
        return new Promise((resolve, reject) => {
          let sql = `SELECT * FROM ${table}`;
          const params = [];
          
          if (tenantId) {
            sql += ' WHERE tenant_id = ?';
            params.push(tenantId);
          }
          
          Object.keys(conditions).forEach((key, index) => {
            sql += tenantId ? ' AND' : ' WHERE';
            sql += ` ${key} = ?`;
            params.push(conditions[key]);
          });
          
          db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
          });
        });
      },
      getOneQuery: (table, conditions, tenantId) => {
        const db = getDatabase();
        return new Promise((resolve, reject) => {
          let sql = `SELECT * FROM ${table}`;
          const params = [];
          
          if (tenantId) {
            sql += ' WHERE tenant_id = ?';
            params.push(tenantId);
          }
          
          Object.keys(conditions).forEach((key, index) => {
            sql += tenantId ? ' AND' : ' WHERE';
            sql += ` ${key} = ?`;
            params.push(conditions[key]);
          });
          
          sql += ' LIMIT 1';
          
          db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
          });
        });
      },
      insertQuery: (table, data) => {
        const db = getDatabase();
        return new Promise((resolve, reject) => {
          const keys = Object.keys(data);
          const values = Object.values(data);
          const placeholders = keys.map(() => '?').join(', ');
          
          const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`;
          
          db.run(sql, values, function(err) {
            if (err) reject(err);
            else resolve({ id: this.lastID, changes: this.changes });
          });
        });
      },
      updateQuery: (table, data, conditions, tenantId) => {
        const db = getDatabase();
        return new Promise((resolve, reject) => {
          const setClause = Object.keys(data).map(key => `${key} = ?`).join(', ');
          const values = Object.values(data);
          
          let sql = `UPDATE ${table} SET ${setClause}`;
          
          if (tenantId) {
            sql += ' WHERE tenant_id = ?';
            values.push(tenantId);
          }
          
          Object.keys(conditions).forEach((key, index) => {
            sql += tenantId ? ' AND' : ' WHERE';
            sql += ` ${key} = ?`;
            values.push(conditions[key]);
          });
          
          db.run(sql, values, function(err) {
            if (err) reject(err);
            else resolve({ changes: this.changes });
          });
        });
      },
      deleteQuery: (table, conditions, tenantId) => {
        const db = getDatabase();
        return new Promise((resolve, reject) => {
          let sql = `DELETE FROM ${table}`;
          const params = [];
          
          if (tenantId) {
            sql += ' WHERE tenant_id = ?';
            params.push(tenantId);
          }
          
          Object.keys(conditions).forEach((key, index) => {
            sql += tenantId ? ' AND' : ' WHERE';
            sql += ` ${key} = ?`;
            params.push(conditions[key]);
          });
          
          db.run(sql, params, function(err) {
            if (err) reject(err);
            else resolve({ changes: this.changes });
          });
        });
      }
    };
  }
})();

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
  const db = getDatabase();
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  
  return new Promise((resolve, reject) => {
    db.get(`
      SELECT COUNT(*) as count 
      FROM orders 
      WHERE tenant_id = ? AND DATE(created_at) = DATE('now')
    `, [tenantId], (err, row) => {
      if (err) reject(err);
      else {
        const sequence = String(row.count + 1).padStart(4, '0');
        resolve(`ORD-${today}-${sequence}`);
      }
    });
  });
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
    
    const db = getDatabase();
    let sql = `
      SELECT o.*, c.name as customer_name, c.phone as customer_phone,
             u.first_name || ' ' || u.last_name as salesman_name,
             COUNT(oi.id) as item_count
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN agents a ON o.salesman_id = a.id
      LEFT JOIN users u ON a.user_id = u.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.tenant_id = ?
    `;
    const params = [tenantId];
    
    // Apply filters
    if (customer_id) {
      sql += ' AND o.customer_id = ?';
      params.push(customer_id);
    }
    if (salesman_id) {
      sql += ' AND o.salesman_id = ?';
      params.push(salesman_id);
    }
    if (order_status) {
      sql += ' AND o.order_status = ?';
      params.push(order_status);
    }
    if (payment_status) {
      sql += ' AND o.payment_status = ?';
      params.push(payment_status);
    }
    if (date_from) {
      sql += ' AND o.order_date >= ?';
      params.push(date_from);
    }
    if (date_to) {
      sql += ' AND o.order_date <= ?';
      params.push(date_to);
    }
    
    sql += ` 
      GROUP BY o.id 
      ORDER BY o.created_at DESC 
      LIMIT ? OFFSET ?
    `;
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));
    
    const orders = await new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    // Get total count
    let countSql = 'SELECT COUNT(*) as count FROM orders WHERE tenant_id = ?';
    const countParams = [tenantId];
    
    if (customer_id) {
      countSql += ' AND customer_id = ?';
      countParams.push(customer_id);
    }
    if (salesman_id) {
      countSql += ' AND salesman_id = ?';
      countParams.push(salesman_id);
    }
    if (order_status) {
      countSql += ' AND order_status = ?';
      countParams.push(order_status);
    }
    if (payment_status) {
      countSql += ' AND payment_status = ?';
      countParams.push(payment_status);
    }
    if (date_from) {
      countSql += ' AND order_date >= ?';
      countParams.push(date_from);
    }
    if (date_to) {
      countSql += ' AND order_date <= ?';
      countParams.push(date_to);
    }
    
    const totalCount = await new Promise((resolve, reject) => {
      db.get(countSql, countParams, (err, row) => {
        if (err) reject(err);
        else resolve(row.count);
      });
    });
    
    // Get summary statistics
    const stats = await new Promise((resolve, reject) => {
      db.get(`
        SELECT 
          COUNT(*) as total_orders,
          SUM(CASE WHEN order_status = 'pending' THEN 1 ELSE 0 END) as pending_orders,
          SUM(CASE WHEN order_status = 'confirmed' THEN 1 ELSE 0 END) as confirmed_orders,
          SUM(CASE WHEN order_status = 'delivered' THEN 1 ELSE 0 END) as delivered_orders,
          SUM(total_amount) as total_value,
          AVG(total_amount) as average_order_value
        FROM orders 
        WHERE tenant_id = ? AND DATE(order_date) = DATE('now')
      `, [tenantId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
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
    const customer = await getOneQuery('customers', { id: customer_id }, tenantId);
    if (!customer) {
      return res.status(400).json({ 
        success: false, 
        message: 'Customer not found' 
      });
    }
    
    // Validate salesman if provided
    if (salesman_id) {
      const salesman = await getOneQuery('agents', { id: salesman_id }, tenantId);
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
    
    const db = getDatabase();
    
    // Validate products and calculate amounts
    for (const item of items) {
      const product = await new Promise((resolve, reject) => {
        db.get('SELECT * FROM products WHERE id = ? AND tenant_id = ?', 
          [item.product_id, tenantId], (err, row) => {
            if (err) reject(err);
            else resolve(row);
          });
      });
      
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
      order_status: 'pending',
      notes
    };
    
    const orderResult = await insertQuery('orders', orderData);
    
    // Get the order ID from the result
    const newOrder = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM orders WHERE order_number = ? AND tenant_id = ?', 
        [order_number, tenantId], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
    });
    
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
      
      await insertQuery('order_items', itemData);
    }
    
    // Get complete order with items
    const completeOrder = await getOrderWithDetails(newOrder.id, tenantId);
    
    res.status(201).json({
      success: true,
      data: { order: completeOrder },
      message: 'Order created successfully'
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Helper function to get order with details
const getOrderWithDetails = async (orderId, tenantId) => {
  const db = getDatabase();
  
  const order = await new Promise((resolve, reject) => {
    db.get(`
      SELECT o.*, c.name as customer_name, c.phone as customer_phone, c.address as customer_address,
             u.first_name || ' ' || u.last_name as salesman_name
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN agents a ON o.salesman_id = a.id
      LEFT JOIN users u ON a.user_id = u.id
      WHERE o.id = ? AND o.tenant_id = ?
    `, [orderId, tenantId], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
  
  const items = await new Promise((resolve, reject) => {
    db.all(`
      SELECT oi.*, p.name as product_name, p.code as product_code, p.unit_of_measure
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
      ORDER BY p.name
    `, [orderId], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
  
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
    const existingOrder = await getOneQuery('orders', { id }, tenantId);
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
    
    await updateQuery('orders', updateData, { id }, tenantId);
    
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
    const existingOrder = await getOneQuery('orders', { id }, tenantId);
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
    await updateQuery('orders', { 
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

// Additional endpoints for order management
router.get('/customer/:customerId', async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { customerId } = req.params;
    const { limit = 10 } = req.query;
    
    const db = getDatabase();
    const orders = await new Promise((resolve, reject) => {
      db.all(`
        SELECT o.*, COUNT(oi.id) as item_count
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        WHERE o.tenant_id = ? AND o.customer_id = ?
        GROUP BY o.id
        ORDER BY o.created_at DESC
        LIMIT ?
      `, [tenantId, customerId, parseInt(limit)], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
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
    
    const db = getDatabase();
    let sql = `
      SELECT o.*, c.name as customer_name, COUNT(oi.id) as item_count
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.tenant_id = ? AND o.salesman_id = ?
    `;
    const params = [tenantId, salesmanId];
    
    if (date_from) {
      sql += ' AND o.order_date >= ?';
      params.push(date_from);
    }
    if (date_to) {
      sql += ' AND o.order_date <= ?';
      params.push(date_to);
    }
    
    sql += ` GROUP BY o.id ORDER BY o.created_at DESC LIMIT ?`;
    params.push(parseInt(limit));
    
    const orders = await new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    res.json({
      success: true,
      data: { orders }
    });
  } catch (error) {
    console.error('Error fetching salesman orders:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
