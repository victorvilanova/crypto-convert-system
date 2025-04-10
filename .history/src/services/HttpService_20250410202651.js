import { API } from '../constants.js';
import { ErrorHandler } from '../utils/ErrorHandler.js';

/**
 * Classe responsável por realizar requisições HTTP para APIs externas
 */
export class HttpService {
  /**
   * @param {Object} options - Opções de configuração
   * @param {string} [options.baseUrl] - URL base para as requisições
   * @param {number} [options.timeout] - Tempo limite em milissegundos
   * @param {number} [options.retryAttempts] - Número de tentativas em caso de falha
   * @param {number} [options.retryDelay] - Tempo entre tentativas em milissegundos
   * @param {Function} [options.errorHandler] - Manipulador de erros personalizado
   */
  constructor({
    baseUrl = API.DEFAULT_BASE_URL,
    timeout = 10000,
    retryAttempts = 3,
    retryDelay = 1000,
    errorHandler = null
  } = {}) {
    this.baseUrl = baseUrl;
    this.timeout = timeout;
    this.retryAttempts = retryAttempts;
    this.retryDelay = retryDelay;
    this.errorHandler = errorHandler || new ErrorHandler();
    
    // Lista de interceptadores de requisição
    this.interceptors = {
      request: [],
      response: []
    };
    
    // Contador de requisições ativas
    this.activeRequests = 0;
  }

  /**
   * Realiza uma requisição GET
   * @param {string} endpoint - Endpoint da requisição
   * @param {Object} [params] - Parâmetros da query string
   * @param {Object} [options] - Opções adicionais para a requisição
   * @returns {Promise<any>} Resposta da requisição
   */
  async get(endpoint, params = {}, options = {}) {
    const url = this.buildUrl(endpoint, params);
    return this.request(url, { method: 'GET', ...options });
  }

