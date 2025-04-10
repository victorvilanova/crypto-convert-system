import { DEFAULTS, STORAGE_KEYS, EVENTS } from '../constants.js';

/**
 * Serviço para gerenciar configurações da aplicação
 */
export class ConfigService {
  constructor() {
    // Configurações padrão
    this.defaultConfig = {
      app: {
        theme: DEFAULTS.THEME,
        autoRefreshRates: true,
        refreshInterval: 300000, // 5 minutos
        decimalPrecision: {
          crypto: DEFAULTS.DECIMAL_PLACES.CRYPTO,
          fiat: DEFAULTS.DECIMAL_PLACES.FIAT
        },
        locale: 'pt-BR'
      },
      api: {
        baseUrl: null,
        timeout: 10000,
        retryAttempts: 3
      },
      features: {
        conversionHistory: true,
        offlineMode: true,
        charts: false,
        notifications: true
      }
    };
    
    // Carregar configurações salvas
    this.config = this.loadConfig();
  }

  /**
   * Carrega as configurações do localStorage
   * @returns {Object} Configurações carregadas
   * @private
   */
  loadConfig() {
    try {
      const savedConfig = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (savedConfig) {
        const parsedConfig = JSON.parse(savedConfig);
        
        // Mesclar com as configurações padrão para garantir que todas as propriedades existam
        return this.mergeConfigs(this.defaultConfig, parsedConfig);
      }
    } catch (e) {
      console.warn('Erro ao carregar configurações:', e);
    }
    
    // Se não conseguir carregar, usar configurações padrão
    return { ...this.defaultConfig };
  }

  /**
   * Mescla objetos de configuração recursivamente
   * @param {Object} defaultConfig - Configuração padrão
   * @param {Object} userConfig - Configuração do usuário
   * @returns {Object} Configuração mesclada
   * @private
   */
  mergeConfigs(defaultConfig, userConfig) {
    const result = { ...defaultConfig };
    
    for (const key in userConfig) {
      // Se ambos os valores forem objetos, mesclar recursivamente
      if (
        userConfig[key] !== null &&
        typeof userConfig[key] === 'object' &&
        key in defaultConfig &&
        defaultConfig[key] !== null &&
        typeof defaultConfig[key] === 'object'
      ) {
        result[key] = this.mergeConfigs(defaultConfig[key], userConfig[key]);
      } else {
        // Caso contrário, usar o valor do usuário se definido
        result[key] = userConfig[key];
      }
    }
    
    return result;
  }

  /**
   * Salva as configurações no localStorage
   * @private
   */
  saveConfig() {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(this.config));
      
      // Notificar sistema sobre mudança nas configurações
      document.dispatchEvent(new CustomEvent(EVENTS.CONFIG_CHANGED, {
        detail: { config: this.config }
      }));
    } catch (e) {
      console.error('Erro ao salvar configurações:', e);
    }
  }

  /**
   * Atualiza uma configuração específica
   * @param {string} section - Seção da configuração (app, api, features)
   * @param {string} key - Chave da configuração
   * @param {any} value - Novo valor
   */
  updateConfig(section, key, value) {
    if (!section || !key || value === undefined) {
      throw new Error('Parâmetros inválidos para atualização de configuração');
    }
    
    if (!this.config[section]) {
      this.config[section] = {};
    }
    
    this.config[section][key] = value;
    this.saveConfig();
  }

  /**
   * Redefine todas as configurações para os valores padrão
   */
  resetConfig() {
    this.config = { ...this.defaultConfig };
    this.saveConfig();
  }

  /**
   * Obtém uma configuração específica
   * @param {string} section - Seção da configuração
   * @param {string} key - Chave da configuração
   * @param {any} defaultValue - Valor padrão caso não exista
   * @returns {any} Valor da configuração
   */
  getConfig(section, key, defaultValue = null) {
    if (!section || !key) {
      return defaultValue;
    }
    
    if (!this.config[section] || this.config[section][key] === undefined) {
      return defaultValue;
    }
    
    return this.config[section][key];
  }

  /**
   * Verifica se um recurso está habilitado
   * @param {string} feature - Nome do recurso
   * @returns {boolean} Se o recurso está habilitado
   */
  isFeatureEnabled(feature) {
    return this.getConfig('features', feature, false);
  }

  /**
   * Obtém o tema atual
   * @returns {string} Tema atual ('light' ou 'dark')
   */
  getTheme() {
    return this.getConfig('app', 'theme', DEFAULTS.THEME);
  }

  /**
   * Verifica se a atualização automática de taxas está habilitada
   * @returns {boolean} Status da atualização automática
   */
  isAutoRefreshEnabled() {
    return this.getConfig('app', 'autoRefreshRates', true);
  }

  /**
   * Obtém o intervalo de atualização de taxas em milissegundos
   * @returns {number} Intervalo em milissegundos
   */
  getRefreshInterval() {
    return this.getConfig('app', 'refreshInterval', 300000);
  }

  /**
   * Obtém a precisão decimal para um tipo de moeda
   * @param {string} type - Tipo de moeda ('crypto' ou 'fiat')
   * @returns {number} Número de casas decimais
   */
  getDecimalPrecision(type = 'fiat') {
    const precision = this.getConfig('app', 'decimalPrecision', {});
    
    if (type === 'crypto') {
      return precision.crypto !== undefined ? precision.crypto : DEFAULTS.DECIMAL_PLACES.CRYPTO;
    }
    
    return precision.fiat !== undefined ? precision.fiat : DEFAULTS.DECIMAL_PLACES.FIAT;
  }

  /**
   * Obtém o locale para formatação de números e datas
   * @returns {string} Código de locale
   */
  getLocale() {
    return this.getConfig('app', 'locale', 'pt-BR');
  }

  /**
   * Obtém um objeto com todas as configurações
   * @returns {Object} Configurações completas
   */
  getAllConfig() {
    return { ...this.config };
  }
}