const express = require('express');
const router = express.Router();
const { getDatabase } = require('../database/init');
const { authMiddleware } = require('../middleware/authMiddleware');
const { v4: uuidv4 } = require('uuid');

// Calculate product distribution commission
function calculateProductCommission(product, quantity, monthlyVolume) {
  const baseCommission = (product.commission_rate || 0) * quantity;
  
  // Volume tier multipliers
  let volumeMultiplier = 1.0;
  if (monthlyVolume > 200) volumeMultiplier = 2.0;
  else if (monthlyVolume > 100) volumeMultiplier = 1.5;
  else if (monthlyVolume > 50) volumeMultiplier = 1.2;
  
  return baseCommission * volumeMultiplier;
}

// Record product distribution
router.post('/', authMiddleware, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const agentId = req.user.userId;
    
    const {
      customer_id,
      recipient_name,
      recipient_id_number,
      recipient_phone,
      recipient_email,
      product_id,
      product_type,
      quantity = 1,
      latitude,
      longitude,
      gps_accuracy,
      serial_number,
      imei_number,
      id_photo_url,
      proof_photo_url,
      signature_url,
      kyc_data,
      notes
    } = req.body;

    // Validation
    if (!recipient_name || !product_id || !product_type) {
      return res.status(400).json({ 
        error: 'Recipient name, product ID, and product type are required' 
      });
    }

    // Additional validation for SIM cards and phones
    if (product_type === 'sim_card' || product_type === 'mobile_phone') {
      if (!recipient_id_number || !id_photo_url) {
        return res.status(400).json({ 
          error: 'ID number and ID photo are required for SIM cards and phones' 
        });
      }
    }

    if (product_type === 'mobile_phone' && !imei_number) {
      return res.status(400).json({ error: 'IMEI number is required for phones' });
    }

    if (product_type === 'sim_card' && !serial_number) {
      return res.status(400).json({ error: 'Serial number is required for SIM cards' });
    }

    const db = getDatabase();

    // Get product details
    db.get(
      'SELECT * FROM products WHERE id = ? AND tenant_id = ?',
      [product_id, tenantId],
      async (err, product) => {
        if (err) {
          console.error('Error fetching product:', err);
          return res.status(500).json({ error: 'Failed to fetch product details' });
        }
        if (!product) {
          return res.status(404).json({ error: 'Product not found' });
        }

        // Get agent's monthly volume for this product
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        db.get(
          `SELECT SUM(quantity) as monthly_volume
           FROM product_distributions
           WHERE agent_id = ? AND product_id = ? AND distribution_date >= ?`,
          [agentId, product_id, startOfMonth.toISOString()],
          (err, volumeResult) => {
            if (err) {
              console.error('Error fetching volume:', err);
              // Continue anyway with 0 volume
            }

            const monthlyVolume = (volumeResult?.monthly_volume || 0) + quantity;
            const commissionAmount = calculateProductCommission(product, quantity, monthlyVolume);

            const distributionId = uuidv4();
            const followUpDate = new Date();
            followUpDate.setDate(followUpDate.getDate() + 7); // 7 days follow-up

            // Insert distribution
            db.run(
              `INSERT INTO product_distributions (
                id, tenant_id, agent_id, customer_id, recipient_name, recipient_id_number,
                recipient_phone, recipient_email, product_id, product_type, quantity,
                distribution_date, latitude, longitude, gps_accuracy, serial_number,
                imei_number, id_photo_url, proof_photo_url, signature_url, kyc_data,
                activation_status, commission_amount, follow_up_date, status, notes,
                created_at, updated_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
              [
                distributionId, tenantId, agentId, customer_id, recipient_name, recipient_id_number,
                recipient_phone, recipient_email, product_id, product_type, quantity,
                latitude, longitude, gps_accuracy, serial_number, imei_number,
                id_photo_url, proof_photo_url, signature_url, 
                kyc_data ? JSON.stringify(kyc_data) : null,
                'pending', commissionAmount, followUpDate.toISOString().split('T')[0],
                'distributed', notes
              ],
              function(err) {
                if (err) {
                  console.error('Error creating distribution:', err);
                  return res.status(500).json({ error: 'Failed to record distribution' });
                }

                // Deduct from inventory if tracking enabled
                // This is simplified - real implementation would check availability first
                db.run(
                  `UPDATE inventory_stock 
                   SET quantity_on_hand = quantity_on_hand - ?
                   WHERE product_id = ? AND tenant_id = ? AND quantity_on_hand >= ?`,
                  [quantity, product_id, tenantId, quantity],
                  (err) => {
                    if (err) {
                      console.error('Inventory update warning:', err);
                      // Continue anyway - inventory update is not critical for this operation
                    }
                  }
                );

                // Create commission transaction
                if (commissionAmount > 0) {
                  const commissionId = uuidv4();
                  const calculationDetails = JSON.stringify({
                    product_name: product.name,
                    product_type: product_type,
                    quantity: quantity,
                    monthly_volume: monthlyVolume,
                    base_rate: product.commission_rate
                  });

                  db.run(
                    `INSERT INTO commission_transactions (
                      id, tenant_id, agent_id, transaction_type, reference_type, reference_id,
                      base_amount, total_amount, calculation_details, status, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
                    [
                      commissionId, tenantId, agentId, 'product_distribution',
                      'product_distribution', distributionId,
                      product.commission_rate || 0, commissionAmount, calculationDetails, 'pending'
                    ],
                    (err) => {
                      if (err) {
                        console.error('Error creating commission:', err);
                      }
                    }
                  );
                }

                // Fetch the created distribution
                db.get(
                  `SELECT pd.*, p.name as product_name, p.code as product_code,
                          c.name as customer_name
                   FROM product_distributions pd
                   LEFT JOIN products p ON pd.product_id = p.id
                   LEFT JOIN customers c ON pd.customer_id = c.id
                   WHERE pd.id = ?`,
                  [distributionId],
                  (err, distribution) => {
                    if (err) {
                      console.error('Error fetching distribution:', err);
                      return res.status(500).json({ error: 'Distribution created but failed to fetch' });
                    }
                    res.status(201).json(distribution);
                  }
                );
              }
            );
          }
        );
      }
    );
  } catch (error) {
    console.error('Error in create distribution:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all distributions
router.get('/', authMiddleware, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { agent_id, customer_id, product_id, product_type, activation_status, from_date, to_date } = req.query;

    let query = `
      SELECT pd.*, p.name as product_name, p.code as product_code,
             c.name as customer_name,
             u.first_name || ' ' || u.last_name as agent_name
      FROM product_distributions pd
      LEFT JOIN products p ON pd.product_id = p.id
      LEFT JOIN customers c ON pd.customer_id = c.id
      LEFT JOIN users a ON pd.agent_id = a.id
      LEFT JOIN users u ON a.user_id = u.id
      WHERE pd.tenant_id = ?
    `;
    const params = [tenantId];

    if (agent_id) {
      query += ' AND pd.agent_id = ?';
      params.push(agent_id);
    }
    if (customer_id) {
      query += ' AND pd.customer_id = ?';
      params.push(customer_id);
    }
    if (product_id) {
      query += ' AND pd.product_id = ?';
      params.push(product_id);
    }
    if (product_type) {
      query += ' AND pd.product_type = ?';
      params.push(product_type);
    }
    if (activation_status) {
      query += ' AND pd.activation_status = ?';
      params.push(activation_status);
    }
    if (from_date) {
      query += ' AND date(pd.distribution_date) >= date(?)';
      params.push(from_date);
    }
    if (to_date) {
      query += ' AND date(pd.distribution_date) <= date(?)';
      params.push(to_date);
    }

    query += ' ORDER BY pd.distribution_date DESC';

    const db = getDatabase();
    db.all(query, params, (err, distributions) => {
      if (err) {
        console.error('Error fetching distributions:', err);
        return res.status(500).json({ error: 'Failed to fetch distributions' });
      }
      res.json(distributions);
    });
  } catch (error) {
    console.error('Error in get distributions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get distribution by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;

    const db = getDatabase();
    db.get(
      `SELECT pd.*, p.name as product_name, p.code as product_code, p.description as product_description,
              c.name as customer_name, c.phone as customer_phone,
              u.first_name || ' ' || u.last_name as agent_name
       FROM product_distributions pd
       LEFT JOIN products p ON pd.product_id = p.id
       LEFT JOIN customers c ON pd.customer_id = c.id
       LEFT JOIN users a ON pd.agent_id = a.id
       LEFT JOIN users u ON a.user_id = u.id
       WHERE pd.id = ? AND pd.tenant_id = ?`,
      [id, tenantId],
      (err, distribution) => {
        if (err) {
          console.error('Error fetching distribution:', err);
          return res.status(500).json({ error: 'Failed to fetch distribution' });
        }
        if (!distribution) {
          return res.status(404).json({ error: 'Distribution not found' });
        }
        res.json(distribution);
      }
    );
  } catch (error) {
    console.error('Error in get distribution:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update activation status
router.put('/:id/activate', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;
    const { activation_status, activation_date } = req.body;

    if (!activation_status) {
      return res.status(400).json({ error: 'Activation status is required' });
    }

    const db = getDatabase();

    // Check if activation is within 24 hours for bonus
    db.get(
      'SELECT pd.*, p.activation_bonus FROM product_distributions pd LEFT JOIN products p ON pd.product_id = p.id WHERE pd.id = ? AND pd.tenant_id = ?',
      [id, tenantId],
      (err, distribution) => {
        if (err) {
          console.error('Error fetching distribution:', err);
          return res.status(500).json({ error: 'Failed to update activation' });
        }
        if (!distribution) {
          return res.status(404).json({ error: 'Distribution not found' });
        }

        const activationDateTime = activation_date ? new Date(activation_date) : new Date();
        const distributionDate = new Date(distribution.distribution_date);
        const hoursDiff = (activationDateTime - distributionDate) / (1000 * 60 * 60);
        
        // Add activation bonus if activated within 24 hours
        if (hoursDiff <= 24 && distribution.activation_bonus && activation_status === 'activated') {
          const commissionId = uuidv4();
          db.run(
            `INSERT INTO commission_transactions (
              id, tenant_id, agent_id, transaction_type, reference_type, reference_id,
              base_amount, total_amount, bonus_amount, calculation_details, status, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
            [
              commissionId, tenantId, distribution.agent_id, 'activation_bonus',
              'product_distribution', id,
              0, distribution.activation_bonus, distribution.activation_bonus,
              JSON.stringify({ reason: '24-hour activation bonus' }), 'pending'
            ],
            (err) => {
              if (err) {
                console.error('Error creating activation bonus:', err);
              }
            }
          );
        }

        // Update distribution
        db.run(
          `UPDATE product_distributions SET
            activation_status = ?,
            activation_date = ?,
            updated_at = datetime('now')
          WHERE id = ? AND tenant_id = ?`,
          [activation_status, activationDateTime.toISOString(), id, tenantId],
          function(err) {
            if (err) {
              console.error('Error updating activation:', err);
              return res.status(500).json({ error: 'Failed to update activation' });
            }

            // Fetch updated distribution
            db.get(
              'SELECT * FROM product_distributions WHERE id = ?',
              [id],
              (err, updated) => {
                if (err) {
                  console.error('Error fetching updated distribution:', err);
                  return res.status(500).json({ error: 'Activation updated but failed to fetch' });
                }
                res.json(updated);
              }
            );
          }
        );
      }
    );
  } catch (error) {
    console.error('Error in update activation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Schedule follow-up
router.post('/:id/follow-up', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;
    const { follow_up_date, follow_up_status, notes } = req.body;

    if (!follow_up_date) {
      return res.status(400).json({ error: 'Follow-up date is required' });
    }

    const db = getDatabase();
    db.run(
      `UPDATE product_distributions SET
        follow_up_date = ?,
        follow_up_status = COALESCE(?, follow_up_status),
        notes = COALESCE(?, notes),
        updated_at = datetime('now')
      WHERE id = ? AND tenant_id = ?`,
      [follow_up_date, follow_up_status, notes, id, tenantId],
      function(err) {
        if (err) {
          console.error('Error scheduling follow-up:', err);
          return res.status(500).json({ error: 'Failed to schedule follow-up' });
        }
        if (this.changes === 0) {
          return res.status(404).json({ error: 'Distribution not found' });
        }

        // Fetch updated distribution
        db.get(
          'SELECT * FROM product_distributions WHERE id = ?',
          [id],
          (err, distribution) => {
            if (err) {
              console.error('Error fetching updated distribution:', err);
              return res.status(500).json({ error: 'Follow-up scheduled but failed to fetch' });
            }
            res.json(distribution);
          }
        );
      }
    );
  } catch (error) {
    console.error('Error in schedule follow-up:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get distributions by agent
router.get('/agent/:agentId', authMiddleware, async (req, res) => {
  try {
    const { agentId } = req.params;
    const tenantId = req.user.tenantId;

    const db = getDatabase();
    db.all(
      `SELECT pd.*, p.name as product_name, p.code as product_code, c.name as customer_name
       FROM product_distributions pd
       LEFT JOIN products p ON pd.product_id = p.id
       LEFT JOIN customers c ON pd.customer_id = c.id
       WHERE pd.agent_id = ? AND pd.tenant_id = ?
       ORDER BY pd.distribution_date DESC`,
      [agentId, tenantId],
      (err, distributions) => {
        if (err) {
          console.error('Error fetching agent distributions:', err);
          return res.status(500).json({ error: 'Failed to fetch distributions' });
        }
        res.json(distributions);
      }
    );
  } catch (error) {
    console.error('Error in get agent distributions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get distribution analytics
router.get('/analytics/summary', authMiddleware, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { from_date, to_date, agent_id, product_type } = req.query;

    let query = `
      SELECT 
        COUNT(*) as total_distributions,
        SUM(quantity) as total_quantity,
        SUM(commission_amount) as total_commissions,
        COUNT(CASE WHEN activation_status = 'activated' THEN 1 END) as activated_count,
        COUNT(CASE WHEN activation_status = 'pending' THEN 1 END) as pending_activations
      FROM product_distributions
      WHERE tenant_id = ?
    `;
    const params = [tenantId];

    if (from_date) {
      query += ' AND date(distribution_date) >= date(?)';
      params.push(from_date);
    }
    if (to_date) {
      query += ' AND date(distribution_date) <= date(?)';
      params.push(to_date);
    }
    if (agent_id) {
      query += ' AND agent_id = ?';
      params.push(agent_id);
    }
    if (product_type) {
      query += ' AND product_type = ?';
      params.push(product_type);
    }

    const db = getDatabase();
    db.get(query, params, (err, summary) => {
      if (err) {
        console.error('Error fetching analytics:', err);
        return res.status(500).json({ error: 'Failed to fetch analytics' });
      }
      res.json(summary);
    });
  } catch (error) {
    console.error('Error in get analytics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
