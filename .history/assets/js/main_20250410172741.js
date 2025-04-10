/**
 * FastCripto - Aplicação Principal
 * Inicializa a aplicação e integra todos os módulos
 */

// Importar configurações
import { CONFIG } from './config.js';

// Variáveis globais
let currentRates = {};
let currentConversion = null;

// Uma única inicialização quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function () {
  console.log(
    `Inicializando FastCripto - ${CONFIG.appName} v${CONFIG.version}`
  );
  console.log(`Ambiente: ${CONFIG.environment}`);

  // Inicializar todos os módulos
  setupTabNavigation();
  initializeRatesDisplay();
  setupConversionCalculator();
  setupEventListeners();
  setupTransactionHandling();

  // Verificação de autenticação
  if (isUserAuthenticated()) {
    loadUserTransactions();
  }

  console.log('FastCripto inicializada com sucesso!');
});

// Configurar navegação por abas
function setupTabNavigation() {
  // Aguardar o carregamento do menu
  setTimeout(() => {
    const tabNavs = document.querySelectorAll('.tab-nav');
    const tabContents = document.querySelectorAll('.tab-content');

    if (tabNavs.length === 0) {
      console.warn('Elementos de navegação de abas não encontrados.');
      return;
    }

    tabNavs.forEach((nav) => {
      nav.addEventListener('click', function (e) {
        e.preventDefault();

        // Remover classes ativas
        tabNavs.forEach((nav) => nav.classList.remove('active'));
        tabContents.forEach((content) => content.classList.remove('active'));

        // Adicionar classe ativa na aba clicada
        this.classList.add('active');

        // Mostrar conteúdo correspondente
        const tabId = this.getAttribute('data-tab');
        const tabContent = document.getElementById(tabId);
        if (tabContent) {
          tabContent.classList.add('active');
        } else {
          console.warn(`Conteúdo da aba ${tabId} não encontrado.`);
        }
      });
    });

    // Ativar a primeira aba por padrão se nenhuma estiver ativa
    if (!document.querySelector('.tab-nav.active')) {
      const firstTab = document.querySelector('.tab-nav');
      if (firstTab) firstTab.click();
    }
  }, 300); // Pequeno delay para garantir que o menu foi carregado
}

// Inicializar cotações
function initializeRatesDisplay() {
  const btcRate = document.getElementById('btc-rate');
  const ethRate = document.getElementById('eth-rate');
  const usdtRate = document.getElementById('usdt-rate');
  const lastUpdateElement = document.getElementById('last-update-time');
  const refreshButton = document.getElementById('manual-refresh');

  if (!btcRate || !ethRate || !usdtRate) {
    console.warn('Elementos de exibição de taxas não encontrados.');
    return;
  }

  // Cotações iniciais
  const initialRates = {
    BTC: CONFIG.initialRates?.BTC || 254871.35,
    ETH: CONFIG.initialRates?.ETH || 14875.22,
    USDT: CONFIG.initialRates?.USDT || 5.04,
  };

  // Armazenar globalmente para uso posterior
  currentRates = { ...initialRates };
  window.cryptoRates = currentRates;

  // Exibir as cotações na interface
  updateRatesDisplay(currentRates);

  // Configurar a atualização automática das taxas
  setInterval(fetchCurrentRates, CONFIG.refreshRatesInterval * 1000);

  // Adicionar evento ao botão de atualização manual
  if (refreshButton) {
    refreshButton.addEventListener('click', async function () {
      try {
        // Mostrar loader
        const loader = document.getElementById('rates-loader');
        if (loader) loader.classList.add('active');

        // Atualizar cotações
        await fetchCurrentRates();

        // Esconder loader
        if (loader) loader.classList.remove('active');

        // Notificar o usuário
        showAlert('Cotações atualizadas com sucesso!', 'success');
      } catch (error) {
        console.error('Erro ao atualizar cotações:', error);
        showAlert(
          'Falha ao atualizar cotações. Tente novamente mais tarde.',
          'error'
        );
      }
    });
  }
}

