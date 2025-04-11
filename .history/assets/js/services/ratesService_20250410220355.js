/**
 * ratesService.js
 * Serviço responsável por gerenciar as taxas de câmbio
 */

// Simulated rates - in a real application these would come from an API
let cryptoRates = {
    USD: {
        BTC: 35000,   // 1 BTC = $35,000 USD
        ETH: 2000,    // 1 ETH = $2,000 USD
        ADA: 0.45,    // 1 ADA = $0.45 USD
        SOL: 50,      // 1 SOL = $50 USD
        DOT: 6        // 1 DOT = $6 USD
    }
};

// Exchange rates for other currencies relative to USD
const fiatExchangeRates = {
    EUR: 0.92,        // 1 USD = 0.92 EUR
    BRL: 5.50,        // 1 USD = 5.50 BRL
    GBP: 0.79,        // 1 USD = 0.79 GBP
    JPY: 150          // 1 USD = 150 JPY
};

/**
 * Calcula as taxas para todas as moedas com base nas taxas em USD
 */
function calculateAllRates() {
    // Start with USD rates
    const usdRates = cryptoRates.USD;
    
    // For each fiat currency, calculate crypto rates based on USD
    Object.keys(fiatExchangeRates).forEach(fiatCurrency => {
        const fiatToUsdRate = fiatExchangeRates[fiatCurrency];
        cryptoRates[fiatCurrency] = {};
        
        // For each crypto, calculate its rate in this fiat currency
        Object.keys(usdRates).forEach(crypto => {
            const cryptoToUsdRate = usdRates[crypto];
            // Rate in fiat = Rate in USD * USD to Fiat rate
            cryptoRates[fiatCurrency][crypto] = cryptoToUsdRate * fiatToUsdRate;
        });
    });
}

/**
 * Atualiza as taxas de criptomoedas (simuladas ou de API)
 * @returns {Promise} Uma promise que resolve quando as taxas são atualizadas
 */
async function updateRates() {
    // Simulated API call
    return new Promise((resolve) => {
        setTimeout(() => {
            // Add some random variation to USD rates to simulate market changes (±5%)
            Object.keys(cryptoRates.USD).forEach(crypto => {
                const currentRate = cryptoRates.USD[crypto];
                const variation = (Math.random() * 0.1) - 0.05; // -5% to +5%
                cryptoRates.USD[crypto] = currentRate * (1 + variation);
            });
            
            // Recalculate rates for all currencies
            calculateAllRates();
            resolve(cryptoRates);
        }, 1000); // Simulate 1 second delay
    });
}

/**
 * Obtém as taxas atuais
 * @returns {Object} Objeto com as taxas de câmbio
 */
function getRates() {
    return cryptoRates;
}

/**
 * Converte uma quantidade de moeda FIAT para criptomoeda
 * @param {string} fromCurrency - Moeda FIAT de origem
 * @param {string} toCrypto - Criptomoeda de destino
 * @param {number} amount - Quantidade a converter
 * @returns {number} Resultado da conversão em criptomoeda
 */
function convertCurrency(fromCurrency, toCrypto, amount) {
    // Verificar se temos taxas para esta conversão
    if (!cryptoRates[fromCurrency] || !cryptoRates[fromCurrency][toCrypto]) {
        throw new Error(`Taxas não disponíveis para conversão de ${fromCurrency} para ${toCrypto}`);
    }
    
    // Taxa: quanto custa 1 unidade de criptomoeda em moeda FIAT
    const rate = cryptoRates[fromCurrency][toCrypto];
    
    // Resultado: quantidade em cripto = quantidade em FIAT / preço da cripto
    return amount / rate;
}

// Initialize rates when module is loaded
calculateAllRates();

// Export functions
export {
    updateRates,
    getRates,
    convertCurrency
};