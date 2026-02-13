import { describe, it, expect } from 'vitest'
import { formatCurrency, CURRENCIES, parseCurrencyAmount, getCurrencySymbol } from '../../utils/currency'

describe('Currency Utilities Tests', () => {
  describe('formatCurrency', () => {
    it('should format USD amount', () => {
      const result = formatCurrency(1234.56, 'USD')
      expect(result).toBeDefined()
      expect(typeof result).toBe('string')
    })
    it('should format ZAR amount', () => {
      const result = formatCurrency(1234.56, 'ZAR')
      expect(result).toBeDefined()
    })
    it('should format EUR amount', () => {
      const result = formatCurrency(1234.56, 'EUR')
      expect(result).toBeDefined()
    })
    it('should format GBP amount', () => {
      const result = formatCurrency(1234.56, 'GBP')
      expect(result).toBeDefined()
    })
    it('should format zero amount', () => {
      const result = formatCurrency(0, 'USD')
      expect(result).toBeDefined()
    })
    it('should format negative amount', () => {
      const result = formatCurrency(-1234.56, 'USD')
      expect(result).toBeDefined()
    })
    it('should format very large amount', () => {
      const result = formatCurrency(9999999.99, 'USD')
      expect(result).toBeDefined()
    })
    it('should format very small amount', () => {
      const result = formatCurrency(0.01, 'USD')
      expect(result).toBeDefined()
    })
    it('should handle integer amount', () => {
      const result = formatCurrency(1000, 'USD')
      expect(result).toBeDefined()
    })
    it('should handle default currency', () => {
      const result = formatCurrency(1234.56)
      expect(result).toBeDefined()
    })
    const currencies = ['USD', 'ZAR', 'EUR', 'GBP'] as const
    test.each(currencies)('should format with currency "%s"', (currency) => {
      const result = formatCurrency(1234.56, currency)
      expect(result).toBeDefined()
      expect(typeof result).toBe('string')
    })
    const amounts = [0, 0.01, 0.99, 1, 10, 100, 1000, 10000, 100000, 1000000, -1, -100]
    test.each(amounts)('should format amount %d', (amount) => {
      const result = formatCurrency(amount, 'USD')
      expect(result).toBeDefined()
    })
  })

  describe('CURRENCIES', () => {
    it('should have USD configuration', () => {
      expect(CURRENCIES.USD).toBeDefined()
      expect(CURRENCIES.USD.code).toBe('USD')
      expect(CURRENCIES.USD.symbol).toBe('$')
      expect(CURRENCIES.USD.decimals).toBe(2)
    })
    it('should have ZAR configuration', () => {
      expect(CURRENCIES.ZAR).toBeDefined()
      expect(CURRENCIES.ZAR.code).toBe('ZAR')
      expect(CURRENCIES.ZAR.symbol).toBe('R')
      expect(CURRENCIES.ZAR.decimals).toBe(2)
    })
    it('should have EUR configuration', () => {
      expect(CURRENCIES.EUR).toBeDefined()
      expect(CURRENCIES.EUR.code).toBe('EUR')
      expect(CURRENCIES.EUR.symbol).toBeDefined()
    })
    it('should have GBP configuration', () => {
      expect(CURRENCIES.GBP).toBeDefined()
      expect(CURRENCIES.GBP.code).toBe('GBP')
      expect(CURRENCIES.GBP.symbol).toBeDefined()
    })
    it('should have all required fields for each currency', () => {
      Object.values(CURRENCIES).forEach((config) => {
        expect(config.code).toBeDefined()
        expect(config.symbol).toBeDefined()
        expect(config.name).toBeDefined()
        expect(config.locale).toBeDefined()
        expect(config.decimals).toBeDefined()
      })
    })
  })

  describe('parseCurrencyAmount', () => {
    it('should parse formatted amount', () => {
      const result = parseCurrencyAmount('$1,234.56')
      expect(result).toBeCloseTo(1234.56)
    })
    it('should parse plain number string', () => {
      const result = parseCurrencyAmount('1234.56')
      expect(result).toBeCloseTo(1234.56)
    })
    it('should parse integer string', () => {
      const result = parseCurrencyAmount('1000')
      expect(result).toBe(1000)
    })
    it('should parse zero', () => {
      const result = parseCurrencyAmount('0')
      expect(result).toBe(0)
    })
    it('should parse negative amount', () => {
      const result = parseCurrencyAmount('-1234.56')
      expect(result).toBeCloseTo(-1234.56)
    })
    it('should handle currency symbols', () => {
      const result = parseCurrencyAmount('R 1,234.56')
      expect(typeof result).toBe('number')
    })
    it('should handle empty string', () => {
      const result = parseCurrencyAmount('')
      expect(result).toBe(0)
    })
  })

  describe('getCurrencySymbol', () => {
    it('should return $ for USD', () => {
      const result = getCurrencySymbol('USD')
      expect(result).toBe('$')
    })
    it('should return R for ZAR', () => {
      const result = getCurrencySymbol('ZAR')
      expect(result).toBe('R')
    })
    it('should return symbol for EUR', () => {
      const result = getCurrencySymbol('EUR')
      expect(result).toBeDefined()
    })
    it('should return symbol for GBP', () => {
      const result = getCurrencySymbol('GBP')
      expect(result).toBeDefined()
    })
  })
})
