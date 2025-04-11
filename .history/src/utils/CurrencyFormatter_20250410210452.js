/**
 * Classe para formatação de valores monetários
 */
export class CurrencyFormatter {
  /**
   * @param {Object} options - Opções de configuração
   * @param {string} options.locale - Localidade padrão para formatação (ex: 'pt-BR')
   * @param {string} options.defaultCurrency - Moeda padrão (ex: 'BRL')
   */
  constructor(options = {}) {
    const { locale = 'pt-BR', defaultCurrency = 'BRL' } = options;

    this.locale = locale;
    this.defaultCurrency = defaultCurrency;

    // Cache para formatadores
    this.formatters = new Map();

    // Símbolos personalizados para criptomoedas
    this.cryptoSymbols = {
      BTC: '₿',
      ETH: 'Ξ',
      LTC: 'Ł',
      XRP: 'XRP',
      BCH: '₿CH',
      BNB: 'BNB',
      EOS: 'EOS',
      XLM: 'XLM',
      ADA: 'ADA',
      TRX: 'TRX',
      USDT: '₮',
      DOGE: 'Ð',
      DOT: 'DOT',
      LINK: 'LINK',
      UNI: 'UNI',
      SOL: 'SOL',
      MATIC: 'MATIC',
    };
  }

  /**
   * Formata um valor monetário
   * @param {number} value - Valor a ser formatado
   * @param {Object} options - Opções de formatação
   * @returns {string} - Valor formatado
   */
  format(value, options = {}) {
    const {
      currency = this.defaultCurrency,
      locale = this.locale,
      decimalPlaces,
      compact = false,
      showSymbol = true,
      showCode = false,
      approximation = false,
    } = options;

    // Verificar se é número válido
    if (value === null || value === undefined || isNaN(value)) {
      return 'N/A';
    }

    // Arredondar para um valor aproximado se solicitado
    let formattedValue = approximation
      ? this._getApproximateValue(value)
      : value;

    // Gerar ou obter formatador do cache
    const formatterKey = this._getFormatterKey(
      currency,
      locale,
      decimalPlaces,
      compact,
      showSymbol,
      showCode
    );
    let formatter = this.formatters.get(formatterKey);

    if (!formatter) {
      formatter = this._createFormatter(
        currency,
        locale,
        decimalPlaces,
        compact,
        showSymbol,
        showCode
      );
      this.formatters.set(formatterKey, formatter);
    }

    // Verificar se é uma criptomoeda que precisa de formatação personalizada
    if (this._isCryptoCurrency(currency)) {
      return this._formatCrypto(formattedValue, currency, formatter, options);
    }

    try {
      return formatter.format(formattedValue);
    } catch (error) {
      console.error('Erro ao formatar valor:', error);

      // Fallback: formatação simples
      return `${
        showSymbol ? this._getCurrencySymbol(currency) : ''
      }${formattedValue.toFixed(decimalPlaces || 2)}${
        showCode ? ` ${currency}` : ''
      }`;
    }
  }

  /**
   * Converte um valor monetário de uma moeda para outra
   * @param {number} value - Valor a ser convertido
   * @param {string} fromCurrency - Moeda de origem
   * @param {string} toCurrency - Moeda de destino
   * @param {number} rate - Taxa de conversão
   * @param {Object} options - Opções de formatação
   * @returns {string} - Valor convertido e formatado
   */
  convert(value, fromCurrency, toCurrency, rate, options = {}) {
    if (value === null || value === undefined || isNaN(value) || !rate) {
      return 'N/A';
    }

    // Realizar conversão
    const convertedValue = value * rate;

    // Formatar valor convertido
    return this.format(convertedValue, {
      currency: toCurrency,
      ...options,
    });
  }

  /**
   * Formata um valor para exibição compacta
   * @param {number} value - Valor a ser formatado
   * @param {Object} options - Opções de formatação
   * @returns {string} - Valor formatado de forma compacta
   */
  formatCompact(value, options = {}) {
    return this.format(value, { ...options, compact: true });
  }

