/**
 * Visit Configurations Routes
 * Manages visit templates with brand/customer type targeting, date ranges, surveys, and board placements
 */

const express = require('express');
const router = express.Router();
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { getQuery, getOneQuery, runQuery } = require('../utils/database');

/**
 * GET /api/visit-configurations
 * List all visit configurations
 */
router.get('/', asyncHandler(async (req, res) => {
  const tenantId = req.tenantId;
  const { is_active, target_type, brand_id } = req.query;

  let query = `
    SELECT 
      vc.*,
      b.name as brand_name,
      s.title as survey_title,
      bo.name as board_name,
      CONCAT(u.first_name, ' ', u.last_name) as created_by_name
    FROM visit_configurations vc
    LEFT JOIN brands b ON vc.brand_id = b.id
    LEFT JOIN surveys s ON vc.survey_id = s.id
    LEFT JOIN boards bo ON vc.board_id = bo.id
    LEFT JOIN users u ON vc.created_by = u.id
    WHERE vc.tenant_id = $1
  `;
  
  const params = [tenantId];
  let paramIndex = 1;

  if (is_active !== undefined) {
    query += ` AND vc.is_active = $${++paramIndex}`;
    params.push(is_active === 'true');
  }

  if (target_type) {
    query += ` AND vc.target_type = $${++paramIndex}`;
    params.push(target_type);
  }

  if (brand_id) {
    query += ` AND vc.brand_id = $${++paramIndex}`;
    params.push(brand_id);
  }

  query += ` ORDER BY vc.created_at DESC`;

  const configurations = await getQuery(query, params);

  res.json({
    success: true,
    data: configurations
  });
}));

/**
 * GET /api/visit-configurations/:id
 * Get a specific visit configuration
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const tenantId = req.tenantId;
  const { id } = req.params;

  const configuration = await getOneQuery(
    `SELECT 
      vc.*,
      b.name as brand_name,
      s.title as survey_title,
      bo.name as board_name,
      CONCAT(u.first_name, ' ', u.last_name) as created_by_name
    FROM visit_configurations vc
    LEFT JOIN brands b ON vc.brand_id = b.id
    LEFT JOIN surveys s ON vc.survey_id = s.id
    LEFT JOIN boards bo ON vc.board_id = bo.id
    LEFT JOIN users u ON vc.created_by = u.id
    WHERE vc.id = $1 AND vc.tenant_id = $2`,
    [id, tenantId]
  );

  if (!configuration) {
    throw new AppError('Visit configuration not found', 404);
  }

  res.json({
    success: true,
    data: configuration
  });
}));

/**
 * POST /api/visit-configurations
 * Create a new visit configuration
 */
router.post('/', asyncHandler(async (req, res) => {
  const tenantId = req.tenantId;
  const userId = req.user?.id || req.userId;
  const {
    name,
    description,
    target_type,
    brand_id,
    customer_type,
    valid_from,
    valid_to,
    survey_id,
    survey_required,
    requires_board_placement,
    board_id,
    board_photo_required,
    track_coverage_analytics,
    visit_type,
    default_duration_minutes,
    checklist_items
  } = req.body;

  // Validation
  if (!name || !target_type || !valid_from || !valid_to) {
    throw new AppError('name, target_type, valid_from, and valid_to are required', 400);
  }

  if (target_type === 'brand' && !brand_id) {
    throw new AppError('brand_id is required when target_type is brand', 400);
  }

  if (target_type === 'customer_type' && !customer_type) {
    throw new AppError('customer_type is required when target_type is customer_type', 400);
  }

  const result = await runQuery(
    `INSERT INTO visit_configurations 
      (tenant_id, name, description, target_type, brand_id, customer_type, 
       valid_from, valid_to, survey_id, survey_required, requires_board_placement, 
       board_id, board_photo_required, track_coverage_analytics, visit_type, 
       default_duration_minutes, checklist_items, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
     RETURNING *`,
    [
      tenantId, name, description, target_type, brand_id, customer_type,
      valid_from, valid_to, survey_id, survey_required || false, requires_board_placement || false,
      board_id, board_photo_required || false, track_coverage_analytics || false, visit_type,
      default_duration_minutes || 30, JSON.stringify(checklist_items || []), userId
    ]
  );

  const configuration = result.rows?.[0] || result;

  res.status(201).json({
    success: true,
    data: configuration,
    message: 'Visit configuration created successfully'
  });
}));

