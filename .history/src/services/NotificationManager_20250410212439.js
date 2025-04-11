/**
 * Sistema de Notificações para a aplicação
 * Gerencia notificações, toasts e alertas
 */

// Tipos de notificações suportados
const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};

// Configurações padrão
const DEFAULT_CONFIG = {
  position: 'top-right', // top-right, top-left, bottom-right, bottom-left, top-center, bottom-center
  duration: 5000, // duração em ms
  maxCount: 5, // número máximo de notificações exibidas simultaneamente
  container: null, // container personalizado (opcional)
  animation: true, // usar animação
  closeButton: true, // incluir botão de fechar
  pauseOnHover: true // pausar contagem de tempo ao passar o mouse
};

/**
 * Gerenciador de Notificações
 */
export class NotificationManager {
  /**
   * @param {Object} config - Configurações para o gerenciador
   */
  constructor(config = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.notifications = [];
    this.container = null;
    this.initialized = false;
  }

  /**
   * Inicializa o sistema de notificações
   */
  init() {
    if (this.initialized) return;

    // Usar um container personalizado ou criar um novo
    if (this.config.container && document.querySelector(this.config.container)) {
      this.container = document.querySelector(this.config.container);
    } else {
      this.container = this._createContainer();
      document.body.appendChild(this.container);
    }

    this.initialized = true;
  }

  /**
   * Cria o container para as notificações
   * @private
   * @returns {HTMLElement} - Elemento do container
   */
  _createContainer() {
    const container = document.createElement('div');
    container.className = `notification-container ${this.config.position}`;
    
    // Estilos para o container
    const style = document.createElement('style');
    style.textContent = `
      .notification-container {
        position: fixed;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        gap: 10px;
        max-width: 320px;
        font-family: var(--font-main, sans-serif);
      }
      
      .notification-container.top-right {
        top: 20px;
        right: 20px;
      }
      
      .notification-container.top-left {
        top: 20px;
        left: 20px;
      }
      
      .notification-container.bottom-right {
        bottom: 20px;
        right: 20px;
      }
      
      .notification-container.bottom-left {
        bottom: 20px;
        left: 20px;
      }
      
      .notification-container.top-center {
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
      }
      
      .notification-container.bottom-center {
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
      }
      
      .notification {
        position: relative;
        padding: 12px 16px;
        border-radius: 6px;
        background-color: var(--bg-card, #fff);
        box-shadow: 0 3px 6px rgba(0, 0, 0, 0.16);
        transform-origin: top center;
        animation: notification-in 0.3s ease-out forwards;
        display: flex;
        align-items: flex-start;
        width: 100%;
        min-width: 280px;
        box-sizing: border-box;
        border-left: 4px solid transparent;
      }
      
      .notification.notification-out {
        animation: notification-out 0.2s ease-in forwards;
      }
      
      .notification-icon {
        margin-right: 12px;
        flex-shrink: 0;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .notification-content {
        flex-grow: 1;
      }
      
      .notification-title {
        font-weight: 600;
        font-size: 14px;
        margin: 0 0 4px 0;
      }
      
      .notification-message {
        font-size: 13px;
        margin: 0;
        line-height: 1.4;
        color: var(--text-secondary, #555);
      }
      
      .notification-close {
        position: absolute;
        top: 10px;
        right: 10px;
        border: none;
        background: none;
        cursor: pointer;
        color: var(--text-muted, #888);
        width: 20px;
        height: 20px;
        padding: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        font-size: 16px;
        line-height: 1;
      }
      
      .notification-close:hover {
        background-color: rgba(0, 0, 0, 0.05);
      }
      
      .notification-progress {
        position: absolute;
        bottom: 0;
        left: 0;
        height: 3px;
        width: 100%;
        background-color: rgba(0, 0, 0, 0.05);
        overflow: hidden;
        border-radius: 0 0 6px 6px;
      }
      
      .notification-progress-inner {
        height: 100%;
        width: 100%;
        transform-origin: left center;
        transition: transform linear;
        transform: translateX(-100%);
      }
      
      /* Estilos para cada tipo de notificação */
      .notification-success {
        border-left-color: var(--success, #4caf50);
      }
      
      .notification-success .notification-icon {
        color: var(--success, #4caf50);
      }
      
      .notification-success .notification-progress-inner {
        background-color: var(--success, #4caf50);
      }
      
      .notification-error {
        border-left-color: var(--danger, #f44336);
      }
      
      .notification-error .notification-icon {
        color: var(--danger, #f44336);
      }
      
      .notification-error .notification-progress-inner {
        background-color: var(--danger, #f44336);
      }
      
      .notification-warning {
        border-left-color: var(--warning, #ff9800);
      }
      
      .notification-warning .notification-icon {
        color: var(--warning, #ff9800);
      }
      
      .notification-warning .notification-progress-inner {
        background-color: var(--warning, #ff9800);
      }
      
      .notification-info {
        border-left-color: var(--info, #2196f3);
      }
      
      .notification-info .notification-icon {
        color: var(--info, #2196f3);
      }
      
      .notification-info .notification-progress-inner {
        background-color: var(--info, #2196f3);
      }
      
      /* Animações */
      @keyframes notification-in {
        from {
          opacity: 0;
          transform: translateY(-20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      @keyframes notification-out {
        from {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
        to {
          opacity: 0;
          transform: translateY(-20px) scale(0.9);
        }
      }
    `;
    
    document.head.appendChild(style);
    return container;
  }

