const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { getQuery, getOneQuery, runQuery } = require('../utils/database');

// Get all inventory items
router.get('/', asyncHandler(async (req, res) => {
  const tenantId = req.user.tenantId;
  
  const inventory = await getQuery(`
    SELECT 
      i.id,
      i.product_id,
      p.name as product_name,
      p.code as product_code,
      i.warehouse_id,
      w.name as warehouse_name,
      i.quantity_on_hand,
      i.quantity_reserved,
      i.cost_price,
      i.updated_at as last_updated
    FROM inventory_stock i
    JOIN products p ON i.product_id = p.id
    LEFT JOIN warehouses w ON i.warehouse_id = w.id
    WHERE i.tenant_id = $1
    ORDER BY p.name
  `, [tenantId]);

  res.json({
    success: true,
    data: inventory || []
  });
}));

// Get inventory by product ID
router.get('/product/:productId', asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const tenantId = req.user.tenantId;
  
  const inventory = await getQuery(`
    SELECT 
      i.id,
      i.product_id,
      p.name as product_name,
      i.warehouse_id,
      w.name as warehouse_name,
      i.quantity_on_hand,
      i.quantity_reserved,
      i.cost_price,
      i.last_updated
    FROM inventory_stock i
    JOIN products p ON i.product_id = p.id
    LEFT JOIN warehouses w ON i.warehouse_id = w.id
    WHERE i.product_id = $1 AND i.tenant_id = $2
  `, [productId, tenantId]);

  res.json({
    success: true,
    data: inventory || []
  });
}));

// Update inventory quantity
router.put('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const tenantId = req.user.tenantId;
  const { quantity_on_hand, quantity_reserved, cost_price } = req.body;
  
  const result = await runQuery(`
    UPDATE inventory_stock 
    SET quantity_on_hand = $1, quantity_reserved = $2, cost_price = $3, updated_at = $4
    WHERE id = $5 AND tenant_id = $6
  `, [quantity_on_hand, quantity_reserved || 0, cost_price, new Date().toISOString(), id, tenantId]);

  if (result.changes === 0) {
    return res.status(404).json({
      success: false,
      message: 'Inventory item not found'
    });
  }

  res.json({
    success: true,
    message: 'Inventory updated successfully'
  });
}));