/**
 * PUT /api/visit-configurations/:id
 * Update a visit configuration
 */
router.put('/:id', asyncHandler(async (req, res) => {
  const tenantId = req.tenantId;
  const { id } = req.params;
  const {
    name,
    description,
    target_type,
    brand_id,
    customer_type,
    valid_from,
    valid_to,
    survey_id,
    survey_required,
    requires_board_placement,
    board_id,
    board_photo_required,
    track_coverage_analytics,
    visit_type,
    default_duration_minutes,
    checklist_items,
    is_active
  } = req.body;

  const existing = await getOneQuery(
    'SELECT id FROM visit_configurations WHERE id = $1 AND tenant_id = $2',
    [id, tenantId]
  );

  if (!existing) {
    throw new AppError('Visit configuration not found', 404);
  }

  const updates = [];
  const params = [];
  let paramIndex = 0;

  if (name !== undefined) {
    updates.push(`name = $${++paramIndex}`);
    params.push(name);
  }
  if (description !== undefined) {
    updates.push(`description = $${++paramIndex}`);
    params.push(description);
  }
  if (target_type !== undefined) {
    updates.push(`target_type = $${++paramIndex}`);
    params.push(target_type);
  }
  if (brand_id !== undefined) {
    updates.push(`brand_id = $${++paramIndex}`);
    params.push(brand_id);
  }
  if (customer_type !== undefined) {
    updates.push(`customer_type = $${++paramIndex}`);
    params.push(customer_type);
  }
  if (valid_from !== undefined) {
    updates.push(`valid_from = $${++paramIndex}`);
    params.push(valid_from);
  }
  if (valid_to !== undefined) {
    updates.push(`valid_to = $${++paramIndex}`);
    params.push(valid_to);
  }
  if (survey_id !== undefined) {
    updates.push(`survey_id = $${++paramIndex}`);
    params.push(survey_id);
  }
  if (survey_required !== undefined) {
    updates.push(`survey_required = $${++paramIndex}`);
    params.push(survey_required);
  }
  if (requires_board_placement !== undefined) {
    updates.push(`requires_board_placement = $${++paramIndex}`);
    params.push(requires_board_placement);
  }
  if (board_id !== undefined) {
    updates.push(`board_id = $${++paramIndex}`);
    params.push(board_id);
  }
  if (board_photo_required !== undefined) {
    updates.push(`board_photo_required = $${++paramIndex}`);
    params.push(board_photo_required);
  }
  if (track_coverage_analytics !== undefined) {
    updates.push(`track_coverage_analytics = $${++paramIndex}`);
    params.push(track_coverage_analytics);
  }
  if (visit_type !== undefined) {
    updates.push(`visit_type = $${++paramIndex}`);
    params.push(visit_type);
  }
  if (default_duration_minutes !== undefined) {
    updates.push(`default_duration_minutes = $${++paramIndex}`);
    params.push(default_duration_minutes);
  }
  if (checklist_items !== undefined) {
    updates.push(`checklist_items = $${++paramIndex}`);
    params.push(JSON.stringify(checklist_items));
  }
  if (is_active !== undefined) {
    updates.push(`is_active = $${++paramIndex}`);
    params.push(is_active);
  }

  updates.push(`updated_at = CURRENT_TIMESTAMP`);
  params.push(id, tenantId);

  const result = await runQuery(
    `UPDATE visit_configurations 
     SET ${updates.join(', ')}
     WHERE id = $${++paramIndex} AND tenant_id = $${++paramIndex}
     RETURNING *`,
    params
  );

  const configuration = result.rows?.[0] || result;

  res.json({
    success: true,
    data: configuration,
    message: 'Visit configuration updated successfully'
  });
}));

