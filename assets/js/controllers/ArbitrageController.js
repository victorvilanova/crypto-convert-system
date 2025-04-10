/**
 * ArbitrageController.js
 * Controlador para a tela de arbitragem (acesso administrativo)
 */
import ArbitrageCalculator from '../utils/ArbitrageCalculator.js';
import CryptoModel from '../models/CryptoModel.js';

export default class ArbitrageController {
  constructor() {
    this.model = new CryptoModel();
    this.calculator = new ArbitrageCalculator();
    this.updateInterval = null;
    this.isAuthenticated = false;
    this.updateFrequencyMs = 30000; // 30 segundos

    // Elementos da UI
    this.opportunitiesTable = document.getElementById('arbitrageOpportunities');
    this.exchangeArbitrageTable = document.getElementById('exchangeArbitrage');
    this.minProfitInput = document.getElementById('minProfit');
    this.lastUpdateSpan = document.getElementById('lastArbitrageUpdate');
    this.loginForm = document.getElementById('adminLoginForm');
    this.arbitrageContent = document.getElementById('arbitrageContent');
    this.loginError = document.getElementById('loginError');
    this.loadingIndicator = document.getElementById('arbitrageLoading');
  }

  /**
   * Inicializa o controlador
   */
  init() {
    // Verifica se o usuário já está autenticado
    this.checkAuthentication();

    // Configura o formulário de login
    this.setupLoginForm();

    // Configura os controles de arbitragem
    this.setupArbitrageControls();
  }

  /**
   * Verifica se o usuário está autenticado
   */
  checkAuthentication() {
    const authToken = localStorage.getItem('admin_auth_token');

    if (authToken) {
      try {
        // Em uma aplicação real, verificaríamos o token no servidor
        // Esta é uma verificação simplificada para demonstração
        const tokenData = JSON.parse(atob(authToken.split('.')[1]));

        if (tokenData && tokenData.exp > Date.now() / 1000) {
          this.isAuthenticated = true;
          this.showArbitrageContent();
          return;
        }
      } catch (e) {
        console.error('Erro ao verificar autenticação:', e);
      }
    }

    // Se chegou aqui, não está autenticado
    this.isAuthenticated = false;
    this.showLoginForm();
  }

