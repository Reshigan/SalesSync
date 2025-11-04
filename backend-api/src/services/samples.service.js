/**
 * Samples Management Service
 * Handles sample product allocation and distribution tracking
 */

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../../database/salessync.db');

class SamplesService {
  constructor() {
    this.db = null;
  }

  getDb() {
    if (!this.db) {
      this.db = new Database(dbPath);
      this.db.pragma('foreign_keys = ON');
    }
    return this.db;
  }

  /**
   * Create a sample product
   * @param {string} tenantId - Tenant ID
   * @param {Object} sampleData - Sample product data
   */
  createSampleProduct(tenantId, sampleData) {
    const db = this.getDb();
    const { product_id, brand_id, sample_type, unit_cost } = sampleData;
    
    try {
      const sampleId = `smp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      db.prepare(`
        INSERT INTO sample_products (
          id, tenant_id, product_id, brand_id, sample_type, unit_cost, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, 'active', CURRENT_TIMESTAMP)
      `).run(sampleId, tenantId, product_id, brand_id, sample_type, unit_cost);

      return { success: true, sample_id: sampleId };
    } catch (error) {
      console.error('Error creating sample product:', error);
      throw error;
    }
  }

  /**
   * Allocate samples to an agent
   * @param {string} tenantId - Tenant ID
   * @param {Object} allocationData - Allocation data
   */
  allocateSamples(tenantId, allocationData) {
    const db = this.getDb();
    const { 
      sample_product_id, 
      agent_id, 
      campaign_id, 
      allocated_quantity, 
      allocation_date,
      expiry_date,
      notes 
    } = allocationData;
    
    try {
      db.prepare('BEGIN TRANSACTION').run();

      const allocationId = `sall-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      db.prepare(`
        INSERT INTO sample_allocations (
          id, tenant_id, sample_product_id, agent_id, campaign_id,
          allocated_quantity, allocation_date, expiry_date, notes, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', CURRENT_TIMESTAMP)
      `).run(
        allocationId, 
        tenantId, 
        sample_product_id, 
        agent_id, 
        campaign_id,
        allocated_quantity,
        allocation_date,
        expiry_date,
        notes
      );

      db.prepare('COMMIT').run();

      return { success: true, allocation_id: allocationId };
    } catch (error) {
      db.prepare('ROLLBACK').run();
      console.error('Error allocating samples:', error);
      throw error;
    }
  }

  /**
   * Record sample distribution
   * @param {string} tenantId - Tenant ID
   * @param {Object} distributionData - Distribution data
   */
  distributeSamples(tenantId, distributionData) {
    const db = this.getDb();
    const {
      allocation_id,
      agent_id,
      customer_id,
      quantity,
      recipient_name,
      recipient_phone,
      recipient_age_group,
      recipient_gender,
      feedback,
      photo_url,
      gps_lat,
      gps_lng,
      visit_id,
      activation_id
    } = distributionData;
    
    try {
      db.prepare('BEGIN TRANSACTION').run();

      const allocation = db.prepare(`
        SELECT 
          allocated_quantity,
          distributed_quantity,
          returned_quantity
        FROM sample_allocations
        WHERE id = ? AND tenant_id = ?
      `).get(allocation_id, tenantId);

      if (!allocation) {
        throw new Error('Sample allocation not found');
      }

      const available = allocation.allocated_quantity - allocation.distributed_quantity - allocation.returned_quantity;
      if (available < quantity) {
        throw new Error(`Insufficient samples. Available: ${available}, Requested: ${quantity}`);
      }

      const distributionId = `sdist-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const distributionDate = new Date().toISOString();

      db.prepare(`
        INSERT INTO sample_distributions (
          id, tenant_id, allocation_id, agent_id, customer_id,
          distribution_date, quantity, recipient_name, recipient_phone,
          recipient_age_group, recipient_gender, feedback, photo_url,
          gps_lat, gps_lng, visit_id, activation_id, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).run(
        distributionId,
        tenantId,
        allocation_id,
        agent_id,
        customer_id,
        distributionDate,
        quantity,
        recipient_name,
        recipient_phone,
        recipient_age_group,
        recipient_gender,
        feedback,
        photo_url,
        gps_lat,
        gps_lng,
        visit_id,
        activation_id
      );

      db.prepare(`
        UPDATE sample_allocations
        SET distributed_quantity = distributed_quantity + ?
        WHERE id = ? AND tenant_id = ?
      `).run(quantity, allocation_id, tenantId);

      if (visit_id) {
        db.prepare(`
          UPDATE visits
          SET samples_distributed = samples_distributed + ?
          WHERE id = ? AND tenant_id = ?
        `).run(quantity, visit_id, tenantId);
      }

      if (activation_id) {
        db.prepare(`
          UPDATE customer_activations
          SET samples_distributed = samples_distributed + ?
          WHERE id = ? AND tenant_id = ?
        `).run(quantity, activation_id, tenantId);
      }

      db.prepare('COMMIT').run();

      return { success: true, distribution_id: distributionId };
    } catch (error) {
      db.prepare('ROLLBACK').run();
      console.error('Error distributing samples:', error);
      throw error;
    }
  }

