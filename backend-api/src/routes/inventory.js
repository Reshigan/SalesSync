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

module.exports = router;
