const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { getQuery, getOneQuery, runQuery } = require('../utils/database');

// Get all KYC submissions
router.get('/', asyncHandler(async (req, res) => {
  const tenantId = req.tenantId;
  
  const kycSubmissions = await getQuery(`
    SELECT 
      id,
      customer_id,
      product_id,
      agent_id,
      verification_status as status,
      submitted_at,
      verified_at as reviewed_at,
      submitted_at as created_at
    FROM kyc_submissions 
    WHERE tenant_id = ?
    ORDER BY submitted_at DESC
    LIMIT 100
  `, [tenantId]);

  res.json({
    success: true,
    data: kycSubmissions || []
  });
}));

// Create new KYC submission
router.post('/', asyncHandler(async (req, res) => {
  const {
    customer_id,
    product_id,
    agent_id,
    submission_data
  } = req.body;

  const kycId = require('crypto').randomUUID();
  
  const result = await runQuery(
    `INSERT INTO kyc_submissions (
      id, tenant_id, customer_id, product_id, agent_id,
      submission_data, verification_status, submitted_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      kycId,
      req.tenantId,
      customer_id,
      product_id,
      agent_id,
      JSON.stringify(submission_data || {}),
      'pending',
      new Date().toISOString()
    ]
  );

  res.status(201).json({
    success: true,
    data: {
      id: kycId,
      customer_id,
      product_id,
      agent_id,
      status: 'pending'
    }
  });
}));

// Get KYC submission by ID
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const tenantId = req.tenantId;
  
  const kycSubmission = await getOneQuery(`
    SELECT * FROM kyc_submissions 
    WHERE id = ? AND tenant_id = ?
  `, [id, tenantId]);

  if (!kycSubmission) {
    return res.status(404).json({
      success: false,
      message: 'KYC submission not found'
    });
  }

  res.json({
    success: true,
    data: kycSubmission
  });
}));

// Update KYC submission status
router.put('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const tenantId = req.tenantId;
  const { status } = req.body;
  
  const result = await runQuery(`
    UPDATE kyc_submissions 
    SET verification_status = ?, verified_at = ?
    WHERE id = ? AND tenant_id = ?
  `, [status, new Date().toISOString(), id, tenantId]);

  if (result.changes === 0) {
    return res.status(404).json({
      success: false,
      message: 'KYC submission not found'
    });
  }

  res.json({
    success: true,
    message: 'KYC submission updated successfully'
  });
}));

// Delete KYC submission
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const tenantId = req.tenantId;
  
  const result = await runQuery(`
    DELETE FROM kyc_submissions 
    WHERE id = ? AND tenant_id = ?
  `, [id, tenantId]);

  if (result.changes === 0) {
    return res.status(404).json({
      success: false,
      message: 'KYC submission not found'
    });
  }

  res.json({
    success: true,
    message: 'KYC submission deleted successfully'
  });
}));

// Test endpoint
router.get('/test/health', asyncHandler(async (req, res) => {
  res.json({
    success: true,
    message: 'KYC API is working',
    timestamp: new Date().toISOString()
  });
}));

// GET /api/kyc/stats - KYC statistics
router.get('/stats', asyncHandler(async (req, res) => {
  const tenantId = req.tenantId;
  
  const [kycCounts, statusBreakdown, recentActivity] = await Promise.all([
    getOneQuery(`
      SELECT 
        COUNT(*) as total_submissions,
        COUNT(CASE WHEN verification_status = 'pending' THEN 1 END) as pending_reviews,
        COUNT(CASE WHEN verification_status = 'approved' THEN 1 END) as approved_count,
        COUNT(CASE WHEN verification_status = 'rejected' THEN 1 END) as rejected_count
      FROM kyc_submissions WHERE tenant_id = ?
    `, [tenantId]),
    
    getQuery(`
      SELECT verification_status as status, COUNT(*) as count
      FROM kyc_submissions WHERE tenant_id = ?
      GROUP BY verification_status
    `, [tenantId]),
    
    getQuery(`
      SELECT 
        k.id, k.customer_id, c.name as customer_name,
        k.verification_status as status, k.submitted_at, k.verified_at as reviewed_at
      FROM kyc_submissions k
      LEFT JOIN customers c ON k.customer_id = c.id
      WHERE k.tenant_id = ?
      ORDER BY k.submitted_at DESC
      LIMIT 10
    `, [tenantId])
  ]);

  res.json({
    success: true,
    data: {
      counts: kycCounts,
      statusBreakdown,
      recentActivity
    }
  });
}));

module.exports = router;
