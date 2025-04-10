/**
 * FastCripto - Carregador de Módulos
 * Inicializa todos os módulos da aplicação de forma ordenada
 */

import { CONFIG } from '../config.js';
import { initializeRatesModule } from './rates.js';
import { initializeNotificationsModule } from './notifications.js';

// Função principal para inicializar módulos
export async function initializeModules() {
  try {
    console.log(`FastCripto: Inicializando módulos...`);

    // Primeiro inicializa notificações para disponibilizar o sistema de feedback
    await initializeNotificationsModule();
    console.log('FastCripto: Módulo de notificações inicializado');

    // Depois inicializa o módulo de taxas
    await initializeRatesModule();
    console.log('FastCripto: Módulo de taxas inicializado');

    // Módulos adicionais seriam inicializados aqui

    console.log('FastCripto: Todos os módulos inicializados com sucesso');
    return true;
  } catch (error) {
    console.error('FastCripto: Erro ao inicializar módulos:', error);

    // Exibir notificação de erro se o módulo de notificações estiver funcionando
    if (window.showInAppNotification) {
      window.showInAppNotification(
        'Erro ao inicializar a aplicação. Algumas funcionalidades podem estar indisponíveis.',
        'error'
      );
    }

    return false;
  }
}

// Exportar funções específicas dos módulos para acesso global
export { showInAppNotification } from './notifications.js';
export { getRateForCurrency } from './rates.js';

// Registro global de eventos da aplicação
export function dispatchAppEvent(eventName, detail) {
  const event = new CustomEvent(eventName, { detail });
  document.dispatchEvent(event);

  if (CONFIG.debugMode) {
    console.log(`FastCripto: Evento '${eventName}' disparado`, detail);
  }
}

// Exportar funções globalmente
if (typeof window !== 'undefined') {
  window.initializeModules = initializeModules;
  window.dispatchAppEvent = dispatchAppEvent;
}
