const express = require('express');
const { getQuery, getOneQuery, runQuery } = require('../utils/database');
const { selectOne, selectMany, insertRow, updateRow, deleteRow } = require('../utils/pg-helpers');
const router = express.Router();

// Get all vans
router.get('/', async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { status, assigned_salesman_id } = req.query;
    let sql = `
      SELECT v.*, u.first_name || ' ' || u.last_name as salesman_name,
             COUNT(vl.id) as load_count
      FROM vans v
      LEFT JOIN users u ON v.assigned_salesman_id = u.id
      LEFT JOIN van_loads vl ON v.id = vl.van_id AND vl.load_date::date = CURRENT_DATE
      WHERE v.tenant_id = $1
    `;
    const params = [tenantId];
    let paramIndex = 2;
    
    if (status) {
      sql += ` AND v.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    if (assigned_salesman_id) {
      sql += ` AND v.assigned_salesman_id = $${paramIndex}`;
      params.push(assigned_salesman_id);
      paramIndex++;
    }
    
    sql += ' GROUP BY v.id, u.first_name, u.last_name ORDER BY v.registration_number';
    
    const vans = await getQuery(sql, params);
    
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
    const existingVan = await selectOne('vans', { registration_number }, tenantId);
    if (existingVan) {
      return res.status(400).json({ 
        success: false, 
        message: 'Registration number already exists' 
      });
    }
    
    const vanData = {
      registration_number,
      model,
      capacity_units: capacity_units ? parseInt(capacity_units) : null,
      assigned_salesman_id,
      status
    };
    
    const newVan = await insertRow('vans', vanData, tenantId);
    
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
    const van = await getOneQuery(`
      SELECT v.*, u.first_name || ' ' || u.last_name as salesman_name
      FROM vans v
      LEFT JOIN users u ON v.assigned_salesman_id = u.id
      WHERE v.id = $1 AND v.tenant_id = $2
    `, [id, tenantId]);
    
    if (!van) {
      return res.status(404).json({ 
        success: false, 
        message: 'Van not found' 
      });
    }
    
    // Get recent loads
    const recentLoads = await getQuery(`
      SELECT vl.*, u.first_name || ' ' || u.last_name as salesman_name
      FROM van_loads vl
      LEFT JOIN users u ON vl.salesman_id = u.id
      WHERE vl.van_id = $1 AND vl.tenant_id = $2
      ORDER BY vl.load_date DESC
      LIMIT 10
    `, [id, tenantId]);
    
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
    
    const existingVan = await selectOne('vans', { id }, tenantId);
    if (!existingVan) {
      return res.status(404).json({ 
        success: false, 
        message: 'Van not found' 
      });
    }
    
    // Check if registration number is being changed and already exists
    if (registration_number && registration_number !== existingVan.registration_number) {
      const regExists = await selectOne('vans', { registration_number }, tenantId);
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
    
    const updatedRows = await updateRow('vans', updateData, { id }, tenantId);
    const updatedVan = updatedRows[0];
    
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
    
    const existingVan = await selectOne('vans', { id }, tenantId);
    if (!existingVan) {
      return res.status(404).json({ 
        success: false, 
        message: 'Van not found' 
      });
    }
    
    // Check if van has load history
    const loadCountResult = await getOneQuery(
      'SELECT COUNT(*) as count FROM van_loads WHERE van_id = $1',
      [id]
    );
    const loadCount = loadCountResult ? loadCountResult.count : 0;
    
    if (loadCount > 0) {
      // Soft delete - mark as inactive
      await updateRow('vans', { status: 'inactive' }, { id }, tenantId);
      res.json({
        success: true,
        message: 'Van marked as inactive (has load history)'
      });
    } else {
      // Hard delete
      await deleteRow('vans', { id }, tenantId);
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
    let sql = `
      SELECT vl.*, v.registration_number as van_registration,
             u.first_name || ' ' || u.last_name as salesman_name
      FROM van_loads vl
      LEFT JOIN vans v ON vl.van_id = v.id
      LEFT JOIN users u ON vl.salesman_id = u.id
      WHERE vl.tenant_id = $1
    `;
    const params = [tenantId];
    let paramIndex = 2;
    
    if (van_id) {
      sql += ` AND vl.van_id = $${paramIndex}`;
      params.push(van_id);
      paramIndex++;
    }
    if (salesman_id) {
      sql += ` AND vl.salesman_id = $${paramIndex}`;
      params.push(salesman_id);
      paramIndex++;
    }
    if (status) {
      sql += ` AND vl.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    if (date_from) {
      sql += ` AND vl.load_date >= $${paramIndex}`;
      params.push(date_from);
      paramIndex++;
    }
    if (date_to) {
      sql += ` AND vl.load_date <= $${paramIndex}`;
      params.push(date_to);
      paramIndex++;
    }
    
    sql += ` ORDER BY vl.load_date DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));
    
    const rows = await getQuery(sql, params);
    const loads = rows.map(row => ({
      ...row,
      stock_loaded: row.stock_loaded ? JSON.parse(row.stock_loaded) : null,
      stock_returned: row.stock_returned ? JSON.parse(row.stock_returned) : null,
      stock_sold: row.stock_sold ? JSON.parse(row.stock_sold) : null
    }));
    
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
    const van = await selectOne('vans', { id: van_id }, tenantId);
    if (!van) {
      return res.status(400).json({ 
        success: false, 
        message: 'Van not found' 
      });
    }
    
    // Validate salesman exists (check users table instead of agents)
    const salesman = await selectOne('users', { id: salesman_id }, tenantId);
    if (!salesman) {
      return res.status(400).json({ 
        success: false, 
        message: 'Salesman not found' 
      });
    }
    
    const loadData = {
      van_id,
      salesman_id,
      load_date,
      stock_loaded: stock_loaded ? JSON.stringify(stock_loaded) : null,
      cash_float: cash_float ? parseFloat(cash_float) : null,
      status
    };
    
    const newLoad = await insertRow('van_loads', loadData, tenantId);
    
    res.status(201).json({
      success: true,
      data: { load: newLoad },
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
    
    const existingLoad = await selectOne('van_loads', { id: loadId }, tenantId);
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
    
    const updatedRows = await updateRow('van_loads', updateData, { id: loadId }, tenantId);
    const updatedLoad = updatedRows[0];
    
    res.json({
      success: true,
      data: { load: updatedLoad },
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
    const load = await getOneQuery(`
      SELECT vl.*, v.registration_number as van_registration,
             u.first_name || ' ' || u.last_name as salesman_name
      FROM van_loads vl
      LEFT JOIN vans v ON vl.van_id = v.id
      LEFT JOIN users u ON vl.salesman_id = u.id
      WHERE vl.id = $1 AND vl.tenant_id = $2
    `, [loadId, tenantId]);
    
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
