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
    updateInterval = setInterval(
      fetchCurrentRates,
      CONFIG.refreshRatesInterval * 1000
    );

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
    // Ativar indicador de carregamento
    const loader = document.getElementById('rates-loader');
    if (loader) loader.classList.add('active');

    // Verificar se devemos usar dados simulados ou reais
    let rates;

    if (CONFIG.environment === 'development' && CONFIG.useMockRates) {
      // Dados simulados para desenvolvimento
      rates = await getMockRates();
    } else {
      // Dados reais da API
      rates = await getRealRates();
    }

    // Armazenar taxas e atualizar hora
    currentRates = rates;
    lastUpdateTimestamp = new Date();

    // Atualizar interface
    updateRatesDisplay(rates);

    // Desativar indicador de carregamento
    if (loader) loader.classList.remove('active');

    if (CONFIG.debugMode) {
      console.log('FastCripto: Taxas atualizadas', rates);
    }

    return rates;
  } catch (error) {
    console.error('Erro ao obter cotações:', error);

    const loader = document.getElementById('rates-loader');
    if (loader) loader.classList.remove('active');

    // Exibir alerta para o usuário
    if (window.showInAppNotification) {
      window.showInAppNotification(
        'Erro ao obter taxas de conversão. Por favor, tente novamente.',
        'error'
      );
    }

    // Utilizar taxas em cache se disponíveis
    if (Object.keys(currentRates).length > 0) {
      console.warn('Usando taxas em cache devido a erro na API.');
      return currentRates;
    }

    // Caso contrário, retornar taxas padrão
    console.warn('Usando taxas padrão como fallback.');
    return getDefaultRates();
  }
}

// Obter taxas simuladas para ambiente de desenvolvimento
async function getMockRates() {
  // Simular um atraso de rede
  await new Promise((resolve) => setTimeout(resolve, 800));

  // Retornar valores simulados
  return {
    BTC: 254871.35,
    ETH: 14875.22,
    USDT: 5.04,
  };
}

// Obter taxas reais da API
async function getRealRates() {
  try {
    const response = await fetch(CONFIG.apiEndpoints.rates);

    if (!response.ok) {
      throw new Error(`API respondeu com status ${response.status}`);
    }

    const data = await response.json();

    // Mapear resposta da API para o formato esperado pelo sistema
    // Corrigindo o problema de mapeamento - A API CoinGecko retorna dados em formato diferente
    const mappedRates = {
      BTC: data.bitcoin?.brl || CONFIG.initialRates.BTC,
      ETH: data.ethereum?.brl || CONFIG.initialRates.ETH,
      USDT: data.tether?.brl || CONFIG.initialRates.USDT,
    };

    // Validar que as taxas são números válidos
    Object.keys(mappedRates).forEach((key) => {
      if (isNaN(mappedRates[key]) || mappedRates[key] <= 0) {
        console.warn(`Taxa inválida para ${key}, usando valor padrão`);
        mappedRates[key] = CONFIG.initialRates[key];
      }
    });

    return mappedRates;
  } catch (error) {
    console.error('Erro ao obter taxas da API:', error);
    throw error;
  }
}

// Obter taxas padrão (fallback em caso de erro)
function getDefaultRates() {
  return { ...CONFIG.initialRates };
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
    lastUpdateElement.textContent = `Última atualização: ${formatDateTime(
      lastUpdateTimestamp
    )}`;
  }
}

// Configurar eventos relacionados às cotações
function setupRatesEvents() {
  const refreshButton = document.getElementById('manual-refresh');
  if (refreshButton) {
    refreshButton.addEventListener('click', async function () {
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
  if (!currency || !currentRates[currency]) {
    console.warn(`FastCripto: Taxa não encontrada para ${currency}`);
    return CONFIG.initialRates[currency] || null;
  }
  return currentRates[currency];
}

// Funções utilitárias
function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
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
    minute: '2-digit',
  }).format(date);
}

// Exportar globalmente as funções úteis
if (typeof window !== 'undefined') {
  window.fetchCurrentRates = fetchCurrentRates;
  window.getRateForCurrency = getRateForCurrency;
}
