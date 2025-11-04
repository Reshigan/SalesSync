/**
 * Trade Marketing Service
 * Handles inshore analytics, activations, campaigns with photo verification
 */

const { getQuery, getOneQuery, runQuery } = require('../utils/database');
const { getDatabase } = require('../database/init');
const { v4: uuidv4 } = require('uuid');

class TradeMarketingService {
  /**
   * Calculate board coverage analytics
   * @param {string} tenantId - Tenant ID
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Coverage analytics
   */
  async getBoardCoverageAnalytics(tenantId, filters = {}) {
    const { brandId, startDate, endDate } = filters;

    let whereClause = 'WHERE bp.tenant_id = ?';
    const params = [tenantId];

    if (brandId) {
      whereClause += ' AND bp.brand_id = ?';
      params.push(brandId);
    }

    if (startDate) {
      whereClause += ' AND bp.created_at >= ?';
      params.push(startDate);
    }

    if (endDate) {
      whereClause += ' AND bp.created_at <= ?';
      params.push(endDate);
    }

    const [overall, byBrand, byStatus, trends] = await Promise.all([
      getOneQuery(
        `SELECT 
          COUNT(*) as total_placements,
          AVG(coverage_percentage) as avg_coverage,
          COUNT(CASE WHEN coverage_percentage >= 5 THEN 1 END) as compliant_placements,
          COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_placements
        FROM board_placements bp ${whereClause}`,
        params
      ),

      getQuery(
        `SELECT 
          b.id as brand_id,
          b.name as brand_name,
          COUNT(bp.id) as placement_count,
          AVG(bp.coverage_percentage) as avg_coverage,
          SUM(CASE WHEN bp.coverage_percentage >= bt.min_coverage_pct THEN 1 ELSE 0 END) as compliant_count
        FROM board_placements bp
        JOIN brands b ON bp.brand_id = b.id
        JOIN board_types bt ON bp.board_type_id = bt.id
        ${whereClause}
        GROUP BY b.id`,
        params
      ),

      getQuery(
        `SELECT 
          status,
          COUNT(*) as count,
          AVG(coverage_percentage) as avg_coverage
        FROM board_placements bp
        ${whereClause}
        GROUP BY status`,
        params
      ),

      getQuery(
        `SELECT 
          DATE(created_at) as date,
          COUNT(*) as placements,
          AVG(coverage_percentage) as avg_coverage
        FROM board_placements bp
        ${whereClause}
        GROUP BY DATE(created_at)
        ORDER BY date DESC
        LIMIT 30`,
        params
      )
    ]);

    const complianceRate = overall.total_placements > 0
      ? (overall.compliant_placements / overall.total_placements) * 100
      : 0;

    return {
      overall: {
        ...overall,
        compliance_rate: complianceRate.toFixed(2)
      },
      byBrand: byBrand || [],
      byStatus: byStatus || [],
      trends: trends || []
    };
  }

  /**
   * Calculate share of shelf analytics
   * @param {string} tenantId - Tenant ID
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Share of shelf data
   */
  async getShareOfShelfAnalytics(tenantId, filters = {}) {
    const { customerId, brandId } = filters;

    let whereClause = 'WHERE sp.tenant_id = ?';
    const params = [tenantId];

    if (customerId) {
      whereClause += ' AND sp.customer_id = ?';
      params.push(customerId);
    }

    if (brandId) {
      whereClause += ' AND spd.brand_id = ?';
      params.push(brandId);
    }

    const shelfData = await getQuery(
      `SELECT 
        b.id as brand_id,
        b.name as brand_name,
        COUNT(DISTINCT sp.id) as photo_count,
        COUNT(spd.id) as product_detections,
        AVG(spd.shelf_percentage) as avg_shelf_share,
        SUM(spd.facing_count) as total_facings
      FROM shelf_photos sp
      LEFT JOIN shelf_product_detections spd ON sp.id = spd.photo_id
      LEFT JOIN brands b ON spd.brand_id = b.id
      ${whereClause}
      GROUP BY b.id`,
      params
    );

    const totalFacings = shelfData.reduce((sum, item) => sum + (item.total_facings || 0), 0);

    const shareOfShelf = shelfData.map(item => ({
      ...item,
      share_percentage: totalFacings > 0 
        ? ((item.total_facings / totalFacings) * 100).toFixed(2)
        : 0
    }));

    return {
      shareOfShelf,
      totalPhotos: shelfData.reduce((sum, item) => sum + item.photo_count, 0),
      totalFacings
    };
  }

