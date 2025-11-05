/**
 * Brand Pictures API Routes
 * Handles brand picture upload, versioning, and comparison
 */

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { getDatabase } = require('../database/queries');

router.get('/', authenticateToken, async (req, res) => {
  try {
    const db = getDatabase();
    const tenantId = req.user.tenantId;
    
    const pictures = db.prepare(`
      SELECT 
        bp.*,
        b.name as brand_name
      FROM brand_pictures bp
      LEFT JOIN brands b ON bp.brand_id = b.id
      WHERE bp.tenant_id = ?
      ORDER BY bp.created_at DESC
    `).all(tenantId);

    res.json({
      success: true,
      data: pictures
    });
  } catch (error) {
    console.error('Error fetching brand pictures:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch brand pictures'
    });
  }
});

router.get('/brand/:brandId', authenticateToken, async (req, res) => {
  try {
    const db = getDatabase();
    const tenantId = req.user.tenantId;
    const { brandId } = req.params;
    
    const pictures = db.prepare(`
      SELECT *
      FROM brand_pictures
      WHERE tenant_id = ? AND brand_id = ?
      ORDER BY version DESC, created_at DESC
    `).all(tenantId, brandId);

    res.json({
      success: true,
      data: pictures
    });
  } catch (error) {
    console.error('Error fetching brand pictures:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch brand pictures'
    });
  }
});

