const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { selectMany, selectOne, insertRow } = require('../utils/pg-helpers');
const { getQuery, getOneQuery } = require('../utils/database');

// GET /board-placements - List placements
router.get('/', async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { customer_id, brand_id, agent_id, limit = 100, offset = 0 } = req.query;

    let query = `
      SELECT bp.*, 
        c.name as customer_name,
        br.name as brand_name,
        b.name as board_name,
        CONCAT(u.first_name, ' ', u.last_name) as agent_name
      FROM board_placements bp
      LEFT JOIN customers c ON bp.customer_id = c.id
      LEFT JOIN brands br ON bp.brand_id = br.id
      LEFT JOIN boards b ON bp.board_id = b.id
      LEFT JOIN users u ON bp.created_by = u.id
      WHERE bp.tenant_id = $1
    `;
    const params = [tenantId];
    
    if (customer_id) {
      params.push(customer_id);
      query += ` AND bp.customer_id = $${params.length}`;
    }
    
    if (brand_id) {
      params.push(brand_id);
      query += ` AND bp.brand_id = $${params.length}`;
    }
    
    if (agent_id) {
      params.push(agent_id);
      query += ` AND bp.created_by = $${params.length}`;
    }
    
    query += ` ORDER BY bp.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const placements = await getQuery(query, params);
    
    res.json({ success: true, data: placements, total: placements.length });
  } catch (error) {
    console.error('Error fetching board placements:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /board-placements/by-agent/:agentId - Agent's placements
router.get('/by-agent/:agentId', async (req, res) => {
  try {
    const { agentId } = req.params;
    const tenantId = req.tenantId;

    const query = `
      SELECT bp.*, 
        c.name as customer_name,
        br.name as brand_name,
        b.name as board_name
      FROM board_placements bp
      LEFT JOIN customers c ON bp.customer_id = c.id
      LEFT JOIN brands br ON bp.brand_id = br.id
      LEFT JOIN boards b ON bp.board_id = b.id
      WHERE bp.tenant_id = $1 AND bp.created_by = $2
      ORDER BY bp.created_at DESC
    `;

    const placements = await getQuery(query, [tenantId, agentId]);
    
    res.json({ success: true, data: placements, total: placements.length });
  } catch (error) {
    console.error('Error fetching agent placements:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /board-placements/:id - Get placement details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;

    const query = `
      SELECT bp.*, 
        c.name as customer_name,
        br.name as brand_name,
        b.name as board_name,
        CONCAT(u.first_name, ' ', u.last_name) as agent_name
      FROM board_placements bp
      LEFT JOIN customers c ON bp.customer_id = c.id
      LEFT JOIN brands br ON bp.brand_id = br.id
      LEFT JOIN boards b ON bp.board_id = b.id
      LEFT JOIN users u ON bp.created_by = u.id
      WHERE bp.id = $1 AND bp.tenant_id = $2
    `;
    const placement = await getOneQuery(query, [id, tenantId]);

    if (!placement) {
      return res.status(404).json({ success: false, error: 'Board placement not found' });
    }

    res.json({ success: true, data: placement });
  } catch (error) {
    console.error('Error fetching board placement:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /board-placements - Create placement
router.post('/', async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const userId = req.userId;
    const { customer_id, brand_id, board_id, visit_id, photo_url, coverage_percentage, latitude, longitude } = req.body;

    if (!customer_id) {
      return res.status(400).json({ success: false, error: 'Customer ID is required' });
    }

    const placementData = {
      tenant_id: tenantId,
      customer_id,
      brand_id: brand_id || null,
      board_id: board_id || null,
      visit_id: visit_id || null,
      photo_url: photo_url || null,
      coverage_percentage: coverage_percentage || null,
      latitude: latitude || null,
      longitude: longitude || null,
      created_by: userId
    };

    const placement = await insertRow('board_placements', placementData);

    // Create commission entry for board placement
    const commissionAmount = 10.00; // TODO: Make configurable per brand/board
    const commissionData = {
      tenant_id: tenantId,
      agent_id: userId,
      type: 'board_placement',
      entity_id: placement.id,
      entity_type: 'board_placement',
      amount: commissionAmount,
      currency: 'USD',
      status: 'pending',
      description: `Board placement commission`
    };
    
    await insertRow('commission_ledgers', commissionData);

    res.status(201).json({ success: true, data: placement });
  } catch (error) {
    console.error('Error creating board placement:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
