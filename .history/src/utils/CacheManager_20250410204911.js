/**
 * Gerencia o cache de dados da aplicação com TTL (Time To Live)
 */
export class CacheManager {
  constructor(defaultTtlMinutes = 15) {
    this.cache = new Map();
    this.defaultTtlMs = defaultTtlMinutes * 60 * 1000;
  }

  /**
   * Armazena um valor no cache
   * @param {string} key - Chave para armazenamento
   * @param {any} value - Valor a ser armazenado
   * @param {number} ttlMinutes - Tempo de vida em minutos (opcional)
   */
  set(key, value, ttlMinutes) {
    const ttlMs = ttlMinutes ? ttlMinutes * 60 * 1000 : this.defaultTtlMs;
    
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      expiry: Date.now() + ttlMs
    });
    
    return true;
  }

  /**
   * Recupera um valor do cache
   * @param {string} key - Chave para recuperação
   * @returns {any|null} - Valor recuperado ou null se não existir ou estiver expirado
   */
  get(key) {
    const item = this.cache.get(key);
    
    // Se o item não existe
    if (!item) {
      return null;
    }
    
    // Se o item expirou
    if (Date.now() > item.expiry) {
      this.remove(key);
      return null;
    }
    
    return item.value;
  }

  /**
   * Remove um item do cache
   * @param {string} key - Chave do item a ser removido
   */
  remove(key) {
    this.cache.delete(key);
  }

  /**
   * Limpa itens expirados do cache
   */
  cleanExpired() {
    const now = Date.now();
    
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Limpa todo o cache
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Retorna o número de itens no cache
   * @returns {number} - Número de itens
   */
  size() {
    return this.cache.size;
  }
}