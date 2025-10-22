/**
 * GPS Service for Field Marketing System
 * Handles geolocation tracking and verification
 */

import type { Coordinates, VerificationResult } from '../utils/gps.utils';
import { verifyLocation as verifyLocationUtil } from '../utils/gps.utils';

export interface GeolocationError {
  code: number;
  message: string;
}

class GPSService {
  private watchId: number | null = null;

  /**
   * Request geolocation permission
   */
  async requestPermission(): Promise<boolean> {
    if (!navigator.geolocation) {
      throw new Error('Geolocation is not supported by this browser');
    }

    try {
      // Try to get current position to trigger permission prompt
      await this.getCurrentPosition();
      return true;
    } catch (error) {
      console.error('Geolocation permission denied:', error);
      return false;
    }
  }

  /**
   * Get current GPS position
   * @param timeout Timeout in milliseconds (default: 10000)
   * @param maximumAge Maximum age of cached position (default: 0)
   * @param enableHighAccuracy Request high accuracy (default: true)
   */
  getCurrentPosition(
    timeout: number = 10000,
    maximumAge: number = 0,
    enableHighAccuracy: boolean = true
  ): Promise<Coordinates> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords: Coordinates = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude ?? undefined,
            heading: position.coords.heading ?? undefined,
            speed: position.coords.speed ?? undefined,
            timestamp: position.timestamp,
          };
          resolve(coords);
        },
        (error) => {
          reject(this.handleGeolocationError(error));
        },
        {
          enableHighAccuracy,
          timeout,
          maximumAge,
        }
      );
    });
  }

  /**
   * Watch position for real-time tracking
   * @param callback Callback function called on position updates
   * @param errorCallback Callback function called on errors
   * @param enableHighAccuracy Request high accuracy (default: true)
   */
  watchPosition(
    callback: (coords: Coordinates) => void,
    errorCallback?: (error: GeolocationError) => void,
    enableHighAccuracy: boolean = true
  ): number {
    if (!navigator.geolocation) {
      throw new Error('Geolocation is not supported by this browser');
    }

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        const coords: Coordinates = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude ?? undefined,
          heading: position.coords.heading ?? undefined,
          speed: position.coords.speed ?? undefined,
          timestamp: position.timestamp,
        };
        callback(coords);
      },
      (error) => {
        if (errorCallback) {
          errorCallback(this.handleGeolocationError(error));
        }
      },
      {
        enableHighAccuracy,
        timeout: 30000,
        maximumAge: 0,
      }
    );

    return this.watchId;
  }

  /**
   * Clear position watch
   */
  clearWatch(): void {
    if (this.watchId !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  /**
   * Verify current location against customer location
   * @param customerLat Customer latitude
   * @param customerLon Customer longitude
   * @param threshold Distance threshold in meters (default: 10)
   */
  async verifyLocation(
    customerLat: number,
    customerLon: number,
    threshold: number = 10
  ): Promise<VerificationResult & { currentLocation: Coordinates }> {
    const currentLocation = await this.getCurrentPosition();

    const result = verifyLocationUtil(
      currentLocation.latitude,
      currentLocation.longitude,
      customerLat,
      customerLon,
      threshold
    );

    return {
      ...result,
      currentLocation,
    };
  }

  /**
   * Handle geolocation errors
   */
  private handleGeolocationError(error: GeolocationPositionError): GeolocationError {
    let message = 'An unknown error occurred';

    switch (error.code) {
      case error.PERMISSION_DENIED:
        message = 'Location permission denied. Please enable location access in your browser settings.';
        break;
      case error.POSITION_UNAVAILABLE:
        message = 'Location information is unavailable. Please ensure GPS is enabled and you have a clear view of the sky.';
        break;
      case error.TIMEOUT:
        message = 'Location request timed out. Please try again.';
        break;
    }

    return {
      code: error.code,
      message,
    };
  }

  /**
   * Check if geolocation is supported
   */
  isSupported(): boolean {
    return 'geolocation' in navigator;
  }

  /**
   * Get user-friendly error message
   */
  getErrorMessage(code: number): string {
    switch (code) {
      case 1:
        return 'Please enable location access to use this feature';
      case 2:
        return 'Unable to determine your location. Please check your GPS settings';
      case 3:
        return 'Location request timed out. Please try again';
      default:
        return 'An error occurred while getting your location';
    }
  }
}

export const gpsService = new GPSService();
export default gpsService;
