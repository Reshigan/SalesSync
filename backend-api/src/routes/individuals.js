/**
 * Individuals Routes
 * Manages individual contacts (non-store) for field marketing
 */

const express = require('express');
const router = express.Router();
const { getDatabase } = require('../database/init');
const { normalizePhone, hashIdNumber } = require('../services/fraud-detection.service');

/**
 * GET /api/individuals
 * Get all individuals for a tenant
 */
router.get('/', (req, res) => {
  try {
    const db = getDatabase();
    const tenantId = req.tenantId;

    const { search, status, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT * FROM individuals
      WHERE tenant_id = ?
    `;
    const params = [tenantId];

    if (search) {
      query += ` AND (name LIKE ? OR phone LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    if (status) {
      query += ` AND status = ?`;
      params.push(status);
    }

    query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const individuals = db.prepare(query).all(...params);

    // Get total count
    let countQuery = `SELECT COUNT(*) as total FROM individuals WHERE tenant_id = ?`;
    const countParams = [tenantId];

    if (search) {
      countQuery += ` AND (name LIKE ? OR phone LIKE ?)`;
      countParams.push(`%${search}%`, `%${search}%`);
    }

    if (status) {
      countQuery += ` AND status = ?`;
      countParams.push(status);
    }

    const { total } = db.prepare(countQuery).get(...countParams);

    res.json({
      success: true,
      data: individuals,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching individuals:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch individuals',
      error: error.message
    });
  }
});

/**
 * GET /api/individuals/:id
 * Get individual by ID
 */
router.get('/:id', (req, res) => {
  try {
    const db = getDatabase();
    const tenantId = req.tenantId;
    const { id } = req.params;

    const individual = db.prepare(`
      SELECT * FROM individuals
      WHERE id = ? AND tenant_id = ?
    `).get(id, tenantId);

    if (!individual) {
      return res.status(404).json({
        success: false,
        message: 'Individual not found'
      });
    }

    const visits = db.prepare(`
      SELECT * FROM visits
      WHERE tenant_id = ? AND subject_type = 'individual' AND subject_id = ?
      ORDER BY visit_date DESC
      LIMIT 10
    `).all(tenantId, id);

    res.json({
      success: true,
      data: {
        ...individual,
        visits
      }
    });
  } catch (error) {
    console.error('Error fetching individual:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch individual',
      error: error.message
    });
  }
});

/**
 * POST /api/individuals
 * Create a new individual
 */
router.post('/', (req, res) => {
  try {
    const db = getDatabase();
    const tenantId = req.tenantId;
    const {
      name,
      phone,
      id_type,
      id_number,
      address,
      lat,
      lng
    } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Name is required'
      });
    }

    const phoneNormalized = phone ? normalizePhone(phone) : null;
    const idHash = id_number ? hashIdNumber(id_number) : null;

    if (phoneNormalized) {
      const existing = db.prepare(`
        SELECT id FROM individuals
        WHERE tenant_id = ? AND phone_normalized = ?
      `).get(tenantId, phoneNormalized);

      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'An individual with this phone number already exists',
          existingId: existing.id
        });
      }
    }

    if (idHash) {
      const existing = db.prepare(`
        SELECT id FROM individuals
        WHERE tenant_id = ? AND id_hash = ?
      `).get(tenantId, idHash);

      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'An individual with this ID number already exists',
          existingId: existing.id
        });
      }
    }

    const stmt = db.prepare(`
      INSERT INTO individuals (
        tenant_id, name, phone, phone_normalized, id_type, id_number, id_hash,
        address, lat, lng
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      tenantId,
      name,
      phone || null,
      phoneNormalized,
      id_type || null,
      id_number || null,
      idHash,
      address || null,
      lat || null,
      lng || null
    );

    const individual = db.prepare(`
      SELECT * FROM individuals WHERE id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json({
      success: true,
      data: individual
    });
  } catch (error) {
    console.error('Error creating individual:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create individual',
      error: error.message
    });
  }
});

/**
 * PUT /api/individuals/:id
 * Update an individual
 */
router.put('/:id', (req, res) => {
  try {
    const db = getDatabase();
    const tenantId = req.tenantId;
    const { id } = req.params;
    const {
      name,
      phone,
      id_type,
      id_number,
      address,
      lat,
      lng,
      status
    } = req.body;

    const existing = db.prepare(`
      SELECT * FROM individuals WHERE id = ? AND tenant_id = ?
    `).get(id, tenantId);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Individual not found'
      });
    }

    const phoneNormalized = phone ? normalizePhone(phone) : existing.phone_normalized;
    const idHash = id_number ? hashIdNumber(id_number) : existing.id_hash;

    const stmt = db.prepare(`
      UPDATE individuals SET
        name = ?,
        phone = ?,
        phone_normalized = ?,
        id_type = ?,
        id_number = ?,
        id_hash = ?,
        address = ?,
        lat = ?,
        lng = ?,
        status = ?,
        updated_at = datetime('now')
      WHERE id = ? AND tenant_id = ?
    `);

    stmt.run(
      name || existing.name,
      phone || existing.phone,
      phoneNormalized,
      id_type || existing.id_type,
      id_number || existing.id_number,
      idHash,
      address || existing.address,
      lat !== undefined ? lat : existing.lat,
      lng !== undefined ? lng : existing.lng,
      status || existing.status,
      id,
      tenantId
    );

    const updated = db.prepare(`
      SELECT * FROM individuals WHERE id = ?
    `).get(id);

    res.json({
      success: true,
      data: updated
    });
  } catch (error) {
    console.error('Error updating individual:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update individual',
      error: error.message
    });
  }
});

/**
 * DELETE /api/individuals/:id
 * Delete an individual
 */
router.delete('/:id', (req, res) => {
  try {
    const db = getDatabase();
    const tenantId = req.tenantId;
    const { id } = req.params;

    const stmt = db.prepare(`
      DELETE FROM individuals WHERE id = ? AND tenant_id = ?
    `);

    const result = stmt.run(id, tenantId);

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        message: 'Individual not found'
      });
    }

    res.json({
      success: true,
      message: 'Individual deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting individual:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete individual',
      error: error.message
    });
  }
});

module.exports = router;
