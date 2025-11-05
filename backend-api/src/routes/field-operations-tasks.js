const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { getQuery, getOneQuery, runQuery } = require('../utils/database');

router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const tenantId = req.tenantId;
  
  const task = await getOneQuery(`
    SELECT * FROM visit_tasks 
    WHERE id = ? AND tenant_id = ?
  `, [id, tenantId]);

  if (!task) {
    return res.status(404).json({
      success: false,
      message: 'Task not found'
    });
  }

  res.json({
    success: true,
    data: task
  });
}));

router.patch('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const tenantId = req.tenantId;
  const { status } = req.body;
  
  const result = await runQuery(`
    UPDATE visit_tasks 
    SET status = ?, updated_at = ?
    WHERE id = ? AND tenant_id = ?
  `, [status, new Date().toISOString(), id, tenantId]);

  if (result.changes === 0) {
    return res.status(404).json({
      success: false,
      message: 'Task not found'
    });
  }

  const task = await getOneQuery(`
    SELECT * FROM visit_tasks WHERE id = ?
  `, [id]);

  res.json({
    success: true,
    data: task
  });
}));

module.exports = router;
