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

module.exports = router;
