/**
 * CryptoConverter.js
 * A module for converting between different cryptocurrencies
 */

class CryptoConverter {
  constructor() {
    // Exchange rates relative to Bitcoin (BTC)
    this.exchangeRates = {
      BTC: 1,
      ETH: 15.5,    // 1 BTC = 15.5 ETH
      USDT: 29000,  // 1 BTC = 29000 USDT
      BNB: 72,      // 1 BTC = 72 BNB
      SOL: 285,     // 1 BTC = 285 SOL
      XRP: 48000,   // 1 BTC = 48000 XRP
    };
  }

  /**
   * Gets all supported cryptocurrencies
   * @return {Array} List of supported cryptocurrency symbols
   */
  getSupportedCurrencies() {
    return Object.keys(this.exchangeRates);
  }

  /**
   * Updates an exchange rate
   * @param {string} currency - The currency to update
   * @param {number} rate - The new exchange rate relative to BTC
   * @return {boolean} Success status
   */
  updateExchangeRate(currency, rate) {
    if (typeof rate !== 'number' || rate <= 0) {
      throw new Error('Exchange rate must be a positive number');
    }
    
    currency = currency.toUpperCase();
    if (currency === 'BTC') {
      throw new Error('Cannot update BTC rate as it is the base currency');
    }
    
    if (this.exchangeRates.hasOwnProperty(currency)) {
      this.exchangeRates[currency] = rate;
      return true;
    } else {
      // Add new currency
      this.exchangeRates[currency] = rate;
      return true;
    }
  }

  /**
   * Converts an amount from one cryptocurrency to another
   * @param {number} amount - The amount to convert
   * @param {string} fromCurrency - The source cryptocurrency
   * @param {string} toCurrency - The target cryptocurrency
   * @return {number} The converted amount
   */
  convert(amount, fromCurrency, toCurrency) {
    if (typeof amount !== 'number' || amount < 0) {
      throw new Error('Amount must be a non-negative number');
    }
    
    fromCurrency = fromCurrency.toUpperCase();
    toCurrency = toCurrency.toUpperCase();
    
    if (!this.exchangeRates.hasOwnProperty(fromCurrency)) {
      throw new Error(`Unsupported source currency: ${fromCurrency}`);
    }
    
    if (!this.exchangeRates.hasOwnProperty(toCurrency)) {
      throw new Error(`Unsupported target currency: ${toCurrency}`);
    }
    
    // Convert to BTC first, then to target currency
    const amountInBTC = amount / this.exchangeRates[fromCurrency];
    const convertedAmount = amountInBTC * this.exchangeRates[toCurrency];
    
    return convertedAmount;
  }
}

module.exports = CryptoConverter;