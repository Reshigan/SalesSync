const express = require('express');
const router = express.Router();
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const { authMiddleware } = require('../middleware/authMiddleware');

/**
 * @swagger
 * /api/pricing/price-lists:
 *   get:
 *     summary: Get all price lists
 *     tags: [Pricing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: customer_type
 *         schema:
 *           type: string
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Price lists retrieved successfully
 */
router.get('/price-lists', authMiddleware, asyncHandler(async (req, res) => {
  const { getQuery } = require('../utils/database');
  
  const { customer_type, is_active } = req.query;
  
  let whereConditions = ['pl.tenant_id = $1'];
  let params = [req.tenantId];
  let paramIndex = 2;
  
  if (customer_type) {
    whereConditions.push(`pl.customer_type = $${paramIndex}`);
    params.push(customer_type);
    paramIndex++;
  }
  
  if (is_active !== undefined) {
    whereConditions.push(`pl.is_active = $${paramIndex}`);
    params.push(is_active === 'true');
    paramIndex++;
  }
  
  const priceLists = await getQuery(`
    SELECT 
      pl.*,
      r.name as region_name,
      a.name as area_name,
      u.first_name || ' ' || u.last_name as created_by_name,
      (SELECT COUNT(*) FROM price_list_items WHERE price_list_id = pl.id) as item_count
    FROM price_lists pl
    LEFT JOIN regions r ON r.id = pl.region_id
    LEFT JOIN areas a ON a.id = pl.area_id
    LEFT JOIN users u ON u.id = pl.created_by
    WHERE ${whereConditions.join(' AND ')}
    ORDER BY pl.priority DESC, pl.created_at DESC
  `, params);
  
  res.json({
    success: true,
    data: priceLists
  });
}));

/**
 * @swagger
 * /api/pricing/price-lists/{id}:
 *   get:
 *     summary: Get a single price list with items
 *     tags: [Pricing]
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
 *         description: Price list retrieved successfully
 */
router.get('/price-lists/:id', authMiddleware, asyncHandler(async (req, res) => {
  const { getOneQuery, getQuery } = require('../utils/database');
  
  const { id } = req.params;
  
  const priceList = await getOneQuery(`
    SELECT 
      pl.*,
      r.name as region_name,
      a.name as area_name,
      u.first_name || ' ' || u.last_name as created_by_name
    FROM price_lists pl
    LEFT JOIN regions r ON r.id = pl.region_id
    LEFT JOIN areas a ON a.id = pl.area_id
    LEFT JOIN users u ON u.id = pl.created_by
    WHERE pl.id = $1 AND pl.tenant_id = $2
  `, [id, req.tenantId]);
  
  if (!priceList) {
    throw new AppError('Price list not found', 404);
  }
  
  const items = await getQuery(`
    SELECT 
      pli.*,
      p.name as product_name,
      p.code as product_code,
      p.selling_price as standard_price
    FROM price_list_items pli
    JOIN products p ON p.id = pli.product_id
    WHERE pli.price_list_id = $1
    ORDER BY p.name, pli.min_quantity
  `, [id]);
  
  res.json({
    success: true,
    data: {
      ...priceList,
      items
    }
  });
}));

/**
 * @swagger
 * /api/pricing/price-lists:
 *   post:
 *     summary: Create a new price list
 *     tags: [Pricing]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - code
 *             properties:
 *               name:
 *                 type: string
 *               code:
 *                 type: string
 *               description:
 *                 type: string
 *               customer_type:
 *                 type: string
 *               region_id:
 *                 type: string
 *               area_id:
 *                 type: string
 *               channel:
 *                 type: string
 *               currency:
 *                 type: string
 *               effective_start:
 *                 type: string
 *                 format: date
 *               effective_end:
 *                 type: string
 *                 format: date
 *               is_active:
 *                 type: boolean
 *               priority:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Price list created successfully
 */
router.post('/price-lists', authMiddleware, asyncHandler(async (req, res) => {
  const { runQuery } = require('../utils/database');
  
  const {
    name,
    code,
    description,
    customer_type,
    region_id,
    area_id,
    channel,
    currency = 'USD',
    effective_start,
    effective_end,
    is_active = true,
    priority = 0
  } = req.body;
  
  if (!name || !code) {
    throw new AppError('Name and code are required', 400);
  }
  
  const result = await runQuery(`
    INSERT INTO price_lists (
      tenant_id, name, code, description, customer_type, region_id, area_id,
      channel, currency, effective_start, effective_end, is_active, priority, created_by
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    RETURNING *
  `, [
    req.tenantId, name, code, description, customer_type, region_id, area_id,
    channel, currency, effective_start, effective_end, is_active, priority, req.userId
  ]);
  
  res.status(201).json({
    success: true,
    data: result.rows[0]
  });
}));

/**
 * @swagger
 * /api/pricing/price-lists/{id}:
 *   put:
 *     summary: Update a price list
 *     tags: [Pricing]
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
 *         description: Price list updated successfully
 */
