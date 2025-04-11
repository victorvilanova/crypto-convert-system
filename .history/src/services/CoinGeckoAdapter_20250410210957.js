import { HttpService } from './HttpService';
import { Logger } from '../utils/Logger';
import { CacheManager } from '../utils/CacheManager';

/**
 * Adaptador para a API CoinGecko
 * Documentação: https://www.coingecko.com/en/api/documentation
 */
export class CoinGeckoAdapter {
  /**
   * @param {Object} options - Opções de configuração
   * @param {Object} options.httpOptions - Opções para o HttpService
   * @param {number} options.cacheTtlMinutes - Tempo de vida do cache em minutos
   */
  constructor(options = {}) {
    const {
      httpOptions = {},
      cacheTtlMinutes = 5 // Cache menor para dados de mercado (5 minutos)
    } = options;
    
    this.baseUrl = 'https://api.coingecko.com/api/v3';
    this.httpService = new HttpService(this.baseUrl, {
      timeout: 15000, // Timeout maior para API externa
      ...httpOptions
    });
    this.cache = new CacheManager(cacheTtlMinutes);
    this.logger = new Logger('CoinGeckoAdapter');
    
    // Mapeamento de moedas de nossa aplicação para IDs do CoinGecko
    this.coinIdMap = {
      'BTC': 'bitcoin',
      'ETH': 'ethereum',
      'USDT': 'tether',
      'BNB': 'binancecoin',
      'XRP': 'ripple'
    };
    
    // Mapeamento de símbolos de moedas fiduciárias
    this.fiatMap = {
      'BRL': 'brl',
      'USD': 'usd',
      'EUR': 'eur'
    };
  }
  
  /**
   * Verifica o status da API
   * @returns {Promise<boolean>} - Se a API está respondendo
   */
  async ping() {
    try {
      const response = await this.httpService.get('/ping');
      return response && response.gecko_says === '(V3) To the Moon!';
    } catch (error) {
      this.logger.error('Falha ao verificar status da API CoinGecko', error);
      return false;
    }
  }
  
  /**
   * Obtém preços atuais de criptomoedas
   * @param {string[]} coins - Array com símbolos das criptomoedas (ex: ['BTC', 'ETH'])
   * @param {string[]} currencies - Array com símbolos das moedas fiduciárias (ex: ['BRL', 'USD'])
   * @param {boolean} forceRefresh - Se deve ignorar o cache
   * @returns {Promise<Object>} - Objeto com os preços
   */
  async getPrices(coins = Object.keys(this.coinIdMap), currencies = Object.keys(this.fiatMap), forceRefresh = false) {
    // Verificar parâmetros
    if (!Array.isArray(coins) || !coins.length || !Array.isArray(currencies) || !currencies.length) {
      throw new Error('Parâmetros inválidos para obter preços');
    }
    
    // Criar chave de cache
    const cacheKey = `coinGecko_prices_${coins.join('_')}_${currencies.join('_')}`;
    
    // Tentar obter do cache
    if (!forceRefresh) {
      const cachedData = this.cache.get(cacheKey);
      if (cachedData) {
        this.logger.debug('Preços obtidos do cache', { coins, currencies });
        return cachedData;
      }
    }
    
    try {
      // Converter símbolos para IDs do CoinGecko
      const coinIds = coins
        .map(coin => this.coinIdMap[coin.toUpperCase()])
        .filter(id => id); // Filtrar valores undefined
      
      const currenciesLower = currencies
        .map(currency => this.fiatMap[currency.toUpperCase()] || currency.toLowerCase())
        .filter(currency => currency); // Filtrar valores undefined
      
      if (!coinIds.length || !currenciesLower.length) {
        throw new Error('Nenhuma moeda válida especificada');
      }
      
      this.logger.info('Buscando preços na API CoinGecko', { coins, currencies });
      
      // Fazer requisição à API
      const response = await this.httpService.get('/simple/price', {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
        params: {
          ids: coinIds.join(','),
          vs_currencies: currenciesLower.join(','),
          include_last_updated_at: true
        }
      });
      
      // Converter resposta para nosso formato padrão
      const result = this._formatPricesResponse(response, coins, currencies);
      
      // Armazenar no cache
      this.cache.set(cacheKey, result);
      
      return result;
    } catch (error) {
      this.logger.error('Falha ao obter preços do CoinGecko', error);
      throw error;
    }
  }
  
  /**
   * Formata a resposta da API para o formato padrão da nossa aplicação
   * @param {Object} apiResponse - Resposta da API CoinGecko
   * @param {string[]} requestedCoins - Moedas solicitadas
   * @param {string[]} requestedCurrencies - Moedas fiduciárias solicitadas
   * @returns {Object} - Objeto formatado com preços
   * @private
   */
  _formatPricesResponse(apiResponse, requestedCoins, requestedCurrencies) {
    const result = {};
    
    // Mapear cada criptomoeda
    requestedCoins.forEach(coin => {
      const geckoId = this.coinIdMap[coin.toUpperCase()];
      if (!geckoId || !apiResponse[geckoId]) return;
      
      result[coin.toUpperCase()] = {};
      
      // Mapear cada moeda fiduciária
      requestedCurrencies.forEach(currency => {
        const geckoCurrency = this.fiatMap[currency.toUpperCase()] || currency.toLowerCase();
        if (apiResponse[geckoId][geckoCurrency]) {
          result[coin.toUpperCase()][currency.toUpperCase()] = apiResponse[geckoId][geckoCurrency];
        }
      });
    });
    
    // Adicionar timestamp
    result.timestamp = Date.now();
    result.source = 'coingecko';
    
    return result;
  }
  
