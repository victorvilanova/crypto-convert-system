/**
 * Configurações do sistema de conversão de criptomoedas
 * Este módulo centraliza todas as configurações e permite personalização
 */

// Configurações padrão
const DEFAULT_CONFIG = {
  // API e requisições
  api: {
    baseUrl: 'https://api.coingecko.com/api/v3',
    timeout: 10000, // 10 segundos
    retries: 3,
    retryDelay: 1000, // 1 segundo
    useCache: true,
    cacheTTL: 5 * 60 * 1000, // 5 minutos em ms
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  },
  
  // Interface e exibição
  ui: {
    theme: 'light', // 'light' ou 'dark'
    defaultCurrency: 'USD',
    refreshInterval: 60 * 1000, // 1 minuto em ms
    decimalPlaces: 2,
    showGraph: true,
    graphPeriod: '7d', // '24h', '7d', '30d', '1y'
    defaultFavorites: ['bitcoin', 'ethereum', 'solana', 'cardano']
  },
  
  // Autenticação e usuário
  auth: {
    tokenStorageKey: 'fastcripto_auth_token',
    userStorageKey: 'fastcripto_user',
    sessionTimeout: 24 * 60 * 60 * 1000, // 24 horas em ms
    rememberMe: true
  },
  
  // Localização e internacionalização
  locale: {
    defaultLanguage: 'pt-BR',
    availableLanguages: ['pt-BR', 'en-US', 'es-ES'],
    fallbackLanguage: 'en-US',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm',
    timezone: 'auto' // 'auto' ou específico como 'America/Sao_Paulo'
  },
  
  // Notificações e alertas
  notifications: {
    enabled: true,
    position: 'top-right', // 'top-right', 'top-left', 'bottom-right', 'bottom-left'
    duration: 5000, // 5 segundos
    maxVisible: 5,
    sounds: true,
    alerts: {
      priceChange: {
        enabled: true,
        threshold: 5 // porcentagem
      }
    }
  },
  
  // Performance e armazenamento
  storage: {
    preferredStorage: 'localStorage', // 'localStorage', 'sessionStorage', 'memory'
    maxCacheSize: 50 * 1024 * 1024, // 50MB
    purgeOldDataAfter: 30 * 24 * 60 * 60 * 1000 // 30 dias em ms
  },
  
  // Funcionalidades avançadas
  features: {
    enablePortfolio: true,
    enableAlerts: true,
    enableExchange: false,
    enableNewsFeeds: true,
    darkMode: true,
    betaFeatures: false
  },
  
  // Opções para desenvolvedores
  dev: {
    debug: false,
    logLevel: 'error', // 'debug', 'info', 'warn', 'error'
    mockApi: false,
    showPerformanceMetrics: false
  }
};

/**
 * Classe para gerenciar configurações do sistema
 */
class ConfigManager {
  constructor(initialConfig = {}) {
    this._config = this._mergeConfigs(DEFAULT_CONFIG, initialConfig);
    this._listeners = [];
    this._loadFromStorage();
  }
  
  /**
   * Combina recursivamente configurações
   * @private
   * @param {Object} defaultConfig - Configuração padrão
   * @param {Object} userConfig - Configuração personalizada
   * @returns {Object} - Configuração combinada
   */
  _mergeConfigs(defaultConfig, userConfig) {
    const result = { ...defaultConfig };
    
    for (const key in userConfig) {
      if (userConfig.hasOwnProperty(key)) {
        if (
          typeof userConfig[key] === 'object' && 
          userConfig[key] !== null &&
          typeof defaultConfig[key] === 'object' &&
          defaultConfig[key] !== null &&
          !Array.isArray(userConfig[key]) &&
          !Array.isArray(defaultConfig[key])
        ) {
          result[key] = this._mergeConfigs(defaultConfig[key], userConfig[key]);
        } else {
          result[key] = userConfig[key];
        }
      }
    }
    
    return result;
  }
  
