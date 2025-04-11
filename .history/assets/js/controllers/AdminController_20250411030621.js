/**
 * AdminController.js
 * Controlador para o painel administrativo
 */
import AuthService from '../services/AuthService.js';
import ArbitrageController from './ArbitrageController.js';

export default class AdminController {
  constructor() {
    // Inicializa serviços
    this.authService = new AuthService();
    this.arbitrageController = new ArbitrageController();
    
    // Referências aos elementos da UI
    this.elements = {
      loginForm: document.getElementById('adminLoginForm'),
      loginError: document.getElementById('loginError'),
      adminContent: document.getElementById('adminContent'),
      welcomeMessage: document.getElementById('welcomeMessage'),
      logoutBtn: document.getElementById('logoutBtn'),
      sidebarMenu: document.getElementById('sidebarMenu'),
      dashboardTab: document.getElementById('dashboardTab'),
      arbitrageTab: document.getElementById('arbitrageTab'),
      settingsTab: document.getElementById('settingsTab'),
      contentSections: document.querySelectorAll('.content-section')
    };
    
    // Permissões do usuário atual
    this.userPermissions = {
      canViewDashboard: false,
      canManageArbitrage: false,
      canChangeSettings: false
    };
  }
  
  /**
   * Inicializa o controlador
   */
  init() {
    // Verifica se o usuário já está autenticado
    this.checkAuthentication();
    
    // Configura eventos
    this.setupEventListeners();
  }
  
  /**
   * Verifica autenticação e direciona para tela apropriada
   */
  checkAuthentication() {
    const isAuthenticated = this.authService.isAuthenticated();
    
    if (isAuthenticated) {
      // Obtém dados do usuário
      const user = this.authService.getUserDetails();
      
      // Carrega permissões do usuário
      this.loadUserPermissions(user);
      
      // Atualiza a interface com base nas permissões
      this.updateUIBasedOnPermissions();
      
      // Exibe o conteúdo administrativo
      this.showAdminContent();
      
      // Define o Dashboard como tab inicial
      this.showSection('dashboard');
    } else {
      // Exibe o formulário de login
      this.showLoginForm();
    }
  }
  
