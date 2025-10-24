/**
 * Approval Workflow Routes
 * Multi-level approval system for orders, quotes, invoices
 */

const express = require('express');
const router = express.Router();
const { authenticateToken, getTenantId } = require('../middleware/auth');
const { getDatabase } = require('../database/database');
const emailService = require('../services/emailService');

/**
 * POST /api/approvals/submit
 * Submit an entity for approval
 */
router.post('/submit', authenticateToken, async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const db = getDatabase();
    const {
      entityType, // 'order', 'quote', 'invoice', 'payment'
      entityId,
      approverUserId,
      notes,
      priority = 'normal'
    } = req.body;

    if (!entityType || !entityId) {
      return res.status(400).json({ error: 'Entity type and ID are required' });
    }

    // Check if already submitted
    const existing = await db.get(
      `SELECT * FROM approval_requests 
       WHERE entity_type = ? AND entity_id = ? AND status IN ('pending', 'in_review')`,
      [entityType, entityId]
    );

    if (existing) {
      return res.status(400).json({ error: 'Approval request already exists' });
    }

    // Create approval request
    const result = await db.run(
      `INSERT INTO approval_requests (
        tenant_id, entity_type, entity_id, requested_by, approver_user_id,
        status, priority, notes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        tenantId,
        entityType,
        entityId,
        req.user.id,
        approverUserId,
        'pending',
        priority,
        notes || '',
        new Date().toISOString()
      ]
    );

    // Update entity status
    await updateEntityStatus(db, entityType, entityId, 'pending_approval');

    // Send notification to approver (if email configured)
    try {
      const approver = await db.get('SELECT * FROM users WHERE id = ?', [approverUserId]);
      if (approver && approver.email) {
        await emailService.sendEmail({
          to: approver.email,
          subject: `Approval Request: ${entityType} #${entityId}`,
          text: `You have a new approval request for ${entityType} #${entityId}.\n\nNotes: ${notes || 'None'}`,
          html: `
            <h2>New Approval Request</h2>
            <p>You have a new approval request:</p>
            <ul>
              <li><strong>Type:</strong> ${entityType}</li>
              <li><strong>ID:</strong> ${entityId}</li>
              <li><strong>Priority:</strong> ${priority}</li>
              <li><strong>Notes:</strong> ${notes || 'None'}</li>
            </ul>
            <p>Please review and approve or reject this request.</p>
          `
        });
      }
    } catch (emailError) {
      console.error('Error sending approval notification:', emailError);
    }

    res.status(201).json({
      success: true,
      approvalRequestId: result.lastID,
      message: 'Submitted for approval'
    });

  } catch (error) {
    console.error('Error submitting for approval:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/approvals/pending
 * Get pending approvals for current user
 */
router.get('/pending', authenticateToken, async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const db = getDatabase();
    const userId = req.user.id;

    const approvals = await db.all(
      `SELECT ar.*, 
              u.name as requester_name,
              u.email as requester_email
       FROM approval_requests ar
       LEFT JOIN users u ON ar.requested_by = u.id
       WHERE ar.tenant_id = ? AND ar.approver_user_id = ? AND ar.status = 'pending'
       ORDER BY ar.created_at DESC`,
      [tenantId, userId]
    );

    // Get entity details for each approval
    for (const approval of approvals) {
      approval.entity = await getEntityDetails(db, approval.entity_type, approval.entity_id, tenantId);
    }

    res.json({
      success: true,
      approvals
    });

  } catch (error) {
    console.error('Error fetching pending approvals:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/approvals/history
 * Get approval history
 */
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const db = getDatabase();
    const { entityType, entityId, status, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT ar.*, 
             u1.name as requester_name,
             u2.name as approver_name
      FROM approval_requests ar
      LEFT JOIN users u1 ON ar.requested_by = u1.id
      LEFT JOIN users u2 ON ar.approver_user_id = u2.id
      WHERE ar.tenant_id = ?
    `;
    const params = [tenantId];

    if (entityType) {
      query += ' AND ar.entity_type = ?';
      params.push(entityType);
    }

    if (entityId) {
      query += ' AND ar.entity_id = ?';
      params.push(entityId);
    }

    if (status) {
      query += ' AND ar.status = ?';
      params.push(status);
    }

    query += ' ORDER BY ar.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const approvals = await db.all(query, params);

    res.json({
      success: true,
      approvals
    });

  } catch (error) {
    console.error('Error fetching approval history:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/approvals/:id/approve
 * Approve a request
 */
router.post('/:id/approve', authenticateToken, async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const db = getDatabase();
    const { id } = req.params;
    const { notes } = req.body;

    // Get approval request
    const approval = await db.get(
      'SELECT * FROM approval_requests WHERE id = ? AND tenant_id = ?',
      [id, tenantId]
    );

    if (!approval) {
      return res.status(404).json({ error: 'Approval request not found' });
    }

    if (approval.status !== 'pending') {
      return res.status(400).json({ error: 'Approval request is not pending' });
    }

    // Check if current user is the approver
    if (approval.approver_user_id !== req.user.id) {
      return res.status(403).json({ error: 'You are not authorized to approve this request' });
    }

    // Update approval request
    await db.run(
      `UPDATE approval_requests 
       SET status = 'approved', 
           approved_at = ?, 
           approval_notes = ?
       WHERE id = ?`,
      [new Date().toISOString(), notes || '', id]
    );

    // Update entity status
    await updateEntityStatus(db, approval.entity_type, approval.entity_id, 'approved');

    // Send notification to requester
    try {
      const requester = await db.get('SELECT * FROM users WHERE id = ?', [approval.requested_by]);
      if (requester && requester.email) {
        await emailService.sendEmail({
          to: requester.email,
          subject: `Approved: ${approval.entity_type} #${approval.entity_id}`,
          text: `Your ${approval.entity_type} #${approval.entity_id} has been approved.\n\nApproval Notes: ${notes || 'None'}`,
          html: `
            <h2>✓ Approved</h2>
            <p>Your request has been approved:</p>
            <ul>
              <li><strong>Type:</strong> ${approval.entity_type}</li>
              <li><strong>ID:</strong> ${approval.entity_id}</li>
              <li><strong>Notes:</strong> ${notes || 'None'}</li>
            </ul>
          `
        });
      }
    } catch (emailError) {
      console.error('Error sending approval notification:', emailError);
    }

    res.json({
      success: true,
      message: 'Request approved successfully'
    });

  } catch (error) {
    console.error('Error approving request:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/approvals/:id/reject
 * Reject a request
 */
router.post('/:id/reject', authenticateToken, async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const db = getDatabase();
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }

    // Get approval request
    const approval = await db.get(
      'SELECT * FROM approval_requests WHERE id = ? AND tenant_id = ?',
      [id, tenantId]
    );

    if (!approval) {
      return res.status(404).json({ error: 'Approval request not found' });
    }

    if (approval.status !== 'pending') {
      return res.status(400).json({ error: 'Approval request is not pending' });
    }

    // Check if current user is the approver
    if (approval.approver_user_id !== req.user.id) {
      return res.status(403).json({ error: 'You are not authorized to reject this request' });
    }

    // Update approval request
    await db.run(
      `UPDATE approval_requests 
       SET status = 'rejected', 
           approved_at = ?, 
           approval_notes = ?
       WHERE id = ?`,
      [new Date().toISOString(), reason, id]
    );

    // Update entity status
    await updateEntityStatus(db, approval.entity_type, approval.entity_id, 'rejected');

    // Send notification to requester
    try {
      const requester = await db.get('SELECT * FROM users WHERE id = ?', [approval.requested_by]);
      if (requester && requester.email) {
        await emailService.sendEmail({
          to: requester.email,
          subject: `Rejected: ${approval.entity_type} #${approval.entity_id}`,
          text: `Your ${approval.entity_type} #${approval.entity_id} has been rejected.\n\nReason: ${reason}`,
          html: `
            <h2>✗ Rejected</h2>
            <p>Your request has been rejected:</p>
            <ul>
              <li><strong>Type:</strong> ${approval.entity_type}</li>
              <li><strong>ID:</strong> ${approval.entity_id}</li>
              <li><strong>Reason:</strong> ${reason}</li>
            </ul>
          `
        });
      }
    } catch (emailError) {
      console.error('Error sending rejection notification:', emailError);
    }

    res.json({
      success: true,
      message: 'Request rejected'
    });

  } catch (error) {
    console.error('Error rejecting request:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/approvals/:id
 * Cancel/withdraw approval request
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const db = getDatabase();
    const { id } = req.params;

    const approval = await db.get(
      'SELECT * FROM approval_requests WHERE id = ? AND tenant_id = ?',
      [id, tenantId]
    );

    if (!approval) {
      return res.status(404).json({ error: 'Approval request not found' });
    }

    // Only requester can cancel
    if (approval.requested_by !== req.user.id) {
      return res.status(403).json({ error: 'Only the requester can cancel' });
    }

    if (approval.status !== 'pending') {
      return res.status(400).json({ error: 'Can only cancel pending requests' });
    }

    // Update status
    await db.run(
      'UPDATE approval_requests SET status = ?, approved_at = ? WHERE id = ?',
      ['cancelled', new Date().toISOString(), id]
    );

    // Reset entity status
    await updateEntityStatus(db, approval.entity_type, approval.entity_id, 'draft');

    res.json({
      success: true,
      message: 'Approval request cancelled'
    });

  } catch (error) {
    console.error('Error cancelling approval:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/approvals/stats
 * Get approval statistics
 */
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const db = getDatabase();

    // Status breakdown
    const statusStats = await db.all(
      `SELECT status, COUNT(*) as count
       FROM approval_requests
       WHERE tenant_id = ?
       GROUP BY status`,
      [tenantId]
    );

    // Entity type breakdown
    const entityStats = await db.all(
      `SELECT entity_type, COUNT(*) as count
       FROM approval_requests
       WHERE tenant_id = ?
       GROUP BY entity_type`,
      [tenantId]
    );

    // Pending approvals by user
    const pendingByUser = await db.all(
      `SELECT ar.approver_user_id, u.name, COUNT(*) as count
       FROM approval_requests ar
       LEFT JOIN users u ON ar.approver_user_id = u.id
       WHERE ar.tenant_id = ? AND ar.status = 'pending'
       GROUP BY ar.approver_user_id, u.name`,
      [tenantId]
    );

    // Average approval time
    const avgTime = await db.get(
      `SELECT AVG(
         CAST((julianday(approved_at) - julianday(created_at)) * 24 * 60 AS INTEGER)
       ) as avg_minutes
       FROM approval_requests
       WHERE tenant_id = ? AND status IN ('approved', 'rejected')`,
      [tenantId]
    );

    res.json({
      success: true,
      stats: {
        statusBreakdown: statusStats,
        entityBreakdown: entityStats,
        pendingByApprover: pendingByUser,
        averageApprovalTimeMinutes: avgTime.avg_minutes || 0
      }
    });

  } catch (error) {
    console.error('Error fetching approval stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper functions

async function updateEntityStatus(db, entityType, entityId, status) {
  const tableMap = {
    'order': 'orders',
    'quote': 'quotes',
    'invoice': 'invoices',
    'payment': 'payments'
  };

  const table = tableMap[entityType];
  if (!table) return;

  try {
    await db.run(
      `UPDATE ${table} SET status = ?, updated_at = ? WHERE id = ?`,
      [status, new Date().toISOString(), entityId]
    );
  } catch (error) {
    console.error(`Error updating ${entityType} status:`, error);
  }
}

async function getEntityDetails(db, entityType, entityId, tenantId) {
  const tableMap = {
    'order': 'orders',
    'quote': 'quotes',
    'invoice': 'invoices',
    'payment': 'payments'
  };

  const table = tableMap[entityType];
  if (!table) return null;

  try {
    const entity = await db.get(
      `SELECT * FROM ${table} WHERE id = ? AND tenant_id = ?`,
      [entityId, tenantId]
    );
    return entity;
  } catch (error) {
    console.error(`Error fetching ${entityType} details:`, error);
    return null;
  }
}

module.exports = router;
