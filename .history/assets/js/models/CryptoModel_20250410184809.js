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
    this.supportedCryptos = ['tether', 'bitcoin', 'ethereum', 'litecoin', 'ripple', 'cardano'];
    this.defaultCurrency = 'BRL';
    this.defaultCrypto = 'tether';
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
   * Converte um valor de uma moeda fiduciária para uma criptomoeda
   * @param {string} fromCurrency - A moeda fiduciária de origem
   * @param {string} toCrypto - A criptomoeda de destino
   * @param {number} amount - O valor a ser convertido
   * @returns {number} O valor convertido
   */
  convert(fromCurrency, toCrypto, amount) {
    if (!this.rates[toCrypto] || !this.rates[toCrypto][fromCurrency.toLowerCase()]) {
      throw new Error(`Taxa de conversão não disponível para ${fromCurrency} para ${toCrypto}`);
    }
    
    const rate = this.rates[toCrypto][fromCurrency.toLowerCase()];
    // A conversão de FIAT para cripto é dividindo o valor pelo rate (inverso da conversão cripto->FIAT)
    return amount / rate;
  }

  /**
   * Retorna uma tabela com todas as taxas de conversão atuais
   * @returns {Array} Array de objetos com as taxas de conversão
   */
  getAllRates() {
    const ratesTable = [];
    
    this.supportedCryptos.forEach(crypto => {
      if (this.rates[crypto]) {
        this.supportedCurrencies.forEach(currency => {
          const rate = this.rates[crypto][currency.toLowerCase()];
          if (rate) {
            ratesTable.push({
              crypto: crypto,
              currency: currency,
              rate: rate
            });
          }
        });
      }
    });
    
    return ratesTable;
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

  /**
   * Obtém a moeda fiduciária padrão
   * @returns {string} Moeda padrão
   */
  getDefaultCurrency() {
    return this.defaultCurrency;
  }

  /**
   * Obtém a criptomoeda padrão
   * @returns {string} Criptomoeda padrão
   */
  getDefaultCrypto() {
    return this.defaultCrypto;
  }
}