// Create new inventory item
router.post('/', asyncHandler(async (req, res) => {
  const {
    product_id,
    warehouse_id,
    quantity_on_hand,
    quantity_reserved,
    cost_price
  } = req.body;

  const inventoryId = require('crypto').randomUUID();
  
  const result = await runQuery(
    `INSERT INTO inventory_stock (
      id, tenant_id, product_id, warehouse_id, quantity_on_hand,
      quantity_reserved, cost_price, updated_at, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      inventoryId,
      req.user.tenantId,
      product_id,
      warehouse_id,
      quantity_on_hand || 0,
      quantity_reserved || 0,
      cost_price || 0,
      new Date().toISOString(),
      new Date().toISOString()
    ]
  );

  res.status(201).json({
    success: true,
    data: {
      id: inventoryId,
      product_id,
      warehouse_id,
      quantity_on_hand: quantity_on_hand || 0
    }
  });
}));

// Get low stock items
router.get('/low-stock', asyncHandler(async (req, res) => {
  const tenantId = req.user.tenantId;
  const { threshold = 10 } = req.query;
  
  const lowStock = await getQuery(`
    SELECT 
      i.id,
      i.product_id,
      p.name as product_name,
      p.code as product_code,
      i.warehouse_id,
      w.name as warehouse_name,
      i.quantity_on_hand,
      i.quantity_reserved
    FROM inventory_stock i
    JOIN products p ON i.product_id = p.id
    LEFT JOIN warehouses w ON i.warehouse_id = w.id
    WHERE i.tenant_id = $1 AND i.quantity_on_hand <= $2
    ORDER BY i.quantity_on_hand ASC
  `, [tenantId, parseInt(threshold)]);

  res.json({
    success: true,
    data: lowStock || []
  });
}));

// Test endpoint
router.get('/test/health', asyncHandler(async (req, res) => {
  res.json({
    success: true,
    message: 'Inventory API is working',
    timestamp: new Date().toISOString()
  });
}));

// GET /api/inventory/stats - Inventory statistics
router.get('/stats', asyncHandler(async (req, res) => {
  const tenantId = req.user.tenantId;
  
  const [overall, stockLevels, topProducts, warehouseDistribution] = await Promise.all([
    getOneQuery(`
      SELECT 
        COUNT(DISTINCT i.product_id) as total_products,
        SUM(i.quantity_on_hand) as total_quantity,
        SUM(i.quantity_reserved) as total_reserved,
        SUM(i.quantity_on_hand * i.cost_price) as total_inventory_value,
        COUNT(DISTINCT i.warehouse_id) as warehouse_count
      FROM inventory_stock i
      WHERE i.tenant_id = $1
    `, [tenantId]),
    
    getQuery(`
      SELECT 
        COUNT(CASE WHEN i.quantity_on_hand = 0 THEN 1 END) as out_of_stock,
        COUNT(CASE WHEN i.quantity_on_hand > 0 AND i.quantity_on_hand <= 10 THEN 1 END) as low_stock,
        COUNT(CASE WHEN i.quantity_on_hand > 10 THEN 1 END) as in_stock
      FROM inventory_stock i
      JOIN products p ON i.product_id = p.id
      WHERE i.tenant_id = $1
    `, [tenantId]),
    
    getQuery(`
      SELECT 
        p.id, p.name, p.code,
        SUM(i.quantity_on_hand) as total_quantity,
        SUM(i.quantity_on_hand * i.cost_price) as inventory_value
      FROM inventory_stock i
      JOIN products p ON i.product_id = p.id
      WHERE i.tenant_id = $1
      GROUP BY p.id, p.name, p.code
      ORDER BY inventory_value DESC
      LIMIT 10
    `, [tenantId]),
    
    getQuery(`
      SELECT 
        w.id, w.name, w.address as location,
        COUNT(DISTINCT i.product_id) as product_count,
        SUM(i.quantity_on_hand) as total_quantity,
        SUM(i.quantity_on_hand * i.cost_price) as inventory_value
      FROM inventory_stock i
      JOIN warehouses w ON i.warehouse_id = w.id
      WHERE i.tenant_id = $1
      GROUP BY w.id, w.name, w.address
      ORDER BY inventory_value DESC
    `, [tenantId])
  ]);

  res.json({
    success: true,
    data: {
      overall: {
        ...overall,
        total_inventory_value: parseFloat((overall.total_inventory_value || 0).toFixed(2)),
        available_quantity: overall.total_quantity - overall.total_reserved
      },
      stockLevels: stockLevels[0] || {},
      topProducts,
      warehouseDistribution
    }
  });
}));

// GET /api/inventory/stock-counts/:countId/lines - Get stock count lines
router.get('/stock-counts/:countId/lines', asyncHandler(async (req, res) => {
  const { countId } = req.params;
  const tenantId = req.user.tenantId;
  
  const lines = await getQuery(`
    SELECT 
      scl.*,
      p.name as product_name,
      p.code as product_code,
      scl.system_quantity,
      scl.counted_quantity,
      (scl.counted_quantity - scl.system_quantity) as variance_quantity,
      (scl.counted_quantity - scl.system_quantity) * scl.unit_cost as variance_value
    FROM stock_count_lines scl
    LEFT JOIN products p ON scl.product_id = p.id
    JOIN stock_counts sc ON scl.stock_count_id = sc.id
    WHERE scl.stock_count_id = $1 AND sc.tenant_id = $2
    ORDER BY p.name
  `, [countId, tenantId]);
  
  res.json({
    success: true,
    data: { lines: lines || [] }
  });
}));

// GET /api/inventory/adjustments/:adjustmentId/items - Get adjustment items
router.get('/adjustments/:adjustmentId/items', asyncHandler(async (req, res) => {
  const { adjustmentId } = req.params;
  const tenantId = req.user.tenantId;
  
  const items = await getQuery(`
    SELECT 
      ai.*,
      p.name as product_name,
      p.code as product_code,
      w.name as warehouse_name
    FROM adjustment_items ai
    LEFT JOIN products p ON ai.product_id = p.id
    LEFT JOIN warehouses w ON ai.warehouse_id = w.id
    JOIN adjustments a ON ai.adjustment_id = a.id
    WHERE ai.adjustment_id = $1 AND a.tenant_id = $2
    ORDER BY p.name
  `, [adjustmentId, tenantId]);
  
  res.json({
    success: true,
    data: { items: items || [] }
  });
}));

// GET /api/inventory/transfers/:transferId/items - Get transfer items
router.get('/transfers/:transferId/items', asyncHandler(async (req, res) => {
  const { transferId } = req.params;
  const tenantId = req.user.tenantId;
  
  const items = await getQuery(`
    SELECT 
      ti.*,
      p.name as product_name,
      p.code as product_code,
      ti.quantity_requested,
      ti.quantity_shipped,
      ti.quantity_received
    FROM transfer_items ti
    LEFT JOIN products p ON ti.product_id = p.id
    JOIN transfers t ON ti.transfer_id = t.id
    WHERE ti.transfer_id = $1 AND t.tenant_id = $2
    ORDER BY p.name
  `, [transferId, tenantId]);
  
  res.json({
    success: true,
    data: { items: items || [] }
  });
}));

// GET /api/inventory/batches/:batchId/tracking - Get batch tracking details
router.get('/batches/:batchId/tracking', asyncHandler(async (req, res) => {
  const { batchId } = req.params;
  const tenantId = req.user.tenantId;
  
  const tracking = await getQuery(`
    SELECT 
      bt.*,
      p.name as product_name,
      p.code as product_code,
      w.name as warehouse_name,
      bt.batch_number,
      bt.lot_number,
      bt.expiry_date,
      bt.quantity_on_hand,
      bt.quantity_reserved
    FROM batch_tracking bt
    LEFT JOIN products p ON bt.product_id = p.id
    LEFT JOIN warehouses w ON bt.warehouse_id = w.id
    WHERE bt.id = $1 AND bt.tenant_id = $2
  `, [batchId, tenantId]);
  
  res.json({
    success: true,
    data: { tracking: tracking[0] || null }
  });
}));

// GET /api/inventory/lots/:lotId/tracking - Get lot tracking details
router.get('/lots/:lotId/tracking', asyncHandler(async (req, res) => {
  const { lotId } = req.params;
  const tenantId = req.user.tenantId;
  
  const lot = await getQuery(`
    SELECT 
      bt.*,
      p.name as product_name,
      p.code as product_code,
      w.name as warehouse_name
    FROM batch_tracking bt
    LEFT JOIN products p ON bt.product_id = p.id
    LEFT JOIN warehouses w ON bt.warehouse_id = w.id
    WHERE bt.lot_number = $1 AND bt.tenant_id = $2
    ORDER BY bt.created_at DESC
  `, [lotId, tenantId]);
  
  res.json({
    success: true,
    data: { lot: lot || [] }
  });
}));

// GET /api/inventory/batches/:batchId/movements - Get batch movement history
router.get('/batches/:batchId/movements', asyncHandler(async (req, res) => {
  const { batchId } = req.params;
  const tenantId = req.user.tenantId;
  
  const movements = await getQuery(`
    SELECT 
      sm.*,
      p.name as product_name,
      p.code as product_code,
      wf.name as from_warehouse_name,
      wt.name as to_warehouse_name,
      u.first_name || ' ' || u.last_name as created_by_name
    FROM stock_movements sm
    LEFT JOIN products p ON sm.product_id = p.id
    LEFT JOIN warehouses wf ON sm.from_warehouse_id = wf.id
    LEFT JOIN warehouses wt ON sm.to_warehouse_id = wt.id
    LEFT JOIN users u ON sm.created_by = u.id
    WHERE sm.batch_id = $1 AND sm.tenant_id = $2
    ORDER BY sm.created_at DESC
  `, [batchId, tenantId]);
  
  res.json({
    success: true,
    data: { movements: movements || [] }
  });
}));

// GET /api/inventory/batches/:batchId/allocations - Get batch allocations
router.get('/batches/:batchId/allocations', asyncHandler(async (req, res) => {
  const { batchId } = req.params;
  const tenantId = req.user.tenantId;
  
  const allocations = await getQuery(`
    SELECT 
      ba.*,
      o.order_number,
      c.name as customer_name,
      ba.quantity_allocated,
      ba.quantity_fulfilled
    FROM batch_allocations ba
    LEFT JOIN orders o ON ba.order_id = o.id
    LEFT JOIN customers c ON o.customer_id = c.id
    WHERE ba.batch_id = $1 AND ba.tenant_id = $2
    ORDER BY ba.created_at DESC
  `, [batchId, tenantId]);
  
  res.json({
    success: true,
    data: { allocations: allocations || [] }
  });
}));

// GET /api/inventory/stock-ledger/product/:productId - Get stock ledger by product
router.get('/stock-ledger/product/:productId', asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const tenantId = req.user.tenantId;
  
  const ledger = await getQuery(`
    SELECT 
      sl.*,
      p.name as product_name,
      p.code as product_code,
      w.name as warehouse_name,
      u.first_name || ' ' || u.last_name as created_by_name
    FROM stock_ledger sl
    LEFT JOIN products p ON sl.product_id = p.id
    LEFT JOIN warehouses w ON sl.warehouse_id = w.id
    LEFT JOIN users u ON sl.created_by = u.id
    WHERE sl.product_id = $1 AND sl.tenant_id = $2
    ORDER BY sl.created_at DESC
    LIMIT 100
  `, [productId, tenantId]);
  
  res.json({
    success: true,
    data: { ledger: ledger || [] }
  });
}));

// GET /api/inventory/stock-ledger/warehouse/:warehouseId - Get stock ledger by warehouse
router.get('/stock-ledger/warehouse/:warehouseId', asyncHandler(async (req, res) => {
  const { warehouseId } = req.params;
  const tenantId = req.user.tenantId;
  
  const ledger = await getQuery(`
    SELECT 
      sl.*,
      p.name as product_name,
      p.code as product_code,
      w.name as warehouse_name,
      u.first_name || ' ' || u.last_name as created_by_name
    FROM stock_ledger sl
    LEFT JOIN products p ON sl.product_id = p.id
    LEFT JOIN warehouses w ON sl.warehouse_id = w.id
    LEFT JOIN users u ON sl.created_by = u.id
    WHERE sl.warehouse_id = $1 AND sl.tenant_id = $2
    ORDER BY sl.created_at DESC
    LIMIT 100
  `, [warehouseId, tenantId]);
  
  res.json({
    success: true,
    data: { ledger: ledger || [] }
  });
}));

// GET /api/inventory/serials/:serialNumber/tracking - Get serial number tracking
router.get('/serials/:serialNumber/tracking', asyncHandler(async (req, res) => {
  const { serialNumber } = req.params;
  const tenantId = req.user.tenantId;
  
  const serial = await getQuery(`
    SELECT 
      st.*,
      p.name as product_name,
      p.code as product_code,
      w.name as warehouse_name,
      c.name as customer_name
    FROM serial_tracking st
    LEFT JOIN products p ON st.product_id = p.id
    LEFT JOIN warehouses w ON st.warehouse_id = w.id
    LEFT JOIN customers c ON st.customer_id = c.id
    WHERE st.serial_number = $1 AND st.tenant_id = $2
  `, [serialNumber, tenantId]);
  
  res.json({
    success: true,
    data: { serial: serial[0] || null }
  });
}));

// GET /api/inventory/adjustments/:adjustmentId/items - Get adjustment items
router.get('/adjustments/:adjustmentId/items', asyncHandler(async (req, res) => {
  const { adjustmentId } = req.params;
  const tenantId = req.user.tenantId;
  
  const items = await getQuery(`
    SELECT ai.*, p.name as product_name, p.code as product_code
    FROM adjustment_items ai
    LEFT JOIN products p ON ai.product_id = p.id
    WHERE ai.adjustment_id = $1 AND ai.tenant_id = $2
    ORDER BY p.name
  `, [adjustmentId, tenantId]);
  
  res.json({ success: true, data: { items: items || [] } });
}));

// GET /api/inventory/adjustments/:adjustmentId/items/:itemId - Get adjustment item detail
router.get('/adjustments/:adjustmentId/items/:itemId', asyncHandler(async (req, res) => {
  const { adjustmentId, itemId } = req.params;
  const tenantId = req.user.tenantId;
  
  const item = await getOneQuery(`
    SELECT ai.*, p.name as product_name, p.code as product_code, w.name as warehouse_name
    FROM adjustment_items ai
    LEFT JOIN products p ON ai.product_id = p.id
    LEFT JOIN warehouses w ON ai.warehouse_id = w.id
    WHERE ai.id = $1 AND ai.adjustment_id = $2 AND ai.tenant_id = $3
  `, [itemId, adjustmentId, tenantId]);
  
  res.json({ success: true, data: item || null });
}));

// GET /api/inventory/adjustments/:adjustmentId/justification - Get adjustment justification
router.get('/adjustments/:adjustmentId/justification', asyncHandler(async (req, res) => {
  const { adjustmentId } = req.params;
  const tenantId = req.user.tenantId;
  
  const justification = await getOneQuery(`
    SELECT aj.*, u.first_name || ' ' || u.last_name as created_by_name
    FROM adjustment_justifications aj
    LEFT JOIN users u ON aj.created_by = u.id
    WHERE aj.adjustment_id = $1 AND aj.tenant_id = $2
  `, [adjustmentId, tenantId]);
  
  res.json({ success: true, data: justification || null });
}));

// GET /api/inventory/batches/:batchId/allocations - Get batch allocations
router.get('/batches/:batchId/allocations', asyncHandler(async (req, res) => {
  const { batchId } = req.params;
  const tenantId = req.user.tenantId;
  
  const allocations = await getQuery(`
    SELECT ba.*, o.order_number, c.name as customer_name
    FROM batch_allocations ba
    LEFT JOIN orders o ON ba.order_id = o.id
    LEFT JOIN customers c ON o.customer_id = c.id
    WHERE ba.batch_id = $1 AND ba.tenant_id = $2
    ORDER BY ba.allocated_at DESC
  `, [batchId, tenantId]);
  
  res.json({ success: true, data: { allocations: allocations || [] } });
}));

// GET /api/inventory/batches/:id - Get batch detail
router.get('/batches/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const tenantId = req.user.tenantId;
  
  const batch = await getOneQuery(`
    SELECT b.*, p.name as product_name, p.code as product_code, w.name as warehouse_name
    FROM batches b
    LEFT JOIN products p ON b.product_id = p.id
    LEFT JOIN warehouses w ON b.warehouse_id = w.id
    WHERE b.id = $1 AND b.tenant_id = $2
  `, [id, tenantId]);
  
  res.json({ success: true, data: batch || null });
}));

// GET /api/inventory/batches/expiring - Get expiring batches
router.get('/batches/expiring', asyncHandler(async (req, res) => {
  const tenantId = req.user.tenantId;
  const { days = 30 } = req.query;
  
  const batches = await getQuery(`
    SELECT b.*, p.name as product_name, p.code as product_code, w.name as warehouse_name
    FROM batches b
    LEFT JOIN products p ON b.product_id = p.id
    LEFT JOIN warehouses w ON b.warehouse_id = w.id
    WHERE b.expiry_date <= CURRENT_DATE + INTERVAL '${parseInt(days)} days'
      AND b.expiry_date >= CURRENT_DATE
      AND b.tenant_id = $1
    ORDER BY b.expiry_date ASC
  `, [tenantId]);
  
  res.json({ success: true, data: { batches: batches || [] } });
}));

// GET /api/inventory/batches/:batchId/movements - Get batch movement history
router.get('/batches/:batchId/movements', asyncHandler(async (req, res) => {
  const { batchId } = req.params;
  const tenantId = req.user.tenantId;
  
  const movements = await getQuery(`
    SELECT bm.*, u.first_name || ' ' || u.last_name as performed_by_name
    FROM batch_movements bm
    LEFT JOIN users u ON bm.performed_by = u.id
    WHERE bm.batch_id = $1 AND bm.tenant_id = $2
    ORDER BY bm.movement_date DESC
  `, [batchId, tenantId]);
  
  res.json({ success: true, data: { movements: movements || [] } });
}));

// GET /api/inventory/stock-counts/:countId/lines - Get stock count lines
router.get('/stock-counts/:countId/lines', asyncHandler(async (req, res) => {
  const { countId } = req.params;
  const tenantId = req.user.tenantId;
  
  const lines = await getQuery(`
    SELECT scl.*, p.name as product_name, p.code as product_code
    FROM stock_count_lines scl
    LEFT JOIN products p ON scl.product_id = p.id
    WHERE scl.count_id = $1 AND scl.tenant_id = $2
    ORDER BY p.name
  `, [countId, tenantId]);
  
  res.json({ success: true, data: { lines: lines || [] } });
}));

// GET /api/inventory/stock-counts/:countId/lines/:lineId - Get stock count line detail
router.get('/stock-counts/:countId/lines/:lineId', asyncHandler(async (req, res) => {
  const { countId, lineId } = req.params;
  const tenantId = req.user.tenantId;
  
  const line = await getOneQuery(`
    SELECT scl.*, p.name as product_name, p.code as product_code, w.name as warehouse_name
    FROM stock_count_lines scl
    LEFT JOIN products p ON scl.product_id = p.id
    LEFT JOIN warehouses w ON scl.warehouse_id = w.id
    WHERE scl.id = $1 AND scl.count_id = $2 AND scl.tenant_id = $3
  `, [lineId, countId, tenantId]);
  
  res.json({ success: true, data: line || null });
}));

// GET /api/inventory/stock-counts/:countId/lines/:lineId/approval - Get count line approval
router.get('/stock-counts/:countId/lines/:lineId/approval', asyncHandler(async (req, res) => {
  const { countId, lineId } = req.params;
  const tenantId = req.user.tenantId;
  
  const approval = await getOneQuery(`
    SELECT scla.*, u.first_name || ' ' || u.last_name as approved_by_name
    FROM stock_count_line_approvals scla
    LEFT JOIN users u ON scla.approved_by = u.id
    WHERE scla.line_id = $1 AND scla.tenant_id = $2
  `, [lineId, tenantId]);
  
  res.json({ success: true, data: approval || null });
}));

// GET /api/inventory/stock-counts/:countId/lines/:lineId/variance - Get variance resolution
router.get('/stock-counts/:countId/lines/:lineId/variance', asyncHandler(async (req, res) => {
  const { countId, lineId } = req.params;
  const tenantId = req.user.tenantId;
  
  const variance = await getOneQuery(`
    SELECT sclv.*, u.first_name || ' ' || u.last_name as resolved_by_name
    FROM stock_count_line_variances sclv
    LEFT JOIN users u ON sclv.resolved_by = u.id
    WHERE sclv.line_id = $1 AND sclv.tenant_id = $2
  `, [lineId, tenantId]);
  
  res.json({ success: true, data: variance || null });
}));

// GET /api/inventory/lots/:id - Get lot detail
router.get('/lots/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const tenantId = req.user.tenantId;
  
  const lot = await getOneQuery(`
    SELECT l.*, p.name as product_name, p.code as product_code
    FROM lots l
    LEFT JOIN products p ON l.product_id = p.id
    WHERE l.id = $1 AND l.tenant_id = $2
  `, [id, tenantId]);
  
  res.json({ success: true, data: lot || null });
}));

// GET /api/inventory/lots/:lotId/tracking - Get lot tracking
router.get('/lots/:lotId/tracking', asyncHandler(async (req, res) => {
  const { lotId } = req.params;
  const tenantId = req.user.tenantId;
  
  const tracking = await getQuery(`
    SELECT lt.*, u.first_name || ' ' || u.last_name as tracked_by_name
    FROM lot_tracking lt
    LEFT JOIN users u ON lt.tracked_by = u.id
    WHERE lt.lot_id = $1 AND lt.tenant_id = $2
    ORDER BY lt.tracked_at DESC
  `, [lotId, tenantId]);
  
  res.json({ success: true, data: { tracking: tracking || [] } });
}));

// GET /api/inventory/movements/:id - Get movement detail
router.get('/movements/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const tenantId = req.user.tenantId;
  
  const movement = await getOneQuery(`
    SELECT im.*, p.name as product_name, p.code as product_code, w.name as warehouse_name
    FROM inventory_movements im
    LEFT JOIN products p ON im.product_id = p.id
    LEFT JOIN warehouses w ON im.warehouse_id = w.id
    WHERE im.id = $1 AND im.tenant_id = $2
  `, [id, tenantId]);
  
  res.json({ success: true, data: movement || null });
}));

// GET /api/inventory/serials/:id - Get serial detail
router.get('/serials/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const tenantId = req.user.tenantId;
  
  const serial = await getOneQuery(`
    SELECT s.*, p.name as product_name, p.code as product_code
    FROM serials s
    LEFT JOIN products p ON s.product_id = p.id
    WHERE s.id = $1 AND s.tenant_id = $2
  `, [id, tenantId]);
  
  res.json({ success: true, data: serial || null });
}));

// GET /api/inventory/serials/:serialId/tracking - Get serial tracking
router.get('/serials/:serialId/tracking', asyncHandler(async (req, res) => {
  const { serialId } = req.params;
  const tenantId = req.user.tenantId;
  
  const tracking = await getQuery(`
    SELECT st.*, u.first_name || ' ' || u.last_name as tracked_by_name
    FROM serial_tracking st
    LEFT JOIN users u ON st.tracked_by = u.id
    WHERE st.serial_id = $1 AND st.tenant_id = $2
    ORDER BY st.tracked_at DESC
  `, [serialId, tenantId]);
  
  res.json({ success: true, data: { tracking: tracking || [] } });
}));

// GET /api/inventory/ledger/product/:productId - Get stock ledger by product
router.get('/ledger/product/:productId', asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const tenantId = req.user.tenantId;
  
  const ledger = await getQuery(`
    SELECT sl.*, w.name as warehouse_name
    FROM stock_ledger sl
    LEFT JOIN warehouses w ON sl.warehouse_id = w.id
    WHERE sl.product_id = $1 AND sl.tenant_id = $2
    ORDER BY sl.transaction_date DESC
    LIMIT 100
  `, [productId, tenantId]);
  
  res.json({ success: true, data: { ledger: ledger || [] } });
}));

// GET /api/inventory/ledger/warehouse/:warehouseId - Get stock ledger by warehouse
router.get('/ledger/warehouse/:warehouseId', asyncHandler(async (req, res) => {
  const { warehouseId } = req.params;
  const tenantId = req.user.tenantId;
  
  const ledger = await getQuery(`
    SELECT sl.*, p.name as product_name, p.code as product_code
    FROM stock_ledger sl
    LEFT JOIN products p ON sl.product_id = p.id
    WHERE sl.warehouse_id = $1 AND sl.tenant_id = $2
    ORDER BY sl.transaction_date DESC
    LIMIT 100
  `, [warehouseId, tenantId]);
  
  res.json({ success: true, data: { ledger: ledger || [] } });
}));

// GET /api/inventory/ledger/:id - Get stock ledger detail
router.get('/ledger/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const tenantId = req.user.tenantId;
  
  const entry = await getOneQuery(`
    SELECT sl.*, p.name as product_name, p.code as product_code, w.name as warehouse_name
    FROM stock_ledger sl
    LEFT JOIN products p ON sl.product_id = p.id
    LEFT JOIN warehouses w ON sl.warehouse_id = w.id
    WHERE sl.id = $1 AND sl.tenant_id = $2
  `, [id, tenantId]);
  
  res.json({ success: true, data: entry || null });
}));

// GET /api/inventory/transfers/:transferId/items - Get transfer items
router.get('/transfers/:transferId/items', asyncHandler(async (req, res) => {
  const { transferId } = req.params;
  const tenantId = req.user.tenantId;
  
  const items = await getQuery(`
    SELECT ti.*, p.name as product_name, p.code as product_code
    FROM transfer_items ti
    LEFT JOIN products p ON ti.product_id = p.id
    WHERE ti.transfer_id = $1 AND ti.tenant_id = $2
    ORDER BY p.name
  `, [transferId, tenantId]);
  
  res.json({ success: true, data: { items: items || [] } });
}));

// GET /api/inventory/transfers/:transferId/items/:itemId - Get transfer item detail
router.get('/transfers/:transferId/items/:itemId', asyncHandler(async (req, res) => {
  const { transferId, itemId } = req.params;
  const tenantId = req.user.tenantId;
  
  const item = await getOneQuery(`
    SELECT ti.*, p.name as product_name, p.code as product_code
    FROM transfer_items ti
    LEFT JOIN products p ON ti.product_id = p.id
    WHERE ti.id = $1 AND ti.transfer_id = $2 AND ti.tenant_id = $3
  `, [itemId, transferId, tenantId]);
  
  res.json({ success: true, data: item || null });
}));

// GET /api/inventory/transfers/:transferId/items/:itemId/tracking - Get transfer item tracking
router.get('/transfers/:transferId/items/:itemId/tracking', asyncHandler(async (req, res) => {
  const { transferId, itemId } = req.params;
  const tenantId = req.user.tenantId;
  
  const tracking = await getQuery(`
    SELECT tit.*, u.first_name || ' ' || u.last_name as tracked_by_name
    FROM transfer_item_tracking tit
    LEFT JOIN users u ON tit.tracked_by = u.id
    WHERE tit.item_id = $1 AND tit.tenant_id = $2
    ORDER BY tit.tracked_at DESC
  `, [itemId, tenantId]);
  
  res.json({ success: true, data: { tracking: tracking || [] } });
}));

module.exports = router;
