/**
 * Modelo para representar uma conversão de moeda
 */
export class Conversion {
  /**
   * @param {Object} data - Dados da conversão
   * @param {string} data.fromCurrency - Código da moeda de origem
   * @param {string} data.toCurrency - Código da moeda de destino
   * @param {number} data.amount - Valor a ser convertido
   * @param {number} data.convertedAmount - Valor convertido
   * @param {number} data.rate - Taxa de conversão utilizada
   * @param {Date} [data.timestamp] - Momento da conversão
   * @param {string} [data.id] - Identificador único da conversão
   */
  constructor({ fromCurrency, toCurrency, amount, convertedAmount, rate, timestamp, id }) {
    this.fromCurrency = fromCurrency;
    this.toCurrency = toCurrency;
    this.amount = Number(amount);
    this.convertedAmount = Number(convertedAmount);
    this.rate = Number(rate);
    this.timestamp = timestamp instanceof Date ? timestamp : new Date();
    this.id = id || this.generateId();
  }

  /**
   * Gera um ID único para a conversão
   * @returns {string} ID único
   * @private
   */
  generateId() {
    return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Cria uma instância de Conversion a partir de dados de API
   * @param {Object} apiData - Dados da API
   * @returns {Conversion} Nova instância de Conversion
   */
  static fromApiData(apiData) {
    return new Conversion({
      fromCurrency: apiData.from || apiData.source || apiData.fromCurrency,
      toCurrency: apiData.to || apiData.target || apiData.toCurrency,
      amount: apiData.amount || apiData.sourceAmount || apiData.value,
      convertedAmount: apiData.convertedAmount || apiData.targetAmount || apiData.result,
      rate: apiData.rate || apiData.exchangeRate,
      timestamp: apiData.timestamp ? new Date(apiData.timestamp) : new Date(),
      id: apiData.id || apiData.conversionId
    });
  }

  /**
   * Formata o valor original com símbolo da moeda
   * @param {Object} options - Opções de formatação
   * @param {number} [options.decimalPlaces] - Número de casas decimais
   * @param {string} [options.locale] - Localidade para formatação
   * @returns {string} Valor formatado
   */
  formatOriginalAmount({ decimalPlaces, locale = 'pt-BR' } = {}) {
    const places = decimalPlaces ?? this.getAppropriateDecimalPlaces(this.fromCurrency);
    return this.amount.toLocaleString(locale, {
      minimumFractionDigits: places,
      maximumFractionDigits: places
    });
  }

  /**
   * Formata o valor convertido com símbolo da moeda
   * @param {Object} options - Opções de formatação
   * @param {number} [options.decimalPlaces] - Número de casas decimais
   * @param {string} [options.locale] - Localidade para formatação
   * @returns {string} Valor formatado
   */
  formatConvertedAmount({ decimalPlaces, locale = 'pt-BR' } = {}) {
    const places = decimalPlaces ?? this.getAppropriateDecimalPlaces(this.toCurrency);
    return this.convertedAmount.toLocaleString(locale, {
      minimumFractionDigits: places,
      maximumFractionDigits: places
    });
  }

  /**
   * Retorna o número apropriado de casas decimais para uma moeda
   * @param {string} currencyCode - Código da moeda
   * @returns {number} Número de casas decimais
   * @private
   */
  getAppropriateDecimalPlaces(currencyCode) {
    // Criptomoedas geralmente precisam de mais casas decimais
    const cryptoCurrencies = ['BTC', 'ETH', 'XRP', 'LTC', 'BCH', 'ADA'];
    return cryptoCurrencies.includes(currencyCode) ? 8 : 2;
  }

  /**
   * Formata a taxa de conversão
   * @param {Object} options - Opções de formatação
   * @param {number} [options.decimalPlaces] - Número de casas decimais
   * @param {string} [options.locale] - Localidade para formatação
   * @returns {string} Taxa formatada
   */
  formatRate({ decimalPlaces = 6, locale = 'pt-BR' } = {}) {
    return this.rate.toLocaleString(locale, {
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces
    });
  }

  /**
   * Formata a data/hora da conversão
   * @param {Object} options - Opções de formatação
   * @param {string} [options.locale] - Localidade para formatação
   * @param {boolean} [options.includeTime] - Se deve incluir hora
   * @returns {string} Data formatada
   */
  formatTimestamp({ locale = 'pt-BR', includeTime = true } = {}) {
    const options = {
      dateStyle: 'short',
      ...(includeTime && { timeStyle: 'short' })
    };
    
    return new Intl.DateTimeFormat(locale, options).format(this.timestamp);
  }

  /**
   * Retorna uma representação de string da conversão
   * @returns {string} Representação da conversão
   */
  toString() {
    return `${this.formatOriginalAmount()} ${this.fromCurrency} = ${this.formatConvertedAmount()} ${this.toCurrency} (${this.formatTimestamp()})`;
  }

  /**
   * Retorna um objeto simples representando a conversão
   * @returns {Object} Objeto simples
   */
  toJSON() {
    return {
      id: this.id,
      fromCurrency: this.fromCurrency,
      toCurrency: this.toCurrency,
      amount: this.amount,
      convertedAmount: this.convertedAmount,
      rate: this.rate,
      timestamp: this.timestamp.toISOString()
    };
  }

  /**
   * Cria uma instância de Conversion a partir de um objeto JSON
   * @param {Object} json - Objeto JSON
   * @returns {Conversion} Nova instância de Conversion
   */
  static fromJSON(json) {
    return new Conversion({
      ...json,
      timestamp: new Date(json.timestamp)
    });
  }
}