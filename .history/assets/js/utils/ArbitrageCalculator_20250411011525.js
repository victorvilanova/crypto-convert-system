/**
 * ArbitrageCalculator.js
 * Utilitário para cálculos e detecção de oportunidades de arbitragem
 */

export default class ArbitrageCalculator {
  constructor() {
    // Configurações
    this.minProfitPercentage = 0.5; // Porcentagem mínima de lucro para considerar uma oportunidade (0.5%)
    this.defaultInvestment = 1000; // Valor inicial para simulações (1000 USD)
    
    // Taxas fictícias para simulação
    this.exchangeRates = {
      'BTC-USD': 60502.35,
      'ETH-USD': 3280.47,
      'BTC-ETH': 18.48, // ~1 BTC = 18.48 ETH
      'USDT-USD': 0.99,
      'BTC-USDT': 60500.10,
      'ETH-USDT': 3279.80,
      'XRP-USD': 0.50,
      'LTC-USD': 82.64,
      'ADA-USD': 0.45,
      'DOT-USD': 6.45,
      'SOL-USD': 140.80,
      'BNB-USD': 565.70,
      'DOGE-USD': 0.12,
      'XLM-USD': 0.12,
      'LINK-USD': 14.52,
      'UNI-USD': 7.80,
      'AAVE-USD': 82.45,
      'COMP-USD': 56.32,
      'MATIC-USD': 0.77,
      'SNX-USD': 3.20
    };
    
    // Taxas entre exchanges (diferenças de preço simuladas)
    this.exchangePrices = {
      'BTC': {
        'Binance': 60500.00,
        'Coinbase': 60600.35,
        'Kraken': 60480.50,
        'Huobi': 60505.75,
        'FTX': 60525.40
      },
      'ETH': {
        'Binance': 3280.00,
        'Coinbase': 3282.25,
        'Kraken': 3278.40,
        'Huobi': 3281.50,
        'FTX': 3279.30
      },
      'XRP': {
        'Binance': 0.501,
        'Coinbase': 0.505,
        'Kraken': 0.499,
        'Huobi': 0.502,
        'FTX': 0.500
      },
      'SOL': {
        'Binance': 140.50,
        'Coinbase': 141.20,
        'Kraken': 140.40,
        'Huobi': 140.75,
        'FTX': 140.95
      },
      'MATIC': {
        'Binance': 0.769,
        'Coinbase': 0.772,
        'Kraken': 0.766,
        'Huobi': 0.768,
        'FTX': 0.771
      }
    };
    
    // Taxa de conversão entre pares - formato 'par': taxa
    this.conversionFees = {
      'BTC-USD': 0.1, // 0.1% fee
      'ETH-USD': 0.1,
      'BTC-ETH': 0.15,
      'XRP-USD': 0.1,
      'SOL-USD': 0.1,
      'default': 0.1 // taxa padrão para pares não especificados
    };
    
    // Taxa de transferência entre exchanges - % cobrada para transferir entre exchanges
    this.transferFees = {
      'BTC': 0.0004, // em BTC
      'ETH': 0.005, // em ETH
      'XRP': 0.25, // 0.25 XRP
      'SOL': 0.01, // 0.01 SOL
      'USDT': 1, // 1 USDT
      'default': 0.1 // porcentagem padrão para outras moedas
    };
  }
  
  /**
   * Define a porcentagem mínima de lucro para considerar uma oportunidade
   * @param {number} percentage - Porcentagem mínima (ex: 0.5 para 0.5%)
   */
  setMinProfitPercentage(percentage) {
    if (typeof percentage === 'number' && percentage > 0) {
      this.minProfitPercentage = percentage;
    }
  }
  
  /**
   * Calcula a taxa de conversão entre duas moedas
   * @param {string} fromCurrency - Moeda de origem
   * @param {string} toCurrency - Moeda de destino
   * @returns {number} Taxa de conversão (unidades de toCurrency por unidade de fromCurrency)
   */
  getConversionRate(fromCurrency, toCurrency) {
    const pair = `${fromCurrency}-${toCurrency}`;
    const inversePair = `${toCurrency}-${fromCurrency}`;
    
    if (pair in this.exchangeRates) {
      return this.exchangeRates[pair];
    } else if (inversePair in this.exchangeRates) {
      return 1 / this.exchangeRates[inversePair];
    }
    
    // Tenta calcular indiretamente via USD
    if (`${fromCurrency}-USD` in this.exchangeRates && `${toCurrency}-USD` in this.exchangeRates) {
      const fromToUSD = this.exchangeRates[`${fromCurrency}-USD`];
      const toToUSD = this.exchangeRates[`${toCurrency}-USD`];
      return fromToUSD / toToUSD;
    }
    
    // Caso não encontre
    console.warn(`Taxa de conversão não encontrada para ${fromCurrency}-${toCurrency}`);
    return null;
  }
  
