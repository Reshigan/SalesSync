import { logger } from './logger';

export interface GPSCoordinates {
  lat: number;
  lng: number;
  accuracy?: number;
  timestamp?: Date;
}

export interface GPSValidationResult {
  isValid: boolean;
  distance?: number;
  accuracy?: number;
  message: string;
}

/**
 * Calculate distance between two GPS coordinates using Haversine formula
 * @param coord1 First coordinate
 * @param coord2 Second coordinate
 * @returns Distance in meters
 */
export function calculateDistance(coord1: GPSCoordinates, coord2: GPSCoordinates): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
  const dLng = (coord2.lng - coord1.lng) * Math.PI / 180;
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Validate GPS coordinates format
 * @param coordinates GPS coordinates to validate
 * @returns Validation result
 */
export function validateGPSFormat(coordinates: any): GPSValidationResult {
  if (!coordinates || typeof coordinates !== 'object') {
    return {
      isValid: false,
      message: 'GPS coordinates must be an object'
    };
  }

  const { lat, lng, accuracy } = coordinates;

  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return {
      isValid: false,
      message: 'Latitude and longitude must be numbers'
    };
  }

  if (lat < -90 || lat > 90) {
    return {
      isValid: false,
      message: 'Latitude must be between -90 and 90 degrees'
    };
  }

  if (lng < -180 || lng > 180) {
    return {
      isValid: false,
      message: 'Longitude must be between -180 and 180 degrees'
    };
  }

  if (accuracy !== undefined && (typeof accuracy !== 'number' || accuracy < 0)) {
    return {
      isValid: false,
      message: 'Accuracy must be a positive number'
    };
  }

  return {
    isValid: true,
    accuracy,
    message: 'GPS coordinates are valid'
  };
}

/**
 * Validate if user is within acceptable radius of target location
 * @param userLocation User's current GPS location
 * @param targetLocation Target GPS location
 * @param maxDistance Maximum allowed distance in meters (default: 10m)
 * @returns Validation result
 */
export function validateLocationProximity(
  userLocation: GPSCoordinates,
  targetLocation: GPSCoordinates,
  maxDistance: number = 10
): GPSValidationResult {
  // First validate GPS format
  const userValidation = validateGPSFormat(userLocation);
  if (!userValidation.isValid) {
    return userValidation;
  }

  const targetValidation = validateGPSFormat(targetLocation);
  if (!targetValidation.isValid) {
    return {
      isValid: false,
      message: `Target location invalid: ${targetValidation.message}`
    };
  }

  const distance = calculateDistance(userLocation, targetLocation);

  // Consider GPS accuracy in validation
  let effectiveMaxDistance = maxDistance;
  if (userLocation.accuracy && userLocation.accuracy > 5) {
    // If GPS accuracy is poor (>5m), increase allowed distance
    effectiveMaxDistance = Math.max(maxDistance, userLocation.accuracy * 2);
    logger.warn(`GPS accuracy is poor (${userLocation.accuracy}m), adjusting max distance to ${effectiveMaxDistance}m`);
  }

  const isValid = distance <= effectiveMaxDistance;

  return {
    isValid,
    distance,
    accuracy: userLocation.accuracy,
    message: isValid 
      ? `Location validated (${distance.toFixed(1)}m from target)`
      : `Location too far from target (${distance.toFixed(1)}m > ${effectiveMaxDistance}m)`
  };
}

/**
 * Validate GPS accuracy is acceptable for field operations
 * @param coordinates GPS coordinates with accuracy
 * @param maxAccuracy Maximum acceptable accuracy in meters (default: 20m)
 * @returns Validation result
 */
export function validateGPSAccuracy(
  coordinates: GPSCoordinates,
  maxAccuracy: number = 20
): GPSValidationResult {
  const formatValidation = validateGPSFormat(coordinates);
  if (!formatValidation.isValid) {
    return formatValidation;
  }

  if (!coordinates.accuracy) {
    return {
      isValid: false,
      message: 'GPS accuracy information is required'
    };
  }

  const isValid = coordinates.accuracy <= maxAccuracy;

  return {
    isValid,
    accuracy: coordinates.accuracy,
    message: isValid
      ? `GPS accuracy acceptable (${coordinates.accuracy}m)`
      : `GPS accuracy too poor (${coordinates.accuracy}m > ${maxAccuracy}m). Please wait for better signal.`
  };
}

/**
 * Check if GPS coordinates are within a geofenced area
 * @param userLocation User's current location
 * @param geofence Array of coordinates defining the geofence boundary
 * @returns Validation result
 */
