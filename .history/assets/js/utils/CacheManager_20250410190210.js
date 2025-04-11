/**
 * CacheManager.js
 * Utilitário para gerenciar cache de dados
 */
export default class CacheManager {
  constructor(ttlInMinutes = 10) {
    this.cacheKeyPrefix = 'crypto_convert_';
    this.defaultTtl = ttlInMinutes * 60 * 1000; // Convertendo minutos para milissegundos
  }

  /**
   * Salva dados no cache
   * @param {string} key - Chave para o item no cache
   * @param {any} data - Dados a serem armazenados
   * @param {number} ttl - Tempo de vida em ms (opcional)
   */
  setItem(key, data, ttl = this.defaultTtl) {
    const cacheItem = {
      data: data,
      expiry: Date.now() + ttl,
      timestamp: Date.now(),
    };

    try {
      localStorage.setItem(
        this.cacheKeyPrefix + key,
        JSON.stringify(cacheItem)
      );
      return true;
    } catch (error) {
      console.warn('Erro ao armazenar no cache:', error);
      return false;
    }
  }

  /**
   * Recupera dados do cache
   * @param {string} key - Chave do item no cache
   * @returns {any} Dados armazenados ou null se expirado ou não encontrado
   */
  getItem(key) {
    try {
      const cachedItem = localStorage.getItem(this.cacheKeyPrefix + key);

      if (!cachedItem) {
        return null;
      }

      const item = JSON.parse(cachedItem);

      // Verifica se o item expirou
      if (item.expiry < Date.now()) {
        this.removeItem(key);
        return null;
      }

      return item.data;
    } catch (error) {
      console.warn('Erro ao recuperar do cache:', error);
      return null;
    }
  }

  /**
   * Remove um item do cache
   * @param {string} key - Chave do item a ser removido
   */
  removeItem(key) {
    try {
      localStorage.removeItem(this.cacheKeyPrefix + key);
    } catch (error) {
      console.warn('Erro ao remover item do cache:', error);
    }
  }

  /**
   * Limpa todos os itens de cache da aplicação
   */
  clearCache() {
    try {
      // Remove apenas itens que pertencem a esta aplicação
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith(this.cacheKeyPrefix)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Erro ao limpar cache:', error);
    }
  }

  /**
   * Verifica a idade dos dados em cache
   * @param {string} key - Chave do item no cache
   * @returns {number} Idade em minutos ou -1 se não encontrado
   */
  getItemAge(key) {
    try {
      const cachedItem = localStorage.getItem(this.cacheKeyPrefix + key);

      if (!cachedItem) {
        return -1;
      }

      const item = JSON.parse(cachedItem);
      const ageInMs = Date.now() - item.timestamp;

      // Retorna idade em minutos
      return Math.floor(ageInMs / (60 * 1000));
    } catch (error) {
      return -1;
    }
  }
}
