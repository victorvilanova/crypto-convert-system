import { ConversionController } from './controllers/ConversionController.js';
import { ErrorHandler } from './utils/ErrorHandler.js';
import { ApiCache } from './utils/ApiCache.js';
import { HttpService } from './services/HttpService.js';
import { CurrencyService } from './services/CurrencyService.js';
import { ConversionService } from './services/ConversionService.js';
import { ConfigService } from './services/ConfigService.js';
import { EVENTS, STORAGE_KEYS } from './constants.js';

/**
 * Classe principal da aplicação
 */
class App {
  constructor() {
    // Inicializar serviços e utilitários fundamentais primeiro
    this.errorHandler = new ErrorHandler();
    this.apiCache = new ApiCache();
    this.configService = new ConfigService();

    // Configurar a aplicação
    this.setupTheme();
    
    // Inicializar serviços de dados
    this.httpService = new HttpService({
      errorHandler: this.errorHandler
    });
    
    this.currencyService = new CurrencyService({
      httpService: this.httpService,
      apiCache: this.apiCache,
      errorHandler: this.errorHandler
    });
    
    this.conversionService = new ConversionService({
      httpService: this.httpService,
      currencyService: this.currencyService,
      apiCache: this.apiCache,
      errorHandler: this.errorHandler
    });
    
    // Inicializar controlador principal
    this.conversionController = new ConversionController({
      conversionService: this.conversionService,
      currencyService: this.currencyService,
      errorHandler: this.errorHandler
    });
    
    // Registrar listeners para eventos globais
    this.setupEventListeners();
  }

  /**
   * Inicializa a aplicação
   */
  async init() {
    try {
      console.log('Inicializando aplicação...');
      
      // Inicializar controlador principal
      await this.conversionController.init();
      
      // Configurar tema
      this.setupTheme();
      
      // Configurar modais e outros componentes da UI
      this.setupModals();
      
      console.log('Aplicação inicializada com sucesso');
    } catch (error) {
      this.errorHandler.handleError(error, 'Falha ao inicializar aplicação', true);
    }
  }

