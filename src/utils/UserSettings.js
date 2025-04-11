/**
 * Classe para gerenciamento de configurações do usuário
 */
export class UserSettings {
  /**
   * @param {Object} options - Opções de configuração
   * @param {string} options.storageKey - Chave para armazenamento no localStorage
   * @param {Object} options.defaultSettings - Configurações padrão
   */
  constructor(options = {}) {
    const {
      storageKey = 'crypto_converter_settings',
      defaultSettings = {
        theme: 'light',
        defaultCurrency: 'BRL',
        defaultCrypto: 'BTC',
        locale: 'pt-BR',
        decimalPlaces: {
          fiat: 2,
          crypto: 6,
        },
        showSymbols: true,
        saveHistory: true,
        maxHistoryItems: 50,
        refreshRatesInterval: 60, // Em segundos
        favoriteCoins: ['BTC', 'ETH', 'USDT'],
        chartSettings: {
          defaultPeriod: '1W',
          showVolume: true,
          defaultType: 'line',
        },
        notifications: {
          enabled: true,
          priceAlerts: true,
          newsAlerts: false,
          useSystemNotifications: false,
        },
        displayMode: 'detailed', // 'detailed' ou 'compact'
        developerMode: false,
      },
    } = options;

    this.storageKey = storageKey;
    this.defaultSettings = defaultSettings;
    this.settings = { ...defaultSettings };
    this.subscribers = new Map();
    this.nextSubscriberId = 1;

    // Carregar configurações do localStorage
    this._loadSettings();

    // Configurar evento de sincronização entre abas
    if (typeof window !== 'undefined' && window.addEventListener) {
      window.addEventListener('storage', this._handleStorageEvent.bind(this));
    }
  }

  /**
   * Obtém todas as configurações
   * @returns {Object} - Configurações atuais
   */
  getAll() {
    return { ...this.settings };
  }

  /**
   * Obtém uma configuração específica
   * @param {string} key - Chave da configuração
   * @param {any} defaultValue - Valor padrão caso não encontre
   * @returns {any} - Valor da configuração
   */
  get(key, defaultValue) {
    return this._getNestedValue(this.settings, key, defaultValue);
  }

  /**
   * Define uma configuração
   * @param {string} key - Chave da configuração
   * @param {any} value - Valor a ser definido
   * @returns {boolean} - Se a operação foi bem-sucedida
   */
  set(key, value) {
    const oldSettings = { ...this.settings };

    // Definir o valor na estrutura aninhada
    this._setNestedValue(this.settings, key, value);

    // Salvar no localStorage
    this._saveSettings();

    // Notificar assinantes
    this._notifySubscribers(key, value, oldSettings);

    return true;
  }

  /**
   * Define múltiplas configurações de uma vez
   * @param {Object} settingsObject - Objeto com as configurações
   * @returns {boolean} - Se a operação foi bem-sucedida
   */
  setMultiple(settingsObject) {
    if (!settingsObject || typeof settingsObject !== 'object') {
      return false;
    }

    const oldSettings = { ...this.settings };
    let changed = false;

    // Atualizar cada configuração
    for (const [key, value] of Object.entries(settingsObject)) {
      if (this._setNestedValue(this.settings, key, value)) {
        changed = true;
      }
    }

    if (changed) {
      // Salvar no localStorage
      this._saveSettings();

      // Notificar assinantes
      this._notifySubscribers('multiple', settingsObject, oldSettings);
    }

    return changed;
  }

  /**
   * Reseta todas as configurações para os valores padrão
   * @returns {boolean} - Se a operação foi bem-sucedida
   */
  resetToDefaults() {
    const oldSettings = { ...this.settings };

    // Redefinir para os valores padrão
    this.settings = { ...this.defaultSettings };

    // Salvar no localStorage
    this._saveSettings();

    // Notificar assinantes
    this._notifySubscribers('reset', this.settings, oldSettings);

    return true;
  }

  /**
   * Assina mudanças em configurações
   * @param {Function} callback - Função a ser chamada quando houver mudanças
   * @param {string|string[]} keys - Chave(s) específica(s) para assinar, ou undefined para todas
   * @returns {number} - ID da assinatura
   */
  subscribe(callback, keys) {
    if (typeof callback !== 'function') {
      throw new Error('O callback deve ser uma função');
    }

    const id = this.nextSubscriberId++;

    this.subscribers.set(id, {
      callback,
      keys: keys ? (Array.isArray(keys) ? keys : [keys]) : null,
    });

    return id;
  }

  /**
   * Cancela uma assinatura
   * @param {number} id - ID da assinatura
   * @returns {boolean} - Se a operação foi bem-sucedida
   */
  unsubscribe(id) {
    return this.subscribers.delete(id);
  }

  /**
   * Exporta as configurações como JSON
   * @returns {string} - Configurações em formato JSON
   */
  exportToJSON() {
    return JSON.stringify(this.settings, null, 2);
  }

