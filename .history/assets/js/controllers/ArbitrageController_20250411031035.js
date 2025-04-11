/**
 * ArbitrageController.js
 * Controlador para gerenciar oportunidades de arbitragem
 */
import CryptoService from '../services/CryptoService.js';
// Importar o logger de auditoria
import ArbitrageAuditLogger from '../utils/ArbitrageAuditLogger.js';

export default class ArbitrageController {
  constructor() {
    // Inicializa serviços
    this.cryptoService = new CryptoService();
    
    // Adicionar o logger de auditoria
    this.auditLogger = new ArbitrageAuditLogger();
    
    // Referências a elementos da UI de arbitragem
    this.elements = {
      arbitrageOpportunities: document.getElementById('arbitrageOpportunities'),
      refreshArbitrageBtn: document.getElementById('refreshArbitrageBtn'),
      arbitrageChart: document.getElementById('arbitrageChart'),
      arbitrageFilters: document.getElementById('arbitrageFilters'),
      minimumProfitFilter: document.getElementById('minimumProfitFilter'),
      exchangeFilter: document.getElementById('exchangeFilter')
    };
    
    // Configurações padrão
    this.settings = {
      minimumProfit: 0.5, // 0.5%
      refreshInterval: 60000, // 1 minuto
      favoriteExchanges: ['binance', 'coinbase', 'kraken']
    };
    
    // Armazena dados atuais de arbitragem
    this.arbitrageData = [];
    
    // ID do intervalo de atualização automática
    this.autoRefreshIntervalId = null;
  }
  
  /**
   * Inicializa o controlador
   */
  init() {
    // Carrega configurações salvas
    this.loadSettings();
    
    // Configura listeners de eventos
    this.setupEventListeners();
    
    // Carrega dados iniciais
    this.loadArbitrageData();
    
    // Inicializa filtros
    this.initializeFilters();
    
    // Configura atualização automática
    this.setupAutoRefresh();
  }
  
  /**
   * Configura listeners de eventos
   */
  setupEventListeners() {
    // Botão de atualização manual
    if (this.elements.refreshArbitrageBtn) {
      this.elements.refreshArbitrageBtn.addEventListener('click', () => {
        this.loadArbitrageData();
      });
    }
    
    // Filtro de lucro mínimo
    if (this.elements.minimumProfitFilter) {
      this.elements.minimumProfitFilter.addEventListener('change', () => {
        this.applyFilters();
      });
    }
    
    // Filtro de exchanges
    if (this.elements.exchangeFilter) {
      this.elements.exchangeFilter.addEventListener('change', () => {
        this.applyFilters();
      });
    }
  }
  
