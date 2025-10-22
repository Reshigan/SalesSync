/**
 * Currency Utility Functions
 * Provides consistent currency formatting across the application
 */

const DEFAULT_CURRENCY = {
  code: 'ZAR',
  symbol: 'R',
  position: 'before', // 'before' or 'after'
  decimal_places: 2,
  decimal_separator: '.',
  thousands_separator: ',',
};

/**
 * Format amount as currency string
 * @param {number} amount - The amount to format
 * @param {object} options - Currency options
 * @returns {string} Formatted currency string
 */
function formatCurrency(amount, options = {}) {
  const config = { ...DEFAULT_CURRENCY, ...options };
  
  // Handle null/undefined
  if (amount === null || amount === undefined || isNaN(amount)) {
    amount = 0;
  }

  // Convert to number and fix decimal places
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  const fixedAmount = numericAmount.toFixed(config.decimal_places);
  
  // Split into integer and decimal parts
  const [integerPart, decimalPart] = fixedAmount.split('.');
  
  // Add thousands separator
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, config.thousands_separator);
  
  // Combine with decimal part
  const formattedAmount = decimalPart 
    ? `${formattedInteger}${config.decimal_separator}${decimalPart}`
    : formattedInteger;
  
  // Add currency symbol
  if (config.position === 'before') {
    return `${config.symbol} ${formattedAmount}`;
  } else {
    return `${formattedAmount} ${config.symbol}`;
  }
}

/**
 * Parse currency string to number
 * @param {string} currencyString - The currency string to parse
 * @param {object} options - Currency options
 * @returns {number} Parsed amount
 */
function parseCurrency(currencyString, options = {}) {
  const config = { ...DEFAULT_CURRENCY, ...options };
  
  if (typeof currencyString === 'number') {
    return currencyString;
  }
  
  if (!currencyString || typeof currencyString !== 'string') {
    return 0;
  }
  
  // Remove currency symbol and whitespace
  let cleanString = currencyString
    .replace(config.symbol, '')
    .replace(/\s+/g, '')
    .trim();
  
  // Remove thousands separator
  cleanString = cleanString.replace(new RegExp(`\\${config.thousands_separator}`, 'g'), '');
  
  // Replace decimal separator with standard decimal point
  if (config.decimal_separator !== '.') {
    cleanString = cleanString.replace(config.decimal_separator, '.');
  }
  
  return parseFloat(cleanString) || 0;
}

/**
 * Format amount as compact currency (e.g., R 1.2K, R 3.5M)
 * @param {number} amount - The amount to format
 * @param {object} options - Currency options
 * @returns {string} Formatted compact currency string
 */
function formatCompactCurrency(amount, options = {}) {
  const config = { ...DEFAULT_CURRENCY, ...options };
  
  if (amount === null || amount === undefined || isNaN(amount)) {
    amount = 0;
  }
  
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  let suffix = '';
  let value = numericAmount;
  
  if (Math.abs(value) >= 1000000000) {
    value = value / 1000000000;
    suffix = 'B';
  } else if (Math.abs(value) >= 1000000) {
    value = value / 1000000;
    suffix = 'M';
  } else if (Math.abs(value) >= 1000) {
    value = value / 1000;
    suffix = 'K';
  }
  
  const formattedValue = value.toFixed(1);
  
  if (config.position === 'before') {
    return `${config.symbol} ${formattedValue}${suffix}`;
  } else {
    return `${formattedValue}${suffix} ${config.symbol}`;
  }
}

/**
 * Calculate percentage
 * @param {number} value - The value
 * @param {number} total - The total
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted percentage
 */
function formatPercentage(value, total, decimals = 1) {
  if (!total || total === 0) {
    return '0%';
  }
  
  const percentage = (value / total) * 100;
  return `${percentage.toFixed(decimals)}%`;
}

/**
 * Calculate tax amount
 * @param {number} amount - The base amount
 * @param {number} taxRate - Tax rate as percentage (e.g., 15 for 15%)
 * @returns {number} Tax amount
 */
function calculateTax(amount, taxRate = 15) {
  return (amount * taxRate) / 100;
}

/**
 * Calculate discount amount
 * @param {number} amount - The base amount
 * @param {number} discountRate - Discount rate as percentage
 * @returns {number} Discount amount
 */
function calculateDiscount(amount, discountRate) {
  return (amount * discountRate) / 100;
}

/**
 * Calculate final amount with tax and discount
 * @param {number} subtotal - The subtotal
 * @param {number} taxRate - Tax rate as percentage
 * @param {number} discountRate - Discount rate as percentage
 * @returns {object} Breakdown of amounts
 */
function calculateTotal(subtotal, taxRate = 0, discountRate = 0) {
  const discountAmount = calculateDiscount(subtotal, discountRate);
  const amountAfterDiscount = subtotal - discountAmount;
  const taxAmount = calculateTax(amountAfterDiscount, taxRate);
  const total = amountAfterDiscount + taxAmount;
  
  return {
    subtotal: parseFloat(subtotal.toFixed(2)),
    discount_amount: parseFloat(discountAmount.toFixed(2)),
    tax_amount: parseFloat(taxAmount.toFixed(2)),
    total_amount: parseFloat(total.toFixed(2)),
  };
}

/**
 * Convert amount to different currency
 * @param {number} amount - Amount in base currency
 * @param {number} exchangeRate - Exchange rate
 * @returns {number} Converted amount
 */
function convertCurrency(amount, exchangeRate) {
  return amount * exchangeRate;
}

module.exports = {
  formatCurrency,
  parseCurrency,
  formatCompactCurrency,
  formatPercentage,
  calculateTax,
  calculateDiscount,
  calculateTotal,
  convertCurrency,
  DEFAULT_CURRENCY,
};
