/**
 * CryptoDataService.js
 * Serviço para obter dados de criptomoedas de APIs externas
 */
export default class CryptoDataService {
  constructor() {
    // URL base para a API CoinGecko
    this.apiBaseUrl = 'https://api.coingecko.com/api/v3';
    
    // Cache para armazenar dados temporariamente
    this.cache = {
      prices: {},
      lastUpdate: null
    };
    
    // Tempo de expiração do cache em milissegundos (5 minutos)
    this.cacheExpiration = 5 * 60 * 1000;
  }
  
  /**
   * Obtém o preço atual de uma criptomoeda em USD
   * @param {string} cryptoId - ID da criptomoeda na API (ex: 'bitcoin', 'ethereum')
   * @returns {Promise<number>} Preço em USD
   */
  async getCryptoPrice(cryptoId) {
    try {
      // Verifica se há dados em cache válidos
      if (this.isCacheValid() && this.cache.prices[cryptoId]) {
        return this.cache.prices[cryptoId];
      }
      
      // Constrói a URL da API
      const url = `${this.apiBaseUrl}/simple/price?ids=${cryptoId}&vs_currencies=usd`;
      
      // Faz a requisição
      const response = await fetch(url);
      
      // Verifica se a resposta foi bem-sucedida
      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status} ${response.statusText}`);
      }
      
      // Converte a resposta para JSON
      const data = await response.json();
      
      // Verifica se os dados da criptomoeda existem
      if (!data[cryptoId] || !data[cryptoId].usd) {
        throw new Error(`Dados não encontrados para ${cryptoId}`);
      }
      
      // Obtém o preço
      const price = data[cryptoId].usd;
      
      // Atualiza o cache
      this.cache.prices[cryptoId] = price;
      this.cache.lastUpdate = Date.now();
      
      return price;
    } catch (error) {
      console.error(`Erro ao obter preço de ${cryptoId}:`, error);
      throw error;
    }
  }
  
  /**
   * Obtém os preços de várias criptomoedas em USD
   * @param {string[]} cryptoIds - Lista de IDs de criptomoedas
   * @returns {Promise<Object>} Objeto com os preços de cada criptomoeda
   */
  async getMultipleCryptoPrices(cryptoIds) {
    try {
      // Verifica se há dados em cache válidos para todas as moedas
      if (this.isCacheValid() && cryptoIds.every(id => this.cache.prices[id])) {
        const cachedPrices = {};
        cryptoIds.forEach(id => {
          cachedPrices[id] = this.cache.prices[id];
        });
        return cachedPrices;
      }
      
      // Constrói a URL da API
      const idsString = cryptoIds.join(',');
      const url = `${this.apiBaseUrl}/simple/price?ids=${idsString}&vs_currencies=usd`;
      
      // Faz a requisição
      const response = await fetch(url);
      
      // Verifica se a resposta foi bem-sucedida
      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status} ${response.statusText}`);
      }
      
      // Converte a resposta para JSON
      const data = await response.json();
      
      // Extrai os preços
      const prices = {};
      cryptoIds.forEach(id => {
        if (data[id] && data[id].usd) {
          prices[id] = data[id].usd;
          
          // Atualiza o cache
          this.cache.prices[id] = data[id].usd;
        } else {
          prices[id] = null;
        }
      });
      
      // Atualiza o timestamp do cache
      this.cache.lastUpdate = Date.now();
      
      return prices;
    } catch (error) {
      console.error('Erro ao obter múltiplos preços:', error);
      throw error;
    }
  }
  
  /**
   * Verifica se o cache atual é válido
   * @returns {boolean} Verdadeiro se o cache for válido
   */
  isCacheValid() {
    return (
      this.cache.lastUpdate !== null &&
      Date.now() - this.cache.lastUpdate < this.cacheExpiration
    );
  }
  
  /**
   * Limpa o cache
   */
  clearCache() {
    this.cache = {
      prices: {},
      lastUpdate: null
    };
  }
}