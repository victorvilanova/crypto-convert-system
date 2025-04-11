/**
 * Serviço para conversão de criptomoedas
 * Gerencia taxas de câmbio e realiza conversões entre diferentes moedas
 */

import { notificationManager } from './NotificationManager';

// API URLs para taxas de câmbio
const API_ENDPOINTS = {
  CRYPTO_COMPARE: 'https://min-api.cryptocompare.com/data/price',
  COIN_GECKO: 'https://api.coingecko.com/api/v3/simple/price',
  BINANCE: 'https://api.binance.com/api/v3/ticker/price'
};

// Lista de moedas fiduciárias suportadas
const FIAT_CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'BRL', 'CAD', 'AUD', 'CHF'];

// Lista de criptomoedas suportadas
const CRYPTO_CURRENCIES = ['BTC', 'ETH', 'XRP', 'LTC', 'BCH', 'BNB', 'DOT', 'LINK', 'ADA', 'XLM'];

// Mapeamento para IDs da CoinGecko (quando diferentes do símbolo)
const COIN_GECKO_IDS = {
  'BTC': 'bitcoin',
  'ETH': 'ethereum',
  'XRP': 'ripple',
  'LTC': 'litecoin',
  'BCH': 'bitcoin-cash',
  'BNB': 'binancecoin',
  'DOT': 'polkadot',
  'LINK': 'chainlink',
  'ADA': 'cardano',
  'XLM': 'stellar',
  'SOL': 'solana',
  'DOGE': 'dogecoin',
  'AVAX': 'avalanche-2',
  'MATIC': 'matic-network',
  'UNI': 'uniswap'
};

/**
 * Serviço de conversão de criptomoedas
 */
export class CryptoConverter {
  constructor() {
    this.exchangeRates = {};
    this.lastFetchTime = null;
    this.cacheDuration = 5 * 60 * 1000; // 5 minutos em milissegundos
    this.apiKeys = {
      cryptoCompare: '', // Adicione sua chave de API aqui
      coinGecko: ''      // Adicione sua chave de API aqui
    };
    this.preferredAPI = 'COIN_GECKO'; // API padrão
    this.fallbackOrder = ['COIN_GECKO', 'CRYPTO_COMPARE', 'BINANCE']; // Ordem de fallback
    this.errorCounts = {
      CRYPTO_COMPARE: 0,
      COIN_GECKO: 0,
      BINANCE: 0
    };
    this.maxErrorsBeforeSwitch = 3; // Número de erros antes de trocar de API
    this.autoSwitchAPI = true; // Alternar API automaticamente em caso de falhas
    this.lastApiUsed = null; // Última API usada com sucesso
  }

  /**
   * Obtém a lista de criptomoedas suportadas
   * @returns {Array} Lista de símbolos de criptomoedas
   */
  getSupportedCryptos() {
    return [...CRYPTO_CURRENCIES];
  }

  /**
   * Obtém a lista de moedas fiduciárias suportadas
   * @returns {Array} Lista de símbolos de moedas fiduciárias
   */
  getSupportedFiat() {
    return [...FIAT_CURRENCIES];
  }

  /**
   * Verifica se as taxas de câmbio precisam ser atualizadas
   * @returns {boolean} Verdadeiro se os dados estiverem desatualizados
   */
  needsRateUpdate() {
    if (!this.lastFetchTime || Object.keys(this.exchangeRates).length === 0) {
      return true;
    }
    
    const now = Date.now();
    return (now - this.lastFetchTime) > this.cacheDuration;
  }

  /**
   * Atualiza as taxas de câmbio a partir da API
   * @returns {Promise<boolean>} Verdadeiro se a atualização foi bem-sucedida
   */
  async updateRates() {
    try {
      if (!this.needsRateUpdate()) {
        return true; // Usa cache se ainda for válido
      }
      
      let success = false;
      
      // Tenta a API preferida primeiro
      switch (this.preferredAPI) {
        case 'CRYPTO_COMPARE':
          success = await this.fetchFromCryptoCompare();
          break;
        case 'COIN_GECKO':
          success = await this.fetchFromCoinGecko();
          break;
        case 'BINANCE':
          success = await this.fetchFromBinance();
          break;
      }
      
      // Se falhar, tenta alternativas
      if (!success) {
        // Tentar CoinGecko como fallback
        if (this.preferredAPI !== 'COIN_GECKO') {
          success = await this.fetchFromCoinGecko();
        }
        
        // Se ainda falhar, tentar CryptoCompare
        if (!success && this.preferredAPI !== 'CRYPTO_COMPARE') {
          success = await this.fetchFromCryptoCompare();
        }
        
        // Última tentativa com Binance
        if (!success && this.preferredAPI !== 'BINANCE') {
          success = await this.fetchFromBinance();
        }
      }
      
      if (success) {
        this.lastFetchTime = Date.now();
        return true;
      } else {
        throw new Error('Não foi possível obter taxas de câmbio de nenhuma API');
      }
    } catch (error) {
      console.error('Erro ao atualizar taxas de câmbio:', error);
      notificationManager.error('Não foi possível atualizar as taxas de câmbio. Verifique sua conexão.', 'Erro');
      return false;
    }
  }

