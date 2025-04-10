/**
 * FastCripto - Aplicação Principal
 * Inicializa a aplicação e integra todos os módulos
 */

// Importar configurações
import { CONFIG } from './config.js';
import {
  initializeRatesModule,
  getRateForCurrency,
  fetchCurrentRates,
} from './modules/rates.js';
import {
  convertCurrency,
  applyNetworkFee,
  formatCurrency,
  formatDate,
  validateConversionAmount,
} from './modules/conversion.js';
import {
  addTransaction,
  getTransactionHistory,
} from './modules/transactions.js';
import { verifyIdentity, requestKYCApproval } from './modules/kyc.js';
import { login, logout } from './modules/auth.js';

// Executar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function () {
  console.log(`Inicializando FastCripto - ${CONFIG.appName}`);
  console.log(`Ambiente: ${CONFIG.environment}`);

  // Inicializar os módulos
  initializeRatesModule();
  initializeInterface();
  setupEventListeners();
  setupTabNavigation();
  initializeRatesDisplay();
  setupTransactionHandling();

  // Verificação de autenticação
  if (isUserAuthenticated()) {
    loadUserTransactions();
  }

  console.log('FastCripto inicializada com sucesso!');
});

// Certificar que os eventos são registrados após o DOM estar completamente carregado
document.addEventListener('DOMContentLoaded', function () {
  console.log('DOM completamente carregado. Registrando eventos nos botões.');

  // Botão de atualização manual
  const refreshButton = document.getElementById('manual-refresh');
  if (refreshButton) {
    refreshButton.addEventListener('click', async () => {
      try {
        console.log(
          'Botão de atualização pressionado. Iniciando atualização...'
        );

        // Ativar loader
        const loader = document.getElementById('rates-loader');
        if (loader) loader.classList.add('active');

        // Buscar cotações atualizadas
        const rates = await fetchCurrentRates();

        // Atualizar interface com as novas cotações
        updateRatesDisplay(rates);

        console.log('Atualização concluída com sucesso.');
      } catch (error) {
        console.error('Erro ao atualizar cotações manualmente:', error);
      } finally {
        // Desativar loader
        const loader = document.getElementById('rates-loader');
        if (loader) loader.classList.remove('active');
      }
    });
  } else {
    console.warn('Botão de atualização manual não encontrado no DOM.');
  }

  // Outros botões podem ser configurados aqui...
});

// Inicializar elementos da interface
function initializeInterface() {
  setupTabNavigation();

  // Definir valor mínimo no campo de valor em Reais
  const brlAmountInput = document.getElementById('brl-amount');
  if (brlAmountInput) {
    brlAmountInput.min = CONFIG.minConversionAmount;
    brlAmountInput.placeholder = `Ex: ${CONFIG.minConversionAmount}`;
  }

  // Definir valor mínimo na mensagem de ajuda
  const minAmountHelp = brlAmountInput?.parentElement.querySelector('small');
  if (minAmountHelp) {
    minAmountHelp.textContent = `Mínimo: R$ ${CONFIG.minConversionAmount.toFixed(
      2
    )}`;
  }
}

// Configurar navegação por abas
function setupTabNavigation() {
  const tabNavs = document.querySelectorAll('.tab-nav');
  const tabContents = document.querySelectorAll('.tab-content');

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
      document.getElementById(tabId).classList.add('active');
    });
  });
}

// Configurar event listeners
function setupEventListeners() {
  // Botão de calcular conversão
  const calculateButton = document.getElementById('btn-calculate');
  if (calculateButton) {
    calculateButton.addEventListener('click', handleCalculateConversion);
  }

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
      document.querySelector('.tab-nav[data-tab="converter"]').click();
    });
  }

  // Botão de iniciar KYC
  const startKycButton = document.getElementById('btn-start-kyc');
  if (startKycButton) {
    startKycButton.addEventListener('click', handleStartKYC);
  }

  // Seleção de criptomoeda (para atualizar as redes disponíveis)
  const cryptoOptions = document.querySelectorAll(
    'input[name="crypto-currency"]'
  );
  cryptoOptions.forEach((option) => {
    option.addEventListener('change', updateAvailableNetworks);
  });

  // Validação do endereço da carteira
  const walletInput = document.getElementById('wallet-address');
  if (walletInput) {
    walletInput.addEventListener('blur', validateWalletAddress);
  }
}

// Função para configurar o cálculo de conversão
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

// Função para calcular a conversão
function handleCalculateConversion() {
  // Obter valor em Reais
  const brlAmountInput = document.getElementById('brl-amount');
  const brlAmount = parseFloat(brlAmountInput.value);

  // Validar o valor
  if (!brlAmount || isNaN(brlAmount)) {
    showValidationError(brlAmountInput, 'Valor inválido');
    return;
  }

  if (brlAmount < 100) {
    // Valor mínimo
    showValidationError(brlAmountInput, 'Valor mínimo é R$ 100,00');
    return;
  }

  clearValidationError(brlAmountInput);

  // Obter criptomoeda selecionada
  const selectedCrypto = document.querySelector(
    'input[name="crypto-currency"]:checked'
  ).value;

  // Obter rede selecionada
  const selectedNetwork = document.querySelector(
    'input[name="network"]:checked'
  ).value;

  // Obter cotação da criptomoeda
  const cryptoRates = {
    BTC: 254871.35,
    ETH: 14875.22,
    USDT: 5.04,
  };

  const rate = cryptoRates[selectedCrypto];

  // Calcular taxas
  const iofRate = 0.0038; // 0.38%
  const incomeTaxRate = 0.15; // 15%
  const serviceRate = 0.1; // 10%

  const iofAmount = brlAmount * iofRate;
  const incomeTaxAmount = brlAmount * incomeTaxRate;
  const serviceAmount = brlAmount * serviceRate;

  // Calcular valor líquido
  const netAmount = brlAmount - iofAmount - incomeTaxAmount - serviceAmount;

  // Taxas de rede
  const networkFees = {
    BTC: 0.0005,
    ETH: 0.003,
    USDT: 5,
  };

  const networkFee = networkFees[selectedCrypto];
  const networkFeeBRL = networkFee * rate;

  // Calcular valor final em cripto
  const cryptoAmount = netAmount / rate;
  const finalCryptoAmount = cryptoAmount - networkFee;

  // Atualizar interface com o resultado
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
  document.getElementById('conversion-result').classList.remove('hidden');
  document.getElementById('btn-proceed').classList.remove('hidden');

  // Armazenar dados da conversão para uso posterior
  window.currentConversion = {
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
      document.querySelector('.tab-nav[data-tab="converter"]').click();
    });
  }

  // Carregar transações existentes
  loadUserTransactions();
}

// Lidar com o prosseguimento da conversão
function handleProceedConversion() {
  // Verificar se há uma conversão atual
  if (!window.currentConversion) {
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

  // Criar objeto de transação
  const transaction = {
    id: `TX${Date.now()}`,
    status: 'pending_kyc',
    createdAt: new Date().toISOString(),
    ...window.currentConversion,
  };

  // Adicionar à lista de transações
  addTransactionToHistory(transaction);

  // Mostrar mensagem de sucesso
  showAlert(
    'Transação iniciada! Por favor, complete a verificação KYC.',
    'success'
  );

  // Redirecionar para a seção de transações
  document.querySelector('.tab-nav[data-tab="transactions"]').click();
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
