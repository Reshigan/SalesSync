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
  const { getQuery } = require('../utils/database');
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
  const { getOneQuery, getQuery } = require('../utils/database');
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
  const { runQuery, getOneQuery, getQuery } = require('../utils/database');
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
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `, [customer_id, invoice_number, invoice_date, due_date, subtotal || 0, tax || 0, discount || 0, total, status]);

  const invoiceId = result.lastID;

  // Create invoice items
  if (items.length > 0) {
    for (const item of items) {
      await runQuery(`
        INSERT INTO invoice_items (invoice_id, product_id, description, quantity, unit_price, total, created_at)
        VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
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
  const { runQuery, getOneQuery, getQuery } = require('../utils/database');
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
        updated_at = CURRENT_TIMESTAMP
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
  const { runQuery } = require('../utils/database');
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

// Get invoice items list
router.get('/invoices/:invoiceId/items', asyncHandler(async (req, res) => {
  const { getQuery } = require('../utils/database');
  const { invoiceId } = req.params;
  const tenantId = req.user?.tenantId;
  
  const items = await getQuery(`
    SELECT ii.*, p.name as product_name, p.code as product_code, p.code as product_sku,
           p.unit_of_measure, p.brand_id,
           (ii.quantity * ii.unit_price) as line_total,
           COALESCE(ii.discount_percentage, 0) as discount_percentage,
           COALESCE(ii.tax_percentage, 0) as tax_percentage
    FROM invoice_items ii
    LEFT JOIN products p ON ii.product_id = p.id
    JOIN invoices i ON ii.invoice_id = i.id
    WHERE ii.invoice_id = $1 AND i.tenant_id = $2
    ORDER BY ii.created_at
  `, [invoiceId, tenantId]);
  
  res.json({
    success: true,
    data: { items }
  });
}));

router.get('/invoices/:invoiceId/items/:itemId', asyncHandler(async (req, res) => {
  const { getOneQuery } = require('../utils/database');
  const { invoiceId, itemId } = req.params;
  const tenantId = req.user?.tenantId;
  
  const item = await getOneQuery(`
    SELECT ii.*, p.name as product_name, p.code as product_code, p.code as product_sku,
           p.unit_of_measure, p.brand_id,
           (ii.quantity * ii.unit_price) as line_total,
           COALESCE(ii.discount_percentage, 0) as discount_percentage,
           COALESCE(ii.tax_percentage, 0) as tax_percentage
    FROM invoice_items ii
    LEFT JOIN products p ON ii.product_id = p.id
    JOIN invoices i ON ii.invoice_id = i.id
    WHERE ii.id = $1 AND ii.invoice_id = $2 AND i.tenant_id = $3
  `, [itemId, invoiceId, tenantId]);
  
  if (!item) {
    throw new AppError('Invoice item not found', 404);
  }
  
  res.json({
    success: true,
    data: { item }
  });
}));

