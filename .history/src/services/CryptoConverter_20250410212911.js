/**
 * CryptoConverter - Serviço para conversão entre criptomoedas e moedas fiduciárias
 * Permite converter valores entre diferentes moedas usando taxas de câmbio atualizadas
 */

// Exemplo de taxas fixas para demonstração
// Em um sistema real, você buscaria esses dados de uma API como CoinGecko, Binance, etc.
const DEFAULT_RATES = {
  // Criptomoedas para USD
  'BTC-USD': 39845.23,
  'ETH-USD': 2238.71,
  'BNB-USD': 505.62,
  'SOL-USD': 142.18,
  'ADA-USD': 0.48,
  'DOT-USD': 6.92,
  'XRP-USD': 0.59,
  
  // Moedas fiduciárias para USD
  'EUR-USD': 1.09,
  'GBP-USD': 1.28,
  'JPY-USD': 0.0067,
  'BRL-USD': 0.18,
  'CAD-USD': 0.74,
  'AUD-USD': 0.67,
  'CNY-USD': 0.14
};

/**
 * Classe de conversão de criptomoedas
 */
export class CryptoConverter {
  /**
   * @param {Object} options - Opções para o conversor
   * @param {Object} options.customRates - Taxas de câmbio personalizadas
   * @param {string} options.apiKey - Chave de API (para implementações futuras)
   * @param {string} options.source - Fonte dos dados (ex: 'coinGecko', 'binance')
   */
  constructor(options = {}) {
    this.rates = { ...DEFAULT_RATES, ...(options.customRates || {}) };
    this.apiKey = options.apiKey || null;
    this.source = options.source || 'default';
    this.lastUpdated = new Date();
  }

  /**
   * Converte um valor de uma moeda para outra
   * @param {number} amount - Valor a ser convertido
   * @param {string} fromCurrency - Moeda de origem (ex: 'BTC', 'USD', 'EUR')
   * @param {string} toCurrency - Moeda de destino (ex: 'BTC', 'USD', 'EUR')
   * @returns {number} Valor convertido
   * @throws {Error} Erro se a conversão não for possível
   */
  convert(amount, fromCurrency, toCurrency) {
    // Validação de entrada
    if (!amount || isNaN(amount)) {
      throw new Error('Valor inválido para conversão');
    }
    
    if (!fromCurrency || !toCurrency) {
      throw new Error('Moedas de origem e destino são obrigatórias');
    }
    
    // Normalizar moedas (maiúsculas)
    fromCurrency = fromCurrency.toUpperCase();
    toCurrency = toCurrency.toUpperCase();
    
    // Se as moedas forem iguais, retornar o mesmo valor
    if (fromCurrency === toCurrency) {
      return amount;
    }
    
    // Converter para USD primeiro (moeda base)
    let amountInUSD;
    
    // Verificar se a moeda de origem é USD
    if (fromCurrency === 'USD') {
      amountInUSD = amount;
    } else {
      // Buscar taxa de conversão para USD
      const rateToUSD = this._getRateToUSD(fromCurrency);
      if (!rateToUSD) {
        throw new Error(`Taxa de conversão não encontrada para ${fromCurrency} para USD`);
      }
      amountInUSD = amount * rateToUSD;
    }
    
    // Se a moeda de destino for USD, já temos o resultado
    if (toCurrency === 'USD') {
      return this._formatValue(amountInUSD);
    }
    
    // Converter de USD para a moeda de destino
    const rateFromUSD = this._getRateFromUSD(toCurrency);
    if (!rateFromUSD) {
      throw new Error(`Taxa de conversão não encontrada para USD para ${toCurrency}`);
    }
    
    // Calcular e retornar o valor final formatado
    return this._formatValue(amountInUSD / rateFromUSD);
  }
  
  /**
   * Obtém a taxa de conversão entre duas moedas
   * @param {string} fromCurrency - Moeda de origem (ex: 'BTC', 'USD', 'EUR')
   * @param {string} toCurrency - Moeda de destino (ex: 'BTC', 'USD', 'EUR')
   * @returns {number} Taxa de conversão
   * @throws {Error} Erro se a taxa não for encontrada
   */
  getRate(fromCurrency, toCurrency) {
    return this.convert(1, fromCurrency, toCurrency);
  }
  
