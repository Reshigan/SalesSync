const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { getQuery, getOneQuery, runQuery } = require('../utils/database');

// Get all campaigns
router.get('/', asyncHandler(async (req, res) => {
  const tenantId = req.user.tenantId;
  
  const campaigns = await getQuery(`
    SELECT 
      id,
      name,
      campaign_type,
      start_date,
      end_date,
      budget,
      target_activations,
      status,
      created_at
    FROM promotional_campaigns 
    WHERE tenant_id = $1
    ORDER BY created_at DESC
  `, [tenantId]);

  res.json({
    success: true,
    data: campaigns || [],
    summary: {
      total_campaigns: campaigns ? campaigns.length : 0,
      active_campaigns: campaigns ? campaigns.filter(c => c.status === 'active').length : 0
    }
  });
}));

// Create new campaign
router.post('/', asyncHandler(async (req, res) => {
  const {
    name,
    campaign_type,
    start_date,
    end_date,
    budget,
    target_activations
  } = req.body;

  const campaignId = require('crypto').randomUUID();
  
  const result = await runQuery(
    `INSERT INTO promotional_campaigns (
      id, tenant_id, name, campaign_type, start_date, end_date,
      budget, target_activations, status, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [
      campaignId,
      req.user.tenantId,
      name,
      campaign_type || 'general',
      start_date,
      end_date,
      budget || 0,
      target_activations || 0,
      'draft',
      new Date().toISOString()
    ]
  );

  res.status(201).json({
    success: true,
    data: {
      id: campaignId,
      name,
      campaign_type: campaign_type || 'general',
      status: 'draft'
    }
  });
}));

// Get campaign by ID
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const tenantId = req.user.tenantId;
  
  const campaign = await getOneQuery(`
    SELECT * FROM promotional_campaigns 
    WHERE id = $1 AND tenant_id = $2
  `, [id, tenantId]);

  if (!campaign) {
    return res.status(404).json({
      success: false,
      message: 'Campaign not found'
    });
  }

  res.json({
    success: true,
    data: campaign
  });
}));

// Update campaign
router.put('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const tenantId = req.user.tenantId;
  const { name, campaign_type, start_date, end_date, budget, target_activations, status } = req.body;
  
  const result = await runQuery(`
    UPDATE promotional_campaigns 
    SET name = $1, campaign_type = $2, start_date = $3, end_date = $4, 
        budget = $5, target_activations = $6, status = $7, updated_at = $8
    WHERE id = $9 AND tenant_id = $10
  `, [name, campaign_type, start_date, end_date, budget, target_activations, status, new Date().toISOString(), id, tenantId]);

  if (result.changes === 0) {
    return res.status(404).json({
      success: false,
      message: 'Campaign not found'
    });
  }

  res.json({
    success: true,
    message: 'Campaign updated successfully'
  });
}));

// Delete campaign
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const tenantId = req.user.tenantId;
  
  const result = await runQuery(`
    DELETE FROM promotional_campaigns 
    WHERE id = $1 AND tenant_id = $2
  `, [id, tenantId]);

  if (result.changes === 0) {
    return res.status(404).json({
      success: false,
      message: 'Campaign not found'
    });
  }

  res.json({
    success: true,
    message: 'Campaign deleted successfully'
  });
}));

// Test endpoint
router.get('/test/health', asyncHandler(async (req, res) => {
  res.json({
    success: true,
    message: 'Campaign execution API is working',
    timestamp: new Date().toISOString()
  });
}));

module.exports = router;
