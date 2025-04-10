import { HttpService } from './HttpService.js';
import { CurrencyService } from './CurrencyService.js';
import { ApiCache } from '../utils/ApiCache.js';
import { ErrorHandler } from '../utils/ErrorHandler.js';
import { Conversion } from '../models/Conversion.js';
import { TIME, STORAGE_KEYS, EVENTS } from '../constants.js';

/**
 * Serviço responsável por realizar conversões entre moedas
 */
export class ConversionService {
  /**
   * @param {Object} options - Opções de configuração
   * @param {HttpService} [options.httpService] - Serviço HTTP para requisições
   * @param {CurrencyService} [options.currencyService] - Serviço de moedas
   * @param {ApiCache} [options.apiCache] - Sistema de cache para otimizar requisições
   * @param {ErrorHandler} [options.errorHandler] - Manipulador de erros
   */
  constructor({ httpService, currencyService, apiCache, errorHandler } = {}) {
    this.httpService = httpService || new HttpService();
    this.currencyService = currencyService || new CurrencyService({ httpService });
    this.apiCache = apiCache || new ApiCache();
    this.errorHandler = errorHandler || new ErrorHandler();
    
    // Cache em memória para taxas de conversão
    this.rates = null;
    this.ratesLastUpdated = null;
    
    // Histórico de conversões
    this.conversionHistory = this.loadConversionHistory();
  }

  /**
   * Realiza a conversão entre duas moedas
   * @param {string} fromCurrency - Código da moeda de origem
   * @param {string} toCurrency - Código da moeda de destino
   * @param {number} amount - Quantidade a ser convertida
   * @returns {Promise<Conversion>} Resultado da conversão
   */
  async convert(fromCurrency, toCurrency, amount) {
    try {
      // Validações básicas
      if (!fromCurrency || !toCurrency) {
        throw new Error('Códigos de moeda inválidos');
      }
      
      if (!amount || isNaN(amount) || amount <= 0) {
        throw new Error('Quantidade inválida para conversão');
      }
      
      // Normalizar códigos de moeda
      const from = fromCurrency.toUpperCase().trim();
      const to = toCurrency.toUpperCase().trim();
      
      // Verificar se são a mesma moeda
      if (from === to) {
        return new Conversion({
          fromCurrency: from,
          toCurrency: to,
          amount,
          convertedAmount: amount,
          rate: 1
        });
      }
      
      // Verificar se as moedas são suportadas
      const [isFromSupported, isToSupported] = await Promise.all([
        this.currencyService.isCurrencySupported(from),
        this.currencyService.isCurrencySupported(to)
      ]);
      
      if (!isFromSupported) {
        throw new Error(`Moeda não suportada: ${from}`);
      }
      
      if (!isToSupported) {
        throw new Error(`Moeda não suportada: ${to}`);
      }
      
      // Obter taxas de conversão
      const rates = await this.getRates();
      
      // Verificar se temos as taxas necessárias
      if (!rates[from] || !rates[to]) {
        throw new Error('Taxas de conversão não disponíveis para as moedas selecionadas');
      }
      
      // Calcular conversão
      const fromRate = rates[from];
      const toRate = rates[to];
      const rate = toRate / fromRate;
      const convertedAmount = amount * rate;
      
      // Criar objeto de conversão
      const conversion = new Conversion({
        fromCurrency: from,
        toCurrency: to,
        amount,
        convertedAmount,
        rate
      });
      
      // Salvar no histórico
      this.addToHistory(conversion);
      
      // Notificar sistema sobre a conversão
      this.notifyConversionComplete(conversion);
      
      return conversion;
    } catch (error) {
      this.errorHandler.handleError(error, 'Falha ao realizar conversão', true);
      throw error;
    }
  }

  /**
   * Obtém as taxas de conversão atuais
   * @param {boolean} forceRefresh - Se deve ignorar o cache e forçar atualização
   * @returns {Promise<Object>} Objeto com taxas de conversão
   */
  async getRates(forceRefresh = false) {
    try {
      // Verificar cache em memória
      if (!forceRefresh && this.rates && this.ratesLastUpdated) {
        // Verificar se ainda é válido (menos de 5 minutos de idade)
        const cacheAge = Date.now() - this.ratesLastUpdated.getTime();
        if (cacheAge < TIME.CACHE_RATES) {
          return this.rates;
        }
      }
      
      // Verificar cache persistente
      if (!forceRefresh) {
        const cachedRates = this.apiCache.get('rates');
        if (cachedRates) {
          this.rates = cachedRates;
          this.ratesLastUpdated = new Date();
          return cachedRates;
        }
      }
      
      // Buscar taxas da API
      const endpoint = '/rates';
      const response = await this.httpService.get(endpoint);
      
      // Validar resposta
      if (!response || !response.rates || typeof response.rates !== 'object') {
        throw new Error('Formato de resposta inválido ao buscar taxas');
      }
      
      // Processar taxas
      const rates = response.rates;
      
      // Atualizar cache
      this.rates = rates;
      this.ratesLastUpdated = new Date();
      
      // Salvar no cache persistente
      this.apiCache.set('rates', rates, TIME.CACHE_RATES);
      
      // Salvar no localStorage como backup
      this.saveRatesToLocalStorage(rates);
      
      // Notificar sistema sobre atualização de taxas
      this.notifyRatesUpdated(rates);
      
      return rates;
    } catch (error) {
      this.errorHandler.handleError(error, 'Falha ao obter taxas de conversão', false);
      
      // Tentar recuperar do localStorage como fallback
      return this.getFallbackRates();
    }
  }

