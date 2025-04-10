/**
 * CryptoView.js
 * Responsável por gerenciar a interface de usuário do conversor
 */
export default class CryptoView {
  constructor() {
    // Elementos do formulário
    this.fromCurrencySelect = document.getElementById('fromCurrency');
    this.toCryptoSelect = document.getElementById('toCrypto');
    this.amountInput = document.getElementById('amount');
    this.convertButton = document.getElementById('convertBtn');
    this.resultDiv = document.getElementById('result');
    this.errorDiv = document.getElementById('error');
    this.loadingIndicator = document.getElementById('loading');
    this.lastUpdateSpan = document.getElementById('lastUpdate');
    this.ratesTableBody = document.getElementById('ratesTableBody');
  }

  /**
   * Inicializa os listeners de eventos da UI
   * @param {Function} convertHandler - Função para lidar com evento de conversão
   */
  initEventListeners(convertHandler) {
    this.convertButton.addEventListener('click', (e) => {
      e.preventDefault();
      convertHandler();
    });

    // Permite conversão ao pressionar Enter no campo de valor
    this.amountInput.addEventListener('keyup', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        convertHandler();
      }
    });
  }

  /**
   * Preenche os selects com as opções disponíveis
   * @param {string[]} cryptos - Lista de criptomoedas suportadas
   * @param {string[]} currencies - Lista de moedas suportadas
   * @param {string} defaultCurrency - Moeda FIAT padrão
   * @param {string} defaultCrypto - Criptomoeda padrão
   */
  populateDropdowns(cryptos, currencies, defaultCurrency, defaultCrypto) {
    // Limpa os selects antes de preencher
    this.fromCurrencySelect.innerHTML = '';
    this.toCryptoSelect.innerHTML = '';

    // Adiciona as opções de moedas FIAT
    currencies.forEach(currency => {
      const option = document.createElement('option');
      option.value = currency;
      option.textContent = currency;
      option.selected = currency === defaultCurrency;
      this.fromCurrencySelect.appendChild(option);
    });

    // Adiciona as opções de criptomoedas
    cryptos.forEach(crypto => {
      const option = document.createElement('option');
      option.value = crypto;
      option.textContent = this.formatCryptoName(crypto);
      option.selected = crypto === defaultCrypto;
      this.toCryptoSelect.appendChild(option);
    });
  }

  /**
   * Formata o nome da criptomoeda para exibição
   * @param {string} cryptoId - O ID da criptomoeda
   * @returns {string} Nome formatado
   */
  formatCryptoName(cryptoId) {
    const nameMap = {
      'bitcoin': 'Bitcoin (BTC)',
      'ethereum': 'Ethereum (ETH)',
      'litecoin': 'Litecoin (LTC)',
      'ripple': 'XRP (Ripple)',
      'cardano': 'Cardano (ADA)',
      'tether': 'Tether (USDT)'
    };
    
    return nameMap[cryptoId] || cryptoId.charAt(0).toUpperCase() + cryptoId.slice(1);
  }

  /**
   * Obtém os valores dos campos do formulário
   * @returns {Object} Objeto com os valores dos campos
   */
  getFormValues() {
    return {
      fromCurrency: this.fromCurrencySelect.value,
      toCrypto: this.toCryptoSelect.value,
      amount: parseFloat(this.amountInput.value) || 0
    };
  }

  /**
   * Exibe o resultado da conversão
   * @param {Object} result - Objeto com dados da conversão
   */
  displayResult(result) {
    const { fromCurrency, toCrypto, amount, convertedAmount } = result;
    
    this.hideError();
    this.resultDiv.innerHTML = `
      <div class="alert alert-success">
        ${amount} ${fromCurrency} = 
        ${convertedAmount.toFixed(8)} ${this.formatCryptoName(toCrypto)}
      </div>
    `;
    this.resultDiv.style.display = 'block';
  }

  /**
   * Atualiza a tabela de taxas de câmbio
   * @param {Array} ratesTable - Array de objetos com as taxas de câmbio
   */
  updateRatesTable(ratesTable) {
    this.ratesTableBody.innerHTML = '';
    
    ratesTable.forEach(item => {
      const row = document.createElement('tr');
      
      const cryptoCell = document.createElement('td');
      cryptoCell.textContent = this.formatCryptoName(item.crypto);
      
      const currencyCell = document.createElement('td');
      currencyCell.textContent = item.currency;
      
      const rateCell = document.createElement('td');
      rateCell.textContent = item.rate.toFixed(2);
      
      const unitCell = document.createElement('td');
      const unitRate = (1 / item.rate).toFixed(8);
      unitCell.textContent = `1 ${this.formatCryptoName(item.crypto)} = ${unitRate} ${item.currency}`;
      
      row.appendChild(cryptoCell);
      row.appendChild(currencyCell);
      row.appendChild(rateCell);
      row.appendChild(unitCell);
      
      this.ratesTableBody.appendChild(row);
    });
  }

  /**
   * Exibe mensagem de erro
   * @param {string} message - Mensagem de erro
   */
  displayError(message) {
    this.resultDiv.style.display = 'none';
    this.errorDiv.innerHTML = `<div class="alert alert-danger">${message}</div>`;
    this.errorDiv.style.display = 'block';
  }

  /**
   * Esconde a mensagem de erro
   */
  hideError() {
    this.errorDiv.style.display = 'none';
  }

  /**
   * Mostra o indicador de carregamento
   */
  showLoading() {
    this.loadingIndicator.style.display = 'block';
    this.convertButton.disabled = true;
  }

  /**
   * Esconde o indicador de carregamento
   */
  hideLoading() {
    this.loadingIndicator.style.display = 'none';
    this.convertButton.disabled = false;
  }

  /**
   * Atualiza o timestamp da última atualização
   */
  updateLastUpdateTime() {
    const now = new Date();
    this.lastUpdateSpan.textContent = now.toLocaleTimeString();
  }
}