/**
 * DELETE /api/visit-configurations/:id
 * Delete a visit configuration
 */
router.delete('/:id', asyncHandler(async (req, res) => {
  const tenantId = req.tenantId;
  const { id } = req.params;

  const existing = await getOneQuery(
    'SELECT id FROM visit_configurations WHERE id = $1 AND tenant_id = $2',
    [id, tenantId]
  );

  if (!existing) {
    throw new AppError('Visit configuration not found', 404);
  }

  await runQuery(
    'DELETE FROM visit_configurations WHERE id = $1 AND tenant_id = $2',
    [id, tenantId]
  );

  res.json({
    success: true,
    message: 'Visit configuration deleted successfully'
  });
}));

/**
 * GET /api/visit-configurations/applicable/:customerId
 * Get applicable visit configurations for a customer
 */
router.get('/applicable/:customerId', asyncHandler(async (req, res) => {
  const tenantId = req.tenantId;
  const { customerId } = req.params;
  const { date } = req.query;

  const checkDate = date || new Date().toISOString().split('T')[0];

  const customer = await getOneQuery(
    'SELECT id, customer_type, brand_id FROM customers WHERE id = $1 AND tenant_id = $2',
    [customerId, tenantId]
  );

  if (!customer) {
    throw new AppError('Customer not found', 404);
  }

  const configurations = await getQuery(
    `SELECT 
      vc.*,
      b.name as brand_name,
      s.title as survey_title,
      bo.name as board_name
    FROM visit_configurations vc
    LEFT JOIN brands b ON vc.brand_id = b.id
    LEFT JOIN surveys s ON vc.survey_id = s.id
    LEFT JOIN boards bo ON vc.board_id = bo.id
    WHERE vc.tenant_id = $1 
      AND vc.is_active = true
      AND vc.valid_from <= $2
      AND vc.valid_to >= $2
      AND (
        vc.target_type = 'all'
        OR (vc.target_type = 'brand' AND vc.brand_id = $3)
        OR (vc.target_type = 'customer_type' AND vc.customer_type = $4)
      )
    ORDER BY 
      CASE vc.target_type 
        WHEN 'brand' THEN 1
        WHEN 'customer_type' THEN 2
        WHEN 'all' THEN 3
      END,
      vc.created_at DESC`,
    [tenantId, checkDate, customer.brand_id, customer.customer_type]
  );

  res.json({
    success: true,
    data: configurations
  });
}));

/**
 * GET /api/visit-configurations/analytics/coverage
 * Get coverage analytics for board placements
 */
router.get('/analytics/coverage', asyncHandler(async (req, res) => {
  const tenantId = req.tenantId;
  const { brand_id, start_date, end_date } = req.query;

  let query = `
    SELECT 
      bp.brand_id,
      b.name as brand_name,
      COUNT(bp.id) as total_placements,
      AVG(bp.coverage_percentage) as avg_coverage_percentage,
      AVG(bp.visibility_score) as avg_visibility_score,
      COUNT(CASE WHEN bp.coverage_percentage >= 10 THEN 1 END) as placements_meeting_standard,
      COUNT(CASE WHEN bp.coverage_percentage < 10 THEN 1 END) as placements_below_standard
    FROM board_placements bp
    LEFT JOIN brands b ON bp.brand_id = b.id
    WHERE bp.tenant_id = $1
  `;

  const params = [tenantId];
  let paramIndex = 1;

  if (brand_id) {
    query += ` AND bp.brand_id = $${++paramIndex}`;
    params.push(brand_id);
  }

  if (start_date) {
    query += ` AND bp.created_at >= $${++paramIndex}`;
    params.push(start_date);
  }

  if (end_date) {
    query += ` AND bp.created_at <= $${++paramIndex}`;
    params.push(end_date);
  }

  query += ` GROUP BY bp.brand_id, b.name ORDER BY total_placements DESC`;

  const analytics = await getQuery(query, params);

  res.json({
    success: true,
    data: analytics
  });
}));

module.exports = router;