  /**
   * Cria uma notificação DOM
   * @private
   * @param {Object} notificationData - Dados da notificação
   * @returns {HTMLElement} - Elemento da notificação
   */
  _createNotificationElement(notificationData) {
    const { id, type, title, message, duration } = notificationData;
    
    // Criar elemento principal
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.setAttribute('role', 'alert');
    notification.id = `notification-${id}`;
    
    // Ícone baseado no tipo
    const icons = {
      success: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>',
      error: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>',
      warning: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
      info: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>'
    };
    
    // Estrutura interna
    notification.innerHTML = `
      <div class="notification-icon">
        ${icons[type] || icons.info}
      </div>
      <div class="notification-content">
        ${title ? `<h4 class="notification-title">${title}</h4>` : ''}
        <p class="notification-message">${message}</p>
      </div>
      ${this.config.closeButton ? `
        <button class="notification-close" aria-label="Fechar notificação">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      ` : ''}
      ${duration > 0 ? `
        <div class="notification-progress">
          <div class="notification-progress-inner"></div>
        </div>
      ` : ''}
    `;
    
    // Configurar barra de progresso
    if (duration > 0) {
      const progressBar = notification.querySelector('.notification-progress-inner');
      progressBar.style.transition = `transform linear ${duration}ms`;
      
      // Temporizar para iniciar a animação (para que a transição funcione)
      setTimeout(() => {
        progressBar.style.transform = 'translateX(0)';
      }, 10);
    }
    
    // Evento de clique no botão de fechar
    if (this.config.closeButton) {
      const closeButton = notification.querySelector('.notification-close');
      closeButton.addEventListener('click', () => {
        this.dismiss(id);
      });
    }
    
    // Comportamento de pausa ao hover
    if (this.config.pauseOnHover && duration > 0) {
      let remainingTime = duration;
      let startTime;
      let timeoutId;
      
      const pauseAnimation = () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        
        if (startTime) {
          remainingTime -= (Date.now() - startTime);
        }
        
        const progressBar = notification.querySelector('.notification-progress-inner');
        if (progressBar) {
          const computedStyle = getComputedStyle(progressBar);
          const transform = computedStyle.getPropertyValue('transform');
          progressBar.style.transition = 'none';
          progressBar.style.transform = transform;
        }
      };
      
      const resumeAnimation = () => {
        if (remainingTime <= 0) return;
        
        startTime = Date.now();
        
        const progressBar = notification.querySelector('.notification-progress-inner');
        if (progressBar) {
          progressBar.style.transition = `transform linear ${remainingTime}ms`;
          progressBar.style.transform = 'translateX(0)';
        }
        
        timeoutId = setTimeout(() => {
          this.dismiss(id);
        }, remainingTime);
      };
      
      notification.addEventListener('mouseenter', pauseAnimation);
      notification.addEventListener('mouseleave', resumeAnimation);
      
      // Iniciar a contagem
      startTime = Date.now();
      timeoutId = setTimeout(() => {
        this.dismiss(id);
      }, duration);
    } else if (duration > 0) {
      // Se não pausar no hover, simplesmente configurar o timeout
      setTimeout(() => {
        this.dismiss(id);
      }, duration);
    }
    
