const express = require('express');
const router = express.Router();
const { authenticateToken } = require('./auth-complete');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

// Helper to convert data to CSV
function convertToCSV(data, headers) {
  if (!data || data.length === 0) {
    return '';
  }

  const csvHeaders = headers || Object.keys(data[0]);
  const csvRows = [csvHeaders.join(',')];

  data.forEach(row => {
    const values = csvHeaders.map(header => {
      const value = row[header] || '';
      // Escape commas and quotes
      return `"${String(value).replace(/"/g, '""')}"`;
    });
    csvRows.push(values.join(','));
  });

  return csvRows.join('\n');
}

// POST /api/exports/csv - Export data to CSV
router.post('/csv', authenticateToken, (req, res) => {
  const { data, filename, headers } = req.body;

  if (!data || !Array.isArray(data)) {
    return res.status(400).json({ error: 'Data array is required' });
  }

  try {
    const csv = convertToCSV(data, headers);
    const exportFilename = filename || `export_${Date.now()}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${exportFilename}"`);
    res.send(csv);

    // Log export
    const db = req.app.locals.db;
    db.run(
      'INSERT INTO audit_logs (user_id, action, resource_type, details) VALUES (?, ?, ?, ?)',
      [req.user.id, 'data_exported', 'export', JSON.stringify({ format: 'csv', filename: exportFilename, records: data.length })]
    );
  } catch (error) {
    res.status(500).json({ error: 'Error generating CSV' });
  }
});

// POST /api/exports/excel - Export data to Excel
router.post('/excel', authenticateToken, async (req, res) => {
  const { data, filename, sheetName, headers } = req.body;

  if (!data || !Array.isArray(data)) {
    return res.status(400).json({ error: 'Data array is required' });
  }

  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName || 'Sheet1');

    // Define columns
    const columns = headers || (data.length > 0 ? Object.keys(data[0]).map(key => ({ header: key, key: key, width: 15 })) : []);
    worksheet.columns = columns;

    // Add rows
    data.forEach(row => {
      worksheet.addRow(row);
    });

    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Auto-filter
    worksheet.autoFilter = {
      from: 'A1',
      to: String.fromCharCode(64 + columns.length) + '1'
    };

    const exportFilename = filename || `export_${Date.now()}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${exportFilename}"`);

    await workbook.xlsx.write(res);
    res.end();

    // Log export
    const db = req.app.locals.db;
    db.run(
      'INSERT INTO audit_logs (user_id, action, resource_type, details) VALUES (?, ?, ?, ?)',
      [req.user.id, 'data_exported', 'export', JSON.stringify({ format: 'excel', filename: exportFilename, records: data.length })]
    );
  } catch (error) {
    console.error('Excel export error:', error);
    res.status(500).json({ error: 'Error generating Excel file' });
  }
});

// POST /api/exports/pdf - Export data to PDF
router.post('/pdf', authenticateToken, (req, res) => {
  const { data, title, filename, columns } = req.body;

  if (!data || !Array.isArray(data)) {
    return res.status(400).json({ error: 'Data array is required' });
  }

  try {
    const doc = new PDFDocument({ margin: 50 });
    const exportFilename = filename || `export_${Date.now()}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${exportFilename}"`);

    doc.pipe(res);

    // Title
    doc.fontSize(20).text(title || 'Data Export', { align: 'center' });
    doc.moveDown();

    // Date
    doc.fontSize(10).text(`Generated: ${new Date().toLocaleString()}`, { align: 'right' });
    doc.moveDown();

    // Table headers
    const headers = columns || (data.length > 0 ? Object.keys(data[0]) : []);
    const columnWidth = 500 / headers.length;
    let yPosition = doc.y;

    doc.fontSize(10).font('Helvetica-Bold');
    headers.forEach((header, i) => {
      doc.text(header, 50 + (i * columnWidth), yPosition, { width: columnWidth, align: 'left' });
    });

    doc.moveDown();
    yPosition = doc.y;
    doc.moveTo(50, yPosition).lineTo(550, yPosition).stroke();
    doc.moveDown(0.5);

    // Table data
    doc.font('Helvetica').fontSize(9);
    data.forEach((row, rowIndex) => {
      yPosition = doc.y;

      // Check if we need a new page
      if (yPosition > 700) {
        doc.addPage();
        yPosition = 50;
      }

      headers.forEach((header, i) => {
        const value = row[header] || '';
        doc.text(String(value), 50 + (i * columnWidth), yPosition, { width: columnWidth, align: 'left', height: 20 });
      });

      doc.moveDown(0.8);
    });

    // Footer
    doc.fontSize(8).text(`Total Records: ${data.length}`, 50, doc.page.height - 50, { align: 'center' });

    doc.end();

    // Log export
    const db = req.app.locals.db;
    db.run(
      'INSERT INTO audit_logs (user_id, action, resource_type, details) VALUES (?, ?, ?, ?)',
      [req.user.id, 'data_exported', 'export', JSON.stringify({ format: 'pdf', filename: exportFilename, records: data.length })]
    );
  } catch (error) {
    console.error('PDF export error:', error);
    res.status(500).json({ error: 'Error generating PDF' });
  }
});

