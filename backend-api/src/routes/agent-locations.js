// Agent locations endpoint for Live Mapping
const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { getQuery } = require('../utils/database');

// GET /api/agent-locations - Get current agent locations
router.get('/', asyncHandler(async (req, res) => {
  const tenantId = req.tenantId;
  
  // Get latest GPS locations for all active agents
  const locations = await getQuery(`
    SELECT DISTINCT ON (gl.user_id)
      gl.user_id as agent_id,
      u.first_name || ' ' || u.last_name as agent_name,
      gl.latitude,
      gl.longitude,
      gl.accuracy,
      gl.created_at as last_updated,
      u.status as agent_status
    FROM gps_locations gl
    JOIN users u ON gl.user_id = u.id
    WHERE gl.tenant_id = $1
      AND u.role = 'agent'
      AND u.status = 'active'
      AND gl.created_at >= CURRENT_TIMESTAMP - INTERVAL '24 hours'
    ORDER BY gl.user_id, gl.created_at DESC
  `, [tenantId]);
  
  res.json({
    success: true,
    data: locations || []
  });
}));

module.exports = router;
