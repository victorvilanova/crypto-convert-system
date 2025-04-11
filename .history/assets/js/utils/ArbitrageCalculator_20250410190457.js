/**
 * ArbitrageCalculator.js
 * Utilitário para detecção de oportunidades de arbitragem entre criptomoedas
 */
export default class ArbitrageCalculator {
  constructor(ratesData) {
    this.rates = ratesData || {};
    this.opportunities = [];
    this.minProfitPercentage = 1.5; // Lucro mínimo de 1.5% para considerar uma oportunidade
  }

  /**
   * Define os dados de taxas
   * @param {Object} ratesData - Dados de taxas de câmbio
   */
  setRates(ratesData) {
    this.rates = ratesData || {};
  }

  /**
   * Define a porcentagem mínima de lucro para considerar uma oportunidade
   * @param {number} percentage - Porcentagem mínima (ex: 2.0 para 2%)
   */
  setMinProfitPercentage(percentage) {
    this.minProfitPercentage = percentage;
  }

  /**
   * Detecta oportunidades de arbitragem triangular
   * (Crypto A -> Crypto B -> Crypto C -> Crypto A)
   * @returns {Array} Array de oportunidades de arbitragem encontradas
   */
  findTriangularArbitrageOpportunities() {
    this.opportunities = [];
    const cryptos = Object.keys(this.rates);
    
    // Precisamos de pelo menos 3 criptomoedas para arbitragem triangular
    if (cryptos.length < 3) {
      return this.opportunities;
    }
    
    // Para cada combinação triangular possível (A->B->C->A)
    for (let i = 0; i < cryptos.length; i++) {
      const cryptoA = cryptos[i];
      
      for (let j = 0; j < cryptos.length; j++) {
        if (i === j) continue;
        const cryptoB = cryptos[j];
        
        for (let k = 0; k < cryptos.length; k++) {
          if (i === k || j === k) continue;
          const cryptoC = cryptos[k];
          
          // Verifica se podemos criar um caminho completo
          const opportunity = this.calculateTriangularArbitrage(cryptoA, cryptoB, cryptoC);
          
          if (opportunity) {
            this.opportunities.push(opportunity);
          }
        }
      }
    }
    
    // Ordena as oportunidades pelo lucro potencial (maior primeiro)
    this.opportunities.sort((a, b) => b.profitPercentage - a.profitPercentage);
    
    return this.opportunities;
  }

  /**
   * Calcula a arbitragem triangular entre 3 criptomoedas
   * @param {string} cryptoA - Primeira criptomoeda
   * @param {string} cryptoB - Segunda criptomoeda
   * @param {string} cryptoC - Terceira criptomoeda
   * @returns {Object|null} Oportunidade de arbitragem ou null se não houver
   */
  calculateTriangularArbitrage(cryptoA, cryptoB, cryptoC) {
    try {
      // Verifica se temos todas as taxas necessárias (usando USD como moeda comum)
      if (!this.rates[cryptoA] || !this.rates[cryptoB] || !this.rates[cryptoC] ||
          !this.rates[cryptoA].usd || !this.rates[cryptoB].usd || !this.rates[cryptoC].usd) {
        return null;
      }
      
      // Obtém as taxas em relação ao USD
      const rateA = this.rates[cryptoA].usd;
      const rateB = this.rates[cryptoB].usd;
      const rateC = this.rates[cryptoC].usd;
      
      // Calcula as taxas de conversão entre as criptos
      const rateAtoB = rateA / rateB; // Quanto de B consigo com 1 unidade de A
      const rateBtoC = rateB / rateC; // Quanto de C consigo com 1 unidade de B
      const rateCtoA = rateC / rateA; // Quanto de A consigo com 1 unidade de C
      
      // Calcula o valor final após o ciclo completo (começando com 1 unidade de A)
      const startAmount = 1; // 1 unidade de cryptoA
      const amountAfterAtoB = startAmount * rateAtoB;
      const amountAfterBtoC = amountAfterAtoB * rateBtoC;
      const finalAmount = amountAfterBtoC * rateCtoA;
      
      // Calcula o lucro
      const profit = finalAmount - startAmount;
      const profitPercentage = (profit / startAmount) * 100;
      
      // Considera taxas de transação (estimativa de 0.25% por transação)
      const fees = 0.0025 * 3; // 0.25% x 3 transações
      const netProfitPercentage = profitPercentage - (fees * 100);
      
      // Se o lucro líquido for positivo e acima do mínimo, retorna a oportunidade
      if (netProfitPercentage > this.minProfitPercentage) {
        return {
          route: `${cryptoA} -> ${cryptoB} -> ${cryptoC} -> ${cryptoA}`,
          startCrypto: cryptoA,
          steps: [
            { from: cryptoA, to: cryptoB, rate: rateAtoB.toFixed(6) },
            { from: cryptoB, to: cryptoC, rate: rateBtoC.toFixed(6) },
            { from: cryptoC, to: cryptoA, rate: rateCtoA.toFixed(6) }
          ],
          profitPercentage: netProfitPercentage.toFixed(2),
          startAmount: startAmount,
          finalAmount: finalAmount.toFixed(4),
          timestamp: new Date()
        };
      }
      
      return null;
    } catch (error) {
      console.error(`Erro ao calcular arbitragem: ${error.message}`);
      return null;
    }
  }

  /**
   * Detecta oportunidades de arbitragem entre exchanges
   * (mesma criptomoeda com preços diferentes em exchanges diferentes)
   * @param {Object} exchangeRates - Taxas de diferentes exchanges
   * @returns {Array} Oportunidades de arbitragem entre exchanges
   */
  findExchangeArbitrageOpportunities(exchangeRates) {
    const opportunities = [];
    
    // Esta funcionalidade requer dados de múltiplas exchanges
    // Implementação simplificada para exemplo
    
    // Simula dados de duas exchanges diferentes
    const exchangeA = exchangeRates?.exchangeA || this.rates;
    const exchangeB = exchangeRates?.exchangeB || { 
      bitcoin: { usd: this.rates.bitcoin?.usd * 1.02 },
      ethereum: { usd: this.rates.ethereum?.usd * 0.99 }
    };
    
    // Compara preços entre as exchanges
    const cryptos = Object.keys(exchangeA);
    
    for (const crypto of cryptos) {
      if (exchangeB[crypto] && exchangeA[crypto]?.usd && exchangeB[crypto]?.usd) {
        const priceA = exchangeA[crypto].usd;
        const priceB = exchangeB[crypto].usd;
        
        // Calcula a diferença percentual
        const diff = Math.abs(priceA - priceB) / Math.min(priceA, priceB) * 100;
        
        // Considera custos de transferência (estimativa de 0.5%)
        const netProfit = diff - 0.5;
        
        if (netProfit > this.minProfitPercentage) {
          // Determina a direção da arbitragem
          const buyExchange = priceA < priceB ? 'Exchange A' : 'Exchange B';
          const sellExchange = priceA < priceB ? 'Exchange B' : 'Exchange A';
          
          opportunities.push({
            crypto: crypto,
            buyExchange: buyExchange,
            buyPrice: Math.min(priceA, priceB).toFixed(2),
            sellExchange: sellExchange,
            sellPrice: Math.max(priceA, priceB).toFixed(2),
            profitPercentage: netProfit.toFixed(2),
            timestamp: new Date()
          });
        }
      }
    }
    
    return opportunities.sort((a, b) => parseFloat(b.profitPercentage) - parseFloat(a.profitPercentage));
  }
}