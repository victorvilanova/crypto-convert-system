import { ErrorHandler } from '../utils/ErrorHandler';

/**
 * Serviço para realizar requisições HTTP
 */
export class HttpService {
  /**
   * @param {Object} options - Opções de configuração
   * @param {number} [options.timeout=30000] - Tempo limite para requisições em ms
   * @param {ErrorHandler} [options.errorHandler] - Manipulador de erros
   * @param {Function} [options.authTokenProvider] - Função que retorna o token de autenticação
   */
  constructor({ 
    timeout = 30000, 
    errorHandler = null,
    authTokenProvider = null 
  } = {}) {
    this.timeout = timeout;
    this.errorHandler = errorHandler || new ErrorHandler();
    this.authTokenProvider = authTokenProvider;
    this.baseHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  /**
   * Realiza uma requisição GET
   * @param {string} url - URL para requisição
   * @param {Object} [options] - Opções adicionais
   * @returns {Promise<any>} Resposta da requisição
   */
  async get(url, options = {}) {
    return this.request(url, { 
      method: 'GET', 
      ...options 
    });
  }

  /**
   * Realiza uma requisição POST
   * @param {string} url - URL para requisição
   * @param {Object} data - Dados a serem enviados
   * @param {Object} [options] - Opções adicionais
   * @returns {Promise<any>} Resposta da requisição
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
   * @param {string} url - URL para requisição
   * @param {Object} data - Dados a serem enviados
   * @param {Object} [options] - Opções adicionais
   * @returns {Promise<any>} Resposta da requisição
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
   * @param {string} url - URL para requisição
   * @param {Object} [options] - Opções adicionais
   * @returns {Promise<any>} Resposta da requisição
   */
  async delete(url, options = {}) {
    return this.request(url, { 
      method: 'DELETE', 
      ...options 
    });
  }

  /**
   * Método principal para realizar requisições HTTP
   * @param {string} url - URL da requisição
   * @param {Object} options - Opções da requisição
   * @returns {Promise<Object>} - Promessa com a resposta
   */
  async request(url, options = {}) {
    try {
      const requestId = Math.random().toString(36).substring(2);
      const fullUrl = this.buildUrl(url);
      
      // Preparar configuração da requisição
      const config = {
        method: options.method || 'GET',
        headers: this.buildHeaders(options.headers),
        signal: this.createAbortSignal(requestId, options.timeout),
        ...options
      };

      // Adicionar corpo à requisição se não for GET
      if (config.method !== 'GET' && options.data) {
        config.body = typeof options.data === 'string' 
          ? options.data
          : JSON.stringify(options.data);
      }

      // Executar interceptadores de requisição
      let modifiedConfig = { ...config };
      for (const interceptor of this.requestInterceptors) {
        modifiedConfig = await interceptor(fullUrl, modifiedConfig);
      }

      // Iniciar timestamp para cálculo de duração da requisição
      const startTime = Date.now();
      
      // Realizar a requisição
      const response = await fetch(fullUrl, modifiedConfig);
      
      // Calcular duração
      const duration = Date.now() - startTime;
      
      // Remover da lista de requisições pendentes
      this.pendingRequests.delete(requestId);
      
      // Processar resposta
      const processedResponse = await this.handleResponse(response, duration);
      
      // Executar interceptadores de resposta
      let modifiedResponse = { ...processedResponse };
      for (const interceptor of this.responseInterceptors) {
        modifiedResponse = await interceptor(modifiedResponse);
      }
      
      return modifiedResponse;
    } catch (error) {
      return this.handleError(error, url);
    }
  }

  /**
   * Constrói a URL completa para a requisição
   * @param {string} url - URL relativa ou absoluta
   * @returns {string} - URL completa
   * @private
   */
  buildUrl(url) {
    // Se a URL já for absoluta, retorná-la diretamente
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    
    // Remover barras duplicadas na junção de baseUrl e url
    const baseUrl = this.baseUrl.endsWith('/') ? this.baseUrl.slice(0, -1) : this.baseUrl;
    const relativeUrl = url.startsWith('/') ? url : `/${url}`;
    
    return `${baseUrl}${relativeUrl}`;
  }

  /**
   * Constrói os cabeçalhos para a requisição
   * @param {Object} [additionalHeaders] - Cabeçalhos adicionais
   * @returns {Object} - Cabeçalhos combinados
   * @private
   */
  buildHeaders(additionalHeaders = {}) {
    return {
      ...this.defaultHeaders,
      ...additionalHeaders
    };
  }

  /**
   * Cria um sinal de aborto para a requisição
   * @param {string} requestId - ID da requisição
   * @param {number} [customTimeout] - Tempo limite personalizado
   * @returns {AbortSignal} - Sinal de aborto
   * @private
   */
  createAbortSignal(requestId, customTimeout) {
    const controller = new AbortController();
    const timeout = customTimeout || this.timeout;
    
    // Armazenar controller para possível cancelamento posterior
    this.pendingRequests.set(requestId, controller);
    
    // Configurar timeout
    if (timeout > 0) {
      setTimeout(() => {
        if (this.pendingRequests.has(requestId)) {
          controller.abort(`Timeout de ${timeout}ms excedido`);
          this.pendingRequests.delete(requestId);
        }
      }, timeout);
    }
    
    return controller.signal;
  }

  /**
   * Processa a resposta da requisição
   * @param {Response} response - Resposta do fetch
   * @param {number} duration - Duração da requisição em ms
   * @returns {Promise<Object>} - Dados processados da resposta
   * @private
   */
  async handleResponse(response, duration) {
    const contentType = response.headers.get('content-type') || '';
    let data;
    
    // Extrair dados da resposta baseado no content-type
    if (contentType.includes('application/json')) {
      data = await response.json().catch(() => ({}));
    } else if (contentType.includes('text/')) {
      data = await response.text();
    } else {
      // Se for binário ou outro formato
      data = await response.blob();
    }
    
    // Criar objeto de resposta padronizado
    const result = {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      data,
      duration
    };
    
    // Se não for uma resposta de sucesso, lançar erro
    if (!response.ok) {
      const error = new Error(`HTTP Error ${response.status}: ${response.statusText}`);
      error.response = result;
      throw error;
    }
    
    return result;
  }

  /**
   * Trata erros ocorridos durante as requisições
   * @param {Error} error - Erro capturado
   * @param {string} url - URL da requisição que falhou
   * @returns {Promise<Object>} - Objeto de erro padronizado
   * @private
   */
  async handleError(error, url) {
    // Preparar objeto de erro padronizado
    const errorInfo = {
      ok: false,
      error: true,
      message: error.message || 'Erro desconhecido na requisição',
      url,
      // Se o erro foi gerado a partir de uma resposta, incluir detalhes
      ...(error.response || {})
    };
    
    // Determinar tipo de erro
    if (error.name === 'AbortError') {
      errorInfo.aborted = true;
      errorInfo.timeout = true;
      errorInfo.message = 'A requisição foi cancelada por timeout ou aborto manual';
    } else if (!navigator.onLine) {
      errorInfo.offline = true;
      errorInfo.message = 'Sem conexão com a internet';
    }
    
    // Registrar erro no manipulador
    if (this.errorHandler) {
      this.errorHandler.handleError(error, 'HttpService', false);
    }
    
    throw errorInfo;
  }

  /**
   * Adiciona um interceptador de requisição
   * @param {Function} interceptor - Função que recebe (url, config) e retorna config modificado
   * @returns {number} - Índice do interceptador para remoção posterior
   */
  addRequestInterceptor(interceptor) {
    return this.requestInterceptors.push(interceptor) - 1;
  }

  /**
   * Adiciona um interceptador de resposta
   * @param {Function} interceptor - Função que recebe response e retorna response modificado
   * @returns {number} - Índice do interceptador para remoção posterior
   */
  addResponseInterceptor(interceptor) {
    return this.responseInterceptors.push(interceptor) - 1;
  }

  /**
   * Remove um interceptador de requisição
   * @param {number} index - Índice do interceptador a ser removido
   */
  removeRequestInterceptor(index) {
    if (index >= 0 && index < this.requestInterceptors.length) {
      this.requestInterceptors.splice(index, 1);
    }
  }

  /**
   * Remove um interceptador de resposta
   * @param {number} index - Índice do interceptador a ser removido
   */
  removeResponseInterceptor(index) {
    if (index >= 0 && index < this.responseInterceptors.length) {
      this.responseInterceptors.splice(index, 1);
    }
  }

  /**
   * Cancela todas as requisições pendentes
   * @param {string} [reason] - Motivo do cancelamento
   */
  cancelAllRequests(reason = 'Cancelado pelo usuário') {
    for (const controller of this.pendingRequests.values()) {
      controller.abort(reason);
    }
    this.pendingRequests.clear();
  }

  /**
   * Configura um manipulador de erros
   * @param {ErrorHandler} errorHandler - Instância do manipulador de erros
   */
  setErrorHandler(errorHandler) {
    this.errorHandler = errorHandler;
  }
}