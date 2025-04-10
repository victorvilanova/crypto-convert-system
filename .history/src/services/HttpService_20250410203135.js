import { ErrorHandler } from '../utils/ErrorHandler';

/**
 * Serviço responsável pela comunicação HTTP com APIs externas
 */
export class HttpService {
  /**
   * @param {Object} options - Opções de configuração
   * @param {string} [options.baseUrl] - URL base para todas as requisições
   * @param {Object} [options.defaultHeaders] - Cabeçalhos padrão para todas as requisições
   * @param {number} [options.timeout] - Tempo limite em ms para requisições
   * @param {ErrorHandler} [options.errorHandler] - Manipulador de erros
   * @param {Function} [options.authProvider] - Provedor de tokens de autenticação
   * @param {boolean} [options.enableCache] - Habilitar cache de respostas
   */
  constructor({
    baseUrl = '',
    defaultHeaders = {},
    timeout = 30000,
    errorHandler = null,
    authProvider = null,
    enableCache = false
  } = {}) {
    this.baseUrl = baseUrl;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...defaultHeaders
    };
    this.timeout = timeout;
    this.errorHandler = errorHandler || new ErrorHandler();
    this.authProvider = authProvider;
    this.enableCache = enableCache;
    this.cache = new Map();
    this.cacheTTL = 5 * 60 * 1000; // 5 minutos em milissegundos
    this.pendingRequests = new Map();
  }

  /**
   * Realiza uma requisição GET
   * @param {string} endpoint - Endpoint da API
   * @param {Object} [options] - Opções adicionais
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
   * @param {Object} [options] - Opções adicionais
   * @returns {Promise<any>} Dados da resposta
   */
  async post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      ...options
    });
  }

  /**
   * Realiza uma requisição PUT
   * @param {string} endpoint - Endpoint da API
   * @param {Object} data - Dados a serem enviados
   * @param {Object} [options] - Opções adicionais
   * @returns {Promise<any>} Dados da resposta
   */
  async put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
      ...options
    });
  }

  /**
   * Realiza uma requisição DELETE
   * @param {string} endpoint - Endpoint da API
   * @param {Object} [options] - Opções adicionais
   * @returns {Promise<any>} Dados da resposta
   */
  async delete(endpoint, options = {}) {
    return this.request(endpoint, {
      method: 'DELETE',
      ...options
    });
  }

  /**
   * Realiza uma requisição HTTP genérica
   * @param {string} endpoint - Endpoint da API
   * @param {Object} options - Opções da requisição
   * @returns {Promise<any>} Dados da resposta
   */
  async request(endpoint, options = {}) {
    const method = options.method || 'GET';
    const url = this.resolveUrl(endpoint);
    const cacheKey = this.getCacheKey(url, method, options.body);
    
    // Verificar cache para requisições GET
    if (this.enableCache && method === 'GET') {
      const cachedResponse = this.getFromCache(cacheKey);
      if (cachedResponse) {
        return cachedResponse;
      }
    }
    
    // Verificar se existe uma requisição pendente idêntica
    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey);
    }
    
    // Preparar cabeçalhos
    const headers = await this.prepareHeaders(options.headers);
    
    // Configurar o timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeout || this.timeout);
    
    // Preparar opções da requisição
    const fetchOptions = {
      method,
      headers,
      signal: controller.signal,
      ...options
    };
    
    // Remover opções que não pertencem ao fetch
    delete fetchOptions.timeout;
    
    // Criar a Promise da requisição
    const requestPromise = (async () => {
      try {
        const response = await fetch(url, fetchOptions);
        clearTimeout(timeoutId);
        
        // Processar resposta
        const processedResponse = await this.processResponse(response, url);
        
        // Adicionar ao cache, se aplicável
        if (this.enableCache && method === 'GET') {
          this.addToCache(cacheKey, processedResponse);
        }
        
        // Remover dos pedidos pendentes
        this.pendingRequests.delete(cacheKey);
        
        return processedResponse;
      } catch (error) {
        clearTimeout(timeoutId);
        this.pendingRequests.delete(cacheKey);
        
        // Tratar erros específicos
        if (error.name === 'AbortError') {
          const timeoutError = new Error(`Tempo limite excedido (${this.timeout}ms): ${url}`);
          timeoutError.name = 'TimeoutError';
          
          this.errorHandler.handleError(timeoutError, 'HttpService', false);
          throw timeoutError;
        }
        
        this.errorHandler.handleError(error, 'HttpService', false);
        throw error;
      }
    })();
    
    // Registrar a requisição pendente
    this.pendingRequests.set(cacheKey, requestPromise);
    
    return requestPromise;
  }

  /**
   * Resolve a URL completa com base no endpoint
   * @param {string} endpoint - Endpoint da API
   * @returns {string} URL completa
   * @private
   */
  resolveUrl(endpoint) {
    if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
      return endpoint;
    }
    
    const base = this.baseUrl.endsWith('/') ? this.baseUrl.slice(0, -1) : this.baseUrl;
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    
    return `${base}${path}`;
  }

  /**
   * Prepara os cabeçalhos HTTP para uma requisição
   * @param {Object} additionalHeaders - Cabeçalhos adicionais
   * @returns {Promise<Object>} Cabeçalhos completos
   * @private
   */
  async prepareHeaders(additionalHeaders = {}) {
    const headers = { ...this.defaultHeaders, ...additionalHeaders };
    
    // Adicionar token de autenticação se o provedor estiver disponível
    if (this.authProvider) {
      try {
        const token = await this.authProvider();
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      } catch (error) {
        this.errorHandler.handleError(error, 'HttpService:Auth', false);
      }
    }
    
    return headers;
  }

  /**
   * Processa a resposta HTTP
   * @param {Response} response - Objeto de resposta HTTP
   * @param {string} url - URL da requisição
   * @returns {Promise<any>} Dados processados
   * @private
   */
  async processResponse(response, url) {
    const contentType = response.headers.get('Content-Type') || '';
    
    // Verificar se a resposta é bem-sucedida
    if (!response.ok) {
      let errorData;
      
      try {
        if (contentType.includes('application/json')) {
          errorData = await response.json();
        } else {
          errorData = await response.text();
        }
      } catch (e) {
        errorData = 'Não foi possível ler o corpo da resposta';
      }
      
      const error = new Error(`HTTP Error ${response.status}: ${response.statusText}`);
      error.status = response.status;
      error.statusText = response.statusText;
      error.url = url;
      error.data = errorData;
      
      throw error;
    }
    
    // Processar o corpo da resposta conforme o tipo de conteúdo
    if (contentType.includes('application/json')) {
      return response.json();
    } else if (contentType.includes('text/')) {
      return response.text();
    } else if (contentType.includes('multipart/form-data')) {
      return response.formData();
    } else if (contentType.includes('application/octet-stream')) {
      return response.blob();
    }
    
    // Formato desconhecido, tentar JSON primeiro, depois texto
    try {
      return await response.json();
    } catch (e) {
      return response.text();
    }
  }

  /**
   * Gera uma chave de cache para uma requisição
   * @param {string} url - URL da requisição
   * @param {string} method - Método HTTP
   * @param {string} [body] - Corpo da requisição
   * @returns {string} Chave de cache
   * @private
   */
  getCacheKey(url, method, body) {
    const bodyHash = body ? this.hashString(body) : '';
    return `${method}-${url}-${bodyHash}`;
  }

  /**
   * Gera um hash simples de uma string
   * @param {string} str - String para gerar hash
   * @returns {string} Hash da string
   * @private
   */
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Converter para um número de 32 bits
    }
    return hash.toString(16);
  }

  /**
   * Obtém um item do cache
   * @param {string} key - Chave do cache
   * @returns {any|null} Item do cache ou null se não existir/expirado
   * @private
   */
  getFromCache(key) {
    if (!this.cache.has(key)) {
      return null;
    }
    
    const { data, timestamp } = this.cache.get(key);
    const now = Date.now();
    
    // Verificar se o item expirou
    if (now - timestamp > this.cacheTTL) {
      this.cache.delete(key);
      return null;
    }
    
    return JSON.parse(JSON.stringify(data)); // Deep clone para evitar mutações
  }

  /**
   * Adiciona um item ao cache
   * @param {string} key - Chave do cache
   * @param {any} data - Dados a serem armazenados
   * @private
   */
  addToCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
    
    // Limitar o tamanho do cache (opcional)
    if (this.cache.size > 100) { // Limite arbitrário
      // Remover o item mais antigo
      const oldestKey = [...this.cache.entries()]
        .sort((a, b) => a[1].timestamp - b[1].timestamp)[0][0];
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Limpa o cache
   * @param {string} [urlPattern] - Padrão de URL para limpar cache seletivamente
   */
  clearCache(urlPattern) {
    if (!urlPattern) {
      this.cache.clear();
      return;
    }
    
    // Limpar cache seletivamente
    for (const key of this.cache.keys()) {
      if (key.includes(urlPattern)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Define o tempo de vida dos itens em cache
   * @param {number} milliseconds - Tempo em milissegundos
   */
  setCacheTTL(milliseconds) {
    this.cacheTTL = milliseconds;
  }

  /**
   * Habilita ou desabilita o cache
   * @param {boolean} enable - Se deve habilitar o cache
   */
  toggleCache(enable) {
    this.enableCache = enable;
    if (!enable) {
      this.cache.clear();
    }
  }

  /**
   * Define a URL base para todas as requisições
   * @param {string} url - Nova URL base
   */
  setBaseUrl(url) {
    this.baseUrl = url;
  }

  /**
   * Define os cabeçalhos padrão para todas as requisições
   * @param {Object} headers - Novos cabeçalhos padrão
   * @param {boolean} [merge=true] - Se deve mesclar com os cabeçalhos existentes
   */
  setDefaultHeaders(headers, merge = true) {
    if (merge) {
      this.defaultHeaders = {
        ...this.defaultHeaders,
        ...headers
      };
    } else {
      this.defaultHeaders = headers;
    }
  }

  /**
   * Cancela todas as requisições pendentes
   */
  cancelAllRequests() {
    this.pendingRequests.clear();
  }
}