/**
 * Sistema de monitoramento de performance
 * Permite rastrear e analisar o desempenho da aplicação
 */

class PerformanceMonitor {
  constructor(options = {}) {
    this.options = {
      sampleRate: 0.1, // 10% das sessões serão monitoradas por padrão
      maxMeasurements: 100, // Limite de medições armazenadas
      autoTracking: true, // Acompanhamento automático de métricas web vitals
      ...options
    };
    
    this.measurements = {};
    this.marksCount = 0;
    this.enabled = this._shouldMonitor();
    this.vitalsData = {};
    
    if (this.enabled && this.options.autoTracking) {
      this._setupAutoTracking();
    }
  }
  
  /**
   * Determina se o monitoramento deve ser ativado com base na amostragem
   * @private
   * @returns {boolean}
   */
  _shouldMonitor() {
    // Verificar se o navegador suporta a API de Performance
    if (!window.performance || !window.performance.mark) {
      return false;
    }
    
    // Para desenvolvimento, sempre monitorar
    if (process.env.NODE_ENV === 'development') {
      return true;
    }
    
    // Para produção, usar amostragem
    const samplingValue = Math.random();
    return samplingValue <= this.options.sampleRate;
  }
  
  /**
   * Configura o rastreamento automático de métricas
   * @private
   */
  _setupAutoTracking() {
    // Monitorar carregamento da página
    window.addEventListener('load', () => {
      this.measurePageLoad();
      
      // Adicionar um pequeno atraso para garantir que o navegador tenha tempo
      // para calcular as métricas de performance
      setTimeout(() => {
        this.captureWebVitals();
      }, 500);
    });
    
    // Monitorar recursos carregados
    if (window.performance && window.performance.getEntriesByType) {
      this._trackResources();
    }
    
    // Monitorar erros JavaScript
    window.addEventListener('error', this._handleError.bind(this));
    window.addEventListener('unhandledrejection', this._handleRejection.bind(this));
    
    // Monitorar interações e navegação
    this._trackInteractions();
  }
  
  /**
   * Marca o início de uma operação
   * @param {string} name - Nome da operação
   */
  mark(name) {
    if (!this.enabled) return;
    
    try {
      const markName = `${name}_start`;
      window.performance.mark(markName);
      
      this.marksCount++;
      if (this.marksCount > this.options.maxMeasurements) {
        // Limpar marcas antigas para evitar vazamento de memória
        this._cleanup();
      }
    } catch (e) {
      console.error('Erro ao criar marca de performance:', e);
    }
  }
  
  /**
   * Mede o tempo decorrido desde a marca de início
   * @param {string} name - Nome da operação (deve corresponder ao usado em mark)
   * @param {Object} attributes - Atributos adicionais para a medição
   * @returns {number|null} - Duração em ms ou null se falhar
   */
  measure(name, attributes = {}) {
    if (!this.enabled) return null;
    
    try {
      const startMark = `${name}_start`;
      const endMark = `${name}_end`;
      
      // Marca o fim da operação
      window.performance.mark(endMark);
      
      // Cria uma medida entre o início e o fim
      window.performance.measure(name, startMark, endMark);
      
      // Obtém a medida
      const entries = window.performance.getEntriesByName(name, 'measure');
      
      if (entries.length > 0) {
        const duration = entries[0].duration;
        
        // Armazenar a medição
        if (!this.measurements[name]) {
          this.measurements[name] = [];
        }
        
        this.measurements[name].push({
          duration,
          timestamp: Date.now(),
          ...attributes
        });
        
        return duration;
      }
    } catch (e) {
      console.error('Erro ao medir performance:', e);
    }
    
    return null;
  }
  
  /**
   * Mede o tempo de carregamento da página
   * @returns {Object} - Métricas de carregamento
   */
  measurePageLoad() {
    if (!this.enabled || !window.performance || !window.performance.timing) {
      return null;
    }
    
    const timing = window.performance.timing;
    
    const metrics = {
      // Tempo total de carregamento
      loadTime: timing.loadEventEnd - timing.navigationStart,
      
      // Tempo para primeiro byte
      ttfb: timing.responseStart - timing.navigationStart,
      
      // Tempo de processamento do DOM
      domProcessing: timing.domComplete - timing.domLoading,
      
      // Tempo até o DOM estar pronto
      domReady: timing.domContentLoadedEventEnd - timing.navigationStart,
      
      // Tempo gasto no servidor
      serverTime: timing.responseEnd - timing.requestStart,
      
      // Tempo de download da página
      downloadTime: timing.responseEnd - timing.responseStart,
      
      // Timestamp
      timestamp: Date.now(),
      
      // URL da página
      page: window.location.pathname
    };
    
    this.measurements.pageLoad = metrics;
    return metrics;
  }
  
