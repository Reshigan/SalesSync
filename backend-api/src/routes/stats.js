// Stub endpoints for missing routes causing 404 errors
const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');

// GET /api/stats - Dashboard stats endpoint
router.get('/', asyncHandler(async (req, res) => {
  const tenantId = req.user?.tenantId || req.tenantId;
  const { start_date, end_date } = req.query;
  
  res.json({
    success: true,
    data: {
      total_orders: 0,
      total_revenue: 0,
      total_visits: 0,
      total_customers: 0,
      active_agents: 0,
      pending_orders: 0,
      completed_orders: 0,
      cancelled_orders: 0
    }
  });
}));

module.exports = router;
