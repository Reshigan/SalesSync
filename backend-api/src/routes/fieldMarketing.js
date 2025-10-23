const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authMiddleware } = require('../middleware/authMiddleware');

// ============================================
// FIELD MARKETING ROUTES
// ============================================

// GPS Validation
router.post('/gps/validate', authMiddleware, async (req, res) => {
  try {
    const { customerId, latitude, longitude, accuracy } = req.body;
    
    // Get customer's registered location
    const customerLocation = await db.get(
      `SELECT latitude, longitude FROM customer_locations 
       WHERE customer_id = ? AND is_verified = 1 
       ORDER BY created_at DESC LIMIT 1`,
      [customerId]
    );
    
    if (!customerLocation) {
      return res.status(404).json({ error: 'Customer location not found' });
    }
    
    // Calculate distance using Haversine formula
    const distance = calculateDistance(
      latitude, longitude,
      customerLocation.latitude, customerLocation.longitude
    );
    
    const isWithinRange = distance <= 10; // 10 meters
    
    res.json({
      valid: isWithinRange,
      distance: Math.round(distance * 100) / 100,
      requiredDistance: 10,
      customerLocation: {
        latitude: customerLocation.latitude,
        longitude: customerLocation.longitude
      }
    });
  } catch (error) {
    console.error('GPS validation error:', error);
    res.status(500).json({ error: 'GPS validation failed' });
  }
});

// Customer Search with GPS proximity
router.get('/customers/search', authMiddleware, async (req, res) => {
  try {
    const { query, latitude, longitude, radius = 100 } = req.query;
    
    let sql = `
      SELECT c.*, cl.latitude, cl.longitude,
             CASE WHEN cl.latitude IS NOT NULL THEN 1 ELSE 0 END as has_location
      FROM customers c
      LEFT JOIN customer_locations cl ON c.id = cl.customer_id AND cl.is_verified = 1
      WHERE c.tenant_id = ?
    `;
    
    const params = [req.user.tenant_id];
    
    if (query) {
      sql += ` AND (c.name LIKE ? OR c.code LIKE ? OR c.phone LIKE ?)`;
      const searchTerm = `%${query}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }
    
    sql += ` ORDER BY has_location DESC, c.name ASC LIMIT 50`;
    
    const customers = await db.all(sql, params);
    
    // Calculate distance for each customer if GPS provided
    if (latitude && longitude) {
      customers.forEach(customer => {
        if (customer.latitude && customer.longitude) {
          customer.distance = calculateDistance(
            parseFloat(latitude), parseFloat(longitude),
            customer.latitude, customer.longitude
          );
        }
      });
      
      // Sort by distance
      customers.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
    }
    
    res.json({ customers });
  } catch (error) {
    console.error('Customer search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Create Field Visit
router.post('/visits', authMiddleware, async (req, res) => {
  try {
    const {
      customerId,
      visitType,
      startLatitude,
      startLongitude,
      selectedBrands
    } = req.body;
    
    const visitCode = `FV-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    const result = await db.run(
      `INSERT INTO field_visits (
        visit_code, agent_id, customer_id, visit_type, visit_status,
        start_time, start_latitude, start_longitude, selected_brands, gps_validation_passed
      ) VALUES (?, ?, ?, ?, ?, datetime('now'), ?, ?, ?, ?)`,
      [
        visitCode,
        req.user.id,
        customerId,
        visitType,
        'in_progress',
        startLatitude,
        startLongitude,
        JSON.stringify(selectedBrands),
        1
      ]
    );
    
    const visit = await db.get(
      'SELECT * FROM field_visits WHERE id = ?',
      [result.lastID]
    );
    
    res.status(201).json({ visit });
  } catch (error) {
    console.error('Create visit error:', error);
    res.status(500).json({ error: 'Failed to create visit' });
  }
});

// Get Agent's Visits
router.get('/visits', authMiddleware, async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;
    
    let sql = `
      SELECT fv.*, c.name as customer_name, c.code as customer_code
      FROM field_visits fv
      JOIN customers c ON fv.customer_id = c.id
      WHERE fv.agent_id = ?
    `;
    
    const params = [req.user.id];
    
    if (status) {
      sql += ` AND fv.visit_status = ?`;
      params.push(status);
    }
    
    if (startDate) {
      sql += ` AND DATE(fv.start_time) >= ?`;
      params.push(startDate);
    }
    
    if (endDate) {
      sql += ` AND DATE(fv.start_time) <= ?`;
      params.push(endDate);
    }
    
    sql += ` ORDER BY fv.start_time DESC LIMIT 100`;
    
    const visits = await db.all(sql, params);
    
    res.json({ visits });
  } catch (error) {
    console.error('Get visits error:', error);
    res.status(500).json({ error: 'Failed to fetch visits' });
  }
});

