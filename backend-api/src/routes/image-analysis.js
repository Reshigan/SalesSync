/**
 * Image Analysis API Routes
 * Provides endpoints for analyzing board placement images, coverage calculation,
 * and brand compliance checking
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const imageAnalytics = require('../utils/imageAnalytics');
const { runQuery, getOneQuery } = require('../utils/database');

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/images');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'));
    }
  }
});

/**
 * @swagger
 * /api/image-analysis/board-coverage:
 *   post:
 *     summary: Analyze board placement image for coverage percentage
 *     tags: [Image Analysis]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *               brand_id:
 *                 type: string
 *               customer_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Analysis results
 */
router.post('/board-coverage', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file provided'
      });
    }

    const { brand_id, customer_id } = req.body;
    const tenantId = req.tenantId;
    const imagePath = req.file.path;

    // Get brand configuration if provided
    let brandConfig = {};
    if (brand_id) {
      const brand = await getOneQuery(
        `SELECT * FROM brands WHERE id = ? AND tenant_id = ?`,
        [brand_id, tenantId]
      );
      if (brand) {
        brandConfig = {
          name: brand.name,
          primaryColor: brand.primary_color,
          requiredColors: brand.brand_colors ? JSON.parse(brand.brand_colors) : null,
          logoRequired: brand.logo_required || false
        };
      }
    }

    // Perform image analysis
    const analysisResults = await imageAnalytics.analyzeBoardCoverage(imagePath, brandConfig);

    // Store analysis results in database
    const analysisId = uuidv4();
    const timestamp = new Date().toISOString();

    await runQuery(`
      INSERT INTO image_analytics (
        id, tenant_id, image_url, image_type, analysis_type,
        coverage_percentage, quality_score, brand_compliance_score,
        analysis_data, customer_id, brand_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      analysisId,
      tenantId,
      `/uploads/images/${req.file.filename}`,
      'board_placement',
      'coverage',
      analysisResults.boardCoverage || 0,
      analysisResults.imageQuality || 0,
      analysisResults.brandCompliance?.score || 0,
      JSON.stringify(analysisResults),
      customer_id || null,
      brand_id || null,
      timestamp
    ]);

    res.json({
      success: true,
      data: {
        analysisId,
        coverage: analysisResults.boardCoverage,
        coverageLabel: getCoverageLabel(analysisResults.boardCoverage),
        imageQuality: analysisResults.imageQuality,
        brandCompliance: analysisResults.brandCompliance,
        metadata: analysisResults.metadata,
        analysis: analysisResults.analysis,
        imageUrl: `/uploads/images/${req.file.filename}`
      }
    });

  } catch (error) {
    console.error('Error analyzing board coverage:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze image',
      details: error.message
    });
  }
});

/**
 * @swagger
 * /api/image-analysis/quality-check:
 *   post:
 *     summary: Check image quality (brightness, sharpness, etc.)
 *     tags: [Image Analysis]
 */
router.post('/quality-check', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file provided'
      });
    }

    const imagePath = req.file.path;
    const imageBuffer = await fs.readFile(imagePath);
    const sharp = require('sharp');
    const metadata = await sharp(imageBuffer).metadata();

    // Perform quality checks
    const qualityResults = await imageAnalytics.performQualityChecks(imageBuffer, metadata);

    res.json({
      success: true,
      data: {
        passed: qualityResults.passed,
        score: qualityResults.score,
        issues: qualityResults.issues,
        metrics: qualityResults.metrics,
        recommendations: getQualityRecommendations(qualityResults)
      }
    });

  } catch (error) {
    console.error('Error checking image quality:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check image quality',
      details: error.message
    });
  }
});

/**
 * @swagger
 * /api/image-analysis/brand-compliance:
 *   post:
 *     summary: Check brand compliance in image
 *     tags: [Image Analysis]
 */
router.post('/brand-compliance', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file provided'
      });
    }

    const { brand_id } = req.body;
    const tenantId = req.tenantId;
    const imagePath = req.file.path;

    // Get brand configuration
    let brandConfig = {};
    if (brand_id) {
      const brand = await getOneQuery(
        `SELECT * FROM brands WHERE id = ? AND tenant_id = ?`,
        [brand_id, tenantId]
      );
      if (brand) {
        brandConfig = {
          name: brand.name,
          primaryColor: brand.primary_color,
          requiredColors: brand.brand_colors ? JSON.parse(brand.brand_colors) : null,
          logoRequired: brand.logo_required || false
        };
      }
    }

    const imageBuffer = await fs.readFile(imagePath);
    const complianceResults = await imageAnalytics.checkBrandCompliance(imageBuffer, brandConfig);

    res.json({
      success: true,
      data: {
        score: complianceResults.score,
        passed: complianceResults.score >= 70,
        checks: complianceResults.checks,
        issues: complianceResults.issues
      }
    });

  } catch (error) {
    console.error('Error checking brand compliance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check brand compliance',
      details: error.message
    });
  }
});

/**
 * @swagger
 * /api/image-analysis/batch:
 *   post:
 *     summary: Analyze multiple images in batch
 *     tags: [Image Analysis]
 */
router.post('/batch', upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No image files provided'
      });
    }

    const { brand_id, customer_id } = req.body;
    const tenantId = req.tenantId;

    // Get brand configuration
    let brandConfig = {};
    if (brand_id) {
      const brand = await getOneQuery(
        `SELECT * FROM brands WHERE id = ? AND tenant_id = ?`,
        [brand_id, tenantId]
      );
      if (brand) {
        brandConfig = {
          name: brand.name,
          primaryColor: brand.primary_color,
          requiredColors: brand.brand_colors ? JSON.parse(brand.brand_colors) : null,
          logoRequired: brand.logo_required || false
        };
      }
    }

    // Process all images
    const results = await Promise.all(
      req.files.map(async (file) => {
        try {
          const analysisResults = await imageAnalytics.analyzeBoardCoverage(file.path, brandConfig);
          
          // Store in database
          const analysisId = uuidv4();
          const timestamp = new Date().toISOString();

          await runQuery(`
            INSERT INTO image_analytics (
              id, tenant_id, image_url, image_type, analysis_type,
              coverage_percentage, quality_score, brand_compliance_score,
              analysis_data, customer_id, brand_id, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            analysisId,
            tenantId,
            `/uploads/images/${file.filename}`,
            'board_placement',
            'coverage',
            analysisResults.boardCoverage || 0,
            analysisResults.imageQuality || 0,
            analysisResults.brandCompliance?.score || 0,
            JSON.stringify(analysisResults),
            customer_id || null,
            brand_id || null,
            timestamp
          ]);

          return {
            filename: file.originalname,
            analysisId,
            success: true,
            coverage: analysisResults.boardCoverage,
            coverageLabel: getCoverageLabel(analysisResults.boardCoverage),
            imageQuality: analysisResults.imageQuality,
            imageUrl: `/uploads/images/${file.filename}`
          };
        } catch (error) {
          return {
            filename: file.originalname,
            success: false,
            error: error.message
          };
        }
      })
    );

    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    res.json({
      success: true,
      data: {
        total: results.length,
        successful: successful.length,
        failed: failed.length,
        results
      }
    });

  } catch (error) {
    console.error('Error in batch analysis:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process batch analysis',
      details: error.message
    });
  }
});

