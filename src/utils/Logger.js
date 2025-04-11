/**
 * Níveis de log disponíveis
 * @enum {string}
 */
import winston from 'winston';

export const LogLevel = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
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
      CONFIG && CONFIG.environment === 'production' ? LogLevel.INFO : LogLevel.DEBUG;
    
    // Configuração do Winston logger
    this.logger = winston.createLogger({
      level: this.minLevel,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      defaultMeta: { module },
      transports: [
        // Escreve todos os logs para o console
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.printf(({ timestamp, level, message, module, data }) => {
              let log = `${timestamp} [${level}] [${module}]: ${message}`;
              if (data) {
                log += ` | ${JSON.stringify(data)}`;
              }
              return log;
            })
          ),
        }),
      ],
    });
    
    // Adiciona transporte para erros em produção
    if (CONFIG && CONFIG.environment === 'production') {
      // Aqui poderia adicionar transporte para um serviço de logs externo
      // como Sentry, LogRocket, etc.
    }
  }

  /**
   * Registra um log com o nível, mensagem e dados especificados
   * @param {LogLevel} level - Nível do log
   * @param {string} message - Mensagem descritiva
   * @param {Object} [data] - Dados adicionais para o log
   * @private
   */
  _log(level, message, data) {
    this.logger.log(level, message, { data });
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

// Exportando uma instância para uso global
export const logger = new Logger('app');

// Função auxiliar para criar instâncias de logger específicas para cada módulo
export function getLogger(module) {
  return new Logger(module);
}
