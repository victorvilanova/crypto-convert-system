/**
 * CryptoView.js
 * Responsável por gerenciar a interface de usuário do conversor
 */
export default class CryptoView {
  constructor() {
    // Elementos do formulário
    this.fromCryptoSelect = document.getElementById('fromCrypto');
    this.toCurrencySelect = document.getElementById('toCurrency');
    this.amountInput = document.getElementById('amount');
    this.convertButton = document.getElementById('convertBtn');
    this.resultDiv = document.getElementById('result');
    this.errorDiv = document.getElementById('error');
    this.loadingIndicator = document.getElementById('loading');
    this.lastUpdateSpan = document.getElementById('lastUpdate');
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
   */
  populateDropdowns(cryptos, currencies) {
    // Limpa os selects antes de preencher
    this.fromCryptoSelect.innerHTML = '';
    this.toCurrencySelect.innerHTML = '';

    // Adiciona as opções de criptomoedas
    cryptos.forEach((crypto) => {
      const option = document.createElement('option');
      option.value = crypto;
      option.textContent = this.formatCryptoName(crypto);
      this.fromCryptoSelect.appendChild(option);
    });

    // Adiciona as opções de moedas
    currencies.forEach((currency) => {
      const option = document.createElement('option');
      option.value = currency;
      option.textContent = currency;
      this.toCurrencySelect.appendChild(option);
    });
  }

  /**
   * Formata o nome da criptomoeda para exibição
   * @param {string} cryptoId - O ID da criptomoeda
   * @returns {string} Nome formatado
   */
  formatCryptoName(cryptoId) {
    const nameMap = {
      bitcoin: 'Bitcoin (BTC)',
      ethereum: 'Ethereum (ETH)',
      litecoin: 'Litecoin (LTC)',
      ripple: 'XRP (Ripple)',
      cardano: 'Cardano (ADA)',
    };

    return (
      nameMap[cryptoId] || cryptoId.charAt(0).toUpperCase() + cryptoId.slice(1)
    );
  }

  /**
   * Obtém os valores dos campos do formulário
   * @returns {Object} Objeto com os valores dos campos
   */
  getFormValues() {
    return {
      fromCrypto: this.fromCryptoSelect.value,
      toCurrency: this.toCurrencySelect.value,
      amount: parseFloat(this.amountInput.value) || 0,
    };
  }

  /**
   * Exibe o resultado da conversão
   * @param {Object} result - Objeto com dados da conversão
   */
  displayResult(result) {
    const { fromCrypto, toCurrency, amount, convertedAmount } = result;

    this.hideError();
    this.resultDiv.innerHTML = `
      <div class="alert alert-success">
        ${amount} ${this.formatCryptoName(fromCrypto)} = 
        ${convertedAmount.toFixed(2)} ${toCurrency}
      </div>
    `;
    this.resultDiv.style.display = 'block';
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