/**
 * @swagger
 * /api/image-analysis/history:
 *   get:
 *     summary: Get image analysis history
 *     tags: [Image Analysis]
 */
router.get('/history', async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { customer_id, brand_id, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT ia.*, 
        c.name as customer_name,
        b.name as brand_name
      FROM image_analytics ia
      LEFT JOIN customers c ON ia.customer_id = c.id
      LEFT JOIN brands b ON ia.brand_id = b.id
      WHERE ia.tenant_id = ?
    `;
    const params = [tenantId];

    if (customer_id) {
      query += ` AND ia.customer_id = ?`;
      params.push(customer_id);
    }

    if (brand_id) {
      query += ` AND ia.brand_id = ?`;
      params.push(brand_id);
    }

    query += ` ORDER BY ia.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const { getQuery } = require('../utils/database');
    const history = await getQuery(query, params);

    res.json({
      success: true,
      data: history.map(item => ({
        ...item,
        analysis_data: item.analysis_data ? JSON.parse(item.analysis_data) : null
      }))
    });

  } catch (error) {
    console.error('Error fetching analysis history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analysis history'
    });
  }
});

/**
 * Helper function to get coverage label
 */
function getCoverageLabel(coverage) {
  if (coverage === null || coverage === undefined) return 'Unknown';
  if (coverage >= 70) return 'Excellent';
  if (coverage >= 40) return 'Good';
  if (coverage >= 20) return 'Fair';
  return 'Poor';
}

/**
 * Helper function to get quality recommendations
 */
function getQualityRecommendations(qualityResults) {
  const recommendations = [];
  
  if (qualityResults.metrics?.brightness < 30) {
    recommendations.push('Image is too dark. Try taking the photo in better lighting conditions.');
  }
  if (qualityResults.metrics?.brightness > 220) {
    recommendations.push('Image is overexposed. Avoid direct sunlight or reduce flash.');
  }
  if (qualityResults.metrics?.sharpness < 0.3) {
    recommendations.push('Image appears blurry. Hold the camera steady and ensure the subject is in focus.');
  }
  if (qualityResults.issues?.includes('Image width too small')) {
    recommendations.push('Image resolution is too low. Use a higher quality camera setting.');
  }
  
  return recommendations;
}

module.exports = router;