  /**
   * Realiza uma requisição POST
   * @param {string} endpoint - Endpoint da requisição
   * @param {Object} data - Dados a serem enviados
   * @param {Object} [options] - Opções adicionais para a requisição
   * @returns {Promise<any>} Resposta da requisição
   */
  async post(endpoint, data = {}, options = {}) {
    const url = this.buildUrl(endpoint);
    const config = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data),
      ...options
    };
    
    return this.request(url, config);
  }

  /**
   * Realiza uma requisição PUT
   * @param {string} endpoint - Endpoint da requisição
   * @param {Object} data - Dados a serem enviados
   * @param {Object} [options] - Opções adicionais para a requisição
   * @returns {Promise<any>} Resposta da requisição
   */
  async put(endpoint, data = {}, options = {}) {
    const url = this.buildUrl(endpoint);
    const config = {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data),
      ...options
    };
    
    return this.request(url, config);
  }

  /**
   * Realiza uma requisição DELETE
   * @param {string} endpoint - Endpoint da requisição
   * @param {Object} [options] - Opções adicionais para a requisição
   * @returns {Promise<any>} Resposta da requisição
   */
  async delete(endpoint, options = {}) {
    const url = this.buildUrl(endpoint);
    const config = {
      method: 'DELETE',
      ...options
    };
    
    return this.request(url, config);
  }

  /**
   * Constrói a URL para uma requisição
   * @param {string} endpoint - Endpoint da requisição
   * @param {Object} [params] - Parâmetros da query string
   * @returns {string} URL completa
   * @private
   */
  buildUrl(endpoint, params = {}) {
    // Garantir que o baseUrl não termina com / e o endpoint não começa com /
    const baseUrl = this.baseUrl.endsWith('/') ? this.baseUrl.slice(0, -1) : this.baseUrl;
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    
    // Construir a URL base
    let url = `${baseUrl}${normalizedEndpoint}`;
    
    // Adicionar parâmetros de query string se houver
    if (Object.keys(params).length > 0) {
      const queryParams = new URLSearchParams();
      
      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          queryParams.append(key, value);
        }
      });
      
      const queryString = queryParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }
    
    return url;
  }

  /**
   * Realiza uma requisição HTTP genérica
   * @param {string} url - URL da requisição
   * @param {Object} [options] - Opções da requisição
   * @returns {Promise<any>} Resposta da requisição
   * @private
   */
  async request(url, options = {}) {
    // Aplicar interceptadores de requisição
    let config = { ...options };
    for (const interceptor of this.interceptors.request) {
      config = await interceptor(config);
    }
    
    // Adicionar timeout à requisição
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    
    config.signal = controller.signal;
    
    // Incrementar contador de requisições ativas
    this.activeRequests++;
    
    let currentAttempt = 0;
    let lastError = null;
    
    while (currentAttempt < this.retryAttempts) {
      try {
        // Realizar requisição
        const response = await fetch(url, config);
        
        // Processar resposta
        const result = await this.handleResponse(response);
        
        // Aplicar interceptadores de resposta
        let processedResult = result;
        for (const interceptor of this.interceptors.response) {
          processedResult = await interceptor(processedResult, response);
        }
        
        // Limpar timeout e decrementar contador
        clearTimeout(timeoutId);
        this.activeRequests--;
        
        return processedResult;
      } catch (error) {
        lastError = error;
        
        // Se é uma falha de timeout ou rede e ainda temos tentativas, tentar novamente
        if ((error.name === 'AbortError' || error.message.includes('network')) && 
            currentAttempt < this.retryAttempts - 1) {
          currentAttempt++;
          
          // Aguardar antes de tentar novamente
          await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        } else {
          // Se chegamos ao limite de tentativas ou é outro tipo de erro, interromper
          break;
        }
      }
    }
    
    // Limpar timeout e decrementar contador
    clearTimeout(timeoutId);
    this.activeRequests--;
    
    // Tratar o erro final
    return this.handleError(lastError, url);
  }

  /**
   * Processa a resposta da requisição
   * @param {Response} response - Objeto de resposta do fetch
   * @returns {Promise<any>} Dados da resposta processados
   * @private
   */
  async handleResponse(response) {
    // Verificar se a resposta foi bem-sucedida
    if (!response.ok) {
      const errorData = await this.tryParseJSON(response);
      throw new Error(
        errorData?.message || 
        errorData?.error || 
        `Erro ${response.status}: ${response.statusText}`
      );
    }
    
    // Verificar o tipo de conteúdo
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    } else if (contentType && contentType.includes('text/')) {
      return response.text();
    } else {
      // Para outros tipos, retornar o objeto de resposta completo
      return response;
    }
  }

  /**
   * Tenta fazer parse de um corpo de resposta como JSON
   * @param {Response} response - Objeto de resposta do fetch
   * @returns {Promise<Object|null>} Dados JSON ou null se falhar
   * @private
   */
  async tryParseJSON(response) {
    try {
      return await response.json();
    } catch (e) {
      return null;
    }
  }

  /**
   * Manipula um erro de requisição
   * @param {Error} error - Objeto de erro
   * @param {string} url - URL da requisição que falhou
   * @returns {Promise<null>} Sempre retorna null após processar o erro
   * @private
   */
  async handleError(error, url) {
    // Personalizar mensagem de erro
    let errorMessage = error.message;
    
    if (error.name === 'AbortError') {
      errorMessage = `Tempo limite excedido ao acessar ${url}`;
    } else if (!navigator.onLine) {
      errorMessage = 'Sem conexão com a Internet. Verifique sua conexão e tente novamente.';
    }
    
    // Usar o manipulador de erros
    this.errorHandler.handleError(
      error,
      'HTTP Request',
      true // Notificar usuário sobre erros de rede
    );
    
    // Retornar null para indicar falha
    return null;
  }

  /**
   * Adiciona um interceptador de requisição
   * @param {Function} interceptor - Função que recebe e modifica a configuração
   */
  addRequestInterceptor(interceptor) {
    if (typeof interceptor === 'function') {
      this.interceptors.request.push(interceptor);
    }
  }

  /**
   * Adiciona um interceptador de resposta
   * @param {Function} interceptor - Função que recebe e modifica a resposta
   */
  addResponseInterceptor(interceptor) {
    if (typeof interceptor === 'function') {
      this.interceptors.response.push(interceptor);
    }
  }

  /**
   * Remove todos os interceptadores
   */
  clearInterceptors() {
    this.interceptors.request = [];
    this.interceptors.response = [];
  }

  /**
   * Verifica se há requisições ativas
   * @returns {boolean} Se há requisições em andamento
   */
  hasActiveRequests() {
    return this.activeRequests > 0;
  }

  /**
   * Altera a URL base das requisições
   * @param {string} newBaseUrl - Nova URL base
   */
  setBaseUrl(newBaseUrl) {
    if (newBaseUrl) {
      this.baseUrl = newBaseUrl;
    }
  }

  /**
   * Altera o timeout das requisições
   * @param {number} newTimeout - Novo valor de timeout em milissegundos
   */
  setTimeout(newTimeout) {
    if (typeof newTimeout === 'number' && newTimeout > 0) {
      this.timeout = newTimeout;
    }
  }
}