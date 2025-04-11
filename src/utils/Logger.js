/**
 * Níveis de log disponíveis
 * @enum {string}
 */
export const LogLevel = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
};

/**
 * Classe responsável pelo gerenciamento de logs da aplicação
 */
export class Logger {
  /**
   * @param {string} module - Nome do módulo que está utilizando o logger
   */
  constructor(module) {
    this.module = module;
    // Define o nível mínimo de log baseado no ambiente
    this.minLevel =
      CONFIG.environment === 'production' ? LogLevel.INFO : LogLevel.DEBUG;
  }

  /**
   * Registra um log com o nível, mensagem e dados especificados
   * @param {LogLevel} level - Nível do log
   * @param {string} message - Mensagem descritiva
   * @param {Object} [data] - Dados adicionais para o log
   * @private
   */
  _log(level, message, data) {
    // Se o nível for menor que o mínimo configurado, não registra
    if (!this._shouldLog(level)) return;

    const timestamp = new Date().toISOString();
    const logObject = {
      timestamp,
      level,
      module: this.module,
      message,
    };

    if (data) {
      logObject.data = data;
    }

    // Determina o método de console baseado no nível
    if (level === LogLevel.ERROR) {
      console.error(this._formatLog(logObject));
      this._sendToMonitoring(logObject); // Em produção enviaria para um serviço externo
    } else if (level === LogLevel.WARN) {
      console.warn(this._formatLog(logObject));
    } else if (level === LogLevel.INFO) {
      console.info(this._formatLog(logObject));
    } else {
      console.debug(this._formatLog(logObject));
    }
  }

  /**
   * Verifica se um determinado nível deve ser registrado
   * @param {LogLevel} level - Nível a verificar
   * @returns {boolean} - Se o nível deve ser registrado
   * @private
   */
  _shouldLog(level) {
    const levels = Object.values(LogLevel);
    const minLevelIndex = levels.indexOf(this.minLevel);
    const currentLevelIndex = levels.indexOf(level);

    return currentLevelIndex >= minLevelIndex;
  }

  /**
   * Formata um objeto de log para exibição
   * @param {Object} logObject - Objeto de log a ser formatado
   * @returns {string} - Log formatado
   * @private
   */
  _formatLog(logObject) {
    if (CONFIG.debugMode) {
      // Em modo de debug, mostra o log completo formatado
      return JSON.stringify(logObject, null, 2);
    }

    return JSON.stringify(logObject);
  }

  /**
   * Envia logs de erro para um serviço de monitoramento externo
   * @param {Object} logObject - Objeto de log a ser enviado
   * @private
   */
  _sendToMonitoring(logObject) {
    // Implementação para enviar logs para um serviço externo
    // Somente em produção para evitar custos desnecessários
    if (CONFIG.environment === 'production' && typeof window !== 'undefined') {
      // Exemplo simples usando navigator.sendBeacon para não bloquear a thread principal
      try {
        const endpoint = 'https://api.fastcripto.com/log';
        const blob = new Blob([JSON.stringify(logObject)], {
          type: 'application/json',
        });
        navigator.sendBeacon(endpoint, blob);
      } catch (error) {
        console.error('Falha ao enviar log para monitoramento:', error);
      }
    }
  }

  /**
   * Registra um log de nível DEBUG
   * @param {string} message - Mensagem descritiva
   * @param {Object} [data] - Dados adicionais
   */
  debug(message, data) {
    this._log(LogLevel.DEBUG, message, data);
  }

  /**
   * Registra um log de nível INFO
   * @param {string} message - Mensagem descritiva
   * @param {Object} [data] - Dados adicionais
   */
  info(message, data) {
    this._log(LogLevel.INFO, message, data);
  }

  /**
   * Registra um log de nível WARN
   * @param {string} message - Mensagem descritiva
   * @param {Object} [data] - Dados adicionais
   */
  warn(message, data) {
    this._log(LogLevel.WARN, message, data);
  }

  /**
   * Registra um log de nível ERROR
   * @param {string} message - Mensagem descritiva
   * @param {Error|Object} [error] - Erro ou dados adicionais
   */
  error(message, error) {
    let errorData = {};

    if (error instanceof Error) {
      errorData = {
        name: error.name,
        message: error.message,
        stack: error.stack,
        ...(error.data || {}),
      };
    } else if (error) {
      errorData = error;
    }

    this._log(LogLevel.ERROR, message, errorData);
  }
}
