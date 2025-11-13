const express = require('express');
const router = express.Router();

// Module 3: Financial Management - Backend Enhancement (60% → 100%)

const getDatabase = () => require('../utils/database').getDatabase();

// ============================================================================
// ACCOUNTS RECEIVABLE (AR)
// ============================================================================

router.get('/ar/summary', async (req, res) => {
  try {
    const tenantId = req.user.tenantId;

    const summary = await new Promise((resolve, reject) => {
      db.get(`
        SELECT 
          COUNT(DISTINCT customer_id) as total_customers,
          SUM(CASE WHEN status = 'unpaid' THEN amount ELSE 0 END) as total_outstanding,
          SUM(CASE WHEN status = 'overdue' THEN amount ELSE 0 END) as total_overdue,
          SUM(CASE WHEN due_date::date <= DATE('now', '+30 days') THEN amount ELSE 0 END) as due_30_days,
          AVG(JULIANDAY('now') - JULIANDAY(invoice_date)) as avg_collection_days
        FROM invoices
        WHERE tenant_id = ? AND status != 'paid'
      `, [tenantId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    res.json({ success: true, summary });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/ar/aging', async (req, res) => {
  try {
    const tenantId = req.user.tenantId;

    const aging = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          c.id as customer_id,
          c.name as customer_name,
          SUM(i.amount) as total_amount,
          SUM(CASE WHEN JULIANDAY('now') - JULIANDAY(i.due_date) <= 0 THEN i.amount ELSE 0 END) as current,
          SUM(CASE WHEN JULIANDAY('now') - JULIANDAY(i.due_date) BETWEEN 1 AND 30 THEN i.amount ELSE 0 END) as days_1_30,
          SUM(CASE WHEN JULIANDAY('now') - JULIANDAY(i.due_date) BETWEEN 31 AND 60 THEN i.amount ELSE 0 END) as days_31_60,
          SUM(CASE WHEN JULIANDAY('now') - JULIANDAY(i.due_date) BETWEEN 61 AND 90 THEN i.amount ELSE 0 END) as days_61_90,
          SUM(CASE WHEN JULIANDAY('now') - JULIANDAY(i.due_date) > 90 THEN i.amount ELSE 0 END) as days_90_plus
        FROM customers c
        JOIN invoices i ON c.id = i.customer_id
        WHERE i.tenant_id = ? AND i.status != 'paid'
        GROUP BY c.id
        ORDER BY total_amount DESC
      `, [tenantId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });

    res.json({ success: true, aging });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/ar/payment', async (req, res) => {
  try {
    const { customerId, amount, paymentMethod, reference, invoiceAllocations } = req.body;
    const tenantId = req.user.tenantId;

    // Create payment record
    const paymentId = await new Promise((resolve, reject) => {
      db.run(`
        INSERT INTO payments (
          customer_id, amount, payment_method, reference, 
          payment_date, created_by, tenant_id
        ) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?)
      `, [customerId, amount, paymentMethod, reference, req.user.userId, tenantId],
      function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });

    // Allocate to invoices
    for (const alloc of invoiceAllocations) {
      await new Promise((resolve, reject) => {
        db.run(`
          INSERT INTO payment_allocations (
            payment_id, invoice_id, amount, tenant_id
          ) VALUES (?, ?, ?, ?)
        `, [paymentId, alloc.invoiceId, alloc.amount, tenantId], (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      // Update invoice
      await new Promise((resolve, reject) => {
        db.run(`
          UPDATE invoices 
          SET paid_amount = paid_amount + ?,
              status = CASE 
                WHEN paid_amount + ? >= amount THEN 'paid'
                ELSE 'partially_paid'
              END
          WHERE id = ? AND tenant_id = ?
        `, [alloc.amount, alloc.amount, alloc.invoiceId, tenantId], (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }

    res.json({ success: true, paymentId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// ACCOUNTS PAYABLE (AP)
// ============================================================================

router.get('/ap/summary', async (req, res) => {
  try {
    const tenantId = req.user.tenantId;

    const summary = await new Promise((resolve, reject) => {
      db.get(`
        SELECT 
          COUNT(*) as total_bills,
          SUM(CASE WHEN status = 'unpaid' THEN amount ELSE 0 END) as total_outstanding,
          SUM(CASE WHEN due_date::date <= DATE('now', '+7 days') THEN amount ELSE 0 END) as due_this_week,
          SUM(CASE WHEN due_date::date < DATE('now') THEN amount ELSE 0 END) as overdue
        FROM bills
        WHERE tenant_id = ? AND status != 'paid'
      `, [tenantId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    res.json({ success: true, summary });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/ap/payment', async (req, res) => {
  try {
    const { billId, amount, paymentMethod, reference, paymentDate } = req.body;
    const tenantId = req.user.tenantId;

    await new Promise((resolve, reject) => {
      db.run(`
        INSERT INTO vendor_payments (
          bill_id, amount, payment_method, reference,
          payment_date, created_by, tenant_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [billId, amount, paymentMethod, reference, paymentDate, req.user.userId, tenantId],
      (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    await new Promise((resolve, reject) => {
      db.run(`
        UPDATE bills 
        SET paid_amount = paid_amount + ?,
            status = CASE 
              WHEN paid_amount + ? >= amount THEN 'paid'
              ELSE 'partially_paid'
            END
        WHERE id = ? AND tenant_id = ?
      `, [amount, amount, billId, tenantId], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// BANK RECONCILIATION
// ============================================================================

router.post('/bank/import', async (req, res) => {
  try {
    const { bankAccountId, transactions } = req.body;
    const tenantId = req.user.tenantId;

    let imported = 0;
    for (const txn of transactions) {
      await new Promise((resolve, reject) => {
        db.run(`
          INSERT INTO bank_transactions (
            bank_account_id, transaction_date, description,
            amount, balance, reference, tenant_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(bank_account_id, reference, tenant_id) DO NOTHING
        `, [bankAccountId, txn.date, txn.description, txn.amount, 
            txn.balance, txn.reference, tenantId],
        function(err) {
          if (err) reject(err);
          else {
            if (this.changes > 0) imported++;
            resolve();
          }
        });
      });
    }

    res.json({ success: true, imported });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/bank/unmatched', async (req, res) => {
  try {
    const { bankAccountId } = req.query;
    const tenantId = req.user.tenantId;

    const unmatched = await new Promise((resolve, reject) => {
      db.all(`
        SELECT * FROM bank_transactions
        WHERE bank_account_id = ? 
          AND tenant_id = ?
          AND matched = 0
        ORDER BY transaction_date DESC
      `, [bankAccountId, tenantId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });

    res.json({ success: true, unmatched });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/bank/match', async (req, res) => {
  try {
    const { bankTransactionId, transactionType, transactionId } = req.body;
    const tenantId = req.user.tenantId;

    await new Promise((resolve, reject) => {
      db.run(`
        INSERT INTO reconciliation_matches (
          bank_transaction_id, transaction_type, transaction_id, 
          matched_by, tenant_id
        ) VALUES (?, ?, ?, ?, ?)
      `, [bankTransactionId, transactionType, transactionId, req.user.userId, tenantId],
      (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    await new Promise((resolve, reject) => {
      db.run(`
        UPDATE bank_transactions 
        SET matched = 1 
        WHERE id = ? AND tenant_id = ?
      `, [bankTransactionId, tenantId], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// CREDIT MANAGEMENT
// ============================================================================

router.get('/credit/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params;
    const tenantId = req.user.tenantId;

    const credit = await new Promise((resolve, reject) => {
      db.get(`
        SELECT 
          cl.*,
          (SELECT SUM(amount) FROM invoices WHERE customer_id = ? AND status != 'paid' AND tenant_id = ?) as outstanding,
          c.name as customer_name
        FROM credit_limits cl
        JOIN customers c ON cl.customer_id = c.id
        WHERE cl.customer_id = ? AND cl.tenant_id = ?
      `, [customerId, tenantId, customerId, tenantId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    const utilization = credit ? (credit.outstanding / credit.credit_limit * 100) : 0;

    res.json({ success: true, credit: { ...credit, utilization } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/credit/limit', async (req, res) => {
  try {
    const { customerId, creditLimit, paymentTerms, notes } = req.body;
    const tenantId = req.user.tenantId;

    await new Promise((resolve, reject) => {
      db.run(`
        INSERT INTO credit_limits (
          customer_id, credit_limit, payment_terms, notes,
          approved_by, tenant_id
        ) VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(customer_id, tenant_id) DO UPDATE SET
          credit_limit = ?,
          payment_terms = ?,
          notes = ?,
          approved_by = ?,
          updated_at = CURRENT_TIMESTAMP
      `, [customerId, creditLimit, paymentTerms, notes, req.user.userId, tenantId,
          creditLimit, paymentTerms, notes, req.user.userId],
      (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// FINANCIAL REPORTS
// ============================================================================

router.get('/reports/profit-loss', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const tenantId = req.user.tenantId;

    // Revenue
    const revenue = await new Promise((resolve, reject) => {
      db.get(`
        SELECT SUM(total) as total_revenue
        FROM orders
        WHERE tenant_id = ? 
          AND created_at::date BETWEEN ? AND ?
          AND status = 'completed'
      `, [tenantId, startDate, endDate], (err, row) => {
        if (err) reject(err);
        else resolve(row?.total_revenue || 0);
      });
    });

    // COGS (simplified)
    const cogs = await new Promise((resolve, reject) => {
      db.get(`
        SELECT SUM(oi.quantity * p.cost) as total_cogs
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        JOIN products p ON oi.product_id = p.id
        WHERE o.tenant_id = ?
          AND o.created_at::date BETWEEN ? AND ?
          AND o.status = 'completed'
      `, [tenantId, startDate, endDate], (err, row) => {
        if (err) reject(err);
        else resolve(row?.total_cogs || 0);
      });
    });

    const grossProfit = revenue - cogs;
    const grossMargin = revenue > 0 ? (grossProfit / revenue * 100) : 0;

    res.json({
      success: true,
      report: {
        period: { startDate, endDate },
        revenue,
        cogs,
        grossProfit,
        grossMargin: grossMargin.toFixed(2)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/reports/cash-flow', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const tenantId = req.user.tenantId;

    const cashIn = await new Promise((resolve, reject) => {
      db.get(`
        SELECT SUM(amount) as total
        FROM payments
        WHERE tenant_id = ?
          AND payment_date::date BETWEEN ? AND ?
      `, [tenantId, startDate, endDate], (err, row) => {
        if (err) reject(err);
        else resolve(row?.total || 0);
      });
    });

    const cashOut = await new Promise((resolve, reject) => {
      db.get(`
        SELECT SUM(amount) as total
        FROM vendor_payments
        WHERE tenant_id = ?
          AND payment_date::date BETWEEN ? AND ?
      `, [tenantId, startDate, endDate], (err, row) => {
        if (err) reject(err);
        else resolve(row?.total || 0);
      });
    });

    res.json({
      success: true,
      report: {
        period: { startDate, endDate },
        cashIn,
        cashOut,
        netCashFlow: cashIn - cashOut
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
