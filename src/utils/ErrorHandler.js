import { EVENTS } from '../constants.js';

/**
 * Classe para gerenciamento centralizado de erros no sistema
 */
export class ErrorHandler {
  /**
   * @param {Object} options - Opções de configuração
   * @param {Function} [options.logger] - Função para registrar erros (log)
   * @param {Function} [options.notifier] - Função para notificar o usuário
   * @param {boolean} [options.reportToServer] - Se deve reportar erros ao servidor
   */
  constructor({
    logger = console.error,
    notifier = null,
    reportToServer = false,
  } = {}) {
    this.logger = logger;
    this.notifier = notifier || this.defaultNotifier;
    this.reportToServer = reportToServer;
    this.errorStack = [];
    this.maxStackSize = 50;
  }

  /**
   * Manipula um erro no sistema
   * @param {Error|string} error - O erro a ser manipulado
   * @param {string} [context] - Contexto onde o erro ocorreu
   * @param {boolean} [notify] - Se deve notificar o usuário
   * @returns {string} ID do erro registrado
   */
  handleError(error, context = 'Aplicação', notify = false) {
    // Garantir que temos um objeto de erro
    const errorObj = error instanceof Error ? error : new Error(error);

    // Adicionar contexto ao erro
    errorObj.context = context;
    errorObj.timestamp = new Date();
    errorObj.id = this.generateErrorId();

    // Registrar o erro
    this.logError(errorObj);

    // Adicionar à pilha de erros
    this.addToErrorStack(errorObj);

    // Notificar o usuário se necessário
    if (notify) {
      this.notifyUser(errorObj);
    }

    // Reportar ao servidor se configurado
    if (this.reportToServer) {
      this.reportErrorToServer(errorObj);
    }

    return errorObj.id;
  }

  /**
   * Registra o erro no sistema de log
   * @param {Error} error - Erro a ser registrado
   * @private
   */
  logError(error) {
    const logMessage = `[ERROR] [${error.timestamp.toISOString()}] [${
      error.context
    }] [ID: ${error.id}]: ${error.message}`;

    // Registrar detalhes adicionais se disponíveis
    if (error.stack) {
      this.logger(logMessage, error.stack);
    } else {
      this.logger(logMessage);
    }
  }

  /**
   * Adiciona um erro à pilha de erros
   * @param {Error} error - Erro a ser adicionado
   * @private
   */
  addToErrorStack(error) {
    // Simplificar o objeto para armazenamento
    const errorInfo = {
      id: error.id,
      message: error.message,
      context: error.context,
      timestamp: error.timestamp,
      stack: error.stack,
    };

    // Adicionar ao início da pilha
    this.errorStack.unshift(errorInfo);

    // Limitar o tamanho da pilha
    if (this.errorStack.length > this.maxStackSize) {
      this.errorStack.pop();
    }
  }

  /**
   * Notifica o usuário sobre o erro
   * @param {Error} error - Erro a ser notificado
   * @private
   */
  notifyUser(error) {
    let message = `Ocorreu um erro: ${error.message}`;

    // Se o contexto for específico, incluir na mensagem
    if (error.context && error.context !== 'Aplicação') {
      message = `Erro em ${error.context}: ${error.message}`;
    }

    this.notifier(message, error.id);
  }

  /**
   * Reporta o erro ao servidor
   * @param {Error} error - Erro a ser reportado
   * @private
   */
  reportErrorToServer(error) {
    // Implementação básica - poderia ser substituída por uma chamada real à API
    setTimeout(() => {
      try {
        const payload = {
          id: error.id,
          message: error.message,
          context: error.context,
          timestamp: error.timestamp.toISOString(),
          userAgent: navigator.userAgent,
          stack: error.stack,
        };

        if (navigator.onLine) {
          fetch('/api/errors', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          }).catch((e) => {
            console.warn('Falha ao reportar erro:', e.message);
          });
        } else {
          // Armazenar para envio posterior quando estiver online
          const storedErrors = JSON.parse(
            localStorage.getItem('pendingErrorReports') || '[]'
          );
          storedErrors.push(payload);
          localStorage.setItem(
            'pendingErrorReports',
            JSON.stringify(storedErrors)
          );
        }
      } catch (e) {
        console.warn('Falha ao processar reporte de erro:', e.message);
      }
    }, 0);
  }

  /**
   * Notificador padrão usado quando nenhum for fornecido
   * @param {string} message - Mensagem de erro
   * @param {string} id - ID do erro
   * @private
   */
  defaultNotifier(message, id) {
    // Notificador básico que usa console.warn
    console.warn(`[NOTIFICAÇÃO] ${message} (ID: ${id})`);

    // Em ambiente de navegador, poderia mostrar uma notificação visual
    if (typeof document !== 'undefined') {
      // Verificar se já existe um container de notificações
      let notificationContainer = document.getElementById(
        'error-notifications'
      );

      if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.id = 'error-notifications';
        notificationContainer.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 9999;
        `;
        document.body.appendChild(notificationContainer);
      }

      // Criar elemento de notificação
      const notification = document.createElement('div');
      notification.style.cssText = `
        background-color: #f8d7da;
        color: #721c24;
        padding: 10px 15px;
        margin-bottom: 10px;
        border-radius: 4px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        max-width: 300px;
        word-break: break-word;
      `;

      // Adicionar conteúdo
      notification.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <strong>Erro</strong>
          <span style="cursor: pointer;" onclick="this.parentNode.parentNode.remove()">×</span>
        </div>
        <div style="margin-top: 5px;">${message}</div>
        <small style="display: block; margin-top: 5px; opacity: 0.7;">ID: ${id}</small>
      `;

      // Adicionar ao container
      notificationContainer.appendChild(notification);

      // Remover automaticamente após alguns segundos
      setTimeout(() => {
        if (notification.parentNode) {
          notification.remove();
        }
      }, 5000);
    }
  }

  /**
   * Gera um ID único para o erro
   * @returns {string} ID do erro
   * @private
   */
  generateErrorId() {
    return 'err_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Retorna a pilha de erros registrados
   * @returns {Array} Lista de erros registrados
   */
  getErrorStack() {
    return [...this.errorStack];
  }

  /**
   * Limpa a pilha de erros
   */
  clearErrorStack() {
    this.errorStack = [];
  }

  /**
   * Processa erros pendentes que não foram enviados ao servidor
   * @returns {Promise<number>} Número de erros processados
   */
  async processPendingErrors() {
    if (!navigator.onLine || !this.reportToServer) {
      return 0;
    }

    try {
      const storedErrors = JSON.parse(
        localStorage.getItem('pendingErrorReports') || '[]'
      );

      if (storedErrors.length === 0) {
        return 0;
      }

      // Tentar enviar os erros pendentes
      let successCount = 0;

      for (const errorData of storedErrors) {
        try {
          const response = await fetch('/api/errors', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(errorData),
          });

          if (response.ok) {
            successCount++;
          }
        } catch (e) {
          console.warn(`Falha ao reenviar erro ${errorData.id}:`, e.message);
        }
      }

      // Atualizar a lista de erros pendentes
      if (successCount > 0) {
        const remainingErrors = storedErrors.slice(successCount);
        localStorage.setItem(
          'pendingErrorReports',
          JSON.stringify(remainingErrors)
        );
      }

      return successCount;
    } catch (e) {
      console.warn('Falha ao processar erros pendentes:', e.message);
      return 0;
    }
  }
}
