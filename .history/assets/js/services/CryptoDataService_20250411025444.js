/**
 * CryptoDataService.js
 * Serviço para obtenção de dados de criptomoedas de APIs externas
 */
export default class CryptoDataService {
  constructor() {
    // Configuração da API
    this.baseUrl = 'https://api.coingecko.com/api/v3';
    
    // Cache para minimizar chamadas de API
    this.cache = {};
    this.cacheTTL = 5 * 60 * 1000; // 5 minutos em milissegundos
  }
  
  /**
   * Obtém o preço atual de uma criptomoeda em USD
   * @param {string} cryptoId - ID da criptomoeda na CoinGecko (ex: 'bitcoin')
   * @returns {Promise<number|null>} Preço em USD ou null se ocorrer erro
   */
  async getCryptoPrice(cryptoId) {
    try {
      // Verifica se temos um valor em cache válido
      if (this.isValidCache(`price_${cryptoId}`)) {
        return this.cache[`price_${cryptoId}`].data;
      }
      
      // Constrói a URL da API
      const url = `${this.baseUrl}/simple/price?ids=${cryptoId}&vs_currencies=usd`;
      
      // Faz a requisição
      const response = await fetch(url);
      
      // Verifica se a resposta foi bem-sucedida
      if (!response.ok) {
        throw new Error(`Erro na API (${response.status}): ${response.statusText}`);
      }
      
      // Converte a resposta para JSON
      const data = await response.json();
      
      // Verifica se o dado existe na resposta
      if (data[cryptoId] && data[cryptoId].usd) {
        // Armazena em cache
        this.setCache(`price_${cryptoId}`, data[cryptoId].usd);
        
        return data[cryptoId].usd;
      } else {
        console.warn(`Preço não encontrado para ${cryptoId}`);
        return null;
      }
    } catch (error) {
      console.error(`Erro ao obter preço para ${cryptoId}:`, error);
      return null;
    }
  }
  
  /**
   * Obtém os preços de múltiplas criptomoedas de uma só vez
   * @param {string[]} cryptoIds - Lista de IDs de criptomoedas
   * @returns {Promise<Object>} Objeto com os preços de cada criptomoeda
   */
  async getMultipleCryptoPrices(cryptoIds) {
    try {
      // Chave de cache para esta lista específica
      const cacheKey = `prices_${cryptoIds.sort().join('_')}`;
      
      // Verifica se temos um valor em cache válido
      if (this.isValidCache(cacheKey)) {
        return this.cache[cacheKey].data;
      }
      
      // Constrói a URL da API
      const url = `${this.baseUrl}/simple/price?ids=${cryptoIds.join(',')}&vs_currencies=usd`;
      
      // Faz a requisição
      const response = await fetch(url);
      
      // Verifica se a resposta foi bem-sucedida
      if (!response.ok) {
        throw new Error(`Erro na API (${response.status}): ${response.statusText}`);
      }
      
      // Converte a resposta para JSON
      const data = await response.json();
      
      // Formata os resultados
      const prices = {};
      
      cryptoIds.forEach(cryptoId => {
        if (data[cryptoId] && data[cryptoId].usd) {
          prices[cryptoId] = data[cryptoId].usd;
          
          // Também atualiza o cache individual
          this.setCache(`price_${cryptoId}`, data[cryptoId].usd);
        } else {
          prices[cryptoId] = null;
        }
      });
      
      // Armazena em cache
      this.setCache(cacheKey, prices);
      
      return prices;
    } catch (error) {
      console.error('Erro ao obter múltiplos preços:', error);
      
      // Em caso de erro, retorna um objeto com valores nulos
      const prices = {};
      cryptoIds.forEach(cryptoId => {
        prices[cryptoId] = null;
      });
      
      return prices;
    }
  }
  