  /**
   * Return unused samples
   * @param {string} tenantId - Tenant ID
   * @param {string} allocationId - Allocation ID
   * @param {number} quantity - Quantity to return
   */
  returnSamples(tenantId, allocationId, quantity) {
    const db = this.getDb();
    
    try {
      db.prepare('BEGIN TRANSACTION').run();

      const allocation = db.prepare(`
        SELECT 
          allocated_quantity,
          distributed_quantity,
          returned_quantity
        FROM sample_allocations
        WHERE id = ? AND tenant_id = ?
      `).get(allocationId, tenantId);

      if (!allocation) {
        throw new Error('Sample allocation not found');
      }

      const remaining = allocation.allocated_quantity - allocation.distributed_quantity - allocation.returned_quantity;
      if (remaining < quantity) {
        throw new Error(`Cannot return more than remaining samples. Remaining: ${remaining}, Requested: ${quantity}`);
      }

      db.prepare(`
        UPDATE sample_allocations
        SET returned_quantity = returned_quantity + ?
        WHERE id = ? AND tenant_id = ?
      `).run(quantity, allocationId, tenantId);

      const updated = db.prepare(`
        SELECT 
          allocated_quantity,
          distributed_quantity,
          returned_quantity
        FROM sample_allocations
        WHERE id = ? AND tenant_id = ?
      `).get(allocationId, tenantId);

      if (updated.distributed_quantity + updated.returned_quantity >= updated.allocated_quantity) {
        db.prepare(`
          UPDATE sample_allocations
          SET status = 'completed'
          WHERE id = ? AND tenant_id = ?
        `).run(allocationId, tenantId);
      }

      db.prepare('COMMIT').run();

      return { success: true };
    } catch (error) {
      db.prepare('ROLLBACK').run();
      console.error('Error returning samples:', error);
      throw error;
    }
  }

  /**
   * Get agent's sample allocations
   * @param {string} tenantId - Tenant ID
   * @param {string} agentId - Agent ID
   */
  getAgentAllocations(tenantId, agentId) {
    const db = this.getDb();
    
    const allocations = db.prepare(`
      SELECT 
        sa.*,
        sp.sample_type,
        p.name as product_name,
        p.code as product_code,
        b.name as brand_name,
        pc.name as campaign_name,
        (sa.allocated_quantity - sa.distributed_quantity - sa.returned_quantity) as remaining_quantity
      FROM sample_allocations sa
      JOIN sample_products sp ON sa.sample_product_id = sp.id
      JOIN products p ON sp.product_id = p.id
      LEFT JOIN brands b ON sp.brand_id = b.id
      LEFT JOIN promotional_campaigns pc ON sa.campaign_id = pc.id
      WHERE sa.tenant_id = ? AND sa.agent_id = ? AND sa.status = 'active'
      ORDER BY sa.allocation_date DESC
    `).all(tenantId, agentId);

    return allocations;
  }

