/**
 * GPS Validation Middleware
 * Validates GPS coordinates and enforces distance thresholds per workflow
 */

const { getDatabase } = require('../database/connection');

// Haversine formula to calculate distance between two GPS coordinates
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // Distance in meters
}

// Default GPS thresholds by workflow (in meters)
const DEFAULT_THRESHOLDS = {
  'field_marketing': 10,  // 10m for field marketing
  'van_sales': 50,        // 50m for van sales
  'inventory': 50,        // 50m for inventory
  'trade_marketing': 10   // 10m for trade marketing
};

/**
 * Middleware to validate GPS coordinates
 * Checks if agent is within required distance of customer/location
 */
async function validateGPS(req, res, next) {
  try {
    const { latitude, longitude, accuracy, customer_id, warehouse_id, workflow_type } = req.body;
    const tenantId = req.tenantId;

    // Check if GPS validation is enforced for this tenant
    const db = getDatabase();
    const tenant = await db.get(
      'SELECT force_gps FROM tenants WHERE id = ?',
      [tenantId]
    );

    if (!tenant || !tenant.force_gps) {
      // GPS validation not enforced, skip
      return next();
    }

    // Validate GPS coordinates are provided
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        error: 'GPS coordinates are required (latitude, longitude)'
      });
    }

    // Validate accuracy (should be < 50m for reliable positioning)
    if (accuracy && accuracy > 50) {
      return res.status(400).json({
        success: false,
        error: `GPS accuracy too low (${accuracy}m). Please wait for better signal (< 50m accuracy required).`
      });
    }

    // Get GPS threshold for this workflow
    const threshold = DEFAULT_THRESHOLDS[workflow_type] || 50;

    // Get target location coordinates
    let targetLat, targetLon, targetName;

    if (customer_id) {
      const customer = await db.get(
        'SELECT latitude, longitude, name FROM customers WHERE id = ? AND tenant_id = ?',
        [customer_id, tenantId]
      );

      if (!customer) {
        return res.status(404).json({
          success: false,
          error: 'Customer not found'
        });
      }

      if (!customer.latitude || !customer.longitude) {
        return res.status(400).json({
          success: false,
          error: 'Customer location not set. Please update customer GPS coordinates first.'
        });
      }

      targetLat = customer.latitude;
      targetLon = customer.longitude;
      targetName = customer.name;
    } else if (warehouse_id) {
      const warehouse = await db.get(
        'SELECT latitude, longitude, name FROM warehouses WHERE id = ? AND tenant_id = ?',
        [warehouse_id, tenantId]
      );

      if (!warehouse) {
        return res.status(404).json({
          success: false,
          error: 'Warehouse not found'
        });
      }

      if (!warehouse.latitude || !warehouse.longitude) {
        return res.status(400).json({
          success: false,
          error: 'Warehouse location not set. Please update warehouse GPS coordinates first.'
        });
      }

      targetLat = warehouse.latitude;
      targetLon = warehouse.longitude;
      targetName = warehouse.name;
    } else {
      // No target location specified, skip validation
      return next();
    }

    // Calculate distance
    const distance = calculateDistance(latitude, longitude, targetLat, targetLon);

    // Check if within threshold
    if (distance > threshold) {
      return res.status(403).json({
        success: false,
        error: `GPS validation failed: You are ${Math.round(distance)}m away from ${targetName}. You must be within ${threshold}m to proceed.`,
        distance: Math.round(distance),
        threshold: threshold,
        target_name: targetName
      });
    }

    // GPS validation passed
    req.gpsValidated = true;
    req.gpsDistance = Math.round(distance);
    next();

  } catch (error) {
    console.error('GPS validation error:', error);
    res.status(500).json({
      success: false,
      error: 'GPS validation failed: ' + error.message
    });
  }
}

/**
 * Middleware to allow GPS override with manager approval
 */
async function allowGPSOverride(req, res, next) {
  try {
    const { gps_override_reason, gps_override_approved_by } = req.body;

    if (gps_override_reason && gps_override_approved_by) {
      // Log the override
      console.log(`GPS override approved by ${gps_override_approved_by}: ${gps_override_reason}`);
      req.gpsOverride = true;
      req.gpsOverrideReason = gps_override_reason;
      req.gpsOverrideApprovedBy = gps_override_approved_by;
      return next();
    }

    // No override, proceed with normal validation
    next();
  } catch (error) {
    console.error('GPS override error:', error);
    next();
  }
}

module.exports = {
  validateGPS,
  allowGPSOverride,
  calculateDistance,
  DEFAULT_THRESHOLDS
};
