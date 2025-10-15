/**
 * Formatting utilities for SalesSync application
 * Provides consistent formatting for currency, numbers, and percentages
 */

import { getCurrencySettings } from './currencySettings';

interface FormatOptions {
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  useGrouping?: boolean;
  style?: string;
  currency?: string;
}

/**
 * Format a number as currency using the current system settings
 * @param {number} amount - The amount to format
 * @param {Object} options - Formatting options
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount: number, options: FormatOptions = {}) => {
  const { currencySymbol = '$', currency = 'USD' } = getCurrencySettings();
  
  if (amount === null || amount === undefined || isNaN(amount)) {
    return `${currencySymbol}0.00`;
  }

  const numericAmount = Number(amount);
  
  // Use Intl.NumberFormat for proper currency formatting
  try {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: options.minimumFractionDigits || 2,
      maximumFractionDigits: options.maximumFractionDigits || 2,
      useGrouping: options.useGrouping !== false
    });
    
    // Replace the default currency symbol with our custom one if different
    const formatted = formatter.format(numericAmount);
    if (currency === 'USD' && currencySymbol !== '$') {
      return formatted.replace('$', currencySymbol);
    } else if (currency === 'GBP' && currencySymbol !== '£') {
      return formatted.replace('£', currencySymbol);
    } else if (currency === 'EUR' && currencySymbol !== '€') {
      return formatted.replace('€', currencySymbol);
    }
    
    return formatted;
  } catch (error) {
    // Fallback to simple formatting if Intl.NumberFormat fails
    return `${currencySymbol}${numericAmount.toFixed(2)}`;
  }
};

/**
 * Format a number with thousands separators
 * @param {number} number - The number to format
 * @param {Object} options - Formatting options
 * @returns {string} Formatted number string
 */
export const formatNumber = (number: number, options: FormatOptions = {}) => {
  if (number === null || number === undefined || isNaN(number)) {
    return '0';
  }

  const numericValue = Number(number);
  
  try {
    const formatter = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: options.minimumFractionDigits || 0,
      maximumFractionDigits: options.maximumFractionDigits || 0,
      useGrouping: options.useGrouping !== false
    });
    
    return formatter.format(numericValue);
  } catch (error) {
    return numericValue.toString();
  }
};

/**
 * Format a number as a percentage
 * @param {number} number - The number to format (0.15 = 15%)
 * @param {Object} options - Formatting options
 * @returns {string} Formatted percentage string
 */
export const formatPercentage = (number: number, options: FormatOptions = {}) => {
  if (number === null || number === undefined || isNaN(number)) {
    return '0%';
  }

  const numericValue = Number(number);
  
  try {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: options.minimumFractionDigits || 1,
      maximumFractionDigits: options.maximumFractionDigits || 1,
      useGrouping: options.useGrouping !== false
    });
    
    // If the number is already in percentage form (e.g., 15 for 15%), divide by 100
    const valueToFormat = numericValue > 1 ? numericValue / 100 : numericValue;
    
    return formatter.format(valueToFormat);
  } catch (error) {
    return `${(numericValue * 100).toFixed(1)}%`;
  }
};

/**
 * Format a compact number (e.g., 1.2K, 1.5M)
 * @param {number} number - The number to format
 * @returns {string} Formatted compact number string
 */
export const formatCompactNumber = (number: number) => {
  if (number === null || number === undefined || isNaN(number)) {
    return '0';
  }

  const numericValue = Number(number);
  
  try {
    const formatter = new Intl.NumberFormat('en-US', {
      notation: 'compact',
      compactDisplay: 'short'
    });
    
    return formatter.format(numericValue);
  } catch (error) {
    // Fallback for older browsers
    if (numericValue >= 1000000) {
      return `${(numericValue / 1000000).toFixed(1)}M`;
    } else if (numericValue >= 1000) {
      return `${(numericValue / 1000).toFixed(1)}K`;
    }
    return numericValue.toString();
  }
};

/**
 * Format a date string
 * @param {string|Date} date - The date to format
 * @param {Object} options - Formatting options
 * @returns {string} Formatted date string
 */
export const formatDate = (date: string | Date, options: any = {}) => {
  if (!date) return '';
  
  const dateObj = date instanceof Date ? date : new Date(date);
  
  if (isNaN(dateObj.getTime())) {
    return '';
  }
  
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      ...options
    });
    
    return formatter.format(dateObj);
  } catch (error) {
    return dateObj.toLocaleDateString();
  }
};

/**
 * Format a time string
 * @param {string|Date} time - The time to format
 * @param {Object} options - Formatting options
 * @returns {string} Formatted time string
 */
export const formatTime = (time: string | Date, options: any = {}) => {
  if (!time) return '';
  
  const timeObj = time instanceof Date ? time : new Date(time);
  
  if (isNaN(timeObj.getTime())) {
    return '';
  }
  
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      ...options
    });
    
    return formatter.format(timeObj);
  } catch (error) {
    return timeObj.toLocaleTimeString();
  }
};