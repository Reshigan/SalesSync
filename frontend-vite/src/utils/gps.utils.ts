/**
 * GPS Utilities for Field Marketing System
 * Provides distance calculations and location verification
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  heading?: number;
  speed?: number;
  timestamp?: number;
}

export interface VerificationResult {
  isWithinRange: boolean;
  distance: number; // in meters
  accuracy: string;
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Calculate distance between two GPS coordinates using Haversine formula
 * @param lat1 Latitude of first point
 * @param lon1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lon2 Longitude of second point
 * @returns Distance in meters
 */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const φ1 = toRadians(lat1);
  const φ2 = toRadians(lat2);
  const Δφ = toRadians(lat2 - lat1);
  const Δλ = toRadians(lon2 - lon1);

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

/**
 * Format distance for display
 * @param meters Distance in meters
 * @returns Formatted string (e.g., "5 m", "1.2 km")
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Format coordinates for display
 * @param lat Latitude
 * @param lon Longitude
 * @returns Formatted string (e.g., "-26.2041, 28.0473")
 */
export function formatCoordinates(lat: number, lon: number): string {
  return `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
}

/**
 * Check if distance is within acceptable range
 * @param distance Distance in meters
 * @param threshold Threshold in meters (default: 10)
 * @returns True if within range
 */
export function isWithinRange(distance: number, threshold: number = 10): boolean {
  return distance <= threshold;
}

/**
 * Verify current location against customer location
 * @param currentLat Current latitude
 * @param currentLon Current longitude
 * @param customerLat Customer latitude
 * @param customerLon Customer longitude
 * @param threshold Distance threshold in meters (default: 10)
 * @returns Verification result
 */
export function verifyLocation(
  currentLat: number,
  currentLon: number,
  customerLat: number,
  customerLon: number,
  threshold: number = 10
): VerificationResult {
  const distance = haversineDistance(currentLat, currentLon, customerLat, customerLon);

  return {
    isWithinRange: distance <= threshold,
    distance: Math.round(distance),
    accuracy: 'meters',
  };
}

/**
 * Get accuracy level description
 * @param accuracy Accuracy in meters
 * @returns Description (e.g., "High", "Medium", "Low")
 */
export function getAccuracyLevel(accuracy: number): string {
  if (accuracy <= 10) return 'High';
  if (accuracy <= 50) return 'Medium';
  return 'Low';
}

/**
 * Get accuracy color for UI
 * @param accuracy Accuracy in meters
 * @returns Color name (e.g., "green", "yellow", "red")
 */
export function getAccuracyColor(accuracy: number): string {
  if (accuracy <= 10) return 'green';
  if (accuracy <= 50) return 'yellow';
  return 'red';
}

/**
 * Validate coordinates
 * @param lat Latitude
 * @param lon Longitude
 * @returns True if valid
 */
export function isValidCoordinates(lat: number, lon: number): boolean {
  return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
}
