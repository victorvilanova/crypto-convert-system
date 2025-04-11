import { CacheManager } from '../utils/CacheManager';
import { Logger } from '../utils/Logger';
import { HttpService } from './HttpService';

/**
 * Serviço responsável por obter e gerenciar dados de criptomoedas
 */
export class CryptoService {
  /**
   * @param {Object} options - Opções de configuração
   * @param {string} options.apiBaseUrl - URL base da API
   * @param {Object} options.httpOptions - Opções para o HttpService
   * @param {number} options.cacheTtlMinutes - Tempo de vida do cache em minutos
   */
  constructor(options = {}) {
    const {
      apiBaseUrl = CONFIG.apiBaseUrl,
      httpOptions = {},
      cacheTtlMinutes = 15,
    } = options;

    this.httpService = new HttpService(apiBaseUrl, httpOptions);
    this.cache = new CacheManager(cacheTtlMinutes);
    this.logger = new Logger('CryptoService');
    this.useMockData = CONFIG.useMockRates || false;
  }

  /**
   * Obtém as taxas de câmbio atualizadas
   * @param {boolean} forceRefresh - Se deve ignorar o cache e buscar dados novos
   * @returns {Promise<Object>} - Objeto com as taxas de câmbio
   */
  async getRates(forceRefresh = false) {
    const cacheKey = 'crypto_rates';

    // Tentar obter do cache se não for forçada a atualização
    if (!forceRefresh) {
      const cachedRates = this.cache.get(cacheKey);
      if (cachedRates) {
        this.logger.debug('Taxas obtidas do cache', { timestamp: new Date() });
        return cachedRates;
      }
    }

    try {
      let rates;

      // Usar dados simulados se configurado
      if (this.useMockData) {
        rates = this._getMockRates();
        this.logger.info('Usando taxas simuladas', { mockEnabled: true });
      } else {
        // Buscar da API
        this.logger.info('Buscando taxas da API', { endpoint: '/rates' });
        rates = await this.httpService.get('/rates');
      }

      // Armazenar no cache
      this.cache.set(cacheKey, rates);

      // Emitir evento de atualização
      this._emitRatesUpdatedEvent(rates);

      return rates;
    } catch (error) {
      this.logger.error('Falha ao obter taxas de câmbio', error);

      // Em caso de erro, tentar usar os dados em cache mesmo expirados
      const expiredRates = this.cache.get(cacheKey, true);
      if (expiredRates) {
        this.logger.warn('Usando taxas expiradas do cache após falha na API');
        return expiredRates;
      }

      // Se não houver cache, lançar erro
      throw error;
    }
  }

  /**
   * Simula variação nas taxas para ambiente de desenvolvimento/teste
   * @returns {Object} - Taxas simuladas
   * @private
   */
  _getMockRates() {
    // Taxas base para simulação
    const baseRates = {
      BTC: { BRL: 300000, USD: 60000, EUR: 55000 },
      ETH: { BRL: 15000, USD: 3000, EUR: 2750 },
      USDT: { BRL: 5.05, USD: 1, EUR: 0.92 },
      BNB: { BRL: 2100, USD: 420, EUR: 385 },
      XRP: { BRL: 3.5, USD: 0.7, EUR: 0.64 },
    };

    // Aplicar variação aleatória de até +/- 2%
    const rates = {};

    for (const [crypto, values] of Object.entries(baseRates)) {
      rates[crypto] = {};

      for (const [currency, value] of Object.entries(values)) {
        const variation = (Math.random() * 4 - 2) / 100; // -2% a +2%
        rates[crypto][currency] = value * (1 + variation);
      }
    }

    return rates;
  }

  /**
   * Realiza conversão entre criptomoedas e moedas fiduciárias
   * @param {string} fromCurrency - Moeda de origem
   * @param {string} toCurrency - Moeda de destino
   * @param {number} amount - Valor a ser convertido
   * @returns {Promise<Object>} - Resultado da conversão
   */
  async convert(fromCurrency, toCurrency, amount) {
    if (!amount || isNaN(amount) || amount <= 0) {
      throw new Error('Valor inválido para conversão');
    }

    // Obter taxas atualizadas
    const rates = await this.getRates();

    // Validar moedas
    if (
      !this._validateCurrency(rates, fromCurrency) ||
      !this._validateCurrency(rates, toCurrency)
    ) {
      throw new Error('Moeda não suportada para conversão');
    }

    // Calcular valor convertido
    const convertedValue = this._calculateConversion(
      rates,
      fromCurrency,
      toCurrency,
      amount
    );

    // Calcular taxas aplicáveis
    const fees = this._calculateFees(
      fromCurrency,
      toCurrency,
      amount,
      convertedValue
    );

    // Construir resposta
    const result = {
      fromCurrency,
      toCurrency,
      amount,
      convertedValue,
      rate: convertedValue / amount,
      fees,
      totalWithFees: convertedValue - fees.total,
      timestamp: new Date().toISOString(),
    };

    this.logger.info('Conversão realizada', {
      from: fromCurrency,
      to: toCurrency,
      amount,
      result: convertedValue,
    });

    return result;
  }

