const express = require('express');
const router = express.Router();

// Lazy load database functions
const getDatabase = () => require('../utils/database').getDatabase();

/**
 * Stock Movements API
 * Handles transfers between warehouses, adjustments, and movement tracking
 */

// GET /api/stock-movements - Get all stock movements
router.get('/', async (req, res) => {
  try {
    const { 
      type, 
      product_id, 
      from_warehouse_id, 
      to_warehouse_id, 
      from_date, 
      to_date,
      status 
    } = req.query;
    const tenantId = req.tenantId || 1;
    const db = getDatabase();

    let sql = `
      SELECT sm.*, 
             p.name as product_name, p.code,
             fw.name as from_warehouse_name,
             tw.name as to_warehouse_name,
             u.first_name || ' ' || u.last_name as created_by_name
      FROM stock_movements sm
      LEFT JOIN products p ON sm.product_id = p.id
      LEFT JOIN warehouses fw ON sm.from_warehouse_id = fw.id
      LEFT JOIN warehouses tw ON sm.to_warehouse_id = tw.id
      LEFT JOIN users u ON sm.created_by = u.id
      WHERE sm.tenant_id = ?
    `;
    
    const params = [tenantId];

    if (type) {
      sql += ' AND sm.movement_type = ?';
      params.push(type);
    }
    if (product_id) {
      sql += ' AND sm.product_id = ?';
      params.push(product_id);
    }
    if (from_warehouse_id) {
      sql += ' AND sm.from_warehouse_id = ?';
      params.push(from_warehouse_id);
    }
    if (to_warehouse_id) {
      sql += ' AND sm.to_warehouse_id = ?';
      params.push(to_warehouse_id);
    }
    if (from_date) {
      sql += ' AND sm.movement_date >= ?';
      params.push(from_date);
    }
    if (to_date) {
      sql += ' AND sm.movement_date <= ?';
      params.push(to_date);
    }
    if (status) {
      sql += ' AND sm.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY sm.movement_date DESC, sm.created_at DESC';

    db.all(sql, params, (err, rows) => {
      if (err) {
        console.error('Error fetching stock movements:', err);
        return res.status(500).json({ error: 'Failed to fetch stock movements' });
      }
      res.json({ success: true, data: rows || [] });
    });
  } catch (error) {
    console.error('Error in GET /stock-movements:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/stock-movements/:id - Get single stock movement
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId || 1;
    const db = getDatabase();

    const sql = `
      SELECT sm.*, 
             p.name as product_name, p.code, p.unit,
             fw.name as from_warehouse_name, fw.address as from_warehouse_address,
             tw.name as to_warehouse_name, tw.address as to_warehouse_address,
             u.first_name || ' ' || u.last_name as created_by_name,
             ua.name as approved_by_name,
             ur.name as received_by_name
      FROM stock_movements sm
      LEFT JOIN products p ON sm.product_id = p.id
      LEFT JOIN warehouses fw ON sm.from_warehouse_id = fw.id
      LEFT JOIN warehouses tw ON sm.to_warehouse_id = tw.id
      LEFT JOIN users u ON sm.created_by = u.id
      LEFT JOIN users ua ON sm.approved_by = ua.id
      LEFT JOIN users ur ON sm.received_by = ur.id
      WHERE sm.id = ? AND sm.tenant_id = ?
    `;

    db.get(sql, [id, tenantId], (err, row) => {
      if (err) {
        console.error('Error fetching stock movement:', err);
        return res.status(500).json({ error: 'Failed to fetch stock movement' });
      }
      if (!row) {
        return res.status(404).json({ error: 'Stock movement not found' });
      }
      res.json({ success: true, data: row });
    });
  } catch (error) {
    console.error('Error in GET /stock-movements/:id:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/stock-movements - Create new stock movement
router.post('/', async (req, res) => {
  try {
    const { 
      movement_type, // 'transfer', 'adjustment', 'return', 'damage', 'expired'
      product_id,
      from_warehouse_id,
      to_warehouse_id,
      quantity,
      movement_date,
      reference_number,
      reason,
      notes
    } = req.body;

    const tenantId = req.tenantId || 1;
    const userId = req.userId || 1;
    const db = getDatabase();

    // Validation
    if (!movement_type || !product_id || !quantity) {
      return res.status(400).json({ 
        error: 'Missing required fields: movement_type, product_id, quantity' 
      });
    }

    if (movement_type === 'transfer' && (!from_warehouse_id || !to_warehouse_id)) {
      return res.status(400).json({ 
        error: 'Transfer requires both from_warehouse_id and to_warehouse_id' 
      });
    }

    if (movement_type === 'transfer' && from_warehouse_id === to_warehouse_id) {
      return res.status(400).json({ 
        error: 'Source and destination warehouses must be different' 
      });
    }

    // Generate reference number if not provided
    const refNumber = reference_number || `SM-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const sql = `
      INSERT INTO stock_movements (
        tenant_id, movement_type, product_id, from_warehouse_id, to_warehouse_id,
        quantity, movement_date, reference_number, reason, notes, status,
        created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, datetime('now'), datetime('now'))
    `;

    db.run(sql, [
      tenantId, movement_type, product_id, from_warehouse_id || null, to_warehouse_id || null,
      quantity, movement_date || new Date().toISOString().split('T')[0],
      refNumber, reason || null, notes || null, userId
    ], function(err) {
      if (err) {
        console.error('Error creating stock movement:', err);
        return res.status(500).json({ error: 'Failed to create stock movement' });
      }

      res.status(201).json({ 
        success: true, 
        data: { id: this.lastID, reference_number: refNumber },
        message: 'Stock movement created successfully' 
      });
    });
  } catch (error) {
    console.error('Error in POST /stock-movements:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/stock-movements/:id - Update stock movement (only if pending)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const tenantId = req.tenantId || 1;
    const db = getDatabase();

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    // Build update query
    const setClause = Object.keys(updates)
      .map(key => `${key} = ?`)
      .join(', ');
    
    const values = [...Object.values(updates), tenantId, id];

    const sql = `
      UPDATE stock_movements 
      SET ${setClause}, updated_at = datetime('now')
      WHERE tenant_id = ? AND id = ? AND status = 'pending'
    `;

    db.run(sql, values, function(err) {
      if (err) {
        console.error('Error updating stock movement:', err);
        return res.status(500).json({ error: 'Failed to update stock movement' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ 
          error: 'Stock movement not found or cannot be updated' 
        });
      }

      res.json({ 
        success: true, 
        message: 'Stock movement updated successfully',
        changes: this.changes
      });
    });
  } catch (error) {
    console.error('Error in PUT /stock-movements/:id:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/stock-movements/:id/approve - Approve stock movement
router.post('/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId || 1;
    const userId = req.userId || 1;
    const db = getDatabase();

    const sql = `
      UPDATE stock_movements 
      SET status = 'approved', 
          approved_by = ?, 
          approved_at = datetime('now'),
          updated_at = datetime('now')
      WHERE tenant_id = ? AND id = ? AND status = 'pending'
    `;

    db.run(sql, [userId, tenantId, id], function(err) {
      if (err) {
        console.error('Error approving stock movement:', err);
        return res.status(500).json({ error: 'Failed to approve stock movement' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ 
          error: 'Stock movement not found or already approved' 
        });
      }

      res.json({ 
        success: true, 
        message: 'Stock movement approved successfully' 
      });
    });
  } catch (error) {
    console.error('Error in POST /stock-movements/:id/approve:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/stock-movements/:id/complete - Complete stock movement (update inventory)
router.post('/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;
    const { received_quantity, notes } = req.body;
    const tenantId = req.tenantId || 1;
    const userId = req.userId || 1;
    const db = getDatabase();

    // Get movement details
    const getSql = `
      SELECT * FROM stock_movements 
      WHERE id = ? AND tenant_id = ? AND status = 'approved'
    `;

    db.get(getSql, [id, tenantId], (err, movement) => {
      if (err) {
        console.error('Error fetching stock movement:', err);
        return res.status(500).json({ error: 'Failed to fetch stock movement' });
      }

      if (!movement) {
        return res.status(404).json({ 
          error: 'Stock movement not found or not approved' 
        });
      }

      const actualQuantity = received_quantity || movement.quantity;
      const variance = actualQuantity - movement.quantity;

      // Update movement status
      const updateSql = `
        UPDATE stock_movements 
        SET status = 'completed', 
            received_quantity = ?,
            variance = ?,
            completion_notes = ?,
            received_by = ?, 
            received_at = datetime('now'),
            updated_at = datetime('now')
        WHERE id = ?
      `;

      db.run(updateSql, [actualQuantity, variance, notes, userId, id], function(err) {
        if (err) {
          console.error('Error completing stock movement:', err);
          return res.status(500).json({ error: 'Failed to complete stock movement' });
        }

        // TODO: Update inventory levels here
        // This would update the inventory table based on movement type:
        // - transfer: decrease from_warehouse, increase to_warehouse
        // - adjustment: update warehouse quantity
        // - return/damage/expired: update warehouse quantity

        res.json({ 
          success: true, 
          message: 'Stock movement completed successfully',
          data: {
            received_quantity: actualQuantity,
            variance: variance
          }
        });
      });
    });
  } catch (error) {
    console.error('Error in POST /stock-movements/:id/complete:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/stock-movements/:id/cancel - Cancel stock movement
router.post('/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const tenantId = req.tenantId || 1;
    const db = getDatabase();

    const sql = `
      UPDATE stock_movements 
      SET status = 'cancelled', 
          cancellation_reason = ?,
          updated_at = datetime('now')
      WHERE tenant_id = ? AND id = ? AND status IN ('pending', 'approved')
    `;

    db.run(sql, [reason, tenantId, id], function(err) {
      if (err) {
        console.error('Error cancelling stock movement:', err);
        return res.status(500).json({ error: 'Failed to cancel stock movement' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ 
          error: 'Stock movement not found or cannot be cancelled' 
        });
      }

      res.json({ 
        success: true, 
        message: 'Stock movement cancelled successfully' 
      });
    });
  } catch (error) {
    console.error('Error in POST /stock-movements/:id/cancel:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/stock-movements/stats/summary - Get movement statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const { from_date, to_date, warehouse_id } = req.query;
    const tenantId = req.tenantId || 1;
    const db = getDatabase();

    let sql = `
      SELECT 
        movement_type,
        status,
        COUNT(*) as count,
        SUM(quantity) as total_quantity
      FROM stock_movements
      WHERE tenant_id = ?
    `;

    const params = [tenantId];

    if (from_date) {
      sql += ' AND movement_date >= ?';
      params.push(from_date);
    }
    if (to_date) {
      sql += ' AND movement_date <= ?';
      params.push(to_date);
    }
    if (warehouse_id) {
      sql += ' AND (from_warehouse_id = ? OR to_warehouse_id = ?)';
      params.push(warehouse_id, warehouse_id);
    }

    sql += ' GROUP BY movement_type, status';

    db.all(sql, params, (err, stats) => {
      if (err) {
        console.error('Error fetching movement stats:', err);
        return res.status(500).json({ error: 'Failed to fetch movement stats' });
      }
      res.json({ success: true, data: stats || [] });
    });
  } catch (error) {
    console.error('Error in GET /stock-movements/stats/summary:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