// Update invoice item
router.put('/invoices/:invoiceId/items/:itemId', asyncHandler(async (req, res) => {
  const { runQuery, getOneQuery, getQuery } = require('../utils/database');
  const { invoiceId, itemId } = req.params;
  const { product_id, description, quantity, unit_price, discount_percentage, tax_percentage } = req.body;
  
  const existingItem = await getOneQuery(
    'SELECT * FROM invoice_items WHERE id = ? AND invoice_id = ?',
    [itemId, invoiceId]
  );
  
  if (!existingItem) {
    throw new AppError('Invoice item not found', 404);
  }
  
  const updateData = {};
  if (product_id !== undefined) updateData.product_id = product_id;
  if (description !== undefined) updateData.description = description;
  if (quantity !== undefined) updateData.quantity = parseInt(quantity);
  if (unit_price !== undefined) updateData.unit_price = parseFloat(unit_price);
  if (discount_percentage !== undefined) updateData.discount_percentage = parseFloat(discount_percentage);
  if (tax_percentage !== undefined) updateData.tax_percentage = parseFloat(tax_percentage);
  
  const qty = quantity !== undefined ? parseInt(quantity) : existingItem.quantity;
  const price = unit_price !== undefined ? parseFloat(unit_price) : existingItem.unit_price;
  const discount = discount_percentage !== undefined ? parseFloat(discount_percentage) : (existingItem.discount_percentage || 0);
  const tax = tax_percentage !== undefined ? parseFloat(tax_percentage) : (existingItem.tax_percentage || 0);
  
  const lineSubtotal = qty * price;
  const lineDiscount = lineSubtotal * (discount / 100);
  const lineTaxable = lineSubtotal - lineDiscount;
  const lineTax = lineTaxable * (tax / 100);
  updateData.total = lineTaxable + lineTax;
  
  await runQuery(
    `UPDATE invoice_items SET ${Object.keys(updateData).map((k, i) => `${k} = $${i + 1}`).join(', ')}, updated_at = CURRENT_TIMESTAMP 
     WHERE id = $${Object.keys(updateData).length + 1} AND invoice_id = $${Object.keys(updateData).length + 2}`,
    [...Object.values(updateData), itemId, invoiceId]
  );
  
  const items = await getQuery('SELECT * FROM invoice_items WHERE invoice_id = ?', [invoiceId]);
  let invoiceSubtotal = 0;
  let invoiceTax = 0;
  let invoiceDiscount = 0;
  
  items.forEach(item => {
    const itemSubtotal = item.quantity * item.unit_price;
    const itemDiscount = itemSubtotal * ((item.discount_percentage || 0) / 100);
    const itemTaxable = itemSubtotal - itemDiscount;
    const itemTax = itemTaxable * ((item.tax_percentage || 0) / 100);
    
    invoiceSubtotal += itemSubtotal;
    invoiceDiscount += itemDiscount;
    invoiceTax += itemTax;
  });
  
  const invoiceTotal = invoiceSubtotal - invoiceDiscount + invoiceTax;
  
  await runQuery(
    `UPDATE invoices SET subtotal = $1, discount = $2, tax = $3, total = $4, updated_at = CURRENT_TIMESTAMP 
     WHERE id = $5`,
    [invoiceSubtotal.toFixed(2), invoiceDiscount.toFixed(2), invoiceTax.toFixed(2), invoiceTotal.toFixed(2), invoiceId]
  );
  
  const updatedItem = await getOneQuery(`
    SELECT ii.*, p.name as product_name, p.code as product_code, p.code as product_sku
    FROM invoice_items ii
    LEFT JOIN products p ON ii.product_id = p.id
    WHERE ii.id = ? AND ii.invoice_id = ?
  `, [itemId, invoiceId]);
  
  res.json({
    success: true,
    data: { item: updatedItem },
    message: 'Invoice item updated successfully'
  });
}));

