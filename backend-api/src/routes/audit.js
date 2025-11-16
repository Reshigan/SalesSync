const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/asyncHandler');

router.get('/:entityType/:entityId', asyncHandler(async (req, res) => {
  const { getQuery } = require('../utils/database');
  const { entityType, entityId } = req.params;
  const tenantId = req.user?.tenantId;
  
  const auditTrail = await getQuery(`
    SELECT al.*, u.name as performed_by_name
    FROM audit_logs al
    LEFT JOIN users u ON al.performed_by = u.id
    WHERE al.entity_type = $1 AND al.entity_id = $2 AND al.tenant_id = $3
    ORDER BY al.performed_at DESC
  `, [entityType, entityId, tenantId]);
  
  res.json({
    success: true,
    data: { auditTrail }
  });
}));

router.get('/:entityType/:entityId/entries/:entryId', asyncHandler(async (req, res) => {
  const { getQuery } = require('../utils/database');
  const { entityType, entityId, entryId } = req.params;
  const tenantId = req.user?.tenantId;
  
  const entries = await getQuery(`
    SELECT al.*, u.name as performed_by_name
    FROM audit_logs al
    LEFT JOIN users u ON al.performed_by = u.id
    WHERE al.id = $1 AND al.entity_type = $2 AND al.entity_id = $3 AND al.tenant_id = $4
  `, [entryId, entityType, entityId, tenantId]);
  
  const entry = entries[0] || null;
  
  res.json({
    success: true,
    data: { entry }
  });
}));

router.get('/:entityType/:entityId/search', asyncHandler(async (req, res) => {
  const { getQuery } = require('../utils/database');
  const { entityType, entityId } = req.params;
  const { q } = req.query;
  const tenantId = req.user?.tenantId;
  
  if (!q || q.length === 0) {
    return res.json({
      success: true,
      data: { results: [] }
    });
  }
  
  const results = await getQuery(`
    SELECT 
      al.*,
      u.name as performed_by,
      u.first_name || ' ' || u.last_name as performed_by_name,
      1.0 as relevance
    FROM audit_logs al
    LEFT JOIN users u ON al.performed_by = u.id
    WHERE al.entity_type = $1 
      AND al.entity_id = $2 
      AND al.tenant_id = $3
      AND (
        al.action ILIKE $4 
        OR al.description ILIKE $4
        OR u.name ILIKE $4
        OR u.first_name ILIKE $4
        OR u.last_name ILIKE $4
      )
    ORDER BY al.performed_at DESC
    LIMIT 50
  `, [entityType, entityId, tenantId, `%${q}%`]);
  
  res.json({
    success: true,
    data: { results: results || [] }
  });
}));

module.exports = router;
