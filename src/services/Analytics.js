/**
 * Módulo de Analytics para rastrear interações do usuário
 * Implementa uma abstração sobre o Google Analytics
 */
import { getLogger } from '../utils/Logger';

// Criar uma instância de logger específica para Analytics
const logger = getLogger('Analytics');

/**
 * Classe para gerenciamento de analytics
 */
export class Analytics {
  /**
   * @param {Object} options - Opções de configuração
   * @param {string} options.trackingId - ID do Google Analytics
   * @param {boolean} options.debug - Ativar modo debug
   * @param {boolean} options.respectDoNotTrack - Respeitar preferência "Do Not Track"
   */
  constructor(options = {}) {
    const {
      trackingId = 'UA-XXXXXXXXX-X', // Substitua pelo ID real
      debug = false,
      respectDoNotTrack = true
    } = options;
    
    this.trackingId = trackingId;
    this.debug = debug;
    this.respectDoNotTrack = respectDoNotTrack;
    this.initialized = false;
    this.queuedEvents = [];
    this.isTrackingAllowed = this._checkTrackingAllowed();
    
    // Inicializar se o rastreamento for permitido
    if (this.isTrackingAllowed) {
      this._initGoogleAnalytics();
    } else if (this.debug) {
      logger.info('Rastreamento desativado devido a preferências do usuário ou Do Not Track');
    }
  }
  
  /**
   * Verifica se o rastreamento é permitido com base nas preferências do usuário
   * @private
   * @returns {boolean} - Se o rastreamento é permitido
   */
  _checkTrackingAllowed() {
    // Verificar configuração local
    const userPref = localStorage.getItem('fastcripto_allow_analytics');
    
    // Se o usuário explicitamente permitiu, permitir rastreamento
    if (userPref === 'true') return true;
    
    // Se o usuário explicitamente recusou, bloquear rastreamento
    if (userPref === 'false') return false;
    
    // Verificar o cabeçalho Do Not Track, se a opção estiver ativada
    if (this.respectDoNotTrack && (
      navigator.doNotTrack === '1' || 
      navigator.doNotTrack === 'yes' ||
      window.doNotTrack === '1'
    )) {
      return false;
    }
    
    // Por padrão, permitir rastreamento
    return true;
  }
  
