/**
 * Classe que representa uma moeda no sistema
 */
export class Currency {
  /**
   * @param {Object} params - Parâmetros para inicializar a moeda
   * @param {string} params.code - Código da moeda (ex: BTC, USD)
   * @param {string} params.name - Nome da moeda
   * @param {string} params.symbol - Símbolo da moeda
   * @param {string} params.type - Tipo da moeda ('crypto' ou 'fiat')
   * @param {string} [params.logo] - URL para o logo da moeda
   * @param {number} [params.precision] - Precisão padrão de casas decimais
   */
  constructor({ code, name, symbol, type, logo, precision } = {}) {
    if (!code) {
      throw new Error('O código da moeda é obrigatório');
    }

    this.code = code.toUpperCase();
    this.name = name || this.code;
    this.symbol = symbol || '';
    this.type = (type || 'fiat').toLowerCase();
    this.logo = logo || '';
    this.precision = precision || (this.type === 'crypto' ? 8 : 2);
  }

  /**
   * Verifica se a moeda é uma criptomoeda
   * @returns {boolean} Se é uma criptomoeda
   */
  isCrypto() {
    return this.type === 'crypto';
  }

  /**
   * Verifica se a moeda é fiduciária
   * @returns {boolean} Se é uma moeda fiduciária
   */
  isFiat() {
    return this.type === 'fiat';
  }

  /**
   * Formata um valor para exibição usando esta moeda
   * @param {number} value - Valor a formatar
   * @param {Object} [options] - Opções de formatação
   * @param {number} [options.precision] - Precisão de casas decimais
   * @param {string} [options.locale] - Locale para formatação
   * @returns {string} Valor formatado
   */
  formatValue(value, { precision, locale = 'pt-BR' } = {}) {
    if (typeof value !== 'number' || isNaN(value)) {
      return 'N/A';
    }

    const usePrecision = precision !== undefined ? precision : this.precision;

    // Configurar opções do formatador
    const options = {
      style: 'decimal',
      minimumFractionDigits: usePrecision,
      maximumFractionDigits: usePrecision,
    };

    // Formatar valor
    const formatter = new Intl.NumberFormat(locale, options);
    return `${this.symbol}${formatter.format(value)}`;
  }

  /**
   * Retorna a representação de string da moeda
   * @returns {string} Representação da moeda
   */
  toString() {
    return `${this.code} (${this.name})`;
  }

  /**
   * Retorna uma representação JSON serializável da moeda
   * @returns {Object} Objeto para serialização
   */
  toJSON() {
    return {
      code: this.code,
      name: this.name,
      symbol: this.symbol,
      type: this.type,
      logo: this.logo,
      precision: this.precision,
    };
  }

  /**
   * Cria uma instância de Currency a partir de dados da API
   * @param {Object} apiData - Dados retornados pela API
   * @returns {Currency} Nova instância da moeda
   * @static
   */
  static fromApiData(apiData) {
    // Diferentes APIs podem retornar formatos diferentes, então tentamos normalizar
    let type = 'fiat';

    // Tentar detectar se é uma criptomoeda
    const cryptoKeywords = ['crypto', 'token', 'coin'];
    const nameAndCode = `${apiData.name || ''} ${
      apiData.code || ''
    }`.toLowerCase();

    if (apiData.type) {
      // Se já tiver o campo tipo, usá-lo
      type = apiData.type.toLowerCase();
    } else if (
      cryptoKeywords.some((keyword) => nameAndCode.includes(keyword)) ||
      ['btc', 'eth', 'usdt', 'bnb'].includes((apiData.code || '').toLowerCase())
    ) {
      // Verificar palavras-chave ou códigos comuns de criptomoedas
      type = 'crypto';
    }

    return new Currency({
      code: apiData.code || apiData.id || apiData.symbol || '',
      name: apiData.name || apiData.fullName || apiData.currency_name || '',
      symbol: apiData.symbol || apiData.currency_symbol || '',
      type: type,
      logo: apiData.logo || apiData.image || apiData.icon || '',
      precision: parseInt(apiData.precision || 0) || null,
    });
  }

  /**
   * Verifica se dois objetos Currency são iguais
   * @param {Currency} other - Outra moeda para comparar
   * @returns {boolean} Se as moedas são iguais
   */
  equals(other) {
    if (!(other instanceof Currency)) {
      return false;
    }

    return this.code === other.code;
  }
}
