/**
 * AdminDashboardController.js
 * Controlador para o dashboard administrativo
 */
import AuthService from '../services/AuthService.js';
import CryptoModel from '../models/CryptoModel.js';
import ArbitrageCalculator from '../utils/ArbitrageCalculator.js';

export default class AdminDashboardController {
  constructor() {
    this.model = new CryptoModel();
    this.calculator = new ArbitrageCalculator();
    this.authService = new AuthService();
    this.updateInterval = null;

    // Elementos da UI
    this.loginForm = document.getElementById('adminLoginForm');
    this.dashboardContent = document.getElementById('dashboardContent');
    this.loginError = document.getElementById('loginError');
    this.adminUsernameSpan = document.getElementById('adminUsername');
    this.lastUpdateTimeSpan = document.getElementById('lastUpdateTime');
    this.totalOpportunitiesSpan = document.getElementById('totalOpportunities');
    this.cryptosCountSpan = document.getElementById('cryptosCount');
    this.recentOperationsTable = document.getElementById('recentOperations');
    this.refreshDataBtn = document.getElementById('refreshDataBtn');
  }

  /**
   * Inicializa o controlador
   */
  init() {
    // Verifica se o usuário já está autenticado
    this.checkAuthentication();

    // Configura o formulário de login
    this.setupLoginForm();

    // Configura os controles de dashboard
    this.setupDashboardControls();
  }

  /**
   * Verifica se o usuário está autenticado
   */
  checkAuthentication() {
    const isAuthenticated = this.authService.isAuthenticated();

    if (isAuthenticated) {
      this.showDashboardContent();
      this.loadDashboardData();
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
   * Autentica o usuário administrativo
   * @param {string} username - Nome de usuário
   * @param {string} password - Senha
   */
  authenticate(username, password) {
    // Reset error message
    this.loginError.style.display = 'none';

    // Validate credentials
    if (!username || !password) {
      this.loginError.textContent = 'Por favor, preencha todos os campos.';
      this.loginError.style.display = 'block';
      return;
    }

    // Use this for development and testing - admin/admin123
    const adminUsername = 'admin';
    const adminPassword = 'admin123';

    if (username === adminUsername && password === adminPassword) {
      // Authentication successful
      localStorage.setItem('adminLoggedIn', 'true');
      this.loginContainer.style.display = 'none';
      this.dashboardContainer.style.display = 'block';
      this.loadDashboardData();
    } else {
      // Authentication failed
      this.loginError.textContent = 'Nome de usuário ou senha incorretos.';
      this.loginError.style.display = 'block';
    }

    // Clear password field for security
    document.getElementById('adminPasswordInput').value = '';
  }

  /**
   * Mostra o formulário de login e esconde o conteúdo de dashboard
   */
  showLoginForm() {
    if (this.loginForm) this.loginForm.style.display = 'flex';
    if (this.dashboardContent) this.dashboardContent.style.display = 'none';
  }

  /**
   * Mostra o conteúdo de dashboard e esconde o formulário de login
   */
  showDashboardContent() {
    if (this.loginForm) this.loginForm.style.display = 'none';
    if (this.dashboardContent) this.dashboardContent.style.display = 'block';
  }

  /**
   * Configura os controles do dashboard
   */
  setupDashboardControls() {
    // Configura o botão de atualização manual
    if (this.refreshDataBtn) {
      this.refreshDataBtn.addEventListener('click', () =>
        this.loadDashboardData()
      );
    }

    // Configura o botão de logout
    const logoutBtn = document.getElementById('adminLogoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => this.logout());
    }
  }

  /**
   * Carrega os dados do dashboard
   */
  async loadDashboardData() {
    if (!this.authService.isAuthenticated()) return;

    try {
      // Busca taxas atualizadas
      await this.model.fetchRates();

      // Define taxas no calculador
      this.calculator.setRates(this.model.rates);

      // Busca oportunidades
      const triangularOpportunities =
        this.calculator.findTriangularArbitrageOpportunities();
      const exchangeOpportunities =
        this.calculator.findExchangeArbitrageOpportunities();

      // Atualiza estatísticas
      this.updateDashboardStats(triangularOpportunities, exchangeOpportunities);

      // Atualiza timestamp
      this.updateLastUpdateTime();

      // Configura atualização automática se ainda não estiver configurada
      if (!this.updateInterval) {
        this.setupAutoUpdate();
      }
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
      this.displayError(
        'Não foi possível carregar os dados. Tente novamente mais tarde.'
      );
    }
  }

  /**
   * Atualiza as estatísticas do dashboard
   * @param {Array} triangularOpportunities - Oportunidades de arbitragem triangular
   * @param {Array} exchangeOpportunities - Oportunidades de arbitragem entre exchanges
   */
  updateDashboardStats(triangularOpportunities, exchangeOpportunities) {
    // Total de oportunidades
    const totalOpportunities =
      triangularOpportunities.length + exchangeOpportunities.length;
    if (this.totalOpportunitiesSpan) {
      this.totalOpportunitiesSpan.textContent = totalOpportunities;
    }

    // Total de criptomoedas
    if (this.cryptosCountSpan) {
      const cryptos = this.model.getCryptos();
      this.cryptosCountSpan.textContent = cryptos.length;
    }
  }

  /**
   * Configura a atualização automática dos dados
   */
  setupAutoUpdate() {
    // Limpa qualquer intervalo existente
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    // Configura novo intervalo - atualiza a cada 2 minutos
    this.updateInterval = setInterval(() => {
      if (this.authService.isAuthenticated()) {
        this.loadDashboardData();
      }
    }, 120000); // 2 minutos
  }

  /**
   * Exibe mensagem de erro
   * @param {string} message - Mensagem de erro
   */
  displayError(message) {
    // Implementação simplificada - em um sistema real usaríamos um toast ou alerta
    console.error(message);
  }

  /**
   * Atualiza o timestamp da última atualização
   */
  updateLastUpdateTime() {
    if (this.lastUpdateTimeSpan) {
      const now = new Date();
      this.lastUpdateTimeSpan.textContent = now.toLocaleTimeString();
    }
  }

  /**
   * Realiza logout do administrador
   */
  logout() {
    this.authService.logout();

    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    this.showLoginForm();
  }

  /**
   * Limpa recursos ao destruir o controlador
   */
  destroy() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }
}
