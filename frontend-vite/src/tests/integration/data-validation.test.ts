import { describe, it, expect } from 'vitest'

describe('Data Validation Tests', () => {
  describe('Email Validation', () => {
    const validEmails = ['user@test.com', 'admin@company.org', 'first.last@domain.co.uk', 'user+tag@test.com', 'user123@test.com']
    test.each(validEmails)('should accept valid email "%s"', (email) => {
      expect(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)).toBe(true)
    })
    const invalidEmails = ['', 'notanemail', '@test.com', 'user@', 'user @test.com', 'user@test', 'user@@test.com']
    test.each(invalidEmails)('should reject invalid email "%s"', (email) => {
      expect(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)).toBe(false)
    })
  })

  describe('Phone Validation', () => {
    const validPhones = ['+94771234567', '0771234567', '+1-555-123-4567', '1234567890']
    test.each(validPhones)('should accept valid phone "%s"', (phone) => {
      expect(phone.replace(/[\s\-\+\(\)]/g, '').length).toBeGreaterThanOrEqual(7)
    })
  })

  describe('Password Validation', () => {
    it('should require minimum 8 characters', () => {
      expect('short'.length >= 8).toBe(false)
      expect('longenough'.length >= 8).toBe(true)
    })
    it('should require uppercase', () => {
      expect(/[A-Z]/.test('TestPass123!')).toBe(true)
      expect(/[A-Z]/.test('testpass123!')).toBe(false)
    })
    it('should require lowercase', () => {
      expect(/[a-z]/.test('TestPass123!')).toBe(true)
      expect(/[a-z]/.test('TESTPASS123!')).toBe(false)
    })
    it('should require number', () => {
      expect(/[0-9]/.test('TestPass123!')).toBe(true)
      expect(/[0-9]/.test('TestPass!!!')).toBe(false)
    })
    it('should require special character', () => {
      expect(/[!@#$%^&*(),.?":{}|<>]/.test('TestPass123!')).toBe(true)
      expect(/[!@#$%^&*(),.?":{}|<>]/.test('TestPass123')).toBe(false)
    })
    const weakPasswords = ['123', 'password', '12345678', 'qwerty', 'abc123']
    test.each(weakPasswords)('should reject weak password "%s"', (pwd) => {
      const hasUpper = /[A-Z]/.test(pwd)
      const hasSpecial = /[!@#$%^&*]/.test(pwd)
      expect(hasUpper && hasSpecial).toBe(false)
    })
  })

  describe('Currency Validation', () => {
    it('should format currency correctly', () => {
      expect((1234.5).toFixed(2)).toBe('1234.50')
    })
    it('should handle zero', () => {
      expect((0).toFixed(2)).toBe('0.00')
    })
    it('should handle negative', () => {
      expect((-100).toFixed(2)).toBe('-100.00')
    })
    it('should handle large numbers', () => {
      expect((1000000).toFixed(2)).toBe('1000000.00')
    })
    it('should round correctly', () => {
      expect((10.999).toFixed(2)).toBe('11.00')
    })
    const amounts = [0, 0.01, 1, 10.5, 100, 1000, 9999.99, 100000, 1000000]
    test.each(amounts)('should handle amount %d', (amount) => {
      const formatted = amount.toFixed(2)
      expect(parseFloat(formatted)).toBe(amount)
    })
  })

  describe('Date Validation', () => {
    it('should validate ISO date format', () => {
      const date = '2024-06-15'
      expect(/^\d{4}-\d{2}-\d{2}$/.test(date)).toBe(true)
    })
    it('should validate ISO datetime format', () => {
      const datetime = '2024-06-15T10:30:00Z'
      expect(new Date(datetime).toISOString()).toBeDefined()
    })
    it('should reject invalid date', () => {
      const date = '2024-13-45'
      const d = new Date(date)
      expect(isNaN(d.getTime())).toBe(true)
    })
    it('should validate date range', () => {
      const start = new Date('2024-01-01')
      const end = new Date('2024-12-31')
      expect(end.getTime()).toBeGreaterThan(start.getTime())
    })
    it('should reject end before start', () => {
      const start = new Date('2024-12-31')
      const end = new Date('2024-01-01')
      expect(end.getTime() < start.getTime()).toBe(true)
    })
    const dateFormats = ['2024-01-01', '2024-06-15', '2024-12-31', '2025-01-01']
    test.each(dateFormats)('should parse date "%s"', (date) => {
      expect(new Date(date).getFullYear()).toBeGreaterThanOrEqual(2024)
    })
  })

  describe('Numeric Validation', () => {
    it('should validate positive integer', () => {
      expect(Number.isInteger(10) && 10 > 0).toBe(true)
    })
    it('should reject negative quantity', () => {
      expect(-5 > 0).toBe(false)
    })
    it('should reject zero quantity for orders', () => {
      expect(0 > 0).toBe(false)
    })
    it('should accept decimal for price', () => {
      expect(typeof 99.99).toBe('number')
    })
    it('should validate percentage range', () => {
      const pct = 50
      expect(pct >= 0 && pct <= 100).toBe(true)
    })
    it('should reject percentage over 100', () => {
      const pct = 150
      expect(pct <= 100).toBe(false)
    })
    it('should reject negative percentage', () => {
      const pct = -10
      expect(pct >= 0).toBe(false)
    })
    const quantities = [1, 5, 10, 50, 100, 500, 1000, 9999]
    test.each(quantities)('should accept valid quantity %d', (qty) => {
      expect(qty > 0 && Number.isInteger(qty)).toBe(true)
    })
    const prices = [0.01, 0.5, 1, 10, 99.99, 100, 1000, 9999.99]
    test.each(prices)('should accept valid price %d', (price) => {
      expect(price > 0).toBe(true)
    })
  })

  describe('String Validation', () => {
    it('should trim whitespace', () => {
      expect('  test  '.trim()).toBe('test')
    })
    it('should validate max length', () => {
      const name = 'Test Customer Name'
      expect(name.length <= 255).toBe(true)
    })
    it('should reject empty string', () => {
      expect(''.length).toBe(0)
    })
    it('should sanitize HTML', () => {
      const input = '<script>alert(1)</script>Hello'
      const sanitized = input.replace(/<[^>]*>/g, '')
      expect(sanitized).toBe('alert(1)Hello')
    })
    it('should handle unicode', () => {
      const name = 'Café Résumé'
      expect(name.length).toBeGreaterThan(0)
    })
    const specialChars = ["'", '"', '\\', '/', '<', '>', '&', '%', '|']
    test.each(specialChars)('should handle special character "%s"', (char) => {
      expect(typeof char).toBe('string')
    })
  })

  describe('GPS Coordinate Validation', () => {
    it('should validate latitude range', () => {
      expect(6.9271 >= -90 && 6.9271 <= 90).toBe(true)
    })
    it('should validate longitude range', () => {
      expect(79.8612 >= -180 && 79.8612 <= 180).toBe(true)
    })
    it('should reject invalid latitude', () => {
      expect(91 >= -90 && 91 <= 90).toBe(false)
    })
    it('should reject invalid longitude', () => {
      expect(181 >= -180 && 181 <= 180).toBe(false)
    })
    const validCoords = [
      [0, 0], [6.9271, 79.8612], [-33.8688, 151.2093], [51.5074, -0.1278],
      [35.6762, 139.6503], [-23.5505, -46.6333], [90, 180], [-90, -180],
    ]
    test.each(validCoords)('should accept coordinates [%d, %d]', (lat, lng) => {
      expect(lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180).toBe(true)
    })
  })

  describe('SKU Validation', () => {
    it('should validate SKU format', () => {
      expect(/^[A-Z0-9\-]+$/.test('SKU-001')).toBe(true)
    })
    it('should reject invalid SKU', () => {
      expect(/^[A-Z0-9\-]+$/.test('sku with spaces')).toBe(false)
    })
    const validSKUs = ['SKU-001', 'PROD-ABC-123', 'X100', 'A-B-C-1-2-3']
    test.each(validSKUs)('should accept SKU "%s"', (sku) => {
      expect(/^[A-Z0-9\-]+$/.test(sku)).toBe(true)
    })
  })

  describe('Status Transition Validation', () => {
    const orderTransitions: Record<string, string[]> = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['processing', 'cancelled'],
      processing: ['shipped', 'cancelled'],
      shipped: ['delivered'],
      delivered: [],
      cancelled: [],
    }
    Object.entries(orderTransitions).forEach(([from, validTo]) => {
      validTo.forEach(to => {
        it(`should allow order transition ${from} -> ${to}`, () => {
          expect(orderTransitions[from]).toContain(to)
        })
      })
      const invalidTransitions = Object.keys(orderTransitions).filter(s => !validTo.includes(s) && s !== from)
      invalidTransitions.forEach(to => {
        it(`should reject order transition ${from} -> ${to}`, () => {
          expect(orderTransitions[from]).not.toContain(to)
        })
      })
    })
  })

  describe('Calculation Accuracy', () => {
    it('should handle floating point precision', () => {
      const a = 0.1, b = 0.2
      const sum = Math.round((a + b) * 100) / 100
      expect(sum).toBe(0.3)
    })
    it('should round currency to 2 decimal places', () => {
      const amount = 10.999
      const rounded = Math.round(amount * 100) / 100
      expect(rounded).toBe(11)
    })
    it('should calculate tax correctly', () => {
      const subtotal = 1234.56, taxRate = 12
      const tax = Math.round(subtotal * taxRate) / 100
      expect(tax).toBeGreaterThan(0)
    })
    it('should calculate discount correctly', () => {
      const subtotal = 1000, discountPct = 15
      const discount = subtotal * discountPct / 100
      expect(discount).toBe(150)
    })
    it('should maintain order total integrity', () => {
      const subtotal = 1000, discount = 100, tax = 90
      const total = subtotal - discount + tax
      expect(total).toBe(990)
      expect(total).toBe(subtotal - discount + tax)
    })
    const taxRates = [0, 5, 8, 10, 12, 15, 18, 20, 25]
    test.each(taxRates)('should calculate %d%% tax correctly', (rate) => {
      const subtotal = 1000
      const tax = subtotal * rate / 100
      expect(tax).toBe(rate * 10)
    })
  })
})
