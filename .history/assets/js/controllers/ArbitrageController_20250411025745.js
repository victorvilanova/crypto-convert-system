/**
 * ArbitrageController.js
 * Controlador para análise e exibição de oportunidades de arbitragem
 */
import CryptoDataService from '../services/CryptoDataService.js';

export default class ArbitrageController {
  constructor() {
    // Inicializa o serviço de dados
    this.dataService = new CryptoDataService();
    
    // Configuração das principais criptomoedas a serem monitoradas
    this.monitoredCryptos = [
      'bitcoin',
      'ethereum',
      'ripple',
      'cardano',
      'solana',
      'dogecoin',
      'polkadot',
      'litecoin'
    ];
    
    // Configuração das exchanges a serem comparadas
    this.exchanges = [
      { name: 'Binance', fee: 0.001 }, // 0.1%
      { name: 'Coinbase', fee: 0.005 }, // 0.5%
      { name: 'Kraken', fee: 0.0026 }, // 0.26%
      { name: 'Huobi', fee: 0.002 }, // 0.2%
      { name: 'Kucoin', fee: 0.001 } // 0.1%
    ];
    
    // Inicializa dados de preços
    this.prices = {};
    
    // Elementos da interface
    this.elements = {
      priceTable: document.getElementById('crypto-price-table'),
      arbitrageTable: document.getElementById('arbitrage-opportunities'),
      refreshButton: document.getElementById('refresh-data-btn'),
      lastUpdated: document.getElementById('last-updated'),
      loadingIndicator: document.getElementById('loading-indicator')
    };
    
    // Inicializa a interface
    this.initInterface();
  }
  
  /**
   * Inicializa a interface e eventos
   */
  initInterface() {
    // Verifica se todos os elementos foram encontrados
    if (!this.validateElements()) {
      console.error('Elementos da interface não encontrados');
      return;
    }
    
    // Adiciona evento ao botão de atualização
    this.elements.refreshButton.addEventListener('click', () => {
      this.refreshData();
    });
    
    // Carrega os dados iniciais
    this.refreshData();
    
    // Configurar atualização automática a cada 5 minutos
    setInterval(() => this.refreshData(), 5 * 60 * 1000);
  }
  
  /**
   * Valida se todos os elementos da interface foram encontrados
   * @returns {boolean} Verdadeiro se todos os elementos estão disponíveis
   */
  validateElements() {
    for (const key in this.elements) {
      if (!this.elements[key]) {
        console.error(`Elemento ${key} não encontrado na interface`);
        return false;
      }
    }
    return true;
  }
  
  /**
   * Atualiza os dados de preços e oportunidades de arbitragem
   */
  async refreshData() {
    try {
      // Mostra indicador de carregamento
      this.showLoading(true);
      
      // Obtém preços atualizados das criptomoedas
      this.prices = await this.dataService.getMultipleCryptoPrices(this.monitoredCryptos);
      
      // Simula preços diferentes em exchanges (em um sistema real, buscaríamos esses dados de APIs específicas)
      this.simulateExchangePrices();
      
      // Atualiza a tabela de preços
      this.updatePriceTable();
      
      // Encontra e exibe oportunidades de arbitragem
      this.findArbitrageOpportunities();
      
      // Atualiza a hora da última atualização
      this.updateLastUpdated();
      
      // Esconde o indicador de carregamento
      this.showLoading(false);
    } catch (error) {
      console.error('Erro ao atualizar dados:', error);
      this.showLoading(false);
      
      // Exibe mensagem de erro
      this.showError('Falha ao atualizar dados. Por favor, tente novamente.');
    }
  }
  
  /**
   * Simula preços diferentes em exchanges
   * Em um sistema real, estes dados viriam de APIs específicas de cada exchange
   */
  simulateExchangePrices() {
    this.exchangePrices = {};
    
    // Para cada criptomoeda monitorada
    this.monitoredCryptos.forEach(crypto => {
      const basePrice = this.prices[crypto];
      
      if (basePrice) {
        this.exchangePrices[crypto] = {};
        
        // Simula variações de preço em cada exchange
        this.exchanges.forEach(exchange => {
          // Variação aleatória de até +/- 3%
          const variation = 1 + ((Math.random() * 6) - 3) / 100;
          this.exchangePrices[crypto][exchange.name] = basePrice * variation;
        });
      }
    });
  }
  
