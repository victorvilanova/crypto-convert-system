/**
 * Sistema de notificações
 * Gerencia diferentes tipos de notificações para o usuário
 */

class NotificationManager {
  constructor(options = {}) {
    this.options = {
      defaultDuration: 5000, // Duração padrão em ms
      maxNotifications: 3, // Número máximo de notificações simultâneas
      position: 'top-right', // Posição padrão
      theme: 'light', // Tema padrão
      sounds: false, // Som de notificação
      ...options
    };
    
    this.notifications = [];
    this.container = null;
    this.initialized = false;
    
    // Inicializar o sistema
    this.init();
  }
  
  /**
   * Inicializa o container de notificações
   */
  init() {
    if (typeof document === 'undefined' || this.initialized) {
      return;
    }
    
    // Criar container para as notificações
    this.container = document.createElement('div');
    this.container.className = `notification-container ${this.options.position} ${this.options.theme}`;
    this.container.style.position = 'fixed';
    this.container.style.zIndex = '9999';
    
    // Posicionar o container
    switch (this.options.position) {
      case 'top-right':
        this.container.style.top = '20px';
        this.container.style.right = '20px';
        break;
      case 'top-left':
        this.container.style.top = '20px';
        this.container.style.left = '20px';
        break;
      case 'bottom-right':
        this.container.style.bottom = '20px';
        this.container.style.right = '20px';
        break;
      case 'bottom-left':
        this.container.style.bottom = '20px';
        this.container.style.left = '20px';
        break;
      case 'top-center':
        this.container.style.top = '20px';
        this.container.style.left = '50%';
        this.container.style.transform = 'translateX(-50%)';
        break;
      case 'bottom-center':
        this.container.style.bottom = '20px';
        this.container.style.left = '50%';
        this.container.style.transform = 'translateX(-50%)';
        break;
      default:
        this.container.style.top = '20px';
        this.container.style.right = '20px';
    }
    
    // Adicionar estilos base ao container
    this.container.style.display = 'flex';
    this.container.style.flexDirection = 'column';
    this.container.style.gap = '10px';
    this.container.style.maxWidth = '400px';
    this.container.style.width = 'auto';
    
    // Adicionar ao DOM
    document.body.appendChild(this.container);
    this.initialized = true;
    
    // Adicionar estilos globais para animações
    this._addGlobalStyles();
  }
  
  /**
   * Adiciona estilos globais para as notificações
   * @private
   */
  _addGlobalStyles() {
    if (document.getElementById('notification-styles')) {
      return;
    }
    
    const styleEl = document.createElement('style');
    styleEl.id = 'notification-styles';
    styleEl.textContent = `
      .notification-item {
        padding: 12px 16px;
        border-radius: 6px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        margin-bottom: 8px;
        opacity: 0;
        transform: translateY(-20px);
        transition: all 0.3s ease;
        display: flex;
        align-items: flex-start;
        overflow: hidden;
        position: relative;
        max-width: 400px;
        width: 100%;
      }
      
      .notification-item.visible {
        opacity: 1;
        transform: translateY(0);
      }
      
      .notification-item.exiting {
        opacity: 0;
        transform: translateY(-20px);
      }
      
      .notification-icon {
        margin-right: 12px;
        flex-shrink: 0;
      }
      
      .notification-content {
        flex-grow: 1;
      }
      
      .notification-title {
        font-weight: bold;
        margin-bottom: 4px;
        font-size: 14px;
      }
      
      .notification-message {
        font-size: 13px;
        line-height: 1.4;
      }
      
      .notification-close {
        cursor: pointer;
        font-size: 16px;
        line-height: 16px;
        padding: 4px;
        background: transparent;
        border: none;
        opacity: 0.7;
        transition: opacity 0.2s;
        margin-left: 8px;
        flex-shrink: 0;
      }
      
      .notification-close:hover {
        opacity: 1;
      }
      
      .notification-progress {
        position: absolute;
        bottom: 0;
        left: 0;
        height: 3px;
        background-color: rgba(255, 255, 255, 0.5);
      }
      
      /* Themes */
      .notification-container.light .notification-item {
        background-color: #fff;
        color: #333;
      }
      
      .notification-container.dark .notification-item {
        background-color: #333;
        color: #fff;
      }
      
      /* Types */
      .notification-item.success {
        background-color: #edf7ed;
        border-left: 4px solid #4caf50;
      }
      
      .notification-item.error {
        background-color: #fdeded;
        border-left: 4px solid #f44336;
      }
      
      .notification-item.warning {
        background-color: #fff8e1;
        border-left: 4px solid #ff9800;
      }
      
      .notification-item.info {
        background-color: #e6f4ff;
        border-left: 4px solid #2196f3;
      }
      
      .notification-container.dark .notification-item.success {
        background-color: #1b5e20;
        border-left: 4px solid #4caf50;
      }
      
      .notification-container.dark .notification-item.error {
        background-color: #7f0000;
        border-left: 4px solid #f44336;
      }
      
      .notification-container.dark .notification-item.warning {
        background-color: #693c00;
        border-left: 4px solid #ff9800;
      }
      
      .notification-container.dark .notification-item.info {
        background-color: #01579b;
        border-left: 4px solid #2196f3;
      }
    `;
    
    document.head.appendChild(styleEl);
  }
  
