const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { selectMany, selectOne, insertRow, updateRow, deleteRow } = require('../utils/pg-helpers');
const { getQuery, getOneQuery } = require('../utils/database');

// GET /boards - List all boards
router.get('/', async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { brand_id, limit = 100, offset = 0 } = req.query;

    let query = 'SELECT b.*, br.name as brand_name FROM boards b LEFT JOIN brands br ON b.brand_id = br.id WHERE b.tenant_id = $1';
    const params = [tenantId];
    
    if (brand_id) {
      params.push(brand_id);
      query += ` AND b.brand_id = $${params.length}`;
    }
    
    query += ` ORDER BY b.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const boards = await getQuery(query, params);
    
    res.json({ success: true, data: boards, total: boards.length });
  } catch (error) {
    console.error('Error fetching boards:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /boards/:id - Get board details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;

    const query = 'SELECT b.*, br.name as brand_name FROM boards b LEFT JOIN brands br ON b.brand_id = br.id WHERE b.id = $1 AND b.tenant_id = $2';
    const board = await getOneQuery(query, [id, tenantId]);

    if (!board) {
      return res.status(404).json({ success: false, error: 'Board not found' });
    }

    res.json({ success: true, data: board });
  } catch (error) {
    console.error('Error fetching board:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /boards - Create board (admin only)
router.post('/', async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { brand_id, name, size, material, notes } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, error: 'Board name is required' });
    }

    const boardData = {
      tenant_id: tenantId,
      brand_id: brand_id || null,
      name,
      size: size || null,
      material: material || null,
      notes: notes || null
    };

    const board = await insertRow('boards', boardData);

    res.status(201).json({ success: true, data: board });
  } catch (error) {
    console.error('Error creating board:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /boards/:id - Update board (admin only)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;
    const { brand_id, name, size, material, notes } = req.body;

    const updateData = {
      brand_id: brand_id || null,
      name,
      size: size || null,
      material: material || null,
      notes: notes || null,
      updated_at: new Date()
    };

    const board = await updateRow('boards', id, updateData, tenantId);

    if (!board) {
      return res.status(404).json({ success: false, error: 'Board not found' });
    }

    res.json({ success: true, data: board });
  } catch (error) {
    console.error('Error updating board:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /boards/:id - Delete board (admin only)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;

    const board = await deleteRow('boards', id, tenantId);

    if (!board) {
      return res.status(404).json({ success: false, error: 'Board not found' });
    }

    res.json({ success: true, message: 'Board deleted successfully' });
  } catch (error) {
    console.error('Error deleting board:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:boardId/compliance', async (req, res) => {
  try {
    const { boardId } = req.params;
    const tenantId = req.user.tenantId;
    
    const compliance = await getQuery(`
      SELECT bc.*, u.first_name || ' ' || u.last_name as checked_by_name
      FROM board_compliance bc
      LEFT JOIN users u ON bc.checked_by = u.id
      WHERE bc.board_id = $1 AND bc.tenant_id = $2
      ORDER BY bc.check_date DESC
    `, [boardId, tenantId]);
    
    res.json({ success: true, data: { compliance: compliance || [] } });
  } catch (error) {
    console.error('Error fetching board compliance:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.get('/:boardId/location-history', async (req, res) => {
  try {
    const { boardId } = req.params;
    const tenantId = req.user.tenantId;
    
    const history = await getQuery(`
      SELECT blh.*, u.first_name || ' ' || u.last_name as changed_by_name
      FROM board_location_history blh
      LEFT JOIN users u ON blh.changed_by = u.id
      WHERE blh.board_id = $1 AND blh.tenant_id = $2
      ORDER BY blh.changed_at DESC
    `, [boardId, tenantId]);
    
    res.json({ success: true, data: { history: history || [] } });
  } catch (error) {
    console.error('Error fetching location history:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.get('/:boardId/maintenance', async (req, res) => {
  try {
    const { boardId } = req.params;
    const tenantId = req.user.tenantId;
    
    const maintenance = await getQuery(`
      SELECT bm.*, u.first_name || ' ' || u.last_name as performed_by_name
      FROM board_maintenance bm
      LEFT JOIN users u ON bm.performed_by = u.id
      WHERE bm.board_id = $1 AND bm.tenant_id = $2
      ORDER BY bm.maintenance_date DESC
    `, [boardId, tenantId]);
    
    res.json({ success: true, data: { maintenance: maintenance || [] } });
  } catch (error) {
    console.error('Error fetching maintenance log:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.get('/:boardId/photos', async (req, res) => {
  try {
    const { boardId } = req.params;
    const tenantId = req.user.tenantId;
    
    const photos = await getQuery(`
      SELECT bp.*, u.first_name || ' ' || u.last_name as uploaded_by_name
      FROM board_photos bp
      LEFT JOIN users u ON bp.uploaded_by = u.id
      WHERE bp.board_id = $1 AND bp.tenant_id = $2
      ORDER BY bp.created_at DESC
    `, [boardId, tenantId]);
    
    res.json({ success: true, data: { photos: photos || [] } });
  } catch (error) {
    console.error('Error fetching board photos:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.get('/:boardId/placements', async (req, res) => {
  try {
    const { boardId } = req.params;
    const tenantId = req.user.tenantId;
    
    const placements = await getQuery(`
      SELECT bp.*, c.name as customer_name, u.first_name || ' ' || u.last_name as placed_by_name
      FROM board_placements bp
      LEFT JOIN customers c ON bp.customer_id = c.id
      LEFT JOIN users u ON bp.placed_by = u.id
      WHERE bp.board_id = $1 AND bp.tenant_id = $2
      ORDER BY bp.placement_date DESC
    `, [boardId, tenantId]);
    
    res.json({ success: true, data: { placements: placements || [] } });
  } catch (error) {
    console.error('Error fetching board placements:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router;
