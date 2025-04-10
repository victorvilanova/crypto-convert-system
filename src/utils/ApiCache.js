import { STORAGE_KEYS } from '../constants.js';

/**
 * Utilitário para gerenciar cache de requisições de API
 */
export class ApiCache {
  /**
   * @param {Object} options - Opções de configuração
   * @param {string} [options.storagePrefix] - Prefixo para chaves de armazenamento
   * @param {boolean} [options.useLocalStorage] - Se deve usar localStorage
   * @param {number} [options.defaultTtl] - Tempo de vida padrão para itens em cache (ms)
   */
  constructor({ storagePrefix, useLocalStorage = true, defaultTtl = 300000 } = {}) {
    this.storagePrefix = storagePrefix || STORAGE_KEYS.CACHE;
    this.useLocalStorage = useLocalStorage;
    this.defaultTtl = defaultTtl;
    
    // Cache em memória para acesso rápido
    this.memoryCache = new Map();
    
    // Carregar cache existente do localStorage
    if (this.useLocalStorage) {
      this.loadCacheFromStorage();
    }
  }

  /**
   * Gera uma chave de cache prefixada
   * @param {string} key - Chave base
   * @returns {string} Chave completa para armazenamento
   * @private
   */
  getCacheKey(key) {
    return `${this.storagePrefix}_${key}`;
  }

  /**
   * Adiciona um item ao cache
   * @param {string} key - Chave do item
   * @param {any} data - Dados a serem armazenados
   * @param {number} [ttl] - Tempo de vida em milissegundos (opcional)
   */
  set(key, data, ttl) {
    if (!key) return;
    
    const expiresAt = Date.now() + (ttl || this.defaultTtl);
    
    const cacheItem = {
      data,
      expiresAt
    };
    
    // Adicionar ao cache em memória
    this.memoryCache.set(key, cacheItem);
    
    // Adicionar ao localStorage se habilitado
    if (this.useLocalStorage) {
      try {
        localStorage.setItem(
          this.getCacheKey(key),
          JSON.stringify(cacheItem)
        );
      } catch (e) {
        console.warn('Erro ao armazenar item no cache:', e);
        
        // Se localStorage estiver cheio, tentar limpar itens antigos
        if (e.name === 'QuotaExceededError') {
          this.clearExpiredItems();
        }
      }
    }
  }

  /**
   * Obtém um item do cache
   * @param {string} key - Chave do item
   * @returns {any} Dados armazenados ou null se não encontrado ou expirado
   */
  get(key) {
    if (!key) return null;
    
    // Tentar obter do cache em memória primeiro
    let cacheItem = this.memoryCache.get(key);
    
    // Se não encontrado em memória, tentar localStorage
    if (!cacheItem && this.useLocalStorage) {
      try {
        const storedItem = localStorage.getItem(this.getCacheKey(key));
        if (storedItem) {
          cacheItem = JSON.parse(storedItem);
          
          // Atualizar cache em memória
          this.memoryCache.set(key, cacheItem);
        }
      } catch (e) {
        console.warn('Erro ao ler item do cache:', e);
        return null;
      }
    }
    
    // Se item não encontrado
    if (!cacheItem) {
      return null;
    }
    
    // Verificar se expirou
    if (cacheItem.expiresAt < Date.now()) {
      this.delete(key);
      return null;
    }
    
    return cacheItem.data;
  }

  /**
   * Remove um item do cache
   * @param {string} key - Chave do item
   */
  delete(key) {
    if (!key) return;
    
    // Remover do cache em memória
    this.memoryCache.delete(key);
    
    // Remover do localStorage
    if (this.useLocalStorage) {
      try {
        localStorage.removeItem(this.getCacheKey(key));
      } catch (e) {
        console.warn('Erro ao remover item do cache:', e);
      }
    }
  }

  /**
   * Verifica se um item existe no cache e não expirou
   * @param {string} key - Chave do item
   * @returns {boolean} Se o item existe e está válido
   */
  has(key) {
    return this.get(key) !== null;
  }

