const express = require('express');
const router = express.Router();
const { getDatabase } = require('../config/database');
const { authMiddleware } = require('../middleware/authMiddleware');
const { v4: uuidv4 } = require('uuid');

// Haversine formula to calculate distance between two GPS coordinates
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

// Validate GPS proximity to customer location
router.post('/validate-proximity', authMiddleware, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const agentId = req.user.userId;
    const { customer_id, latitude, longitude, accuracy } = req.body;

    if (!customer_id || !latitude || !longitude) {
      return res.status(400).json({ 
        error: 'Customer ID, latitude, and longitude are required' 
      });
    }

    const db = getDatabase();

    // Get customer location
    db.get(
      'SELECT id, name, latitude, longitude, gps_accuracy FROM customers WHERE id = ? AND tenant_id = ?',
      [customer_id, tenantId],
      (err, customer) => {
        if (err) {
          console.error('Error fetching customer:', err);
          return res.status(500).json({ error: 'Failed to validate proximity' });
        }
        if (!customer) {
          return res.status(404).json({ error: 'Customer not found' });
        }

        // Check if customer has GPS coordinates
        if (!customer.latitude || !customer.longitude) {
          return res.json({
            valid: true,
            within_range: null,
            distance: null,
            message: 'Customer location not set. This is a new customer registration.',
            customer_name: customer.name
          });
        }

        // Calculate distance
        const distance = calculateDistance(
          parseFloat(latitude),
          parseFloat(longitude),
          parseFloat(customer.latitude),
          parseFloat(customer.longitude)
        );

        const withinRange = distance <= 10; // 10 meters tolerance

        // Log GPS check
        const logId = uuidv4();
        db.run(
          `INSERT INTO agent_gps_logs (
            id, tenant_id, agent_id, latitude, longitude, accuracy,
            timestamp, activity_type, reference_type, reference_id
          ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'), ?, ?, ?)`,
          [logId, tenantId, agentId, latitude, longitude, accuracy, 
           'proximity_check', 'customer', customer_id],
          (err) => {
            if (err) {
              console.error('Error logging GPS:', err);
              // Continue anyway
            }
          }
        );

        res.json({
          valid: withinRange,
          within_range: withinRange,
          distance: Math.round(distance * 10) / 10, // Round to 1 decimal
          tolerance: 10,
          message: withinRange 
            ? 'Agent is within acceptable range of customer location'
            : `Agent is ${Math.round(distance)}m away from customer location`,
          customer_name: customer.name,
          customer_location: {
            latitude: customer.latitude,
            longitude: customer.longitude
          },
          agent_location: {
            latitude: latitude,
            longitude: longitude
          }
        });
      }
    );
  } catch (error) {
    console.error('Error in validate proximity:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Log agent GPS position
router.post('/log', authMiddleware, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const agentId = req.user.userId;
    const {
      latitude,
      longitude,
      accuracy,
      altitude,
      speed,
      bearing,
      activity_type,
      reference_type,
      reference_id
    } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const logId = uuidv4();
    const db = getDatabase();

    db.run(
      `INSERT INTO agent_gps_logs (
        id, tenant_id, agent_id, latitude, longitude, accuracy,
        altitude, speed, bearing, timestamp, activity_type,
        reference_type, reference_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?, ?, ?)`,
      [
        logId, tenantId, agentId, latitude, longitude, accuracy,
        altitude, speed, bearing, activity_type, reference_type, reference_id
      ],
      function(err) {
        if (err) {
          console.error('Error logging GPS:', err);
          return res.status(500).json({ error: 'Failed to log GPS position' });
        }
        res.status(201).json({
          id: logId,
          message: 'GPS position logged successfully',
          timestamp: new Date().toISOString()
        });
      }
    );
  } catch (error) {
    console.error('Error in log GPS:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get agent GPS track/history
router.get('/agent-track/:agentId', authMiddleware, async (req, res) => {
  try {
    const { agentId } = req.params;
    const tenantId = req.user.tenantId;
    const { from_date, to_date, activity_type } = req.query;

    let query = `
      SELECT * FROM agent_gps_logs
      WHERE agent_id = ? AND tenant_id = ?
    `;
    const params = [agentId, tenantId];

    if (from_date) {
      query += ' AND datetime(timestamp) >= datetime(?)';
      params.push(from_date);
    }
    if (to_date) {
      query += ' AND datetime(timestamp) <= datetime(?)';
      params.push(to_date);
    }
    if (activity_type) {
      query += ' AND activity_type = ?';
      params.push(activity_type);
    }

    query += ' ORDER BY timestamp DESC LIMIT 1000';

    const db = getDatabase();
    db.all(query, params, (err, logs) => {
      if (err) {
        console.error('Error fetching GPS track:', err);
        return res.status(500).json({ error: 'Failed to fetch GPS track' });
      }
      res.json(logs);
    });
  } catch (error) {
    console.error('Error in get agent track:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update customer location
router.put('/update-customer-location', authMiddleware, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const userId = req.user.userId;
    const { customer_id, latitude, longitude, accuracy, update_reason } = req.body;

    if (!customer_id || !latitude || !longitude) {
      return res.status(400).json({ 
        error: 'Customer ID, latitude, and longitude are required' 
      });
    }

    const db = getDatabase();

    // Check if customer exists
    db.get(
      'SELECT id, name, latitude as old_latitude, longitude as old_longitude FROM customers WHERE id = ? AND tenant_id = ?',
      [customer_id, tenantId],
      (err, customer) => {
        if (err) {
          console.error('Error fetching customer:', err);
          return res.status(500).json({ error: 'Failed to update location' });
        }
        if (!customer) {
          return res.status(404).json({ error: 'Customer not found' });
        }

        // Log location history if customer had previous location
        if (customer.old_latitude && customer.old_longitude) {
          const historyId = uuidv4();
          db.run(
            `INSERT INTO customer_location_history (
              id, tenant_id, customer_id, latitude, longitude, accuracy,
              updated_by, update_reason, timestamp
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
            [
              historyId, tenantId, customer_id, customer.old_latitude,
              customer.old_longitude, null, userId, 'Previous location before update'
            ],
            (err) => {
              if (err) {
                console.error('Error logging location history:', err);
                // Continue anyway
              }
            }
          );
        }

        // Update customer location
        db.run(
          `UPDATE customers SET
            latitude = ?,
            longitude = ?,
            gps_accuracy = ?,
            gps_updated_at = datetime('now')
          WHERE id = ? AND tenant_id = ?`,
          [latitude, longitude, accuracy, customer_id, tenantId],
          function(err) {
            if (err) {
              console.error('Error updating customer location:', err);
              return res.status(500).json({ error: 'Failed to update location' });
            }

            // Log the new location in history
            const newHistoryId = uuidv4();
            db.run(
              `INSERT INTO customer_location_history (
                id, tenant_id, customer_id, latitude, longitude, accuracy,
                updated_by, update_reason, timestamp
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
              [
                newHistoryId, tenantId, customer_id, latitude, longitude,
                accuracy, userId, update_reason || 'Location updated by field agent'
              ],
              (err) => {
                if (err) {
                  console.error('Error logging new location:', err);
                  // Continue anyway
                }
              }
            );

            // Fetch updated customer
            db.get(
              'SELECT * FROM customers WHERE id = ?',
              [customer_id],
              (err, updated) => {
                if (err) {
                  console.error('Error fetching updated customer:', err);
                  return res.status(500).json({ error: 'Location updated but failed to fetch' });
                }
                res.json({
                  message: 'Customer location updated successfully',
                  customer: updated
                });
              }
            );
          }
        );
      }
    );
  } catch (error) {
    console.error('Error in update customer location:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get customer location history
router.get('/customer-location-history/:customerId', authMiddleware, async (req, res) => {
  try {
    const { customerId } = req.params;
    const tenantId = req.user.tenantId;

    const db = getDatabase();
    db.all(
      `SELECT clh.*, u.first_name || ' ' || u.last_name as updated_by_name
       FROM customer_location_history clh
       LEFT JOIN users u ON clh.updated_by = u.id
       WHERE clh.customer_id = ? AND clh.tenant_id = ?
       ORDER BY clh.timestamp DESC`,
      [customerId, tenantId],
      (err, history) => {
        if (err) {
          console.error('Error fetching location history:', err);
          return res.status(500).json({ error: 'Failed to fetch location history' });
        }
        res.json(history);
      }
    );
  } catch (error) {
    console.error('Error in get location history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get nearby customers based on GPS
router.post('/nearby-customers', authMiddleware, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { latitude, longitude, radius = 1000 } = req.body; // Default 1km radius

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const db = getDatabase();

    // Get all customers with GPS coordinates
    db.all(
      `SELECT id, name, code, phone, address, latitude, longitude, type, status
       FROM customers
       WHERE tenant_id = ? AND latitude IS NOT NULL AND longitude IS NOT NULL AND status = 'active'`,
      [tenantId],
      (err, customers) => {
        if (err) {
          console.error('Error fetching customers:', err);
          return res.status(500).json({ error: 'Failed to fetch nearby customers' });
        }

        // Calculate distance for each customer and filter by radius
        const nearbyCustomers = customers
          .map(customer => {
            const distance = calculateDistance(
              parseFloat(latitude),
              parseFloat(longitude),
              parseFloat(customer.latitude),
              parseFloat(customer.longitude)
            );
            return {
              ...customer,
              distance: Math.round(distance * 10) / 10 // Round to 1 decimal
            };
          })
          .filter(customer => customer.distance <= radius)
          .sort((a, b) => a.distance - b.distance);

        res.json({
          agent_location: { latitude, longitude },
          radius: radius,
          count: nearbyCustomers.length,
          customers: nearbyCustomers
        });
      }
    );
  } catch (error) {
    console.error('Error in get nearby customers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get agent current location (last logged position)
router.get('/agent-current-location/:agentId', authMiddleware, async (req, res) => {
  try {
    const { agentId } = req.params;
    const tenantId = req.user.tenantId;

    const db = getDatabase();
    db.get(
      `SELECT * FROM agent_gps_logs
       WHERE agent_id = ? AND tenant_id = ?
       ORDER BY timestamp DESC
       LIMIT 1`,
      [agentId, tenantId],
      (err, location) => {
        if (err) {
          console.error('Error fetching current location:', err);
          return res.status(500).json({ error: 'Failed to fetch current location' });
        }
        if (!location) {
          return res.status(404).json({ error: 'No location data found for agent' });
        }
        res.json(location);
      }
    );
  } catch (error) {
    console.error('Error in get current location:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
