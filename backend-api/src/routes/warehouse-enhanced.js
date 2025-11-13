const express = require('express');
const { getQuery, getOneQuery, runQuery } = require('../utils/database');
const router = express.Router();

// Module 4: Warehouse Management - Backend Enhancement (40% → 100%)

const getDatabase = () => require('../utils/database').getDatabase();

// ============================================================================
// RECEIVING OPERATIONS
// ============================================================================

router.post('/receive', async (req, res) => {
  try {
    const { poId, warehouseId, items, receivedBy } = req.body;
    const tenantId = req.tenantId;

    const receiptId = await new Promise((resolve, reject) => {
      db.run(`
        INSERT INTO receiving_tasks (
          po_id, warehouse_id, status, received_by, tenant_id
        ) VALUES ($1, $2, 'in_progress', $3, $4)
      `, [poId, warehouseId, receivedBy || req.user.userId, tenantId],
      function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });

    for (const item of items) {
      await new Promise((resolve, reject) => {
        db.run(`
          INSERT INTO received_items (
            receipt_id, product_id, quantity, condition, 
            lot_number, expiry_date, tenant_id
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [receiptId, item.productId, item.quantity, item.condition || 'good',
            item.lotNumber, item.expiryDate, tenantId],
        (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }

    res.json({ success: true, receiptId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/receive/put-away', async (req, res) => {
  try {
    const { receiptId, productId, quantity, locationId } = req.body;
    const tenantId = req.tenantId;

    const taskId = await new Promise((resolve, reject) => {
      db.run(`
        INSERT INTO put_away_tasks (
          receipt_id, product_id, quantity, target_location_id,
          status, assigned_to, tenant_id
        ) VALUES ($1, $2, $3, $4, 'pending', $5, $6)
      `, [receiptId, productId, quantity, locationId, req.user.userId, tenantId],
      function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });

    res.json({ success: true, taskId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/receiving/pending', async (req, res) => {
  try {
    const { warehouseId } = req.query;
    const tenantId = req.tenantId;

    const pending = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          rt.*,
          po.po_number,
          s.name as supplier_name,
          COUNT(ri.id) as items_count
        FROM receiving_tasks rt
        JOIN purchase_orders po ON rt.po_id = po.id
        JOIN suppliers s ON po.supplier_id = s.id
        LEFT JOIN received_items ri ON rt.id = ri.receipt_id
        WHERE rt.tenant_id = $1
          AND rt.warehouse_id = ?
          AND rt.status != 'completed'
        GROUP BY rt.id
        ORDER BY rt.created_at DESC
      `, [tenantId, warehouseId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });

    res.json({ success: true, pending });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// PICKING OPERATIONS
// ============================================================================

router.post('/pick/create-list', async (req, res) => {
  try {
    const { orderId, warehouseId, priority } = req.body;
    const tenantId = req.tenantId;

    const pickListId = await new Promise((resolve, reject) => {
      db.run(`
        INSERT INTO pick_lists (
          order_id, warehouse_id, status, priority,
          created_by, tenant_id
        ) VALUES ($1, $2, 'pending', $3, $4, $5)
      `, [orderId, warehouseId, priority || 'normal', req.user.userId, tenantId],
      function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });

    // Get order items and create pick list items
    const orderItems = await new Promise((resolve, reject) => {
      db.all(`
        SELECT * FROM order_items WHERE order_id = $1
      `, [orderId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });

    for (const item of orderItems) {
      await new Promise((resolve, reject) => {
        db.run(`
          INSERT INTO pick_list_items (
            pick_list_id, product_id, quantity_required,
            quantity_picked, tenant_id
          ) VALUES ($1, $2, $3, 0, $4)
        `, [pickListId, item.product_id, item.quantity, tenantId],
        (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }

    res.json({ success: true, pickListId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/pick/active', async (req, res) => {
  try {
    const { warehouseId } = req.query;
    const tenantId = req.tenantId;

    const active = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          pl.*,
          o.order_number,
          c.name as customer_name,
          COUNT(pli.id) as total_items,
          SUM(CASE WHEN pli.quantity_picked >= pli.quantity_required THEN 1 ELSE 0 END) as picked_items
        FROM pick_lists pl
        JOIN orders o ON pl.order_id = o.id
        JOIN customers c ON o.customer_id = c.id
        LEFT JOIN pick_list_items pli ON pl.id = pli.pick_list_id
        WHERE pl.tenant_id = $1
          AND pl.warehouse_id = ?
          AND pl.status IN ('pending', 'in_progress')
        GROUP BY pl.id
        ORDER BY pl.priority DESC, pl.created_at
      `, [tenantId, warehouseId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });

    res.json({ success: true, active });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/pick/confirm', async (req, res) => {
  try {
    const { pickListItemId, quantityPicked, locationId } = req.body;
    const tenantId = req.tenantId;

    await new Promise((resolve, reject) => {
      db.run(`
        UPDATE pick_list_items
        SET quantity_picked = ?,
            picked_from_location = $1,
            picked_at = CURRENT_TIMESTAMP,
            picked_by = ?
        WHERE id = $1 AND tenant_id = $2
      `, [quantityPicked, locationId, req.user.userId, pickListItemId, tenantId],
      (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// PACKING OPERATIONS
// ============================================================================

router.post('/pack/start', async (req, res) => {
  try {
    const { pickListId, station } = req.body;
    const tenantId = req.tenantId;

    const packingId = await new Promise((resolve, reject) => {
      db.run(`
        INSERT INTO packing_tasks (
          pick_list_id, station, status, packed_by, tenant_id
        ) VALUES ($1, $2, 'in_progress', $3, $4)
      `, [pickListId, station, req.user.userId, tenantId],
      function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });

    res.json({ success: true, packingId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/pack/complete', async (req, res) => {
  try {
    const { packingId, boxes, totalWeight } = req.body;
    const tenantId = req.tenantId;

    await new Promise((resolve, reject) => {
      db.run(`
        UPDATE packing_tasks
        SET status = 'completed',
            box_count = ?,
            total_weight = ?,
            completed_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND tenant_id = $2
      `, [boxes, totalWeight, packingId, tenantId],
      (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// SHIPPING OPERATIONS
// ============================================================================

router.post('/ship/create', async (req, res) => {
  try {
    const { packingId, carrier, trackingNumber, shippingCost } = req.body;
    const tenantId = req.tenantId;

    const manifestId = await new Promise((resolve, reject) => {
      db.run(`
        INSERT INTO shipping_manifests (
          packing_id, carrier, tracking_number, shipping_cost,
          status, created_by, tenant_id
        ) VALUES ($1, $2, $3, $4, 'pending', $5, $6)
      `, [packingId, carrier, trackingNumber, shippingCost, req.user.userId, tenantId],
      function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });

    res.json({ success: true, manifestId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/ship/dispatch', async (req, res) => {
  try {
    const { manifestId } = req.body;
    const tenantId = req.tenantId;

    await new Promise((resolve, reject) => {
      db.run(`
        UPDATE shipping_manifests
        SET status = 'dispatched',
            dispatched_at = CURRENT_TIMESTAMP,
            dispatched_by = ?
        WHERE id = $1 AND tenant_id = $2
      `, [req.user.userId, manifestId, tenantId],
      (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// CYCLE COUNTS
// ============================================================================

router.post('/cycle-count/create', async (req, res) => {
  try {
    const { warehouseId, products, countType } = req.body;
    const tenantId = req.tenantId;

    const countId = await new Promise((resolve, reject) => {
      db.run(`
        INSERT INTO cycle_count_tasks (
          warehouse_id, count_type, status, assigned_to, tenant_id
        ) VALUES ($1, $2, 'pending', $3, $4)
      `, [warehouseId, countType || 'cycle', req.user.userId, tenantId],
      function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });

    for (const productId of products) {
      await new Promise((resolve, reject) => {
        db.run(`
          INSERT INTO count_results (
            count_task_id, product_id, tenant_id
          ) VALUES ($1, $2, $3)
        `, [countId, productId, tenantId],
        (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }

    res.json({ success: true, countId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/cycle-count/submit', async (req, res) => {
  try {
    const { countResultId, countedQuantity, notes } = req.body;
    const tenantId = req.tenantId;

    await new Promise((resolve, reject) => {
      db.run(`
        UPDATE count_results
        SET counted_quantity = ?,
            notes = ?,
            counted_at = CURRENT_TIMESTAMP,
            counted_by = ?
        WHERE id = $1 AND tenant_id = $2
      `, [countedQuantity, notes, req.user.userId, countResultId, tenantId],
      (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/cycle-count/variance', async (req, res) => {
  try {
    const { countTaskId } = req.query;
    const tenantId = req.tenantId;

    const variances = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          cr.*,
          p.name as product_name,
          p.sku,
          il.quantity as system_quantity,
          (cr.counted_quantity - il.quantity) as variance
        FROM count_results cr
        JOIN products p ON cr.product_id = p.id
        LEFT JOIN inventory_locations il ON cr.product_id = il.product_id
        WHERE cr.count_task_id = $1
          AND cr.tenant_id = ?
          AND cr.counted_quantity IS NOT NULL
        ORDER BY ABS(cr.counted_quantity - il.quantity) DESC
      `, [countTaskId, tenantId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });

    res.json({ success: true, variances });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// WAREHOUSE ANALYTICS
// ============================================================================

router.get('/analytics', async (req, res) => {
  try {
    const { warehouseId, period } = req.query;
    const tenantId = req.tenantId;

    // Calculate key metrics
    const metrics = {
      receiving: await new Promise((resolve, reject) => {
        db.get(`
          SELECT 
            COUNT(*) as total_receipts,
            SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
          FROM receiving_tasks
          WHERE warehouse_id = $1 AND tenant_id = $2
        `, [warehouseId, tenantId], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      }),
      picking: await new Promise((resolve, reject) => {
        db.get(`
          SELECT 
            COUNT(*) as total_picks,
            AVG(JULIANDAY(completed_at) - JULIANDAY(created_at)) as avg_pick_time
          FROM pick_lists
          WHERE warehouse_id = $1 AND tenant_id = $2 AND status = 'completed'
        `, [warehouseId, tenantId], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      }),
      shipping: await new Promise((resolve, reject) => {
        db.get(`
          SELECT COUNT(*) as total_shipments
          FROM shipping_manifests sm
          JOIN packing_tasks pt ON sm.packing_id = pt.id
          JOIN pick_lists pl ON pt.pick_list_id = pl.id
          WHERE pl.warehouse_id = $1 AND sm.tenant_id = $2
        `, [warehouseId, tenantId], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      })
    };

    res.json({ success: true, metrics });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