  /**
   * Calcula a taxa de conversão já considerando taxas
   * @param {string} fromCurrency - Moeda de origem
   * @param {string} toCurrency - Moeda de destino
   * @returns {number} Taxa de conversão após aplicar taxas
   */
  getEffectiveRate(fromCurrency, toCurrency) {
    const baseRate = this.getConversionRate(fromCurrency, toCurrency);
    if (baseRate === null) return null;
    
    // Aplica taxa de conversão
    const pair = `${fromCurrency}-${toCurrency}`;
    const fee = this.conversionFees[pair] || this.conversionFees.default;
    
    // Reduz a taxa pelo valor das taxas
    return baseRate * (1 - fee / 100);
  }
  
  /**
   * Encontra oportunidades de arbitragem triangular
   * @returns {Array} Lista de oportunidades de arbitragem
   */
  findTriangularArbitrageOpportunities() {
    const opportunities = [];
    const currencies = ['USD', 'BTC', 'ETH', 'USDT', 'XRP', 'SOL'];

    // Para cada trio possível de moedas
    for (let i = 0; i < currencies.length; i++) {
      for (let j = 0; j < currencies.length; j++) {
        if (j === i) continue;
        
        for (let k = 0; k < currencies.length; k++) {
          if (k === i || k === j) continue;
          
          const startCurrency = currencies[i];
          const middleCurrency = currencies[j];
          const endCurrency = currencies[k];
          
          // Verifica se há taxas para todos os pares
          const rate1 = this.getEffectiveRate(startCurrency, middleCurrency);
          const rate2 = this.getEffectiveRate(middleCurrency, endCurrency);
          const rate3 = this.getEffectiveRate(endCurrency, startCurrency);
          
          if (rate1 === null || rate2 === null || rate3 === null) continue;
          
          // Calcula resultado do circuito triangular
          const startAmount = this.defaultInvestment;
          const middleAmount = startAmount * rate1;
          const endAmount = middleAmount * rate2;
          const finalAmount = endAmount * rate3;
          
          // Calcula o lucro percentual
          const profitPercentage = ((finalAmount / startAmount) - 1) * 100;
          
          // Se o lucro for maior que o mínimo, adiciona à lista
          if (profitPercentage > this.minProfitPercentage) {
            opportunities.push({
              route: `${startCurrency} → ${middleCurrency} → ${endCurrency} → ${startCurrency}`,
              steps: [
                { from: startCurrency, to: middleCurrency, rate: rate1.toFixed(6) },
                { from: middleCurrency, to: endCurrency, rate: rate2.toFixed(6) },
                { from: endCurrency, to: startCurrency, rate: rate3.toFixed(6) }
              ],
              startAmount,
              finalAmount,
              profit: finalAmount - startAmount,
              profitPercentage: profitPercentage.toFixed(4)
            });
          }
        }
      }
    }
    
    // Ordena por porcentagem de lucro (maior primeiro)
    return opportunities.sort((a, b) => 
      parseFloat(b.profitPercentage) - parseFloat(a.profitPercentage)
    );
  }
  
