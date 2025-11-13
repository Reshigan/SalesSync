const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authMiddleware } = require('../middleware/authMiddleware');

// ============================================
// TRADE MARKETING ROUTES
// ============================================

// Create Store Visit (Check-in)
router.post('/visits', authMiddleware, async (req, res) => {
  try {
    const {
      storeId,
      visitType,
      checkInLatitude,
      checkInLongitude,
      entrancePhotoUrl,
      storeTraffic,
      storeCleanliness
    } = req.body;
    
    const visitCode = `TM-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    const result = await db.run(
      `INSERT INTO trade_marketing_visits (
        visit_code, agent_id, store_id, visit_type, visit_status,
        check_in_time, check_in_latitude, check_in_longitude,
        entrance_photo_url, store_traffic, store_cleanliness
      ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?, ?, ?, ?)`,
      [
        visitCode, req.user.id, storeId, visitType, 'in_progress',
        checkInLatitude, checkInLongitude, entrancePhotoUrl,
        storeTraffic, storeCleanliness
      ]
    );
    
    const visit = await db.get(
      `SELECT tmv.*, c.name as store_name, c.code as store_code
       FROM trade_marketing_visits tmv
       JOIN customers c ON tmv.store_id = c.id
       WHERE tmv.id = ?`,
      [result.lastID]
    );
    
    res.status(201).json({ visit });
  } catch (error) {
    console.error('Create trade visit error:', error);
    res.status(500).json({ error: 'Failed to create visit' });
  }
});

// Get Agent's Trade Visits
router.get('/visits', authMiddleware, async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;
    
    let sql = `
      SELECT tmv.*, c.name as store_name, c.code as store_code, c.address
      FROM trade_marketing_visits tmv
      JOIN customers c ON tmv.store_id = c.id
      WHERE tmv.agent_id = ?
    `;
    
    const params = [req.user.id];
    
    if (status) {
      sql += ` AND tmv.visit_status = ?`;
      params.push(status);
    }
    
    if (startDate) {
      sql += ` AND tmv.check_in_time::date >= ?`;
      params.push(startDate);
    }
    
    if (endDate) {
      sql += ` AND tmv.check_in_time::date <= ?`;
      params.push(endDate);
    }
    
    sql += ` ORDER BY tmv.check_in_time DESC LIMIT 100`;
    
    const visits = await db.all(sql, params);
    
    res.json({ visits });
  } catch (error) {
    console.error('Get trade visits error:', error);
    res.status(500).json({ error: 'Failed to fetch visits' });
  }
});

// Get Visit Details
router.get('/visits/:id', authMiddleware, async (req, res) => {
  try {
    const visit = await db.get(
      `SELECT tmv.*, c.name as store_name, c.code as store_code,
              c.address, c.phone
       FROM trade_marketing_visits tmv
       JOIN customers c ON tmv.store_id = c.id
       WHERE tmv.id = ? AND tmv.agent_id = ?`,
      [req.params.id, req.user.id]
    );
    
    if (!visit) {
      return res.status(404).json({ error: 'Visit not found' });
    }
    
    // Get shelf analytics
    const shelfAnalytics = await db.all(
      'SELECT * FROM shelf_analytics WHERE visit_id = ?',
      [req.params.id]
    );
    
    // Get SKU availability
    const skuAvailability = await db.all(
      `SELECT sa.*, p.name as product_name, p.sku
       FROM sku_availability sa
       JOIN products p ON sa.product_id = p.id
       WHERE sa.visit_id = ?`,
      [req.params.id]
    );
    
    // Get POS material tracking
    const posMaterials = await db.all(
      `SELECT pmt.*, pm.material_name, pm.material_type
       FROM pos_material_tracking pmt
       JOIN pos_materials pm ON pmt.material_id = pm.id
       WHERE pmt.visit_id = ?`,
      [req.params.id]
    );
    
    // Get brand activations
    const brandActivations = await db.all(
      `SELECT ba.*, c.campaign_name
       FROM brand_activations ba
       JOIN campaigns c ON ba.campaign_id = c.id
       WHERE ba.visit_id = ?`,
      [req.params.id]
    );
    
    res.json({
      visit,
      shelfAnalytics,
      skuAvailability,
      posMaterials,
      brandActivations
    });
  } catch (error) {
    console.error('Get visit details error:', error);
    res.status(500).json({ error: 'Failed to fetch visit details' });
  }
});

// Complete Visit (Check-out)
router.put('/visits/:id/complete', authMiddleware, async (req, res) => {
  try {
    const { checkOutLatitude, checkOutLongitude, exitPhotoUrl, visitNotes } = req.body;
    
    await db.run(
      `UPDATE trade_marketing_visits 
       SET visit_status = 'completed', 
           check_out_time = CURRENT_TIMESTAMP,
           check_out_latitude = ?,
           check_out_longitude = ?,
           exit_photo_url = ?,
           visit_notes = ?,
           submitted_at = CURRENT_TIMESTAMP
       WHERE id = ? AND agent_id = ?`,
      [checkOutLatitude, checkOutLongitude, exitPhotoUrl, visitNotes, req.params.id, req.user.id]
    );
    
    const visit = await db.get(
      'SELECT * FROM trade_marketing_visits WHERE id = ?',
      [req.params.id]
    );
    
    res.json({ visit });
  } catch (error) {
    console.error('Complete visit error:', error);
    res.status(500).json({ error: 'Failed to complete visit' });
  }
});

// Create Shelf Analytics Entry
router.post('/shelf-analytics', authMiddleware, async (req, res) => {
  try {
    const {
      visitId,
      storeId,
      category,
      totalShelfSpaceMeters,
      brandShelfSpaceMeters,
      totalFacings,
      brandFacings,
      shelfPosition,
      planogramCompliance,
      shelfPhotoUrl,
      competitorAnalysis
    } = req.body;
    
    // Calculate percentages
    const brandShelfSharePercentage = totalShelfSpaceMeters > 0 
      ? (brandShelfSpaceMeters / totalShelfSpaceMeters) * 100 
      : 0;
    
    const brandFacingsSharePercentage = totalFacings > 0 
      ? (brandFacings / totalFacings) * 100 
      : 0;
    
    const result = await db.run(
      `INSERT INTO shelf_analytics (
        visit_id, store_id, category, total_shelf_space_meters,
        brand_shelf_space_meters, brand_shelf_share_percentage,
        total_facings, brand_facings, brand_facings_share_percentage,
        shelf_position, planogram_compliance, shelf_photo_url,
        competitor_analysis
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        visitId, storeId, category, totalShelfSpaceMeters,
        brandShelfSpaceMeters, brandShelfSharePercentage,
        totalFacings, brandFacings, brandFacingsSharePercentage,
        shelfPosition, planogramCompliance, shelfPhotoUrl,
        JSON.stringify(competitorAnalysis)
      ]
    );
    
    const analytics = await db.get(
      'SELECT * FROM shelf_analytics WHERE id = ?',
      [result.lastID]
    );
    
    res.status(201).json({ analytics });
  } catch (error) {
    console.error('Create shelf analytics error:', error);
    res.status(500).json({ error: 'Failed to create shelf analytics' });
  }
});

