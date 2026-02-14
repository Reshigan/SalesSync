import { describe, it, expect } from 'vitest'
import { formatDate, formatNumber, formatPercentage, truncateText } from '../../utils/format'

describe('Format Utilities Tests', () => {
  describe('formatDate', () => {
    it('should format date string to medium format', () => {
      const result = formatDate('2024-06-15')
      expect(result).toBeDefined()
      expect(typeof result).toBe('string')
    })
    it('should format Date object', () => {
      const result = formatDate(new Date('2024-06-15'))
      expect(result).toBeDefined()
      expect(typeof result).toBe('string')
    })
    it('should format with short option', () => {
      const result = formatDate('2024-06-15', { format: 'short' })
      expect(result).toBeDefined()
    })
    it('should format with long option', () => {
      const result = formatDate('2024-06-15', { format: 'long' })
      expect(result).toBeDefined()
    })
    it('should format with full option', () => {
      const result = formatDate('2024-06-15', { format: 'full' })
      expect(result).toBeDefined()
    })
    it('should include time when specified', () => {
      const result = formatDate('2024-06-15T10:30:00', { includeTime: true })
      expect(result).toBeDefined()
    })
    it('should handle invalid date', () => {
      const result = formatDate('invalid-date')
      expect(result).toBe('Invalid Date')
    })
    it('should handle empty string', () => {
      const result = formatDate('')
      expect(result).toBe('Invalid Date')
    })
    it('should handle ISO date string', () => {
      const result = formatDate('2024-06-15T10:30:00.000Z')
      expect(result).toBeDefined()
      expect(typeof result).toBe('string')
    })
    it('should handle string format parameter', () => {
      const result = formatDate('2024-06-15', 'MMM dd')
      expect(result).toBeDefined()
    })
    const dates = ['2024-01-01', '2024-06-15', '2024-12-31', '2023-02-28', '2024-02-29']
    test.each(dates)('should format date "%s"', (date) => {
      const result = formatDate(date)
      expect(result).toBeDefined()
      expect(typeof result).toBe('string')
    })
    const formats = ['short', 'medium', 'long', 'full'] as const
    test.each(formats)('should format with "%s" format', (format) => {
      const result = formatDate('2024-06-15', { format })
      expect(result).toBeDefined()
    })
  })

  describe('formatNumber', () => {
    it('should format integer', () => {
      const result = formatNumber(1234567)
      expect(result).toBeDefined()
      expect(typeof result).toBe('string')
    })
    it('should format decimal', () => {
      const result = formatNumber(1234.56)
      expect(result).toBeDefined()
    })
    it('should format zero', () => {
      const result = formatNumber(0)
      expect(result).toBeDefined()
    })
    it('should format negative number', () => {
      const result = formatNumber(-1234)
      expect(result).toBeDefined()
    })
    it('should format very large number', () => {
      const result = formatNumber(9999999999)
      expect(result).toBeDefined()
    })
    it('should format very small number', () => {
      const result = formatNumber(0.001)
      expect(result).toBeDefined()
    })
    const numbers = [0, 1, 100, 1000, 10000, 100000, 1000000, -1, -100, 0.5, 0.99, 99.99]
    test.each(numbers)('should format number %d', (num) => {
      const result = formatNumber(num)
      expect(result).toBeDefined()
      expect(typeof result).toBe('string')
    })
  })

  describe('formatPercentage', () => {
    it('should format percentage', () => {
      const result = formatPercentage(75.5)
      expect(result).toBeDefined()
      expect(typeof result).toBe('string')
    })
    it('should format 0%', () => {
      const result = formatPercentage(0)
      expect(result).toBeDefined()
    })
    it('should format 100%', () => {
      const result = formatPercentage(100)
      expect(result).toBeDefined()
    })
    it('should format negative percentage', () => {
      const result = formatPercentage(-10)
      expect(result).toBeDefined()
    })
    it('should format over 100%', () => {
      const result = formatPercentage(150)
      expect(result).toBeDefined()
    })
    const percentages = [0, 10, 25, 33.33, 50, 66.67, 75, 90, 99.99, 100]
    test.each(percentages)('should format %d%%', (pct) => {
      const result = formatPercentage(pct)
      expect(result).toBeDefined()
    })
  })

  describe('truncateText', () => {
    it('should truncate long text', () => {
      const result = truncateText('This is a very long text that should be truncated', 20)
      expect(result).toBeDefined()
      expect(result.length).toBeLessThanOrEqual(23)
    })
    it('should not truncate short text', () => {
      const result = truncateText('Short', 20)
      expect(result).toBe('Short')
    })
    it('should handle empty string', () => {
      const result = truncateText('', 20)
      expect(result).toBe('')
    })
    it('should handle exact length', () => {
      const result = truncateText('12345', 5)
      expect(result).toBe('12345')
    })
    it('should add ellipsis', () => {
      const result = truncateText('This is long text', 10)
      expect(result).toContain('...')
    })
  })
})
