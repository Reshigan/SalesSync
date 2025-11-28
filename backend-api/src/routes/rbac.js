const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { getQuery } = require('../utils/database');

router.get('/roles', asyncHandler(async (req, res) => {
  const roles = await getQuery('SELECT DISTINCT role as name FROM users WHERE tenant_id = $1', [req.tenantId]);
  res.json({ success: true, data: roles || [] });
}));

router.get('/permissions', asyncHandler(async (req, res) => {
  res.json({ success: true, data: [{ module: 'dashboard', actions: ['view'] }] });
}));

module.exports = router;
