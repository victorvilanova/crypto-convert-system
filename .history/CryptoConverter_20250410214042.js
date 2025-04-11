/**
 * CryptoConverter.js
 * A service for handling cryptocurrency conversions
 */

class CryptoConverter {
  constructor() {
    // Default exchange rates (could be updated from an API)
    this.exchangeRates = {
      BTC: {
        USD: 45000,
        EUR: 41000,
        GBP: 35000,
        JPY: 5000000,
      },
      ETH: {
        USD: 3000,
        EUR: 2700,
        GBP: 2300,
        JPY: 330000,
      },
      XRP: {
        USD: 0.5,
        EUR: 0.45,
        GBP: 0.38,
        JPY: 55,
      },
      LTC: {
        USD: 150,
        EUR: 135,
        GBP: 115,
        JPY: 16500,
      },
      DOGE: {
        USD: 0.1,
        EUR: 0.09,
        GBP: 0.077,
        JPY: 11,
      }
    };
  }

  /**
   * Convert from one cryptocurrency to another currency
   * 
   * @param {number} amount - The amount to convert
   * @param {string} fromCurrency - The source cryptocurrency (BTC, ETH, etc.)
   * @param {string} toCurrency - The target currency (USD, EUR, etc.)
   * @returns {number} The converted amount
   */
  convert(amount, fromCurrency, toCurrency) {
    if (!amount || isNaN(amount)) {
      throw new Error('Invalid amount provided');
    }

    fromCurrency = fromCurrency.toUpperCase();
    toCurrency = toCurrency.toUpperCase();

    // Check if currencies are supported
    if (!this.exchangeRates[fromCurrency]) {
      throw new Error(`Unsupported source currency: ${fromCurrency}`);
    }

    if (!this.exchangeRates[fromCurrency][toCurrency]) {
      throw new Error(`Unsupported target currency: ${toCurrency}`);
    }

    // Perform the conversion
    const rate = this.exchangeRates[fromCurrency][toCurrency];
    return amount * rate;
  }

  /**
   * Update the exchange rates (could be called periodically)
   * 
   * @param {Object} newRates - New exchange rates to update
   */
  updateRates(newRates) {
    if (!newRates || typeof newRates !== 'object') {
      throw new Error('Invalid rates provided');
    }

    // Deep merge the new rates with existing ones
    for (const [currency, rates] of Object.entries(newRates)) {
      if (!this.exchangeRates[currency]) {
        this.exchangeRates[currency] = {};
      }
      
      for (const [targetCurrency, rate] of Object.entries(rates)) {
        this.exchangeRates[currency][targetCurrency] = rate;
      }
    }
  }

  /**
   * Get all available source currencies
   * 
   * @returns {Array} List of available source currencies
   */
  getSourceCurrencies() {
    return Object.keys(this.exchangeRates);
  }

  /**
   * Get all available target currencies for a source currency
   * 
   * @param {string} sourceCurrency - The source cryptocurrency
   * @returns {Array} List of available target currencies
   */
  getTargetCurrencies(sourceCurrency) {
    if (!sourceCurrency || !this.exchangeRates[sourceCurrency.toUpperCase()]) {
      return [];
    }
    
    return Object.keys(this.exchangeRates[sourceCurrency.toUpperCase()]);
  }
}

// Export the class for use in other files
export default CryptoConverter;