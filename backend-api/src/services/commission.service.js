/**
 * Commission Service
 * Unified service for calculating, creating, and managing commissions
 * across all event types (boards, distributions, orders, surveys)
 */

const { getDatabase } = require('../database/init');
const { v4: uuidv4 } = require('uuid');

class CommissionService {
  /**
   * Calculate commission based on event type and rules
   * @param {string} eventType - 'board_placement', 'product_distribution', 'order', 'survey'
   * @param {object} eventData - Data about the event
   * @param {object} rules - Commission rules
   * @returns {number} Commission amount
   */
  calculateCommission(eventType, eventData, rules) {
    if (!rules) return 0;

    switch (rules.type) {
      case 'flat':
        return parseFloat(rules.amount || 0);

      case 'per_unit':
        const quantity = eventData.quantity || 1;
        return parseFloat(rules.amount || 0) * quantity;

      case 'percentage':
        const baseAmount = eventData.total_amount || eventData.sale_amount || 0;
        const percentage = parseFloat(rules.percentage || 0);
        return (baseAmount * percentage) / 100;

      case 'tiered':
        return this._calculateTieredCommission(eventData, rules.tiers);

      default:
        return 0;
    }
  }

  /**
   * Calculate tiered commission
   * @private
   */
  _calculateTieredCommission(eventData, tiers) {
    if (!tiers || !Array.isArray(tiers)) return 0;

    const quantity = eventData.quantity || 0;
    const amount = eventData.total_amount || 0;

    const sortedTiers = tiers.sort((a, b) => a.threshold - b.threshold);

    for (let i = sortedTiers.length - 1; i >= 0; i--) {
      const tier = sortedTiers[i];
      if (quantity >= tier.threshold || amount >= tier.threshold) {
        if (tier.type === 'flat') {
          return parseFloat(tier.amount || 0);
        } else if (tier.type === 'percentage') {
          return (amount * parseFloat(tier.percentage || 0)) / 100;
        }
      }
    }

    return 0;
  }

