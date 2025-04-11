/**
 * ArbitrageCalculator.js
 * Classe para calcular oportunidades de arbitragem entre criptomoedas
 */

export default class ArbitrageCalculator {
  constructor() {
    this.rates = {}; // Taxas de conversão
    this.exchanges = {}; // Taxas por exchange
    this.minProfitPercentage = 1.0; // Lucro mínimo (1%)
    this.initialInvestment = 1000; // Investimento inicial padrão (R$)
    this.feePercentage = 0.2; // Taxa de 0.2% por transação
  }

  /**
   * Define as taxas de câmbio
   * @param {Object} rates - Objeto com taxas na forma: { 'BTC': 270000, 'ETH': 9800, ... }
   */
  setRates(rates) {
    this.rates = rates;
    // Também gera taxas simuladas para diferentes exchanges
    this.generateExchangeRates();
  }

  /**
   * Define o percentual mínimo de lucro para considerar oportunidades
   * @param {number} percentage - Percentual de lucro mínimo
   */
  setMinProfitPercentage(percentage) {
    this.minProfitPercentage = percentage;
  }

  /**
   * Define o valor inicial do investimento para simulações
   * @param {number} amount - Valor em reais
   */
  setInitialInvestment(amount) {
    this.initialInvestment = amount;
  }

  /**
   * Simula taxas em diferentes exchanges com variações aleatórias
   */
  generateExchangeRates() {
    const exchanges = ['Binance', 'Coinbase', 'Mercado Bitcoin', 'NovaDax', 'BitPreço'];
    this.exchanges = {};

    // Para cada exchange, gerar taxas com pequenas variações
    exchanges.forEach(exchange => {
      this.exchanges[exchange] = {};
      
      // Para cada cripto, gerar variações aleatórias nas taxas
      Object.keys(this.rates).forEach(crypto => {
        const baseRate = this.rates[crypto];
        const variation = Math.random() * 0.08 - 0.04; // Variação de -4% a +4%
        this.exchanges[exchange][crypto] = baseRate * (1 + variation);
      });
    });
  }

  /**
   * Encontra oportunidades de arbitragem triangular entre criptomoedas
   * @returns {Array} Lista de oportunidades de arbitragem
   */
  findTriangularArbitrageOpportunities() {
    const opportunities = [];
    const cryptos = Object.keys(this.rates);
    
    // Escolhe uma moeda base para começar (BTC, ETH, USDT são boas opções)
    const baseCryptos = cryptos.filter(c => ['BTC', 'ETH', 'USDT', 'BRL'].includes(c));
    
    // Para cada moeda base, tenta encontrar rotas triangulares
    baseCryptos.forEach(baseCrypto => {
      // Gera todas as combinações possíveis de pares de criptomoedas
      for (let i = 0; i < cryptos.length; i++) {
        if (cryptos[i] === baseCrypto) continue;
        
        for (let j = i + 1; j < cryptos.length; j++) {
          if (cryptos[j] === baseCrypto) continue;
          
          // Rota triangular: baseCrypto -> cryptos[i] -> cryptos[j] -> baseCrypto
          const route1 = this.calculateTriangularArbitrage(
            baseCrypto, cryptos[i], cryptos[j]
          );
          
          if (route1.profitPercentage > this.minProfitPercentage) {
            opportunities.push(route1);
          }
          
          // Rota triangular inversa: baseCrypto -> cryptos[j] -> cryptos[i] -> baseCrypto
          const route2 = this.calculateTriangularArbitrage(
            baseCrypto, cryptos[j], cryptos[i]
          );
          
          if (route2.profitPercentage > this.minProfitPercentage) {
            opportunities.push(route2);
          }
        }
      }
    });
    
    // Ordenar oportunidades por percentual de lucro (decrescente)
    return opportunities.sort((a, b) => b.profitPercentage - a.profitPercentage);
  }

