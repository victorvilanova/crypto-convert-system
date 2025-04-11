// View component responsible for rendering UI and handling user interactions
export class CryptoView {
  constructor({ stateManager, errorHandler }) {
    this.stateManager = stateManager;
    this.errorHandler = errorHandler;
    this.initializeElements();
  }

  initializeElements() {
    // Form elements
    this.fromCurrencySelect = document.getElementById('fromCurrency');
    this.toCurrencySelect = document.getElementById('toCurrency');
    this.amountInput = document.getElementById('amount');
    this.convertButton = document.getElementById('convertBtn');
    
    // Result elements
    this.resultContainer = document.getElementById('resultContainer');
    this.convertedAmountElement = document.getElementById('convertedAmount');
    this.conversionRateElement = document.getElementById('conversionRate');
    this.lastUpdatedElement = document.getElementById('lastUpdated');
    
    // Loading and error elements
    this.loadingIndicator = document.getElementById('loadingIndicator');
    this.errorContainer = document.getElementById('errorContainer');
    this.errorMessage = document.getElementById('errorMessage');
    
    // History container
    this.historyContainer = document.getElementById('conversionHistory');
    
    // Create elements if they don't exist
    this.createMissingElements();
  }

  createMissingElements() {
    // Create any missing UI elements that our application needs
    if (!this.loadingIndicator) {
      this.loadingIndicator = document.createElement('div');
      this.loadingIndicator.id = 'loadingIndicator';
      this.loadingIndicator.className = 'loading-indicator';
      this.loadingIndicator.innerHTML = '<span class="spinner"></span> Loading...';
      document.body.appendChild(this.loadingIndicator);
    }
    
    if (!this.errorContainer) {
      this.errorContainer = document.createElement('div');
      this.errorContainer.id = 'errorContainer';
      this.errorContainer.className = 'error-container';
      this.errorContainer.style.display = 'none';
      
      this.errorMessage = document.createElement('p');
      this.errorMessage.id = 'errorMessage';
      this.errorContainer.appendChild(this.errorMessage);
      
      const closeButton = document.createElement('button');
      closeButton.textContent = '×';
      closeButton.className = 'close-error';
      closeButton.addEventListener('click', () => this.clearErrors());
      this.errorContainer.appendChild(closeButton);
      
      document.body.appendChild(this.errorContainer);
    }
    
    if (!this.historyContainer) {
      this.historyContainer = document.createElement('div');
      this.historyContainer.id = 'conversionHistory';
      this.historyContainer.className = 'history-container';
      this.historyContainer.innerHTML = '<h3>Conversion History</h3><ul class="history-list"></ul>';
      
      // Find a suitable location in the DOM to append it
      const mainContainer = document.querySelector('.container') || document.body;
      mainContainer.appendChild(this.historyContainer);
    }
  }

  renderCurrencyOptions(currencies) {
    if (!this.fromCurrencySelect || !this.toCurrencySelect) {
      this.errorHandler.handleError(new Error('Currency select elements not found'), 'UI Rendering Error');
      return;
    }
    
    // Sort currencies: cryptocurrencies first, then fiat
    const sortedCurrencies = [...currencies].sort((a, b) => {
      // First sort by type (crypto first)
      if (a.type !== b.type) {
        return a.type === 'crypto' ? -1 : 1;
      }
      // Then sort by code alphabetically
      return a.code.localeCompare(b.code);
    });
    
    // Clear existing options first
    this.fromCurrencySelect.innerHTML = '';
    this.toCurrencySelect.innerHTML = '';
    
    // Create option groups
    const createOptionGroup = (select, type, label) => {
      const group = document.createElement('optgroup');
      group.label = label;
      
      sortedCurrencies
        .filter(currency => currency.type === type)
        .forEach(currency => {
          const option = document.createElement('option');
          option.value = currency.code;
          option.textContent = `${currency.code} - ${currency.name}`;
          option.dataset.symbol = currency.symbol;
          group.appendChild(option);
        });
      
      select.appendChild(group);
    };
    
    // Add cryptocurrency options
    createOptionGroup(this.fromCurrencySelect, 'crypto', 'Cryptocurrencies');
    createOptionGroup(this.toCurrencySelect, 'crypto', 'Cryptocurrencies');
    
    // Add fiat currency options
    createOptionGroup(this.fromCurrencySelect, 'fiat', 'Fiat Currencies');
    createOptionGroup(this.toCurrencySelect, 'fiat', 'Fiat Currencies');
  }

  setInitialValues(defaultState) {
    if (this.fromCurrencySelect) {
      this.fromCurrencySelect.value = defaultState.fromCurrency;
    }
    
    if (this.toCurrencySelect) {
      this.toCurrencySelect.value = defaultState.toCurrency;
    }
    
    if (this.amountInput) {
      this.amountInput.value = defaultState.amount;
    }
  }

  bindCurrencyChangeEvent(handler) {
    if (this.fromCurrencySelect) {
      this.fromCurrencySelect.addEventListener('change', (e) => {
        handler('from', e.target.value);
      });
    }
    
    if (this.toCurrencySelect) {
      this.toCurrencySelect.addEventListener('change', (e) => {
        handler('to', e.target.value);
      });
    }
  }

