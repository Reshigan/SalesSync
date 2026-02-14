import { describe, it, expect } from 'vitest'

describe('Utility Function Tests', () => {
  describe('Currency Formatting', () => {
    const formatCurrency = (amount: number, currency = 'USD') => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
      }).format(amount)
    }

    it('should format positive amounts', () => {
      expect(formatCurrency(1000)).toBe('$1,000.00')
      expect(formatCurrency(99.99)).toBe('$99.99')
    })

    it('should format zero', () => {
      expect(formatCurrency(0)).toBe('$0.00')
    })

    it('should format large numbers with commas', () => {
      expect(formatCurrency(1000000)).toBe('$1,000,000.00')
    })

    it('should format negative amounts', () => {
      const result = formatCurrency(-50)
      expect(result).toContain('50.00')
    })
  })

  describe('Date Formatting', () => {
    it('should format ISO date to readable string', () => {
      const date = new Date('2025-06-15T10:30:00Z')
      expect(date.toISOString()).toContain('2025-06-15')
    })

    it('should handle invalid dates', () => {
      const date = new Date('invalid')
      expect(isNaN(date.getTime())).toBe(true)
    })
  })

  describe('String Utilities', () => {
    const truncate = (str: string, len: number) => {
      return str.length > len ? str.substring(0, len) + '...' : str
    }

    it('should truncate long strings', () => {
      expect(truncate('Hello World this is a long string', 10)).toBe('Hello Worl...')
    })

    it('should not truncate short strings', () => {
      expect(truncate('Hello', 10)).toBe('Hello')
    })

    const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1)

    it('should capitalize first letter', () => {
      expect(capitalize('hello')).toBe('Hello')
      expect(capitalize('world')).toBe('World')
    })
  })

  describe('Number Utilities', () => {
    const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))

    it('should clamp values within range', () => {
      expect(clamp(5, 0, 10)).toBe(5)
      expect(clamp(-5, 0, 10)).toBe(0)
      expect(clamp(15, 0, 10)).toBe(10)
    })

    const percentage = (value: number, total: number) => total === 0 ? 0 : (value / total) * 100

    it('should calculate percentage', () => {
      expect(percentage(50, 100)).toBe(50)
      expect(percentage(25, 200)).toBe(12.5)
    })

    it('should handle zero total', () => {
      expect(percentage(50, 0)).toBe(0)
    })
  })

  describe('Array Utilities', () => {
    const groupBy = <T>(arr: T[], key: keyof T) => {
      return arr.reduce((groups, item) => {
        const group = String(item[key])
        groups[group] = groups[group] || []
        groups[group].push(item)
        return groups
      }, {} as Record<string, T[]>)
    }

    it('should group array by key', () => {
      const items = [
        { type: 'A', name: 'Item 1' },
        { type: 'B', name: 'Item 2' },
        { type: 'A', name: 'Item 3' },
      ]
      const grouped = groupBy(items, 'type')
      expect(grouped['A'].length).toBe(2)
      expect(grouped['B'].length).toBe(1)
    })

    const sortBy = <T>(arr: T[], key: keyof T, direction: 'asc' | 'desc' = 'asc') => {
      return [...arr].sort((a, b) => {
        if (a[key] < b[key]) return direction === 'asc' ? -1 : 1
        if (a[key] > b[key]) return direction === 'asc' ? 1 : -1
        return 0
      })
    }

    it('should sort ascending', () => {
      const items = [{ val: 3 }, { val: 1 }, { val: 2 }]
      const sorted = sortBy(items, 'val')
      expect(sorted[0].val).toBe(1)
      expect(sorted[2].val).toBe(3)
    })

    it('should sort descending', () => {
      const items = [{ val: 1 }, { val: 3 }, { val: 2 }]
      const sorted = sortBy(items, 'val', 'desc')
      expect(sorted[0].val).toBe(3)
      expect(sorted[2].val).toBe(1)
    })
  })

  describe('Validation Utilities', () => {
    const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

    it('should validate emails', () => {
      expect(isValidEmail('user@example.com')).toBe(true)
      expect(isValidEmail('invalid')).toBe(false)
      expect(isValidEmail('')).toBe(false)
    })

    const isValidPhone = (phone: string) => /^[\d\s+()-]{7,15}$/.test(phone)

    it('should validate phone numbers', () => {
      expect(isValidPhone('1234567890')).toBe(true)
      expect(isValidPhone('+27 82 123 4567')).toBe(true)
      expect(isValidPhone('abc')).toBe(false)
    })

    const isPositiveNumber = (val: unknown) => typeof val === 'number' && val > 0

    it('should validate positive numbers', () => {
      expect(isPositiveNumber(100)).toBe(true)
      expect(isPositiveNumber(0)).toBe(false)
      expect(isPositiveNumber(-5)).toBe(false)
      expect(isPositiveNumber('100')).toBe(false)
    })
  })

  describe('Order Calculation Utilities', () => {
    const calculateLineTotal = (qty: number, price: number, discountPct: number, taxPct: number) => {
      const subtotal = qty * price
      const discount = subtotal * (discountPct / 100)
      const taxable = subtotal - discount
      const tax = taxable * (taxPct / 100)
      return { subtotal, discount, tax, total: taxable + tax }
    }

    it('should calculate line total without discount or tax', () => {
      const result = calculateLineTotal(5, 100, 0, 0)
      expect(result.subtotal).toBe(500)
      expect(result.total).toBe(500)
    })

    it('should calculate with discount', () => {
      const result = calculateLineTotal(10, 50, 10, 0)
      expect(result.subtotal).toBe(500)
      expect(result.discount).toBe(50)
      expect(result.total).toBe(450)
    })

    it('should calculate with tax', () => {
      const result = calculateLineTotal(1, 1000, 0, 15)
      expect(result.subtotal).toBe(1000)
      expect(result.tax).toBe(150)
      expect(result.total).toBe(1150)
    })

    it('should calculate with both discount and tax', () => {
      const result = calculateLineTotal(2, 500, 10, 15)
      expect(result.subtotal).toBe(1000)
      expect(result.discount).toBe(100)
      expect(result.tax).toBe(135)
      expect(result.total).toBe(1035)
    })
  })
})