export function validateGeofence(
  userLocation: GPSCoordinates,
  geofence: GPSCoordinates[]
): GPSValidationResult {
  const formatValidation = validateGPSFormat(userLocation);
  if (!formatValidation.isValid) {
    return formatValidation;
  }

  if (!geofence || geofence.length < 3) {
    return {
      isValid: false,
      message: 'Geofence must have at least 3 points'
    };
  }

  // Simple point-in-polygon algorithm (ray casting)
  let isInside = false;
  const x = userLocation.lng;
  const y = userLocation.lat;

  for (let i = 0, j = geofence.length - 1; i < geofence.length; j = i++) {
    const xi = geofence[i].lng;
    const yi = geofence[i].lat;
    const xj = geofence[j].lng;
    const yj = geofence[j].lat;

    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
      isInside = !isInside;
    }
  }

  return {
    isValid: isInside,
    message: isInside
      ? 'Location is within authorized area'
      : 'Location is outside authorized area'
  };
}

/**
 * Comprehensive GPS validation for field operations
 * @param userLocation User's current location
 * @param targetLocation Target location (optional)
 * @param options Validation options
 * @returns Validation result
 */
export function validateFieldLocation(
  userLocation: GPSCoordinates,
  targetLocation?: GPSCoordinates,
  options: {
    maxDistance?: number;
    maxAccuracy?: number;
    geofence?: GPSCoordinates[];
    requireTarget?: boolean;
  } = {}
): GPSValidationResult {
  const {
    maxDistance = 10,
    maxAccuracy = 20,
    geofence,
    requireTarget = false
  } = options;

  // 1. Validate GPS format
  const formatValidation = validateGPSFormat(userLocation);
  if (!formatValidation.isValid) {
    return formatValidation;
  }

  // 2. Validate GPS accuracy
  const accuracyValidation = validateGPSAccuracy(userLocation, maxAccuracy);
  if (!accuracyValidation.isValid) {
    return accuracyValidation;
  }

  // 3. Validate proximity to target if provided
  if (targetLocation) {
    const proximityValidation = validateLocationProximity(userLocation, targetLocation, maxDistance);
    if (!proximityValidation.isValid) {
      return proximityValidation;
    }
  } else if (requireTarget) {
    return {
      isValid: false,
      message: 'Target location is required for this operation'
    };
  }

  // 4. Validate geofence if provided
  if (geofence) {
    const geofenceValidation = validateGeofence(userLocation, geofence);
    if (!geofenceValidation.isValid) {
      return geofenceValidation;
    }
  }

  return {
    isValid: true,
    distance: targetLocation ? calculateDistance(userLocation, targetLocation) : undefined,
    accuracy: userLocation.accuracy,
    message: 'Location validation successful'
  };
}

/**
 * Generate location history entry
 * @param userId User ID
 * @param location GPS coordinates
 * @param activity Activity type
 * @param metadata Additional metadata
 * @returns Location history entry
 */
export function createLocationHistoryEntry(
  userId: string,
  location: GPSCoordinates,
  activity: string,
  metadata?: any
) {
  return {
    userId,
    location,
    activity,
    metadata,
    timestamp: new Date(),
    accuracy: location.accuracy
  };
}

/**
 * Check if location has moved significantly since last check
 * @param currentLocation Current GPS location
 * @param lastLocation Last recorded GPS location
 * @param threshold Minimum distance threshold in meters (default: 5m)
 * @returns True if location has moved significantly
 */
export function hasLocationChanged(
  currentLocation: GPSCoordinates,
  lastLocation: GPSCoordinates,
  threshold: number = 5
): boolean {
  if (!lastLocation) return true;
  
  const distance = calculateDistance(currentLocation, lastLocation);
  return distance > threshold;
}

/**
 * Estimate travel time between two locations
 * @param from Starting location
 * @param to Destination location
 * @param mode Travel mode ('walking' | 'driving')
 * @returns Estimated travel time in minutes
 */
export function estimateTravelTime(
  from: GPSCoordinates,
  to: GPSCoordinates,
  mode: 'walking' | 'driving' = 'walking'
): number {
  const distance = calculateDistance(from, to) / 1000; // Convert to kilometers
  
  // Rough estimates
  const speed = mode === 'walking' ? 5 : 30; // km/h
  return Math.round((distance / speed) * 60); // minutes
}

export default {
  calculateDistance,
  validateGPSFormat,
  validateLocationProximity,
  validateGPSAccuracy,
  validateGeofence,
  validateFieldLocation,
  createLocationHistoryEntry,
  hasLocationChanged,
  estimateTravelTime
};