  bindAmountChangeEvent(handler) {
    if (this.amountInput) {
      // Use debounce to avoid excessive updates during typing
      let debounceTimeout;
      
      this.amountInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(() => {
          handler(e.target.value);
        }, 500); // 500ms debounce
      });
      
      // Also handle blur event for immediate update when leaving field
      this.amountInput.addEventListener('blur', (e) => {
        clearTimeout(debounceTimeout);
        handler(e.target.value);
      });
    }
  }

  bindConvertEvent(handler) {
    if (this.convertButton) {
      this.convertButton.addEventListener('click', (e) => {
        e.preventDefault();
        handler();
      });
    }
    
    // Also handle form submission if inside a form
    const form = this.amountInput?.closest('form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        handler();
      });
    }
  }

  displayConversionResult(result) {
    if (this.resultContainer) {
      this.resultContainer.style.display = 'block';
    }
    
    if (this.convertedAmountElement) {
      // Format number to appropriate decimal places
      const formattedAmount = this.formatAmount(result.convertedAmount, result.toCurrency);
      this.convertedAmountElement.textContent = formattedAmount;
      
      // Add currency symbol if available
      const toCurrencyOption = this.toCurrencySelect.querySelector(`option[value="${result.toCurrency}"]`);
      if (toCurrencyOption && toCurrencyOption.dataset.symbol) {
        this.convertedAmountElement.dataset.symbol = toCurrencyOption.dataset.symbol;
      }
    }
    
    if (this.conversionRateElement) {
      this.conversionRateElement.textContent = `1 ${result.fromCurrency} = ${this.formatAmount(result.rate, result.toCurrency)} ${result.toCurrency}`;
    }
  }

  updateLastUpdated(date) {
    if (this.lastUpdatedElement) {
      this.lastUpdatedElement.textContent = `Last updated: ${this.formatDateTime(date)}`;
    }
  }

  updateConversionHistory(conversion) {
    const historyList = this.historyContainer?.querySelector('.history-list');
    if (!historyList) return;
    
    const historyItem = document.createElement('li');
    historyItem.className = 'history-item';
    
    const timestamp = this.formatDateTime(new Date(conversion.timestamp));
    const fromAmount = this.formatAmount(conversion.amount, conversion.fromCurrency);
    const toAmount = this.formatAmount(conversion.result, conversion.toCurrency);
    
    historyItem.innerHTML = `
      <span class="history-time">${timestamp}</span>
      <span class="history-conversion">${fromAmount} ${conversion.fromCurrency} → ${toAmount} ${conversion.toCurrency}</span>
    `;
    
    // Add new item at the top
    if (historyList.firstChild) {
      historyList.insertBefore(historyItem, historyList.firstChild);
    } else {
      historyList.appendChild(historyItem);
    }
    
    // Limit the number of items shown
    const maxHistoryItems = 5;
    while (historyList.children.length > maxHistoryItems) {
      historyList.removeChild(historyList.lastChild);
    }
  }

  showLoading(isLoading) {
    if (this.loadingIndicator) {
      this.loadingIndicator.style.display = isLoading ? 'flex' : 'none';
    }
    
    if (this.convertButton) {
      this.convertButton.disabled = isLoading;
    }
  }

  showConversionError(message) {
    this.showError(message);
    
    if (this.resultContainer) {
      this.resultContainer.classList.add('has-error');
    }
  }

  showInputError(inputField, message) {
    const inputElement = inputField === 'amount' ? this.amountInput : 
                        inputField === 'fromCurrency' ? this.fromCurrencySelect :
                        inputField === 'toCurrency' ? this.toCurrencySelect : null;
    
    if (inputElement) {
      // Create or update error message element
      let errorElement = inputElement.nextElementSibling;
      if (!errorElement || !errorElement.classList.contains('input-error')) {
        errorElement = document.createElement('div');
        errorElement.className = 'input-error';
        inputElement.parentNode.insertBefore(errorElement, inputElement.nextSibling);
      }
      
      errorElement.textContent = message;
      errorElement.style.display = 'block';
      inputElement.classList.add('has-error');
    }
    
    this.showError(message);
  }

  showError(message) {
    if (this.errorContainer && this.errorMessage) {
      this.errorMessage.textContent = message;
      this.errorContainer.style.display = 'block';
      
      // Automatically hide error after 5 seconds
      setTimeout(() => {
        this.clearErrors();
      }, 5000);
    }
  }

  clearErrors() {
    if (this.errorContainer) {
      this.errorContainer.style.display = 'none';
    }
    
    // Clear input-specific errors
    document.querySelectorAll('.input-error').forEach(el => {
      el.style.display = 'none';
    });
    
    document.querySelectorAll('.has-error').forEach(el => {
      el.classList.remove('has-error');
    });
    
    if (this.resultContainer) {
      this.resultContainer.classList.remove('has-error');
    }
  }

  formatAmount(amount, currencyCode) {
    // Determine appropriate decimal places based on currency
    let decimalPlaces = 2; // Default for fiat
    
    if (['BTC', 'ETH', 'LTC'].includes(currencyCode)) {
      decimalPlaces = 8; // Most crypto values need more precision
    }
    
    // Format with appropriate number of decimal places
    return Number(amount).toLocaleString(undefined, {
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces
    });
  }

  formatDateTime(date) {
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  }
}