// Get Visit Details
router.get('/visits/:id', authMiddleware, async (req, res) => {
  try {
    const visit = await db.get(
      `SELECT fv.*, c.name as customer_name, c.code as customer_code,
              c.address, c.phone, c.email
       FROM field_visits fv
       JOIN customers c ON fv.customer_id = c.id
       WHERE fv.id = ? AND fv.agent_id = ?`,
      [req.params.id, req.user.id]
    );
    
    if (!visit) {
      return res.status(404).json({ error: 'Visit not found' });
    }
    
    // Get board placements for this visit
    const boardPlacements = await db.all(
      `SELECT bp.*, b.board_name, b.board_type
       FROM board_placements bp
       JOIN field_marketing_boards b ON bp.board_id = b.id
       WHERE bp.visit_id = ?`,
      [req.params.id]
    );
    
    // Get product distributions
    const productDistributions = await db.all(
      `SELECT pd.*, p.name as product_name, p.sku
       FROM product_distributions pd
       JOIN products p ON pd.product_id = p.id
       WHERE pd.visit_id = ?`,
      [req.params.id]
    );
    
    // Get surveys
    const surveys = await db.all(
      `SELECT vs.*, s.survey_name, s.survey_type
       FROM visit_surveys vs
       JOIN surveys s ON vs.survey_id = s.id
       WHERE vs.visit_id = ?`,
      [req.params.id]
    );
    
    res.json({
      visit,
      boardPlacements,
      productDistributions,
      surveys
    });
  } catch (error) {
    console.error('Get visit details error:', error);
    res.status(500).json({ error: 'Failed to fetch visit details' });
  }
});

// Complete Visit
router.put('/visits/:id/complete', authMiddleware, async (req, res) => {
  try {
    const { endLatitude, endLongitude, visitNotes } = req.body;
    
    await db.run(
      `UPDATE field_visits 
       SET visit_status = 'completed', 
           end_time = datetime('now'),
           end_latitude = ?,
           end_longitude = ?,
           visit_notes = ?
       WHERE id = ? AND agent_id = ?`,
      [endLatitude, endLongitude, visitNotes, req.params.id, req.user.id]
    );
    
    const visit = await db.get(
      'SELECT * FROM field_visits WHERE id = ?',
      [req.params.id]
    );
    
    res.json({ visit });
  } catch (error) {
    console.error('Complete visit error:', error);
    res.status(500).json({ error: 'Failed to complete visit' });
  }
});

// Get Available Boards
router.get('/boards', authMiddleware, async (req, res) => {
  try {
    const { brandId } = req.query;
    
    let sql = `
      SELECT fmb.*, b.name as brand_name
      FROM field_marketing_boards fmb
      JOIN brands b ON fmb.brand_id = b.id
      WHERE fmb.is_active = 1
    `;
    
    const params = [];
    
    if (brandId) {
      sql += ` AND fmb.brand_id = ?`;
      params.push(brandId);
    }
    
    sql += ` ORDER BY fmb.board_name`;
    
    const boards = await db.all(sql, params);
    
    res.json({ boards });
  } catch (error) {
    console.error('Get boards error:', error);
    res.status(500).json({ error: 'Failed to fetch boards' });
  }
});

