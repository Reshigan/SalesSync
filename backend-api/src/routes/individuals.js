/**
 * Individuals Routes
 * Manages individual contacts (non-store) for field marketing
 */

const express = require('express');
const router = express.Router();
const { normalizePhone, hashIdNumber } = require('../services/fraud-detection.service');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * GET /api/individuals
 * Get all individuals for a tenant
 */
router.get('/', asyncHandler(async (req, res) => {
  // Lazy-load database functions - use postgres-init in production
  const dbModule = process.env.NODE_ENV === 'production' && process.env.DB_TYPE === 'postgres'
    ? require('../database/postgres-init')
    : require('../database/init');
  const { getQuery, getOneQuery } = dbModule;

  const tenantId = req.tenantId;
  const { search, status, page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;

  let query = `SELECT * FROM individuals WHERE tenant_id = `;
  let countQuery = `SELECT COUNT(*) as total FROM individuals WHERE tenant_id = `;
  const params = [tenantId];
  const countParams = [tenantId];
  let paramIndex = 2;

  if (process.env.DB_TYPE === 'postgres') {
    query += '$1';
    countQuery += '$1';
  } else {
    query += '?';
    countQuery += '?';
  }

  if (search) {
    if (process.env.DB_TYPE === 'postgres') {
      query += ` AND (name ILIKE $${paramIndex} OR phone ILIKE $${paramIndex + 1})`;
      countQuery += ` AND (name ILIKE $${paramIndex} OR phone ILIKE $${paramIndex + 1})`;
    } else {
      query += ` AND (name LIKE ? OR phone LIKE ?)`;
      countQuery += ` AND (name LIKE ? OR phone LIKE ?)`;
    }
    params.push(`%${search}%`, `%${search}%`);
    countParams.push(`%${search}%`, `%${search}%`);
    paramIndex += 2;
  }

  if (status) {
    if (process.env.DB_TYPE === 'postgres') {
      query += ` AND status = $${paramIndex}`;
      countQuery += ` AND status = $${paramIndex}`;
    } else {
      query += ` AND status = ?`;
      countQuery += ` AND status = ?`;
    }
    params.push(status);
    countParams.push(status);
    paramIndex++;
  }

  if (process.env.DB_TYPE === 'postgres') {
    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  } else {
    query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
  }
  params.push(parseInt(limit), parseInt(offset));

  const individuals = await getQuery(query, params);
  const countResult = await getOneQuery(countQuery, countParams);
  const total = countResult.total || countResult.count || 0;

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
}));

/**
 * GET /api/individuals/:id
 * Get individual by ID
 */
router.get('/:id', asyncHandler(async (req, res) => {
  // Lazy-load database functions
  const dbModule = process.env.NODE_ENV === 'production' && process.env.DB_TYPE === 'postgres'
    ? require('../database/postgres-init')
    : require('../database/init');
  const { getQuery, getOneQuery } = dbModule;

  const tenantId = req.tenantId;
  const { id } = req.params;

  const individual = process.env.DB_TYPE === 'postgres'
    ? await getOneQuery('SELECT * FROM individuals WHERE id = $1 AND tenant_id = $2', [id, tenantId])
    : await getOneQuery('SELECT * FROM individuals WHERE id = ? AND tenant_id = ?', [id, tenantId]);

  if (!individual) {
    return res.status(404).json({
      success: false,
      message: 'Individual not found'
    });
  }

  const visits = process.env.DB_TYPE === 'postgres'
    ? await getQuery(
        `SELECT * FROM visits WHERE tenant_id = $1 AND subject_type = 'individual' AND subject_id = $2 ORDER BY visit_date DESC LIMIT 10`,
        [tenantId, id]
      )
    : await getQuery(
        `SELECT * FROM visits WHERE tenant_id = ? AND subject_type = 'individual' AND subject_id = ? ORDER BY visit_date DESC LIMIT 10`,
        [tenantId, id]
      );

  res.json({
    success: true,
    data: {
      ...individual,
      visits
    }
  });
}));

/**
 * POST /api/individuals
 * Create a new individual
 */
router.post('/', asyncHandler(async (req, res) => {
  // Lazy-load database functions
  const dbModule = process.env.NODE_ENV === 'production' && process.env.DB_TYPE === 'postgres'
    ? require('../database/postgres-init')
    : require('../database/init');
  const { getOneQuery, runQuery } = dbModule;

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
    const existing = process.env.DB_TYPE === 'postgres'
      ? await getOneQuery('SELECT id FROM individuals WHERE tenant_id = $1 AND phone_normalized = $2', [tenantId, phoneNormalized])
      : await getOneQuery('SELECT id FROM individuals WHERE tenant_id = ? AND phone_normalized = ?', [tenantId, phoneNormalized]);

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'An individual with this phone number already exists',
        existingId: existing.id
      });
    }
  }

  if (idHash) {
    const existing = process.env.DB_TYPE === 'postgres'
      ? await getOneQuery('SELECT id FROM individuals WHERE tenant_id = $1 AND id_hash = $2', [tenantId, idHash])
      : await getOneQuery('SELECT id FROM individuals WHERE tenant_id = ? AND id_hash = ?', [tenantId, idHash]);

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'An individual with this ID number already exists',
        existingId: existing.id
      });
    }
  }

  // Insert new individual
  let result;
  if (process.env.DB_TYPE === 'postgres') {
    result = await runQuery(
      `INSERT INTO individuals (tenant_id, name, phone, phone_normalized, id_type, id_number, id_hash, address, lat, lng)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [tenantId, name, phone || null, phoneNormalized, id_type || null, id_number || null, idHash, address || null, lat || null, lng || null]
    );
    
    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } else {
    result = await runQuery(
      `INSERT INTO individuals (tenant_id, name, phone, phone_normalized, id_type, id_number, id_hash, address, lat, lng)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [tenantId, name, phone || null, phoneNormalized, id_type || null, id_number || null, idHash, address || null, lat || null, lng || null]
    );

    const individual = await getOneQuery('SELECT * FROM individuals WHERE id = ?', [result.id]);
    
    res.status(201).json({
      success: true,
      data: individual
    });
  }
}));