// Create SKU Availability Entry
router.post('/sku-availability', authMiddleware, async (req, res) => {
  try {
    const {
      visitId,
      storeId,
      productId,
      availabilityStatus,
      facingCount,
      shelfPosition,
      actualPrice,
      rrp,
      expiryVisible,
      expiryDate,
      productCondition,
      skuPhotoUrl,
      notes
    } = req.body;
    
    // Calculate price variance
    const priceVariance = rrp > 0 ? actualPrice - rrp : 0;
    const priceCompliant = Math.abs(priceVariance) <= (rrp * 0.05); // 5% tolerance
    
    const result = await db.run(
      `INSERT INTO sku_availability (
        visit_id, store_id, product_id, availability_status,
        facing_count, shelf_position, actual_price, rrp,
        price_variance, price_compliant, expiry_visible, expiry_date,
        product_condition, sku_photo_url, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        visitId, storeId, productId, availabilityStatus,
        facingCount, shelfPosition, actualPrice, rrp,
        priceVariance, priceCompliant ? 1 : 0, expiryVisible ? 1 : 0, expiryDate,
        productCondition, skuPhotoUrl, notes
      ]
    );
    
    const availability = await db.get(
      `SELECT sa.*, p.name as product_name, p.sku
       FROM sku_availability sa
       JOIN products p ON sa.product_id = p.id
       WHERE sa.id = ?`,
      [result.lastID]
    );
    
    res.status(201).json({ availability });
  } catch (error) {
    console.error('Create SKU availability error:', error);
    res.status(500).json({ error: 'Failed to create SKU availability' });
  }
});

// Track POS Material
router.post('/pos-materials/track', authMiddleware, async (req, res) => {
  try {
    const {
      visitId,
      storeId,
      materialId,
      materialType,
      materialStatus,
      installationDate,
      locationInStore,
      condition,
      visibilityScore,
      photoUrl,
      notes
    } = req.body;
    
    const result = await db.run(
      `INSERT INTO pos_material_tracking (
        visit_id, store_id, material_id, material_type, material_status,
        installation_date, location_in_store, condition, visibility_score,
        photo_url, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        visitId, storeId, materialId, materialType, materialStatus,
        installationDate, locationInStore, condition, visibilityScore,
        photoUrl, notes
      ]
    );
    
    const tracking = await db.get(
      `SELECT pmt.*, pm.material_name
       FROM pos_material_tracking pmt
       JOIN pos_materials pm ON pmt.material_id = pm.id
       WHERE pmt.id = ?`,
      [result.lastID]
    );
    
    res.status(201).json({ tracking });
  } catch (error) {
    console.error('Track POS material error:', error);
    res.status(500).json({ error: 'Failed to track POS material' });
  }
});