  /**
   * Calcula uma rota de arbitragem triangular específica
   * @param {string} crypto1 - Primeiro ativo da rota
   * @param {string} crypto2 - Segundo ativo da rota
   * @param {string} crypto3 - Terceiro ativo da rota
   * @returns {Object} Detalhes da oportunidade
   */
  calculateTriangularArbitrage(crypto1, crypto2, crypto3) {
    // Valores iniciais
    const initial = this.initialInvestment;
    let current = initial;
    
    // Calcular taxas diretas ou inversas dependendo da combinação
    const steps = [];
    
    // Passo 1: crypto1 -> crypto2
    const rate1 = this.getExchangeRate(crypto1, crypto2);
    const step1Amount = current * rate1 * (1 - this.feePercentage / 100);
    steps.push({ from: crypto1, to: crypto2, rate: rate1, amount: step1Amount });
    current = step1Amount;
    
    // Passo 2: crypto2 -> crypto3
    const rate2 = this.getExchangeRate(crypto2, crypto3);
    const step2Amount = current * rate2 * (1 - this.feePercentage / 100);
    steps.push({ from: crypto2, to: crypto3, rate: rate2, amount: step2Amount });
    current = step2Amount;
    
    // Passo 3: crypto3 -> crypto1
    const rate3 = this.getExchangeRate(crypto3, crypto1);
    const step3Amount = current * rate3 * (1 - this.feePercentage / 100);
    steps.push({ from: crypto3, to: crypto1, rate: rate3, amount: step3Amount });
    current = step3Amount;
    
    // Calcular resultado final
    const final = current;
    const profit = final - initial;
    const profitPercentage = (profit / initial) * 100;
    
    return {
      route: `${crypto1} → ${crypto2} → ${crypto3} → ${crypto1}`,
      initial,
      final,
      profit,
      profitPercentage,
      steps
    };
  }

  /**
   * Encontra oportunidades de arbitragem entre diferentes exchanges
   * @returns {Array} Lista de oportunidades de arbitragem entre exchanges
   */
  findExchangeArbitrageOpportunities() {
    const opportunities = [];
    const cryptos = Object.keys(this.rates);
    const exchanges = Object.keys(this.exchanges);
    
    // Para cada criptomoeda, encontrar pares de exchanges com diferenças significativas
    cryptos.forEach(crypto => {
      const pricesByExchange = {};
      
      // Obter preço em cada exchange
      exchanges.forEach(exchange => {
        pricesByExchange[exchange] = this.exchanges[exchange][crypto];
      });
      
      // Encontrar o menor e maior preço entre exchanges
      let lowestPrice = Infinity;
      let highestPrice = 0;
      let lowestExchange = '';
      let highestExchange = '';
      
      exchanges.forEach(exchange => {
        const price = pricesByExchange[exchange];
        
        if (price < lowestPrice) {
          lowestPrice = price;
          lowestExchange = exchange;
        }
        
        if (price > highestPrice) {
          highestPrice = price;
          highestExchange = exchange;
        }
      });
      
      // Calcular percentual de lucro potencial
      const profitPercentage = ((highestPrice - lowestPrice) / lowestPrice * 100) - (this.feePercentage * 2);
      
      // Se o lucro for maior que o mínimo, adicionar oportunidade
      if (profitPercentage > this.minProfitPercentage) {
        opportunities.push({
          crypto,
          buyExchange: lowestExchange,
          sellExchange: highestExchange,
          buyPrice: lowestPrice.toFixed(2),
          sellPrice: highestPrice.toFixed(2),
          profitPercentage
        });
      }
    });
    
    // Ordenar oportunidades por percentual de lucro (decrescente)
    return opportunities.sort((a, b) => b.profitPercentage - a.profitPercentage);
  }

  /**
   * Calcula a taxa de conversão entre duas criptomoedas
   * @param {string} fromCrypto - Criptomoeda de origem
   * @param {string} toCrypto - Criptomoeda de destino
   * @returns {number} Taxa de conversão
   */
  getExchangeRate(fromCrypto, toCrypto) {
    if (fromCrypto === toCrypto) return 1;
    
    // Se for BRL, tratamos como caso especial
    if (fromCrypto === 'BRL') {
      return 1 / this.rates[toCrypto];
    }
    
    if (toCrypto === 'BRL') {
      return this.rates[fromCrypto];
    }
    
    // Calculamos através de BRL como intermediário
    const fromToBRL = this.rates[fromCrypto];
    const brlToTarget = 1 / this.rates[toCrypto];
    
    return fromToBRL * brlToTarget;
  }
}
