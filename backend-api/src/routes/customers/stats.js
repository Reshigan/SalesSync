/**
 * Customer Statistics Routes
 * Statistics and analytics for customers
 */

const express = require('express');
const { asyncHandler } = require('../../middleware/errorHandler');
const { requireFunction } = require('../../middleware/authMiddleware');
const { sendSuccess } = require('../../utils/responseHelper');

const router = express.Router();

/**
 * @swagger
 * /api/customers/stats:
 *   get:
 *     summary: Get customer statistics
 *     tags: [Customers]
 */
router.get('/stats', requireFunction('customers', 'view'), asyncHandler(async (req, res, next) => {
  const { getOneQuery } = require('../../utils/database');
  
  const stats = await getOneQuery(`
    SELECT 
      COUNT(*) as total_customers,
      SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_customers,
      SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) as inactive_customers,
      SUM(CASE WHEN status = 'suspended' THEN 1 ELSE 0 END) as suspended_customers,
      SUM(CASE WHEN type = 'retail' THEN 1 ELSE 0 END) as retail_customers,
      SUM(CASE WHEN type = 'wholesale' THEN 1 ELSE 0 END) as wholesale_customers,
      SUM(CASE WHEN type = 'distributor' THEN 1 ELSE 0 END) as distributor_customers,
      SUM(CASE WHEN created_at >= DATE('now', '-30 days') THEN 1 ELSE 0 END) as new_customers_30d,
      SUM(CASE WHEN created_at >= DATE('now', '-7 days') THEN 1 ELSE 0 END) as new_customers_7d
    FROM customers
    WHERE tenant_id = ?
  `, [req.tenantId]);
  
  return sendSuccess(res, stats || {});
}));

/**
 * @swagger
 * /api/customers/stats/summary:
 *   get:
 *     summary: Get customer summary statistics
 *     tags: [Customers]
 */
router.get('/stats/summary', requireFunction('customers', 'view'), asyncHandler(async (req, res, next) => {
  const { getOneQuery } = require('../../utils/database');
  
  const stats = await getOneQuery(`
    SELECT 
      COUNT(*) as total_customers,
      SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_customers,
      SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) as inactive_customers,
      SUM(CASE WHEN type = 'retail' THEN 1 ELSE 0 END) as retail_customers,
      SUM(CASE WHEN type = 'wholesale' THEN 1 ELSE 0 END) as wholesale_customers,
      SUM(CASE WHEN type = 'distributor' THEN 1 ELSE 0 END) as distributor_customers,
      SUM(CASE WHEN created_at >= DATE('now', '-30 days') THEN 1 ELSE 0 END) as new_customers_30d,
      SUM(CASE WHEN created_at >= DATE('now', '-7 days') THEN 1 ELSE 0 END) as new_customers_7d,
      COALESCE(SUM(credit_limit), 0) as total_credit_limit
    FROM customers
    WHERE tenant_id = ?
  `, [req.tenantId]);
  
  return sendSuccess(res, stats || {});
}));

module.exports = router;
