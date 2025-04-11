// Classe para gerenciar erros na aplicação
export class ErrorHandler {
  constructor(options = {}) {
    this.options = {
      logToConsole: true,
      logToServer: false,
      serverLogEndpoint: '/api/logs',
      ...options
    };
    
    // Registro de erros para análise
    this.errorLog = [];
    
    // Configurar manipulador global de erros não tratados
    this.setupGlobalErrorHandler();
  }

  /**
   * Configura o handler de erros não capturados
   * @private
   */
  setupGlobalErrorHandler() {
    window.addEventListener('error', (event) => {
      this.handleError(event.error, 'Erro não tratado');
      // Prevenir comportamento padrão
      event.preventDefault();
    });
    
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(event.reason, 'Promise rejeitada não tratada');
      // Prevenir comportamento padrão
      event.preventDefault();
    });
  }

  /**
   * Trata um erro, registrando-o e notificando o usuário se necessário
   * @param {Error|string} error - O erro ou mensagem de erro
   * @param {string} context - Contexto onde o erro ocorreu
   * @param {boolean} notifyUser - Se deve notificar o usuário
   */
  handleError(error, context = 'Erro da aplicação', notifyUser = true) {
    // Criar objeto de erro padronizado
    const errorObject = this.formatError(error, context);
    
    // Adicionar ao log interno
    this.errorLog.push(errorObject);
    
    // Log no console se habilitado
    if (this.options.logToConsole) {
      console.error(`[${context}]`, error);
    }
    
    // Enviar para servidor se habilitado
    if (this.options.logToServer) {
      this.sendErrorToServer(errorObject);
    }
    
    // Notificar o usuário se necessário
    if (notifyUser) {
      this.notifyUser(errorObject);
    }
    
    return errorObject;
  }

  /**
   * Formata o erro para um objeto padronizado
   * @param {Error|string} error - O erro a ser formatado
   * @param {string} context - Contexto do erro
   * @returns {Object} Objeto de erro padronizado
   * @private
   */
  formatError(error, context) {
    const timestamp = new Date();
    const errorMessage = error instanceof Error ? error.message : String(error);
    const stackTrace = error instanceof Error ? error.stack : new Error().stack;
    
    return {
      message: errorMessage,
      context,
      timestamp,
      stackTrace,
      browserInfo: this.getBrowserInfo()
    };
  }

  /**
   * Obtém informações do navegador para debug
   * @returns {Object} Informações do navegador
   * @private
   */
  getBrowserInfo() {
    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      viewportSize: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    };
  }

  /**
   * Envia erro para o servidor de logs
   * @param {Object} errorObject - Objeto de erro a enviar
   * @private
   */
  sendErrorToServer(errorObject) {
    try {
      fetch(this.options.serverLogEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(errorObject),
        // Não queremos que falhas aqui gerem mais erros
        keepalive: true
      }).catch(e => console.warn('Falha ao enviar log para servidor', e));
    } catch (e) {
      // Silenciar erros ao tentar reportar erros
      console.warn('Falha ao enviar log para servidor', e);
    }
  }

  /**
   * Notifica o usuário sobre o erro
   * @param {Object} errorObject - Objeto de erro
   * @private
   */
  notifyUser(errorObject) {
    // Despachar evento personalizado para que a UI possa reagir
    const event = new CustomEvent('app:error', {
      detail: {
        message: this.getUserFriendlyMessage(errorObject.message),
        context: errorObject.context,
        timestamp: errorObject.timestamp
      }
    });
    
    document.dispatchEvent(event);
  }

  /**
   * Converte mensagens de erro técnicas em mensagens amigáveis
   * @param {string} technicalMessage - Mensagem técnica do erro
   * @returns {string} Mensagem amigável para o usuário
   * @private
   */
  getUserFriendlyMessage(technicalMessage) {
    // Mapeamento de erros comuns para mensagens amigáveis
    const errorMap = {
      'Failed to fetch': 'Não foi possível conectar ao servidor. Verifique sua conexão com a internet.',
      'Network error': 'Erro de rede. Verifique sua conexão com a internet.',
      'Timeout': 'A operação demorou muito para responder. Tente novamente mais tarde.',
      'Not Found': 'O recurso solicitado não foi encontrado.',
      'Unauthorized': 'Você não está autorizado a acessar este recurso.',
      'Invalid API key': 'Chave de API inválida. Contate o suporte.',
    };
    
    // Verificar se a mensagem técnica contém alguma das chaves mapeadas
    for (const [technical, friendly] of Object.entries(errorMap)) {
      if (technicalMessage.includes(technical)) {
        return friendly;
      }
    }
    
    // Mensagem genérica para erros não mapeados
    return 'Ocorreu um erro. Por favor, tente novamente mais tarde.';
  }

  /**
   * Obtém o log de erros para análise
   * @returns {Array} Log de erros
   */
  getErrorLog() {
    return [...this.errorLog];
  }

  /**
   * Limpa o log de erros
   */
  clearErrorLog() {
    this.errorLog = [];
  }
}