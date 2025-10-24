/**
 * Invoice PDF Generation Service
 * Creates professional PDF invoices
 */

const PDFDocument = require('pdfkit');
const { getDatabase } = require('../database/database');

class InvoicePDFService {
  /**
   * Generate PDF invoice
   */
  async generateInvoicePDF(invoiceId, tenantId) {
    const db = getDatabase();
    
    // Get invoice with related data
    const invoice = await db.get(
      `SELECT i.*, 
              c.name as customer_name,
              c.email as customer_email,
              c.phone as customer_phone,
              c.address as customer_address,
              t.name as tenant_name,
              t.code as tenant_code
       FROM invoices i
       LEFT JOIN customers c ON i.customer_id = c.id
       LEFT JOIN tenants t ON i.tenant_id = t.id
       WHERE i.id = ? AND i.tenant_id = ?`,
      [invoiceId, tenantId]
    );

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    // Get invoice items
    const items = await db.all(
      `SELECT ii.*, p.name as product_name, p.code as product_code
       FROM invoice_items ii
       LEFT JOIN products p ON ii.product_id = p.id
       WHERE ii.invoice_id = ?`,
      [invoiceId]
    );

    // Create PDF
    return this.createPDF(invoice, items);
  }

  /**
   * Create PDF document
   */
  createPDF(invoice, items) {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Company Header
      this.addHeader(doc, invoice);

      // Invoice Details
      this.addInvoiceDetails(doc, invoice);

      // Customer Details
      this.addCustomerDetails(doc, invoice);

      // Line Items Table
      this.addLineItems(doc, items);

      // Summary
      this.addSummary(doc, invoice);

      // Footer
      this.addFooter(doc, invoice);

      doc.end();
    });
  }

  /**
   * Add header with company info
   */
  addHeader(doc, invoice) {
    const companyName = invoice.tenant_name || 'SalesSync Company';
    
    doc
      .fontSize(28)
      .fillColor('#2563eb')
      .text(companyName, 50, 50)
      .fontSize(10)
      .fillColor('#666666')
      .text('Sales & Distribution Management', 50, 85)
      .text('Email: info@salessync.com', 50, 100)
      .text('Phone: +1 (555) 123-4567', 50, 115);

    // Invoice Title
    doc
      .fontSize(24)
      .fillColor('#1f2937')
      .text('INVOICE', 400, 50);

    // Line under header
    doc
      .strokeColor('#e5e7eb')
      .lineWidth(1)
      .moveTo(50, 145)
      .lineTo(550, 145)
      .stroke();
  }

  /**
   * Add invoice details (number, date, etc.)
   */
  addInvoiceDetails(doc, invoice) {
    const y = 165;
    
    doc
      .fontSize(10)
      .fillColor('#666666')
      .text('Invoice Number:', 400, y)
      .fillColor('#1f2937')
      .font('Helvetica-Bold')
      .text(invoice.invoice_number || 'N/A', 500, y)
      .font('Helvetica');

    doc
      .fillColor('#666666')
      .text('Invoice Date:', 400, y + 20)
      .fillColor('#1f2937')
      .text(this.formatDate(invoice.invoice_date), 500, y + 20);

    doc
      .fillColor('#666666')
      .text('Due Date:', 400, y + 40)
      .fillColor('#1f2937')
      .text(this.formatDate(invoice.due_date), 500, y + 40);

    doc
      .fillColor('#666666')
      .text('Status:', 400, y + 60)
      .fillColor(this.getStatusColor(invoice.status))
      .font('Helvetica-Bold')
      .text(invoice.status.toUpperCase(), 500, y + 60)
      .font('Helvetica')
      .fillColor('#1f2937');
  }

  /**
   * Add customer details
   */
  addCustomerDetails(doc, invoice) {
    const y = 165;
    
    doc
      .fontSize(12)
      .fillColor('#1f2937')
      .font('Helvetica-Bold')
      .text('Bill To:', 50, y)
      .font('Helvetica')
      .fontSize(11)
      .text(invoice.customer_name || 'N/A', 50, y + 20)
      .fontSize(9)
      .fillColor('#666666');

    if (invoice.customer_address) {
      doc.text(invoice.customer_address, 50, y + 40, { width: 200 });
    }

    if (invoice.customer_phone) {
      doc.text(`Phone: ${invoice.customer_phone}`, 50, y + 80);
    }

    if (invoice.customer_email) {
      doc.text(`Email: ${invoice.customer_email}`, 50, y + 95);
    }
  }

  /**
   * Add line items table
   */
  addLineItems(doc, items) {
    const tableTop = 300;
    const itemCodeX = 50;
    const descriptionX = 120;
    const quantityX = 350;
    const priceX = 420;
    const totalX = 490;

    // Table Header
    doc
      .fontSize(10)
      .fillColor('#ffffff')
      .rect(50, tableTop, 500, 25)
      .fill('#2563eb');

    doc
      .fillColor('#ffffff')
      .font('Helvetica-Bold')
      .text('Code', itemCodeX, tableTop + 8)
      .text('Description', descriptionX, tableTop + 8)
      .text('Qty', quantityX, tableTop + 8, { width: 60, align: 'right' })
      .text('Price', priceX, tableTop + 8, { width: 60, align: 'right' })
      .text('Total', totalX, tableTop + 8, { width: 60, align: 'right' })
      .font('Helvetica');

    // Table Rows
    let y = tableTop + 35;
    doc.fillColor('#1f2937').fontSize(9);

    items.forEach((item, i) => {
      if (y > 700) {
        doc.addPage();
        y = 50;
      }

      const bgColor = i % 2 === 0 ? '#f9fafb' : '#ffffff';
      doc.rect(50, y - 7, 500, 20).fill(bgColor);

      doc
        .fillColor('#1f2937')
        .text(item.product_code || '-', itemCodeX, y, { width: 60 })
        .text(item.product_name || item.description || '-', descriptionX, y, { width: 220 })
        .text(item.quantity.toString(), quantityX, y, { width: 60, align: 'right' })
        .text(this.formatCurrency(item.unit_price), priceX, y, { width: 60, align: 'right' })
        .text(this.formatCurrency(item.total), totalX, y, { width: 60, align: 'right' });

      y += 20;
    });

    // Bottom line
    doc
      .strokeColor('#e5e7eb')
      .lineWidth(1)
      .moveTo(50, y + 5)
      .lineTo(550, y + 5)
      .stroke();

    return y + 20;
  }

  /**
   * Add summary section
   */
  addSummary(doc, invoice) {
    const y = 680;
    const labelX = 400;
    const valueX = 490;

    doc.fontSize(10).fillColor('#666666');

    // Subtotal
    doc
      .text('Subtotal:', labelX, y)
      .fillColor('#1f2937')
      .text(this.formatCurrency(invoice.subtotal), valueX, y, { width: 60, align: 'right' });

    // Tax
    if (invoice.tax > 0) {
      doc
        .fillColor('#666666')
        .text('Tax:', labelX, y + 20)
        .fillColor('#1f2937')
        .text(this.formatCurrency(invoice.tax), valueX, y + 20, { width: 60, align: 'right' });
    }

    // Discount
    if (invoice.discount > 0) {
      doc
        .fillColor('#666666')
        .text('Discount:', labelX, y + 40)
        .fillColor('#dc2626')
        .text(`-${this.formatCurrency(invoice.discount)}`, valueX, y + 40, { width: 60, align: 'right' });
    }

    // Total line
    doc
      .strokeColor('#2563eb')
      .lineWidth(2)
      .moveTo(400, y + 60)
      .lineTo(550, y + 60)
      .stroke();

    // Total
    doc
      .fontSize(14)
      .fillColor('#666666')
      .font('Helvetica-Bold')
      .text('Total:', labelX, y + 70)
      .fontSize(16)
      .fillColor('#2563eb')
      .text(this.formatCurrency(invoice.total_amount), valueX, y + 70, { width: 60, align: 'right' })
      .font('Helvetica');

    // Paid Amount
    if (invoice.paid_amount > 0) {
      doc
        .fontSize(10)
        .fillColor('#666666')
        .text('Paid:', labelX, y + 95)
        .fillColor('#059669')
        .text(this.formatCurrency(invoice.paid_amount), valueX, y + 95, { width: 60, align: 'right' });
    }

    // Balance
    if (invoice.balance > 0) {
      doc
        .fontSize(12)
        .fillColor('#666666')
        .font('Helvetica-Bold')
        .text('Balance Due:', labelX, y + 115)
        .fillColor('#dc2626')
        .text(this.formatCurrency(invoice.balance), valueX, y + 115, { width: 60, align: 'right' })
        .font('Helvetica');
    }
  }

  /**
   * Add footer with notes and payment terms
   */
  addFooter(doc, invoice) {
    const y = 740;

    // Notes
    if (invoice.notes) {
      doc
        .fontSize(9)
        .fillColor('#666666')
        .font('Helvetica-Bold')
        .text('Notes:', 50, y)
        .font('Helvetica')
        .text(invoice.notes, 50, y + 15, { width: 500 });
    }

    // Payment terms
    doc
      .fontSize(8)
      .fillColor('#999999')
      .text('Payment Terms: Net 30 days', 50, 780)
      .text('Thank you for your business!', 50, 795)
      .text('Generated by SalesSync', 400, 795);
  }

  /**
   * Helper methods
   */
  formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatCurrency(amount) {
    return `$${parseFloat(amount || 0).toFixed(2)}`;
  }

  getStatusColor(status) {
    const colors = {
      'paid': '#059669',
      'partial': '#f59e0b',
      'pending': '#6b7280',
      'overdue': '#dc2626',
      'cancelled': '#ef4444'
    };
    return colors[status.toLowerCase()] || '#6b7280';
  }
}

module.exports = new InvoicePDFService();