  /**
   * Obtém a taxa de conversão de uma moeda para USD
   * @private
   * @param {string} currency - Moeda (ex: 'BTC', 'EUR')
   * @returns {number|null} Taxa de conversão ou null se não encontrada
   */
  _getRateToUSD(currency) {
    // Verificar se é uma criptomoeda -> USD
    const cryptoKey = `${currency}-USD`;
    if (this.rates[cryptoKey]) {
      return this.rates[cryptoKey];
    }
    
    // Verificar se é uma moeda fiduciária -> USD
    const fiatKey = `${currency}-USD`;
    if (this.rates[fiatKey]) {
      return this.rates[fiatKey];
    }
    
    return null;
  }
  
  /**
   * Obtém a taxa de conversão de USD para uma moeda
   * @private
   * @param {string} currency - Moeda (ex: 'BTC', 'EUR')
   * @returns {number|null} Taxa de conversão ou null se não encontrada
   */
  _getRateFromUSD(currency) {
    // Para criptomoedas, usamos a mesma taxa USD -> Crypto
    const cryptoKey = `${currency}-USD`;
    if (this.rates[cryptoKey]) {
      return this.rates[cryptoKey];
    }
    
    // Para moedas fiduciárias
    const fiatKey = `${currency}-USD`;
    if (this.rates[fiatKey]) {
      return this.rates[fiatKey];
    }
    
    return null;
  }
  
  /**
   * Formata o valor com 8 casas decimais para criptomoedas e 2 para moedas fiduciárias
   * @private
   * @param {number} value - Valor a ser formatado
   * @returns {number} Valor formatado
   */
  _formatValue(value) {
    // Limitar a 8 casas decimais para evitar números muito longos
    // Em uma aplicação real, você pode ajustar a precisão com base no tipo de moeda
    return parseFloat(value.toFixed(8));
  }
  
  /**
   * Atualiza as taxas de câmbio
   * @param {Object} newRates - Novas taxas de câmbio
   */
  updateRates(newRates) {
    this.rates = { ...this.rates, ...newRates };
    this.lastUpdated = new Date();
    return this;
  }
  
  /**
   * Carrega taxas de câmbio de uma API externa
   * @param {string} source - Fonte dos dados (ex: 'coinGecko', 'binance')
   * @returns {Promise<void>}
   */
  async fetchRates(source = null) {
    // Em uma implementação real, você faria chamadas para APIs aqui
    // Este é um exemplo com uma promessa simulada
    
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simulando as taxas atualizadas
        const updatedRates = { ...this.rates };
        
        // Simular pequenas mudanças nas taxas
        Object.keys(updatedRates).forEach(key => {
          // Variação aleatória de ±2%
          const variation = 1 + (Math.random() * 0.04 - 0.02);
          updatedRates[key] = updatedRates[key] * variation;
        });
        
        this.updateRates(updatedRates);
        resolve(this.rates);
      }, 500); // Simular atraso de rede
    });
  }
  
  /**
   * Retorna a lista de moedas suportadas
   * @returns {Object} Objeto com listas de criptomoedas e moedas fiduciárias
   */
  getSupportedCurrencies() {
    const currencies = {
      crypto: new Set(),
      fiat: new Set()
    };
    
    // Extrair moedas das taxas
    Object.keys(this.rates).forEach(key => {
      const [from, to] = key.split('-');
      
      // Classificar entre cripto e fiat (simplificado)
      // Na prática, você teria uma lista de referência
      if (to === 'USD' && from !== 'USD') {
        if (['BTC', 'ETH', 'BNB', 'SOL', 'ADA', 'DOT', 'XRP'].includes(from)) {
          currencies.crypto.add(from);
        } else {
          currencies.fiat.add(from);
        }
      }
    });
    
    // Adicionar USD às moedas fiduciárias
    currencies.fiat.add('USD');
    
    return {
      crypto: Array.from(currencies.crypto),
      fiat: Array.from(currencies.fiat)
    };
  }
}

// Instância padrão para uso imediato
export const cryptoConverter = new CryptoConverter();

// Exportar como padrão para facilitar o uso
export default cryptoConverter;