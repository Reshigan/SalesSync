/**
 * Currency settings utility for SalesSync application
 * Manages currency configuration and provides consistent currency formatting
 */

import apiService from '../lib/api';

interface CurrencyOption {
  code: string;
  symbol: string;
  name: string;
}

interface CurrencySettings {
  currency: string;
  currencySymbol: string;
}

// Default currency settings
const DEFAULT_CURRENCY_SETTINGS: CurrencySettings = {
  currency: 'USD',
  currencySymbol: '$'
};

// Cache for currency settings
let currencyCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Get current currency settings from cache or API
 * @returns {Object} Currency settings object
 */
export const getCurrencySettings = () => {
  // Return cached settings if available and not expired
  if (currencyCache && cacheTimestamp && (Date.now() - cacheTimestamp < CACHE_DURATION)) {
    return currencyCache;
  }

  // Return default settings if no cache available
  return DEFAULT_CURRENCY_SETTINGS;
};

/**
 * Fetch currency settings from the API
 * @returns {Promise<Object>} Currency settings object
 */
export const fetchCurrencySettings = async () => {
  try {
    const response = await apiService.get('/settings/currency');
    
    if (response.data && response.data.success) {
      const settings = {
        currency: response.data.data.currency || DEFAULT_CURRENCY_SETTINGS.currency,
        currencySymbol: response.data.data.currencySymbol || DEFAULT_CURRENCY_SETTINGS.currencySymbol
      };
      
      // Update cache
      currencyCache = settings;
      cacheTimestamp = Date.now();
      
      return settings;
    }
  } catch (error) {
    console.warn('Failed to fetch currency settings, using defaults:', error);
  }
  
  return DEFAULT_CURRENCY_SETTINGS;
};

/**
 * Save currency settings to the API
 * @param {string} currency - Currency code (e.g., 'USD', 'GBP', 'EUR')
 * @param {string} currencySymbol - Currency symbol (e.g., '$', '£', '€')
 * @returns {Promise<boolean>} Success status
 */
export const saveCurrencySettings = async (currency, currencySymbol) => {
  try {
    const response = await apiService.post('/settings/currency', {
      currency,
      currencySymbol
    });
    
    if (response.data && response.data.success) {
      // Update cache
      currencyCache = { currency, currencySymbol };
      cacheTimestamp = Date.now();
      
      // Trigger a custom event to notify components of currency change
      window.dispatchEvent(new CustomEvent('currencySettingsChanged', {
        detail: { currency, currencySymbol }
      }));
      
      return true;
    }
  } catch (error) {
    console.error('Failed to save currency settings:', error);
  }
  
  return false;
};

/**
 * Initialize currency settings on app startup
 * @returns {Promise<Object>} Currency settings object
 */
export const initializeCurrencySettings = async () => {
  return await fetchCurrencySettings();
};

/**
 * Clear currency cache (useful for testing or forced refresh)
 */
export const clearCurrencyCache = () => {
  currencyCache = null;
  cacheTimestamp = null;
};

/**
 * Get available currency options
 * @returns {Array} Array of currency options
 */
export const getCurrencyOptions = (): CurrencyOption[] => [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' }
];

/**
 * Format currency amount using current settings
 * @param {number} amount - Amount to format
 * @param {Object} options - Formatting options
 * @returns {string} Formatted currency string
 */
export const formatCurrencyAmount = (amount: number, options: any = {}) => {
  const settings = getCurrencySettings();
  
  if (amount === null || amount === undefined || isNaN(amount)) {
    return `${settings.currencySymbol}0.00`;
  }

  const numericAmount = parseFloat(amount);
  
  try {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: settings.currency,
      minimumFractionDigits: options.minimumFractionDigits || 2,
      maximumFractionDigits: options.maximumFractionDigits || 2,
      ...options
    });
    
    const formatted = formatter.format(numericAmount);
    
    // Replace the default currency symbol with our custom one if different
    const currencySymbols = {
      'USD': '$',
      'GBP': '£',
      'EUR': '€',
      'CAD': 'CA$',
      'AUD': 'A$',
      'JPY': '¥'
    };
    
    const defaultSymbol = currencySymbols[settings.currency];
    if (defaultSymbol && settings.currencySymbol !== defaultSymbol) {
      return formatted.replace(defaultSymbol, settings.currencySymbol);
    }
    
    return formatted;
  } catch (error) {
    // Fallback to simple formatting
    return `${settings.currencySymbol}${numericAmount.toFixed(2)}`;
  }
};