  /**
   * Atualiza a tabela de preços na interface
   */
  updatePriceTable() {
    // Limpa a tabela existente
    this.elements.priceTable.innerHTML = '';
    
    // Cria o cabeçalho da tabela
    const header = document.createElement('tr');
    header.innerHTML = `
      <th>Criptomoeda</th>
      ${this.exchanges.map(exchange => `<th>${exchange.name}</th>`).join('')}
      <th>Diferença %</th>
    `;
    this.elements.priceTable.appendChild(header);
    
    // Adiciona uma linha para cada criptomoeda
    this.monitoredCryptos.forEach(crypto => {
      // Pula se não temos preços para esta criptomoeda
      if (!this.exchangePrices[crypto]) return;
      
      const row = document.createElement('tr');
      
      // Encontra o preço mínimo e máximo para esta criptomoeda
      const prices = Object.values(this.exchangePrices[crypto]);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const priceDiff = (maxPrice - minPrice) / minPrice * 100;
      
      // Conteúdo da linha
      row.innerHTML = `
        <td><strong>${crypto.charAt(0).toUpperCase() + crypto.slice(1)}</strong></td>
        ${this.exchanges.map(exchange => {
          const price = this.exchangePrices[crypto][exchange.name];
          let className = '';
          
          if (price === maxPrice) className = 'highest-price';
          if (price === minPrice) className = 'lowest-price';
          
          return `<td class="${className}">$${price.toFixed(2)}</td>`;
        }).join('')}
        <td class="${priceDiff > 1 ? 'opportunity' : ''}">${priceDiff.toFixed(2)}%</td>
      `;
      
      this.elements.priceTable.appendChild(row);
    });
  }
  
