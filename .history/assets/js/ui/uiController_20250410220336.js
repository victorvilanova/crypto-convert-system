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
    
    const formattedAmount = amount.toLocaleString('pt-BR', { style: 'currency', currency: fromCurrency });
    const formattedResult = result.toLocaleString('pt-BR', { maximumFractionDigits: 8 });
    
    resultContainer.innerHTML = `
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
        </div>
    `;
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

/**
 * Atualiza a tabela de taxas na UI
 * @param {Object} rates - Objeto com as taxas de câmbio
 * @param {boolean} showAll - Se deve mostrar todas as moedas ou apenas as principais
 */
function updateUIWithRates(rates, showAll = false) {
    ratesTableBody.innerHTML = '';
    
    // Filtrar as moedas principais se não estiver mostrando todas
    let currenciesToShow = Object.keys(rates);
    const mainCurrencies = ['USD', 'EUR', 'BRL', 'GBP', 'JPY'];
    
    if (!showAll) {
        currenciesToShow = currenciesToShow.filter(currency => 
            mainCurrencies.includes(currency));
    }
    
    // Criar as linhas da tabela
    const cryptoCurrencies = ['BTC', 'ETH', 'ADA', 'SOL', 'DOT'];
    
    cryptoCurrencies.forEach(crypto => {
        currenciesToShow.forEach(currency => {
            if (rates[currency] && rates[currency][crypto]) {
                const rate = rates[currency][crypto];
                const tr = document.createElement('tr');
                
                // Calcular equivalência (quanto de crypto equivale a 1 unidade de moeda)
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