router.put('/price-lists/:id', authMiddleware, asyncHandler(async (req, res) => {
  const { runQuery, getOneQuery } = require('../utils/database');
  
  const { id } = req.params;
  const {
    name,
    description,
    customer_type,
    region_id,
    area_id,
    channel,
    currency,
    effective_start,
    effective_end,
    is_active,
    priority
  } = req.body;
  
  const existing = await getOneQuery(`
    SELECT id FROM price_lists WHERE id = $1 AND tenant_id = $2
  `, [id, req.tenantId]);
  
  if (!existing) {
    throw new AppError('Price list not found', 404);
  }
  
  const result = await runQuery(`
    UPDATE price_lists SET
      name = COALESCE($1, name),
      description = COALESCE($2, description),
      customer_type = COALESCE($3, customer_type),
      region_id = COALESCE($4, region_id),
      area_id = COALESCE($5, area_id),
      channel = COALESCE($6, channel),
      currency = COALESCE($7, currency),
      effective_start = COALESCE($8, effective_start),
      effective_end = COALESCE($9, effective_end),
      is_active = COALESCE($10, is_active),
      priority = COALESCE($11, priority)
    WHERE id = $12 AND tenant_id = $13
    RETURNING *
  `, [
    name, description, customer_type, region_id, area_id, channel, currency,
    effective_start, effective_end, is_active, priority, id, req.tenantId
  ]);
  
  res.json({
    success: true,
    data: result.rows[0]
  });
}));

/**
 * @swagger
 * /api/pricing/price-lists/{id}:
 *   delete:
 *     summary: Delete a price list
 *     tags: [Pricing]
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
 *         description: Price list deleted successfully
 */
router.delete('/price-lists/:id', authMiddleware, asyncHandler(async (req, res) => {
  const { runQuery, getOneQuery } = require('../utils/database');
  
  const { id } = req.params;
  
  const existing = await getOneQuery(`
    SELECT id FROM price_lists WHERE id = $1 AND tenant_id = $2
  `, [id, req.tenantId]);
  
  if (!existing) {
    throw new AppError('Price list not found', 404);
  }
  
  await runQuery(`
    DELETE FROM price_lists WHERE id = $1 AND tenant_id = $2
  `, [id, req.tenantId]);
  
  res.json({
    success: true,
    message: 'Price list deleted successfully'
  });
}));

/**
 * @swagger
 * /api/pricing/price-lists/{id}/items:
 *   post:
 *     summary: Add items to a price list
 *     tags: [Pricing]
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
 *             required:
 *               - items
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - product_id
 *                     - price
 *                   properties:
 *                     product_id:
 *                       type: string
 *                     price:
 *                       type: number
 *                     min_quantity:
 *                       type: integer
 *                     max_quantity:
 *                       type: integer
 *                     discount_percentage:
 *                       type: number
 *     responses:
 *       201:
 *         description: Items added successfully
 */
router.post('/price-lists/:id/items', authMiddleware, asyncHandler(async (req, res) => {
  const { runQuery, getOneQuery } = require('../utils/database');
  
  const { id } = req.params;
  const { items } = req.body;
  
  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new AppError('Items array is required', 400);
  }
  
  const priceList = await getOneQuery(`
    SELECT id FROM price_lists WHERE id = $1 AND tenant_id = $2
  `, [id, req.tenantId]);
  
  if (!priceList) {
    throw new AppError('Price list not found', 404);
  }
  
  const insertedItems = [];
  
  for (const item of items) {
    const { product_id, price, min_quantity = 1, max_quantity, discount_percentage } = item;
    
    if (!product_id || !price) {
      continue;
    }
    
    const result = await runQuery(`
      INSERT INTO price_list_items (
        price_list_id, product_id, price, min_quantity, max_quantity, discount_percentage
      ) VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (price_list_id, product_id, min_quantity) 
      DO UPDATE SET price = $3, max_quantity = $5, discount_percentage = $6
      RETURNING *
    `, [id, product_id, price, min_quantity, max_quantity, discount_percentage]);
    
    insertedItems.push(result.rows[0]);
  }
  
  res.status(201).json({
    success: true,
    data: insertedItems
  });
}));

/**
 * @swagger
 * /api/pricing/quote:
 *   get:
 *     summary: Get pricing quote for a product
 *     tags: [Pricing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: product_id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: customer_id
 *         schema:
 *           type: string
 *       - in: query
 *         name: quantity
 *         schema:
 *           type: number
 *           default: 1
 *     responses:
 *       200:
 *         description: Pricing quote retrieved successfully
 */
