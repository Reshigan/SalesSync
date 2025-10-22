const express = require('express');
const router = express.Router();
const { authTenantMiddleware } = require('../middleware/authTenantMiddleware');

// Apply authentication middleware
router.use(authTenantMiddleware);

/**
 * @swagger
 * components:
 *   schemas:
 *     GPSLocation:
 *       type: object
 *       properties:
 *         latitude:
 *           type: number
 *         longitude:
 *           type: number
 *         accuracy:
 *           type: number
 *         altitude:
 *           type: number
 *         heading:
 *           type: number
 *         speed:
 *           type: number
 *         timestamp:
 *           type: string
 *           format: date-time
 *     AgentLocation:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         agent_id:
 *           type: string
 *         location:
 *           $ref: '#/components/schemas/GPSLocation'
 *         activity_type:
 *           type: string
 *           enum: [traveling, at_customer, break, offline]
 *         customer_id:
 *           type: string
 *         recorded_at:
 *           type: string
 *           format: date-time
 *     CustomerProximity:
 *       type: object
 *       properties:
 *         customer_id:
 *           type: string
 *         customer_name:
 *           type: string
 *         distance_meters:
 *           type: number
 *         within_radius:
 *           type: boolean
 *         last_visit_date:
 *           type: string
 *           format: date
 */

/**
 * @swagger
 * /api/gps-tracking/location:
 *   post:
 *     summary: Update agent's current location
 *     tags: [GPS Tracking]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - agent_id
 *               - location
 *             properties:
 *               agent_id:
 *                 type: string
 *               location:
 *                 $ref: '#/components/schemas/GPSLocation'
 *               activity_type:
 *                 type: string
 *               customer_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Location updated successfully
 */