  /**
   * Encontra oportunidades de arbitragem entre diferentes exchanges
   * @returns {Array} Lista de oportunidades de arbitragem entre exchanges
   */
  findExchangeArbitrageOpportunities() {
    const opportunities = [];
    const cryptos = Object.keys(this.exchangePrices);
    const exchanges = Object.keys(this.exchangePrices['BTC']); // Assume que BTC está em todas as exchanges
    
    for (const crypto of cryptos) {
      // Para cada par de exchanges
      for (let i = 0; i < exchanges.length; i++) {
        for (let j = 0; j < exchanges.length; j++) {
          if (i === j) continue;
          
          const buyExchange = exchanges[i];
          const sellExchange = exchanges[j];
          
          const buyPrice = this.exchangePrices[crypto][buyExchange];
          const sellPrice = this.exchangePrices[crypto][sellExchange];
          
          // Calcula o lucro potencial (sem considerar taxas)
          let profitPercentage = ((sellPrice / buyPrice) - 1) * 100;
          
          // Estima taxas de transferência entre exchanges
          const transferFee = this.transferFees[crypto] || this.transferFees.default;
          let transferCost;
          
          if (transferFee < 1) { // Se for um valor absoluto da moeda
            // Estima quanto da moeda seria comprado com o investimento padrão
            const amount = this.defaultInvestment / buyPrice;
            transferCost = (transferFee / amount) * 100; // Converte para percentual
          } else {
            transferCost = transferFee; // Já é percentual
          }
          
          // Deduz custos das taxas de transferência
          profitPercentage -= transferCost;
          
          // Se ainda houver lucro acima do mínimo
          if (profitPercentage > this.minProfitPercentage) {
            opportunities.push({
              crypto,
              buyExchange,
              sellExchange,
              buyPrice: buyPrice.toFixed(2),
              sellPrice: sellPrice.toFixed(2),
              profitPercentage: profitPercentage.toFixed(2),
              // Informações adicionais
              transferFee: typeof transferFee < 1 ? `${transferFee} ${crypto}` : `${transferFee}%`,
              estimatedProfit: ((this.defaultInvestment * profitPercentage) / 100).toFixed(2)
            });
          }
        }
      }
    }
    
    // Ordena por porcentagem de lucro (maior primeiro)
    return opportunities.sort((a, b) => 
      parseFloat(b.profitPercentage) - parseFloat(a.profitPercentage)
    );
  }
  
  /**
   * Simula uma rota de arbitragem específica para verificar a lucratividade
   * @param {Array} route - Array com as moedas na ordem da rota [startCurrency, currency2, currency3, ...]
   * @param {number} [startAmount] - Montante inicial para a simulação
   * @returns {Object} Resultado da simulação com lucro calculado
   */
  simulateArbitrageRoute(route, startAmount = this.defaultInvestment) {
    if (!Array.isArray(route) || route.length < 3) {
      console.error('Rota inválida para simulação de arbitragem');
      return null;
    }
    
    const steps = [];
    let currentAmount = startAmount;
    
    // Simula cada passo da conversão
    for (let i = 0; i < route.length - 1; i++) {
      const fromCurrency = route[i];
      const toCurrency = route[i + 1];
      
      const rate = this.getEffectiveRate(fromCurrency, toCurrency);
      if (rate === null) {
        console.error(`Taxa não encontrada para ${fromCurrency}-${toCurrency}`);
        return null;
      }
      
      const nextAmount = currentAmount * rate;
      
      steps.push({
        from: fromCurrency,
        to: toCurrency,
        rate: rate.toFixed(6),
        startAmount: currentAmount.toFixed(6),
        endAmount: nextAmount.toFixed(6)
      });
      
      currentAmount = nextAmount;
    }
    
    // Verifica se a rota é fechada (volta para a moeda inicial)
    const isClosed = route[0] === route[route.length - 1];
    
    // Calcula resultados
    const profitPercentage = ((currentAmount / startAmount) - 1) * 100;
    
    return {
      route: route.join(' → '),
      steps,
      startAmount,
      finalAmount: currentAmount,
      profit: currentAmount - startAmount,
      profitPercentage: profitPercentage.toFixed(4),
      isViable: profitPercentage > this.minProfitPercentage,
      isClosed
    };
  }
  
  /**
   * Atualiza as taxas de câmbio com dados reais (simulado para desenvolvimento)
   */
  updateExchangeRates() {
    // Em um sistema real, aqui chamaríamos uma API para obter taxas de câmbio atualizadas
    // Para desenvolvimento, vamos apenas simular pequenas variações aleatórias
    
    // Simula alterações nas taxas de até ±0.5%
    Object.keys(this.exchangeRates).forEach(pair => {
      const variation = (Math.random() * 0.01) - 0.005; // -0.5% a +0.5%
      this.exchangeRates[pair] *= (1 + variation);
    });
    
    // Simula variações entre exchanges
    Object.keys(this.exchangePrices).forEach(crypto => {
      Object.keys(this.exchangePrices[crypto]).forEach(exchange => {
        const variation = (Math.random() * 0.01) - 0.005; // -0.5% a +0.5%
        this.exchangePrices[crypto][exchange] *= (1 + variation);
      });
    });
  }
}
