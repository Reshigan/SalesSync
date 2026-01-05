const express = require('express');
const router = express.Router();
const { getQuery, getOneQuery, runQuery } = require('../utils/database');
const competitorService = require('../services/competitor.service');

/**
 * Get trade marketing overview metrics
 */
router.get('/metrics', async (req, res) => {
  try {
    const tenantId = req.tenantId;

    // Get total spend from promotional campaigns
    const spendQuery = await getQuery(`
      SELECT 
        COALESCE(SUM(budget), 0) as total_spend,
        COUNT(*) as active_promotions
      FROM promotional_campaigns
      WHERE tenant_id = ? AND status = 'active'
    `, [tenantId]);

    // Get retailer participation (customers involved in activations)
    const participationQuery = await getQuery(`
      SELECT COUNT(DISTINCT customer_id) as retailer_count
      FROM customer_activations
      WHERE tenant_id = ? AND status = 'completed'
    `, [tenantId]);

    // Get channel partners count
    const partnersQuery = await getQuery(`
      SELECT COUNT(*) as channel_partners
      FROM customers
      WHERE tenant_id = ? AND type IN ('distributor', 'retailer', 'wholesaler')
    `, [tenantId]);

    // Calculate metrics
    const totalSpend = spendQuery[0]?.total_spend || 0;
    const activePromotions = spendQuery[0]?.active_promotions || 0;
    const retailerCount = participationQuery[0]?.retailer_count || 0;
    const channelPartners = partnersQuery[0]?.channel_partners || 0;
    
    // Get total customers for participation rate
    const totalCustomersQuery = await getQuery(`
      SELECT COUNT(*) as total
      FROM customers
      WHERE tenant_id = ?
    `, [tenantId]);
    const totalCustomers = totalCustomersQuery[0]?.total || 1;
    const retailerParticipation = Math.round((retailerCount / totalCustomers) * 100);

    res.json({
      success: true,
      data: {
        totalSpend,
        activePromotions,
        retailerParticipation,
        roi: 3.2, // TODO: Calculate from actual sales data
        marketShare: 24.5, // TODO: Calculate from market data
        competitorAnalysis: 12, // TODO: Implement competitor tracking
        channelPartners,
        tradeSpendEfficiency: 78.5, // TODO: Calculate from spend vs revenue
        volumeGrowth: 12.3, // TODO: Calculate from historical sales
        priceRealization: 94.2 // TODO: Calculate from pricing data
      }
    });
  } catch (error) {
    console.error('Error fetching trade marketing metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch trade marketing metrics'
    });
  }
});

/**
 * Get trade marketing promotions
 */
router.get('/promotions', async (req, res) => {
  try {
    const tenantId = req.tenantId;

    const promotions = await getQuery(`
      SELECT 
        pc.id,
        pc.name,
        pc.campaign_type as type,
        pc.status,
        pc.start_date as startDate,
        pc.end_date as endDate,
        pc.budget,
        0 as spent,
        pc.target_activations as participatingRetailers,
        'Beverages' as category,
        'Retail' as channel
      FROM promotional_campaigns pc
      WHERE pc.tenant_id = ?
      ORDER BY pc.created_at DESC
    `, [tenantId]);

    // Add performance data for each promotion
    const promotionsWithPerformance = promotions.map(promo => ({
      ...promo,
      expectedROI: 3.5,
      actualROI: promo.status === 'completed' ? 3.8 : null,
      performance: {
        volumeImpact: 15.2,
        revenueImpact: 18.7,
        marginImpact: 12.4
      }
    }));

    res.json({
      success: true,
      data: promotionsWithPerformance
    });
  } catch (error) {
    console.error('Error fetching trade marketing promotions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch trade marketing promotions'
    });
  }
});

/**
 * Get channel partners
 */
router.get('/channel-partners', async (req, res) => {
  try {
    const tenantId = req.tenantId;

    const partners = await getQuery(`
      SELECT 
        c.id,
        c.name,
        c.type,
        'gold' as tier,
        0 as totalSpend,
        75 as performance,
        0 as programs
      FROM customers c
      WHERE c.tenant_id = ? 
        AND c.type IN ('distributor', 'retailer', 'wholesaler')
      ORDER BY c.name
    `, [tenantId]);

    res.json({
      success: true,
      data: partners
    });
  } catch (error) {
    console.error('Error fetching channel partners:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch channel partners'
    });
  }
});

/**
 * Get competitor analysis (market share overview)
 */
router.get('/competitor-analysis', async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const analysis = await competitorService.getMarketShareAnalysis(tenantId);
    
    res.json({
      success: true,
      data: analysis.competitors,
      summary: {
        ourMarketShare: analysis.ourMarketShare,
        totalCompetitors: analysis.totalCompetitors
      }
    });
  } catch (error) {
    console.error('Error fetching competitor analysis:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch competitor analysis'
    });
  }
});

/**
 * Get all competitors
 */
