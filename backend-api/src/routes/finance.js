const express = require('express');
const router = express.Router();
const { AppError, asyncHandler } = require('../middleware/errorHandler');

// Health check endpoint (no auth required)
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Finance API is working!',
    timestamp: new Date().toISOString()
  });
});

// Get all invoices
router.get('/invoices', asyncHandler(async (req, res) => {
  const { getQuery } = require('../database/init');
  const { status, customer_id, date_from, date_to, limit = 50, offset = 0 } = req.query;
    
  let query = 'SELECT * FROM invoices WHERE 1=1';
  const params = [];

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }

  if (customer_id) {
    query += ' AND customer_id = ?';
    params.push(customer_id);
  }

  if (date_from) {
    query += ' AND invoice_date >= ?';
    params.push(date_from);
  }

  if (date_to) {
    query += ' AND invoice_date <= ?';
    params.push(date_to);
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  const invoices = await getQuery(query, params);

  // Get total count
  let countQuery = 'SELECT COUNT(*) as total FROM invoices WHERE 1=1';
  const countParams = [];
  if (status) {
    countQuery += ' AND status = ?';
    countParams.push(status);
  }
  if (customer_id) {
    countQuery += ' AND customer_id = ?';
    countParams.push(customer_id);
  }
  if (date_from) {
    countQuery += ' AND invoice_date >= ?';
    countParams.push(date_from);
  }
  if (date_to) {
    countQuery += ' AND invoice_date <= ?';
    countParams.push(date_to);
  }

  const countResult = await getQuery(countQuery, countParams);
  const total = countResult[0]?.total || 0;

  res.json({
    success: true,
    data: invoices,
    pagination: {
      total,
      limit: parseInt(limit),
      offset: parseInt(offset),
      pages: Math.ceil(total / parseInt(limit))
    }
  });
}));

// Get invoice by ID
router.get('/invoices/:id', asyncHandler(async (req, res) => {
  const { getOneQuery, getQuery } = require('../database/init');
  const { id } = req.params;

  const invoice = await getOneQuery('SELECT * FROM invoices WHERE id = ?', [id]);

  if (!invoice) {
    throw new AppError('Invoice not found', 404);
  }

  // Get invoice items
  const items = await getQuery('SELECT * FROM invoice_items WHERE invoice_id = ?', [id]);

  res.json({
    success: true,
    data: {
      ...invoice,
      items
    }
  });
}));

// Create new invoice
router.post('/invoices', asyncHandler(async (req, res) => {
  const { runQuery, getOneQuery, getQuery } = require('../database/init');
  const {
    customer_id,
    invoice_number,
    invoice_date,
    due_date,
    subtotal,
    tax,
    discount,
    total,
    status = 'draft',
    items = []
  } = req.body;

  // Validate required fields
  if (!customer_id || !invoice_number || !invoice_date || !total) {
    throw new AppError('Missing required fields: customer_id, invoice_number, invoice_date, total', 400);
  }

  // Create invoice
  const result = await runQuery(`
    INSERT INTO invoices (customer_id, invoice_number, invoice_date, due_date, subtotal, tax, discount, total, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `, [customer_id, invoice_number, invoice_date, due_date, subtotal || 0, tax || 0, discount || 0, total, status]);

  const invoiceId = result.lastID;

  // Create invoice items
  if (items.length > 0) {
    for (const item of items) {
      await runQuery(`
        INSERT INTO invoice_items (invoice_id, product_id, description, quantity, unit_price, total, created_at)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
      `, [invoiceId, item.product_id, item.description, item.quantity, item.unit_price, item.total]);
    }
  }

  // Fetch created invoice
  const createdInvoice = await getOneQuery('SELECT * FROM invoices WHERE id = ?', [invoiceId]);
  const createdItems = await getQuery('SELECT * FROM invoice_items WHERE invoice_id = ?', [invoiceId]);

  res.status(201).json({
    success: true,
    data: {
      ...createdInvoice,
      items: createdItems
    }
  });
}));

// Update invoice
router.put('/invoices/:id', asyncHandler(async (req, res) => {
  const { runQuery, getOneQuery, getQuery } = require('../database/init');
  const { id } = req.params;
  const {
    customer_id,
    invoice_number,
    invoice_date,
    due_date,
    subtotal,
    tax,
    discount,
    total,
    status
  } = req.body;

  await runQuery(`
    UPDATE invoices
    SET customer_id = COALESCE(?, customer_id),
        invoice_number = COALESCE(?, invoice_number),
        invoice_date = COALESCE(?, invoice_date),
        due_date = COALESCE(?, due_date),
        subtotal = COALESCE(?, subtotal),
        tax = COALESCE(?, tax),
        discount = COALESCE(?, discount),
        total = COALESCE(?, total),
        status = COALESCE(?, status),
        updated_at = datetime('now')
    WHERE id = ?
  `, [customer_id, invoice_number, invoice_date, due_date, subtotal, tax, discount, total, status, id]);

  const updatedInvoice = await getOneQuery('SELECT * FROM invoices WHERE id = ?', [id]);
  
  if (!updatedInvoice) {
    throw new AppError('Invoice not found', 404);
  }

  const items = await getQuery('SELECT * FROM invoice_items WHERE invoice_id = ?', [id]);

  res.json({
    success: true,
    data: {
      ...updatedInvoice,
      items
    }
  });
}));