  /**
   * Configura o tema da aplicação
   * @private
   */
  setupTheme() {
    // Obter tema preferido do usuário
    const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Definir tema baseado na preferência ou no tema do sistema
    const theme = savedTheme || (prefersDark ? 'dark' : 'light');
    this.setTheme(theme);
    
    // Configurar o botão de alternar tema
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
      });
    }
    
    // Observar mudanças na preferência do sistema
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        if (!localStorage.getItem(STORAGE_KEYS.THEME)) {
          // Só mudar automaticamente se o usuário não definiu manualmente
          this.setTheme(e.matches ? 'dark' : 'light');
        }
      });
    }
  }

  /**
   * Define o tema da aplicação
   * @param {string} theme - 'light' ou 'dark'
   * @private
   */
  setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
    
    // Atualizar ícone do botão de tema
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
      const icon = themeToggle.querySelector('i');
      if (icon) {
        icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
      }
    }
    
    // Notificar o sistema sobre a mudança de tema
    document.dispatchEvent(new CustomEvent(EVENTS.THEME_CHANGED, {
      detail: { theme }
    }));
  }

  /**
   * Configura os listeners para eventos globais
   * @private
   */
  setupEventListeners() {
    // Lidar com cliques para fechar erro
    document.addEventListener('click', e => {
      if (e.target.classList.contains('close-error')) {
        const errorContainer = document.getElementById('errorContainer');
        if (errorContainer) {
          errorContainer.style.display = 'none';
        }
      }
    });
    
    // Interceptar eventos de rede
    window.addEventListener('online', () => {
      console.log('Conexão de rede restaurada');
      // Atualizar dados quando a conexão for restaurada
      if (this.conversionService) {
        this.conversionService.getRates(true).catch(() => {});
      }
    });
    
    window.addEventListener('offline', () => {
      console.log('Conexão de rede perdida');
      this.errorHandler.handleError(
        'Você está offline. Algumas funcionalidades podem estar limitadas.',
        'Status de rede',
        true
      );
    });
  }

  /**
   * Configura modais e diálogos da aplicação
   * @private
   */
  setupModals() {
    // Modal de configurações
    const settingsModal = document.getElementById('settingsModal');
    const settingsButton = document.getElementById('settingsButton');
    const closeModalButtons = document.querySelectorAll('.close-modal');
    
    if (settingsButton && settingsModal) {
      settingsButton.addEventListener('click', e => {
        e.preventDefault();
        settingsModal.style.display = 'flex';
        this.populateSettingsForm();
      });
    }
    
    closeModalButtons.forEach(button => {
      button.addEventListener('click', () => {
        const modal = button.closest('.modal');
        if (modal) {
          modal.style.display = 'none';
        }
      });
    });
    
    // Fechar modal ao clicar fora
    window.addEventListener('click', e => {
      if (e.target.classList.contains('modal')) {
        e.target.style.display = 'none';
      }
    });
    
    // Configurar formulário de configurações
    const saveSettingsButton = document.getElementById('saveSettings');
    if (saveSettingsButton) {
      saveSettingsButton.addEventListener('click', () => {
        this.saveSettings();
        
        if (settingsModal) {
          settingsModal.style.display = 'none';
        }
      });
    }
    
    // Botão de reset
    const resetSettingsButton = document.getElementById('resetSettings');
    if (resetSettingsButton) {
      resetSettingsButton.addEventListener('click', () => {
        if (confirm('Tem certeza que deseja redefinir todas as configurações para os valores padrão?')) {
          this.configService.resetConfig();
          this.populateSettingsForm();
        }
      });
    }
  }

  /**
   * Preenche o formulário de configurações com os valores atuais
   * @private
   */
  populateSettingsForm() {
    // Tema
    const themeSelect = document.getElementById('themeSelect');
    if (themeSelect) {
      themeSelect.value = this.configService.getTheme();
    }
    
    // Auto-refresh
    const autoRefresh = document.getElementById('autoRefresh');
    if (autoRefresh) {
      autoRefresh.checked = this.configService.isAutoRefreshEnabled();
    }
    
    // Intervalo de atualização
    const refreshInterval = document.getElementById('refreshInterval');
    if (refreshInterval) {
      refreshInterval.value = this.configService.getRefreshInterval();
    }
    
    // Precisão decimal
    const decimalPrecision = document.getElementById('decimalPrecision');
    if (decimalPrecision) {
      decimalPrecision.value = this.configService.getDecimalPrecision('fiat');
    }
    
    // Mostrar histórico
    const showHistory = document.getElementById('showHistory');
    if (showHistory) {
      showHistory.checked = this.configService.isFeatureEnabled('conversionHistory');
    }
  }

  /**
   * Salva as configurações do formulário
   * @private
   */
  saveSettings() {
    // Tema
    const themeSelect = document.getElementById('themeSelect');
    if (themeSelect) {
      this.setTheme(themeSelect.value);
      this.configService.updateConfig('app', 'theme', themeSelect.value);
    }
    
    // Auto-refresh
    const autoRefresh = document.getElementById('autoRefresh');
    if (autoRefresh) {
      this.configService.updateConfig('app', 'autoRefreshRates', autoRefresh.checked);
    }
    
    // Intervalo de atualização
    const refreshInterval = document.getElementById('refreshInterval');
    if (refreshInterval) {
      this.configService.updateConfig('app', 'refreshInterval', parseInt(refreshInterval.value));
    }
    
    // Precisão decimal
    const decimalPrecision = document.getElementById('decimalPrecision');
    if (decimalPrecision) {
      const precision = parseInt(decimalPrecision.value);
      this.configService.updateConfig('app', 'decimalPrecision', {
        fiat: precision,
        crypto: precision > 6 ? precision : 8
      });
    }
    
    // Mostrar histórico
    const showHistory = document.getElementById('showHistory');
    if (showHistory) {
      this.configService.updateConfig('features', 'conversionHistory', showHistory.checked);
      
      // Atualizar UI de acordo
      const historyContainer = document.getElementById('conversionHistory');
      if (historyContainer) {
        historyContainer.style.display = showHistory.checked ? 'block' : 'none';
      }
    }
  }
}

// Inicializar a aplicação quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  window.app = app; // Disponibilizar globalmente para debug
  app.init();
});

// Exportar a classe App para possibilitar testes
export { App };