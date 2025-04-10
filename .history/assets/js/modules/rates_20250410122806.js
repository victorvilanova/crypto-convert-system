// Módulo de taxas

// Obtenção e gerenciamento de taxas de câmbio
export async function fetchExchangeRates(apiUrl) {
  const response = await fetch(`${apiUrl}/exchange-rates`);
  return response.json();
}

export function getRateForCurrency(rates, currency) {
  return rates[currency] || null;
}

// Variáveis do módulo
let currentRates = {};
let lastUpdateTime = null;
let updateInterval = null;

// Inicialização do módulo
export function initializeRatesModule() {
  // Configurar atualização automática
  if (updateInterval) clearInterval(updateInterval);
  updateInterval = setInterval(
    fetchCurrentRates,
    CONFIG.refreshRatesInterval * 1000
  );

  // Configurar botão de atualização manual
  document
    .getElementById('manual-refresh')
    .addEventListener('click', fetchCurrentRates);

  // Primeira atualização
  fetchCurrentRates();
}

// Buscar taxas atuais das criptomoedas
async function fetchCurrentRates() {
  try {
    // Ativar indicador de carregamento
    document.getElementById('rates-loader').classList.add('active');

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
    document.getElementById('rates-loader').classList.remove('active');

    if (CONFIG.debugMode) {
      console.log('FastCripto: Taxas atualizadas', rates);
    }

    return rates;
  } catch (error) {
    console.error('FastCripto: Erro ao obter taxas:', error);
    document.getElementById('rates-loader').classList.remove('active');
    showAlert(
      'Erro ao obter taxas de conversão. Por favor, tente novamente.',
      'danger'
    );
  }
}

// Obter taxas simuladas para ambiente de desenvolvimento
async function getMockRates() {
  // Simular um atraso de rede
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // Taxas simuladas
  return {
    BTC: 254871.35,
    ETH: 14875.22,
    USDT: 5.04,
    BNB: 1543.67,
    XRP: 2.67,
  };
}

// Obter taxas reais da API para ambiente de teste/produção
async function getRealRates() {
  const response = await fetch(`${CONFIG.apiBaseUrl}/rates/current`);
  if (!response.ok) {
    throw new Error(`Erro ao obter taxas: ${response.status}`);
  }
  return await response.json();
}

// Atualizar a exibição das taxas na interface
function updateRatesDisplay(rates) {
  document.getElementById('btc-rate').textContent = formatCurrency(rates.BTC);
  document.getElementById('eth-rate').textContent = formatCurrency(rates.ETH);
  document.getElementById('usdt-rate').textContent = formatCurrency(rates.USDT);

  // Atualizar horário da última atualização
  document.getElementById('last-update-time').textContent =
    formatDate(lastUpdateTime);
}
