/**
 * FastCripto - Módulo de Taxas
 * Responsável pela obtenção e gerenciamento de taxas de criptomoedas
 */

// Variáveis do módulo
let currentRates = {};
let lastUpdateTime = null;
let updateInterval = null;

// Inicializa o módulo de taxas
export function initializeRatesModule() {
  // Configurar atualização automática
  if (updateInterval) clearInterval(updateInterval);
  updateInterval = setInterval(fetchCurrentRates, CONFIG.refreshRatesInterval * 1000);
  
  // Adicionar listener para atualização manual
  const refreshButton = document.getElementById('manual-refresh');
  if (refreshButton) {
    refreshButton.addEventListener('click', () => {
      fetchCurrentRates();
    });
  }
  
  // Primeira atualização
  fetchCurrentRates();
  
  if (CONFIG.debugMode) {
    console.log('FastCripto: Módulo de taxas inicializado');
  }
}

// Busca taxas atuais das criptomoedas
export async function fetchCurrentRates() {
  try {
    // Ativar indicador de carregamento
    const loader = document.getElementById('rates-loader');
    if (loader) loader.classList.add('active');
    
    // Verificar se devemos usar dados simulados ou reais
    let rates;
    
    if (CONFIG.useMockRates) {
      // Dados simulados para desenvolvimento/teste
      rates = await getMockRates();
    } else {
      // Dados reais da API para teste/produção
      rates = await getRealRates();
    }
    
    // Armazenar taxas e atualizar hora
    currentRates = rates;
    lastUpdateTime = new Date();
    
    // Atualizar interface
    updateRatesDisplay(rates);
    
    // Desativar indicador de carregamento
    if (loader) loader.classList.remove('active');
    
    if (CONFIG.debugMode) {
      console.log('FastCripto: Taxas atualizadas', rates);
    }
    
    return rates;
  } catch (error) {
    console.error('FastCripto: Erro ao obter taxas:', error);
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
      return currentRates;
    }
    
    // Caso contrário, retornar taxas padrão
    return getDefaultRates();
  }
}

// Obter taxas simuladas para ambiente de desenvolvimento
async function getMockRates() {
  // Simular um atraso de rede
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Taxas simuladas com pequena variação aleatória para simular mercado
  const baseRates = {
    BTC: 254871.35,
    ETH: 14875.22,
    USDT: 5.04,
    BNB: 1543.67,
    XRP: 2.67
  };
  
  // Adicionar variação aleatória de até 1%
  const result = {};
  for (const [crypto, rate] of Object.entries(baseRates)) {
    const variation = (Math.random() * 2 - 1) * 0.01; // Entre -1% e +1%
    result[crypto] = rate * (1 + variation);
  }
  
  return result;
}

// Obter taxas reais da API para ambiente de teste/produção
async function getRealRates() {
  const response = await fetch(`${CONFIG.apiBaseUrl}/rates/current`);
  if (!response.ok) {
    throw new Error(`Erro ao obter taxas: ${response.status}`);
  }
  return await response.json();
}

// Obter taxas padrão (fallback em caso de erro)
function getDefaultRates() {
  return {
    BTC: 250000,
    ETH: 15000,
    USDT: 5.05,
    BNB: 1500,
    XRP: 2.7
  };
}

// Atualizar a exibição das taxas na interface
function updateRatesDisplay(rates) {
  // Atualizar valores nas cards de cotação
  const btcRate = document.getElementById('btc-rate');
  const ethRate = document.getElementById('eth-rate');
  const usdtRate = document.getElementById('usdt-rate');
  
  if (btcRate) btcRate.textContent = formatCurrency(rates.BTC);
  if (ethRate) ethRate.textContent = formatCurrency(rates.ETH);
  if (usdtRate) usdtRate.textContent = formatCurrency(rates.USDT);
  
  // Atualizar horário da última atualização
  const lastUpdateElement = document.getElementById('last-update-time');
  if (lastUpdateElement && lastUpdateTime) {
    lastUpdateElement.textContent = `Última atualização: ${formatDate(lastUpdateTime)}`;
  }
}

// Obter taxa para uma criptomoeda específica
export function getRateForCurrency(currency) {
  if (!currency || !currentRates[currency]) {
    console.warn(`FastCripto: Taxa não encontrada para ${currency}`);
    return null;
  }
  return currentRates[currency];
}

// Formatar moeda para exibição
function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { 
    style: 'currency', 
    currency: 'BRL' 
  }).format(value);
}

// Formatar data para exibição
function formatDate(date) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

// Exportar funções para uso global
window.getRateForCurrency = getRateForCurrency;
