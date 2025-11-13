const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { v4: uuidv4 } = require('uuid');
const { getQuery, getOneQuery, runQuery } = require('../utils/database');

// Calculate storefront coverage (simplified - real implementation would use image recognition)
function calculateCoverage(storefrontArea, boardWidth, boardHeight) {
  const boardArea = (boardWidth / 100) * (boardHeight / 100); // Convert cm to meters
  const coverage = (boardArea / storefrontArea) * 100;
  return Math.min(coverage, 100); // Cap at 100%
}

// Calculate visibility score (simplified - real implementation would use AI)
function calculateVisibilityScore(optimalPosition, coverage) {
  let score = 5.0; // Base score
  if (optimalPosition) score += 2.0;
  if (coverage >= 20) score += 1.5;
  if (coverage >= 30) score += 1.5;
  return Math.min(score, 10.0);
}

// Calculate quality score
function calculateQualityScore(coverage, visibilityScore, standardCoverage) {
  const coverageScore = standardCoverage ? (coverage / standardCoverage) * 50 : 50;
  const visibilityWeight = (visibilityScore / 10) * 50;
  return Math.min(coverageScore + visibilityWeight, 100);
}

// Calculate commission
function calculateCommission(baseRate, qualityScore, visibilityScore, optimalPosition) {
  const qualityMultiplier = qualityScore / 100;
  const visibilityBonus = visibilityScore / 10;
  const positionBonus = optimalPosition ? 1.2 : 1.0;
  
  return baseRate * qualityMultiplier * visibilityBonus * positionBonus;
}

