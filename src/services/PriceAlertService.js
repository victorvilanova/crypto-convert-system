/**
 * Classe para gerenciamento de alertas de preço
 */
import { getLogger } from '../utils/Logger';

// Criar uma instância de logger específica para PriceAlertService
const logger = getLogger('PriceAlertService');

export class PriceAlertService {
  /**
   * @param {Object} options - Opções de configuração
   * @param {string} options.storageKey - Chave para armazenamento no localStorage
   * @param {number} options.checkInterval - Intervalo para verificação de alertas em segundos
   * @param {Function} options.notificationCallback - Função para exibir notificações
   * @param {Function} options.fetchPriceCallback - Função para buscar preços atuais
   */
  constructor(options = {}) {
    const {
      storageKey = 'crypto_converter_price_alerts',
      checkInterval = 60,
      notificationCallback,
      fetchPriceCallback,
    } = options;

    this.storageKey = storageKey;
    this.checkInterval = checkInterval * 1000; // Converter para milissegundos
    this.notificationCallback = notificationCallback;
    this.fetchPriceCallback = fetchPriceCallback;
    this.alerts = [];
    this.checkIntervalId = null;
    this.nextAlertId = 1;
    this.isRunning = false;

    // Carregar alertas do localStorage
    this._loadAlerts();

    // Configurar evento de sincronização entre abas
    if (typeof window !== 'undefined' && window.addEventListener) {
      // Usar uma referência à função bound para facilitar a remoção posterior
      this._boundHandleStorageEvent = this._handleStorageEvent.bind(this);
      window.addEventListener('storage', this._boundHandleStorageEvent);
    }
  }

  /**
   * Inicia o serviço de verificação de alertas
   * @returns {boolean} - Se o serviço foi iniciado com sucesso
   */
  start() {
    if (this.isRunning) return false;

    if (
      !this.fetchPriceCallback ||
      typeof this.fetchPriceCallback !== 'function'
    ) {
      logger.error(
        'fetchPriceCallback é necessário para iniciar o serviço de alertas'
      );
      return false;
    }

    this.isRunning = true;

    // Verificar alertas imediatamente
    this._checkAlerts();

    // Configurar verificação periódica
    this.checkIntervalId = setInterval(() => {
      this._checkAlerts();
    }, this.checkInterval);

    logger.info(
      `Serviço de alertas de preço iniciado. Verificando a cada ${
        this.checkInterval / 1000
      } segundos.`
    );

    return true;
  }

  /**
   * Para o serviço de verificação de alertas
   * @returns {boolean} - Se o serviço foi parado com sucesso
   */
  stop() {
    if (!this.isRunning) return false;

    clearInterval(this.checkIntervalId);
    this.checkIntervalId = null;
    this.isRunning = false;

    logger.info('Serviço de alertas de preço parado.');

    return true;
  }

  /**
   * Cria um novo alerta de preço
   * @param {Object} alert - Configuração do alerta
   * @returns {number} - ID do alerta criado
   */
  createAlert(alert) {
    if (!this._validateAlert(alert)) {
      throw new Error('Configuração de alerta inválida');
    }

    const id = this.nextAlertId++;
    const newAlert = {
      id,
      ...alert,
      created: new Date().toISOString(),
      active: true,
      triggered: false,
      lastTriggered: null,
    };

    this.alerts.push(newAlert);
    this._saveAlerts();

    logger.info(
      `Alerta de preço criado: ${newAlert.crypto} ${newAlert.condition} ${newAlert.price} ${newAlert.targetCurrency}`
    );

    return id;
  }

  /**
   * Atualiza um alerta existente
   * @param {number} id - ID do alerta
   * @param {Object} updates - Atualizações para o alerta
   * @returns {boolean} - Se a atualização foi bem-sucedida
   */
  updateAlert(id, updates) {
    const index = this.alerts.findIndex((alert) => alert.id === id);

    if (index === -1) {
      logger.error(`Alerta com ID ${id} não encontrado`);
      return false;
    }

    const updatedAlert = { ...this.alerts[index], ...updates };

    // Verificar se a atualização mantém o alerta válido
    if (!this._validateAlert(updatedAlert)) {
      logger.error('Atualização inválida para o alerta');
      return false;
    }

    this.alerts[index] = updatedAlert;
    this._saveAlerts();

    return true;
  }

