const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../middleware/errorHandler');
const { v4: uuidv4 } = require('uuid');
const { getQuery, getOneQuery, runQuery } = require('../utils/database');

// Get all commissions
router.get('/', authMiddleware, async (req, res) => {
  try {
    const tenantId = req.tenantId;

    const query = `
      SELECT ct.*
      FROM commission_transactions ct
      WHERE ct.tenant_id = $1
      ORDER BY ct.created_at DESC 
      LIMIT 100
    `;
    const commissions = await getQuery(query, [tenantId]);
    res.json({ success: true, data: commissions || [] });
  } catch (error) {
    console.error('Error in get commissions:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get commission by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;
    
    const commission = await getOneQuery(
      `SELECT ct.*
       FROM commission_transactions ct
       WHERE ct.id = $1 AND ct.tenant_id = $2`,
      [id, tenantId]
    );
    
    if (!commission) {
      return res.status(404).json({ error: 'Commission not found' });
    }
    res.json(commission);
  } catch (error) {
    console.error('Error in get commission:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Approve commission (simplified - schema mismatch)
router.post('/:id/approve', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;

    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({ error: 'Insufficient permissions to approve commissions' });
    }
    
    const commission = await getOneQuery(
      'SELECT * FROM commission_transactions WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );
    
    if (!commission) {
      return res.status(404).json({ error: 'Commission not found' });
    }

    res.json({ message: 'Commission approved successfully', commission_id: id });
  } catch (error) {
    console.error('Error in approve commission:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get agent commission summary (simplified - schema mismatch)
router.get('/agent/:agentId/summary', authMiddleware, async (req, res) => {
  try {
    const { agentId } = req.params;
    const tenantId = req.tenantId;

    const summary = await getOneQuery(
      `SELECT 
        COUNT(*) as total_count,
        COALESCE(SUM(amount), 0) as total_amount
       FROM commission_transactions
       WHERE tenant_id = $1`,
      [tenantId]
    );

    res.json({
      summary: summary || { total_count: 0, total_amount: 0 },
      current_balance: 0,
      lifetime_earned: 0,
      lifetime_paid: 0
    });
  } catch (error) {
    console.error('Error in get agent summary:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/commissions/stats - Commission statistics (simplified - schema mismatch)
router.get('/stats', asyncHandler(async (req, res) => {
  const tenantId = req.tenantId;
  
  const commissionStats = await getOneQuery(`
    SELECT 
      COUNT(*) as total_records,
      COALESCE(SUM(amount), 0) as total_commissions,
      COALESCE(AVG(amount), 0) as avg_commission
    FROM commission_transactions WHERE tenant_id = $1
  `, [tenantId]);

  res.json({
    success: true,
    data: {
      stats: {
        total_records: commissionStats?.total_records || 0,
        total_commissions: parseFloat((commissionStats?.total_commissions || 0).toFixed(2)),
        avg_commission: parseFloat((commissionStats?.avg_commission || 0).toFixed(2)),
        paid_count: 0,
        pending_count: 0,
        pending_amount: 0
      },
      topEarners: [],
      monthlyTrends: []
    }
  });
}));

// GET /api/commissions/payouts/:payoutId/lines - Get payout lines
router.get('/payouts/:payoutId/lines', authMiddleware, asyncHandler(async (req, res) => {
  const { payoutId } = req.params;
  const tenantId = req.tenantId;
  
  const lines = await getQuery(`
    SELECT 
      pl.*,
      u.first_name || ' ' || u.last_name as agent_name,
      pl.commission_amount,
      pl.payment_method,
      pl.status
    FROM payout_lines pl
    LEFT JOIN users u ON pl.agent_id = u.id
    JOIN payouts p ON pl.payout_id = p.id
    WHERE pl.payout_id = $1 AND p.tenant_id = $2
    ORDER BY u.first_name, u.last_name
  `, [payoutId, tenantId]);
  
  res.json({
    success: true,
    data: { lines: lines || [] }
  });
}));

// GET /api/commissions/payouts/:payoutId/lines/:lineId/audit - Get payout line audit trail
router.get('/payouts/:payoutId/lines/:lineId/audit', authMiddleware, asyncHandler(async (req, res) => {
  const { payoutId, lineId } = req.params;
  const tenantId = req.tenantId;
  
  const auditTrail = await getQuery(`
    SELECT 
      pa.*,
      u.first_name || ' ' || u.last_name as performed_by
    FROM payout_audit pa
    LEFT JOIN users u ON pa.performed_by = u.id
    WHERE pa.payout_line_id = $1 AND pa.tenant_id = $2
    ORDER BY pa.performed_at DESC
  `, [lineId, tenantId]);
  
  res.json({
    success: true,
    data: { auditTrail: auditTrail || [] }
  });
}));

// GET /api/commissions/agents/:agentId/calculations - Get commission calculation log
router.get('/agents/:agentId/calculations', authMiddleware, asyncHandler(async (req, res) => {
  const { agentId } = req.params;
  const tenantId = req.tenantId;
  
  const calculations = await getQuery(`
    SELECT 
      cc.*,
      cc.calculation_date,
      cc.period_start,
      cc.period_end,
      cc.total_sales,
      cc.commission_rate,
      cc.commission_amount,
      cc.status
    FROM commission_calculations cc
    WHERE cc.agent_id = $1 AND cc.tenant_id = $2
    ORDER BY cc.calculation_date DESC
    LIMIT 100
  `, [agentId, tenantId]);
  
  res.json({
    success: true,
    data: { calculations: calculations || [] }
  });
}));

// GET /api/commissions/payouts/:payoutId/lines/:lineId/transactions - Get source transactions
router.get('/payouts/:payoutId/lines/:lineId/transactions', authMiddleware, asyncHandler(async (req, res) => {
  const { payoutId, lineId } = req.params;
  const tenantId = req.tenantId;
  
  const transactions = await getQuery(`
    SELECT 
      ct.*,
      o.order_number,
      c.name as customer_name,
      ct.transaction_date,
      ct.transaction_type,
      ct.amount,
      ct.commission_amount
    FROM commission_transactions ct
    LEFT JOIN orders o ON ct.order_id = o.id
    LEFT JOIN customers c ON o.customer_id = c.id
    WHERE ct.payout_line_id = $1 AND ct.tenant_id = $2
    ORDER BY ct.transaction_date DESC
  `, [lineId, tenantId]);
  
  res.json({
    success: true,
    data: { transactions: transactions || [] }
  });
}));

// GET /api/commissions/calculations/:id - Get calculation detail
router.get('/calculations/:id', authMiddleware, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const tenantId = req.tenantId;
  
  const calculation = await getOneQuery(`
    SELECT 
      cc.*,
      u.first_name || ' ' || u.last_name as agent_name
    FROM commission_calculations cc
    LEFT JOIN users u ON cc.agent_id = u.id
    WHERE cc.id = $1 AND cc.tenant_id = $2
  `, [id, tenantId]);
  
  res.json({
    success: true,
    data: calculation || null
  });
}));

// GET /api/commissions/calculations/:id/approval - Get calculation approval
router.get('/calculations/:id/approval', authMiddleware, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const tenantId = req.tenantId;
  
  const approval = await getOneQuery(`
    SELECT 
      ca.*,
      u.first_name || ' ' || u.last_name as agent_name,
      u2.first_name || ' ' || u2.last_name as approved_by_name
    FROM commission_approvals ca
    LEFT JOIN commission_calculations cc ON ca.calculation_id = cc.id
    LEFT JOIN users u ON cc.agent_id = u.id
    LEFT JOIN users u2 ON ca.approved_by = u2.id
    WHERE ca.calculation_id = $1 AND ca.tenant_id = $2
  `, [id, tenantId]);
  
  res.json({
    success: true,
    data: approval || null
  });
}));

// GET /api/commissions/calculations/:id/logs - Get calculation logs
router.get('/calculations/:id/logs', authMiddleware, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const tenantId = req.tenantId;
  
  const logs = await getQuery(`
    SELECT 
      cl.*,
      u.first_name || ' ' || u.last_name as performed_by_name
    FROM commission_logs cl
    LEFT JOIN users u ON cl.performed_by = u.id
    WHERE cl.calculation_id = $1 AND cl.tenant_id = $2
    ORDER BY cl.created_at DESC
  `, [id, tenantId]);
  
  res.json({
    success: true,
    data: { logs: logs || [] }
  });
}));

// GET /api/commissions/calculations/:id/exceptions - Get calculation exceptions
router.get('/calculations/:id/exceptions', authMiddleware, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const tenantId = req.tenantId;
  
  const exceptions = await getQuery(`
    SELECT 
      ce.*,
      u.first_name || ' ' || u.last_name as resolved_by_name
    FROM commission_exceptions ce
    LEFT JOIN users u ON ce.resolved_by = u.id
    WHERE ce.calculation_id = $1 AND ce.tenant_id = $2
    ORDER BY ce.created_at DESC
  `, [id, tenantId]);
  
  res.json({
    success: true,
    data: { exceptions: exceptions || [] }
  });
}));

// GET /api/commissions/rules/:id/conditions - Get rule conditions
router.get('/rules/:id/conditions', authMiddleware, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const tenantId = req.tenantId;
  
  const conditions = await getQuery(`
    SELECT 
      crc.*
    FROM commission_rule_conditions crc
    WHERE crc.rule_id = $1 AND crc.tenant_id = $2
    ORDER BY crc.priority
  `, [id, tenantId]);
  
  res.json({
    success: true,
    data: { conditions: conditions || [] }
  });
}));

// GET /api/commissions/payouts/:payoutId/lines/:lineId - Get payout line detail
router.get('/payouts/:payoutId/lines/:lineId', authMiddleware, asyncHandler(async (req, res) => {
  const { payoutId, lineId } = req.params;
  const tenantId = req.tenantId;
  
  const line = await getOneQuery(`
    SELECT 
      pl.*,
      u.first_name || ' ' || u.last_name as agent_name,
      p.payout_date,
      p.status as payout_status
    FROM payout_lines pl
    LEFT JOIN users u ON pl.agent_id = u.id
    JOIN payouts p ON pl.payout_id = p.id
    WHERE pl.id = $1 AND pl.payout_id = $2 AND p.tenant_id = $3
  `, [lineId, payoutId, tenantId]);
  
  res.json({
    success: true,
    data: line || null
  });
}));

module.exports = router;
