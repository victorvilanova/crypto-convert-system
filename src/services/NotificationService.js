/**
 * Sistema de notificações para a aplicação
 */
export class NotificationService {
  /**
   * @param {Object} options - Opções de configuração
   * @param {number} options.defaultDuration - Duração padrão das notificações em ms
   * @param {string} options.containerSelector - Seletor CSS do container de notificações
   */
  constructor(options = {}) {
    const {
      defaultDuration = 5000,
      containerSelector = '#notification-container',
    } = options;

    this.defaultDuration = defaultDuration;
    this.containerSelector = containerSelector;
    this.notifications = [];
    this.nextId = 1;

    // Inicializar o container de notificações
    this.initialize();
  }

  /**
   * Inicializa o sistema de notificações
   */
  initialize() {
    let container = document.querySelector(this.containerSelector);

    // Se o container não existir, criar
    if (!container) {
      container = document.createElement('div');
      container.id = this.containerSelector.replace('#', '');
      container.className = 'notification-container';
      document.body.appendChild(container);

      // Aplicar estilos básicos
      container.style.position = 'fixed';
      container.style.top = '20px';
      container.style.right = '20px';
      container.style.zIndex = '9999';
      container.style.display = 'flex';
      container.style.flexDirection = 'column';
      container.style.gap = '10px';
    }

    this.container = container;

    // Verificar e solicitar permissão para notificações do sistema
    this.checkNotificationPermission();
  }

  /**
   * Verifica se há permissão para enviar notificações do sistema
   */
  checkNotificationPermission() {
    this.systemNotificationsSupported = 'Notification' in window;

    if (
      this.systemNotificationsSupported &&
      Notification.permission === 'default'
    ) {
      // Armazenar a promessa de permissão para uso futuro
      this.permissionPromise = Notification.requestPermission();
    }
  }

  /**
   * Envia uma notificação de sucesso
   * @param {string} message - Mensagem a ser exibida
   * @param {Object} options - Opções da notificação
   * @returns {number} - ID da notificação
   */
  success(message, options = {}) {
    return this.notify(message, {
      ...options,
      type: 'success',
      icon: options.icon || 'fa-check-circle',
    });
  }

  /**
   * Envia uma notificação de erro
   * @param {string} message - Mensagem a ser exibida
   * @param {Object} options - Opções da notificação
   * @returns {number} - ID da notificação
   */
  error(message, options = {}) {
    return this.notify(message, {
      ...options,
      type: 'error',
      icon: options.icon || 'fa-exclamation-circle',
      duration: options.duration || 10000, // Erros ficam mais tempo
    });
  }

  /**
   * Envia uma notificação de alerta
   * @param {string} message - Mensagem a ser exibida
   * @param {Object} options - Opções da notificação
   * @returns {number} - ID da notificação
   */
  warning(message, options = {}) {
    return this.notify(message, {
      ...options,
      type: 'warning',
      icon: options.icon || 'fa-exclamation-triangle',
    });
  }

  /**
   * Envia uma notificação de informação
   * @param {string} message - Mensagem a ser exibida
   * @param {Object} options - Opções da notificação
   * @returns {number} - ID da notificação
   */
  info(message, options = {}) {
    return this.notify(message, {
      ...options,
      type: 'info',
      icon: options.icon || 'fa-info-circle',
    });
  }

  /**
   * Envia uma notificação genérica
   * @param {string} message - Mensagem a ser exibida
   * @param {Object} options - Opções da notificação
   * @returns {number} - ID da notificação
   */
  notify(message, options = {}) {
    if (!message) return null;

    const {
      type = 'info',
      duration = this.defaultDuration,
      icon = 'fa-bell',
      title = this._getTitleByType(type),
      useSystemNotification = false,
      onClick = null,
      showCloseButton = true,
    } = options;

    // Tentar enviar notificação do sistema se solicitado
    if (useSystemNotification && this.systemNotificationsSupported) {
      this._sendSystemNotification(title, message, options);
    }

    // Criar ID único para esta notificação
    const id = this.nextId++;

    // Criar elemento de notificação
    const notificationElement = this._createNotificationElement(id, message, {
      type,
      icon,
      title,
      showCloseButton,
      onClick,
    });

    // Adicionar ao container
    this.container.appendChild(notificationElement);

    // Adicionar à lista de notificações ativas
    this.notifications.push({
      id,
      element: notificationElement,
      timer: null,
    });

    // Configurar remoção automática após o tempo
    if (duration > 0) {
      const timer = setTimeout(() => {
        this.dismiss(id);
      }, duration);

      // Armazenar referência ao timer
      const notification = this.notifications.find((n) => n.id === id);
      if (notification) {
        notification.timer = timer;
      }
    }

    // Aplicar animação de entrada
    setTimeout(() => {
      notificationElement.style.opacity = '1';
      notificationElement.style.transform = 'translateX(0)';
    }, 10);

    return id;
  }

  /**
   * Remove uma notificação específica
   * @param {number} id - ID da notificação a ser removida
   */
  dismiss(id) {
    const notification = this.notifications.find((n) => n.id === id);
    if (!notification) return;

    // Limpar timer se existir
    if (notification.timer) {
      clearTimeout(notification.timer);
    }

    // Aplicar animação de saída
    notification.element.style.opacity = '0';
    notification.element.style.transform = 'translateX(100%)';

    // Remover após a animação
    setTimeout(() => {
      if (notification.element.parentNode) {
        notification.element.parentNode.removeChild(notification.element);
      }

      // Remover da lista
      this.notifications = this.notifications.filter((n) => n.id !== id);
    }, 300);
  }

