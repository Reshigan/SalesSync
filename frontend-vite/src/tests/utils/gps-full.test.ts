import { describe, it, expect } from 'vitest'
import {
  haversineDistance,
  formatDistance,
  formatCoordinates,
  isWithinRange,
  verifyLocation,
  getAccuracyLevel,
  getAccuracyColor,
  isValidCoordinates,
} from '../../utils/gps.utils'

describe('GPS Utils - Full Coverage', () => {
  describe('haversineDistance', () => {
    it('should return 0 for same point', () => {
      expect(haversineDistance(0, 0, 0, 0)).toBe(0)
    })

    it('should calculate distance between Johannesburg and Cape Town', () => {
      const dist = haversineDistance(-26.2041, 28.0473, -33.9249, 18.4241)
      expect(dist).toBeGreaterThan(1000000)
      expect(dist).toBeLessThan(2000000)
    })

    it('should calculate short distance', () => {
      const dist = haversineDistance(-26.2041, 28.0473, -26.2042, 28.0474)
      expect(dist).toBeLessThan(100)
    })

    it('should handle antipodal points', () => {
      const dist = haversineDistance(0, 0, 0, 180)
      expect(dist).toBeGreaterThan(20000000)
    })
  })

  describe('formatDistance', () => {
    it('should format meters', () => {
      expect(formatDistance(500)).toBe('500 m')
    })

    it('should format kilometers', () => {
      expect(formatDistance(1500)).toBe('1.5 km')
    })

    it('should round meters', () => {
      expect(formatDistance(5.7)).toBe('6 m')
    })

    it('should format 0 meters', () => {
      expect(formatDistance(0)).toBe('0 m')
    })

    it('should format exactly 1000m as km', () => {
      expect(formatDistance(1000)).toBe('1.0 km')
    })

    it('should format 999m as meters', () => {
      expect(formatDistance(999)).toBe('999 m')
    })
  })

  describe('formatCoordinates', () => {
    it('should format coordinates with 6 decimal places', () => {
      expect(formatCoordinates(-26.2041, 28.0473)).toBe('-26.204100, 28.047300')
    })

    it('should format zero coordinates', () => {
      expect(formatCoordinates(0, 0)).toBe('0.000000, 0.000000')
    })
  })

  describe('isWithinRange', () => {
    it('should return true when within default threshold', () => {
      expect(isWithinRange(5)).toBe(true)
    })

    it('should return false when outside default threshold', () => {
      expect(isWithinRange(15)).toBe(false)
    })

    it('should return true at exact threshold', () => {
      expect(isWithinRange(10)).toBe(true)
    })

    it('should use custom threshold', () => {
      expect(isWithinRange(50, 100)).toBe(true)
      expect(isWithinRange(150, 100)).toBe(false)
    })
  })

  describe('verifyLocation', () => {
    it('should verify within range', () => {
      const result = verifyLocation(-26.2041, 28.0473, -26.2041, 28.0473)
      expect(result.isWithinRange).toBe(true)
      expect(result.distance).toBe(0)
      expect(result.accuracy).toBe('meters')
    })

    it('should verify out of range', () => {
      const result = verifyLocation(-26.2041, 28.0473, -26.2050, 28.0480, 10)
      expect(result.distance).toBeGreaterThan(0)
    })

    it('should use custom threshold', () => {
      const result = verifyLocation(-26.2041, 28.0473, -26.2042, 28.0474, 1000)
      expect(result.isWithinRange).toBe(true)
    })
  })

  describe('getAccuracyLevel', () => {
    it('should return High for <= 10', () => {
      expect(getAccuracyLevel(5)).toBe('High')
      expect(getAccuracyLevel(10)).toBe('High')
    })

    it('should return Medium for <= 50', () => {
      expect(getAccuracyLevel(25)).toBe('Medium')
      expect(getAccuracyLevel(50)).toBe('Medium')
    })

    it('should return Low for > 50', () => {
      expect(getAccuracyLevel(51)).toBe('Low')
      expect(getAccuracyLevel(100)).toBe('Low')
    })
  })

  describe('getAccuracyColor', () => {
    it('should return green for <= 10', () => {
      expect(getAccuracyColor(5)).toBe('green')
      expect(getAccuracyColor(10)).toBe('green')
    })

    it('should return yellow for <= 50', () => {
      expect(getAccuracyColor(25)).toBe('yellow')
      expect(getAccuracyColor(50)).toBe('yellow')
    })

    it('should return red for > 50', () => {
      expect(getAccuracyColor(51)).toBe('red')
      expect(getAccuracyColor(100)).toBe('red')
    })
  })

  describe('isValidCoordinates', () => {
    it('should validate correct coordinates', () => {
      expect(isValidCoordinates(-26.2041, 28.0473)).toBe(true)
      expect(isValidCoordinates(0, 0)).toBe(true)
      expect(isValidCoordinates(90, 180)).toBe(true)
      expect(isValidCoordinates(-90, -180)).toBe(true)
    })

    it('should reject invalid latitude', () => {
      expect(isValidCoordinates(91, 0)).toBe(false)
      expect(isValidCoordinates(-91, 0)).toBe(false)
    })

    it('should reject invalid longitude', () => {
      expect(isValidCoordinates(0, 181)).toBe(false)
      expect(isValidCoordinates(0, -181)).toBe(false)
    })
  })
})