// Record board installation
router.post('/', authMiddleware, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const agentId = req.user.userId;
    
    const {
      customer_id,
      board_id,
      brand_id,
      visit_id,
      latitude,
      longitude,
      gps_accuracy,
      before_photo_url,
      after_photo_url,
      storefront_area_sqm,
      optimal_position,
      notes
    } = req.body;

    // Validation
    if (!customer_id || !board_id || !brand_id) {
      return res.status(400).json({ 
        error: 'Customer ID, Board ID, and Brand ID are required' 
      });
    }

    // Get board details and commission rate
    db.get(
      `SELECT b.*, bb.coverage_standard, bb.visibility_standard
       FROM boards b
       LEFT JOIN brand_boards bb ON b.id = bb.board_id AND bb.brand_id = ?
       WHERE b.id = ? AND b.tenant_id = ?`,
      [brand_id, board_id, tenantId],
      async (err, board) => {
        if (err) {
          console.error('Error fetching board:', err);
          return res.status(500).json({ error: 'Failed to fetch board details' });
        }
        if (!board) {
          return res.status(404).json({ error: 'Board not found' });
        }

        // Calculate analytics
        const boardArea = (board.width_cm / 100) * (board.height_cm / 100);
        const coveragePercentage = storefront_area_sqm 
          ? calculateCoverage(storefront_area_sqm, board.width_cm, board.height_cm)
          : null;
        
        const visibilityScore = calculateVisibilityScore(optimal_position, coveragePercentage);
        const qualityScore = calculateQualityScore(
          coveragePercentage,
          visibilityScore,
          board.coverage_standard
        );
        
        const commissionAmount = board.commission_rate
          ? calculateCommission(board.commission_rate, qualityScore, visibilityScore, optimal_position)
          : 0;

        const installationId = uuidv4();

        // Insert installation
        db.run(
          `INSERT INTO board_installations (
            id, tenant_id, agent_id, customer_id, board_id, brand_id, visit_id,
            installation_date, latitude, longitude, gps_accuracy,
            before_photo_url, after_photo_url, storefront_area_sqm, board_area_sqm,
            coverage_percentage, visibility_score, optimal_position, quality_score,
            commission_amount, status, notes, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          [
            installationId, tenantId, agentId, customer_id, board_id, brand_id, visit_id,
            latitude, longitude, gps_accuracy,
            before_photo_url, after_photo_url, storefront_area_sqm, boardArea,
            coveragePercentage, visibilityScore, optimal_position ? 1 : 0, qualityScore,
            commissionAmount, 'installed', notes
          ],
          function(err) {
            if (err) {
              console.error('Error creating installation:', err);
              return res.status(500).json({ error: 'Failed to record installation' });
            }

            // Create commission transaction if commission amount > 0
            if (commissionAmount > 0) {
              const commissionId = uuidv4();
              const calculationDetails = JSON.stringify({
                board_type: board.board_type,
                base_rate: board.commission_rate,
                quality_score: qualityScore,
                visibility_score: visibilityScore,
                optimal_position: optimal_position,
                coverage_percentage: coveragePercentage
              });

              db.run(
                `INSERT INTO commission_transactions (
                  id, tenant_id, agent_id, transaction_type, reference_type, reference_id,
                  base_amount, total_amount, calculation_details, status, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
                [
                  commissionId, tenantId, agentId, 'board_installation',
                  'board_installation', installationId,
                  board.commission_rate, commissionAmount, calculationDetails, 'pending'
                ],
                (err) => {
                  if (err) {
                    console.error('Error creating commission:', err);
                  }
                }
              );
            }

            // Fetch the created installation
            db.get(
              `SELECT bi.*, b.board_name, b.board_type, c.name as customer_name, br.name as brand_name
               FROM board_installations bi
               LEFT JOIN boards b ON bi.board_id = b.id
               LEFT JOIN customers c ON bi.customer_id = c.id
               LEFT JOIN brands br ON bi.brand_id = br.id
               WHERE bi.id = ?`,
              [installationId],
              (err, installation) => {
                if (err) {
                  console.error('Error fetching installation:', err);
                  return res.status(500).json({ error: 'Installation created but failed to fetch' });
                }
                res.status(201).json(installation);
              }
            );
          }
        );
      }
    );
  } catch (error) {
    console.error('Error in create installation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all installations
router.get('/', authMiddleware, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { agent_id, customer_id, brand_id, status, from_date, to_date } = req.query;

    let query = `
      SELECT bi.*, b.board_name, b.board_type, c.name as customer_name, 
             br.name as brand_name, u.first_name || ' ' || u.last_name as agent_name
      FROM board_installations bi
      LEFT JOIN boards b ON bi.board_id = b.id
      LEFT JOIN customers c ON bi.customer_id = c.id
      LEFT JOIN brands br ON bi.brand_id = br.id
      LEFT JOIN users a ON bi.agent_id = a.id
      LEFT JOIN users u ON a.user_id = u.id
      WHERE bi.tenant_id = ?
    `;
    const params = [tenantId];

    if (agent_id) {
      query += ' AND bi.agent_id = ?';
      params.push(agent_id);
    }
    if (customer_id) {
      query += ' AND bi.customer_id = ?';
      params.push(customer_id);
    }
    if (brand_id) {
      query += ' AND bi.brand_id = ?';
      params.push(brand_id);
    }
    if (status) {
      query += ' AND bi.status = ?';
      params.push(status);
    }
    if (from_date) {
      query += ' AND date(bi.installation_date) >= date(?)';
      params.push(from_date);
    }
    if (to_date) {
      query += ' AND date(bi.installation_date) <= date(?)';
      params.push(to_date);
    }

    query += ' ORDER BY bi.installation_date DESC';
    db.all(query, params, (err, installations) => {
      if (err) {
        console.error('Error fetching installations:', err);
        return res.status(500).json({ error: 'Failed to fetch installations' });
      }
      res.json(installations);
    });
  } catch (error) {
    console.error('Error in get installations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get installation by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;
    db.get(
      `SELECT bi.*, b.board_name, b.board_type, b.width_cm, b.height_cm,
              c.name as customer_name, c.address as customer_address,
              br.name as brand_name,
              u.first_name || ' ' || u.last_name as agent_name
       FROM board_installations bi
       LEFT JOIN boards b ON bi.board_id = b.id
       LEFT JOIN customers c ON bi.customer_id = c.id
       LEFT JOIN brands br ON bi.brand_id = br.id
       LEFT JOIN users a ON bi.agent_id = a.id
       LEFT JOIN users u ON a.user_id = u.id
       WHERE bi.id = ? AND bi.tenant_id = ?`,
      [id, tenantId],
      (err, installation) => {
        if (err) {
          console.error('Error fetching installation:', err);
          return res.status(500).json({ error: 'Failed to fetch installation' });
        }
        if (!installation) {
          return res.status(404).json({ error: 'Installation not found' });
        }
        res.json(installation);
      }
    );
  } catch (error) {
    console.error('Error in get installation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update installation analytics
router.post('/:id/analytics', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;
    const {
      storefront_area_sqm,
      coverage_percentage,
      visibility_score,
      optimal_position,
      quality_score
    } = req.body;
    db.run(
      `UPDATE board_installations SET
        storefront_area_sqm = COALESCE(?, storefront_area_sqm),
        coverage_percentage = COALESCE(?, coverage_percentage),
        visibility_score = COALESCE(?, visibility_score),
        optimal_position = COALESCE(?, optimal_position),
        quality_score = COALESCE(?, quality_score),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND tenant_id = ?`,
      [
        storefront_area_sqm,
        coverage_percentage,
        visibility_score,
        optimal_position,
        quality_score,
        id,
        tenantId
      ],
      function(err) {
        if (err) {
          console.error('Error updating analytics:', err);
          return res.status(500).json({ error: 'Failed to update analytics' });
        }
        if (this.changes === 0) {
          return res.status(404).json({ error: 'Installation not found' });
        }

        // Fetch updated installation
        db.get(
          'SELECT * FROM board_installations WHERE id = ?',
          [id],
          (err, installation) => {
            if (err) {
              console.error('Error fetching updated installation:', err);
              return res.status(500).json({ error: 'Analytics updated but failed to fetch' });
            }
            res.json(installation);
          }
        );
      }
    );
  } catch (error) {
    console.error('Error in update analytics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get installations by agent
router.get('/agent/:agentId', authMiddleware, async (req, res) => {
  try {
    const { agentId } = req.params;
    const tenantId = req.user.tenantId;
    db.all(
      `SELECT bi.*, b.board_name, b.board_type, c.name as customer_name, br.name as brand_name
       FROM board_installations bi
       LEFT JOIN boards b ON bi.board_id = b.id
       LEFT JOIN customers c ON bi.customer_id = c.id
       LEFT JOIN brands br ON bi.brand_id = br.id
       WHERE bi.agent_id = ? AND bi.tenant_id = ?
       ORDER BY bi.installation_date DESC`,
      [agentId, tenantId],
      (err, installations) => {
        if (err) {
          console.error('Error fetching agent installations:', err);
          return res.status(500).json({ error: 'Failed to fetch installations' });
        }
        res.json(installations);
      }
    );
  } catch (error) {
    console.error('Error in get agent installations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get installations by customer
router.get('/customer/:customerId', authMiddleware, async (req, res) => {
  try {
    const { customerId } = req.params;
    const tenantId = req.user.tenantId;
    db.all(
      `SELECT bi.*, b.board_name, b.board_type, br.name as brand_name,
              u.first_name || ' ' || u.last_name as agent_name
       FROM board_installations bi
       LEFT JOIN boards b ON bi.board_id = b.id
       LEFT JOIN brands br ON bi.brand_id = br.id
       LEFT JOIN users a ON bi.agent_id = a.id
       LEFT JOIN users u ON a.user_id = u.id
       WHERE bi.customer_id = ? AND bi.tenant_id = ?
       ORDER BY bi.installation_date DESC`,
      [customerId, tenantId],
      (err, installations) => {
        if (err) {
          console.error('Error fetching customer installations:', err);
          return res.status(500).json({ error: 'Failed to fetch installations' });
        }
        res.json(installations);
      }
    );
  } catch (error) {
    console.error('Error in get customer installations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get installation analytics summary
router.get('/analytics/summary', authMiddleware, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { from_date, to_date, agent_id, brand_id } = req.query;

    let query = `
      SELECT 
        COUNT(*) as total_installations,
        AVG(coverage_percentage) as avg_coverage,
        AVG(visibility_score) as avg_visibility,
        AVG(quality_score) as avg_quality,
        SUM(commission_amount) as total_commissions,
        SUM(CASE WHEN optimal_position = 1 THEN 1 ELSE 0 END) as optimal_placements
      FROM board_installations
      WHERE tenant_id = ?
    `;
    const params = [tenantId];

    if (from_date) {
      query += ' AND date(installation_date) >= date(?)';
      params.push(from_date);
    }
    if (to_date) {
      query += ' AND date(installation_date) <= date(?)';
      params.push(to_date);
    }
    if (agent_id) {
      query += ' AND agent_id = ?';
      params.push(agent_id);
    }
    if (brand_id) {
      query += ' AND brand_id = ?';
      params.push(brand_id);
    }
    db.get(query, params, (err, summary) => {
      if (err) {
        console.error('Error fetching analytics summary:', err);
        return res.status(500).json({ error: 'Failed to fetch analytics' });
      }
      res.json(summary);
    });
  } catch (error) {
    console.error('Error in get analytics summary:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