router.get('/quote', authMiddleware, asyncHandler(async (req, res) => {
  const { getOneQuery } = require('../utils/database');
  
  const { product_id, customer_id, quantity = 1 } = req.query;
  
  if (!product_id) {
    throw new AppError('Product ID is required', 400);
  }
  
  const product = await getOneQuery(`
    SELECT id, name, code as sku, selling_price, cost_price, unit_of_measure as unit, tax_rate
    FROM products
    WHERE id = $1 AND tenant_id = $2
  `, [product_id, req.tenantId]);
  
  if (!product) {
    throw new AppError('Product not found', 404);
  }
  
  let unitPrice = product.selling_price;
  let priceSource = 'standard';
  
  if (customer_id) {
    const customer = await getOneQuery(`
      SELECT id, price_list_id
      FROM customers
      WHERE id = $1 AND tenant_id = $2
    `, [customer_id, req.tenantId]);
    
    if (customer && customer.price_list_id) {
      const priceListItem = await getOneQuery(`
        SELECT pli.price, pli.min_quantity
        FROM price_list_items pli
        JOIN price_lists pl ON pl.id = pli.price_list_id
        WHERE pli.price_list_id = $1
        AND pli.product_id = $2
        AND pli.min_quantity <= $3
        AND pl.is_active = true
        AND (pl.effective_end IS NULL OR pl.effective_end >= CURRENT_DATE)
        ORDER BY pli.min_quantity DESC
        LIMIT 1
      `, [customer.price_list_id, product_id, quantity]);
      
      if (priceListItem) {
        unitPrice = priceListItem.price;
        priceSource = 'price_list';
      }
    }
  }
  
  // Calculate totals
  const subtotal = unitPrice * quantity;
  const taxRate = product.tax_rate || 0;
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;
  
  res.json({
    success: true,
    data: {
      product_id: product.id,
      product_name: product.name,
      product_sku: product.sku,
      unit: product.unit,
      quantity: parseFloat(quantity),
      unit_price: parseFloat(unitPrice),
      price_source: priceSource,
      subtotal: parseFloat(subtotal.toFixed(2)),
      tax_rate: parseFloat(taxRate),
      tax_amount: parseFloat(taxAmount.toFixed(2)),
      total: parseFloat(total.toFixed(2))
    }
  });
}));

/**
 * @swagger
 * /api/pricing/bulk-quote:
 *   post:
 *     summary: Get pricing quotes for multiple products
 *     tags: [Pricing]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *             properties:
 *               customer_id:
 *                 type: string
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - product_id
 *                     - quantity
 *                   properties:
 *                     product_id:
 *                       type: string
 *                     quantity:
 *                       type: number
 *     responses:
 *       200:
 *         description: Bulk pricing quotes retrieved successfully
 */
router.post('/bulk-quote', authMiddleware, asyncHandler(async (req, res) => {
  const { getOneQuery } = require('../utils/database');
  
  const { customer_id, items } = req.body;
  
  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new AppError('Items array is required', 400);
  }
  
  const quotes = [];
  let grandTotal = 0;
  let grandTax = 0;
  
  for (const item of items) {
    const { product_id, quantity = 1 } = item;
    
    if (!product_id) {
      continue;
    }
    
    const product = await getOneQuery(`
      SELECT id, name, code as sku, selling_price, cost_price, unit_of_measure as unit, tax_rate
      FROM products
      WHERE id = $1 AND tenant_id = $2
    `, [product_id, req.tenantId]);
    
    if (!product) {
      continue;
    }
    
    let unitPrice = product.selling_price;
    let priceSource = 'standard';
    
    if (customer_id) {
      const customer = await getOneQuery(`
        SELECT id, price_list_id
        FROM customers
        WHERE id = $1 AND tenant_id = $2
      `, [customer_id, req.tenantId]);
      
      if (customer && customer.price_list_id) {
        const priceListItem = await getOneQuery(`
          SELECT pli.price, pli.min_quantity
          FROM price_list_items pli
          JOIN price_lists pl ON pl.id = pli.price_list_id
          WHERE pli.price_list_id = $1
          AND pli.product_id = $2
          AND pli.min_quantity <= $3
          AND pl.is_active = true
          AND (pl.effective_end IS NULL OR pl.effective_end >= CURRENT_DATE)
          ORDER BY pli.min_quantity DESC
          LIMIT 1
        `, [customer.price_list_id, product_id, quantity]);
        
        if (priceListItem) {
          unitPrice = priceListItem.price;
          priceSource = 'price_list';
        }
      }
    }
    
    // Calculate totals
    const subtotal = unitPrice * quantity;
    const taxRate = product.tax_rate || 0;
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount;
    
    grandTotal += total;
    grandTax += taxAmount;
    
    quotes.push({
      product_id: product.id,
      product_name: product.name,
      product_sku: product.sku,
      unit: product.unit,
      quantity: parseFloat(quantity),
      unit_price: parseFloat(unitPrice),
      price_source: priceSource,
      subtotal: parseFloat(subtotal.toFixed(2)),
      tax_rate: parseFloat(taxRate),
      tax_amount: parseFloat(taxAmount.toFixed(2)),
      total: parseFloat(total.toFixed(2))
    });
  }
  
  res.json({
    success: true,
    data: {
      items: quotes,
      summary: {
        item_count: quotes.length,
        subtotal: parseFloat((grandTotal - grandTax).toFixed(2)),
        tax_amount: parseFloat(grandTax.toFixed(2)),
        total: parseFloat(grandTotal.toFixed(2))
      }
    }
  });
}));

module.exports = router;
