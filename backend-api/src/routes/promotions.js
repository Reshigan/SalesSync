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

// GET /api/promotions/stats - Promotion statistics
router.get('/stats', async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const db = getDatabase();
    
    const [promotionCounts, typeBreakdown, redemptions, topPromotions] = await Promise.all([
      new Promise((resolve, reject) => {
        db.get(`
          SELECT 
            COUNT(*) as total_promotions,
            COUNT(CASE WHEN status = 'active' THEN 1 END) as active_promotions,
            COUNT(CASE WHEN status = 'expired' THEN 1 END) as expired_promotions
          FROM promotions WHERE tenant_id = ?
        `, [tenantId], (err, row) => err ? reject(err) : resolve(row || {}));
      }),
      new Promise((resolve, reject) => {
        db.all(`
          SELECT type, COUNT(*) as count
          FROM promotions WHERE tenant_id = ?
          GROUP BY type
        `, [tenantId], (err, rows) => err ? reject(err) : resolve(rows || []));
      }),
      new Promise((resolve, reject) => {
        db.get(`
          SELECT 
            COUNT(*) as total_redemptions,
            SUM(discount_amount) as total_discount_given,
            AVG(discount_amount) as avg_discount
          FROM promotion_redemptions pr
          INNER JOIN promotions p ON pr.promotion_id = p.id
          WHERE p.tenant_id = ?
        `, [tenantId], (err, row) => err ? reject(err) : resolve(row || {}));
      }),
      new Promise((resolve, reject) => {
        db.all(`
          SELECT 
            p.id, p.name, p.type, p.discount_value,
            COUNT(pr.id) as redemption_count,
            SUM(pr.discount_amount) as total_discount
          FROM promotions p
          LEFT JOIN promotion_redemptions pr ON p.id = pr.promotion_id
          WHERE p.tenant_id = ?
          GROUP BY p.id
          ORDER BY redemption_count DESC
          LIMIT 10
        `, [tenantId], (err, rows) => err ? reject(err) : resolve(rows || []));
      })
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

module.exports = router;