/**
 * Serviço de notificação para exibir mensagens ao usuário
 */

class NotificationManager {
  constructor() {
    this.listeners = [];
    this.container = null;
    this.notificationIdCounter = 0;
    this.defaultDuration = 5000; // 5 segundos
    
    // Inicializa o container de notificações se o DOM estiver disponível
    if (typeof document !== 'undefined') {
      this.initContainer();
    }
  }
  
  /**
   * Inicializa o container de notificações
   */
  initContainer() {
    if (this.container) return;
    
    this.container = document.createElement('div');
    this.container.className = 'notification-container';
    this.container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-width: 350px;
    `;
    
    document.body.appendChild(this.container);
  }
  
  /**
   * Método genérico para criar notificações
   * @param {string} message - Mensagem a ser exibida
   * @param {string} title - Título da notificação
   * @param {string} type - Tipo de notificação (success, error, warning, info)
   * @param {number} duration - Duração em milissegundos
   */
  notify(message, title = '', type = 'info', duration = this.defaultDuration) {
    // Verifica se o DOM está disponível
    if (typeof document === 'undefined') {
      console.log(`${type.toUpperCase()}: ${title} - ${message}`);
      return;
    }
    
    // Garante que o container exista
    if (!this.container) {
      this.initContainer();
    }
    
    // Cria ID único para a notificação
    const id = this.notificationIdCounter++;
    
    // Cria elemento de notificação
    const notification = document.createElement('div');
    notification.id = `notification-${id}`;
    notification.className = `notification ${type}`;
    notification.style.cssText = `
      background-color: white;
      border-radius: 4px;
      box-shadow: 0 3px 10px rgba(0, 0, 0, 0.15);
      padding: 12px 15px;
      animation: slide-in 0.3s ease-out forwards;
      overflow: hidden;
      position: relative;
    `;
    
    // Adiciona barra de cor lateral baseada no tipo
    const colorMap = {
      success: '#2ecc71',
      error: '#e74c3c',
      warning: '#f39c12',
      info: '#3498db'
    };
    
    notification.style.borderLeft = `4px solid ${colorMap[type] || colorMap.info}`;
    
    // Conteúdo da notificação
    let titleHTML = '';
    if (title) {
      titleHTML = `<div style="font-weight: 600; margin-bottom: 5px;">${title}</div>`;
    }
    
    notification.innerHTML = `
      ${titleHTML}
      <div>${message}</div>
      <button class="close-btn" style="position: absolute; top: 8px; right: 8px; background: none; border: none; cursor: pointer; font-size: 16px; opacity: 0.5;">&times;</button>
      <div class="progress" style="position: absolute; bottom: 0; left: 0; height: 3px; background-color: ${colorMap[type] || colorMap.info}; width: 100%; transform-origin: left; animation: shrink ${duration/1000}s linear forwards;"></div>
    `;
    
    // Adiciona estilo para animações
    if (!document.getElementById('notification-styles')) {
      const style = document.createElement('style');
      style.id = 'notification-styles';
      style.textContent = `
        @keyframes slide-in {
          from { transform: translateX(120%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slide-out {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(120%); opacity: 0; }
        }
        @keyframes shrink {
          from { transform: scaleX(1); }
          to { transform: scaleX(0); }
        }
      `;
      document.head.appendChild(style);
    }
    
    // Adiciona ao container
    this.container.appendChild(notification);
    
    // Configurar fechamento automático
    const removeNotification = () => {
      notification.style.animation = 'slide-out 0.3s ease-in forwards';
      setTimeout(() => {
        if (notification.parentNode === this.container) {
          this.container.removeChild(notification);
        }
      }, 300);
    };
    
    // Botão de fechar
    const closeBtn = notification.querySelector('.close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        removeNotification();
      });
    }
    
    // Remover após duração especificada
    if (duration > 0) {
      setTimeout(removeNotification, duration);
    }
    
    // Notificar listeners
    this.notifyListeners({
      id,
      message,
      title,
      type,
      timestamp: new Date()
    });
    
    return id;
  }
  
  /**
   * Notificação de sucesso
   * @param {string} message - Mensagem a ser exibida
   * @param {string} title - Título da notificação
   * @param {number} duration - Duração em milissegundos
   */
  success(message, title = 'Sucesso', duration = this.defaultDuration) {
    return this.notify(message, title, 'success', duration);
  }
  
  /**
   * Notificação de erro
   * @param {string} message - Mensagem a ser exibida
   * @param {string} title - Título da notificação
   * @param {number} duration - Duração em milissegundos
   */
  error(message, title = 'Erro', duration = this.defaultDuration) {
    return this.notify(message, title, 'error', duration);
  }
  
  /**
   * Notificação de aviso
   * @param {string} message - Mensagem a ser exibida
   * @param {string} title - Título da notificação
   * @param {number} duration - Duração em milissegundos
   */
  warning(message, title = 'Aviso', duration = this.defaultDuration) {
    return this.notify(message, title, 'warning', duration);
  }
  
  /**
   * Notificação informativa
   * @param {string} message - Mensagem a ser exibida
   * @param {string} title - Título da notificação
   * @param {number} duration - Duração em milissegundos
   */
  info(message, title = 'Informação', duration = this.defaultDuration) {
    return this.notify(message, title, 'info', duration);
  }
  
  /**
   * Adiciona um listener para novas notificações
   * @param {Function} callback - Função callback
   */
  addListener(callback) {
    if (typeof callback === 'function') {
      this.listeners.push(callback);
    }
  }
  
  /**
   * Remove um listener
   * @param {Function} callback - Função callback a ser removida
   */
  removeListener(callback) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }
  
  /**
   * Notifica todos os listeners
   * @param {Object} notification - Objeto de notificação
   */
  notifyListeners(notification) {
    this.listeners.forEach(listener => {
      try {
        listener(notification);
      } catch (error) {
        console.error('Erro ao notificar listener:', error);
      }
    });
  }
  
  /**
   * Remove uma notificação pelo ID
   * @param {number} id - ID da notificação
   */
  remove(id) {
    const notification = document.getElementById(`notification-${id}`);
    if (notification) {
      notification.style.animation = 'slide-out 0.3s ease-in forwards';
      setTimeout(() => {
        if (notification.parentNode === this.container) {
          this.container.removeChild(notification);
        }
      }, 300);
    }
  }
  
  /**
   * Remove todas as notificações
   */
  clearAll() {
    if (this.container) {
      const notifications = this.container.querySelectorAll('.notification');
      notifications.forEach(notification => {
        notification.style.animation = 'slide-out 0.3s ease-in forwards';
      });
      
      setTimeout(() => {
        this.container.innerHTML = '';
      }, 300);
    }
  }
}

// Criar instância singleton
export const notificationManager = new NotificationManager();

// Exportar classe e instância
export default notificationManager;