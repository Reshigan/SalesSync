import { describe, it, expect, vi, beforeEach } from 'vitest'
import { shouldRetry, getRetryDelay, retryRequest, addRetryToAxiosConfig } from '../../utils/api-retry'
import { AxiosError } from 'axios'

describe('API Retry Utils - Full Coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  describe('shouldRetry', () => {
    it('should retry on 500 status', () => {
      const error = { response: { status: 500 }, code: '', message: '' } as AxiosError
      expect(shouldRetry(error)).toBe(true)
    })

    it('should retry on 502 status', () => {
      const error = { response: { status: 502 }, code: '', message: '' } as AxiosError
      expect(shouldRetry(error)).toBe(true)
    })

    it('should retry on 503 status', () => {
      const error = { response: { status: 503 }, code: '', message: '' } as AxiosError
      expect(shouldRetry(error)).toBe(true)
    })

    it('should retry on 504 status', () => {
      const error = { response: { status: 504 }, code: '', message: '' } as AxiosError
      expect(shouldRetry(error)).toBe(true)
    })

    it('should retry on 408 status', () => {
      const error = { response: { status: 408 }, code: '', message: '' } as AxiosError
      expect(shouldRetry(error)).toBe(true)
    })

    it('should retry on 429 status', () => {
      const error = { response: { status: 429 }, code: '', message: '' } as AxiosError
      expect(shouldRetry(error)).toBe(true)
    })

    it('should not retry on 400 status', () => {
      const error = { response: { status: 400 }, code: '', message: '' } as AxiosError
      expect(shouldRetry(error)).toBe(false)
    })

    it('should not retry on 401 status', () => {
      const error = { response: { status: 401 }, code: '', message: '' } as AxiosError
      expect(shouldRetry(error)).toBe(false)
    })

    it('should retry on network error ECONNABORTED', () => {
      const error = { code: 'ECONNABORTED', message: 'timeout', response: undefined } as any
      expect(shouldRetry(error)).toBe(true)
    })

    it('should retry on ETIMEDOUT', () => {
      const error = { code: 'ETIMEDOUT', message: '', response: undefined } as any
      expect(shouldRetry(error)).toBe(true)
    })

    it('should retry on ENOTFOUND', () => {
      const error = { code: 'ENOTFOUND', message: '', response: undefined } as any
      expect(shouldRetry(error)).toBe(true)
    })

    it('should retry on ENETUNREACH', () => {
      const error = { code: 'ENETUNREACH', message: '', response: undefined } as any
      expect(shouldRetry(error)).toBe(true)
    })

    it('should retry when message contains error code', () => {
      const error = { code: '', message: 'ECONNABORTED happened', response: undefined } as any
      expect(shouldRetry(error)).toBe(true)
    })

    it('should not retry on unknown network error', () => {
      const error = { code: 'UNKNOWN', message: 'something', response: undefined } as any
      expect(shouldRetry(error)).toBe(false)
    })

    it('should use custom retryable statuses', () => {
      const error = { response: { status: 418 }, code: '', message: '' } as AxiosError
      expect(shouldRetry(error, { retryableStatuses: [418] })).toBe(true)
    })

    it('should use custom retryable errors', () => {
      const error = { code: 'CUSTOM', message: '', response: undefined } as any
      expect(shouldRetry(error, { retryableErrors: ['CUSTOM'] })).toBe(true)
    })
  })

  describe('getRetryDelay', () => {
    it('should return exponential delay for attempt 0', () => {
      const delay = getRetryDelay(0, 1000)
      expect(delay).toBeGreaterThanOrEqual(1000)
      expect(delay).toBeLessThanOrEqual(31000)
    })

    it('should return exponential delay for attempt 1', () => {
      const delay = getRetryDelay(1, 1000)
      expect(delay).toBeGreaterThanOrEqual(2000)
      expect(delay).toBeLessThanOrEqual(31000)
    })

    it('should return exponential delay for attempt 2', () => {
      const delay = getRetryDelay(2, 1000)
      expect(delay).toBeGreaterThanOrEqual(4000)
      expect(delay).toBeLessThanOrEqual(31000)
    })

    it('should cap at 30000ms', () => {
      const delay = getRetryDelay(10, 1000)
      expect(delay).toBeLessThanOrEqual(31000)
    })

    it('should use default base delay', () => {
      const delay = getRetryDelay(0)
      expect(delay).toBeGreaterThanOrEqual(1000)
    })
  })

  describe('retryRequest', () => {
    it('should return result on success', async () => {
      const fn = vi.fn().mockResolvedValue('success')
      const result = await retryRequest(fn)
      expect(result).toBe('success')
      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('should throw on non-retryable error', async () => {
      const error = { response: { status: 400 }, code: '', message: '' }
      const fn = vi.fn().mockRejectedValue(error)
      await expect(retryRequest(fn, { maxRetries: 3 })).rejects.toBeDefined()
      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('should retry on retryable error and eventually succeed', async () => {
      const error = { response: { status: 500 }, code: '', message: '' }
      const fn = vi.fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce('success')
      const result = await retryRequest(fn, { maxRetries: 3, retryDelay: 1 })
      expect(result).toBe('success')
      expect(fn).toHaveBeenCalledTimes(2)
    })

    it('should exhaust retries and throw', async () => {
      const error = { response: { status: 500 }, code: '', message: '' }
      const fn = vi.fn().mockRejectedValue(error)
      await expect(retryRequest(fn, { maxRetries: 1, retryDelay: 1 })).rejects.toBeDefined()
      expect(fn).toHaveBeenCalledTimes(2)
    })
  })

  describe('addRetryToAxiosConfig', () => {
    it('should add retry config to axios config', () => {
      const config = { url: '/test' }
      const result = addRetryToAxiosConfig(config, { maxRetries: 5 })
      expect(result.url).toBe('/test')
      expect((result as any)['axios-retry']).toEqual({ maxRetries: 5 })
    })

    it('should use default config when none provided', () => {
      const config = { url: '/test' }
      const result = addRetryToAxiosConfig(config)
      expect((result as any)['axios-retry']).toBeDefined()
    })
  })
})