// Delete invoice
router.delete('/invoices/:id', asyncHandler(async (req, res) => {
  const { runQuery } = require('../database/init');
  const { id } = req.params;

  // Delete invoice items first
  await runQuery('DELETE FROM invoice_items WHERE invoice_id = ?', [id]);

  // Delete invoice
  const result = await runQuery('DELETE FROM invoices WHERE id = ?', [id]);

  if (result.changes === 0) {
    throw new AppError('Invoice not found', 404);
  }

  res.json({ success: true, message: 'Invoice deleted successfully' });
}));

// Get all payments
router.get('/payments', asyncHandler(async (req, res) => {
  const { getQuery } = require('../database/init');
  const { status, customer_id, date_from, date_to, limit = 50, offset = 0 } = req.query;
    
  let query = 'SELECT * FROM payments WHERE 1=1';
  const params = [];

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }

  if (customer_id) {
    query += ' AND customer_id = ?';
    params.push(customer_id);
  }

  if (date_from) {
    query += ' AND payment_date >= ?';
    params.push(date_from);
  }

  if (date_to) {
    query += ' AND payment_date <= ?';
    params.push(date_to);
  }

  query += ' ORDER BY payment_date DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  const payments = await getQuery(query, params);

  res.json({
    success: true,
    data: payments
  });
}));

// Create payment
router.post('/payments', asyncHandler(async (req, res) => {
  const { runQuery, getOneQuery } = require('../database/init');
  const {
    customer_id,
    invoice_id,
    payment_date,
    amount,
    payment_method,
    reference_number,
    notes,
    status = 'completed'
  } = req.body;

  if (!customer_id || !amount || !payment_date) {
    throw new AppError('Missing required fields: customer_id, amount, payment_date', 400);
  }

  const result = await runQuery(`
    INSERT INTO payments (customer_id, invoice_id, payment_date, amount, payment_method, reference_number, notes, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `, [customer_id, invoice_id, payment_date, amount, payment_method, reference_number, notes, status]);

  const payment = await getOneQuery('SELECT * FROM payments WHERE id = ?', [result.lastID]);

  res.status(201).json({
    success: true,
    data: payment
  });
}));

// Get financial summary
router.get('/summary', asyncHandler(async (req, res) => {
  const { getQuery } = require('../database/init');
  const { period = 'month' } = req.query;

  // Calculate date filter based on period
  let dateFilter = '';
  if (period === 'day') {
    dateFilter = "AND date(invoice_date) = date('now')";
  } else if (period === 'week') {
    dateFilter = "AND date(invoice_date) >= date('now', '-7 days')";
  } else if (period === 'month') {
    dateFilter = "AND date(invoice_date) >= date('now', '-30 days')";
  } else if (period === 'year') {
    dateFilter = "AND date(invoice_date) >= date('now', '-365 days')";
  }

  // Get invoice summary
  const invoiceSummary = await getQuery(`
    SELECT 
      COUNT(*) as total_invoices,
      SUM(CASE WHEN status = 'paid' THEN total ELSE 0 END) as paid_amount,
      SUM(CASE WHEN status = 'pending' THEN total ELSE 0 END) as pending_amount,
      SUM(CASE WHEN status = 'overdue' THEN total ELSE 0 END) as overdue_amount,
      SUM(total) as total_amount
    FROM invoices
    WHERE 1=1 ${dateFilter}
  `);

  // Get payment summary
  const paymentSummary = await getQuery(`
    SELECT 
      COUNT(*) as total_payments,
      SUM(amount) as total_collected
    FROM payments
    WHERE 1=1 ${dateFilter.replace('invoice_date', 'payment_date')}
  `);

  // Get top customers by revenue
  const topCustomers = await getQuery(`
    SELECT 
      c.id,
      c.name,
      SUM(i.total) as total_revenue,
      COUNT(i.id) as invoice_count
    FROM invoices i
    JOIN customers c ON i.customer_id = c.id
    WHERE 1=1 ${dateFilter}
    GROUP BY c.id, c.name
    ORDER BY total_revenue DESC
    LIMIT 10
  `);

  res.json({
    success: true,
    data: {
      period,
      invoices: invoiceSummary[0] || {
        total_invoices: 0,
        paid_amount: 0,
        pending_amount: 0,
        overdue_amount: 0,
        total_amount: 0
      },
      payments: paymentSummary[0] || {
        total_payments: 0,
        total_collected: 0
      },
      top_customers: topCustomers
    }
  });
}));

// Get accounts receivable
router.get('/accounts-receivable', asyncHandler(async (req, res) => {
  const { getQuery } = require('../database/init');
  
  const receivables = await getQuery(`
    SELECT 
      c.id as customer_id,
      c.name as customer_name,
      c.email,
      c.phone,
      COUNT(i.id) as invoice_count,
      SUM(i.total) as total_amount,
      SUM(CASE WHEN i.status = 'overdue' THEN i.total ELSE 0 END) as overdue_amount,
      MIN(i.due_date) as oldest_due_date
    FROM customers c
    LEFT JOIN invoices i ON c.id = i.customer_id AND i.status IN ('pending', 'overdue')
    GROUP BY c.id, c.name, c.email, c.phone
    HAVING total_amount > 0
    ORDER BY total_amount DESC
  `);

  res.json({
    success: true,
    data: receivables
  });
}));

module.exports = router;
