/**
 * Serviço para integração com múltiplas APIs de criptomoedas
 */
export class MultiSourceApiService {
  /**
   * @param {Object} options - Opções de configuração
   * @param {Object} options.apiKeys - Chaves de API para diferentes provedores
   * @param {Array} options.apiPriority - Ordem de prioridade das APIs
   * @param {Object} options.cacheService - Serviço de cache opcional
   * @param {number} options.timeout - Tempo limite para requisições em ms
   * @param {number} options.maxRetries - Número máximo de tentativas
   */
  constructor(options = {}) {
    const {
      apiKeys = {},
      apiPriority = [
        'coinGecko',
        'coinMarketCap',
        'binance',
        'coinglass',
        'coinapi',
      ],
      cacheService = null,
      timeout = 10000,
      maxRetries = 2,
    } = options;

    this.apiKeys = apiKeys;
    this.apiPriority = apiPriority;
    this.cacheService = cacheService;
    this.timeout = timeout;
    this.maxRetries = maxRetries;
    this.availableApis = this._initializeApis();
  }

  /**
   * Obtém o preço atual de uma criptomoeda
   * @param {string} crypto - Código da criptomoeda
   * @param {string} currency - Moeda de referência
   * @param {Object} options - Opções da consulta
   * @returns {Promise<number>} - Preço atual
   */
  async getCurrentPrice(crypto, currency, options = {}) {
    const {
      preferredApi = null,
      forceRefresh = false,
      timeout = this.timeout,
      compareAll = false,
    } = options;

    // Verificar cache se disponível e não forçar atualização
    if (this.cacheService && !forceRefresh) {
      const cacheKey = `price_${crypto.toUpperCase()}_${currency.toUpperCase()}`;
      const cachedData = this.cacheService.get(cacheKey);

      if (cachedData) {
        return cachedData;
      }
    }

    // Determinar a ordem das APIs a serem consultadas
    const apisToTry = this._getPriorityApiList(preferredApi);

    if (compareAll) {
      // Se compareAll for verdadeiro, consultar todas as APIs e retornar um objeto com todos os resultados
      return await this._compareAllSources(crypto, currency, timeout);
    } else {
      // Consultar APIs em ordem de prioridade, com fallback automático
      return await this._getFromMultipleSources(
        crypto,
        currency,
        apisToTry,
        timeout
      );
    }
  }

  /**
   * Obtém dados históricos de preço
   * @param {string} crypto - Código da criptomoeda
   * @param {string} currency - Moeda de referência
   * @param {Object} options - Opções da consulta
   * @returns {Promise<Array>} - Dados históricos
   */
  async getHistoricalData(crypto, currency, options = {}) {
    const {
      period = '1M', // 1D, 1W, 1M, 3M, 6M, 1Y, ALL
      interval = 'daily', // hourly, daily, weekly
      preferredApi = null,
      forceRefresh = false,
      startDate = null,
      endDate = null,
    } = options;

    // Verificar cache se disponível e não forçar atualização
    if (this.cacheService && !forceRefresh) {
      const cacheKey = `history_${crypto.toUpperCase()}_${currency.toUpperCase()}_${period}_${interval}`;
      const cachedData = this.cacheService.get(cacheKey);

      if (cachedData) {
        return cachedData;
      }
    }

    // Determinar a ordem das APIs a serem consultadas
    const apisToTry = this._getPriorityApiList(preferredApi);

    // Consultar APIs em ordem de prioridade, com fallback automático
    const result = await this._getHistoricalFromMultipleSources(
      crypto,
      currency,
      apisToTry,
      { period, interval, startDate, endDate }
    );

    // Salvar no cache se disponível
    if (this.cacheService && result) {
      const cacheKey = `history_${crypto.toUpperCase()}_${currency.toUpperCase()}_${period}_${interval}`;
      // Definir TTL baseado no período e intervalo para dados históricos
      const ttl = this._calculateHistoricalDataTTL(period, interval);
      this.cacheService.set(cacheKey, result, ttl);
    }

    return result;
  }