router.post('/location', async (req, res) => {
  try {
    const { runQuery } = await import('../utils/database.js');
    const { agent_id, location, activity_type, customer_id } = req.body;
    
    if (!agent_id || !location || !location.latitude || !location.longitude) {
      return res.status(400).json({
        success: false,
        error: { message: 'Agent ID and valid location are required', code: 'VALIDATION_ERROR' }
      });
    }
    
    // Insert location record
    await runQuery(`
      INSERT INTO agent_locations (
        tenant_id, agent_id, latitude, longitude, accuracy, 
        altitude, heading, speed, activity_type, customer_id, recorded_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [
      req.user.tenantId,
      agent_id,
      location.latitude,
      location.longitude,
      location.accuracy || null,
      location.altitude || null,
      location.heading || null,
      location.speed || null,
      activity_type || 'traveling',
      customer_id || null
    ]);
    
    // Update agent's current location
    await runQuery(`
      UPDATE agents 
      SET current_latitude = ?, 
          current_longitude = ?, 
          last_location_update = CURRENT_TIMESTAMP,
          current_activity = ?
      WHERE id = ? AND tenant_id = ?
    `, [
      location.latitude,
      location.longitude,
      activity_type || 'traveling',
      agent_id,
      req.user.tenantId
    ]);
    
    res.json({
      success: true,
      data: { message: 'Location updated successfully' }
    });
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to update location', code: 'UPDATE_ERROR' }
    });
  }
});

/**
 * @swagger
 * /api/gps-tracking/agents/{id}/location:
 *   get:
 *     summary: Get agent's current location
 *     tags: [GPS Tracking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Agent ID
 *     responses:
 *       200:
 *         description: Agent's current location
 */
router.get('/agents/:id/location', async (req, res) => {
  try {
    const { getOneQuery } = await import('../utils/database.js');
    const { id } = req.params;
    
    const location = await getOneQuery(`
      SELECT a.id, a.current_latitude, a.current_longitude, 
             a.last_location_update, a.current_activity,
             u.first_name || ' ' || u.last_name as agent_name,
             u.phone as agent_phone
      FROM agents a
      JOIN users u ON a.user_id = u.id
      WHERE a.id = ? AND a.tenant_id = ?
    `, [id, req.user.tenantId]);
    
    if (!location) {
      return res.status(404).json({
        success: false,
        error: { message: 'Agent not found', code: 'NOT_FOUND' }
      });
    }
    
    res.json({
      success: true,
      data: { location }
    });
  } catch (error) {
    console.error('Error fetching agent location:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch location', code: 'FETCH_ERROR' }
    });
  }
});

/**
 * @swagger
 * /api/gps-tracking/agents/{id}/nearby-customers:
 *   get:
 *     summary: Get customers near agent's current location
 *     tags: [GPS Tracking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Agent ID
 *       - in: query
 *         name: radius
 *         schema:
 *           type: number
 *           default: 100
 *         description: Search radius in meters
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Maximum number of customers to return
 *     responses:
 *       200:
 *         description: List of nearby customers
 */
router.get('/agents/:id/nearby-customers', async (req, res) => {
  try {
    const { getQuery, getOneQuery } = await import('../utils/database.js');
    const { id } = req.params;
    const { radius = 100, limit = 20 } = req.query;
    
    // Get agent's current location
    const agent = await getOneQuery(`
      SELECT current_latitude, current_longitude
      FROM agents
      WHERE id = ? AND tenant_id = ?
    `, [id, req.user.tenantId]);
    
    if (!agent || !agent.current_latitude || !agent.current_longitude) {
      return res.status(404).json({
        success: false,
        error: { message: 'Agent location not available', code: 'LOCATION_NOT_AVAILABLE' }
      });
    }
    
    // Calculate distance using Haversine formula
    const nearbyCustomers = await getQuery(`
      SELECT c.*, 
             (6371000 * acos(cos(radians(?)) * cos(radians(c.latitude)) * 
              cos(radians(c.longitude) - radians(?)) + 
              sin(radians(?)) * sin(radians(c.latitude)))) as distance_meters,
             v.visit_date as last_visit_date,
             v.outcome as last_visit_outcome
      FROM customers c
      LEFT JOIN (
        SELECT customer_id, MAX(actual_start_time) as visit_date, outcome
        FROM visits 
        WHERE status = 'completed'
        GROUP BY customer_id
      ) v ON c.id = v.customer_id
      WHERE c.tenant_id = ? 
        AND c.latitude IS NOT NULL 
        AND c.longitude IS NOT NULL
        AND (6371000 * acos(cos(radians(?)) * cos(radians(c.latitude)) * 
             cos(radians(c.longitude) - radians(?)) + 
             sin(radians(?)) * sin(radians(c.latitude)))) <= ?
      ORDER BY distance_meters ASC
      LIMIT ?
    `, [
      agent.current_latitude, agent.current_longitude, agent.current_latitude,
      req.user.tenantId,
      agent.current_latitude, agent.current_longitude, agent.current_latitude,
      radius, limit
    ]);
    
    // Add proximity flags
    nearbyCustomers.forEach(customer => {
      customer.within_10m_radius = customer.distance_meters <= 10;
      customer.within_50m_radius = customer.distance_meters <= 50;
    });
    
    res.json({
      success: true,
      data: { 
        nearby_customers: nearbyCustomers,
        agent_location: {
          latitude: agent.current_latitude,
          longitude: agent.current_longitude
        },
        search_radius: radius
      }
    });
  } catch (error) {
    console.error('Error fetching nearby customers:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch nearby customers', code: 'FETCH_ERROR' }
    });
  }
});

/**
 * @swagger
 * /api/gps-tracking/validate-proximity:
 *   post:
 *     summary: Validate if agent is within required proximity of customer
 *     tags: [GPS Tracking]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - agent_id
 *               - customer_id
 *               - agent_location
 *             properties:
 *               agent_id:
 *                 type: string
 *               customer_id:
 *                 type: string
 *               agent_location:
 *                 $ref: '#/components/schemas/GPSLocation'
 *               required_radius:
 *                 type: number
 *                 default: 10
 *                 description: Required proximity radius in meters
 *     responses:
 *       200:
 *         description: Proximity validation result
 */
router.post('/validate-proximity', async (req, res) => {
  try {
    const { getOneQuery } = await import('../utils/database.js');
    const { agent_id, customer_id, agent_location, required_radius = 10 } = req.body;
    
    if (!agent_id || !customer_id || !agent_location) {
      return res.status(400).json({
        success: false,
        error: { message: 'Agent ID, customer ID, and location are required', code: 'VALIDATION_ERROR' }
      });
    }
    
    // Get customer location
    const customer = await getOneQuery(`
      SELECT id, name, latitude, longitude, address
      FROM customers
      WHERE id = ? AND tenant_id = ?
    `, [customer_id, req.user.tenantId]);
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        error: { message: 'Customer not found', code: 'NOT_FOUND' }
      });
    }
    
    if (!customer.latitude || !customer.longitude) {
      return res.status(400).json({
        success: false,
        error: { message: 'Customer location not available', code: 'LOCATION_NOT_AVAILABLE' }
      });
    }
    
    // Calculate distance using Haversine formula
    const distance = await getOneQuery(`
      SELECT (6371000 * acos(cos(radians(?)) * cos(radians(?)) * 
              cos(radians(?) - radians(?)) + 
              sin(radians(?)) * sin(radians(?)))) as distance_meters
    `, [
      agent_location.latitude, customer.latitude,
      customer.longitude, agent_location.longitude,
      agent_location.latitude, customer.latitude
    ]);
    
    const withinRadius = distance.distance_meters <= required_radius;
    
    res.json({
      success: true,
      data: {
        within_radius: withinRadius,
        distance_meters: Math.round(distance.distance_meters * 100) / 100,
        required_radius: required_radius,
        customer: {
          id: customer.id,
          name: customer.name,
          address: customer.address,
          location: {
            latitude: customer.latitude,
            longitude: customer.longitude
          }
        },
        agent_location: agent_location,
        validation_timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error validating proximity:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to validate proximity', code: 'VALIDATION_ERROR' }
    });
  }
});

/**
 * @swagger
 * /api/gps-tracking/agents/{id}/track:
 *   get:
 *     summary: Get agent's location history/track
 *     tags: [GPS Tracking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Agent ID
 *       - in: query
 *         name: date_from
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for track history
 *       - in: query
 *         name: date_to
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for track history
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Maximum number of location points
 *     responses:
 *       200:
 *         description: Agent's location track
 */
router.get('/agents/:id/track', async (req, res) => {
  try {
    const { getQuery } = await import('../utils/database.js');
    const { id } = req.params;
    const { date_from, date_to, limit = 100 } = req.query;
    
    let query = `
      SELECT al.*, c.name as customer_name
      FROM agent_locations al
      LEFT JOIN customers c ON al.customer_id = c.id
      WHERE al.agent_id = ? AND al.tenant_id = ?
    `;
    
    const params = [id, req.user.tenantId];
    
    if (date_from) {
      query += ' AND DATE(al.recorded_at) >= ?';
      params.push(date_from);
    }
    
    if (date_to) {
      query += ' AND DATE(al.recorded_at) <= ?';
      params.push(date_to);
    }
    
    query += ' ORDER BY al.recorded_at DESC LIMIT ?';
    params.push(parseInt(limit));
    
    const track = await getQuery(query, params);
    
    // Calculate total distance traveled
    let totalDistance = 0;
    for (let i = 1; i < track.length; i++) {
      const prev = track[i];
      const curr = track[i - 1];
      
      // Haversine formula for distance
      const R = 6371000; // Earth's radius in meters
      const dLat = (curr.latitude - prev.latitude) * Math.PI / 180;
      const dLon = (curr.longitude - prev.longitude) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(prev.latitude * Math.PI / 180) * Math.cos(curr.latitude * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c;
      
      totalDistance += distance;
    }
    
    res.json({
      success: true,
      data: {
        track: track.reverse(), // Return in chronological order
        total_distance_meters: Math.round(totalDistance),
        total_points: track.length,
        date_range: {
          from: date_from || (track.length > 0 ? track[0].recorded_at : null),
          to: date_to || (track.length > 0 ? track[track.length - 1].recorded_at : null)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching agent track:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch agent track', code: 'FETCH_ERROR' }
    });
  }
});

/**
 * @swagger
 * /api/gps-tracking/live-agents:
 *   get:
 *     summary: Get all agents' current locations
 *     tags: [GPS Tracking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: active_only
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Only return agents with recent location updates
 *       - in: query
 *         name: activity_type
 *         schema:
 *           type: string
 *         description: Filter by activity type
 *     responses:
 *       200:
 *         description: List of agents with current locations
 */
router.get('/live-agents', async (req, res) => {
  try {
    const { getQuery } = await import('../utils/database.js');
    const { active_only = true, activity_type } = req.query;
    
    let query = `
      SELECT a.id, a.current_latitude, a.current_longitude, 
             a.last_location_update, a.current_activity,
             u.first_name || ' ' || u.last_name as agent_name,
             u.phone as agent_phone,
             u.email as agent_email,
             c.name as current_customer
      FROM agents a
      JOIN users u ON a.user_id = u.id
      LEFT JOIN customers c ON a.current_customer_id = c.id
      WHERE a.tenant_id = ?
    `;
    
    const params = [req.user.tenantId];
    
    if (active_only) {
      // Only agents with location updates in the last 30 minutes
      query += ' AND a.last_location_update > datetime("now", "-30 minutes")';
    }
    
    if (activity_type) {
      query += ' AND a.current_activity = ?';
      params.push(activity_type);
    }
    
    query += ' ORDER BY a.last_location_update DESC';
    
    const agents = await getQuery(query, params);
    
    res.json({
      success: true,
      data: { 
        agents,
        total_agents: agents.length,
        last_updated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching live agents:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch live agents', code: 'FETCH_ERROR' }
    });
  }
});

/**
 * @swagger
 * /api/gps-tracking/dashboard:
 *   get:
 *     summary: Get GPS tracking dashboard data
 *     tags: [GPS Tracking]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data
 */
router.get('/dashboard', async (req, res) => {
  try {
    const { getQuery, getOneQuery } = await import('../utils/database.js');
    
    // Get basic user count
    const trackingStats = await getOneQuery(`
      SELECT 
        COUNT(DISTINCT u.id) as total_agents,
        0 as active_agents,
        0 as agents_at_customers,
        0 as agents_traveling
      FROM users u
      WHERE u.tenant_id = ?
    `, [req.user.tenantId]);
    
    // Simple location stats (empty for now since no data)
    const locationStats = {
      total_updates_today: 0,
      agents_updated_today: 0,
      avg_accuracy: 0
    };
    
    const geofenceStats = {
      total_geofence_events: 0,
      entries: 0,
      exits: 0
    };
    
    const recentUpdates = [];
    const activeGeofences = [];
    
    res.json({
      success: true,
      data: {
        trackingStats,
        locationStats,
        geofenceStats,
        recentUpdates,
        activeGeofences
      }
    });
  } catch (error) {
    console.error('Error fetching GPS tracking dashboard:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch dashboard data', code: 'FETCH_ERROR' }
    });
  }
});

/**
 * @swagger
 * /api/gps-tracking/locations:
 *   get:
 *     summary: Get all GPS location records
 *     tags: [GPS Tracking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: agent_id
 *         schema:
 *           type: string
 *         description: Filter by agent ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Maximum number of records
 *     responses:
 *       200:
 *         description: List of GPS locations
 */
router.get('/locations', async (req, res) => {
  try {
    const { getQuery } = await import('../utils/database.js');
    const { agent_id, limit = 50 } = req.query;
    
    let query = `
      SELECT al.*, 
             u.first_name || ' ' || u.last_name as agent_name,
             c.name as customer_name
      FROM agent_locations al
      LEFT JOIN agents a ON al.agent_id = a.id
      LEFT JOIN users u ON a.user_id = u.id
      LEFT JOIN customers c ON al.customer_id = c.id
      WHERE al.tenant_id = ?
    `;
    
    const params = [req.user.tenantId];
    
    if (agent_id) {
      query += ' AND al.agent_id = ?';
      params.push(agent_id);
    }
    
    query += ' ORDER BY al.recorded_at DESC LIMIT ?';
    params.push(parseInt(limit));
    
    const locations = await getQuery(query, params);
    
    res.json({
      success: true,
      data: locations
    });
  } catch (error) {
    console.error('Error fetching GPS locations:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch GPS locations', code: 'FETCH_ERROR' }
    });
  }
});

module.exports = router;