  /**
   * Carrega configurações salvas
   */
  loadSettings() {
    const savedSettings = localStorage.getItem('arbitrage_settings');
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        this.settings = { ...this.settings, ...parsedSettings };
      } catch (error) {
        console.error('Erro ao carregar configurações de arbitragem:', error);
      }
    }
  }
  
  /**
   * Salva configurações atuais
   */
  saveSettings() {
    try {
      localStorage.setItem('arbitrage_settings', JSON.stringify(this.settings));
    } catch (error) {
      console.error('Erro ao salvar configurações de arbitragem:', error);
    }
  }
  
  /**
   * Inicializa os filtros com valores atuais
   */
  initializeFilters() {
    // Define valor inicial do filtro de lucro mínimo
    if (this.elements.minimumProfitFilter) {
      this.elements.minimumProfitFilter.value = this.settings.minimumProfit;
    }
    
    // Popula o filtro de exchanges
    if (this.elements.exchangeFilter) {
      // Limpa opções existentes
      this.elements.exchangeFilter.innerHTML = '';
      
      // Adiciona opção "Todas"
      const allOption = document.createElement('option');
      allOption.value = 'all';
      allOption.textContent = 'Todas as exchanges';
      this.elements.exchangeFilter.appendChild(allOption);
      
      // Adiciona exchanges conhecidas
      const exchanges = ['Binance', 'Coinbase', 'Kraken', 'Huobi', 'Bitfinex', 'OKEx'];
      
      exchanges.forEach(exchange => {
        const option = document.createElement('option');
        option.value = exchange.toLowerCase();
        option.textContent = exchange;
        
        // Marca como selecionada se estiver nas favoritas
        if (this.settings.favoriteExchanges.includes(exchange.toLowerCase())) {
          option.selected = true;
        }
        
        this.elements.exchangeFilter.appendChild(option);
      });
    }
  }
  
  /**
   * Carrega dados de oportunidades de arbitragem
   */
  loadArbitrageData() {
    // Exibe indicador de carregamento
    if (this.elements.arbitrageOpportunities) {
      this.elements.arbitrageOpportunities.innerHTML = '<div class="text-center"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Carregando...</span></div><p class="mt-2">Buscando oportunidades de arbitragem...</p></div>';
    }
    
    // Busca dados de arbitragem via API
    this.cryptoService.getArbitrageOpportunities()
      .then(data => {
        // Processa e valida os dados
        this.arbitrageData = this.processArbitrageData(data);
        
        // Aplica filtros
        this.applyFilters();
        
        // Atualiza gráfico
        this.updateArbitrageChart();
      })
      .catch(error => {
        console.error('Erro ao buscar oportunidades de arbitragem:', error);
        
        if (this.elements.arbitrageOpportunities) {
          this.elements.arbitrageOpportunities.innerHTML = `
            <div class="alert alert-danger">
              <i class="fas fa-exclamation-circle me-2"></i>
              Erro ao buscar oportunidades de arbitragem. 
              <button class="btn btn-sm btn-outline-danger ms-3" id="retryArbitrageBtn">
                Tentar novamente
              </button>
            </div>
          `;
          
          // Adiciona evento ao botão de retry
          const retryBtn = document.getElementById('retryArbitrageBtn');
          if (retryBtn) {
            retryBtn.addEventListener('click', () => {
              this.loadArbitrageData();
            });
          }
        }
      });
  }
  
  /**
   * Processa e valida dados de arbitragem
   * @param {Array} data - Dados brutos de arbitragem
   * @returns {Array} - Dados processados e validados
   */
  processArbitrageData(data) {
    // Verifica se os dados são válidos
    if (!Array.isArray(data)) {
      console.error('Dados de arbitragem inválidos', data);
      return [];
    }
    
    // Filtra e formata os dados
    return data
      .filter(item => {
        // Verifica se o item tem todos os campos necessários
        return (
          item && 
          typeof item === 'object' &&
          item.pair &&
          item.buyExchange &&
          item.sellExchange &&
          !isNaN(item.buyPrice) &&
          !isNaN(item.sellPrice) &&
          !isNaN(item.profitPercentage)
        );
      })
      .map(item => {
        // Formata percentuais e valores numéricos
        return {
          ...item,
          profitPercentage: parseFloat(item.profitPercentage.toFixed(2)),
          buyPrice: parseFloat(item.buyPrice.toFixed(8)),
          sellPrice: parseFloat(item.sellPrice.toFixed(8)),
          timestamp: item.timestamp || Date.now()
        };
      })
      .sort((a, b) => b.profitPercentage - a.profitPercentage); // Ordena por maior lucro
  }
  
  /**
   * Aplica filtros aos dados de arbitragem
   */
  applyFilters() {
    // Obtém valor do filtro de lucro mínimo
    let minProfit = 0;
    if (this.elements.minimumProfitFilter) {
      minProfit = parseFloat(this.elements.minimumProfitFilter.value) || 0;
      
      // Atualiza configurações
      this.settings.minimumProfit = minProfit;
      this.saveSettings();
    }
    
    // Obtém exchanges selecionadas
    let selectedExchanges = [];
    if (this.elements.exchangeFilter) {
      const options = this.elements.exchangeFilter.selectedOptions;
      
      for (let i = 0; i < options.length; i++) {
        if (options[i].value !== 'all') {
          selectedExchanges.push(options[i].value.toLowerCase());
        }
      }
      
      // Se "all" estiver selecionado ou nenhuma selecionada, não filtra por exchange
      if (Array.from(options).some(opt => opt.value === 'all') || selectedExchanges.length === 0) {
        selectedExchanges = []; // Não filtra por exchange
      } else {
        // Atualiza exchanges favoritas
        this.settings.favoriteExchanges = selectedExchanges;
        this.saveSettings();
      }
    }
    
    // Aplica filtros
    const filteredData = this.arbitrageData.filter(item => {
      // Filtro de lucro mínimo
      if (item.profitPercentage < minProfit) {
        return false;
      }
      
      // Filtro de exchanges
      if (selectedExchanges.length > 0) {
        const buyExchangeMatches = selectedExchanges.includes(item.buyExchange.toLowerCase());
        const sellExchangeMatches = selectedExchanges.includes(item.sellExchange.toLowerCase());
        
        // A oportunidade deve envolver pelo menos uma das exchanges selecionadas
        if (!buyExchangeMatches && !sellExchangeMatches) {
          return false;
        }
      }
      
      return true;
    });
    
    // Renderiza resultados filtrados
    this.renderArbitrageOpportunities(filteredData);
  }
  
  /**
   * Renderiza oportunidades de arbitragem na interface
   * @param {Array} opportunities - Oportunidades de arbitragem
   */
  renderArbitrageOpportunities(opportunities) {
    if (!this.elements.arbitrageOpportunities) {
      return;
    }
    
    if (opportunities.length === 0) {
      this.elements.arbitrageOpportunities.innerHTML = `
        <div class="alert alert-info">
          <i class="fas fa-info-circle me-2"></i>
          Nenhuma oportunidade de arbitragem encontrada com os filtros atuais.
        </div>
      `;
      return;
    }
    
    // Cria tabela de oportunidades
    let html = `
      <div class="table-responsive">
        <table class="table table-hover">
          <thead>
            <tr>
              <th>Par</th>
              <th>Compra</th>
              <th>Venda</th>
              <th>Preço Compra</th>
              <th>Preço Venda</th>
              <th>Lucro Potencial</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
    `;
    
    // Adiciona cada oportunidade
    opportunities.forEach(opportunity => {
      const timestamp = new Date(opportunity.timestamp).toLocaleString();
      
      html += `
        <tr>
          <td class="fw-bold">${opportunity.pair}</td>
          <td><span class="badge bg-primary">${opportunity.buyExchange}</span></td>
          <td><span class="badge bg-success">${opportunity.sellExchange}</span></td>
          <td>${opportunity.buyPrice}</td>
          <td>${opportunity.sellPrice}</td>
          <td>
            <span class="badge bg-${opportunity.profitPercentage >= 2 ? 'success' : 'info'}">
              ${opportunity.profitPercentage}%
            </span>
          </td>
          <td>
            <button class="btn btn-sm btn-outline-primary me-1" 
                    data-bs-toggle="tooltip" 
                    title="Visualizar detalhes"
                    onclick="showArbitrageDetails('${opportunity.pair}', ${opportunity.profitPercentage})">
              <i class="fas fa-eye"></i>
            </button>
            <button class="btn btn-sm btn-outline-success" 
                    data-bs-toggle="tooltip" 
                    title="Executar arbitragem"
                    onclick="executeArbitrage('${opportunity.pair}', '${opportunity.buyExchange}', '${opportunity.sellExchange}')">
              <i class="fas fa-play"></i>
            </button>
          </td>
        </tr>
      `;
    });
    
    html += `
          </tbody>
        </table>
      </div>
      <div class="text-muted small text-end">
        Última atualização: ${new Date().toLocaleString()}
      </div>
    `;
    
    this.elements.arbitrageOpportunities.innerHTML = html;
    
    // Inicializa tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
      return new bootstrap.Tooltip(tooltipTriggerEl);
    });
  }
  
  /**
   * Configura atualização automática dos dados
   */
  setupAutoRefresh() {
    // Limpa intervalo existente
    if (this.autoRefreshIntervalId) {
      clearInterval(this.autoRefreshIntervalId);
    }
    
    // Configura novo intervalo
    this.autoRefreshIntervalId = setInterval(() => {
      this.loadArbitrageData();
    }, this.settings.refreshInterval);
  }
  
  /**
   * Atualiza configuração de intervalo de atualização
   * @param {number} interval - Intervalo em milissegundos
   */
  updateRefreshInterval(interval) {
    if (typeof interval !== 'number' || interval < 5000) {
      console.error('Intervalo de atualização inválido');
      return;
    }
    
    this.settings.refreshInterval = interval;
    this.saveSettings();
    this.setupAutoRefresh();
  }
  
  /**
   * Atualiza gráfico de oportunidades de arbitragem
   */
  updateArbitrageChart() {
    if (!this.elements.arbitrageChart) {
      return;
    }
    
    // Prepara dados para o gráfico
    const chartData = this.prepareChartData();
    
    // Renderiza o gráfico
    this.renderArbitrageChart(chartData);
  }
  
  /**
   * Prepara dados para o gráfico de arbitragem
   * @returns {Object} - Dados formatados para o gráfico
   */
  prepareChartData() {
    // Agrupa oportunidades por par
    const pairsData = {};
    
    this.arbitrageData.forEach(opportunity => {
      if (!pairsData[opportunity.pair]) {
        pairsData[opportunity.pair] = [];
      }
      
      pairsData[opportunity.pair].push(opportunity);
    });
    
    // Obtém os 5 pares com maiores oportunidades
    const topPairs = Object.keys(pairsData)
      .map(pair => ({
        pair,
        maxProfit: Math.max(...pairsData[pair].map(o => o.profitPercentage))
      }))
      .sort((a, b) => b.maxProfit - a.maxProfit)
      .slice(0, 5)
      .map(item => item.pair);
    
    // Prepara dados para o gráfico
    const labels = topPairs;
    const datasets = [
      {
        label: 'Lucro Máximo (%)',
        data: topPairs.map(pair => Math.max(...pairsData[pair].map(o => o.profitPercentage))),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1
      },
      {
        label: 'Lucro Médio (%)',
        data: topPairs.map(pair => {
          const profits = pairsData[pair].map(o => o.profitPercentage);
          return profits.reduce((sum, profit) => sum + profit, 0) / profits.length;
        }),
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
      }
    ];
    
    return { labels, datasets };
  }
  
  /**
   * Renderiza gráfico de arbitragem
   * @param {Object} data - Dados formatados para o gráfico
   */
  renderArbitrageChart(data) {
    // Verifica se Chart.js está disponível
    if (typeof Chart === 'undefined') {
      console.error('Chart.js não está disponível');
      this.elements.arbitrageChart.innerHTML = `
        <div class="alert alert-warning">
          <i class="fas fa-exclamation-triangle me-2"></i>
          Não foi possível carregar a biblioteca de gráficos.
        </div>
      `;
      return;
    }
    
    // Limpa instância existente do gráfico
    if (this.chart) {
      this.chart.destroy();
    }
    
    // Canvas para o gráfico
    const ctx = this.elements.arbitrageChart.getContext('2d');
    
    // Cria o gráfico
    this.chart = new Chart(ctx, {
      type: 'bar',
      data: data,
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'top',
          },
          title: {
            display: true,
            text: 'Top 5 Pares com Maiores Oportunidades de Arbitragem'
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return `${context.dataset.label}: ${context.raw.toFixed(2)}%`;
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
          }
        }
      }
    });
  }
  
  /**
   * Exibe um resumo dos logs de arbitragem no painel administrativo
   * @param {number} limit - Número máximo de logs a exibir
   */
  displayArbitrageLogs(limit = 5) {
    // Procurar ou criar o container de logs
    let logsContainer = document.getElementById('arbitrageLogsContainer');
    if (!logsContainer) {
      const arbitrageContent = document.getElementById('arbitrageContent');
      if (!arbitrageContent) return;
      
      // Criar o container de logs
      logsContainer = document.createElement('div');
      logsContainer.id = 'arbitrageLogsContainer';
      logsContainer.className = 'card mb-4';
      
      // Adicionar header
      const header = document.createElement('div');
      header.className = 'card-header bg-secondary text-white d-flex justify-content-between align-items-center';
      header.innerHTML = `
        <h5 class="mb-0">Últimas Operações de Arbitragem</h5>
        <button id="viewAllLogsBtn" class="btn btn-sm btn-outline-light">
          <i class="fas fa-list me-1"></i> Ver Todos
        </button>
      `;
      
      // Adicionar corpo do card
      const body = document.createElement('div');
      body.className = 'card-body p-0';
      body.innerHTML = '<div id="arbitrageLogsList" class="list-group list-group-flush"></div>';
      
      logsContainer.appendChild(header);
      logsContainer.appendChild(body);
      
      // Inserir após o primeiro card no conteúdo de arbitragem
      const firstCard = arbitrageContent.querySelector('.card');
      if (firstCard) {
        arbitrageContent.insertBefore(logsContainer, firstCard.nextSibling);
      } else {
        arbitrageContent.appendChild(logsContainer);
      }
      
      // Adicionar event listener para ver todos os logs
      const viewAllBtn = document.getElementById('viewAllLogsBtn');
      if (viewAllBtn) {
        viewAllBtn.addEventListener('click', () => {
          this.showAllLogsModal();
        });
      }
    }
    
    // Obter a lista de logs
    const logsList = document.getElementById('arbitrageLogsList');
    if (!logsList) return;
    
    // Limpar lista atual
    logsList.innerHTML = '';
    
    // Obter logs recentes
    const recentLogs = this.auditLogger.getAllLogs().slice(0, limit);
    
    if (recentLogs.length === 0) {
      logsList.innerHTML = '<div class="list-group-item text-center py-4 text-muted">Nenhuma operação de arbitragem registrada</div>';
      return;
    }
    
    // Renderizar cada log
    recentLogs.forEach(log => {
      const logItem = document.createElement('div');
      logItem.className = 'list-group-item';
      
      // Formatar a data
      const logDate = new Date(log.timestamp);
      const formattedDate = logDate.toLocaleString('pt-BR');
      
      // Determinar ícone e cor com base na ação
      let icon, badge, actionText;
      
      if (log.action === 'opportunity_detected') {
        icon = 'fa-search-dollar';
        badge = this.getStatusBadge(log.status);
        actionText = `Nova oportunidade de arbitragem ${log.type === 'triangular' ? 'triangular' : 'entre exchanges'}`;
      } else if (log.action === 'decision') {
        icon = log.decision === 'execute' ? 'fa-play-circle' : 'fa-ban';
        badge = log.decision === 'execute' ? 'bg-primary' : 'bg-secondary';
        actionText = log.decision === 'execute' ? 'Executar arbitragem' : 'Ignorar oportunidade';
      } else if (log.action === 'result') {
        icon = log.success ? 'fa-check-circle' : 'fa-times-circle';
        badge = log.success ? 'bg-success' : 'bg-danger';
        actionText = log.success ? 'Arbitragem completada' : 'Falha na arbitragem';
      }
      
      logItem.innerHTML = `
        <div class="d-flex justify-content-between align-items-center">
          <div>
            <i class="fas ${icon} me-2 text-primary"></i>
            <span>${actionText}</span>
          </div>
          <span class="badge ${badge}">${this.getStatusText(log.status) || ''}</span>
        </div>
        <small class="text-muted d-block mt-1">${formattedDate}</small>
      `;
      
      logsList.appendChild(logItem);
    });
  }
  
  /**
   * Retorna a classe de badge apropriada para cada status
   * @param {string} status - Status da operação
   * @returns {string} - Classe CSS para o badge
   */
  getStatusBadge(status) {
    switch (status) {
      case 'detected': return 'bg-info';
      case 'executing': return 'bg-primary';
      case 'completed': return 'bg-success';
      case 'failed': return 'bg-danger';
      case 'ignored': return 'bg-secondary';
      default: return 'bg-light text-dark';
    }
  }
  
  /**
   * Retorna o texto correspondente a cada status
   * @param {string} status - Status da operação
   * @returns {string} - Texto descritivo do status
   */
  getStatusText(status) {
    switch (status) {
      case 'detected': return 'Detectada';
      case 'executing': return 'Executando';
      case 'completed': return 'Concluída';
      case 'failed': return 'Falhou';
      case 'ignored': return 'Ignorada';
      default: return status || '';
    }
  }
}
