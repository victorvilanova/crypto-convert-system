import { ConversionService } from '../services/ConversionService.js';
import { CurrencyService } from '../services/CurrencyService.js';
import { ErrorHandler } from '../utils/ErrorHandler.js';
import { DEFAULTS, EVENTS, TIME } from '../constants.js';

/**
 * Controlador principal da aplicação, conectando serviços com a interface do usuário
 */
export class ConversionController {
  /**
   * @param {Object} options - Opções de configuração
   * @param {ConversionService} [options.conversionService] - Serviço de conversão
   * @param {CurrencyService} [options.currencyService] - Serviço de moedas
   * @param {ErrorHandler} [options.errorHandler] - Manipulador de erros
   */
  constructor({ conversionService, currencyService, errorHandler } = {}) {
    // Serviços
    this.conversionService = conversionService || new ConversionService();
    this.currencyService = currencyService || new CurrencyService();
    this.errorHandler = errorHandler || new ErrorHandler();
    
    // Estado do formulário
    this.formState = {
      fromCurrency: DEFAULTS.FROM_CURRENCY,
      toCurrency: DEFAULTS.TO_CURRENCY,
      amount: DEFAULTS.AMOUNT,
      isLoading: false,
      lastResult: null,
      lastError: null
    };
    
    // Elementos do DOM
    this.elements = {
      fromSelect: null,
      toSelect: null,
      amountInput: null,
      convertButton: null,
      swapButton: null,
      resultContainer: null,
      resultAmount: null,
      resultRate: null,
      lastUpdated: null,
      loadingIndicator: null,
      historyContainer: null,
      errorContainer: null
    };
    
    // Timer para atualização automática das taxas
    this.rateRefreshTimer = null;
    
    // Flag para indicar se o controlador foi inicializado
    this.initialized = false;
  }

  /**
   * Inicializa o controlador
   */
  async init() {
    try {
      if (this.initialized) return;
      
      // Inicializar elementos do DOM
      this.initializeElements();
      
      // Configurar eventos
      this.setupEventListeners();
      
      // Carregar dados iniciais
      await this.loadInitialData();
      
      // Configurar atualização automática de taxas
      this.setupRateRefresh();
      
      this.initialized = true;
      console.log('Controlador de conversão inicializado com sucesso');
    } catch (error) {
      this.errorHandler.handleError(error, 'Falha ao inicializar controlador', true);
    }
  }

  /**
   * Inicializa referências aos elementos do DOM
   * @private
   */
  initializeElements() {
    this.elements = {
      fromSelect: document.getElementById('fromCurrency'),
      toSelect: document.getElementById('toCurrency'),
      amountInput: document.getElementById('amount'),
      convertButton: document.getElementById('convertBtn'),
      swapButton: document.getElementById('swapButton'),
      resultContainer: document.getElementById('resultContainer'),
      resultAmount: document.getElementById('convertedAmount'),
      resultRate: document.getElementById('conversionRate'),
      lastUpdated: document.getElementById('lastUpdated'),
      loadingIndicator: document.getElementById('loadingIndicator'),
      historyContainer: document.getElementById('conversionHistory'),
      errorContainer: document.getElementById('errorContainer')
    };
    
    // Verificar se todos os elementos necessários existem
    const missingElements = Object.entries(this.elements)
      .filter(([key, element]) => !element)
      .map(([key]) => key);
    
    if (missingElements.length > 0) {
      console.warn(`Elementos não encontrados: ${missingElements.join(', ')}`);
    }
  }