// GET /api/exports/orders - Export orders (specific endpoint example)
router.get('/orders', authenticateToken, (req, res) => {
  const db = req.app.locals.db;
  const { format, startDate, endDate } = req.query;

  let query = `
    SELECT 
      o.id,
      o.order_number,
      c.name as customer_name,
      o.order_date,
      o.total_amount,
      o.status,
      o.delivery_date
    FROM orders o
    LEFT JOIN customers c ON c.id = o.customer_id
    WHERE 1=1
  `;
  const params = [];

  if (startDate) {
    query += ' AND o.order_date >= ?';
    params.push(startDate);
  }

  if (endDate) {
    query += ' AND o.order_date <= ?';
    params.push(endDate);
  }

  query += ' ORDER BY o.order_date DESC';

  db.all(query, params, (err, orders) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    const exportFormat = format || 'csv';

    if (exportFormat === 'csv') {
      const csv = convertToCSV(orders);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="orders_export_${Date.now()}.csv"`);
      res.send(csv);
    } else if (exportFormat === 'json') {
      res.json({ success: true, orders });
    } else {
      res.status(400).json({ error: 'Unsupported format' });
    }
  });
});

// GET /api/exports/customers - Export customers
router.get('/customers', authenticateToken, (req, res) => {
  const db = req.app.locals.db;
  const { format } = req.query;

  db.all(`
    SELECT 
      id,
      name,
      email,
      phone,
      address,
      city,
      status,
      created_at
    FROM customers
    ORDER BY name
  `, [], (err, customers) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    const exportFormat = format || 'csv';

    if (exportFormat === 'csv') {
      const csv = convertToCSV(customers);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="customers_export_${Date.now()}.csv"`);
      res.send(csv);
    } else if (exportFormat === 'json') {
      res.json({ success: true, customers });
    } else {
      res.status(400).json({ error: 'Unsupported format' });
    }
  });
});

// GET /api/exports/inventory - Export inventory
router.get('/inventory', authenticateToken, (req, res) => {
  const db = req.app.locals.db;
  const { format } = req.query;

  db.all(`
    SELECT 
      p.id,
      p.name,
      p.code as sku,
      i.quantity,
      i.warehouse_id,
      p.selling_price as unit_price,
      i.last_updated
    FROM inventory i
    JOIN products p ON p.id = i.product_id
    ORDER BY p.name
  `, [], (err, inventory) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    const exportFormat = format || 'csv';

    if (exportFormat === 'csv') {
      const csv = convertToCSV(inventory);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="inventory_export_${Date.now()}.csv"`);
      res.send(csv);
    } else if (exportFormat === 'json') {
      res.json({ success: true, inventory });
    } else {
      res.status(400).json({ error: 'Unsupported format' });
    }
  });
});

// GET /api/exports/financial - Export financial data
router.get('/financial', authenticateToken, (req, res) => {
  const db = req.app.locals.db;
  const { format, startDate, endDate, type } = req.query;

  let query = `
    SELECT 
      id,
      invoice_number,
      customer_id,
      amount,
      status,
      due_date,
      created_at
    FROM invoices
    WHERE 1=1
  `;
  const params = [];

  if (startDate) {
    query += ' AND created_at >= ?';
    params.push(startDate);
  }

  if (endDate) {
    query += ' AND created_at <= ?';
    params.push(endDate);
  }

  if (type) {
    query += ' AND status = ?';
    params.push(type);
  }

  query += ' ORDER BY created_at DESC';

  db.all(query, params, (err, financial) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    const exportFormat = format || 'csv';

    if (exportFormat === 'csv') {
      const csv = convertToCSV(financial);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="financial_export_${Date.now()}.csv"`);
      res.send(csv);
    } else if (exportFormat === 'json') {
      res.json({ success: true, financial });
    } else {
      res.status(400).json({ error: 'Unsupported format' });
    }
  });
});

// GET /api/exports/reports/:reportType - Generic report export
router.get('/reports/:reportType', authenticateToken, (req, res) => {
  const db = req.app.locals.db;
  const { reportType } = req.params;
  const { format } = req.query;

  // Map report types to queries
  const reportQueries = {
    sales_summary: 'SELECT * FROM orders WHERE status = "completed" ORDER BY order_date DESC',
    customer_list: 'SELECT * FROM customers ORDER BY name',
    product_list: 'SELECT * FROM products ORDER BY name',
    inventory_status: 'SELECT * FROM inventory ORDER BY product_id',
    financial_summary: 'SELECT * FROM invoices ORDER BY created_at DESC'
  };

  const query = reportQueries[reportType];

  if (!query) {
    return res.status(400).json({ error: 'Invalid report type' });
  }

  db.all(query, [], (err, data) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    const exportFormat = format || 'csv';
    const filename = `${reportType}_${Date.now()}`;

    if (exportFormat === 'csv') {
      const csv = convertToCSV(data);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
      res.send(csv);
    } else if (exportFormat === 'json') {
      res.json({ success: true, data });
    } else {
      res.status(400).json({ error: 'Unsupported format' });
    }

    // Log report export
    db.run(
      'INSERT INTO audit_logs (user_id, action, resource_type, details) VALUES (?, ?, ?, ?)',
      [req.user.id, 'report_exported', 'report', JSON.stringify({ reportType, format: exportFormat, records: data.length })]
    );
  });
});

module.exports = router;
