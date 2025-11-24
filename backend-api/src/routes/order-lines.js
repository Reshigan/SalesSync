const express = require('express');
const router = express.Router();
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const { authMiddleware } = require('../middleware/authMiddleware');

/**
 * @swagger
 * /api/order-lines:
 *   get:
 *     summary: Get all order lines
 *     tags: [Order Lines]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: order_id
 *         schema:
 *           type: string
 *         description: Filter by order ID
 *     responses:
 *       200:
 *         description: Order lines retrieved successfully
 */
router.get('/', authMiddleware, asyncHandler(async (req, res) => {
  const { getQuery } = require('../utils/database');
  
  const { order_id } = req.query;
  
  let query = `
    SELECT 
      ol.*,
      p.name as product_name,
      p.code as product_sku,
      p.unit_of_measure as product_unit
    FROM order_lines ol
    JOIN products p ON p.id = ol.product_id
    WHERE ol.tenant_id = $1
  `;
  
  const params = [req.tenantId];
  
  if (order_id) {
    query += ` AND ol.order_id = $2`;
    params.push(order_id);
  }
  
  query += ` ORDER BY ol.created_at DESC`;
  
  const orderLines = await getQuery(query, params);
  
  res.json({
    success: true,
    data: orderLines
  });
}));

/**
 * @swagger
 * /api/order-lines/{id}:
 *   get:
 *     summary: Get order line by ID
 *     tags: [Order Lines]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order line retrieved successfully
 */
router.get('/:id', authMiddleware, asyncHandler(async (req, res) => {
  const { getOneQuery } = require('../utils/database');
  
  const { id } = req.params;
  
  const orderLine = await getOneQuery(`
    SELECT 
      ol.*,
      p.name as product_name,
      p.code as product_sku,
      p.unit_of_measure as product_unit,
      p.selling_price as product_price
    FROM order_lines ol
    JOIN products p ON p.id = ol.product_id
    WHERE ol.id = $1 AND ol.tenant_id = $2
  `, [id, req.tenantId]);
  
  if (!orderLine) {
    throw new AppError('Order line not found', 404);
  }
  
  res.json({
    success: true,
    data: orderLine
  });
}));

/**
 * @swagger
 * /api/order-lines:
 *   post:
 *     summary: Create new order line
 *     tags: [Order Lines]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - order_id
 *               - product_id
 *               - quantity
 *             properties:
 *               order_id:
 *                 type: string
 *               product_id:
 *                 type: string
 *               quantity:
 *                 type: number
 *               unit_price:
 *                 type: number
 *               discount_percent:
 *                 type: number
 *               tax_rate:
 *                 type: number
 *     responses:
 *       201:
 *         description: Order line created successfully
 */
router.post('/', authMiddleware, asyncHandler(async (req, res) => {
  const { getOneQuery, insertQuery, runQuery } = require('../utils/database');
  
  const {
    order_id,
    product_id,
    quantity,
    unit_price,
    discount_percent = 0,
    tax_rate = 0,
    notes
  } = req.body;
  
  if (!order_id || !product_id || !quantity) {
    throw new AppError('Order ID, product ID, and quantity are required', 400);
  }
  
  const product = await getOneQuery(`
    SELECT id, name, selling_price
    FROM products
    WHERE id = $1 AND tenant_id = $2
  `, [product_id, req.tenantId]);
  
  if (!product) {
    throw new AppError('Product not found', 404);
  }
  
  const finalUnitPrice = unit_price || product.selling_price || 0;
  const subtotal = finalUnitPrice * quantity;
  const discountAmount = subtotal * (discount_percent / 100);
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = taxableAmount * (tax_rate / 100);
  const lineTotal = taxableAmount + taxAmount;
  
  const result = await getOneQuery(`
    INSERT INTO order_lines (
      tenant_id, order_id, product_id, quantity, unit_price,
      discount_percent, discount_amount, tax_rate, tax_amount,
      line_total, notes
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *
  `, [
    req.tenantId, order_id, product_id, quantity, finalUnitPrice,
    discount_percent, discountAmount, tax_rate, taxAmount,
    lineTotal, notes
  ]);
  
  await runQuery(`
    UPDATE orders
    SET 
      total_amount = (
        SELECT COALESCE(SUM(line_total), 0)
        FROM order_lines
        WHERE order_id = $1
      ),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $1 AND tenant_id = $2
  `, [order_id, req.tenantId]);
  
  res.status(201).json({
    success: true,
    data: result
  });
}));

