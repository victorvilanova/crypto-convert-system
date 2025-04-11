import { CURRENCY_TYPES } from '../constants.js';

/**
 * Modelo para representar uma moeda no sistema
 */
export class Currency {
  /**
   * @param {Object} data - Dados da moeda
   * @param {string} data.code - Código da moeda (ex: BTC, USD)
   * @param {string} data.name - Nome completo da moeda
   * @param {string} data.symbol - Símbolo visual da moeda (ex: ₿, $)
   * @param {string} data.type - Tipo da moeda ('crypto' ou 'fiat')
   * @param {string} [data.iconUrl] - URL para o ícone da moeda
   * @param {number} [data.rate] - Taxa de conversão para a moeda base
   */
  constructor({ code, name, symbol, type, iconUrl, rate }) {
    this.code = code;
    this.name = name;
    this.symbol = symbol || code;
    this.type = this.validateType(type);
    this.iconUrl = iconUrl;
    this.rate = rate || null;
  }

  /**
   * Valida o tipo da moeda
   * @param {string} type - Tipo da moeda
   * @returns {string} Tipo validado
   * @private
   */
  validateType(type) {
    if (type === CURRENCY_TYPES.CRYPTO || type === CURRENCY_TYPES.FIAT) {
      return type;
    }
    
    // Se o tipo não for válido, tentar determinar pelo código
    const cryptoCodes = ['BTC', 'ETH', 'XRP', 'LTC', 'BCH', 'ADA', 'DOT', 'LINK', 'XLM', 'DOGE'];
    return cryptoCodes.includes(this.code) ? CURRENCY_TYPES.CRYPTO : CURRENCY_TYPES.FIAT;
  }

  /**
   * Verifica se a moeda é uma criptomoeda
   * @returns {boolean} Verdadeiro se for criptomoeda
   */
  isCrypto() {
    return this.type === CURRENCY_TYPES.CRYPTO;
  }

  /**
   * Verifica se a moeda é fiduciária
   * @returns {boolean} Verdadeiro se for fiduciária
   */
  isFiat() {
    return this.type === CURRENCY_TYPES.FIAT;
  }

  /**
   * Atualiza a taxa de conversão da moeda
   * @param {number} rate - Nova taxa
   */
  updateRate(rate) {
    this.rate = rate;
  }

  /**
   * Cria uma instância de moeda a partir de dados da API
   * @param {Object} apiData - Dados da API
   * @returns {Currency} Nova instância de Currency
   */
  static fromApiData(apiData) {
    return new Currency({
      code: apiData.symbol || apiData.code,
      name: apiData.name,
      symbol: apiData.sign || apiData.symbol,
      type: apiData.type || this.guessTypeFromData(apiData),
      iconUrl: apiData.iconUrl || apiData.image,
      rate: apiData.rate || apiData.price
    });
  }

  /**
   * Tenta determinar o tipo da moeda a partir dos dados da API
   * @param {Object} apiData - Dados da API
   * @returns {string} Tipo determinado
   * @private
   */
  static guessTypeFromData(apiData) {
    // Tentar determinar o tipo a partir de propriedades comuns
    if (apiData.is_crypto === true || apiData.is_cryptocurrency === true) {
      return CURRENCY_TYPES.CRYPTO;
    }
    
    if (apiData.is_fiat === true) {
      return CURRENCY_TYPES.FIAT;
    }
    
    // Lista de códigos comuns de criptomoedas
    const cryptoCodes = ['BTC', 'ETH', 'XRP', 'LTC', 'BCH', 'ADA', 'DOT', 'LINK', 'XLM', 'DOGE'];
    const code = apiData.symbol || apiData.code;
    
    return cryptoCodes.includes(code) ? CURRENCY_TYPES.CRYPTO : CURRENCY_TYPES.FIAT;
  }

  /**
   * Gera uma representação de string da moeda
   * @returns {string} Representação da moeda
   */
  toString() {
    return `${this.name} (${this.code})`;
  }

  /**
   * Retorna um objeto plano representando a moeda
   * @returns {Object} Objeto plano
   */
  toJSON() {
    return {
      code: this.code,
      name: this.name,
      symbol: this.symbol,
      type: this.type,
      iconUrl: this.iconUrl,
      rate: this.rate
    };
  }
}