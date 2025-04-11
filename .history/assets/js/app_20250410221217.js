/**
 * app.js
 * Ponto de entrada principal da aplicação
 */
import { updateRates, getRates, convertCurrency } from './services/ratesService.js';
import { updateUIWithRates, displayResult, showLoading, hideLoading, showError, showMessage } from './ui/uiController.js';
import { saveFavorite, loadFavorites, renderFavorites } from './storage/favoritesManager.js';
import { setupOfflineDetection } from './utils/offlineManager.js';

// DOM Elements
const convertBtn = document.getElementById('convertBtn');
const fromCurrencySelect = document.getElementById('fromCurrency');
const toCryptoSelect = document.getElementById('toCrypto');
const amountInput = document.getElementById('amount');
const addFavoriteBtn = document.getElementById('addFavoriteBtn');
const forceUpdateBtn = document.getElementById('forceUpdateBtn');
const lastUpdateSpan = document.getElementById('lastUpdate');
const showAllCurrenciesCheckbox = document.getElementById('showAllCurrencies');
const converterForm = document.getElementById('converterForm');
const ratesTableBody = document.getElementById('ratesTableBody');

// Initialize the app
async function initApp() {
    console.log('Initializing app...');
    setupOfflineDetection();
    loadCurrencyOptions();
    await updateRatesAndUI();
    setInterval(updateRatesAndUI, 60000); // Update every minute
    setupEventListeners();
    renderFavorites();
}

// Load currency options
function loadCurrencyOptions() {
    // FIAT currencies
    const fiatCurrencies = [
        { code: 'BRL', name: 'Real Brasileiro' },
        { code: 'USD', name: 'Dólar Americano' },
        { code: 'EUR', name: 'Euro' },
        { code: 'GBP', name: 'Libra Esterlina' },
        { code: 'JPY', name: 'Iene Japonês' }
    ];
    
    // Cryptocurrencies
    const cryptoCurrencies = [
        { code: 'USDT', name: 'Tether' },
        { code: 'BTC', name: 'Bitcoin' },
        { code: 'ETH', name: 'Ethereum' },
        { code: 'ADA', name: 'Cardano' },
        { code: 'SOL', name: 'Solana' },
        { code: 'DOT', name: 'Polkadot' }
    ];
    
    // Populate selects
    populateSelect(fromCurrencySelect, fiatCurrencies);
    populateSelect(toCryptoSelect, cryptoCurrencies);
    
    // Set default values to BRL and USDT
    if (fromCurrencySelect) fromCurrencySelect.value = 'BRL';
    if (toCryptoSelect) toCryptoSelect.value = 'USDT';
}

// Populate select element with options
function populateSelect(selectElement, options) {
    if (!selectElement) {
        console.error('Select element not found');
        return;
    }
    
    selectElement.innerHTML = '';
    options.forEach(option => {
        const optElement = document.createElement('option');
        optElement.value = option.code;
        optElement.textContent = `${option.name} (${option.code})`;
        selectElement.appendChild(optElement);
    });
}

// Update rates and UI
async function updateRatesAndUI() {
    try {
        showLoading();
        await updateRates();
        updateUIWithRates(getRates(), showAllCurrenciesCheckbox?.checked || false);
        updateLastUpdateTime();
        hideLoading();
    } catch (error) {
        console.error('Failed to update rates:', error);
        showError('Falha ao atualizar taxas. Tentando novamente em breve.');
        hideLoading();
    }
}

// Update last update time
function updateLastUpdateTime() {
    if (lastUpdateSpan) {
        const now = new Date();
        lastUpdateSpan.textContent = now.toLocaleTimeString();
    }
}

// Handle conversion
function handleConversion(e) {
    if (e) e.preventDefault();
    
    console.log('Converting...');
    
    if (!fromCurrencySelect || !toCryptoSelect || !amountInput) {
        console.error('Form elements not found');
        showError('Erro ao encontrar elementos do formulário');
        return;
    }
    
    const fromCurrency = fromCurrencySelect.value;
    const toCrypto = toCryptoSelect.value;
    const amount = parseFloat(amountInput.value);
    
    console.log(`Converting ${amount} ${fromCurrency} to ${toCrypto}`);
    
    if (isNaN(amount) || amount <= 0) {
        showError('Por favor, insira um valor válido maior que zero.');
        return;
    }
    
    try {
        showLoading();
        const result = convertCurrency(fromCurrency, toCrypto, amount);
        hideLoading();
        displayResult(fromCurrency, toCrypto, amount, result);
        showMessage(`Conversão realizada com sucesso!`, 'success');
    } catch (error) {
        hideLoading();
        console.error('Conversion error:', error);
        showError(`Erro na conversão: ${error.message}`);
    }
}

// Handle adding to favorites
function handleAddFavorite() {
    if (!fromCurrencySelect || !toCryptoSelect || !amountInput) {
        showError('Erro ao encontrar elementos do formulário');
        return;
    }
    
    const fromCurrency = fromCurrencySelect.value;
    const toCrypto = toCryptoSelect.value;
    const amount = parseFloat(amountInput.value);
    
    if (isNaN(amount) || amount <= 0) {
        showError('Por favor, insira um valor válido maior que zero.');
        return;
    }
    
    saveFavorite(fromCurrency, toCrypto, amount);
    renderFavorites();
    showMessage(`Conversão salva nos favoritos!`, 'success');
}

// Setup event listeners
function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    // Convert button
    if (convertBtn) {
        console.log('Adding event listener to convert button');
        convertBtn.addEventListener('click', handleConversion);
    } else {
        console.error('Convert button not found');
    }
    
    // Form submit
    if (converterForm) {
        converterForm.addEventListener('submit', handleConversion);
    }
    
    // Add to favorites button
    if (addFavoriteBtn) {
        addFavoriteBtn.addEventListener('click', handleAddFavorite);
    }
    
    // Force update button
    if (forceUpdateBtn) {
        forceUpdateBtn.addEventListener('click', () => {
            showMessage('Atualizando taxas...', 'info');
            updateRatesAndUI();
        });
    }
    
    // Show all currencies checkbox
    if (showAllCurrenciesCheckbox) {
        showAllCurrenciesCheckbox.addEventListener('change', () => {
            updateUIWithRates(getRates(), showAllCurrenciesCheckbox.checked);
        });
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing app');
    initApp();
});

// Export functions for testing
export { initApp, handleConversion };
