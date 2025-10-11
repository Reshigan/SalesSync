/**
 * GPS Validation Utility for Field Marketing Agents
 * Handles location validation, distance calculations, and GPS accuracy
 */

/**
 * Calculate distance between two GPS coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in meters
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth's radius in meters
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

/**
 * Validate GPS coordinates
 * @param {number} latitude - Latitude value
 * @param {number} longitude - Longitude value
 * @returns {boolean} True if coordinates are valid
 */
function validateCoordinates(latitude, longitude) {
  return (
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    latitude >= -90 && latitude <= 90 &&
    longitude >= -180 && longitude <= 180 &&
    !isNaN(latitude) && !isNaN(longitude)
  );
}

/**
 * Validate agent location against customer location
 * @param {Object} agentLocation - Agent's current location
 * @param {Object} customerLocation - Customer's stored location
 * @param {number} radiusMeters - Allowed radius in meters (default: 10)
 * @returns {Object} Validation result
 */
function validateAgentLocation(agentLocation, customerLocation, radiusMeters = 10) {
  const { latitude: agentLat, longitude: agentLon, accuracy } = agentLocation;
  const { latitude: customerLat, longitude: customerLon } = customerLocation;

  // Validate coordinates
  if (!validateCoordinates(agentLat, agentLon)) {
    return {
      isValid: false,
      error: 'Invalid agent GPS coordinates',
      distance: null,
      accuracy: accuracy || null
    };
  }

  if (!validateCoordinates(customerLat, customerLon)) {
    return {
      isValid: false,
      error: 'Invalid customer GPS coordinates',
      distance: null,
      accuracy: accuracy || null
    };
  }

  // Calculate distance
  const distance = calculateDistance(agentLat, agentLon, customerLat, customerLon);

  // Check GPS accuracy
  const gpsAccuracy = accuracy || 50; // Default 50m if not provided
  const effectiveRadius = radiusMeters + gpsAccuracy;

  return {
    isValid: distance <= effectiveRadius,
    distance: Math.round(distance * 100) / 100, // Round to 2 decimal places
    accuracy: gpsAccuracy,
    allowedRadius: radiusMeters,
    effectiveRadius: effectiveRadius,
    confidenceLevel: getConfidenceLevel(gpsAccuracy),
    timestamp: new Date().toISOString()
  };
}

/**
 * Get GPS confidence level based on accuracy
 * @param {number} accuracy - GPS accuracy in meters
 * @returns {string} Confidence level
 */
function getConfidenceLevel(accuracy) {
  if (accuracy <= 5) return 'HIGH';
  if (accuracy <= 15) return 'MEDIUM';
  if (accuracy <= 50) return 'LOW';
  return 'VERY_LOW';
}

/**
 * Find nearby customers within specified radius
 * @param {Object} agentLocation - Agent's current location
 * @param {Array} customers - Array of customer objects with GPS coordinates
 * @param {number} radiusMeters - Search radius in meters (default: 1000)
 * @returns {Array} Array of nearby customers with distances
 */
function findNearbyCustomers(agentLocation, customers, radiusMeters = 1000) {
  const { latitude: agentLat, longitude: agentLon } = agentLocation;

  if (!validateCoordinates(agentLat, agentLon)) {
    return [];
  }

  return customers
    .map(customer => {
      if (!customer.latitude || !customer.longitude) {
        return null;
      }

      const distance = calculateDistance(
        agentLat, agentLon,
        customer.latitude, customer.longitude
      );

      return {
        ...customer,
        distance: Math.round(distance * 100) / 100,
        isNearby: distance <= radiusMeters
      };
    })
    .filter(customer => customer && customer.isNearby)
    .sort((a, b) => a.distance - b.distance);
}

/**
 * Cache GPS location for offline use
 * @param {string} agentId - Agent ID
 * @param {Object} location - GPS location data
 * @param {string} customerId - Customer ID (optional)
 */
function cacheGPSLocation(agentId, location, customerId = null) {
  const cacheKey = customerId ? `gps_${agentId}_${customerId}` : `gps_${agentId}`;
  const cacheData = {
    ...location,
    timestamp: new Date().toISOString(),
    cached: true
  };

  // In a real implementation, this would use Redis or local storage
  // For now, we'll use a simple in-memory cache
  if (typeof global !== 'undefined') {
    global.gpsCache = global.gpsCache || {};
    global.gpsCache[cacheKey] = cacheData;
  }

  return cacheData;
}

/**
 * Get cached GPS location
 * @param {string} agentId - Agent ID
 * @param {string} customerId - Customer ID (optional)
 * @returns {Object|null} Cached location data or null
 */
function getCachedGPSLocation(agentId, customerId = null) {
  const cacheKey = customerId ? `gps_${agentId}_${customerId}` : `gps_${agentId}`;
  
  if (typeof global !== 'undefined' && global.gpsCache) {
    const cached = global.gpsCache[cacheKey];
    if (cached) {
      // Check if cache is still valid (within 1 hour)
      const cacheAge = Date.now() - new Date(cached.timestamp).getTime();
      if (cacheAge < 3600000) { // 1 hour in milliseconds
        return cached;
      }
    }
  }

  return null;
}

/**
 * Validate visit location with enhanced checks
 * @param {Object} visitData - Visit data including locations and timing
 * @returns {Object} Enhanced validation result
 */
function validateVisitLocation(visitData) {
  const {
    agentLocation,
    customerLocation,
    visitStartTime,
    radiusMeters = 10,
    allowCachedLocation = false
  } = visitData;

  // Basic location validation
  const basicValidation = validateAgentLocation(agentLocation, customerLocation, radiusMeters);

  // Enhanced checks
  const enhancedResult = {
    ...basicValidation,
    visitStartTime,
    locationSource: agentLocation.cached ? 'CACHED' : 'LIVE',
    validationChecks: {
      coordinatesValid: basicValidation.isValid || basicValidation.error !== 'Invalid agent GPS coordinates',
      withinRadius: basicValidation.isValid,
      accuracyAcceptable: basicValidation.accuracy <= 100,
      timestampRecent: true // Could add timestamp validation
    }
  };

  // Override validation if cached location is not allowed
  if (agentLocation.cached && !allowCachedLocation) {
    enhancedResult.isValid = false;
    enhancedResult.error = 'Live GPS location required for this visit';
  }

  return enhancedResult;
}

module.exports = {
  calculateDistance,
  validateCoordinates,
  validateAgentLocation,
  getConfidenceLevel,
  findNearbyCustomers,
  cacheGPSLocation,
  getCachedGPSLocation,
  validateVisitLocation
};