/**
 * @swagger
 * /api/order-lines/{id}:
 *   put:
 *     summary: Update order line
 *     tags: [Order Lines]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Order line updated successfully
 */
router.put('/:id', authMiddleware, asyncHandler(async (req, res) => {
  const { getOneQuery, runQuery } = require('../utils/database');
  
  const { id } = req.params;
  const {
    quantity,
    unit_price,
    discount_percent = 0,
    tax_rate = 0,
    notes
  } = req.body;
  
  const existing = await getOneQuery(`
    SELECT * FROM order_lines
    WHERE id = $1 AND tenant_id = $2
  `, [id, req.tenantId]);
  
  if (!existing) {
    throw new AppError('Order line not found', 404);
  }
  
  const finalQuantity = quantity !== undefined ? quantity : existing.quantity;
  const finalUnitPrice = unit_price !== undefined ? unit_price : existing.unit_price;
  const finalDiscountPercent = discount_percent !== undefined ? discount_percent : existing.discount_percent;
  const finalTaxRate = tax_rate !== undefined ? tax_rate : existing.tax_rate;
  
  const subtotal = finalUnitPrice * finalQuantity;
  const discountAmount = subtotal * (finalDiscountPercent / 100);
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = taxableAmount * (finalTaxRate / 100);
  const lineTotal = taxableAmount + taxAmount;
  
  const updated = await getOneQuery(`
    UPDATE order_lines
    SET
      quantity = $1,
      unit_price = $2,
      discount_percent = $3,
      discount_amount = $4,
      tax_rate = $5,
      tax_amount = $6,
      line_total = $7,
      notes = $8,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $9 AND tenant_id = $10
    RETURNING *
  `, [
    finalQuantity, finalUnitPrice, finalDiscountPercent, discountAmount,
    finalTaxRate, taxAmount, lineTotal, notes || existing.notes,
    id, req.tenantId
  ]);
  
  await runQuery(`
    UPDATE orders
    SET 
      total_amount = (
        SELECT COALESCE(SUM(line_total), 0)
        FROM order_lines
        WHERE order_id = $1
      ),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $1 AND tenant_id = $2
  `, [existing.order_id, req.tenantId]);
  
  res.json({
    success: true,
    data: updated
  });
}));

/**
 * @swagger
 * /api/order-lines/{id}:
 *   delete:
 *     summary: Delete order line
 *     tags: [Order Lines]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order line deleted successfully
 */
router.delete('/:id', authMiddleware, asyncHandler(async (req, res) => {
  const { getOneQuery, runQuery } = require('../utils/database');
  
  const { id } = req.params;
  
  const orderLine = await getOneQuery(`
    SELECT order_id FROM order_lines
    WHERE id = $1 AND tenant_id = $2
  `, [id, req.tenantId]);
  
  if (!orderLine) {
    throw new AppError('Order line not found', 404);
  }
  
  await runQuery(`
    DELETE FROM order_lines
    WHERE id = $1 AND tenant_id = $2
  `, [id, req.tenantId]);
  
  await runQuery(`
    UPDATE orders
    SET 
      total_amount = (
        SELECT COALESCE(SUM(line_total), 0)
        FROM order_lines
        WHERE order_id = $1
      ),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $1 AND tenant_id = $2
  `, [orderLine.order_id, req.tenantId]);
  
  res.json({
    success: true,
    message: 'Order line deleted successfully'
  });
}));

module.exports = router;