  /**
   * Configura os listeners de eventos para os elementos da UI
   * @private
   */
  setupEventListeners() {
    // Formulário de conversão
    if (this.elements.convertButton) {
      this.elements.convertButton.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleConversion();
      });
    }
    
    // Selects de moeda
    if (this.elements.fromSelect) {
      this.elements.fromSelect.addEventListener('change', () => {
        this.formState.fromCurrency = this.elements.fromSelect.value;
      });
    }
    
    if (this.elements.toSelect) {
      this.elements.toSelect.addEventListener('change', () => {
        this.formState.toCurrency = this.elements.toSelect.value;
      });
    }
    
    // Input de valor com debounce
    if (this.elements.amountInput) {
      let debounceTimer;
      this.elements.amountInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          const value = parseFloat(e.target.value);
          this.formState.amount = isNaN(value) ? 0 : value;
        }, TIME.DEBOUNCE_INPUT);
      });
    }
    
    // Botão de troca de moedas
    if (this.elements.swapButton) {
      this.elements.swapButton.addEventListener('click', () => {
        this.handleSwapCurrencies();
      });
    }
    
    // Listeners para eventos personalizados do sistema
    document.addEventListener(EVENTS.CONVERSION_COMPLETE, (e) => {
      this.updateConversionHistory(e.detail.conversion);
    });
    
    document.addEventListener(EVENTS.RATES_UPDATED, (e) => {
      this.updateLastUpdated(e.detail.timestamp);
    });
    
    document.addEventListener(EVENTS.ERROR, (e) => {
      this.showError(e.detail.message);
    });
  }

  /**
   * Carrega os dados iniciais necessários para a aplicação
   * @private
   */
  async loadInitialData() {
    try {
      this.setLoading(true);
      
      // Carregar moedas
      const currencies = await this.currencyService.getAllCurrencies();
      
      // Preencher selects
      this.populateCurrencySelects(currencies);
      
      // Definir valores iniciais
      this.setInitialValues();
      
      // Carregar taxas
      await this.conversionService.getRates();
      
      // Atualizar timestamp
      const lastUpdated = this.conversionService.getLastUpdated();
      if (lastUpdated) {
        this.updateLastUpdated(lastUpdated);
      }
      
      // Mostrar histórico de conversões
      this.renderConversionHistory();
      
      this.setLoading(false);
    } catch (error) {
      this.setLoading(false);
      this.errorHandler.handleError(error, 'Falha ao carregar dados iniciais', true);
    }
  }

  /**
   * Preenche os selects de moeda com as opções disponíveis
   * @param {Array} currencies - Lista de moedas
   * @private
   */
  populateCurrencySelects(currencies) {
    if (!this.elements.fromSelect || !this.elements.toSelect || !currencies.length) {
      return;
    }
    
    // Agrupar moedas por tipo
    const cryptos = currencies.filter(c => c.isCrypto());
    const fiats = currencies.filter(c => c.isFiat());
    
    // Limpar selects
    this.elements.fromSelect.innerHTML = '';
    this.elements.toSelect.innerHTML = '';
    
    // Função para criar grupos de opções
    const createOptionGroup = (container, type, currencies) => {
      const group = document.createElement('optgroup');
      group.label = type === 'crypto' ? 'Criptomoedas' : 'Moedas Fiduciárias';
      
      for (const currency of currencies) {
        const option = document.createElement('option');
        option.value = currency.code;
        option.textContent = `${currency.code} - ${currency.name}`;
        option.dataset.symbol = currency.symbol;
        group.appendChild(option);
      }
      
      container.appendChild(group);
    };
    
    // Adicionar grupos aos selects
    if (cryptos.length) {
      createOptionGroup(this.elements.fromSelect, 'crypto', cryptos);
      createOptionGroup(this.elements.toSelect, 'crypto', cryptos);
    }
    
    if (fiats.length) {
      createOptionGroup(this.elements.fromSelect, 'fiat', fiats);
      createOptionGroup(this.elements.toSelect, 'fiat', fiats);
    }
  }

  /**
   * Define os valores iniciais para o formulário
   * @private
   */
  setInitialValues() {
    // Definir valores padrão nos selects
    if (this.elements.fromSelect) {
      this.elements.fromSelect.value = this.formState.fromCurrency;
    }
    
    if (this.elements.toSelect) {
      this.elements.toSelect.value = this.formState.toCurrency;
    }
    
    // Definir valor inicial no input
    if (this.elements.amountInput) {
      this.elements.amountInput.value = this.formState.amount;
    }
  }

  /**
   * Configura a atualização automática das taxas
   * @private
   */
  setupRateRefresh() {
    // Limpar timer existente, se houver
    if (this.rateRefreshTimer) {
      clearInterval(this.rateRefreshTimer);
    }
    
    // Configurar novo timer
    this.rateRefreshTimer = setInterval(async () => {
      try {
        console.log('Atualizando taxas...');
        await this.conversionService.getRates(true);
        console.log('Taxas atualizadas com sucesso');
      } catch (error) {
        console.error('Falha ao atualizar taxas automaticamente', error);
      }
    }, TIME.RATE_REFRESH);
  }

  /**
   * Manipula o evento de conversão
   * @private
   */
  async handleConversion() {
    try {
      // Validar estado do formulário
      if (!this.validateForm()) {
        return;
      }
      
      this.setLoading(true);
      this.hideError();
      
      // Realizar conversão
      const result = await this.conversionService.convert(
        this.formState.fromCurrency,
        this.formState.toCurrency,
        this.formState.amount
      );
      
      // Atualizar estado e UI
      this.formState.lastResult = result;
      this.displayConversionResult(result);
      
      this.setLoading(false);
    } catch (error) {
      this.setLoading(false);
      this.errorHandler.handleError(error, 'Falha na conversão', true);
      this.showError(error.message);
    }
  }

  /**
   * Valida o formulário antes da conversão
   * @returns {boolean} Se o formulário é válido
   * @private
   */
  validateForm() {
    // Validar moeda de origem
    if (!this.formState.fromCurrency) {
      this.showError('Selecione a moeda de origem');
      return false;
    }
    
    // Validar moeda de destino
    if (!this.formState.toCurrency) {
      this.showError('Selecione a moeda de destino');
      return false;
    }
    
    // Validar valor
    if (!this.formState.amount || this.formState.amount <= 0) {
      this.showError('Digite um valor válido maior que zero');
      
      // Focar no campo com erro
      if (this.elements.amountInput) {
        this.elements.amountInput.focus();
      }
      
      return false;
    }
    
    return true;
  }

  /**
   * Manipula o evento de troca de moedas
   * @private
   */
  handleSwapCurrencies() {
    if (!this.elements.fromSelect || !this.elements.toSelect) return;
    
    // Salvar valores atuais
    const fromValue = this.elements.fromSelect.value;
    const toValue = this.elements.toSelect.value;
    
    // Trocar no estado
    this.formState.fromCurrency = toValue;
    this.formState.toCurrency = fromValue;
    
    // Trocar na UI
    this.elements.fromSelect.value = toValue;
    this.elements.toSelect.value = fromValue;
    
    // Animar botão
    if (this.elements.swapButton) {
      this.elements.swapButton.classList.add('rotating');
      setTimeout(() => {
        this.elements.swapButton.classList.remove('rotating');
      }, 500);
    }
  }

  /**
   * Exibe o resultado da conversão na interface
   * @param {Conversion} conversion - Resultado da conversão
   * @private
   */
  displayConversionResult(conversion) {
    if (!this.elements.resultContainer || !conversion) return;
    
    // Exibir container de resultado
    this.elements.resultContainer.style.display = 'block';
    
    // Atualizar valor convertido
    if (this.elements.resultAmount) {
      this.elements.resultAmount.textContent = conversion.formatConvertedAmount();
      this.elements.resultAmount.dataset.currency = conversion.toCurrency;
    }
    
    // Atualizar taxa de conversão
    if (this.elements.resultRate) {
      this.elements.resultRate.textContent = `1 ${conversion.fromCurrency} = ${conversion.formatRate()} ${conversion.toCurrency}`;
    }
    
    // Animar resultado
    this.elements.resultContainer.classList.add('highlight');
    setTimeout(() => {
      this.elements.resultContainer.classList.remove('highlight');
    }, 1000);
  }

  /**
   * Atualiza a exibição da data da última atualização
   * @param {Date} timestamp - Data da última atualização
   * @private
   */
  updateLastUpdated(timestamp) {
    if (!this.elements.lastUpdated || !timestamp) return;
    
    const formattedDate = new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(timestamp);
    
    this.elements.lastUpdated.textContent = `Última atualização: ${formattedDate}`;
  }

  /**
   * Renderiza o histórico de conversões
   * @private
   */
  renderConversionHistory() {
    if (!this.elements.historyContainer) return;
    
    const historyList = this.elements.historyContainer.querySelector('ul') || document.createElement('ul');
    historyList.className = 'history-list';
    historyList.innerHTML = '';
    
    // Obter histórico
    const history = this.conversionService.getConversionHistory(5);
    
    if (history.length === 0) {
      const emptyMessage = document.createElement('li');
      emptyMessage.className = 'history-empty';
      emptyMessage.textContent = 'Nenhuma conversão realizada ainda.';
      historyList.appendChild(emptyMessage);
    } else {
      // Criar itens de histórico
      history.forEach(conversion => {
        const historyItem = document.createElement('li');
        historyItem.className = 'history-item';
        
        historyItem.innerHTML = `
          <span class="history-time">${conversion.formatTimestamp()}</span>
          <span class="history-conversion">${conversion.formatOriginalAmount()} ${conversion.fromCurrency} → ${conversion.formatConvertedAmount()} ${conversion.toCurrency}</span>
        `;
        
        historyList.appendChild(historyItem);
      });
    }
    
    // Adicionar à página se ainda não estiver
    if (!this.elements.historyContainer.contains(historyList)) {
      this.elements.historyContainer.appendChild(historyList);
    }
  }

  /**
   * Atualiza o histórico de conversões com uma nova conversão
   * @param {Conversion} conversion - Nova conversão a adicionar
   * @private
   */
  updateConversionHistory(conversion) {
    if (!this.elements.historyContainer || !conversion) return;
    
    // Renderizar todo o histórico novamente
    this.renderConversionHistory();
  }

  /**
   * Define o estado de carregamento da UI
   * @param {boolean} isLoading - Se está carregando
   * @private
   */
  setLoading(isLoading) {
    this.formState.isLoading = isLoading;
    
    // Atualizar UI
    if (this.elements.loadingIndicator) {
      this.elements.loadingIndicator.style.display = isLoading ? 'flex' : 'none';
    }
    
    // Desabilitar/habilitar botão de conversão
    if (this.elements.convertButton) {
      this.elements.convertButton.disabled = isLoading;
    }
    
    // Desabilitar/habilitar outros controles
    const controls = [
      this.elements.fromSelect,
      this.elements.toSelect,
      this.elements.amountInput,
      this.elements.swapButton
    ];
    
    controls.forEach(control => {
      if (control) {
        control.disabled = isLoading;
      }
    });
  }

  /**
   * Exibe uma mensagem de erro
   * @param {string} message - Mensagem de erro
   * @private
   */
  showError(message) {
    if (!this.elements.errorContainer) return;
    
    // Atualizar estado
    this.formState.lastError = message;
    
    // Mostrar container de erro
    this.elements.errorContainer.style.display = 'block';
    
    // Definir mensagem
    const errorMessage = this.elements.errorContainer.querySelector('p') || this.elements.errorContainer;
    errorMessage.textContent = message;
    
    // Auto-esconder após alguns segundos
    setTimeout(() => {
      this.hideError();
    }, TIME.ERROR_NOTIFICATION);
  }

  /**
   * Esconde a mensagem de erro
   * @private
   */
  hideError() {
    if (!this.elements.errorContainer) return;
    
    this.elements.errorContainer.style.display = 'none';
    this.formState.lastError = null;
  }

  /**
   * Limpa recursos do controlador
   */
  destroy() {
    // Limpar timer de atualização
    if (this.rateRefreshTimer) {
      clearInterval(this.rateRefreshTimer);
      this.rateRefreshTimer = null;
    }
    
    // Outras limpezas
    this.initialized = false;
    console.log('Controlador destruído');
  }
}