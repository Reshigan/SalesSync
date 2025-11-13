const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { getQuery, getOneQuery, runQuery } = require('../utils/database');
const { getDatabase } = require('../database/init');
const commissionService = require('../services/commission.service');
const surveyService = require('../services/survey.service');
const boardService = require('../services/board.service');
const { v4: uuidv4 } = require('uuid');

router.post('/visits', asyncHandler(async (req, res) => {
  const {
    customer_id,
    brand_ids,
    gps_lat,
    gps_lng,
    gps_accuracy,
    visit_type,
    is_new_customer,
    idempotency_key
  } = req.body;

  const tenantId = req.tenantId;
  
  const userId = req.user?.userId || req.user?.id;
  if (!userId) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }
  
  const agent = await getOneQuery(
    "SELECT id FROM users WHERE role IN ('agent', 'sales_agent', 'field_agent') AND user_id = ? AND tenant_id = ?",
    [userId, tenantId]
  );
  
  if (!agent) {
    return res.status(403).json({ success: false, message: 'User is not an agent' });
  }
  
  const agentId = agent.id;

  let distanceMeters = null;
  let requiresOverride = false;

  if (!is_new_customer && customer_id) {
    const customer = await getOneQuery(
      'SELECT latitude, longitude FROM customers WHERE id = ? AND tenant_id = ?',
      [customer_id, tenantId]
    );

    if (customer && customer.latitude && customer.longitude) {
      distanceMeters = calculateDistance(gps_lat, gps_lng, customer.latitude, customer.longitude);
      requiresOverride = distanceMeters > 10;
    }
  }

  const visitId = idempotency_key || uuidv4();
  const db = getDatabase();

  await new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO visits (
        id, tenant_id, agent_id, customer_id, visit_date, check_in_time,
        latitude, longitude, gps_accuracy, distance_meters, visit_type, status, created_at
      ) VALUES (?, ?, ?, ?, CURRENT_DATE, CURRENT_TIMESTAMP, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [visitId, tenantId, agentId, customer_id, gps_lat, gps_lng, gps_accuracy, distanceMeters,
       visit_type || 'field_marketing', requiresOverride ? 'pending_override' : 'in_progress'],
      (err) => { if (err) return reject(err); resolve(); }
    );
  });

  if (brand_ids && Array.isArray(brand_ids)) {
    const surveys = await surveyService.getSurveysForVisit(visitId, tenantId);
    let taskOrder = 1;

    for (const survey of surveys) {
      const surveyInstance = await surveyService.createInstance(visitId, survey.id, survey.scope === 'brand' ? brand_ids[0] : null);
      await runQuery(
        `INSERT INTO visit_tasks (id, visit_id, task_type, task_ref_id, is_mandatory, sequence_order, status)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [uuidv4(), visitId, 'survey', surveyInstance.id, survey.is_mandatory ? 1 : 0, taskOrder++, 'pending']
      );
    }

    for (const brandId of brand_ids) {
      await runQuery(
        `INSERT INTO visit_tasks (id, visit_id, task_type, task_ref_id, is_mandatory, sequence_order, status)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [uuidv4(), visitId, 'board', brandId, 0, taskOrder++, 'pending']
      );
    }

    await runQuery(
      `INSERT INTO visit_tasks (id, visit_id, task_type, task_ref_id, is_mandatory, sequence_order, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [uuidv4(), visitId, 'distribution', 'general', 0, taskOrder++, 'pending']
    );
  }

  const visit = await getOneQuery('SELECT * FROM visits WHERE id = ?', [visitId]);
  const tasks = await getQuery('SELECT * FROM visit_tasks WHERE visit_id = ? ORDER BY sequence_order', [visitId]);

  res.status(201).json({ success: true, data: { visit, tasks, requires_override: requiresOverride, distance_meters: distanceMeters } });
}));

router.get('/visits/active', asyncHandler(async (req, res) => {
  const tenantId = req.tenantId;
  const activeVisits = await getQuery(
    `SELECT v.*, a.id as agent_id, u.first_name || ' ' || u.last_name as agent_name,
            c.name as customer_name, c.address as customer_address, c.latitude as customer_latitude, c.longitude as customer_longitude
     FROM visits v
     JOIN users a ON v.agent_id = a.id
     LEFT JOIN users u ON a.user_id = u.id
     JOIN customers c ON v.customer_id = c.id
     WHERE v.tenant_id = ? AND v.status = 'in_progress'
     ORDER BY v.visit_date DESC`, [tenantId]
  );
  res.json({ success: true, data: activeVisits || [] });
}));

router.get('/visits/:id', asyncHandler(async (req, res) => {
router.get('/visits/active', asyncHandler(async (req, res) => {
  const tenantId = req.tenantId;
  const activeVisits = await getQuery(
    `SELECT v.*, a.id as agent_id, u.first_name || ' ' || u.last_name as agent_name,
            c.name as customer_name, c.address as customer_address, c.latitude as customer_latitude, c.longitude as customer_longitude
     FROM visits v
     JOIN users a ON v.agent_id = a.id
     LEFT JOIN users u ON a.user_id = u.id
     JOIN customers c ON v.customer_id = c.id
     WHERE v.tenant_id = ? AND v.status = 'in_progress'
     ORDER BY v.visit_date DESC`, [tenantId]
  );
  res.json({ success: true, data: activeVisits || [] });
}));

  const { id } = req.params;
  const tenantId = req.tenantId;

  const visit = await getOneQuery(
    `SELECT v.*, c.name as customer_name, c.address as customer_address
     FROM visits v LEFT JOIN customers c ON v.customer_id = c.id
     WHERE v.id = ? AND v.tenant_id = ?`,
    [id, tenantId]
  );

  if (!visit) return res.status(404).json({ success: false, message: 'Visit not found' });

  const tasks = await getQuery('SELECT * FROM visit_tasks WHERE visit_id = ? ORDER BY sequence_order', [id]);
  const boards = await getQuery(
    `SELECT bi.*, b.board_name, br.name as brand_name
     FROM board_installations bi
     LEFT JOIN boards b ON bi.board_id = b.id
     LEFT JOIN brands br ON bi.brand_id = br.id
     WHERE bi.visit_id = ?`, [id]
  );
  const distributions = await getQuery(
    `SELECT pd.*, p.name as product_name
     FROM product_distributions pd LEFT JOIN products p ON pd.product_id = p.id
     WHERE pd.visit_id = ?`, [id]
  );
  const surveys = await getQuery(
    `SELECT si.*, s.title as survey_title
     FROM survey_instances si LEFT JOIN surveys s ON si.survey_id = s.id
     WHERE si.visit_id = ?`, [id]
  );

  res.json({ success: true, data: { visit, tasks, boards, distributions, surveys } });
}));

router.patch('/visits/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, override_reason, override_photo } = req.body;
  const tenantId = req.tenantId;

  const updates = [];
  const params = [];

  if (status) { updates.push('status = ?'); params.push(status); }
  if (override_reason) { updates.push('override_reason = ?'); params.push(override_reason); }
  if (override_photo) { updates.push('override_photo = ?'); params.push(override_photo); }

  if (updates.length === 0) return res.status(400).json({ success: false, message: 'No updates provided' });

  params.push(id, tenantId);
  await runQuery(`UPDATE visits SET ${updates.join(', ')} WHERE id = ? AND tenant_id = ?`, params);

  const visit = await getOneQuery('SELECT * FROM visits WHERE id = ?', [id]);
  res.json({ success: true, data: visit });
}));

router.post('/visits/:id/complete', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const tenantId = req.tenantId;
  const db = getDatabase();

  await new Promise((resolve, reject) => {
    db.run('BEGIN TRANSACTION', (err) => { if (err) reject(err); else resolve(); });
  });

  try {
    const incompleteTasks = await getQuery(
      `SELECT * FROM visit_tasks WHERE visit_id = ? AND is_mandatory = 1 AND status != 'completed'`, [id]
    );

    if (incompleteTasks.length > 0) {
      throw new Error('All mandatory tasks must be completed before closing visit');
    }

    const commissionEvents = await getQuery('SELECT SUM(amount) as total FROM commission_events WHERE visit_id = ?', [id]);
    const totalCommission = commissionEvents[0]?.total || 0;

    await runQuery(
      `UPDATE visits SET status = 'completed', check_out_time = CURRENT_TIMESTAMP, total_commission = ?
       WHERE id = ? AND tenant_id = ?`,
      [totalCommission, id, tenantId]
    );

    await new Promise((resolve, reject) => {
      db.run('COMMIT', (err) => { if (err) reject(err); else resolve(); });
    });

    const visit = await getOneQuery('SELECT * FROM visits WHERE id = ?', [id]);
    res.json({ success: true, data: { visit, total_commission: totalCommission } });
  } catch (error) {
    await new Promise((resolve) => { db.run('ROLLBACK', () => resolve()); });
    throw error;
  }
}));

router.patch('/tasks/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  await runQuery(
    `UPDATE visit_tasks SET status = ?, completed_at = CASE WHEN ? = 'completed' THEN CURRENT_TIMESTAMP ELSE NULL END WHERE id = ?`,
    [status, status, id]
  );

  const task = await getOneQuery('SELECT * FROM visit_tasks WHERE id = ?', [id]);
  res.json({ success: true, data: task });
}));

router.post('/gps/validate', asyncHandler(async (req, res) => {
  const { customer_id, latitude, longitude } = req.body;
  const tenantId = req.tenantId;

  const customer = await getOneQuery(
    'SELECT latitude, longitude FROM customers WHERE id = ? AND tenant_id = ?',
    [customer_id, tenantId]
  );

  if (!customer || !customer.latitude || !customer.longitude) {
    return res.status(404).json({ success: false, message: 'Customer location not found' });
  }

  const distance = calculateDistance(latitude, longitude, customer.latitude, customer.longitude);
  const isValid = distance <= 10;

  res.json({
    success: true,
    data: {
      valid: isValid,
      distance_meters: Math.round(distance * 100) / 100,
      threshold_meters: 10,
      customer_location: { latitude: customer.latitude, longitude: customer.longitude }
    }
  });
}));

router.post('/gps/override', asyncHandler(async (req, res) => {
  const { visit_id, reason, photo_url } = req.body;
  const tenantId = req.tenantId;

  await runQuery(
    `UPDATE visits SET override_reason = ?, override_photo = ?, status = 'pending_approval' WHERE id = ? AND tenant_id = ?`,
    [reason, photo_url, visit_id, tenantId]
  );

  const visit = await getOneQuery('SELECT * FROM visits WHERE id = ?', [visit_id]);
  res.json({ success: true, data: visit });
}));

router.get('/', asyncHandler(async (req, res) => {
  const tenantId = req.tenantId;
  const operations = await getQuery(
    `SELECT id, operation_type, agent_id, customer_id, status, scheduled_date, completed_date, created_at
     FROM field_operations WHERE tenant_id = ? ORDER BY created_at DESC`, [tenantId]
  );
  res.json({ success: true, data: operations || [] });
}));

router.get('/live-locations', asyncHandler(async (req, res) => {
  const tenantId = req.tenantId;
  const locations = await getQuery(
    `SELECT a.id as agent_id, u.first_name || ' ' || u.last_name as agent_name, u.phone, u.email,
            v.latitude, v.longitude, v.visit_date as timestamp, v.status, c.name as customer_name, c.id as customer_id
     FROM users WHERE role IN ('agent', 'sales_agent', 'field_agent') a
     LEFT JOIN users u ON a.user_id = u.id
     LEFT JOIN visits v ON a.id = v.agent_id AND v.tenant_id = ?
     LEFT JOIN customers c ON v.customer_id = c.id
     WHERE a.tenant_id = ? AND v.latitude IS NOT NULL AND v.longitude IS NOT NULL
     ORDER BY v.visit_date DESC`, [tenantId, tenantId]
  );
  res.json({ success: true, data: locations || [] });
}));

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
}

module.exports = router;