  /**
   * Carrega cache existente do localStorage para memória
   * @private
   */
  loadCacheFromStorage() {
    if (!this.useLocalStorage) return;
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const fullKey = localStorage.key(i);
        
        // Verificar se a chave pertence a este cache
        if (fullKey && fullKey.startsWith(this.storagePrefix)) {
          const key = fullKey.substring(this.storagePrefix.length + 1);
          const storedItem = localStorage.getItem(fullKey);
          
          if (storedItem) {
            try {
              const cacheItem = JSON.parse(storedItem);
              
              // Verificar se ainda é válido
              if (cacheItem.expiresAt > Date.now()) {
                this.memoryCache.set(key, cacheItem);
              } else {
                // Remover item expirado
                localStorage.removeItem(fullKey);
              }
            } catch (e) {
              // Item inválido, remover
              localStorage.removeItem(fullKey);
            }
          }
        }
      }
    } catch (e) {
      console.warn('Erro ao carregar cache do localStorage:', e);
    }
  }

  /**
   * Limpa itens expirados do cache
   * @returns {number} Número de itens removidos
   */
  clearExpiredItems() {
    let removedCount = 0;
    const now = Date.now();
    
    // Limpar da memória
    for (const [key, cacheItem] of this.memoryCache.entries()) {
      if (cacheItem.expiresAt < now) {
        this.memoryCache.delete(key);
        removedCount++;
      }
    }
    
    // Limpar do localStorage
    if (this.useLocalStorage) {
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const fullKey = localStorage.key(i);
          
          if (fullKey && fullKey.startsWith(this.storagePrefix)) {
            try {
              const storedItem = localStorage.getItem(fullKey);
              if (storedItem) {
                const cacheItem = JSON.parse(storedItem);
                
                if (cacheItem.expiresAt < now) {
                  localStorage.removeItem(fullKey);
                  removedCount++;
                }
              }
            } catch (e) {
              // Item inválido, remover
              localStorage.removeItem(fullKey);
              removedCount++;
            }
          }
        }
      } catch (e) {
        console.warn('Erro ao limpar itens expirados:', e);
      }
    }
    
    return removedCount;
  }

  /**
   * Limpa todo o cache
   */
  clear() {
    // Limpar cache em memória
    this.memoryCache.clear();
    
    // Limpar localStorage
    if (this.useLocalStorage) {
      try {
        const keysToRemove = [];
        
        // Encontrar todas as chaves a serem removidas
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(this.storagePrefix)) {
            keysToRemove.push(key);
          }
        }
        
        // Remover as chaves
        keysToRemove.forEach(key => {
          localStorage.removeItem(key);
        });
      } catch (e) {
        console.warn('Erro ao limpar cache:', e);
      }
    }
  }

  /**
   * Retorna o tamanho aproximado do cache em bytes
   * @returns {Object} Informações de tamanho
   */
  getCacheSize() {
    let memorySize = 0;
    let storageSize = 0;
    let itemCount = 0;
    
    // Calcular tamanho em memória
    for (const [key, value] of this.memoryCache.entries()) {
      itemCount++;
      memorySize += this.getApproximateSize(key) + this.getApproximateSize(value);
    }
    
    // Calcular tamanho em localStorage
    if (this.useLocalStorage) {
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(this.storagePrefix)) {
            storageSize += key.length * 2; // Unicode = 2 bytes por caractere
            const item = localStorage.getItem(key);
            storageSize += item ? item.length * 2 : 0;
          }
        }
      } catch (e) {
        console.warn('Erro ao calcular tamanho do cache:', e);
      }
    }
    
    return {
      memorySize,
      storageSize,
      itemCount
    };
  }

  /**
   * Calcula o tamanho aproximado de um objeto em bytes
   * @param {any} object - Objeto a medir
   * @returns {number} Tamanho aproximado em bytes
   * @private
   */
  getApproximateSize(object) {
    if (object === null || object === undefined) {
      return 0;
    }
    
    const type = typeof object;
    
    // Tipos primitivos
    if (type === 'number') return 8;
    if (type === 'boolean') return 4;
    if (type === 'string') return object.length * 2; // Unicode = 2 bytes por caractere
    
    // Para objetos e arrays, converter para string JSON e medir
    if (type === 'object') {
      try {
        const json = JSON.stringify(object);
        return json.length * 2;
      } catch (e) {
        return 0;
      }
    }
    
    return 0;
  }
}