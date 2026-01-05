/**
 * Competitor Analysis Service
 * Handles competitor tracking, market share analysis, and competitive intelligence
 */

const { getQuery, getOneQuery, runQuery } = require('../utils/database');
const { v4: uuidv4 } = require('uuid');

class CompetitorService {
  /**
   * Get all competitors for a tenant
   */
  async getCompetitors(tenantId, options = {}) {
    const { limit = 50, offset = 0, status = 'active' } = options;
    
    let query = `
      SELECT 
        c.*,
        (SELECT COUNT(*) FROM competitor_products cp WHERE cp.competitor_id = c.id) as product_count,
        (SELECT AVG(cp.price_index) FROM competitor_products cp WHERE cp.competitor_id = c.id) as avg_price_index
      FROM competitors c
      WHERE c.tenant_id = ?
    `;
    const params = [tenantId];
    
    if (status) {
      query += ` AND c.status = ?`;
      params.push(status);
    }
    
    query += ` ORDER BY c.market_share DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);
    
    const competitors = await getQuery(query, params);
    
    // Get total count
    const countResult = await getOneQuery(
      `SELECT COUNT(*) as total FROM competitors WHERE tenant_id = ?`,
      [tenantId]
    );
    
    return {
      competitors,
      total: countResult?.total || 0,
      limit,
      offset
    };
  }

  /**
   * Get competitor by ID
   */
  async getCompetitorById(tenantId, competitorId) {
    const competitor = await getOneQuery(
      `SELECT * FROM competitors WHERE id = ? AND tenant_id = ?`,
      [competitorId, tenantId]
    );
    
    if (!competitor) {
      return null;
    }
    
    // Get competitor products
    const products = await getQuery(
      `SELECT * FROM competitor_products WHERE competitor_id = ? ORDER BY created_at DESC`,
      [competitorId]
    );
    
    // Get competitor price history
    const priceHistory = await getQuery(
      `SELECT * FROM competitor_price_history 
       WHERE competitor_id = ? 
       ORDER BY recorded_at DESC 
       LIMIT 30`,
      [competitorId]
    );
    
    // Get competitor activities
    const activities = await getQuery(
      `SELECT * FROM competitor_activities 
       WHERE competitor_id = ? 
       ORDER BY activity_date DESC 
       LIMIT 20`,
      [competitorId]
    );
    
    return {
      ...competitor,
      products,
      priceHistory,
      activities
    };
  }

  /**
   * Create a new competitor
   */
  async createCompetitor(tenantId, data) {
    const id = uuidv4();
    const timestamp = new Date().toISOString();
    
    await runQuery(`
      INSERT INTO competitors (
        id, tenant_id, name, description, website, logo_url,
        market_share, status, industry, headquarters,
        founded_year, employee_count, annual_revenue,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id, tenantId, data.name, data.description || null, data.website || null,
      data.logo_url || null, data.market_share || 0, data.status || 'active',
      data.industry || null, data.headquarters || null, data.founded_year || null,
      data.employee_count || null, data.annual_revenue || null,
      timestamp, timestamp
    ]);
    