  /**
   * Cria uma nova notificação
   * @param {Object} options - Opções da notificação
   * @returns {Object} - Objeto representando a notificação
   */
  create(options) {
    // Garantir que o sistema está inicializado
    if (!this.initialized) {
      this.init();
    }
    
    const id = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    
    const defaults = {
      id,
      title: '',
      message: '',
      type: 'info', // success, error, warning, info
      duration: this.options.defaultDuration,
      dismissible: true,
      onClose: null,
      actions: [],
      dangerouslySetInnerHTML: false
    };
    
    const notification = {
      ...defaults,
      ...options,
      timestamp: Date.now(),
      element: null
    };
    
    // Limitar o número de notificações
    if (this.notifications.length >= this.options.maxNotifications) {
      const oldest = this.notifications[0];
      this.close(oldest.id);
    }
    
    // Adicionar à lista
    this.notifications.push(notification);
    
    // Renderizar a notificação
    this._renderNotification(notification);
    
    // Reproduzir som, se habilitado
    this._playSound(notification.type);
    
    // Configurar o temporizador de auto-fechamento
    if (notification.duration > 0) {
      notification.timer = setTimeout(() => {
        this.close(notification.id);
      }, notification.duration);
    }
    
    return {
      id: notification.id,
      close: () => this.close(notification.id)
    };
  }
  
  /**
   * Renderiza uma notificação no DOM
   * @private
   * @param {Object} notification - Objeto da notificação
   */
  _renderNotification(notification) {
    if (!this.container) return;
    
    // Criar elemento da notificação
    const element = document.createElement('div');
    element.className = `notification-item ${notification.type}`;
    element.dataset.id = notification.id;
    
    // Criar o HTML interno
    let iconHtml = '';
    
    switch (notification.type) {
      case 'success':
        iconHtml = '<div class="notification-icon">✓</div>';
        break;
      case 'error':
        iconHtml = '<div class="notification-icon">✕</div>';
        break;
      case 'warning':
        iconHtml = '<div class="notification-icon">⚠</div>';
        break;
      case 'info':
        iconHtml = '<div class="notification-icon">ℹ</div>';
        break;
    }
    
    // Conteúdo principal
    let contentHtml = `
      <div class="notification-content">
        ${notification.title ? `<div class="notification-title">${notification.title}</div>` : ''}
        <div class="notification-message">
          ${notification.dangerouslySetInnerHTML ? notification.message : this._escapeHtml(notification.message)}
        </div>
        ${this._renderActions(notification.actions)}
      </div>
    `;
    
    // Botão de fechar
    let closeButton = '';
    if (notification.dismissible) {
      closeButton = '<button class="notification-close" aria-label="Fechar">×</button>';
    }
    
    // Barra de progresso
    let progressBar = '';
    if (notification.duration > 0) {
      progressBar = `<div class="notification-progress" style="width: 100%; transition: width ${notification.duration}ms linear;"></div>`;
    }
    
    element.innerHTML = `${iconHtml}${contentHtml}${closeButton}${progressBar}`;
    
    // Adicionar eventos
    if (notification.dismissible) {
      const closeBtn = element.querySelector('.notification-close');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => this.close(notification.id));
      }
      
