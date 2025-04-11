/**
 * ArbitrageController.js
 * Controlador para a interface de arbitragem do sistema administrativo
 */
import AuthService from '../services/AuthService.js';
import CryptoDataService from '../services/CryptoDataService.js';
import ArbitrageCalculator from '../utils/ArbitrageCalculator.js';
import CryptoModel from '../models/CryptoModel.js';

export default class ArbitrageController {
  constructor() {
    // Inicializa serviços
    this.authService = new AuthService();
    this.cryptoDataService = new CryptoDataService();
    this.arbitrageCalculator = new ArbitrageCalculator();
    this.cryptoModel = new CryptoModel();
    
    // Elementos da UI
    this.loginForm = document.getElementById('adminLoginForm');
    this.arbitrageContent = document.getElementById('arbitrageContent');
    this.loginError = document.getElementById('loginError');
    this.triangularOpportunitiesList = document.getElementById('triangularOpportunities');
    this.exchangeOpportunitiesList = document.getElementById('exchangeOpportunities');
    this.profitThresholdInput = document.getElementById('profitThreshold');
    this.lastRefreshTimestamp = document.getElementById('arbitrageLastUpdate');
    
    // Estado
    this.refreshInterval = null;
    this.refreshRate = 60000; // 1 minuto
    this.isInitialized = false;
    this.isLoading = false;
  }

  /**
   * Inicializa o controlador
   */
  init() {
    if (this.isInitialized) return;
    
    // Verifica se o usuário já está autenticado
    this.checkAuthentication();
    
    // Configura o formulário de login
    this.setupLoginForm();
    
    // Configura os listeners de eventos para os elementos da página
    this.setupEventListeners();
    
    this.isInitialized = true;
  }

  /**
   * Verifica se o usuário está autenticado
   */
  checkAuthentication() {
    const isAuthenticated = this.authService.isAuthenticated();
    
    if (isAuthenticated) {
      this.showArbitrageContent();
      
      // Configura nome de usuário na UI
      const username = this.authService.getCurrentUser();
      const usernameDisplay = document.getElementById('adminUsername');
      if (usernameDisplay && username) {
        usernameDisplay.textContent = username;
      }
      
      // Carrega dados de arbitragem
      this.loadArbitrageData();
      
      // Inicia atualizações automáticas
      this.startAutoRefresh();
      
      return;
    }
    
    // Se chegou aqui, não está autenticado
    this.showLoginForm();
  }

