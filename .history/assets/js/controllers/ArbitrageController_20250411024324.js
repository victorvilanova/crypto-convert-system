/**
 * ArbitrageController.js
 * Controlador para a interface de arbitragem do sistema administrativo
 */
import AuthService from '../services/AuthService.js';
import ArbitrageCalculator from '../utils/ArbitrageCalculator.js';
import CryptoModel from '../models/CryptoModel.js';

export default class ArbitrageController {
  constructor() {
    // Inicializa serviços
    this.authService = new AuthService();
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
          this.arbitrageCalculator.setMinProfitPercentage(threshold);
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
  loadArbitrageData() {
    try {
      // Em produção, aqui buscaria dados reais de APIs
      // Para desenvolvimento, usamos o calculador com dados simulados
      this.loadTriangularArbitrageOpportunities();
      this.loadExchangeArbitrageOpportunities();
      
      // Atualiza timestamp
      this.updateLastRefreshTime();
    } catch (error) {
      console.error('Erro ao carregar dados de arbitragem:', error);
    }
  }
  
  /**
   * Carrega oportunidades de arbitragem triangular
   */
  loadTriangularArbitrageOpportunities() {
    if (!this.triangularOpportunitiesList) return;
    
    // Obtém oportunidades do calculador
    const opportunities = this.arbitrageCalculator.findTriangularArbitrageOpportunities();
    
    // Limpa a lista atual
    this.triangularOpportunitiesList.innerHTML = '';
    
    if (opportunities.length === 0) {
      const emptyMessage = document.createElement('div');
      emptyMessage.className = 'alert alert-info';
      emptyMessage.textContent = 'Nenhuma oportunidade de arbitragem triangular encontrada com o limiar de lucro atual.';
      this.triangularOpportunitiesList.appendChild(emptyMessage);
      return;
    }
    
    // Adiciona cada oportunidade à lista
    opportunities.forEach(opportunity => {
      const card = document.createElement('div');
      card.className = 'card mb-3';
      
      const cardHeader = document.createElement('div');
      cardHeader.className = 'card-header bg-primary text-white d-flex justify-content-between align-items-center';
      cardHeader.innerHTML = `
        <h5 class="mb-0">${opportunity.route}</h5>
        <span class="badge bg-success fs-6">${opportunity.profitPercentage}% de lucro</span>
      `;
      
      const cardBody = document.createElement('div');
      cardBody.className = 'card-body';
      
      // Passos da arbitragem
      const stepsList = document.createElement('ol');
      stepsList.className = 'list-group list-group-flush list-group-numbered mb-3';
      
      opportunity.steps.forEach(step => {
        const stepItem = document.createElement('li');
        stepItem.className = 'list-group-item';
        stepItem.innerHTML = `Converter <strong>${step.from}</strong> para <strong>${step.to}</strong> na taxa de <strong>${step.rate}</strong>`;
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
  
  /**
   * Carrega oportunidades de arbitragem entre exchanges
   */
  loadExchangeArbitrageOpportunities() {
    if (!this.exchangeOpportunitiesList) return;
    
    // Obtém oportunidades do calculador
    const opportunities = this.arbitrageCalculator.findExchangeArbitrageOpportunities();
    
    // Limpa a lista atual
    this.exchangeOpportunitiesList.innerHTML = '';
    
    if (opportunities.length === 0) {
      const emptyMessage = document.createElement('div');
      emptyMessage.className = 'alert alert-info';
      emptyMessage.textContent = 'Nenhuma oportunidade de arbitragem entre exchanges encontrada com o limiar de lucro atual.';
      this.exchangeOpportunitiesList.appendChild(emptyMessage);
      return;
    }
    
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
    
    opportunities.forEach(op => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td><strong>${op.crypto}</strong></td>
        <td>${op.buyExchange}</td>
        <td>$${op.buyPrice}</td>
        <td>${op.sellExchange}</td>
        <td>$${op.sellPrice}</td>
        <td><span class="badge bg-success">${op.profitPercentage}%</span></td>
      `;
      tbody.appendChild(row);
    });
    
    table.appendChild(thead);
    table.appendChild(tbody);
    
    this.exchangeOpportunitiesList.appendChild(table);
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
