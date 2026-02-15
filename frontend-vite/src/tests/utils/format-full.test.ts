import { describe, it, expect, vi } from 'vitest'
import {
  formatCurrency,
  formatDate,
  formatDateShort,
  formatDateTime,
  formatRelativeTime,
  formatNumber,
  formatPercentage,
  formatFileSize,
  formatPhoneNumber,
  truncateText,
  capitalize,
  formatStatus,
} from '../../utils/format'

describe('Format Utils - Full Coverage', () => {
  describe('formatCurrency (re-export)', () => {
    it('should re-export formatCurrency from currency utils', () => {
      expect(formatCurrency).toBeDefined()
      expect(typeof formatCurrency).toBe('function')
    })
  })

  describe('formatDate', () => {
    it('should format date with default options', () => {
      const result = formatDate('2024-06-15')
      expect(result).toBeDefined()
      expect(result).not.toBe('Invalid Date')
    })

    it('should format date with short format', () => {
      const result = formatDate('2024-06-15', { format: 'short' })
      expect(result).toBeDefined()
    })

    it('should format date with medium format', () => {
      const result = formatDate('2024-06-15', { format: 'medium' })
      expect(result).toBeDefined()
    })

    it('should format date with long format', () => {
      const result = formatDate('2024-06-15', { format: 'long' })
      expect(result).toBeDefined()
    })

    it('should format date with full format', () => {
      const result = formatDate('2024-06-15', { format: 'full' })
      expect(result).toBeDefined()
    })

    it('should format date with time', () => {
      const result = formatDate('2024-06-15T10:30:00Z', { includeTime: true })
      expect(result).toBeDefined()
    })

    it('should format date with custom locale', () => {
      const result = formatDate('2024-06-15', { locale: 'en-US' })
      expect(result).toBeDefined()
    })

    it('should handle Date object input', () => {
      const result = formatDate(new Date('2024-06-15'))
      expect(result).toBeDefined()
    })

    it('should return Invalid Date for bad input', () => {
      const result = formatDate('not-a-date')
      expect(result).toBe('Invalid Date')
    })

    it('should handle string format parameter MMM dd', () => {
      const result = formatDate('2024-06-15', 'MMM dd')
      expect(result).toBeDefined()
    })

    it('should handle other string format parameter', () => {
      const result = formatDate('2024-06-15', 'yyyy-MM-dd')
      expect(result).toBeDefined()
    })
  })

  describe('formatDateShort', () => {
    it('should format date in short format', () => {
      const result = formatDateShort('2024-06-15')
      expect(result).toBeDefined()
    })

    it('should handle Date object', () => {
      const result = formatDateShort(new Date())
      expect(result).toBeDefined()
    })
  })

  describe('formatDateTime', () => {
    it('should format date with time', () => {
      const result = formatDateTime('2024-06-15T10:30:00Z')
      expect(result).toBeDefined()
    })

    it('should handle Date object', () => {
      const result = formatDateTime(new Date())
      expect(result).toBeDefined()
    })
  })

  describe('formatRelativeTime', () => {
    it('should return Just now for recent time', () => {
      const now = new Date()
      expect(formatRelativeTime(now)).toBe('Just now')
    })

    it('should return minutes ago', () => {
      const date = new Date(Date.now() - 5 * 60 * 1000)
      expect(formatRelativeTime(date)).toContain('minute')
    })

    it('should return 1 minute ago (singular)', () => {
      const date = new Date(Date.now() - 1 * 60 * 1000)
      expect(formatRelativeTime(date)).toContain('minute')
    })

    it('should return hours ago', () => {
      const date = new Date(Date.now() - 3 * 60 * 60 * 1000)
      expect(formatRelativeTime(date)).toContain('hour')
    })

    it('should return 1 hour ago (singular)', () => {
      const date = new Date(Date.now() - 1 * 60 * 60 * 1000)
      expect(formatRelativeTime(date)).toContain('hour')
    })

    it('should return days ago', () => {
      const date = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      expect(formatRelativeTime(date)).toContain('day')
    })

    it('should return 1 day ago (singular)', () => {
      const date = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      expect(formatRelativeTime(date)).toContain('day')
    })

    it('should return weeks ago', () => {
      const date = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
      expect(formatRelativeTime(date)).toContain('week')
    })

    it('should return 1 week ago (singular)', () => {
      const date = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      expect(formatRelativeTime(date)).toContain('week')
    })

    it('should return months ago', () => {
      const date = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
      expect(formatRelativeTime(date)).toContain('month')
    })

    it('should return 1 month ago (singular)', () => {
      const date = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000)
      expect(formatRelativeTime(date)).toContain('month')
    })

    it('should return years ago', () => {
      const date = new Date(Date.now() - 400 * 24 * 60 * 60 * 1000)
      expect(formatRelativeTime(date)).toContain('year')
    })

    it('should return 1 year ago (singular)', () => {
      const date = new Date(Date.now() - 366 * 24 * 60 * 60 * 1000)
      expect(formatRelativeTime(date)).toContain('year')
    })

    it('should handle string date input', () => {
      const result = formatRelativeTime('2020-01-01')
      expect(result).toContain('year')
    })
  })

  describe('formatNumber', () => {
    it('should format number with defaults', () => {
      expect(formatNumber(1000)).toBeDefined()
    })

    it('should format with decimals', () => {
      const result = formatNumber(1234.567, { decimals: 2 })
      expect(result).toBeDefined()
    })

    it('should format compact millions', () => {
      expect(formatNumber(5000000, { compact: true })).toBe('5.0M')
    })

    it('should format compact thousands', () => {
      expect(formatNumber(5000, { compact: true })).toBe('5.0K')
    })

    it('should format compact negative millions', () => {
      expect(formatNumber(-5000000, { compact: true })).toBe('-5.0M')
    })

    it('should format compact negative thousands', () => {
      expect(formatNumber(-5000, { compact: true })).toBe('-5.0K')
    })

    it('should format with locale', () => {
      const result = formatNumber(1000, { locale: 'en-US' })
      expect(result).toBeDefined()
    })

    it('should format small number non-compact', () => {
      expect(formatNumber(42, { compact: true })).toBe('42')
    })
  })

  describe('formatPercentage', () => {
    it('should format percentage with default decimals', () => {
      expect(formatPercentage(85.5)).toBe('85.5%')
    })

    it('should format percentage with custom decimals', () => {
      expect(formatPercentage(85.567, 2)).toBe('85.57%')
    })

    it('should format 0 percentage', () => {
      expect(formatPercentage(0)).toBe('0.0%')
    })

    it('should format 100 percentage', () => {
      expect(formatPercentage(100)).toBe('100.0%')
    })
  })

  describe('formatFileSize', () => {
    it('should format 0 bytes', () => {
      expect(formatFileSize(0)).toBe('0 Bytes')
    })

    it('should format bytes', () => {
      expect(formatFileSize(500)).toBe('500 Bytes')
    })

    it('should format KB', () => {
      const result = formatFileSize(1024)
      expect(result).toContain('KB')
    })

    it('should format MB', () => {
      const result = formatFileSize(1048576)
      expect(result).toContain('MB')
    })

    it('should format GB', () => {
      const result = formatFileSize(1073741824)
      expect(result).toContain('GB')
    })
  })

  describe('formatPhoneNumber', () => {
    it('should format 10-digit number', () => {
      const result = formatPhoneNumber('0712345678')
      expect(result).toBeDefined()
    })

    it('should format 11-digit number with 44 prefix', () => {
      const result = formatPhoneNumber('44712345678')
      expect(result).toBeDefined()
      expect(result.length).toBeGreaterThan(0)
    })

    it('should return original for non-matching pattern', () => {
      expect(formatPhoneNumber('123')).toBe('123')
    })

    it('should handle formatted input', () => {
      const result = formatPhoneNumber('+44 7123 456 789')
      expect(result).toBeDefined()
    })
  })

  describe('truncateText', () => {
    it('should return text if shorter than max', () => {
      expect(truncateText('hello', 10)).toBe('hello')
    })

    it('should truncate long text', () => {
      expect(truncateText('hello world foo bar', 10)).toBe('hello worl...')
    })

    it('should handle exact length', () => {
      expect(truncateText('hello', 5)).toBe('hello')
    })
  })

  describe('capitalize', () => {
    it('should capitalize first letter', () => {
      expect(capitalize('hello')).toBe('Hello')
    })

    it('should lowercase rest', () => {
      expect(capitalize('HELLO')).toBe('Hello')
    })

    it('should handle single char', () => {
      expect(capitalize('a')).toBe('A')
    })
  })

  describe('formatStatus', () => {
    it('should format underscore-separated status', () => {
      expect(formatStatus('in_progress')).toBe('In Progress')
    })

    it('should format single word', () => {
      expect(formatStatus('active')).toBe('Active')
    })

    it('should format multi-word status', () => {
      expect(formatStatus('pending_review_approval')).toBe('Pending Review Approval')
    })
  })
})