  /**
   * Inicializa o Google Analytics
   * @private
   */
  _initGoogleAnalytics() {
    // Evitar inicialização duplicada
    if (this.initialized) return;
    
    // Criar script para carregar o Google Analytics
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${this.trackingId}`;
    document.head.appendChild(script);
    
    // Inicializar o gtag
    window.dataLayer = window.dataLayer || [];
    window.gtag = function() {
      window.dataLayer.push(arguments);
    };
    
    // Configurar o Google Analytics
    window.gtag('js', new Date());
    window.gtag('config', this.trackingId, {
      anonymize_ip: true,
      send_page_view: false, // Vamos enviar manualmente para ter mais controle
      cookie_flags: 'SameSite=None;Secure'
    });
    
    this.initialized = true;
    
    // Processar eventos na fila
    this._processQueue();
    
    if (this.debug) {
      logger.info('Inicializado com sucesso');
    }
  }
  
  /**
   * Processa eventos na fila após inicialização
   * @private
   */
  _processQueue() {
    if (!this.initialized || !this.queuedEvents.length) return;
    
    // Processar cada evento na fila
    this.queuedEvents.forEach(event => {
      const { type, ...params } = event;
      
      switch (type) {
        case 'pageview':
          this.pageView(params.path, params.title);
          break;
        case 'event':
          this.event(params.category, params.action, params.label, params.value);
          break;
        case 'timing':
          this.timing(params.category, params.variable, params.time, params.label);
          break;
      }
    });
    
    // Limpar a fila
    this.queuedEvents = [];
    
    if (this.debug) {
      logger.info('Fila de eventos processada');
    }
  }
  
  /**
   * Rastreia visualização de página
   * @param {string} path - Caminho da página (opcional, usa window.location.pathname como padrão)
   * @param {string} title - Título da página (opcional, usa document.title como padrão)
   */
  pageView(path = window.location.pathname, title = document.title) {
    if (!this.isTrackingAllowed) return;
    
    if (!this.initialized) {
      // Adicionar à fila para processar depois
      this.queuedEvents.push({ type: 'pageview', path, title });
      return;
    }
    
    window.gtag('event', 'page_view', {
      page_path: path,
      page_title: title,
      page_location: window.location.href
    });
    
    if (this.debug) {
      logger.info('Page View', { path, title });
    }
  }
  
  /**
   * Rastreia um evento
   * @param {string} category - Categoria do evento (obrigatório)
   * @param {string} action - Ação do evento (obrigatório)
   * @param {string} label - Rótulo do evento (opcional)
   * @param {number} value - Valor numérico do evento (opcional)
   */
  event(category, action, label = null, value = null) {
    if (!this.isTrackingAllowed || !category || !action) return;
    
    if (!this.initialized) {
      // Adicionar à fila para processar depois
      this.queuedEvents.push({ type: 'event', category, action, label, value });
      return;
    }
    
    const params = {
      event_category: category,
      event_action: action
    };
    
    if (label) params.event_label = label;
    if (value !== null && !isNaN(value)) params.value = Number(value);
    
    window.gtag('event', action, params);
    
    if (this.debug) {
      logger.info('Event', { category, action, label, value });
    }
  }
  
  /**
   * Rastreia o tempo de uma operação
   * @param {string} category - Categoria da medição (obrigatório)
   * @param {string} variable - Variável medida (obrigatório)
   * @param {number} time - Tempo em milissegundos (obrigatório)
   * @param {string} label - Rótulo da medição (opcional)
   */
  timing(category, variable, time, label = null) {
    if (!this.isTrackingAllowed || !category || !variable || time === null) return;
    
    if (!this.initialized) {
      // Adicionar à fila para processar depois
      this.queuedEvents.push({ type: 'timing', category, variable, time, label });
      return;
    }
    
    const params = {
      event_category: category,
      name: variable,
      value: Math.round(time)
    };
    
    if (label) params.event_label = label;
    
    window.gtag('event', 'timing_complete', params);
    
    if (this.debug) {
      logger.info('Timing', { category, variable, time, label });
    }
  }
  
  /**
   * Define o ID do usuário para análise entre dispositivos
   * @param {string} userId - ID único do usuário
   */
  setUserId(userId) {
    if (!this.isTrackingAllowed || !userId) return;
    
    if (!this.initialized) {
      this._initGoogleAnalytics();
    }
    
    window.gtag('config', this.trackingId, {
      user_id: userId
    });
    
    if (this.debug) {
      logger.info('User ID definido', { userId });
    }
  }
  
  /**
   * Define uma propriedade personalizada do usuário
   * @param {string} name - Nome da propriedade
   * @param {string} value - Valor da propriedade
   */
  setUserProperty(name, value) {
    if (!this.isTrackingAllowed || !name || value === undefined) return;
    
    if (!this.initialized) {
      this._initGoogleAnalytics();
    }
    
    window.gtag('set', 'user_properties', { [name]: value });
    
    if (this.debug) {
      logger.info('User Property definida', { name, value });
    }
  }
  
  /**
   * Marca o início de uma operação para medir o tempo
   * @param {string} operationName - Nome da operação
   * @returns {number} - Timestamp de início
   */
  startTimeMeasurement(operationName) {
    const start = performance.now();
    
    // Armazenar o tempo de início
    this._timeMeasurements = this._timeMeasurements || {};
    this._timeMeasurements[operationName] = start;
    
    return start;
  }
  
  /**
   * Finaliza a medição de tempo e envia para o analytics
   * @param {string} operationName - Nome da operação (deve corresponder ao usado em startTimeMeasurement)
   * @param {string} category - Categoria para o evento de timing
   * @param {string} label - Rótulo opcional
   * @returns {number} - Duração em milissegundos
   */
  endTimeMeasurement(operationName, category, label = null) {
    if (!this._timeMeasurements || !this._timeMeasurements[operationName]) {
      if (this.debug) {
        logger.warn(`Nenhuma medição iniciada para "${operationName}"`);
      }
      return 0;
    }
    
    const end = performance.now();
    const duration = end - this._timeMeasurements[operationName];
    
    // Enviar para analytics
    this.timing(category, operationName, duration, label);
    
    // Limpar a referência
    delete this._timeMeasurements[operationName];
    
    return duration;
  }
  
  /**
   * Ativa ou desativa o rastreamento com base na preferência do usuário
   * @param {boolean} allow - Se o rastreamento deve ser permitido
   */
  setTrackingAllowed(allow) {
    // Armazenar a preferência
    localStorage.setItem('fastcripto_allow_analytics', allow ? 'true' : 'false');
    
    // Atualizar o estado
    this.isTrackingAllowed = allow;
    
    // Se ativado e não inicializado, inicializar
    if (allow && !this.initialized) {
      this._initGoogleAnalytics();
    }
    
    if (this.debug) {
      logger.info('Rastreamento ' + (allow ? 'ativado' : 'desativado'));
    }
  }
}

// Instância padrão do Analytics
export const analytics = new Analytics({
  trackingId: 'UA-XXXXXXXXX-X', // Substitua pelo ID real
  debug: process.env.NODE_ENV !== 'production',
  respectDoNotTrack: true
});

// Exportar a instância padrão como default
export default analytics;