  /**
   * Verifica se uma moeda é suportada nas taxas disponíveis
   * @param {Object} rates - Objeto com as taxas
   * @param {string} currency - Moeda a ser validada
   * @returns {boolean} - Se a moeda é suportada
   * @private
   */
  _validateCurrency(rates, currency) {
    // Para criptomoedas, verificar se existe no objeto de taxas
    if (this._isCrypto(currency)) {
      return rates.hasOwnProperty(currency);
    }

    // Para moedas fiduciárias, verificar se existe em alguma criptomoeda
    for (const crypto in rates) {
      if (rates[crypto].hasOwnProperty(currency)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Verifica se uma moeda é uma criptomoeda
   * @param {string} currency - Código da moeda
   * @returns {boolean} - Se é uma criptomoeda
   * @private
   */
  _isCrypto(currency) {
    const cryptos = ['BTC', 'ETH', 'USDT', 'BNB', 'XRP'];
    return cryptos.includes(currency);
  }

  /**
   * Calcula o valor convertido entre moedas
   * @param {Object} rates - Taxas de câmbio
   * @param {string} from - Moeda de origem
   * @param {string} to - Moeda de destino
   * @param {number} amount - Valor a ser convertido
   * @returns {number} - Valor convertido
   * @private
   */
  _calculateConversion(rates, from, to, amount) {
    // Casos possíveis:
    // 1. Crypto -> Fiat (ex: BTC -> BRL)
    // 2. Fiat -> Crypto (ex: BRL -> BTC)
    // 3. Crypto -> Crypto (ex: BTC -> ETH)
    // 4. Fiat -> Fiat (ex: BRL -> USD)

    // Caso 1: Crypto -> Fiat
    if (this._isCrypto(from) && !this._isCrypto(to)) {
      return amount * rates[from][to];
    }

    // Caso 2: Fiat -> Crypto
    if (!this._isCrypto(from) && this._isCrypto(to)) {
      // Usar USDT como intermediário para converter fiat para crypto
      const usdtRate = rates['USDT'][from] ? 1 / rates['USDT'][from] : null;

      if (!usdtRate) {
        throw new Error(`Conversão de ${from} para ${to} não suportada`);
      }

      const amountInUsdt = amount * usdtRate;
      return amountInUsdt / rates['USDT'][rates[to]['USD'] ? 'USD' : 'BRL'];
    }

    // Caso 3: Crypto -> Crypto
    if (this._isCrypto(from) && this._isCrypto(to)) {
      // Converter usando USD como intermediário
      const fromUsdValue = rates[from]['USD'];
      const toUsdValue = rates[to]['USD'];
      return amount * (fromUsdValue / toUsdValue);
    }

    // Caso 4: Fiat -> Fiat
    // Usar USDT como intermediário
    const fromUsdtRate = rates['USDT'][from] ? 1 / rates['USDT'][from] : null;
    const toUsdtRate = rates['USDT'][to] ? rates['USDT'][to] : null;

    if (!fromUsdtRate || !toUsdtRate) {
      throw new Error(`Conversão de ${from} para ${to} não suportada`);
    }

    return amount * (fromUsdtRate * toUsdtRate);
  }

  /**
   * Calcula as taxas aplicáveis à conversão
   * @param {string} from - Moeda de origem
   * @param {string} to - Moeda de destino
   * @param {number} originalAmount - Valor original
   * @param {number} convertedAmount - Valor convertido
   * @returns {Object} - Taxas calculadas
   * @private
   */
  _calculateFees(from, to, originalAmount, convertedAmount) {
    const fees = {
      network: 0,
      service: 0,
      iof: 0,
      incomeTax: 0,
      total: 0,
    };

    // Taxa de rede (somente para retirada de criptomoedas)
    if (this._isCrypto(to)) {
      fees.network = CONFIG.defaultNetworkFees[to] || 0;
    }

    // Taxa de serviço
    fees.service = convertedAmount * CONFIG.fees.service;

    // IOF (para operações com BRL)
    if (from === 'BRL' || to === 'BRL') {
      fees.iof = convertedAmount * CONFIG.fees.iof;
    }

    // Imposto de renda (para ganho de capital em conversões de crypto -> fiat)
    if (
      this._isCrypto(from) &&
      !this._isCrypto(to) &&
      convertedAmount > 35000
    ) {
      fees.incomeTax = convertedAmount * CONFIG.fees.incomeTax;
    }

    // Calcular total
    fees.total = fees.network + fees.service + fees.iof + fees.incomeTax;

    return fees;
  }

  /**
   * Emite evento de atualização das taxas
   * @param {Object} rates - Taxas atualizadas
   * @private
   */
  _emitRatesUpdatedEvent(rates) {
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      const event = new CustomEvent('rates-updated', {
        detail: { rates, timestamp: new Date().toISOString() },
      });

      document.dispatchEvent(event);
    }
  }
}