  /**
   * Remove um alerta
   * @param {number} id - ID do alerta
   * @returns {boolean} - Se a remoção foi bem-sucedida
   */
  deleteAlert(id) {
    const initialLength = this.alerts.length;
    this.alerts = this.alerts.filter((alert) => alert.id !== id);

    if (this.alerts.length < initialLength) {
      this._saveAlerts();
      return true;
    }

    return false;
  }

  /**
   * Obtém todos os alertas
   * @param {Object} options - Opções de filtragem
   * @returns {Array} - Lista de alertas
   */
  getAlerts(options = {}) {
    const {
      activeOnly = false,
      cryptocurrency = null,
      sortBy = 'created',
      sortOrder = 'desc',
    } = options;

    let filtered = [...this.alerts];

    // Filtrar apenas ativos se solicitado
    if (activeOnly) {
      filtered = filtered.filter((alert) => alert.active);
    }

    // Filtrar por criptomoeda específica
    if (cryptocurrency) {
      filtered = filtered.filter((alert) => alert.crypto === cryptocurrency);
    }

    // Ordenar resultados
    return this._sortAlerts(filtered, sortBy, sortOrder);
  }

  /**
   * Obtém um alerta específico por ID
   * @param {number} id - ID do alerta
   * @returns {Object|null} - Alerta encontrado ou null
   */
  getAlertById(id) {
    return this.alerts.find((alert) => alert.id === id) || null;
  }

  /**
   * Ativa ou desativa um alerta
   * @param {number} id - ID do alerta
   * @param {boolean} active - Estado de ativação
   * @returns {boolean} - Se a operação foi bem-sucedida
   */
  setAlertActive(id, active) {
    return this.updateAlert(id, { active: !!active });
  }

  /**
   * Reseta o status de disparado de um alerta
   * @param {number} id - ID do alerta
   * @returns {boolean} - Se a operação foi bem-sucedida
   */
  resetAlertTrigger(id) {
    return this.updateAlert(id, { triggered: false });
  }

  /**
   * Testa todos os alertas imediatamente
   * @returns {Promise<Array>} - Alertas disparados
   */
  async testAllAlerts() {
    return this._checkAlerts(true);
  }

  /**
   * Testa um alerta específico imediatamente
   * @param {number} id - ID do alerta
   * @returns {Promise<boolean>} - Se o alerta foi disparado
   */
  async testAlert(id) {
    const alert = this.getAlertById(id);

    if (!alert) {
      logger.error(`Alerta com ID ${id} não encontrado`);
      return false;
    }

    try {
      const price = await this._fetchPrice(alert.crypto, alert.targetCurrency);
      return this._evaluateAlert(alert, price, true);
    } catch (error) {
      logger.error(`Erro ao testar alerta ${id}:`, error);
      return false;
    }
  }

  /**
   * Limpa todos os alertas
   * @returns {boolean} - Se a operação foi bem-sucedida
   */
  clearAllAlerts() {
    this.alerts = [];
    this._saveAlerts();
    return true;
  }

  /**
   * Exporta todos os alertas como JSON
   * @returns {string} - JSON com os alertas
   */
  exportToJSON() {
    return JSON.stringify(this.alerts, null, 2);
  }

  /**
   * Importa alertas de um JSON
   * @param {string} json - JSON com alertas
   * @returns {boolean} - Se a importação foi bem-sucedida
   */
  importFromJSON(json) {
    try {
      const parsedAlerts = JSON.parse(json);

      if (!Array.isArray(parsedAlerts)) {
        throw new Error('Formato de alertas inválido');
      }

      // Validar cada alerta
      const validAlerts = parsedAlerts.filter((alert) =>
        this._validateAlert(alert)
      );

      if (validAlerts.length !== parsedAlerts.length) {
        logger.warn(
          `${
            parsedAlerts.length - validAlerts.length
          } alertas inválidos foram ignorados.`
        );
      }

      // Atualizar IDs para evitar conflitos
      let maxId = 0;
      this.alerts.forEach((alert) => {
        maxId = Math.max(maxId, alert.id);
      });

      validAlerts.forEach((alert) => {
        alert.id = ++maxId;
      });

      this.alerts = [...this.alerts, ...validAlerts];
      this.nextAlertId = maxId + 1;
      this._saveAlerts();

      return true;
    } catch (error) {
      logger.error('Erro ao importar alertas:', error);
      return false;
    }
  }

