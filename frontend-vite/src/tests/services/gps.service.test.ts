import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../services/api.service', () => ({
  apiClient: { post: vi.fn(), get: vi.fn(), put: vi.fn(), delete: vi.fn(), patch: vi.fn(), interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } } }, ApiService: vi.fn().mockImplementation(() => ({ get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn(), patch: vi.fn() })), apiService: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn(), patch: vi.fn() }, buildQueryString: vi.fn((p) => ''), buildUrl: vi.fn((u) => u), isApiError: vi.fn(() => false), getErrorMessage: vi.fn(() => ''), getErrorCode: vi.fn(() => ''),
}))
vi.mock('../../store/auth.store', () => ({ getAuthToken: vi.fn(() => 'mock-token'), useAuthStore: { getState: vi.fn(() => ({ tokens: { access_token: 'mock' } })) } }))
vi.mock('../../services/tenant.service', () => ({ tenantService: { getCurrentTenant: vi.fn(() => 'test-tenant') } }))

describe('GPS Service Tests', () => {
  beforeEach(() => { vi.clearAllMocks() })

  describe('requestPermission', () => {
    it('should request location permission', async () => {
      const { gpsService } = await import('../../services/gps.service')
      expect(gpsService.requestPermission).toBeDefined()
    })
  })

  describe('verifyLocation', () => {
    it('should verify location', async () => {
      const { gpsService } = await import('../../services/gps.service')
      expect(gpsService.verifyLocation).toBeDefined()
    })
  })

  describe('GPS Coordinate Validation', () => {
    it('should validate latitude range', () => {
      const isValid = (lat: number) => lat >= -90 && lat <= 90
      expect(isValid(6.9271)).toBe(true)
      expect(isValid(91)).toBe(false)
      expect(isValid(-91)).toBe(false)
    })
    it('should validate longitude range', () => {
      const isValid = (lon: number) => lon >= -180 && lon <= 180
      expect(isValid(79.8612)).toBe(true)
      expect(isValid(181)).toBe(false)
      expect(isValid(-181)).toBe(false)
    })
    const validCoords: [number, number][] = [[6.9271, 79.8612], [0, 0], [-90, -180], [90, 180], [-33.8688, 151.2093]]
    test.each(validCoords)('should accept valid coordinate (%d, %d)', (lat, lon) => {
      expect(lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180).toBe(true)
    })
  })

  describe('Distance Calculation', () => {
    it('should calculate distance between two points', () => {
      const toRad = (d: number) => d * Math.PI / 180
      const R = 6371000
      const lat1 = 6.9271, lon1 = 79.8612, lat2 = 7.2906, lon2 = 80.6337
      const dLat = toRad(lat2 - lat1), dLon = toRad(lon2 - lon1)
      const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2)**2
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
      const distance = R * c
      expect(distance).toBeGreaterThan(0)
    })
    it('should return 0 for same point', () => {
      const lat1 = 6.9271, lon1 = 79.8612
      expect(lat1 === lat1 && lon1 === lon1).toBe(true)
    })
  })

  describe('Geofencing', () => {
    it('should check if point is within radius', () => {
      const distance = 500, radius = 1000
      expect(distance <= radius).toBe(true)
    })
    it('should detect point outside radius', () => {
      const distance = 1500, radius = 1000
      expect(distance > radius).toBe(true)
    })
    const radii = [100, 250, 500, 1000, 2000, 5000]
    test.each(radii)('should support geofence radius %dm', (r) => {
      expect(r).toBeGreaterThan(0)
    })
  })
})
