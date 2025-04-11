/**
 * CryptoConverter.js
 * A class for handling cryptocurrency conversions
 */

class CryptoConverter {
  constructor() {
    this.exchangeRates = {
      'BTC': { 'USD': 50000, 'EUR': 45000, 'ETH': 15 },
      'ETH': { 'USD': 3000, 'EUR': 2700, 'BTC': 0.067 },
      'ADA': { 'USD': 1.2, 'EUR': 1.1, 'BTC': 0.000024 },
      'DOT': { 'USD': 30, 'EUR': 27, 'BTC': 0.0006 },
      'XRP': { 'USD': 0.9, 'EUR': 0.81, 'BTC': 0.000018 }
    };
  }

  /**
   * Convert from one cryptocurrency or fiat currency to another
   * @param {number} amount - The amount to convert
   * @param {string} fromCurrency - The currency to convert from
   * @param {string} toCurrency - The currency to convert to
   * @returns {number|null} - The converted amount or null if conversion is not possible
   */
  convert(amount, fromCurrency, toCurrency) {
    // Validate input
    if (!amount || isNaN(amount) || amount <= 0) {
      console.error('Invalid amount provided');
      return null;
    }

    fromCurrency = fromCurrency.toUpperCase();
    toCurrency = toCurrency.toUpperCase();

    // If currencies are the same, return the original amount
    if (fromCurrency === toCurrency) {
      return amount;
    }

    // Direct conversion
    if (this.exchangeRates[fromCurrency] && this.exchangeRates[fromCurrency][toCurrency]) {
      return amount * this.exchangeRates[fromCurrency][toCurrency];
    }

    // Reverse conversion
    if (this.exchangeRates[toCurrency] && this.exchangeRates[toCurrency][fromCurrency]) {
      return amount / this.exchangeRates[toCurrency][fromCurrency];
    }

    // Conversion through USD as base currency
    if (this.exchangeRates[fromCurrency] && this.exchangeRates[fromCurrency]['USD'] &&
        this.exchangeRates[toCurrency] && this.exchangeRates[toCurrency]['USD']) {
      const usdAmount = amount * this.exchangeRates[fromCurrency]['USD'];
      return usdAmount / this.exchangeRates[toCurrency]['USD'];
    }

    console.error(`Conversion from ${fromCurrency} to ${toCurrency} is not supported`);
    return null;
  }

  /**
   * Update exchange rate for a specific pair of currencies
   * @param {string} fromCurrency - Base currency
   * @param {string} toCurrency - Target currency
   * @param {number} rate - New exchange rate
   * @returns {boolean} - Success status
   */
  updateExchangeRate(fromCurrency, toCurrency, rate) {
    fromCurrency = fromCurrency.toUpperCase();
    toCurrency = toCurrency.toUpperCase();
    
    if (isNaN(rate) || rate <= 0) {
      console.error('Invalid exchange rate provided');
      return false;
    }

    // Initialize if not exists
    if (!this.exchangeRates[fromCurrency]) {
      this.exchangeRates[fromCurrency] = {};
    }

    this.exchangeRates[fromCurrency][toCurrency] = rate;
    return true;
  }

  /**
   * Get all supported currencies
   * @returns {string[]} - Array of supported currency codes
   */
  getSupportedCurrencies() {
    const currencies = new Set();
    
    // Add all base currencies
    Object.keys(this.exchangeRates).forEach(currency => {
      currencies.add(currency);
      
      // Add all target currencies for each base currency
      Object.keys(this.exchangeRates[currency]).forEach(targetCurrency => {
        currencies.add(targetCurrency);
      });
    });
    
    return Array.from(currencies);
  }
}

module.exports = CryptoConverter;