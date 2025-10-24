/**
 * Email Service
 * SendGrid integration for automated emails
 */

const sgMail = require('@sendgrid/mail');
const invoicePDFService = require('./invoicePDF');

// Initialize SendGrid
const API_KEY = process.env.SENDGRID_API_KEY || 'SG.test_key';
if (API_KEY && API_KEY !== 'SG.test_key') {
  sgMail.setApiKey(API_KEY);
}

class EmailService {
  constructor() {
    this.fromEmail = process.env.FROM_EMAIL || 'noreply@salessync.com';
    this.fromName = process.env.FROM_NAME || 'SalesSync';
    this.enabled = API_KEY && API_KEY !== 'SG.test_key';
  }

  /**
   * Send invoice email with PDF attachment
   */
  async sendInvoiceEmail(invoiceId, tenantId, recipientEmail, options = {}) {
    try {
      if (!this.enabled) {
        console.log('SendGrid not configured, skipping email');
        return { success: false, message: 'Email service not configured' };
      }

      // Generate PDF
      const pdfBuffer = await invoicePDFService.generateInvoicePDF(invoiceId, tenantId);

      // Prepare email
      const msg = {
        to: recipientEmail,
        from: {
          email: this.fromEmail,
          name: this.fromName
        },
        subject: options.subject || `Invoice ${options.invoiceNumber || invoiceId}`,
        text: options.text || this.getInvoiceEmailText(options),
        html: options.html || this.getInvoiceEmailHTML(options),
        attachments: [
          {
            content: pdfBuffer.toString('base64'),
            filename: `invoice-${options.invoiceNumber || invoiceId}.pdf`,
            type: 'application/pdf',
            disposition: 'attachment'
          }
        ]
      };

      // Send email
      const response = await sgMail.send(msg);

      return {
        success: true,
        messageId: response[0].headers['x-message-id'],
        statusCode: response[0].statusCode
      };

    } catch (error) {
      console.error('Error sending invoice email:', error);
      throw error;
    }
  }

  /**
   * Send payment confirmation email
   */
  async sendPaymentConfirmation(recipientEmail, paymentData) {
    try {
      if (!this.enabled) {
        console.log('SendGrid not configured, skipping email');
        return { success: false, message: 'Email service not configured' };
      }

      const msg = {
        to: recipientEmail,
        from: {
          email: this.fromEmail,
          name: this.fromName
        },
        subject: `Payment Confirmation - ${paymentData.amount}`,
        text: this.getPaymentConfirmationText(paymentData),
        html: this.getPaymentConfirmationHTML(paymentData)
      };

      const response = await sgMail.send(msg);

      return {
        success: true,
        messageId: response[0].headers['x-message-id']
      };

    } catch (error) {
      console.error('Error sending payment confirmation:', error);
      throw error;
    }
  }

  /**
   * Send payment reminder
   */
  async sendPaymentReminder(recipientEmail, invoiceData) {
    try {
      if (!this.enabled) {
        console.log('SendGrid not configured, skipping email');
        return { success: false, message: 'Email service not configured' };
      }

      const msg = {
        to: recipientEmail,
        from: {
          email: this.fromEmail,
          name: this.fromName
        },
        subject: `Payment Reminder - Invoice ${invoiceData.invoiceNumber}`,
        text: this.getPaymentReminderText(invoiceData),
        html: this.getPaymentReminderHTML(invoiceData)
      };

      const response = await sgMail.send(msg);

      return {
        success: true,
        messageId: response[0].headers['x-message-id']
      };

    } catch (error) {
      console.error('Error sending payment reminder:', error);
      throw error;
    }
  }

  /**
   * Send order confirmation email
   */
  async sendOrderConfirmation(recipientEmail, orderData) {
    try {
      if (!this.enabled) {
        console.log('SendGrid not configured, skipping email');
        return { success: false, message: 'Email service not configured' };
      }

      const msg = {
        to: recipientEmail,
        from: {
          email: this.fromEmail,
          name: this.fromName
        },
        subject: `Order Confirmation - ${orderData.orderNumber}`,
        text: this.getOrderConfirmationText(orderData),
        html: this.getOrderConfirmationHTML(orderData)
      };

      const response = await sgMail.send(msg);

      return {
        success: true,
        messageId: response[0].headers['x-message-id']
      };

    } catch (error) {
      console.error('Error sending order confirmation:', error);
      throw error;
    }
  }