  /**
   * Remove todas as notificações ativas
   */
  dismissAll() {
    // Copiar IDs para evitar problemas durante a iteração
    const ids = [...this.notifications].map((n) => n.id);
    ids.forEach((id) => this.dismiss(id));
  }

  /**
   * Envia uma notificação do sistema
   * @param {string} title - Título da notificação
   * @param {string} message - Mensagem da notificação
   * @param {Object} options - Opções adicionais
   * @private
   */
  async _sendSystemNotification(title, message, options = {}) {
    if (!this.systemNotificationsSupported) return;

    // Verificar permissão atual
    let permission = Notification.permission;

    // Se a permissão estiver pendente, aguardar resultado
    if (permission === 'default' && this.permissionPromise) {
      permission = await this.permissionPromise;
    }

    if (permission !== 'granted') return;

    // Criar notificação do sistema
    try {
      const notification = new Notification(title, {
        body: message,
        icon: options.systemIcon || '/favicon.ico',
      });

      // Adicionar manipulador de clique
      if (options.onClick) {
        notification.onclick = () => {
          window.focus();
          options.onClick();
        };
      }
    } catch (error) {
      console.error('Erro ao enviar notificação do sistema:', error);
    }
  }

  /**
   * Cria um elemento HTML para a notificação
   * @param {number} id - ID da notificação
   * @param {string} message - Mensagem da notificação
   * @param {Object} options - Opções de estilo
   * @returns {HTMLElement} - Elemento da notificação
   * @private
   */
  _createNotificationElement(id, message, options) {
    const { type, icon, title, showCloseButton, onClick } = options;

    // Criar elemento principal
    const element = document.createElement('div');
    element.className = `notification notification-${type}`;
    element.setAttribute('role', 'alert');
    element.id = `notification-${id}`;

    // Aplicar estilos
    Object.assign(element.style, {
      display: 'flex',
      alignItems: 'flex-start',
      padding: '12px 16px',
      borderRadius: '4px',
      boxShadow: '0 3px 6px rgba(0, 0, 0, 0.2)',
      marginBottom: '10px',
      transition: 'opacity 0.3s, transform 0.3s',
      opacity: '0',
      transform: 'translateX(100%)',
      cursor: onClick ? 'pointer' : 'default',
      maxWidth: '320px',
      position: 'relative',
    });

    // Aplicar cores baseadas no tipo
    const colors = {
      success: { bg: 'var(--success-color, #4caf50)', fg: 'white' },
      error: { bg: 'var(--error-color, #f44336)', fg: 'white' },
      warning: { bg: 'var(--warning-color, #ff9800)', fg: 'black' },
      info: { bg: 'var(--info-color, #2196f3)', fg: 'white' },
    };

    element.style.backgroundColor = colors[type]?.bg || colors.info.bg;
    element.style.color = colors[type]?.fg || colors.info.fg;

    // Adicionar ícone
    if (icon) {
      const iconElement = document.createElement('div');
      iconElement.className = 'notification-icon';
      iconElement.innerHTML = `<i class="fas ${icon}"></i>`;
      iconElement.style.marginRight = '12px';
      iconElement.style.fontSize = '24px';
      element.appendChild(iconElement);
    }

    // Adicionar conteúdo
    const contentElement = document.createElement('div');
    contentElement.className = 'notification-content';
    contentElement.style.flex = '1';

    // Adicionar título se fornecido
    if (title) {
      const titleElement = document.createElement('div');
      titleElement.className = 'notification-title';
      titleElement.textContent = title;
      titleElement.style.fontWeight = 'bold';
      titleElement.style.marginBottom = '4px';
      contentElement.appendChild(titleElement);
    }

    // Adicionar mensagem
    const messageElement = document.createElement('div');
    messageElement.className = 'notification-message';
    messageElement.textContent = message;
    contentElement.appendChild(messageElement);

    element.appendChild(contentElement);

    // Adicionar botão de fechar
    if (showCloseButton) {
      const closeButton = document.createElement('button');
      closeButton.className = 'notification-close';
      closeButton.innerHTML = '&times;';
      closeButton.setAttribute('aria-label', 'Fechar notificação');

      Object.assign(closeButton.style, {
        background: 'transparent',
        border: 'none',
        color: 'inherit',
        fontSize: '20px',
        cursor: 'pointer',
        opacity: '0.7',
        transition: 'opacity 0.2s',
        padding: '0 5px',
        marginLeft: '10px',
      });

      closeButton.addEventListener('mouseover', () => {
        closeButton.style.opacity = '1';
      });

      closeButton.addEventListener('mouseout', () => {
        closeButton.style.opacity = '0.7';
      });

      closeButton.addEventListener('click', (e) => {
        e.stopPropagation();
        this.dismiss(id);
      });

      element.appendChild(closeButton);
    }

    // Adicionar manipulador de clique
    if (onClick) {
      element.addEventListener('click', () => onClick(id));
    }

    return element;
  }

  /**
   * Obtém o título adequado com base no tipo de notificação
   * @param {string} type - Tipo de notificação
   * @returns {string} - Título padrão
   * @private
   */
  _getTitleByType(type) {
    const titles = {
      success: 'Sucesso',
      error: 'Erro',
      warning: 'Atenção',
      info: 'Informação',
    };

    return titles[type] || titles.info;
  }
}