  /**
   * Obtém lista de criptomoedas disponíveis
   * @param {Object} options - Opções da consulta
   * @returns {Promise<Array>} - Lista de criptomoedas
   */
  async getAvailableCryptos(options = {}) {
    const {
      preferredApi = null,
      forceRefresh = false,
      limit = 100,
      includeMetadata = false,
    } = options;

    // Verificar cache se disponível e não forçar atualização
    if (this.cacheService && !forceRefresh) {
      const cacheKey = `cryptos_list_${limit}_${includeMetadata}`;
      const cachedData = this.cacheService.get(cacheKey);

      if (cachedData) {
        return cachedData;
      }
    }

    // Determinar a ordem das APIs a serem consultadas
    const apisToTry = this._getPriorityApiList(preferredApi);

    // Consultar APIs em ordem de prioridade
    for (const apiName of apisToTry) {
      const api = this.availableApis[apiName];

      if (!api || !api.getAvailableCryptos) continue;

      try {
        const result = await api.getAvailableCryptos({
          limit,
          includeMetadata,
        });

        if (result && Array.isArray(result) && result.length > 0) {
          // Salvar no cache se disponível (lista de criptos pode ser cacheada por mais tempo)
          if (this.cacheService) {
            const cacheKey = `cryptos_list_${limit}_${includeMetadata}`;
            this.cacheService.set(cacheKey, result, 3600 * 24); // Cache de 24 horas
          }

          return result;
        }
      } catch (error) {
        console.error(
          `Erro ao obter lista de criptomoedas de ${apiName}:`,
          error
        );
        // Continuar para próxima API
      }
    }

    // Se chegou aqui, nenhuma API retornou dados válidos
    throw new Error(
      'Não foi possível obter a lista de criptomoedas de nenhuma fonte'
    );
  }

  /**
   * Obtém detalhes de uma criptomoeda específica
   * @param {string} crypto - Código da criptomoeda
   * @param {Object} options - Opções da consulta
   * @returns {Promise<Object>} - Detalhes da criptomoeda
   */
  async getCryptoDetails(crypto, options = {}) {
    const {
      preferredApi = null,
      forceRefresh = false,
      currency = 'USD',
    } = options;

    // Verificar cache se disponível e não forçar atualização
    if (this.cacheService && !forceRefresh) {
      const cacheKey = `crypto_details_${crypto.toUpperCase()}_${currency}`;
      const cachedData = this.cacheService.get(cacheKey);

      if (cachedData) {
        return cachedData;
      }
    }

    // Determinar a ordem das APIs a serem consultadas
    const apisToTry = this._getPriorityApiList(preferredApi);

    // Consultar APIs em ordem de prioridade
    for (const apiName of apisToTry) {
      const api = this.availableApis[apiName];

      if (!api || !api.getCryptoDetails) continue;

      try {
        const result = await api.getCryptoDetails(crypto, { currency });

        if (result && typeof result === 'object') {
          // Salvar no cache se disponível
          if (this.cacheService) {
            const cacheKey = `crypto_details_${crypto.toUpperCase()}_${currency}`;
            this.cacheService.set(cacheKey, result, 3600); // Cache de 1 hora
          }

          return result;
        }
      } catch (error) {
        console.error(
          `Erro ao obter detalhes da criptomoeda ${crypto} de ${apiName}:`,
          error
        );
        // Continuar para próxima API
      }
    }

    // Se chegou aqui, nenhuma API retornou dados válidos
    throw new Error(
      `Não foi possível obter detalhes da criptomoeda ${crypto} de nenhuma fonte`
    );
  }

