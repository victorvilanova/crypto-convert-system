// Registrar o Service Worker para funcionalidades PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('Service Worker registrado com sucesso:', registration.scope);
        
        // Verificar atualizações do Service Worker
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // Existe uma nova versão disponível
              showUpdateNotification();
            }
          });
        });
      })
      .catch(error => {
        console.error('Falha ao registrar o Service Worker:', error);
      });
      
    // Verificar se existe uma atualização quando a página é recarregada
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      window.location.reload();
      refreshing = true;
    });
  });
  
  // Variável para rastrear recarregamento para evitar loops
  let refreshing = false;
  
  // Função para mostrar notificação de atualização
  function showUpdateNotification() {
    const notification = document.createElement('div');
    notification.className = 'update-notification';
    notification.innerHTML = `
      <div class="update-notification-content">
        <p>Uma nova versão está disponível!</p>
        <button id="update-button">Atualizar agora</button>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    document.getElementById('update-button').addEventListener('click', () => {
      // Forçar o service worker a se atualizar
      navigator.serviceWorker.getRegistration().then(reg => {
        reg.waiting.postMessage({ type: 'SKIP_WAITING' });
      });
      
      notification.remove();
    });
  }
  
  // Verificar suporte a Background Sync
  if ('SyncManager' in window) {
    // Registrar para sincronização quando estiver online novamente
    function registerSync() {
      navigator.serviceWorker.ready
        .then(registration => {
          return registration.sync.register('sync-pending-transactions');
        })
        .catch(error => {
          console.error('Falha ao registrar sync:', error);
        });
    }
    
    // Escutar eventos de reconexão
    window.addEventListener('online', registerSync);
  }
  
  // Verificar suporte a notificações push
  if ('Notification' in window && 'PushManager' in window) {
    // Função para solicitar permissão de notificações
    function requestNotificationPermission() {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          console.log('Permissão de notificação concedida');
          // Aqui você poderia se inscrever em um serviço de push
        }
      });
    }
    
    // Botão para solicitar permissão de notificações
    const notificationButton = document.getElementById('enable-notifications');
    if (notificationButton) {
      notificationButton.addEventListener('click', requestNotificationPermission);
    }
  }
}

// Adicionar a lógica para instalar a PWA
let deferredPrompt;

// Capturar o evento beforeinstallprompt
window.addEventListener('beforeinstallprompt', (e) => {
  // Impedir que o Chrome mostre o prompt automaticamente
  e.preventDefault();
  // Armazenar o evento para usar mais tarde
  deferredPrompt = e;
  // Mostrar o botão de instalação
  showInstallButton();
});

// Mostrar o botão de instalação da PWA
function showInstallButton() {
  const installButton = document.getElementById('install-app');
  
  if (installButton) {
    installButton.style.display = 'block';
    
    installButton.addEventListener('click', () => {
      // Mostrar o prompt de instalação
      deferredPrompt.prompt();
      
      // Aguardar a escolha do usuário
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('Usuário aceitou instalar o app');
        } else {
          console.log('Usuário recusou instalar o app');
        }
        
        // Limpar o prompt salvo
        deferredPrompt = null;
        
        // Esconder o botão
        installButton.style.display = 'none';
      });
    });
  }
}

// Verificar se a app já está instalada
window.addEventListener('appinstalled', () => {
  // Esconder o botão de instalação
  const installButton = document.getElementById('install-app');
  if (installButton) {
    installButton.style.display = 'none';
  }
  
  // Limpar o prompt salvo
  deferredPrompt = null;
  
  console.log('Aplicativo instalado com sucesso');
});