/**
 * PUT /api/individuals/:id
 * Update an individual
 */
router.put('/:id', asyncHandler(async (req, res) => {
  // Lazy-load database functions
  const dbModule = process.env.NODE_ENV === 'production' && process.env.DB_TYPE === 'postgres'
    ? require('../database/postgres-init')
    : require('../database/init');
  const { getOneQuery, runQuery } = dbModule;

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

  const existing = process.env.DB_TYPE === 'postgres'
    ? await getOneQuery('SELECT * FROM individuals WHERE id = $1 AND tenant_id = $2', [id, tenantId])
    : await getOneQuery('SELECT * FROM individuals WHERE id = ? AND tenant_id = ?', [id, tenantId]);

  if (!existing) {
    return res.status(404).json({
      success: false,
      message: 'Individual not found'
    });
  }

  const phoneNormalized = phone ? normalizePhone(phone) : existing.phone_normalized;
  const idHash = id_number ? hashIdNumber(id_number) : existing.id_hash;

  if (process.env.DB_TYPE === 'postgres') {
    await runQuery(
      `UPDATE individuals SET
        name = $1, phone = $2, phone_normalized = $3, id_type = $4, id_number = $5, id_hash = $6,
        address = $7, lat = $8, lng = $9, status = $10, updated_at = CURRENT_TIMESTAMP
       WHERE id = $11 AND tenant_id = $12`,
      [
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
      ]
    );
  } else {
    await runQuery(
      `UPDATE individuals SET
        name = ?, phone = ?, phone_normalized = ?, id_type = ?, id_number = ?, id_hash = ?,
        address = ?, lat = ?, lng = ?, status = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND tenant_id = ?`,
      [
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
      ]
    );
  }

  const updated = process.env.DB_TYPE === 'postgres'
    ? await getOneQuery('SELECT * FROM individuals WHERE id = $1', [id])
    : await getOneQuery('SELECT * FROM individuals WHERE id = ?', [id]);

  res.json({
    success: true,
    data: updated
  });
}));

/**
 * DELETE /api/individuals/:id
 * Delete an individual
 */
router.delete('/:id', asyncHandler(async (req, res) => {
  // Lazy-load database functions
  const dbModule = process.env.NODE_ENV === 'production' && process.env.DB_TYPE === 'postgres'
    ? require('../database/postgres-init')
    : require('../database/init');
  const { runQuery } = dbModule;

  const tenantId = req.tenantId;
  const { id } = req.params;

  const result = process.env.DB_TYPE === 'postgres'
    ? await runQuery('DELETE FROM individuals WHERE id = $1 AND tenant_id = $2', [id, tenantId])
    : await runQuery('DELETE FROM individuals WHERE id = ? AND tenant_id = ?', [id, tenantId]);

  const rowsAffected = process.env.DB_TYPE === 'postgres' ? result.rowCount : result.changes;

  if (rowsAffected === 0) {
    return res.status(404).json({
      success: false,
      message: 'Individual not found'
    });
  }

  res.json({
    success: true,
    message: 'Individual deleted successfully'
  });
}));

module.exports = router;
