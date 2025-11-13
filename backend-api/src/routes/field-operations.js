const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { getQuery, getOneQuery, runQuery } = require('../utils/database');

// Get all field operations (using visits table)
router.get('/', asyncHandler(async (req, res) => {
  const tenantId = req.tenantId;
  
  const operations = await getQuery(`
    SELECT 
      v.id,
      'visit' as operation_type,
      v.agent_id,
      v.customer_id,
      v.status,
      v.visit_date as scheduled_date,
      v.check_out_time as completed_date,
      v.created_at
    FROM visits v
    WHERE v.tenant_id = ?
    ORDER BY v.created_at DESC
    LIMIT 100
  `, [tenantId]);

  res.json({
    success: true,
    data: operations || []
  });
}));

// Create new field operation (creates a visit)
router.post('/', asyncHandler(async (req, res) => {
  const {
    agent_id,
    customer_id,
    scheduled_date,
    description
  } = req.body;

  const operationId = require('crypto').randomUUID();
  
  const result = await runQuery(
    `INSERT INTO visits (
      id, tenant_id, agent_id, customer_id,
      visit_date, status, notes, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      operationId,
      req.tenantId,
      agent_id,
      customer_id,
      scheduled_date || new Date().toISOString(),
      'scheduled',
      description || '',
      new Date().toISOString()
    ]
  );

  res.status(201).json({
    success: true,
    data: {
      id: operationId,
      operation_type: 'visit',
      agent_id,
      customer_id,
      status: 'scheduled'
    }
  });
}));

// Get live agent locations (MUST come before /:id to avoid route shadowing)
router.get('/live/agent-locations', asyncHandler(async (req, res) => {
  const tenantId = req.tenantId;
  
  const locations = await getQuery(`
    SELECT 
      a.id as agent_id,
      u.first_name || ' ' || u.last_name as agent_name,
      u.phone,
      u.email,
      v.latitude,
      v.longitude,
      v.visit_date as timestamp,
      v.status,
      c.name as customer_name,
      c.id as customer_id
    FROM users WHERE role IN ('agent', 'sales_agent', 'field_agent') a
    LEFT JOIN users u ON a.user_id = u.id
    LEFT JOIN visits v ON a.id = v.agent_id AND v.tenant_id = ?
    LEFT JOIN customers c ON v.customer_id = c.id
    WHERE a.tenant_id = ? 
      AND v.latitude IS NOT NULL 
      AND v.longitude IS NOT NULL
    ORDER BY v.visit_date DESC
  `, [tenantId, tenantId]);

  res.json({
    success: true,
    data: locations || []
  });
}));

// Get active visits (MUST come before /:id to avoid route shadowing)
router.get('/live/active-visits', asyncHandler(async (req, res) => {
  const tenantId = req.tenantId;
  
  const activeVisits = await getQuery(`
    SELECT 
      v.*,
      a.id as agent_id,
      u.first_name || ' ' || u.last_name as agent_name,
      c.name as customer_name,
      c.address as customer_address,
      c.latitude as customer_latitude,
      c.longitude as customer_longitude
    FROM visits v
    JOIN users a ON v.agent_id = a.id
    LEFT JOIN users u ON a.user_id = u.id
    JOIN customers c ON v.customer_id = c.id
    WHERE v.tenant_id = ? AND v.status = 'in_progress'
    ORDER BY v.visit_date DESC
  `, [tenantId]);

  res.json({
    success: true,
    data: activeVisits || []
  });
}));

// Get operations by agent
router.get('/agent/:agentId', asyncHandler(async (req, res) => {
  const { agentId } = req.params;
  const tenantId = req.tenantId;
  
  const operations = await getQuery(`
    SELECT 
      id, agent_id, customer_id, status,
      visit_date as scheduled_date, check_out_time as completed_date,
      created_at
    FROM visits 
    WHERE agent_id = ? AND tenant_id = ?
    ORDER BY visit_date DESC
  `, [agentId, tenantId]);

  res.json({
    success: true,
    data: operations || []
  });
}));

// Get operations by status
router.get('/status/:status', asyncHandler(async (req, res) => {
  const { status } = req.params;
  const tenantId = req.tenantId;
  
  const operations = await getQuery(`
    SELECT 
      id, agent_id, customer_id, status,
      visit_date as scheduled_date, check_out_time as completed_date,
      created_at
    FROM visits 
    WHERE status = ? AND tenant_id = ?
    ORDER BY visit_date DESC
  `, [status, tenantId]);

  res.json({
    success: true,
    data: operations || []
  });
}));

// Get field operations stats
router.get('/stats', asyncHandler(async (req, res) => {
  const tenantId = req.tenantId;
  const { start_date, end_date } = req.query;
  
  let dateFilter = '';
  const params = [tenantId];
  
  if (start_date) {
    dateFilter += ' AND v.visit_date >= $2';
    params.push(start_date);
  }
  if (end_date) {
    dateFilter += ` AND v.visit_date <= $${params.length + 1}`;
    params.push(end_date);
  }
  
  const stats = await getOneQuery(`
    SELECT 
      COUNT(*)::int as total_visits,
      COUNT(CASE WHEN v.status = 'completed' THEN 1 END)::int as completed_visits,
      COUNT(CASE WHEN v.status = 'in_progress' THEN 1 END)::int as in_progress_visits,
      COUNT(CASE WHEN v.status = 'scheduled' THEN 1 END)::int as scheduled_visits,
      COUNT(DISTINCT v.agent_id)::int as active_agents,
      COUNT(DISTINCT v.customer_id)::int as customers_visited
    FROM visits v
    WHERE v.tenant_id = $1${dateFilter}
  `, params);

  res.json({
    success: true,
    data: stats || {}
  });
}));

// Get field agents list
router.get('/agents', asyncHandler(async (req, res) => {
  const tenantId = req.tenantId;
  const { status } = req.query;
  
  let statusFilter = '';
  const params = [tenantId];
  
  if (status) {
    statusFilter = ' AND u.status = $2';
    params.push(status);
  }
  
  const agents = await getQuery(`
    SELECT 
      u.id,
      u.first_name || ' ' || u.last_name as name,
      u.email,
      u.phone,
      u.status,
      COUNT(v.id)::int as total_visits,
      COUNT(CASE WHEN v.status = 'completed' THEN 1 END)::int as completed_visits
    FROM users u
    LEFT JOIN visits v ON u.id = v.agent_id AND v.tenant_id = $1
    WHERE u.tenant_id = $1 AND u.role = 'agent'${statusFilter}
    GROUP BY u.id, u.first_name, u.last_name, u.email, u.phone, u.status
    ORDER BY u.first_name, u.last_name
  `, params);

  res.json({
    success: true,
    data: agents || []
  });
}));

// Get field operations analytics/performance
router.get('/analytics/performance', asyncHandler(async (req, res) => {
  const tenantId = req.tenantId;
  const { start_date, end_date } = req.query;
  
  let dateFilter = '';
  const params = [tenantId];
  
  if (start_date) {
    dateFilter += ' AND v.visit_date >= $2';
    params.push(start_date);
  }
  if (end_date) {
    dateFilter += ` AND v.visit_date <= $${params.length + 1}`;
    params.push(end_date);
  }
  
  const performance = await getQuery(`
    SELECT 
      u.id as agent_id,
      u.first_name || ' ' || u.last_name as agent_name,
      COUNT(v.id)::int as total_visits,
      COUNT(CASE WHEN v.status = 'completed' THEN 1 END)::int as completed_visits,
      COUNT(CASE WHEN v.status = 'in_progress' THEN 1 END)::int as in_progress_visits,
      COUNT(CASE WHEN v.status = 'scheduled' THEN 1 END)::int as scheduled_visits,
      ROUND(
        CASE 
          WHEN COUNT(v.id) > 0 
          THEN (COUNT(CASE WHEN v.status = 'completed' THEN 1 END)::float / COUNT(v.id)::float * 100)
          ELSE 0 
        END, 2
      ) as completion_rate
    FROM users u
    LEFT JOIN visits v ON u.id = v.agent_id AND v.tenant_id = $1${dateFilter}
    WHERE u.tenant_id = $1 AND u.role = 'agent'
    GROUP BY u.id, u.first_name, u.last_name
    ORDER BY completed_visits DESC
  `, params);

  res.json({
    success: true,
    data: performance || []
  });
}));

// Test endpoint
router.get('/test/health', asyncHandler(async (req, res) => {
  res.json({
    success: true,
    message: 'Field Operations API is working',
    timestamp: new Date().toISOString()
  });
}));

// Get field operation by ID (MUST come after specific routes to avoid shadowing)
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const tenantId = req.tenantId;
  
  const operation = await getOneQuery(`
    SELECT 
      id, agent_id, customer_id, status,
      visit_date as scheduled_date, check_out_time as completed_date,
      notes as description, created_at
    FROM visits 
    WHERE id = ? AND tenant_id = ?
  `, [id, tenantId]);

  if (!operation) {
    return res.status(404).json({
      success: false,
      message: 'Field operation not found'
    });
  }

  res.json({
    success: true,
    data: operation
  });
}));

// Update field operation
router.put('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const tenantId = req.tenantId;
  const { agent_id, customer_id, scheduled_date, status, completed_date, description } = req.body;
  
  const result = await runQuery(`
    UPDATE visits 
    SET agent_id = ?, customer_id = ?, visit_date = ?, 
        status = ?, check_out_time = ?, notes = ?
    WHERE id = ? AND tenant_id = ?
  `, [agent_id, customer_id, scheduled_date, status, completed_date, description, id, tenantId]);

  if (result.changes === 0) {
    return res.status(404).json({
      success: false,
      message: 'Field operation not found'
    });
  }

  res.json({
    success: true,
    message: 'Field operation updated successfully'
  });
}));

// Delete field operation
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const tenantId = req.tenantId;
  
  const result = await runQuery(`
    DELETE FROM visits 
    WHERE id = ? AND tenant_id = ?
  `, [id, tenantId]);

  if (result.changes === 0) {
    return res.status(404).json({
      success: false,
      message: 'Field operation not found'
    });
  }

  res.json({
    success: true,
    message: 'Field operation deleted successfully'
  });
}));

module.exports = router;
