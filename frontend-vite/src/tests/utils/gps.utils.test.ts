import { describe, it, expect } from 'vitest'
import { haversineDistance, isValidCoordinates, formatCoordinates, formatDistance, isWithinRange, getAccuracyLevel } from '../../utils/gps.utils'

describe('GPS Utilities Tests', () => {
  describe('haversineDistance', () => {
    it('should calculate distance between two points', () => {
      const distance = haversineDistance(6.9271, 79.8612, 7.2906, 80.6337)
      expect(distance).toBeGreaterThan(0)
    })
    it('should return 0 for same point', () => {
      const distance = haversineDistance(6.9271, 79.8612, 6.9271, 79.8612)
      expect(distance).toBe(0)
    })
    it('should handle negative coordinates', () => {
      const distance = haversineDistance(-33.8688, 151.2093, -37.8136, 144.9631)
      expect(distance).toBeGreaterThan(0)
    })
    it('should handle equator crossing', () => {
      const distance = haversineDistance(1, 0, -1, 0)
      expect(distance).toBeGreaterThan(0)
    })
    it('should handle prime meridian crossing', () => {
      const distance = haversineDistance(0, -1, 0, 1)
      expect(distance).toBeGreaterThan(0)
    })
    it('should handle antipodal points', () => {
      const distance = haversineDistance(0, 0, 0, 180)
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
      const distance = haversineDistance(lat1, lon1, lat2, lon2)
      expect(distance).toBeGreaterThanOrEqual(0)
    })
  })

  describe('isValidCoordinates', () => {
    it('should validate valid coordinates', () => {
      expect(isValidCoordinates(6.9271, 79.8612)).toBe(true)
    })
    it('should reject latitude > 90', () => {
      expect(isValidCoordinates(91, 0)).toBe(false)
    })
    it('should reject latitude < -90', () => {
      expect(isValidCoordinates(-91, 0)).toBe(false)
    })
    it('should reject longitude > 180', () => {
      expect(isValidCoordinates(0, 181)).toBe(false)
    })
    it('should reject longitude < -180', () => {
      expect(isValidCoordinates(0, -181)).toBe(false)
    })
    it('should accept boundary latitude 90', () => {
      expect(isValidCoordinates(90, 0)).toBe(true)
    })
    it('should accept boundary latitude -90', () => {
      expect(isValidCoordinates(-90, 0)).toBe(true)
    })
    it('should accept boundary longitude 180', () => {
      expect(isValidCoordinates(0, 180)).toBe(true)
    })
    it('should accept boundary longitude -180', () => {
      expect(isValidCoordinates(0, -180)).toBe(true)
    })
    it('should accept zero coordinates', () => {
      expect(isValidCoordinates(0, 0)).toBe(true)
    })
    const validCoords: [number, number][] = [[-90, -180], [-45, -90], [0, 0], [45, 90], [90, 180]]
    test.each(validCoords)('should accept (%d, %d)', (lat, lon) => {
      expect(isValidCoordinates(lat, lon)).toBe(true)
    })
    const invalidCoords: [number, number][] = [[-91, 0], [91, 0], [0, -181], [0, 181], [100, 200]]
    test.each(invalidCoords)('should reject (%d, %d)', (lat, lon) => {
      expect(isValidCoordinates(lat, lon)).toBe(false)
    })
  })

  describe('formatCoordinates', () => {
    it('should format coordinates', () => {
      const result = formatCoordinates(6.9271, 79.8612)
      expect(result).toBeDefined()
      expect(typeof result).toBe('string')
    })
    it('should format negative coordinates', () => {
      const result = formatCoordinates(-33.8688, 151.2093)
      expect(result).toBeDefined()
    })
    it('should format zero coordinates', () => {
      const result = formatCoordinates(0, 0)
      expect(result).toBeDefined()
    })
  })

  describe('formatDistance', () => {
    it('should format meters', () => {
      const result = formatDistance(500)
      expect(result).toBeDefined()
      expect(typeof result).toBe('string')
    })
    it('should format kilometers', () => {
      const result = formatDistance(5000)
      expect(result).toBeDefined()
    })
    it('should format zero distance', () => {
      const result = formatDistance(0)
      expect(result).toBeDefined()
    })
  })

  describe('isWithinRange', () => {
    it('should return true when within range', () => {
      expect(isWithinRange(5, 10)).toBe(true)
    })
    it('should return false when outside range', () => {
      expect(isWithinRange(15, 10)).toBe(false)
    })
    it('should handle exact boundary', () => {
      expect(isWithinRange(10, 10)).toBe(true)
    })
  })

  describe('getAccuracyLevel', () => {
    it('should return accuracy level for high accuracy', () => {
      const result = getAccuracyLevel(5)
      expect(result).toBeDefined()
      expect(typeof result).toBe('string')
    })
    it('should return accuracy level for low accuracy', () => {
      const result = getAccuracyLevel(100)
      expect(result).toBeDefined()
    })
  })
})
