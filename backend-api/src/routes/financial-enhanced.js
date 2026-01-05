const express = require('express');
const { getQuery, getOneQuery, runQuery } = require('../utils/database');
const router = express.Router();

// Module 3: Financial Management - Backend Enhancement (60% → 100%)

// ============================================================================
// ACCOUNTS RECEIVABLE (AR)
// ============================================================================

router.get('/ar/summary', async (req, res) => {
  try {
    const tenantId = req.user.tenantId;

    const summary = await getOneQuery(`
      SELECT 
        COUNT(DISTINCT customer_id) as total_customers,
        SUM(CASE WHEN status = 'unpaid' THEN amount ELSE 0 END) as total_outstanding,
        SUM(CASE WHEN status = 'overdue' THEN amount ELSE 0 END) as total_overdue,
        SUM(CASE WHEN DATE(due_date) <= DATE('now', '+30 days') THEN amount ELSE 0 END) as due_30_days,
        AVG(JULIANDAY('now') - JULIANDAY(invoice_date)) as avg_collection_days
      FROM invoices
      WHERE tenant_id = ? AND status != 'paid'
    `, [tenantId]);

    res.json({ success: true, summary });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/ar/aging', async (req, res) => {
  try {
    const tenantId = req.user.tenantId;

    const aging = await getQuery(`
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
    `, [tenantId]);

    res.json({ success: true, aging: aging || [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/ar/payment', async (req, res) => {
  try {
    const { customerId, amount, paymentMethod, reference, invoiceAllocations } = req.body;
    const tenantId = req.user.tenantId;

    // Create payment record
    const result = await runQuery(`
      INSERT INTO payments (
        customer_id, amount, payment_method, reference, 
        payment_date, created_by, tenant_id
      ) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?)
    `, [customerId, amount, paymentMethod, reference, req.user.userId, tenantId]);
    
    const paymentId = result.lastID;

    // Allocate to invoices
    for (const alloc of invoiceAllocations) {
      await runQuery(`
        INSERT INTO payment_allocations (
          payment_id, invoice_id, amount, tenant_id
        ) VALUES (?, ?, ?, ?)
      `, [paymentId, alloc.invoiceId, alloc.amount, tenantId]);

      // Update invoice
      await runQuery(`
        UPDATE invoices 
        SET paid_amount = paid_amount + ?,
            status = CASE 
              WHEN paid_amount + ? >= amount THEN 'paid'
              ELSE 'partially_paid'
            END
        WHERE id = ? AND tenant_id = ?
      `, [alloc.amount, alloc.amount, alloc.invoiceId, tenantId]);
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

    const summary = await getOneQuery(`
      SELECT 
        COUNT(*) as total_bills,
        SUM(CASE WHEN status = 'unpaid' THEN amount ELSE 0 END) as total_outstanding,
        SUM(CASE WHEN DATE(due_date) <= DATE('now', '+7 days') THEN amount ELSE 0 END) as due_this_week,
        SUM(CASE WHEN DATE(due_date) < DATE('now') THEN amount ELSE 0 END) as overdue
      FROM bills
      WHERE tenant_id = ? AND status != 'paid'
    `, [tenantId]);

    res.json({ success: true, summary });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/ap/payment', async (req, res) => {
  try {
    const { billId, amount, paymentMethod, reference, paymentDate } = req.body;
    const tenantId = req.user.tenantId;

    await runQuery(`
      INSERT INTO vendor_payments (
        bill_id, amount, payment_method, reference,
        payment_date, created_by, tenant_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [billId, amount, paymentMethod, reference, paymentDate, req.user.userId, tenantId]);

    await runQuery(`
      UPDATE bills 
      SET paid_amount = paid_amount + ?,
          status = CASE 
            WHEN paid_amount + ? >= amount THEN 'paid'
            ELSE 'partially_paid'
          END
      WHERE id = ? AND tenant_id = ?
    `, [amount, amount, billId, tenantId]);

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
      const result = await runQuery(`
        INSERT OR IGNORE INTO bank_transactions (
          bank_account_id, transaction_date, description,
          amount, balance, reference, tenant_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [bankAccountId, txn.date, txn.description, txn.amount, 
          txn.balance, txn.reference, tenantId]);
      
      if (result.changes > 0) imported++;
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

    const unmatched = await getQuery(`
      SELECT * FROM bank_transactions
      WHERE bank_account_id = ? 
        AND tenant_id = ?
        AND matched = 0
      ORDER BY transaction_date DESC
    `, [bankAccountId, tenantId]);

    res.json({ success: true, unmatched: unmatched || [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/bank/match', async (req, res) => {
  try {
    const { bankTransactionId, transactionType, transactionId } = req.body;
    const tenantId = req.user.tenantId;

    await runQuery(`
      INSERT INTO reconciliation_matches (
        bank_transaction_id, transaction_type, transaction_id, 
        matched_by, tenant_id
      ) VALUES (?, ?, ?, ?, ?)
    `, [bankTransactionId, transactionType, transactionId, req.user.userId, tenantId]);

    await runQuery(`
      UPDATE bank_transactions 
      SET matched = 1 
      WHERE id = ? AND tenant_id = ?
    `, [bankTransactionId, tenantId]);

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

    const credit = await getOneQuery(`
      SELECT 
        cl.*,
        (SELECT SUM(amount) FROM invoices WHERE customer_id = ? AND status != 'paid' AND tenant_id = ?) as outstanding,
        c.name as customer_name
      FROM credit_limits cl
      JOIN customers c ON cl.customer_id = c.id
      WHERE cl.customer_id = ? AND cl.tenant_id = ?
    `, [customerId, tenantId, customerId, tenantId]);

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

    await runQuery(`
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
        creditLimit, paymentTerms, notes, req.user.userId]);

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
    const revenueResult = await getOneQuery(`
      SELECT SUM(total) as total_revenue
      FROM orders
      WHERE tenant_id = ? 
        AND DATE(created_at) BETWEEN ? AND ?
        AND status = 'completed'
    `, [tenantId, startDate, endDate]);
    const revenue = revenueResult?.total_revenue || 0;

    // COGS (simplified)
    const cogsResult = await getOneQuery(`
      SELECT SUM(oi.quantity * p.cost) as total_cogs
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN products p ON oi.product_id = p.id
      WHERE o.tenant_id = ?
        AND DATE(o.created_at) BETWEEN ? AND ?
        AND o.status = 'completed'
    `, [tenantId, startDate, endDate]);
    const cogs = cogsResult?.total_cogs || 0;

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

    const cashInResult = await getOneQuery(`
      SELECT SUM(amount) as total
      FROM payments
      WHERE tenant_id = ?
        AND DATE(payment_date) BETWEEN ? AND ?
    `, [tenantId, startDate, endDate]);
    const cashIn = cashInResult?.total || 0;

    const cashOutResult = await getOneQuery(`
      SELECT SUM(amount) as total
      FROM vendor_payments
      WHERE tenant_id = ?
        AND DATE(payment_date) BETWEEN ? AND ?
    `, [tenantId, startDate, endDate]);
    const cashOut = cashOutResult?.total || 0;

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