    return { id, ...data, created_at: timestamp };
  }

  /**
   * Update a competitor
   */
  async updateCompetitor(tenantId, competitorId, data) {
    const timestamp = new Date().toISOString();
    
    await runQuery(`
      UPDATE competitors SET
        name = COALESCE(?, name),
        description = COALESCE(?, description),
        website = COALESCE(?, website),
        logo_url = COALESCE(?, logo_url),
        market_share = COALESCE(?, market_share),
        status = COALESCE(?, status),
        industry = COALESCE(?, industry),
        headquarters = COALESCE(?, headquarters),
        founded_year = COALESCE(?, founded_year),
        employee_count = COALESCE(?, employee_count),
        annual_revenue = COALESCE(?, annual_revenue),
        updated_at = ?
      WHERE id = ? AND tenant_id = ?
    `, [
      data.name, data.description, data.website, data.logo_url,
      data.market_share, data.status, data.industry, data.headquarters,
      data.founded_year, data.employee_count, data.annual_revenue,
      timestamp, competitorId, tenantId
    ]);
    
    return this.getCompetitorById(tenantId, competitorId);
  }

  /**
   * Delete a competitor
   */
  async deleteCompetitor(tenantId, competitorId) {
    await runQuery(
      `DELETE FROM competitors WHERE id = ? AND tenant_id = ?`,
      [competitorId, tenantId]
    );
    return { deleted: true };
  }

  /**
   * Add competitor product
   */
  async addCompetitorProduct(tenantId, competitorId, data) {
    const id = uuidv4();
    const timestamp = new Date().toISOString();
    
    await runQuery(`
      INSERT INTO competitor_products (
        id, tenant_id, competitor_id, name, sku, category,
        price, price_index, our_equivalent_product_id,
        description, image_url, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id, tenantId, competitorId, data.name, data.sku || null,
      data.category || null, data.price || 0, data.price_index || 100,
      data.our_equivalent_product_id || null, data.description || null,
      data.image_url || null, timestamp, timestamp
    ]);
    
    return { id, ...data, created_at: timestamp };
  }

  /**
   * Update competitor product
   */
  async updateCompetitorProduct(tenantId, productId, data) {
    const timestamp = new Date().toISOString();
    
    await runQuery(`
      UPDATE competitor_products SET
        name = COALESCE(?, name),
        sku = COALESCE(?, sku),
        category = COALESCE(?, category),
        price = COALESCE(?, price),
        price_index = COALESCE(?, price_index),
        our_equivalent_product_id = COALESCE(?, our_equivalent_product_id),
        description = COALESCE(?, description),
        image_url = COALESCE(?, image_url),
        updated_at = ?
      WHERE id = ? AND tenant_id = ?
    `, [
      data.name, data.sku, data.category, data.price, data.price_index,
      data.our_equivalent_product_id, data.description, data.image_url,
      timestamp, productId, tenantId
    ]);
    
    return this.getCompetitorProductById(tenantId, productId);
  }

  /**
   * Get competitor product by ID
   */
  async getCompetitorProductById(tenantId, productId) {
    return await getOneQuery(
      `SELECT * FROM competitor_products WHERE id = ? AND tenant_id = ?`,
      [productId, tenantId]
    );
  }

  /**
   * Delete competitor product
   */
  async deleteCompetitorProduct(tenantId, productId) {
    await runQuery(
      `DELETE FROM competitor_products WHERE id = ? AND tenant_id = ?`,
      [productId, tenantId]
    );
    return { deleted: true };
  }

  /**
   * Record competitor price observation
   */
  async recordPriceObservation(tenantId, data) {
    const id = uuidv4();
    const timestamp = new Date().toISOString();
    
    await runQuery(`
      INSERT INTO competitor_price_history (
        id, tenant_id, competitor_id, product_id, price,
        price_index, location, observed_by, recorded_at, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id, tenantId, data.competitor_id, data.product_id || null,
      data.price, data.price_index || 100, data.location || null,
      data.observed_by || null, timestamp, data.notes || null
    ]);
    
    // Update the product's current price if product_id is provided
    if (data.product_id) {
      await runQuery(`
        UPDATE competitor_products SET
          price = ?,
          price_index = ?,
          updated_at = ?
        WHERE id = ? AND tenant_id = ?
      `, [data.price, data.price_index || 100, timestamp, data.product_id, tenantId]);
    }
    
    return { id, ...data, recorded_at: timestamp };
  }

  /**
   * Record competitor activity (promotion, campaign, etc.)
   */
  async recordCompetitorActivity(tenantId, data) {
    const id = uuidv4();
    const timestamp = new Date().toISOString();
    
    await runQuery(`
      INSERT INTO competitor_activities (
        id, tenant_id, competitor_id, activity_type, title,
        description, activity_date, end_date, impact_level,
        location, observed_by, evidence_url, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id, tenantId, data.competitor_id, data.activity_type,
      data.title, data.description || null, data.activity_date || timestamp,
      data.end_date || null, data.impact_level || 'medium',
      data.location || null, data.observed_by || null,
      data.evidence_url || null, timestamp
    ]);
    
    return { id, ...data, created_at: timestamp };
  }

  /**
   * Get market share analysis
   */
  async getMarketShareAnalysis(tenantId) {
    // Get all competitors with market share
    const competitors = await getQuery(`
      SELECT 
        c.id,
        c.name,
        c.market_share,
        c.status,
        (SELECT AVG(cp.price_index) FROM competitor_products cp WHERE cp.competitor_id = c.id) as avg_price_index,
        (SELECT COUNT(*) FROM competitor_activities ca 
         WHERE ca.competitor_id = c.id 
         AND ca.activity_date >= DATE('now', '-30 days')) as recent_activities
      FROM competitors c
      WHERE c.tenant_id = ? AND c.status = 'active'
      ORDER BY c.market_share DESC
    `, [tenantId]);
    
    // Calculate our market share (100% - sum of competitor shares)
    const totalCompetitorShare = competitors.reduce((sum, c) => sum + (c.market_share || 0), 0);
    const ourMarketShare = Math.max(0, 100 - totalCompetitorShare);
    
    // Determine trends based on recent activities
    const analysis = competitors.map(c => ({
      competitor: c.name,
      marketShare: c.market_share || 0,
      priceIndex: Math.round(c.avg_price_index || 100),
      promotionalActivity: Math.min(100, (c.recent_activities || 0) * 10),
      trend: c.recent_activities > 3 ? 'up' : c.recent_activities > 1 ? 'stable' : 'down'
    }));
    
    return {
      ourMarketShare,
      totalCompetitorShare,
      competitors: analysis,
      totalCompetitors: competitors.length
    };
  }

  /**
   * Get competitive intelligence summary
   */
  async getCompetitiveIntelligence(tenantId, options = {}) {
    const { days = 30 } = options;
    
    // Get recent competitor activities
    const recentActivities = await getQuery(`
      SELECT 
        ca.*,
        c.name as competitor_name
      FROM competitor_activities ca
      JOIN competitors c ON ca.competitor_id = c.id
      WHERE ca.tenant_id = ? 
        AND ca.activity_date >= DATE('now', '-${days} days')
      ORDER BY ca.activity_date DESC
      LIMIT 20
    `, [tenantId]);
    
    // Get price changes
    const priceChanges = await getQuery(`
      SELECT 
        cph.*,
        c.name as competitor_name,
        cp.name as product_name
      FROM competitor_price_history cph
      JOIN competitors c ON cph.competitor_id = c.id
      LEFT JOIN competitor_products cp ON cph.product_id = cp.id
      WHERE cph.tenant_id = ?
        AND cph.recorded_at >= DATE('now', '-${days} days')
      ORDER BY cph.recorded_at DESC
      LIMIT 20
    `, [tenantId]);
    
    // Get activity summary by type
    const activitySummary = await getQuery(`
      SELECT 
        activity_type,
        COUNT(*) as count,
        AVG(CASE impact_level 
          WHEN 'high' THEN 3 
          WHEN 'medium' THEN 2 
          ELSE 1 
        END) as avg_impact
      FROM competitor_activities
      WHERE tenant_id = ?
        AND activity_date >= DATE('now', '-${days} days')
      GROUP BY activity_type
      ORDER BY count DESC
    `, [tenantId]);
    
    return {
      recentActivities,
      priceChanges,
      activitySummary,
      period: `Last ${days} days`
    };
  }
}

module.exports = new CompetitorService();
