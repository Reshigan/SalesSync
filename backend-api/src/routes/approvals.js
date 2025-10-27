/**
 * Approval Workflow Routes
 * Manage approval requests for quotes, orders, discounts
 */

const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const router = express.Router();

/**
 * POST /api/approvals
 * Create a new approval request
 */
router.post('/', asyncHandler(async (req, res) => {
  const { runQuery, getOneQuery } = require('../database/init');
  const tenantId = req.tenantId;
  const userId = req.user.id;
  
  const {
    entityType,
    entityId,
    requestType,
    amount,
    reason,
    approverId
  } = req.body;

  if (!entityType || !entityId || !requestType) {
    throw new AppError('Entity type, entity ID, and request type are required', 400);
  }

  const requestDate = new Date().toISOString();
  const status = 'pending';

  const result = await runQuery(
    `INSERT INTO approval_requests (
      tenant_id, entity_type, entity_id, request_type,
      requested_by, approver_id, status, request_date,
      amount, reason
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      tenantId,
      entityType,
      entityId,
      requestType,
      userId,
      approverId || null,
      status,
      requestDate,
      amount || null,
      reason || ''
    ]
  );

  const approval = await getOneQuery(
    'SELECT * FROM approval_requests WHERE id = ?',
    [result.lastID]
  );

  res.json({
    success: true,
    approval
  });
}));

/**
 * GET /api/approvals
 * List approval requests
 */
router.get('/', asyncHandler(async (req, res) => {
  const { getQuery, getOneQuery } = require('../database/init');
  const tenantId = req.tenantId;
  const userId = req.user.id;
  const { status, entityType, requestType, limit = 50, offset = 0 } = req.query;

  let whereClause = 'WHERE a.tenant_id = ?';
  let params = [tenantId];

  // Filter by status
  if (status) {
    whereClause += ' AND a.status = ?';
    params.push(status);
  }

  // Filter by entity type
  if (entityType) {
    whereClause += ' AND a.entity_type = ?';
    params.push(entityType);
  }

  // Filter by request type
  if (requestType) {
    whereClause += ' AND a.request_type = ?';
    params.push(requestType);
  }

  const approvalsQuery = `
    SELECT
      a.*,
      u1.first_name || ' ' || u1.last_name as requester_name,
      u2.first_name || ' ' || u2.last_name as approver_name
    FROM approval_requests a
    LEFT JOIN users u1 ON a.requested_by = u1.id
    LEFT JOIN users u2 ON a.approver_id = u2.id
    ${whereClause}
    ORDER BY a.request_date DESC
    LIMIT ? OFFSET ?
  `;
  params.push(parseInt(limit), parseInt(offset));

  const approvals = await getQuery(approvalsQuery, params);

  const countQuery = `SELECT COUNT(*) as total FROM approval_requests a ${whereClause}`;
  const countResult = await getOneQuery(countQuery, params.slice(0, -2));
  const total = countResult.total;

  res.json({
    approvals,
    pagination: {
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    }
  });
}));

/**
 * GET /api/approvals/pending
 * Get pending approvals assigned to current user
 */
router.get('/pending', asyncHandler(async (req, res) => {
  const { getQuery } = require('../database/init');
  const tenantId = req.tenantId;
  const userId = req.user.id;

  const approvals = await getQuery(
    `SELECT
      a.*,
      u.first_name || ' ' || u.last_name as requester_name
    FROM approval_requests a
    LEFT JOIN users u ON a.requested_by = u.id
    WHERE a.tenant_id = ? AND a.approver_id = ? AND a.status = 'pending'
    ORDER BY a.request_date ASC`,
    [tenantId, userId]
  );

  res.json({
    approvals,
    count: approvals.length
  });
}));

/**
 * GET /api/approvals/:id
 * Get approval request by ID
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const { getOneQuery } = require('../database/init');
  const tenantId = req.tenantId;
  const { id } = req.params;

  const approval = await getOneQuery(
    `SELECT
      a.*,
      u1.first_name || ' ' || u1.last_name as requester_name,
      u1.email as requester_email,
      u2.first_name || ' ' || u2.last_name as approver_name,
      u2.email as approver_email
    FROM approval_requests a
    LEFT JOIN users u1 ON a.requested_by = u1.id
    LEFT JOIN users u2 ON a.approver_id = u2.id
    WHERE a.id = ? AND a.tenant_id = ?`,
    [id, tenantId]
  );

  if (!approval) {
    throw new AppError('Approval request not found', 404);
  }

  res.json(approval);
}));

/**
 * POST /api/approvals/:id/approve
 * Approve a request
 */
router.post('/:id/approve', asyncHandler(async (req, res) => {
  const { runQuery, getOneQuery } = require('../database/init');
  const tenantId = req.tenantId;
  const userId = req.user.id;
  const { id } = req.params;
  const { comments } = req.body;

  const approval = await getOneQuery(
    'SELECT * FROM approval_requests WHERE id = ? AND tenant_id = ?',
    [id, tenantId]
  );

  if (!approval) {
    throw new AppError('Approval request not found', 404);
  }

  if (approval.status !== 'pending') {
    throw new AppError('Approval request is not pending', 400);
  }

  // Verify user has permission to approve
  if (approval.approver_id && approval.approver_id !== userId) {
    // Check if user is admin/manager
    const userRole = req.user.role;
    if (userRole !== 'admin' && userRole !== 'manager') {
      throw new AppError('You are not authorized to approve this request', 403);
    }
  }

  const approvalDate = new Date().toISOString();

  await runQuery(
    `UPDATE approval_requests 
     SET status = 'approved',
         approved_by = ?,
         approval_date = ?,
         comments = ?
     WHERE id = ?`,
    [userId, approvalDate, comments || '', id]
  );

  const updatedApproval = await getOneQuery(
    'SELECT * FROM approval_requests WHERE id = ?',
    [id]
  );

  res.json({
    success: true,
    approval: updatedApproval,
    message: 'Request approved successfully'
  });
}));

/**
 * POST /api/approvals/:id/reject
 * Reject a request
 */
router.post('/:id/reject', asyncHandler(async (req, res) => {
  const { runQuery, getOneQuery } = require('../database/init');
  const tenantId = req.tenantId;
  const userId = req.user.id;
  const { id } = req.params;
  const { comments } = req.body;

  const approval = await getOneQuery(
    'SELECT * FROM approval_requests WHERE id = ? AND tenant_id = ?',
    [id, tenantId]
  );

  if (!approval) {
    throw new AppError('Approval request not found', 404);
  }

  if (approval.status !== 'pending') {
    throw new AppError('Approval request is not pending', 400);
  }

  // Verify user has permission to reject
  if (approval.approver_id && approval.approver_id !== userId) {
    const userRole = req.user.role;
    if (userRole !== 'admin' && userRole !== 'manager') {
      throw new AppError('You are not authorized to reject this request', 403);
    }
  }

  const approvalDate = new Date().toISOString();

  await runQuery(
    `UPDATE approval_requests 
     SET status = 'rejected',
         approved_by = ?,
         approval_date = ?,
         comments = ?
     WHERE id = ?`,
    [userId, approvalDate, comments || 'Request rejected', id]
  );

  const updatedApproval = await getOneQuery(
    'SELECT * FROM approval_requests WHERE id = ?',
    [id]
  );

  res.json({
    success: true,
    approval: updatedApproval,
    message: 'Request rejected'
  });
}));

/**
 * GET /api/approvals/stats
 * Get approval statistics
 */
router.get('/tenant/stats', asyncHandler(async (req, res) => {
  const { getQuery, getOneQuery } = require('../database/init');
  const tenantId = req.tenantId;

  const stats = await getOneQuery(
    `SELECT
      COUNT(*) as total_requests,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
      SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
    FROM approval_requests
    WHERE tenant_id = ?`,
    [tenantId]
  );

  const byType = await getQuery(
    `SELECT
      request_type,
      COUNT(*) as count,
      SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_count
    FROM approval_requests
    WHERE tenant_id = ?
    GROUP BY request_type`,
    [tenantId]
  );

  res.json({
    stats,
    byType
  });
}));

module.exports = router;