  /**
   * Obtém informações de mercado (marketcap, volume, etc)
   * @param {Object} options - Opções da consulta
   * @returns {Promise<Object>} - Dados de mercado
   */
  async getMarketInfo(options = {}) {
    const {
      preferredApi = null,
      forceRefresh = false,
      limit = 100,
      currency = 'USD',
    } = options;

    // Verificar cache se disponível e não forçar atualização
    if (this.cacheService && !forceRefresh) {
      const cacheKey = `market_info_${limit}_${currency}`;
      const cachedData = this.cacheService.get(cacheKey);

      if (cachedData) {
        return cachedData;
      }
    }

    // Determinar a ordem das APIs a serem consultadas
    const apisToTry = this._getPriorityApiList(preferredApi);

    // Consultar APIs em ordem de prioridade
    for (const apiName of apisToTry) {
      const api = this.availableApis[apiName];

      if (!api || !api.getMarketInfo) continue;

      try {
        const result = await api.getMarketInfo({ limit, currency });

        if (result && typeof result === 'object') {
          // Salvar no cache se disponível
          if (this.cacheService) {
            const cacheKey = `market_info_${limit}_${currency}`;
            this.cacheService.set(cacheKey, result, 300); // Cache de 5 minutos
          }

          return result;
        }
      } catch (error) {
        console.error(
          `Erro ao obter informações de mercado de ${apiName}:`,
          error
        );
        // Continuar para próxima API
      }
    }

    // Se chegou aqui, nenhuma API retornou dados válidos
    throw new Error(
      'Não foi possível obter informações de mercado de nenhuma fonte'
    );
  }

  /**
   * Verifica o status de cada API configurada
   * @returns {Promise<Object>} - Status de cada API
   */
  async checkApiStatus() {
    const results = {};

    for (const apiName of Object.keys(this.availableApis)) {
      const api = this.availableApis[apiName];

      if (!api) {
        results[apiName] = { available: false, reason: 'API não inicializada' };
        continue;
      }

      try {
        // Verifica se a API está respondendo (implementação específica para cada API)
        const isAvailable = await api.checkAvailability();
        results[apiName] = {
          available: isAvailable,
          reason: isAvailable ? 'OK' : 'API não respondeu corretamente',
          requiresKey: api.requiresApiKey || false,
          hasValidKey: api.hasValidApiKey || false,
        };
      } catch (error) {
        results[apiName] = {
          available: false,
          reason: error.message || 'Erro ao verificar disponibilidade',
          requiresKey: api.requiresApiKey || false,
          hasValidKey: api.hasValidApiKey || false,
        };
      }
    }

    return results;
  }

  /**
   * Adiciona uma nova fonte de API
   * @param {string} name - Nome da API
   * @param {Object} implementation - Implementação da API
   * @param {number} priority - Prioridade (0 = maior prioridade)
   * @returns {boolean} - Se a API foi adicionada com sucesso
   */
  addApiSource(name, implementation, priority = null) {
    if (!name || !implementation) {
      return false;
    }

    // Adicionar implementação
    this.availableApis[name] = implementation;

    // Adicionar à lista de prioridades se priority for fornecido
    if (priority !== null && !isNaN(priority)) {
      // Remover se já existir
      this.apiPriority = this.apiPriority.filter((api) => api !== name);

      // Inserir na posição correta
      if (priority >= this.apiPriority.length) {
        this.apiPriority.push(name);
      } else {
        this.apiPriority.splice(priority, 0, name);
      }
    } else if (!this.apiPriority.includes(name)) {
      // Adicionar ao final se não estiver na lista
      this.apiPriority.push(name);
    }

    return true;
  }

  /**
   * Remove uma fonte de API
   * @param {string} name - Nome da API a ser removida
   * @returns {boolean} - Se a API foi removida com sucesso
   */
  removeApiSource(name) {
    if (!name || !this.availableApis[name]) {
      return false;
    }

    // Remover implementação
    delete this.availableApis[name];

    // Remover da lista de prioridades
    this.apiPriority = this.apiPriority.filter((api) => api !== name);

    return true;
  }

  /**
   * Atualiza a chave de API para uma fonte específica
   * @param {string} apiName - Nome da fonte de API
   * @param {string} apiKey - Nova chave de API
   * @returns {boolean} - Se a chave foi atualizada com sucesso
   */
  updateApiKey(apiName, apiKey) {
    if (!apiName) {
      return false;
    }

    this.apiKeys[apiName] = apiKey;

    // Atualizar a chave na implementação da API, se existir
    if (
      this.availableApis[apiName] &&
      typeof this.availableApis[apiName].setApiKey === 'function'
    ) {
      this.availableApis[apiName].setApiKey(apiKey);
    }

    return true;
  }

