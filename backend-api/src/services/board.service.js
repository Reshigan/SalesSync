/**
 * Board Service
 * Service for managing board placements and coverage calculations
 */

const { getDatabase } = require('../database/init');
const { v4: uuidv4 } = require('uuid');

class BoardService {
  /**
   * Calculate coverage percentage from polygons using Shoelace formula
   * @param {array} storefrontPolygon - Array of {x, y} points
   * @param {array} boardPolygon - Array of {x, y} points
   * @returns {number} Coverage percentage
   */
  calculateCoverage(storefrontPolygon, boardPolygon) {
    if (!storefrontPolygon || !boardPolygon) return 0;
    if (storefrontPolygon.length < 3 || boardPolygon.length < 3) return 0;

    const storefrontArea = this._calculatePolygonArea(storefrontPolygon);
    const boardArea = this._calculatePolygonArea(boardPolygon);

    if (storefrontArea === 0) return 0;

    const coverage = (boardArea / storefrontArea) * 100;
    return Math.round(coverage * 10) / 10; // Round to 1 decimal place
  }

  /**
   * Calculate polygon area using Shoelace formula
   * @private
   * @param {array} points - Array of {x, y} points
   * @returns {number} Area
   */
  _calculatePolygonArea(points) {
    let area = 0;
    const n = points.length;

    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      area += points[i].x * points[j].y;
      area -= points[j].x * points[i].y;
    }

    return Math.abs(area / 2);
  }

  /**
   * Create board placement
   * @param {object} data - Placement data
   * @returns {Promise<object>} Created board placement
   */
  async createPlacement(data) {
    const {
      tenantId,
      visitId,
      agentId,
      customerId,
      brandId,
      boardId,
      photoUrl,
      gpsLat,
      gpsLng,
      gpsAccuracy,
      storefrontPolygon,
      boardPolygon
    } = data;

    const db = getDatabase();
    const id = uuidv4();

    const coveragePercentage = this.calculateCoverage(storefrontPolygon, boardPolygon);

    // Get board details for commission
    const board = await this._getBoard(boardId, tenantId);
    const commissionAmount = board?.commission_rate || 0;

    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO board_installations (
          id, tenant_id, agent_id, customer_id, brand_id, board_id, visit_id,
          installation_date, latitude, longitude, gps_accuracy,
          after_photo_url, storefront_polygon, board_polygon,
          coverage_percentage, commission_amount, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
        [
          id, tenantId, agentId, customerId, brandId, boardId, visitId,
          gpsLat, gpsLng, gpsAccuracy, photoUrl,
          JSON.stringify(storefrontPolygon),
          JSON.stringify(boardPolygon),
          coveragePercentage, commissionAmount, 'pending'
        ],
        function(err) {
          if (err) {
            console.error('Error creating board placement:', err);
            return reject(err);
          }

          db.get(
            'SELECT * FROM board_installations WHERE id = ?',
            [id],
            (err, placement) => {
              if (err) return reject(err);
              resolve(placement);
            }
          );
        }
      );
    });
  }

  /**
   * Get board details
   * @private
   */
  _getBoard(boardId, tenantId) {
    const db = getDatabase();

    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM boards WHERE id = ? AND tenant_id = ?',
        [boardId, tenantId],
        (err, board) => {
          if (err) return reject(err);
          resolve(board);
        }
      );
    });
  }

  /**
   * Update placement status (approve/reject)
   * @param {string} placementId - Placement ID
   * @param {string} tenantId - Tenant ID
   * @param {string} status - 'approved' or 'rejected'
   * @param {string} reason - Rejection reason (optional)
   * @returns {Promise<object>} Updated placement
   */
  async updateStatus(placementId, tenantId, status, reason = null) {
    const db = getDatabase();

    return new Promise((resolve, reject) => {
      let sql = `UPDATE board_installations SET status = ?`;
      const params = [status];

      if (status === 'rejected' && reason) {
        sql += ', rejection_reason = ?';
        params.push(reason);
      }

      sql += ' WHERE id = ? AND tenant_id = ?';
      params.push(placementId, tenantId);

      db.run(sql, params, function(err) {
        if (err) return reject(err);

        if (this.changes === 0) {
          return reject(new Error('Board placement not found'));
        }

        db.get(
          'SELECT * FROM board_installations WHERE id = ?',
          [placementId],
          (err, placement) => {
            if (err) return reject(err);
            resolve(placement);
          }
        );
      });
    });
  }

  /**
   * Get board placement analytics
   * @param {string} tenantId - Tenant ID
   * @param {object} filters - Optional filters
   * @returns {Promise<object>} Analytics data
   */
  async getAnalytics(tenantId, filters = {}) {
    const db = getDatabase();

    let sql = `
      SELECT 
        COUNT(*) as total_placements,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_count,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_count,
        AVG(coverage_percentage) as avg_coverage,
        SUM(commission_amount) as total_commission
      FROM board_installations
      WHERE tenant_id = ?
    `;
    const params = [tenantId];

    if (filters.from_date) {
      sql += ' AND date(installation_date) >= date(?)';
      params.push(filters.from_date);
    }

    if (filters.to_date) {
      sql += ' AND date(installation_date) <= date(?)';
      params.push(filters.to_date);
    }

    if (filters.brand_id) {
      sql += ' AND brand_id = ?';
      params.push(filters.brand_id);
    }

    if (filters.agent_id) {
      sql += ' AND agent_id = ?';
      params.push(filters.agent_id);
    }

    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, analytics) => {
        if (err) return reject(err);

        resolve({
          total_placements: analytics?.total_placements || 0,
          pending_count: analytics?.pending_count || 0,
          approved_count: analytics?.approved_count || 0,
          rejected_count: analytics?.rejected_count || 0,
          avg_coverage: parseFloat((analytics?.avg_coverage || 0).toFixed(2)),
          total_commission: parseFloat((analytics?.total_commission || 0).toFixed(2))
        });
      });
    });
  }

  /**
   * Get boards for brand
   * @param {string} brandId - Brand ID
   * @param {string} tenantId - Tenant ID
   * @returns {Promise<array>} Boards
   */
  async getBoardsForBrand(brandId, tenantId) {
    const db = getDatabase();

    return new Promise((resolve, reject) => {
      db.all(
        `SELECT * FROM boards 
         WHERE (brand_id = ? OR brand_id IS NULL) 
           AND tenant_id = ? 
           AND status = 'active'
         ORDER BY board_name`,
        [brandId, tenantId],
        (err, boards) => {
          if (err) return reject(err);
          resolve(boards || []);
        }
      );
    });
  }
}

module.exports = new BoardService();
