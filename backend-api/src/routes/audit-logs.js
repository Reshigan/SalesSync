const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { getQuery, getOneQuery, runQuery } = require('../utils/database');
const { v4: uuidv4 } = require('uuid');

router.get('/', asyncHandler(async (req, res) => {
  const tenantId = req.tenantId;
  const { user_id, action, resource, start_date, end_date, limit = 100, offset = 0 } = req.query;
  
  let query = `
    SELECT 
      al.id,
      al.user_id,
      u.first_name || ' ' || u.last_name as user_name,
      u.email as user_email,
      al.action,
      al.resource,
      al.resource_id,
      al.details,
      al.ip_address,
      al.created_at
    FROM audit_logs al
    LEFT JOIN users u ON al.user_id = u.id
    WHERE al.tenant_id = $1
  `;
  const params = [tenantId];
  let paramIndex = 2;
  
  if (user_id) {
    query += ` AND al.user_id = $${paramIndex}`;
    params.push(user_id);
    paramIndex++;
  }
  
  if (action) {
    query += ` AND al.action = $${paramIndex}`;
    params.push(action);
    paramIndex++;
  }
  
  if (resource) {
    query += ` AND al.resource = $${paramIndex}`;
    params.push(resource);
    paramIndex++;
  }
  
  if (start_date) {
    query += ` AND al.created_at >= $${paramIndex}`;
    params.push(start_date);
    paramIndex++;
  }
  
  if (end_date) {
    query += ` AND al.created_at <= $${paramIndex}`;
    params.push(end_date);
    paramIndex++;
  }
  
  query += ` ORDER BY al.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(parseInt(limit), parseInt(offset));
  
  let logs = [];
  let total = 0;
  
  try {
    await runQuery(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY,
        tenant_id UUID NOT NULL,
        user_id UUID,
        action VARCHAR(50) NOT NULL,
        resource VARCHAR(100) NOT NULL,
        resource_id UUID,
        details JSONB,
        ip_address VARCHAR(45),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tenant_id) REFERENCES tenants(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);
    
    await runQuery(`
      CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_created 
      ON audit_logs(tenant_id, created_at DESC)
    `);
    
    await runQuery(`
      CREATE INDEX IF NOT EXISTS idx_audit_logs_user 
      ON audit_logs(user_id, created_at DESC)
    `);
    
    await runQuery(`
      CREATE INDEX IF NOT EXISTS idx_audit_logs_resource 
      ON audit_logs(resource, resource_id)
    `);
  } catch (error) {
    console.log('Audit logs table already exists or error creating:', error.message);
  }
  
  try {
    logs = await getQuery(query, params);
    
    let countQuery = `SELECT COUNT(*) as total FROM audit_logs WHERE tenant_id = $1`;
    const countParams = [tenantId];
    let countParamIndex = 2;
    
    if (user_id) {
      countQuery += ` AND user_id = $${countParamIndex}`;
      countParams.push(user_id);
      countParamIndex++;
    }
    if (action) {
      countQuery += ` AND action = $${countParamIndex}`;
      countParams.push(action);
      countParamIndex++;
    }
    if (resource) {
      countQuery += ` AND resource = $${countParamIndex}`;
      countParams.push(resource);
      countParamIndex++;
    }
    if (start_date) {
      countQuery += ` AND created_at >= $${countParamIndex}`;
      countParams.push(start_date);
      countParamIndex++;
    }
    if (end_date) {
      countQuery += ` AND created_at <= $${countParamIndex}`;
      countParams.push(end_date);
    }
    
    const countResult = await getOneQuery(countQuery, countParams);
    total = parseInt(countResult?.total || 0);
  } catch (error) {
    console.log('Audit logs table not yet created or error:', error.message);
  }
  
  res.json({
    success: true,
    data: logs || [],
    pagination: {
      total,
      limit: parseInt(limit),
      offset: parseInt(offset),
      has_more: total > (parseInt(offset) + parseInt(limit))
    }
  });
}));

router.post('/', asyncHandler(async (req, res) => {
  const { action, resource, resource_id, details } = req.body;
  const tenantId = req.tenantId;
  const userId = req.user?.id;
  const ipAddress = req.ip || req.connection?.remoteAddress;
  
  if (!action || !resource) {
    return res.status(400).json({
      success: false,
      error: 'action and resource are required'
    });
  }
  
  const id = uuidv4();
  
  try {
    await runQuery(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY,
        tenant_id UUID NOT NULL,
        user_id UUID,
        action VARCHAR(50) NOT NULL,
        resource VARCHAR(100) NOT NULL,
        resource_id UUID,
        details JSONB,
        ip_address VARCHAR(45),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tenant_id) REFERENCES tenants(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);
  } catch (error) {
    console.log('Audit logs table already exists or error creating:', error.message);
  }
  
  try {
    await runQuery(`
      INSERT INTO audit_logs (id, tenant_id, user_id, action, resource, resource_id, details, ip_address)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [id, tenantId, userId, action, resource, resource_id || null, details ? JSON.stringify(details) : null, ipAddress || null]);
    
    res.json({
      success: true,
      message: 'Audit log created',
      data: { id }
    });
  } catch (error) {
    console.error('Error creating audit log:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create audit log'
    });
  }
}));

router.get('/stats', asyncHandler(async (req, res) => {
  const tenantId = req.tenantId;
  const { start_date, end_date } = req.query;
  
  let dateFilter = '';
  const params = [tenantId];
  let paramIndex = 2;
  
  if (start_date) {
    dateFilter += ` AND created_at >= $${paramIndex}`;
    params.push(start_date);
    paramIndex++;
  }
  
  if (end_date) {
    dateFilter += ` AND created_at <= $${paramIndex}`;
    params.push(end_date);
  }
  
  let stats = {
    total_logs: 0,
    by_action: [],
    by_resource: [],
    by_user: []
  };
  
  try {
    const totalResult = await getOneQuery(`
      SELECT COUNT(*) as total FROM audit_logs WHERE tenant_id = $1${dateFilter}
    `, params);
    stats.total_logs = parseInt(totalResult?.total || 0);
    
    stats.by_action = await getQuery(`
      SELECT action, COUNT(*) as count
      FROM audit_logs
      WHERE tenant_id = $1${dateFilter}
      GROUP BY action
      ORDER BY count DESC
      LIMIT 10
    `, params);
    
    stats.by_resource = await getQuery(`
      SELECT resource, COUNT(*) as count
      FROM audit_logs
      WHERE tenant_id = $1${dateFilter}
      GROUP BY resource
      ORDER BY count DESC
      LIMIT 10
    `, params);
    
    stats.by_user = await getQuery(`
      SELECT 
        u.first_name || ' ' || u.last_name as user_name,
        COUNT(*) as count
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE al.tenant_id = $1${dateFilter}
      GROUP BY u.id, u.first_name, u.last_name
      ORDER BY count DESC
      LIMIT 10
    `, params);
  } catch (error) {
    console.log('Audit logs table not yet created or error:', error.message);
  }
  
  res.json({
    success: true,
    data: stats
  });
}));

module.exports = router;
