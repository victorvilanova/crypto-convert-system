/**
 * Sistema de cache para armazenamento de dados frequentemente acessados
 */

// Configurações padrão
const DEFAULT_TTL = 60 * 60 * 1000; // 1 hora em milissegundos
const STORAGE_PREFIX = 'fastcripto_cache_';

/**
 * Classe para gerenciamento de cache com suporte a TTL (time-to-live)
 */
class CacheManager {
  constructor(options = {}) {
    this.storage = options.storage || localStorage;
    this.prefix = options.prefix || STORAGE_PREFIX;
    this.defaultTTL = options.defaultTTL || DEFAULT_TTL;
    
    // Iniciar limpeza de itens expirados
    this._setupCleanupInterval(options.cleanupInterval);
  }
  
  /**
   * Configura um intervalo para limpeza automática de itens expirados
   * @private
   * @param {number} interval - Intervalo em milissegundos
   */
  _setupCleanupInterval(interval = 30 * 60 * 1000) { // 30 minutos padrão
    // Limpar itens expirados inicialmente
    this.clearExpired();
    
    // Configurar intervalo para limpeza periódica
    setInterval(() => {
      this.clearExpired();
    }, interval);
  }
  
  /**
   * Obtém uma chave formatada com o prefixo
   * @private
   * @param {string} key - Chave original
   * @returns {string} - Chave formatada
   */
  _getKey(key) {
    return `${this.prefix}${key}`;
  }
  
  /**
   * Armazena um item no cache
   * @param {string} key - Chave para o item
   * @param {*} data - Dados a serem armazenados
   * @param {Object} options - Opções de armazenamento
   * @param {number} options.ttl - Tempo de vida em milissegundos
   * @returns {boolean} - Verdadeiro se foi armazenado com sucesso
   */
  set(key, data, options = {}) {
    try {
      const cacheKey = this._getKey(key);
      const ttl = options.ttl || this.defaultTTL;
      
      const item = {
        data,
        expires: ttl ? Date.now() + ttl : null,
        created: Date.now()
      };
      
      this.storage.setItem(cacheKey, JSON.stringify(item));
      return true;
    } catch (error) {
      console.error('Erro ao armazenar item no cache:', error);
      return false;
    }
  }
  
  /**
   * Recupera um item do cache
   * @param {string} key - Chave do item
   * @param {*} defaultValue - Valor padrão se o item não existir ou estiver expirado
   * @returns {*} - Dados armazenados ou valor padrão
   */
  get(key, defaultValue = null) {
    try {
      const cacheKey = this._getKey(key);
      const rawItem = this.storage.getItem(cacheKey);
      
      if (!rawItem) {
        return defaultValue;
      }
      
      const item = JSON.parse(rawItem);
      
      // Verificar se o item expirou
      if (item.expires && item.expires < Date.now()) {
        this.remove(key);
        return defaultValue;
      }
      
      return item.data;
    } catch (error) {
      console.error('Erro ao recuperar item do cache:', error);
      return defaultValue;
    }
  }
  
  /**
   * Remove um item do cache
   * @param {string} key - Chave do item
   * @returns {boolean} - Verdadeiro se foi removido com sucesso
   */
  remove(key) {
    try {
      const cacheKey = this._getKey(key);
      this.storage.removeItem(cacheKey);
      return true;
    } catch (error) {
      console.error('Erro ao remover item do cache:', error);
      return false;
    }
  }
  
