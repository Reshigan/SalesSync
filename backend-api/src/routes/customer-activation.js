const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { requireFunction } = require('../middleware/authMiddleware');

// Get all customer activations
router.get('/', requireFunction('customer_activation', 'view'), async (req, res) => {
  try {
    const { page = 1, limit = 10, status, agent_id, activation_type } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT ca.*, c.name as customer_name, c.phone as customer_phone, c.address,
             u.name as agent_name, p.name as product_name
      FROM customer_activations ca
      LEFT JOIN customers c ON ca.customer_id = c.id
      LEFT JOIN users u ON ca.agent_id = u.id
      LEFT JOIN products p ON ca.product_id = p.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (status) {
      query += ' AND ca.status = ?';
      params.push(status);
    }
    
    if (agent_id) {
      query += ' AND ca.agent_id = ?';
      params.push(agent_id);
    }
    
    if (activation_type) {
      query += ' AND ca.activation_type = ?';
      params.push(activation_type);
    }
    
    query += ' ORDER BY ca.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);
    
    const activations = db.prepare(query).all(...params);
    
    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM customer_activations ca WHERE 1=1';
    const countParams = [];
    
    if (status) {
      countQuery += ' AND ca.status = ?';
      countParams.push(status);
    }
    
    if (agent_id) {
      countQuery += ' AND ca.agent_id = ?';
      countParams.push(agent_id);
    }
    
    if (activation_type) {
      countQuery += ' AND ca.activation_type = ?';
      countParams.push(activation_type);
    }
    
    const { total } = db.prepare(countQuery).get(...countParams);
    
    res.json({
      activations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching customer activations:', error);
    res.status(500).json({ error: 'Failed to fetch customer activations' });
  }
});

// Get customer activation by ID
router.get('/:id', requireFunction, async (req, res) => {
  try {
    const { id } = req.params;
    
    const activation = db.prepare(`
      SELECT ca.*, c.name as customer_name, c.phone as customer_phone, c.address,
             u.name as agent_name, u.phone as agent_phone, p.name as product_name
      FROM customer_activations ca
      LEFT JOIN customers c ON ca.customer_id = c.id
      LEFT JOIN users u ON ca.agent_id = u.id
      LEFT JOIN products p ON ca.product_id = p.id
      WHERE ca.id = ?
    `).get(id);
    
    if (!activation) {
      return res.status(404).json({ error: 'Customer activation not found' });
    }
    
    // Get activation steps
    const steps = db.prepare(`
      SELECT * FROM activation_steps 
      WHERE activation_id = ? 
      ORDER BY step_order
    `).all(id);
    
    // Get activation metrics
    const metrics = db.prepare(`
      SELECT * FROM activation_metrics 
      WHERE activation_id = ?
    `).get(id);
    
    res.json({
      ...activation,
      steps,
      metrics
    });
  } catch (error) {
    console.error('Error fetching customer activation:', error);
    res.status(500).json({ error: 'Failed to fetch customer activation' });
  }
});

// Create new customer activation
router.post('/', requireFunction, async (req, res) => {
  try {
    const {
      customer_id,
      agent_id,
      activation_type,
      product_id,
      target_date,
      priority,
      notes,
      campaign_id
    } = req.body;
    
    // Validate required fields
    if (!customer_id || !agent_id || !activation_type) {
      return res.status(400).json({ error: 'Customer ID, agent ID, and activation type are required' });
    }
    
    // Check if customer exists
    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(customer_id);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    // Check if agent exists
    const agent = db.prepare('SELECT * FROM users WHERE id = ? AND role IN (?, ?)').get(agent_id, 'agent', 'field_agent');
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    
    // Create activation record
    const result = db.prepare(`
      INSERT INTO customer_activations (
        customer_id, agent_id, activation_type, product_id, target_date,
        priority, notes, campaign_id, status, created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(
      customer_id, agent_id, activation_type, product_id, target_date,
      priority || 'medium', notes, campaign_id, 'initiated', req.user.id
    );
    
    // Create default activation steps based on type
    const defaultSteps = getDefaultActivationSteps(activation_type);
    for (let i = 0; i < defaultSteps.length; i++) {
      const step = defaultSteps[i];
      db.prepare(`
        INSERT INTO activation_steps (
          activation_id, step_name, step_description, step_order, 
          is_mandatory, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
      `).run(
        result.lastInsertRowid, step.name, step.description, i + 1,
        step.mandatory, 'pending'
      );
    }
    
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
router.patch('/:id/status', requireFunction, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, completion_notes, success_metrics } = req.body;
    
    const validStatuses = ['initiated', 'in_progress', 'completed', 'failed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const activation = db.prepare('SELECT * FROM customer_activations WHERE id = ?').get(id);
    if (!activation) {
      return res.status(404).json({ error: 'Customer activation not found' });
    }
    
    // Update activation status
    db.prepare(`
      UPDATE customer_activations 
      SET status = ?, 
          completion_notes = COALESCE(?, completion_notes),
          completed_at = CASE WHEN ? = 'completed' THEN datetime('now') ELSE completed_at END,
          updated_at = datetime('now')
      WHERE id = ?
    `).run(status, completion_notes, status, id);
    
    // If completed, record success metrics
    if (status === 'completed' && success_metrics) {
      db.prepare(`
        INSERT OR REPLACE INTO activation_metrics (
          activation_id, success_score, engagement_level, conversion_rate,
          time_to_activation, follow_up_required, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
      `).run(
        id, success_metrics.success_score, success_metrics.engagement_level,
        success_metrics.conversion_rate, success_metrics.time_to_activation,
        success_metrics.follow_up_required
      );
    }
    
    res.json({ message: 'Activation status updated successfully' });
  } catch (error) {
    console.error('Error updating activation status:', error);
    res.status(500).json({ error: 'Failed to update activation status' });
  }
});

// Update activation step
router.patch('/:id/steps/:stepId', requireFunction, async (req, res) => {
  try {
    const { id, stepId } = req.params;
    const { status, completion_notes, completion_date } = req.body;
    
    const validStatuses = ['pending', 'in_progress', 'completed', 'skipped'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid step status' });
    }
    
    // Update step
    const result = db.prepare(`
      UPDATE activation_steps 
      SET status = ?, 
          completion_notes = COALESCE(?, completion_notes),
          completion_date = COALESCE(?, completion_date),
          updated_at = datetime('now')
      WHERE id = ? AND activation_id = ?
    `).run(status, completion_notes, completion_date, stepId, id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Activation step not found' });
    }
    
    // Check if all mandatory steps are completed
    const pendingMandatory = db.prepare(`
      SELECT COUNT(*) as count 
      FROM activation_steps 
      WHERE activation_id = ? AND is_mandatory = 1 AND status != 'completed'
    `).get(id);
    
    // If all mandatory steps completed, update activation status
    if (pendingMandatory.count === 0) {
      db.prepare(`
        UPDATE customer_activations 
        SET status = 'completed', completed_at = datetime('now')
        WHERE id = ? AND status != 'completed'
      `).run(id);
    }
    
    res.json({ message: 'Activation step updated successfully' });
  } catch (error) {
    console.error('Error updating activation step:', error);
    res.status(500).json({ error: 'Failed to update activation step' });
  }
});

// Get activation analytics
router.get('/analytics/summary', requireFunction, async (req, res) => {
  try {
    const { start_date, end_date, agent_id, activation_type } = req.query;
    
    let dateFilter = '';
    const params = [];
    
    if (start_date && end_date) {
      dateFilter = 'AND ca.created_at BETWEEN ? AND ?';
      params.push(start_date, end_date);
    }
    
    let agentFilter = '';
    if (agent_id) {
      agentFilter = 'AND ca.agent_id = ?';
      params.push(agent_id);
    }
    
    let typeFilter = '';
    if (activation_type) {
      typeFilter = 'AND ca.activation_type = ?';
      params.push(activation_type);
    }
    
    // Activation statistics
    const activationStats = db.prepare(`
      SELECT 
        COUNT(*) as total_activations,
        COUNT(CASE WHEN ca.status = 'completed' THEN 1 END) as completed_activations,
        COUNT(CASE WHEN ca.status = 'in_progress' THEN 1 END) as in_progress_activations,
        COUNT(CASE WHEN ca.status = 'failed' THEN 1 END) as failed_activations,
        ROUND(AVG(CASE WHEN ca.status = 'completed' THEN 1.0 ELSE 0.0 END) * 100, 2) as success_rate
      FROM customer_activations ca
      WHERE 1=1 ${dateFilter} ${agentFilter} ${typeFilter}
    `).get(...params);
    
    // Success metrics
    const successMetrics = db.prepare(`
      SELECT 
        AVG(am.success_score) as avg_success_score,
        AVG(am.engagement_level) as avg_engagement_level,
        AVG(am.conversion_rate) as avg_conversion_rate,
        AVG(am.time_to_activation) as avg_time_to_activation
      FROM activation_metrics am
      JOIN customer_activations ca ON am.activation_id = ca.id
      WHERE 1=1 ${dateFilter} ${agentFilter} ${typeFilter}
    `).get(...params);
    
    // Top performing agents
    const topAgents = db.prepare(`
      SELECT 
        u.name as agent_name,
        COUNT(*) as total_activations,
        COUNT(CASE WHEN ca.status = 'completed' THEN 1 END) as completed_activations,
        ROUND(AVG(CASE WHEN ca.status = 'completed' THEN 1.0 ELSE 0.0 END) * 100, 2) as success_rate
      FROM customer_activations ca
      JOIN users u ON ca.agent_id = u.id
      WHERE 1=1 ${dateFilter} ${typeFilter}
      GROUP BY u.id, u.name
      ORDER BY success_rate DESC, completed_activations DESC
      LIMIT 10
    `).all(...params.filter((_, i) => !agent_id || i !== params.indexOf(agent_id)));
    
    // Activation types breakdown
    const typeBreakdown = db.prepare(`
      SELECT 
        ca.activation_type,
        COUNT(*) as total_count,
        COUNT(CASE WHEN ca.status = 'completed' THEN 1 END) as completed_count,
        ROUND(AVG(CASE WHEN ca.status = 'completed' THEN 1.0 ELSE 0.0 END) * 100, 2) as success_rate
      FROM customer_activations ca
      WHERE 1=1 ${dateFilter} ${agentFilter} ${typeFilter}
      GROUP BY ca.activation_type
      ORDER BY success_rate DESC
    `).all(...params);
    
    res.json({
      activation_stats: activationStats,
      success_metrics: successMetrics,
      top_agents: topAgents,
      type_breakdown: typeBreakdown
    });
  } catch (error) {
    console.error('Error fetching activation analytics:', error);
    res.status(500).json({ error: 'Failed to fetch activation analytics' });
  }
});

// Get activation workflow templates
router.get('/templates', requireFunction, async (req, res) => {
  try {
    const templates = {
      'product_onboarding': [
        { name: 'Initial Contact', description: 'Make first contact with customer', mandatory: true },
        { name: 'Product Demo', description: 'Demonstrate product features and benefits', mandatory: true },
        { name: 'Trial Setup', description: 'Set up product trial or sample', mandatory: false },
        { name: 'Follow-up Call', description: 'Follow up on trial experience', mandatory: true },
        { name: 'Purchase Decision', description: 'Facilitate purchase decision', mandatory: true },
        { name: 'Onboarding Complete', description: 'Complete customer onboarding process', mandatory: true }
      ],
      'service_activation': [
        { name: 'Service Registration', description: 'Register customer for service', mandatory: true },
        { name: 'Documentation', description: 'Complete required documentation', mandatory: true },
        { name: 'Service Setup', description: 'Set up service for customer', mandatory: true },
        { name: 'Training Session', description: 'Provide service training', mandatory: false },
        { name: 'Service Testing', description: 'Test service functionality', mandatory: true },
        { name: 'Go Live', description: 'Activate service for customer', mandatory: true }
      ],
      'loyalty_program': [
        { name: 'Program Introduction', description: 'Introduce loyalty program benefits', mandatory: true },
        { name: 'Registration', description: 'Register customer for loyalty program', mandatory: true },
        { name: 'First Purchase', description: 'Facilitate first purchase with benefits', mandatory: true },
        { name: 'Benefits Explanation', description: 'Explain how to maximize benefits', mandatory: false },
        { name: 'Follow-up Engagement', description: 'Follow up on program satisfaction', mandatory: true }
      ]
    };
    
    res.json(templates);
  } catch (error) {
    console.error('Error fetching activation templates:', error);
    res.status(500).json({ error: 'Failed to fetch activation templates' });
  }
});

// Helper function to get default activation steps
function getDefaultActivationSteps(activationType) {
  const templates = {
    'product_onboarding': [
      { name: 'Initial Contact', description: 'Make first contact with customer', mandatory: true },
      { name: 'Product Demo', description: 'Demonstrate product features and benefits', mandatory: true },
      { name: 'Trial Setup', description: 'Set up product trial or sample', mandatory: false },
      { name: 'Follow-up Call', description: 'Follow up on trial experience', mandatory: true },
      { name: 'Purchase Decision', description: 'Facilitate purchase decision', mandatory: true },
      { name: 'Onboarding Complete', description: 'Complete customer onboarding process', mandatory: true }
    ],
    'service_activation': [
      { name: 'Service Registration', description: 'Register customer for service', mandatory: true },
      { name: 'Documentation', description: 'Complete required documentation', mandatory: true },
      { name: 'Service Setup', description: 'Set up service for customer', mandatory: true },
      { name: 'Training Session', description: 'Provide service training', mandatory: false },
      { name: 'Service Testing', description: 'Test service functionality', mandatory: true },
      { name: 'Go Live', description: 'Activate service for customer', mandatory: true }
    ],
    'loyalty_program': [
      { name: 'Program Introduction', description: 'Introduce loyalty program benefits', mandatory: true },
      { name: 'Registration', description: 'Register customer for loyalty program', mandatory: true },
      { name: 'First Purchase', description: 'Facilitate first purchase with benefits', mandatory: true },
      { name: 'Benefits Explanation', description: 'Explain how to maximize benefits', mandatory: false },
      { name: 'Follow-up Engagement', description: 'Follow up on program satisfaction', mandatory: true }
    ]
  };
  
  return templates[activationType] || templates['product_onboarding'];
}

module.exports = router;