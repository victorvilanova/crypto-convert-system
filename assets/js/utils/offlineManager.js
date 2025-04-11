/**
 * offlineManager.js
 * Gerencia a detecção de conexão offline e seus efeitos na aplicação
 */

// DOM element
const offlineAlert = document.getElementById('offlineAlert');

/**
 * Configura a detecção de conexão offline/online
 */
function setupOfflineDetection() {
    // Check initial status
    updateOfflineStatus();
    
    // Add event listeners for online/offline events
    window.addEventListener('online', updateOfflineStatus);
    window.addEventListener('offline', updateOfflineStatus);
}

/**
 * Atualiza o status de conexão na interface
 */
function updateOfflineStatus() {
    if (navigator.onLine) {
        offlineAlert.style.display = 'none';
    } else {
        offlineAlert.style.display = 'block';
    }
}

export {
    setupOfflineDetection
};