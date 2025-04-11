/**
 * CryptoConverter.js
 * Handles cryptocurrency conversion functionality
 */

class CryptoConverter {
  constructor() {
    this.exchangeRates = {};
    this.lastUpdated = null;
  }

  /**
   * Initialize the converter with default exchange rates
   * @returns {Promise} Resolves when initialization is complete
   */
  async initialize() {
    // Default rates in case API is unavailable
    this.exchangeRates = {
      BTC: { USD: 50000, EUR: 45000, GBP: 40000 },
      ETH: { USD: 3000, EUR: 2700, GBP: 2400 },
      XRP: { USD: 0.5, EUR: 0.45, GBP: 0.4 },
      LTC: { USD: 200, EUR: 180, GBP: 160 }
    };
    
    // Try to fetch real rates from API
    try {
      await this.updateRates();
    } catch (error) {
      console.warn('Using default rates due to error:', error.message);
    }
    
    return this;
  }

  /**
   * Update exchange rates from external API
   * @returns {Promise} Resolves when rates are updated
   */
  async updateRates() {
    try {
      // In a real implementation, you would fetch from a crypto API
      // For example: const response = await fetch('https://api.coinbase.com/v2/exchange-rates')
      
      // Simulating API response for now
      const mockApiResponse = {
        BTC: { USD: 52000, EUR: 47000, GBP: 42000 },
        ETH: { USD: 3200, EUR: 2900, GBP: 2600 },
        XRP: { USD: 0.55, EUR: 0.5, GBP: 0.45 },
        LTC: { USD: 220, EUR: 200, GBP: 180 }
      };
      
      this.exchangeRates = mockApiResponse;
      this.lastUpdated = new Date();
      
      return this.exchangeRates;
    } catch (error) {
      console.error('Error updating rates:', error);
      throw error;
    }
  }

  /**
   * Convert between cryptocurrencies or to fiat currencies
   * @param {number} amount - Amount to convert
   * @param {string} fromCurrency - Source currency code
   * @param {string} toCurrency - Target currency code
   * @returns {number} Converted amount
   */
  convert(amount, fromCurrency, toCurrency) {
    // Validate inputs
    if (!amount || isNaN(amount) || amount <= 0) {
      throw new Error('Invalid amount');
    }
    
    if (!fromCurrency || !toCurrency) {
      throw new Error('Currency codes are required');
    }
    
    fromCurrency = fromCurrency.toUpperCase();
    toCurrency = toCurrency.toUpperCase();
    
    // Check if currencies are supported
    if (!this.isCurrencySupported(fromCurrency) || !this.isCurrencySupported(toCurrency)) {
      throw new Error('Unsupported currency');
    }
    
    // Direct conversion between fiat currencies not supported
    const fiatCurrencies = ['USD', 'EUR', 'GBP'];
    if (fiatCurrencies.includes(fromCurrency) && fiatCurrencies.includes(toCurrency)) {
      throw new Error('Direct conversion between fiat currencies not supported');
    }
    
    // Handle different conversion scenarios
    if (fromCurrency === toCurrency) {
      return amount; // Same currency, no conversion needed
    }
    
    // Crypto to fiat conversion
    if (this.exchangeRates[fromCurrency] && this.exchangeRates[fromCurrency][toCurrency]) {
      return amount * this.exchangeRates[fromCurrency][toCurrency];
    }
    
    // Fiat to crypto conversion
    if (fiatCurrencies.includes(fromCurrency) && this.exchangeRates[toCurrency]) {
      // Find the inverse rate
      const inverseRate = 1 / this.exchangeRates[toCurrency][fromCurrency];
      return amount * inverseRate;
    }
    
    // Crypto to crypto conversion (via USD)
    if (this.exchangeRates[fromCurrency] && this.exchangeRates[toCurrency]) {
      const fromToUSD = this.exchangeRates[fromCurrency].USD;
      const usdToTarget = 1 / this.exchangeRates[toCurrency].USD;
      return amount * fromToUSD * usdToTarget;
    }
    
    throw new Error('Conversion not possible with available rates');
  }

  /**
   * Check if a currency is supported
   * @param {string} currencyCode - Currency code to check
   * @returns {boolean} True if supported
   */
  isCurrencySupported(currencyCode) {
    const fiatCurrencies = ['USD', 'EUR', 'GBP'];
    return fiatCurrencies.includes(currencyCode) || this.exchangeRates[currencyCode] !== undefined;
  }

  /**
   * Get all supported currencies
   * @returns {Array} List of supported currency codes
   */
  getSupportedCurrencies() {
    const fiatCurrencies = ['USD', 'EUR', 'GBP'];
    const cryptoCurrencies = Object.keys(this.exchangeRates);
    return [...cryptoCurrencies, ...fiatCurrencies];
  }
}

module.exports = CryptoConverter;