  /**
   * Send custom email
   */
  async sendEmail({ to, subject, text, html, attachments = [] }) {
    try {
      if (!this.enabled) {
        console.log('SendGrid not configured, skipping email');
        return { success: false, message: 'Email service not configured' };
      }

      const msg = {
        to,
        from: {
          email: this.fromEmail,
          name: this.fromName
        },
        subject,
        text,
        html,
        attachments
      };

      const response = await sgMail.send(msg);

      return {
        success: true,
        messageId: response[0].headers['x-message-id']
      };

    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  /**
   * Email Templates
   */
  getInvoiceEmailText(data) {
    return `
Dear ${data.customerName || 'Customer'},

Please find attached invoice ${data.invoiceNumber} for the amount of ${data.totalAmount}.

Invoice Details:
- Invoice Number: ${data.invoiceNumber}
- Invoice Date: ${data.invoiceDate}
- Due Date: ${data.dueDate}
- Amount: ${data.totalAmount}

If you have any questions, please contact us.

Thank you for your business!

Best regards,
${this.fromName}
    `.trim();
  }

  getInvoiceEmailHTML(data) {
    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9fafb; }
    .invoice-details { background-color: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
    .button { background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; display: inline-block; border-radius: 5px; margin: 15px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Invoice from ${this.fromName}</h1>
    </div>
    <div class="content">
      <p>Dear ${data.customerName || 'Customer'},</p>
      <p>Please find attached your invoice. Here are the details:</p>
      
      <div class="invoice-details">
        <p><strong>Invoice Number:</strong> ${data.invoiceNumber}</p>
        <p><strong>Invoice Date:</strong> ${data.invoiceDate}</p>
        <p><strong>Due Date:</strong> ${data.dueDate}</p>
        <p><strong>Amount:</strong> <span style="font-size: 18px; color: #2563eb;">${data.totalAmount}</span></p>
      </div>
      
      <p>The PDF invoice is attached to this email for your records.</p>
      
      <a href="${data.paymentLink || '#'}" class="button">Pay Invoice</a>
      
      <p>If you have any questions about this invoice, please don't hesitate to contact us.</p>
      
      <p>Thank you for your business!</p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} ${this.fromName}. All rights reserved.</p>
      <p>This is an automated email. Please do not reply directly.</p>
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  getPaymentConfirmationText(data) {
    return `
Dear ${data.customerName || 'Customer'},

Your payment has been successfully processed!

Payment Details:
- Amount: ${data.amount}
- Payment Method: ${data.paymentMethod}
- Transaction ID: ${data.transactionId}
- Date: ${data.paymentDate}

Thank you for your payment!

Best regards,
${this.fromName}
    `.trim();
  }

  getPaymentConfirmationHTML(data) {
    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #059669; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9fafb; }
    .success-box { background-color: #d1fae5; padding: 15px; margin: 15px 0; border-left: 4px solid #059669; border-radius: 5px; }
    .payment-details { background-color: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✓ Payment Confirmed</h1>
    </div>
    <div class="content">
      <div class="success-box">
        <p><strong>Your payment has been successfully processed!</strong></p>
      </div>
      
      <p>Dear ${data.customerName || 'Customer'},</p>
      <p>We have received your payment. Here are the details:</p>
      
      <div class="payment-details">
        <p><strong>Amount Paid:</strong> <span style="font-size: 18px; color: #059669;">${data.amount}</span></p>
        <p><strong>Payment Method:</strong> ${data.paymentMethod}</p>
        <p><strong>Transaction ID:</strong> ${data.transactionId}</p>
        <p><strong>Payment Date:</strong> ${data.paymentDate}</p>
      </div>
      
      <p>Thank you for your prompt payment!</p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} ${this.fromName}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  getPaymentReminderText(data) {
    return `
Dear ${data.customerName || 'Customer'},

This is a friendly reminder that invoice ${data.invoiceNumber} is ${data.daysOverdue ? `${data.daysOverdue} days overdue` : 'due soon'}.

Invoice Details:
- Invoice Number: ${data.invoiceNumber}
- Due Date: ${data.dueDate}
- Amount Due: ${data.amountDue}

Please submit your payment at your earliest convenience.

If you have already made this payment, please disregard this reminder.

Thank you!

Best regards,
${this.fromName}
    `.trim();
  }

  getPaymentReminderHTML(data) {
    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #f59e0b; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9fafb; }
    .warning-box { background-color: #fef3c7; padding: 15px; margin: 15px 0; border-left: 4px solid #f59e0b; border-radius: 5px; }
    .invoice-details { background-color: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
    .button { background-color: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; display: inline-block; border-radius: 5px; margin: 15px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Payment Reminder</h1>
    </div>
    <div class="content">
      <div class="warning-box">
        <p><strong>Payment Reminder</strong></p>
        <p>Invoice ${data.invoiceNumber} is ${data.daysOverdue ? `${data.daysOverdue} days overdue` : 'due soon'}.</p>
      </div>
      
      <p>Dear ${data.customerName || 'Customer'},</p>
      <p>This is a friendly reminder about an outstanding invoice:</p>
      
      <div class="invoice-details">
        <p><strong>Invoice Number:</strong> ${data.invoiceNumber}</p>
        <p><strong>Due Date:</strong> ${data.dueDate}</p>
        <p><strong>Amount Due:</strong> <span style="font-size: 18px; color: #dc2626;">${data.amountDue}</span></p>
      </div>
      
      <p>Please submit your payment at your earliest convenience.</p>
      
      <a href="${data.paymentLink || '#'}" class="button">Pay Now</a>
      
      <p>If you have already made this payment, please disregard this reminder.</p>
      
      <p>Thank you for your prompt attention to this matter.</p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} ${this.fromName}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  getOrderConfirmationText(data) {
    return `
Dear ${data.customerName || 'Customer'},

Thank you for your order!

Order Details:
- Order Number: ${data.orderNumber}
- Order Date: ${data.orderDate}
- Total Amount: ${data.totalAmount}
- Status: ${data.status}

We will process your order and keep you updated.

Thank you for your business!

Best regards,
${this.fromName}
    `.trim();
  }

  getOrderConfirmationHTML(data) {
    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9fafb; }
    .order-details { background-color: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Order Confirmation</h1>
    </div>
    <div class="content">
      <p>Dear ${data.customerName || 'Customer'},</p>
      <p>Thank you for your order! We have received it and are processing it now.</p>
      
      <div class="order-details">
        <p><strong>Order Number:</strong> ${data.orderNumber}</p>
        <p><strong>Order Date:</strong> ${data.orderDate}</p>
        <p><strong>Total Amount:</strong> <span style="font-size: 18px; color: #2563eb;">${data.totalAmount}</span></p>
        <p><strong>Status:</strong> ${data.status}</p>
      </div>
      
      <p>You will receive updates as your order is processed.</p>
      
      <p>Thank you for your business!</p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} ${this.fromName}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `.trim();
  }
}

module.exports = new EmailService();
