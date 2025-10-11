const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Get campaign analytics overview
router.get('/overview', authenticateToken, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const { start_date, end_date, campaign_id } = req.query;
    
    let dateFilter = '';
    const params = [];
    
    if (start_date && end_date) {
      dateFilter = 'AND c.start_date >= ? AND c.end_date <= ?';
      params.push(start_date, end_date);
    }
    
    let campaignFilter = '';
    if (campaign_id) {
      campaignFilter = 'AND c.id = ?';
      params.push(campaign_id);
    }
    
    // Campaign performance summary
    const campaignStats = db.prepare(`
      SELECT 
        COUNT(DISTINCT c.id) as total_campaigns,
        COUNT(DISTINCT CASE WHEN c.status = 'active' THEN c.id END) as active_campaigns,
        COUNT(DISTINCT CASE WHEN c.status = 'completed' THEN c.id END) as completed_campaigns,
        SUM(c.budget) as total_budget,
        SUM(CASE WHEN c.status = 'completed' THEN c.budget ELSE 0 END) as spent_budget
      FROM campaigns c
      WHERE 1=1 ${dateFilter} ${campaignFilter}
    `).get(...params);
    
    // ROI calculations
    const roiStats = db.prepare(`
      SELECT 
        SUM(cp.total_sales) as total_sales,
        SUM(cp.total_visits) as total_visits,
        SUM(cp.total_activities) as total_activities,
        AVG(cp.conversion_rate) as avg_conversion_rate,
        AVG(cp.roi_percentage) as avg_roi
      FROM campaign_performance cp
      JOIN campaigns c ON cp.campaign_id = c.id
      WHERE 1=1 ${dateFilter} ${campaignFilter}
    `).get(...params);
    
    // Top performing campaigns
    const topCampaigns = db.prepare(`
      SELECT 
        c.name,
        c.budget,
        cp.total_sales,
        cp.roi_percentage,
        cp.conversion_rate,
        cp.efficiency_score
      FROM campaigns c
      LEFT JOIN campaign_performance cp ON c.id = cp.campaign_id
      WHERE 1=1 ${dateFilter} ${campaignFilter}
      ORDER BY cp.roi_percentage DESC
      LIMIT 10
    `).all(...params);
    
    res.json({
      campaign_stats: campaignStats,
      roi_stats: roiStats,
      top_campaigns: topCampaigns
    });
  } catch (error) {
    console.error('Error fetching campaign analytics overview:', error);
    res.status(500).json({ error: 'Failed to fetch campaign analytics' });
  }
});

// Get detailed campaign performance
router.get('/performance/:campaignId', authenticateToken, async (req, res) => {
  try {
    const { campaignId } = req.params;
    
    // Campaign basic info
    const campaign = db.prepare(`
      SELECT c.*, cp.*
      FROM campaigns c
      LEFT JOIN campaign_performance cp ON c.id = cp.campaign_id
      WHERE c.id = ?
    `).get(campaignId);
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    // Daily performance metrics
    const dailyMetrics = db.prepare(`
      SELECT 
        DATE(fav.visit_date) as date,
        COUNT(DISTINCT fav.id) as visits,
        COUNT(DISTINCT faa.id) as activities,
        SUM(CASE WHEN o.id IS NOT NULL THEN o.total_amount ELSE 0 END) as sales,
        COUNT(DISTINCT o.id) as orders
      FROM field_agent_visits fav
      LEFT JOIN field_agent_activities faa ON fav.id = faa.visit_id
      LEFT JOIN orders o ON fav.customer_id = o.customer_id AND DATE(o.created_at) = DATE(fav.visit_date)
      WHERE fav.campaign_id = ?
      GROUP BY DATE(fav.visit_date)
      ORDER BY date DESC
      LIMIT 30
    `).all(campaignId);
    
    // Agent performance
    const agentPerformance = db.prepare(`
      SELECT 
        u.name as agent_name,
        COUNT(DISTINCT fav.id) as visits,
        COUNT(DISTINCT faa.id) as activities,
        SUM(CASE WHEN o.id IS NOT NULL THEN o.total_amount ELSE 0 END) as sales,
        COUNT(DISTINCT o.id) as orders,
        ROUND(AVG(fav.visit_rating), 2) as avg_rating
      FROM users u
      JOIN field_agent_visits fav ON u.id = fav.agent_id
      LEFT JOIN field_agent_activities faa ON fav.id = faa.visit_id
      LEFT JOIN orders o ON fav.customer_id = o.customer_id AND DATE(o.created_at) = DATE(fav.visit_date)
      WHERE fav.campaign_id = ?
      GROUP BY u.id, u.name
      ORDER BY sales DESC
    `).all(campaignId);
    
    // Product performance
    const productPerformance = db.prepare(`
      SELECT 
        p.name as product_name,
        p.sku,
        SUM(oi.quantity) as quantity_sold,
        SUM(oi.total_price) as revenue,
        COUNT(DISTINCT o.id) as orders
      FROM products p
      JOIN order_items oi ON p.id = oi.product_id
      JOIN orders o ON oi.order_id = o.id
      JOIN field_agent_visits fav ON o.customer_id = fav.customer_id
      WHERE fav.campaign_id = ? AND DATE(o.created_at) = DATE(fav.visit_date)
      GROUP BY p.id, p.name, p.sku
      ORDER BY revenue DESC
      LIMIT 20
    `).all(campaignId);
    
    // Activity breakdown
    const activityBreakdown = db.prepare(`
      SELECT 
        faa.activity_type,
        COUNT(*) as count,
        AVG(faa.duration_minutes) as avg_duration
      FROM field_agent_activities faa
      JOIN field_agent_visits fav ON faa.visit_id = fav.id
      WHERE fav.campaign_id = ?
      GROUP BY faa.activity_type
      ORDER BY count DESC
    `).all(campaignId);
    
    res.json({
      campaign,
      daily_metrics: dailyMetrics,
      agent_performance: agentPerformance,
      product_performance: productPerformance,
      activity_breakdown: activityBreakdown
    });
  } catch (error) {
    console.error('Error fetching campaign performance:', error);
    res.status(500).json({ error: 'Failed to fetch campaign performance' });
  }
});