  /**
   * Verifica se um alerta é válido
   * @param {Object} alert - Alerta a ser validado
   * @returns {boolean} - Se o alerta é válido
   * @private
   */
  _validateAlert(alert) {
    // Verificar campos obrigatórios
    if (
      !alert ||
      !alert.crypto ||
      !alert.condition ||
      !alert.price ||
      !alert.targetCurrency ||
      typeof alert.price !== 'number'
    ) {
      return false;
    }

    // Verificar se condição é válida
    const validConditions = ['above', 'below', 'equals'];
    if (!validConditions.includes(alert.condition)) {
      return false;
    }

    return true;
  }

  /**
   * Ordena a lista de alertas
   * @param {Array} alerts - Lista de alertas
   * @param {string} sortBy - Campo para ordenação
   * @param {string} sortOrder - Ordem (asc/desc)
   * @returns {Array} - Lista ordenada
   * @private
   */
  _sortAlerts(alerts, sortBy, sortOrder) {
    const validSortFields = ['created', 'price', 'crypto', 'condition'];
    const field = validSortFields.includes(sortBy) ? sortBy : 'created';
    const order = sortOrder === 'asc' ? 1 : -1;

    return [...alerts].sort((a, b) => {
      if (a[field] < b[field]) return -1 * order;
      if (a[field] > b[field]) return 1 * order;
      return 0;
    });
  }

  /**
   * Carrega alertas do localStorage
   * @private
   */
  _loadAlerts() {
    try {
      if (typeof localStorage === 'undefined') {
        return;
      }

      const storedAlerts = localStorage.getItem(this.storageKey);

      if (storedAlerts) {
        const parsedAlerts = JSON.parse(storedAlerts);

        if (Array.isArray(parsedAlerts) && parsedAlerts.length > 0) {
          this.alerts = parsedAlerts;

          // Determinar o próximo ID a ser usado
          const maxId = Math.max(...this.alerts.map((alert) => alert.id || 0));
          this.nextAlertId = maxId + 1;
        }
      }
    } catch (error) {
      logger.error('Erro ao carregar alertas:', error);
      this.alerts = [];
    }
  }

  /**
   * Salva alertas no localStorage
   * @private
   */
  _saveAlerts() {
    try {
      if (typeof localStorage === 'undefined') {
        return;
      }

      localStorage.setItem(this.storageKey, JSON.stringify(this.alerts));
    } catch (error) {
      logger.error('Erro ao salvar alertas:', error);
    }
  }

  /**
   * Manipula eventos de alteração no localStorage
   * @param {StorageEvent} event - Evento de storage
   * @private
   */
  _handleStorageEvent(event) {
    if (event.key === this.storageKey) {
      try {
        if (event.newValue) {
          // Atualizar alertas na memória
          this.alerts = JSON.parse(event.newValue);

          // Atualizar próximo ID
          const maxId = Math.max(
            ...this.alerts.map((alert) => alert.id || 0),
            0
          );
          this.nextAlertId = maxId + 1;
        } else {
          // Se o valor foi removido, limpar alertas
          this.alerts = [];
          this.nextAlertId = 1;
        }
      } catch (error) {
        logger.error('Erro ao processar mudanças de outra aba:', error);
      }
    }
  }

  /**
   * Verifica todos os alertas ativos
   * @param {boolean} testMode - Se é apenas um teste (não marca como disparado)
   * @returns {Promise<Array>} - Alertas disparados
   * @private
   */
  async _checkAlerts(testMode = false) {
    if (!this.fetchPriceCallback) {
      logger.error('fetchPriceCallback não definido');
      return [];
    }

    // Filtrar apenas alertas ativos
    const activeAlerts = this.alerts.filter(
      (alert) =>
        alert.active && (!alert.triggered || alert.repeatable || testMode)
    );

    if (activeAlerts.length === 0) {
      return [];
    }

    // Agrupar alertas por par de moedas para minimizar requisições
    const alertsByPair = new Map();

    activeAlerts.forEach((alert) => {
      const key = `${alert.crypto}-${alert.targetCurrency}`;

      if (!alertsByPair.has(key)) {
        alertsByPair.set(key, {
          crypto: alert.crypto,
          targetCurrency: alert.targetCurrency,
          alerts: [],
        });
      }

      alertsByPair.get(key).alerts.push(alert);
    });

    const triggeredAlerts = [];
    let saveNeeded = false;

    // Verificar cada grupo de alertas
    for (const [_, group] of alertsByPair) {
      try {
        const price = await this._fetchPrice(
          group.crypto,
          group.targetCurrency
        );

        // Verificar cada alerta no grupo
        for (const alert of group.alerts) {
          if (this._evaluateAlert(alert, price, testMode)) {
            triggeredAlerts.push(alert);
            saveNeeded = true;
          }
        }
      } catch (error) {
        logger.error(
          `Erro ao verificar alertas para ${group.crypto}-${group.targetCurrency}:`,
          error
        );
      }
    }

    // Salvar alterações se necessário
    if (saveNeeded && !testMode) {
      this._saveAlerts();
    }

    return triggeredAlerts;
  }

