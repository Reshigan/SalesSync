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
    WHERE tenant_id = $1
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
    
    const [promotionCounts, typeBreakdown, redemptions, topPromotions] = await Promise.all([
      getOneQuery(`
        SELECT 
          COUNT(*)::int as total_promotions,
          COUNT(CASE WHEN status = 'active' THEN 1 END)::int as active_promotions,
          COUNT(CASE WHEN status = 'expired' THEN 1 END)::int as expired_promotions
        FROM promotions WHERE tenant_id = $1
      `, [tenantId]).then(row => row || {}),
      
      getQuery(`
        SELECT type, COUNT(*)::int as count
        FROM promotions WHERE tenant_id = $1
        GROUP BY type
      `, [tenantId]).then(rows => rows || []),
      
      getOneQuery(`
        SELECT 
          COUNT(*)::int as total_redemptions,
          SUM(discount_amount)::float8 as total_discount_given,
          AVG(discount_amount)::float8 as avg_discount
        FROM promotion_redemptions pr
        INNER JOIN promotions p ON pr.promotion_id = p.id
        WHERE p.tenant_id = $1
      `, [tenantId]).then(row => row || {}),
      
      getQuery(`
        SELECT 
          p.id, p.name, p.type, p.discount_value,
          COUNT(pr.id)::int as redemption_count,
          SUM(pr.discount_amount)::float8 as total_discount
        FROM promotions p
        LEFT JOIN promotion_redemptions pr ON p.id = pr.promotion_id
        WHERE p.tenant_id = $1
        GROUP BY p.id, p.name, p.type, p.discount_value
        ORDER BY redemption_count DESC
        LIMIT 10
      `, [tenantId]).then(rows => rows || [])
    ]);
    
    res.json({
      success: true,
      data: {
        promotions: promotionCounts,
        typeBreakdown,
        redemptions: {
          ...redemptions,
          total_discount_given: parseFloat((redemptions.total_discount_given || 0).toFixed(2)),
          avg_discount: parseFloat((redemptions.avg_discount || 0).toFixed(2))
        },
        topPromotions
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
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
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
    WHERE id = $1 AND tenant_id = $2
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
    SET name = $1, promotion_type = $2, start_date = $3, end_date = $4, 
        discount_percentage = $5, discount_amount = $6, status = $7, updated_at = $8
    WHERE id = $9 AND tenant_id = $10
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
    WHERE id = $1 AND tenant_id = $2
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
