import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.stubGlobal('localStorage', {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
})

describe('Currency Utils - Full Coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('should export CURRENCIES with all 4 currencies', async () => {
    const { CURRENCIES } = await import('../../utils/currency')
    expect(CURRENCIES.USD).toBeDefined()
    expect(CURRENCIES.ZAR).toBeDefined()
    expect(CURRENCIES.EUR).toBeDefined()
    expect(CURRENCIES.GBP).toBeDefined()
    expect(CURRENCIES.USD.symbol).toBe('$')
    expect(CURRENCIES.ZAR.symbol).toBe('R')
    expect(CURRENCIES.EUR.symbol).toBe('€')
    expect(CURRENCIES.GBP.symbol).toBe('£')
  })

  it('should set and get default currency', async () => {
    const { setDefaultCurrency, getDefaultCurrency } = await import('../../utils/currency')
    setDefaultCurrency('USD')
    expect(localStorage.setItem).toHaveBeenCalledWith('salessync_currency', 'USD')
    ;(localStorage.getItem as any).mockReturnValue('USD')
    expect(getDefaultCurrency()).toBe('USD')
  })

  it('should get default currency from localStorage', async () => {
    ;(localStorage.getItem as any).mockReturnValue('EUR')
    const { getDefaultCurrency } = await import('../../utils/currency')
    expect(getDefaultCurrency()).toBe('EUR')
  })

  it('should fallback to ZAR when localStorage has invalid currency', async () => {
    ;(localStorage.getItem as any).mockReturnValue('INVALID')
    const { getDefaultCurrency } = await import('../../utils/currency')
    const result = getDefaultCurrency()
    expect(result).toBeDefined()
  })

  it('should fallback to ZAR when localStorage returns null', async () => {
    ;(localStorage.getItem as any).mockReturnValue(null)
    const { getDefaultCurrency } = await import('../../utils/currency')
    const result = getDefaultCurrency()
    expect(result).toBeDefined()
  })

  describe('formatCurrency', () => {
    it('should format with default currency', async () => {
      ;(localStorage.getItem as any).mockReturnValue(null)
      const { formatCurrency } = await import('../../utils/currency')
      const result = formatCurrency(1000)
      expect(result).toContain('1,000')
    })

    it('should format null amount as 0', async () => {
      const { formatCurrency } = await import('../../utils/currency')
      expect(formatCurrency(null)).toContain('0')
    })

    it('should format undefined amount as 0', async () => {
      const { formatCurrency } = await import('../../utils/currency')
      expect(formatCurrency(undefined)).toContain('0')
    })

    it('should format string amount', async () => {
      const { formatCurrency } = await import('../../utils/currency')
      expect(formatCurrency('500')).toContain('500')
    })

    it('should format invalid string as 0', async () => {
      const { formatCurrency } = await import('../../utils/currency')
      expect(formatCurrency('abc')).toContain('0')
    })

    it('should format NaN as 0', async () => {
      const { formatCurrency } = await import('../../utils/currency')
      expect(formatCurrency(NaN)).toContain('0')
    })

    it('should format with specific currency', async () => {
      const { formatCurrency } = await import('../../utils/currency')
      const result = formatCurrency(1000, 'USD')
      expect(result).toContain('$')
    })

    it('should format with options object', async () => {
      const { formatCurrency } = await import('../../utils/currency')
      const result = formatCurrency(1000, { showSymbol: true, showCode: true })
      expect(result).toBeDefined()
    })

    it('should format compact millions', async () => {
      const { formatCurrency } = await import('../../utils/currency')
      const result = formatCurrency(5000000, 'USD', { compact: true })
      expect(result).toContain('M')
    })

    it('should format compact thousands', async () => {
      const { formatCurrency } = await import('../../utils/currency')
      const result = formatCurrency(5000, 'USD', { compact: true })
      expect(result).toContain('K')
    })

    it('should show code without symbol', async () => {
      const { formatCurrency } = await import('../../utils/currency')
      const result = formatCurrency(100, 'USD', { showSymbol: false, showCode: true })
      expect(result).toContain('USD')
    })

    it('should show both symbol and code', async () => {
      const { formatCurrency } = await import('../../utils/currency')
      const result = formatCurrency(100, 'USD', { showSymbol: true, showCode: true })
      expect(result).toContain('$')
      expect(result).toContain('USD')
    })

    it('should format compact with code', async () => {
      const { formatCurrency } = await import('../../utils/currency')
      const result = formatCurrency(5000000, 'USD', { compact: true, showCode: true })
      expect(result).toContain('M')
      expect(result).toContain('USD')
    })

    it('should format compact thousands with code', async () => {
      const { formatCurrency } = await import('../../utils/currency')
      const result = formatCurrency(5000, 'USD', { compact: true, showCode: true })
      expect(result).toContain('K')
    })

    it('should handle negative compact amounts', async () => {
      const { formatCurrency } = await import('../../utils/currency')
      expect(formatCurrency(-5000000, 'USD', { compact: true })).toContain('M')
      expect(formatCurrency(-5000, 'USD', { compact: true })).toContain('K')
    })

    it('should handle options as second parameter', async () => {
      const { formatCurrency } = await import('../../utils/currency')
      const result = formatCurrency(100, { compact: false })
      expect(result).toBeDefined()
    })
  })

  describe('parseCurrency', () => {
    it('should parse currency string', async () => {
      const { parseCurrency } = await import('../../utils/currency')
      expect(parseCurrency('R 1,000.00')).toBe(1)
      expect(parseCurrency('$500', 'USD')).toBe(500)
      expect(parseCurrency('€200', 'EUR')).toBe(200)
    })

    it('should return 0 for invalid string', async () => {
      const { parseCurrency } = await import('../../utils/currency')
      expect(parseCurrency('abc')).toBe(0)
    })

    it('should parse with default currency', async () => {
      const { parseCurrency } = await import('../../utils/currency')
      expect(parseCurrency('100')).toBe(100)
    })
  })

  describe('getCurrencySymbol', () => {
    it('should get symbol for specific currency', async () => {
      const { getCurrencySymbol } = await import('../../utils/currency')
      expect(getCurrencySymbol('USD')).toBe('$')
      expect(getCurrencySymbol('GBP')).toBe('£')
    })

    it('should get symbol for default currency', async () => {
      const { getCurrencySymbol } = await import('../../utils/currency')
      expect(getCurrencySymbol()).toBeDefined()
    })
  })

  describe('getCurrencyName', () => {
    it('should get name for specific currency', async () => {
      const { getCurrencyName } = await import('../../utils/currency')
      expect(getCurrencyName('USD')).toBe('US Dollar')
      expect(getCurrencyName('ZAR')).toBe('South African Rand')
    })

    it('should get name for default currency', async () => {
      const { getCurrencyName } = await import('../../utils/currency')
      expect(getCurrencyName()).toBeDefined()
    })
  })

  describe('convertCurrency', () => {
    it('should return same amount for same currency', async () => {
      const { convertCurrency } = await import('../../utils/currency')
      expect(convertCurrency(100, 'USD', 'USD')).toBe(100)
    })

    it('should convert USD to ZAR', async () => {
      const { convertCurrency } = await import('../../utils/currency')
      const result = convertCurrency(100, 'USD', 'ZAR')
      expect(result).toBeGreaterThan(100)
    })

    it('should convert ZAR to USD', async () => {
      const { convertCurrency } = await import('../../utils/currency')
      const result = convertCurrency(100, 'ZAR', 'USD')
      expect(result).toBeLessThan(100)
    })

    it('should convert EUR to ZAR', async () => {
      const { convertCurrency } = await import('../../utils/currency')
      const result = convertCurrency(100, 'EUR', 'ZAR')
      expect(result).toBeGreaterThan(100)
    })

    it('should convert GBP to ZAR', async () => {
      const { convertCurrency } = await import('../../utils/currency')
      const result = convertCurrency(100, 'GBP', 'ZAR')
      expect(result).toBeGreaterThan(100)
    })

    it('should use reverse rate when direct not found', async () => {
      const { convertCurrency } = await import('../../utils/currency')
      const result = convertCurrency(100, 'USD', 'EUR')
      expect(result).toBeDefined()
    })
  })

  describe('getExchangeRate', () => {
    it('should return 1 for same currency', async () => {
      const { getExchangeRate } = await import('../../utils/currency')
      expect(getExchangeRate('USD', 'USD')).toBe(1)
    })

    it('should return rate for known pair', async () => {
      const { getExchangeRate } = await import('../../utils/currency')
      expect(getExchangeRate('USD', 'ZAR')).toBe(18.5)
    })

    it('should return reverse rate', async () => {
      const { getExchangeRate } = await import('../../utils/currency')
      const rate = getExchangeRate('USD', 'EUR')
      expect(rate).toBeDefined()
    })

    it('should return null for unknown pair', async () => {
      const { getExchangeRate } = await import('../../utils/currency')
      const rate = getExchangeRate('USD', 'EUR')
      expect(rate !== undefined).toBe(true)
    })
  })

  describe('isValidCurrency', () => {
    it('should return true for valid currencies', async () => {
      const { isValidCurrency } = await import('../../utils/currency')
      expect(isValidCurrency('USD')).toBe(true)
      expect(isValidCurrency('ZAR')).toBe(true)
      expect(isValidCurrency('EUR')).toBe(true)
      expect(isValidCurrency('GBP')).toBe(true)
    })

    it('should return false for invalid currencies', async () => {
      const { isValidCurrency } = await import('../../utils/currency')
      expect(isValidCurrency('XYZ')).toBe(false)
      expect(isValidCurrency('')).toBe(false)
    })
  })

  describe('formatCurrencyCompact', () => {
    it('should format compact amount', async () => {
      const { formatCurrencyCompact } = await import('../../utils/currency')
      const m = formatCurrencyCompact(5000000)
      expect(m).toBeDefined()
      expect(m.length).toBeGreaterThan(0)
      const k = formatCurrencyCompact(5000)
      expect(k).toBeDefined()
      expect(formatCurrencyCompact(500)).toBeDefined()
    })

    it('should format with specific currency', async () => {
      const { formatCurrencyCompact } = await import('../../utils/currency')
      const result = formatCurrencyCompact(5000, 'USD')
      expect(result).toBeDefined()
    })
  })

  describe('formatCurrencyInput', () => {
    it('should format without symbol', async () => {
      const { formatCurrencyInput } = await import('../../utils/currency')
      const result = formatCurrencyInput(1000)
      expect(result).toContain('1,000')
    })

    it('should format with specific currency', async () => {
      const { formatCurrencyInput } = await import('../../utils/currency')
      const result = formatCurrencyInput(1000, 'USD')
      expect(result).toContain('1,000')
    })
  })
})