// Get all payments
router.get('/payments', asyncHandler(async (req, res) => {
  const { getQuery } = require('../utils/database');
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
  const { runQuery, getOneQuery } = require('../utils/database');
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
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `, [customer_id, invoice_id, payment_date, amount, payment_method, reference_number, notes, status]);

  const payment = await getOneQuery('SELECT * FROM payments WHERE id = ?', [result.lastID]);

  res.status(201).json({
    success: true,
    data: payment
  });
}));

// Get financial summary
router.get('/summary', asyncHandler(async (req, res) => {
  const { getQuery } = require('../utils/database');
  const { period = 'month' } = req.query;

  // Calculate date filter based on period
  let dateFilter = '';
  if (period === 'day') {
    dateFilter = "AND invoice_date::date = CURRENT_DATE";
  } else if (period === 'week') {
    dateFilter = "AND invoice_date >= CURRENT_DATE - INTERVAL '7 day'";
  } else if (period === 'month') {
    dateFilter = "AND invoice_date >= CURRENT_DATE - INTERVAL '30 day'";
  } else if (period === 'year') {
    dateFilter = "AND invoice_date >= CURRENT_DATE - INTERVAL '365 day'";
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
  const { getQuery } = require('../utils/database');
  
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

// Generate PDF invoice
router.get('/invoices/:id/pdf', asyncHandler(async (req, res) => {
  const invoicePDFService = require('../services/invoicePDF');
  const { id } = req.params;
  
  // For now, using default tenant. In production, get from auth
  const tenantId = 'default-tenant';
  
  try {
    const pdfBuffer = await invoicePDFService.generateInvoicePDF(id, tenantId);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${id}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new AppError(`Failed to generate PDF: ${error.message}`, 500);
  }
}));

// Email invoice
router.post('/invoices/:id/email', asyncHandler(async (req, res) => {
  const emailService = require('../services/emailService');
  const { getOneQuery } = require('../utils/database');
  const { id } = req.params;
  const { recipientEmail } = req.body;
  
  // For now, using default tenant. In production, get from auth
  const tenantId = 'default-tenant';
  
  if (!recipientEmail) {
    throw new AppError('Recipient email is required', 400);
  }
  
  try {
    // Get invoice details
    const invoice = await getOneQuery(
      `SELECT i.*, c.name as customer_name, c.email as customer_email
       FROM invoices i
       LEFT JOIN customers c ON i.customer_id = c.id
       WHERE i.id = ?`,
      [id]
    );
    
    if (!invoice) {
      throw new AppError('Invoice not found', 404);
    }
    
    // Send email
    const result = await emailService.sendInvoiceEmail(id, tenantId, recipientEmail, {
      invoiceNumber: invoice.invoice_number,
      invoiceDate: invoice.invoice_date,
      dueDate: invoice.due_date,
      totalAmount: `$${invoice.total_amount}`,
      customerName: invoice.customer_name
    });
    
    res.json({
      success: true,
      message: 'Invoice email sent successfully',
      data: result
    });
  } catch (error) {
    console.error('Error sending invoice email:', error);
    throw new AppError(`Failed to send email: ${error.message}`, 500);
  }
}));

// GET /api/finance/stats - Finance statistics
router.get('/stats', asyncHandler(async (req, res) => {
  const tenantId = req.user.tenantId;
  
  const [invoiceStats, paymentStats, accountsReceivable, recentTransactions] = await Promise.all([
    getOneQuery(`
      SELECT 
        COUNT(*) as total_invoices,
        SUM(total_amount) as total_invoiced,
        SUM(paid_amount) as total_paid,
        SUM(total_amount - paid_amount) as outstanding_balance,
        COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_invoices,
        COUNT(CASE WHEN status = 'overdue' THEN 1 END) as overdue_invoices
      FROM invoices WHERE tenant_id = ?
    `, [tenantId]),
    
    getOneQuery(`
      SELECT 
        COUNT(*) as total_payments,
        SUM(amount) as total_received,
        COUNT(CASE WHEN payment_method = 'cash' THEN 1 END) as cash_payments,
        COUNT(CASE WHEN payment_method = 'card' THEN 1 END) as card_payments,
        COUNT(CASE WHEN payment_method = 'bank_transfer' THEN 1 END) as bank_transfers
      FROM payments WHERE tenant_id = ?
    `, [tenantId]),
    
    getQuery(`
      SELECT 
        c.id, c.name,
        SUM(i.total_amount - i.paid_amount) as outstanding_amount
      FROM invoices i
      INNER JOIN customers c ON i.customer_id = c.id
      WHERE i.tenant_id = ? AND i.status != 'paid'
      GROUP BY c.id
      HAVING outstanding_amount > 0
      ORDER BY outstanding_amount DESC
      LIMIT 10
    `, [tenantId]),
    
    getQuery(`
      SELECT 
        p.id, p.amount, p.payment_method, p.payment_date,
        c.name as customer_name
      FROM payments p
      INNER JOIN customers c ON p.customer_id = c.id
      WHERE p.tenant_id = ?
      ORDER BY p.payment_date DESC
      LIMIT 10
    `, [tenantId])
  ]);

  res.json({
    success: true,
    data: {
      invoices: {
        ...invoiceStats,
        total_invoiced: parseFloat((invoiceStats.total_invoiced || 0).toFixed(2)),
        total_paid: parseFloat((invoiceStats.total_paid || 0).toFixed(2)),
        outstanding_balance: parseFloat((invoiceStats.outstanding_balance || 0).toFixed(2))
      },
      payments: {
        ...paymentStats,
        total_received: parseFloat((paymentStats.total_received || 0).toFixed(2))
      },
      accountsReceivable,
      recentTransactions
    }
  });
}));

// Get invoice status history
router.get('/invoices/:invoiceId/status-history', asyncHandler(async (req, res) => {
  const { getQuery } = require('../utils/database');
  const { invoiceId } = req.params;
  const tenantId = req.user?.tenantId;
  
  const history = await getQuery(`
    SELECT ish.*, u.name as changed_by_name, u.email as changed_by_email
    FROM invoice_status_history ish
    LEFT JOIN users u ON ish.changed_by = u.id
    WHERE ish.invoice_id = $1 AND ish.tenant_id = $2
    ORDER BY ish.created_at DESC
  `, [invoiceId, tenantId]);
  
  res.json({
    success: true,
    data: { history }
  });
}));

// Get invoice item history
router.get('/invoices/:invoiceId/items/:itemId/history', asyncHandler(async (req, res) => {
  const { getQuery } = require('../utils/database');
  const { invoiceId, itemId } = req.params;
  const tenantId = req.user?.tenantId;
  
  const history = await getQuery(`
    SELECT iih.*, u.name as changed_by_name, u.email as changed_by_email
    FROM invoice_item_history iih
    LEFT JOIN users u ON iih.changed_by = u.id
    WHERE iih.invoice_id = $1 AND iih.item_id = $2 AND iih.tenant_id = $3
    ORDER BY iih.created_at DESC
  `, [invoiceId, itemId, tenantId]);
  
  res.json({
    success: true,
    data: { history }
  });
}));

module.exports = router;