  /**
   * Formata um valor para exibição como diferença percentual
   * @param {number} value - Valor percentual a ser formatado
   * @param {Object} options - Opções de formatação
   * @returns {string} - Valor percentual formatado
   */
  formatPercentage(value, options = {}) {
    const {
      decimalPlaces = 2,
      showSign = true,
      locale = this.locale,
    } = options;

    if (value === null || value === undefined || isNaN(value)) {
      return 'N/A';
    }

    const sign = value > 0 && showSign ? '+' : '';

    try {
      return `${sign}${value.toLocaleString(locale, {
        style: 'percent',
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces,
      })}`;
    } catch (error) {
      // Fallback
      return `${sign}${value.toFixed(decimalPlaces)}%`;
    }
  }

  /**
   * Formata a diferença entre dois valores
   * @param {number} currentValue - Valor atual
   * @param {number} previousValue - Valor anterior
   * @param {Object} options - Opções de formatação
   * @returns {string} - Diferença formatada
   */
  formatDifference(currentValue, previousValue, options = {}) {
    const {
      showPercentage = true,
      showAbsoluteValue = true,
      currency = this.defaultCurrency,
    } = options;

    if (
      currentValue === null ||
      currentValue === undefined ||
      isNaN(currentValue) ||
      previousValue === null ||
      previousValue === undefined ||
      isNaN(previousValue) ||
      previousValue === 0
    ) {
      return 'N/A';
    }

    // Calcular diferença absoluta
    const absoluteDiff = currentValue - previousValue;

    // Calcular diferença percentual
    const percentageDiff = (absoluteDiff / Math.abs(previousValue)) * 100;

    let result = '';

    // Adicionar valor absoluto
    if (showAbsoluteValue) {
      result += this.format(absoluteDiff, {
        currency,
        showSign: true,
        ...options,
      });
    }

    // Adicionar porcentagem
    if (showPercentage) {
      if (showAbsoluteValue) {
        result += ' (';
      }

      result += this.formatPercentage(percentageDiff / 100, options);

      if (showAbsoluteValue) {
        result += ')';
      }
    }

    return result;
  }

  /**
   * Formata um valor de criptomoeda
   * @param {number} value - Valor a ser formatado
   * @param {string} currency - Código da criptomoeda
   * @param {Intl.NumberFormat} formatter - Formatador a ser usado como base
   * @param {Object} options - Opções de formatação
   * @returns {string} - Valor formatado
   * @private
   */
  _formatCrypto(value, currency, formatter, options = {}) {
    const { showCode = false, showSymbol = true, decimalPlaces } = options;

    // Usar formatador base para o número
    let formatted = formatter.format(value);

    // Substituir pelo símbolo da criptomoeda, se necessário
    if (showSymbol) {
      // Identificar o símbolo atual no texto formatado
      // Isso é complexo pois o símbolo pode ser precedido por um espaço ou não
      const currencyRegex = this._getFiatCurrencyRegex(
        options.locale || this.locale
      );
      formatted = formatted.replace(
        currencyRegex,
        this._getCryptoSymbol(currency)
      );
    }

    // Adicionar código da moeda se necessário
    if (showCode && !formatted.includes(currency)) {
      formatted += ` ${currency}`;
    }

    return formatted;
  }

  /**
   * Verifica se uma moeda é uma criptomoeda
   * @param {string} currency - Código da moeda
   * @returns {boolean} - Se é uma criptomoeda
   * @private
   */
  _isCryptoCurrency(currency) {
    // Lista das principais criptomoedas
    const cryptoList = Object.keys(this.cryptoSymbols);
    return cryptoList.includes(currency);
  }

  /**
   * Obtém o símbolo de uma criptomoeda
   * @param {string} currency - Código da criptomoeda
   * @returns {string} - Símbolo da criptomoeda
   * @private
   */
  _getCryptoSymbol(currency) {
    return this.cryptoSymbols[currency] || currency;
  }

  /**
   * Obtém o símbolo de uma moeda
   * @param {string} currency - Código da moeda
   * @returns {string} - Símbolo da moeda
   * @private
   */
  _getCurrencySymbol(currency) {
    if (this._isCryptoCurrency(currency)) {
      return this._getCryptoSymbol(currency);
    }

    try {
      const formatter = new Intl.NumberFormat(this.locale, {
        style: 'currency',
        currency,
        currencyDisplay: 'symbol',
      });

      const parts = formatter.formatToParts(0);
      const symbolPart = parts.find((part) => part.type === 'currency');

      return symbolPart ? symbolPart.value : currency;
    } catch (error) {
      // Fallback para símbolos comuns
      const commonSymbols = {
        USD: '$',
        EUR: '€',
        GBP: '£',
        JPY: '¥',
        BRL: 'R$',
        CNY: '¥',
        INR: '₹',
        RUB: '₽',
        CAD: 'C$',
        AUD: 'A$',
      };

      return commonSymbols[currency] || currency;
    }
  }

