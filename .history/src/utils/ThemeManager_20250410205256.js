/**
 * Gerenciador de temas da aplicação
 */
export class ThemeManager {
  /**
   * @param {Object} options - Opções de configuração
   * @param {string} options.storageKey - Chave para armazenamento da preferência
   * @param {string} options.defaultTheme - Tema padrão (light, dark, system)
   * @param {string[]} options.availableThemes - Temas disponíveis
   */
  constructor(options = {}) {
    const {
      storageKey = 'cryptoConverter_theme',
      defaultTheme = 'system',
      availableThemes = ['light', 'dark', 'system']
    } = options;
    
    this.storageKey = storageKey;
    this.defaultTheme = defaultTheme;
    this.availableThemes = availableThemes;
    this.mediaQuery = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');
    
    // Inicializar tema
    this.initialize();
  }
  
  /**
   * Inicializa o gerenciador de temas
   */
  initialize() {
    // Configurar o tema ao iniciar
    this.applyTheme();
    
    // Adicionar listener para o tema do sistema
    if (this.mediaQuery) {
      this.mediaQuery.addEventListener('change', this.handleSystemThemeChange.bind(this));
    }
    
    // Adicionar listener para o evento que indica quando o tema foi alterado
    document.addEventListener('theme-toggle', this.handleThemeToggle.bind(this));
  }
  
  /**
   * Obtém o tema atual
   * @returns {string} - Tema atual
   */
  getCurrentTheme() {
    // Tentar obter do localStorage
    const storedTheme = localStorage.getItem(this.storageKey);
    
    if (storedTheme && this.availableThemes.includes(storedTheme)) {
      return storedTheme;
    }
    
    return this.defaultTheme;
  }
  
  /**
   * Obtém o tema efetivo (considerando sistema se necessário)
   * @returns {string} - Tema efetivo (light ou dark)
   */
  getEffectiveTheme() {
    const currentTheme = this.getCurrentTheme();
    
    // Se for tema do sistema, verificar preferência do sistema
    if (currentTheme === 'system') {
      return this.mediaQuery && this.mediaQuery.matches ? 'dark' : 'light';
    }
    
    return currentTheme;
  }
  
  /**
   * Define o tema da aplicação
   * @param {string} theme - Tema a ser definido
   */
  setTheme(theme) {
    // Verificar se o tema é válido
    if (!this.availableThemes.includes(theme)) {
      console.error(`Tema inválido: ${theme}. Temas disponíveis: ${this.availableThemes.join(', ')}`);
      return;
    }
    
    // Armazenar a preferência do usuário
    localStorage.setItem(this.storageKey, theme);
    
    // Aplicar o tema
    this.applyTheme();
    
    // Notificar sobre a mudança
    this.notifyThemeChange();
  }
  
  /**
   * Alterna para o próximo tema na lista
   */
  toggleTheme() {
    const currentTheme = this.getCurrentTheme();
    const currentIndex = this.availableThemes.indexOf(currentTheme);
    const nextIndex = (currentIndex + 1) % this.availableThemes.length;
    const nextTheme = this.availableThemes[nextIndex];
    
    this.setTheme(nextTheme);
  }
  
  /**
   * Aplica o tema atual ao documento
   */
  applyTheme() {
    const effectiveTheme = this.getEffectiveTheme();
    const html = document.documentElement;
    
    // Remover classes de tema anteriores
    html.classList.remove('theme-light', 'theme-dark');
    
    // Adicionar classe do tema atual
    html.classList.add(`theme-${effectiveTheme}`);
    
    // Definir atributo data-theme
    html.setAttribute('data-theme', effectiveTheme);
    
    // Atualizar meta tag de cor do tema para mobile
    this.updateThemeColor(effectiveTheme);
    
    // Atualizar ícones nos botões de tema
    this.updateThemeIcons();
  }
  
  /**
   * Atualiza a meta tag de cor do tema para mobile
   * @param {string} theme - Tema atual
   */
  updateThemeColor(theme) {
    // Cores para a barra de status em dispositivos móveis
    const colors = {
      light: '#f9fafb',
      dark: '#1f2937'
    };
    
    // Atualizar meta tag
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.setAttribute('name', 'theme-color');
      document.head.appendChild(metaThemeColor);
    }
    
    metaThemeColor.setAttribute('content', colors[theme] || colors.light);
  }
  
  /**
   * Atualiza os ícones nos botões de tema
   */
  updateThemeIcons() {
    const currentTheme = this.getCurrentTheme();
    const effectiveTheme = this.getEffectiveTheme();
    
    // Atualizar ícones em botões de tema
    const themeToggles = document.querySelectorAll('[data-theme-toggle]');
    
    themeToggles.forEach(toggle => {
      const iconElement = toggle.querySelector('i') || toggle;
      
      // Remover classes de ícone anteriores
      iconElement.className = iconElement.className.replace(/fa-sun|fa-moon|fa-circle-half-stroke/g, '');
      
      // Adicionar a classe apropriada
      if (currentTheme === 'system') {
        iconElement.classList.add('fa-circle-half-stroke');
      } else if (effectiveTheme === 'dark') {
        iconElement.classList.add('fa-sun'); // Mostra o sol no modo escuro (para mudar para claro)
      } else {
        iconElement.classList.add('fa-moon'); // Mostra a lua no modo claro (para mudar para escuro)
      }
      
      // Atualizar texto de ajuda se existir
      const tooltipElement = toggle.querySelector('[data-tooltip]') || toggle.nextElementSibling;
      
      if (tooltipElement && tooltipElement.hasAttribute('data-tooltip')) {
        const tooltips = {
          system: 'Usar tema do sistema',
          light: 'Mudar para tema escuro',
          dark: 'Mudar para tema claro'
        };
        
        tooltipElement.setAttribute('data-tooltip', tooltips[currentTheme] || tooltips.light);
      }
    });
  }
  
  /**
   * Manipula mudanças no tema do sistema
   */
  handleSystemThemeChange(event) {
    if (this.getCurrentTheme() === 'system') {
      this.applyTheme();
      this.notifyThemeChange();
    }
  }
  
  /**
   * Manipula eventos de alternância de tema
   */
  handleThemeToggle(event) {
    this.toggleTheme();
  }
  
  /**
   * Notifica sobre a mudança de tema
   */
  notifyThemeChange() {
    const event = new CustomEvent('theme-changed', {
      detail: {
        theme: this.getCurrentTheme(),
        effectiveTheme: this.getEffectiveTheme()
      }
    });
    
    document.dispatchEvent(event);
  }
}