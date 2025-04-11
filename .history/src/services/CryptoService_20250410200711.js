// Service responsible for crypto-related operations and API interactions
export class CryptoService {
  constructor({ apiCache, errorHandler, configService }) {
    this.apiCache = apiCache;
    this.errorHandler = errorHandler;
    this.configService = configService;
    this.apiBaseUrl = this.configService.getApiBaseUrl();
    this.apiKey = this.configService.getApiKey();
  }

  async getSupportedCurrencies() {
    try {
      // Try to get from cache first
      const cachedCurrencies = this.apiCache.get('supportedCurrencies');
      if (cachedCurrencies) {
        return cachedCurrencies;
      }

      // Fetch from API if not in cache
      const response = await fetch(`${this.apiBaseUrl}/currencies?apiKey=${this.apiKey}`);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Process and sort currencies
      const currencies = Object.keys(data).map(code => ({
        code,
        name: data[code].name,
        symbol: data[code].symbol || code,
        type: this.determineCurrencyType(code)
      }));
      
      // Cache the result (currencies don't change often)
      this.apiCache.set('supportedCurrencies', currencies, 86400000); // 24 hours
      
      return currencies;
    } catch (error) {
      this.errorHandler.handleError(error, 'Failed to fetch supported currencies');
      // Return a minimal fallback set
      return [
        { code: 'BTC', name: 'Bitcoin', symbol: '₿', type: 'crypto' },
        { code: 'ETH', name: 'Ethereum', symbol: 'Ξ', type: 'crypto' },
        { code: 'USD', name: 'US Dollar', symbol: '$', type: 'fiat' },
        { code: 'EUR', name: 'Euro', symbol: '€', type: 'fiat' }
      ];
    }
  }

  async getCurrentRates() {
    try {
      // Check if we have recent rates in cache
      const cachedRates = this.apiCache.get('currentRates');
      if (cachedRates) {
        return cachedRates;
      }
      
      const response = await fetch(`${this.apiBaseUrl}/rates?apiKey=${this.apiKey}`);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Cache the result with a shorter expiration (rates change frequently)
      this.apiCache.set('currentRates', data.rates, 300000); // 5 minutes
      
      return data.rates;
    } catch (error) {
      this.errorHandler.handleError(error, 'Failed to fetch current rates');
      throw error; // Re-throw to let caller handle it
    }
  }

  async convertCurrency(fromCurrency, toCurrency, amount) {
    try {
      // Get the latest rates
      let rates = this.apiCache.get('currentRates');
      
      // If no rates in cache or they're expired, fetch new ones
      if (!rates) {
        rates = await this.getCurrentRates();
      }
      
      // Calculate conversion
      const fromRate = rates[fromCurrency];
      const toRate = rates[toCurrency];
      
      if (!fromRate || !toRate) {
        throw new Error(`Rate not available for ${!fromRate ? fromCurrency : toCurrency}`);
      }
      
      // Convert to common base (usually USD) then to target currency
      const valueInBase = amount / fromRate;
      const convertedAmount = valueInBase * toRate;
      
      // Calculate the direct conversion rate
      const rate = toRate / fromRate;
      
      // Log the conversion for analytics
      this.logConversion({
        fromCurrency,
        toCurrency,
        amount,
        convertedAmount,
        rate,
        timestamp: new Date()
      });
      
      return {
        fromCurrency,
        toCurrency,
        amount,
        convertedAmount,
        rate,
        timestamp: new Date()
      };
    } catch (error) {
      this.errorHandler.handleError(error, 'Currency conversion failed');
      throw error; // Re-throw to let caller handle it
    }
  }

  determineCurrencyType(code) {
    // Common crypto currencies
    const cryptoCurrencies = ['BTC', 'ETH', 'XRP', 'LTC', 'BCH', 'ADA', 'DOT', 'LINK', 'XLM', 'DOGE'];
    return cryptoCurrencies.includes(code) ? 'crypto' : 'fiat';
  }

  logConversion(conversionData) {
    // Save conversion history for analytics or user history
    try {
      const history = JSON.parse(localStorage.getItem('conversionHistory') || '[]');
      history.push(conversionData);
      
      // Keep only the last 10 conversions to avoid localStorage size issues
      if (history.length > 10) {
        history.shift(); // Remove oldest entry
      }
      
      localStorage.setItem('conversionHistory', JSON.stringify(history));
    } catch (error) {
      // Non-critical error, just log it
      console.warn('Failed to log conversion history', error);
    }
  }
}