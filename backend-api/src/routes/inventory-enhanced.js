const express = require('express');
const router = express.Router();

// Module 2: Inventory & Products - Backend Enhancement (55% → 100%)
// This file adds advanced inventory management features

const getDatabase = () => require('../utils/database').getDatabase();

// ============================================================================
// MULTI-LOCATION INVENTORY MANAGEMENT
// ============================================================================

/**
 * @route   GET /api/inventory/multi-location
 * @desc    Get inventory across all locations/warehouses
 * @access  Private
 */
router.get('/multi-location', async (req, res) => {
  try {
    const { productId, warehouseId, belowMin } = req.query;
    const tenantId = req.user.tenantId;

    let sql = `
      SELECT 
        il.id,
        il.product_id,
        p.name as product_name,
        p.sku,
        il.warehouse_id,
        w.name as warehouse_name,
        w.code as warehouse_code,
        il.quantity,
        il.available_quantity,
        il.reserved_quantity,
        il.min_stock_level,
        il.max_stock_level,
        il.reorder_point,
        il.reorder_quantity,
        il.last_restock_date,
        CASE 
          WHEN il.available_quantity <= il.min_stock_level THEN 'low'
          WHEN il.available_quantity >= il.max_stock_level THEN 'overstock'
          ELSE 'normal'
        END as stock_status
      FROM inventory_locations il
      JOIN products p ON il.product_id = p.id
      JOIN warehouses w ON il.warehouse_id = w.id
      WHERE il.tenant_id = ?
    `;
    const params = [tenantId];

    if (productId) {
      sql += ' AND il.product_id = ?';
      params.push(productId);
    }

    if (warehouseId) {
      sql += ' AND il.warehouse_id = ?';
      params.push(warehouseId);
    }

    if (belowMin === 'true') {
      sql += ' AND il.available_quantity <= il.min_stock_level';
    }

    sql += ' ORDER BY w.name, p.name';

    const inventory = await new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });

    // Calculate aggregates
    const summary = {
      totalLocations: [...new Set(inventory.map(i => i.warehouse_id))].length,
      totalProducts: [...new Set(inventory.map(i => i.product_id))].length,
      totalQuantity: inventory.reduce((sum, i) => sum + (i.quantity || 0), 0),
      lowStockItems: inventory.filter(i => i.stock_status === 'low').length,
      overstockItems: inventory.filter(i => i.stock_status === 'overstock').length
    };

    res.json({ inventory, summary });
  } catch (error) {
    console.error('Multi-location inventory error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   POST /api/inventory/transfer
 * @desc    Transfer inventory between locations
 * @access  Private
 */
router.post('/transfer', async (req, res) => {
  try {
    const { productId, fromWarehouseId, toWarehouseId, quantity, reason, notes } = req.body;
    const tenantId = req.user.tenantId;

    // Validate sufficient quantity at source
    const sourceInventory = await new Promise((resolve, reject) => {
      db.get(
        `SELECT * FROM inventory_locations 
         WHERE product_id = ? AND warehouse_id = ? AND tenant_id = ?`,
        [productId, fromWarehouseId, tenantId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!sourceInventory || sourceInventory.available_quantity < quantity) {
      return res.status(400).json({ 
        error: 'Insufficient quantity at source location',
        available: sourceInventory?.available_quantity || 0,
        requested: quantity
      });
    }

    // Create transfer record
    const transferId = await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO inventory_transfers (
          product_id, from_warehouse_id, to_warehouse_id, quantity,
          status, reason, notes, initiated_by, tenant_id
        ) VALUES (?, ?, ?, ?, 'pending', ?, ?, ?, ?)`,
        [productId, fromWarehouseId, toWarehouseId, quantity, reason, notes, req.user.userId, tenantId],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });

    // Deduct from source
    await new Promise((resolve, reject) => {
      db.run(
        `UPDATE inventory_locations 
         SET available_quantity = available_quantity - ?,
             reserved_quantity = reserved_quantity + ?,
             updated_at = CURRENT_TIMESTAMP
         WHERE product_id = ? AND warehouse_id = ? AND tenant_id = ?`,
        [quantity, quantity, productId, fromWarehouseId, tenantId],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    // Log transaction
    await logInventoryTransaction(productId, fromWarehouseId, -quantity, 'transfer_out', 
      `Transfer to warehouse ${toWarehouseId}`, transferId, tenantId, db);

    res.json({
      success: true,
      transferId,
      message: 'Transfer initiated successfully',
      status: 'pending'
    });
  } catch (error) {
    console.error('Inventory transfer error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   POST /api/inventory/transfer/:id/complete
 * @desc    Complete inventory transfer (receiving end)
 * @access  Private
 */
router.post('/transfer/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;
    const { receivedQuantity, notes } = req.body;
    const tenantId = req.user.tenantId;

    // Get transfer details
    const transfer = await new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM inventory_transfers WHERE id = ? AND tenant_id = ?',
        [id, tenantId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!transfer) {
      return res.status(404).json({ error: 'Transfer not found' });
    }

    if (transfer.status !== 'pending') {
      return res.status(400).json({ error: 'Transfer already completed or cancelled' });
    }

    const actualQuantity = receivedQuantity || transfer.quantity;

    // Release reservation at source
    await new Promise((resolve, reject) => {
      db.run(
        `UPDATE inventory_locations 
         SET reserved_quantity = reserved_quantity - ?,
             quantity = quantity - ?,
             updated_at = CURRENT_TIMESTAMP
         WHERE product_id = ? AND warehouse_id = ? AND tenant_id = ?`,
        [transfer.quantity, transfer.quantity, transfer.product_id, transfer.from_warehouse_id, tenantId],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    // Add to destination
    await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO inventory_locations (
          product_id, warehouse_id, quantity, available_quantity, tenant_id
        ) VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(product_id, warehouse_id, tenant_id) DO UPDATE SET
          quantity = quantity + ?,
          available_quantity = available_quantity + ?,
          updated_at = CURRENT_TIMESTAMP`,
        [
          transfer.product_id, transfer.to_warehouse_id, actualQuantity, actualQuantity, tenantId,
          actualQuantity, actualQuantity
        ],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    // Update transfer status
    await new Promise((resolve, reject) => {
      db.run(
        `UPDATE inventory_transfers 
         SET status = 'completed', received_quantity = ?, 
             completed_at = CURRENT_TIMESTAMP, completed_by = ?, completion_notes = ?
         WHERE id = ? AND tenant_id = ?`,
        [actualQuantity, req.user.userId, notes, id, tenantId],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    // Log transaction at destination
    await logInventoryTransaction(transfer.product_id, transfer.to_warehouse_id, actualQuantity, 
      'transfer_in', `Transfer from warehouse ${transfer.from_warehouse_id}`, id, tenantId, db);

    res.json({
      success: true,
      message: 'Transfer completed successfully',
      receivedQuantity: actualQuantity
    });
  } catch (error) {
    console.error('Complete transfer error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// INVENTORY TRANSACTIONS & HISTORY
// ============================================================================

/**
 * @route   GET /api/inventory/transactions
 * @desc    Get inventory transaction history
 * @access  Private
 */
router.get('/transactions', async (req, res) => {
  try {
    const { productId, warehouseId, type, startDate, endDate, limit = 100 } = req.query;
    const tenantId = req.user.tenantId;

    let sql = `
      SELECT 
        it.*,
        p.name as product_name,
        p.sku,
        w.name as warehouse_name,
        u.username as created_by_name
      FROM inventory_transactions it
      JOIN products p ON it.product_id = p.id
      LEFT JOIN warehouses w ON it.warehouse_id = w.id
      LEFT JOIN users u ON it.created_by = u.id
      WHERE it.tenant_id = ?
    `;
    const params = [tenantId];

    if (productId) {
      sql += ' AND it.product_id = ?';
      params.push(productId);
    }

    if (warehouseId) {
      sql += ' AND it.warehouse_id = ?';
      params.push(warehouseId);
    }

    if (type) {
      sql += ' AND it.transaction_type = ?';
      params.push(type);
    }

    if (startDate) {
      sql += ' AND it.created_at::date >= ?';
      params.push(startDate);
    }

    if (endDate) {
      sql += ' AND it.created_at::date <= ?';
      params.push(endDate);
    }

    sql += ' ORDER BY it.created_at DESC LIMIT ?';
    params.push(parseInt(limit));

    const transactions = await new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });

    res.json(transactions);
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   POST /api/inventory/adjust
 * @desc    Adjust inventory (stock take, corrections, etc.)
 * @access  Private
 */
router.post('/adjust', async (req, res) => {
  try {
    const { productId, warehouseId, adjustmentType, quantity, reason, notes } = req.body;
    const tenantId = req.user.tenantId;

    // Adjustment types: addition, subtraction, correction
    let quantityChange = quantity;
    if (adjustmentType === 'subtraction') {
      quantityChange = -Math.abs(quantity);
    } else if (adjustmentType === 'correction') {
      // For correction, quantity is the new total
      const current = await new Promise((resolve, reject) => {
        db.get(
          'SELECT quantity FROM inventory_locations WHERE product_id = ? AND warehouse_id = ? AND tenant_id = ?',
          [productId, warehouseId, tenantId],
          (err, row) => {
            if (err) reject(err);
            else resolve(row);
          }
        );
      });
      quantityChange = quantity - (current?.quantity || 0);
    }

    // Create adjustment record
    const adjustmentId = await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO inventory_adjustments (
          product_id, warehouse_id, adjustment_type, quantity_change,
          reason, notes, adjusted_by, tenant_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [productId, warehouseId, adjustmentType, quantityChange, reason, notes, req.user.userId, tenantId],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });

    // Update inventory
    await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO inventory_locations (
          product_id, warehouse_id, quantity, available_quantity, tenant_id
        ) VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(product_id, warehouse_id, tenant_id) DO UPDATE SET
          quantity = quantity + ?,
          available_quantity = available_quantity + ?,
          updated_at = CURRENT_TIMESTAMP`,
        [
          productId, warehouseId, quantityChange, quantityChange, tenantId,
          quantityChange, quantityChange
        ],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    // Log transaction
    await logInventoryTransaction(productId, warehouseId, quantityChange, 'adjustment',
      reason, adjustmentId, tenantId, db);

    res.json({
      success: true,
      adjustmentId,
      quantityChange,
      message: 'Inventory adjusted successfully'
    });
  } catch (error) {
    console.error('Inventory adjustment error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// PRODUCT VARIANTS
// ============================================================================

/**
 * @route   POST /api/inventory/products/:id/variants
 * @desc    Create product variant
 * @access  Private
 */
router.post('/products/:id/variants', async (req, res) => {
  try {
    const { id: parentId } = req.params;
    const { name, sku, attributes, price, cost } = req.body;
    const tenantId = req.user.tenantId;

    const variantId = await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO product_variants (
          parent_product_id, name, sku, attributes, price, cost, tenant_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [parentId, name, sku, JSON.stringify(attributes), price, cost, tenantId],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });

    res.json({
      success: true,
      variantId,
      message: 'Product variant created'
    });
  } catch (error) {
    console.error('Create variant error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/inventory/products/:id/variants
 * @desc    Get product variants
 * @access  Private
 */
router.get('/products/:id/variants', async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;

    const variants = await new Promise((resolve, reject) => {
      db.all(
        `SELECT * FROM product_variants 
         WHERE parent_product_id = ? AND tenant_id = ? AND is_active = 1`,
        [id, tenantId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });

    res.json(variants.map(v => ({
      ...v,
      attributes: JSON.parse(v.attributes || '{}')
    })));
  } catch (error) {
    console.error('Get variants error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// LOT & SERIAL NUMBER TRACKING
// ============================================================================

/**
 * @route   POST /api/inventory/lots
 * @desc    Create lot/batch for product
 * @access  Private
 */
router.post('/lots', async (req, res) => {
  try {
    const { productId, lotNumber, quantity, manufactureDate, expiryDate, warehouseId } = req.body;
    const tenantId = req.user.tenantId;

    const lotId = await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO inventory_lots (
          product_id, lot_number, quantity, available_quantity,
          manufacture_date, expiry_date, warehouse_id, tenant_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [productId, lotNumber, quantity, quantity, manufactureDate, expiryDate, warehouseId, tenantId],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });

    res.json({
      success: true,
      lotId,
      message: 'Lot created successfully'
    });
  } catch (error) {
    console.error('Create lot error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/inventory/lots
 * @desc    Get lots for product
 * @access  Private
 */
router.get('/lots', async (req, res) => {
  try {
    const { productId, warehouseId, expiringWithinDays } = req.query;
    const tenantId = req.user.tenantId;

    let sql = `
      SELECT 
        l.*,
        p.name as product_name,
        p.sku,
        w.name as warehouse_name,
        JULIANDAY(l.expiry_date) - JULIANDAY('now') as days_to_expiry
      FROM inventory_lots l
      JOIN products p ON l.product_id = p.id
      LEFT JOIN warehouses w ON l.warehouse_id = w.id
      WHERE l.tenant_id = ? AND l.available_quantity > 0
    `;
    const params = [tenantId];

    if (productId) {
      sql += ' AND l.product_id = ?';
      params.push(productId);
    }

    if (warehouseId) {
      sql += ' AND l.warehouse_id = ?';
      params.push(warehouseId);
    }

    if (expiringWithinDays) {
      sql += ' AND JULIANDAY(l.expiry_date) - JULIANDAY("now") <= ?';
      params.push(parseInt(expiringWithinDays));
    }

    sql += ' ORDER BY l.expiry_date ASC';

    const lots = await new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });

    res.json(lots);
  } catch (error) {
    console.error('Get lots error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// REORDER & REPLENISHMENT
// ============================================================================

/**
 * @route   GET /api/inventory/reorder-suggestions
 * @desc    Get products that need reordering
 * @access  Private
 */
router.get('/reorder-suggestions', async (req, res) => {
  try {
    const { warehouseId } = req.query;
    const tenantId = req.user.tenantId;

    let sql = `
      SELECT 
        il.*,
        p.name as product_name,
        p.sku,
        p.cost,
        w.name as warehouse_name,
        (il.reorder_quantity * p.cost) as estimated_cost,
        il.reorder_point - il.available_quantity as shortage
      FROM inventory_locations il
      JOIN products p ON il.product_id = p.id
      JOIN warehouses w ON il.warehouse_id = w.id
      WHERE il.tenant_id = ?
        AND il.available_quantity <= il.reorder_point
        AND il.reorder_point > 0
    `;
    const params = [tenantId];

    if (warehouseId) {
      sql += ' AND il.warehouse_id = ?';
      params.push(warehouseId);
    }

    sql += ' ORDER BY shortage DESC';

    const suggestions = await new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });

    const summary = {
      totalItems: suggestions.length,
      totalEstimatedCost: suggestions.reduce((sum, s) => sum + (s.estimated_cost || 0), 0),
      criticalItems: suggestions.filter(s => s.available_quantity <= s.min_stock_level).length
    };

    res.json({ suggestions, summary });
  } catch (error) {
    console.error('Reorder suggestions error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   POST /api/inventory/auto-reorder
 * @desc    Create purchase orders for products below reorder point
 * @access  Private
 */
router.post('/auto-reorder', async (req, res) => {
  try {
    const { warehouseId, items } = req.body;
    const tenantId = req.user.tenantId;

    const results = [];

    for (const item of items) {
      // Get product and supplier info
      const product = await new Promise((resolve, reject) => {
        db.get(
          'SELECT * FROM products WHERE id = ? AND tenant_id = ?',
          [item.productId, tenantId],
          (err, row) => {
            if (err) reject(err);
            else resolve(row);
          }
        );
      });

      if (!product || !product.supplier_id) {
        results.push({
          productId: item.productId,
          success: false,
          error: 'No supplier configured'
        });
        continue;
      }

      // Create purchase order (simplified - in reality would check for existing POs)
      const poId = await new Promise((resolve, reject) => {
        db.run(
          `INSERT INTO purchase_orders (
            supplier_id, status, notes, created_by, tenant_id
          ) VALUES (?, 'draft', 'Auto-generated reorder', ?, ?)`,
          [product.supplier_id, req.user.userId, tenantId],
          function(err) {
            if (err) reject(err);
            else resolve(this.lastID);
          }
        );
      });

      // Add PO item
      await new Promise((resolve, reject) => {
        db.run(
          `INSERT INTO purchase_order_items (
            po_id, product_id, quantity, unit_price, tenant_id
          ) VALUES (?, ?, ?, ?, ?)`,
          [poId, item.productId, item.quantity, product.cost, tenantId],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });

      results.push({
        productId: item.productId,
        success: true,
        poId,
        quantity: item.quantity
      });
    }

    res.json({
      success: true,
      results,
      message: `Created ${results.filter(r => r.success).length} purchase orders`
    });
  } catch (error) {
    console.error('Auto-reorder error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// INVENTORY ANALYTICS
// ============================================================================

/**
 * @route   GET /api/inventory/analytics
 * @desc    Get inventory analytics and insights
 * @access  Private
 */
router.get('/analytics', async (req, res) => {
  try {
    const { startDate, endDate, warehouseId } = req.query;
    const tenantId = req.user.tenantId;

    // Current stock levels
    let stockSql = `
      SELECT 
        COUNT(DISTINCT il.product_id) as total_products,
        COUNT(DISTINCT il.warehouse_id) as total_warehouses,
        SUM(il.quantity) as total_quantity,
        SUM(il.available_quantity) as available_quantity,
        SUM(il.reserved_quantity) as reserved_quantity,
        SUM(il.quantity * p.cost) as inventory_value
      FROM inventory_locations il
      JOIN products p ON il.product_id = p.id
      WHERE il.tenant_id = ?
    `;
    const stockParams = [tenantId];

    if (warehouseId) {
      stockSql += ' AND il.warehouse_id = ?';
      stockParams.push(warehouseId);
    }

    const stockMetrics = await new Promise((resolve, reject) => {
      db.get(stockSql, stockParams, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    // Stock movement velocity
    let velocitySql = `
      SELECT 
        product_id,
        p.name as product_name,
        SUM(CASE WHEN quantity_change > 0 THEN quantity_change ELSE 0 END) as total_in,
        SUM(CASE WHEN quantity_change < 0 THEN ABS(quantity_change) ELSE 0 END) as total_out,
        COUNT(*) as transaction_count
      FROM inventory_transactions it
      JOIN products p ON it.product_id = p.id
      WHERE it.tenant_id = ?
    `;
    const velocityParams = [tenantId];

    if (startDate) {
      velocitySql += ' AND it.created_at::date >= ?';
      velocityParams.push(startDate);
    }

    if (endDate) {
      velocitySql += ' AND it.created_at::date <= ?';
      velocityParams.push(endDate);
    }

    velocitySql += ' GROUP BY product_id ORDER BY total_out DESC LIMIT 10';

    const topMovers = await new Promise((resolve, reject) => {
      db.all(velocitySql, velocityParams, (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });

    // Stock status breakdown
    const statusSql = `
      SELECT 
        CASE 
          WHEN available_quantity <= min_stock_level THEN 'low'
          WHEN available_quantity >= max_stock_level THEN 'overstock'
          ELSE 'normal'
        END as status,
        COUNT(*) as count
      FROM inventory_locations
      WHERE tenant_id = ?
      ${warehouseId ? 'AND warehouse_id = ?' : ''}
      GROUP BY status
    `;
    const statusParams = warehouseId ? [tenantId, warehouseId] : [tenantId];

    const stockStatus = await new Promise((resolve, reject) => {
      db.all(statusSql, statusParams, (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });

    res.json({
      currentStock: stockMetrics,
      topMovingProducts: topMovers,
      stockStatusBreakdown: stockStatus,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Inventory analytics error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function logInventoryTransaction(productId, warehouseId, quantityChange, type, description, referenceId, tenantId, db) {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO inventory_transactions (
        product_id, warehouse_id, quantity_change, transaction_type,
        description, reference_id, tenant_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [productId, warehouseId, quantityChange, type, description, referenceId, tenantId],
      function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      }
    );
  });
}

module.exports = router;