router.get('/competitors', async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { limit, offset, status } = req.query;
    
    const result = await competitorService.getCompetitors(tenantId, {
      limit: parseInt(limit) || 50,
      offset: parseInt(offset) || 0,
      status
    });
    
    res.json({
      success: true,
      data: result.competitors,
      pagination: {
        total: result.total,
        limit: result.limit,
        offset: result.offset
      }
    });
  } catch (error) {
    console.error('Error fetching competitors:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch competitors'
    });
  }
});

/**
 * Get competitor by ID
 */
router.get('/competitors/:id', async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { id } = req.params;
    
    const competitor = await competitorService.getCompetitorById(tenantId, id);
    
    if (!competitor) {
      return res.status(404).json({
        success: false,
        error: 'Competitor not found'
      });
    }
    
    res.json({
      success: true,
      data: competitor
    });
  } catch (error) {
    console.error('Error fetching competitor:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch competitor'
    });
  }
});

/**
 * Create competitor
 */
router.post('/competitors', async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const competitor = await competitorService.createCompetitor(tenantId, req.body);
    
    res.status(201).json({
      success: true,
      data: competitor
    });
  } catch (error) {
    console.error('Error creating competitor:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create competitor'
    });
  }
});

/**
 * Update competitor
 */
router.put('/competitors/:id', async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { id } = req.params;
    
    const competitor = await competitorService.updateCompetitor(tenantId, id, req.body);
    
    res.json({
      success: true,
      data: competitor
    });
  } catch (error) {
    console.error('Error updating competitor:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update competitor'
    });
  }
});

/**
 * Delete competitor
 */
router.delete('/competitors/:id', async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { id } = req.params;
    
    await competitorService.deleteCompetitor(tenantId, id);
    
    res.json({
      success: true,
      message: 'Competitor deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting competitor:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete competitor'
    });
  }
});

/**
 * Add competitor product
 */
router.post('/competitors/:competitorId/products', async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { competitorId } = req.params;
    
    const product = await competitorService.addCompetitorProduct(tenantId, competitorId, req.body);
    
    res.status(201).json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Error adding competitor product:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add competitor product'
    });
  }
});

/**
 * Record price observation
 */
router.post('/competitors/:competitorId/prices', async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { competitorId } = req.params;
    
    const observation = await competitorService.recordPriceObservation(tenantId, {
      ...req.body,
      competitor_id: competitorId
    });
    
    res.status(201).json({
      success: true,
      data: observation
    });
  } catch (error) {
    console.error('Error recording price observation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record price observation'
    });
  }
});

/**
 * Record competitor activity
 */
router.post('/competitors/:competitorId/activities', async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { competitorId } = req.params;
    
    const activity = await competitorService.recordCompetitorActivity(tenantId, {
      ...req.body,
      competitor_id: competitorId
    });
    
    res.status(201).json({
      success: true,
      data: activity
    });
  } catch (error) {
    console.error('Error recording competitor activity:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record competitor activity'
    });
  }
});

/**
 * Get competitive intelligence summary
 */
router.get('/competitive-intelligence', async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { days } = req.query;
    
    const intelligence = await competitorService.getCompetitiveIntelligence(tenantId, {
      days: parseInt(days) || 30
    });
    
    res.json({
      success: true,
      data: intelligence
    });
  } catch (error) {
    console.error('Error fetching competitive intelligence:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch competitive intelligence'
    });
  }
});

/**
 * Create new trade marketing program
 */
router.post('/programs', async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const {
      name,
      campaign_type,
      start_date,
      end_date,
      budget,
      target_outlets,
      description
    } = req.body;

    const id = require('crypto').randomUUID();

    await runQuery(`
      INSERT INTO promotional_campaigns (
        id, tenant_id, name, campaign_type, status,
        start_date, end_date, budget, target_activations,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id, tenantId, name, campaign_type, 'planned',
      start_date, end_date, budget, target_outlets || 0,
      new Date().toISOString()
    ]);

    res.status(201).json({
      success: true,
      data: { id, name, status: 'planned' }
    });
  } catch (error) {
    console.error('Error creating trade marketing program:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create trade marketing program'
    });
  }
});

/**
 * Update trade marketing program
 */
router.put('/programs/:id', async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { id } = req.params;
    const {
      name,
      campaign_type,
      status,
      start_date,
      end_date,
      budget,
      actual_cost,
      target_outlets,
      description
    } = req.body;

    await runQuery(`
      UPDATE promotional_campaigns
      SET name = ?,
          campaign_type = ?,
          status = ?,
          start_date = ?,
          end_date = ?,
          budget = ?,
          target_activations = ?
      WHERE id = ? AND tenant_id = ?
    `, [
      name, campaign_type, status, start_date, end_date,
      budget, target_outlets || 0,
      id, tenantId
    ]);

    res.json({
      success: true,
      data: { id, status: 'updated' }
    });
  } catch (error) {
    console.error('Error updating trade marketing program:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update trade marketing program'
    });
  }
});

module.exports = router;