  /**
   * Salva taxas no localStorage para uso offline
   * @param {Object} rates - Taxas a serem salvas
   * @private
   */
  saveRatesToLocalStorage(rates) {
    try {
      localStorage.setItem(STORAGE_KEYS.LAST_RATES, JSON.stringify({
        rates,
        timestamp: new Date().toISOString()
      }));
    } catch (e) {
      console.warn('Erro ao salvar taxas no localStorage', e);
    }
  }

  /**
   * Obtém taxas de fallback quando a API falha
   * @returns {Object} Taxas de fallback
   * @private
   */
  getFallbackRates() {
    try {
      // Tentar recuperar do localStorage
      const savedData = localStorage.getItem(STORAGE_KEYS.LAST_RATES);
      if (savedData) {
        const parsed = JSON.parse(savedData);
        if (parsed && parsed.rates && typeof parsed.rates === 'object') {
          console.info('Usando taxas em cache do localStorage devido a falha na API');
          return parsed.rates;
        }
      }
    } catch (e) {
      console.warn('Erro ao recuperar taxas do localStorage', e);
    }
    
    // Taxas de fallback básicas para as moedas mais comuns
    // Nota: Estes valores são apenas para evitar que o aplicativo quebre completamente,
    // não devem ser usados para conversões reais em produção
    return {
      'BTC': 1,
      'ETH': 15.5,
      'USDT': 36500,
      'USD': 36500,
      'EUR': 39800,
      'BRL': 7300,
      'GBP': 46000
    };
  }

  /**
   * Adiciona uma conversão ao histórico
   * @param {Conversion} conversion - Conversão a ser adicionada
   * @private
   */
  addToHistory(conversion) {
    // Adicionar ao início do histórico
    this.conversionHistory.unshift(conversion);
    
    // Limitar tamanho do histórico
    const maxHistorySize = 20;
    if (this.conversionHistory.length > maxHistorySize) {
      this.conversionHistory = this.conversionHistory.slice(0, maxHistorySize);
    }
    
    // Salvar no localStorage
    this.saveConversionHistory();
  }

  /**
   * Carrega o histórico de conversões do localStorage
   * @returns {Conversion[]} Histórico de conversões
   * @private
   */
  loadConversionHistory() {
    try {
      const savedHistory = localStorage.getItem(STORAGE_KEYS.HISTORY);
      if (savedHistory) {
        const parsed = JSON.parse(savedHistory);
        return parsed.map(item => Conversion.fromJSON(item));
      }
    } catch (e) {
      console.warn('Erro ao carregar histórico de conversões', e);
    }
    
    return [];
  }

  /**
   * Salva o histórico de conversões no localStorage
   * @private
   */
  saveConversionHistory() {
    try {
      localStorage.setItem(
        STORAGE_KEYS.HISTORY,
        JSON.stringify(this.conversionHistory.map(conv => conv.toJSON()))
      );
    } catch (e) {
      console.warn('Erro ao salvar histórico de conversões', e);
    }
  }

  /**
   * Obtém o histórico de conversões
   * @param {number} [limit] - Limite de itens a retornar
   * @returns {Conversion[]} Histórico de conversões
   */
  getConversionHistory(limit) {
    if (limit && limit > 0) {
      return this.conversionHistory.slice(0, limit);
    }
    return [...this.conversionHistory];
  }

  /**
   * Limpa o histórico de conversões
   */
  clearConversionHistory() {
    this.conversionHistory = [];
    this.saveConversionHistory();
  }

  /**
   * Notifica o sistema sobre uma conversão concluída
   * @param {Conversion} conversion - Conversão realizada
   * @private
   */
  notifyConversionComplete(conversion) {
    const event = new CustomEvent(EVENTS.CONVERSION_COMPLETE, {
      detail: { conversion }
    });
    document.dispatchEvent(event);
  }

  /**
   * Notifica o sistema sobre atualização de taxas
   * @param {Object} rates - Novas taxas
   * @private
   */
  notifyRatesUpdated(rates) {
    const event = new CustomEvent(EVENTS.RATES_UPDATED, {
      detail: { 
        rates,
        timestamp: new Date()
      }
    });
    document.dispatchEvent(event);
  }

  /**
   * Obtém a data da última atualização de taxas
   * @returns {Date|null} Data da última atualização ou null
   */
  getLastUpdated() {
    return this.ratesLastUpdated;
  }

  /**
   * Limpa o cache de taxas
   */
  clearRatesCache() {
    this.rates = null;
    this.ratesLastUpdated = null;
    this.apiCache.delete('rates');
  }
}