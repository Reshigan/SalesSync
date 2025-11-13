const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { requireFunction, requireRole } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Configure multer for photo uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/merchandising');
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
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Get merchandising visits
router.get('/visits', requireFunction('merchandising', 'view'), async (req, res) => {
  try {
    const { page = 1, limit = 10, merchandiser_id, customer_id, status, start_date, end_date } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT 
        mv.*,
        a.name as merchandiser_name,
        c.name as customer_name,
        c.address as customer_address,
        COUNT(DISTINCT ssd.id) as shelf_share_records,
        COUNT(DISTINCT pc.id) as compliance_checks,
        COUNT(DISTINCT mp.id) as photos_count
      FROM merchandising_visits mv
      LEFT JOIN users a ON mv.merchandiser_id = a.id
      LEFT JOIN customers c ON mv.customer_id = c.id
      LEFT JOIN shelf_share_data ssd ON mv.id = ssd.visit_id
      LEFT JOIN planogram_compliance pc ON mv.id = pc.visit_id
      LEFT JOIN merchandising_photos mp ON mv.id = mp.visit_id
      WHERE mv.tenant_id = ?
    `;
    
    const params = [req.user.tenantId];
    
    if (merchandiser_id) {
      query += ' AND mv.merchandiser_id = ?';
      params.push(merchandiser_id);
    }
    
    if (customer_id) {
      query += ' AND mv.customer_id = ?';
      params.push(customer_id);
    }
    
    if (status) {
      query += ' AND mv.status = ?';
      params.push(status);
    }
    
    if (start_date && end_date) {
      query += ' AND mv.visit_date::date BETWEEN ? AND ?';
      params.push(start_date, end_date);
    }
    
    query += ' GROUP BY mv.id ORDER BY mv.visit_date DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const visits = await db.all(query, params);
    
    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM merchandising_visits WHERE tenant_id = ?';
    const countParams = [req.user.tenantId];
    
    if (merchandiser_id) {
      countQuery += ' AND merchandiser_id = ?';
      countParams.push(merchandiser_id);
    }
    
    if (customer_id) {
      countQuery += ' AND customer_id = ?';
      countParams.push(customer_id);
    }
    
    if (status) {
      countQuery += ' AND status = ?';
      countParams.push(status);
    }
    
    if (start_date && end_date) {
      countQuery += ' AND visit_date::date BETWEEN ? AND ?';
      countParams.push(start_date, end_date);
    }
    
    const { total } = await db.get(countQuery, countParams);
    
    res.json({
      success: true,
      data: visits,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching merchandising visits:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create merchandising visit
router.post('/visits', requireFunction('merchandising', 'create'), async (req, res) => {
  try {
    const { merchandiser_id, customer_id, visit_type, notes } = req.body;
    
    if (!merchandiser_id || !customer_id || !visit_type) {
      return res.status(400).json({ 
        success: false, 
        error: 'Merchandiser ID, Customer ID, and visit type are required' 
      });
    }
    
    const visitId = require('crypto').randomBytes(16).toString('hex');
    
    await db.run(`
      INSERT INTO merchandising_visits (
        id, tenant_id, merchandiser_id, customer_id, visit_type, notes
      ) VALUES (?, ?, ?, ?, ?, ?)
    `, [
      visitId,
      req.user.tenantId,
      merchandiser_id,
      customer_id,
      visit_type,
      notes
    ]);
    
    const visit = await db.get(`
      SELECT 
        mv.*,
        a.name as merchandiser_name,
        c.name as customer_name
      FROM merchandising_visits mv
      LEFT JOIN users a ON mv.merchandiser_id = a.id
      LEFT JOIN customers c ON mv.customer_id = c.id
      WHERE mv.id = ?
    `, [visitId]);
    
    res.status(201).json({
      success: true,
      data: visit
    });
  } catch (error) {
    console.error('Error creating merchandising visit:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get specific visit details
router.get('/visits/:id', requireFunction('merchandising', 'view'), async (req, res) => {
  try {
    const visit = await db.get(`
      SELECT 
        mv.*,
        a.name as merchandiser_name,
        c.name as customer_name,
        c.address as customer_address
      FROM merchandising_visits mv
      LEFT JOIN users a ON mv.merchandiser_id = a.id
      LEFT JOIN customers c ON mv.customer_id = c.id
      WHERE mv.id = ? AND mv.tenant_id = ?
    `, [req.params.id, req.user.tenantId]);
    
    if (!visit) {
      return res.status(404).json({ success: false, error: 'Visit not found' });
    }
    
    // Get shelf share data
    const shelfShareData = await db.all(`
      SELECT 
        ssd.*,
        p.name as product_name,
        p.sku,
        c.name as category_name
      FROM shelf_share_data ssd
      LEFT JOIN products p ON ssd.product_id = p.id
      LEFT JOIN categories c ON ssd.category_id = c.id
      WHERE ssd.visit_id = ? AND ssd.tenant_id = ?
      ORDER BY ssd.recorded_at DESC
    `, [req.params.id, req.user.tenantId]);
    
    // Get competitor data
    const competitorData = await db.all(`
      SELECT 
        csd.*,
        cp.competitor_name,
        cp.product_name,
        cp.brand_name
      FROM competitor_shelf_data csd
      LEFT JOIN competitor_products cp ON csd.competitor_product_id = cp.id
      WHERE csd.visit_id = ? AND csd.tenant_id = ?
      ORDER BY csd.recorded_at DESC
    `, [req.params.id, req.user.tenantId]);
    
    // Get planogram compliance
    const compliance = await db.all(`
      SELECT 
        pc.*,
        p.planogram_name
      FROM planogram_compliance pc
      LEFT JOIN planograms p ON pc.planogram_id = p.id
      WHERE pc.visit_id = ? AND pc.tenant_id = ?
      ORDER BY pc.assessed_at DESC
    `, [req.params.id, req.user.tenantId]);
    
    // Get KPIs
    const kpis = await db.all(`
      SELECT * FROM merchandising_kpis
      WHERE visit_id = ? AND tenant_id = ?
      ORDER BY recorded_at DESC
    `, [req.params.id, req.user.tenantId]);
    
    // Get photos
    const photos = await db.all(`
      SELECT * FROM merchandising_photos
      WHERE visit_id = ? AND tenant_id = ?
      ORDER BY uploaded_at DESC
    `, [req.params.id, req.user.tenantId]);
    
    // Get price monitoring
    const priceData = await db.all(`
      SELECT 
        pm.*,
        p.name as product_name,
        p.sku
      FROM price_monitoring pm
      LEFT JOIN products p ON pm.product_id = p.id
      WHERE pm.visit_id = ? AND pm.tenant_id = ?
      ORDER BY pm.recorded_at DESC
    `, [req.params.id, req.user.tenantId]);
    
    res.json({
      success: true,
      data: {
        ...visit,
        shelf_share_data: shelfShareData,
        competitor_data: competitorData.map(cd => ({
          ...cd,
          promotional_activity: cd.promotional_activity ? JSON.parse(cd.promotional_activity) : []
        })),
        compliance: compliance.map(c => ({
          ...c,
          compliance_details: c.compliance_details ? JSON.parse(c.compliance_details) : {},
          non_compliance_issues: c.non_compliance_issues ? JSON.parse(c.non_compliance_issues) : [],
          corrective_actions: c.corrective_actions ? JSON.parse(c.corrective_actions) : []
        })),
        kpis,
        photos: photos.map(p => ({
          ...p,
          metadata: p.metadata ? JSON.parse(p.metadata) : {}
        })),
        price_data: priceData
      }
    });
  } catch (error) {
    console.error('Error fetching visit details:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Record shelf share data
router.post('/visits/:id/shelf-share', requireFunction('merchandising', 'create'), async (req, res) => {
  try {
    const { shelf_data } = req.body;
    
    if (!shelf_data || !Array.isArray(shelf_data)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Shelf data array is required' 
      });
    }
    
    const recordedData = [];
    
    for (const data of shelf_data) {
      const {
        product_id,
        category_id,
        shelf_space_cm,
        total_category_space_cm,
        position_level,
        position_order,
        facing_count,
        stock_level,
        price,
        promotional_activity
      } = data;
      
      if (!product_id || !shelf_space_cm || !total_category_space_cm) {
        continue; // Skip invalid records
      }
      
      const recordId = require('crypto').randomBytes(16).toString('hex');
      
      await db.run(`
        INSERT INTO shelf_share_data (
          id, tenant_id, visit_id, product_id, category_id, shelf_space_cm,
          total_category_space_cm, position_level, position_order, facing_count,
          stock_level, price, promotional_activity
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        recordId,
        req.user.tenantId,
        req.params.id,
        product_id,
        category_id,
        shelf_space_cm,
        total_category_space_cm,
        position_level,
        position_order,
        facing_count,
        stock_level,
        price,
        promotional_activity ? JSON.stringify(promotional_activity) : null
      ]);
      
      recordedData.push({ id: recordId, ...data });
    }
    
    res.status(201).json({
      success: true,
      data: recordedData,
      message: `${recordedData.length} shelf share records created`
    });
  } catch (error) {
    console.error('Error recording shelf share data:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get shelf share analytics
router.get('/analytics/shelf-share', requireFunction('merchandising', 'view'), async (req, res) => {
  try {
    const { start_date, end_date, category_id, product_id } = req.query;
    
    let dateFilter = '';
    let params = [req.user.tenantId];
    
    if (start_date && end_date) {
      dateFilter = ' AND mv.visit_date::date BETWEEN ? AND ?';
      params.push(start_date, end_date);
    }
    
    // Overall shelf share by category
    let categoryQuery = `
      SELECT 
        c.name as category_name,
        AVG(ssd.shelf_share_percentage) as avg_shelf_share,
        COUNT(ssd.id) as measurement_count,
        SUM(ssd.shelf_space_cm) as total_shelf_space
      FROM shelf_share_data ssd
      JOIN merchandising_visits mv ON ssd.visit_id = mv.id
      LEFT JOIN categories c ON ssd.category_id = c.id
      WHERE ssd.tenant_id = ?${dateFilter}
    `;
    
    if (category_id) {
      categoryQuery += ' AND ssd.category_id = ?';
      params.push(category_id);
    }
    
    categoryQuery += ' GROUP BY ssd.category_id ORDER BY avg_shelf_share DESC';
    
    const categoryData = await db.all(categoryQuery, params);
    
    // Product performance
    let productQuery = `
      SELECT 
        p.name as product_name,
        p.sku,
        AVG(ssd.shelf_share_percentage) as avg_shelf_share,
        AVG(ssd.facing_count) as avg_facing_count,
        COUNT(ssd.id) as measurement_count,
        c.name as category_name
      FROM shelf_share_data ssd
      JOIN merchandising_visits mv ON ssd.visit_id = mv.id
      LEFT JOIN products p ON ssd.product_id = p.id
      LEFT JOIN categories c ON ssd.category_id = c.id
      WHERE ssd.tenant_id = ?${dateFilter}
    `;
    
    const productParams = [...params];
    
    if (product_id) {
      productQuery += ' AND ssd.product_id = ?';
      productParams.push(product_id);
    }
    
    productQuery += ' GROUP BY ssd.product_id ORDER BY avg_shelf_share DESC LIMIT 20';
    
    const productData = await db.all(productQuery, productParams);
    
    // Position analysis
    const positionAnalysis = await db.all(`
      SELECT 
        position_level,
        AVG(shelf_share_percentage) as avg_shelf_share,
        COUNT(*) as count
      FROM shelf_share_data ssd
      JOIN merchandising_visits mv ON ssd.visit_id = mv.id
      WHERE ssd.tenant_id = ?${dateFilter}
      AND position_level IS NOT NULL
      GROUP BY position_level
      ORDER BY avg_shelf_share DESC
    `, params);
    
    // Trend analysis
    const trendAnalysis = await db.all(`
      SELECT 
        mv.visit_date::date as visit_date,
        AVG(ssd.shelf_share_percentage) as avg_shelf_share,
        COUNT(DISTINCT mv.customer_id) as stores_visited
      FROM shelf_share_data ssd
      JOIN merchandising_visits mv ON ssd.visit_id = mv.id
      WHERE ssd.tenant_id = ?${dateFilter}
      GROUP BY mv.visit_date::date
      ORDER BY visit_date DESC
      LIMIT 30
    `, params);
    
    res.json({
      success: true,
      data: {
        category_performance: categoryData,
        product_performance: productData,
        position_analysis: positionAnalysis,
        trend_analysis: trendAnalysis
      }
    });
  } catch (error) {
    console.error('Error fetching shelf share analytics:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get competitor analysis
router.get('/analytics/competitors', requireFunction('merchandising', 'view'), async (req, res) => {
  try {
    const { start_date, end_date, competitor_name } = req.query;
    
    let dateFilter = '';
    let params = [req.user.tenantId];
    
    if (start_date && end_date) {
      dateFilter = ' AND mv.visit_date::date BETWEEN ? AND ?';
      params.push(start_date, end_date);
    }
    
    // Competitor market share
    let competitorQuery = `
      SELECT 
        cp.competitor_name,
        AVG(csd.shelf_space_cm) as avg_shelf_space,
        COUNT(csd.id) as presence_count,
        AVG(csd.price) as avg_price,
        COUNT(DISTINCT mv.customer_id) as store_presence
      FROM competitor_shelf_data csd
      JOIN merchandising_visits mv ON csd.visit_id = mv.id
      JOIN competitor_products cp ON csd.competitor_product_id = cp.id
      WHERE csd.tenant_id = ?${dateFilter}
    `;
    
    if (competitor_name) {
      competitorQuery += ' AND cp.competitor_name = ?';
      params.push(competitor_name);
    }
    
    competitorQuery += ' GROUP BY cp.competitor_name ORDER BY avg_shelf_space DESC';
    
    const competitorData = await db.all(competitorQuery, params);
    
    // Price comparison
    const priceComparison = await db.all(`
      SELECT 
        cp.competitor_name,
        cp.product_name,
        AVG(csd.price) as avg_competitor_price,
        COUNT(csd.id) as price_points
      FROM competitor_shelf_data csd
      JOIN merchandising_visits mv ON csd.visit_id = mv.id
      JOIN competitor_products cp ON csd.competitor_product_id = cp.id
      WHERE csd.tenant_id = ?${dateFilter}
      AND csd.price IS NOT NULL
      GROUP BY cp.competitor_name, cp.product_name
      ORDER BY cp.competitor_name, avg_competitor_price DESC
    `, params);
    
    res.json({
      success: true,
      data: {
        competitor_performance: competitorData,
        price_comparison: priceComparison
      }
    });
  } catch (error) {
    console.error('Error fetching competitor analytics:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Upload merchandising photos
router.post('/visits/:id/photos', requireFunction('merchandising', 'create'), upload.array('photos', 10), async (req, res) => {
  try {
    const { photo_types, descriptions } = req.body;
    const files = req.files;
    
    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, error: 'No photos uploaded' });
    }
    
    const photoTypes = Array.isArray(photo_types) ? photo_types : [photo_types];
    const photoDescriptions = Array.isArray(descriptions) ? descriptions : [descriptions];
    
    const uploadedPhotos = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const photoType = photoTypes[i] || 'general';
      const description = photoDescriptions[i] || '';
      
      const photoId = require('crypto').randomBytes(16).toString('hex');
      
      await db.run(`
        INSERT INTO merchandising_photos (
          id, tenant_id, visit_id, photo_type, file_path, file_name,
          file_size, description
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        photoId,
        req.user.tenantId,
        req.params.id,
        photoType,
        file.path,
        file.originalname,
        file.size,
        description
      ]);
      
      uploadedPhotos.push({
        id: photoId,
        photo_type: photoType,
        file_name: file.originalname,
        description
      });
    }
    
    res.status(201).json({
      success: true,
      data: uploadedPhotos,
      message: `${files.length} photo(s) uploaded successfully`
    });
  } catch (error) {
    console.error('Error uploading merchandising photos:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Complete visit
router.put('/visits/:id/complete', requireFunction('merchandising', 'edit'), async (req, res) => {
  try {
    const { duration_minutes, notes } = req.body;
    
    await db.run(`
      UPDATE merchandising_visits 
      SET status = 'completed', completed_at = CURRENT_TIMESTAMP, duration_minutes = ?, notes = ?
      WHERE id = ? AND tenant_id = ?
    `, [duration_minutes, notes, req.params.id, req.user.tenantId]);
    
    res.json({ success: true, message: 'Visit completed successfully' });
  } catch (error) {
    console.error('Error completing visit:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get merchandising dashboard
router.get('/dashboard', requireFunction('merchandising', 'view'), async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    let dateFilter = '';
    let params = [req.user.tenantId];
    
    if (start_date && end_date) {
      dateFilter = ' AND visit_date::date BETWEEN ? AND ?';
      params.push(start_date, end_date);
    }
    
    // Visit statistics
    const visitStats = await db.get(`
      SELECT 
        COUNT(*) as total_visits,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_visits,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_visits,
        AVG(duration_minutes) as avg_duration_minutes
      FROM merchandising_visits 
      WHERE tenant_id = ?${dateFilter}
    `, params);
    
    // Top performing products by shelf share
    const topProducts = await db.all(`
      SELECT 
        p.name as product_name,
        AVG(ssd.shelf_share_percentage) as avg_shelf_share,
        COUNT(ssd.id) as measurement_count
      FROM shelf_share_data ssd
      JOIN merchandising_visits mv ON ssd.visit_id = mv.id
      LEFT JOIN products p ON ssd.product_id = p.id
      WHERE ssd.tenant_id = ?${dateFilter}
      GROUP BY ssd.product_id
      ORDER BY avg_shelf_share DESC
      LIMIT 10
    `, params);
    
    // Compliance overview
    const complianceOverview = await db.get(`
      SELECT 
        AVG(overall_compliance_score) as avg_compliance_score,
        COUNT(*) as total_assessments,
        COUNT(CASE WHEN overall_compliance_score >= 80 THEN 1 END) as high_compliance_count
      FROM planogram_compliance pc
      JOIN merchandising_visits mv ON pc.visit_id = mv.id
      WHERE pc.tenant_id = ?${dateFilter}
    `, params);
    
    // Recent activities
    const recentActivities = await db.all(`
      SELECT 
        mv.id,
        mv.visit_type,
        mv.visit_date,
        mv.status,
        a.name as merchandiser_name,
        c.name as customer_name
      FROM merchandising_visits mv
      LEFT JOIN users a ON mv.merchandiser_id = a.id
      LEFT JOIN customers c ON mv.customer_id = c.id
      WHERE mv.tenant_id = ?${dateFilter}
      ORDER BY mv.visit_date DESC
      LIMIT 10
    `, params);
    
    res.json({
      success: true,
      data: {
        visit_statistics: visitStats,
        top_products: topProducts,
        compliance_overview: complianceOverview,
        recent_activities: recentActivities
      }
    });
  } catch (error) {
    console.error('Error fetching merchandising dashboard:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
