/**
 * CryptoConverter.js
 * Handles cryptocurrency conversion functionality.
 */

// Cache to store exchange rates
let exchangeRatesCache = {};
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

/**
 * Fetches the current exchange rates from the API
 * @returns {Promise<Object>} The exchange rates
 */
async function fetchExchangeRates() {
  // Check if we have cached rates that are still valid
  const now = Date.now();
  if (Object.keys(exchangeRatesCache).length > 0 && (now - lastFetchTime) < CACHE_DURATION) {
    console.log('Using cached exchange rates');
    return exchangeRatesCache;
  }

  try {
    const response = await fetch('https://api.coingecko.com/api/v3/exchange_rates');
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    exchangeRatesCache = data.rates;
    lastFetchTime = now;
    
    console.log('Exchange rates fetched successfully');
    return exchangeRatesCache;
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    throw error;
  }
}

/**
 * Converts an amount from one currency to another
 * @param {number} amount - The amount to convert
 * @param {string} fromCurrency - The currency to convert from
 * @param {string} toCurrency - The currency to convert to
 * @returns {Promise<number>} The converted amount
 */
async function convertCurrency(amount, fromCurrency, toCurrency) {
  if (!amount || isNaN(amount) || amount <= 0) {
    throw new Error('Please enter a valid amount');
  }

  try {
    const rates = await fetchExchangeRates();
    
    if (!rates[fromCurrency]) {
      throw new Error(`Currency "${fromCurrency}" not found`);
    }
    
    if (!rates[toCurrency]) {
      throw new Error(`Currency "${toCurrency}" not found`);
    }
    
    // Get the value in USD for both currencies
    const fromValueInUSD = rates[fromCurrency].value;
    const toValueInUSD = rates[toCurrency].value;
    
    // Convert amount from source currency to target currency
    const result = (amount / fromValueInUSD) * toValueInUSD;
    
    return parseFloat(result.toFixed(8)); // Format to 8 decimal places for crypto
  } catch (error) {
    console.error('Conversion error:', error);
    throw error;
  }
}

/**
 * Handles the conversion button click
 */
function handleConversion() {
  const amountInput = document.getElementById('amount');
  const fromCurrencySelect = document.getElementById('fromCurrency');
  const toCurrencySelect = document.getElementById('toCurrency');
  const resultElement = document.getElementById('result');
  
  const amount = parseFloat(amountInput.value);
  const fromCurrency = fromCurrencySelect.value;
  const toCurrency = toCurrencySelect.value;
  
  resultElement.textContent = 'Converting...';
  
  convertCurrency(amount, fromCurrency, toCurrency)
    .then(convertedAmount => {
      resultElement.textContent = `${amount} ${fromCurrency} = ${convertedAmount} ${toCurrency}`;
    })
    .catch(error => {
      resultElement.textContent = `Error: ${error.message}`;
      console.error('Conversion failed:', error);
    });
}

/**
 * Initializes the converter
 */
function initConverter() {
  // Populate currency dropdowns when the page loads
  fetchExchangeRates()
    .then(rates => {
      const fromSelect = document.getElementById('fromCurrency');
      const toSelect = document.getElementById('toCurrency');
      
      // Clear existing options
      fromSelect.innerHTML = '';
      toSelect.innerHTML = '';
      
      // Add options for each currency
      Object.keys(rates).forEach(currency => {
        const fromOption = document.createElement('option');
        fromOption.value = currency;
        fromOption.textContent = `${currency} - ${rates[currency].name}`;
        fromSelect.appendChild(fromOption);
        
        const toOption = document.createElement('option');
        toOption.value = currency;
        toOption.textContent = `${currency} - ${rates[currency].name}`;
        toSelect.appendChild(toOption);
      });
      
      // Set default values
      fromSelect.value = 'btc';
      toSelect.value = 'eth';
    })
    .catch(error => {
      console.error('Failed to initialize converter:', error);
    });
  
  // Add event listener to the convert button
  const convertButton = document.getElementById('convertBtn');
  if (convertButton) {
    convertButton.addEventListener('click', handleConversion);
  }
}

// Export functions for use in other modules
export {
  convertCurrency,
  handleConversion,
  initConverter,
  fetchExchangeRates
};