const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { getQuery, getOneQuery, runQuery } = require('../utils/database');

// Get all KYC submissions
router.get('/', asyncHandler(async (req, res) => {
  const tenantId = req.user.tenantId;
  
  const kycSubmissions = await getQuery(`
    SELECT 
      id,
      customer_id,
      submission_type,
      status,
      submitted_at,
      reviewed_at,
      created_at
    FROM kyc_submissions 
    WHERE tenant_id = ?
    ORDER BY created_at DESC
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
    submission_type,
    document_data
  } = req.body;

  const kycId = require('crypto').randomUUID();
  
  const result = await runQuery(
    `INSERT INTO kyc_submissions (
      id, tenant_id, customer_id, submission_type, status, 
      document_data, submitted_at, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      kycId,
      req.user.tenantId,
      customer_id,
      submission_type || 'identity_verification',
      'pending',
      JSON.stringify(document_data || {}),
      new Date().toISOString(),
      new Date().toISOString()
    ]
  );

  res.status(201).json({
    success: true,
    data: {
      id: kycId,
      customer_id,
      submission_type: submission_type || 'identity_verification',
      status: 'pending'
    }
  });
}));

// Get KYC submission by ID
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const tenantId = req.user.tenantId;
  
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
  const tenantId = req.user.tenantId;
  const { status, review_notes } = req.body;
  
  const result = await runQuery(`
    UPDATE kyc_submissions 
    SET status = ?, review_notes = ?, reviewed_at = ?, updated_at = ?
    WHERE id = ? AND tenant_id = ?
  `, [status, review_notes, new Date().toISOString(), new Date().toISOString(), id, tenantId]);

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
  const tenantId = req.user.tenantId;
  
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

module.exports = router;