// Buscar cotações atualizadas
async function fetchCurrentRates() {
  try {
    // Em ambiente de produção, chamar a API real
    if (CONFIG.environment === 'production') {
      const response = await fetch(CONFIG.apiEndpoints.rates);
      if (!response.ok) throw new Error('Falha na resposta da API');
      const data = await response.json();

      // Atualizar cotações
      currentRates = {
        BTC: data.BTC?.BRL || currentRates.BTC,
        ETH: data.ETH?.BRL || currentRates.ETH,
        USDT: data.USDT?.BRL || currentRates.USDT,
      };
    } else {
      // Para desenvolvimento, simular variação aleatória de até 1%
      Object.keys(currentRates).forEach((crypto) => {
        const variation = (Math.random() * 2 - 1) * 0.01;
        currentRates[crypto] = currentRates[crypto] * (1 + variation);
      });
    }

    // Atualizar a interface
    updateRatesDisplay(currentRates);

    // Atualizar a referência global
    window.cryptoRates = currentRates;

    return currentRates;
  } catch (error) {
    console.error('Erro ao buscar cotações:', error);
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

  if (lastUpdateElement) {
    lastUpdateElement.textContent = `Última atualização: ${formatDateTime(
      new Date()
    )}`;
  }
}

// Configurar calculadora de conversão
function setupConversionCalculator() {
  const calculateButton = document.getElementById('btn-calculate');
  if (calculateButton) {
    calculateButton.addEventListener('click', handleCalculateConversion);
  }

  // Atualizar redes disponíveis quando a criptomoeda muda
  const cryptoOptions = document.querySelectorAll(
    'input[name="crypto-currency"]'
  );
  cryptoOptions.forEach((option) => {
    option.addEventListener('change', updateAvailableNetworks);
  });

  // Configurar inicialmente as redes disponíveis
  updateAvailableNetworks();
}

// Configurar todos os event listeners
function setupEventListeners() {
  // Eventos já configurados em outras funções específicas

  // Validação do endereço da carteira
  const walletInput = document.getElementById('wallet-address');
  if (walletInput) {
    walletInput.addEventListener('blur', validateWalletAddress);
  }

  // Botão de iniciar KYC
  const startKycButton = document.getElementById('btn-start-kyc');
  if (startKycButton) {
    startKycButton.addEventListener('click', handleStartKYC);
  }
}

// Função para calcular a conversão
function handleCalculateConversion() {
  // Obter valor em Reais
  const brlAmountInput = document.getElementById('brl-amount');
  if (!brlAmountInput) {
    console.error('Elemento do valor em BRL não encontrado');
    return;
  }

  const brlAmount = parseFloat(brlAmountInput.value);

  // Validar o valor
  if (!brlAmount || isNaN(brlAmount)) {
    showValidationError(brlAmountInput, 'Valor inválido');
    return;
  }

  if (brlAmount < CONFIG.minConversionAmount) {
    showValidationError(
      brlAmountInput,
      `Valor mínimo é R$ ${CONFIG.minConversionAmount.toFixed(2)}`
    );
    return;
  }

  clearValidationError(brlAmountInput);

  // Obter criptomoeda selecionada
  const selectedCryptoElement = document.querySelector(
    'input[name="crypto-currency"]:checked'
  );
  if (!selectedCryptoElement) {
    showAlert('Selecione uma criptomoeda', 'error');
    return;
  }
  const selectedCrypto = selectedCryptoElement.value;

  // Obter rede selecionada
  const selectedNetworkElement = document.querySelector(
    'input[name="network"]:checked'
  );
  if (!selectedNetworkElement) {
    showAlert('Selecione uma rede blockchain', 'error');
    return;
  }
  const selectedNetwork = selectedNetworkElement.value;

  // Obter cotação da criptomoeda
  const rate = currentRates[selectedCrypto];
  if (!rate) {
    showAlert(`Cotação para ${selectedCrypto} não disponível`, 'error');
    return;
  }

  // Calcular taxas
  const iofRate = CONFIG.iofRate;
  const incomeTaxRate = CONFIG.incomeTaxRate;
  const serviceRate = CONFIG.serviceRate;

  const iofAmount = brlAmount * iofRate;
  const incomeTaxAmount = brlAmount * incomeTaxRate;
  const serviceAmount = brlAmount * serviceRate;

  // Calcular valor líquido
  const netAmount = brlAmount - iofAmount - incomeTaxAmount - serviceAmount;

  // Taxas de rede
  const networkFee = CONFIG.networkFees[selectedCrypto] || 0;
  const networkFeeBRL = networkFee * rate;

  // Calcular valor final em cripto
  const cryptoAmount = netAmount / rate;
  const finalCryptoAmount = cryptoAmount - networkFee / rate;

  // Atualizar interface com o resultado
  const resultElement = document.getElementById('conversion-result');
  if (!resultElement) {
    console.error('Elemento de resultado não encontrado');
    return;
  }

  document.getElementById('result-brl-amount').textContent =
    formatCurrency(brlAmount);
  document.getElementById('result-iof').textContent = `- ${formatCurrency(
    iofAmount
  )}`;
  document.getElementById('result-ir').textContent = `- ${formatCurrency(
    incomeTaxAmount
  )}`;
  document.getElementById(
    'result-service-fee'
  ).textContent = `- ${formatCurrency(serviceAmount)}`;
  document.getElementById(
    'result-network-fee'
  ).textContent = `- ${formatCurrency(networkFeeBRL)}`;
  document.getElementById('result-net-amount').textContent =
    formatCurrency(netAmount);
  document.getElementById(
    'result-crypto-amount'
  ).textContent = `${finalCryptoAmount.toFixed(8)} ${selectedCrypto}`;
  document.getElementById('result-rate').textContent = formatCurrency(rate);

  // Mostrar o resultado e o botão de prosseguir
  resultElement.classList.remove('hidden');
  const proceedButton = document.getElementById('btn-proceed');
  if (proceedButton) proceedButton.classList.remove('hidden');

  // Armazenar dados da conversão para uso posterior
  currentConversion = {
    brlAmount,
    iofAmount,
    incomeTaxAmount,
    serviceAmount,
    networkFeeBRL,
    netAmount,
    cryptoAmount,
    finalCryptoAmount,
    rate,
    currency: selectedCrypto,
    network: selectedNetwork,
    walletAddress: document.getElementById('wallet-address').value.trim(),
  };

  // Também disponibilizar globalmente
  window.currentConversion = currentConversion;
}

// Lidar com o prosseguimento da conversão
function handleProceedConversion() {
  // Verificar se há uma conversão atual
  if (!currentConversion) {
    showAlert(
      'Nenhuma conversão encontrada. Por favor, calcule novamente.',
      'error'
    );
    return;
  }

  // Validar o endereço da carteira
  const walletInput = document.getElementById('wallet-address');
  const walletValue = walletInput.value.trim();

  if (!walletValue) {
    showValidationError(walletInput, 'Endereço da carteira é obrigatório');
    return;
  }

  // Verificar formato do endereço da carteira
  if (!validateWalletAddress()) {
    return; // A função validateWalletAddress já exibe o erro
  }

  // Atualizar o endereço da carteira na conversão atual
  currentConversion.walletAddress = walletValue;

  // Criar objeto de transação
  const transaction = {
    id: `TX${Date.now()}`,
    status: 'pending_kyc',
    createdAt: new Date().toISOString(),
    ...currentConversion,
  };

  // Adicionar à lista de transações
  addTransactionToHistory(transaction);

  // Mostrar mensagem de sucesso
  showAlert(
    'Transação iniciada! Complete a verificação KYC para prosseguir.',
    'success'
  );

  // Redirecionar para a seção de transações
  setTimeout(() => {
    const transactionsTab = document.querySelector(
      '.tab-nav[data-tab="transactions"]'
    );
    if (transactionsTab) transactionsTab.click();
  }, 500);
}

// Sistema de transações
function setupTransactionHandling() {
  // Botão de prosseguir
  const proceedButton = document.getElementById('btn-proceed');
  if (proceedButton) {
    proceedButton.addEventListener('click', handleProceedConversion);
  }

  // Botão de iniciar uma nova transação
  const newTransactionButton = document.getElementById('btn-new-transaction');
  if (newTransactionButton) {
    newTransactionButton.addEventListener('click', function () {
      // Navegar para a aba do conversor
      const converterTab = document.querySelector(
        '.tab-nav[data-tab="converter"]'
      );
      if (converterTab) converterTab.click();
    });
  }

  // Carregar transações existentes
  loadUserTransactions();
}

// Atualizar redes disponíveis com base na criptomoeda selecionada
function updateAvailableNetworks() {
  // Obter criptomoeda selecionada
  const selectedCrypto =
    document.querySelector('input[name="crypto-currency"]:checked')?.value ||
    'BTC';

  // Obter opções de rede
  const btcNetworkOption =
    document.querySelector('.network-btc')?.parentElement;
  const ethNetworkOption =
    document.querySelector('.network-eth')?.parentElement;
  const bscNetworkOption =
    document.querySelector('.network-bsc')?.parentElement;

  if (!btcNetworkOption || !ethNetworkOption || !bscNetworkOption) return;

  // Resetar todas as opções
  btcNetworkOption.style.display = 'none';
  ethNetworkOption.style.display = 'none';
  bscNetworkOption.style.display = 'none';

  // Mostrar apenas as redes compatíveis com a criptomoeda
  switch (selectedCrypto) {
    case 'BTC':
      btcNetworkOption.style.display = 'flex';
      document.querySelector('.network-btc').checked = true;
      break;
    case 'ETH':
      ethNetworkOption.style.display = 'flex';
      document.querySelector('.network-eth').checked = true;
      break;
    case 'USDT':
      ethNetworkOption.style.display = 'flex';
      bscNetworkOption.style.display = 'flex';
      document.querySelector('.network-eth').checked = true;
      break;
    default:
      // Mostrar todas as redes para outras criptomoedas
      btcNetworkOption.style.display = 'flex';
      ethNetworkOption.style.display = 'flex';
      bscNetworkOption.style.display = 'flex';
  }
}

// Funções de validação
function showValidationError(inputElement, message) {
  clearValidationError(inputElement);

  const errorElement = document.createElement('div');
  errorElement.className = 'validation-error';
  errorElement.textContent = message;

  inputElement.classList.add('input-error');
  inputElement.parentNode.appendChild(errorElement);
}

function clearValidationError(inputElement) {
  const parent = inputElement.parentNode;
  const errorElement = parent.querySelector('.validation-error');

  if (errorElement) {
    errorElement.remove();
  }

  inputElement.classList.remove('input-error');
}

// Obter transações do LocalStorage
function getTransactionsFromStorage() {
  const stored = localStorage.getItem('fastcripto_transactions');
  return stored ? JSON.parse(stored) : [];
}

// Carregar transações do usuário
function loadUserTransactions() {
  const transactions = getTransactionsFromStorage();
  const emptyState = document.getElementById('transactions-empty');
  const transactionsList = document.getElementById('transactions-list');

  if (!emptyState || !transactionsList) return;

  if (transactions.length === 0) {
    // Mostrar estado vazio
    emptyState.style.display = 'block';
    transactionsList.innerHTML = '';
    return;
  }

  // Esconder estado vazio e mostrar as transações
  emptyState.style.display = 'none';

  // Limpar lista atual
  transactionsList.innerHTML = '';

  // Ordenar transações do mais recente para o mais antigo
  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  // Criar elementos para cada transação
  sortedTransactions.forEach((transaction) => {
    const transactionCard = createTransactionCard(transaction);
    transactionsList.appendChild(transactionCard);
  });
}

// Criar elemento HTML para um card de transação
function createTransactionCard(transaction) {
  const card = document.createElement('div');
  card.className = 'transaction-card';
  card.dataset.id = transaction.id;

  // Determinar classe de status para estilização
  let statusClass = '';
  let statusText = '';

  switch (transaction.status) {
    case 'pending_kyc':
      statusClass = 'pending';
      statusText = 'Pendente (KYC)';
      break;
    case 'processing':
      statusClass = 'processing';
      statusText = 'Processando';
      break;
    case 'completed':
      statusClass = 'completed';
      statusText = 'Concluída';
      break;
    case 'cancelled':
      statusClass = 'cancelled';
      statusText = 'Cancelada';
      break;
    default:
      statusClass = 'pending';
      statusText = 'Pendente';
  }

  const date = transaction.createdAt
    ? new Date(transaction.createdAt)
    : new Date();

  card.innerHTML = `
    <div class="transaction-header">
      <div class="transaction-id">${transaction.id}</div>
      <div class="transaction-status ${statusClass}">${statusText}</div>
    </div>
    <div class="transaction-body">
      <div class="transaction-details">
        <div class="transaction-amount">${formatCurrency(
          transaction.brlAmount
        )} → ${transaction.finalCryptoAmount.toFixed(8)} ${
    transaction.currency
  }</div>
        <div class="transaction-wallet">${truncateWalletAddress(
          transaction.walletAddress
        )}</div>
      </div>
      <div class="transaction-date">${formatDateTime(date)}</div>
    </div>
  `;

  return card;
}

// Truncar endereço de carteira para exibição
function truncateWalletAddress(address, startChars = 8, endChars = 8) {
  if (!address) return 'N/A';
  if (address.length <= startChars + endChars) return address;

  return `${address.substring(0, startChars)}...${address.substring(
    address.length - endChars
  )}`;
}

// Iniciar processo de KYC
function handleStartKYC() {
  showAlert('O processo de KYC será implementado em breve!', 'info');
}

// Validar endereço da carteira
function validateWalletAddress() {
  const walletInput = document.getElementById('wallet-address');
  const walletValue = walletInput.value.trim();

  if (!walletValue) {
    showValidationError(walletInput, 'Endereço da carteira é obrigatório');
    return false;
  }

  const selectedCrypto = document.querySelector(
    'input[name="crypto-currency"]:checked'
  );
  if (!selectedCrypto) {
    showValidationError(walletInput, 'Selecione uma criptomoeda primeiro');
    return false;
  }

  const cryptoType = selectedCrypto.value;

  // Validações específicas por tipo de criptomoeda
  switch (cryptoType) {
    case 'BTC':
      // Validação de carteira Bitcoin (começa com 1, 3, ou bc1)
      if (!/^(1|3|bc1)[a-zA-Z0-9]{25,34}$/.test(walletValue)) {
        showValidationError(walletInput, 'Endereço de Bitcoin inválido');
        return false;
      }
      break;

    case 'ETH':
      // Validação de carteira Ethereum (começa com 0x)
      if (!/^0x[a-fA-F0-9]{40}$/.test(walletValue)) {
        showValidationError(walletInput, 'Endereço de Ethereum inválido');
        return false;
      }
      break;

    case 'USDT':
      // USDT pode estar em múltiplas redes, verificar com base na rede selecionada
      const selectedNetwork = document.querySelector(
        'input[name="network"]:checked'
      );
      if (selectedNetwork) {
        const network = selectedNetwork.value;

        if (network === 'ETH' && !/^0x[a-fA-F0-9]{40}$/.test(walletValue)) {
          showValidationError(
            walletInput,
            'Endereço de USDT na rede Ethereum inválido'
          );
          return false;
        } else if (
          network === 'BSC' &&
          !/^0x[a-fA-F0-9]{40}$/.test(walletValue)
        ) {
          showValidationError(
            walletInput,
            'Endereço de USDT na rede BSC inválido'
          );
          return false;
        }
      }
      break;

    default:
      // Para outros tipos de cripto, apenas verificar comprimento
      if (walletValue.length < 20) {
        showValidationError(walletInput, 'Endereço de carteira muito curto');
        return false;
      }
  }

  clearValidationError(walletInput);
  return true;
}

// Exibir alerta ou notificação
function showAlert(message, type = 'info') {
  // Verificar se a função de notificação do módulo foi importada globalmente
  if (window.showInAppNotification) {
    window.showInAppNotification(message, type);
    return;
  }

  // Implementação básica de fallback
  const alertContainer = document.createElement('div');
  alertContainer.className = `alert alert-${type}`;
  alertContainer.textContent = message;

  const closeButton = document.createElement('button');
  closeButton.className = 'alert-close';
  closeButton.innerHTML = '&times;';
  closeButton.addEventListener('click', () => {
    document.body.removeChild(alertContainer);
  });

  alertContainer.appendChild(closeButton);
  document.body.appendChild(alertContainer);

  // Auto-remover após 5 segundos
  setTimeout(() => {
    if (document.body.contains(alertContainer)) {
      document.body.removeChild(alertContainer);
    }
  }, 5000);
}

// Adicionar transação ao histórico
function addTransactionToHistory(transaction) {
  // Obter histórico atual do LocalStorage
  let transactions = getTransactionsFromStorage();

  // Adicionar nova transação
  transactions.push(transaction);

  // Atualizar LocalStorage
  localStorage.setItem('fastcripto_transactions', JSON.stringify(transactions));

  // Atualizar interface
  loadUserTransactions();
}
