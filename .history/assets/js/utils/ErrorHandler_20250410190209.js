/**
 * ErrorHandler.js
 * Utilitário para gerenciar erros da aplicação
 */
export default class ErrorHandler {
  constructor() {
    this.errorTypes = {
      API_ERROR: 'api_error',
      VALIDATION_ERROR: 'validation_error',
      CONVERSION_ERROR: 'conversion_error',
      NETWORK_ERROR: 'network_error',
      UNKNOWN_ERROR: 'unknown_error',
    };
  }

  /**
   * Processa um erro e retorna um objeto de erro formatado
   * @param {Error} error - O erro original
   * @param {string} context - O contexto onde o erro ocorreu
   * @returns {Object} Objeto de erro formatado
   */
  handleError(error, context = '') {
    // Determina o tipo de erro
    const errorType = this.determineErrorType(error);

    // Registra erro no console com informações adicionais
    console.error(`[${context}] ${errorType}:`, error);

    // Retorna um objeto de erro formatado e amigável
    return {
      type: errorType,
      message: this.getUserFriendlyMessage(error, errorType),
      originalError: error,
      timestamp: new Date(),
    };
  }

  /**
   * Determina o tipo de erro
   * @param {Error} error - O erro a ser analisado
   * @returns {string} O tipo de erro
   */
  determineErrorType(error) {
    const { errorTypes } = this;

    if (!navigator.onLine) {
      return errorTypes.NETWORK_ERROR;
    }

    if (
      error.message.includes('API error') ||
      error.message.includes('fetch')
    ) {
      return errorTypes.API_ERROR;
    }

    if (error.message.includes('conversão') || error.message.includes('taxa')) {
      return errorTypes.CONVERSION_ERROR;
    }

    if (error.message.includes('válido') || error.message.includes('informe')) {
      return errorTypes.VALIDATION_ERROR;
    }

    return errorTypes.UNKNOWN_ERROR;
  }

  /**
   * Obtém uma mensagem de erro amigável para o usuário
   * @param {Error} error - O erro original
   * @param {string} errorType - O tipo de erro
   * @returns {string} Mensagem de erro amigável
   */
  getUserFriendlyMessage(error, errorType) {
    const { errorTypes } = this;

    const errorMessages = {
      [errorTypes.API_ERROR]:
        'Não foi possível comunicar com o servidor de taxas. Tente novamente mais tarde.',
      [errorTypes.VALIDATION_ERROR]: error.message,
      [errorTypes.CONVERSION_ERROR]:
        'Não foi possível realizar a conversão com os valores informados.',
      [errorTypes.NETWORK_ERROR]:
        'Você parece estar offline. Verifique sua conexão com a internet.',
      [errorTypes.UNKNOWN_ERROR]:
        'Ocorreu um erro inesperado. Por favor, tente novamente.',
    };

    return errorMessages[errorType] || error.message;
  }
}
