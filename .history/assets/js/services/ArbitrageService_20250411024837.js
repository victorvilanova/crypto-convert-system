/**
 * ArbitrageService.js
 * Serviço para gerenciar dados e cálculos de arbitragem
 */
import CryptoModel from '../models/CryptoModel.js';

export default class ArbitrageService {
  constructor() {
    this.cryptoModel = new CryptoModel();
    this.minProfitPercentage = 1.0; // Limiar mínimo de lucro (%)
    this.lastUpdate = null;
  }

  /**
   * Define o percentual mínimo de lucro para considerar uma oportunidade
   * @param {number} percentage - Percentual mínimo de lucro
   */
  setMinProfitPercentage(percentage) {
    if (percentage > 0) {
      this.minProfitPercentage = percentage;
    }
  }

  /**
   * Busca oportunidades de arbitragem triangular
   * @returns {Promise<Array>} - Lista de oportunidades de arbitragem
   */
  async getTriangularArbitrageOpportunities() {
    try {
      // Em um ambiente real, aqui buscaríamos dados atualizados das APIs
      const exchangeRates = await this.cryptoModel.getExchangeRates();
      
      // Busca oportunidades de arbitragem triangular
      const opportunities = this.findTriangularArbitrageOpportunities(exchangeRates);
      
      // Filtra pelo limiar definido
      const filteredOpportunities = opportunities.filter(
        opp => opp.profitPercentage >= this.minProfitPercentage
      );
      
      this.lastUpdate = new Date();
      return filteredOpportunities;
    } catch (error) {
      console.error('Erro ao buscar oportunidades de arbitragem triangular:', error);
      throw error;
    }
  }

  /**
   * Busca oportunidades de arbitragem entre exchanges
   * @returns {Promise<Array>} - Lista de oportunidades entre exchanges
   */
  async getExchangeArbitrageOpportunities() {
    try {
      // Em um ambiente real, aqui buscaríamos dados de diferentes exchanges
      const exchangeData = await this.cryptoModel.getMultiExchangePrices();
      
      // Busca oportunidades entre exchanges
      const opportunities = this.findExchangeArbitrageOpportunities(exchangeData);
      
      // Filtra pelo limiar definido
      const filteredOpportunities = opportunities.filter(
        opp => opp.profitPercentage >= this.minProfitPercentage
      );
      
      this.lastUpdate = new Date();
      return filteredOpportunities;
    } catch (error) {
      console.error('Erro ao buscar oportunidades de arbitragem entre exchanges:', error);
      throw error;
    }
  }

