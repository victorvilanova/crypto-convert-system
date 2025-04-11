/**
 * CryptoController.js
 * Responsável por conectar o Model e a View, gerenciando a lógica da aplicação
 */
import CryptoModel from '../models/CryptoModel.js';
import CryptoView from '../views/CryptoView.js';

export default class CryptoController {
  constructor() {
    this.model = new CryptoModel();
    this.view = new CryptoView();
    this.updateInterval = null;
    this.updateFrequencyMs = 60000; // Atualiza a cada 1 minuto
  }

  /**
   * Inicializa o controlador
   */
  init() {
    // Configura os event listeners
    this.view.initEventListeners(this.handleConvert.bind(this));
    
    // Carrega os dados iniciais
    this.loadInitialData();
    
    // Configura atualização automática das taxas
    this.setupAutoUpdate();
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
      
    } catch (error) {
      this.view.displayError('Erro ao carregar dados iniciais: ' + error.message);
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
        await this.updateRates();
        // Atualiza a tabela de taxas a cada atualização
        this.updateRatesTable();
        console.log('Taxas atualizadas automaticamente');
      } catch (error) {
        console.error('Erro ao atualizar taxas:', error);
        // Não mostramos o erro na UI para não interromper a experiência do usuário
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
      throw new Error('Falha ao atualizar taxas: ' + error.message);
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
      
      // Validações
      if (!amount || amount <= 0) {
        throw new Error('Por favor, informe um valor válido para conversão');
      }
      
      // Tenta atualizar as taxas antes da conversão para ter dados atualizados
      await this.updateRates();
      
      // Realiza a conversão de FIAT para cripto
      const convertedAmount = this.model.convert(fromCurrency, toCrypto, amount);
      
      // Exibe o resultado
      this.view.displayResult({
        fromCurrency,
        toCrypto,
        amount,
        convertedAmount
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
  }
}