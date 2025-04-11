/**
 * ArbitrageService.js
 * Serviço para gerenciar lógica de negócios relacionada à arbitragem de criptomoedas
 */
export default class ArbitrageService {
  constructor() {
    this.apiBaseUrl = '/api';
    this.minProfitPercentage = 1.0; // Lucro mínimo percentual para considerar uma oportunidade
    this.lastTriangularData = [];
    this.lastExchangeData = [];
    this.cachedPriceData = {};
    this.cacheTimeout = 30000; // 30 segundos
    this.lastCacheUpdate = 0;
  }

  /**
   * Define o percentual mínimo de lucro para considerar oportunidades
   * @param {number} percentage - Percentual mínimo (ex: 1.5 para 1.5%)
   */
  setMinProfitPercentage(percentage) {
    if (percentage > 0) {
      this.minProfitPercentage = percentage;
      console.log(`Limiar de lucro atualizado para ${percentage}%`);
      return true;
    }
    return false;
  }

  /**
   * Retorna o percentual mínimo de lucro atual
   * @returns {number} Percentual mínimo de lucro
   */
  getMinProfitPercentage() {
    return this.minProfitPercentage;
  }

  /**
   * Busca oportunidades de arbitragem triangular
   * @returns {Promise<Array>} Promessa que resolve para um array de oportunidades
   */
  async getTriangularArbitrageOpportunities() {
    try {
      // Em produção, isso seria uma chamada real à API
      // const response = await fetch(`${this.apiBaseUrl}/arbitrage/triangular?minProfit=${this.minProfitPercentage}`);
      // const data = await response.json();
      
      // Simulação de dados para desenvolvimento
      const data = await this.simulateTriangularArbitrage();
      this.lastTriangularData = data;
      
      return data.filter(opp => opp.profitPercentage >= this.minProfitPercentage);
    } catch (error) {
      console.error('Erro ao buscar oportunidades de arbitragem triangular:', error);
      throw error;
    }
  }

  /**
   * Busca oportunidades de arbitragem entre exchanges
   * @returns {Promise<Array>} Promessa que resolve para um array de oportunidades
   */
  async getExchangeArbitrageOpportunities() {
    try {
      // Em produção, isso seria uma chamada real à API
      // const response = await fetch(`${this.apiBaseUrl}/arbitrage/exchanges?minProfit=${this.minProfitPercentage}`);
      // const data = await response.json();
      
      // Simulação de dados para desenvolvimento
      const data = await this.simulateExchangeArbitrage();
      this.lastExchangeData = data;
      
      return data.filter(opp => opp.profitPercentage >= this.minProfitPercentage);
    } catch (error) {
      console.error('Erro ao buscar oportunidades de arbitragem entre exchanges:', error);
      throw error;
    }
  }

  /**
   * Busca as taxas mais recentes para um par específico
   * @param {string} fromCurrency - Moeda de origem
   * @param {string} toCurrency - Moeda de destino
   * @returns {Promise<number>} Taxa de conversão
   */
  async getExchangeRate(fromCurrency, toCurrency) {
    if (!fromCurrency || !toCurrency) {
      throw new Error('Moedas de origem e destino são obrigatórias');
    }
    
    try {
      await this.refreshPriceDataIfNeeded();
      
      const key = `${fromCurrency}_${toCurrency}`;
      if (this.cachedPriceData[key]) {
        return this.cachedPriceData[key];
      }
      
      // Cálculo reverso se temos a taxa invertida
      const reverseKey = `${toCurrency}_${fromCurrency}`;
      if (this.cachedPriceData[reverseKey]) {
        return 1 / this.cachedPriceData[reverseKey];
      }
      
      throw new Error(`Taxa de conversão não encontrada para ${fromCurrency} -> ${toCurrency}`);
    } catch (error) {
      console.error('Erro ao obter taxa de conversão:', error);
      throw error;
    }
  }

  /**
   * Atualiza o cache de preços se necessário
   * @private
   */
  async refreshPriceDataIfNeeded() {
    const now = Date.now();
    if (now - this.lastCacheUpdate > this.cacheTimeout) {
      try {
        // Em produção, isso seria uma chamada real à API
        // const response = await fetch(`${this.apiBaseUrl}/rates/all`);
        // this.cachedPriceData = await response.json();
        
        // Simulação de dados para desenvolvimento
        this.cachedPriceData = this.simulatePriceData();
        this.lastCacheUpdate = now;
      } catch (error) {
        console.error('Erro ao atualizar cache de preços:', error);
      }
    }
  }