  /**
   * Encontra oportunidades de arbitragem triangular dentro de uma exchange
   * @param {Object} rates - Taxas de câmbio entre pares de moedas
   * @returns {Array} - Lista de oportunidades encontradas
   */
  findTriangularArbitrageOpportunities(rates) {
    // Este é um exemplo simplificado. Em produção, usaria algoritmos mais sofisticados
    const opportunities = [];
    const startAmount = 1000; // Valor inicial em USD para simulação
    
    // Exemplo de rotas para verificar
    const routesToCheck = [
      { route: 'USD → BTC → ETH → USD', steps: ['USD/BTC', 'BTC/ETH', 'ETH/USD'] },
      { route: 'USD → ETH → BTC → USD', steps: ['USD/ETH', 'ETH/BTC', 'BTC/USD'] },
      { route: 'USD → BTC → LTC → USD', steps: ['USD/BTC', 'BTC/LTC', 'LTC/USD'] },
      { route: 'USD → ETH → LTC → USD', steps: ['USD/ETH', 'ETH/LTC', 'LTC/USD'] }
    ];
    
    // Para cada rota, calcula o resultado de uma arbitragem triangular
    routesToCheck.forEach(route => {
      try {
        let currentAmount = startAmount;
        const detailedSteps = [];
        
        // Percorre cada etapa da rota
        for (let i = 0; i < route.steps.length; i++) {
          const step = route.steps[i];
          const [from, to] = step.split('/');
          
          // Obtém a taxa de câmbio (em um sistema real, isso viria da API)
          let rate;
          if (rates[step]) {
            rate = rates[step];
          } else if (rates[`${to}/${from}`]) {
            // Inverte a taxa se necessário
            rate = 1 / rates[`${to}/${from}`];
          } else {
            // Skip se não tivermos esta taxa
            throw new Error(`Taxa não encontrada para ${step}`);
          }
          
          // Aplica a taxa
          const newAmount = currentAmount * rate;
          
          detailedSteps.push({
            from,
            to,
            rate,
            fromAmount: currentAmount,
            toAmount: newAmount
          });
          
          currentAmount = newAmount;
        }
        
        // Calcula lucro/prejuízo
        const finalAmount = currentAmount;
        const profit = finalAmount - startAmount;
        const profitPercentage = (profit / startAmount) * 100;
        
        // Adiciona à lista se for lucrativo
        if (profitPercentage > 0) {
          opportunities.push({
            route: route.route,
            steps: detailedSteps,
            startAmount,
            finalAmount,
            profit,
            profitPercentage
          });
        }
      } catch (e) {
        // Ignora rotas com taxas ausentes
        console.log(`Rota ignorada (${route.route}): ${e.message}`);
      }
    });
    
    // Ordena por lucratividade (mais lucrativo primeiro)
    return opportunities.sort((a, b) => b.profitPercentage - a.profitPercentage);
  }

  /**
   * Encontra oportunidades de arbitragem entre diferentes exchanges
   * @param {Object} exchangeData - Dados de preços de diferentes exchanges
   * @returns {Array} - Lista de oportunidades entre exchanges
   */
  findExchangeArbitrageOpportunities(exchangeData) {
    // Este é um exemplo simplificado para fins de demonstração
    const opportunities = [];
    
    // Lista de criptomoedas para verificar
    const cryptosToCheck = ['BTC', 'ETH', 'LTC', 'XRP', 'ADA'];
    
    // Lista de exchanges para comparar
    const exchanges = Object.keys(exchangeData);
    
    // Compara preços entre exchanges para cada criptomoeda
    cryptosToCheck.forEach(crypto => {
      // Para cada par de exchanges
      for (let i = 0; i < exchanges.length; i++) {
        for (let j = i + 1; j < exchanges.length; j++) {
          const exchange1 = exchanges[i];
          const exchange2 = exchanges[j];
          
          // Verifica se ambas as exchanges têm esta cripto
          if (
            exchangeData[exchange1] && 
            exchangeData[exchange1][crypto] && 
            exchangeData[exchange2] && 
            exchangeData[exchange2][crypto]
          ) {
            const price1 = exchangeData[exchange1][crypto];
            const price2 = exchangeData[exchange2][crypto];
            
            // Calcula diferença percentual
            const priceDiff = Math.abs(price1 - price2);
            const lowestPrice = Math.min(price1, price2);
            const highestPrice = Math.max(price1, price2);
            const profitPercentage = (priceDiff / lowestPrice) * 100;
            
            // Determina onde comprar e onde vender
            const buyExchange = price1 < price2 ? exchange1 : exchange2;
            const sellExchange = price1 < price2 ? exchange2 : exchange1;
            const buyPrice = lowestPrice;
            const sellPrice = highestPrice;
            
            // Adiciona à lista se atender o limiar
            if (profitPercentage > 0) {
              opportunities.push({
                crypto,
                buyExchange,
                sellExchange,
                buyPrice,
                sellPrice,
                priceDiff,
                profitPercentage
              });
            }
          }
        }
      }
    });
    
    // Ordena por lucratividade (mais lucrativo primeiro)
    return opportunities.sort((a, b) => b.profitPercentage - a.profitPercentage);
  }

  /**
   * Obtém a data/hora da última atualização
   * @returns {Date|null} - Data da última atualização
   */
  getLastUpdateTime() {
    return this.lastUpdate;
  }
}