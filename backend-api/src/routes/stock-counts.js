const express = require('express');
const router = express.Router();
const getDatabase = () => require('../utils/database').getDatabase();

/**
 * Stock Counts API
 * Handles cycle counts, physical counts, variance tracking, and reconciliation
 */

// GET /api/stock-counts - Get all stock counts
router.get('/', async (req, res) => {
  try {
    const { warehouse_id, status, from_date, to_date } = req.query;
    const tenantId = req.tenantId || 1;
    const db = getDatabase();

    let sql = `
      SELECT sc.*, w.name as warehouse_name, u.name as created_by_name,
             COUNT(DISTINCT sci.id) as item_count
      FROM stock_counts sc
      LEFT JOIN warehouses w ON sc.warehouse_id = w.id
      LEFT JOIN users u ON sc.created_by = u.id
      LEFT JOIN stock_count_items sci ON sc.id = sci.stock_count_id
      WHERE sc.tenant_id = ?
    `;
    const params = [tenantId];

    if (warehouse_id) { sql += ' AND sc.warehouse_id = ?'; params.push(warehouse_id); }
    if (status) { sql += ' AND sc.status = ?'; params.push(status); }
    if (from_date) { sql += ' AND sc.count_date >= ?'; params.push(from_date); }
    if (to_date) { sql += ' AND sc.count_date <= ?'; params.push(to_date); }

    sql += ' GROUP BY sc.id ORDER BY sc.count_date DESC';

    db.all(sql, params, (err, rows) => {
      if (err) return res.status(500).json({ error: 'Failed to fetch stock counts' });
      res.json({ success: true, data: rows || [] });
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/stock-counts/:id - Get stock count with items
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId || 1;
    const db = getDatabase();

    db.get(`SELECT sc.*, w.name as warehouse_name FROM stock_counts sc LEFT JOIN warehouses w ON sc.warehouse_id = w.id WHERE sc.id = ? AND sc.tenant_id = ?`, [id, tenantId], (err, count) => {
      if (err) return res.status(500).json({ error: 'Failed to fetch stock count' });
      if (!count) return res.status(404).json({ error: 'Stock count not found' });

      db.all(`SELECT sci.*, p.name as product_name, p.sku FROM stock_count_items sci LEFT JOIN products p ON sci.product_id = p.id WHERE sci.stock_count_id = ?`, [id], (err, items) => {
        if (err) return res.status(500).json({ error: 'Failed to fetch items' });
        count.items = items || [];
        count.total_variance = items.reduce((sum, item) => sum + (item.counted_quantity - item.system_quantity), 0);
        res.json({ success: true, data: count });
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/stock-counts - Create new stock count
router.post('/', async (req, res) => {
  try {
    const { warehouse_id, count_date, count_type, notes, items } = req.body;
    const tenantId = req.tenantId || 1;
    const userId = req.userId || 1;
    const db = getDatabase();

    if (!warehouse_id || !items || items.length === 0) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const refNumber = `CNT-${Date.now()}`;
    db.run(`INSERT INTO stock_counts (tenant_id, reference_number, warehouse_id, count_date, count_type, status, notes, created_by, created_at) VALUES (?, ?, ?, ?, ?, 'draft', ?, ?, datetime('now'))`,
      [tenantId, refNumber, warehouse_id, count_date || new Date().toISOString().split('T')[0], count_type || 'cycle', notes, userId],
      function(err) {
        if (err) return res.status(500).json({ error: 'Failed to create stock count' });
        const countId = this.lastID;

        let inserted = 0;
        items.forEach(item => {
          db.run(`INSERT INTO stock_count_items (stock_count_id, product_id, system_quantity, counted_quantity, notes, created_at) VALUES (?, ?, ?, ?, ?, datetime('now'))`,
            [countId, item.product_id, item.system_quantity, item.counted_quantity || null, item.notes || null],
            () => { if (++inserted === items.length) res.status(201).json({ success: true, data: { id: countId, reference_number: refNumber } }); }
          );
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/stock-counts/:id/complete - Complete stock count and create adjustments
router.post('/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId || 1;
    const userId = req.userId || 1;
    const db = getDatabase();

    db.run(`UPDATE stock_counts SET status = 'completed', completed_by = ?, completed_at = datetime('now') WHERE id = ? AND tenant_id = ?`,
      [userId, id, tenantId],
      function(err) {
        if (err || this.changes === 0) return res.status(500).json({ error: 'Failed to complete stock count' });
        // TODO: Create stock adjustments for variances
        res.json({ success: true, message: 'Stock count completed successfully' });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
