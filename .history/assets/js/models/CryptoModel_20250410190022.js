/**
 * CryptoModel.js
 * Responsável por gerenciar os dados de criptomoedas e fazer chamadas à API
 */
import CacheManager from '../utils/CacheManager.js';
import ErrorHandler from '../utils/ErrorHandler.js';
import Validator from '../utils/Validator.js';

export default class CryptoModel {
  constructor() {
    this.rates = {};
    this.apiKey = '12345ABCDE'; // Idealmente, isso deveria ser obtido de um arquivo de configuração seguro
    this.baseUrl = 'https://api.coingecko.com/api/v3';
    this.supportedCurrencies = ['USD', 'EUR', 'BRL', 'GBP', 'JPY'];
    this.supportedCryptos = ['tether', 'bitcoin', 'ethereum', 'litecoin', 'ripple', 'cardano'];
    this.defaultCurrency = 'BRL';
    this.defaultCrypto = 'tether';
    
    // Instâncias dos utilitários
    this.cacheManager = new CacheManager(15); // TTL de 15 minutos
    this.errorHandler = new ErrorHandler();
    
    // Chave para cache de taxas
    this.ratesCacheKey = 'current_rates';
  }

  /**
   * Busca as taxas de câmbio atualizadas da API
   * @returns {Promise} Promise com as taxas de câmbio
   */
  async fetchRates() {
    try {
      // Verifica se temos dados em cache primeiro
      const cachedRates = this.cacheManager.getItem(this.ratesCacheKey);
      
      if (cachedRates) {
        this.rates = cachedRates;
        console.log('Usando taxas em cache');
        return this.rates;
      }
      
      // Caso não tenha cache, busca da API
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
      
      // Salva os dados no cache
      this.cacheManager.setItem(this.ratesCacheKey, this.rates);
      
      return this.rates;
    } catch (error) {
      const formattedError = this.errorHandler.handleError(error, 'fetchRates');
      throw new Error(formattedError.message);
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
    try {
      // Validação das entradas
      Validator.validateCurrencyCode(fromCurrency, this.supportedCurrencies);
      Validator.validateCurrencyCode(toCrypto, this.supportedCryptos);
      Validator.validateAmount(amount);
      
      if (!this.rates[toCrypto] || !this.rates[toCrypto][fromCurrency.toLowerCase()]) {
        throw new Error(`Taxa de conversão não disponível para ${fromCurrency} para ${toCrypto}`);
      }
      
      const rate = this.rates[toCrypto][fromCurrency.toLowerCase()];
      // A conversão de FIAT para cripto é dividindo o valor pelo rate
      return amount / rate;
    } catch (error) {
      const formattedError = this.errorHandler.handleError(error, 'convert');
      throw new Error(formattedError.message);
    }
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
   * Retorna uma tabela com as taxas de câmbio filtradas pela moeda FIAT atual
   * @param {string} currentFiat - Moeda FIAT selecionada para filtrar as taxas
   * @returns {Array} Array de objetos com as taxas de câmbio filtradas
   */
  getFilteredRates(currentFiat) {
    const ratesTable = [];
    
    this.supportedCryptos.forEach(crypto => {
      if (this.rates[crypto] && this.rates[crypto][currentFiat.toLowerCase()]) {
        const rate = this.rates[crypto][currentFiat.toLowerCase()];
        ratesTable.push({
          crypto: crypto,
          currency: currentFiat,
          rate: rate
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

  /**
   * Limpa o cache de taxas para forçar uma atualização
   */
  clearRatesCache() {
    this.cacheManager.removeItem(this.ratesCacheKey);
  }
}