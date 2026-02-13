import { describe, it, expect } from 'vitest'
import { calculateDistance, isValidCoordinate, formatCoordinate, getBounds } from '../../utils/gps.utils'

describe('GPS Utilities Tests', () => {
  describe('calculateDistance', () => {
    it('should calculate distance between two points', () => {
      const distance = calculateDistance(6.9271, 79.8612, 7.2906, 80.6337)
      expect(distance).toBeGreaterThan(0)
    })
    it('should return 0 for same point', () => {
      const distance = calculateDistance(6.9271, 79.8612, 6.9271, 79.8612)
      expect(distance).toBe(0)
    })
    it('should handle negative coordinates', () => {
      const distance = calculateDistance(-33.8688, 151.2093, -37.8136, 144.9631)
      expect(distance).toBeGreaterThan(0)
    })
    it('should handle equator crossing', () => {
      const distance = calculateDistance(1, 0, -1, 0)
      expect(distance).toBeGreaterThan(0)
    })
    it('should handle prime meridian crossing', () => {
      const distance = calculateDistance(0, -1, 0, 1)
      expect(distance).toBeGreaterThan(0)
    })
    it('should handle antipodal points', () => {
      const distance = calculateDistance(0, 0, 0, 180)
      expect(distance).toBeGreaterThan(0)
    })
    const pointPairs = [
      [0, 0, 0, 0],
      [6.9271, 79.8612, 7.2906, 80.6337],
      [40.7128, -74.0060, 51.5074, -0.1278],
      [35.6762, 139.6503, 37.5665, 126.9780],
      [-33.8688, 151.2093, -37.8136, 144.9631],
    ]
    test.each(pointPairs)('should calculate distance from (%d,%d) to (%d,%d)', (lat1, lon1, lat2, lon2) => {
      const distance = calculateDistance(lat1, lon1, lat2, lon2)
      expect(distance).toBeGreaterThanOrEqual(0)
    })
  })

  describe('isValidCoordinate', () => {
    it('should validate valid latitude', () => {
      expect(isValidCoordinate(6.9271, 'latitude')).toBe(true)
    })
    it('should validate valid longitude', () => {
      expect(isValidCoordinate(79.8612, 'longitude')).toBe(true)
    })
    it('should reject latitude > 90', () => {
      expect(isValidCoordinate(91, 'latitude')).toBe(false)
    })
    it('should reject latitude < -90', () => {
      expect(isValidCoordinate(-91, 'latitude')).toBe(false)
    })
    it('should reject longitude > 180', () => {
      expect(isValidCoordinate(181, 'longitude')).toBe(false)
    })
    it('should reject longitude < -180', () => {
      expect(isValidCoordinate(-181, 'longitude')).toBe(false)
    })
    it('should accept boundary latitude 90', () => {
      expect(isValidCoordinate(90, 'latitude')).toBe(true)
    })
    it('should accept boundary latitude -90', () => {
      expect(isValidCoordinate(-90, 'latitude')).toBe(true)
    })
    it('should accept boundary longitude 180', () => {
      expect(isValidCoordinate(180, 'longitude')).toBe(true)
    })
    it('should accept boundary longitude -180', () => {
      expect(isValidCoordinate(-180, 'longitude')).toBe(true)
    })
    it('should accept zero latitude', () => {
      expect(isValidCoordinate(0, 'latitude')).toBe(true)
    })
    it('should accept zero longitude', () => {
      expect(isValidCoordinate(0, 'longitude')).toBe(true)
    })
    const validLatitudes = [-90, -45, -1, 0, 1, 45, 90]
    test.each(validLatitudes)('should accept latitude %d', (lat) => {
      expect(isValidCoordinate(lat, 'latitude')).toBe(true)
    })
    const invalidLatitudes = [-91, -100, -180, 91, 100, 180, 999]
    test.each(invalidLatitudes)('should reject latitude %d', (lat) => {
      expect(isValidCoordinate(lat, 'latitude')).toBe(false)
    })
    const validLongitudes = [-180, -90, -1, 0, 1, 90, 180]
    test.each(validLongitudes)('should accept longitude %d', (lon) => {
      expect(isValidCoordinate(lon, 'longitude')).toBe(true)
    })
    const invalidLongitudes = [-181, -200, -360, 181, 200, 360, 999]
    test.each(invalidLongitudes)('should reject longitude %d', (lon) => {
      expect(isValidCoordinate(lon, 'longitude')).toBe(false)
    })
  })

  describe('formatCoordinate', () => {
    it('should format latitude', () => {
      const result = formatCoordinate(6.9271, 'latitude')
      expect(result).toBeDefined()
      expect(typeof result).toBe('string')
    })
    it('should format longitude', () => {
      const result = formatCoordinate(79.8612, 'longitude')
      expect(result).toBeDefined()
    })
    it('should format negative latitude (South)', () => {
      const result = formatCoordinate(-33.8688, 'latitude')
      expect(result).toBeDefined()
    })
    it('should format negative longitude (West)', () => {
      const result = formatCoordinate(-74.0060, 'longitude')
      expect(result).toBeDefined()
    })
    it('should format zero coordinate', () => {
      const result = formatCoordinate(0, 'latitude')
      expect(result).toBeDefined()
    })
  })

  describe('getBounds', () => {
    it('should get bounds for points', () => {
      const bounds = getBounds([
        { latitude: 6.9271, longitude: 79.8612 },
        { latitude: 7.2906, longitude: 80.6337 },
      ])
      expect(bounds).toBeDefined()
    })
    it('should handle single point', () => {
      const bounds = getBounds([{ latitude: 6.9271, longitude: 79.8612 }])
      expect(bounds).toBeDefined()
    })
    it('should handle empty array', () => {
      const bounds = getBounds([])
      expect(bounds).toBeDefined()
    })
  })
})