// Get POS Materials
router.get('/pos-materials', authMiddleware, async (req, res) => {
  try {
    const { brandId, materialType } = req.query;
    
    let sql = `
      SELECT pm.*, b.name as brand_name
      FROM pos_materials pm
      LEFT JOIN brands b ON pm.brand_id = b.id
      WHERE pm.is_active = 1
    `;
    
    const params = [];
    
    if (brandId) {
      sql += ` AND pm.brand_id = ?`;
      params.push(brandId);
    }
    
    if (materialType) {
      sql += ` AND pm.material_type = ?`;
      params.push(materialType);
    }
    
    sql += ` ORDER BY pm.material_name`;
    
    const materials = await db.all(sql, params);
    
    res.json({ materials });
  } catch (error) {
    console.error('Get POS materials error:', error);
    res.status(500).json({ error: 'Failed to fetch POS materials' });
  }
});

// Create Brand Activation
router.post('/brand-activations', authMiddleware, async (req, res) => {
  try {
    const {
      visitId,
      campaignId,
      storeId,
      activationType,
      setupPhotoUrl,
      activityPhotos,
      samplesDistributed,
      consumersEngaged,
      feedbackCollected,
      storeManagerSignatureUrl,
      activationNotes
    } = req.body;
    
    const activationCode = `BA-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    const result = await db.run(
      `INSERT INTO brand_activations (
        activation_code, visit_id, campaign_id, store_id, agent_id,
        activation_type, activation_status, setup_photo_url, activity_photos,
        samples_distributed, consumers_engaged, feedback_collected,
        store_manager_signature_url, activation_notes, activation_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [
        activationCode, visitId, campaignId, storeId, req.user.id,
        activationType, 'completed', setupPhotoUrl, JSON.stringify(activityPhotos),
        samplesDistributed, consumersEngaged, JSON.stringify(feedbackCollected),
        storeManagerSignatureUrl, activationNotes
      ]
    );
    
    const activation = await db.get(
      `SELECT ba.*, c.campaign_name
       FROM brand_activations ba
       JOIN campaigns c ON ba.campaign_id = c.id
       WHERE ba.id = ?`,
      [result.lastID]
    );
    
    res.status(201).json({ activation });
  } catch (error) {
    console.error('Create brand activation error:', error);
    res.status(500).json({ error: 'Failed to create brand activation' });
  }
});

