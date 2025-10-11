const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { requireFunction, requireRole } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/kyc');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images and documents are allowed'));
    }
  }
});

// Get all KYC submissions
router.get('/submissions', requireFunction('kyc', 'view'), async (req, res) => {
  try {
    const { page = 1, limit = 10, status, customer_id, agent_id } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT 
        ks.*,
        c.name as customer_name,
        c.email as customer_email,
        a.name as agent_name,
        p.name as product_name,
        COUNT(kd.id) as document_count
      FROM kyc_submissions ks
      LEFT JOIN customers c ON ks.customer_id = c.id
      LEFT JOIN agents a ON ks.agent_id = a.id
      LEFT JOIN products p ON ks.product_id = p.id
      LEFT JOIN kyc_documents kd ON ks.id = kd.submission_id
      WHERE ks.tenant_id = ?
    `;
    
    const params = [req.user.tenantId];
    
    if (status) {
      query += ' AND ks.verification_status = ?';
      params.push(status);
    }
    
    if (customer_id) {
      query += ' AND ks.customer_id = ?';
      params.push(customer_id);
    }
    
    if (agent_id) {
      query += ' AND ks.agent_id = ?';
      params.push(agent_id);
    }
    
    query += ' GROUP BY ks.id ORDER BY ks.submitted_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const submissions = await db.all(query, params);
    
    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM kyc_submissions WHERE tenant_id = ?';
    const countParams = [req.user.tenantId];
    
    if (status) {
      countQuery += ' AND verification_status = ?';
      countParams.push(status);
    }
    
    if (customer_id) {
      countQuery += ' AND customer_id = ?';
      countParams.push(customer_id);
    }
    
    if (agent_id) {
      countQuery += ' AND agent_id = ?';
      countParams.push(agent_id);
    }
    
    const { total } = await db.get(countQuery, countParams);
    
    res.json({
      success: true,
      data: submissions.map(sub => ({
        ...sub,
        submission_data: JSON.parse(sub.submission_data || '{}')
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching KYC submissions:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create new KYC submission
router.post('/submissions', requireFunction('kyc', 'create'), async (req, res) => {
  try {
    const { customer_id, product_id, agent_id, submission_data } = req.body;
    
    if (!customer_id || !product_id || !agent_id || !submission_data) {
      return res.status(400).json({ 
        success: false, 
        error: 'Customer ID, Product ID, Agent ID, and submission data are required' 
      });
    }
    
    const submissionId = require('crypto').randomBytes(16).toString('hex');
    
    await db.run(`
      INSERT INTO kyc_submissions (
        id, tenant_id, customer_id, product_id, agent_id, submission_data
      ) VALUES (?, ?, ?, ?, ?, ?)
    `, [
      submissionId,
      req.user.tenantId,
      customer_id,
      product_id,
      agent_id,
      JSON.stringify(submission_data)
    ]);
    
    // Add to verification history
    await db.run(`
      INSERT INTO kyc_verification_history (
        tenant_id, submission_id, action, performed_by, notes
      ) VALUES (?, ?, ?, ?, ?)
    `, [
      req.user.tenantId,
      submissionId,
      'submitted',
      req.user.userId,
      'KYC submission created'
    ]);
    
    // Perform initial risk assessment
    const riskScore = calculateRiskScore(submission_data);
    const riskLevel = getRiskLevel(riskScore);
    
    await db.run(`
      INSERT INTO kyc_risk_assessments (
        tenant_id, submission_id, risk_score, risk_level, assessed_by, notes
      ) VALUES (?, ?, ?, ?, ?, ?)
    `, [
      req.user.tenantId,
      submissionId,
      riskScore,
      riskLevel,
      req.user.userId,
      'Initial automated risk assessment'
    ]);
    
    const submission = await db.get(`
      SELECT * FROM kyc_submissions WHERE id = ?
    `, [submissionId]);
    
    res.status(201).json({
      success: true,
      data: {
        ...submission,
        submission_data: JSON.parse(submission.submission_data)
      }
    });
  } catch (error) {
    console.error('Error creating KYC submission:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get specific KYC submission
router.get('/submissions/:id', requireFunction('kyc', 'view'), async (req, res) => {
  try {
    const submission = await db.get(`
      SELECT 
        ks.*,
        c.name as customer_name,
        c.email as customer_email,
        a.name as agent_name,
        p.name as product_name
      FROM kyc_submissions ks
      LEFT JOIN customers c ON ks.customer_id = c.id
      LEFT JOIN agents a ON ks.agent_id = a.id
      LEFT JOIN products p ON ks.product_id = p.id
      WHERE ks.id = ? AND ks.tenant_id = ?
    `, [req.params.id, req.user.tenantId]);
    
    if (!submission) {
      return res.status(404).json({ success: false, error: 'KYC submission not found' });
    }
    
    // Get documents
    const documents = await db.all(`
      SELECT * FROM kyc_documents 
      WHERE submission_id = ? AND tenant_id = ?
      ORDER BY uploaded_at DESC
    `, [req.params.id, req.user.tenantId]);
    
    // Get verification history
    const history = await db.all(`
      SELECT 
        kvh.*,
        u.name as performed_by_name
      FROM kyc_verification_history kvh
      LEFT JOIN users u ON kvh.performed_by = u.id
      WHERE kvh.submission_id = ? AND kvh.tenant_id = ?
      ORDER BY kvh.created_at DESC
    `, [req.params.id, req.user.tenantId]);
    
    // Get risk assessment
    const riskAssessment = await db.get(`
      SELECT 
        kra.*,
        u.name as assessed_by_name
      FROM kyc_risk_assessments kra
      LEFT JOIN users u ON kra.assessed_by = u.id
      WHERE kra.submission_id = ? AND kra.tenant_id = ?
      ORDER BY kra.assessment_date DESC
      LIMIT 1
    `, [req.params.id, req.user.tenantId]);
    
    res.json({
      success: true,
      data: {
        ...submission,
        submission_data: JSON.parse(submission.submission_data || '{}'),
        documents,
        history: history.map(h => ({
          ...h,
          metadata: h.metadata ? JSON.parse(h.metadata) : null
        })),
        risk_assessment: riskAssessment ? {
          ...riskAssessment,
          risk_factors: riskAssessment.risk_factors ? JSON.parse(riskAssessment.risk_factors) : []
        } : null
      }
    });
  } catch (error) {
    console.error('Error fetching KYC submission:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update KYC submission status
router.put('/submissions/:id/status', requireFunction('kyc', 'edit'), async (req, res) => {
  try {
    const { status, notes } = req.body;
    
    if (!['pending', 'under_review', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid status. Must be: pending, under_review, approved, or rejected' 
      });
    }
    
    await db.run(`
      UPDATE kyc_submissions 
      SET verification_status = ?, verified_at = CASE WHEN ? IN ('approved', 'rejected') THEN CURRENT_TIMESTAMP ELSE verified_at END
      WHERE id = ? AND tenant_id = ?
    `, [status, status, req.params.id, req.user.tenantId]);
    
    // Add to verification history
    await db.run(`
      INSERT INTO kyc_verification_history (
        tenant_id, submission_id, action, performed_by, notes
      ) VALUES (?, ?, ?, ?, ?)
    `, [
      req.user.tenantId,
      req.params.id,
      status,
      req.user.userId,
      notes || `Status updated to ${status}`
    ]);
    
    res.json({ success: true, message: 'KYC submission status updated successfully' });
  } catch (error) {
    console.error('Error updating KYC submission status:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Upload KYC documents
router.post('/submissions/:id/documents', requireFunction('kyc', 'create'), upload.array('documents', 10), async (req, res) => {
  try {
    const { document_types } = req.body;
    const files = req.files;
    
    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, error: 'No files uploaded' });
    }
    
    const documentTypes = Array.isArray(document_types) ? document_types : [document_types];
    
    const uploadedDocuments = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const documentType = documentTypes[i] || 'other';
      
      const documentId = require('crypto').randomBytes(16).toString('hex');
      
      await db.run(`
        INSERT INTO kyc_documents (
          id, tenant_id, submission_id, document_type, document_name, 
          file_path, file_size, mime_type
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        documentId,
        req.user.tenantId,
        req.params.id,
        documentType,
        file.originalname,
        file.path,
        file.size,
        file.mimetype
      ]);
      
      uploadedDocuments.push({
        id: documentId,
        document_type: documentType,
        document_name: file.originalname,
        file_size: file.size,
        mime_type: file.mimetype
      });
    }
    
    // Add to verification history
    await db.run(`
      INSERT INTO kyc_verification_history (
        tenant_id, submission_id, action, performed_by, notes, metadata
      ) VALUES (?, ?, ?, ?, ?, ?)
    `, [
      req.user.tenantId,
      req.params.id,
      'documents_uploaded',
      req.user.userId,
      `${files.length} document(s) uploaded`,
      JSON.stringify({ document_count: files.length, document_types: documentTypes })
    ]);
    
    res.status(201).json({
      success: true,
      data: uploadedDocuments,
      message: `${files.length} document(s) uploaded successfully`
    });
  } catch (error) {
    console.error('Error uploading KYC documents:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get KYC templates
router.get('/templates', requireFunction('kyc', 'view'), async (req, res) => {
  try {
    const templates = await db.all(`
      SELECT * FROM kyc_templates 
      WHERE tenant_id = ? AND is_active = 1
      ORDER BY is_default DESC, template_name ASC
    `, [req.user.tenantId]);
    
    res.json({
      success: true,
      data: templates.map(template => ({
        ...template,
        required_documents: JSON.parse(template.required_documents || '[]'),
        required_fields: JSON.parse(template.required_fields || '{}'),
        validation_rules: JSON.parse(template.validation_rules || '{}'),
        risk_parameters: JSON.parse(template.risk_parameters || '{}')
      }))
    });
  } catch (error) {
    console.error('Error fetching KYC templates:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create KYC template
router.post('/templates', requireFunction('kyc', 'create'), async (req, res) => {
  try {
    const { 
      template_name, 
      template_type, 
      required_documents, 
      required_fields, 
      validation_rules, 
      risk_parameters,
      is_default 
    } = req.body;
    
    if (!template_name || !template_type || !required_documents || !required_fields) {
      return res.status(400).json({ 
        success: false, 
        error: 'Template name, type, required documents, and required fields are required' 
      });
    }
    
    const templateId = require('crypto').randomBytes(16).toString('hex');
    
    // If this is set as default, unset other defaults
    if (is_default) {
      await db.run(`
        UPDATE kyc_templates SET is_default = 0 
        WHERE tenant_id = ? AND template_type = ?
      `, [req.user.tenantId, template_type]);
    }
    
    await db.run(`
      INSERT INTO kyc_templates (
        id, tenant_id, template_name, template_type, required_documents,
        required_fields, validation_rules, risk_parameters, is_default
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      templateId,
      req.user.tenantId,
      template_name,
      template_type,
      JSON.stringify(required_documents),
      JSON.stringify(required_fields),
      JSON.stringify(validation_rules || {}),
      JSON.stringify(risk_parameters || {}),
      is_default ? 1 : 0
    ]);
    
    const template = await db.get(`
      SELECT * FROM kyc_templates WHERE id = ?
    `, [templateId]);
    
    res.status(201).json({
      success: true,
      data: {
        ...template,
        required_documents: JSON.parse(template.required_documents),
        required_fields: JSON.parse(template.required_fields),
        validation_rules: JSON.parse(template.validation_rules || '{}'),
        risk_parameters: JSON.parse(template.risk_parameters || '{}')
      }
    });
  } catch (error) {
    console.error('Error creating KYC template:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get KYC analytics
router.get('/analytics', requireFunction('kyc', 'view'), async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    let dateFilter = '';
    const params = [req.user.tenantId];
    
    if (start_date && end_date) {
      dateFilter = ' AND submitted_at BETWEEN ? AND ?';
      params.push(start_date, end_date);
    }
    
    // Status distribution
    const statusStats = await db.all(`
      SELECT verification_status, COUNT(*) as count
      FROM kyc_submissions 
      WHERE tenant_id = ?${dateFilter}
      GROUP BY verification_status
    `, params);
    
    // Risk level distribution
    const riskStats = await db.all(`
      SELECT kra.risk_level, COUNT(*) as count
      FROM kyc_risk_assessments kra
      JOIN kyc_submissions ks ON kra.submission_id = ks.id
      WHERE ks.tenant_id = ?${dateFilter}
      GROUP BY kra.risk_level
    `, params);
    
    // Processing time analytics
    const processingTimes = await db.all(`
      SELECT 
        AVG(JULIANDAY(verified_at) - JULIANDAY(submitted_at)) * 24 as avg_hours,
        verification_status
      FROM kyc_submissions 
      WHERE tenant_id = ? AND verified_at IS NOT NULL${dateFilter}
      GROUP BY verification_status
    `, params);
    
    // Monthly trends
    const monthlyTrends = await db.all(`
      SELECT 
        strftime('%Y-%m', submitted_at) as month,
        COUNT(*) as submissions,
        SUM(CASE WHEN verification_status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN verification_status = 'rejected' THEN 1 ELSE 0 END) as rejected
      FROM kyc_submissions 
      WHERE tenant_id = ?${dateFilter}
      GROUP BY strftime('%Y-%m', submitted_at)
      ORDER BY month DESC
      LIMIT 12
    `, params);
    
    res.json({
      success: true,
      data: {
        status_distribution: statusStats,
        risk_distribution: riskStats,
        processing_times: processingTimes,
        monthly_trends: monthlyTrends
      }
    });
  } catch (error) {
    console.error('Error fetching KYC analytics:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Helper functions
function calculateRiskScore(submissionData) {
  let score = 0;
  
  // Basic risk factors
  if (!submissionData.phone) score += 10;
  if (!submissionData.address) score += 15;
  if (!submissionData.employment_status) score += 10;
  if (!submissionData.income_range) score += 20;
  
  // Age-based risk
  if (submissionData.age && submissionData.age < 25) score += 15;
  if (submissionData.age && submissionData.age > 65) score += 10;
  
  // Location-based risk (simplified)
  if (submissionData.country && submissionData.country !== 'US') score += 5;
  
  return Math.min(score, 100);
}

function getRiskLevel(score) {
  if (score <= 30) return 'low';
  if (score <= 60) return 'medium';
  return 'high';
}

module.exports = router;
