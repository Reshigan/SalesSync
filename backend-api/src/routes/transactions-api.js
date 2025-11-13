const express = require('express');
const router = express.Router();
const getDatabase = () => require('../utils/database').getDatabase();

/**
 * Transactions API
 * Payment processing, refunds, transaction tracking
 */

// GET /api/transactions-api - Get all transactions
router.get('/', async (req, res) => {
  try {
    const { type, status, customer_id, from_date, to_date } = req.query;
    const tenantId = req.tenantId || 1;

    let sql = `SELECT t.*, c.name as customer_name FROM cash_transactions t
      LEFT JOIN customers c ON t.customer_id = c.id WHERE t.tenant_id = ?`;
    const params = [tenantId];

    if (type) { sql += ' AND t.transaction_type = ?'; params.push(type); }
    if (status) { sql += ' AND t.status = ?'; params.push(status); }
    if (customer_id) { sql += ' AND t.customer_id = ?'; params.push(customer_id); }
    if (from_date) { sql += ' AND t.transaction_date >= ?'; params.push(from_date); }
    if (to_date) { sql += ' AND t.transaction_date <= ?'; params.push(to_date); }

    sql += ' ORDER BY t.transaction_date DESC';

    db.all(sql, params, (err, rows) => {
      if (err) return res.status(500).json({ error: 'Failed to fetch transactions' });
      res.json({ success: true, data: rows || [] });
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/transactions-api - Create transaction
router.post('/', async (req, res) => {
  try {
    const { transaction_type, customer_id, order_id, amount, payment_method, reference, notes } = req.body;
    const tenantId = req.tenantId || 1;
    const userId = req.userId || 1;

    if (!transaction_type || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const txnNumber = `TXN-${Date.now()}`;
    db.run(`INSERT INTO transactions (tenant_id, transaction_number, transaction_type, customer_id, order_id, amount, payment_method, reference, notes, status, created_by, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', ?, CURRENT_TIMESTAMP)`,
      [tenantId, txnNumber, transaction_type, customer_id, order_id, amount, payment_method || 'cash', reference, notes, userId],
      function(err) {
        if (err) return res.status(500).json({ error: 'Failed to create transaction' });
        res.status(201).json({ success: true, data: { id: this.lastID, transaction_number: txnNumber } });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/transactions-api/refunds - Create refund
router.post('/refunds', async (req, res) => {
  try {
    const { original_transaction_id, amount, reason, notes } = req.body;
    const tenantId = req.tenantId || 1;
    const userId = req.userId || 1;

    const refNumber = `REF-${Date.now()}`;
    db.run(`INSERT INTO refunds (tenant_id, refund_number, original_transaction_id, amount, reason, notes, status, created_by, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, CURRENT_TIMESTAMP)`,
      [tenantId, refNumber, original_transaction_id, amount, reason, notes, userId],
      function(err) {
        if (err) return res.status(500).json({ error: 'Failed to create refund' });
        res.status(201).json({ success: true, data: { id: this.lastID, refund_number: refNumber } });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/transactions-api/summary - Get transaction summary
router.get('/summary', async (req, res) => {
  try {
    const { from_date, to_date } = req.query;
    const tenantId = req.tenantId || 1;

    let sql = `SELECT transaction_type, SUM(amount) as total, COUNT(*) as count FROM transactions WHERE tenant_id = ?`;
    const params = [tenantId];
    if (from_date) { sql += ' AND transaction_date >= ?'; params.push(from_date); }
    if (to_date) { sql += ' AND transaction_date <= ?'; params.push(to_date); }
    sql += ' GROUP BY transaction_type';

    db.all(sql, params, (err, summary) => {
      if (err) return res.status(500).json({ error: 'Failed to fetch summary' });
      res.json({ success: true, data: summary || [] });
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