  /**
   * Configura o formulário de login de administrador
   */
  setupLoginForm() {
    if (!this.loginForm) return;

    this.loginForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const username = document.getElementById('adminUsernameInput').value;
      const password = document.getElementById('adminPasswordInput').value;

      this.authenticate(username, password);
    });
  }

  /**
   * Configura listeners de eventos adicionais
   */
  setupEventListeners() {
    // Botão de logout
    const logoutBtn = document.getElementById('adminLogoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        this.authService.logout();
        window.location.href = 'index.html';
      });
    }
    
    // Botão de atualização manual
    const refreshBtn = document.getElementById('refreshArbitrageBtn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        this.loadArbitrageData();
      });
    }
    
    // Input de limiar de lucro
    if (this.profitThresholdInput) {
      this.profitThresholdInput.addEventListener('change', () => {
        const threshold = parseFloat(this.profitThresholdInput.value);
        if (!isNaN(threshold) && threshold > 0) {
          this.arbitrageService.setMinProfitPercentage(threshold);
          this.loadArbitrageData();
        }
      });
    }
    
    // Botões de navegação das guias
    const triangularTabBtn = document.getElementById('triangularTabBtn');
    const exchangeTabBtn = document.getElementById('exchangeTabBtn');
    const triangularTab = document.getElementById('triangularTab');
    const exchangeTab = document.getElementById('exchangeTab');
    
    if (triangularTabBtn && exchangeTabBtn && triangularTab && exchangeTab) {
      triangularTabBtn.addEventListener('click', () => {
        triangularTab.classList.add('active', 'show');
        exchangeTab.classList.remove('active', 'show');
        triangularTabBtn.classList.add('active');
        exchangeTabBtn.classList.remove('active');
      });
      
      exchangeTabBtn.addEventListener('click', () => {
        triangularTab.classList.remove('active', 'show');
        exchangeTab.classList.add('active', 'show');
        triangularTabBtn.classList.remove('active');
        exchangeTabBtn.classList.add('active');
      });
    }
  }

  /**
   * Autentica o usuário administrativo
   * @param {string} username - Nome de usuário
   * @param {string} password - Senha
   */
  authenticate(username, password) {
    // Reset error message
    if (this.loginError) this.loginError.style.display = 'none';

    // Validate credentials
    if (!username || !password) {
      if (this.loginError) {
        this.loginError.textContent = 'Por favor, preencha todos os campos.';
        this.loginError.style.display = 'block';
      }
      return;
    }

    const isAuthenticated = this.authService.login(username, password);
    if (isAuthenticated) {
      // Autenticação bem-sucedida
      const usernameDisplay = document.getElementById('adminUsername');
      if (usernameDisplay) {
        usernameDisplay.textContent = username;
      }
      
      this.showArbitrageContent();
      this.loadArbitrageData();
      this.startAutoRefresh();
    } else {
      // Falha na autenticação
      if (this.loginError) {
        this.loginError.textContent = 'Nome de usuário ou senha incorretos.';
        this.loginError.style.display = 'block';
      }
      
      // Limpa o campo de senha por segurança
      const passwordInput = document.getElementById('adminPasswordInput');
      if (passwordInput) passwordInput.value = '';
    }
  }

  /**
   * Mostra o formulário de login e esconde o conteúdo de arbitragem
   */
  showLoginForm() {
    if (this.loginForm) this.loginForm.style.display = 'flex';
    if (this.arbitrageContent) this.arbitrageContent.style.display = 'none';
  }

  /**
   * Mostra o conteúdo de arbitragem e esconde o formulário de login
   */
  showArbitrageContent() {
    if (this.loginForm) this.loginForm.style.display = 'none';
    if (this.arbitrageContent) this.arbitrageContent.style.display = 'block';
  }
  
  /**
   * Inicia a atualização automática dos dados de arbitragem
   */
  startAutoRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    
    this.refreshInterval = setInterval(() => {
      this.loadArbitrageData();
    }, this.refreshRate);
  }
  
  /**
   * Carrega os dados de arbitragem
   */
  async loadArbitrageData() {
    try {
      // Mostra o indicador de carregamento
      this.showLoadingIndicator();
      
      // Obtém preços atuais de criptomoedas das APIs
      await this.updateCryptoPrices();
      
      // Em produção, aqui buscaria dados reais de APIs
      // Para desenvolvimento, usamos o calculador com dados simulados
      this.loadTriangularArbitrageOpportunities();
      this.loadExchangeArbitrageOpportunities();
      
      // Atualiza timestamp
      this.updateLastRefreshTime();
      
      // Oculta o indicador de carregamento
      this.hideLoadingIndicator();
      
      // Mostra notificação de sucesso
      this.showNotification('Dados de arbitragem atualizados com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao carregar dados de arbitragem:', error);
      
      // Oculta o indicador de carregamento
      this.hideLoadingIndicator();
      
      // Mostra notificação de erro
      this.showNotification(`Erro ao carregar dados: ${error.message}`, 'error');
    }
  }
  
  /**
   * Exibe indicador de carregamento
   */
  showLoadingIndicator() {
    // Verificar se o elemento de loading existe
    let loadingIndicator = document.getElementById('arbitrageLoadingIndicator');
    
    // Se não existir, criar um novo
    if (!loadingIndicator) {
      loadingIndicator = document.createElement('div');
      loadingIndicator.id = 'arbitrageLoadingIndicator';
      loadingIndicator.className = 'position-fixed top-50 start-50 translate-middle bg-white p-4 rounded shadow-lg d-flex flex-column align-items-center';
      loadingIndicator.style.zIndex = '9999';
      loadingIndicator.innerHTML = `
        <div class="spinner-border text-primary mb-3" role="status">
          <span class="visually-hidden">Carregando...</span>
        </div>
        <p class="mb-0">Atualizando dados de mercado...</p>
      `;
      document.body.appendChild(loadingIndicator);
    } else {
      loadingIndicator.style.display = 'flex';
    }
  }
  
  /**
   * Oculta indicador de carregamento
   */
  hideLoadingIndicator() {
    const loadingIndicator = document.getElementById('arbitrageLoadingIndicator');
    if (loadingIndicator) {
      loadingIndicator.style.display = 'none';
    }
  }
  
  /**
   * Atualiza preços de criptomoedas a partir de APIs externas
   */
  async updateCryptoPrices() {
    try {
      // Lista de criptomoedas a serem monitoradas
      const cryptoList = ['bitcoin', 'ethereum', 'tether', 'ripple', 'cardano', 'solana', 'polkadot'];
      
      // Obtém preços de múltiplas criptomoedas
      const prices = await this.cryptoDataService.getMultipleCryptoPrices(cryptoList);
      
      // Atualiza o modelo com os novos preços
      Object.entries(prices).forEach(([cryptoId, price]) => {
        if (price !== null) {
          this.cryptoModel.updatePrice(cryptoId, price);
        }
      });
      
      // Atualiza a tabela de preços na UI
      this.updatePriceTable(prices);
      
      return prices;
    } catch (error) {
      console.error('Erro ao atualizar preços de criptomoedas:', error);
      throw error;
    }
  }
  
  /**
   * Atualiza a tabela de preços na UI
   * @param {Object} prices - Objeto com preços de criptomoedas
   */
  updatePriceTable(prices) {
    const priceTableBody = document.getElementById('cryptoPriceTableBody');
    if (!priceTableBody) return;
    
    // Limpa a tabela
    priceTableBody.innerHTML = '';
    
    // Mapeia IDs da CoinGecko para nomes amigáveis
    const cryptoNames = {
      'bitcoin': 'Bitcoin (BTC)',
      'ethereum': 'Ethereum (ETH)',
      'tether': 'Tether (USDT)',
      'ripple': 'XRP (XRP)',
      'cardano': 'Cardano (ADA)',
      'solana': 'Solana (SOL)',
      'polkadot': 'Polkadot (DOT)'
    };
    
    // Adiciona cada criptomoeda à tabela
    Object.entries(prices).forEach(([cryptoId, price]) => {
      const row = document.createElement('tr');
      
      // Formata o preço
      const formattedPrice = price !== null 
        ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'USD' }).format(price)
        : 'Indisponível';
      
      // Define a classe CSS com base no preço (para destacar visualmente)
      const priceClass = price === null ? 'text-muted' : 'fw-bold';
      
      row.innerHTML = `
        <td>${cryptoNames[cryptoId] || cryptoId}</td>
        <td class="${priceClass}">${formattedPrice}</td>
      `;
      
      priceTableBody.appendChild(row);
    });
  }

  /**
   * Exibe/oculta indicadores de carregamento
   * @param {boolean} isLoading - Se está carregando
   */
  showLoadingState(isLoading) {
    const loadingSpinner = document.getElementById('arbitrageLoadingSpinner');
    if (loadingSpinner) {
      loadingSpinner.style.display = isLoading ? 'block' : 'none';
    }
    
    const refreshBtn = document.getElementById('refreshArbitrageBtn');
    if (refreshBtn) {
      refreshBtn.disabled = isLoading;
      
      // Atualiza o ícone do botão
      const btnIcon = refreshBtn.querySelector('i');
      if (btnIcon) {
        btnIcon.className = isLoading ? 'fas fa-spinner fa-spin' : 'fas fa-sync-alt';
      }
    }
  }
  
  /**
   * Atualiza as interfaces de usuário com dados de arbitragem
   * @param {Array} triangularOpportunities - Oportunidades de arbitragem triangular
   * @param {Array} exchangeOpportunities - Oportunidades entre exchanges
   */
  updateArbitrageUI(triangularOpportunities, exchangeOpportunities) {
    // Atualiza a interface com oportunidades de arbitragem triangular
    if (this.triangularOpportunitiesList) {
      this.triangularOpportunitiesList.innerHTML = '';
      
      if (triangularOpportunities.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'alert alert-info';
        emptyMessage.innerHTML = '<i class="fas fa-info-circle me-2"></i>Nenhuma oportunidade encontrada com o limiar atual.';
        this.triangularOpportunitiesList.appendChild(emptyMessage);
      } else {
        // Exibe notificação se houver oportunidades de lucro significativas
        const highProfitOpps = triangularOpportunities.filter(opp => opp.profitPercentage > 5);
        if (highProfitOpps.length > 0) {
          this.showNotification(
            `Encontradas ${highProfitOpps.length} oportunidades com lucro acima de 5%!`, 
            'success'
          );
        }
        
        // Renderiza as oportunidades na UI
        triangularOpportunities.forEach(opportunity => {
          const card = document.createElement('div');
          card.className = 'card mb-3';
          
          const cardHeader = document.createElement('div');
          cardHeader.className = 'card-header bg-primary text-white d-flex justify-content-between align-items-center';
          cardHeader.innerHTML = `
            <h5 class="mb-0">${opportunity.route}</h5>
            <span class="badge bg-success fs-6">${opportunity.profitPercentage.toFixed(2)}% de lucro</span>
          `;
          
          const cardBody = document.createElement('div');
          cardBody.className = 'card-body';
          
          // Passos da arbitragem
          const stepsList = document.createElement('ol');
          stepsList.className = 'list-group list-group-flush list-group-numbered mb-3';
          
          opportunity.steps.forEach(step => {
            const stepItem = document.createElement('li');
            stepItem.className = 'list-group-item';
            stepItem.innerHTML = `Converter <strong>${step.from}</strong> para <strong>${step.to}</strong> na taxa de <strong>${step.rate.toFixed(6)}</strong>`;
            stepsList.appendChild(stepItem);
          });
          
          // Resumo financeiro
          const summaryDiv = document.createElement('div');
          summaryDiv.className = 'alert alert-success mt-3';
          summaryDiv.innerHTML = `
            <div class="row">
              <div class="col-md-4">
                <strong>Investimento inicial:</strong> ${opportunity.startAmount.toFixed(2)} ${opportunity.steps[0].from}
              </div>
              <div class="col-md-4">
                <strong>Valor final:</strong> ${opportunity.finalAmount.toFixed(2)} ${opportunity.steps[0].from}
              </div>
              <div class="col-md-4">
                <strong>Lucro:</strong> ${opportunity.profit.toFixed(2)} ${opportunity.steps[0].from}
              </div>
            </div>
          `;
          
          cardBody.appendChild(stepsList);
          cardBody.appendChild(summaryDiv);
          
          card.appendChild(cardHeader);
          card.appendChild(cardBody);
          
          this.triangularOpportunitiesList.appendChild(card);
        });
      }
    }
    
    // Atualiza a interface com oportunidades entre exchanges
    if (this.exchangeOpportunitiesList) {
      this.exchangeOpportunitiesList.innerHTML = '';
      
      if (exchangeOpportunities.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'alert alert-info';
        emptyMessage.innerHTML = '<i class="fas fa-info-circle me-2"></i>Nenhuma oportunidade entre exchanges encontrada com o limiar atual.';
        this.exchangeOpportunitiesList.appendChild(emptyMessage);
      } else {
        // Cria tabela para oportunidades
        const table = document.createElement('table');
        table.className = 'table table-striped table-hover';
        
        // Cabeçalho da tabela
        const thead = document.createElement('thead');
        thead.innerHTML = `
          <tr>
            <th>Criptomoeda</th>
            <th>Comprar em</th>
            <th>Preço de compra</th>
            <th>Vender em</th>
            <th>Preço de venda</th>
            <th>Lucro potencial</th>
          </tr>
        `;
        
        // Corpo da tabela
        const tbody = document.createElement('tbody');
        
        exchangeOpportunities.forEach(op => {
          const row = document.createElement('tr');
          row.innerHTML = `
            <td><strong>${op.crypto}</strong></td>
            <td>${op.buyExchange}</td>
            <td>$${op.buyPrice.toFixed(2)}</td>
            <td>${op.sellExchange}</td>
            <td>$${op.sellPrice.toFixed(2)}</td>
            <td><span class="badge bg-success">${op.profitPercentage.toFixed(2)}%</span></td>
          `;
          tbody.appendChild(row);
        });
        
        table.appendChild(thead);
        table.appendChild(tbody);
        
        this.exchangeOpportunitiesList.appendChild(table);
      }
    }
    
    // Atualiza o timestamp de última atualização
    this.updateLastRefreshTime();
  }
  
  /**
   * Atualiza o timestamp da última atualização
   */
  updateLastRefreshTime() {
    if (this.lastRefreshTimestamp) {
      const now = new Date();
      this.lastRefreshTimestamp.textContent = now.toLocaleTimeString('pt-BR');
    }
  }
  
  /**
   * Limpa recursos ao destruir o controlador
   */
  destroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  /**
   * Exibe mensagem de erro
   * @param {string} message - Mensagem de erro
   */
  displayError(message) {
    // Implementação simplificada
    alert(`Erro: ${message}`);
  }

  /**
   * Exibe notificações no painel administrativo com melhor experiência do usuário
   * @param {string} message - Mensagem a ser exibida
   * @param {string} type - Tipo de notificação: 'success', 'error', 'warning', 'info'
   * @param {number} duration - Duração em milissegundos (0 para não desaparecer)
   */
  showNotification(message, type = 'info', duration = 5000) {
    // Verifica se o container de notificações existe, senão cria
    let notificationContainer = document.getElementById('adminNotifications');
    if (!notificationContainer) {
      notificationContainer = document.createElement('div');
      notificationContainer.id = 'adminNotifications';
      notificationContainer.style.position = 'fixed';
      notificationContainer.style.top = '20px';
      notificationContainer.style.right = '20px';
      notificationContainer.style.zIndex = '9999';
      document.body.appendChild(notificationContainer);
    }
    
    // Definir classes com base no tipo
    const typeClasses = {
      success: 'alert-success',
      error: 'alert-danger',
      warning: 'alert-warning',
      info: 'alert-info'
    };
    
    // Definir ícones com base no tipo
    const typeIcons = {
      success: '<i class="fas fa-check-circle me-2"></i>',
      error: '<i class="fas fa-exclamation-circle me-2"></i>',
      warning: '<i class="fas fa-exclamation-triangle me-2"></i>',
      info: '<i class="fas fa-info-circle me-2"></i>'
    };
    
    // Criar elemento de notificação
    const notification = document.createElement('div');
    notification.className = `alert ${typeClasses[type] || 'alert-info'} alert-dismissible fade show`;
    notification.innerHTML = `
      ${typeIcons[type] || ''}
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    // Adicionar notificação ao container
    notificationContainer.appendChild(notification);
    
    // Configurar auto-dismiss
    if (duration > 0) {
      setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
          notification.remove();
        }, 300); // tempo da animação de fade
      }, duration);
    }
    
    return notification;
  }
}
