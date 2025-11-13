const express = require('express');
const { getQuery, getOneQuery, runQuery } = require('../utils/database');
const router = express.Router();

// Lazy load database functions to avoid circular dependencies
const getDatabase = () => require('../utils/database').getDatabase();
const { insertQuery, updateQuery, deleteQuery } = (() => {
  try {
    return require('../database/queries');
  } catch (error) {
    console.warn('Queries module not found, using fallback functions');
    return {
      getQuery: (table, conditions = {}, tenantId) => {
        return new Promise((resolve, reject) => {
          let sql = `SELECT * FROM ${table}`;
          const params = [];
          
          if (tenantId) {
            sql += ' WHERE tenant_id = $1';
            params.push(tenantId);
          }
          
          Object.keys(conditions).forEach((key, index) => {
            sql += tenantId ? ' AND' : ' WHERE';
            sql += ` ${key} = ?`;
            params.push(conditions[key]);
          });
          
          db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
          });
        });
      },
      getOneQuery: (table, conditions, tenantId) => {
        return new Promise((resolve, reject) => {
          let sql = `SELECT * FROM ${table}`;
          const params = [];
          
          if (tenantId) {
            sql += ' WHERE tenant_id = $1';
            params.push(tenantId);
          }
          
          Object.keys(conditions).forEach((key, index) => {
            sql += tenantId ? ' AND' : ' WHERE';
            sql += ` ${key} = ?`;
            params.push(conditions[key]);
          });
          
          sql += ' LIMIT 1';
          
          db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
          });
        });
      },
      insertQuery: (table, data) => {
        return new Promise((resolve, reject) => {
          const keys = Object.keys(data);
          const values = Object.values(data);
          const placeholders = keys.map(() => '$1').join(', ');
          
          const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`;
          
          db.run(sql, values, function(err) {
            if (err) reject(err);
            else resolve({ id: this.lastID, changes: this.changes });
          });
        });
      },
      updateQuery: (table, data, conditions, tenantId) => {
        return new Promise((resolve, reject) => {
          const setClause = Object.keys(data).map(key => `${key} = $1`).join(', ');
          const values = Object.values(data);
          
          let sql = `UPDATE ${table} SET ${setClause}`;
          
          if (tenantId) {
            sql += ' WHERE tenant_id = $1';
            values.push(tenantId);
          }
          
          Object.keys(conditions).forEach((key, index) => {
            sql += tenantId ? ' AND' : ' WHERE';
            sql += ` ${key} = ?`;
            values.push(conditions[key]);
          });
          
          db.run(sql, values, function(err) {
            if (err) reject(err);
            else resolve({ changes: this.changes });
          });
        });
      },
      deleteQuery: (table, conditions, tenantId) => {
        return new Promise((resolve, reject) => {
          let sql = `DELETE FROM ${table}`;
          const params = [];
          
          if (tenantId) {
            sql += ' WHERE tenant_id = $1';
            params.push(tenantId);
          }
          
          Object.keys(conditions).forEach((key, index) => {
            sql += tenantId ? ' AND' : ' WHERE';
            sql += ` ${key} = ?`;
            params.push(conditions[key]);
          });
          
          db.run(sql, params, function(err) {
            if (err) reject(err);
            else resolve({ changes: this.changes });
          });
        });
      }
    };
  }
})();

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
      LEFT JOIN users ag ON v.agent_id = ag.id
      LEFT JOIN users u ON ag.user_id = u.id
      LEFT JOIN routes r ON c.route_id = r.id
      LEFT JOIN areas a ON r.area_id = a.id
      WHERE v.tenant_id = $1
    `;
    const params = [tenantId];
    
    if (agent_id) {
      sql += ' AND v.agent_id = ?';
      params.push(agent_id);
    }
    if (customer_id) {
      sql += ' AND v.customer_id = ?';
      params.push(customer_id);
    }
    if (visit_type) {
      sql += ' AND v.visit_type = ?';
      params.push(visit_type);
    }
    if (status) {
      sql += ' AND v.status = ?';
      params.push(status);
    }
    if (date_from) {
      sql += ' AND v.visit_date >= ?';
      params.push(date_from);
    }
    if (date_to) {
      sql += ' AND v.visit_date <= ?';
      params.push(date_to);
    }
    
    sql += ` ORDER BY v.visit_date DESC, v.check_in_time DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));
    
    const visits = await new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows.map(row => ({
          ...row,
          photos: row.photos ? JSON.parse(row.photos) : []
        })));
      });
    });
    
    // Get summary stats
    const stats = await new Promise((resolve, reject) => {
      db.get(`
        SELECT 
          COUNT(*) as total_visits,
          SUM(CASE WHEN visit_date::date = CURRENT_DATE THEN 1 ELSE 0 END) as today_visits,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_visits,
          AVG(CASE WHEN check_in_time IS NOT NULL AND check_out_time IS NOT NULL 
              THEN (julianday(check_out_time) - julianday(check_in_time)) * 24 * 60 
              ELSE NULL END) as avg_duration_minutes
        FROM visits 
        WHERE tenant_id = ? AND visit_date::date >= CURRENT_DATE - INTERVAL '7 days'
      `, [tenantId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
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
    const agent = await getOneQuery('agents', { id: agent_id }, tenantId);
    if (!agent) {
      return res.status(400).json({ 
        success: false, 
        message: 'Agent not found' 
      });
    }
    
    // Validate customer exists
    const customer = await getOneQuery('customers', { id: customer_id }, tenantId);
    if (!customer) {
      return res.status(400).json({ 
        success: false, 
        message: 'Customer not found' 
      });
    }
    
    const visitData = {
      tenant_id: tenantId,
      agent_id,
      customer_id,
      visit_date,
      visit_type,
      purpose,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      status
    };
    
    await insertQuery('visits', visitData);
    
    res.status(201).json({
      success: true,
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
    const visit = await new Promise((resolve, reject) => {
      db.get(`
        SELECT v.*, c.name as customer_name, c.phone as customer_phone, c.address as customer_address,
               u.first_name || ' ' || u.last_name as agent_name,
               r.name as route_name, a.name as area_name
        FROM visits v
        LEFT JOIN customers c ON v.customer_id = c.id
        LEFT JOIN users ag ON v.agent_id = ag.id
        LEFT JOIN users u ON ag.user_id = u.id
        LEFT JOIN routes r ON c.route_id = r.id
        LEFT JOIN areas a ON r.area_id = a.id
        WHERE v.id = ? AND v.tenant_id = $2
      `, [id, tenantId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
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
    
    const existingVisit = await getOneQuery('visits', { id }, tenantId);
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
    
    await updateQuery('visits', updateData, { id }, tenantId);
    
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
    
    const existingVisit = await getOneQuery('visits', { id }, tenantId);
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
    
    await deleteQuery('visits', { id }, tenantId);
    
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
    
    const existingVisit = await getOneQuery('visits', { id }, tenantId);
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
    
    await updateQuery('visits', updateData, { id }, tenantId);
    
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
    
    const existingVisit = await getOneQuery('visits', { id }, tenantId);
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
    
    await updateQuery('visits', updateData, { id }, tenantId);
    
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
      WHERE v.tenant_id = ? AND v.agent_id = $2
    `;
    const params = [tenantId, agentId];
    
    if (date) {
      sql += ' AND v.visit_date::date = ?';
      params.push(date);
    }
    if (status) {
      sql += ' AND v.status = ?';
      params.push(status);
    }
    
    sql += ' ORDER BY v.visit_date DESC, v.check_in_time DESC';
    
    const visits = await new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
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
    const visits = await new Promise((resolve, reject) => {
      db.all(`
        SELECT v.*, u.first_name || ' ' || u.last_name as agent_name
        FROM visits v
        LEFT JOIN users a ON v.agent_id = a.id
        LEFT JOIN users u ON a.user_id = u.id
        WHERE v.tenant_id = ? AND v.customer_id = $2
        ORDER BY v.visit_date DESC
        LIMIT ?
      `, [tenantId, customerId, parseInt(limit)], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
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
    
    if (date_from) {
      whereClause += ' AND v.visit_date::date >= $1';
      params.push(date_from);
    }
    if (date_to) {
      whereClause += ' AND v.visit_date::date <= $1';
      params.push(date_to);
    }
    if (agent_id) {
      whereClause += ' AND v.agent_id = $1';
      params.push(agent_id);
    }
    
    const [overallStats, statusBreakdown, agentPerformance, dailyTrend] = await Promise.all([
      // Overall statistics
      new Promise((resolve, reject) => {
        db.get(`
          SELECT 
            COUNT(*) as total_visits,
            COUNT(CASE WHEN v.status = 'completed' THEN 1 END) as completed_visits,
            COUNT(CASE WHEN v.status = 'scheduled' THEN 1 END) as scheduled_visits,
            COUNT(CASE WHEN v.status = 'cancelled' THEN 1 END) as cancelled_visits,
            COUNT(CASE WHEN v.check_in_time IS NOT NULL THEN 1 END) as checked_in_visits,
            AVG(CASE 
              WHEN v.check_out_time IS NOT NULL AND v.check_in_time IS NOT NULL 
              THEN (julianday(v.check_out_time) - julianday(v.check_in_time)) * 24 * 60 
            END) as avg_visit_duration_minutes,
            COUNT(DISTINCT v.customer_id) as unique_customers,
            COUNT(DISTINCT v.agent_id) as active_agents
          FROM visits v
          ${whereClause}
        `, params, (err, row) => err ? reject(err) : resolve(row || {}));
      }),
      
      // Status breakdown
      new Promise((resolve, reject) => {
        db.all(`
          SELECT 
            v.status,
            COUNT(*) as count,
            COUNT(DISTINCT v.agent_id) as agent_count
          FROM visits v
          ${whereClause}
          GROUP BY v.status
          ORDER BY count DESC
        `, params, (err, rows) => err ? reject(err) : resolve(rows || []));
      }),
      
      // Agent performance
      new Promise((resolve, reject) => {
        db.all(`
          SELECT 
            v.agent_id,
            u.first_name || ' ' || u.last_name as agent_name,
            COUNT(*) as total_visits,
            COUNT(CASE WHEN v.status = 'completed' THEN 1 END) as completed_visits,
            AVG(CASE 
              WHEN v.check_out_time IS NOT NULL AND v.check_in_time IS NOT NULL 
              THEN (julianday(v.check_out_time) - julianday(v.check_in_time)) * 24 * 60 
            END) as avg_duration_minutes,
            COUNT(DISTINCT v.customer_id) as unique_customers
          FROM visits v
          LEFT JOIN users a ON v.agent_id = a.id
          LEFT JOIN users u ON a.user_id = u.id
          ${whereClause}
          GROUP BY v.agent_id, agent_name
          ORDER BY completed_visits DESC
          LIMIT 10
        `, params, (err, rows) => err ? reject(err) : resolve(rows || []));
      }),
      
      // Daily trend (last 30 days)
      new Promise((resolve, reject) => {
        db.all(`
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
        `, [tenantId], (err, rows) => err ? reject(err) : resolve(rows || []));
      })
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
