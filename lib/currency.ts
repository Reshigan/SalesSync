/**
 * Currency Configuration and Formatting Utilities
 * Supports multi-currency operations for different markets
 */

export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
  decimals: number;
  position: 'before' | 'after';
}

export const SUPPORTED_CURRENCIES: Record<string, CurrencyConfig> = {
  NGN: {
    code: 'NGN',
    symbol: '₦',
    name: 'Nigerian Naira',
    decimals: 2,
    position: 'before'
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    decimals: 2,
    position: 'before'
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    decimals: 2,
    position: 'before'
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound',
    decimals: 2,
    position: 'before'
  },
  KES: {
    code: 'KES',
    symbol: 'KSh',
    name: 'Kenyan Shilling',
    decimals: 2,
    position: 'before'
  },
  INR: {
    code: 'INR',
    symbol: '₹',
    name: 'Indian Rupee',
    decimals: 2,
    position: 'before'
  },
  ZAR: {
    code: 'ZAR',
    symbol: 'R',
    name: 'South African Rand',
    decimals: 2,
    position: 'before'
  },
  GHS: {
    code: 'GHS',
    symbol: '₵',
    name: 'Ghanaian Cedi',
    decimals: 2,
    position: 'before'
  }
};

/**
 * Get currency configuration from environment or default to NGN
 */
export function getCurrencyConfig(): CurrencyConfig {
  const currencyCode = process.env.NEXT_PUBLIC_CURRENCY || 'NGN';
  return SUPPORTED_CURRENCIES[currencyCode] || SUPPORTED_CURRENCIES.NGN;
}

/**
 * Format amount with currency symbol and proper formatting
 */
export function formatCurrency(
  amount: number, 
  options: {
    currency?: string;
    showDecimals?: boolean;
    compact?: boolean;
  } = {}
): string {
  const { currency, showDecimals = true, compact = false } = options;
  const config = currency ? SUPPORTED_CURRENCIES[currency] : getCurrencyConfig();
  
  if (!config) {
    return amount.toString();
  }

  let formattedAmount: string;
  
  if (compact && amount >= 1000) {
    if (amount >= 1000000) {
      formattedAmount = (amount / 1000000).toFixed(1) + 'M';
    } else {
      formattedAmount = (amount / 1000).toFixed(0) + 'K';
    }
  } else {
    const decimals = showDecimals ? config.decimals : 0;
    formattedAmount = amount.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  }

  return config.position === 'before' 
    ? `${config.symbol}${formattedAmount}`
    : `${formattedAmount}${config.symbol}`;
}

/**
 * Format currency for display in compact form (e.g., ₦245K)
 */
export function formatCurrencyCompact(amount: number, currency?: string): string {
  return formatCurrency(amount, { currency, compact: true, showDecimals: false });
}

/**
 * Get currency symbol only
 */
export function getCurrencySymbol(currency?: string): string {
  const config = currency ? SUPPORTED_CURRENCIES[currency] : getCurrencyConfig();
  return config?.symbol || '₦';
}

/**
 * Parse currency string back to number (removes symbols and formatting)
 */
export function parseCurrency(currencyString: string): number {
  // Remove all non-numeric characters except decimal point and minus
  const numericString = currencyString.replace(/[^\d.-]/g, '');
  return parseFloat(numericString) || 0;
}

/**
 * Convert between currencies (placeholder for future exchange rate integration)
 */
export function convertCurrency(
  amount: number, 
  fromCurrency: string, 
  toCurrency: string
): number {
  // TODO: Implement actual currency conversion with exchange rates
  // For now, return the same amount
  console.warn('Currency conversion not implemented. Returning original amount.');
  return amount;
}