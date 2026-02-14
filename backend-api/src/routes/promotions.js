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
      type as promotion_type,
      description,
      discount_type,
      discount_value,
      start_date,
      end_date,
      budget,
      spent_amount,
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

// GET /api/promotions/stats - Promotion statistics (MUST be before /:id route)
router.get('/stats', async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    
    const [promotionCounts, typeBreakdown] = await Promise.all([
      getOneQuery(`
        SELECT 
          COUNT(*) as total_promotions,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active_promotions,
          COUNT(CASE WHEN status = 'expired' THEN 1 END) as expired_promotions
        FROM promotions WHERE tenant_id = ?
      `, [tenantId]).then(row => row || {}),
      
      getQuery(`
        SELECT type, COUNT(*) as count
        FROM promotions WHERE tenant_id = ?
        GROUP BY type
      `, [tenantId]).then(rows => rows || [])
    ]);
    
    res.json({
      success: true,
      data: {
        promotions: promotionCounts,
        typeBreakdown,
        redemptions: {
          total_redemptions: 0,
          total_discount_given: 0,
          avg_discount: 0
        },
        topPromotions: []
      }
    });
  } catch (error) {
    console.error('Error fetching promotion stats:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch promotion statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/promotions/trends - Promotion trends (MUST be before /:id route)
router.get('/trends', async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    
    res.json({
      success: true,
      data: {
        trends: []
      }
    });
  } catch (error) {
    console.error('Error fetching promotion trends:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch promotion trends',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/promotions/all/analytics - Promotion analytics (MUST be before /:id route)
router.get('/all/analytics', async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    
    res.json({
      success: true,
      data: {
        analytics: []
      }
    });
  } catch (error) {
    console.error('Error fetching promotion analytics:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch promotion analytics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Create new promotion
router.post('/', asyncHandler(async (req, res) => {
  const {
    name,
    description,
    type,
    discount_type,
    discount_value,
    start_date,
    end_date,
    budget
  } = req.body;

  const promotionId = require('crypto').randomUUID();
  
  const result = await runQuery(
    `INSERT INTO promotions (
      id, tenant_id, name, description, type, discount_type, discount_value,
      start_date, end_date, budget, status, created_by, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      promotionId,
      req.user.tenantId,
      name,
      description || '',
      type || 'discount',
      discount_type || 'percentage',
      discount_value || 0,
      start_date,
      end_date,
      budget || 0,
      'draft',
      req.user.userId,
      new Date().toISOString()
    ]
  );

  res.status(201).json({
    success: true,
    data: {
      id: promotionId,
      name,
      promotion_type: type || 'discount',
      status: 'draft'
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
  const updates = req.body;
  
  const updateFields = [];
  const updateValues = [];
  const allowedFields = ['name', 'type', 'description', 'discount_type', 'discount_value', 'start_date', 'end_date', 'budget', 'status'];
  
  for (const key of allowedFields) {
    if (updates[key] !== undefined) {
      updateFields.push(`${key} = ?`);
      updateValues.push(updates[key]);
    }
  }
  
  if (updateFields.length === 0) {
    return res.status(400).json({ success: false, message: 'No valid fields to update' });
  }
  
  updateFields.push('updated_at = ?');
  updateValues.push(new Date().toISOString());
  updateValues.push(id, tenantId);
  
  const result = await runQuery(`
    UPDATE promotions 
    SET ${updateFields.join(', ')}
    WHERE id = ? AND tenant_id = ?
  `, updateValues);

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