  /**
   * Calculate compliance rates
   * @param {string} tenantId - Tenant ID
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Compliance data
   */
  async getComplianceRates(tenantId, filters = {}) {
    const { campaignId, startDate, endDate } = filters;

    let whereClause = 'WHERE ca.tenant_id = ?';
    const params = [tenantId];

    if (campaignId) {
      whereClause += ' AND ca.campaign_id = ?';
      params.push(campaignId);
    }

    if (startDate) {
      whereClause += ' AND ca.created_at >= ?';
      params.push(startDate);
    }

    if (endDate) {
      whereClause += ' AND ca.created_at <= ?';
      params.push(endDate);
    }

    const [overall, byTask, byCustomer] = await Promise.all([
      getOneQuery(
        `SELECT 
          COUNT(*) as total_activations,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
          COUNT(CASE WHEN status = 'verified' THEN 1 END) as verified,
          COUNT(CASE WHEN photo_url IS NOT NULL THEN 1 END) as with_photos
        FROM customer_activations ca ${whereClause}`,
        params
      ),

      getQuery(
        `SELECT 
          task_type,
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
          AVG(CASE WHEN completed_at IS NOT NULL 
            THEN (julianday(completed_at) - julianday(created_at)) * 24 
            ELSE NULL END) as avg_completion_hours
        FROM customer_activations ca
        ${whereClause}
        GROUP BY task_type`,
        params
      ),

      getQuery(
        `SELECT 
          c.id as customer_id,
          c.name as customer_name,
          COUNT(ca.id) as activation_count,
          COUNT(CASE WHEN ca.status = 'completed' THEN 1 END) as completed_count,
          AVG(CASE WHEN ca.status = 'completed' THEN 100 ELSE 0 END) as compliance_rate
        FROM customer_activations ca
        JOIN customers c ON ca.customer_id = c.id
        ${whereClause}
        GROUP BY c.id
        ORDER BY compliance_rate DESC
        LIMIT 20`,
        params
      )
    ]);

    const completionRate = overall.total_activations > 0
      ? (overall.completed / overall.total_activations) * 100
      : 0;

    const verificationRate = overall.total_activations > 0
      ? (overall.verified / overall.total_activations) * 100
      : 0;

    const photoComplianceRate = overall.total_activations > 0
      ? (overall.with_photos / overall.total_activations) * 100
      : 0;

    return {
      overall: {
        ...overall,
        completion_rate: completionRate.toFixed(2),
        verification_rate: verificationRate.toFixed(2),
        photo_compliance_rate: photoComplianceRate.toFixed(2)
      },
      byTask: byTask || [],
      byCustomer: byCustomer || []
    };
  }

  /**
   * Create activation campaign with tasks
   * @param {string} tenantId - Tenant ID
   * @param {Object} campaignData - Campaign data
   * @returns {Promise<Object>} Created campaign
   */
  async createActivationCampaign(tenantId, campaignData) {
    const {
      name,
      description,
      brandId,
      startDate,
      endDate,
      budget,
      targetCustomers,
      tasks,
      idempotencyKey
    } = campaignData;

    if (idempotencyKey) {
      const existing = await getOneQuery(
        'SELECT * FROM promotional_campaigns WHERE tenant_id = ? AND id = ?',
        [tenantId, idempotencyKey]
      );
      if (existing) {
        return { campaignId: existing.id, message: 'Campaign already exists (idempotent)' };
      }
    }

    const db = getDatabase();
    
    await new Promise((resolve, reject) => {
      db.run('BEGIN TRANSACTION', (err) => { if (err) reject(err); else resolve(); });
    });

    try {
      const campaignId = idempotencyKey || uuidv4();
      
      await runQuery(
        `INSERT INTO promotional_campaigns (
          id, tenant_id, name, description, brand_id, campaign_type,
          start_date, end_date, budget, target_activations, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          campaignId, tenantId, name, description, brandId, 'activation',
          startDate, endDate, budget, targetCustomers.length, 'active', new Date().toISOString()
        ]
      );

      for (const customerId of targetCustomers) {
        for (const task of tasks) {
          const activationId = uuidv4();
          await runQuery(
            `INSERT INTO customer_activations (
              id, tenant_id, campaign_id, customer_id, task_type,
              task_description, requires_photo, is_mandatory, status, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              activationId, tenantId, campaignId, customerId, task.type,
              task.description, task.requiresPhoto ? 1 : 0, task.isMandatory ? 1 : 0,
              'pending', new Date().toISOString()
            ]
          );
        }
      }

