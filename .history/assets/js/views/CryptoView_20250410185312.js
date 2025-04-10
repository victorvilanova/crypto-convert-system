/**
 * CryptoView.js
 * Responsável por gerenciar a interface de usuário do conversor
 */
import PerformanceUtils from '../utils/PerformanceUtils.js';

export default class CryptoView {
  constructor() {
    // Elementos do formulário
    this.fromCurrencySelect = document.getElementById('fromCurrency');
    this.toCryptoSelect = document.getElementById('toCrypto');
    this.amountInput = document.getElementById('amount');
    this.convertButton = document.getElementById('convertBtn');
    this.resultDiv = document.getElementById('result');
    this.errorDiv = document.getElementById('error');
    this.messageDiv = document.getElementById('message');
    this.loadingIndicator = document.getElementById('loading');
    this.lastUpdateSpan = document.getElementById('lastUpdate');
    this.ratesTableBody = document.getElementById('ratesTableBody');
    this.offlineAlert = document.getElementById('offlineAlert');
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

    // Permite conversão ao pressionar Enter no campo de valor com debounce
    this.amountInput.addEventListener('keyup', PerformanceUtils.debounce((e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        convertHandler();
      }
    }, 300));
    
    // Auto-conversão quando os selects são alterados
    this.fromCurrencySelect.addEventListener('change', PerformanceUtils.debounce(() => {
      if (this.amountInput.value && parseFloat(this.amountInput.value) > 0) {
        convertHandler();
      }
    }, 300));
    
    this.toCryptoSelect.addEventListener('change', PerformanceUtils.debounce(() => {
      if (this.amountInput.value && parseFloat(this.amountInput.value) > 0) {
        convertHandler();
      }
    }, 300));
  }

  /**
   * Define um valor inicial para o campo de valor
   * @param {number} amount - Valor inicial
   */
  setInitialAmount(amount) {
    if (this.amountInput) {
      this.amountInput.value = amount;
    }
  }

  /**
   * Mostra uma mensagem temporária ao usuário
   * @param {string} message - Mensagem a ser exibida
   * @param {string} type - Tipo de mensagem (success, info, warning)
   * @param {number} duration - Duração em ms (padrão: 3000ms)
   */
  displayMessage(message, type = 'info', duration = 3000) {
    if (!this.messageDiv) return;
    
    // Remove qualquer mensagem existente
    this.messageDiv.innerHTML = '';
    
    // Cria a nova mensagem
    const alertClass = type === 'success' ? 'alert-success' : 
                        type === 'warning' ? 'alert-warning' : 'alert-info';
    
    const messageElement = document.createElement('div');
    messageElement.className = `alert ${alertClass} alert-dismissible fade show`;
    messageElement.innerHTML = `
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fechar"></button>
    `;
    
    this.messageDiv.appendChild(messageElement);
    this.messageDiv.style.display = 'block';
    
    // Remove automaticamente após o tempo definido
    if (duration > 0) {
      setTimeout(() => {
        if (messageElement.parentNode) {
          messageElement.classList.remove('show');
          setTimeout(() => {
            if (messageElement.parentNode) {
              this.messageDiv.removeChild(messageElement);
              if (this.messageDiv.children.length === 0) {
                this.messageDiv.style.display = 'none';
              }
            }
          }, 150);
        }
      }, duration);
    }
  }

  /**
   * Mostra alerta de que está offline
   */
  showOfflineAlert() {
    if (this.offlineAlert) {
      this.offlineAlert.style.display = 'block';
    } else {
      // Cria um alerta de offline se não existir
      const alertDiv = document.createElement('div');
      alertDiv.id = 'offlineAlert';
      alertDiv.className = 'alert alert-warning sticky-top';
      alertDiv.innerHTML = '<strong>Você está offline!</strong> Os dados de taxas podem estar desatualizados.';
      document.body.insertBefore(alertDiv, document.body.firstChild);
      this.offlineAlert = alertDiv;
    }
  }

  /**
   * Esconde o alerta de offline
   */
  hideOfflineAlert() {
    if (this.offlineAlert) {
      this.offlineAlert.style.display = 'none';
    }
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