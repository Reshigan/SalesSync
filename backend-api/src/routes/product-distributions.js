const express = require('express');
const router = express.Router();
const { pool } = require('../database/db');
const { selectMany, selectOne, insertRow } = require('../database/pg-helpers');

// GET /product-distributions - List distributions
router.get('/', async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { customer_id, product_id, agent_id, limit = 100, offset = 0 } = req.query;

    let query = `
      SELECT pd.*, 
        c.name as customer_name,
        p.name as product_name,
        u.name as agent_name
      FROM product_distributions pd
      LEFT JOIN customers c ON pd.customer_id = c.id
      LEFT JOIN products p ON pd.product_id = p.id
      LEFT JOIN users u ON pd.created_by = u.id
      WHERE pd.tenant_id = $1
    `;
    const params = [tenantId];
    
    if (customer_id) {
      params.push(customer_id);
      query += ` AND pd.customer_id = $${params.length}`;
    }
    
    if (product_id) {
      params.push(product_id);
      query += ` AND pd.product_id = $${params.length}`;
    }
    
    if (agent_id) {
      params.push(agent_id);
      query += ` AND pd.created_by = $${params.length}`;
    }
    
    query += ` ORDER BY pd.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const distributions = await selectMany(query, params);
    
    res.json({ success: true, data: distributions, total: distributions.length });
  } catch (error) {
    console.error('Error fetching product distributions:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /product-distributions/by-agent/:agentId - Agent's distributions
router.get('/by-agent/:agentId', async (req, res) => {
  try {
    const { agentId } = req.params;
    const tenantId = req.tenantId;

    const query = `
      SELECT pd.*, 
        c.name as customer_name,
        p.name as product_name
      FROM product_distributions pd
      LEFT JOIN customers c ON pd.customer_id = c.id
      LEFT JOIN products p ON pd.product_id = p.id
      WHERE pd.tenant_id = $1 AND pd.created_by = $2
      ORDER BY pd.created_at DESC
    `;

    const distributions = await selectMany(query, [tenantId, agentId]);
    
    res.json({ success: true, data: distributions, total: distributions.length });
  } catch (error) {
    console.error('Error fetching agent distributions:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /product-distributions/:id - Get distribution details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;

    const query = `
      SELECT pd.*, 
        c.name as customer_name,
        p.name as product_name,
        u.name as agent_name
      FROM product_distributions pd
      LEFT JOIN customers c ON pd.customer_id = c.id
      LEFT JOIN products p ON pd.product_id = p.id
      LEFT JOIN users u ON pd.created_by = u.id
      WHERE pd.id = $1 AND pd.tenant_id = $2
    `;
    const distribution = await selectOne(query, [id, tenantId]);

    if (!distribution) {
      return res.status(404).json({ success: false, error: 'Product distribution not found' });
    }

    res.json({ success: true, data: distribution });
  } catch (error) {
    console.error('Error fetching product distribution:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /product-distributions - Create distribution
router.post('/', async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const userId = req.userId;
    const { 
      customer_id, 
      product_id, 
      visit_id, 
      recipient_name, 
      recipient_phone,
      msisdn,
      imei,
      serial_number,
      form_data,
      photo_url, 
      latitude, 
      longitude 
    } = req.body;

    if (!product_id) {
      return res.status(400).json({ success: false, error: 'Product ID is required' });
    }

    const distributionData = {
      tenant_id: tenantId,
      customer_id: customer_id || null,
      product_id,
      visit_id: visit_id || null,
      recipient_name: recipient_name || null,
      recipient_phone: recipient_phone || null,
      msisdn: msisdn || null,
      imei: imei || null,
      serial_number: serial_number || null,
      form_data: form_data ? JSON.stringify(form_data) : null,
      photo_url: photo_url || null,
      latitude: latitude || null,
      longitude: longitude || null,
      created_by: userId
    };

    const distribution = await insertRow('product_distributions', distributionData);

    // Create commission entry for product distribution
    const commissionAmount = 5.00; // TODO: Make configurable per product
    const commissionData = {
      tenant_id: tenantId,
      agent_id: userId,
      type: 'product_distribution',
      entity_id: distribution.id,
      entity_type: 'product_distribution',
      amount: commissionAmount,
      currency: 'USD',
      status: 'pending',
      description: `Product distribution commission`
    };
    
    await insertRow('commission_ledgers', commissionData);

    res.status(201).json({ success: true, data: distribution });
  } catch (error) {
    console.error('Error creating product distribution:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
