const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { getQuery, getOneQuery, runQuery } = require('../utils/database');

// Get all field operations
router.get('/', asyncHandler(async (req, res) => {
  const tenantId = req.user.tenantId;
  
  const operations = await getQuery(`
    SELECT 
      id,
      operation_type,
      agent_id,
      customer_id,
      status,
      scheduled_date,
      completed_date,
      created_at
    FROM field_operations 
    WHERE tenant_id = ?
    ORDER BY created_at DESC
  `, [tenantId]);

  res.json({
    success: true,
    data: operations || []
  });
}));

// Create new field operation
router.post('/', asyncHandler(async (req, res) => {
  const {
    operation_type,
    agent_id,
    customer_id,
    scheduled_date,
    description
  } = req.body;

  const operationId = require('crypto').randomUUID();
  
  const result = await runQuery(
    `INSERT INTO field_operations (
      id, tenant_id, operation_type, agent_id, customer_id,
      scheduled_date, status, description, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      operationId,
      req.user.tenantId,
      operation_type || 'visit',
      agent_id,
      customer_id,
      scheduled_date || new Date().toISOString(),
      'scheduled',
      description || '',
      new Date().toISOString()
    ]
  );

  res.status(201).json({
    success: true,
    data: {
      id: operationId,
      operation_type: operation_type || 'visit',
      agent_id,
      customer_id,
      status: 'scheduled'
    }
  });
}));

// Get field operation by ID
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const tenantId = req.user.tenantId;
  
  const operation = await getOneQuery(`
    SELECT * FROM field_operations 
    WHERE id = ? AND tenant_id = ?
  `, [id, tenantId]);

  if (!operation) {
    return res.status(404).json({
      success: false,
      message: 'Field operation not found'
    });
  }

  res.json({
    success: true,
    data: operation
  });
}));

// Update field operation
router.put('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const tenantId = req.user.tenantId;
  const { operation_type, agent_id, customer_id, scheduled_date, status, completed_date, description } = req.body;
  
  const result = await runQuery(`
    UPDATE field_operations 
    SET operation_type = ?, agent_id = ?, customer_id = ?, scheduled_date = ?, 
        status = ?, completed_date = ?, description = ?, updated_at = ?
    WHERE id = ? AND tenant_id = ?
  `, [operation_type, agent_id, customer_id, scheduled_date, status, completed_date, description, new Date().toISOString(), id, tenantId]);

  if (result.changes === 0) {
    return res.status(404).json({
      success: false,
      message: 'Field operation not found'
    });
  }

  res.json({
    success: true,
    message: 'Field operation updated successfully'
  });
}));

// Delete field operation
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const tenantId = req.user.tenantId;
  
  const result = await runQuery(`
    DELETE FROM field_operations 
    WHERE id = ? AND tenant_id = ?
  `, [id, tenantId]);

  if (result.changes === 0) {
    return res.status(404).json({
      success: false,
      message: 'Field operation not found'
    });
  }

  res.json({
    success: true,
    message: 'Field operation deleted successfully'
  });
}));

// Get operations by agent
router.get('/agent/:agentId', asyncHandler(async (req, res) => {
  const { agentId } = req.params;
  const tenantId = req.user.tenantId;
  
  const operations = await getQuery(`
    SELECT * FROM field_operations 
    WHERE agent_id = ? AND tenant_id = ?
    ORDER BY scheduled_date DESC
  `, [agentId, tenantId]);

  res.json({
    success: true,
    data: operations || []
  });
}));

// Get operations by status
router.get('/status/:status', asyncHandler(async (req, res) => {
  const { status } = req.params;
  const tenantId = req.user.tenantId;
  
  const operations = await getQuery(`
    SELECT * FROM field_operations 
    WHERE status = ? AND tenant_id = ?
    ORDER BY scheduled_date DESC
  `, [status, tenantId]);

  res.json({
    success: true,
    data: operations || []
  });
}));

// Test endpoint
router.get('/test/health', asyncHandler(async (req, res) => {
  res.json({
    success: true,
    message: 'Field Operations API is working',
    timestamp: new Date().toISOString()
  });
}));

module.exports = router;