  /**
   * Encontra e exibe oportunidades de arbitragem
   */
  findArbitrageOpportunities() {
    // Limpa a tabela de oportunidades
    this.elements.arbitrageTable.innerHTML = '';
    
    // Oportunidades encontradas
    const opportunities = [];
    
    // Para cada criptomoeda
    this.monitoredCryptos.forEach(crypto => {
      if (!this.exchangePrices[crypto]) return;
      
      // Para cada par possível de exchanges
      for (let i = 0; i < this.exchanges.length; i++) {
        for (let j = i + 1; j < this.exchanges.length; j++) {
          const exchange1 = this.exchanges[i];
          const exchange2 = this.exchanges[j];
          
          const price1 = this.exchangePrices[crypto][exchange1.name];
          const price2 = this.exchangePrices[crypto][exchange2.name];
          
          // Calcula o lucro potencial considerando taxas
          const buyAtExchange1SellAtExchange2 = this.calculateProfit(price1, price2, exchange1.fee, exchange2.fee);
          const buyAtExchange2SellAtExchange1 = this.calculateProfit(price2, price1, exchange2.fee, exchange1.fee);
          
          // Seleciona a melhor oportunidade
          if (buyAtExchange1SellAtExchange2 > 0.5) { // Considera apenas se o lucro for maior que 0.5%
            opportunities.push({
              crypto,
              buyExchange: exchange1.name,
              sellExchange: exchange2.name,
              buyPrice: price1,
              sellPrice: price2,
              profit: buyAtExchange1SellAtExchange2
            });
          }
          
          if (buyAtExchange2SellAtExchange1 > 0.5) {
            opportunities.push({
              crypto,
              buyExchange: exchange2.name,
              sellExchange: exchange1.name,
              buyPrice: price2,
              sellPrice: price1,
              profit: buyAtExchange2SellAtExchange1
            });
          }
        }
      }
    });
    
    // Ordena as oportunidades pelo lucro (da maior para a menor)
    opportunities.sort((a, b) => b.profit - a.profit);
    
    // Exibe as oportunidades na tabela
    if (opportunities.length > 0) {
      // Cria o cabeçalho
      const header = document.createElement('tr');
      header.innerHTML = `
        <th>Criptomoeda</th>
        <th>Comprar em</th>
        <th>Preço Compra</th>
        <th>Vender em</th>
        <th>Preço Venda</th>
        <th>Lucro %</th>
        <th>Ação</th>
      `;
      this.elements.arbitrageTable.appendChild(header);
      
      // Adiciona cada oportunidade
      opportunities.forEach(opp => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${opp.crypto.charAt(0).toUpperCase() + opp.crypto.slice(1)}</td>
          <td>${opp.buyExchange}</td>
          <td>$${opp.buyPrice.toFixed(2)}</td>
          <td>${opp.sellExchange}</td>
          <td>$${opp.sellPrice.toFixed(2)}</td>
          <td class="profit">${opp.profit.toFixed(2)}%</td>
          <td><button class="analyze-btn" data-crypto="${opp.crypto}">Analisar</button></td>
        `;
        this.elements.arbitrageTable.appendChild(row);
      });
      
      // Adiciona eventos aos botões de análise
      this.addAnalyzeButtonEvents();
    } else {
      // Nenhuma oportunidade encontrada
      const row = document.createElement('tr');
      row.innerHTML = `
        <td colspan="7" class="no-opportunities">
          Nenhuma oportunidade de arbitragem encontrada com lucro maior que 0.5%
        </td>
      `;
      this.elements.arbitrageTable.appendChild(row);
    }
  }
  
  /**
   * Calcula o lucro percentual considerando taxas
   * @param {number} buyPrice - Preço de compra
   * @param {number} sellPrice - Preço de venda
   * @param {number} buyFee - Taxa de compra (decimal)
   * @param {number} sellFee - Taxa de venda (decimal)
   * @returns {number} Lucro percentual
   */
  calculateProfit(buyPrice, sellPrice, buyFee, sellFee) {
    // Quantidade adquirida após a taxa de compra
    const quantity = 1 - buyFee;
    
    // Valor recebido após a venda (considerando taxa de venda)
    const finalValue = quantity * sellPrice * (1 - sellFee);
    
    // Lucro percentual
    return (finalValue / buyPrice - 1) * 100;
  }
  
  /**
   * Adiciona eventos aos botões de análise
   */
  addAnalyzeButtonEvents() {
    const analyzeButtons = document.querySelectorAll('.analyze-btn');
    
    analyzeButtons.forEach(button => {
      button.addEventListener('click', () => {
        const crypto = button.getAttribute('data-crypto');
        this.showDetailedAnalysis(crypto);
      });
    });
  }
  
  /**
   * Exibe análise detalhada para uma criptomoeda
   * @param {string} crypto - ID da criptomoeda
   */
  async showDetailedAnalysis(crypto) {
    try {
      this.showLoading(true);
      
      // Obtém detalhes e histórico de preços
      const details = await this.dataService.getCryptoDetails(crypto);
      const history = await this.dataService.getPriceHistory(crypto, 7);
      
      // Exibe os dados em um modal (implementação simplificada)
      alert(`Análise detalhada para ${details.name} (${details.symbol.toUpperCase()})\n` +
            `Preço atual: $${details.currentPrice}\n` +
            `Capitalização de mercado: $${details.marketCap}\n` +
            `Variação 24h: ${details.priceChange24h}%\n` +
            `\nDados históricos de 7 dias disponíveis para visualização em gráfico.`);
      
      this.showLoading(false);
    } catch (error) {
      console.error('Erro ao exibir análise detalhada:', error);
      this.showLoading(false);
      this.showError('Falha ao carregar análise detalhada.');
    }
  }
  
  /**
   * Atualiza o texto de última atualização
   */
  updateLastUpdated() {
    const now = new Date();
    const formattedDate = now.toLocaleTimeString() + ' ' + now.toLocaleDateString();
    this.elements.lastUpdated.textContent = `Última atualização: ${formattedDate}`;
  }
  
  /**
   * Exibe ou esconde o indicador de carregamento
   * @param {boolean} show - Indica se deve exibir ou esconder
   */
  showLoading(show) {
    this.elements.loadingIndicator.style.display = show ? 'block' : 'none';
  }
  
  /**
   * Exibe mensagem de erro
   * @param {string} message - Mensagem a ser exibida
   */
  showError(message) {
    alert(message);
  }

  /**
   * Exibe mensagem de erro
   * @param {string} message - Mensagem de erro
   */
  displayError(message) {
    // Substituir pelo método de notificação mais amigável
    this.showNotification(message, 'error');
  }

  /**
   * Processa dados de arbitragem com validação
   * @param {Array} data - Dados brutos da API de arbitragem
   * @returns {Array} - Dados processados e validados
   */
  processArbitrageData(data) {
    if (!Array.isArray(data)) {
      this.displayError('Dados de arbitragem inválidos');
      return [];
    }
    
    try {
      // Filtra dados inválidos ou incompletos
      const validData = data.filter(item => {
        return item && 
               typeof item === 'object' && 
               item.hasOwnProperty('route') && 
               item.hasOwnProperty('profitPercentage');
      });
      
      // Ordena por maior lucro
      return validData.sort((a, b) => b.profitPercentage - a.profitPercentage);
    } catch (error) {
      console.error('Erro ao processar dados de arbitragem:', error);
      this.displayError('Erro ao processar dados de arbitragem');
      return [];
    }
  }
  
  /**
   * Renderiza um gráfico de arbitragem para visualização
   * @param {string} containerId - ID do elemento HTML que conterá o gráfico
   * @param {Array} opportunities - Dados de oportunidades de arbitragem
   */
  renderArbitrageChart(containerId, opportunities) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Container de gráfico ${containerId} não encontrado`);
      return;
    }
    
    if (!opportunities || opportunities.length === 0) {
      container.innerHTML = '<div class="alert alert-info">Sem dados suficientes para exibir o gráfico</div>';
      return;
    }
    
    // Limitar a 10 oportunidades para melhor visualização
    const topOpportunities = opportunities.slice(0, 10);
    
    // Preparar dados para o gráfico
    const labels = topOpportunities.map(opp => 
      `${opp.crypto.charAt(0).toUpperCase() + opp.crypto.slice(1)}: ${opp.buyExchange} → ${opp.sellExchange}`
    );
    
    const profitData = topOpportunities.map(opp => opp.profit);
    
    // Configurar cores baseadas no lucro
    const backgroundColors = profitData.map(profit => {
      if (profit > 2) return 'rgba(75, 192, 192, 0.7)'; // Alto lucro
      if (profit > 1) return 'rgba(54, 162, 235, 0.7)'; // Lucro médio
      return 'rgba(255, 206, 86, 0.7)'; // Lucro baixo
    });
    
    // Criar canvas para o gráfico se não existir
    let canvas = container.querySelector('canvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      container.innerHTML = '';
      container.appendChild(canvas);
    }
    
    // Verificar se Chart.js está disponível
    if (typeof Chart === 'undefined') {
      console.error('Chart.js não está disponível');
      container.innerHTML = '<div class="alert alert-warning">Biblioteca de gráficos não carregada</div>';
      return;
    }
    
    // Criar ou atualizar o gráfico
    if (this.arbitrageChart) {
      this.arbitrageChart.data.labels = labels;
      this.arbitrageChart.data.datasets[0].data = profitData;
      this.arbitrageChart.data.datasets[0].backgroundColor = backgroundColors;
      this.arbitrageChart.update();
    } else {
      this.arbitrageChart = new Chart(canvas, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Lucro Potencial (%)',
            data: profitData,
            backgroundColor: backgroundColors,
            borderColor: backgroundColors.map(color => color.replace('0.7', '1')),
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  return `Lucro: ${context.raw.toFixed(2)}%`;
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Lucro (%)'
              }
            },
            x: {
              ticks: {
                maxRotation: 45,
                minRotation: 45
              }
            }
          }
        }
      });
    }
    
    // Adicionar título ao gráfico
    const title = container.querySelector('h5');
    if (!title) {
      const chartTitle = document.createElement('h5');
      chartTitle.className = 'text-center mt-3 mb-2';
      chartTitle.textContent = 'Top 10 Oportunidades de Arbitragem';
      container.insertBefore(chartTitle, canvas);
    }
  }
}
