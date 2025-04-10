/**
 * FastCripto - Módulo de Cotações
 * Responsável por obter e gerenciar as cotações de criptomoedas
 */

import { CONFIG } from '../config.js';
import { showInAppNotification } from './notifications.js';

// Variáveis do módulo
let currentRates = {};
let lastUpdateTimestamp = null;
let updateInterval = null;

// Inicialização do módulo
export async function initializeRatesModule() {
  try {
    // Carregar cotações iniciais
    currentRates = { ...CONFIG.initialRates };
    
    // Atualizar a interface com as cotações iniciais
    updateRatesDisplay(currentRates);
    
    // Buscar cotações atualizadas
    await fetchCurrentRates();
    
    // Configurar atualização automática
    if (updateInterval) clearInterval(updateInterval);
    updateInterval = setInterval(fetchCurrentRates, CONFIG.refreshRatesInterval * 1000);
    
    // Adicionar eventos aos elementos da interface
    setupRatesEvents();
    
    return true;
  } catch (error) {
    console.error('Erro ao inicializar módulo de cotações:', error);
    return false;
  }
}

// Buscar cotações atualizadas da API
export async function fetchCurrentRates() {
  try {
    showLoadingState(true);
    
    // Em ambiente de produção, chamar a API real
    if (CONFIG.environment === 'production') {
      const response = await fetch(CONFIG.apiEndpoints.rates);
      if (!response.ok) throw new Error('Falha na resposta da API');
      
      const data = await response.json();
      
      // Mapear os dados da resposta para o formato esperado
      // A API do CoinGecko retorna no formato: { bitcoin: { brl: 254871.35 }, ... }
      currentRates = {
        BTC: data.bitcoin?.brl || currentRates.BTC,
        ETH: data.ethereum?.brl || currentRates.ETH,
        USDT: data.tether?.brl || currentRates.USDT
      };
    } else {
      // Para desenvolvimento, simular variação aleatória de até 1%
      Object.keys(currentRates).forEach(crypto => {
        const variation = (Math.random() * 2 - 1) * 0.01;
        currentRates[crypto] = currentRates[crypto] * (1 + variation);
      });
      
      // Simular atraso de rede em ambiente de desenvolvimento
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Atualizar timestamp
    lastUpdateTimestamp = new Date();
    
    // Atualizar a interface
    updateRatesDisplay(currentRates);
    
    // Atualizar a referência global
    window.cryptoRates = currentRates;
    
    showLoadingState(false);
    return currentRates;
  } catch (error) {
    console.error('Erro ao buscar cotações:', error);
    showLoadingState(false);
    
    // Mostrar mensagem de erro se a notificação estiver disponível
    if (typeof showInAppNotification === 'function') {
      showInAppNotification('Erro ao atualizar cotações. Usando valores de fallback.', 'error');
    }
    
    throw error;
  }
}

// Atualizar a interface com as cotações
function updateRatesDisplay(rates) {
  const btcRate = document.getElementById('btc-rate');
  const ethRate = document.getElementById('eth-rate');
  const usdtRate = document.getElementById('usdt-rate');
  const lastUpdateElement = document.getElementById('last-update-time');
  
  if (btcRate) btcRate.textContent = formatCurrency(rates.BTC);
  if (ethRate) ethRate.textContent = formatCurrency(rates.ETH);
  if (usdtRate) usdtRate.textContent = formatCurrency(rates.USDT);
  
  if (lastUpdateElement && lastUpdateTimestamp) {
    lastUpdateElement.textContent = `Última atualização: ${formatDateTime(lastUpdateTimestamp)}`;
  }
}

// Configurar eventos relacionados às cotações
function setupRatesEvents() {
  const refreshButton = document.getElementById('manual-refresh');
  if (refreshButton) {
    refreshButton.addEventListener('click', async function() {
      try {
        await fetchCurrentRates();
        
        // Mostrar confirmação ao usuário
        if (typeof showInAppNotification === 'function') {
          showInAppNotification('Cotações atualizadas com sucesso!', 'success');
        }
      } catch (error) {
        console.error('Erro ao atualizar cotações manualmente:', error);
      }
    });
  }
}

// Mostrar ou esconder o estado de carregamento
function showLoadingState(isLoading) {
  const loader = document.getElementById('rates-loader');
  if (loader) {
    if (isLoading) {
      loader.classList.add('active');
    } else {
      loader.classList.remove('active');
    }
  }
}

// Obter cotação para uma moeda específica
export function getRateForCurrency(currency) {
  return currentRates[currency] || null;
}

// Funções utilitárias
function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { 
    style: 'currency', 
    currency: 'BRL' 
  }).format(value);
}

function formatDateTime(date) {
  if (!(date instanceof Date)) {
    date = new Date(date);
  }
  
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

// Exportar globalmente as funções úteis
if (typeof window !== 'undefined') {
  window.fetchCurrentRates = fetchCurrentRates;
  window.getRateForCurrency = getRateForCurrency;
}
