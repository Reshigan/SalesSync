import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiClient } from '../../services/api.service'

vi.mock('../../services/api.service', () => ({
  apiClient: { post: vi.fn(), get: vi.fn(), put: vi.fn(), delete: vi.fn(), interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } } },
}))
vi.mock('../../store/auth.store', () => ({ getAuthToken: vi.fn(() => 'mock-token'), useAuthStore: { getState: vi.fn(() => ({ tokens: { access_token: 'mock' } })) } }))
vi.mock('../../services/tenant.service', () => ({ tenantService: { getCurrentTenant: vi.fn(() => 'test-tenant') } }))

describe('Visits Service Tests', () => {
  beforeEach(() => { vi.clearAllMocks() })

  describe('getVisits', () => {
    it('should fetch visits list', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: [], total: 0 } })
      const { visitsService } = await import('../../services/visits.service')
      const result = await visitsService.getVisits()
      expect(apiClient.get).toHaveBeenCalled()
      expect(result).toBeDefined()
    })
    it('should fetch with agent filter', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: [], total: 0 } })
      const { visitsService } = await import('../../services/visits.service')
      await visitsService.getVisits({ agent_id: 'a1' })
      expect(apiClient.get).toHaveBeenCalled()
    })
    it('should fetch with date filter', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: [], total: 0 } })
      const { visitsService } = await import('../../services/visits.service')
      await visitsService.getVisits({ date: '2024-06-15' })
      expect(apiClient.get).toHaveBeenCalled()
    })
    it('should fetch with status filter', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: [], total: 0 } })
      const { visitsService } = await import('../../services/visits.service')
      await visitsService.getVisits({ status: 'completed' })
      expect(apiClient.get).toHaveBeenCalled()
    })
    it('should fetch with customer filter', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: [], total: 0 } })
      const { visitsService } = await import('../../services/visits.service')
      await visitsService.getVisits({ customer_id: 'c1' })
      expect(apiClient.get).toHaveBeenCalled()
    })
    it('should handle pagination', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: [], total: 0 } })
      const { visitsService } = await import('../../services/visits.service')
      await visitsService.getVisits({ page: 1, limit: 10 })
      expect(apiClient.get).toHaveBeenCalled()
    })
    it('should handle network error', async () => {
      (apiClient.get as any).mockRejectedValue(new Error('Network Error'))
      const { visitsService } = await import('../../services/visits.service')
      await expect(visitsService.getVisits()).rejects.toThrow()
    })
    it('should handle server error', async () => {
      (apiClient.get as any).mockRejectedValue({ response: { status: 500 } })
      const { visitsService } = await import('../../services/visits.service')
      await expect(visitsService.getVisits()).rejects.toBeDefined()
    })
    const statuses = ['planned', 'in_progress', 'completed', 'cancelled', 'missed']
    test.each(statuses)('should filter by status "%s"', async (status) => {
      (apiClient.get as any).mockResolvedValue({ data: { data: [], total: 0 } })
      const { visitsService } = await import('../../services/visits.service')
      await visitsService.getVisits({ status })
      expect(apiClient.get).toHaveBeenCalled()
    })
  })

  describe('getVisit', () => {
    it('should fetch single visit', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: { id: '1', customer_id: 'c1' } } })
      const { visitsService } = await import('../../services/visits.service')
      const result = await visitsService.getVisit('1')
      expect(apiClient.get).toHaveBeenCalled()
      expect(result).toBeDefined()
    })
    it('should handle non-existent visit', async () => {
      (apiClient.get as any).mockRejectedValue({ response: { status: 404 } })
      const { visitsService } = await import('../../services/visits.service')
      await expect(visitsService.getVisit('non-existent')).rejects.toBeDefined()
    })
  })

  describe('createVisit', () => {
    it('should create visit', async () => {
      (apiClient.post as any).mockResolvedValue({ data: { data: { id: '1' } } })
      const { visitsService } = await import('../../services/visits.service')
      const result = await visitsService.createVisit({ customer_id: 'c1', planned_date: '2024-06-15', purpose: 'Sales call' })
      expect(apiClient.post).toHaveBeenCalled()
      expect(result).toBeDefined()
    })
    it('should handle validation error', async () => {
      (apiClient.post as any).mockRejectedValue({ response: { status: 400 } })
      const { visitsService } = await import('../../services/visits.service')
      await expect(visitsService.createVisit({ customer_id: '', planned_date: '', purpose: '' })).rejects.toBeDefined()
    })
  })

  describe('updateVisit', () => {
    it('should update visit', async () => {
      (apiClient.put as any).mockResolvedValue({ data: { data: { id: '1' } } })
      const { visitsService } = await import('../../services/visits.service')
      await visitsService.updateVisit('1', { status: 'completed' })
      expect(apiClient.put).toHaveBeenCalled()
    })
    it('should handle error', async () => {
      (apiClient.put as any).mockRejectedValue({ response: { status: 404 } })
      const { visitsService } = await import('../../services/visits.service')
      await expect(visitsService.updateVisit('non-existent', { status: 'completed' })).rejects.toBeDefined()
    })
  })

  describe('checkIn', () => {
    it('should check in to visit', async () => {
      (apiClient.post as any).mockResolvedValue({ data: { data: { id: '1' } } })
      const { visitsService } = await import('../../services/visits.service')
      const result = await visitsService.checkIn('1', { latitude: 6.9271, longitude: 79.8612 })
      expect(apiClient.post).toHaveBeenCalled()
      expect(result).toBeDefined()
    })
    it('should handle invalid coordinates', async () => {
      (apiClient.post as any).mockRejectedValue({ response: { status: 400 } })
      const { visitsService } = await import('../../services/visits.service')
      await expect(visitsService.checkIn('1', { latitude: 999, longitude: 999 })).rejects.toBeDefined()
    })
  })

  describe('checkOut', () => {
    it('should check out of visit', async () => {
      (apiClient.post as any).mockResolvedValue({ data: { data: { id: '1' } } })
      const { visitsService } = await import('../../services/visits.service')
      const result = await visitsService.checkOut('1', { latitude: 6.9271, longitude: 79.8612, notes: 'Completed' })
      expect(apiClient.post).toHaveBeenCalled()
      expect(result).toBeDefined()
    })
    it('should handle error', async () => {
      (apiClient.post as any).mockRejectedValue({ response: { status: 400 } })
      const { visitsService } = await import('../../services/visits.service')
      await expect(visitsService.checkOut('1', { latitude: 0, longitude: 0 })).rejects.toBeDefined()
    })
  })

  describe('getVisitStats', () => {
    it('should fetch visit statistics', async () => {
      (apiClient.get as any).mockResolvedValue({ data: { data: { total: 100, completed: 80 } } })
      const { visitsService } = await import('../../services/visits.service')
      const result = await visitsService.getVisitStats()
      expect(apiClient.get).toHaveBeenCalled()
      expect(result).toBeDefined()
    })
    it('should handle error', async () => {
      (apiClient.get as any).mockRejectedValue({ response: { status: 500 } })
      const { visitsService } = await import('../../services/visits.service')
      await expect(visitsService.getVisitStats()).rejects.toBeDefined()
    })
  })
})