  /**
   * Obtém detalhes de uma criptomoeda
   * @param {string} cryptoId - ID da criptomoeda
   * @returns {Promise<Object|null>} Detalhes da criptomoeda ou null se ocorrer erro
   */
  async getCryptoDetails(cryptoId) {
    try {
      // Verifica se temos um valor em cache válido
      if (this.isValidCache(`details_${cryptoId}`)) {
        return this.cache[`details_${cryptoId}`].data;
      }
      
      // Constrói a URL da API
      const url = `${this.baseUrl}/coins/${cryptoId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false`;
      
      // Faz a requisição
      const response = await fetch(url);
      
      // Verifica se a resposta foi bem-sucedida
      if (!response.ok) {
        throw new Error(`Erro na API (${response.status}): ${response.statusText}`);
      }
      
      // Converte a resposta para JSON
      const data = await response.json();
      
      // Simplifica os dados
      const details = {
        id: data.id,
        symbol: data.symbol,
        name: data.name,
        image: data.image?.large,
        currentPrice: data.market_data?.current_price?.usd,
        marketCap: data.market_data?.market_cap?.usd,
        marketCapRank: data.market_cap_rank,
        volume24h: data.market_data?.total_volume?.usd,
        priceChange24h: data.market_data?.price_change_percentage_24h,
        description: data.description?.en,
        lastUpdated: data.last_updated,
      };
      
      // Armazena em cache
      this.setCache(`details_${cryptoId}`, details);
      
      return details;
    } catch (error) {
      console.error(`Erro ao obter detalhes para ${cryptoId}:`, error);
      return null;
    }
  }
  
  /**
   * Obtém os dados históricos de preço de uma criptomoeda
   * @param {string} cryptoId - ID da criptomoeda
   * @param {number} days - Número de dias (1, 7, 14, 30, 90, 180, 365, max)
   * @returns {Promise<Array|null>} Array de pontos [timestamp, preço] ou null
   */
  async getPriceHistory(cryptoId, days = 7) {
    try {
      // Verifica se temos um valor em cache válido
      const cacheKey = `history_${cryptoId}_${days}`;
      if (this.isValidCache(cacheKey)) {
        return this.cache[cacheKey].data;
      }
      
      // Constrói a URL da API
      const url = `${this.baseUrl}/coins/${cryptoId}/market_chart?vs_currency=usd&days=${days}`;
      
      // Faz a requisição
      const response = await fetch(url);
      
      // Verifica se a resposta foi bem-sucedida
      if (!response.ok) {
        throw new Error(`Erro na API (${response.status}): ${response.statusText}`);
      }
      
      // Converte a resposta para JSON
      const data = await response.json();
      
      // Verifica se os dados de preço existem
      if (data.prices && Array.isArray(data.prices)) {
        // Armazena em cache
        this.setCache(cacheKey, data.prices);
        
        return data.prices;
      } else {
        console.warn(`Histórico de preços não encontrado para ${cryptoId}`);
        return null;
      }
    } catch (error) {
      console.error(`Erro ao obter histórico para ${cryptoId}:`, error);
      return null;
    }
  }
  
  /**
   * Verifica se uma entrada do cache é válida
   * @param {string} key - Chave do cache
   * @returns {boolean} Verdadeiro se o cache for válido
   */
  isValidCache(key) {
    if (!this.cache[key]) {
      return false;
    }
    
    const now = Date.now();
    const cacheTime = this.cache[key].timestamp;
    
    // Verifica se o cache expirou
    return (now - cacheTime) < this.cacheTTL;
  }
  
  /**
   * Armazena um valor no cache
   * @param {string} key - Chave do cache
   * @param {*} data - Dados a serem armazenados
   */
  setCache(key, data) {
    this.cache[key] = {
      data: data,
      timestamp: Date.now()
    };
  }
  
  /**
   * Limpa todo o cache
   */
  clearCache() {
    this.cache = {};
  }
  
  /**
   * Remove uma entrada específica do cache
   * @param {string} key - Chave do cache
   */
  clearCacheItem(key) {
    if (this.cache[key]) {
      delete this.cache[key];
    }
  }
}