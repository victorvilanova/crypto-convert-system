/**
 * CryptoController.js
 * Responsável por conectar o Model e a View, gerenciando a lógica da aplicação
 */
import CryptoModel from '../models/CryptoModel.js';
import CryptoView from '../views/CryptoView.js';
import PerformanceUtils from '../utils/PerformanceUtils.js';

export default class CryptoController {
  constructor() {
    this.model = new CryptoModel();
    this.view = new CryptoView();
    this.updateInterval = null;

    // Usa o utilitário de performance para determinar o intervalo de atualização
    this.updateFrequencyMs = PerformanceUtils.getRecommendedUpdateInterval();

    // Aplica debounce na função de conversão
    this.debouncedConvert = PerformanceUtils.debounce(
      this.handleConvert.bind(this),
      500
    );
  }

  /**
   * Inicializa o controlador
   */
  init() {
    // Configura os event listeners com funções debounced
    this.view.initEventListeners(this.debouncedConvert);

    // Adiciona listener para o botão de atualização forçada
    this.setupForceUpdateButton();

    // Carrega os dados iniciais
    this.loadInitialData();

    // Configura atualização automática das taxas
    this.setupAutoUpdate();

    // Detecta modo offline/online
    this.setupConnectivityListener();
  }

  /**
   * Configura o listener para o botão de atualização forçada
   */
  setupForceUpdateButton() {
    const forceUpdateBtn = document.getElementById('forceUpdateBtn');
    if (forceUpdateBtn) {
      forceUpdateBtn.addEventListener('click', async () => {
        try {
          this.view.showLoading();
          // Limpa o cache antes de atualizar
          this.model.clearRatesCache();
          await this.updateRates();
          this.updateRatesTable();
          this.view.displayMessage('Taxas atualizadas com sucesso!', 'success');
        } catch (error) {
          this.view.displayError(error.message);
        } finally {
          this.view.hideLoading();
        }
      });
    }
  }

  /**
   * Configura listener para detectar conectividade
   */
  setupConnectivityListener() {
    window.addEventListener('online', () => {
      this.view.hideOfflineAlert();
      // Atualiza as taxas quando voltar a ficar online
      this.updateRates().then(() => this.updateRatesTable());
    });

    window.addEventListener('offline', () => {
      this.view.showOfflineAlert();
    });
  }

  /**
   * Carrega os dados iniciais da aplicação
   */
  async loadInitialData() {
    try {
      this.view.showLoading();

      // Popula os dropdowns com as opções disponíveis e valores padrão
      this.view.populateDropdowns(
        this.model.getSupportedCryptos(),
        this.model.getSupportedCurrencies(),
        this.model.getDefaultCurrency(),
        this.model.getDefaultCrypto()
      );

      // Busca as taxas iniciais
      await this.updateRates();

      // Atualiza a tabela de taxas
      this.updateRatesTable();

      // Define valor inicial do campo
      this.view.setInitialAmount(100);
    } catch (error) {
      this.view.displayError(error.message);
      console.error('Error loading initial data:', error);
    } finally {
      this.view.hideLoading();
    }
  }

  /**
   * Configura a atualização automática de taxas
   */
  setupAutoUpdate() {
    // Limpa qualquer intervalo existente
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    // Configura novo intervalo para atualização de taxas
    this.updateInterval = setInterval(async () => {
      try {
        // Não atualizamos se estiver offline
        if (!navigator.onLine) return;

        await this.updateRates();
        // Atualiza a tabela de taxas a cada atualização
        this.updateRatesTable();
        console.log('Taxas atualizadas automaticamente');
      } catch (error) {
        console.error('Erro ao atualizar taxas:', error);
      }
    }, this.updateFrequencyMs);
  }

  /**
   * Atualiza as taxas de câmbio
   */
  async updateRates() {
    try {
      await this.model.fetchRates();
      this.view.updateLastUpdateTime();
      return true;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  /**
   * Atualiza a tabela de taxas de câmbio na view
   */
  updateRatesTable() {
    const ratesTable = this.model.getAllRates();
    this.view.updateRatesTable(ratesTable);
  }

  /**
   * Manipula o evento de conversão
   */
  async handleConvert() {
    try {
      this.view.showLoading();

      // Obtem os valores do formulário
      const { fromCurrency, toCrypto, amount } = this.view.getFormValues();

      // Realiza a conversão de FIAT para cripto
      const convertedAmount = this.model.convert(
        fromCurrency,
        toCrypto,
        amount
      );

      // Exibe o resultado
      this.view.displayResult({
        fromCurrency,
        toCrypto,
        amount,
        convertedAmount,
      });
    } catch (error) {
      this.view.displayError(error.message);
      console.error('Conversion error:', error);
    } finally {
      this.view.hideLoading();
    }
  }

  /**
   * Limpa recursos ao destruir o controlador
   */
  destroy() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    // Remove event listeners
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
  }
}
