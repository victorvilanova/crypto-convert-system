/**
 * ArbitrageCalculator.js
 * Classe para cálculo de oportunidades de arbitragem de criptomoedas
 */
export default class ArbitrageCalculator {
  constructor() {
    this.rates = {};
    this.exchangeRates = {};
    this.minProfitPercentage = 1.0; // Lucro mínimo aceitável (1%)
    this.transactionFee = 0.1; // Taxa por transação (0.1%)
  }

  /**
   * Define taxas de câmbio para cálculos
   * @param {Object} rates - Objeto com taxas de câmbio
   */
  setRates(rates) {
    this.rates = rates;
    this.processExchangeRates();
  }

  /**
   * Define a porcentagem mínima de lucro para considerar uma oportunidade
   * @param {number} percentage - Porcentagem de lucro mínima
   */
  setMinProfitPercentage(percentage) {
    this.minProfitPercentage = percentage;
  }

  /**
   * Processa taxas de exchange para formato interno
   */
  processExchangeRates() {
    // Em uma aplicação real, isso processaria as taxas de vários exchanges
    // Para o exemplo, estamos simulando múltiplos exchanges com variações de preço
    
    const exchanges = ['Binance', 'Coinbase', 'Kraken', 'Huobi', 'Bitfinex'];
    this.exchangeRates = {};
    
    // Para cada moeda, criar taxas ligeiramente diferentes para cada exchange
    Object.keys(this.rates).forEach(crypto => {
      this.exchangeRates[crypto] = {};
      
      exchanges.forEach(exchange => {
        // Variação aleatória de até ±2%
        const variation = 1 + (Math.random() * 0.04 - 0.02);
        this.exchangeRates[crypto][exchange] = this.rates[crypto] * variation;
      });
    });
  }

  /**
   * Encontra oportunidades de arbitragem triangular
   * (Exemplo: BRL -> BTC -> ETH -> BRL com lucro)
   * @returns {Array} - Lista de oportunidades de arbitragem triangular
   */
  findTriangularArbitrageOpportunities() {
    const opportunities = [];
    const baseCurrency = 'BRL';
    const cryptos = Object.keys(this.rates).filter(c => c !== baseCurrency);
    
    // Para cada par de criptomoedas, verificar arbitragem triangular
    for (let i = 0; i < cryptos.length; i++) {
      for (let j = i + 1; j < cryptos.length; j++) {
        const crypto1 = cryptos[i];
        const crypto2 = cryptos[j];
        
        // Rota 1: BRL -> Crypto1 -> Crypto2 -> BRL
        const route1 = this.calculateTriangularArbitrage(baseCurrency, crypto1, crypto2);
        if (route1.profitPercentage > this.minProfitPercentage) {
          opportunities.push(route1);
        }
        
        // Rota 2: BRL -> Crypto2 -> Crypto1 -> BRL
        const route2 = this.calculateTriangularArbitrage(baseCurrency, crypto2, crypto1);
        if (route2.profitPercentage > this.minProfitPercentage) {
          opportunities.push(route2);
        }
      }
    }
    
    // Ordenar por lucratividade
    return opportunities.sort((a, b) => b.profitPercentage - a.profitPercentage);
  }

  /**
   * Calcula resultado de uma arbitragem triangular específica
   * @param {string} base - Moeda base
   * @param {string} mid1 - Primeira criptomoeda intermediária
   * @param {string} mid2 - Segunda criptomoeda intermediária
   * @returns {Object} - Detalhes da oportunidade de arbitragem
   */
  calculateTriangularArbitrage(base, mid1, mid2) {
    // Valores iniciais
    const initial = 1000; // R$ 1.000,00
    let current = initial;
    
    // Passo 1: Base -> Mid1
    const rate1 = 1 / this.rates[mid1];
    const step1Amount = current * rate1 * (1 - this.transactionFee / 100);
    
    // Passo 2: Mid1 -> Mid2
    const rate2 = this.getExchangeRate(mid1, mid2);
    const step2Amount = step1Amount * rate2 * (1 - this.transactionFee / 100);
    
    // Passo 3: Mid2 -> Base
    const rate3 = this.rates[mid2];
    const final = step2Amount * rate3 * (1 - this.transactionFee / 100);
    
    // Calcular lucro
    const profit = final - initial;
    const profitPercentage = (profit / initial) * 100;
    
    return {
      route: `${base} → ${mid1} → ${mid2} → ${base}`,
      steps: [
        { from: base, to: mid1, rate: rate1.toFixed(8) },
        { from: mid1, to: mid2, rate: rate2.toFixed(8) },
        { from: mid2, to: base, rate: rate3.toFixed(8) }
      ],
      initial,
      final,
      profit,
      profitPercentage: parseFloat(profitPercentage.toFixed(2))
    };
  }
  
  /**
   * Encontra oportunidades de arbitragem entre exchanges diferentes
   * @returns {Array} - Lista de oportunidades de arbitragem entre exchanges
   */
  findExchangeArbitrageOpportunities() {
    const opportunities = [];
    const cryptos = Object.keys(this.rates).filter(c => c !== 'BRL');
    
    cryptos.forEach(crypto => {
      const exchanges = Object.keys(this.exchangeRates[crypto]);
      
      // Encontrar o exchange com menor preço (para compra)
      const buyExchange = exchanges.reduce((a, b) => 
        this.exchangeRates[crypto][a] < this.exchangeRates[crypto][b] ? a : b
      );
      const buyPrice = this.exchangeRates[crypto][buyExchange];
      
      // Encontrar o exchange com maior preço (para venda)
      const sellExchange = exchanges.reduce((a, b) => 
        this.exchangeRates[crypto][a] > this.exchangeRates[crypto][b] ? a : b
      );
      const sellPrice = this.exchangeRates[crypto][sellExchange];
      
      // Calcular diferença percentual
      const priceDiff = sellPrice - buyPrice;
      const profitPercentage = (priceDiff / buyPrice) * 100 - (this.transactionFee * 2);
      
      // Se o lucro for maior que o mínimo, adicionar à lista
      if (profitPercentage > this.minProfitPercentage && buyExchange !== sellExchange) {
        opportunities.push({
          crypto,
          buyExchange,
          sellExchange,
          buyPrice: buyPrice.toFixed(2),
          sellPrice: sellPrice.toFixed(2),
          profitPercentage: parseFloat(profitPercentage.toFixed(2))
        });
      }
    });
    
    // Ordenar por lucratividade
    return opportunities.sort((a, b) => b.profitPercentage - a.profitPercentage);
  }
  
  /**
   * Obtém taxa de câmbio entre duas criptomoedas
   * @param {string} from - Criptomoeda de origem
   * @param {string} to - Criptomoeda de destino
   * @returns {number} - Taxa de câmbio
   */
  getExchangeRate(from, to) {
    // Calcular taxa indireta via BRL
    const fromToBrl = this.rates[from];
    const brlToTo = 1 / this.rates[to];
    
    return fromToBrl * brlToTo;
  }
}
