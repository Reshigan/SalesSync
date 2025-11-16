/**
 * Quote Management Routes
 * Handle sales quotes/proposals with line items
 */

const express = require('express');
const router = express.Router();
const { AppError, asyncHandler } = require('../middleware/errorHandler');

/**
 * POST /api/quotes
 * Create a new quote
 */
router.post('/', asyncHandler(async (req, res) => {
  const { runQuery, getOneQuery } = require('../utils/database');
  const tenantId = req.tenantId;
  const {
    customerId,
    quoteNumber,
    title,
    description,
    expiryDate,
    subtotal,
    tax,
    discount,
    total,
    terms,
    notes,
    items = []
  } = req.body;

  if (!customerId || !title || !total) {
    throw new AppError('Customer ID, title, and total are required', 400);
  }

  const quoteDate = new Date().toISOString();
  const status = 'draft';

  // Insert quote
  const result = await runQuery(
    `INSERT INTO quotes (
      tenant_id, customer_id, quote_number, quote_date, expiry_date,
      title, description, subtotal, tax, discount, total, status, terms, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      tenantId,
      customerId,
      quoteNumber || `Q-${Date.now()}`,
      quoteDate,
      expiryDate || null,
      title,
      description || '',
      subtotal || total,
      tax || 0,
      discount || 0,
      total,
      status,
      terms || '',
      notes || ''
    ]
  );

  const quoteId = result.lastID;

  // Insert quote items
  for (const item of items) {
    await runQuery(
      `INSERT INTO quote_items (
        quote_id, product_id, product_name, description,
        quantity, unit_price, discount, tax, total
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        quoteId,
        item.productId || null,
        item.productName,
        item.description || '',
        item.quantity,
        item.unitPrice,
        item.discount || 0,
        item.tax || 0,
        item.total
      ]
    );
  }

  const quote = await getOneQuery(
    'SELECT * FROM quotes WHERE id = ?',
    [quoteId]
  );

  res.json({
    success: true,
    quote
  });
}));

/**
 * GET /api/quotes
 * List all quotes for tenant
 */
router.get('/', asyncHandler(async (req, res) => {
  const { getQuery, getOneQuery } = require('../utils/database');
  const tenantId = req.tenantId;
  const { customerId, status, limit = 50, offset = 0 } = req.query;

  let whereClause = 'WHERE q.tenant_id = ?';
  let params = [tenantId];

  if (customerId) {
    whereClause += ' AND q.customer_id = ?';
    params.push(customerId);
  }

  if (status) {
    whereClause += ' AND q.status = ?';
    params.push(status);
  }

  const quotesQuery = `
    SELECT
      q.*,
      c.name as customer_name
    FROM quotes q
    LEFT JOIN customers c ON q.customer_id = c.id
    ${whereClause}
    ORDER BY q.quote_date DESC
    LIMIT ? OFFSET ?
  `;
  params.push(parseInt(limit), parseInt(offset));

  const quotes = await getQuery(quotesQuery, params);

  const countQuery = `SELECT COUNT(*) as total FROM quotes q ${whereClause}`;
  const countResult = await getOneQuery(countQuery, params.slice(0, -2));
  const total = countResult.total;

  res.json({
    quotes,
    pagination: {
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    }
  });
}));

/**
 * GET /api/quotes/:id
 * Get quote by ID with items
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const { getQuery, getOneQuery } = require('../utils/database');
  const tenantId = req.tenantId;
  const { id } = req.params;

  const quote = await getOneQuery(
    `SELECT
      q.*,
      c.name as customer_name,
      c.email as customer_email,
      c.phone as customer_phone
    FROM quotes q
    LEFT JOIN customers c ON q.customer_id = c.id
    WHERE q.id = ? AND q.tenant_id = ?`,
    [id, tenantId]
  );

  if (!quote) {
    throw new AppError('Quote not found', 404);
  }

  const items = await getQuery(
    'SELECT * FROM quote_items WHERE quote_id = ? ORDER BY id',
    [id]
  );

  quote.items = items;

  res.json(quote);
}));

/**
 * PUT /api/quotes/:id
 * Update quote
 */
