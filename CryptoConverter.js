/**
 * CryptoConverter.js
 * A class to handle cryptocurrency conversions
 */

class CryptoConverter {
  constructor() {
    // Initialize with some default conversion rates
    this.conversionRates = {
      BTC: { USD: 60000, EUR: 55000, GBP: 47000 },
      ETH: { USD: 3000, EUR: 2750, GBP: 2350 },
      XRP: { USD: 0.5, EUR: 0.46, GBP: 0.39 },
      LTC: { USD: 80, EUR: 73, GBP: 62 },
      ADA: { USD: 0.4, EUR: 0.37, GBP: 0.31 }
    };
  }

  /**
   * Convert an amount from one cryptocurrency to another
   * @param {number} amount - The amount to convert
   * @param {string} fromCurrency - The source cryptocurrency
   * @param {string} toCurrency - The target cryptocurrency
   * @returns {number} The converted amount
   */
  convert(amount, fromCurrency, toCurrency) {
    // Validate input parameters
    if (!amount || isNaN(amount) || amount <= 0) {
      throw new Error('Invalid amount for conversion');
    }
    
    if (!fromCurrency || !toCurrency) {
      throw new Error('Currency parameters are required');
    }
    
    // Standardize currency codes to uppercase
    fromCurrency = fromCurrency.toUpperCase();
    toCurrency = toCurrency.toUpperCase();
    
    // Check if currencies are supported
    if (!this.isCurrencySupported(fromCurrency) || !this.isCurrencySupported(toCurrency)) {
      throw new Error('One or both currencies are not supported');
    }
    
    // If same currency, return the amount
    if (fromCurrency === toCurrency) {
      return amount;
    }
    
    // Perform conversion using USD as intermediary if direct conversion not available
    if (this.hasDirectConversion(fromCurrency, toCurrency)) {
      return this.directConvert(amount, fromCurrency, toCurrency);
    } else {
      // Convert to USD first, then to target currency
      const usdAmount = this.convertToUSD(amount, fromCurrency);
      return this.convertFromUSD(usdAmount, toCurrency);
    }
  }
  
  /**
   * Check if a currency is supported
   * @param {string} currency - The currency code to check
   * @returns {boolean} Whether the currency is supported
   */
  isCurrencySupported(currency) {
    return this.conversionRates.hasOwnProperty(currency) || 
           Object.values(this.conversionRates).some(rates => rates.hasOwnProperty(currency));
  }
  
  /**
   * Check if direct conversion is available
   * @param {string} fromCurrency - The source currency
   * @param {string} toCurrency - The target currency
   * @returns {boolean} Whether direct conversion is available
   */
  hasDirectConversion(fromCurrency, toCurrency) {
    return this.conversionRates[fromCurrency] && 
           this.conversionRates[fromCurrency][toCurrency] !== undefined;
  }
  
  /**
   * Perform direct conversion between currencies
   * @param {number} amount - The amount to convert
   * @param {string} fromCurrency - The source currency
   * @param {string} toCurrency - The target currency
   * @returns {number} The converted amount
   */
  directConvert(amount, fromCurrency, toCurrency) {
    return amount * this.conversionRates[fromCurrency][toCurrency];
  }
  
  /**
   * Convert a cryptocurrency amount to USD
   * @param {number} amount - The amount to convert
   * @param {string} currency - The source cryptocurrency
   * @returns {number} The amount in USD
   */
  convertToUSD(amount, currency) {
    if (this.conversionRates[currency] && this.conversionRates[currency].USD) {
      return amount * this.conversionRates[currency].USD;
    }
    throw new Error(`No conversion rate found for ${currency} to USD`);
  }
  
  /**
   * Convert a USD amount to a cryptocurrency
   * @param {number} usdAmount - The USD amount to convert
   * @param {string} currency - The target cryptocurrency
   * @returns {number} The amount in the target cryptocurrency
   */
  convertFromUSD(usdAmount, currency) {
    for (const crypto in this.conversionRates) {
      if (crypto === currency && this.conversionRates[crypto].USD) {
        return usdAmount / this.conversionRates[crypto].USD;
      } else if (this.conversionRates[crypto].USD && currency === 'USD') {
        return usdAmount;
      } else if (this.conversionRates[crypto][currency]) {
        return usdAmount / this.conversionRates[crypto][currency] * this.conversionRates[crypto].USD;
      }
    }
    throw new Error(`No conversion rate found from USD to ${currency}`);
  }
  
  /**
   * Update the conversion rate for a currency pair
   * @param {string} fromCurrency - The source cryptocurrency
   * @param {string} toCurrency - The target cryptocurrency
   * @param {number} rate - The new conversion rate
   */
  updateConversionRate(fromCurrency, toCurrency, rate) {
    if (!fromCurrency || !toCurrency || !rate || isNaN(rate) || rate <= 0) {
      throw new Error('Invalid parameters for updating conversion rate');
    }
    
    fromCurrency = fromCurrency.toUpperCase();
    toCurrency = toCurrency.toUpperCase();
    
    // Create structure if it doesn't exist
    if (!this.conversionRates[fromCurrency]) {
      this.conversionRates[fromCurrency] = {};
    }
    
    this.conversionRates[fromCurrency][toCurrency] = rate;
  }
}

module.exports = CryptoConverter;