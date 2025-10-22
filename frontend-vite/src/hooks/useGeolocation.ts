/**
 * useGeolocation Hook
 * React hook for geolocation tracking
 */

import { useState, useEffect, useCallback } from 'react';
import gpsService, { type GeolocationError } from '../services/gps.service';
import type { Coordinates } from '../utils/gps.utils';

interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  watch?: boolean;
}

interface UseGeolocationReturn {
  position: Coordinates | null;
  error: GeolocationError | null;
  loading: boolean;
  getCurrentPosition: () => Promise<void>;
  watchPosition: () => void;
  clearWatch: () => void;
  isSupported: boolean;
}

export function useGeolocation(options: UseGeolocationOptions = {}): UseGeolocationReturn {
  const {
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 0,
    watch = false,
  } = options;

  const [position, setPosition] = useState<Coordinates | null>(null);
  const [error, setError] = useState<GeolocationError | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const isSupported = gpsService.isSupported();

  const getCurrentPosition = useCallback(async () => {
    if (!isSupported) {
      setError({
        code: 0,
        message: 'Geolocation is not supported by this browser',
      });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const coords = await gpsService.getCurrentPosition(timeout, maximumAge, enableHighAccuracy);
      setPosition(coords);
    } catch (err) {
      setError(err as GeolocationError);
    } finally {
      setLoading(false);
    }
  }, [isSupported, timeout, maximumAge, enableHighAccuracy]);

  const watchPosition = useCallback(() => {
    if (!isSupported) {
      setError({
        code: 0,
        message: 'Geolocation is not supported by this browser',
      });
      return;
    }

    setLoading(true);
    setError(null);

    gpsService.watchPosition(
      (coords) => {
        setPosition(coords);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      },
      enableHighAccuracy
    );
  }, [isSupported, enableHighAccuracy]);

  const clearWatch = useCallback(() => {
    gpsService.clearWatch();
  }, []);

  // Auto-watch on mount if watch option is enabled
  useEffect(() => {
    if (watch) {
      watchPosition();
    } else {
      getCurrentPosition();
    }

    return () => {
      if (watch) {
        clearWatch();
      }
    };
  }, [watch, watchPosition, getCurrentPosition, clearWatch]);

  return {
    position,
    error,
    loading,
    getCurrentPosition,
    watchPosition,
    clearWatch,
    isSupported,
  };
}

export default useGeolocation;