    return notification;
  }

  /**
   * Exibe uma notificação de sucesso
   * @param {string} message - Mensagem da notificação
   * @param {string} title - Título opcional
   * @param {Object} options - Opções adicionais
   * @returns {string} - ID da notificação
   */
  success(message, title = '', options = {}) {
    return this.show({
      type: NOTIFICATION_TYPES.SUCCESS,
      message,
      title,
      ...options
    });
  }

  /**
   * Exibe uma notificação de erro
   * @param {string} message - Mensagem da notificação
   * @param {string} title - Título opcional
   * @param {Object} options - Opções adicionais
   * @returns {string} - ID da notificação
   */
  error(message, title = '', options = {}) {
    return this.show({
      type: NOTIFICATION_TYPES.ERROR,
      message,
      title,
      ...options
    });
  }

  /**
   * Exibe uma notificação de aviso
   * @param {string} message - Mensagem da notificação
   * @param {string} title - Título opcional
   * @param {Object} options - Opções adicionais
   * @returns {string} - ID da notificação
   */
  warning(message, title = '', options = {}) {
    return this.show({
      type: NOTIFICATION_TYPES.WARNING,
      message,
      title,
      ...options
    });
  }

  /**
   * Exibe uma notificação informativa
   * @param {string} message - Mensagem da notificação
   * @param {string} title - Título opcional
   * @param {Object} options - Opções adicionais
   * @returns {string} - ID da notificação
   */
  info(message, title = '', options = {}) {
    return this.show({
      type: NOTIFICATION_TYPES.INFO,
      message,
      title,
      ...options
    });
  }

  /**
   * Exibe qualquer tipo de notificação
   * @param {Object} options - Opções da notificação
   * @returns {string} - ID da notificação
   */
  show(options) {
    if (!this.initialized) {
      this.init();
    }
    
    const id = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    
    const notificationData = {
      id,
      type: options.type || NOTIFICATION_TYPES.INFO,
      title: options.title || '',
      message: options.message || '',
      duration: options.duration !== undefined ? options.duration : this.config.duration
    };
    
    // Adicionar à lista
    this.notifications.push(notificationData);
    
    // Limitar quantidade de notificações
    if (this.config.maxCount > 0 && this.notifications.length > this.config.maxCount) {
      const oldest = this.notifications.shift();
      const oldestElement = document.getElementById(`notification-${oldest.id}`);
      if (oldestElement) {
        oldestElement.remove();
      }
    }
    
    // Criar elemento DOM
    const notificationElement = this._createNotificationElement(notificationData);
    
    // Adicionar ao container
    this.container.appendChild(notificationElement);
    
    return id;
  }

  /**
   * Remove uma notificação específica
   * @param {string} id - ID da notificação
   */
  dismiss(id) {
    const notificationElement = document.getElementById(`notification-${id}`);
    
    if (notificationElement) {
      // Adicionar classe para animação de saída
      notificationElement.classList.add('notification-out');
      
      // Remover após a animação
      setTimeout(() => {
        notificationElement.remove();
        
        // Remover da lista
        this.notifications = this.notifications.filter(n => n.id !== id);
      }, 200); // Tempo da animação
    }
  }

  /**
   * Remove todas as notificações
   */
  dismissAll() {
    // Copia os IDs porque vamos modificar o array original
    const ids = this.notifications.map(n => n.id);
    
    // Remove cada notificação
    ids.forEach(id => {
      this.dismiss(id);
    });
  }
}

// Instância padrão do gerenciador
export const notificationManager = new NotificationManager();

// Métodos de conveniência no objeto exportado
export default {
  success: (message, title, options) => notificationManager.success(message, title, options),
  error: (message, title, options) => notificationManager.error(message, title, options),
  warning: (message, title, options) => notificationManager.warning(message, title, options),
  info: (message, title, options) => notificationManager.info(message, title, options),
  show: (options) => notificationManager.show(options),
  dismiss: (id) => notificationManager.dismiss(id),
  dismissAll: () => notificationManager.dismissAll()
};