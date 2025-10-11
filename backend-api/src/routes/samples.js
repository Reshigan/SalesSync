const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { requireFunction, requireRole } = require('../middleware/authMiddleware');

// Get all sample distributions
router.get('/', requireFunction("general", "view"), async (req, res) => {
  try {
    const { page = 1, limit = 10, status, agent_id, product_id } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT sd.*, p.name as product_name, p.sku, u.name as agent_name,
             c.name as customer_name, c.phone as customer_phone
      FROM sample_distributions sd
      LEFT JOIN products p ON sd.product_id = p.id
      LEFT JOIN users u ON sd.agent_id = u.id
      LEFT JOIN customers c ON sd.customer_id = c.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (status) {
      query += ' AND sd.status = ?';
      params.push(status);
    }
    
    if (agent_id) {
      query += ' AND sd.agent_id = ?';
      params.push(agent_id);
    }
    
    if (product_id) {
      query += ' AND sd.product_id = ?';
      params.push(product_id);
    }
    
    query += ' ORDER BY sd.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);
    
    const distributions = db.prepare(query).all(...params);
    
    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM sample_distributions sd WHERE 1=1';
    const countParams = [];
    
    if (status) {
      countQuery += ' AND sd.status = ?';
      countParams.push(status);
    }
    
    if (agent_id) {
      countQuery += ' AND sd.agent_id = ?';
      countParams.push(agent_id);
    }
    
    if (product_id) {
      countQuery += ' AND sd.product_id = ?';
      countParams.push(product_id);
    }
    
    const { total } = db.prepare(countQuery).get(...countParams);
    
    res.json({
      distributions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching sample distributions:', error);
    res.status(500).json({ error: 'Failed to fetch sample distributions' });
  }
});

// Get sample distribution by ID
router.get('/:id', requireFunction("general", "view"), async (req, res) => {
  try {
    const { id } = req.params;
    
    const distribution = db.prepare(`
      SELECT sd.*, p.name as product_name, p.sku, p.unit_price,
             u.name as agent_name, u.phone as agent_phone,
             c.name as customer_name, c.phone as customer_phone, c.address as customer_address
      FROM sample_distributions sd
      LEFT JOIN products p ON sd.product_id = p.id
      LEFT JOIN users u ON sd.agent_id = u.id
      LEFT JOIN customers c ON sd.customer_id = c.id
      WHERE sd.id = ?
    `).get(id);
    
    if (!distribution) {
      return res.status(404).json({ error: 'Sample distribution not found' });
    }
    
    res.json(distribution);
  } catch (error) {
    console.error('Error fetching sample distribution:', error);
    res.status(500).json({ error: 'Failed to fetch sample distribution' });
  }
});

// Create new sample distribution
router.post('/', requireFunction("campaigns", "view"), async (req, res) => {
  try {
    const {
      product_id,
      agent_id,
      customer_id,
      quantity,
      distribution_date,
      notes,
      campaign_id
    } = req.body;
    
    // Validate required fields
    if (!product_id || !agent_id || !quantity) {
      return res.status(400).json({ error: 'Product ID, agent ID, and quantity are required' });
    }
    
    // Check if product exists and has sufficient sample inventory
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(product_id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    if (product.sample_inventory < quantity) {
      return res.status(400).json({ error: 'Insufficient sample inventory' });
    }
    
    // Check if agent exists
    const agent = db.prepare('SELECT * FROM users WHERE id = ? AND role IN (?, ?)').get(agent_id, 'agent', 'field_agent');
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    
    // Create sample distribution
    const result = db.prepare(`
      INSERT INTO sample_distributions (
        product_id, agent_id, customer_id, quantity, distribution_date,
        notes, campaign_id, status, created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(
      product_id, agent_id, customer_id, quantity, distribution_date || new Date().toISOString(),
      notes, campaign_id, 'allocated', req.user.id
    );
    
    // Update product sample inventory
    db.prepare('UPDATE products SET sample_inventory = sample_inventory - ? WHERE id = ?')
      .run(quantity, product_id);
    
    // Log inventory movement
    db.prepare(`
      INSERT INTO inventory_movements (
        product_id, movement_type, quantity, reference_type, reference_id,
        notes, created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(
      product_id, 'sample_out', -quantity, 'sample_distribution', result.lastInsertRowid,
      `Sample distribution to agent ${agent.name}`, req.user.id
    );
    
    res.status(201).json({
      id: result.lastInsertRowid,
      message: 'Sample distribution created successfully'
    });
  } catch (error) {
    console.error('Error creating sample distribution:', error);
    res.status(500).json({ error: 'Failed to create sample distribution' });
  }
});

// Update sample distribution status
router.patch('/:id/status', requireFunction("general", "view"), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes, feedback } = req.body;
    
    const validStatuses = ['allocated', 'distributed', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const distribution = db.prepare('SELECT * FROM sample_distributions WHERE id = ?').get(id);
    if (!distribution) {
      return res.status(404).json({ error: 'Sample distribution not found' });
    }
    
    // Update distribution status
    db.prepare(`
      UPDATE sample_distributions 
      SET status = ?, notes = COALESCE(?, notes), feedback = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(status, notes, feedback, id);
    
    // If cancelled, return inventory
    if (status === 'cancelled' && distribution.status !== 'cancelled') {
      db.prepare('UPDATE products SET sample_inventory = sample_inventory + ? WHERE id = ?')
        .run(distribution.quantity, distribution.product_id);
      
      // Log inventory movement
      db.prepare(`
        INSERT INTO inventory_movements (
          product_id, movement_type, quantity, reference_type, reference_id,
          notes, created_by, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).run(
        distribution.product_id, 'sample_return', distribution.quantity, 'sample_distribution', id,
        'Sample distribution cancelled - inventory returned', req.user.id
      );
    }
    
    res.json({ message: 'Sample distribution status updated successfully' });
  } catch (error) {
    console.error('Error updating sample distribution status:', error);
    res.status(500).json({ error: 'Failed to update sample distribution status' });
  }
});

// Get sample distribution analytics
router.get('/analytics/summary', requireFunction("campaigns", "view"), async (req, res) => {
  try {
    const { start_date, end_date, agent_id, product_id } = req.query;
    
    let dateFilter = '';
    const params = [];
    
    if (start_date && end_date) {
      dateFilter = 'AND sd.distribution_date BETWEEN ? AND ?';
      params.push(start_date, end_date);
    }
    
    // Total distributions by status
    let statusQuery = `
      SELECT status, COUNT(*) as count, SUM(quantity) as total_quantity
      FROM sample_distributions sd
      WHERE 1=1 ${dateFilter}
    `;
    
    if (agent_id) {
      statusQuery += ' AND sd.agent_id = ?';
      params.push(agent_id);
    }
    
    if (product_id) {
      statusQuery += ' AND sd.product_id = ?';
      params.push(product_id);
    }
    
    statusQuery += ' GROUP BY status';
    
    const statusStats = db.prepare(statusQuery).all(...params);
    
    // Top products by sample distribution
    let productQuery = `
      SELECT p.name, p.sku, COUNT(*) as distribution_count, SUM(sd.quantity) as total_quantity
      FROM sample_distributions sd
      JOIN products p ON sd.product_id = p.id
      WHERE 1=1 ${dateFilter}
    `;
    
    const productParams = [...params];
    if (agent_id) {
      productQuery += ' AND sd.agent_id = ?';
      productParams.push(agent_id);
    }
    
    productQuery += ' GROUP BY p.id ORDER BY total_quantity DESC LIMIT 10';
    
    const topProducts = db.prepare(productQuery).all(...productParams);
    
    // Top agents by sample distribution
    let agentQuery = `
      SELECT u.name, u.phone, COUNT(*) as distribution_count, SUM(sd.quantity) as total_quantity
      FROM sample_distributions sd
      JOIN users u ON sd.agent_id = u.id
      WHERE 1=1 ${dateFilter}
    `;
    
    const agentParams = [...params];
    if (product_id) {
      agentQuery += ' AND sd.product_id = ?';
      agentParams.push(product_id);
    }
    
    agentQuery += ' GROUP BY u.id ORDER BY total_quantity DESC LIMIT 10';
    
    const topAgents = db.prepare(agentQuery).all(...agentParams);
    
    res.json({
      status_summary: statusStats,
      top_products: topProducts,
      top_agents: topAgents
    });
  } catch (error) {
    console.error('Error fetching sample distribution analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Bulk allocate samples
router.post('/bulk-allocate', requireFunction("campaigns", "view"), async (req, res) => {
  try {
    const { allocations } = req.body; // Array of allocation objects
    
    if (!Array.isArray(allocations) || allocations.length === 0) {
      return res.status(400).json({ error: 'Allocations array is required' });
    }
    
    const results = [];
    const errors = [];
    
    for (const allocation of allocations) {
      try {
        const { product_id, agent_id, customer_id, quantity, notes, campaign_id } = allocation;
        
        // Validate required fields
        if (!product_id || !agent_id || !quantity) {
          errors.push({ allocation, error: 'Product ID, agent ID, and quantity are required' });
          continue;
        }
        
        // Check product inventory
        const product = db.prepare('SELECT * FROM products WHERE id = ?').get(product_id);
        if (!product || product.sample_inventory < quantity) {
          errors.push({ allocation, error: 'Insufficient sample inventory' });
          continue;
        }
        
        // Create distribution
        const result = db.prepare(`
          INSERT INTO sample_distributions (
            product_id, agent_id, customer_id, quantity, distribution_date,
            notes, campaign_id, status, created_by, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        `).run(
          product_id, agent_id, customer_id, quantity, new Date().toISOString(),
          notes, campaign_id, 'allocated', req.user.id
        );
        
        // Update inventory
        db.prepare('UPDATE products SET sample_inventory = sample_inventory - ? WHERE id = ?')
          .run(quantity, product_id);
        
        results.push({ id: result.lastInsertRowid, allocation });
      } catch (error) {
        errors.push({ allocation, error: error.message });
      }
    }
    
    res.json({
      success: results.length,
      errors: errors.length,
      results,
      errors
    });
  } catch (error) {
    console.error('Error bulk allocating samples:', error);
    res.status(500).json({ error: 'Failed to bulk allocate samples' });
  }
});

module.exports = router;