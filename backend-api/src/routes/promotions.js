const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { getQuery, getOneQuery, runQuery } = require('../utils/database');

// Get all promotions
router.get('/', asyncHandler(async (req, res) => {
  const tenantId = req.user.tenantId;
  
  const promotions = await getQuery(`
    SELECT 
      id,
      name,
      promotion_type,
      start_date,
      end_date,
      discount_percentage,
      discount_amount,
      status,
      created_at
    FROM promotions 
    WHERE tenant_id = ?
    ORDER BY created_at DESC
  `, [tenantId]);

  res.json({
    success: true,
    data: promotions || []
  });
}));

// Create new promotion
router.post('/', asyncHandler(async (req, res) => {
  const {
    name,
    promotion_type,
    start_date,
    end_date,
    discount_percentage,
    discount_amount
  } = req.body;

  const promotionId = require('crypto').randomUUID();
  
  const result = await runQuery(
    `INSERT INTO promotions (
      id, tenant_id, name, promotion_type, start_date, end_date,
      discount_percentage, discount_amount, status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      promotionId,
      req.user.tenantId,
      name,
      promotion_type || 'discount',
      start_date,
      end_date,
      discount_percentage || 0,
      discount_amount || 0,
      'active',
      new Date().toISOString()
    ]
  );

  res.status(201).json({
    success: true,
    data: {
      id: promotionId,
      name,
      promotion_type: promotion_type || 'discount',
      status: 'active'
    }
  });
}));

// Get promotion by ID
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const tenantId = req.user.tenantId;
  
  const promotion = await getOneQuery(`
    SELECT * FROM promotions 
    WHERE id = ? AND tenant_id = ?
  `, [id, tenantId]);

  if (!promotion) {
    return res.status(404).json({
      success: false,
      message: 'Promotion not found'
    });
  }

  res.json({
    success: true,
    data: promotion
  });
}));

// Update promotion
router.put('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const tenantId = req.user.tenantId;
  const { name, promotion_type, start_date, end_date, discount_percentage, discount_amount, status } = req.body;
  
  const result = await runQuery(`
    UPDATE promotions 
    SET name = ?, promotion_type = ?, start_date = ?, end_date = ?, 
        discount_percentage = ?, discount_amount = ?, status = ?, updated_at = ?
    WHERE id = ? AND tenant_id = ?
  `, [name, promotion_type, start_date, end_date, discount_percentage, discount_amount, status, new Date().toISOString(), id, tenantId]);

  if (result.changes === 0) {
    return res.status(404).json({
      success: false,
      message: 'Promotion not found'
    });
  }

  res.json({
    success: true,
    message: 'Promotion updated successfully'
  });
}));

// Delete promotion
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const tenantId = req.user.tenantId;
  
  const result = await runQuery(`
    DELETE FROM promotions 
    WHERE id = ? AND tenant_id = ?
  `, [id, tenantId]);

  if (result.changes === 0) {
    return res.status(404).json({
      success: false,
      message: 'Promotion not found'
    });
  }

  res.json({
    success: true,
    message: 'Promotion deleted successfully'
  });
}));

// Test endpoint
router.get('/test/health', asyncHandler(async (req, res) => {
  res.json({
    success: true,
    message: 'Promotions API is working',
    timestamp: new Date().toISOString()
  });
}));

module.exports = router;