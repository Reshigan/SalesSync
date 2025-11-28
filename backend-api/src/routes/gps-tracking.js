const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { getQuery, getOneQuery, runQuery } = require('../utils/database');
const { v4: uuidv4 } = require('uuid');

router.post('/location', asyncHandler(async (req, res) => {
  const { agent_id, latitude, longitude, accuracy, timestamp } = req.body;
  const tenantId = req.tenantId;
  
  if (!agent_id || !latitude || !longitude) {
    return res.status(400).json({
      success: false,
      error: 'agent_id, latitude, and longitude are required'
    });
  }
  
  const id = uuidv4();
  const recordedAt = timestamp || new Date().toISOString();
  
  try {
    await runQuery(`
      CREATE TABLE IF NOT EXISTS agent_locations (
        id UUID PRIMARY KEY,
        tenant_id UUID NOT NULL,
        agent_id UUID NOT NULL,
        latitude DECIMAL(10, 8) NOT NULL,
        longitude DECIMAL(11, 8) NOT NULL,
        accuracy DECIMAL(10, 2),
        recorded_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tenant_id) REFERENCES tenants(id),
        FOREIGN KEY (agent_id) REFERENCES users(id)
      )
    `);
    
    await runQuery(`
      CREATE INDEX IF NOT EXISTS idx_agent_locations_tenant_agent 
      ON agent_locations(tenant_id, agent_id, recorded_at DESC)
    `);
  } catch (error) {
    console.log('Agent locations table already exists or error creating:', error.message);
  }
  
  try {
    await runQuery(`
      INSERT INTO agent_locations (id, tenant_id, agent_id, latitude, longitude, accuracy, recorded_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [id, tenantId, agent_id, latitude, longitude, accuracy || null, recordedAt]);
    
    res.json({
      success: true,
      data: {
        id,
        agent_id,
        latitude,
        longitude,
        accuracy,
        recorded_at: recordedAt
      }
    });
  } catch (error) {
    console.error('Error inserting agent location:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record location'
    });
  }
}));

router.get('/agent/:agentId', asyncHandler(async (req, res) => {
  const { agentId } = req.params;
  const { start_date, end_date, limit = 100 } = req.query;
  const tenantId = req.tenantId;
  
  let query = `
    SELECT id, agent_id, latitude, longitude, accuracy, recorded_at, created_at
    FROM agent_locations
    WHERE tenant_id = $1 AND agent_id = $2
  `;
  const params = [tenantId, agentId];
  let paramIndex = 3;
  
  if (start_date) {
    query += ` AND recorded_at >= $${paramIndex}`;
    params.push(start_date);
    paramIndex++;
  }
  
  if (end_date) {
    query += ` AND recorded_at <= $${paramIndex}`;
    params.push(end_date);
    paramIndex++;
  }
  
  query += ` ORDER BY recorded_at DESC LIMIT $${paramIndex}`;
  params.push(parseInt(limit));
  
  let locations = [];
  try {
    locations = await getQuery(query, params);
  } catch (error) {
    console.log('Agent locations table not yet created or error:', error.message);
  }
  
  res.json({
    success: true,
    data: locations || []
  });
}));

router.get('/agent/:agentId/latest', asyncHandler(async (req, res) => {
  const { agentId } = req.params;
  const tenantId = req.tenantId;
  
  let location = null;
  try {
    location = await getOneQuery(`
      SELECT id, agent_id, latitude, longitude, accuracy, recorded_at, created_at
      FROM agent_locations
      WHERE tenant_id = $1 AND agent_id = $2
      ORDER BY recorded_at DESC
      LIMIT 1
    `, [tenantId, agentId]);
  } catch (error) {
    console.log('Agent locations table not yet created or error:', error.message);
  }
  
  res.json({
    success: true,
    data: location || null
  });
}));

router.get('/active-agents', asyncHandler(async (req, res) => {
  const tenantId = req.tenantId;
  const { hours = 1 } = req.query;
  
  let activeAgents = [];
  try {
    activeAgents = await getQuery(`
      SELECT DISTINCT ON (u.id)
        u.id as agent_id,
        u.first_name || ' ' || u.last_name as agent_name,
        u.role,
        al.latitude,
        al.longitude,
        al.accuracy,
        al.recorded_at as last_location_time
      FROM users u
      LEFT JOIN agent_locations al ON u.id = al.agent_id AND u.tenant_id = al.tenant_id
      WHERE u.tenant_id = $1 
        AND u.role IN ($2, $3, $4, $5, $6)
        AND u.status = $7
        AND al.recorded_at >= CURRENT_TIMESTAMP - INTERVAL '${parseInt(hours)} hours'
      ORDER BY u.id, al.recorded_at DESC
    `, [tenantId, 'agent', 'sales_agent', 'field_agent', 'van_sales_agent', 'merchandiser', 'active']);
  } catch (error) {
    console.log('Agent locations table not yet created or error:', error.message);
  }
  
  res.json({
    success: true,
    data: activeAgents || []
  });
}));

router.get('/agent/:agentId/route', asyncHandler(async (req, res) => {
  const { agentId } = req.params;
  const { date } = req.query;
  const tenantId = req.tenantId;
  
  const targetDate = date || new Date().toISOString().split('T')[0];
  
  let route = [];
  try {
    route = await getQuery(`
      SELECT id, agent_id, latitude, longitude, accuracy, recorded_at
      FROM agent_locations
      WHERE tenant_id = $1 
        AND agent_id = $2
        AND DATE(recorded_at) = $3
      ORDER BY recorded_at ASC
    `, [tenantId, agentId, targetDate]);
  } catch (error) {
    console.log('Agent locations table not yet created or error:', error.message);
  }
  
  res.json({
    success: true,
    data: {
      agent_id: agentId,
      date: targetDate,
      route: route || []
    }
  });
}));

module.exports = router;
