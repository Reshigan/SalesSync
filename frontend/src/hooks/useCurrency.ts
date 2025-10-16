/**
 * React hook for managing currency settings
 * Provides reactive currency settings that update across the application
 */

import { useState, useEffect, useCallback } from 'react';

interface CurrencySettings {
  currency: string;
  currencySymbol: string;
}
import { 
  getCurrencySettings, 
  fetchCurrencySettings, 
  saveCurrencySettings,
  clearCurrencyCache 
} from '../utils/currencySettings';

export const useCurrency = () => {
  const [currencySettings, setCurrencySettings] = useState<CurrencySettings>(getCurrencySettings());
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load currency settings from API
  const loadCurrencySettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const settings = await fetchCurrencySettings();
      setCurrencySettings(settings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load currency settings');
    } finally {
      setLoading(false);
    }
  }, []);

  // Save currency settings
  const updateCurrencySettings = useCallback(async (currency: string, currencySymbol: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const success = await saveCurrencySettings(currency, currencySymbol);
      if (success) {
        setCurrencySettings({ currency, currencySymbol });
        return true;
      } else {
        throw new Error('Failed to save currency settings');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save currency settings');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh currency settings
  const refreshCurrencySettings = useCallback(() => {
    clearCurrencyCache();
    loadCurrencySettings();
  }, [loadCurrencySettings]);

  // Format currency using current settings
  const formatCurrency = useCallback((amount: number, options: any = {}) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return `${currencySettings.currencySymbol}0.00`;
    }

    const numericAmount = Number(amount);
    
    try {
      const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currencySettings.currency,
        minimumFractionDigits: options.minimumFractionDigits || 2,
        maximumFractionDigits: options.maximumFractionDigits || 2,
        ...options
      });
      
      const formatted = formatter.format(numericAmount);
      
      // Replace the default currency symbol with our custom one if different
      const currencySymbols: Record<string, string> = {
        'USD': '$',
        'GBP': '£',
        'EUR': '€',
        'CAD': 'CA$',
        'AUD': 'A$',
        'JPY': '¥',
        'NGN': '₦',
        'ZAR': 'R',
        'KES': 'KSh'
      };
      
      const defaultSymbol = currencySymbols[currencySettings.currency];
      if (defaultSymbol && currencySettings.currencySymbol !== defaultSymbol) {
        return formatted.replace(defaultSymbol, currencySettings.currencySymbol);
      }
      
      return formatted;
    } catch (error) {
      // Fallback to simple formatting
      return `${currencySettings.currencySymbol}${numericAmount.toFixed(2)}`;
    }
  }, [currencySettings]);

  // Listen for currency settings changes from other parts of the app
  useEffect(() => {
    const handleCurrencyChange = (event: any) => {
      setCurrencySettings(event.detail);
    };

    window.addEventListener('currencySettingsChanged', handleCurrencyChange);
    
    return () => {
      window.removeEventListener('currencySettingsChanged', handleCurrencyChange);
    };
  }, []);

  // Load currency settings on mount
  useEffect(() => {
    loadCurrencySettings();
  }, [loadCurrencySettings]);

  return {
    currencySettings,
    loading,
    error,
    formatCurrency,
    updateCurrencySettings,
    refreshCurrencySettings,
    loadCurrencySettings
  };
};