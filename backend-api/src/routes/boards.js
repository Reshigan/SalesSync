const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { selectMany, selectOne, insertRow, updateRow, deleteRow } = require('../utils/pg-helpers');

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

    const boards = await selectMany(query, params);
    
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
    const board = await selectOne(query, [id, tenantId]);

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

module.exports = router;
