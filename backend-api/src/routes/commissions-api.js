const express = require('express');
const router = express.Router();
const getDatabase = () => require('../utils/database').getDatabase();

/**
 * Commissions API
 * Commission calculation, payout tracking, and agent earnings
 */

// GET /api/commissions-api - Get all commissions
router.get('/', async (req, res) => {
  try {
    const { agent_id, period, status, from_date, to_date } = req.query;
    const tenantId = req.tenantId || 1;
    const db = getDatabase();

    let sql = `SELECT c.*, u.first_name || ' ' || u.last_name as agent_name FROM commissions c
      LEFT JOIN users u ON c.agent_id = u.id WHERE c.tenant_id = ?`;
    const params = [tenantId];

    if (agent_id) { sql += ' AND c.agent_id = ?'; params.push(agent_id); }
    if (period) { sql += ' AND c.period = ?'; params.push(period); }
    if (status) { sql += ' AND c.status = ?'; params.push(status); }
    if (from_date) { sql += ' AND c.period_start >= ?'; params.push(from_date); }
    if (to_date) { sql += ' AND c.period_end <= ?'; params.push(to_date); }

    sql += ' ORDER BY c.period_start DESC';

    db.all(sql, params, (err, rows) => {
      if (err) return res.status(500).json({ error: 'Failed to fetch commissions' });
      res.json({ success: true, data: rows || [] });
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/commissions-api/calculate - Calculate commissions for period
router.post('/calculate', async (req, res) => {
  try {
    const { agent_id, period_start, period_end, commission_rate } = req.body;
    const tenantId = req.tenantId || 1;
    const userId = req.userId || 1;
    const db = getDatabase();

    // Calculate total sales for period
    db.get(`SELECT SUM(total_amount) as total_sales, COUNT(*) as order_count FROM orders
      WHERE agent_id = ? AND order_date BETWEEN ? AND ? AND tenant_id = ?`,
      [agent_id, period_start, period_end, tenantId],
      (err, sales) => {
        if (err) return res.status(500).json({ error: 'Failed to calculate sales' });

        const totalSales = sales.total_sales || 0;
        const orderCount = sales.order_count || 0;
        const commissionAmount = totalSales * (commission_rate || 0.05); // Default 5%

        const refNumber = `COM-${Date.now()}`;
        db.run(`INSERT INTO commissions (tenant_id, commission_number, agent_id, period_start, period_end, total_sales, order_count, commission_rate, commission_amount, status, created_by, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'calculated', ?, datetime('now'))`,
          [tenantId, refNumber, agent_id, period_start, period_end, totalSales, orderCount, commission_rate, commissionAmount, userId],
          function(err) {
            if (err) return res.status(500).json({ error: 'Failed to save commission' });
            res.status(201).json({ success: true, data: { id: this.lastID, commission_number: refNumber, amount: commissionAmount } });
          }
        );
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/commissions-api/:id/approve - Approve commission
router.post('/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId || 1;
    const userId = req.userId || 1;
    const db = getDatabase();

    db.run(`UPDATE commissions SET status = 'approved', approved_by = ?, approved_at = datetime('now') WHERE id = ? AND tenant_id = ?`,
      [userId, id, tenantId],
      function(err) {
        if (err || this.changes === 0) return res.status(500).json({ error: 'Failed to approve commission' });
        res.json({ success: true, message: 'Commission approved successfully' });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/commissions-api/:id/pay - Mark commission as paid
router.post('/:id/pay', async (req, res) => {
  try {
    const { id } = req.params;
    const { payment_method, payment_reference } = req.body;
    const tenantId = req.tenantId || 1;
    const userId = req.userId || 1;
    const db = getDatabase();

    db.run(`UPDATE commissions SET status = 'paid', payment_method = ?, payment_reference = ?, paid_by = ?, paid_at = datetime('now') WHERE id = ? AND tenant_id = ? AND status = 'approved'`,
      [payment_method, payment_reference, userId, id, tenantId],
      function(err) {
        if (err || this.changes === 0) return res.status(500).json({ error: 'Failed to mark as paid' });
        res.json({ success: true, message: 'Commission marked as paid' });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/commissions-api/summary - Get commission summary
router.get('/summary', async (req, res) => {
  try {
    const { agent_id } = req.query;
    const tenantId = req.tenantId || 1;
    const db = getDatabase();

    let sql = `SELECT status, COUNT(*) as count, SUM(commission_amount) as total FROM commissions WHERE tenant_id = ?`;
    const params = [tenantId];
    if (agent_id) { sql += ' AND agent_id = ?'; params.push(agent_id); }
    sql += ' GROUP BY status';

    db.all(sql, params, (err, summary) => {
      if (err) return res.status(500).json({ error: 'Failed to fetch summary' });
      res.json({ success: true, data: summary || [] });
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
