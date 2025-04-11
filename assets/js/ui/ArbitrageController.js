/**
 * ArbitrageController.js
 * Controlador para página de arbitragem no painel administrativo
 */
import ArbitrageCalculator from '../utils/ArbitrageCalculator.js';

export default class ArbitrageController {
  constructor() {
    this.calculator = new ArbitrageCalculator();
    this.ratesData = {};
    this.minProfit = 1.0; // Lucro mínimo padrão: 1%
    
    // Referencias para elementos da UI
    this.triangularResultsTable = document.getElementById('triangularArbitrageResults');
    this.exchangeResultsTable = document.getElementById('exchangeArbitrageResults');
    this.minProfitInput = document.getElementById('minProfitPercentage');
    this.calculateButton = document.getElementById('calculateArbitrage');
    this.lastUpdateSpan = document.getElementById('arbitrageLastUpdate');
    this.refreshRatesButton = document.getElementById('refreshRates');
    
    this.initEventListeners();
    this.fetchLatestRates();
  }
  
  /**
   * Inicializa listeners de eventos
   */
  initEventListeners() {
    // Botão de cálculo
    if (this.calculateButton) {
      this.calculateButton.addEventListener('click', () => {
        this.updateMinProfit();
        this.calculateArbitrageOpportunities();
      });
    }
    
    // Botão de atualização de taxas
    if (this.refreshRatesButton) {
      this.refreshRatesButton.addEventListener('click', () => {
        this.fetchLatestRates();
      });
    }
    
    // Atualizar mínimo de lucro ao pressionar Enter
    if (this.minProfitInput) {
      this.minProfitInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
          this.updateMinProfit();
          this.calculateArbitrageOpportunities();
        }
      });
    }
  }
  
  /**
   * Atualiza o valor mínimo de lucro
   */
  updateMinProfit() {
    if (this.minProfitInput) {
      const value = parseFloat(this.minProfitInput.value);
      if (!isNaN(value) && value >= 0) {
        this.minProfit = value;
        this.calculator.setMinProfitPercentage(value);
      }
    }
  }
  
  /**
   * Busca taxas de câmbio mais recentes
   * Em produção, isso faria uma chamada API
   */
  fetchLatestRates() {
    // Simulando busca de taxas de câmbio
    // Em uma aplicação real, isso seria uma chamada API
    
    // Simulação de atraso de rede
    this.setLoadingState(true);
    
    setTimeout(() => {
      // Taxas simuladas (preço em BRL)
      this.ratesData = {
        'BTC': 270000.00,
        'ETH': 9800.00,
        'USDT': 5.01,
        'BNB': 1250.00,
        'SOL': 450.00,
        'ADA': 3.25,
        'XRP': 3.10,
        'DOGE': 0.45,
        'DOT': 35.50,
        'MATIC': 4.85
      };
      
      // Atualiza o calculador com as novas taxas
      this.calculator.setRates(this.ratesData);
      
      // Atualiza timestamp
      if (this.lastUpdateSpan) {
        this.lastUpdateSpan.textContent = new Date().toLocaleString('pt-BR');
      }
      
      // Calcula oportunidades
      this.calculateArbitrageOpportunities();
      
      this.setLoadingState(false);
    }, 800);
  }
  
  /**
   * Calcula oportunidades de arbitragem
   */
  calculateArbitrageOpportunities() {
    // Calcula arbitragem triangular
    const triangularOpportunities = this.calculator.findTriangularArbitrageOpportunities();
    this.renderTriangularResults(triangularOpportunities);
    
    // Calcula arbitragem entre exchanges
    const exchangeOpportunities = this.calculator.findExchangeArbitrageOpportunities();
    this.renderExchangeResults(exchangeOpportunities);
  }
  
  /**
   * Renderiza resultados de arbitragem triangular
   * @param {Array} opportunities - Lista de oportunidades
   */
  renderTriangularResults(opportunities) {
    if (!this.triangularResultsTable) return;
    
    // Limpa a tabela
    this.triangularResultsTable.innerHTML = '';
    
    if (opportunities.length === 0) {
      this.triangularResultsTable.innerHTML = '<tr><td colspan="6" class="text-center">Nenhuma oportunidade encontrada</td></tr>';
      return;
    }
    
    // Renderiza cada oportunidade
    opportunities.forEach((opportunity, index) => {
      const row = document.createElement('tr');
      
      // Adiciona classe de destaque para as melhores oportunidades
      if (index < 3) {
        row.classList.add('table-success');
      }
      
      row.innerHTML = `
        <td>${index + 1}</td>
        <td>${opportunity.route}</td>
        <td>R$ ${opportunity.initial.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
        <td>R$ ${opportunity.final.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
        <td>R$ ${opportunity.profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
        <td class="text-success">${opportunity.profitPercentage.toFixed(2)}%</td>
        <td>
          <button class="btn btn-sm btn-outline-primary view-opportunity" data-index="${index}">
            <i class="fas fa-info-circle"></i>
          </button>
        </td>
      `;
      
      this.triangularResultsTable.appendChild(row);
    });
    
    // Adiciona event listeners para os botões de detalhes
    document.querySelectorAll('.view-opportunity').forEach(button => {
      button.addEventListener('click', (e) => {
        const index = parseInt(e.currentTarget.getAttribute('data-index'));
        this.showOpportunityDetails(opportunities[index]);
      });
    });
  }
  
  /**
   * Renderiza resultados de arbitragem entre exchanges
   * @param {Array} opportunities - Lista de oportunidades
   */
  renderExchangeResults(opportunities) {
    if (!this.exchangeResultsTable) return;
    
    // Limpa a tabela
    this.exchangeResultsTable.innerHTML = '';
    
    if (opportunities.length === 0) {
      this.exchangeResultsTable.innerHTML = '<tr><td colspan="6" class="text-center">Nenhuma oportunidade encontrada</td></tr>';
      return;
    }
    
    // Renderiza cada oportunidade
    opportunities.forEach((opportunity, index) => {
      const row = document.createElement('tr');
      
      // Adiciona classe de destaque para as melhores oportunidades
      if (index < 3) {
        row.classList.add('table-success');
      }
      
      row.innerHTML = `
        <td>${index + 1}</td>
        <td>${opportunity.crypto}</td>
        <td><span class="badge bg-success">Comprar: ${opportunity.buyExchange}</span></td>
        <td><span class="badge bg-danger">Vender: ${opportunity.sellExchange}</span></td>
        <td>R$ ${opportunity.buyPrice} → R$ ${opportunity.sellPrice}</td>
        <td class="text-success">${opportunity.profitPercentage.toFixed(2)}%</td>
      `;
      
      this.exchangeResultsTable.appendChild(row);
    });
  }
  
  /**
   * Exibe detalhes de uma oportunidade de arbitragem triangular
   * @param {Object} opportunity - Oportunidade de arbitragem
   */
  showOpportunityDetails(opportunity) {
    console.log('Detalhes da oportunidade:', opportunity);
    
    let stepsHtml = '';
    opportunity.steps.forEach(step => {
      stepsHtml += `<li>${step.from} → ${step.to}: taxa = ${step.rate}</li>`;
    });
    
    const detailsHtml = `
      <div class="modal-header">
        <h5 class="modal-title">Detalhes da Arbitragem</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body">
        <h6>Rota: ${opportunity.route}</h6>
        <hr>
        <p><strong>Investimento Inicial:</strong> R$ ${opportunity.initial.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        <p><strong>Resultado Final:</strong> R$ ${opportunity.final.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        <p><strong>Lucro:</strong> R$ ${opportunity.profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${opportunity.profitPercentage.toFixed(2)}%)</p>
        
        <h6>Passos:</h6>
        <ol>
          ${stepsHtml}
        </ol>
        
        <div class="alert alert-info">
          <i class="fas fa-info-circle me-2"></i>
          Os valores podem variar com base nas flutuações de mercado. Execute a operação rapidamente para garantir o lucro.
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fechar</button>
        <button type="button" class="btn btn-primary" id="executeArbitrage">Executar Arbitragem</button>
      </div>
    `;
    
    // Encontrar ou criar o modal
    let modal = document.getElementById('opportunityDetailsModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'opportunityDetailsModal';
      modal.className = 'modal fade';
      modal.setAttribute('tabindex', '-1');
      modal.setAttribute('aria-hidden', 'true');
      
      modal.innerHTML = `
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content" id="opportunityDetailsContent">
          </div>
        </div>
      `;
      
      document.body.appendChild(modal);
    }
    
    // Atualizar conteúdo do modal
    const contentDiv = document.getElementById('opportunityDetailsContent');
    if (contentDiv) {
      contentDiv.innerHTML = detailsHtml;
    }
    
    // Inicializar e exibir o modal
    const modalInstance = new bootstrap.Modal(modal);
    modalInstance.show();
    
    // Adicionar event listener para o botão de execução
    const executeButton = document.getElementById('executeArbitrage');
    if (executeButton) {
      executeButton.addEventListener('click', () => {
        alert('Esta funcionalidade seria implementada em produção para executar a arbitragem automaticamente.');
        modalInstance.hide();
      });
    }
  }
  
  /**
   * Atualiza estado de carregamento da UI
   * @param {boolean} isLoading - Se está carregando
   */
  setLoadingState(isLoading) {
    const spinners = document.querySelectorAll('.arbitrage-spinner');
    const tables = document.querySelectorAll('.arbitrage-results');
    
    spinners.forEach(spinner => {
      spinner.style.display = isLoading ? 'inline-block' : 'none';
    });
    
    tables.forEach(table => {
      table.style.opacity = isLoading ? '0.5' : '1';
    });
    
    // Desabilita botões durante carregamento
    if (this.calculateButton) {
      this.calculateButton.disabled = isLoading;
    }
    
    if (this.refreshRatesButton) {
      this.refreshRatesButton.disabled = isLoading;
    }
  }
}