  /**
   * Obtém informações detalhadas sobre uma criptomoeda
   * @param {string} coin - Símbolo da criptomoeda (ex: 'BTC')
   * @param {boolean} forceRefresh - Se deve ignorar o cache
   * @returns {Promise<Object>} - Dados detalhados da criptomoeda
   */
  async getCoinDetails(coin, forceRefresh = false) {
    if (!coin) {
      throw new Error('Símbolo da criptomoeda é obrigatório');
    }
    
    const coinId = this.coinIdMap[coin.toUpperCase()];
    if (!coinId) {
      throw new Error(`Criptomoeda não suportada: ${coin}`);
    }
    
    const cacheKey = `coinGecko_details_${coin.toUpperCase()}`;
    
    // Tentar obter do cache (usando TTL maior para dados que mudam menos)
    if (!forceRefresh) {
      const cachedData = this.cache.get(cacheKey);
      if (cachedData) {
        this.logger.debug('Detalhes obtidos do cache', { coin });
        return cachedData;
      }
    }
    
    try {
      this.logger.info('Buscando detalhes na API CoinGecko', { coin });
      
      // Fazer requisição à API
      const response = await this.httpService.get(`/coins/${coinId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
        params: {
          localization: 'false',
          tickers: false,
          market_data: true,
          community_data: false,
          developer_data: false
        }
      });
      
      // Formatar resposta
      const result = {
        id: response.id,
        symbol: response.symbol.toUpperCase(),
        name: response.name,
        description: response.description.pt || response.description.en,
        image: response.image.large,
        currentPrice: response.market_data.current_price,
        marketCap: response.market_data.market_cap,
        marketCapRank: response.market_cap_rank,
        totalVolume: response.market_data.total_volume,
        high24h: response.market_data.high_24h,
        low24h: response.market_data.low_24h,
        priceChange24h: response.market_data.price_change_24h,
        priceChangePercentage24h: response.market_data.price_change_percentage_24h,
        circulatingSupply: response.market_data.circulating_supply,
        totalSupply: response.market_data.total_supply,
        maxSupply: response.market_data.max_supply,
        lastUpdated: response.last_updated,
        timestamp: Date.now(),
        source: 'coingecko'
      };
      
      // Armazenar no cache com TTL maior (30 minutos)
      this.cache.set(cacheKey, result, 30);
      
      return result;
    } catch (error) {
      this.logger.error('Falha ao obter detalhes do CoinGecko', error);
      throw error;
    }
  }
  
  /**
   * Obtém gráfico histórico de preços para uma criptomoeda
   * @param {string} coin - Símbolo da criptomoeda
   * @param {string} currency - Símbolo da moeda fiduciária
   * @param {number} days - Número de dias de histórico
   * @param {boolean} forceRefresh - Se deve ignorar o cache
   * @returns {Promise<Object>} - Dados históricos para o gráfico
   */
  async getHistoricalPrices(coin, currency = 'BRL', days = 30, forceRefresh = false) {
    if (!coin) {
      throw new Error('Símbolo da criptomoeda é obrigatório');
    }
    
    const coinId = this.coinIdMap[coin.toUpperCase()];
    if (!coinId) {
      throw new Error(`Criptomoeda não suportada: ${coin}`);
    }
    
    const vsCurrency = this.fiatMap[currency.toUpperCase()] || currency.toLowerCase();
    const cacheKey = `coinGecko_history_${coin.toUpperCase()}_${currency.toUpperCase()}_${days}`;
    
    // Tentar obter do cache
    if (!forceRefresh) {
      const cachedData = this.cache.get(cacheKey);
      if (cachedData) {
        this.logger.debug('Histórico obtido do cache', { coin, currency, days });
        return cachedData;
      }
    }
    
    try {
      this.logger.info('Buscando histórico na API CoinGecko', { coin, currency, days });
      
      // Fazer requisição à API
      const response = await this.httpService.get(`/coins/${coinId}/market_chart`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
        params: {
          vs_currency: vsCurrency,
          days: days,
          interval: days > 90 ? 'daily' : undefined
        }
      });
      
      // Formatar resposta
      const result = {
        coin: coin.toUpperCase(),
        currency: currency.toUpperCase(),
        days: days,
        prices: response.prices.map(item => ({
          timestamp: item[0],
          price: item[1]
        })),
        marketCaps: response.market_caps.map(item => ({
          timestamp: item[0],
          value: item[1]
        })),
        totalVolumes: response.total_volumes.map(item => ({
          timestamp: item[0],
          value: item[1]
        })),
        timestamp: Date.now(),
        source: 'coingecko'
      };
      
      // Cache com TTL baseado no período solicitado
      const cacheTtl = days <= 1 ? 10 : (days <= 7 ? 30 : 60);
      this.cache.set(cacheKey, result, cacheTtl);
      
      return result;
    } catch (error) {
      this.logger.error('Falha ao obter histórico do CoinGecko', error);
      throw error;
    }
  }
}