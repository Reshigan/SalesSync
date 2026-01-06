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

    // Calculate ROI from sales data (revenue generated / spend)
    const revenueQuery = await getQuery(`
      SELECT COALESCE(SUM(o.total_amount), 0) as revenue
      FROM orders o
      WHERE o.tenant_id = ? 
        AND o.created_at >= DATE('now', '-30 days')
    `, [tenantId]);
    const revenue = revenueQuery[0]?.revenue || 0;
    const roi = totalSpend > 0 ? parseFloat((revenue / totalSpend).toFixed(2)) : 0;

    // Calculate trade spend efficiency (revenue per dollar spent)
    const tradeSpendEfficiency = totalSpend > 0 ? parseFloat(((revenue / totalSpend) * 100).toFixed(1)) : 0;

    // Calculate volume growth (compare current vs previous period)
    const currentVolumeQuery = await getQuery(`
      SELECT COALESCE(SUM(oi.quantity), 0) as volume
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE o.tenant_id = ? AND o.created_at >= DATE('now', '-30 days')
    `, [tenantId]);
    const previousVolumeQuery = await getQuery(`
      SELECT COALESCE(SUM(oi.quantity), 0) as volume
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE o.tenant_id = ? 
        AND o.created_at >= DATE('now', '-60 days')
        AND o.created_at < DATE('now', '-30 days')
    `, [tenantId]);
    const currentVolume = currentVolumeQuery[0]?.volume || 0;
    const previousVolume = previousVolumeQuery[0]?.volume || 1;
    const volumeGrowth = parseFloat((((currentVolume - previousVolume) / previousVolume) * 100).toFixed(1));

    // Calculate price realization (actual price vs list price)
    const priceQuery = await getQuery(`
      SELECT 
        COALESCE(AVG(oi.unit_price), 0) as avg_actual_price,
        COALESCE(AVG(p.price), 0) as avg_list_price
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN products p ON oi.product_id = p.id
      WHERE o.tenant_id = ? AND o.created_at >= DATE('now', '-30 days')
    `, [tenantId]);
    const avgActualPrice = priceQuery[0]?.avg_actual_price || 0;
    const avgListPrice = priceQuery[0]?.avg_list_price || 1;
    const priceRealization = avgListPrice > 0 ? parseFloat(((avgActualPrice / avgListPrice) * 100).toFixed(1)) : 100;

    // Get competitor count from competitor service
    const competitorService = require('../services/competitor.service');
    let competitorCount = 0;
    let marketShare = 0;
    try {
      const competitorAnalysis = await competitorService.getMarketShareAnalysis(tenantId);
      competitorCount = competitorAnalysis.totalCompetitors || 0;
      marketShare = competitorAnalysis.ourMarketShare || 0;
    } catch (e) {
      // Competitor tables may not exist yet
      competitorCount = 0;
      marketShare = 0;
    }

    res.json({
      success: true,
      data: {
        totalSpend,
        activePromotions,
        retailerParticipation,
        roi,
        marketShare,
        competitorAnalysis: competitorCount,
        channelPartners,
        tradeSpendEfficiency,
        volumeGrowth: isFinite(volumeGrowth) ? volumeGrowth : 0,
        priceRealization
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
        COALESCE(pc.actual_cost, 0) as spent,
        pc.target_activations as participatingRetailers,
        COALESCE(pc.category, 'General') as category,
        COALESCE(pc.channel, 'Retail') as channel,
        pc.expected_roi,
        pc.created_at
      FROM promotional_campaigns pc
      WHERE pc.tenant_id = ?
      ORDER BY pc.created_at DESC
    `, [tenantId]);

    // Calculate actual performance data for each promotion from sales data
    const promotionsWithPerformance = await Promise.all(promotions.map(async (promo) => {
      let actualROI = null;
      let volumeImpact = 0;
      let revenueImpact = 0;
      let marginImpact = 0;

      // Only calculate actual metrics for active or completed promotions
      if (promo.status === 'active' || promo.status === 'completed') {
        // Get sales during promotion period
        const promoSales = await getQuery(`
          SELECT 
            COALESCE(SUM(o.total_amount), 0) as promo_revenue,
            COALESCE(SUM(oi.quantity), 0) as promo_volume
          FROM orders o
          JOIN order_items oi ON o.id = oi.order_id
          WHERE o.tenant_id = ?
            AND o.created_at >= ?
            AND o.created_at <= COALESCE(?, CURRENT_TIMESTAMP)
        `, [tenantId, promo.startDate, promo.endDate]);

        // Get baseline sales (same duration before promotion)
        const promoDuration = promo.endDate ? 
          Math.ceil((new Date(promo.endDate) - new Date(promo.startDate)) / (1000 * 60 * 60 * 24)) : 30;
        
        const baselineStart = new Date(promo.startDate);
        baselineStart.setDate(baselineStart.getDate() - promoDuration);
        
        const baselineSales = await getQuery(`
          SELECT 
            COALESCE(SUM(o.total_amount), 0) as baseline_revenue,
            COALESCE(SUM(oi.quantity), 0) as baseline_volume
          FROM orders o
          JOIN order_items oi ON o.id = oi.order_id
          WHERE o.tenant_id = ?
            AND o.created_at >= ?
            AND o.created_at < ?
        `, [tenantId, baselineStart.toISOString(), promo.startDate]);

        const promoRevenue = promoSales[0]?.promo_revenue || 0;
        const promoVolume = promoSales[0]?.promo_volume || 0;
        const baselineRevenue = baselineSales[0]?.baseline_revenue || 1;
        const baselineVolume = baselineSales[0]?.baseline_volume || 1;

        // Calculate impacts
        volumeImpact = baselineVolume > 0 ? 
          parseFloat((((promoVolume - baselineVolume) / baselineVolume) * 100).toFixed(1)) : 0;
        revenueImpact = baselineRevenue > 0 ? 
          parseFloat((((promoRevenue - baselineRevenue) / baselineRevenue) * 100).toFixed(1)) : 0;
        
        // Margin impact (revenue increase minus promotion cost as % of baseline)
        const spent = promo.spent || 0;
        marginImpact = baselineRevenue > 0 ? 
          parseFloat((((promoRevenue - baselineRevenue - spent) / baselineRevenue) * 100).toFixed(1)) : 0;

        // Calculate actual ROI (revenue generated / spend)
        if (spent > 0) {
          actualROI = parseFloat(((promoRevenue - baselineRevenue) / spent).toFixed(2));
        }
      }

      return {
        ...promo,
        expectedROI: promo.expected_roi || (promo.budget > 0 ? 3.0 : null),
        actualROI,
        performance: {
          volumeImpact: isFinite(volumeImpact) ? volumeImpact : 0,
          revenueImpact: isFinite(revenueImpact) ? revenueImpact : 0,
          marginImpact: isFinite(marginImpact) ? marginImpact : 0
        }
      };
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
