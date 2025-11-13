const express = require('express');
const router = express.Router();

// Lazy load database functions to avoid circular dependencies
const getDatabase = () => require('../utils/database').getDatabase();
const { getQuery, getOneQuery, insertQuery, updateQuery, deleteQuery } = (() => {
  try {
    return require('../database/queries');
  } catch (error) {
    console.warn('Queries module not found, using fallback functions');
    return {
      getQuery: (table, conditions = {}, tenantId) => {
        const db = getDatabase();
        return new Promise((resolve, reject) => {
          let sql = `SELECT * FROM ${table}`;
          const params = [];
          
          if (tenantId) {
            sql += ' WHERE tenant_id = ?';
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
        const db = getDatabase();
        return new Promise((resolve, reject) => {
          let sql = `SELECT * FROM ${table}`;
          const params = [];
          
          if (tenantId) {
            sql += ' WHERE tenant_id = ?';
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
        const db = getDatabase();
        return new Promise((resolve, reject) => {
          const keys = Object.keys(data);
          const values = Object.values(data);
          const placeholders = keys.map(() => '?').join(', ');
          
          const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`;
          
          db.run(sql, values, function(err) {
            if (err) reject(err);
            else resolve({ id: this.lastID, changes: this.changes });
          });
        });
      },
      updateQuery: (table, data, conditions, tenantId) => {
        const db = getDatabase();
        return new Promise((resolve, reject) => {
          const setClause = Object.keys(data).map(key => `${key} = ?`).join(', ');
          const values = Object.values(data);
          
          let sql = `UPDATE ${table} SET ${setClause}`;
          
          if (tenantId) {
            sql += ' WHERE tenant_id = ?';
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
        const db = getDatabase();
        return new Promise((resolve, reject) => {
          let sql = `DELETE FROM ${table}`;
          const params = [];
          
          if (tenantId) {
            sql += ' WHERE tenant_id = ?';
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

// Get all vans
router.get('/', async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { status, assigned_salesman_id } = req.query;
    
    const db = getDatabase();
    let sql = `
      SELECT v.*, u.first_name || ' ' || u.last_name as salesman_name,
             COUNT(vl.id) as load_count
      FROM vans v
      LEFT JOIN users a ON v.assigned_salesman_id = a.id
      LEFT JOIN users u ON a.user_id = u.id
      LEFT JOIN van_loads vl ON v.id = vl.van_id AND vl.load_date::date = DATE('now')
      WHERE v.tenant_id = ?
    `;
    const params = [tenantId];
    
    if (status) {
      sql += ' AND v.status = ?';
      params.push(status);
    }
    if (assigned_salesman_id) {
      sql += ' AND v.assigned_salesman_id = ?';
      params.push(assigned_salesman_id);
    }
    
    sql += ' GROUP BY v.id ORDER BY v.registration_number';
    
    const vans = await new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    res.json({
      success: true,
      data: { vans }
    });
  } catch (error) {
    console.error('Error fetching vans:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Create new van
router.post('/', async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const {
      registration_number,
      model,
      capacity_units,
      assigned_salesman_id,
      status = 'active'
    } = req.body;
    
    if (!registration_number) {
      return res.status(400).json({ 
        success: false, 
        message: 'Registration number is required' 
      });
    }
    
    // Check if registration number already exists
    const existingVan = await getOneQuery('vans', { registration_number }, tenantId);
    if (existingVan) {
      return res.status(400).json({ 
        success: false, 
        message: 'Registration number already exists' 
      });
    }
    
    const vanData = {
      tenant_id: tenantId,
      registration_number,
      model,
      capacity_units: capacity_units ? parseInt(capacity_units) : null,
      assigned_salesman_id,
      status
    };
    
    await insertQuery('vans', vanData);
    
    const newVan = await getOneQuery('vans', { registration_number }, tenantId);
    
    res.status(201).json({
      success: true,
      data: { van: newVan },
      message: 'Van created successfully'
    });
  } catch (error) {
    console.error('Error creating van:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get van by ID
router.get('/:id', async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;
    
    const db = getDatabase();
    const van = await new Promise((resolve, reject) => {
      db.get(`
        SELECT v.*, u.first_name || ' ' || u.last_name as salesman_name
        FROM vans v
        LEFT JOIN users a ON v.assigned_salesman_id = a.id
        LEFT JOIN users u ON a.user_id = u.id
        WHERE v.id = ? AND v.tenant_id = ?
      `, [id, tenantId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    if (!van) {
      return res.status(404).json({ 
        success: false, 
        message: 'Van not found' 
      });
    }
    
    // Get recent loads
    const recentLoads = await new Promise((resolve, reject) => {
      db.all(`
        SELECT vl.*, u.first_name || ' ' || u.last_name as salesman_name
        FROM van_loads vl
        LEFT JOIN users a ON vl.salesman_id = a.id
        LEFT JOIN users u ON a.user_id = u.id
        WHERE vl.van_id = ? AND vl.tenant_id = ?
        ORDER BY vl.load_date DESC
        LIMIT 10
      `, [id, tenantId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    res.json({
      success: true,
      data: { 
        van,
        recent_loads: recentLoads
      }
    });
  } catch (error) {
    console.error('Error fetching van:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Update van
router.put('/:id', async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;
    const {
      registration_number,
      model,
      capacity_units,
      assigned_salesman_id,
      status
    } = req.body;
    
    const existingVan = await getOneQuery('vans', { id }, tenantId);
    if (!existingVan) {
      return res.status(404).json({ 
        success: false, 
        message: 'Van not found' 
      });
    }
    
    // Check if registration number is being changed and already exists
    if (registration_number && registration_number !== existingVan.registration_number) {
      const regExists = await getOneQuery('vans', { registration_number }, tenantId);
      if (regExists) {
        return res.status(400).json({ 
          success: false, 
          message: 'Registration number already exists' 
        });
      }
    }
    
    const updateData = {};
    if (registration_number) updateData.registration_number = registration_number;
    if (model) updateData.model = model;
    if (capacity_units !== undefined) updateData.capacity_units = capacity_units ? parseInt(capacity_units) : null;
    if (assigned_salesman_id !== undefined) updateData.assigned_salesman_id = assigned_salesman_id;
    if (status) updateData.status = status;
    
    await updateQuery('vans', updateData, { id }, tenantId);
    
    const updatedVan = await getOneQuery('vans', { id }, tenantId);
    
    res.json({
      success: true,
      data: { van: updatedVan },
      message: 'Van updated successfully'
    });
  } catch (error) {
    console.error('Error updating van:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Delete van
router.delete('/:id', async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;
    
    const existingVan = await getOneQuery('vans', { id }, tenantId);
    if (!existingVan) {
      return res.status(404).json({ 
        success: false, 
        message: 'Van not found' 
      });
    }
    
    // Check if van has load history
    const db = getDatabase();
    const loadCount = await new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM van_loads WHERE van_id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row.count);
      });
    });
    
    if (loadCount > 0) {
      // Soft delete - mark as inactive
      await updateQuery('vans', { status: 'inactive' }, { id }, tenantId);
      res.json({
        success: true,
        message: 'Van marked as inactive (has load history)'
      });
    } else {
      // Hard delete
      await deleteQuery('vans', { id }, tenantId);
      res.json({
        success: true,
        message: 'Van deleted successfully'
      });
    }
  } catch (error) {
    console.error('Error deleting van:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Van loads management
router.get('/loads/list', async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { van_id, salesman_id, status, date_from, date_to, page = 1, limit = 50 } = req.query;
    
    const db = getDatabase();
    let sql = `
      SELECT vl.*, v.registration_number as van_registration,
             u.first_name || ' ' || u.last_name as salesman_name
      FROM van_loads vl
      LEFT JOIN vans v ON vl.van_id = v.id
      LEFT JOIN users a ON vl.salesman_id = a.id
      LEFT JOIN users u ON a.user_id = u.id
      WHERE vl.tenant_id = ?
    `;
    const params = [tenantId];
    
    if (van_id) {
      sql += ' AND vl.van_id = ?';
      params.push(van_id);
    }
    if (salesman_id) {
      sql += ' AND vl.salesman_id = ?';
      params.push(salesman_id);
    }
    if (status) {
      sql += ' AND vl.status = ?';
      params.push(status);
    }
    if (date_from) {
      sql += ' AND vl.load_date >= ?';
      params.push(date_from);
    }
    if (date_to) {
      sql += ' AND vl.load_date <= ?';
      params.push(date_to);
    }
    
    sql += ` ORDER BY vl.load_date DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));
    
    const loads = await new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows.map(row => ({
          ...row,
          stock_loaded: row.stock_loaded ? JSON.parse(row.stock_loaded) : null,
          stock_returned: row.stock_returned ? JSON.parse(row.stock_returned) : null,
          stock_sold: row.stock_sold ? JSON.parse(row.stock_sold) : null
        })));
      });
    });
    
    res.json({
      success: true,
      data: { loads }
    });
  } catch (error) {
    console.error('Error fetching van loads:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Create van load
router.post('/loads', async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const {
      van_id,
      salesman_id,
      load_date,
      stock_loaded,
      cash_float,
      status = 'loading'
    } = req.body;
    
    if (!van_id || !salesman_id || !load_date) {
      return res.status(400).json({ 
        success: false, 
        message: 'Van ID, salesman ID, and load date are required' 
      });
    }
    
    // Validate van exists
    const van = await getOneQuery('vans', { id: van_id }, tenantId);
    if (!van) {
      return res.status(400).json({ 
        success: false, 
        message: 'Van not found' 
      });
    }
    
    // Validate salesman exists
    const salesman = await getOneQuery('agents', { id: salesman_id }, tenantId);
    if (!salesman) {
      return res.status(400).json({ 
        success: false, 
        message: 'Salesman not found' 
      });
    }
    
    const loadData = {
      tenant_id: tenantId,
      van_id,
      salesman_id,
      load_date,
      stock_loaded: stock_loaded ? JSON.stringify(stock_loaded) : null,
      cash_float: cash_float ? parseFloat(cash_float) : null,
      status
    };
    
    await insertQuery('van_loads', loadData);
    
    res.status(201).json({
      success: true,
      message: 'Van load created successfully'
    });
  } catch (error) {
    console.error('Error creating van load:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Update van load (for reconciliation)
router.put('/loads/:loadId', async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { loadId } = req.params;
    const {
      stock_returned,
      stock_sold,
      cash_collected,
      status
    } = req.body;
    
    const existingLoad = await getOneQuery('van_loads', { id: loadId }, tenantId);
    if (!existingLoad) {
      return res.status(404).json({ 
        success: false, 
        message: 'Van load not found' 
      });
    }
    
    const updateData = {};
    if (stock_returned) updateData.stock_returned = JSON.stringify(stock_returned);
    if (stock_sold) updateData.stock_sold = JSON.stringify(stock_sold);
    if (cash_collected !== undefined) updateData.cash_collected = cash_collected ? parseFloat(cash_collected) : null;
    if (status) updateData.status = status;
    
    await updateQuery('van_loads', updateData, { id: loadId }, tenantId);
    
    res.json({
      success: true,
      message: 'Van load updated successfully'
    });
  } catch (error) {
    console.error('Error updating van load:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get van load reconciliation report
router.get('/loads/:loadId/reconciliation', async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { loadId } = req.params;
    
    const db = getDatabase();
    const load = await new Promise((resolve, reject) => {
      db.get(`
        SELECT vl.*, v.registration_number as van_registration,
               u.first_name || ' ' || u.last_name as salesman_name
        FROM van_loads vl
        LEFT JOIN vans v ON vl.van_id = v.id
        LEFT JOIN users a ON vl.salesman_id = a.id
        LEFT JOIN users u ON a.user_id = u.id
        WHERE vl.id = ? AND vl.tenant_id = ?
      `, [loadId, tenantId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    if (!load) {
      return res.status(404).json({ 
        success: false, 
        message: 'Van load not found' 
      });
    }
    
    // Parse JSON fields
    const reconciliation = {
      ...load,
      stock_loaded: load.stock_loaded ? JSON.parse(load.stock_loaded) : [],
      stock_returned: load.stock_returned ? JSON.parse(load.stock_returned) : [],
      stock_sold: load.stock_sold ? JSON.parse(load.stock_sold) : []
    };
    
    // Calculate variances
    const cash_variance = (load.cash_collected || 0) - (load.cash_float || 0);
    
    res.json({
      success: true,
      data: { 
        reconciliation,
        cash_variance
      }
    });
  } catch (error) {
    console.error('Error fetching reconciliation:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
