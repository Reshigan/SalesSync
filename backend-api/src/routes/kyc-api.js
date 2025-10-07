const express = require('express');
const router = express.Router();
const getDatabase = () => require('../utils/database').getDatabase();

/**
 * KYC Management API
 * Document upload, verification, approval workflow
 */

// GET /api/kyc-api - Get all KYC records
router.get('/', async (req, res) => {
  try {
    const { customer_id, status, document_type } = req.query;
    const tenantId = req.tenantId || 1;
    const db = getDatabase();

    let sql = `SELECT k.*, c.name as customer_name, c.email, c.phone FROM kyc_submissions k
      LEFT JOIN customers c ON k.customer_id = c.id WHERE k.tenant_id = ?`;
    const params = [tenantId];

    if (customer_id) { sql += ' AND k.customer_id = ?'; params.push(customer_id); }
    if (status) { sql += ' AND k.status = ?'; params.push(status); }
    if (document_type) { sql += ' AND k.document_type = ?'; params.push(document_type); }

    sql += ' ORDER BY k.created_at DESC';

    db.all(sql, params, (err, rows) => {
      if (err) return res.status(500).json({ error: 'Failed to fetch KYC records' });
      res.json({ success: true, data: rows || [] });
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/kyc-api/:id - Get single KYC record
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId || 1;
    const db = getDatabase();

    db.get(`SELECT k.*, c.name as customer_name, c.email, c.phone, c.address,
      u.first_name || ' ' || u.last_name as verified_by_name FROM kyc_documents k
      LEFT JOIN customers c ON k.customer_id = c.id
      LEFT JOIN users u ON k.verified_by = u.id
      WHERE k.id = ? AND k.tenant_id = ?`,
      [id, tenantId],
      (err, row) => {
        if (err) return res.status(500).json({ error: 'Failed to fetch KYC record' });
        if (!row) return res.status(404).json({ error: 'KYC record not found' });
        res.json({ success: true, data: row });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/kyc-api - Upload KYC document
router.post('/', async (req, res) => {
  try {
    const { customer_id, document_type, document_number, document_url, expiry_date, notes } = req.body;
    const tenantId = req.tenantId || 1;
    const userId = req.userId || 1;
    const db = getDatabase();

    if (!customer_id || !document_type || !document_url) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const refNumber = `KYC-${Date.now()}`;
    db.run(`INSERT INTO kyc_documents (tenant_id, reference_number, customer_id, document_type, document_number, document_url, expiry_date, notes, status, uploaded_by, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, datetime('now'))`,
      [tenantId, refNumber, customer_id, document_type, document_number, document_url, expiry_date, notes, userId],
      function(err) {
        if (err) return res.status(500).json({ error: 'Failed to upload document' });
        res.status(201).json({ success: true, data: { id: this.lastID, reference_number: refNumber } });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/kyc-api/:id/verify - Verify KYC document
router.post('/:id/verify', async (req, res) => {
  try {
    const { id } = req.params;
    const { verification_notes } = req.body;
    const tenantId = req.tenantId || 1;
    const userId = req.userId || 1;
    const db = getDatabase();

    db.run(`UPDATE kyc_documents SET status = 'verified', verification_notes = ?, verified_by = ?, verified_at = datetime('now') WHERE id = ? AND tenant_id = ? AND status = 'pending'`,
      [verification_notes, userId, id, tenantId],
      function(err) {
        if (err || this.changes === 0) return res.status(500).json({ error: 'Failed to verify document' });
        res.json({ success: true, message: 'Document verified successfully' });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/kyc-api/:id/reject - Reject KYC document
router.post('/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { rejection_reason } = req.body;
    const tenantId = req.tenantId || 1;
    const userId = req.userId || 1;
    const db = getDatabase();

    if (!rejection_reason) {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }

    db.run(`UPDATE kyc_documents SET status = 'rejected', rejection_reason = ?, verified_by = ?, verified_at = datetime('now') WHERE id = ? AND tenant_id = ? AND status = 'pending'`,
      [rejection_reason, userId, id, tenantId],
      function(err) {
        if (err || this.changes === 0) return res.status(500).json({ error: 'Failed to reject document' });
        res.json({ success: true, message: 'Document rejected' });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/kyc-api/summary - Get KYC summary
router.get('/stats/summary', async (req, res) => {
  try {
    const tenantId = req.tenantId || 1;
    const db = getDatabase();

    db.get(`SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN status = 'verified' THEN 1 ELSE 0 END) as verified,
      SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
      SUM(CASE WHEN status = 'expired' THEN 1 ELSE 0 END) as expired
      FROM kyc_documents WHERE tenant_id = ?`,
      [tenantId],
      (err, summary) => {
        if (err) return res.status(500).json({ error: 'Failed to fetch summary' });
        res.json({ success: true, data: summary || {} });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