  /**
   * Captura métricas Web Vitals
   */
  captureWebVitals() {
    if (!this.enabled || !window.performance) {
      return;
    }
    
    try {
      // Tentar capturar métricas do PerformanceObserver se disponível
      if ('PerformanceObserver' in window) {
        this._captureModernWebVitals();
      }
      
      // Calcular métricas tradicionais
      const paintMetrics = window.performance.getEntriesByType('paint');
      
      if (paintMetrics && paintMetrics.length) {
        for (const metric of paintMetrics) {
          if (metric.name === 'first-paint') {
            this.vitalsData.FP = metric.startTime;
          }
          if (metric.name === 'first-contentful-paint') {
            this.vitalsData.FCP = metric.startTime;
          }
        }
      }
      
      // Calcular outras métricas aproximadas
      if (window.performance.timing) {
        // Time to Interactive aproximado (não é tão preciso quanto a métrica real)
        const tti = window.performance.timing.domInteractive - window.performance.timing.navigationStart;
        this.vitalsData.TTI = tti;
      }
      
    } catch (e) {
      console.error('Erro ao capturar Web Vitals:', e);
    }
  }
  
  /**
   * Captura métricas modernas de Web Vitals usando PerformanceObserver
   * @private
   */
  _captureModernWebVitals() {
    try {
      // LCP (Largest Contentful Paint)
      const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.vitalsData.LCP = lastEntry.startTime;
      });
      
      lcpObserver.observe({
        type: 'largest-contentful-paint',
        buffered: true
      });
      
