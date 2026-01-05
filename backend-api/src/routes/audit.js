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
    WHERE al.entity_type = ? AND al.entity_id = ? AND al.tenant_id = ?
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
    WHERE al.id = ? AND al.entity_type = ? AND al.entity_id = ? AND al.tenant_id = ?
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
    WHERE al.entity_type = ? 
      AND al.entity_id = ? 
      AND al.tenant_id = ?
      AND (
        al.action LIKE ? 
        OR al.description LIKE ?
        OR u.name LIKE ?
        OR u.first_name LIKE ?
        OR u.last_name LIKE ?
      )
    ORDER BY al.performed_at DESC
    LIMIT 50
  `, [entityType, entityId, tenantId, `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`]);
  
  res.json({
    success: true,
    data: { results: results || [] }
  });
}));

module.exports = router;
