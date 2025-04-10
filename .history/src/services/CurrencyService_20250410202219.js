import { HttpService } from './HttpService.js';
import { ApiCache } from '../utils/ApiCache.js';
import { Currency } from '../models/Currency.js';
import { TIME, STORAGE_KEYS } from '../constants.js';
import { ErrorHandler } from '../utils/ErrorHandler.js';

/**
 * Serviço responsável por gerenciar moedas no sistema
 */
export class CurrencyService {
  /**
   * @param {Object} options - Opções de configuração
   * @param {HttpService} [options.httpService] - Serviço HTTP para requisições
   * @param {ApiCache} [options.apiCache] - Sistema de cache para otimizar requisições
   * @param {ErrorHandler} [options.errorHandler] - Manipulador de erros
   */
  constructor({ httpService, apiCache, errorHandler } = {}) {
    this.httpService = httpService || new HttpService();
    this.apiCache = apiCache || new ApiCache();
    this.errorHandler = errorHandler || new ErrorHandler();
    
    // Cache em memória para otimizar acesso frequente
    this.currenciesCache = null;
    this.lastUpdated = null;
  }

  /**
   * Obtém a lista de todas as moedas suportadas
   * @param {boolean} forceRefresh - Se deve ignorar o cache e forçar atualização
   * @returns {Promise<Currency[]>} Lista de moedas
   */
  async getAllCurrencies(forceRefresh = false) {
    try {
      // Verificar se já temos os dados em cache
      if (!forceRefresh && this.currenciesCache) {
        return this.currenciesCache;
      }
      
      // Verificar cache persistente
      if (!forceRefresh) {
        const cachedData = this.apiCache.get('currencies');
        if (cachedData) {
          // Converter objetos para instâncias de Currency
          this.currenciesCache = cachedData.map(data => new Currency(data));
          this.lastUpdated = new Date();
          return this.currenciesCache;
        }
      }
      
      // Buscar dados da API
      const endpoint = '/currencies';
      const response = await this.httpService.get(endpoint);
      
      // Validar resposta
      if (!response || typeof response !== 'object') {
        throw new Error('Formato de resposta inválido ao buscar moedas');
      }
      
      // Processar e transformar dados da API
      const currencies = this.processCurrenciesResponse(response);
      
      // Atualizar cache em memória
      this.currenciesCache = currencies;
      this.lastUpdated = new Date();
      
      // Salvar no cache persistente
      this.apiCache.set('currencies', currencies.map(c => c.toJSON()), TIME.CACHE_CURRENCIES);
      
      return currencies;
    } catch (error) {
      this.errorHandler.handleError(error, 'Falha ao obter lista de moedas', false);
      
      // Tentar recuperar do localStorage como fallback
      return this.getFallbackCurrencies();
    }
  }

  /**
   * Processa a resposta da API e converte para instâncias de Currency
   * @param {Object} response - Resposta da API
   * @returns {Currency[]} Lista de moedas processadas
   * @private
   */
  processCurrenciesResponse(response) {
    try {
      const currencies = [];
      
      // Diferentes APIs podem ter formatos diferentes
      if (Array.isArray(response)) {
        // Formato de array
        currencies.push(...response.map(item => Currency.fromApiData(item)));
      } else {
        // Formato de objeto com códigos como chaves
        for (const [code, data] of Object.entries(response)) {
          currencies.push(
            Currency.fromApiData({
              code,
              ...data
            })
          );
        }
      }
      
      // Ordenar: criptomoedas primeiro, depois moedas fiduciárias, ambas em ordem alfabética
      return currencies.sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === 'crypto' ? -1 : 1;
        }
        return a.code.localeCompare(b.code);
      });
    } catch (error) {
      this.errorHandler.handleError(error, 'Erro ao processar dados de moedas', false);
      throw new Error('Falha ao processar dados de moedas da API');
    }
  }

  /**
   * Obtém uma lista mínima de moedas como fallback quando a API falha
   * @returns {Currency[]} Lista de moedas de fallback
   * @private
   */
  getFallbackCurrencies() {
    try {
      // Tentar recuperar do localStorage primeiro
      const savedData = localStorage.getItem(STORAGE_KEYS.LAST_RATES);
      if (savedData) {
        const parsed = JSON.parse(savedData);
        if (Array.isArray(parsed)) {
          return parsed.map(data => new Currency(data));
        }
      }
    } catch (e) {
      console.warn('Erro ao recuperar moedas do localStorage', e);
    }
    
    // Lista mínima de moedas populares como último recurso
    return [
      new Currency({ code: 'BTC', name: 'Bitcoin', symbol: '₿', type: 'crypto' }),
      new Currency({ code: 'ETH', name: 'Ethereum', symbol: 'Ξ', type: 'crypto' }),
      new Currency({ code: 'USDT', name: 'Tether', symbol: '₮', type: 'crypto' }),
      new Currency({ code: 'BNB', name: 'Binance Coin', symbol: 'BNB', type: 'crypto' }),
      new Currency({ code: 'USD', name: 'Dólar Americano', symbol: '$', type: 'fiat' }),
      new Currency({ code: 'EUR', name: 'Euro', symbol: '€', type: 'fiat' }),
      new Currency({ code: 'BRL', name: 'Real Brasileiro', symbol: 'R$', type: 'fiat' }),
      new Currency({ code: 'GBP', name: 'Libra Esterlina', symbol: '£', type: 'fiat' }),
    ];
  }

  /**
   * Busca uma moeda específica pelo código
   * @param {string} code - Código da moeda
   * @returns {Promise<Currency|null>} Moeda encontrada ou null
   */
  async getCurrencyByCode(code) {
    if (!code) return null;
    
    const normalizedCode = code.toUpperCase().trim();
    const currencies = await this.getAllCurrencies();
    
    return currencies.find(currency => currency.code === normalizedCode) || null;
  }

  /**
   * Verifica se uma moeda é suportada pelo sistema
   * @param {string} code - Código da moeda
   * @returns {Promise<boolean>} Se a moeda é suportada
   */
  async isCurrencySupported(code) {
    return (await this.getCurrencyByCode(code)) !== null;
  }

  /**
   * Obtém apenas criptomoedas
   * @returns {Promise<Currency[]>} Lista de criptomoedas
   */
  async getCryptoCurrencies() {
    const currencies = await this.getAllCurrencies();
    return currencies.filter(currency => currency.isCrypto());
  }

  /**
   * Obtém apenas moedas fiduciárias
   * @returns {Promise<Currency[]>} Lista de moedas fiduciárias
   */
  async getFiatCurrencies() {
    const currencies = await this.getAllCurrencies();
    return currencies.filter(currency => currency.isFiat());
  }

  /**
   * Pesquisa moedas pelo nome ou código
   * @param {string} query - Termo de pesquisa
   * @returns {Promise<Currency[]>} Moedas que correspondem à pesquisa
   */
  async searchCurrencies(query) {
    if (!query || typeof query !== 'string') {
      return [];
    }
    
    const searchTerm = query.toLowerCase().trim();
    
    if (searchTerm.length < 2) {
      return [];
    }
    
    const currencies = await this.getAllCurrencies();
    
    return currencies.filter(currency => 
      currency.code.toLowerCase().includes(searchTerm) || 
      currency.name.toLowerCase().includes(searchTerm)
    );
  }

  /**
   * Limpa o cache de moedas
   */
  clearCache() {
    this.currenciesCache = null;
    this.lastUpdated = null;
    this.apiCache.delete('currencies');
  }
}