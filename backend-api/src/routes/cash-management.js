const express = require('express');
const router = express.Router();
const getDatabase = () => require('../utils/database').getDatabase();

/**
 * Cash Management API
 * Cash recording, reconciliation, banking deposits, and tracking
 */

// GET /api/cash-management - Get module info
router.get('/', async (req, res) => {
  try {
    res.json({ 
      success: true, 
      message: 'Cash Management module active',
      endpoints: {
        collections: '/collections',
        reconciliations: '/reconciliations',
        deposits: '/deposits',
        summary: '/summary'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/cash-management/collections - Get cash collections
router.get('/collections', async (req, res) => {
  try {
    const { agent_id, from_date, to_date, status } = req.query;
    const tenantId = req.tenantId || 1;
    const db = getDatabase();

    let sql = `SELECT cc.*, u.first_name || ' ' || u.last_name as agent_name, r.route_number FROM cash_collections cc
      LEFT JOIN users u ON cc.agent_id = u.id
      LEFT JOIN van_sales_routes r ON cc.route_id = r.id
      WHERE cc.tenant_id = ?`;
    const params = [tenantId];

    if (agent_id) { sql += ' AND cc.agent_id = ?'; params.push(agent_id); }
    if (from_date) { sql += ' AND cc.collection_date >= ?'; params.push(from_date); }
    if (to_date) { sql += ' AND cc.collection_date <= ?'; params.push(to_date); }
    if (status) { sql += ' AND cc.status = ?'; params.push(status); }

    sql += ' ORDER BY cc.collection_date DESC';

    db.all(sql, params, (err, rows) => {
      if (err) return res.status(500).json({ error: 'Failed to fetch collections' });
      res.json({ success: true, data: rows || [] });
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/cash-management/collections - Record cash collection
router.post('/collections', async (req, res) => {
  try {
    const { route_id, agent_id, customer_id, collection_date, amount, payment_method, reference, notes } = req.body;
    const tenantId = req.tenantId || 1;
    const userId = req.userId || 1;
    const db = getDatabase();

    if (!agent_id || !amount) {
      return res.status(400).json({ error: 'Missing required fields: agent_id, amount' });
    }

    const receiptNumber = `RCPT-${Date.now()}`;
    db.run(`INSERT INTO cash_collections (tenant_id, receipt_number, route_id, agent_id, customer_id, collection_date, amount, payment_method, reference, notes, status, created_by, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, datetime('now'))`,
      [tenantId, receiptNumber, route_id, agent_id, customer_id, collection_date || new Date().toISOString().split('T')[0], amount, payment_method || 'cash', reference, notes, userId],
      function(err) {
        if (err) return res.status(500).json({ error: 'Failed to record collection' });
        res.status(201).json({ success: true, data: { id: this.lastID, receipt_number: receiptNumber } });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/cash-management/reconciliations - Create cash reconciliation
router.post('/reconciliations', async (req, res) => {
  try {
    const { route_id, agent_id, reconciliation_date, expected_cash, actual_cash, variance_reason, denominations } = req.body;
    const tenantId = req.tenantId || 1;
    const userId = req.userId || 1;
    const db = getDatabase();

    const refNumber = `REC-${Date.now()}`;
    const variance = actual_cash - expected_cash;

    db.run(`INSERT INTO cash_reconciliations (tenant_id, reference_number, route_id, agent_id, reconciliation_date, expected_cash, actual_cash, variance, variance_reason, denominations, status, created_by, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, datetime('now'))`,
      [tenantId, refNumber, route_id, agent_id, reconciliation_date || new Date().toISOString().split('T')[0], expected_cash, actual_cash, variance, variance_reason, JSON.stringify(denominations), userId],
      function(err) {
        if (err) return res.status(500).json({ error: 'Failed to create reconciliation' });
        res.status(201).json({ success: true, data: { id: this.lastID, reference_number: refNumber, variance } });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/cash-management/reconciliations/:id/approve - Approve reconciliation
router.post('/reconciliations/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId || 1;
    const userId = req.userId || 1;
    const db = getDatabase();

    db.run(`UPDATE cash_reconciliations SET status = 'approved', approved_by = ?, approved_at = datetime('now') WHERE id = ? AND tenant_id = ?`,
      [userId, id, tenantId],
      function(err) {
        if (err || this.changes === 0) return res.status(500).json({ error: 'Failed to approve reconciliation' });
        res.json({ success: true, message: 'Reconciliation approved successfully' });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/cash-management/deposits - Record bank deposit
router.post('/deposits', async (req, res) => {
  try {
    const { deposit_date, bank_name, account_number, amount, deposit_slip, notes } = req.body;
    const tenantId = req.tenantId || 1;
    const userId = req.userId || 1;
    const db = getDatabase();

    if (!deposit_date || !bank_name || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const refNumber = `DEP-${Date.now()}`;
    db.run(`INSERT INTO bank_deposits (tenant_id, reference_number, deposit_date, bank_name, account_number, amount, deposit_slip, notes, status, created_by, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, datetime('now'))`,
      [tenantId, refNumber, deposit_date, bank_name, account_number, amount, deposit_slip, notes, userId],
      function(err) {
        if (err) return res.status(500).json({ error: 'Failed to record deposit' });
        res.status(201).json({ success: true, data: { id: this.lastID, reference_number: refNumber } });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/cash-management/summary - Get cash summary
router.get('/summary', async (req, res) => {
  try {
    const { from_date, to_date } = req.query;
    const tenantId = req.tenantId || 1;
    const db = getDatabase();

    let sql = `SELECT SUM(amount) as total_collected, COUNT(*) as collection_count FROM cash_collections WHERE tenant_id = ?`;
    const params = [tenantId];
    if (from_date) { sql += ' AND collection_date >= ?'; params.push(from_date); }
    if (to_date) { sql += ' AND collection_date <= ?'; params.push(to_date); }

    db.get(sql, params, (err, summary) => {
      if (err) return res.status(500).json({ error: 'Failed to fetch summary' });
      res.json({ success: true, data: summary || { total_collected: 0, collection_count: 0 } });
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