  /**
   * Configura o formulário de login de administrador
   */
  setupLoginForm() {
    if (!this.loginForm) return;

    this.loginForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const username = document.getElementById('adminUsername').value;
      const password = document.getElementById('adminPassword').value;

      this.authenticate(username, password);
    });
  }

  /**
   * Autentica o usuário administrativo
   * @param {string} username - Nome de usuário
   * @param {string} password - Senha
   */
  authenticate(username, password) {
    // Em uma aplicação real, isso seria uma chamada a um servidor
    // Para este exemplo, usamos credenciais fixas
    if (username === 'admin' && password === 'arbitrage123') {
      // Cria um token simulado (em produção, isso viria do servidor)
      const now = Math.floor(Date.now() / 1000);
      const expiresIn = 60 * 60; // 1 hora

      const tokenPayload = {
        sub: 'admin',
        role: 'admin',
        iat: now,
        exp: now + expiresIn,
      };

      // Criando um token JWT simulado (simplificado)
      const tokenHeader = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const tokenBody = btoa(JSON.stringify(tokenPayload));
      const tokenSignature = btoa('signature'); // Simulado

      const token = `${tokenHeader}.${tokenBody}.${tokenSignature}`;

      // Salva o token
      localStorage.setItem('admin_auth_token', token);

      // Atualiza o estado e mostra o conteúdo
      this.isAuthenticated = true;
      this.showArbitrageContent();

      // Inicia o carregamento de dados
      this.loadArbitrageData();
    } else {
      // Falha na autenticação
      if (this.loginError) {
        this.loginError.textContent = 'Credenciais inválidas. Tente novamente.';
        this.loginError.style.display = 'block';
      }
    }
  }

  /**
   * Mostra o formulário de login e esconde o conteúdo de arbitragem
   */
  showLoginForm() {
    if (this.loginForm) this.loginForm.style.display = 'block';
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
   * Configura os controles da tela de arbitragem
   */
  setupArbitrageControls() {
    // Configura o botão de atualização manual
    const refreshBtn = document.getElementById('refreshArbitrage');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.loadArbitrageData());
    }

    // Configura o input de lucro mínimo
    if (this.minProfitInput) {
      this.minProfitInput.addEventListener('change', () => {
        const minProfit = parseFloat(this.minProfitInput.value);
        if (!isNaN(minProfit) && minProfit >= 0) {
          this.calculator.setMinProfitPercentage(minProfit);
          this.loadArbitrageData();
        }
      });
    }

    // Configura o botão de logout
    const logoutBtn = document.getElementById('adminLogoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => this.logout());
    }
  }

  /**
   * Carrega os dados de arbitragem
   */
  async loadArbitrageData() {
    if (!this.isAuthenticated) return;

    try {
      this.showLoading();

      // Busca taxas atualizadas
      await this.model.fetchRates();

      // Define taxas no calculador
      this.calculator.setRates(this.model.rates);

      // Busca oportunidades
      const triangularOpportunities =
        this.calculator.findTriangularArbitrageOpportunities();
      const exchangeOpportunities =
        this.calculator.findExchangeArbitrageOpportunities();

      // Exibe os resultados
      this.displayTriangularArbitrage(triangularOpportunities);
      this.displayExchangeArbitrage(exchangeOpportunities);

      // Atualiza timestamp
      this.updateLastUpdateTime();

      // Configura atualização automática se ainda não estiver configurada
      if (!this.updateInterval) {
        this.setupAutoUpdate();
      }
    } catch (error) {
      console.error('Erro ao carregar dados de arbitragem:', error);
      this.displayError('Não foi possível carregar os dados de arbitragem.');
    } finally {
      this.hideLoading();
    }
  }

  /**
   * Exibe as oportunidades de arbitragem triangular
   * @param {Array} opportunities - Lista de oportunidades
   */
  displayTriangularArbitrage(opportunities) {
    if (!this.opportunitiesTable) return;

    // Limpa a tabela
    this.opportunitiesTable.innerHTML = '';

    if (opportunities.length === 0) {
      const row = document.createElement('tr');
      const cell = document.createElement('td');
      cell.colSpan = 4;
      cell.textContent =
        'Nenhuma oportunidade de arbitragem triangular encontrada.';
      cell.className = 'text-center p-3';
      row.appendChild(cell);
      this.opportunitiesTable.appendChild(row);
      return;
    }

    // Preenche a tabela com as oportunidades
    opportunities.forEach((opportunity) => {
      const row = document.createElement('tr');

      const routeCell = document.createElement('td');
      routeCell.innerHTML = `<strong>${opportunity.route}</strong>`;

      const stepsCell = document.createElement('td');
      stepsCell.innerHTML = opportunity.steps
        .map((step) => `${step.from} → ${step.to}: ${step.rate}`)
        .join('<br>');

      const profitCell = document.createElement('td');
      profitCell.innerHTML = `<strong class="text-success">${opportunity.profitPercentage}%</strong>`;

      const actionCell = document.createElement('td');
      const executeBtn = document.createElement('button');
      executeBtn.className = 'btn btn-sm btn-outline-success';
      executeBtn.innerHTML = '<i class="fas fa-play me-1"></i> Executar';
      executeBtn.onclick = () => this.simulateArbitrageExecution(opportunity);
      actionCell.appendChild(executeBtn);

      row.appendChild(routeCell);
      row.appendChild(stepsCell);
      row.appendChild(profitCell);
      row.appendChild(actionCell);

      this.opportunitiesTable.appendChild(row);
    });
  }

  /**
   * Exibe as oportunidades de arbitragem entre exchanges
   * @param {Array} opportunities - Lista de oportunidades
   */
  displayExchangeArbitrage(opportunities) {
    if (!this.exchangeArbitrageTable) return;

    // Limpa a tabela
    this.exchangeArbitrageTable.innerHTML = '';

    if (opportunities.length === 0) {
      const row = document.createElement('tr');
      const cell = document.createElement('td');
      cell.colSpan = 5;
      cell.textContent =
        'Nenhuma oportunidade de arbitragem entre exchanges encontrada.';
      cell.className = 'text-center p-3';
      row.appendChild(cell);
      this.exchangeArbitrageTable.appendChild(row);
      return;
    }

    // Preenche a tabela com as oportunidades
    opportunities.forEach((opportunity) => {
      const row = document.createElement('tr');

      const cryptoCell = document.createElement('td');
      cryptoCell.textContent = opportunity.crypto;

      const buyCell = document.createElement('td');
      buyCell.innerHTML = `${opportunity.buyExchange}<br><strong>$${opportunity.buyPrice}</strong>`;

      const sellCell = document.createElement('td');
      sellCell.innerHTML = `${opportunity.sellExchange}<br><strong>$${opportunity.sellPrice}</strong>`;

      const profitCell = document.createElement('td');
      profitCell.innerHTML = `<strong class="text-success">${opportunity.profitPercentage}%</strong>`;

      const actionCell = document.createElement('td');
      const executeBtn = document.createElement('button');
      executeBtn.className = 'btn btn-sm btn-outline-success';
      executeBtn.innerHTML = '<i class="fas fa-play me-1"></i> Executar';
      executeBtn.onclick = () => this.simulateArbitrageExecution(opportunity);
      actionCell.appendChild(executeBtn);

      row.appendChild(cryptoCell);
      row.appendChild(buyCell);
      row.appendChild(sellCell);
      row.appendChild(profitCell);
      row.appendChild(actionCell);

      this.exchangeArbitrageTable.appendChild(row);
    });
  }

  /**
   * Simula a execução de uma oportunidade de arbitragem
   * @param {Object} opportunity - Oportunidade a ser executada
   */
  simulateArbitrageExecution(opportunity) {
    // Em uma aplicação real, isso conectaria a APIs de exchanges
    alert(
      `Simulando execução da oportunidade de arbitragem:\n${JSON.stringify(
        opportunity,
        null,
        2
      )}`
    );
    console.log('Executando arbitragem:', opportunity);
  }

  /**
   * Configura a atualização automática dos dados
   */
  setupAutoUpdate() {
    // Limpa qualquer intervalo existente
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    // Configura novo intervalo
    this.updateInterval = setInterval(() => {
      if (this.isAuthenticated) {
        this.loadArbitrageData();
      }
    }, this.updateFrequencyMs);
  }

  /**
   * Mostra o indicador de carregamento
   */
  showLoading() {
    if (this.loadingIndicator) {
      this.loadingIndicator.style.display = 'block';
    }
  }

  /**
   * Esconde o indicador de carregamento
   */
  hideLoading() {
    if (this.loadingIndicator) {
      this.loadingIndicator.style.display = 'none';
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
   * Atualiza o timestamp da última atualização
   */
  updateLastUpdateTime() {
    if (this.lastUpdateSpan) {
      const now = new Date();
      this.lastUpdateSpan.textContent = now.toLocaleTimeString();
    }
  }

  /**
   * Realiza logout do administrador
   */
  logout() {
    localStorage.removeItem('admin_auth_token');
    this.isAuthenticated = false;

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