// Get Active Campaigns
router.get('/campaigns', authMiddleware, async (req, res) => {
  try {
    const { brandId, status = 'active' } = req.query;
    
    let sql = `
      SELECT c.*, b.name as brand_name
      FROM campaigns c
      LEFT JOIN brands b ON c.brand_id = b.id
      WHERE c.status = ?
      AND DATE('now') BETWEEN c.start_date AND c.end_date
    `;
    
    const params = [status];
    
    if (brandId) {
      sql += ` AND c.brand_id = ?`;
      params.push(brandId);
    }
    
    sql += ` ORDER BY c.start_date DESC`;
    
    const campaigns = await db.all(sql, params);
    
    res.json({ campaigns });
  } catch (error) {
    console.error('Get campaigns error:', error);
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
});

// Get Visit Analytics Summary
router.get('/analytics/summary', authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let dateFilter = '';
    const params = [req.user.id];
    
    if (startDate) {
      dateFilter += ` AND tmv.check_in_time::date >= ?`;
      params.push(startDate);
    }
    
    if (endDate) {
      dateFilter += ` AND tmv.check_in_time::date <= ?`;
      params.push(endDate);
    }
    
    // Visits summary
    const visitsSummary = await db.get(
      `SELECT 
        COUNT(*) as total_visits,
        SUM(CASE WHEN visit_status = 'completed' THEN 1 ELSE 0 END) as completed_visits,
        SUM(CASE WHEN visit_status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_visits
       FROM trade_marketing_visits tmv
       WHERE agent_id = ? ${dateFilter}`,
      params
    );
    
    // Shelf analytics summary
    const shelfSummary = await db.get(
      `SELECT 
        AVG(brand_shelf_share_percentage) as avg_shelf_share,
        AVG(brand_facings_share_percentage) as avg_facings_share,
        COUNT(*) as total_categories
       FROM shelf_analytics sa
       JOIN trade_marketing_visits tmv ON sa.visit_id = tmv.id
       WHERE tmv.agent_id = ? ${dateFilter}`,
      params
    );
    
    // SKU availability summary
    const skuSummary = await db.get(
      `SELECT 
        COUNT(*) as total_skus_checked,
        SUM(CASE WHEN availability_status = 'available' THEN 1 ELSE 0 END) as available_skus,
        SUM(CASE WHEN price_compliant = 1 THEN 1 ELSE 0 END) as price_compliant_skus
       FROM sku_availability sa
       JOIN trade_marketing_visits tmv ON sa.visit_id = tmv.id
       WHERE tmv.agent_id = ? ${dateFilter}`,
      params
    );
    
    // Brand activations summary
    const activationsSummary = await db.get(
      `SELECT 
        COUNT(*) as total_activations,
        SUM(samples_distributed) as total_samples,
        SUM(consumers_engaged) as total_consumers
       FROM brand_activations ba
       JOIN trade_marketing_visits tmv ON ba.visit_id = tmv.id
       WHERE tmv.agent_id = ? ${dateFilter}`,
      params
    );
    
    res.json({
      visitsSummary,
      shelfSummary,
      skuSummary,
      activationsSummary
    });
  } catch (error) {
    console.error('Get analytics summary error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics summary' });
  }
});

/**
 * @route   GET /api/trade-marketing-new/materials/library
 * @desc    Get POS materials library
 * @access  Private
 */
