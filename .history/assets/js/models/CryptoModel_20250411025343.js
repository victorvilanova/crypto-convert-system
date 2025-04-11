/**
 * CryptoModel.js
 * Modelo para armazenamento e manipulação de dados de criptomoedas
 */
import CacheManager from '../utils/CacheManager.js';
import ErrorHandler from '../utils/ErrorHandler.js';
import Validator from '../utils/Validator.js';

export default class CryptoModel {
  constructor() {
    // Dados de criptomoedas 
    this.cryptos = {
      'bitcoin': {
        id: 'bitcoin',
        symbol: 'BTC',
        name: 'Bitcoin',
        price: 0,
        change24h: 0,
        volume24h: 0,
        lastUpdated: null
      },
      'ethereum': {
        id: 'ethereum',
        symbol: 'ETH',
        name: 'Ethereum',
        price: 0,
        change24h: 0,
        volume24h: 0,
        lastUpdated: null
      },
      'tether': {
        id: 'tether',
        symbol: 'USDT',
        name: 'Tether',
        price: 0,
        change24h: 0,
        volume24h: 0,
        lastUpdated: null
      },
      'ripple': {
        id: 'ripple',
        symbol: 'XRP',
        name: 'XRP',
        price: 0,
        change24h: 0,
        volume24h: 0,
        lastUpdated: null
      },
      'cardano': {
        id: 'cardano',
        symbol: 'ADA',
        name: 'Cardano',
        price: 0,
        change24h: 0,
        volume24h: 0,
        lastUpdated: null
      },
      'solana': {
        id: 'solana',
        symbol: 'SOL',
        name: 'Solana',
        price: 0,
        change24h: 0,
        volume24h: 0,
        lastUpdated: null
      },
      'polkadot': {
        id: 'polkadot',
        symbol: 'DOT',
        name: 'Polkadot',
        price: 0,
        change24h: 0,
        volume24h: 0,
        lastUpdated: null
      }
    };
    
    // Taxas de câmbio entre criptomoedas (simuladas por enquanto)
    this.exchangeRates = {};
    
    // Dados de exchanges
    this.exchanges = {
      'binance': {
        name: 'Binance',
        fees: 0.001, // 0.1%
        prices: {}
      },
      'coinbase': {
        name: 'Coinbase',
        fees: 0.0015, // 0.15%
        prices: {}
      },
      'ftx': {
        name: 'FTX',
        fees: 0.0007, // 0.07%
        prices: {}
      }
    };

    this.rates = {};
    this.apiKey = '12345ABCDE'; // Idealmente, isso deveria ser obtido de um arquivo de configuração seguro
    this.baseUrl = 'https://api.coingecko.com/api/v3';
    this.supportedCurrencies = ['USD', 'EUR', 'BRL', 'GBP', 'JPY'];
    this.supportedCryptos = [
      'tether',
      'bitcoin',
      'ethereum',
      'litecoin',
      'ripple',
      'cardano',
    ];
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

      if (
        !this.rates[toCrypto] ||
        !this.rates[toCrypto][fromCurrency.toLowerCase()]
      ) {
        throw new Error(
          `Taxa de conversão não disponível para ${fromCurrency} para ${toCrypto}`
        );
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

    this.supportedCryptos.forEach((crypto) => {
      if (this.rates[crypto]) {
        this.supportedCurrencies.forEach((currency) => {
          const rate = this.rates[crypto][currency.toLowerCase()];
          if (rate) {
            ratesTable.push({
              crypto: crypto,
              currency: currency,
              rate: rate,
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

    this.supportedCryptos.forEach((crypto) => {
      if (this.rates[crypto] && this.rates[crypto][currentFiat.toLowerCase()]) {
        const rate = this.rates[crypto][currentFiat.toLowerCase()];
        ratesTable.push({
          crypto: crypto,
          currency: currentFiat,
          rate: rate,
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

  /**
   * Atualiza o preço de uma criptomoeda
   * @param {string} cryptoId - ID da criptomoeda (ex: 'bitcoin')
   * @param {number} price - Preço atual em USD
   */
  updatePrice(cryptoId, price) {
    if (this.cryptos[cryptoId]) {
      // Calcula a variação em relação ao preço anterior
      const oldPrice = this.cryptos[cryptoId].price;
      let change24h = 0;
      
      if (oldPrice > 0) {
        change24h = ((price - oldPrice) / oldPrice) * 100;
      }
      
      // Atualiza os dados
      this.cryptos[cryptoId].price = price;
      this.cryptos[cryptoId].change24h = change24h;
      this.cryptos[cryptoId].lastUpdated = new Date();
      
      // Para simulação, atualiza preços nas exchanges com pequenas variações
      this.updateExchangePrices(cryptoId, price);
      
      return true;
    }
    return false;
  }
  
  /**
   * Atualiza os preços simulados em diferentes exchanges
   * @param {string} cryptoId - ID da criptomoeda
   * @param {number} basePrice - Preço base em USD
   */
  updateExchangePrices(cryptoId, basePrice) {
    // Gera variações de preço para simular diferenças entre exchanges
    Object.keys(this.exchanges).forEach(exchangeId => {
      // Variação aleatória de -1.5% a +1.5% para simular diferenças entre exchanges
      const variation = (Math.random() * 0.03) - 0.015;
      const price = basePrice * (1 + variation);
      
      // Armazena o preço para esta exchange
      this.exchanges[exchangeId].prices[cryptoId] = price;
    });
    
    // Atualiza as taxas de câmbio
    this.updateExchangeRates();
  }
  
  /**
   * Atualiza as taxas de câmbio entre todas as criptomoedas
   */
  updateExchangeRates() {
    // Obtém as criptomoedas com preços válidos
    const validCryptos = Object.values(this.cryptos).filter(crypto => crypto.price > 0);
    
    // Para cada par de criptomoedas, calcula a taxa de conversão
    validCryptos.forEach(fromCrypto => {
      if (!this.exchangeRates[fromCrypto.id]) {
        this.exchangeRates[fromCrypto.id] = {};
      }
      
      validCryptos.forEach(toCrypto => {
        // Não precisamos de taxa para a mesma criptomoeda
        if (fromCrypto.id === toCrypto.id) {
          this.exchangeRates[fromCrypto.id][toCrypto.id] = 1;
          return;
        }
        
        // A taxa é o preço da moeda de origem dividido pelo preço da moeda de destino
        // Isso nos dá: quantas unidades da moeda de destino você recebe por uma unidade da moeda de origem
        const rate = fromCrypto.price / toCrypto.price;
        this.exchangeRates[fromCrypto.id][toCrypto.id] = rate;
      });
    });
  }
  
  /**
   * Obtém a taxa de câmbio entre duas criptomoedas
   * @param {string} fromCryptoId - ID da criptomoeda de origem
   * @param {string} toCryptoId - ID da criptomoeda de destino
   * @returns {number} Taxa de câmbio
   */
  getExchangeRate(fromCryptoId, toCryptoId) {
    if (
      this.exchangeRates[fromCryptoId] &&
      this.exchangeRates[fromCryptoId][toCryptoId] !== undefined
    ) {
      return this.exchangeRates[fromCryptoId][toCryptoId];
    }
    return 0;
  }
  
  /**
   * Obtém dados de uma criptomoeda
   * @param {string} cryptoId - ID da criptomoeda
   * @returns {Object|null} Dados da criptomoeda ou null se não existir
   */
  getCrypto(cryptoId) {
    return this.cryptos[cryptoId] || null;
  }
  
  /**
   * Obtém o preço de uma criptomoeda em uma exchange específica
   * @param {string} cryptoId - ID da criptomoeda
   * @param {string} exchangeId - ID da exchange
   * @returns {number} Preço ou 0 se não existir
   */
  getPriceInExchange(cryptoId, exchangeId) {
    if (
      this.exchanges[exchangeId] &&
      this.exchanges[exchangeId].prices[cryptoId] !== undefined
    ) {
      return this.exchanges[exchangeId].prices[cryptoId];
    }
    return 0;
  }
  
  /**
   * Obtém todas as criptomoedas
   * @returns {Object} Objeto com todas as criptomoedas
   */
  getAllCryptos() {
    return this.cryptos;
  }
  
  /**
   * Obtém todas as exchanges
   * @returns {Object} Objeto com todas as exchanges
   */
  getAllExchanges() {
    return this.exchanges;
  }
}