  /**
   * Atualiza a ordem de prioridade das APIs
   * @param {Array} newPriority - Nova ordem de prioridade
   * @returns {boolean} - Se a prioridade foi atualizada com sucesso
   */
  updateApiPriority(newPriority) {
    if (!Array.isArray(newPriority) || newPriority.length === 0) {
      return false;
    }

    // Verificar se todas as APIs na nova ordem existem
    for (const api of newPriority) {
      if (!this.availableApis[api]) {
        console.warn(
          `API ${api} na nova ordem de prioridade não está disponível`
        );
      }
    }

    // Garantir que todas as APIs disponíveis estejam na lista de prioridade
    const missingApis = Object.keys(this.availableApis).filter(
      (api) => !newPriority.includes(api)
    );

    this.apiPriority = [...newPriority, ...missingApis];

    return true;
  }

  /**
   * Inicializa as implementações de API disponíveis
   * @returns {Object} - Mapa de implementações de API
   * @private
   */
  _initializeApis() {
    const apis = {};

    // Inicializar cada implementação de API de acordo com a configuração
    // CoinGecko
    if (this._hasImplementation('CoinGeckoApi')) {
      apis.coinGecko = new CoinGeckoApi({
        apiKey: this.apiKeys.coinGecko,
        timeout: this.timeout,
      });
    }

    // CoinMarketCap
    if (
      this._hasImplementation('CoinMarketCapApi') &&
      this.apiKeys.coinMarketCap
    ) {
      apis.coinMarketCap = new CoinMarketCapApi({
        apiKey: this.apiKeys.coinMarketCap,
        timeout: this.timeout,
      });
    }

    // Binance
    if (this._hasImplementation('BinanceApi')) {
      apis.binance = new BinanceApi({
        apiKey: this.apiKeys.binance,
        apiSecret: this.apiKeys.binanceSecret,
        timeout: this.timeout,
      });
    }

    // CoinAPI
    if (this._hasImplementation('CoinApi') && this.apiKeys.coinApi) {
      apis.coinApi = new CoinApi({
        apiKey: this.apiKeys.coinApi,
        timeout: this.timeout,
      });
    }

    // CoinGlass
    if (this._hasImplementation('CoinGlassApi') && this.apiKeys.coinGlass) {
      apis.coinGlass = new CoinGlassApi({
        apiKey: this.apiKeys.coinGlass,
        timeout: this.timeout,
      });
    }

    return apis;
  }

  /**
   * Verifica se uma implementação de API está disponível
   * @param {string} className - Nome da classe de implementação
   * @returns {boolean} - Se a implementação existe
   * @private
   */
  _hasImplementation(className) {
    // No ambiente real, isso verificaria se a classe está disponível
    // Para esta implementação, consideramos todas disponíveis
    return true;
  }

  /**
   * Obtém uma lista ordenada de APIs para consulta
   * @param {string} preferredApi - API preferencial
   * @returns {Array} - Lista ordenada de APIs
   * @private
   */
  _getPriorityApiList(preferredApi) {
    // Se uma API preferencial for especificada e estiver disponível, colocá-la no topo
    if (preferredApi && this.availableApis[preferredApi]) {
      const remaining = this.apiPriority.filter((api) => api !== preferredApi);
      return [preferredApi, ...remaining];
    }

    // Caso contrário, usar a ordem de prioridade padrão
    return [...this.apiPriority];
  }

