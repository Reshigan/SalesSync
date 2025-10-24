/**
 * Quotes/Proposals Management Routes
 * Quote-to-Order workflow
 */

const express = require('express');
const router = express.Router();
const { authenticateToken, getTenantId } = require('../middleware/auth');
const { getDatabase } = require('../database/database');

/**
 * POST /api/quotes
 * Create a new quote
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const db = getDatabase();
    const {
      customerId,
      quoteDate,
      validUntil,
      items,
      notes,
      terms,
      discount = 0,
      taxRate = 0
    } = req.body;

    // Validate required fields
    if (!customerId || !items || items.length === 0) {
      return res.status(400).json({ error: 'Customer and items are required' });
    }

    // Generate quote number
    const quoteNumber = await generateQuoteNumber(db, tenantId);

    // Calculate totals
    let subtotal = 0;
    items.forEach(item => {
      item.total = item.quantity * item.unitPrice;
      subtotal += item.total;
    });

    const discountAmount = (subtotal * discount) / 100;
    const subtotalAfterDiscount = subtotal - discountAmount;
    const taxAmount = (subtotalAfterDiscount * taxRate) / 100;
    const totalAmount = subtotalAfterDiscount + taxAmount;

    // Insert quote
    const result = await db.run(
      `INSERT INTO quotes (
        tenant_id, customer_id, quote_number, quote_date, valid_until,
        subtotal, discount, tax, total_amount, status, notes, terms, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        tenantId,
        customerId,
        quoteNumber,
        quoteDate || new Date().toISOString().split('T')[0],
        validUntil,
        subtotal,
        discountAmount,
        taxAmount,
        totalAmount,
        'draft',
        notes || '',
        terms || 'Standard payment terms apply',
        new Date().toISOString()
      ]
    );

    const quoteId = result.lastID;

    // Insert quote items
    for (const item of items) {
      await db.run(
        `INSERT INTO quote_items (
          quote_id, product_id, description, quantity, unit_price, total
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          quoteId,
          item.productId,
          item.description || '',
          item.quantity,
          item.unitPrice,
          item.total
        ]
      );
    }

    // Get the created quote with items
    const quote = await getQuoteWithDetails(db, quoteId, tenantId);

    res.status(201).json({
      success: true,
      quote
    });

  } catch (error) {
    console.error('Error creating quote:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/quotes
 * List all quotes
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const db = getDatabase();
    const { customerId, status, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT q.*, 
             c.name as customer_name,
             c.email as customer_email,
             (SELECT COUNT(*) FROM quote_items WHERE quote_id = q.id) as item_count
      FROM quotes q
      LEFT JOIN customers c ON q.customer_id = c.id
      WHERE q.tenant_id = ?
    `;
    const params = [tenantId];

    if (customerId) {
      query += ' AND q.customer_id = ?';
      params.push(customerId);
    }

    if (status) {
      query += ' AND q.status = ?';
      params.push(status);
    }

    query += ' ORDER BY q.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const quotes = await db.all(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM quotes WHERE tenant_id = ?';
    const countParams = [tenantId];
    if (customerId) {
      countQuery += ' AND customer_id = ?';
      countParams.push(customerId);
    }
    if (status) {
      countQuery += ' AND status = ?';
      countParams.push(status);
    }

    const { total } = await db.get(countQuery, countParams);

    res.json({
      success: true,
      quotes,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });

  } catch (error) {
    console.error('Error fetching quotes:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/quotes/:id
 * Get quote details
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const db = getDatabase();
    const { id } = req.params;

    const quote = await getQuoteWithDetails(db, id, tenantId);

    if (!quote) {
      return res.status(404).json({ error: 'Quote not found' });
    }

    res.json({
      success: true,
      quote
    });

  } catch (error) {
    console.error('Error fetching quote:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/quotes/:id
 * Update quote
 */
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const db = getDatabase();
    const { id } = req.params;
    const { validUntil, notes, terms, status } = req.body;

    // Check if quote exists
    const existingQuote = await db.get(
      'SELECT * FROM quotes WHERE id = ? AND tenant_id = ?',
      [id, tenantId]
    );

    if (!existingQuote) {
      return res.status(404).json({ error: 'Quote not found' });
    }

    // Can't edit converted quotes
    if (existingQuote.status === 'converted') {
      return res.status(400).json({ error: 'Cannot edit converted quotes' });
    }

    // Update quote
    await db.run(
      `UPDATE quotes 
       SET valid_until = ?, notes = ?, terms = ?, status = ?, updated_at = ?
       WHERE id = ?`,
      [
        validUntil || existingQuote.valid_until,
        notes !== undefined ? notes : existingQuote.notes,
        terms !== undefined ? terms : existingQuote.terms,
        status || existingQuote.status,
        new Date().toISOString(),
        id
      ]
    );

    // Get updated quote
    const quote = await getQuoteWithDetails(db, id, tenantId);

    res.json({
      success: true,
      quote
    });

  } catch (error) {
    console.error('Error updating quote:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/quotes/:id/convert-to-order
 * Convert quote to order
 */
router.post('/:id/convert-to-order', authenticateToken, async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const db = getDatabase();
    const { id } = req.params;

    // Get quote with items
    const quote = await getQuoteWithDetails(db, id, tenantId);

    if (!quote) {
      return res.status(404).json({ error: 'Quote not found' });
    }

    if (quote.status === 'converted') {
      return res.status(400).json({ error: 'Quote already converted to order' });
    }

    if (quote.status === 'rejected') {
      return res.status(400).json({ error: 'Cannot convert rejected quote' });
    }

    // Generate order number
    const orderNumber = await generateOrderNumber(db, tenantId);

    // Create order
    const orderResult = await db.run(
      `INSERT INTO orders (
        tenant_id, customer_id, order_number, order_date, status,
        subtotal, discount, tax, total_amount, notes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        tenantId,
        quote.customer_id,
        orderNumber,
        new Date().toISOString().split('T')[0],
        'pending',
        quote.subtotal,
        quote.discount,
        quote.tax,
        quote.total_amount,
        `Converted from Quote #${quote.quote_number}\n${quote.notes || ''}`,
        new Date().toISOString()
      ]
    );

    const orderId = orderResult.lastID;

    // Copy quote items to order items
    for (const item of quote.items) {
      await db.run(
        `INSERT INTO order_items (
          order_id, product_id, quantity, unit_price, total, notes
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          orderId,
          item.product_id,
          item.quantity,
          item.unit_price,
          item.total,
          item.description || ''
        ]
      );
    }

    // Update quote status
    await db.run(
      `UPDATE quotes 
       SET status = 'converted', order_id = ?, updated_at = ?
       WHERE id = ?`,
      [orderId, new Date().toISOString(), id]
    );

    // Get created order
    const order = await db.get(
      `SELECT o.*, c.name as customer_name, c.email as customer_email
       FROM orders o
       LEFT JOIN customers c ON o.customer_id = c.id
       WHERE o.id = ?`,
      [orderId]
    );

    res.json({
      success: true,
      message: 'Quote successfully converted to order',
      order,
      quoteId: id
    });

  } catch (error) {
    console.error('Error converting quote to order:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/quotes/:id/approve
 * Approve a quote
 */
router.post('/:id/approve', authenticateToken, async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const db = getDatabase();
    const { id } = req.params;
    const { approvedBy, approvalNotes } = req.body;

    const quote = await db.get(
      'SELECT * FROM quotes WHERE id = ? AND tenant_id = ?',
      [id, tenantId]
    );

    if (!quote) {
      return res.status(404).json({ error: 'Quote not found' });
    }

    await db.run(
      `UPDATE quotes 
       SET status = 'approved', approved_by = ?, approval_notes = ?, updated_at = ?
       WHERE id = ?`,
      [approvedBy || req.user.id, approvalNotes || '', new Date().toISOString(), id]
    );

    const updatedQuote = await getQuoteWithDetails(db, id, tenantId);

    res.json({
      success: true,
      message: 'Quote approved successfully',
      quote: updatedQuote
    });

  } catch (error) {
    console.error('Error approving quote:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/quotes/:id/reject
 * Reject a quote
 */
router.post('/:id/reject', authenticateToken, async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const db = getDatabase();
    const { id } = req.params;
    const { reason } = req.body;

    const quote = await db.get(
      'SELECT * FROM quotes WHERE id = ? AND tenant_id = ?',
      [id, tenantId]
    );

    if (!quote) {
      return res.status(404).json({ error: 'Quote not found' });
    }

    await db.run(
      `UPDATE quotes 
       SET status = 'rejected', rejection_reason = ?, updated_at = ?
       WHERE id = ?`,
      [reason || 'No reason provided', new Date().toISOString(), id]
    );

    const updatedQuote = await getQuoteWithDetails(db, id, tenantId);

    res.json({
      success: true,
      message: 'Quote rejected',
      quote: updatedQuote
    });

  } catch (error) {
    console.error('Error rejecting quote:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/quotes/:id
 * Delete a quote
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const db = getDatabase();
    const { id } = req.params;

    const quote = await db.get(
      'SELECT * FROM quotes WHERE id = ? AND tenant_id = ?',
      [id, tenantId]
    );

    if (!quote) {
      return res.status(404).json({ error: 'Quote not found' });
    }

    if (quote.status === 'converted') {
      return res.status(400).json({ error: 'Cannot delete converted quotes' });
    }

    // Delete quote items first
    await db.run('DELETE FROM quote_items WHERE quote_id = ?', [id]);

    // Delete quote
    await db.run('DELETE FROM quotes WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Quote deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting quote:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/quotes/stats/summary
 * Get quote statistics
 */
router.get('/stats/summary', authenticateToken, async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const db = getDatabase();

    // Status breakdown
    const statusStats = await db.all(
      `SELECT status, COUNT(*) as count, SUM(total_amount) as total_value
       FROM quotes
       WHERE tenant_id = ?
       GROUP BY status`,
      [tenantId]
    );

    // Conversion rate
    const conversionData = await db.get(
      `SELECT 
        COUNT(CASE WHEN status = 'converted' THEN 1 END) as converted,
        COUNT(*) as total
       FROM quotes
       WHERE tenant_id = ?`,
      [tenantId]
    );

    const conversionRate = conversionData.total > 0 
      ? (conversionData.converted / conversionData.total * 100).toFixed(2) 
      : 0;

    // Recent quotes
    const recentQuotes = await db.all(
      `SELECT q.*, c.name as customer_name
       FROM quotes q
       LEFT JOIN customers c ON q.customer_id = c.id
       WHERE q.tenant_id = ?
       ORDER BY q.created_at DESC
       LIMIT 10`,
      [tenantId]
    );

    res.json({
      success: true,
      stats: {
        statusBreakdown: statusStats,
        conversionRate: parseFloat(conversionRate),
        recentQuotes
      }
    });

  } catch (error) {
    console.error('Error fetching quote stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper functions

async function getQuoteWithDetails(db, quoteId, tenantId) {
  const quote = await db.get(
    `SELECT q.*, 
            c.name as customer_name,
            c.email as customer_email,
            c.phone as customer_phone,
            c.address as customer_address
     FROM quotes q
     LEFT JOIN customers c ON q.customer_id = c.id
     WHERE q.id = ? AND q.tenant_id = ?`,
    [quoteId, tenantId]
  );

  if (!quote) return null;

  // Get items
  quote.items = await db.all(
    `SELECT qi.*, p.name as product_name, p.code as product_code
     FROM quote_items qi
     LEFT JOIN products p ON qi.product_id = p.id
     WHERE qi.quote_id = ?`,
    [quoteId]
  );

  return quote;
}

async function generateQuoteNumber(db, tenantId) {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  
  const lastQuote = await db.get(
    `SELECT quote_number FROM quotes 
     WHERE tenant_id = ? AND quote_number LIKE ?
     ORDER BY created_at DESC LIMIT 1`,
    [tenantId, `QT-${year}${month}-%`]
  );

  let sequence = 1;
  if (lastQuote) {
    const parts = lastQuote.quote_number.split('-');
    sequence = parseInt(parts[2]) + 1;
  }

  return `QT-${year}${month}-${String(sequence).padStart(4, '0')}`;
}

async function generateOrderNumber(db, tenantId) {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  
  const lastOrder = await db.get(
    `SELECT order_number FROM orders 
     WHERE tenant_id = ? AND order_number LIKE ?
     ORDER BY created_at DESC LIMIT 1`,
    [tenantId, `ORD-${year}${month}-%`]
  );

  let sequence = 1;
  if (lastOrder && lastOrder.order_number) {
    const parts = lastOrder.order_number.split('-');
    if (parts.length >= 3) {
      sequence = parseInt(parts[2]) + 1;
    }
  }

  return `ORD-${year}${month}-${String(sequence).padStart(4, '0')}`;
}

module.exports = router;
