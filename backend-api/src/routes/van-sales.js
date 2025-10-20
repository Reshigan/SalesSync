const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { getQuery, getOneQuery, runQuery } = require('../utils/database');

// Get all van sales
router.get('/', asyncHandler(async (req, res) => {
  const tenantId = req.user.tenantId;
  
  const vanSales = await getQuery(`
    SELECT 
      id,
      van_id,
      agent_id,
      route_id,
      sale_date,
      total_amount,
      status,
      created_at
    FROM van_sales 
    WHERE tenant_id = ?
    ORDER BY created_at DESC
  `, [tenantId]);

  res.json({
    success: true,
    data: vanSales || []
  });
}));

// Create new van sale
router.post('/', asyncHandler(async (req, res) => {
  const {
    van_id,
    agent_id,
    route_id,
    sale_date,
    total_amount,
    items
  } = req.body;

  const vanSaleId = require('crypto').randomUUID();
  
  const result = await runQuery(
    `INSERT INTO van_sales (
      id, tenant_id, van_id, agent_id, route_id, sale_date,
      total_amount, status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      vanSaleId,
      req.user.tenantId,
      van_id,
      agent_id,
      route_id,
      sale_date || new Date().toISOString().split('T')[0],
      total_amount || 0,
      'completed',
      new Date().toISOString()
    ]
  );

  res.status(201).json({
    success: true,
    data: {
      id: vanSaleId,
      van_id,
      agent_id,
      total_amount: total_amount || 0,
      status: 'completed'
    }
  });
}));

// Get van sale by ID
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const tenantId = req.user.tenantId;
  
  const vanSale = await getOneQuery(`
    SELECT * FROM van_sales 
    WHERE id = ? AND tenant_id = ?
  `, [id, tenantId]);

  if (!vanSale) {
    return res.status(404).json({
      success: false,
      message: 'Van sale not found'
    });
  }

  res.json({
    success: true,
    data: vanSale
  });
}));

// Update van sale
router.put('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const tenantId = req.user.tenantId;
  const { van_id, agent_id, route_id, sale_date, total_amount, status } = req.body;
  
  const result = await runQuery(`
    UPDATE van_sales 
    SET van_id = ?, agent_id = ?, route_id = ?, sale_date = ?, 
        total_amount = ?, status = ?, updated_at = ?
    WHERE id = ? AND tenant_id = ?
  `, [van_id, agent_id, route_id, sale_date, total_amount, status, new Date().toISOString(), id, tenantId]);

  if (result.changes === 0) {
    return res.status(404).json({
      success: false,
      message: 'Van sale not found'
    });
  }

  res.json({
    success: true,
    message: 'Van sale updated successfully'
  });
}));

// Delete van sale
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const tenantId = req.user.tenantId;
  
  const result = await runQuery(`
    DELETE FROM van_sales 
    WHERE id = ? AND tenant_id = ?
  `, [id, tenantId]);

  if (result.changes === 0) {
    return res.status(404).json({
      success: false,
      message: 'Van sale not found'
    });
  }

  res.json({
    success: true,
    message: 'Van sale deleted successfully'
  });
}));

// Get van sales by agent
router.get('/agent/:agentId', asyncHandler(async (req, res) => {
  const { agentId } = req.params;
  const tenantId = req.user.tenantId;
  
  const vanSales = await getQuery(`
    SELECT * FROM van_sales 
    WHERE agent_id = ? AND tenant_id = ?
    ORDER BY created_at DESC
  `, [agentId, tenantId]);

  res.json({
    success: true,
    data: vanSales || []
  });
}));

// Test endpoint
router.get('/test/health', asyncHandler(async (req, res) => {
  res.json({
    success: true,
    message: 'Van Sales API is working',
    timestamp: new Date().toISOString()
  });
}));

module.exports = router;