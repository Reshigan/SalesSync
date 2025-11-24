const express = require('express');
const router = express.Router();
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const { authMiddleware } = require('../middleware/authMiddleware');

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
