/**
 * CryptoModel.js
 * Responsável por gerenciar os dados de criptomoedas e fazer chamadas à API
 */
export default class CryptoModel {
  constructor() {
    this.rates = {};
    this.apiKey = '12345ABCDE'; // Idealmente, isso deveria ser obtido de um arquivo de configuração seguro
    this.baseUrl = 'https://api.coingecko.com/api/v3';
    this.supportedCurrencies = ['USD', 'EUR', 'BRL', 'GBP', 'JPY'];
    this.supportedCryptos = [
      'bitcoin',
      'ethereum',
      'litecoin',
      'ripple',
      'cardano',
    ];
  }

  /**
   * Busca as taxas de câmbio atualizadas da API
   * @returns {Promise} Promise com as taxas de câmbio
   */
  async fetchRates() {
    try {
      const cryptoIds = this.supportedCryptos.join(',');
      const currencies = this.supportedCurrencies.join(',').toLowerCase();

      const response = await fetch(
        `${this.baseUrl}/simple/price?ids=${cryptoIds}&vs_currencies=${currencies}`
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      this.rates = data;
      return this.rates;
    } catch (error) {
      console.error('Error fetching crypto rates:', error);
      throw error;
    }
  }

  /**
   * Converte um valor de uma criptomoeda para uma moeda fiduciária
   * @param {string} fromCrypto - A criptomoeda de origem
   * @param {string} toCurrency - A moeda fiduciária de destino
   * @param {number} amount - O valor a ser convertido
   * @returns {number} O valor convertido
   */
  convert(fromCrypto, toCurrency, amount) {
    if (
      !this.rates[fromCrypto] ||
      !this.rates[fromCrypto][toCurrency.toLowerCase()]
    ) {
      throw new Error(
        `Conversion rate not available for ${fromCrypto} to ${toCurrency}`
      );
    }

    const rate = this.rates[fromCrypto][toCurrency.toLowerCase()];
    return amount * rate;
  }

  /**
   * Obtém as criptomoedas suportadas
   * @returns {string[]} Array de criptomoedas suportadas
   */
  getSupportedCryptos() {
    return this.supportedCryptos;
  }

  /**
   * Obtém as moedas fiduciárias suportadas
   * @returns {string[]} Array de moedas suportadas
   */
  getSupportedCurrencies() {
    return this.supportedCurrencies;
  }
}