// Get ROI analysis
router.get('/roi-analysis', authenticateToken, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const { start_date, end_date, campaign_type } = req.query;
    
    let dateFilter = '';
    const params = [];
    
    if (start_date && end_date) {
      dateFilter = 'AND c.start_date >= ? AND c.end_date <= ?';
      params.push(start_date, end_date);
    }
    
    let typeFilter = '';
    if (campaign_type) {
      typeFilter = 'AND c.type = ?';
      params.push(campaign_type);
    }
    
    // ROI by campaign
    const roiByCampaign = db.prepare(`
      SELECT 
        c.name,
        c.type,
        c.budget,
        cp.total_sales,
        cp.roi_percentage,
        cp.efficiency_score,
        (cp.total_sales - c.budget) as profit,
        CASE 
          WHEN cp.roi_percentage >= 300 THEN 'Excellent'
          WHEN cp.roi_percentage >= 200 THEN 'Good'
          WHEN cp.roi_percentage >= 100 THEN 'Average'
          ELSE 'Poor'
        END as performance_category
      FROM campaigns c
      LEFT JOIN campaign_performance cp ON c.id = cp.campaign_id
      WHERE c.status IN ('active', 'completed') ${dateFilter} ${typeFilter}
      ORDER BY cp.roi_percentage DESC
    `).all(...params);
    
    // ROI trends over time
    const roiTrends = db.prepare(`
      SELECT 
        DATE(c.start_date) as period,
        AVG(cp.roi_percentage) as avg_roi,
        SUM(c.budget) as total_budget,
        SUM(cp.total_sales) as total_sales,
        COUNT(*) as campaign_count
      FROM campaigns c
      LEFT JOIN campaign_performance cp ON c.id = cp.campaign_id
      WHERE c.status IN ('active', 'completed') ${dateFilter} ${typeFilter}
      GROUP BY DATE(c.start_date)
      ORDER BY period DESC
      LIMIT 12
    `).all(...params);
    
    // Cost analysis
    const costAnalysis = db.prepare(`
      SELECT 
        c.type,
        COUNT(*) as campaign_count,
        SUM(c.budget) as total_budget,
        AVG(c.budget) as avg_budget,
        SUM(cp.total_sales) as total_sales,
        AVG(cp.roi_percentage) as avg_roi,
        SUM(cp.total_visits) as total_visits,
        ROUND(SUM(c.budget) / NULLIF(SUM(cp.total_visits), 0), 2) as cost_per_visit
      FROM campaigns c
      LEFT JOIN campaign_performance cp ON c.id = cp.campaign_id
      WHERE c.status IN ('active', 'completed') ${dateFilter} ${typeFilter}
      GROUP BY c.type
      ORDER BY avg_roi DESC
    `).all(...params);
    
    res.json({
      roi_by_campaign: roiByCamera,
      roi_trends: roiTrends,
      cost_analysis: costAnalysis
    });
  } catch (error) {
    console.error('Error fetching ROI analysis:', error);
    res.status(500).json({ error: 'Failed to fetch ROI analysis' });
  }
});

