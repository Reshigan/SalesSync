import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiClient } from '../../services/api.service'

vi.mock('../../services/api.service', () => ({
  apiClient: { post: vi.fn(), get: vi.fn(), put: vi.fn(), delete: vi.fn(), patch: vi.fn(), interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } } }, ApiService: vi.fn().mockImplementation(() => ({ get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn(), patch: vi.fn() })), apiService: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn(), patch: vi.fn() }, buildQueryString: vi.fn((p) => ''), buildUrl: vi.fn((u) => u), isApiError: vi.fn(() => false), getErrorMessage: vi.fn(() => ''), getErrorCode: vi.fn(() => ''),
}))
vi.mock('../../store/auth.store', () => ({ getAuthToken: vi.fn(() => 'mock-token'), useAuthStore: { getState: vi.fn(() => ({ tokens: { access_token: 'mock' } })) } }))
vi.mock('../../services/tenant.service', () => ({ tenantService: { getCurrentTenant: vi.fn(() => 'test-tenant') } }))

describe('GPS Service Tests', () => {
  beforeEach(() => { vi.clearAllMocks() })

  describe('getAgentLocations', () => {
    it('should fetch agent locations', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: [] } })
      const { gpsService } = await import('../../services/gps.service')
      const result = await gpsService.getAgentLocations()
      expect(apiClient.get).toHaveBeenCalled()
      expect(result).toBeDefined()
    })
    it('should fetch with agent filter', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: [] } })
      const { gpsService } = await import('../../services/gps.service')
      await gpsService.getAgentLocations({ agent_id: 'a1' })
      expect(apiClient.get).toHaveBeenCalled()
    })
    it('should handle network error', async () => {
      (apiClient.get as any).mockRejectedValue(new Error('Network Error'))
      const { gpsService } = await import('../../services/gps.service')
      await expect(gpsService.getAgentLocations()).rejects.toThrow()
    })
  })

  describe('trackLocation', () => {
    it('should send location data', async () => {
      (apiClient.post as any).mockResolvedValue({ data: { success: true } })
      const { gpsService } = await import('../../services/gps.service')
      const result = await gpsService.trackLocation({ latitude: 6.9271, longitude: 79.8612, accuracy: 5 })
      expect(apiClient.post).toHaveBeenCalled()
      expect(result).toBeDefined()
    })
    it('should handle invalid coordinates', async () => {
      (apiClient.post as any).mockRejectedValue({ response: { status: 400 } })
      const { gpsService } = await import('../../services/gps.service')
      await expect(gpsService.trackLocation({ latitude: 999, longitude: 999, accuracy: 5 })).rejects.toBeDefined()
    })
    it('should handle batch location data', async () => {
      (apiClient.post as any).mockResolvedValue({ data: { success: true } })
      const { gpsService } = await import('../../services/gps.service')
      const result = await gpsService.trackLocation({ latitude: 6.9271, longitude: 79.8612, accuracy: 5, batch: true })
      expect(apiClient.post).toHaveBeenCalled()
      expect(result).toBeDefined()
    })
  })

  describe('getLocationHistory', () => {
    it('should fetch location history', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: [] } })
      const { gpsService } = await import('../../services/gps.service')
      const result = await gpsService.getLocationHistory('a1')
      expect(apiClient.get).toHaveBeenCalled()
      expect(result).toBeDefined()
    })
    it('should fetch with date filter', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: [] } })
      const { gpsService } = await import('../../services/gps.service')
      await gpsService.getLocationHistory('a1', { date: '2024-06-15' })
      expect(apiClient.get).toHaveBeenCalled()
    })
    it('should handle error', async () => {
      (apiClient.get as any).mockRejectedValue({ response: { status: 500 } })
      const { gpsService } = await import('../../services/gps.service')
      await expect(gpsService.getLocationHistory('a1')).rejects.toBeDefined()
    })
  })

  describe('getGeofences', () => {
    it('should fetch geofences', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: [] } })
      const { gpsService } = await import('../../services/gps.service')
      const result = await gpsService.getGeofences()
      expect(apiClient.get).toHaveBeenCalled()
      expect(result).toBeDefined()
    })
    it('should handle error', async () => {
      (apiClient.get as any).mockRejectedValue({ response: { status: 500 } })
      const { gpsService } = await import('../../services/gps.service')
      await expect(gpsService.getGeofences()).rejects.toBeDefined()
    })
  })
})