router.put('/:id', asyncHandler(async (req, res) => {
  const { runQuery, getOneQuery, getQuery } = require('../utils/database');
  const tenantId = req.tenantId;
  const { id } = req.params;
  const {
    title,
    description,
    expiryDate,
    subtotal,
    tax,
    discount,
    total,
    status,
    terms,
    notes,
    items = []
  } = req.body;

  const existingQuote = await getOneQuery(
    'SELECT * FROM quotes WHERE id = ? AND tenant_id = ?',
    [id, tenantId]
  );

  if (!existingQuote) {
    throw new AppError('Quote not found', 404);
  }

  // Update quote
  await runQuery(
    `UPDATE quotes SET
      title = ?, description = ?, expiry_date = ?,
      subtotal = ?, tax = ?, discount = ?, total = ?,
      status = ?, terms = ?, notes = ?
    WHERE id = ?`,
    [
      title || existingQuote.title,
      description !== undefined ? description : existingQuote.description,
      expiryDate !== undefined ? expiryDate : existingQuote.expiry_date,
      subtotal !== undefined ? subtotal : existingQuote.subtotal,
      tax !== undefined ? tax : existingQuote.tax,
      discount !== undefined ? discount : existingQuote.discount,
      total !== undefined ? total : existingQuote.total,
      status || existingQuote.status,
      terms !== undefined ? terms : existingQuote.terms,
      notes !== undefined ? notes : existingQuote.notes,
      id
    ]
  );

  // Update items if provided
  if (items && items.length > 0) {
    // Delete existing items
    await runQuery('DELETE FROM quote_items WHERE quote_id = ?', [id]);

    // Insert new items
    for (const item of items) {
      await runQuery(
        `INSERT INTO quote_items (
          quote_id, product_id, product_name, description,
          quantity, unit_price, discount, tax, total
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          item.productId || null,
          item.productName,
          item.description || '',
          item.quantity,
          item.unitPrice,
          item.discount || 0,
          item.tax || 0,
          item.total
        ]
      );
    }
  }

  const updatedQuote = await getOneQuery(
    'SELECT * FROM quotes WHERE id = ?',
    [id]
  );

  const quoteItems = await getQuery(
    'SELECT * FROM quote_items WHERE quote_id = ?',
    [id]
  );

  updatedQuote.items = quoteItems;

  res.json({
    success: true,
    quote: updatedQuote
  });
}));

/**
 * POST /api/quotes/:id/send
 * Send quote to customer (mark as sent)
 */
router.post('/:id/send', asyncHandler(async (req, res) => {
  const { runQuery, getOneQuery } = require('../utils/database');
  const tenantId = req.tenantId;
  const { id } = req.params;

  const quote = await getOneQuery(
    'SELECT * FROM quotes WHERE id = ? AND tenant_id = ?',
    [id, tenantId]
  );

  if (!quote) {
    throw new AppError('Quote not found', 404);
  }

  await runQuery(
    `UPDATE quotes SET status = 'sent' WHERE id = ?`,
    [id]
  );

  const updatedQuote = await getOneQuery(
    'SELECT * FROM quotes WHERE id = ?',
    [id]
  );

  res.json({
    success: true,
    quote: updatedQuote
  });
}));

/**
 * POST /api/quotes/:id/accept
 * Accept quote (convert to order/invoice)
 */
router.post('/:id/accept', asyncHandler(async (req, res) => {
  const { runQuery, getOneQuery } = require('../utils/database');
  const tenantId = req.tenantId;
  const { id } = req.params;

  const quote = await getOneQuery(
    'SELECT * FROM quotes WHERE id = ? AND tenant_id = ?',
    [id, tenantId]
  );

  if (!quote) {
    throw new AppError('Quote not found', 404);
  }

  await runQuery(
    `UPDATE quotes SET status = 'accepted' WHERE id = ?`,
    [id]
  );

  const updatedQuote = await getOneQuery(
    'SELECT * FROM quotes WHERE id = ?',
    [id]
  );

  res.json({
    success: true,
    quote: updatedQuote,
    message: 'Quote accepted successfully'
  });
}));

/**
 * POST /api/quotes/:id/reject
 * Reject quote
 */
router.post('/:id/reject', asyncHandler(async (req, res) => {
  const { runQuery, getOneQuery } = require('../utils/database');
  const tenantId = req.tenantId;
  const { id } = req.params;
  const { reason } = req.body;

  const quote = await getOneQuery(
    'SELECT * FROM quotes WHERE id = ? AND tenant_id = ?',
    [id, tenantId]
  );

  if (!quote) {
    throw new AppError('Quote not found', 404);
  }

  await runQuery(
    `UPDATE quotes 
     SET status = 'rejected',
         notes = COALESCE(notes, '') || '\nRejected: ' || ?
     WHERE id = ?`,
    [reason || 'No reason provided', id]
  );

  const updatedQuote = await getOneQuery(
    'SELECT * FROM quotes WHERE id = ?',
    [id]
  );

  res.json({
    success: true,
    quote: updatedQuote
  });
}));

/**
 * DELETE /api/quotes/:id
 * Delete quote
 */
router.delete('/:id', asyncHandler(async (req, res) => {
  const { runQuery, getOneQuery } = require('../utils/database');
  const tenantId = req.tenantId;
  const { id } = req.params;

  const quote = await getOneQuery(
    'SELECT * FROM quotes WHERE id = ? AND tenant_id = ?',
    [id, tenantId]
  );

  if (!quote) {
    throw new AppError('Quote not found', 404);
  }

  // Delete quote items first
  await runQuery('DELETE FROM quote_items WHERE quote_id = ?', [id]);
  
  // Delete quote
  await runQuery('DELETE FROM quotes WHERE id = ?', [id]);

  res.json({
    success: true,
    message: 'Quote deleted successfully'
  });
}));

module.exports = router;