      // FID (First Input Delay)
      const fidObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        // Use apenas a primeira interação
        if (entries.length > 0 && !this.vitalsData.FID) {
          this.vitalsData.FID = entries[0].processingStart - entries[0].startTime;
        }
      });
      
      fidObserver.observe({
        type: 'first-input',
        buffered: true
      });
      
      // CLS (Cumulative Layout Shift)
      let clsValue = 0;
      let clsEntries = [];
      
      const clsObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        
        entries.forEach(entry => {
          // Apenas se não for ignorado por um atributo
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            clsEntries.push(entry);
          }
        });
        
        this.vitalsData.CLS = clsValue;
      });
      
      clsObserver.observe({
        type: 'layout-shift',
        buffered: true
      });
    } catch (e) {
      console.warn('Erro ao capturar métricas modernas:', e);
    }
  }
  
  /**
   * Rastreia recursos carregados
   * @private
   */
  _trackResources() {
    try {
      // Monitorar carregamento de recursos
      const resourceObserver = new PerformanceObserver((list) => {
        const resources = list.getEntries().filter(entry => entry.initiatorType);
        
        if (!this.measurements.resources) {
          this.measurements.resources = [];
        }
        
        resources.forEach(resource => {
          this.measurements.resources.push({
            name: resource.name,
            type: resource.initiatorType,
            duration: resource.duration,
            size: resource.transferSize || 0,
            timestamp: Date.now()
          });
        });
      });
      
      resourceObserver.observe({ type: 'resource', buffered: true });
    } catch (e) {
      console.warn('PerformanceObserver para recursos não suportado:', e);
    }
  }
  
  /**
   * Monitora interações do usuário
   * @private
   */
  _trackInteractions() {
    // Lista de eventos a rastrear
    const events = ['click', 'submit', 'keydown'];
    
    events.forEach(eventType => {
      window.addEventListener(eventType, (e) => {
        if (!this.enabled) return;
        
        // Obter um identificador para o elemento
        let targetId = '';
        
        if (e.target.id) {
          targetId = `#${e.target.id}`;
        } else if (e.target.className && typeof e.target.className === 'string') {
          targetId = `.${e.target.className.split(' ')[0]}`;
        } else {
          targetId = e.target.tagName.toLowerCase();
        }
        
        // Registrar a interação
        if (!this.measurements.interactions) {
          this.measurements.interactions = [];
        }
        
        this.measurements.interactions.push({
          type: eventType,
          target: targetId,
          timestamp: Date.now()
        });
      }, { passive: true });
    });
  }
  
  /**
   * Manipula erros de JavaScript
   * @private
   * @param {ErrorEvent} event - Evento de erro
   */
  _handleError(event) {
    if (!this.enabled) return;
    
    if (!this.measurements.errors) {
      this.measurements.errors = [];
    }
    
    this.measurements.errors.push({
      type: 'error',
      message: event.message,
      source: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      timestamp: Date.now()
    });
  }
  
  /**
   * Manipula promessas não tratadas
   * @private
   * @param {PromiseRejectionEvent} event - Evento de rejeição
   */
  _handleRejection(event) {
    if (!this.enabled) return;
    
    if (!this.measurements.errors) {
      this.measurements.errors = [];
    }
    
    let message = 'Promessa rejeitada';
    
    if (event.reason) {
      if (typeof event.reason === 'string') {
        message = event.reason;
      } else if (event.reason.message) {
        message = event.reason.message;
      }
    }
    
    this.measurements.errors.push({
      type: 'unhandledrejection',
      message,
      timestamp: Date.now()
    });
  }
  
  /**
   * Limpa métricas antigas
   * @private
   */
  _cleanup() {
    this.marksCount = 0;
    
    // Limpar métricas antigas
    for (const key in this.measurements) {
      if (Array.isArray(this.measurements[key])) {
        // Manter apenas as métricas mais recentes
        if (this.measurements[key].length > this.options.maxMeasurements) {
          this.measurements[key] = this.measurements[key].slice(-Math.floor(this.options.maxMeasurements / 2));
        }
      }
    }
    
    // Limpar marcas e medições do performance
    if (window.performance && window.performance.clearMarks) {
      window.performance.clearMarks();
      window.performance.clearMeasures();
    }
  }
  
  /**
   * Retorna todas as métricas coletadas
   * @returns {Object} - Métricas coletadas
   */
  getAllMetrics() {
    return {
      measurements: this.measurements,
      webVitals: this.vitalsData,
      userAgent: navigator.userAgent,
      timestamp: Date.now(),
      url: window.location.href
    };
  }
  
  /**
   * Retorna métricas específicas
   * @param {string} name - Nome da métrica
   * @returns {Array|Object} - Métricas solicitadas
   */
  getMetrics(name) {
    return this.measurements[name] || null;
  }
  
  /**
   * Retorna métricas de Web Vitals
   * @returns {Object} - Métricas de Web Vitals
   */
  getWebVitals() {
    return this.vitalsData;
  }
  
  /**
   * Envia métricas para um servidor
   * @param {string} endpoint - URL para envio das métricas
   * @param {Object} additionalData - Dados adicionais a enviar
   * @returns {Promise} - Promise da requisição
   */
  async sendMetrics(endpoint, additionalData = {}) {
    if (!this.enabled || !endpoint) {
      return Promise.resolve({ success: false, reason: 'disabled' });
    }
    
    const metrics = this.getAllMetrics();
    
    // Adicionar dados extras
    const payload = {
      ...metrics,
      ...additionalData
    };
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
        // Usar keepalive para garantir que a requisição seja enviada
        // mesmo se a página estiver sendo fechada
        keepalive: true
      });
      
      return {
        success: response.ok,
        status: response.status
      };
    } catch (error) {
      console.error('Erro ao enviar métricas:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Coleta e registra métricas de navegação entre páginas
   * @param {string} from - URL de origem
   * @param {string} to - URL de destino
   */
  trackNavigation(from, to) {
    if (!this.enabled) return;
    
    if (!this.measurements.navigation) {
      this.measurements.navigation = [];
    }
    
    this.measurements.navigation.push({
      from,
      to,
      timestamp: Date.now()
    });
  }
}

// Instância padrão do monitor de performance
export const performanceMonitor = new PerformanceMonitor();

// Interface para medir o tempo de funções
export function measureFn(fn, name, attributes = {}) {
  if (!performanceMonitor.enabled) {
    return fn();
  }
  
  performanceMonitor.mark(name);
  try {
    const result = fn();
    
    // Se for uma promessa, medir quando completar
    if (result instanceof Promise) {
      return result.then(value => {
        performanceMonitor.measure(name, attributes);
        return value;
      }).catch(err => {
        performanceMonitor.measure(name, { ...attributes, error: true });
        throw err;
      });
    }
    
    // Caso contrário, medir imediatamente
    performanceMonitor.measure(name, attributes);
    return result;
  } catch (error) {
    performanceMonitor.measure(name, { ...attributes, error: true });
    throw error;
  }
}

// Decorator para medir o tempo de métodos
export function measure(name) {
  return function(target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = function(...args) {
      const methodName = name || `${target.constructor.name}.${propertyKey}`;
      return measureFn(() => originalMethod.apply(this, args), methodName);
    };
    
    return descriptor;
  };
}

export default performanceMonitor;