  /**
   * Verifica se um item existe no cache e não está expirado
   * @param {string} key - Chave do item
   * @returns {boolean} - Verdadeiro se o item existir e estiver válido
   */
  has(key) {
    try {
      const cacheKey = this._getKey(key);
      const rawItem = this.storage.getItem(cacheKey);
      
      if (!rawItem) {
        return false;
      }
      
      const item = JSON.parse(rawItem);
      
      // Verificar se o item expirou
      if (item.expires && item.expires < Date.now()) {
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Erro ao verificar item no cache:', error);
      return false;
    }
  }
  
  /**
   * Limpa todos os itens do cache que correspondem ao prefixo
   * @returns {boolean} - Verdadeiro se a limpeza foi bem-sucedida
   */
  clear() {
    try {
      // Obter todas as chaves do armazenamento
      const keys = [];
      
      for (let i = 0; i < this.storage.length; i++) {
        const key = this.storage.key(i);
        if (key.startsWith(this.prefix)) {
          keys.push(key);
        }
      }
      
      // Remover cada item
      keys.forEach(key => {
        this.storage.removeItem(key);
      });
      
      return true;
    } catch (error) {
      console.error('Erro ao limpar cache:', error);
      return false;
    }
  }
  
  /**
   * Remove todos os itens expirados do cache
   * @returns {number} - Número de itens removidos
   */
  clearExpired() {
    try {
      let removedCount = 0;
      const now = Date.now();
      
      // Obter todas as chaves do armazenamento
      const keys = [];
      
      for (let i = 0; i < this.storage.length; i++) {
        const key = this.storage.key(i);
        if (key.startsWith(this.prefix)) {
          keys.push(key);
        }
      }
      
      // Verificar cada item
      keys.forEach(key => {
        try {
          const rawItem = this.storage.getItem(key);
          if (rawItem) {
            const item = JSON.parse(rawItem);
            
            // Remover se expirou
            if (item.expires && item.expires < now) {
              this.storage.removeItem(key);
              removedCount++;
            }
          }
        } catch (e) {
          // Ignorar erros em itens individuais
        }
      });
      
      return removedCount;
    } catch (error) {
      console.error('Erro ao limpar itens expirados:', error);
      return 0;
    }
  }
  
  /**
   * Obtém informações sobre o cache
   * @returns {Object} - Estatísticas do cache
   */
  getStats() {
    try {
      let totalItems = 0;
      let expiredItems = 0;
      let oldestItem = null;
      let newestItem = null;
      let totalSize = 0;
      const now = Date.now();
      
      // Obter todas as chaves do armazenamento
      const keys = [];
      
      for (let i = 0; i < this.storage.length; i++) {
        const key = this.storage.key(i);
        if (key.startsWith(this.prefix)) {
          keys.push(key);
        }
      }
      
      // Analisar cada item
      keys.forEach(key => {
        try {
          const rawItem = this.storage.getItem(key);
          if (rawItem) {
            totalSize += rawItem.length;
            totalItems++;
            
            const item = JSON.parse(rawItem);
            
            // Contar expirados
            if (item.expires && item.expires < now) {
              expiredItems++;
            }
            
            // Verificar item mais antigo
            if (!oldestItem || item.created < oldestItem) {
              oldestItem = item.created;
            }
            
            // Verificar item mais recente
            if (!newestItem || item.created > newestItem) {
              newestItem = item.created;
            }
          }
        } catch (e) {
          // Ignorar erros em itens individuais
        }
      });
      
      return {
        totalItems,
        validItems: totalItems - expiredItems,
        expiredItems,
        oldestItemAge: oldestItem ? Math.floor((now - oldestItem) / 1000) : null,
        newestItemAge: newestItem ? Math.floor((now - newestItem) / 1000) : null,
        totalSizeBytes: totalSize,
        totalSizeKB: Math.round(totalSize / 1024 * 100) / 100
      };
    } catch (error) {
      console.error('Erro ao calcular estatísticas do cache:', error);
      return {
        error: true,
        message: error.message
      };
    }
  }
  
  /**
   * Atualiza o tempo de expiração de um item
   * @param {string} key - Chave do item
   * @param {number} ttl - Novo tempo de vida em milissegundos
   * @returns {boolean} - Verdadeiro se atualizado com sucesso
   */
  touch(key, ttl = null) {
    try {
      const cacheKey = this._getKey(key);
      const rawItem = this.storage.getItem(cacheKey);
      
      if (!rawItem) {
        return false;
      }
      
      const item = JSON.parse(rawItem);
      
      // Atualizar tempo de expiração
      item.expires = ttl ? Date.now() + ttl : (ttl === null ? item.expires : null);
      
      // Salvar item atualizado
      this.storage.setItem(cacheKey, JSON.stringify(item));
      
      return true;
    } catch (error) {
      console.error('Erro ao atualizar expiração do item:', error);
      return false;
    }
  }
}

/**
 * Versão do cache para uso em memória (não persistente)
 */
class MemoryCache extends CacheManager {
  constructor(options = {}) {
    // Usar um objeto simples como armazenamento
    const memoryStorage = {
      _data: {},
      
      getItem(key) {
        return this._data[key] || null;
      },
      
      setItem(key, value) {
        this._data[key] = value;
      },
      
      removeItem(key) {
        delete this._data[key];
      },
      
      clear() {
        this._data = {};
      },
      
      get length() {
        return Object.keys(this._data).length;
      },
      
      key(index) {
        return Object.keys(this._data)[index] || null;
      }
    };
    
    super({ ...options, storage: memoryStorage });
  }
}

/**
 * Função para criar um decorador de cache para funções
 * @param {CacheManager} cacheInstance - Instância do gerenciador de cache
 * @param {Object} options - Opções de configuração
 * @returns {Function} - Função decoradora
 */
function createCacheDecorator(cacheInstance, options = {}) {
  return function cachify(fn, cacheOptions = {}) {
    const ttl = cacheOptions.ttl || options.ttl;
    const keyPrefix = cacheOptions.keyPrefix || fn.name;
    
    return async function(...args) {
      // Gerar chave de cache baseada nos argumentos
      const keyArgs = JSON.stringify(args);
      const cacheKey = `${keyPrefix}_${keyArgs}`;
      
      // Verificar se existe no cache
      if (cacheInstance.has(cacheKey)) {
        return cacheInstance.get(cacheKey);
      }
      
      // Executar função original
      const result = await fn.apply(this, args);
      
      // Armazenar resultado no cache
      cacheInstance.set(cacheKey, result, { ttl });
      
      return result;
    };
  };
}

// Instância padrão usando localStorage
const defaultCache = new CacheManager();

// Instância em memória
const memoryCache = new MemoryCache();

// Função auxiliar para criar um cache decorador
const cachify = createCacheDecorator(defaultCache);

// Exportar tudo
export {
  CacheManager,
  MemoryCache,
  createCacheDecorator,
  cachify,
  defaultCache,
  memoryCache
};

export default defaultCache;
