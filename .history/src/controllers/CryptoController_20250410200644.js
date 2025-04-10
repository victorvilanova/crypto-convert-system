// Controller responsible for managing application flow and business logic
export class CryptoController {
  constructor({ service, view, stateManager, validationService, errorHandler }) {
    this.service = service;
    this.view = view;
    this.stateManager = stateManager;
    this.validationService = validationService;
    this.errorHandler = errorHandler;
    
    // Bind methods to preserve 'this' context
    this.handleCurrencyChange = this.handleCurrencyChange.bind(this);
    this.handleAmountChange = this.handleAmountChange.bind(this);
    this.handleConvert = this.handleConvert.bind(this);
    this.refreshRates = this.refreshRates.bind(this);
  }

  init() {
    try {
      // Set up event listeners using the view
      this.view.bindCurrencyChangeEvent(this.handleCurrencyChange);
      this.view.bindAmountChangeEvent(this.handleAmountChange);
      this.view.bindConvertEvent(this.handleConvert);
      
      // Initial data loading
      this.loadInitialData();
      
      // Set up automatic rate refresh
      this.setupRateRefresh();
    } catch (error) {
      this.errorHandler.handleError(error, 'Failed to initialize controller');
    }
  }

  async loadInitialData() {
    try {
      this.view.showLoading(true);
      
      // Load available currencies
      const currencies = await this.service.getSupportedCurrencies();
      this.stateManager.setState('currencies', currencies);
      this.view.renderCurrencyOptions(currencies);
      
      // Load initial rates
      await this.refreshRates();
      
      // Set default values
      const defaultState = {
        fromCurrency: 'BTC',
        toCurrency: 'USD',
        amount: 1,
        convertedAmount: 0
      };
      this.stateManager.setMultipleStates(defaultState);
      this.view.setInitialValues(defaultState);
      
      // Do initial conversion
      await this.handleConvert();
      
      this.view.showLoading(false);
    } catch (error) {
      this.view.showLoading(false);
      this.errorHandler.handleError(error, 'Failed to load initial data');
    }
  }

  async refreshRates() {
    try {
      const rates = await this.service.getCurrentRates();
      this.stateManager.setState('rates', rates);
      this.view.updateLastUpdated(new Date());
      return rates;
    } catch (error) {
      this.errorHandler.handleError(error, 'Failed to refresh rates');
      return this.stateManager.getState('rates') || {};
    }
  }

  setupRateRefresh() {
    // Refresh rates every 5 minutes (300000ms) to avoid excessive API calls
    const REFRESH_INTERVAL = 300000;
    setInterval(this.refreshRates, REFRESH_INTERVAL);
  }

  handleCurrencyChange(type, currency) {
    try {
      if (!this.validationService.isValidCurrency(currency)) {
        throw new Error('Invalid currency selected');
      }
      
      // Update state based on which currency selector changed
      if (type === 'from') {
        this.stateManager.setState('fromCurrency', currency);
      } else if (type === 'to') {
        this.stateManager.setState('toCurrency', currency);
      }
      
      // Trigger conversion with new values
      this.handleConvert();
    } catch (error) {
      this.errorHandler.handleError(error, 'Currency change failed');
    }
  }

  handleAmountChange(amount) {
    try {
      const validatedAmount = this.validationService.validateAndSanitizeAmount(amount);
      this.stateManager.setState('amount', validatedAmount);
    } catch (error) {
      this.errorHandler.handleError(error, 'Invalid amount');
      this.view.showInputError('amount', error.message);
    }
  }

  async handleConvert() {
    try {
      this.view.showLoading(true);
      this.view.clearErrors();
      
      // Get current state values
      const state = this.stateManager.getMultipleStates([
        'fromCurrency', 
        'toCurrency', 
        'amount'
      ]);
      
      // Validate conversion input
      if (!this.validationService.validateConversionInput(state)) {
        throw new Error('Invalid conversion parameters');
      }
      
      // Perform conversion
      const result = await this.service.convertCurrency(
        state.fromCurrency,
        state.toCurrency,
        state.amount
      );
      
      // Update state and view
      this.stateManager.setState('convertedAmount', result.convertedAmount);
      this.stateManager.setState('conversionRate', result.rate);
      this.stateManager.setState('lastConversion', {
        timestamp: new Date(),
        ...state,
        result: result.convertedAmount
      });
      
      this.view.displayConversionResult(result);
      this.view.updateConversionHistory(this.stateManager.getState('lastConversion'));
      this.view.showLoading(false);
    } catch (error) {
      this.view.showLoading(false);
      this.errorHandler.handleError(error, 'Conversion failed');
      this.view.showConversionError(error.message);
    }
  }
}