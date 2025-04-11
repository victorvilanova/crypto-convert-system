import { EVENTS } from '../constants.js';

/**
 * Utilitário para gerenciar erros de forma centralizada
 */
export class ErrorHandler {
  /**
   * @param {Object} options - Opções de configuração
   * @param {boolean} [options.logToConsole] - Se deve logar erros no console
   * @param {boolean} [options.notifyUser] - Se deve notificar o usuário por padrão
   */
  constructor({ logToConsole = true, notifyUser = false } = {}) {
    this.logToConsole = logToConsole;
    this.notifyUser = notifyUser;
    this.errorHistory = [];
  }

  /**
   * Manipula um erro de forma centralizada
   * @param {Error|string} error - Erro ou mensagem de erro
   * @param {string} [context] - Contexto onde o erro ocorreu
   * @param {boolean} [notify] - Se deve notificar o usuário sobre este erro
   * @returns {Error} O objeto de erro original ou criado
   */
  handleError(error, context = '', notify = this.notifyUser) {
    // Garantir que temos um objeto Error
    const errorObj = error instanceof Error ? error : new Error(error);
    
    // Adicionar contexto se fornecido
    const errorWithContext = context ? `[${context}] ${errorObj.message}` : errorObj.message;
    
    // Registrar no console
    if (this.logToConsole) {
      console.error(errorWithContext, errorObj);
    }
    
    // Adicionar ao histórico
    this.addToErrorHistory(errorObj, context);
    
    // Notificar usuário se necessário
    if (notify) {
      this.notifyErrorToUser(errorObj.message, context);
    }
    
    // Emitir evento para que outras partes do sistema possam reagir
    this.emitErrorEvent(errorObj, context);
    
    return errorObj;
  }

  /**
   * Adiciona um erro ao histórico
   * @param {Error} error - Objeto de erro
   * @param {string} context - Contexto do erro
   * @private
   */
  addToErrorHistory(error, context) {
    // Limitar tamanho do histórico
    const maxHistorySize = 50;
    if (this.errorHistory.length >= maxHistorySize) {
      this.errorHistory.pop(); // Remover o mais antigo
    }
    
    this.errorHistory.unshift({
      error,
      context,
      timestamp: new Date()
    });
  }

  /**
   * Emite um evento de erro para o sistema
   * @param {Error} error - Objeto de erro
   * @param {string} context - Contexto do erro
   * @private
   */
  emitErrorEvent(error, context) {
    const event = new CustomEvent(EVENTS.ERROR, {
      detail: {
        error,
        message: error.message,
        context,
        timestamp: new Date()
      }
    });
    
    document.dispatchEvent(event);
  }

  /**
   * Notifica o usuário sobre um erro
   * @param {string} message - Mensagem de erro
   * @param {string} context - Contexto do erro
   * @private
   */
  notifyErrorToUser(message, context) {
    // Título amigável baseado no contexto
    const title = context || 'Erro';
    
    // Simplificar a mensagem para o usuário
    const userMessage = this.simplifyErrorMessage(message);
    
    // Emitir evento específico para notificação ao usuário
    const event = new CustomEvent(EVENTS.USER_NOTIFICATION, {
      detail: {
        type: 'error',
        title,
        message: userMessage
      }
    });
    
    document.dispatchEvent(event);
  }

  /**
   * Simplifica uma mensagem de erro para apresentação ao usuário
   * @param {string} message - Mensagem de erro original
   * @returns {string} Mensagem simplificada
   * @private
   */
  simplifyErrorMessage(message) {
    // Remover detalhes técnicos e stacktraces
    let simplified = message.split('\n')[0].trim();
    
    // Remover códigos de erro comuns
    simplified = simplified.replace(/\b(Error|Exception|ERR_)\w+:?\s*/gi, '');
    
    // Reescrever mensagens comuns de rede
    if (simplified.includes('fetch') || simplified.includes('network') || 
        simplified.includes('ECONNREFUSED') || simplified.includes('timeout')) {
      return 'Falha na conexão com o servidor. Verifique sua internet e tente novamente.';
    }
    
    // Reescrever erros de permissão
    if (simplified.includes('permission') || simplified.includes('access denied')) {
      return 'Sem permissão para realizar esta operação.';
    }
    
    // Se a mensagem ficar vazia depois das limpezas
    if (!simplified || simplified.length < 5) {
      return 'Ocorreu um erro inesperado. Tente novamente mais tarde.';
    }
    
    // Garantir que a primeira letra é maiúscula e tem pontuação
    simplified = simplified.charAt(0).toUpperCase() + simplified.slice(1);
    if (!simplified.endsWith('.') && !simplified.endsWith('!') && !simplified.endsWith('?')) {
      simplified += '.';
    }
    
    return simplified;
  }

  /**
   * Obtém o histórico de erros
   * @param {number} [limit] - Número máximo de erros a retornar
   * @returns {Array} Histórico de erros
   */
  getErrorHistory(limit) {
    if (limit && limit > 0) {
      return this.errorHistory.slice(0, limit);
    }
    return [...this.errorHistory];
  }

  /**
   * Limpa o histórico de erros
   */
  clearErrorHistory() {
    this.errorHistory = [];
  }

  /**
   * Cria uma função de erro específica para um contexto
   * @param {string} context - Contexto para os erros
   * @returns {Function} Função para manipular erros nesse contexto
   */
  createContextualErrorHandler(context) {
    return (error, notify = this.notifyUser) => {
      return this.handleError(error, context, notify);
    };
  }
}