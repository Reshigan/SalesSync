const express = require('express');
const router = express.Router();
const { getDatabase } = require('../database/init');
const { authMiddleware } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../middleware/errorHandler');
const { v4: uuidv4 } = require('uuid');

// Get all commissions
router.get('/', authMiddleware, async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { agent_id, status, transaction_type, from_date, to_date } = req.query;

    let query = `
      SELECT ct.*, 
             u.first_name || ' ' || u.last_name as agent_name,
             approver.first_name || ' ' || approver.last_name as approved_by_name
      FROM commission_transactions ct
      LEFT JOIN agents a ON ct.agent_id = a.id
      LEFT JOIN users u ON a.user_id = u.id
      LEFT JOIN users approver ON ct.approved_by = approver.id
      WHERE ct.tenant_id = ?
    `;
    const params = [tenantId];

    if (agent_id) {
      query += ' AND ct.agent_id = ?';
      params.push(agent_id);
    }
    if (status) {
      query += ' AND ct.status = ?';
      params.push(status);
    }
    if (transaction_type) {
      query += ' AND ct.transaction_type = ?';
      params.push(transaction_type);
    }
    if (from_date) {
      query += ' AND date(ct.created_at) >= date(?)';
      params.push(from_date);
    }
    if (to_date) {
      query += ' AND date(ct.created_at) <= date(?)';
      params.push(to_date);
    }

    query += ' ORDER BY ct.created_at DESC';

    const db = getDatabase();
    db.all(query, params, (err, commissions) => {
      if (err) {
        console.error('Error fetching commissions:', err);
        return res.status(500).json({ error: 'Failed to fetch commissions' });
      }
      res.json(commissions);
    });
  } catch (error) {
    console.error('Error in get commissions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get commission by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;

    const db = getDatabase();
    db.get(
      `SELECT ct.*, 
              u.first_name || ' ' || u.last_name as agent_name, u.email as agent_email,
              approver.first_name || ' ' || approver.last_name as approved_by_name,
              rejecter.first_name || ' ' || rejecter.last_name as rejected_by_name
       FROM commission_transactions ct
       LEFT JOIN agents a ON ct.agent_id = a.id
       LEFT JOIN users u ON a.user_id = u.id
       LEFT JOIN users approver ON ct.approved_by = approver.id
       LEFT JOIN users rejecter ON ct.rejected_by = rejecter.id
       WHERE ct.id = ? AND ct.tenant_id = ?`,
      [id, tenantId],
      (err, commission) => {
        if (err) {
          console.error('Error fetching commission:', err);
          return res.status(500).json({ error: 'Failed to fetch commission' });
        }
        if (!commission) {
          return res.status(404).json({ error: 'Commission not found' });
        }
        res.json(commission);
      }
    );
  } catch (error) {
    console.error('Error in get commission:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Approve commission
router.post('/:id/approve', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;
    const userId = req.user.userId;

    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({ error: 'Insufficient permissions to approve commissions' });
    }

    const db = getDatabase();
    db.get(
      'SELECT * FROM commission_transactions WHERE id = ? AND tenant_id = ?',
      [id, tenantId],
      (err, commission) => {
        if (err) {
          console.error('Error fetching commission:', err);
          return res.status(500).json({ error: 'Failed to approve commission' });
        }
        if (!commission) {
          return res.status(404).json({ error: 'Commission not found' });
        }
        if (commission.status !== 'pending') {
          return res.status(400).json({ error: 'Commission is not in pending status' });
        }

        db.run(
          `UPDATE commission_transactions SET
            status = 'approved',
            approved_by = ?,
            approved_at = datetime('now'),
            updated_at = datetime('now')
          WHERE id = ? AND tenant_id = ?`,
          [userId, id, tenantId],
          function(err) {
            if (err) {
              console.error('Error approving commission:', err);
              return res.status(500).json({ error: 'Failed to approve commission' });
            }

            db.run(
              `UPDATE agents SET
                total_commission_earned = total_commission_earned + ?,
                commission_balance = commission_balance + ?
              WHERE id = ? AND tenant_id = ?`,
              [commission.total_amount, commission.total_amount, commission.agent_id, tenantId],
              (err) => {
                if (err) console.error('Error updating agent balance:', err);
              }
            );

            res.json({ message: 'Commission approved successfully', commission_id: id });
          }
        );
      }
    );
  } catch (error) {
    console.error('Error in approve commission:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get agent commission summary
router.get('/agent/:agentId/summary', authMiddleware, async (req, res) => {
  try {
    const { agentId } = req.params;
    const tenantId = req.tenantId;
    const { from_date, to_date } = req.query;

    let dateFilter = '';
    const params = [agentId, tenantId];

    if (from_date) {
      dateFilter += ' AND date(created_at) >= date(?)';
      params.push(from_date);
    }
    if (to_date) {
      dateFilter += ' AND date(created_at) <= date(?)';
      params.push(to_date);
    }

    const db = getDatabase();
    db.get(
      `SELECT 
        SUM(CASE WHEN status = 'pending' THEN total_amount ELSE 0 END) as pending_total,
        SUM(CASE WHEN status = 'approved' THEN total_amount ELSE 0 END) as approved_total,
        SUM(CASE WHEN status = 'paid' THEN total_amount ELSE 0 END) as paid_total,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_count,
        COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_count
       FROM commission_transactions
       WHERE agent_id = ? AND tenant_id = ?${dateFilter}`,
      params,
      (err, summary) => {
        if (err) {
          console.error('Error fetching summary:', err);
          return res.status(500).json({ error: 'Failed to fetch commission summary' });
        }

        db.get(
          'SELECT total_commission_earned, total_commission_paid, commission_balance FROM agents WHERE id = ? AND tenant_id = ?',
          [agentId, tenantId],
          (err, agent) => {
            if (err) console.error('Error fetching agent:', err);

            res.json({
              summary: summary,
              current_balance: agent?.commission_balance || 0,
              lifetime_earned: agent?.total_commission_earned || 0,
              lifetime_paid: agent?.total_commission_paid || 0
            });
          }
        );
      }
    );
  } catch (error) {
    console.error('Error in get agent summary:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/commissions/stats - Commission statistics
router.get('/stats', asyncHandler(async (req, res) => {
  const tenantId = req.tenantId;
  
  const [commissionStats, topEarners, monthlyTrends] = await Promise.all([
    getOneQuery(`
      SELECT 
        COUNT(*) as total_records,
        SUM(commission_amount) as total_commissions,
        AVG(commission_amount) as avg_commission,
        COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_count,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
        SUM(CASE WHEN status = 'pending' THEN commission_amount ELSE 0 END) as pending_amount
      FROM commissions WHERE tenant_id = ?
    `, [tenantId]),
    
    getQuery(`
      SELECT 
        u.id, u.name,
        COUNT(c.id) as commission_count,
        SUM(c.commission_amount) as total_earned
      FROM commissions c
      INNER JOIN users u ON c.user_id = u.id
      WHERE c.tenant_id = ?
      GROUP BY u.id
      ORDER BY total_earned DESC
      LIMIT 10
    `, [tenantId]),
    
    getQuery(`
      SELECT 
        strftime('%Y-%m', c.created_at) as month,
        COUNT(*) as count,
        SUM(c.commission_amount) as total_amount
      FROM commissions c
      WHERE c.tenant_id = ? AND c.created_at >= DATE('now', '-6 months')
      GROUP BY month
      ORDER BY month DESC
    `, [tenantId])
  ]);

  res.json({
    success: true,
    data: {
      stats: {
        ...commissionStats,
        total_commissions: parseFloat((commissionStats.total_commissions || 0).toFixed(2)),
        avg_commission: parseFloat((commissionStats.avg_commission || 0).toFixed(2)),
        pending_amount: parseFloat((commissionStats.pending_amount || 0).toFixed(2))
      },
      topEarners,
      monthlyTrends
    }
  });
}));

module.exports = router;
