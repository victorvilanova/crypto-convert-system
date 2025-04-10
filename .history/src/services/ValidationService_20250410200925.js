// Validation service for input validation and sanitization
export class ValidationService {
  constructor() {
    // Known currency codes for validation
    this.knownCryptoCurrencies = [
      'BTC', 'ETH', 'XRP', 'LTC', 'BCH', 'ADA', 'DOT', 'LINK', 'XLM', 'DOGE',
      'UNI', 'SOL', 'AAVE', 'COMP', 'SNX', 'YFI', 'SUSHI', 'MKR', 'ATOM', 'ALGO'
    ];
    
    this.knownFiatCurrencies = [
      'USD', 'EUR', 'JPY', 'GBP', 'AUD', 'CAD', 'CHF', 'CNY', 'HKD', 'NZD',
      'SEK', 'KRW', 'SGD', 'NOK', 'MXN', 'INR', 'RUB', 'ZAR', 'BRL', 'TRY'
    ];
  }

  /**
   * Validate and sanitize an amount input
   * @param {string|number} amount - Amount to validate
   * @returns {number} Validated and sanitized amount
   * @throws {Error} If amount is invalid
   */
  validateAndSanitizeAmount(amount) {
    // Convert to string and trim
    const stringAmount = String(amount).trim();
    
    // Check if empty
    if (!stringAmount) {
      throw new Error('Amount cannot be empty');
    }
    
    // Convert to number
    const numericAmount = Number(stringAmount.replace(/,/g, '.'));
    
    // Check if valid number
    if (isNaN(numericAmount)) {
      throw new Error('Amount must be a valid number');
    }
    
    // Check if positive
    if (numericAmount <= 0) {
      throw new Error('Amount must be greater than zero');
    }
    
    // Check if too large
    const MAX_AMOUNT = 1000000000; // 1 billion
    if (numericAmount > MAX_AMOUNT) {
      throw new Error(`Amount must be less than ${MAX_AMOUNT}`);
    }
    
    return numericAmount;
  }

  /**
   * Validate if a currency code is valid
   * @param {string} currency - Currency code to validate
   * @returns {boolean} Whether the currency is valid
   */
  isValidCurrency(currency) {
    if (!currency || typeof currency !== 'string') {
      return false;
    }
    
    const normalizedCurrency = currency.trim().toUpperCase();
    
    // Check against known currencies
    return this.knownCryptoCurrencies.includes(normalizedCurrency) || 
           this.knownFiatCurrencies.includes(normalizedCurrency);
  }

  /**
   * Set the list of known currencies (e.g., from API response)
   * @param {Array<Object>} currencies - List of currency objects
   */
  setKnownCurrencies(currencies) {
    if (!Array.isArray(currencies)) return;
    
    // Reset lists
    this.knownCryptoCurrencies = [];
    this.knownFiatCurrencies = [];
    
    // Categorize currencies
    currencies.forEach(currency => {
      if (!currency.code) return;
      
      if (currency.type === 'crypto') {
        this.knownCryptoCurrencies.push(currency.code);
      } else if (currency.type === 'fiat') {
        this.knownFiatCurrencies.push(currency.code);
      }
    });
  }

  /**
   * Validate conversion input parameters
   * @param {Object} params - Parameters for conversion
   * @param {string} params.fromCurrency - Source currency
   * @param {string} params.toCurrency - Target currency
   * @param {number} params.amount - Amount to convert
   * @returns {boolean} Whether the input is valid
   */
  validateConversionInput(params) {
    if (!params) return false;
    
    // Check if currencies are valid
    if (!this.isValidCurrency(params.fromCurrency) || 
        !this.isValidCurrency(params.toCurrency)) {
      return false;
    }
    
    // Check if currencies are the same
    if (params.fromCurrency === params.toCurrency) {
      return false;
    }
    
    // Check if amount is valid
    try {
      this.validateAndSanitizeAmount(params.amount);
    } catch (error) {
      return false;
    }
    
    return true;
  }

  /**
   * Sanitize a string for display (prevents XSS)
   * @param {string} input - String to sanitize
   * @returns {string} Sanitized string
   */
  sanitizeString(input) {
    if (!input || typeof input !== 'string') {
      return '';
    }
    
    // Replace HTML special chars with entities
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Validate API response format
   * @param {Object} response - API response to validate
   * @param {string} type - Type of response ('rates' or 'currencies')
   * @returns {boolean} Whether the response is valid
   */
  validateApiResponse(response, type) {
    if (!response || typeof response !== 'object') {
      return false;
    }
    
    // Validate rates response
    if (type === 'rates') {
      if (!response.rates || typeof response.rates !== 'object') {
        return false;
      }
      
      // Check if rates object has at least some currency entries
      return Object.keys(response.rates).length > 0;
    }
    
    // Validate currencies response
    if (type === 'currencies') {
      // Check if response has currency objects
      return Object.keys(response).length > 0 && 
        Object.values(response).every(curr => 
          curr && typeof curr === 'object' && 
          typeof curr.name === 'string');
    }
    
    return false;
  }
}