  /**
   * Busca taxas de câmbio da API CryptoCompare
   * @returns {Promise<boolean>} Verdadeiro se bem-sucedido
   */
  async fetchFromCryptoCompare() {
    try {
      const baseUrl = API_ENDPOINTS.CRYPTO_COMPARE;
      
      // Constrói a URL com parâmetros
      const params = new URLSearchParams();
      params.append('fsyms', CRYPTO_CURRENCIES.join(','));
      params.append('tsyms', FIAT_CURRENCIES.join(','));
      
      if (this.apiKeys.cryptoCompare) {
        params.append('api_key', this.apiKeys.cryptoCompare);
      }
      
      const response = await fetch(`${baseUrl}?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`API respondeu com status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Processar e armazenar as taxas
      this.processRatesFromCryptoCompare(data);
      return true;
    } catch (error) {
      console.error('Erro ao buscar taxas da CryptoCompare:', error);
      return false;
    }
  }

  /**
   * Processa as taxas de câmbio recebidas da CryptoCompare
   * @param {Object} data Dados da API
   */
  processRatesFromCryptoCompare(data) {
    if (!data) return;
    
    const newRates = {};
    
    // Para cada criptomoeda
    for (const crypto of CRYPTO_CURRENCIES) {
      if (data[crypto]) {
        newRates[crypto] = {};
        
        // Para cada moeda fiduciária
        for (const fiat of FIAT_CURRENCIES) {
          if (data[crypto][fiat]) {
            newRates[crypto][fiat] = data[crypto][fiat];
          }
        }
        
        // Adicionar conversões para outras criptomoedas
        for (const otherCrypto of CRYPTO_CURRENCIES) {
          if (crypto !== otherCrypto && data[crypto]['USD'] && data[otherCrypto]['USD']) {
            // Calculando taxa de conversão entre criptos via USD
            newRates[crypto][otherCrypto] = data[crypto]['USD'] / data[otherCrypto]['USD'];
          }
        }
      }
    }
    
    this.exchangeRates = newRates;
  }

  /**
   * Busca taxas de câmbio da API CoinGecko
   * @returns {Promise<boolean>} Verdadeiro se bem-sucedido
   */
  async fetchFromCoinGecko() {
    try {
      const baseUrl = API_ENDPOINTS.COIN_GECKO;
      
      // Mapear símbolos para IDs da CoinGecko
      const ids = CRYPTO_CURRENCIES.map(symbol => COIN_GECKO_IDS[symbol] || symbol.toLowerCase()).join(',');
      
      // Constrói a URL com parâmetros
      const params = new URLSearchParams();
      params.append('ids', ids);
      params.append('vs_currencies', FIAT_CURRENCIES.map(f => f.toLowerCase()).join(','));
      
      const response = await fetch(`${baseUrl}?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`API respondeu com status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Processar e armazenar as taxas
      this.processRatesFromCoinGecko(data);
      return true;
    } catch (error) {
      console.error('Erro ao buscar taxas da CoinGecko:', error);
      return false;
    }
  }

  /**
   * Processa as taxas de câmbio recebidas da CoinGecko
   * @param {Object} data Dados da API
   */
  processRatesFromCoinGecko(data) {
    if (!data) return;
    
    const newRates = {};
    const cryptoInUSD = {};
    
    // Para cada criptomoeda
    for (const crypto of CRYPTO_CURRENCIES) {
      const coinId = COIN_GECKO_IDS[crypto] || crypto.toLowerCase();
      
      if (data[coinId]) {
        newRates[crypto] = {};
        
        // Para cada moeda fiduciária
        for (const fiat of FIAT_CURRENCIES) {
          const fiatLower = fiat.toLowerCase();
          if (data[coinId][fiatLower]) {
            newRates[crypto][fiat] = data[coinId][fiatLower];
            
            // Armazenar valor em USD para cálculos crypto-to-crypto
            if (fiat === 'USD') {
              cryptoInUSD[crypto] = data[coinId]['usd'];
            }
          }
        }
      }
    }
    
    // Adicionar conversões crypto-to-crypto
    for (const crypto of CRYPTO_CURRENCIES) {
      if (newRates[crypto] && cryptoInUSD[crypto]) {
        for (const otherCrypto of CRYPTO_CURRENCIES) {
          if (crypto !== otherCrypto && cryptoInUSD[otherCrypto]) {
            newRates[crypto][otherCrypto] = cryptoInUSD[crypto] / cryptoInUSD[otherCrypto];
          }
        }
      }
    }
    
    this.exchangeRates = newRates;
  }

  /**
   * Busca taxas de câmbio da API Binance
   * @returns {Promise<boolean>} Verdadeiro se bem-sucedido
   */
  async fetchFromBinance() {
    try {
      const baseUrl = API_ENDPOINTS.BINANCE;
      
      const response = await fetch(baseUrl);
      
      if (!response.ok) {
        throw new Error(`API respondeu com status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Processar e armazenar as taxas
      this.processRatesFromBinance(data);
      return true;
    } catch (error) {
      console.error('Erro ao buscar taxas da Binance:', error);
      return false;
    }
  }

  /**
   * Processa as taxas de câmbio recebidas da Binance
   * @param {Object} data Dados da API
   */
  processRatesFromBinance(data) {
    if (!data || !Array.isArray(data)) return;
    
    const usdtPairs = {};
    const newRates = {};
    
    // Primeiro, encontrar todos os pares USDT
    for (const ticker of data) {
      if (ticker.symbol && ticker.symbol.endsWith('USDT') && ticker.price) {
        const crypto = ticker.symbol.replace('USDT', '');
        if (CRYPTO_CURRENCIES.includes(crypto)) {
          usdtPairs[crypto] = parseFloat(ticker.price);
        }
      }
    }
    
    // Se temos o preço do USDT em USD (aproximadamente 1:1), podemos calcular as taxas
    for (const crypto in usdtPairs) {
      newRates[crypto] = {
        'USD': 1 / usdtPairs[crypto] // Preço em USDT é aproximadamente USD
      };
      
      // Calcular conversões entre criptos
      for (const otherCrypto in usdtPairs) {
        if (crypto !== otherCrypto) {
          newRates[crypto][otherCrypto] = usdtPairs[otherCrypto] / usdtPairs[crypto];
        }
      }
    }
    
    // Se já temos taxas, mesclamos; caso contrário, substituímos
    if (Object.keys(this.exchangeRates).length > 0) {
      for (const crypto in newRates) {
        if (!this.exchangeRates[crypto]) {
          this.exchangeRates[crypto] = {};
        }
        
        for (const currency in newRates[crypto]) {
          this.exchangeRates[crypto][currency] = newRates[crypto][currency];
        }
      }
    } else {
      this.exchangeRates = newRates;
    }
  }

  /**
   * Realiza a conversão entre moedas
   * @param {number} amount Valor a ser convertido
   * @param {string} fromCurrency Moeda de origem
   * @param {string} toCurrency Moeda de destino
   * @returns {Promise<number>} Valor convertido
   */
  async convert(amount, fromCurrency, toCurrency) {
    try {
      // Validar parâmetros
      if (!amount || isNaN(amount)) {
        throw new Error('Valor inválido para conversão');
      }
      
      // Normalizar símbolos das moedas
      fromCurrency = fromCurrency.toUpperCase();
      toCurrency = toCurrency.toUpperCase();
      
      // Verificar se as moedas são suportadas
      if (![...CRYPTO_CURRENCIES, ...FIAT_CURRENCIES].includes(fromCurrency)) {
        throw new Error(`Moeda de origem não suportada: ${fromCurrency}`);
      }
      
      if (![...CRYPTO_CURRENCIES, ...FIAT_CURRENCIES].includes(toCurrency)) {
        throw new Error(`Moeda de destino não suportada: ${toCurrency}`);
      }
      
      // Se as moedas são iguais, retornar o mesmo valor
      if (fromCurrency === toCurrency) {
        return amount;
      }
      
      // Atualizar taxas se necessário
      const ratesUpdated = await this.updateRates();
      if (!ratesUpdated) {
        throw new Error('Não foi possível atualizar as taxas de câmbio');
      }
      
      // Realizar conversão direta se possível
      if (CRYPTO_CURRENCIES.includes(fromCurrency) && this.exchangeRates[fromCurrency]) {
        if (this.exchangeRates[fromCurrency][toCurrency]) {
          return amount * this.exchangeRates[fromCurrency][toCurrency];
        }
      }
      
      // Tentativa de conversão via USD para fiduciárias
      if (FIAT_CURRENCIES.includes(fromCurrency) && FIAT_CURRENCIES.includes(toCurrency)) {
        // Precisamos de uma crypto de referência, como BTC
        if (
          this.exchangeRates['BTC'] && 
          this.exchangeRates['BTC']['USD'] && 
          this.exchangeRates['BTC'][fromCurrency] && 
          this.exchangeRates['BTC'][toCurrency]
        ) {
          // Calculamos via BTC
          const amountInBTC = amount / this.exchangeRates['BTC'][fromCurrency];
          return amountInBTC * this.exchangeRates['BTC'][toCurrency];
        }
      }
      
      // Conversão de fiat para crypto
      if (FIAT_CURRENCIES.includes(fromCurrency) && CRYPTO_CURRENCIES.includes(toCurrency)) {
        if (
          this.exchangeRates[toCurrency] && 
          this.exchangeRates[toCurrency][fromCurrency]
        ) {
          return amount / this.exchangeRates[toCurrency][fromCurrency];
        }
      }
      
      // Conversão de crypto para fiat
      if (CRYPTO_CURRENCIES.includes(fromCurrency) && FIAT_CURRENCIES.includes(toCurrency)) {
        if (
          this.exchangeRates[fromCurrency] && 
          this.exchangeRates[fromCurrency][toCurrency]
        ) {
          return amount * this.exchangeRates[fromCurrency][toCurrency];
        }
      }
      
      // Conversão através de USD como intermediário
      if (CRYPTO_CURRENCIES.includes(fromCurrency) && CRYPTO_CURRENCIES.includes(toCurrency)) {
        if (
          this.exchangeRates[fromCurrency] && 
          this.exchangeRates[toCurrency] && 
          this.exchangeRates[fromCurrency]['USD'] && 
          this.exchangeRates[toCurrency]['USD']
        ) {
          const amountInUSD = amount * this.exchangeRates[fromCurrency]['USD'];
          return amountInUSD / this.exchangeRates[toCurrency]['USD'];
        }
      }
      
      throw new Error(`Não foi possível encontrar uma taxa de conversão para ${fromCurrency} → ${toCurrency}`);
    } catch (error) {
      console.error('Erro ao converter:', error);
      notificationManager.error(error.message, 'Erro na conversão');
      return null;
    }
  }

  /**
   * Obtém a taxa de câmbio entre duas moedas
   * @param {string} fromCurrency Moeda de origem
   * @param {string} toCurrency Moeda de destino
   * @returns {Promise<number>} Taxa de câmbio
   */
  async getExchangeRate(fromCurrency, toCurrency) {
    // Simplesmente converte 1 unidade
    return this.convert(1, fromCurrency, toCurrency);
  }

  /**
   * Define a API preferida para obter taxas
   * @param {string} apiName Nome da API (CRYPTO_COMPARE, COIN_GECKO, BINANCE)
   */
  setPreferredAPI(apiName) {
    if (['CRYPTO_COMPARE', 'COIN_GECKO', 'BINANCE'].includes(apiName)) {
      this.preferredAPI = apiName;
    } else {
      console.warn('API não reconhecida:', apiName);
    }
  }

  /**
   * Define a duração do cache de taxas
   * @param {number} minutes Duração em minutos
   */
  setCacheDuration(minutes) {
    if (minutes > 0) {
      this.cacheDuration = minutes * 60 * 1000;
    }
  }

  /**
   * Define chaves de API
   * @param {Object} keys Objeto com chaves de API
   */
  setAPIKeys(keys) {
    if (keys.cryptoCompare) {
      this.apiKeys.cryptoCompare = keys.cryptoCompare;
    }
    
    if (keys.coinGecko) {
      this.apiKeys.coinGecko = keys.coinGecko;
    }
  }
}

// Instância padrão do conversor
export const cryptoConverter = new CryptoConverter();

// Exportar como padrão
export default cryptoConverter;