/**
 * Classe para gerenciamento de cache em memória
 */
export class CacheManager {
  /**
   * @param {number} defaultTtl - Tempo de vida padrão em minutos para itens do cache
   */
  constructor(defaultTtl = 5) {
    this.cache = new Map();
    this.defaultTtl = defaultTtl * 60 * 1000; // Converter para milissegundos

    // Iniciar limpeza periódica do cache
    this._startCleanupInterval();
  }

  /**
   * Armazena um valor no cache
   * @param {string} key - Chave para identificar o item
   * @param {any} value - Valor a ser armazenado
   * @param {number} ttl - Tempo de vida em minutos (opcional)
   */
  set(key, value, ttl) {
    if (!key) return;

    const ttlMs = ttl !== undefined ? ttl * 60 * 1000 : this.defaultTtl;

    // Calcular timestamp de expiração
    const expiry = Date.now() + ttlMs;

    // Armazenar no cache com metadados
    this.cache.set(key, {
      value,
      expiry,
      createdAt: Date.now(),
    });
  }

  /**
   * Recupera um valor do cache
   * @param {string} key - Chave do item a ser recuperado
   * @param {boolean} ignoreExpiry - Se deve retornar mesmo expirado
   * @returns {any} - Valor recuperado ou undefined se não encontrado/expirado
   */
  get(key, ignoreExpiry = false) {
    if (!key || !this.cache.has(key)) return undefined;

    const item = this.cache.get(key);

    // Verificar se expirou
    if (!ignoreExpiry && item.expiry < Date.now()) {
      this.delete(key);
      return undefined;
    }

    return item.value;
  }

  /**
   * Remove um item do cache
   * @param {string} key - Chave do item a ser removido
   * @returns {boolean} - Se a remoção foi bem-sucedida
   */
  delete(key) {
    return this.cache.delete(key);
  }

