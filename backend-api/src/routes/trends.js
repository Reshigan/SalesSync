// Trends endpoint for dashboard and analytics pages
const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { getQuery } = require('../utils/database');

// GET /api/trends - Get trends data
router.get('/', asyncHandler(async (req, res) => {
  const tenantId = req.user?.tenantId || req.tenantId;
  const { start_date, end_date } = req.query;
  
  const startDate = start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const endDate = end_date || new Date().toISOString().split('T')[0];
  
  // Daily trends for orders and revenue
  const dailyTrends = await getQuery(`
    SELECT 
      o.order_date::date as date,
      COUNT(*)::int as order_count,
      COALESCE(SUM(o.total_amount), 0)::float8 as revenue,
      COUNT(DISTINCT o.customer_id)::int as unique_customers
    FROM orders o
    WHERE o.tenant_id = $1
      AND o.order_date >= $2
      AND o.order_date <= $3
    GROUP BY o.order_date::date
    ORDER BY o.order_date::date
  `, [tenantId, startDate, endDate]);
  
  // Weekly trends
  const weeklyTrends = await getQuery(`
    SELECT 
      DATE_TRUNC('week', o.order_date)::date as week_start,
      COUNT(*)::int as order_count,
      COALESCE(SUM(o.total_amount), 0)::float8 as revenue
    FROM orders o
    WHERE o.tenant_id = $1
      AND o.order_date >= $2
      AND o.order_date <= $3
    GROUP BY DATE_TRUNC('week', o.order_date)
    ORDER BY week_start
  `, [tenantId, startDate, endDate]);
  
  res.json({
    success: true,
    data: {
      daily: dailyTrends || [],
      weekly: weeklyTrends || [],
      period: {
        start_date: startDate,
        end_date: endDate
      }
    }
  });
}));

module.exports = router;
