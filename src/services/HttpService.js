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
   * @param {string} url - URL para requisição
   * @param {Object} options - Opções da requisição
   * @returns {Promise<any>} Resposta processada da requisição
   */
  async request(url, options = {}) {
    const headers = this._prepareHeaders(options.headers);
    
    const config = {
      method: options.method || 'GET',
      headers: headers,
      body: options.body,
      signal: options.signal || (this.timeout ? AbortSignal.timeout(this.timeout) : undefined)
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const error = await this._handleErrorResponse(response);
        return Promise.reject(error);
      }
      
      // Verifica se a resposta está vazia
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      } else {
        return await response.text();
      }
    } catch (error) {
      // Tratamento de erros de rede ou timeout
      const enhancedError = this.errorHandler.handleNetworkError(error, url);
      return Promise.reject(enhancedError);
    }
  }

  /**
   * Prepara os cabeçalhos HTTP da requisição
   * @private
   * @param {Object} customHeaders - Cabeçalhos personalizados
   * @returns {Object} Cabeçalhos mesclados
   */
  _prepareHeaders(customHeaders = {}) {
    const headers = { ...this.baseHeaders, ...customHeaders };
    
    // Adiciona token de autenticação se disponível
    if (this.authTokenProvider) {
      const token = this.authTokenProvider();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }
    
    return headers;
  }

  /**
   * Processa respostas de erro
   * @private
   * @param {Response} response - Resposta HTTP com erro
   * @returns {Error} Erro processado
   */
  async _handleErrorResponse(response) {
    let errorData;
    try {
      errorData = await response.json();
    } catch (e) {
      errorData = await response.text();
    }
    
    return this.errorHandler.handleHttpError({
      status: response.status,
      statusText: response.statusText,
      url: response.url,
      data: errorData
    });
  }
}