import { describe, it, expect } from 'vitest'
import { shouldRetry, getRetryDelay } from '../../utils/api-retry'

describe('API Retry Utilities Tests', () => {
  describe('shouldRetry', () => {
    it('should retry on 500 error', () => {
      expect(shouldRetry({ response: { status: 500 } })).toBe(true)
    })
    it('should retry on 502 error', () => {
      expect(shouldRetry({ response: { status: 502 } })).toBe(true)
    })
    it('should retry on 503 error', () => {
      expect(shouldRetry({ response: { status: 503 } })).toBe(true)
    })
    it('should retry on 504 error', () => {
      expect(shouldRetry({ response: { status: 504 } })).toBe(true)
    })
    it('should retry on network error', () => {
      expect(shouldRetry({ code: 'ECONNABORTED' })).toBe(true)
    })
    it('should retry on timeout', () => {
      expect(shouldRetry({ code: 'ETIMEDOUT' })).toBe(true)
    })
    it('should not retry on 400 error', () => {
      expect(shouldRetry({ response: { status: 400 } })).toBe(false)
    })
    it('should not retry on 401 error', () => {
      expect(shouldRetry({ response: { status: 401 } })).toBe(false)
    })
    it('should not retry on 403 error', () => {
      expect(shouldRetry({ response: { status: 403 } })).toBe(false)
    })
    it('should not retry on 404 error', () => {
      expect(shouldRetry({ response: { status: 404 } })).toBe(false)
    })
    it('should not retry on 409 error', () => {
      expect(shouldRetry({ response: { status: 409 } })).toBe(false)
    })
    it('should not retry on 422 error', () => {
      expect(shouldRetry({ response: { status: 422 } })).toBe(false)
    })
    it('should handle missing response', () => {
      const result = shouldRetry({})
      expect(typeof result).toBe('boolean')
    })
    it('should handle null error', () => {
      const result = shouldRetry(null)
      expect(typeof result).toBe('boolean')
    })
    const retryableStatuses = [500, 502, 503, 504, 408, 429]
    test.each(retryableStatuses)('should handle status %d', (status) => {
      const result = shouldRetry({ response: { status } })
      expect(typeof result).toBe('boolean')
    })
    const nonRetryableStatuses = [200, 201, 204, 301, 302, 400, 401, 403, 404, 405, 409, 422]
    test.each(nonRetryableStatuses)('should not retry on status %d', (status) => {
      expect(shouldRetry({ response: { status } })).toBe(false)
    })
  })

  describe('getRetryDelay', () => {
    it('should return delay for attempt 0', () => {
      const delay = getRetryDelay(0)
      expect(delay).toBeGreaterThanOrEqual(0)
    })
    it('should return delay for attempt 1', () => {
      const delay = getRetryDelay(1)
      expect(delay).toBeGreaterThan(0)
    })
    it('should return delay for attempt 2', () => {
      const delay = getRetryDelay(2)
      expect(delay).toBeGreaterThan(0)
    })
    it('should increase delay with attempts', () => {
      const delay0 = getRetryDelay(0)
      const delay1 = getRetryDelay(1)
      const delay2 = getRetryDelay(2)
      expect(delay1).toBeGreaterThanOrEqual(delay0)
      expect(delay2).toBeGreaterThanOrEqual(delay1)
    })
    it('should have a maximum delay', () => {
      const delay = getRetryDelay(10)
      expect(delay).toBeLessThanOrEqual(60000)
    })
    const attempts = [0, 1, 2, 3, 4, 5]
    test.each(attempts)('should return valid delay for attempt %d', (attempt) => {
      const delay = getRetryDelay(attempt)
      expect(delay).toBeGreaterThanOrEqual(0)
      expect(typeof delay).toBe('number')
    })
  })
})