// Create Board Placement
router.post('/board-placements', authMiddleware, async (req, res) => {
  try {
    const {
      visitId,
      boardId,
      customerId,
      latitude,
      longitude,
      placementPhotoUrl,
      storefrontCoveragePercentage,
      qualityScore,
      visibilityScore,
      placementNotes
    } = req.body;
    
    const placementCode = `BP-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    // Get board details for commission
    const board = await db.get(
      'SELECT commission_rate FROM field_marketing_boards WHERE id = ?',
      [boardId]
    );
    
    const result = await db.run(
      `INSERT INTO board_placements (
        placement_code, visit_id, board_id, customer_id, agent_id,
        placement_status, latitude, longitude, placement_photo_url,
        storefront_coverage_percentage, quality_score, visibility_score,
        commission_amount, commission_status, placement_notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        placementCode, visitId, boardId, customerId, req.user.id,
        'pending', latitude, longitude, placementPhotoUrl,
        storefrontCoveragePercentage, qualityScore, visibilityScore,
        board?.commission_rate || 0, 'pending', placementNotes
      ]
    );
    
    // Create commission record
    if (board?.commission_rate > 0) {
      await db.run(
        `INSERT INTO agent_commissions (
          agent_id, visit_id, commission_type, reference_type, reference_id,
          commission_amount, commission_status, earned_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
        [
          req.user.id, visitId, 'board_placement', 'board_placement',
          result.lastID, board.commission_rate, 'pending'
        ]
      );
    }
    
    const placement = await db.get(
      'SELECT * FROM board_placements WHERE id = ?',
      [result.lastID]
    );
    
    res.status(201).json({ placement });
  } catch (error) {
    console.error('Create board placement error:', error);
    res.status(500).json({ error: 'Failed to create board placement' });
  }
});

// Create Product Distribution
router.post('/product-distributions', authMiddleware, async (req, res) => {
  try {
    const {
      visitId,
      productId,
      customerId,
      productType,
      productSerialNumber,
      quantity,
      recipientName,
      recipientIdNumber,
      recipientPhone,
      recipientAddress,
      recipientSignatureUrl,
      recipientPhotoUrl,
      idDocumentPhotoUrl,
      formData,
      latitude,
      longitude,
      distributionNotes
    } = req.body;
    
    const distributionCode = `PD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    const result = await db.run(
      `INSERT INTO product_distributions (
        distribution_code, visit_id, product_id, agent_id, customer_id,
        distribution_status, product_type, product_serial_number, quantity,
        recipient_name, recipient_id_number, recipient_phone, recipient_address,
        recipient_signature_url, recipient_photo_url, id_document_photo_url,
        form_data, latitude, longitude, commission_amount, commission_status,
        distribution_notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        distributionCode, visitId, productId, req.user.id, customerId,
        'pending', productType, productSerialNumber, quantity,
        recipientName, recipientIdNumber, recipientPhone, recipientAddress,
        recipientSignatureUrl, recipientPhotoUrl, idDocumentPhotoUrl,
        JSON.stringify(formData), latitude, longitude, 0, 'pending',
        distributionNotes
      ]
    );
    
    const distribution = await db.get(
      'SELECT * FROM product_distributions WHERE id = ?',
      [result.lastID]
    );
    
    res.status(201).json({ distribution });
  } catch (error) {
    console.error('Create product distribution error:', error);
    res.status(500).json({ error: 'Failed to create product distribution' });
  }
});

// Get Agent Commissions
router.get('/commissions', authMiddleware, async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;
    
    let sql = `
      SELECT ac.*, fv.visit_code, c.name as customer_name
      FROM agent_commissions ac
      LEFT JOIN field_visits fv ON ac.visit_id = fv.id
      LEFT JOIN customers c ON fv.customer_id = c.id
      WHERE ac.agent_id = ?
    `;
    
    const params = [req.user.id];
    
    if (status) {
      sql += ` AND ac.commission_status = ?`;
      params.push(status);
    }
    
    if (startDate) {
      sql += ` AND DATE(ac.earned_date) >= ?`;
      params.push(startDate);
    }
    
    if (endDate) {
      sql += ` AND DATE(ac.earned_date) <= ?`;
      params.push(endDate);
    }
    
    sql += ` ORDER BY ac.earned_date DESC LIMIT 100`;
    
    const commissions = await db.all(sql, params);
    
    // Calculate totals
    const totals = await db.get(
      `SELECT 
        SUM(CASE WHEN commission_status = 'pending' THEN commission_amount ELSE 0 END) as pending,
        SUM(CASE WHEN commission_status = 'approved' THEN commission_amount ELSE 0 END) as approved,
        SUM(CASE WHEN commission_status = 'paid' THEN commission_amount ELSE 0 END) as paid
       FROM agent_commissions
       WHERE agent_id = ?`,
      [req.user.id]
    );
    
    res.json({ commissions, totals });
  } catch (error) {
    console.error('Get commissions error:', error);
    res.status(500).json({ error: 'Failed to fetch commissions' });
  }
});

// Submit Survey
router.post('/surveys/submit', authMiddleware, async (req, res) => {
  try {
    const {
      visitId,
      surveyId,
      customerId,
      surveyType,
      surveyScope,
      brandId,
      responses
    } = req.body;
    
    const result = await db.run(
      `INSERT INTO visit_surveys (
        visit_id, survey_id, agent_id, customer_id, survey_type,
        survey_scope, brand_id, completion_status, responses,
        started_at, completed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      [
        visitId, surveyId, req.user.id, customerId, surveyType,
        surveyScope, brandId, 'completed', JSON.stringify(responses)
      ]
    );
    
    const survey = await db.get(
      'SELECT * FROM visit_surveys WHERE id = ?',
      [result.lastID]
    );
    
    res.status(201).json({ survey });
  } catch (error) {
    console.error('Submit survey error:', error);
    res.status(500).json({ error: 'Failed to submit survey' });
  }
});

// Helper function: Calculate distance between two GPS coordinates (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;
  
  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  
  return R * c; // Distance in meters
}

module.exports = router;