  /**
   * Consulta múltiplas fontes em ordem até obter um resultado válido
   * @param {string} crypto - Código da criptomoeda
   * @param {string} currency - Moeda de referência
   * @param {Array} apisToTry - Lista de APIs para tentar
   * @param {number} timeout - Tempo limite
   * @returns {Promise<number>} - Preço obtido
   * @private
   */
  async _getFromMultipleSources(crypto, currency, apisToTry, timeout) {
    for (const apiName of apisToTry) {
      const api = this.availableApis[apiName];

      if (!api || !api.getCurrentPrice) continue;

      for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
        try {
          const price = await this._withTimeout(
            api.getCurrentPrice(crypto, currency),
            timeout
          );

          if (price && !isNaN(price) && price > 0) {
            // Salvar no cache se disponível
            if (this.cacheService) {
              const cacheKey = `price_${crypto.toUpperCase()}_${currency.toUpperCase()}`;
              const ttl = this._calculatePriceCacheTTL(crypto);
              this.cacheService.set(cacheKey, price, ttl);
            }

            return price;
          }
        } catch (error) {
          const isLastAttempt = attempt === this.maxRetries;
          const isLastApi = apiName === apisToTry[apisToTry.length - 1];

          if (isLastAttempt && isLastApi) {
            throw error; // Propagar erro apenas na última tentativa da última API
          }

          console.error(
            `Erro ao obter preço de ${apiName} (tentativa ${attempt + 1}/${
              this.maxRetries + 1
            }):`,
            error
          );

          // Aguardar antes de tentar novamente (exceto na última tentativa)
          if (!isLastAttempt) {
            await this._delay(500 * (attempt + 1)); // Atraso exponencial
          }
        }
      }
    }