  /**
   * Get sample distribution history
   * @param {string} tenantId - Tenant ID
   * @param {Object} filters - Filter options
   */
  getDistributionHistory(tenantId, filters = {}) {
    const db = this.getDb();
    const { agent_id, customer_id, start_date, end_date, campaign_id } = filters;

    let whereClause = 'WHERE sd.tenant_id = ?';
    const params = [tenantId];

    if (agent_id) {
      whereClause += ' AND sd.agent_id = ?';
      params.push(agent_id);
    }

    if (customer_id) {
      whereClause += ' AND sd.customer_id = ?';
      params.push(customer_id);
    }

    if (start_date && end_date) {
      whereClause += ' AND DATE(sd.distribution_date) BETWEEN ? AND ?';
      params.push(start_date, end_date);
    }

    if (campaign_id) {
      whereClause += ' AND sa.campaign_id = ?';
      params.push(campaign_id);
    }

    const distributions = db.prepare(`
      SELECT 
        sd.*,
        p.name as product_name,
        b.name as brand_name,
        c.name as customer_name,
        u.first_name || ' ' || u.last_name as agent_name
      FROM sample_distributions sd
      JOIN sample_allocations sa ON sd.allocation_id = sa.id
      JOIN sample_products sp ON sa.sample_product_id = sp.id
      JOIN products p ON sp.product_id = p.id
      LEFT JOIN brands b ON sp.brand_id = b.id
      LEFT JOIN customers c ON sd.customer_id = c.id
      JOIN agents a ON sd.agent_id = a.id
      JOIN users u ON a.user_id = u.id
      ${whereClause}
      ORDER BY sd.distribution_date DESC
    `).all(...params);

    return distributions;
  }

  /**
   * Get sample analytics
   * @param {string} tenantId - Tenant ID
   * @param {Object} filters - Filter options
   */
  getSampleAnalytics(tenantId, filters = {}) {
    const db = this.getDb();
    const { start_date, end_date, brand_id, campaign_id } = filters;

    let whereClause = 'WHERE sa.tenant_id = ?';
    const params = [tenantId];

    if (start_date && end_date) {
      whereClause += ' AND sa.allocation_date BETWEEN ? AND ?';
      params.push(start_date, end_date);
    }

    if (brand_id) {
      whereClause += ' AND sp.brand_id = ?';
      params.push(brand_id);
    }

    if (campaign_id) {
      whereClause += ' AND sa.campaign_id = ?';
      params.push(campaign_id);
    }

    const analytics = db.prepare(`
      SELECT 
        COUNT(DISTINCT sa.id) as total_allocations,
        SUM(sa.allocated_quantity) as total_allocated,
        SUM(sa.distributed_quantity) as total_distributed,
        SUM(sa.returned_quantity) as total_returned,
        SUM(sa.allocated_quantity - sa.distributed_quantity - sa.returned_quantity) as total_remaining,
        COUNT(DISTINCT sd.id) as total_distributions,
        COUNT(DISTINCT sd.customer_id) as unique_customers_reached,
        COUNT(DISTINCT sd.agent_id) as active_agents,
        ROUND(AVG(sa.distributed_quantity * 1.0 / sa.allocated_quantity * 100), 2) as avg_distribution_rate
      FROM sample_allocations sa
      JOIN sample_products sp ON sa.sample_product_id = sp.id
      LEFT JOIN sample_distributions sd ON sa.id = sd.allocation_id
      ${whereClause}
    `).get(...params);

    const byAgeGroup = db.prepare(`
      SELECT 
        sd.recipient_age_group,
        COUNT(*) as count,
        SUM(sd.quantity) as total_quantity
      FROM sample_distributions sd
      JOIN sample_allocations sa ON sd.allocation_id = sa.id
      WHERE sa.tenant_id = ? ${start_date && end_date ? 'AND DATE(sd.distribution_date) BETWEEN ? AND ?' : ''}
      GROUP BY sd.recipient_age_group
      ORDER BY count DESC
    `).all(tenantId, ...(start_date && end_date ? [start_date, end_date] : []));

    const byGender = db.prepare(`
      SELECT 
        sd.recipient_gender,
        COUNT(*) as count,
        SUM(sd.quantity) as total_quantity
      FROM sample_distributions sd
      JOIN sample_allocations sa ON sd.allocation_id = sa.id
      WHERE sa.tenant_id = ? ${start_date && end_date ? 'AND DATE(sd.distribution_date) BETWEEN ? AND ?' : ''}
      GROUP BY sd.recipient_gender
      ORDER BY count DESC
    `).all(tenantId, ...(start_date && end_date ? [start_date, end_date] : []));

    return {
      ...analytics,
      by_age_group: byAgeGroup,
      by_gender: byGender
    };
  }

  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

module.exports = new SamplesService();
