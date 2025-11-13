// Active visits endpoint for Live Mapping
const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { getQuery } = require('../utils/database');

// GET /api/active-visits - Get currently active visits
router.get('/', asyncHandler(async (req, res) => {
  const tenantId = req.tenantId;
  
  // Get all visits that are currently in progress (checked in but not checked out)
  const activeVisits = await getQuery(`
    SELECT 
      v.id as visit_id,
      v.agent_id,
      u.first_name || ' ' || u.last_name as agent_name,
      v.customer_id,
      c.name as customer_name,
      c.latitude as customer_latitude,
      c.longitude as customer_longitude,
      v.check_in_time,
      v.status,
      v.visit_date
    FROM visits v
    JOIN users u ON v.agent_id = u.id
    JOIN customers c ON v.customer_id = c.id
    WHERE v.tenant_id = $1
      AND v.status IN ('in_progress', 'checked_in')
      AND v.visit_date::date = CURRENT_DATE
      AND v.check_in_time IS NOT NULL
      AND v.check_out_time IS NULL
    ORDER BY v.check_in_time DESC
  `, [tenantId]);
  
  res.json({
    success: true,
    data: activeVisits || []
  });
}));

module.exports = router;
