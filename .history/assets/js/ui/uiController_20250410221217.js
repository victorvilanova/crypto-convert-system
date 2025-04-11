/**
 * uiController.js
 * Controlador responsável pela interface do usuário
 */

// DOM Elements for UI updates
const resultContainer = document.getElementById('result');
const errorContainer = document.getElementById('error');
const loadingContainer = document.getElementById('loading');
const ratesTableBody = document.getElementById('ratesTableBody');
const messageContainer = document.getElementById('message');

// Importando o serviço de taxas
import { calculateAllFeesAndTaxes } from '../services/taxesService.js';

/**
 * Mostra a área de carregamento
 */
function showLoading() {
    loadingContainer.style.display = 'block';
    resultContainer.style.display = 'none';
    errorContainer.style.display = 'none';
}

/**
 * Esconde a área de carregamento
 */
function hideLoading() {
    loadingContainer.style.display = 'none';
}

/**
 * Exibe uma mensagem de erro
 * @param {string} message - Mensagem de erro a ser exibida
 */
function showError(message) {
    errorContainer.style.display = 'block';
    errorContainer.innerHTML = `<div class="alert alert-danger">${message}</div>`;
    resultContainer.style.display = 'none';
}

/**
 * Exibe o resultado da conversão
 * @param {string} fromCurrency - Moeda de origem
 * @param {string} toCrypto - Criptomoeda de destino
 * @param {number} amount - Quantidade a converter
 * @param {number} result - Resultado da conversão
 */
function displayResult(fromCurrency, toCrypto, amount, result) {
    resultContainer.style.display = 'block';
    errorContainer.style.display = 'none';
    
    // Calcular taxas e impostos brasileiros
    const feesAndTaxes = calculateAllFeesAndTaxes(fromCurrency, toCrypto, amount, result);
    
    const formattedAmount = amount.toLocaleString('pt-BR', { 
        style: 'currency', 
        currency: fromCurrency 
    });
    
    const formattedResult = result.toLocaleString('pt-BR', { 
        maximumFractionDigits: 8 
    });
    
    const formattedFinalAmount = feesAndTaxes.finalAmount.toLocaleString('pt-BR', { 
        maximumFractionDigits: 8 
    });
    
    let resultHTML = `
        <div class="alert alert-success">
            <h4 class="alert-heading">Resultado da Conversão</h4>
            <p class="mb-0">
                ${formattedAmount} = <strong>${formattedResult} ${toCrypto}</strong>
            </p>
            <hr>
            <p class="mb-0 small">
                Taxa de conversão: 1 ${toCrypto} = ${(amount / result).toLocaleString('pt-BR', { 
                    style: 'currency', 
                    currency: fromCurrency,
                    maximumFractionDigits: 2
                })}
            </p>
    `;
    
    // Adicionar seção de impostos e taxas apenas para conversões em BRL
    if (fromCurrency === 'BRL') {
        resultHTML += `
            <hr>
            <h5 class="text-dark">Impostos e Taxas</h5>
            <div class="table-responsive">
                <table class="table table-sm">
                    <tbody>
                        <tr>
                            <td>IOF (0,38%)</td>
                            <td class="text-end">${feesAndTaxes.iof.toLocaleString('pt-BR', { 
                                style: 'currency', 
                                currency: 'BRL' 
                            })}</td>
                        </tr>
                        <tr>
                            <td>Taxa de corretagem (0,7%)</td>
                            <td class="text-end">${feesAndTaxes.exchangeFee.toLocaleString('pt-BR', { 
                                style: 'currency', 
                                currency: 'BRL' 
                            })}</td>
                        </tr>
                        <tr>
                            <td>Taxa de rede (${toCrypto})</td>
                            <td class="text-end">${feesAndTaxes.networkFee.toLocaleString('pt-BR', { 
                                style: 'currency', 
                                currency: 'BRL' 
                            })}</td>
                        </tr>
                        <tr class="table-warning">
                            <th>Total de taxas</th>
                            <th class="text-end">${feesAndTaxes.totalInBRL.toLocaleString('pt-BR', { 
                                style: 'currency', 
                                currency: 'BRL'
                            })}</th>
                        </tr>
                    </tbody>
                </table>
            </div>
            <hr>
            <p class="mb-0">
                <strong>Valor líquido recebido após taxas:</strong> ${formattedFinalAmount} ${toCrypto}
            </p>
            <p class="small text-muted mt-2">
                * Valores de IOF e taxas são aproximados e podem variar conforme a corretora.
                <br>
                * Imposto de Renda (15%) aplicável para vendas com lucro acima de R$ 35.000,00 mensais.
            </p>
        `;
    }
    
    resultHTML += `</div>`;
    resultContainer.innerHTML = resultHTML;
}

/**
 * Mostra uma mensagem temporária ao usuário
 * @param {string} text - Texto a ser exibido
 * @param {string} type - Tipo da mensagem (success, danger, warning, info)
 * @param {number} duration - Duração em ms para a mensagem desaparecer (opcional)
 */
function showMessage(text, type = 'info', duration = 3000) {
    messageContainer.innerHTML = `<div class="alert alert-${type} alert-dismissible fade show" role="alert">
        ${text}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>`;
    messageContainer.style.display = 'block';
    
    if (duration) {
        setTimeout(() => {
            messageContainer.style.display = 'none';
        }, duration);
    }
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

/**
 * Atualiza a tabela de taxas na UI
 * @param {Object} rates - Objeto com as taxas de câmbio
 * @param {boolean} showAll - Se deve mostrar todas as moedas ou apenas as principais
 */
function updateUIWithRates(rates, showAll = false) {
    if (!ratesTableBody) return;
    
    ratesTableBody.innerHTML = '';
    
    // By default, only show BRL
    let currenciesToShow = ['BRL'];
    
    // If showAll is true, show all currencies
    if (showAll) {
        currenciesToShow = Object.keys(rates);
    }
    
    // By default, only show USDT
    let cryptosToShow = ['USDT'];
    
    // If showAll is true, show all cryptos
    if (showAll) {
        cryptosToShow = ['BTC', 'ETH', 'USDT', 'ADA', 'SOL', 'DOT'];
    }
    
    // Create table rows
    cryptosToShow.forEach(crypto => {
        currenciesToShow.forEach(currency => {
            if (rates[currency] && rates[currency][crypto]) {
                const rate = rates[currency][crypto];
                const tr = document.createElement('tr');
                
                // Calculate equivalence (how much crypto equals 1 unit of currency)
                const equivalence = 1 / rate;
                
                tr.innerHTML = `
                    <td><img src="assets/images/crypto/${crypto.toLowerCase()}.png" alt="${crypto}" width="20" class="me-2">${crypto}</td>
                    <td>${currency}</td>
                    <td>${rate.toLocaleString('pt-BR', { 
                        style: 'currency', 
                        currency: currency,
                        maximumFractionDigits: 2
                    })}</td>
                    <td>${equivalence.toLocaleString('pt-BR', { 
                        maximumFractionDigits: 8
                    })} ${crypto}</td>
                `;
                ratesTableBody.appendChild(tr);
            }
        });
    });
}

export {
    showLoading,
    hideLoading,
    showError,
    displayResult,
    showMessage,
    updateUIWithRates
};