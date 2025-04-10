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
  updateInterval = setInterval(
    fetchCurrentRates,
    CONFIG.refreshRatesInterval * 1000
  );

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

  // Chamar a função de atualização periódica ao inicializar
  updateRatesPeriodically();
}

// Atualizar as cotações da API da TradingView com logs detalhados para depuração
async function fetchCurrentRates() {
  try {
    console.log('Iniciando busca de cotações da TradingView...');

    // Ativar indicador de carregamento
    const loader = document.getElementById('rates-loader');
    if (loader) loader.classList.add('active');

    // URL da API da TradingView
    const apiUrl =
      'https://api.tradingview.com/symbols/?symbols=BITSTAMP:BTCUSD,BITSTAMP:ETHUSD,BITSTAMP:USDTUSD';
    console.log(`URL da API: ${apiUrl}`);

    // Fazer a requisição
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`Erro na resposta da API: ${response.status}`);
    }

    // Processar os dados
    const data = await response.json();
    console.log('Dados recebidos da API:', data);

    // Converter para BRL usando a taxa de conversão configurada
    const rates = {
      BTC: data['BITSTAMP:BTCUSD'].price * CONFIG.usdToBrlRate,
      ETH: data['BITSTAMP:ETHUSD'].price * CONFIG.usdToBrlRate,
      USDT: data['BITSTAMP:USDTUSD'].price * CONFIG.usdToBrlRate,
    };

    console.log('Cotações convertidas para BRL:', rates);

    // Atualizar a interface
    updateRatesDisplay(rates);

    // Desativar indicador de carregamento
    if (loader) loader.classList.remove('active');

    // Armazenar as taxas e o horário da última atualização
    currentRates = rates;
    lastUpdateTime = new Date();

    console.log('Cotações atualizadas com sucesso:', rates);
    return rates;
  } catch (error) {
    console.error('Erro ao buscar cotações da TradingView:', error);

    // Desativar indicador de carregamento
    const loader = document.getElementById('rates-loader');
    if (loader) loader.classList.remove('active');

    // Exibir mensagem de erro para o usuário
    if (window.showInAppNotification) {
      window.showInAppNotification(
        'Erro ao obter cotações. Por favor, tente novamente mais tarde.',
        'error'
      );
    }

    // Retornar taxas em cache ou padrão
    if (Object.keys(currentRates).length > 0) {
      console.warn('Usando taxas em cache devido a erro na API.');
      return currentRates;
    }

    console.warn('Usando taxas padrão como fallback.');
    return getDefaultRates();
  }
}

// Obter taxas simuladas para ambiente de desenvolvimento
async function getMockRates() {
  // Simular um atraso de rede
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Taxas simuladas com pequena variação aleatória para simular mercado
  const baseRates = {
    BTC: 254871.35,
    ETH: 14875.22,
    USDT: 5.04,
    BNB: 1543.67,
    XRP: 2.67,
  };

  // Adicionar variação aleatória de até 1%
  const result = {};
  for (const [crypto, rate] of Object.entries(baseRates)) {
    const variation = (Math.random() * 2 - 1) * 0.01; // Entre -1% e +1%
    result[crypto] = rate * (1 + variation);
  }

  return result;
}

// Obter taxas reais da API da CoinGecko para ambiente de teste/produção
async function getRealRates() {
  const apiUrl =
    'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tether&vs_currencies=brl';
  const response = await fetch(apiUrl);
  if (!response.ok) {
    throw new Error(`Erro ao obter taxas da CoinGecko: ${response.status}`);
  }

  const data = await response.json();

  return {
    BTC: data.bitcoin.brl,
    ETH: data.ethereum.brl,
    USDT: data.tether.brl,
  };
}

// Obter taxas reais da API da TradingView
async function getTradingViewRates() {
  const apiUrl =
    'https://api.tradingview.com/symbols/?symbols=BITSTAMP:BTCUSD,BITSTAMP:ETHUSD,BITSTAMP:USDTUSD';
  const response = await fetch(apiUrl);
  if (!response.ok) {
    throw new Error(`Erro ao obter taxas da TradingView: ${response.status}`);
  }

  const data = await response.json();

  return {
    BTC: data['BITSTAMP:BTCUSD'].price * CONFIG.usdToBrlRate,
    ETH: data['BITSTAMP:ETHUSD'].price * CONFIG.usdToBrlRate,
    USDT: data['BITSTAMP:USDTUSD'].price * CONFIG.usdToBrlRate,
  };
}

// Obter taxas padrão (fallback em caso de erro)
function getDefaultRates() {
  return {
    BTC: 250000,
    ETH: 15000,
    USDT: 5.05,
    BNB: 1500,
    XRP: 2.7,
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
    lastUpdateElement.textContent = `Última atualização: ${formatDate(
      lastUpdateTime
    )}`;
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
    currency: 'BRL',
  }).format(value);
}

// Formatar data para exibição
function formatDate(date) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

// Exportar funções para uso global
window.getRateForCurrency = getRateForCurrency;

// Função para inicializar a exibição de cotações
function initializeRatesDisplay() {
  // Simulação de cotações para demonstração
  const mockRates = {
    BTC: 254871.35,
    ETH: 14875.22,
    USDT: 5.04,
  };

  // Exibir as cotações na interface
  const btcRate = document.getElementById('btc-rate');
  const ethRate = document.getElementById('eth-rate');
  const usdtRate = document.getElementById('usdt-rate');

  if (btcRate) btcRate.textContent = formatCurrency(mockRates.BTC);
  if (ethRate) ethRate.textContent = formatCurrency(mockRates.ETH);
  if (usdtRate) usdtRate.textContent = formatCurrency(mockRates.USDT);

  // Atualizar horário da última atualização
  const lastUpdateElement = document.getElementById('last-update-time');
  if (lastUpdateElement) {
    lastUpdateElement.textContent = `Última atualização: ${formatDateTime(
      new Date()
    )}`;
  }

  // Adicionar evento ao botão de atualização
  const refreshButton = document.getElementById('manual-refresh');
  if (refreshButton) {
    refreshButton.addEventListener('click', function () {
      // Mostrar loader
      const loader = document.getElementById('rates-loader');
      if (loader) loader.classList.add('active');

      // Simular atraso de rede
      setTimeout(() => {
        // Atualizar cotações com pequena variação
        const variationPercent = 0.01; // 1%

        Object.keys(mockRates).forEach((crypto) => {
          const variation = (Math.random() * 2 - 1) * variationPercent;
          mockRates[crypto] = mockRates[crypto] * (1 + variation);
        });

        // Atualizar interface
        if (btcRate) btcRate.textContent = formatCurrency(mockRates.BTC);
        if (ethRate) ethRate.textContent = formatCurrency(mockRates.ETH);
        if (usdtRate) usdtRate.textContent = formatCurrency(mockRates.USDT);

        if (lastUpdateElement) {
          lastUpdateElement.textContent = `Última atualização: ${formatDateTime(
            new Date()
          )}`;
        }

        // Esconder loader
        if (loader) loader.classList.remove('active');
      }, 1000);
    });
  }
}

// Função de formatação de moeda
function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

// Função de formatação de data e hora
function formatDateTime(date) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

// Atualizar as cotações periodicamente
function updateRatesPeriodically() {
  const updateInterval = 60000; // Atualizar a cada 60 segundos

  setInterval(async () => {
    try {
      const rates = await fetchCurrentRates(); // Buscar cotações atualizadas
      updateRatesDisplay(rates); // Atualizar a interface com as novas cotações
    } catch (error) {
      console.error('Erro ao atualizar cotações:', error);
    }
  }, updateInterval);
}
