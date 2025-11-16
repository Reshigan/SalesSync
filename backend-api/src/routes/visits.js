const express = require('express');
const { getQuery, getOneQuery, runQuery } = require('../utils/database');
const { selectOne, selectMany, insertRow, updateRow, deleteRow } = require('../utils/pg-helpers');
const router = express.Router();

// Get all visits
router.get('/', async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { agent_id, customer_id, visit_type, status, date_from, date_to, page = 1, limit = 50 } = req.query;
    let sql = `
      SELECT v.*, c.name as customer_name, c.phone as customer_phone,
             u.first_name || ' ' || u.last_name as agent_name,
             r.name as route_name, a.name as area_name
      FROM visits v
      LEFT JOIN customers c ON v.customer_id = c.id
      LEFT JOIN users u ON v.agent_id = u.id
      LEFT JOIN routes r ON c.route_id = r.id
      LEFT JOIN areas a ON r.area_id = a.id
      WHERE v.tenant_id = $1
    `;
    const params = [tenantId];
    let paramIndex = 2;
    
    if (agent_id) {
      sql += ` AND v.agent_id = $${paramIndex}`;
      params.push(agent_id);
      paramIndex++;
    }
    if (customer_id) {
      sql += ` AND v.customer_id = $${paramIndex}`;
      params.push(customer_id);
      paramIndex++;
    }
    if (visit_type) {
      sql += ` AND v.visit_type = $${paramIndex}`;
      params.push(visit_type);
      paramIndex++;
    }
    if (status) {
      sql += ` AND v.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    if (date_from) {
      sql += ` AND v.visit_date >= $${paramIndex}`;
      params.push(date_from);
      paramIndex++;
    }
    if (date_to) {
      sql += ` AND v.visit_date <= $${paramIndex}`;
      params.push(date_to);
      paramIndex++;
    }
    
    sql += ` ORDER BY v.visit_date DESC, v.check_in_time DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));
    
    const rows = await getQuery(sql, params);
    const visits = rows.map(row => ({
      ...row,
      photos: row.photos ? JSON.parse(row.photos) : []
    }));
    
    // Get summary stats
    const stats = await getOneQuery(`
      SELECT 
        COUNT(*) as total_visits,
        SUM(CASE WHEN visit_date::date = CURRENT_DATE THEN 1 ELSE 0 END) as today_visits,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_visits,
        AVG(CASE WHEN check_in_time IS NOT NULL AND check_out_time IS NOT NULL 
            THEN EXTRACT(EPOCH FROM (check_out_time::timestamp - check_in_time::timestamp)) / 60
            ELSE NULL END) as avg_duration_minutes
      FROM visits 
      WHERE tenant_id = $1 AND visit_date::date >= CURRENT_DATE - INTERVAL '7 days'
    `, [tenantId]);
    
    res.json({
      success: true,
      data: {
        visits,
        stats,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching visits:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Create new visit
router.post('/', async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const {
      agent_id,
      customer_id,
      visit_date,
      visit_type,
      purpose,
      latitude,
      longitude,
      status = 'planned'
    } = req.body;
    
    if (!agent_id || !customer_id || !visit_date) {
      return res.status(400).json({ 
        success: false, 
        message: 'Agent ID, customer ID, and visit date are required' 
      });
    }
    
    // Validate agent exists
    const agent = await selectOne('users', { id: agent_id }, tenantId);
    if (!agent) {
      return res.status(400).json({ 
        success: false, 
        message: 'Agent not found' 
      });
    }
    
    // Validate customer exists
    const customer = await selectOne('customers', { id: customer_id }, tenantId);
    if (!customer) {
      return res.status(400).json({ 
        success: false, 
        message: 'Customer not found' 
      });
    }
    
    const visitData = {
      agent_id,
      customer_id,
      visit_date,
      visit_type,
      purpose,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      status
    };
    
    const newVisit = await insertRow('visits', visitData, tenantId);
    
    res.status(201).json({
      success: true,
      data: { visit: newVisit },
      message: 'Visit created successfully'
    });
  } catch (error) {
    console.error('Error creating visit:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get visit by ID
router.get('/:id', async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;
    const visit = await getOneQuery(`
      SELECT v.*, c.name as customer_name, c.phone as customer_phone, c.address as customer_address,
             u.first_name || ' ' || u.last_name as agent_name,
             r.name as route_name, a.name as area_name
      FROM visits v
      LEFT JOIN customers c ON v.customer_id = c.id
      LEFT JOIN users u ON v.agent_id = u.id
      LEFT JOIN routes r ON c.route_id = r.id
      LEFT JOIN areas a ON r.area_id = a.id
      WHERE v.id = $1 AND v.tenant_id = $2
    `, [id, tenantId]);
    
    if (!visit) {
      return res.status(404).json({ 
        success: false, 
        message: 'Visit not found' 
      });
    }
    
    // Parse photos
    visit.photos = visit.photos ? JSON.parse(visit.photos) : [];
    
    res.json({
      success: true,
      data: { visit }
    });
  } catch (error) {
    console.error('Error fetching visit:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Update visit (check-in, check-out, complete)
router.put('/:id', async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;
    const {
      check_in_time,
      check_out_time,
      latitude,
      longitude,
      outcome,
      notes,
      photos,
      status
    } = req.body;
    
    const existingVisit = await selectOne('visits', { id }, tenantId);
    if (!existingVisit) {
      return res.status(404).json({ 
        success: false, 
        message: 'Visit not found' 
      });
    }
    
    const updateData = {};
    if (check_in_time) updateData.check_in_time = check_in_time;
    if (check_out_time) updateData.check_out_time = check_out_time;
    if (latitude !== undefined) updateData.latitude = latitude ? parseFloat(latitude) : null;
    if (longitude !== undefined) updateData.longitude = longitude ? parseFloat(longitude) : null;
    if (outcome) updateData.outcome = outcome;
    if (notes !== undefined) updateData.notes = notes;
    if (photos) updateData.photos = JSON.stringify(photos);
    if (status) updateData.status = status;
    
    await updateRow('visits', updateData, { id }, tenantId);
    
    res.json({
      success: true,
      message: 'Visit updated successfully'
    });
  } catch (error) {
    console.error('Error updating visit:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Delete visit
router.delete('/:id', async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;
    
    const existingVisit = await selectOne('visits', { id }, tenantId);
    if (!existingVisit) {
      return res.status(404).json({ 
        success: false, 
        message: 'Visit not found' 
      });
    }
    
    // Only allow deletion of planned visits
    if (existingVisit.status !== 'planned') {
      return res.status(400).json({ 
        success: false, 
        message: 'Only planned visits can be deleted' 
      });
    }
    
    await deleteRow('visits', { id }, tenantId);
    
    res.json({
      success: true,
      message: 'Visit deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting visit:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Check-in to visit
router.post('/:id/checkin', async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;
    const { latitude, longitude } = req.body;
    
    const existingVisit = await selectOne('visits', { id }, tenantId);
    if (!existingVisit) {
      return res.status(404).json({ 
        success: false, 
        message: 'Visit not found' 
      });
    }
    
    if (existingVisit.check_in_time) {
      return res.status(400).json({ 
        success: false, 
        message: 'Already checked in to this visit' 
      });
    }
    
    const updateData = {
      check_in_time: new Date().toISOString(),
      status: 'in_progress'
    };
    
    if (latitude) updateData.latitude = parseFloat(latitude);
    if (longitude) updateData.longitude = parseFloat(longitude);
    
    await updateRow('visits', updateData, { id }, tenantId);
    
    res.json({
      success: true,
      message: 'Checked in successfully'
    });
  } catch (error) {
    console.error('Error checking in:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Check-out from visit
router.post('/:id/checkout', async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;
    const { outcome, notes, photos } = req.body;
    
    const existingVisit = await selectOne('visits', { id }, tenantId);
    if (!existingVisit) {
      return res.status(404).json({ 
        success: false, 
        message: 'Visit not found' 
      });
    }
    
    if (!existingVisit.check_in_time) {
      return res.status(400).json({ 
        success: false, 
        message: 'Must check in before checking out' 
      });
    }
    
    if (existingVisit.check_out_time) {
      return res.status(400).json({ 
        success: false, 
        message: 'Already checked out from this visit' 
      });
    }
    
    const updateData = {
      check_out_time: new Date().toISOString(),
      status: 'completed'
    };
    
    if (outcome) updateData.outcome = outcome;
    if (notes) updateData.notes = notes;
    if (photos) updateData.photos = JSON.stringify(photos);
    
    await updateRow('visits', updateData, { id }, tenantId);
    
    res.json({
      success: true,
      message: 'Checked out successfully'
    });
  } catch (error) {
    console.error('Error checking out:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get visits by agent
router.get('/agent/:agentId', async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { agentId } = req.params;
    const { date, status } = req.query;
    let sql = `
      SELECT v.*, c.name as customer_name, c.phone as customer_phone, c.address as customer_address
      FROM visits v
      LEFT JOIN customers c ON v.customer_id = c.id
      WHERE v.tenant_id = $1 AND v.agent_id = $2
    `;
    const params = [tenantId, agentId];
    let paramIndex = 3;
    
    if (date) {
      sql += ` AND v.visit_date::date = $${paramIndex}`;
      params.push(date);
      paramIndex++;
    }
    if (status) {
      sql += ` AND v.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    sql += ' ORDER BY v.visit_date DESC, v.check_in_time DESC';
    
    const visits = await getQuery(sql, params);
    
    res.json({
      success: true,
      data: { visits }
    });
  } catch (error) {
    console.error('Error fetching agent visits:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get visits by customer
router.get('/customer/:customerId', async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { customerId } = req.params;
    const { limit = 10 } = req.query;
    const visits = await getQuery(`
      SELECT v.*, u.first_name || ' ' || u.last_name as agent_name
      FROM visits v
      LEFT JOIN users u ON v.agent_id = u.id
      WHERE v.tenant_id = $1 AND v.customer_id = $2
      ORDER BY v.visit_date DESC
      LIMIT $3
    `, [tenantId, customerId, parseInt(limit)]);
    
    res.json({
      success: true,
      data: { visits }
    });
  } catch (error) {
    console.error('Error fetching customer visits:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/visits/stats - Visit statistics
router.get('/stats', async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { date_from, date_to, agent_id } = req.query;
    
    let whereClause = 'WHERE v.tenant_id = $1';
    const params = [tenantId];
    let paramIndex = 2;
    
    if (date_from) {
      whereClause += ` AND v.visit_date::date >= $${paramIndex}`;
      params.push(date_from);
      paramIndex++;
    }
    if (date_to) {
      whereClause += ` AND v.visit_date::date <= $${paramIndex}`;
      params.push(date_to);
      paramIndex++;
    }
    if (agent_id) {
      whereClause += ` AND v.agent_id = $${paramIndex}`;
      params.push(agent_id);
      paramIndex++;
    }
    
    const [overallStats, statusBreakdown, agentPerformance, dailyTrend] = await Promise.all([
      // Overall statistics
      getOneQuery(`
        SELECT 
          COUNT(*) as total_visits,
          COUNT(CASE WHEN v.status = 'completed' THEN 1 END) as completed_visits,
          COUNT(CASE WHEN v.status = 'scheduled' THEN 1 END) as scheduled_visits,
          COUNT(CASE WHEN v.status = 'cancelled' THEN 1 END) as cancelled_visits,
          COUNT(CASE WHEN v.check_in_time IS NOT NULL THEN 1 END) as checked_in_visits,
          AVG(CASE 
            WHEN v.check_out_time IS NOT NULL AND v.check_in_time IS NOT NULL 
            THEN EXTRACT(EPOCH FROM (v.check_out_time::timestamp - v.check_in_time::timestamp)) / 60
          END) as avg_visit_duration_minutes,
          COUNT(DISTINCT v.customer_id) as unique_customers,
          COUNT(DISTINCT v.agent_id) as active_agents
        FROM visits v
        ${whereClause}
      `, params).then(row => row || {}),
      
      // Status breakdown
      getQuery(`
        SELECT 
          v.status,
          COUNT(*) as count,
          COUNT(DISTINCT v.agent_id) as agent_count
        FROM visits v
        ${whereClause}
        GROUP BY v.status
        ORDER BY count DESC
      `, params).then(rows => rows || []),
      
      // Agent performance
      getQuery(`
        SELECT 
          v.agent_id,
          u.first_name || ' ' || u.last_name as agent_name,
          COUNT(*) as total_visits,
          COUNT(CASE WHEN v.status = 'completed' THEN 1 END) as completed_visits,
          AVG(CASE 
            WHEN v.check_out_time IS NOT NULL AND v.check_in_time IS NOT NULL 
            THEN EXTRACT(EPOCH FROM (v.check_out_time::timestamp - v.check_in_time::timestamp)) / 60
          END) as avg_duration_minutes,
          COUNT(DISTINCT v.customer_id) as unique_customers
        FROM visits v
        LEFT JOIN users u ON v.agent_id = u.id
        ${whereClause}
        GROUP BY v.agent_id, u.first_name, u.last_name
        ORDER BY completed_visits DESC
        LIMIT 10
      `, params).then(rows => rows || []),
      
      // Daily trend (last 30 days)
      getQuery(`
        SELECT 
          v.visit_date::date as date,
          COUNT(*) as total_visits,
          COUNT(CASE WHEN v.status = 'completed' THEN 1 END) as completed_visits,
          COUNT(DISTINCT v.agent_id) as active_agents
        FROM visits v
        WHERE v.tenant_id = $1
        AND v.visit_date::date >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY v.visit_date::date
        ORDER BY date DESC
      `, [tenantId]).then(rows => rows || [])
    ]);
    
    res.json({
      success: true,
      data: {
        overall: {
          ...overallStats,
          avg_visit_duration_minutes: parseFloat((overallStats.avg_visit_duration_minutes || 0).toFixed(2)),
          completion_rate: overallStats.total_visits > 0 
            ? parseFloat(((overallStats.completed_visits / overallStats.total_visits) * 100).toFixed(2))
            : 0
        },
        statusBreakdown,
        topAgents: agentPerformance,
        dailyTrend
      }
    });
  } catch (error) {
    console.error('Error fetching visit stats:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch visit statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
