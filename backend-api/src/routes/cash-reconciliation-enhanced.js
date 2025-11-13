const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { getQuery, getOneQuery, runQuery } = require('../utils/database');

// Cash reconciliation workflow: Collection → Counting → Reconciliation → Deposit

// POST /api/cash-reconciliation/sessions/start - Start cash collection session
router.post('/sessions/start', asyncHandler(async (req, res) => {
  const { agent_id, opening_float } = req.body;
  const tenantId = req.tenantId;
  const userId = req.user.userId;

  const sessionId = require('crypto').randomBytes(16).toString('hex');
  await runQuery(
    `INSERT INTO cash_sessions (id, tenant_id, agent_id, opening_float, status, started_by, started_at)
     VALUES (?, ?, ?, ?, 'open', ?, CURRENT_TIMESTAMP)`,
    [sessionId, tenantId, agent_id, opening_float || 0, userId]
  );

  res.status(201).json({ success: true, data: { session_id: sessionId } });
}));

// POST /api/cash-reconciliation/sessions/:id/collect - Record cash collection
router.post('/sessions/:id/collect', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { order_id, amount, payment_method, denominations } = req.body;
  const tenantId = req.tenantId;

  const session = await getOneQuery('SELECT * FROM cash_sessions WHERE id = ? AND tenant_id = ?', [id, tenantId]);
  if (!session) throw new Error('Cash session not found');
  if (session.status !== 'open') throw new Error('Cash session is not open');

  const collectionId = require('crypto').randomBytes(16).toString('hex');
  await runQuery(
    `INSERT INTO cash_collections (id, session_id, order_id, amount, payment_method, denominations, collected_at)
     VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
    [collectionId, id, order_id, amount, payment_method, JSON.stringify(denominations)]
  );

  await runQuery(
    'UPDATE cash_sessions SET total_collected = total_collected + ? WHERE id = ?',
    [amount, id]
  );

  res.status(201).json({ success: true, data: { collection_id: collectionId } });
}));

// POST /api/cash-reconciliation/sessions/:id/close - Close session and reconcile
router.post('/sessions/:id/close', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { closing_cash, denominations, notes } = req.body;
  const tenantId = req.tenantId;
  const userId = req.user.userId;

  await runQuery('BEGIN');

  try {
    const session = await getOneQuery('SELECT * FROM cash_sessions WHERE id = $1 AND tenant_id = $2', [id, tenantId]);
    if (!session) throw new Error('Cash session not found');
    if (session.status !== 'open') throw new Error('Cash session is not open');

    const expectedCash = session.opening_float + session.total_collected;
    const variance = closing_cash - expectedCash;
    const variancePercentage = (variance / expectedCash) * 100;

    const requiresApproval = Math.abs(variancePercentage) > 1;
    const status = requiresApproval ? 'pending_approval' : 'closed';

    await runQuery(
      `UPDATE cash_sessions 
       SET closing_cash = $1, expected_cash = $2, variance = $3, variance_percentage = $4, 
           denominations = $5, notes = $6, status = $7, closed_by = $8, closed_at = CURRENT_TIMESTAMP
       WHERE id = $9`,
      [closing_cash, expectedCash, variance, variancePercentage, JSON.stringify(denominations), notes, status, userId, id]
    );

    await runQuery('COMMIT');

    res.json({
      success: true,
      data: {
        expected_cash: expectedCash,
        closing_cash: closing_cash,
        variance: variance,
        variance_percentage: variancePercentage.toFixed(2) + '%',
        requires_approval: requiresApproval,
        status: status
      }
    });
  } catch (error) {
    await runQuery('ROLLBACK');
    throw error;
  }
}));

// POST /api/cash-reconciliation/sessions/:id/approve - Approve variance
router.post('/sessions/:id/approve', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { approval_notes } = req.body;
  const tenantId = req.tenantId;
  const userId = req.user.userId;

  const session = await getOneQuery('SELECT * FROM cash_sessions WHERE id = ? AND tenant_id = ?', [id, tenantId]);
  if (!session) throw new Error('Cash session not found');
  if (session.status !== 'pending_approval') throw new Error('Session does not require approval');

  await runQuery(
    'UPDATE cash_sessions SET status = \'closed\', approved_by = ?, approval_notes = ?, approved_at = datetime(\'now\') WHERE id = ?',
    [userId, approval_notes, id]
  );

  res.json({ success: true, message: 'Cash session approved' });
}));

// POST /api/cash-reconciliation/deposits - Record bank deposit
router.post('/deposits', asyncHandler(async (req, res) => {
  const { session_ids, bank_account, deposit_amount, deposit_slip_number, deposit_date } = req.body;
  const tenantId = req.tenantId;
  const userId = req.user.userId;

  await runQuery('BEGIN');

  try {
    const depositId = require('crypto').randomBytes(16).toString('hex');
    await runQuery(
      `INSERT INTO bank_deposits (id, tenant_id, bank_account, amount, deposit_slip_number, deposit_date, created_by, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)`,
      [depositId, tenantId, bank_account, deposit_amount, deposit_slip_number, deposit_date, userId]
    );

    for (const sessionId of session_ids) {
      await runQuery(
        'UPDATE cash_sessions SET deposit_id = $1, deposited_at = CURRENT_TIMESTAMP WHERE id = $2 AND tenant_id = $3',
        [depositId, sessionId, tenantId]
      );
    }

    await runQuery('COMMIT');

    res.status(201).json({ success: true, data: { deposit_id: depositId } });
  } catch (error) {
    await runQuery('ROLLBACK');
    throw error;
  }
}));

// GET /api/cash-reconciliation/sessions - List cash sessions
router.get('/sessions', asyncHandler(async (req, res) => {
  const tenantId = req.tenantId;
  const { status, agent_id, date_from, date_to } = req.query;

  let query = `
    SELECT cs.*, 
           u.first_name || ' ' || u.last_name as agent_name,
           COUNT(cc.id) as collection_count
    FROM cash_sessions cs
    LEFT JOIN users a ON cs.agent_id = a.id
    LEFT JOIN users u ON a.user_id = u.id
    LEFT JOIN cash_collections cc ON cs.id = cc.session_id
    WHERE cs.tenant_id = ?
  `;
  const params = [tenantId];

  if (status) {
    query += ' AND cs.status = ?';
    params.push(status);
  }
  if (agent_id) {
    query += ' AND cs.agent_id = ?';
    params.push(agent_id);
  }
  if (date_from) {
    query += ' AND cs.started_at::date >= ?';
    params.push(date_from);
  }
  if (date_to) {
    query += ' AND cs.started_at::date <= ?';
    params.push(date_to);
  }

  query += ' GROUP BY cs.id ORDER BY cs.started_at DESC';

  const sessions = await getQuery(query, params);
  res.json({ success: true, data: sessions || [] });
}));

// GET /api/cash-reconciliation/reports/daily - Daily cash reconciliation report
router.get('/reports/daily', asyncHandler(async (req, res) => {
  const tenantId = req.tenantId;
  const { date } = req.query;
  const reportDate = date || new Date().toISOString().split('T')[0];

  const summary = await getOneQuery(
    `SELECT 
       COUNT(DISTINCT cs.id) as total_sessions,
       SUM(cs.opening_float) as total_opening_float,
       SUM(cs.total_collected) as total_collected,
       SUM(cs.closing_cash) as total_closing_cash,
       SUM(cs.variance) as total_variance,
       COUNT(CASE WHEN cs.status = 'pending_approval' THEN 1 END) as pending_approvals,
       COUNT(CASE WHEN cs.status = 'closed' THEN 1 END) as closed_sessions
     FROM cash_sessions cs
     WHERE cs.tenant_id = ? AND cs.started_at::date = ?`,
    [tenantId, reportDate]
  );

  const byAgent = await getQuery(
    `SELECT 
       a.id as agent_id,
       u.first_name || ' ' || u.last_name as agent_name,
       COUNT(cs.id) as session_count,
       SUM(cs.total_collected) as total_collected,
       SUM(cs.variance) as total_variance
     FROM cash_sessions cs
     JOIN users a ON cs.agent_id = a.id
     LEFT JOIN users u ON a.user_id = u.id
     WHERE cs.tenant_id = ? AND cs.started_at::date = ?
     GROUP BY a.id, agent_name`,
    [tenantId, reportDate]
  );

  res.json({
    success: true,
    data: {
      date: reportDate,
      summary: summary || {},
      by_agent: byAgent || []
    }
  });
}));

module.exports = router;