router.get('/materials/library', authMiddleware, async (req, res) => {
  try {
    // In production, this would fetch from a materials database table
    const materials = [
      { id: 1, name: 'Brand Standee A-Frame', type: 'Standee', brand: 'Coca-Cola', dimensions: '180x60cm', stockLevel: 45, cost: 2500 },
      { id: 2, name: 'Refrigerator Decal', type: 'Decal', brand: 'Pepsi', dimensions: '60x40cm', stockLevel: 120, cost: 150 },
      { id: 3, name: 'Promotional Banner', type: 'Banner', brand: 'Sprite', dimensions: '300x100cm', stockLevel: 30, cost: 800 },
      { id: 4, name: 'LED Display Board', type: 'Display', brand: 'Fanta', dimensions: '120x80cm', stockLevel: 15, cost: 8500 },
      { id: 5, name: 'Shelf Wobbler', type: 'Wobbler', brand: 'Mountain Dew', dimensions: '15x10cm', stockLevel: 500, cost: 25 },
      { id: 6, name: 'Counter Display Unit', type: 'Display', brand: 'Red Bull', dimensions: '50x40x60cm', stockLevel: 22, cost: 3200 },
    ];
    
    res.json({
      success: true,
      materials
    });
  } catch (error) {
    console.error('Materials library error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching materials library',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/trade-marketing-new/pos-materials
 * @desc    Get POS material installations (overload - GET version)
 * @access  Private
 */
router.get('/pos-materials', authMiddleware, async (req, res) => {
  try {
    // In production, fetch from pos_material_installations table
    const { storeId, status, startDate, endDate } = req.query;
    
    // Mock data for now - replace with actual database query
    const installations = [
      {
        id: 1,
        materialId: 1,
        materialName: 'Brand Standee A-Frame',
        storeId: 101,
        storeName: 'Metro Mart Downtown',
        installationDate: '2025-10-20',
        condition: 'excellent',
        location: 'Store entrance - right side',
        gpsCoordinates: { latitude: 40.7128, longitude: -74.0060 },
        photosBefore: [],
        photosAfter: [],
        qrCode: 'STAND-001-2025',
        installedBy: req.user.name,
        notes: 'Installed near main entrance as per planogram',
        verificationStatus: 'verified'
      }
    ];
    
    res.json({
      success: true,
      installations,
      count: installations.length
    });
  } catch (error) {
    console.error('Get POS materials error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching POS materials',
      error: error.message
    });
  }
});

// GET /api/campaigns/stats - Campaign statistics
router.get('/campaigns/stats', async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { getQuery, getOneQuery } = require('../utils/database');
    
    const [campaignCounts, statusBreakdown, performance, topCampaigns] = await Promise.all([
      getOneQuery(`
        SELECT 
          COUNT(*)::int as total_campaigns,
          COUNT(CASE WHEN status = 'active' THEN 1 END)::int as active_campaigns,
          COUNT(CASE WHEN status = 'completed' THEN 1 END)::int as completed_campaigns,
          COUNT(CASE WHEN status = 'scheduled' THEN 1 END)::int as scheduled_campaigns
        FROM campaigns WHERE tenant_id = $1
      `, [tenantId]).then(row => row || {}),
      
      getQuery(`
        SELECT status, COUNT(*)::int as count
        FROM campaigns WHERE tenant_id = $1
        GROUP BY status
      `, [tenantId]).then(rows => rows || []),
      
      getOneQuery(`
        SELECT 
          COUNT(DISTINCT ce.id)::int as total_executions,
          COUNT(DISTINCT ce.customer_id)::int as customers_reached,
          SUM(CASE WHEN ce.status = 'completed' THEN 1 ELSE 0 END)::int as completed_executions,
          AVG(CASE WHEN ce.conversion_value IS NOT NULL THEN ce.conversion_value END)::float8 as avg_conversion_value
        FROM campaigns c
        LEFT JOIN campaign_executions ce ON c.id = ce.campaign_id
        WHERE c.tenant_id = $1
      `, [tenantId]).then(row => row || {}),
      
      getQuery(`
        SELECT 
          c.id, c.name, c.type, c.status,
          COUNT(DISTINCT ce.id)::int as execution_count,
          COUNT(DISTINCT ce.customer_id)::int as customer_count,
          SUM(COALESCE(ce.conversion_value, 0))::float8 as total_conversion
        FROM campaigns c
        LEFT JOIN campaign_executions ce ON c.id = ce.campaign_id
        WHERE c.tenant_id = $1
        GROUP BY c.id, c.name, c.type, c.status
        ORDER BY total_conversion DESC
        LIMIT 10
      `, [tenantId]).then(rows => rows || [])
    ]);
    
    res.json({
      success: true,
      data: {
        campaigns: campaignCounts,
        statusBreakdown,
        performance: {
          ...performance,
          avg_conversion_value: parseFloat((performance.avg_conversion_value || 0).toFixed(2)),
          conversion_rate: performance.total_executions > 0
            ? parseFloat(((performance.completed_executions / performance.total_executions) * 100).toFixed(2))
            : 0
        },
        topCampaigns
      }
    });
  } catch (error) {
    console.error('Error fetching campaign stats:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch campaign statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
