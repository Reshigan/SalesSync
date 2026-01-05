const express = require('express');
const router = express.Router();
const { selectMany, selectOne, updateRow } = require('../utils/pg-helpers');
const { getQuery, getOneQuery } = require('../utils/database');

// GET /commission-ledgers - List commissions (admin)
router.get('/', async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { agent_id, status, type, limit = 100, offset = 0 } = req.query;

    let query = `
      SELECT cl.*, 
        u.first_name || ' ' || u.last_name as agent_name,
        u.email as agent_email
      FROM commission_ledgers cl
      LEFT JOIN users u ON cl.agent_id = u.id
      WHERE cl.tenant_id = ?
    `;
    const params = [tenantId];
    
    if (agent_id) {
      query += ` AND cl.agent_id = ?`;
      params.push(agent_id);
    }
    
    if (status) {
      query += ` AND cl.status = ?`;
      params.push(status);
    }
    
    if (type) {
      query += ` AND cl.type = ?`;
      params.push(type);
    }
    
    query += ` ORDER BY cl.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const commissions = await getQuery(query, params);
    
    // Calculate totals
    const totalsQuery = `
      SELECT 
        SUM(amount) as total_amount,
        SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending_amount,
        SUM(CASE WHEN status = 'approved' THEN amount ELSE 0 END) as approved_amount,
        SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as paid_amount
      FROM commission_ledgers
      WHERE tenant_id = ?
      ${agent_id ? `AND agent_id = ?` : ''}
    `;
    
    const totalsParams = agent_id ? [tenantId, agent_id] : [tenantId];
    const totals = await getOneQuery(totalsQuery, totalsParams);
    
    res.json({ success: true, data: commissions, total: commissions.length, totals });
  } catch (error) {
    console.error('Error fetching commissions:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /commission-ledgers/my-earnings - Current agent's earnings
router.get('/my-earnings', async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const userId = req.userId;

    const query = `
      SELECT cl.*, 
        CASE 
          WHEN cl.type = 'board_placement' THEN 'Board Placement'
          WHEN cl.type = 'product_distribution' THEN 'Product Distribution'
          ELSE cl.type
        END as type_display
      FROM commission_ledgers cl
      WHERE cl.tenant_id = ? AND cl.agent_id = ?
      ORDER BY cl.created_at DESC
    `;

    const commissions = await getQuery(query, [tenantId, userId]);
    
    // Calculate totals
    const totalsQuery = `
      SELECT 
        SUM(amount) as total_earnings,
        SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'approved' THEN amount ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as paid
      FROM commission_ledgers
      WHERE tenant_id = ? AND agent_id = ?
    `;
    
    const totals = await getOneQuery(totalsQuery, [tenantId, userId]);
    
    res.json({ success: true, data: commissions, totals });
  } catch (error) {
    console.error('Error fetching my earnings:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /commission-ledgers/by-agent/:agentId - Agent's commission history
router.get('/by-agent/:agentId', async (req, res) => {
  try {
    const { agentId } = req.params;
    const tenantId = req.tenantId;

    const query = `
      SELECT cl.*
      FROM commission_ledgers cl
      WHERE cl.tenant_id = ? AND cl.agent_id = ?
      ORDER BY cl.created_at DESC
    `;

    const commissions = await getQuery(query, [tenantId, agentId]);
    
    res.json({ success: true, data: commissions, total: commissions.length });
  } catch (error) {
    console.error('Error fetching agent commissions:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /commission-ledgers/:id - Get commission details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;

    const query = `
      SELECT cl.*, 
        u.first_name || ' ' || u.last_name as agent_name,
        u.email as agent_email
      FROM commission_ledgers cl
      LEFT JOIN users u ON cl.agent_id = u.id
      WHERE cl.id = ? AND cl.tenant_id = ?
    `;
    const commission = await getOneQuery(query, [id, tenantId]);

    if (!commission) {
      return res.status(404).json({ success: false, error: 'Commission not found' });
    }

    res.json({ success: true, data: commission });
  } catch (error) {
    console.error('Error fetching commission:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /commission-ledgers/:id/approve - Approve commission (admin)
router.put('/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;

    const updateData = {
      status: 'approved'
    };

    const commission = await updateRow('commission_ledgers', id, updateData, tenantId);

    if (!commission) {
      return res.status(404).json({ success: false, error: 'Commission not found' });
    }

    res.json({ success: true, data: commission });
  } catch (error) {
    console.error('Error approving commission:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /commission-ledgers/:id/pay - Mark as paid (admin)
router.put('/:id/pay', async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;

    const updateData = {
      status: 'paid',
      paid_at: new Date()
    };

    const commission = await updateRow('commission_ledgers', id, updateData, tenantId);

    if (!commission) {
      return res.status(404).json({ success: false, error: 'Commission not found' });
    }

    res.json({ success: true, data: commission });
  } catch (error) {
    console.error('Error marking commission as paid:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