  /**
   * Configura listeners de eventos
   */
  setupEventListeners() {
    // Formulário de login
    if (this.elements.loginForm) {
      this.elements.loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleLogin();
      });
    }
    
    // Botão de logout
    if (this.elements.logoutBtn) {
      this.elements.logoutBtn.addEventListener('click', () => {
        this.handleLogout();
      });
    }
    
    // Tabs do menu
    if (this.elements.dashboardTab) {
      this.elements.dashboardTab.addEventListener('click', () => {
        this.showSection('dashboard');
      });
    }
    
    if (this.elements.arbitrageTab) {
      this.elements.arbitrageTab.addEventListener('click', () => {
        this.showSection('arbitrage');
      });
    }
    
    if (this.elements.settingsTab) {
      this.elements.settingsTab.addEventListener('click', () => {
        this.showSection('settings');
      });
    }
  }
  
  /**
   * Processa o login do administrador
   */
  handleLogin() {
    const usernameInput = document.getElementById('adminUsername');
    const passwordInput = document.getElementById('adminPassword');
    
    if (!usernameInput || !passwordInput) {
      this.showLoginError('Erro ao processar o formulário de login');
      return;
    }
    
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    
    if (!username || !password) {
      this.showLoginError('Por favor, preencha todos os campos');
      return;
    }
    
    // Limpa mensagem de erro
    this.hideLoginError();
    
    // Tenta autenticar o usuário
    if (this.authService.login(username, password)) {
      // Obtém dados do usuário
      const user = this.authService.getUserDetails();
      
      // Carrega permissões do usuário
      this.loadUserPermissions(user);
      
      // Atualiza a interface
      this.updateUIBasedOnPermissions();
      
      // Exibe o conteúdo administrativo
      this.showAdminContent();
      
      // Define o Dashboard como seção inicial
      this.showSection('dashboard');
    } else {
      this.showLoginError('Credenciais inválidas. Tente novamente.');
      passwordInput.value = ''; // Limpa o campo por segurança
    }
  }
  
  /**
   * Processa logout do usuário
   */
  handleLogout() {
    this.authService.logout();
    this.showLoginForm();
  }
  
  /**
   * Carrega permissões do usuário atual
   * @param {Object} user - Dados do usuário
   */
  loadUserPermissions(user) {
    // Por padrão, o admin tem todas as permissões
    if (user && user.role === 'administrator') {
      this.userPermissions = {
        canViewDashboard: true,
        canManageArbitrage: true,
        canChangeSettings: true
      };
    } else if (user && user.role === 'analyst') {
      // Analista pode visualizar Dashboard e Arbitragem, mas não pode mudar configurações
      this.userPermissions = {
        canViewDashboard: true,
        canManageArbitrage: true,
        canChangeSettings: false
      };
    } else if (user && user.role === 'viewer') {
      // Visualizador só pode ver o Dashboard
      this.userPermissions = {
        canViewDashboard: true,
        canManageArbitrage: false,
        canChangeSettings: false
      };
    } else {
      // Permissões mínimas para outros casos
      this.userPermissions = {
        canViewDashboard: true,
        canManageArbitrage: false,
        canChangeSettings: false
      };
    }
  }
  
  /**
   * Atualiza a UI com base nas permissões do usuário
   */
  updateUIBasedOnPermissions() {
    // Atualiza mensagem de boas-vindas
    if (this.elements.welcomeMessage) {
      const username = this.authService.getCurrentUser() || 'Administrador';
      this.elements.welcomeMessage.textContent = `Bem-vindo, ${username}`;
    }
    
    // Habilita/desabilita abas com base nas permissões
    if (this.elements.arbitrageTab) {
      if (this.userPermissions.canManageArbitrage) {
        this.elements.arbitrageTab.classList.remove('disabled');
      } else {
        this.elements.arbitrageTab.classList.add('disabled');
      }
    }
    
    if (this.elements.settingsTab) {
      if (this.userPermissions.canChangeSettings) {
        this.elements.settingsTab.classList.remove('disabled');
      } else {
        this.elements.settingsTab.classList.add('disabled');
      }
    }
  }
  
  /**
   * Exibe uma seção específica do painel administrativo
   * @param {string} sectionId - ID da seção a ser exibida
   */
  showSection(sectionId) {
    // Verifica permissões
    if (sectionId === 'arbitrage' && !this.userPermissions.canManageArbitrage) {
      this.showNotification('Você não tem permissão para acessar essa seção', 'warning');
      return;
    }
    
    if (sectionId === 'settings' && !this.userPermissions.canChangeSettings) {
      this.showNotification('Você não tem permissão para acessar essa seção', 'warning');
      return;
    }
    
    // Atualiza classes ativas no menu
    const allTabs = document.querySelectorAll('#sidebarMenu .nav-link');
    allTabs.forEach(tab => tab.classList.remove('active'));
    
    const activeTab = document.getElementById(`${sectionId}Tab`);
    if (activeTab) {
      activeTab.classList.add('active');
    }
    
    // Esconde todas as seções
    if (this.elements.contentSections) {
      this.elements.contentSections.forEach(section => {
        section.style.display = 'none';
      });
    }
    
    // Exibe a seção selecionada
    const section = document.getElementById(`${sectionId}Section`);
    if (section) {
      section.style.display = 'block';
    }
    
    // Inicializa controllers específicos
    if (sectionId === 'arbitrage' && this.arbitrageController) {
      this.arbitrageController.init();
    }
  }
  
  /**
   * Exibe o formulário de login
   */
  showLoginForm() {
    if (this.elements.loginForm) {
      this.elements.loginForm.style.display = 'block';
    }
    
    if (this.elements.adminContent) {
      this.elements.adminContent.style.display = 'none';
    }
  }
  
  /**
   * Exibe o conteúdo administrativo
   */
  showAdminContent() {
    if (this.elements.loginForm) {
      this.elements.loginForm.style.display = 'none';
    }
    
    if (this.elements.adminContent) {
      this.elements.adminContent.style.display = 'block';
    }
  }
  
  /**
   * Exibe erro de login
   * @param {string} message - Mensagem de erro
   */
  showLoginError(message) {
    if (this.elements.loginError) {
      this.elements.loginError.textContent = message;
      this.elements.loginError.style.display = 'block';
    }
  }
  
  /**
   * Esconde o erro de login
   */
  hideLoginError() {
    if (this.elements.loginError) {
      this.elements.loginError.style.display = 'none';
    }
  }
  
  /**
   * Exibe notificação no painel admin
   * @param {string} message - Mensagem a ser exibida
   * @param {string} type - Tipo: 'success', 'error', 'warning', 'info'
   * @param {number} duration - Duração em ms (0 = não some automaticamente)
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