  /**
   * Simula dados de preços para desenvolvimento
   * @private
   * @returns {Object} Objeto de taxas simuladas
   */
  simulatePriceData() {
    // Taxa base para os pares principais
    return {
      'BTC_USD': 62000 + (Math.random() * 2000 - 1000),
      'ETH_USD': 3200 + (Math.random() * 200 - 100),
      'BNB_USD': 580 + (Math.random() * 40 - 20),
      'USDT_USD': 1 + (Math.random() * 0.02 - 0.01),
      'SOL_USD': 130 + (Math.random() * 10 - 5),
      'XRP_USD': 0.54 + (Math.random() * 0.04 - 0.02),
      'USDC_USD': 1 + (Math.random() * 0.01 - 0.005),
      'ADA_USD': 0.45 + (Math.random() * 0.05 - 0.025),
      'AVAX_USD': 35 + (Math.random() * 3 - 1.5),
      'DOGE_USD': 0.12 + (Math.random() * 0.02 - 0.01),
      'ETH_BTC': 0.053 + (Math.random() * 0.002 - 0.001),
      'BNB_BTC': 0.0093 + (Math.random() * 0.0005 - 0.00025),
      'XRP_BTC': 0.000009 + (Math.random() * 0.000001 - 0.0000005),
      'SOL_BTC': 0.0021 + (Math.random() * 0.0002 - 0.0001),
      'ADA_BTC': 0.0000073 + (Math.random() * 0.0000005 - 0.00000025),
      'AVAX_BTC': 0.00056 + (Math.random() * 0.00004 - 0.00002),
      'DOGE_BTC': 0.0000019 + (Math.random() * 0.0000002 - 0.0000001),
      'ETH_USDT': 3190 + (Math.random() * 180 - 90),
      'BTC_USDT': 61800 + (Math.random() * 1800 - 900),
      'BNB_USDT': 575 + (Math.random() * 35 - 17.5),
      'SOL_USDT': 129 + (Math.random() * 9 - 4.5),
      'XRP_USDT': 0.535 + (Math.random() * 0.03 - 0.015),
      'ADA_USDT': 0.448 + (Math.random() * 0.04 - 0.02),
      'AVAX_USDT': 34.8 + (Math.random() * 2.8 - 1.4),
      'DOGE_USDT': 0.119 + (Math.random() * 0.015 - 0.0075)
    };
  }

  /**
   * Simula dados de arbitragem triangular para desenvolvimento
   * @private
   * @returns {Promise<Array>} Promessa que resolve para um array de oportunidades simuladas
   */
  async simulateTriangularArbitrage() {
    // Atraso simulado de API
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
    
    const opportunities = [];
    const pairs = ['BTC', 'ETH', 'USDT', 'BNB', 'SOL'];
    
    // Gera entre 0 e 10 oportunidades
    const numOpportunities = Math.floor(Math.random() * 10);
    
    for (let i = 0; i < numOpportunities; i++) {
      // Escolhe 3 moedas aleatórias para a rota
      const shuffled = [...pairs].sort(() => 0.5 - Math.random());
      const selectedCoins = shuffled.slice(0, 3);
      
      // Lucro é um valor aleatório entre 0.1% e 7%
      const profitPercentage = 0.1 + Math.random() * 6.9;
      
      // Configura os passos da arbitragem
      const steps = [
        {
          from: selectedCoins[0],
          to: selectedCoins[1],
          rate: 1 + Math.random() * 0.1
        },
        {
          from: selectedCoins[1],
          to: selectedCoins[2],
          rate: 1 + Math.random() * 0.1
        },
        {
          from: selectedCoins[2],
          to: selectedCoins[0],
          rate: 1 + Math.random() * 0.1
        }
      ];
      
      // Calcula valores financeiros
      const startAmount = 1000;
      const finalAmount = startAmount * (1 + profitPercentage/100);
      
      opportunities.push({
        route: `${selectedCoins[0]} → ${selectedCoins[1]} → ${selectedCoins[2]} → ${selectedCoins[0]}`,
        steps,
        startAmount,
        finalAmount,
        profit: finalAmount - startAmount,
        profitPercentage,
        timestamp: new Date().toISOString()
      });
    }
    
    // Ordena por maior lucro primeiro
    return opportunities.sort((a, b) => b.profitPercentage - a.profitPercentage);
  }

  /**
   * Simula dados de arbitragem entre exchanges para desenvolvimento
   * @private
   * @returns {Promise<Array>} Promessa que resolve para um array de oportunidades simuladas
   */
  async simulateExchangeArbitrage() {
    // Atraso simulado de API
    await new Promise(resolve => setTimeout(resolve, 600 + Math.random() * 800));
    
    const opportunities = [];
    const cryptos = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA', 'AVAX', 'DOGE'];
    const exchanges = ['Binance', 'Coinbase', 'Kraken', 'Kucoin', 'OKX'];
    
    // Gera entre 0 e 15 oportunidades
    const numOpportunities = Math.floor(Math.random() * 15);
    
    for (let i = 0; i < numOpportunities; i++) {
      // Escolhe uma moeda aleatória
      const crypto = cryptos[Math.floor(Math.random() * cryptos.length)];
      
      // Escolhe duas exchanges diferentes
      let shuffledExchanges = [...exchanges].sort(() => 0.5 - Math.random());
      const buyExchange = shuffledExchanges[0];
      const sellExchange = shuffledExchanges[1];
      
      // Gera preços com diferença 
      let basePrice;
      switch (crypto) {
        case 'BTC': basePrice = 62000; break;
        case 'ETH': basePrice = 3200; break;
        case 'SOL': basePrice = 130; break;
        case 'BNB': basePrice = 580; break;
        case 'XRP': basePrice = 0.54; break;
        case 'ADA': basePrice = 0.45; break;
        case 'AVAX': basePrice = 35; break;
        case 'DOGE': basePrice = 0.12; break;
        default: basePrice = 100;
      }
      
      // Lucro é um valor aleatório entre 0.5% e 8%
      const profitPercentage = 0.5 + Math.random() * 7.5;
      
      // O preço de compra é menor que o de venda
      const buyPrice = basePrice * (1 - profitPercentage/200);
      const sellPrice = basePrice * (1 + profitPercentage/200);
      
      opportunities.push({
        crypto,
        buyExchange,
        sellExchange,
        buyPrice,
        sellPrice,
        profitPercentage,
        timestamp: new Date().toISOString()
      });
    }
    
    // Ordena por maior lucro primeiro
    return opportunities.sort((a, b) => b.profitPercentage - a.profitPercentage);
  }
}