  /**
   * Cria um formatador para valores monetários
   * @param {string} currency - Código da moeda
   * @param {string} locale - Localidade para formatação
   * @param {number} decimalPlaces - Casas decimais
   * @param {boolean} compact - Se deve usar notação compacta
   * @param {boolean} showSymbol - Se deve mostrar o símbolo
   * @param {boolean} showCode - Se deve mostrar o código da moeda
   * @returns {Intl.NumberFormat} - Formatador
   * @private
   */
  _createFormatter(
    currency,
    locale,
    decimalPlaces,
    compact,
    showSymbol,
    showCode
  ) {
    const options = {
      style: showSymbol ? 'currency' : 'decimal',
      currencyDisplay: showCode ? 'code' : 'symbol',
    };

    if (showSymbol || showCode) {
      options.currency = currency;
    }

    if (decimalPlaces !== undefined) {
      options.minimumFractionDigits = decimalPlaces;
      options.maximumFractionDigits = decimalPlaces;
    } else {
      // Se não especificado, usar valores padrão baseados na moeda
      const isCrypto = this._isCryptoCurrency(currency);
      const decimalDefaults = {
        BTC: 8,
        ETH: 6,
        BRL: 2,
        USD: 2,
      };

      const defaultDecimals = decimalDefaults[currency] || (isCrypto ? 6 : 2);
      options.minimumFractionDigits = defaultDecimals;
      options.maximumFractionDigits = defaultDecimals;
    }

    if (compact) {
      options.notation = 'compact';
      options.compactDisplay = 'short';
    }

    return new Intl.NumberFormat(locale, options);
  }

  /**
   * Obtém uma chave única para o formatador
   * @param {string} currency - Código da moeda
   * @param {string} locale - Localidade para formatação
   * @param {number} decimalPlaces - Casas decimais
   * @param {boolean} compact - Se deve usar notação compacta
   * @param {boolean} showSymbol - Se deve mostrar o símbolo
   * @param {boolean} showCode - Se deve mostrar o código da moeda
   * @returns {string} - Chave para o formatador
   * @private
   */
  _getFormatterKey(
    currency,
    locale,
    decimalPlaces,
    compact,
    showSymbol,
    showCode
  ) {
    return `${currency}_${locale}_${decimalPlaces || 'default'}_${
      compact ? '1' : '0'
    }_${showSymbol ? '1' : '0'}_${showCode ? '1' : '0'}`;
  }

  /**
   * Obtém um valor aproximado para exibição simplificada
   * @param {number} value - Valor original
   * @returns {number} - Valor aproximado
   * @private
   */
  _getApproximateValue(value) {
    const absValue = Math.abs(value);

    if (absValue >= 1000000000) {
      return Math.round(value / 100000000) * 100000000;
    } else if (absValue >= 100000000) {
      return Math.round(value / 10000000) * 10000000;
    } else if (absValue >= 10000000) {
      return Math.round(value / 1000000) * 1000000;
    } else if (absValue >= 1000000) {
      return Math.round(value / 100000) * 100000;
    } else if (absValue >= 100000) {
      return Math.round(value / 10000) * 10000;
    } else if (absValue >= 10000) {
      return Math.round(value / 1000) * 1000;
    } else if (absValue >= 1000) {
      return Math.round(value / 100) * 100;
    }

    return value;
  }

  /**
   * Obtém uma expressão regular para identificar símbolos de moedas fiat
   * @param {string} locale - Localidade para formatação
   * @returns {RegExp} - Expressão regular para símbolos monetários
   * @private
   */
  _getFiatCurrencyRegex(locale) {
    // Isso é uma aproximação, pois os símbolos variam por localidade
    return /[$€£¥₩₽₹R$]/g;
  }
}
