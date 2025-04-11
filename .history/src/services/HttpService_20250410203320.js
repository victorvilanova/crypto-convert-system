import { ErrorHandler } from '../utils/ErrorHandler';

/**
 * Serviço para realizar requisições HTTP
 * Encapsula a lógica de comunicação com APIs externas
 */
export class HttpService {
  /**
   * @param {Object} config - Configurações do serviço
   * @param {string} [config.baseUrl=''] - URL base para as requisições
   * @param {Object} [config.defaultHeaders={}] - Cabeçalhos padrão
   * @param {number} [config.timeout=30000] - Tempo limite em ms
   * @param {ErrorHandler} [config.errorHandler] - Manipulador de erros
   */
  constructor({
    baseUrl = '',
    defaultHeaders = {},
    timeout = 30000,
    errorHandler = null
  } = {}) {
    this.baseUrl = baseUrl;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...defaultHeaders
    };
    this.timeout = timeout;
    this.errorHandler = errorHandler || new ErrorHandler();
    this.pendingRequests = new Map();
    this.requestId = 1;
  }

  /**
   * Realiza uma requisição GET
   * @param {string} url - URL relativa ou absoluta
   * @param {Object} [options] - Opções adicionais
   * @returns {Promise<any>} Dados da resposta
   */
  async get(url, options = {}) {
    return this.request(url, { method: 'GET', ...options });
  }

  /**
   * Realiza uma requisição POST
   * @param {string} url - URL relativa ou absoluta
   * @param {Object} data - Dados a serem enviados
   * @param {Object} [options] - Opções adicionais
   * @returns {Promise<any>} Dados da resposta
   */
  async post(url, data, options = {}) {
    return this.request(url, {
      method: 'POST',
      body: JSON.stringify(data),
      ...options
    });
  }

  /**
   * Realiza uma requisição PUT
   * @param {string} url - URL relativa ou absoluta
   * @param {Object} data - Dados a serem enviados
   * @param {Object} [options] - Opções adicionais
   * @returns {Promise<any>} Dados da resposta
   */
  async put(url, data, options = {}) {
    return this.request(url, {
      method: 'PUT',
      body: JSON.stringify(data),
      ...options
    });
  }

  /**
   * Realiza uma requisição DELETE
   * @param {string} url - URL relativa ou absoluta
   * @param {Object} [options] - Opções adicionais
   * @returns {Promise<any>} Dados da resposta
   */
  async delete(url, options = {}) {
    return this.request(url, { method: 'DELETE', ...options });
  }

  /**
   * Método principal para realizar requisições HTTP
   * @param {string} url - URL relativa ou absoluta
   * @param {Object} options - Opções da requisição
   * @returns {Promise<any>} Dados da resposta
   */
  async request(url, options = {}) {
    // Construir a URL completa
    const fullUrl = this.buildUrl(url);
    
    // Criar objeto de configuração da requisição
    const requestOptions = {
      method: options.method || 'GET',
      headers: { ...this.defaultHeaders, ...options.headers },
      ...options
    };

    // Gerar um ID único para esta requisição
    const reqId = this.requestId++;
    
    // Criar o controlador de abort para timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, options.timeout || this.timeout);
    
    requestOptions.signal = controller.signal;
    
    // Registrar esta requisição
    this.pendingRequests.set(reqId, { url: fullUrl, options: requestOptions });
    
    try {
      // Realizar a requisição
      const response = await fetch(fullUrl, requestOptions);
      
      // Limpar o timeout
      clearTimeout(timeoutId);
      
      // Remover dos pendentes
      this.pendingRequests.delete(reqId);
      
      // Processar a resposta
      return this.handleResponse(response);
    } catch (error) {
      // Limpar o timeout
      clearTimeout(timeoutId);
      
      // Remover dos pendentes
      this.pendingRequests.delete(reqId);
      
      // Tratar erro
      return this.handleError(error, fullUrl);
    }
  }

  /**
   * Constrói a URL completa
   * @param {string} url - URL relativa ou absoluta
   * @returns {string} URL completa
   * @private
   */
  buildUrl(url) {
    // Se for uma URL absoluta, retornar diretamente
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    
    // Remover barras duplicadas
    const baseUrl = this.baseUrl.endsWith('/') ? this.baseUrl.slice(0, -1) : this.baseUrl;
    const normalizedPath = url.startsWith('/') ? url : `/${url}`;
    
    return `${baseUrl}${normalizedPath}`;
  }

  /**
   * Processa a resposta HTTP
   * @param {Response} response - Objeto de resposta fetch
   * @returns {Promise<any>} Dados da resposta
   * @private
   */
  async handleResponse(response) {
    const contentType = response.headers.get('Content-Type') || '';
    let data;
    
    // Determinar o tipo de resposta e parsear de acordo
    if (contentType.includes('application/json')) {
      data = await response.json();
    } else if (contentType.includes('text/')) {
      data = await response.text();
    } else {
      // Para binários ou outros tipos
      data = await response.blob();
    }
    
    // Verificar se a resposta foi bem sucedida
    if (response.ok) {
      return data;
    }
    
    // Se não foi bem sucedida, tratar como erro
    const error = new Error(
      data.message || data.error || `Erro ${response.status}: ${response.statusText}`
    );
    error.status = response.status;
    error.statusText = response.statusText;
    error.data = data;
    error.response = response;
    
    throw error;
  }

  /**
   * Trata erros de requisição
   * @param {Error} error - Erro ocorrido
   * @param {string} url - URL da requisição
   * @returns {Promise<never>} Promise rejeitada com erro tratado
   * @private
   */
  handleError(error, url) {
    // Personalizar mensagem de erro baseado no tipo
    let message = error.message;
    
    if (error.name === 'AbortError') {
      message = `A requisição para ${url} excedeu o tempo limite.`;
    } else if (!navigator.onLine) {
      message = 'Sem conexão com a internet. Verifique sua conexão e tente novamente.';
    }
    
    // Criar erro personalizado
    const customError = new Error(message);
    customError.originalError = error;
    customError.url = url;
    
    // Registrar no manipulador de erros
    this.errorHandler.handleError(customError, 'HttpService');
    
    // Rejeitar a promise
    return Promise.reject(customError);
  }

  /**
   * Cancela todas as requisições pendentes
   */
  cancelAllRequests() {
    this.pendingRequests.forEach((request) => {
      if (request.options.signal && !request.options.signal.aborted) {
        request.options.signal.abort();
      }
    });
    
    this.pendingRequests.clear();
  }

  /**
   * Configura interceptores para requisições
   * @param {Function} requestInterceptor - Função que modifica as opções de requisição
   * @param {Function} responseInterceptor - Função que processa a resposta
   */
  setInterceptors(requestInterceptor, responseInterceptor) {
    this.requestInterceptor = requestInterceptor;
    this.responseInterceptor = responseInterceptor;
  }
}