    throw new Error(
      `Não foi possível obter o preço de ${crypto} em ${currency} de nenhuma fonte`
    );
  }

  /**
   * Consulta múltiplas fontes e compara os resultados
   * @param {string} crypto - Código da criptomoeda
   * @param {string} currency - Moeda de referência
   * @param {number} timeout - Tempo limite
   * @returns {Promise<Object>} - Resultados de todas as fontes
   * @private
   */
  async _compareAllSources(crypto, currency, timeout) {
    const results = {
      timestamp: Date.now(),
      crypto,
      currency,
      sources: {},
      averagePrice: null,
      medianPrice: null,
      minPrice: null,
      maxPrice: null,
      stdDeviation: null,
    };

    const promises = [];

    // Criar promessas para todas as APIs disponíveis
    for (const apiName of this.apiPriority) {
      const api = this.availableApis[apiName];

      if (!api || !api.getCurrentPrice) continue;

      promises.push(
        this._withTimeout(api.getCurrentPrice(crypto, currency), timeout)
          .then((price) => {
            if (price && !isNaN(price) && price > 0) {
              results.sources[apiName] = {
                price,
                success: true,
                timestamp: Date.now(),
              };
              return price;
            }

            results.sources[apiName] = {
              success: false,
              error: 'Preço inválido retornado',
              timestamp: Date.now(),
            };
            return null;
          })
          .catch((error) => {
            results.sources[apiName] = {
              success: false,
              error: error.message || String(error),
              timestamp: Date.now(),
            };
            return null;
          })
      );
    }

    // Aguardar todas as promessas
    await Promise.all(promises);

    // Calcular estatísticas
    const validPrices = Object.values(results.sources)
      .filter((source) => source.success)
      .map((source) => source.price);

    if (validPrices.length > 0) {
      // Média
      results.averagePrice =
        validPrices.reduce((sum, price) => sum + price, 0) / validPrices.length;

      // Mediana
      const sortedPrices = [...validPrices].sort((a, b) => a - b);
      const midIndex = Math.floor(sortedPrices.length / 2);
      results.medianPrice =
        sortedPrices.length % 2 === 0
          ? (sortedPrices[midIndex - 1] + sortedPrices[midIndex]) / 2
          : sortedPrices[midIndex];

      // Min e Max
      results.minPrice = Math.min(...validPrices);
      results.maxPrice = Math.max(...validPrices);

      // Desvio padrão
      const variance =
        validPrices.reduce(
          (sum, price) => sum + Math.pow(price - results.averagePrice, 2),
          0
        ) / validPrices.length;
      results.stdDeviation = Math.sqrt(variance);
    }

    return results;
  }

  /**
   * Consulta múltiplas fontes para obter dados históricos
   * @param {string} crypto - Código da criptomoeda
   * @param {string} currency - Moeda de referência
   * @param {Array} apisToTry - Lista de APIs para tentar
   * @param {Object} options - Opções da consulta
   * @returns {Promise<Array>} - Dados históricos
   * @private
   */
  async _getHistoricalFromMultipleSources(
    crypto,
    currency,
    apisToTry,
    options
  ) {
    for (const apiName of apisToTry) {
      const api = this.availableApis[apiName];

      if (!api || !api.getHistoricalData) continue;

      for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
        try {
          const data = await this._withTimeout(
            api.getHistoricalData(crypto, currency, options),
            this.timeout * 2 // Dados históricos podem levar mais tempo
          );

          if (data && Array.isArray(data) && data.length > 0) {
            return data;
          }
        } catch (error) {
          const isLastAttempt = attempt === this.maxRetries;
          const isLastApi = apiName === apisToTry[apisToTry.length - 1];

          if (isLastAttempt && isLastApi) {
            throw error; // Propagar erro apenas na última tentativa da última API
          }

          console.error(
            `Erro ao obter dados históricos de ${apiName} (tentativa ${
              attempt + 1
            }/${this.maxRetries + 1}):`,
            error
          );

          // Aguardar antes de tentar novamente (exceto na última tentativa)
          if (!isLastAttempt) {
            await this._delay(500 * (attempt + 1)); // Atraso exponencial
          }
        }
      }
    }

    throw new Error(
      `Não foi possível obter dados históricos de ${crypto} em ${currency} de nenhuma fonte`
    );
  }

  /**
   * Calcula o TTL (time-to-live) para cache de preços
   * @param {string} crypto - Código da criptomoeda
   * @returns {number} - Tempo em segundos
   * @private
   */
  _calculatePriceCacheTTL(crypto) {
    // Para criptomoedas de alta volatilidade ou alto volume, o cache é menor
    const highVolatilityCryptos = ['BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'ADA'];

    if (highVolatilityCryptos.includes(crypto.toUpperCase())) {
      return 60; // 1 minuto para criptos de alta volatilidade
    }

    return 300; // 5 minutos para outras criptos
  }

  /**
   * Calcula o TTL para cache de dados históricos
   * @param {string} period - Período dos dados
   * @param {string} interval - Intervalo dos dados
   * @returns {number} - Tempo em segundos
   * @private
   */
  _calculateHistoricalDataTTL(period, interval) {
    // Dados mais recentes expiram mais rápido
    if (period === '1D') {
      return 1800; // 30 minutos
    } else if (period === '1W') {
      return 3600; // 1 hora
    } else if (period === '1M') {
      return 7200; // 2 horas
    } else {
      return 86400; // 24 horas para períodos longos
    }
  }

  /**
   * Cria uma promessa com tempo limite
   * @param {Promise} promise - Promessa original
   * @param {number} timeoutMs - Tempo limite em ms
   * @returns {Promise} - Promessa com tempo limite
   * @private
   */
  _withTimeout(promise, timeoutMs) {
    return Promise.race([
      promise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Tempo limite excedido')), timeoutMs)
      ),
    ]);
  }

  /**
   * Cria um atraso (sleep)
   * @param {number} ms - Milissegundos
   * @returns {Promise} - Promessa que resolve após o atraso
   * @private
   */
  _delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Classes de implementação específicas para cada API
 * Estas são apenas interfaces que devem ser implementadas de acordo com cada API
 */

class CoinGeckoApi {
  constructor(options = {}) {
    this.apiKey = options.apiKey;
    this.timeout = options.timeout || 10000;
    this.baseUrl = 'https://api.coingecko.com/api/v3';
    this.proUrl = 'https://pro-api.coingecko.com/api/v3';
    this.requiresApiKey = false; // API gratuita disponível
    this.hasValidApiKey = !!this.apiKey;
  }