// Get budget tracking
router.get('/budget-tracking', authenticateToken, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const { campaign_id } = req.query;
    
    let campaignFilter = '';
    const params = [];
    
    if (campaign_id) {
      campaignFilter = 'WHERE c.id = ?';
      params.push(campaign_id);
    }
    
    // Budget utilization
    const budgetUtilization = db.prepare(`
      SELECT 
        c.id,
        c.name,
        c.budget as allocated_budget,
        COALESCE(SUM(ce.amount), 0) as spent_amount,
        (c.budget - COALESCE(SUM(ce.amount), 0)) as remaining_budget,
        ROUND((COALESCE(SUM(ce.amount), 0) / c.budget) * 100, 2) as utilization_percentage,
        c.start_date,
        c.end_date,
        c.status
      FROM campaigns c
      LEFT JOIN campaign_expenses ce ON c.id = ce.campaign_id
      ${campaignFilter}
      GROUP BY c.id, c.name, c.budget, c.start_date, c.end_date, c.status
      ORDER BY utilization_percentage DESC
    `).all(...params);
    
    // Expense breakdown
    const expenseBreakdown = db.prepare(`
      SELECT 
        ce.expense_type,
        SUM(ce.amount) as total_amount,
        COUNT(*) as transaction_count,
        AVG(ce.amount) as avg_amount
      FROM campaign_expenses ce
      JOIN campaigns c ON ce.campaign_id = c.id
      ${campaignFilter ? 'WHERE c.id = ?' : ''}
      GROUP BY ce.expense_type
      ORDER BY total_amount DESC
    `).all(campaign_id ? [campaign_id] : []);
    
    // Monthly budget burn rate
    const burnRate = db.prepare(`
      SELECT 
        strftime('%Y-%m', ce.expense_date) as month,
        SUM(ce.amount) as monthly_spend,
        COUNT(DISTINCT ce.campaign_id) as active_campaigns
      FROM campaign_expenses ce
      JOIN campaigns c ON ce.campaign_id = c.id
      ${campaignFilter ? 'WHERE c.id = ?' : ''}
      GROUP BY strftime('%Y-%m', ce.expense_date)
      ORDER BY month DESC
      LIMIT 12
    `).all(campaign_id ? [campaign_id] : []);
    
    res.json({
      budget_utilization: budgetUtilization,
      expense_breakdown: expenseBreakdown,
      burn_rate: burnRate
    });
  } catch (error) {
    console.error('Error fetching budget tracking:', error);
    res.status(500).json({ error: 'Failed to fetch budget tracking' });
  }
});

// Create campaign expense
router.post('/expenses', authenticateToken, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const {
      campaign_id,
      expense_type,
      amount,
      description,
      expense_date,
      receipt_url
    } = req.body;
    
    // Validate required fields
    if (!campaign_id || !expense_type || !amount) {
      return res.status(400).json({ error: 'Campaign ID, expense type, and amount are required' });
    }
    
    // Check if campaign exists
    const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(campaign_id);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    // Check budget availability
    const currentSpend = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total_spent
      FROM campaign_expenses
      WHERE campaign_id = ?
    `).get(campaign_id);
    
    if ((currentSpend.total_spent + amount) > campaign.budget) {
      return res.status(400).json({ 
        error: 'Expense would exceed campaign budget',
        budget: campaign.budget,
        current_spend: currentSpend.total_spent,
        requested_amount: amount
      });
    }
    
    // Create expense record
    const result = db.prepare(`
      INSERT INTO campaign_expenses (
        campaign_id, expense_type, amount, description, expense_date,
        receipt_url, created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(
      campaign_id, expense_type, amount, description, 
      expense_date || new Date().toISOString(), receipt_url, req.user.id
    );
    
    res.status(201).json({
      id: result.lastInsertRowid,
      message: 'Campaign expense recorded successfully'
    });
  } catch (error) {
    console.error('Error creating campaign expense:', error);
    res.status(500).json({ error: 'Failed to record campaign expense' });
  }
});

// Get campaign comparison
router.get('/comparison', authenticateToken, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const { campaign_ids } = req.query; // Comma-separated campaign IDs
    
    if (!campaign_ids) {
      return res.status(400).json({ error: 'Campaign IDs are required' });
    }
    
    const ids = campaign_ids.split(',').map(id => id.trim());
    const placeholders = ids.map(() => '?').join(',');
    
    // Campaign comparison metrics
    const comparison = db.prepare(`
      SELECT 
        c.id,
        c.name,
        c.type,
        c.budget,
        c.start_date,
        c.end_date,
        cp.total_sales,
        cp.total_visits,
        cp.total_activities,
        cp.conversion_rate,
        cp.roi_percentage,
        cp.efficiency_score,
        ROUND(cp.total_sales / NULLIF(c.budget, 0) * 100, 2) as sales_to_budget_ratio,
        ROUND(c.budget / NULLIF(cp.total_visits, 0), 2) as cost_per_visit,
        ROUND(cp.total_sales / NULLIF(cp.total_visits, 0), 2) as sales_per_visit
      FROM campaigns c
      LEFT JOIN campaign_performance cp ON c.id = cp.campaign_id
      WHERE c.id IN (${placeholders})
      ORDER BY cp.roi_percentage DESC
    `).all(...ids);
    
    // Performance metrics summary
    const summary = {
      total_campaigns: comparison.length,
      avg_roi: comparison.reduce((sum, c) => sum + (c.roi_percentage || 0), 0) / comparison.length,
      total_budget: comparison.reduce((sum, c) => sum + (c.budget || 0), 0),
      total_sales: comparison.reduce((sum, c) => sum + (c.total_sales || 0), 0),
      best_performer: comparison[0],
      worst_performer: comparison[comparison.length - 1]
    };
    
    res.json({
      comparison,
      summary
    });
  } catch (error) {
    console.error('Error fetching campaign comparison:', error);
    res.status(500).json({ error: 'Failed to fetch campaign comparison' });
  }
});

module.exports = router;