// Configuration service for managing application settings
export class ConfigService {
  constructor() {
    this.config = {
      // API configuration
      api: {
        baseUrl: 'https://api.cryptodata.example.com/v1',
        apiKey: 'demo-api-key', // In production, use environment variables
        timeout: 10000, // 10 seconds timeout for API calls
      },
      
      // Application settings
      app: {
        defaultFromCurrency: 'BTC',
        defaultToCurrency: 'USD',
        defaultAmount: 1,
        autoRefreshRates: true,
        refreshInterval: 300000, // 5 minutes
        historyLimit: 10,
        theme: 'light',
        decimalPrecision: {
          crypto: 8,
          fiat: 2
        }
      },
      
      // Feature flags
      features: {
        conversionHistory: true,
        favoriteConversions: true,
        darkMode: true,
        offlineMode: false, // Not implemented yet
        charts: false // Not implemented yet
      }
    };
    
    // Load saved config from localStorage
    this.loadSavedConfig();
  }
  
  /**
   * Load saved configuration from localStorage
   * @private
   */
  loadSavedConfig() {
    try {
      const savedConfig = localStorage.getItem('appConfig');
      if (savedConfig) {
        const parsedConfig = JSON.parse(savedConfig);
        // Merge saved config with default config
        this.config = this.mergeConfigs(this.config, parsedConfig);
      }
    } catch (error) {
      console.warn('Failed to load configuration from localStorage', error);
    }
  }
  
  /**
   * Merge configurations, keeping defaults for missing values
   * @param {Object} defaultConfig - Default configuration
   * @param {Object} savedConfig - Saved configuration
   * @returns {Object} Merged configuration
   * @private
   */
  mergeConfigs(defaultConfig, savedConfig) {
    const result = { ...defaultConfig };
    
    // Iterate through saved config and update default values
    for (const section in savedConfig) {
      if (typeof savedConfig[section] === 'object' && savedConfig[section] !== null) {
        result[section] = { 
          ...defaultConfig[section] || {}, 
          ...savedConfig[section] 
        };
      } else {
        result[section] = savedConfig[section];
      }
    }
    
    return result;
  }
  
  /**
   * Get the API base URL
   * @returns {string} API base URL
   */
  getApiBaseUrl() {
    return this.config.api.baseUrl;
  }
  
  /**
   * Get the API key
   * @returns {string} API key
   */
  getApiKey() {
    return this.config.api.apiKey;
  }
  
  /**
   * Get API request timeout
   * @returns {number} Timeout in milliseconds
   */
  getApiTimeout() {
    return this.config.api.timeout;
  }
  
  /**
   * Get default 'from' currency
   * @returns {string} Default from currency code
   */
  getDefaultFromCurrency() {
    return this.config.app.defaultFromCurrency;
  }
  
  /**
   * Get default 'to' currency
   * @returns {string} Default to currency code
   */
  getDefaultToCurrency() {
    return this.config.app.defaultToCurrency;
  }
  
  /**
   * Get default amount
   * @returns {number} Default amount
   */
  getDefaultAmount() {
    return this.config.app.defaultAmount;
  }
  
  /**
   * Get rate refresh interval
   * @returns {number} Refresh interval in milliseconds
   */
  getRefreshInterval() {
    return this.config.app.refreshInterval;
  }
  
  /**
   * Check if auto refresh is enabled
   * @returns {boolean} Auto refresh enabled status
   */
  isAutoRefreshEnabled() {
    return this.config.app.autoRefreshRates;
  }
  
  /**
   * Get decimal precision for a currency type
   * @param {string} type - 'crypto' or 'fiat'
   * @returns {number} Number of decimal places
   */
  getDecimalPrecision(type) {
    return type === 'crypto' 
      ? this.config.app.decimalPrecision.crypto 
      : this.config.app.decimalPrecision.fiat;
  }
  
  /**
   * Check if a feature is enabled
   * @param {string} featureName - Name of the feature
   * @returns {boolean} Whether the feature is enabled
   */
  isFeatureEnabled(featureName) {
    return this.config.features[featureName] === true;
  }
  
  /**
   * Get current theme
   * @returns {string} Theme name ('light' or 'dark')
   */
  getTheme() {
    return this.config.app.theme;
  }
  
  /**
   * Update a configuration value
   * @param {string} section - Config section ('api', 'app', 'features')
   * @param {string} key - Config key
   * @param {*} value - New value
   */
  updateConfig(section, key, value) {
    if (this.config[section]) {
      this.config[section][key] = value;
      this.saveConfig();
      
      // Emit config change event
      this.emitConfigChangeEvent(section, key, value);
    }
  }
  
  /**
   * Save configuration to localStorage
   * @private
   */
  saveConfig() {
    try {
      localStorage.setItem('appConfig', JSON.stringify(this.config));
    } catch (error) {
      console.warn('Failed to save configuration to localStorage', error);
    }
  }
  
  /**
   * Reset configuration to defaults
   */
  resetConfig() {
    try {
      localStorage.removeItem('appConfig');
      // Re-initialize with default values
      this.constructor();
    } catch (error) {
      console.warn('Failed to reset configuration', error);
    }
  }
  
  /**
   * Emit a config change event
   * @param {string} section - Config section
   * @param {string} key - Config key
   * @param {*} value - New value
   * @private
   */
  emitConfigChangeEvent(section, key, value) {
    const event = new CustomEvent('configchange', {
      detail: { section, key, value }
    });
    document.dispatchEvent(event);
  }
}