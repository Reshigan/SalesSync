/**
 * Cash Reconciliation Service
 * Handles cash collection tracking, reconciliation, and variance management
 */

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../../database/salessync.db');

class CashReconciliationService {
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
   * Start a new cash collection for an agent
   * @param {string} tenantId - Tenant ID
   * @param {string} agentId - Agent ID
   * @param {number} openingFloat - Opening cash float
   * @returns {Object} Cash collection record
   */
  startCashCollection(tenantId, agentId, openingFloat) {
    const db = this.getDb();
    
    try {
      db.prepare('BEGIN TRANSACTION').run();

      const collectionId = `cc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const collectionDate = new Date().toISOString().split('T')[0];

      db.prepare(`
        INSERT INTO cash_collections (
          id, tenant_id, agent_id, collection_date, opening_float,
          expected_cash, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, 'pending', CURRENT_TIMESTAMP)
      `).run(collectionId, tenantId, agentId, collectionDate, openingFloat, openingFloat);

      db.prepare('COMMIT').run();

      return {
        success: true,
        collection_id: collectionId,
        opening_float: openingFloat
      };
    } catch (error) {
      db.prepare('ROLLBACK').run();
      console.error('Error starting cash collection:', error);
      throw error;
    }
  }

  /**
   * Record a cash sale and link to collection
   * @param {string} tenantId - Tenant ID
   * @param {string} orderId - Order ID
   * @param {string} collectionId - Cash collection ID
   * @param {number} cashReceived - Cash received from customer
   * @param {number} changeGiven - Change given to customer
   */
  recordCashSale(tenantId, orderId, collectionId, cashReceived, changeGiven) {
    const db = this.getDb();
    
    try {
      db.prepare('BEGIN TRANSACTION').run();

      db.prepare(`
        UPDATE orders
        SET cash_collection_id = ?, payment_received = ?, change_given = ?
        WHERE id = ? AND tenant_id = ?
      `).run(collectionId, cashReceived, changeGiven, orderId, tenantId);

      const netCash = cashReceived - changeGiven;
      db.prepare(`
        UPDATE cash_collections
        SET 
          cash_sales = cash_sales + ?,
          cash_collected = cash_collected + ?,
          expected_cash = opening_float + cash_collected
        WHERE id = ? AND tenant_id = ?
      `).run(netCash, netCash, collectionId, tenantId);

      db.prepare('COMMIT').run();

      return { success: true };
    } catch (error) {
      db.prepare('ROLLBACK').run();
      console.error('Error recording cash sale:', error);
      throw error;
    }
  }

  /**
   * Record an expense during collection
   * @param {string} tenantId - Tenant ID
   * @param {string} collectionId - Cash collection ID
   * @param {Object} expense - Expense details
   */
  recordExpense(tenantId, collectionId, expense) {
    const db = this.getDb();
    const { expense_type, amount, description, receipt_photo } = expense;
    
    try {
      db.prepare('BEGIN TRANSACTION').run();

      const expenseId = `exp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      db.prepare(`
        INSERT INTO cash_collection_expenses (
          id, collection_id, expense_type, amount, description, receipt_photo, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).run(expenseId, collectionId, expense_type, amount, description, receipt_photo);

      db.prepare(`
        UPDATE cash_collections
        SET 
          expenses = expenses + ?,
          expected_cash = opening_float + cash_collected - expenses
        WHERE id = ? AND tenant_id = ?
      `).run(amount, collectionId, tenantId);

      db.prepare('COMMIT').run();

      return { success: true, expense_id: expenseId };
    } catch (error) {
      db.prepare('ROLLBACK').run();
      console.error('Error recording expense:', error);
      throw error;
    }
  }

  /**
   * Submit cash collection with denomination breakdown
   * @param {string} tenantId - Tenant ID
   * @param {string} collectionId - Cash collection ID
   * @param {Array} denominations - Array of {denomination, quantity, total}
   * @param {string} notes - Optional notes
   */
  submitCashCollection(tenantId, collectionId, denominations, notes = '') {
    const db = this.getDb();
    
    try {
      db.prepare('BEGIN TRANSACTION').run();

      const closingCash = denominations.reduce((sum, d) => sum + d.total, 0);

      const collection = db.prepare(`
        SELECT expected_cash FROM cash_collections WHERE id = ? AND tenant_id = ?
      `).get(collectionId, tenantId);

      if (!collection) {
        throw new Error('Cash collection not found');
      }

      const variance = closingCash - collection.expected_cash;

      db.prepare(`
        UPDATE cash_collections
        SET 
          closing_cash = ?,
          variance = ?,
          status = 'submitted',
          notes = ?,
          submitted_at = CURRENT_TIMESTAMP
        WHERE id = ? AND tenant_id = ?
      `).run(closingCash, variance, notes, collectionId, tenantId);

      for (const denom of denominations) {
        const denomId = `denom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        db.prepare(`
          INSERT INTO cash_collection_denominations (
            id, collection_id, denomination, quantity, total, created_at
          ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `).run(denomId, collectionId, denom.denomination, denom.quantity, denom.total);
      }

      db.prepare('COMMIT').run();

      return {
        success: true,
        closing_cash: closingCash,
        expected_cash: collection.expected_cash,
        variance: variance,
        variance_percentage: (variance / collection.expected_cash * 100).toFixed(2)
      };
    } catch (error) {
      db.prepare('ROLLBACK').run();
      console.error('Error submitting cash collection:', error);
      throw error;
    }
  }