  /**
   * Importa configurações de um JSON
   * @param {string} json - JSON com as configurações
   * @returns {boolean} - Se a importação foi bem-sucedida
   */
  importFromJSON(json) {
    try {
      const parsedSettings = JSON.parse(json);

      if (!parsedSettings || typeof parsedSettings !== 'object') {
        throw new Error('Formato de configurações inválido');
      }

      return this.setMultiple(parsedSettings);
    } catch (error) {
      console.error('Erro ao importar configurações:', error);
      return false;
    }
  }

  /**
   * Carrega configurações do localStorage
   * @private
   */
  _loadSettings() {
    try {
      if (typeof localStorage === 'undefined') {
        return;
      }

      const storedSettings = localStorage.getItem(this.storageKey);

      if (storedSettings) {
        const parsedSettings = JSON.parse(storedSettings);

        // Mesclar com as configurações padrão para garantir que novas configurações sejam incluídas
        this.settings = this._deepMerge(this.defaultSettings, parsedSettings);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      // Em caso de erro, usar as configurações padrão
      this.settings = { ...this.defaultSettings };
    }
  }

  /**
   * Salva configurações no localStorage
   * @private
   */
  _saveSettings() {
    try {
      if (typeof localStorage === 'undefined') {
        return;
      }

      localStorage.setItem(this.storageKey, JSON.stringify(this.settings));
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
    }
  }

  /**
   * Manipula eventos de alteração no localStorage
   * @param {StorageEvent} event - Evento de storage
   * @private
   */
  _handleStorageEvent(event) {
    if (event.key === this.storageKey) {
      const oldSettings = { ...this.settings };

      try {
        if (event.newValue) {
          // Atualizar configurações da memória
          this.settings = JSON.parse(event.newValue);
        } else {
          // Se o valor foi removido, usar padrões
          this.settings = { ...this.defaultSettings };
        }

        // Notificar assinantes
        this._notifySubscribers('storage', this.settings, oldSettings);
      } catch (error) {
        console.error('Erro ao processar mudanças de outra aba:', error);
      }
    }
  }

  /**
   * Notifica os assinantes sobre mudanças
   * @param {string} key - Chave que foi alterada
   * @param {any} newValue - Novo valor
   * @param {Object} oldSettings - Configurações antigas
   * @private
   */
  _notifySubscribers(key, newValue, oldSettings) {
    this.subscribers.forEach(({ callback, keys }) => {
      // Verificar se o assinante está interessado nesta chave
      if (
        !keys ||
        keys.some(
          (k) =>
            key === k ||
            key === 'multiple' ||
            key === 'reset' ||
            key === 'storage'
        )
      ) {
        try {
          callback({
            key,
            value: newValue,
            oldSettings,
            newSettings: this.settings,
          });
        } catch (error) {
          console.error('Erro ao notificar assinante:', error);
        }
      }
    });
  }

  /**
   * Obtém um valor aninhado de um objeto
   * @param {Object} obj - Objeto a ser pesquisado
   * @param {string} path - Caminho da propriedade (ex: 'theme' ou 'decimalPlaces.fiat')
   * @param {any} defaultValue - Valor padrão se não encontrado
   * @returns {any} - Valor encontrado ou padrão
   * @private
   */
  _getNestedValue(obj, path, defaultValue) {
    if (!path) return defaultValue;

    const keys = path.split('.');
    let result = obj;

    for (const key of keys) {
      if (
        result === undefined ||
        result === null ||
        !Object.prototype.hasOwnProperty.call(result, key)
      ) {
        return defaultValue;
      }
      result = result[key];
    }

    return result;
  }

  /**
   * Define um valor aninhado em um objeto
   * @param {Object} obj - Objeto a ser modificado
   * @param {string} path - Caminho da propriedade (ex: 'theme' ou 'decimalPlaces.fiat')
   * @param {any} value - Valor a ser definido
   * @returns {boolean} - Se a operação modificou o objeto
   * @private
   */
  _setNestedValue(obj, path, value) {
    if (!path) return false;

    const keys = path.split('.');
    const lastKey = keys.pop();
    let current = obj;

    // Navegar até o objeto pai
    for (const key of keys) {
      if (
        current[key] === undefined ||
        current[key] === null ||
        typeof current[key] !== 'object'
      ) {
        current[key] = {};
      }
      current = current[key];
    }

    // Verificar se o valor está realmente mudando
    if (current[lastKey] === value) {
      return false;
    }

    // Definir o valor
    current[lastKey] = value;
    return true;
  }

  /**
   * Mescla profundamente dois objetos
   * @param {Object} target - Objeto alvo
   * @param {Object} source - Objeto fonte
   * @returns {Object} - Objeto mesclado
   * @private
   */
  _deepMerge(target, source) {
    const output = { ...target };

    if (typeof source !== 'object' || source === null) {
      return output;
    }

    Object.keys(source).forEach((key) => {
      if (source[key] instanceof Date) {
        output[key] = new Date(source[key]);
      } else if (Array.isArray(source[key])) {
        output[key] = [...source[key]];
      } else if (typeof source[key] === 'object' && source[key] !== null) {
        if (typeof target[key] === 'object' && target[key] !== null) {
          output[key] = this._deepMerge(target[key], source[key]);
        } else {
          output[key] = { ...source[key] };
        }
      } else {
        output[key] = source[key];
      }
    });

    return output;
  }
}