      // Fechar ao clicar, se configurado
      if (notification.closeOnClick) {
        element.addEventListener('click', (e) => {
          if (e.target.closest('.notification-action')) return;
          this.close(notification.id);
        });
      }
    }
    
    // Adicionar ao DOM
    this.container.appendChild(element);
    notification.element = element;
    
    // Iniciar a animação de entrada
    setTimeout(() => {
      element.classList.add('visible');
      
      // Animar a barra de progresso
      if (notification.duration > 0) {
        const progressBar = element.querySelector('.notification-progress');
        if (progressBar) {
          setTimeout(() => {
            progressBar.style.width = '0%';
          }, 10);
        }
      }
    }, 10);
  }
  
  /**
   * Renderiza ações para uma notificação
   * @private
   * @param {Array} actions - Lista de ações
   * @returns {string} - HTML das ações
   */
  _renderActions(actions) {
    if (!actions || !actions.length) {
      return '';
    }
    
    const actionsHtml = actions.map(action => {
      return `<button class="notification-action ${action.className || ''}" data-action="${action.id || ''}">${action.label}</button>`;
    }).join('');
    
    return `<div class="notification-actions">${actionsHtml}</div>`;
  }
  
  /**
   * Escapa HTML para evitar XSS
   * @private
   * @param {string} html - String com possível HTML
   * @returns {string} - String escapada
   */
  _escapeHtml(html) {
    if (!html) return '';
    
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
  }
  
  /**
   * Reproduz um som de notificação
   * @private
   * @param {string} type - Tipo de notificação
   */
  _playSound(type) {
    if (!this.options.sounds) return;
    
    // Implementação básica com Audio API
    try {
      let soundUrl;
      
      switch (type) {
        case 'success':
          soundUrl = this.options.sounds.success || '/sounds/success.mp3';
          break;
        case 'error':
          soundUrl = this.options.sounds.error || '/sounds/error.mp3';
          break;
        case 'warning':
          soundUrl = this.options.sounds.warning || '/sounds/warning.mp3';
          break;
        case 'info':
          soundUrl = this.options.sounds.info || '/sounds/info.mp3';
          break;
        default:
          soundUrl = this.options.sounds.default || '/sounds/notification.mp3';
      }
      
      if (typeof soundUrl === 'string') {
        const audio = new Audio(soundUrl);
        audio.volume = 0.5;
        audio.play().catch(e => {
          // Ignora erros - os navegadores bloqueiam reprodução automática
        });
      }
    } catch (e) {
      console.warn('Falha ao reproduzir som de notificação', e);
    }
  }
  
  /**
   * Fecha uma notificação
   * @param {string} id - ID da notificação
   */
  close(id) {
    const index = this.notifications.findIndex(item => item.id === id);
    
    if (index !== -1) {
      const notification = this.notifications[index];
      
      // Limpar o temporizador
      if (notification.timer) {
        clearTimeout(notification.timer);
      }
      
      // Animar a saída
      if (notification.element) {
        notification.element.classList.add('exiting');
        notification.element.classList.remove('visible');
        
        setTimeout(() => {
          if (notification.element && notification.element.parentNode) {
            notification.element.parentNode.removeChild(notification.element);
          }
          
          // Executar callback onClose
          if (typeof notification.onClose === 'function') {
            notification.onClose();
          }
        }, 300);
      }
      
      // Remover da lista
      this.notifications.splice(index, 1);
    }
  }
  
  /**
   * Fecha todas as notificações
   */
  closeAll() {
    [...this.notifications].forEach(notification => {
      this.close(notification.id);
    });
  }
  
  /**
   * Mostra uma notificação de sucesso
   * @param {string} message - Mensagem
   * @param {string|Object} titleOrOptions - Título ou opções
   * @returns {Object} - Objeto da notificação
   */
  success(message, titleOrOptions = {}) {
    const options = typeof titleOrOptions === 'string' 
      ? { title: titleOrOptions } 
      : titleOrOptions;
    
    return this.create({
      type: 'success',
      message,
      ...options
    });
  }
  
  /**
   * Mostra uma notificação de erro
   * @param {string} message - Mensagem
   * @param {string|Object} titleOrOptions - Título ou opções
   * @returns {Object} - Objeto da notificação
   */
  error(message, titleOrOptions = {}) {
    const options = typeof titleOrOptions === 'string' 
      ? { title: titleOrOptions } 
      : titleOrOptions;
    
    return this.create({
      type: 'error',
      message,
      ...options
    });
  }
  
  /**
   * Mostra uma notificação de aviso
   * @param {string} message - Mensagem
   * @param {string|Object} titleOrOptions - Título ou opções
   * @returns {Object} - Objeto da notificação
   */
  warning(message, titleOrOptions = {}) {
    const options = typeof titleOrOptions === 'string' 
      ? { title: titleOrOptions } 
      : titleOrOptions;
    
    return this.create({
      type: 'warning',
      message,
      ...options
    });
  }
  
  /**
   * Mostra uma notificação informativa
   * @param {string} message - Mensagem
   * @param {string|Object} titleOrOptions - Título ou opções
   * @returns {Object} - Objeto da notificação
   */
  info(message, titleOrOptions = {}) {
    const options = typeof titleOrOptions === 'string' 
      ? { title: titleOrOptions } 
      : titleOrOptions;
    
    return this.create({
      type: 'info',
      message,
      ...options
    });
  }
  
  /**
   * Mostra uma notificação personalizada
   * @param {Object} options - Opções da notificação
   * @returns {Object} - Objeto da notificação
   */
  custom(options) {
    return this.create(options);
  }
  
  /**
   * Cria uma notificação que requer confirmação
   * @param {Object} options - Opções da notificação
   * @returns {Promise} - Promise resolvida quando o usuário interage
   */
  confirm(options) {
    return new Promise((resolve) => {
      const actions = [
        {
          id: 'confirm',
          label: options.confirmText || 'Confirmar',
          className: 'notification-confirm-btn'
        },
        {
          id: 'cancel',
          label: options.cancelText || 'Cancelar',
          className: 'notification-cancel-btn'
        }
      ];
      
      const notification = this.create({
        type: options.type || 'info',
        title: options.title,
        message: options.message,
        duration: 0, // Não desaparece automaticamente
        actions,
        dismissible: true,
        ...options
      });
      
      // Adicionar event listeners para os botões
      if (notification.element) {
        const confirmBtn = notification.element.querySelector('[data-action="confirm"]');
        const cancelBtn = notification.element.querySelector('[data-action="cancel"]');
        
        if (confirmBtn) {
          confirmBtn.addEventListener('click', () => {
            this.close(notification.id);
            resolve(true);
          });
        }
        
        if (cancelBtn) {
          cancelBtn.addEventListener('click', () => {
            this.close(notification.id);
            resolve(false);
          });
        }
        
        // Se for clicável
        if (options.closeOnClick) {
          notification.element.addEventListener('click', (e) => {
            if (!e.target.closest('.notification-action')) {
              this.close(notification.id);
              resolve(false);
            }
          });
        }
      }
    });
  }
  
  /**
   * Atualiza as opções do sistema de notificações
   * @param {Object} options - Novas opções
   */
  updateOptions(options) {
    this.options = {
      ...this.options,
      ...options
    };
    
    // Atualizar o tema se necessário
    if (options.theme && this.container) {
      this.container.classList.remove('light', 'dark');
      this.container.classList.add(options.theme);
    }
    
    // Atualizar a posição se necessário
    if (options.position && this.container) {
      this.container.classList.remove(
        'top-right', 'top-left', 'bottom-right', 
        'bottom-left', 'top-center', 'bottom-center'
      );
      this.container.classList.add(options.position);
      
      // Resetar estilos de posição
      this.container.style.top = '';
      this.container.style.right = '';
      this.container.style.bottom = '';
      this.container.style.left = '';
      this.container.style.transform = '';
      
      // Aplicar novas posições
      switch (options.position) {
        case 'top-right':
          this.container.style.top = '20px';
          this.container.style.right = '20px';
          break;
        case 'top-left':
          this.container.style.top = '20px';
          this.container.style.left = '20px';
          break;
        case 'bottom-right':
          this.container.style.bottom = '20px';
          this.container.style.right = '20px';
          break;
        case 'bottom-left':
          this.container.style.bottom = '20px';
          this.container.style.left = '20px';
          break;
        case 'top-center':
          this.container.style.top = '20px';
          this.container.style.left = '50%';
          this.container.style.transform = 'translateX(-50%)';
          break;
        case 'bottom-center':
          this.container.style.bottom = '20px';
          this.container.style.left = '50%';
          this.container.style.transform = 'translateX(-50%)';
          break;
      }
    }
  }
}

// Criar instância global
const notificationManager = new NotificationManager();

// Exportar a instância, a classe e métodos de utilidade
export default notificationManager;
export { NotificationManager };

// Métodos de conveniência
export const notify = {
  success: (message, titleOrOptions) => notificationManager.success(message, titleOrOptions),
  error: (message, titleOrOptions) => notificationManager.error(message, titleOrOptions),
  warning: (message, titleOrOptions) => notificationManager.warning(message, titleOrOptions),
  info: (message, titleOrOptions) => notificationManager.info(message, titleOrOptions),
  custom: (options) => notificationManager.custom(options),
  confirm: (options) => notificationManager.confirm(options),
  closeAll: () => notificationManager.closeAll()
};