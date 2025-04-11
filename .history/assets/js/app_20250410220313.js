/**
 * app.js
 * Ponto de entrada principal da aplicação
 */
import CryptoController from './controllers/CryptoController.js';
import { updateRates, getRates, convertCurrency } from './services/ratesService.js';
import { updateUIWithRates, displayResult, showLoading, hideLoading, showError } from './ui/uiController.js';
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

// Initialize the app
async function initApp() {
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
        { code: 'USD', name: 'Dólar Americano' },
        { code: 'EUR', name: 'Euro' },
        { code: 'BRL', name: 'Real Brasileiro' },
        { code: 'GBP', name: 'Libra Esterlina' },
        { code: 'JPY', name: 'Iene Japonês' }
    ];
    
    // Cryptocurrencies
    const cryptoCurrencies = [
        { code: 'BTC', name: 'Bitcoin' },
        { code: 'ETH', name: 'Ethereum' },
        { code: 'ADA', name: 'Cardano' },
        { code: 'SOL', name: 'Solana' },
        { code: 'DOT', name: 'Polkadot' }
    ];
    
    // Populate selects
    populateSelect(fromCurrencySelect, fiatCurrencies);
    populateSelect(toCryptoSelect, cryptoCurrencies);
}

// Populate select element with options
function populateSelect(selectElement, options) {
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
        updateUIWithRates(getRates(), showAllCurrenciesCheckbox.checked);
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
    const now = new Date();
    lastUpdateSpan.textContent = now.toLocaleTimeString();
}

// Handle conversion
function handleConversion() {
    const fromCurrency = fromCurrencySelect.value;
    const toCrypto = toCryptoSelect.value;
    const amount = parseFloat(amountInput.value);
    
    if (isNaN(amount) || amount <= 0) {
        showError('Por favor, insira um valor válido maior que zero.');
        return;
    }
    
    try {
        showLoading();
        const result = convertCurrency(fromCurrency, toCrypto, amount);
        hideLoading();
        displayResult(fromCurrency, toCrypto, amount, result);
    } catch (error) {
        hideLoading();
        showError(`Erro na conversão: ${error.message}`);
    }
}

// Handle adding to favorites
function handleAddFavorite() {
    const fromCurrency = fromCurrencySelect.value;
    const toCrypto = toCryptoSelect.value;
    const amount = parseFloat(amountInput.value);
    
    if (isNaN(amount) || amount <= 0) {
        showError('Por favor, insira um valor válido maior que zero.');
        return;
    }
    
    saveFavorite(fromCurrency, toCrypto, amount);
    renderFavorites();
}

// Setup event listeners
function setupEventListeners() {
    // Convert button
    convertBtn.addEventListener('click', handleConversion);
    
    // Add to favorites button
    addFavoriteBtn.addEventListener('click', handleAddFavorite);
    
    // Force update button
    forceUpdateBtn.addEventListener('click', updateRatesAndUI);
    
    // Show all currencies checkbox
    showAllCurrenciesCheckbox.addEventListener('change', () => {
        updateUIWithRates(getRates(), showAllCurrenciesCheckbox.checked);
    });
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);

// Export functions for testing
export { initApp, handleConversion };
