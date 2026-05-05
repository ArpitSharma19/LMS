/**
 * Currency Formatter Utility
 * Standardizes currency display across the application to Indian Rupees (₹).
 */

const CURRENCY_CONFIG = {
  locale: 'en-IN',
  currency: 'INR',
  symbol: '₹'
};

/**
 * Formats a number as Indian Rupees (INR)
 * @param {number|string} amount - The numeric value to format
 * @returns {string} - The formatted currency string (e.g., ₹1,000)
 */
export const formatCurrency = (amount) => {
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numericAmount)) {
    return `${CURRENCY_CONFIG.symbol}0`;
  }

  return new Intl.NumberFormat(CURRENCY_CONFIG.locale, {
    style: 'currency',
    currency: CURRENCY_CONFIG.currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(numericAmount);
};

/**
 * Returns the standardized currency symbol
 * @returns {string} - The currency symbol (₹)
 */
export const getCurrencySymbol = () => CURRENCY_CONFIG.symbol;
