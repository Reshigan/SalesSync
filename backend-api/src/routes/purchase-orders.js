const express = require('express');
const { getQuery, getOneQuery, runQuery } = require('../utils/database');
const router = express.Router();

// Lazy load database functions
const getDatabase = () => require('../utils/database').getDatabase();

/**
 * Purchase Orders API
 * Handles PO creation, approval workflow, receiving, and tracking
 */

// GET /api/purchase-orders - Get all purchase orders
router.get('/', async (req, res) => {
  try {
    const { status, supplier_id, warehouse_id, from_date, to_date } = req.query;
    const tenantId = req.tenantId;

    let sql = `
      SELECT po.*, 
             s.name as supplier_name,
             w.name as warehouse_name,
             u.first_name || ' ' || u.last_name as created_by_name,
             COUNT(DISTINCT poi.id) as item_count,
             SUM(poi.quantity * poi.unit_price) as total_amount
      FROM purchase_orders po
      LEFT JOIN suppliers s ON po.supplier_id = s.id
      LEFT JOIN warehouses w ON po.warehouse_id = w.id
      LEFT JOIN users u ON po.created_by = u.id
      LEFT JOIN purchase_order_items poi ON po.id = poi.purchase_order_id
      WHERE po.tenant_id = ?
    `;
    
    const params = [tenantId];
    let paramIndex = 1;

    if (status) {
      sql += ` AND po.status = ?`;
      params.push(status);
    }
    if (supplier_id) {
      sql += ` AND po.supplier_id = ?`;
      params.push(supplier_id);
    }
    if (warehouse_id) {
      sql += ` AND po.warehouse_id = ?`;
      params.push(warehouse_id);
    }
    if (from_date) {
      sql += ` AND po.order_date >= ?`;
      params.push(from_date);
    }
    if (to_date) {
      sql += ` AND po.order_date <= ?`;
      params.push(to_date);
    }

    sql += ' GROUP BY po.id, s.name, w.name, u.first_name, u.last_name ORDER BY po.created_at DESC';

    const rows = await getQuery(sql, params);
    res.json({ success: true, data: rows || [] });
  } catch (error) {
    console.error('Error in GET /purchase-orders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/purchase-orders/:id - Get single purchase order with items
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;

    // Get PO header
    const poSql = `
      SELECT po.*, 
             s.name as supplier_name, s.email as supplier_email, s.phone as supplier_phone,
             w.name as warehouse_name, w.address as warehouse_address,
             u.first_name || ' ' || u.last_name as created_by_name
      FROM purchase_orders po
      LEFT JOIN suppliers s ON po.supplier_id = s.id
      LEFT JOIN warehouses w ON po.warehouse_id = w.id
      LEFT JOIN users u ON po.created_by = u.id
      WHERE po.id = ? AND po.tenant_id = ?
    `;

    const po = await getOneQuery(poSql, [id, tenantId]);
    
    if (!po) {
      return res.status(404).json({ error: 'Purchase order not found' });
    }

    // Get PO items
    const itemsSql = `
      SELECT poi.*, p.name as product_name, p.sku
      FROM purchase_order_items poi
      LEFT JOIN products p ON poi.product_id = p.id
      WHERE poi.purchase_order_id = ?
      ORDER BY poi.id
    `;

    const items = await getQuery(itemsSql, [id]);

    po.items = items || [];
    po.subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    po.tax_amount = po.subtotal * (po.tax_rate || 0) / 100;
    po.total = po.subtotal + po.tax_amount - (po.discount || 0);

    res.json({ success: true, data: po });
  } catch (error) {
    console.error('Error in GET /purchase-orders/:id:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/purchase-orders - Create new purchase order
router.post('/', async (req, res) => {
  try {
    const { 
      supplier_id, 
      warehouse_id, 
      order_date, 
      expected_delivery_date, 
      payment_terms, 
      notes, 
      items,
      tax_rate,
      discount
    } = req.body;

    const tenantId = req.tenantId || 1;
    const userId = req.userId || 1;

    // Validation
    if (!supplier_id || !warehouse_id || !items || items.length === 0) {
      return res.status(400).json({ 
        error: 'Missing required fields: supplier_id, warehouse_id, items' 
      });
    }

    // Generate PO number
    const poNumber = `PO-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Insert PO header
    const poSql = `
      INSERT INTO purchase_orders (
        tenant_id, po_number, supplier_id, warehouse_id, order_date, 
        expected_delivery_date, payment_terms, status, notes, tax_rate, 
        discount, created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `;

    const poResult = await runQuery(poSql, [
      tenantId, poNumber, supplier_id, warehouse_id, 
      order_date || new Date().toISOString().split('T')[0],
      expected_delivery_date, payment_terms, notes, tax_rate || 0, 
      discount || 0, userId
    ]);

    const poId = poResult.lastID;

    const itemSql = `
      INSERT INTO purchase_order_items (
        purchase_order_id, product_id, quantity, unit_price, 
        notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `;

    for (const item of items) {
      await runQuery(itemSql, [
        poId, item.product_id, item.quantity, item.unit_price, item.notes || null
      ]);
    }

    res.status(201).json({ 
      success: true, 
      data: { id: poId, po_number: poNumber }, 
      message: 'Purchase order created successfully' 
    });
  } catch (error) {
    console.error('Error in POST /purchase-orders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/purchase-orders/:id - Update purchase order
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const tenantId = req.tenantId || 1;

    // Remove items from updates if present (handled separately)
    const { items, ...poUpdates } = updates;

    if (Object.keys(poUpdates).length === 0 && !items) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    // Build update query
    const setClause = Object.keys(poUpdates)
      .map(key => `${key} = ?`)
      .join(', ');
    
    const values = [...Object.values(poUpdates), tenantId, id];

    const sql = `
      UPDATE purchase_orders 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE tenant_id = ? AND id = ?
    `;

    const result = await runQuery(sql, values);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Purchase order not found' });
    }

    res.json({ 
      success: true, 
      message: 'Purchase order updated successfully',
      changes: result.changes
    });
  } catch (error) {
    console.error('Error in PUT /purchase-orders/:id:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/purchase-orders/:id/approve - Approve purchase order
router.post('/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const { approved_by_name } = req.body;
    const tenantId = req.tenantId || 1;
    const userId = req.userId || 1;

    const sql = `
      UPDATE purchase_orders 
      SET status = 'approved', 
          approved_by = ?, 
          approved_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE tenant_id = ? AND id = ? AND status = 'draft'
    `;

    const result = await runQuery(sql, [userId, tenantId, id]);

    if (result.changes === 0) {
      return res.status(404).json({ 
        error: 'Purchase order not found or already approved' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Purchase order approved successfully' 
    });
  } catch (error) {
    console.error('Error in POST /purchase-orders/:id/approve:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/purchase-orders/:id/receive - Receive purchase order
router.post('/:id/receive', async (req, res) => {
  try {
    const { id } = req.params;
    const { received_items, notes } = req.body;
    const tenantId = req.tenantId || 1;
    const userId = req.userId || 1;

    if (!received_items || received_items.length === 0) {
      return res.status(400).json({ error: 'No received items provided' });
    }

    // Update PO status
    const poSql = `
      UPDATE purchase_orders 
      SET status = 'received', 
          received_by = ?, 
          received_at = CURRENT_TIMESTAMP,
          receive_notes = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE tenant_id = ? AND id = ? AND status = 'approved'
    `;

    const poResult = await runQuery(poSql, [userId, notes, tenantId, id]);

    if (poResult.changes === 0) {
      return res.status(404).json({ 
        error: 'Purchase order not found or not approved' 
      });
    }

    for (const item of received_items) {
      const itemSql = `
        UPDATE purchase_order_items 
        SET received_quantity = ?, 
            receive_notes = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE purchase_order_id = ? AND product_id = ?
      `;
      await runQuery(itemSql, [
        item.received_quantity, 
        item.notes || null, 
        id, 
        item.product_id
      ]);
    }

    res.json({ 
      success: true, 
      message: 'Purchase order received successfully' 
    });
  } catch (error) {
    console.error('Error in POST /purchase-orders/:id/receive:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/purchase-orders/:id - Delete purchase order (only if draft)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId || 1;

    // Delete PO items first
    const deleteItemsSql = `
      DELETE FROM purchase_order_items 
      WHERE purchase_order_id IN (
        SELECT id FROM purchase_orders 
        WHERE id = ? AND tenant_id = ? AND status = 'draft'
      )
    `;

    await runQuery(deleteItemsSql, [id, tenantId]);

    const deletePoSql = `
      DELETE FROM purchase_orders 
      WHERE id = ? AND tenant_id = ? AND status = 'draft'
    `;

    const deleteResult = await runQuery(deletePoSql, [id, tenantId]);

    if (deleteResult.changes === 0) {
      return res.status(404).json({ 
        error: 'Purchase order not found or cannot be deleted' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Purchase order deleted successfully' 
    });
  } catch (error) {
    console.error('Error in DELETE /purchase-orders/:id:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/purchase-orders/stats - Get PO statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const { from_date, to_date } = req.query;
    const tenantId = req.tenantId || 1;

    let sql = `
      SELECT 
        COUNT(*) as total_pos,
        SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'received' THEN 1 ELSE 0 END) as received,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled
      FROM purchase_orders
      WHERE tenant_id = ?
    `;

    const params = [tenantId];

    if (from_date) {
      sql += ' AND order_date >= ?';
      params.push(from_date);
    }
    if (to_date) {
      sql += ' AND order_date <= ?';
      params.push(to_date);
    }

    const stats = await getOneQuery(sql, params);
    res.json({ success: true, data: stats || {} });
  } catch (error) {
    console.error('Error in GET /purchase-orders/stats/summary:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
