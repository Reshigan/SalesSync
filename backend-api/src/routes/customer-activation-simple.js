const express = require('express');
const router = express.Router();
const { requireFunction } = require('../middleware/authMiddleware');

// Get all customer activations
router.get('/', requireFunction('customer_activation', 'view'), async (req, res) => {
  try {
    const { getQuery } = require('../utils/database');
    
    const activations = await getQuery(`
      SELECT ca.*, u.name as agent_name, c.name as customer_name
      FROM customer_activations ca
      LEFT JOIN users u ON ca.agent_id = u.id
      LEFT JOIN customers c ON ca.customer_id = c.id
      WHERE ca.tenant_id = ?
      ORDER BY ca.created_at DESC
    `, [req.tenantId]);
    
    res.json({ activations });
  } catch (error) {
    console.error('Error fetching customer activations:', error);
    res.status(500).json({ error: 'Failed to fetch customer activations' });
  }
});

// Get activation by ID
router.get('/:id', requireFunction('customer_activation', 'view'), async (req, res) => {
  try {
    const { getOneQuery, getQuery } = require('../utils/database');
    const { id } = req.params;
    
    const activation = await getOneQuery(`
      SELECT ca.*, u.name as agent_name, c.name as customer_name
      FROM customer_activations ca
      LEFT JOIN users u ON ca.agent_id = u.id
      LEFT JOIN customers c ON ca.customer_id = c.id
      WHERE ca.id = ? AND ca.tenant_id = ?
    `, [id, req.tenantId]);
    
    if (!activation) {
      return res.status(404).json({ error: 'Customer activation not found' });
    }
    
    // Get activation steps
    const steps = await getQuery(`
      SELECT * FROM activation_steps 
      WHERE activation_id = ? AND tenant_id = ?
      ORDER BY step_order
    `, [id, req.tenantId]);
    
    res.json({ ...activation, steps });
  } catch (error) {
    console.error('Error fetching customer activation:', error);
    res.status(500).json({ error: 'Failed to fetch customer activation' });
  }
});

// Create new customer activation
router.post('/', requireFunction('customer_activation', 'create'), async (req, res) => {
  try {
    const { runQuery } = require('../utils/database');
    const { customer_id, activation_type, target_products, expected_value } = req.body;
    
    if (!customer_id || !activation_type) {
      return res.status(400).json({ error: 'Customer ID and activation type are required' });
    }
    
    const result = await runQuery(`
      INSERT INTO customer_activations (
        tenant_id, customer_id, agent_id, activation_type, 
        target_products, expected_value, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [
      req.tenantId, customer_id, req.user.id, activation_type,
      JSON.stringify(target_products || []), expected_value || 0, 'initiated'
    ]);
    
    res.status(201).json({
      id: result.lastInsertRowid,
      message: 'Customer activation created successfully'
    });
  } catch (error) {
    console.error('Error creating customer activation:', error);
    res.status(500).json({ error: 'Failed to create customer activation' });
  }
});

// Update activation status
router.put('/:id/status', requireFunction('customer_activation', 'edit'), async (req, res) => {
  try {
    const { runQuery, getOneQuery } = require('../utils/database');
    const { id } = req.params;
    const { status, notes } = req.body;
    
    const activation = await getOneQuery(`
      SELECT * FROM customer_activations 
      WHERE id = ? AND tenant_id = ?
    `, [id, req.tenantId]);
    
    if (!activation) {
      return res.status(404).json({ error: 'Customer activation not found' });
    }
    
    await runQuery(`
      UPDATE customer_activations 
      SET status = ?, notes = COALESCE(?, notes), updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND tenant_id = ?
    `, [status, notes, id, req.tenantId]);
    
    res.json({ message: 'Customer activation status updated successfully' });
  } catch (error) {
    console.error('Error updating customer activation status:', error);
    res.status(500).json({ error: 'Failed to update customer activation status' });
  }
});

module.exports = router;