  /**
   * Approve cash collection (manager action)
   * @param {string} tenantId - Tenant ID
   * @param {string} collectionId - Cash collection ID
   * @param {string} approverId - Manager user ID
   */
  approveCashCollection(tenantId, collectionId, approverId) {
    const db = this.getDb();
    
    try {
      db.prepare(`
        UPDATE cash_collections
        SET 
          status = 'approved',
          approved_by = ?,
          approved_at = CURRENT_TIMESTAMP
        WHERE id = ? AND tenant_id = ? AND status = 'submitted'
      `).run(approverId, collectionId, tenantId);

      return { success: true };
    } catch (error) {
      console.error('Error approving cash collection:', error);
      throw error;
    }
  }

  /**
   * Get cash collection details
   * @param {string} tenantId - Tenant ID
   * @param {string} collectionId - Cash collection ID
   */
  getCashCollection(tenantId, collectionId) {
    const db = this.getDb();
    
    const collection = db.prepare(`
      SELECT 
        cc.*,
        u.first_name || ' ' || u.last_name as agent_name,
        approver.first_name || ' ' || approver.last_name as approver_name
      FROM cash_collections cc
      JOIN agents a ON cc.agent_id = a.id
      JOIN users u ON a.user_id = u.id
      LEFT JOIN users approver ON cc.approved_by = approver.id
      WHERE cc.id = ? AND cc.tenant_id = ?
    `).get(collectionId, tenantId);

    if (!collection) {
      return null;
    }

    const denominations = db.prepare(`
      SELECT * FROM cash_collection_denominations
      WHERE collection_id = ?
      ORDER BY denomination DESC
    `).all(collectionId);

    const expenses = db.prepare(`
      SELECT * FROM cash_collection_expenses
      WHERE collection_id = ?
      ORDER BY created_at
    `).all(collectionId);

    const orders = db.prepare(`
      SELECT 
        o.id,
        o.order_number,
        o.total_amount,
        o.payment_received,
        o.change_given,
        c.name as customer_name
      FROM orders o
      JOIN customers c ON o.customer_id = c.id
      WHERE o.cash_collection_id = ? AND o.tenant_id = ?
      ORDER BY o.created_at
    `).all(collectionId, tenantId);

    return {
      ...collection,
      denominations,
      expenses,
      orders
    };
  }

  /**
   * Get agent's cash collections for a date range
   * @param {string} tenantId - Tenant ID
   * @param {string} agentId - Agent ID
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} endDate - End date (YYYY-MM-DD)
   */
  getAgentCashCollections(tenantId, agentId, startDate, endDate) {
    const db = this.getDb();
    
    const collections = db.prepare(`
      SELECT 
        cc.*,
        COUNT(DISTINCT o.id) as order_count
      FROM cash_collections cc
      LEFT JOIN orders o ON cc.id = o.cash_collection_id
      WHERE cc.tenant_id = ? AND cc.agent_id = ?
        AND cc.collection_date BETWEEN ? AND ?
      GROUP BY cc.id
      ORDER BY cc.collection_date DESC
    `).all(tenantId, agentId, startDate, endDate);

    return collections;
  }

  /**
   * Get reconciliation summary for a date range
   * @param {string} tenantId - Tenant ID
   * @param {Object} filters - Filter options
   */
  getReconciliationSummary(tenantId, filters = {}) {
    const db = this.getDb();
    const { startDate, endDate, agentId, status } = filters;

    let whereClause = 'WHERE cc.tenant_id = ?';
    const params = [tenantId];

    if (startDate && endDate) {
      whereClause += ' AND cc.collection_date BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }

    if (agentId) {
      whereClause += ' AND cc.agent_id = ?';
      params.push(agentId);
    }

    if (status) {
      whereClause += ' AND cc.status = ?';
      params.push(status);
    }

    const summary = db.prepare(`
      SELECT 
        COUNT(DISTINCT cc.id) as total_collections,
        SUM(cc.opening_float) as total_opening_float,
        SUM(cc.cash_sales) as total_cash_sales,
        SUM(cc.cash_collected) as total_cash_collected,
        SUM(cc.expenses) as total_expenses,
        SUM(cc.closing_cash) as total_closing_cash,
        SUM(cc.expected_cash) as total_expected_cash,
        SUM(cc.variance) as total_variance,
        SUM(CASE WHEN cc.variance > 0 THEN cc.variance ELSE 0 END) as total_overages,
        SUM(CASE WHEN cc.variance < 0 THEN ABS(cc.variance) ELSE 0 END) as total_shortages,
        COUNT(DISTINCT CASE WHEN cc.status = 'pending' THEN cc.id END) as pending_count,
        COUNT(DISTINCT CASE WHEN cc.status = 'submitted' THEN cc.id END) as submitted_count,
        COUNT(DISTINCT CASE WHEN cc.status = 'approved' THEN cc.id END) as approved_count
      FROM cash_collections cc
      ${whereClause}
    `).get(...params);

    return summary;
  }

  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

module.exports = new CashReconciliationService();