router.get('/active/:pictureType', authenticateToken, async (req, res) => {
  try {
    const db = getDatabase();
    const tenantId = req.user.tenantId;
    const { pictureType } = req.params;
    
    const pictures = db.prepare(`
      SELECT 
        bp.*,
        b.name as brand_name
      FROM brand_pictures bp
      LEFT JOIN brands b ON bp.brand_id = b.id
      WHERE bp.tenant_id = ? 
        AND bp.picture_type = ?
        AND bp.is_active = 1
        AND (bp.valid_to IS NULL OR bp.valid_to >= DATE('now'))
      ORDER BY b.name, bp.version DESC
    `).all(tenantId, pictureType);

    res.json({
      success: true,
      data: pictures
    });
  } catch (error) {
    console.error('Error fetching active brand pictures:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch active brand pictures'
    });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const db = getDatabase();
    const tenantId = req.user.tenantId;
    const userId = req.user.userId;
    
    const {
      brand_id,
      picture_url,
      picture_type,
      valid_from,
      metadata
    } = req.body;

    // Validate required fields
    if (!brand_id || !picture_url || !picture_type) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: brand_id, picture_url, picture_type'
      });
    }

    const validTypes = ['logo', 'board', 'product', 'storefront', 'shelf'];
    if (!validTypes.includes(picture_type)) {
      return res.status(400).json({
        success: false,
        error: `Invalid picture_type. Must be one of: ${validTypes.join(', ')}`
      });
    }

    const currentVersion = db.prepare(`
      SELECT MAX(version) as max_version
      FROM brand_pictures
      WHERE tenant_id = ? AND brand_id = ? AND picture_type = ?
    `).get(tenantId, brand_id, picture_type);

    const version = (currentVersion?.max_version || 0) + 1;

    const pictureId = require('crypto').randomBytes(16).toString('hex');
    
    db.prepare(`
      INSERT INTO brand_pictures (
        id, tenant_id, brand_id, picture_url, picture_type, version,
        is_active, valid_from, metadata, created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).run(
      pictureId,
      tenantId,
      brand_id,
      picture_url,
      picture_type,
      version,
      1, // is_active
      valid_from || new Date().toISOString().split('T')[0],
      metadata ? JSON.stringify(metadata) : null,
      userId
    );

    const picture = db.prepare(`
      SELECT * FROM brand_pictures WHERE id = ?
    `).get(pictureId);

    res.json({
      success: true,
      data: picture
    });
  } catch (error) {
    console.error('Error uploading brand picture:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload brand picture'
    });
  }
});

router.put('/:id/deactivate', authenticateToken, async (req, res) => {
  try {
    const db = getDatabase();
    const tenantId = req.user.tenantId;
    const { id } = req.params;

    db.prepare(`
      UPDATE brand_pictures
      SET is_active = 0, valid_to = DATE('now'), updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND tenant_id = ?
    `).run(id, tenantId);

    const picture = db.prepare(`
      SELECT * FROM brand_pictures WHERE id = ?
    `).get(id);

    res.json({
      success: true,
      data: picture
    });
  } catch (error) {
    console.error('Error deactivating brand picture:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to deactivate brand picture'
    });
  }
});

router.get('/comparisons', authenticateToken, async (req, res) => {
  try {
    const db = getDatabase();
    const tenantId = req.user.tenantId;
    const { comparison_type, related_entity_type, related_entity_id } = req.query;
    
    let query = `
      SELECT 
        pcr.*,
        bp.brand_id,
        bp.picture_type,
        b.name as brand_name
      FROM picture_comparison_results pcr
      LEFT JOIN brand_pictures bp ON pcr.reference_picture_id = bp.id
      LEFT JOIN brands b ON bp.brand_id = b.id
      WHERE pcr.tenant_id = ?
    `;
    
    const params = [tenantId];
    
    if (comparison_type) {
      query += ` AND pcr.comparison_type = ?`;
      params.push(comparison_type);
    }
    
    if (related_entity_type) {
      query += ` AND pcr.related_entity_type = ?`;
      params.push(related_entity_type);
    }
    
    if (related_entity_id) {
      query += ` AND pcr.related_entity_id = ?`;
      params.push(related_entity_id);
    }
    
    query += ` ORDER BY pcr.analyzed_at DESC`;
    
    const results = db.prepare(query).all(...params);

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Error fetching comparison results:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch comparison results'
    });
  }
});

router.post('/compare', authenticateToken, async (req, res) => {
  try {
    const db = getDatabase();
    const tenantId = req.user.tenantId;
    
    const {
      reference_picture_id,
      captured_picture_url,
      comparison_type,
      related_entity_type,
      related_entity_id
    } = req.body;

    // Validate required fields
    if (!reference_picture_id || !captured_picture_url || !comparison_type) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: reference_picture_id, captured_picture_url, comparison_type'
      });
    }

    const referencePicture = db.prepare(`
      SELECT * FROM brand_pictures WHERE id = ? AND tenant_id = ?
    `).get(reference_picture_id, tenantId);

    if (!referencePicture) {
      return res.status(404).json({
        success: false,
        error: 'Reference picture not found'
      });
    }

    const similarityScore = 0.7 + (Math.random() * 0.3); // 70-100%
    const coveragePercentage = 60 + (Math.random() * 40); // 60-100%
    const complianceStatus = coveragePercentage >= 80 ? 'compliant' : 
                            coveragePercentage >= 60 ? 'partial' : 'non_compliant';

    const brand = db.prepare(`
      SELECT * FROM brands WHERE id = ?
    `).get(referencePicture.brand_id);

    const analysisMetadata = {
      detected_brands: [brand.name],
      colors: ['#FF0000'], // Simulated
      dimensions: { width: 1920, height: 1080 },
      issues: coveragePercentage < 80 ? ['Coverage below 80%'] : [],
      detection_confidence: similarityScore,
      algorithm: 'simulated_v1',
      processing_time_ms: 150
    };

    const comparisonId = require('crypto').randomBytes(16).toString('hex');
    
    db.prepare(`
      INSERT INTO picture_comparison_results (
        id, tenant_id, reference_picture_id, captured_picture_url, comparison_type,
        similarity_score, coverage_percentage, compliance_status, analysis_metadata,
        related_entity_type, related_entity_id, analyzed_at, analyzed_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, CURRENT_TIMESTAMP)
    `).run(
      comparisonId,
      tenantId,
      reference_picture_id,
      captured_picture_url,
      comparison_type,
      similarityScore,
      coveragePercentage,
      complianceStatus,
      JSON.stringify(analysisMetadata),
      related_entity_type || null,
      related_entity_id || null,
      'system'
    );

    const result = db.prepare(`
      SELECT 
        pcr.*,
        bp.brand_id,
        bp.picture_type,
        b.name as brand_name
      FROM picture_comparison_results pcr
      LEFT JOIN brand_pictures bp ON pcr.reference_picture_id = bp.id
      LEFT JOIN brands b ON bp.brand_id = b.id
      WHERE pcr.id = ?
    `).get(comparisonId);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error comparing pictures:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to compare pictures'
    });
  }
});

module.exports = router;