      await new Promise((resolve, reject) => {
        db.run('COMMIT', (err) => { if (err) reject(err); else resolve(); });
      });

      return {
        campaignId,
        name,
        status: 'active',
        activationsCreated: targetCustomers.length * tasks.length
      };
    } catch (error) {
      await new Promise((resolve) => { db.run('ROLLBACK', () => resolve()); });
      throw error;
    }
  }

  /**
   * Complete activation task with photo verification
   * @param {string} tenantId - Tenant ID
   * @param {string} activationId - Activation ID
   * @param {Object} completionData - Completion data
   * @returns {Promise<Object>} Completion result
   */
  async completeActivation(tenantId, activationId, completionData) {
    const { agentId, photoUrl, notes, gpsLat, gpsLng } = completionData;

    const activation = await getOneQuery(
      'SELECT * FROM customer_activations WHERE id = ? AND tenant_id = ?',
      [activationId, tenantId]
    );

    if (!activation) {
      throw new Error('Activation not found');
    }

    if (activation.status === 'completed') {
      throw new Error('Activation already completed');
    }

    if (activation.requires_photo && !photoUrl) {
      throw new Error('Photo is required for this activation');
    }

    await runQuery(
      `UPDATE customer_activations 
       SET status = 'completed', agent_id = ?, photo_url = ?, notes = ?,
           gps_lat = ?, gps_lng = ?, completed_at = ?
       WHERE id = ? AND tenant_id = ?`,
      [
        agentId, photoUrl, notes, gpsLat, gpsLng, new Date().toISOString(),
        activationId, tenantId
      ]
    );

    return {
      activationId,
      status: 'completed',
      requiresVerification: activation.requires_photo
    };
  }

  /**
   * Get campaign performance analytics
   * @param {string} tenantId - Tenant ID
   * @param {string} campaignId - Campaign ID
   * @returns {Promise<Object>} Performance data
   */
  async getCampaignPerformance(tenantId, campaignId) {
    const [campaign, activations, topPerformers] = await Promise.all([
      getOneQuery(
        'SELECT * FROM promotional_campaigns WHERE id = ? AND tenant_id = ?',
        [campaignId, tenantId]
      ),

      getOneQuery(
        `SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
          COUNT(CASE WHEN status = 'verified' THEN 1 END) as verified,
          AVG(CASE WHEN completed_at IS NOT NULL 
            THEN (julianday(completed_at) - julianday(created_at)) * 24 
            ELSE NULL END) as avg_completion_hours
        FROM customer_activations
        WHERE campaign_id = ? AND tenant_id = ?`,
        [campaignId, tenantId]
      ),

      getQuery(
        `SELECT 
          a.id as agent_id,
          u.first_name || ' ' || u.last_name as agent_name,
          COUNT(ca.id) as activations_completed
        FROM customer_activations ca
        JOIN agents a ON ca.agent_id = a.id
        JOIN users u ON a.user_id = u.id
        WHERE ca.campaign_id = ? AND ca.tenant_id = ? AND ca.status = 'completed'
        GROUP BY a.id
        ORDER BY activations_completed DESC
        LIMIT 10`,
        [campaignId, tenantId]
      )
    ]);

    const completionRate = activations.total > 0
      ? (activations.completed / activations.total) * 100
      : 0;

    return {
      campaign,
      performance: {
        ...activations,
        completion_rate: completionRate.toFixed(2),
        budget_utilization: 0, // TODO: Calculate from actual spend
        roi: 0 // TODO: Calculate from sales impact
      },
      topPerformers: topPerformers || []
    };
  }
}

module.exports = new TradeMarketingService();
