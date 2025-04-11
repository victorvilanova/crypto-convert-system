/**
 * CryptoConverter.js
 * A module to handle cryptocurrency conversions
 */

class CryptoConverter {
  constructor(apiKey = null) {
    this.apiKey = apiKey;
    this.exchangeRates = {};
    this.lastUpdated = null;
  }

  /**
   * Initialize the converter with exchange rates
   * @param {Object} initialRates - Initial exchange rates to use
   */
  initialize(initialRates = {}) {
    this.exchangeRates = initialRates;
    this.lastUpdated = new Date();
    return this;
  }

  /**
   * Fetch the latest exchange rates from an API
   * @param {string} baseCurrency - The base currency for rates
   * @returns {Promise<Object>} - The updated exchange rates
   */
  async fetchRates(baseCurrency = 'USD') {
    try {
      // API endpoint could be configured based on provider
      const endpoint = this.apiKey 
        ? `https://api.example.com/crypto/rates?base=${baseCurrency}&api_key=${this.apiKey}`
        : `https://api.example.com/crypto/rates?base=${baseCurrency}`;
        
      // Simulate API call (replace with actual fetch in production)
      // const response = await fetch(endpoint);
      // const data = await response.json();
      
      // For demo purposes, return mock data
      const mockData = {
        base: baseCurrency,
        rates: {
          BTC: 0.000016,
          ETH: 0.00025,
          XRP: 0.5,
          LTC: 0.0048,
          ADA: 0.32,
        },
        timestamp: Date.now()
      };
      
      this.exchangeRates = mockData.rates;
      this.lastUpdated = new Date(mockData.timestamp);
      
      return this.exchangeRates;
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
      throw new Error('Failed to fetch exchange rates');
    }
  }

  /**
   * Convert an amount from one cryptocurrency to another
   * @param {number} amount - The amount to convert
   * @param {string} fromCurrency - The source currency
   * @param {string} toCurrency - The target currency
   * @returns {number} - The converted amount
   */
  convert(amount, fromCurrency, toCurrency) {
    if (!amount || isNaN(amount)) {
      throw new Error('Invalid amount for conversion');
    }
    
    if (!this.exchangeRates[fromCurrency] || !this.exchangeRates[toCurrency]) {
      throw new Error(`Exchange rate not available for ${fromCurrency} or ${toCurrency}`);
    }
    
    // If converting to and from the same currency
    if (fromCurrency === toCurrency) {
      return amount;
    }
    
    // Calculate the conversion
    const fromRate = this.exchangeRates[fromCurrency];
    const toRate = this.exchangeRates[toCurrency];
    
    return (amount * toRate) / fromRate;
  }
  
  /**
   * Get all available exchange rates
   * @returns {Object} - The current exchange rates
   */
  getRates() {
    return {
      rates: this.exchangeRates,
      lastUpdated: this.lastUpdated
    };
  }
}

module.exports = CryptoConverter;