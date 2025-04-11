import { API } from '../constants.js';
import { ErrorHandler } from '../utils/ErrorHandler.js';

/**
 * Serviço para realizar requisições HTTP com tratamento de erro e retentativas
 */
export class HttpService {
  /**
   * @param {Object} options - Opções de configuração
   * @param {ErrorHandler} options.errorHandler - Instância do manipulador de erros
   */
  constructor({ errorHandler } = {}) {
    this.errorHandler = errorHandler || new ErrorHandler();
    this.baseUrl = API.BASE_URL;
    this.defaultTimeout = API.DEFAULT_TIMEOUT;
    this.retryAttempts = API.RETRY_ATTEMPTS;
    this.retryDelay = API.RETRY_DELAY;
  }

  /**
   * Realiza uma requisição GET
   * @param {string} endpoint - Endpoint da API
   * @param {Object} options - Opções adicionais
   * @returns {Promise<any>} Dados da resposta
   */
  async get(endpoint, options = {}) {
    return this.request(endpoint, { 
      method: 'GET', 
      ...options 
    });
  }

  /**
   * Realiza uma requisição POST
   * @param {string} endpoint - Endpoint da API
   * @param {Object} data - Dados a serem enviados
   * @param {Object} options - Opções adicionais
   * @returns {Promise<any>} Dados da resposta
   */
  async post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
  }

  /**
   * Realiza requisição HTTP com retentativas e tratamento de erro
   * @param {string} endpoint - Endpoint da API
   * @param {Object} options - Opções do fetch
   * @param {number} attempt - Contador de tentativas (interno)
   * @returns {Promise<any>} Dados da resposta
   * @private
   */
  async request(endpoint, options = {}, attempt = 1) {
    try {
      const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
      
      // Adicionar timeout à requisição
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), options.timeout || this.defaultTimeout);
      
      // Adicionar signal do AbortController às opções
      const fetchOptions = {
        ...options,
        signal: controller.signal
      };
      
      // Realizar a requisição
      const response = await fetch(url, fetchOptions);
      
      // Limpar o timeout
      clearTimeout(timeoutId);
      
      // Verificar se a resposta foi bem-sucedida
      if (!response.ok) {
        // Extrair mensagem de erro da resposta, se disponível
        let errorMessage;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || `Erro ${response.status}: ${response.statusText}`;
        } catch (e) {
          errorMessage = `Erro ${response.status}: ${response.statusText}`;
        }
        
        throw new Error(errorMessage);
      }
      
      // Para respostas vazias (204 No Content)
      if (response.status === 204) {
        return null;
      }
      
      // Parsear resposta como JSON
      return await response.json();
    } catch (error) {
      // Tratar erros de timeout
      if (error.name === 'AbortError') {
        error = new Error('Timeout ao conectar ao servidor');
      }
      
      // Realizar retentativa se ainda houver tentativas disponíveis
      if (attempt < this.retryAttempts && this.shouldRetry(error)) {
        // Esperar antes de tentar novamente (backoff exponencial)
        const delay = this.retryDelay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Tentar novamente
        return this.request(endpoint, options, attempt + 1);
      }
      
      // Registrar erro no manipulador de erros
      this.errorHandler.handleError(error, 'Erro de requisição HTTP', false);
      
      // Propagar o erro
      throw error;
    }
  }

  /**
   * Determina se uma requisição deve ser repetida com base no erro
   * @param {Error} error - Erro ocorrido
   * @returns {boolean} Se deve tentar novamente
   * @private
   */
  shouldRetry(error) {
    // Não repetir erros de cliente (4xx)
    if (error.message.includes('400') || 
        error.message.includes('401') || 
        error.message.includes('403') || 
        error.message.includes('404')) {
      return false;
    }
    
    // Repetir erros de conexão e servidor (5xx)
    return error.message.includes('Failed to fetch') || 
           error.message.includes('NetworkError') ||
           error.message.includes('500') || 
           error.message.includes('502') || 
           error.message.includes('503') || 
           error.message.includes('504');
  }
  
  /**
   * Define a URL base para as requisições
   * @param {string} url - Nova URL base
   */
  setBaseUrl(url) {
    this.baseUrl = url;
  }
  
  /**
   * Define o timeout padrão para requisições
   * @param {number} timeout - Timeout em milissegundos
   */
  setTimeout(timeout) {
    this.defaultTimeout = timeout;
  }
  
  /**
   * Define o número de tentativas para requisições que falham
   * @param {number} attempts - Número de tentativas
   */
  setRetryAttempts(attempts) {
    this.retryAttempts = attempts;
  }
}