  /**
   * Carrega configurações do armazenamento local
   * @private
   */
  _loadFromStorage() {
    try {
      const storageKey = 'fastcripto_config';
      const storedConfig = localStorage.getItem(storageKey);
      
      if (storedConfig) {
        const parsedConfig = JSON.parse(storedConfig);
        this._config = this._mergeConfigs(this._config, parsedConfig);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações do armazenamento:', error);
    }
  }
  
  /**
   * Salva configurações no armazenamento local
   * @private
   */
  _saveToStorage() {
    try {
      const storageKey = 'fastcripto_config';
      localStorage.setItem(storageKey, JSON.stringify(this._config));
    } catch (error) {
      console.error('Erro ao salvar configurações no armazenamento:', error);
    }
  }
  
  /**
   * Obtém uma configuração pelo caminho
   * @param {string} path - Caminho da configuração (ex: 'api.timeout')
   * @param {*} defaultValue - Valor padrão se não encontrado
   * @returns {*} - Valor da configuração
   */
  get(path, defaultValue = null) {
    try {
      const parts = path.split('.');
      let current = this._config;
      
      for (const part of parts) {
        if (current === undefined || current === null) {
          return defaultValue;
        }
        current = current[part];
      }
      
      return current !== undefined ? current : defaultValue;
    } catch (error) {
      console.error(`Erro ao obter configuração '${path}':`, error);
      return defaultValue;
    }
  }
  
  /**
   * Define uma configuração pelo caminho
   * @param {string} path - Caminho da configuração (ex: 'api.timeout')
   * @param {*} value - Novo valor
   * @returns {boolean} - Verdadeiro se definido com sucesso
   */
  set(path, value) {
    try {
      const parts = path.split('.');
      let current = this._config;
      
      // Navegar até o penúltimo nível
      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        
        if (!current[part] || typeof current[part] !== 'object') {
          current[part] = {};
        }
        
        current = current[part];
      }
      
      // Definir o valor
      const lastPart = parts[parts.length - 1];
      const oldValue = current[lastPart];
      current[lastPart] = value;
      
      // Notificar listeners
      if (oldValue !== value) {
        this._notifyListeners(path, value, oldValue);
      }
      
      // Salvar no armazenamento
      this._saveToStorage();
      
      return true;
    } catch (error) {
      console.error(`Erro ao definir configuração '${path}':`, error);
      return false;
    }
  }
  
  /**
   * Restaura as configurações padrão
   * @param {string} [section] - Seção específica para restaurar (opcional)
   * @returns {boolean} - Verdadeiro se restaurado com sucesso
   */
  resetToDefaults(section = null) {
    try {
      if (section) {
        if (DEFAULT_CONFIG[section]) {
          this._config[section] = JSON.parse(JSON.stringify(DEFAULT_CONFIG[section]));
          this._notifyListeners(section, this._config[section], null);
        } else {
          return false;
        }
      } else {
        this._config = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
        this._notifyListeners('*', this._config, null);
      }
      
      this._saveToStorage();
      return true;
    } catch (error) {
      console.error(`Erro ao restaurar configurações padrão:`, error);
      return false;
    }
  }
  
  /**
   * Substitui todas as configurações
   * @param {Object} newConfig - Novas configurações
   * @returns {boolean} - Verdadeiro se definido com sucesso
   */
  setAll(newConfig) {
    try {
      const oldConfig = { ...this._config };
      this._config = this._mergeConfigs(DEFAULT_CONFIG, newConfig);
      
      this._notifyListeners('*', this._config, oldConfig);
      this._saveToStorage();
      
      return true;
    } catch (error) {
      console.error(`Erro ao definir todas as configurações:`, error);
      return false;
    }
  }
  
  /**
   * Obtém todas as configurações
   * @returns {Object} - Todas as configurações
   */
  getAll() {
    return JSON.parse(JSON.stringify(this._config));
  }
  
  /**
   * Adiciona um listener para mudanças de configuração
   * @param {Function} callback - Função callback(path, newValue, oldValue)
   * @param {string} [path] - Caminho específico para observar (opcional)
   * @returns {string} - ID do listener para remoção posterior
   */
  addListener(callback, path = '*') {
    const id = Date.now().toString(36) + Math.random().toString(36).substr(2);
    this._listeners.push({ id, callback, path });
    return id;
  }
  
  /**
   * Remove um listener
   * @param {string} id - ID do listener
   * @returns {boolean} - Verdadeiro se removido com sucesso
   */
  removeListener(id) {
    const index = this._listeners.findIndex(listener => listener.id === id);
    
    if (index !== -1) {
      this._listeners.splice(index, 1);
      return true;
    }
    
    return false;
  }
  
  /**
   * Notifica todos os listeners sobre mudanças
   * @private
   * @param {string} path - Caminho que foi alterado
   * @param {*} newValue - Novo valor
   * @param {*} oldValue - Valor antigo
   */
  _notifyListeners(path, newValue, oldValue) {
    this._listeners.forEach(listener => {
      try {
        if (listener.path === '*' || path === listener.path || path.startsWith(listener.path + '.')) {
          listener.callback(path, newValue, oldValue);
        }
      } catch (error) {
        console.error('Erro ao executar listener de configuração:', error);
      }
    });
  }
  
  /**
   * Importa configurações de um objeto JSON
   * @param {string|Object} json - String JSON ou objeto
   * @returns {boolean} - Verdadeiro se importado com sucesso
   */
  importFromJson(json) {
    try {
      let config = json;
      
      if (typeof json === 'string') {
        config = JSON.parse(json);
      }
      
      return this.setAll(config);
    } catch (error) {
      console.error('Erro ao importar configurações:', error);
      return false;
    }
  }
  
  /**
   * Exporta configurações para JSON
   * @param {boolean} [pretty=false] - Formatar JSON com indentação
   * @returns {string} - String JSON
   */
  exportToJson(pretty = false) {
    try {
      return JSON.stringify(this._config, null, pretty ? 2 : 0);
    } catch (error) {
      console.error('Erro ao exportar configurações:', error);
      return '{}';
    }
  }
}

// Criar instância padrão
const config = new ConfigManager();

export { ConfigManager };
export default config;