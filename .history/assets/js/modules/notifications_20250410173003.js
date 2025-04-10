/**
 * FastCripto - Módulo de Notificações
 * Gerencia todas as notificações por email e dentro da plataforma
 */

// Variáveis do módulo
let notificationSettings = {};

// Inicialização do módulo
function initializeNotificationsModule() {
  loadNotificationSettings();
  setupNotificationListeners();

  if (CONFIG.debugMode) {
    console.log('FastCripto: Módulo de notificações inicializado');
  }
}

// Carrega as configurações de notificação do usuário
function loadNotificationSettings() {
  // Em produção, isso seria carregado do perfil do usuário no backend
  notificationSettings = {
    email: {
      transactionConfirmation: true,
      kycStatusUpdates: true,
      securityAlerts: true,
      marketingUpdates: false,
    },
    inApp: {
      transactionUpdates: true,
      rateAlerts: true,
      securityAlerts: true,
    },
  };
}

// Envia uma notificação de transação
async function sendTransactionNotification(transaction, type) {
  if (!notificationSettings.email.transactionConfirmation) return;

  try {
    if (CONFIG.mockApiResponses) {
      console.log(
        `FastCripto: Simulando envio de email - ${type} da transação ${transaction.id}`
      );
      return true;
    }

    // Em produção, isso faria uma chamada para o backend
    const response = await fetch(`${CONFIG.apiBaseUrl}/notifications/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'transaction',
        subType: type,
        transactionId: transaction.id,
        userEmail: 'usuario@teste.com', // Em produção, isso viria do usuário logado
        data: {
          amount: transaction.amount,
          currency: transaction.currency,
          status: transaction.status,
        },
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('FastCripto: Erro ao enviar notificação:', error);
    return false;
  }
}

// Criar um container para notificações se não existir
function ensureNotificationsContainer() {
  let container = document.getElementById('notifications-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'notifications-container';
    document.body.appendChild(container);
  }
  return container;
}

// Função principal para exibir notificações
export function showInAppNotification(message, type = 'info', duration = 5000) {
  const container = ensureNotificationsContainer();
  
  // Criar elemento de notificação
  const notification = document.createElement('div');
  notification.className = `in-app-notification notification-${type}`;
  
  // Determinar o ícone baseado no tipo
  let icon = '';
  switch(type) {
    case 'success':
      icon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>';
      break;
    case 'error':
      icon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>';
      break;
    case 'warning':
      icon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>';
      break;
    default: // info
      icon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
  }
  
  // Estrutura da notificação
  notification.innerHTML = `
    <div class="notification-icon">${icon}</div>
    <div class="notification-content">${message}</div>
    <div class="notification-close">&times;</div>
  `;
  
  // Adicionar ao container
  container.appendChild(notification);
  
  // Configurar o botão de fechar
  const closeButton = notification.querySelector('.notification-close');
  closeButton.addEventListener('click', () => {
    hideNotification(notification);
  });
  
  // Auto-esconder após o tempo definido
  if (duration > 0) {
    setTimeout(() => {
      hideNotification(notification);
    }, duration);
  }
  
  return notification;
}

// Função para esconder a notificação com animação
function hideNotification(notification) {
  notification.classList.add('notification-hiding');
  
  // Remover após a animação completar
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 300);
}

// Exibe uma notificação no aplicativo
function showInAppNotification(message, type = 'info', duration = 5000) {
  const notificationsContainer = document.getElementById(
    'notifications-container'
  );

  // Criar o elemento de notificação
  const notification = document.createElement('div');
  notification.className = `in-app-notification notification-${type}`;

  // Ícone para o tipo de notificação
  let icon = '';
  switch (type) {
    case 'success':
      icon =
        '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>';
      break;
    case 'warning':
      icon =
        '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>';
      break;
    case 'error':
      icon =
        '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>';
      break;
    default:
      icon =
        '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
  }

  notification.innerHTML = `
    <div class="notification-icon">${icon}</div>
    <div class="notification-content">${message}</div>
    <div class="notification-close">×</div>
  `;

  // Adicionar ao container
  notificationsContainer.appendChild(notification);

  // Configurar botão de fechar
  const closeButton = notification.querySelector('.notification-close');
  closeButton.addEventListener('click', () => {
    notification.classList.add('notification-hiding');
    setTimeout(() => {
      notification.remove();
    }, 300);
  });

  // Auto-remoção após o tempo definido
  setTimeout(() => {
    notification.classList.add('notification-hiding');
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, duration);
}

// Configurar listeners para eventos que precisam de notificações
function setupNotificationListeners() {
  // Exemplo: ouvir por mudanças no status de transações
  document.addEventListener('transactionStatusChanged', (event) => {
    const { transaction, oldStatus, newStatus } = event.detail;

    // Enviar email
    sendTransactionNotification(transaction, 'statusUpdate');

    // Mostrar notificação no app
    if (notificationSettings.inApp.transactionUpdates) {
      showInAppNotification(
        `Status da transação ${transaction.id} atualizado: ${newStatus}`,
        newStatus === 'Concluída' ? 'success' : 'info'
      );
    }
  });
}

// Exportar funções para uso global
window.showInAppNotification = showInAppNotification;
window.sendTransactionNotification = sendTransactionNotification;