  /**
   * Limpa todo o cache
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Verifica se uma chave existe no cache e não está expirada
   * @param {string} key - Chave a verificar
   * @returns {boolean} - Se a chave existe e está válida
   */
  has(key) {
    if (!key || !this.cache.has(key)) return false;

    const item = this.cache.get(key);
    if (item.expiry < Date.now()) {
      this.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Retorna estatísticas do cache
   * @returns {Object} - Estatísticas do cache
   */
  getStats() {
    let validItems = 0;
    let expiredItems = 0;
    const now = Date.now();

    this.cache.forEach((item) => {
      if (item.expiry >= now) {
        validItems++;
      } else {
        expiredItems++;
      }
    });

    return {
      totalItems: this.cache.size,
      validItems,
      expiredItems,
      hitRate: this._hitRate,
      missRate: this._missRate,
      memoryUsage: this._estimateMemoryUsage(),
    };
  }

  /**
   * Recupera ou adiciona um item ao cache
   * @param {string} key - Chave do item
   * @param {Function} fetchCallback - Função para buscar o valor caso não esteja em cache
   * @param {number} ttl - Tempo de vida em minutos (opcional)
   * @returns {Promise<any>} - Valor recuperado ou buscado
   */
  async getOrSet(key, fetchCallback, ttl) {
    // Primeiro, tentar obter do cache
    const cachedValue = this.get(key);

    // Se existir no cache, retornar imediatamente
    if (cachedValue !== undefined) {
      this._recordHit();
      return cachedValue;
    }

    this._recordMiss();

    try {
      // Não existe no cache, executar callback para buscar
      const value = await fetchCallback();

      // Armazenar no cache
      this.set(key, value, ttl);

      return value;
    } catch (error) {
      console.error(`Erro ao buscar valor para cache (${key}):`, error);
      throw error; // Re-lançar erro para tratamento externo
    }
  }

  /**
   * Extende o tempo de vida de um item
   * @param {string} key - Chave do item
   * @param {number} additionalTtl - Tempo adicional em minutos
   * @returns {boolean} - Se a extensão foi bem-sucedida
   */
  extendTtl(key, additionalTtl = 5) {
    if (!key || !this.cache.has(key)) return false;

    const item = this.cache.get(key);
    const additionalMs = additionalTtl * 60 * 1000;

    // Extender a expiração
    item.expiry = Date.now() + additionalMs;

    return true;
  }

  /**
   * Inicia o intervalo de limpeza automática
   * @private
   */
  _startCleanupInterval() {
    // Limpar itens expirados a cada 5 minutos
    this._cleanupInterval = setInterval(() => {
      this._cleanExpiredItems();
    }, 5 * 60 * 1000);

    // Garantir que o intervalo não impede que o programa seja encerrado
    if (
      this._cleanupInterval &&
      typeof this._cleanupInterval.unref === 'function'
    ) {
      this._cleanupInterval.unref();
    }
  }

  /**
   * Para o intervalo de limpeza automática
   */
  stopCleanupInterval() {
    if (this._cleanupInterval) {
      clearInterval(this._cleanupInterval);
      this._cleanupInterval = null;
    }
  }

  /**
   * Limpa itens expirados do cache
   * @private
   */
  _cleanExpiredItems() {
    const now = Date.now();
    let removedCount = 0;

    for (const [key, item] of this.cache.entries()) {
      if (item.expiry < now) {
        this.cache.delete(key);
        removedCount++;
      }
    }

    if (removedCount > 0 && typeof console !== 'undefined') {
      console.log(`Cache: ${removedCount} itens expirados removidos`);
    }
  }

  /**
   * Registra um hit no cache para estatísticas
   * @private
   */
  _recordHit() {
    this._hits = (this._hits || 0) + 1;
    this._calculateRates();
  }

  /**
   * Registra um miss no cache para estatísticas
   * @private
   */
  _recordMiss() {
    this._misses = (this._misses || 0) + 1;
    this._calculateRates();
  }

  /**
   * Calcula as taxas de acerto/erro
   * @private
   */
  _calculateRates() {
    const total = (this._hits || 0) + (this._misses || 0);
    this._hitRate = total ? this._hits / total : 0;
    this._missRate = total ? this._misses / total : 0;
  }

  /**
   * Estima o uso de memória do cache (aproximado)
   * @returns {number} - Uso estimado em bytes
   * @private
   */
  _estimateMemoryUsage() {
    let totalSize = 0;

    // Para cada entrada no cache
    for (const [key, item] of this.cache.entries()) {
      // Tamanho da chave (string)
      totalSize += key.length * 2; // Aproximadamente 2 bytes por caractere

      // Tamanho dos metadados fixos (expiry, createdAt)
      totalSize += 16; // 2 timestamps (8 bytes cada)

      // Estimar tamanho do valor
      totalSize += this._estimateObjectSize(item.value);
    }

    return totalSize;
  }

  /**
   * Estima o tamanho de um objeto em bytes (aproximado)
   * @param {any} obj - Objeto a ser medido
   * @returns {number} - Tamanho estimado em bytes
   * @private
   */
  _estimateObjectSize(obj) {
    if (obj === null || obj === undefined) return 4;

    const type = typeof obj;

    switch (type) {
      case 'boolean':
        return 4;
      case 'number':
        return 8;
      case 'string':
        return obj.length * 2;
      case 'object':
        // Arrays
        if (Array.isArray(obj)) {
          return obj.reduce(
            (size, item) => size + this._estimateObjectSize(item),
            0
          );
        }

        // Objeto comum
        let size = 0;
        for (const key in obj) {
          if (obj.hasOwnProperty(key)) {
            size += key.length * 2; // Tamanho da chave
            size += this._estimateObjectSize(obj[key]); // Tamanho do valor
          }
        }
        return size;
      default:
        return 8; // Valor padrão para outros tipos
    }
  }
}
