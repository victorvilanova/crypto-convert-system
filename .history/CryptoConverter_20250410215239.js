/**
 * CryptoConverter.js
 * A utility for converting between different cryptocurrencies
 */

class CryptoConverter {
  constructor() {
    // Initialize with some default exchange rates
    this.exchangeRates = {
      BTC: { USD: 50000, EUR: 42000, ETH: 15.5 },
      ETH: { USD: 3200, EUR: 2700, BTC: 0.064 },
      XRP: { USD: 0.75, EUR: 0.63, BTC: 0.000015 },
      LTC: { USD: 150, EUR: 126, BTC: 0.003 }
    };
    
    this.lastUpdated = new Date();
  }

  /**
   * Convert from one cryptocurrency/currency to another
   * @param {number} amount - The amount to convert
   * @param {string} fromCurrency - The source currency
   * @param {string} toCurrency - The target currency
   * @returns {number} The converted amount
   */
  convert(amount, fromCurrency, toCurrency) {
    // Validate inputs
    if (!amount || isNaN(amount) || amount <= 0) {
      throw new Error('Invalid amount. Please provide a positive number.');
    }

    if (!fromCurrency || !toCurrency) {
      throw new Error('Both source and target currencies are required.');
    }

    fromCurrency = fromCurrency.toUpperCase();
    toCurrency = toCurrency.toUpperCase();

    // Direct conversion
    if (fromCurrency === toCurrency) {
      return amount;
    }

    // Check if we have direct conversion rate
    if (this.exchangeRates[fromCurrency] && this.exchangeRates[fromCurrency][toCurrency]) {
      return amount * this.exchangeRates[fromCurrency][toCurrency];
    }

    // Try inverse conversion
    if (this.exchangeRates[toCurrency] && this.exchangeRates[toCurrency][fromCurrency]) {
      return amount / this.exchangeRates[toCurrency][fromCurrency];
    }

    // Try conversion through USD
    if (this.exchangeRates[fromCurrency]?.USD && this.exchangeRates[toCurrency]?.USD) {
      const usdAmount = amount * this.exchangeRates[fromCurrency].USD;
      return usdAmount / this.exchangeRates[toCurrency].USD;
    }

    throw new Error(`Unable to convert from ${fromCurrency} to ${toCurrency}. Conversion rate not available.`);
  }

  /**
   * Update the exchange rate between two currencies
   * @param {string} fromCurrency - The source currency
   * @param {string} toCurrency - The target currency
   * @param {number} rate - The new exchange rate
   */
  updateExchangeRate(fromCurrency, toCurrency, rate) {
    if (!fromCurrency || !toCurrency || !rate) {
      throw new Error('Invalid parameters. Currency codes and rate are required.');
    }

    if (isNaN(rate) || rate <= 0) {
      throw new Error('Rate must be a positive number.');
    }

    fromCurrency = fromCurrency.toUpperCase();
    toCurrency = toCurrency.toUpperCase();

    // Create currency object if it doesn't exist
    if (!this.exchangeRates[fromCurrency]) {
      this.exchangeRates[fromCurrency] = {};
    }

    this.exchangeRates[fromCurrency][toCurrency] = rate;
    this.lastUpdated = new Date();
  }

  /**
   * Get all available currencies for conversion
   * @returns {string[]} List of available currencies
   */
  getAvailableCurrencies() {
    return [...new Set([
      ...Object.keys(this.exchangeRates),
      ...Object.values(this.exchangeRates).flatMap(rates => Object.keys(rates))
    ])];
  }

  /**
   * Get the last time exchange rates were updated
   * @returns {Date} Timestamp of last update
   */
  getLastUpdated() {
    return this.lastUpdated;
  }
}

module.exports = CryptoConverter;