// import { api } from '@/lib/api';
import { useState, useEffect } from 'react';

// Currency configuration mapping
const CURRENCY_CONFIG = {
  ZAR: { code: 'ZAR', symbol: 'R', locale: 'en-ZA' },
  USD: { code: 'USD', symbol: '$', locale: 'en-US' },
  EUR: { code: 'EUR', symbol: '€', locale: 'en-EU' },
  GBP: { code: 'GBP', symbol: '£', locale: 'en-GB' },
  NGN: { code: 'NGN', symbol: '₦', locale: 'en-NG' },
  KES: { code: 'KES', symbol: 'KSh', locale: 'en-KE' }
};

let cachedCurrency: string | null = null;
let cachedConfig: any = null;

// Get tenant currency from API or cache
async function getTenantCurrency(): Promise<string> {
  if (cachedCurrency) {
    return cachedCurrency;
  }

  try {
    // const response = await api.get('/api/tenant/settings');
    const currency = 'ZAR'; // Fallback to ZAR when API is disabled
    cachedCurrency = currency;
    return currency;
  } catch (error) {
    console.warn('Failed to fetch tenant currency, defaulting to ZAR:', error);
    cachedCurrency = 'ZAR';
    return 'ZAR';
  }
}

// Get currency configuration
async function getCurrencyConfig() {
  if (cachedConfig) {
    return cachedConfig;
  }

  const currency = await getTenantCurrency();
  cachedConfig = CURRENCY_CONFIG[currency as keyof typeof CURRENCY_CONFIG] || CURRENCY_CONFIG.ZAR;
  return cachedConfig;
}

// Format currency amount
export async function formatCurrency(amount: number): Promise<string> {
  const config = await getCurrencyConfig();
  
  try {
    return new Intl.NumberFormat(config.locale, {
      style: 'currency',
      currency: config.code,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
  } catch (error) {
    // Fallback to simple formatting
    return `${config.symbol}${amount.toLocaleString()}`;
  }
}

// Format currency with symbol only (no decimals for whole numbers)
export async function formatCurrencySimple(amount: number): Promise<string> {
  const config = await getCurrencyConfig();
  
  if (amount % 1 === 0) {
    return `${config.symbol}${amount.toLocaleString()}`;
  } else {
    return `${config.symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}

// Get currency symbol only
export async function getCurrencySymbol(): Promise<string> {
  const config = await getCurrencyConfig();
  return config.symbol;
}

// Get currency code
export async function getCurrencyCode(): Promise<string> {
  const config = await getCurrencyConfig();
  return config.code;
}

// Synchronous version for components that can't use async (fallback to ZAR)
export function formatCurrencySync(amount: number, currencyCode: string = 'ZAR'): string {
  const config = CURRENCY_CONFIG[currencyCode as keyof typeof CURRENCY_CONFIG] || CURRENCY_CONFIG.ZAR;
  
  try {
    return new Intl.NumberFormat(config.locale, {
      style: 'currency',
      currency: config.code,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
  } catch (error) {
    return `${config.symbol}${amount.toLocaleString()}`;
  }
}

// Clear cache (useful for tenant switching)
export function clearCurrencyCache(): void {
  cachedCurrency = null;
  cachedConfig = null;
}

// Hook for React components
export function useCurrency() {
  const [currency, setCurrency] = useState<string>('ZAR');
  const [config, setConfig] = useState(CURRENCY_CONFIG.ZAR);

  useEffect(() => {
    getTenantCurrency().then(curr => {
      setCurrency(curr);
      setConfig(CURRENCY_CONFIG[curr as keyof typeof CURRENCY_CONFIG] || CURRENCY_CONFIG.ZAR);
    });
  }, []);

  return {
    currency,
    config,
    formatCurrency: (amount: number) => formatCurrencySync(amount, currency),
    formatCurrencySimple: (amount: number) => {
      if (amount % 1 === 0) {
        return `${config.symbol}${amount.toLocaleString()}`;
      } else {
        return `${config.symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      }
    },
    symbol: config.symbol,
    code: config.code
  };
}