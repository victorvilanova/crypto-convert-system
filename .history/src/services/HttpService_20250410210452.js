export class HttpService {
  constructor(baseUrl, options = {}) {
    this.baseUrl = baseUrl;
    this.defaultTimeout = options.timeout || 10000; // 10 segundos como padrão
    this.maxRetries = options.maxRetries || 3;
    this.retryDelay = options.retryDelay || 1000;
    this.headers = options.headers || {
      'Content-Type': 'application/json',
    };
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
      const url = endpoint.startsWith('http')
        ? endpoint
        : `${this.baseUrl}${endpoint}`;

      // Adicionar timeout à requisição
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        options.timeout || this.defaultTimeout
      );

      // Combinar headers padrão com headers específicos da requisição
      const headers = { ...this.headers, ...(options.headers || {}) };

      // Adicionar signal do AbortController às opções
      const fetchOptions = {
        ...options,
        headers,
        signal: controller.signal,
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
          errorMessage =
            errorData.message ||
            errorData.error ||
            `Erro ${response.status}: ${response.statusText}`;
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

      // Implementar lógica de retry
      if (attempt < this.maxRetries) {
        // Delay exponencial para retentativas (exponential backoff)
        const delay = this.retryDelay * Math.pow(2, attempt - 1);
        console.warn(
          `Tentativa ${attempt} falhou. Tentando novamente em ${delay}ms...`
        );

        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.request(endpoint, options, attempt + 1);
      }

      // Se acabaram as tentativas, propagar o erro
      throw error;
    }
  }

  // Métodos de conveniência para diferentes verbos HTTP
  async get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  async post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }
}
