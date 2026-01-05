const express = require('express');
const router = express.Router();
const { getQuery, getOneQuery, runQuery } = require('../utils/database');

router.get('/', async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { status, search, limit = 100, offset = 0 } = req.query;

    let sql = `
      SELECT id, tenant_id, name, code, contact_person, email, phone, address,
        city, state, country, postal_code, tax_id, payment_terms, currency,
        status, notes, created_at, updated_at
      FROM suppliers
      WHERE tenant_id = ?
    `;
    const params = [tenantId];

    if (status) {
      sql += ` AND status = ?`;
      params.push(status);
    }

    if (search) {
      sql += ` AND (name LIKE ? OR code LIKE ? OR contact_person LIKE ?)`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    sql += ` ORDER BY name ASC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const suppliers = await getQuery(sql, params);

    const countSql = `SELECT COUNT(*) as total FROM suppliers WHERE tenant_id = ?`;
    const countResult = await getOneQuery(countSql, [tenantId]);

    res.json({
      success: true,
      data: suppliers,
      total: countResult?.total || suppliers.length,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;

    const supplier = await getOneQuery(
      `SELECT * FROM suppliers WHERE id = ? AND tenant_id = ?`,
      [id, tenantId]
    );

    if (!supplier) {
      return res.status(404).json({ success: false, error: 'Supplier not found' });
    }

    res.json({ success: true, data: supplier });
  } catch (error) {
    console.error('Error fetching supplier:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const userId = req.userId;
    const {
      name,
      code,
      contact_person,
      email,
      phone,
      address,
      city,
      state,
      country,
      postal_code,
      tax_id,
      payment_terms,
      currency,
      notes
    } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, error: 'Supplier name is required' });
    }

    if (!code) {
      return res.status(400).json({ success: false, error: 'Supplier code is required' });
    }

    const existingCode = await getOneQuery(
      `SELECT id FROM suppliers WHERE code = ? AND tenant_id = ?`,
      [code, tenantId]
    );

    if (existingCode) {
      return res.status(400).json({ success: false, error: 'Supplier code already exists' });
    }

    const result = await runQuery(`
      INSERT INTO suppliers (
        tenant_id, name, code, contact_person, email, phone, address,
        city, state, country, postal_code, tax_id, payment_terms, currency,
        status, notes, created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [
      tenantId, name, code, contact_person || null, email || null, phone || null,
      address || null, city || null, state || null, country || null, postal_code || null,
      tax_id || null, payment_terms || 'net30', currency || 'USD', notes || null, userId
    ]);

    const newSupplier = await getOneQuery(
      `SELECT * FROM suppliers WHERE id = ?`,
      [result.lastID]
    );

    res.status(201).json({ success: true, data: newSupplier });
  } catch (error) {
    console.error('Error creating supplier:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;
    const {
      name,
      code,
      contact_person,
      email,
      phone,
      address,
      city,
      state,
      country,
      postal_code,
      tax_id,
      payment_terms,
      currency,
      status,
      notes
    } = req.body;

    const existing = await getOneQuery(
      `SELECT id FROM suppliers WHERE id = ? AND tenant_id = ?`,
      [id, tenantId]
    );

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Supplier not found' });
    }

    if (code) {
      const duplicateCode = await getOneQuery(
        `SELECT id FROM suppliers WHERE code = ? AND tenant_id = ? AND id != ?`,
        [code, tenantId, id]
      );
      if (duplicateCode) {
        return res.status(400).json({ success: false, error: 'Supplier code already exists' });
      }
    }

    await runQuery(`
      UPDATE suppliers SET
        name = COALESCE(?, name),
        code = COALESCE(?, code),
        contact_person = COALESCE(?, contact_person),
        email = COALESCE(?, email),
        phone = COALESCE(?, phone),
        address = COALESCE(?, address),
        city = COALESCE(?, city),
        state = COALESCE(?, state),
        country = COALESCE(?, country),
        postal_code = COALESCE(?, postal_code),
        tax_id = COALESCE(?, tax_id),
        payment_terms = COALESCE(?, payment_terms),
        currency = COALESCE(?, currency),
        status = COALESCE(?, status),
        notes = COALESCE(?, notes),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND tenant_id = ?
    `, [
      name, code, contact_person, email, phone, address, city, state, country,
      postal_code, tax_id, payment_terms, currency, status, notes, id, tenantId
    ]);

    const updatedSupplier = await getOneQuery(
      `SELECT * FROM suppliers WHERE id = ?`,
      [id]
    );

    res.json({ success: true, data: updatedSupplier });
  } catch (error) {
    console.error('Error updating supplier:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;

    const existing = await getOneQuery(
      `SELECT id FROM suppliers WHERE id = ? AND tenant_id = ?`,
      [id, tenantId]
    );

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Supplier not found' });
    }

    const linkedPOs = await getOneQuery(
      `SELECT COUNT(*) as count FROM purchase_orders WHERE supplier_id = ? AND tenant_id = ?`,
      [id, tenantId]
    );

    if (linkedPOs?.count > 0) {
      await runQuery(
        `UPDATE suppliers SET status = 'inactive', updated_at = CURRENT_TIMESTAMP WHERE id = ? AND tenant_id = ?`,
        [id, tenantId]
      );
      return res.json({
        success: true,
        message: 'Supplier deactivated (has linked purchase orders)',
        deactivated: true
      });
    }

    await runQuery(
      `DELETE FROM suppliers WHERE id = ? AND tenant_id = ?`,
      [id, tenantId]
    );

    res.json({ success: true, message: 'Supplier deleted successfully' });
  } catch (error) {
    console.error('Error deleting supplier:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id/purchase-orders', async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;
    const { status, limit = 50, offset = 0 } = req.query;

    let sql = `
      SELECT po.*, w.name as warehouse_name
      FROM purchase_orders po
      LEFT JOIN warehouses w ON po.warehouse_id = w.id
      WHERE po.supplier_id = ? AND po.tenant_id = ?
    `;
    const params = [id, tenantId];

    if (status) {
      sql += ` AND po.status = ?`;
      params.push(status);
    }

    sql += ` ORDER BY po.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const purchaseOrders = await getQuery(sql, params);

    res.json({ success: true, data: purchaseOrders });
  } catch (error) {
    console.error('Error fetching supplier purchase orders:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