  async getCurrentPrice(crypto, currency) {
    // Implementação específica para CoinGecko
    const endpoint = this.hasValidApiKey
      ? `${this.proUrl}/simple/price`
      : `${this.baseUrl}/simple/price`;

    const url = `${endpoint}?ids=${this._mapCryptoId(
      crypto
    )}&vs_currencies=${currency.toLowerCase()}`;

    const response = await fetch(url, {
      headers: this.hasValidApiKey ? { 'X-CG-Pro-API-Key': this.apiKey } : {},
    });

    if (!response.ok) {
      throw new Error(
        `CoinGecko API error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    const cryptoId = this._mapCryptoId(crypto);

    if (!data[cryptoId] || !data[cryptoId][currency.toLowerCase()]) {
      throw new Error(`Preço não disponível para ${crypto} em ${currency}`);
    }

    return data[cryptoId][currency.toLowerCase()];
  }

  async getHistoricalData(crypto, currency, options) {
    // Implementação para dados históricos no CoinGecko
    const { period = '1M', interval = 'daily' } = options;

    // Mapear período para dias
    const days = this._mapPeriodToDays(period);

    // Mapear intervalo para parâmetro da API
    const apiInterval = this._mapIntervalToApiParameter(interval);

    const endpoint = this.hasValidApiKey
      ? `${this.proUrl}/coins/${this._mapCryptoId(crypto)}/market_chart`
      : `${this.baseUrl}/coins/${this._mapCryptoId(crypto)}/market_chart`;

    const url = `${endpoint}?vs_currency=${currency.toLowerCase()}&days=${days}&interval=${apiInterval}`;

    const response = await fetch(url, {
      headers: this.hasValidApiKey ? { 'X-CG-Pro-API-Key': this.apiKey } : {},
    });

    if (!response.ok) {
      throw new Error(
        `CoinGecko API error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();

    // Converter para formato padronizado
    if (!data.prices || !Array.isArray(data.prices)) {
      throw new Error('Formato de dados inválido recebido do CoinGecko');
    }

    return data.prices.map((item) => ({
      timestamp: item[0],
      date: new Date(item[0]).toISOString(),
      price: item[1],
      volume: this._findVolumeForTimestamp(data.total_volumes, item[0]),
      marketCap: this._findMarketCapForTimestamp(data.market_caps, item[0]),
    }));
  }

  async getAvailableCryptos(options) {
    const { limit = 100, includeMetadata = false } = options;

    const endpoint = this.hasValidApiKey
      ? `${this.proUrl}/coins/markets`
      : `${this.baseUrl}/coins/markets`;

    const url = `${endpoint}?vs_currency=usd&order=market_cap_desc&per_page=${limit}&page=1`;

    const response = await fetch(url, {
      headers: this.hasValidApiKey ? { 'X-CG-Pro-API-Key': this.apiKey } : {},
    });

    if (!response.ok) {
      throw new Error(
        `CoinGecko API error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();

    return data.map((coin) => ({
      id: coin.id,
      symbol: coin.symbol.toUpperCase(),
      name: coin.name,
      ...(includeMetadata
        ? {
            image: coin.image,
            currentPrice: coin.current_price,
            marketCap: coin.market_cap,
            marketCapRank: coin.market_cap_rank,
            priceChangePercentage24h: coin.price_change_percentage_24h,
          }
        : {}),
    }));
  }

  async getCryptoDetails(crypto, options) {
    const { currency = 'USD' } = options;

    const endpoint = this.hasValidApiKey
      ? `${this.proUrl}/coins/${this._mapCryptoId(crypto)}`
      : `${this.baseUrl}/coins/${this._mapCryptoId(crypto)}`;

    const url = `${endpoint}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false`;

    const response = await fetch(url, {
      headers: this.hasValidApiKey ? { 'X-CG-Pro-API-Key': this.apiKey } : {},
    });

    if (!response.ok) {
      throw new Error(
        `CoinGecko API error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();

    return {
      id: data.id,
      symbol: data.symbol.toUpperCase(),
      name: data.name,
      description: data.description?.en || '',
      image: data.image?.large,
      currentPrice: data.market_data?.current_price?.[currency.toLowerCase()],
      marketCap: data.market_data?.market_cap?.[currency.toLowerCase()],
      marketCapRank: data.market_cap_rank,
      totalVolume: data.market_data?.total_volume?.[currency.toLowerCase()],
      high24h: data.market_data?.high_24h?.[currency.toLowerCase()],
      low24h: data.market_data?.low_24h?.[currency.toLowerCase()],
      priceChange24h: data.market_data?.price_change_24h,
      priceChangePercentage24h: data.market_data?.price_change_percentage_24h,
      circulatingSupply: data.market_data?.circulating_supply,
      totalSupply: data.market_data?.total_supply,
      maxSupply: data.market_data?.max_supply,
      allTimeHigh: data.market_data?.ath?.[currency.toLowerCase()],
      allTimeHighDate: data.market_data?.ath_date?.[currency.toLowerCase()],
      allTimeLow: data.market_data?.atl?.[currency.toLowerCase()],
      allTimeLowDate: data.market_data?.atl_date?.[currency.toLowerCase()],
    };
  }

  async getMarketInfo(options) {
    const { limit = 100, currency = 'USD' } = options;

    const endpoint = this.hasValidApiKey
      ? `${this.proUrl}/global`
      : `${this.baseUrl}/global`;

    const response = await fetch(endpoint, {
      headers: this.hasValidApiKey ? { 'X-CG-Pro-API-Key': this.apiKey } : {},
    });

    if (!response.ok) {
      throw new Error(
        `CoinGecko API error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();

    const markets = await this.getAvailableCryptos({
      limit,
      includeMetadata: true,
      currency,
    });

    return {
      totalMarketCap: data.data?.total_market_cap?.[currency.toLowerCase()],
      totalVolume: data.data?.total_volume?.[currency.toLowerCase()],
      marketCapPercentage: data.data?.market_cap_percentage,
      markets,
    };
  }

  async checkAvailability() {
    try {
      const endpoint = this.hasValidApiKey ? this.proUrl : this.baseUrl;
      const response = await fetch(`${endpoint}/ping`);
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  setApiKey(apiKey) {
    this.apiKey = apiKey;
    this.hasValidApiKey = !!apiKey;
  }

  _mapCryptoId(crypto) {
    // Mapeamento de símbolos para IDs do CoinGecko
    const idMap = {
      BTC: 'bitcoin',
      ETH: 'ethereum',
      USDT: 'tether',
      BNB: 'binancecoin',
      USDC: 'usd-coin',
      XRP: 'ripple',
      SOL: 'solana',
      ADA: 'cardano',
      DOGE: 'dogecoin',
      TON: 'the-open-network',
      // Adicionar mais mapeamentos conforme necessário
    };

    return idMap[crypto.toUpperCase()] || crypto.toLowerCase();
  }

  _mapPeriodToDays(period) {
    const periodMap = {
      '1D': 1,
      '1W': 7,
      '1M': 30,
      '3M': 90,
      '6M': 180,
      '1Y': 365,
      ALL: 'max',
    };

    return periodMap[period] || 30;
  }

  _mapIntervalToApiParameter(interval) {
    const intervalMap = {
      hourly: 'hourly',
      daily: 'daily',
      weekly: 'daily', // CoinGecko não tem intervalo semanal, usamos diário
    };

    return intervalMap[interval] || 'daily';
  }

  _findVolumeForTimestamp(volumes, timestamp) {
    if (!volumes || !Array.isArray(volumes)) return null;

    const volume = volumes.find((v) => v[0] === timestamp);
    return volume ? volume[1] : null;
  }

  _findMarketCapForTimestamp(marketCaps, timestamp) {
    if (!marketCaps || !Array.isArray(marketCaps)) return null;

    const marketCap = marketCaps.find((m) => m[0] === timestamp);
    return marketCap ? marketCap[1] : null;
  }
}

// Implementações similares para outras APIs
class CoinMarketCapApi {
  // Implementação para a API do CoinMarketCap
  // Seguiria uma estrutura similar à CoinGeckoApi
}

class BinanceApi {
  // Implementação para a API da Binance
  // Seguiria uma estrutura similar à CoinGeckoApi
}

class CoinApi {
  // Implementação para a CoinAPI
  // Seguiria uma estrutura similar à CoinGeckoApi
}

class CoinGlassApi {
  // Implementação para a API do CoinGlass
  // Seguiria uma estrutura similar à CoinGeckoApi
}