  /**
   * Avalia um alerta com o preço atual
   * @param {Object} alert - Alerta a ser avaliado
   * @param {number} currentPrice - Preço atual
   * @param {boolean} testMode - Se é apenas um teste
   * @returns {boolean} - Se o alerta foi disparado
   * @private
   */
  _evaluateAlert(alert, currentPrice, testMode = false) {
    let triggered = false;

    // Aplicar uma pequena margem para evitar problemas de arredondamento
    const epsilon = 0.0000001;

    // Avaliar condição
    switch (alert.condition) {
      case 'above':
        triggered = currentPrice > alert.price;
        break;
      case 'below':
        triggered = currentPrice < alert.price;
        break;
      case 'equals':
        triggered =
          Math.abs(currentPrice - alert.price) <
          Math.max(epsilon, alert.price * 0.001);
        break;
    }

    if (triggered) {
      // Notificar o usuário
      this._triggerNotification(alert, currentPrice, testMode);

      if (!testMode) {
        // Atualizar estado do alerta
        alert.triggered = true;
        alert.lastTriggered = new Date().toISOString();

        // Desativar se não for repetível
        if (!alert.repeatable) {
          alert.active = false;
        }
      }
    }

    return triggered;
  }

  /**
   * Busca o preço atual de uma criptomoeda
   * @param {string} crypto - Código da criptomoeda
   * @param {string} targetCurrency - Moeda alvo
   * @returns {Promise<number>} - Preço atual
   * @private
   */
  async _fetchPrice(crypto, targetCurrency) {
    try {
      return await this.fetchPriceCallback(crypto, targetCurrency);
    } catch (error) {
      logger.error(
        `Erro ao buscar preço para ${crypto}-${targetCurrency}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Dispara uma notificação para um alerta atingido
   * @param {Object} alert - Alerta disparado
   * @param {number} currentPrice - Preço atual
   * @param {boolean} testMode - Se é apenas um teste
   * @private
   */
  _triggerNotification(alert, currentPrice, testMode = false) {
    if (!this.notificationCallback) return;

    // Texto da condição em português
    const conditionText = {
      above: 'acima de',
      below: 'abaixo de',
      equals: 'igual a',
    };

    // Criar mensagem de notificação
    const title = testMode
      ? `[TESTE] Alerta de Preço: ${alert.crypto}`
      : `Alerta de Preço: ${alert.crypto}`;

    const message = `${alert.crypto} está ${conditionText[alert.condition]} ${
      alert.price
    } ${alert.targetCurrency}! Preço atual: ${currentPrice.toFixed(6)} ${
      alert.targetCurrency
    }`;

    try {
      this.notificationCallback({
        title,
        message,
        type: 'price-alert',
        data: {
          crypto: alert.crypto,
          condition: alert.condition,
          targetPrice: alert.price,
          currentPrice,
          targetCurrency: alert.targetCurrency,
          alertId: alert.id,
          isTest: testMode,
        },
      });
    } catch (error) {
      logger.error('Erro ao enviar notificação:', error);
    }
  }

  /**
   * Libera recursos e remove event listeners
   * @returns {boolean} - Se o serviço foi destruído com sucesso
   */
  destroy() {
    // Para o serviço de verificação
    this.stop();
    
    // Remove o event listener de storage
    if (typeof window !== 'undefined' && window.removeEventListener && this._boundHandleStorageEvent) {
      window.removeEventListener('storage', this._boundHandleStorageEvent);
      this._boundHandleStorageEvent = null;
    }
    
    // Limpa referências
    this.notificationCallback = null;
    this.fetchPriceCallback = null;
    
    logger.info('Serviço de alertas de preço destruído');
    return true;
  }
}