  /**
   * Create commission event
   * @param {string} tenantId - Tenant ID
   * @param {string} agentId - Agent ID
   * @param {string} visitId - Visit ID (optional)
   * @param {string} eventType - Event type
   * @param {string} eventRefId - Reference to the event (board_id, distribution_id, etc.)
   * @param {number} amount - Commission amount
   * @param {string} currency - Currency code (default: ZAR)
   * @returns {Promise<object>} Created commission event
   */
  async createEvent(tenantId, agentId, visitId, eventType, eventRefId, amount, currency = 'ZAR', idempotencyKey = null) {
    const db = getDatabase();
    
    if (idempotencyKey) {
      const existing = await new Promise((resolve, reject) => {
        db.get(
          'SELECT * FROM commission_events WHERE tenant_id = ? AND idempotency_key = ?',
          [tenantId, idempotencyKey],
          (err, row) => {
            if (err) return reject(err);
            resolve(row);
          }
        );
      });
      
      if (existing) {
        return existing;
      }
    }
    
    const id = uuidv4();

    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO commission_events (
          id, tenant_id, agent_id, visit_id, event_type, event_ref_id,
          amount, currency, status, idempotency_key, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
        [id, tenantId, agentId, visitId, eventType, eventRefId, amount, currency, 'pending', idempotencyKey],
        function(err) {
          if (err) {
            console.error('Error creating commission event:', err);
            return reject(err);
          }

          db.get(
            'SELECT * FROM commission_events WHERE id = ?',
            [id],
            (err, event) => {
              if (err) return reject(err);
              resolve(event);
            }
          );
        }
      );
    });
  }

  /**
   * Approve commission event
   * @param {string} eventId - Commission event ID
   * @param {string} approverId - User ID of approver
   * @param {string} tenantId - Tenant ID
   * @returns {Promise<object>} Updated commission event
   */
  async approveEvent(eventId, approverId, tenantId) {
    const db = getDatabase();

    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM commission_events WHERE id = ? AND tenant_id = ?',
        [eventId, tenantId],
        (err, event) => {
          if (err) return reject(err);
          if (!event) return reject(new Error('Commission event not found'));
          if (event.status !== 'pending') {
            return reject(new Error('Commission event is not in pending status'));
          }

          db.run(
            `UPDATE commission_events 
             SET status = 'approved', approved_by = ?, approved_at = datetime('now')
             WHERE id = ? AND tenant_id = ?`,
            [approverId, eventId, tenantId],
            function(err) {
              if (err) return reject(err);

              db.run(
                `UPDATE agents 
                 SET total_commission_earned = total_commission_earned + ?,
                     commission_balance = commission_balance + ?
                 WHERE id = ? AND tenant_id = ?`,
                [event.amount, event.amount, event.agent_id, tenantId],
                (err) => {
                  if (err) console.error('Error updating agent balance:', err);
                }
              );

              db.get(
                'SELECT * FROM commission_events WHERE id = ?',
                [eventId],
                (err, updatedEvent) => {
                  if (err) return reject(err);
                  resolve(updatedEvent);
                }
              );
            }
          );
        }
      );
    });
  }

  /**
   * Pay commission event
   * @param {string} eventId - Commission event ID
   * @param {string} tenantId - Tenant ID
   * @param {object} paymentDetails - Payment details
   * @returns {Promise<object>} Updated commission event
   */
  async payEvent(eventId, tenantId, paymentDetails = {}) {
    const db = getDatabase();

    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM commission_events WHERE id = ? AND tenant_id = ?',
        [eventId, tenantId],
        (err, event) => {
          if (err) return reject(err);
          if (!event) return reject(new Error('Commission event not found'));
          if (event.status !== 'approved') {
            return reject(new Error('Commission event must be approved before payment'));
          }

          db.run(
            `UPDATE commission_events 
             SET status = 'paid', paid_at = datetime('now')
             WHERE id = ? AND tenant_id = ?`,
            [eventId, tenantId],
            function(err) {
              if (err) return reject(err);

              db.run(
                `UPDATE agents 
                 SET total_commission_paid = total_commission_paid + ?,
                     commission_balance = commission_balance - ?
                 WHERE id = ? AND tenant_id = ?`,
                [event.amount, event.amount, event.agent_id, tenantId],
                (err) => {
                  if (err) console.error('Error updating agent balance:', err);
                }
              );

              db.get(
                'SELECT * FROM commission_events WHERE id = ?',
                [eventId],
                (err, updatedEvent) => {
                  if (err) return reject(err);
                  resolve(updatedEvent);
                }
              );
            }
          );
        }
      );
    });
  }

  /**
   * Get agent commissions
   * @param {string} agentId - Agent ID
   * @param {string} tenantId - Tenant ID
   * @param {object} filters - Optional filters (status, from_date, to_date, event_type)
   * @returns {Promise<object>} Commissions and summary
   */
  async getAgentCommissions(agentId, tenantId, filters = {}) {
    const db = getDatabase();

    let sql = `
      SELECT ce.*, v.visit_date, c.name as customer_name
      FROM commission_events ce
      LEFT JOIN visits v ON ce.visit_id = v.id
      LEFT JOIN customers c ON v.customer_id = c.id
      WHERE ce.agent_id = ? AND ce.tenant_id = ?
    `;
    const params = [agentId, tenantId];

    if (filters.status) {
      sql += ' AND ce.status = ?';
      params.push(filters.status);
    }

    if (filters.event_type) {
      sql += ' AND ce.event_type = ?';
      params.push(filters.event_type);
    }

    if (filters.from_date) {
      sql += ' AND date(ce.created_at) >= date(?)';
      params.push(filters.from_date);
    }

    if (filters.to_date) {
      sql += ' AND date(ce.created_at) <= date(?)';
      params.push(filters.to_date);
    }

    sql += ' ORDER BY ce.created_at DESC LIMIT 100';

    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, commissions) => {
        if (err) return reject(err);

        db.get(
          `SELECT 
            SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending,
            SUM(CASE WHEN status = 'approved' THEN amount ELSE 0 END) as approved,
            SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as paid,
            COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
            COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_count,
            COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_count
           FROM commission_events
           WHERE agent_id = ? AND tenant_id = ?`,
          [agentId, tenantId],
          (err, summary) => {
            if (err) return reject(err);

            resolve({
              commissions: commissions || [],
              summary: {
                pending: parseFloat(summary?.pending || 0),
                approved: parseFloat(summary?.approved || 0),
                paid: parseFloat(summary?.paid || 0),
                pending_count: summary?.pending_count || 0,
                approved_count: summary?.approved_count || 0,
                paid_count: summary?.paid_count || 0
              }
            });
          }
        );
      });
    });
  }

  /**
   * Get commission rules for event type
   * @param {string} tenantId - Tenant ID
   * @param {string} eventType - Event type
   * @param {string} refId - Reference ID (board_id, product_id, etc.)
   * @returns {Promise<object>} Commission rules
   */
  async getCommissionRules(tenantId, eventType, refId) {
    const db = getDatabase();

    return new Promise((resolve, reject) => {
      switch (eventType) {
        case 'board_placement':
          db.get(
            'SELECT commission_rate FROM boards WHERE id = ? AND tenant_id = ?',
            [refId, tenantId],
            (err, board) => {
              if (err) return reject(err);
              resolve({
                type: 'flat',
                amount: board?.commission_rate || 0
              });
            }
          );
          break;

        case 'product_distribution':
          resolve({ type: 'flat', amount: 0 });
          break;

        case 'order':
          resolve({ type: 'percentage', percentage: 5 });
          break;

        default:
          resolve({ type: 'flat', amount: 0 });
      }
    });
  }
}

module.exports = new CommissionService();
