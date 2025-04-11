/**
 * FastCripto - Aplicação Principal
 * Inicializa a aplicação e integra todos os módulos
 */

// Importar os módulos
import { initializeRatesModule, getRateForCurrency, fetchCurrentRates } from './modules/rates.js';
import { 
  convertCurrency, 
  applyNetworkFee,
  formatCurrency, 
  formatDate,
  validateConversionAmount
} from './modules/conversion.js';
import { addTransaction, getTransactionHistory } from './modules/transactions.js';
import { verifyIdentity, requestKYCApproval } from './modules/kyc.js';
import { login, logout } from './modules/auth.js';

// Executar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
  console.log(`Inicializando FastCripto - ${CONFIG.appName}`);
  console.log(`Ambiente: ${CONFIG.environment}`);
  
  // Inicializar os módulos
  initializeRatesModule();
  initializeInterface();
  setupEventListeners();
  setupTabNavigation();
  initializeRatesDisplay();
  
  // Verificação de autenticação
  if (isUserAuthenticated()) {
    loadUserTransactions();
  }
  
  console.log('FastCripto inicializada com sucesso!');
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
    minAmountHelp.textContent = `Mínimo: R$ ${CONFIG.minConversionAmount.toFixed(2)}`;
  }
}

// Configurar navegação por abas
function setupTabNavigation() {
  const tabNavs = document.querySelectorAll('.tab-nav');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabNavs.forEach(nav => {
    nav.addEventListener('click', function(e) {
      e.preventDefault();
      
      // Remover classes ativas
      tabNavs.forEach(nav => nav.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));
      
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
    newTransactionButton.addEventListener('click', function() {
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
  const cryptoOptions = document.querySelectorAll('input[name="crypto-currency"]');
  cryptoOptions.forEach(option => {
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
  const cryptoOptions = document.querySelectorAll('input[name="crypto-currency"]');
  cryptoOptions.forEach(option => {
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

  if (brlAmount < 100) { // Valor mínimo
    showValidationError(brlAmountInput, 'Valor mínimo é R$ 100,00');
    return;
  }

  clearValidationError(brlAmountInput);

  // Obter criptomoeda selecionada
  const selectedCrypto = document.querySelector('input[name="crypto-currency"]:checked').value;

  // Obter rede selecionada
  const selectedNetwork = document.querySelector('input[name="network"]:checked').value;

  // Obter cotação da criptomoeda
  const cryptoRates = {
    BTC: 254871.35,
    ETH: 14875.22,
    USDT: 5.04
  };

  const rate = cryptoRates[selectedCrypto];

  // Calcular taxas
  const iofRate = 0.0038; // 0.38%
  const incomeTaxRate = 0.15; // 15%
  const serviceRate = 0.10; // 10%

  const iofAmount = brlAmount * iofRate;
  const incomeTaxAmount = brlAmount * incomeTaxRate;
  const serviceAmount = brlAmount * serviceRate;

  // Calcular valor líquido
  const netAmount = brlAmount - iofAmount - incomeTaxAmount - serviceAmount;

  // Taxas de rede
  const networkFees = {
    BTC: 0.0005,
    ETH: 0.003,
    USDT: 5
  };

  const networkFee = networkFees[selectedCrypto];
  const networkFeeBRL = networkFee * rate;

  // Calcular valor final em cripto
  const cryptoAmount = netAmount / rate;
  const finalCryptoAmount = cryptoAmount - networkFee;

  // Atualizar interface com o resultado
  document.getElementById('result-brl-amount').textContent = formatCurrency(brlAmount);
  document.getElementById('result-iof').textContent = `- ${formatCurrency(iofAmount)}`;
  document.getElementById('result-ir').textContent = `- ${formatCurrency(incomeTaxAmount)}`;
  document.getElementById('result-service-fee').textContent = `- ${formatCurrency(serviceAmount)}`;
  document.getElementById('result-network-fee').textContent = `- ${formatCurrency(networkFeeBRL)}`;
  document.getElementById('result-net-amount').textContent = formatCurrency(netAmount);
  document.getElementById('result-crypto-amount').textContent = `${finalCryptoAmount.toFixed(8)} ${selectedCrypto}`;
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
    walletAddress: document.getElementById('wallet-address').value.trim()
  };
}

// Atualizar redes disponíveis com base na criptomoeda selecionada
function updateAvailableNetworks() {
  // Obter criptomoeda selecionada
  const selectedCrypto = document.querySelector('input[name="crypto-currency"]:checked')?.value || 'BTC';

  // Obter opções de rede
  const btcNetworkOption = document.querySelector('.network-btc')?.parentElement;
  const ethNetworkOption = document.querySelector('.network-eth')?.parentElement;
  const bscNetworkOption = document.querySelector('.network-bsc')?.parentElement;

  if (!btcNetworkOption || !ethNetworkOption || !bscNetworkOption) return;

  // Resetar todas as opções
  btcNetworkOption.style.display = 'none';
  ethNetworkOption.style.display = 'none';
  bscNetworkOption.style.display = 'none';

  // Mostrar apenas as redes compatíveis com a criptomoeda
  switch(selectedCrypto) {
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

// Lidar com o prosseguimento da conversão
function handleProceedConversion() {
  // Verificar se há uma conversão atual
  if (!window.currentConversion) {
    showAlert('Nenhuma conversão encontrada. Por favor, calcule novamente.', 'error');
    return;
  }
  
  // Verificar se o endereço da carteira é válido
  if (!validateWalletAddress()) {
    return;
  }
  
  // Criar objeto de transação
  const transaction = {
    id: `TX${Date.now()}`,
    status: 'pending_kyc',
    createdAt: new Date(),
    ...window.currentConversion
  };
  
  // Adicionar à lista de transações
  addTransactionToHistory(transaction);
  
  // Navegar para a próxima etapa (KYC)
  showAlert('Transação iniciada! Por favor, complete a verificação KYC.', 'success');
  
  // Atualizar etapa na interface
  updateConversionStep(2);
  
  // Redirecionar para a seção de conta para KYC
  setTimeout(() => {
    document.querySelector('.tab-nav[data-tab="account"]').click();
  }, 1500);
}

// Atualizar etapa do processo de conversão na interface
function updateConversionStep(stepNumber) {
  const steps = document.querySelectorAll('.conversion-steps .step');
  steps.forEach((step, index) => {
    if (index + 1 <= stepNumber) {
      step.classList.add('active');
    } else {
      step.classList.remove('active');
    }
  });
}

// Adicionar transação ao histórico
function addTransactionToHistory(transaction) {
  // Obter histórico atual do LocalStorage
  let transactions = getTransactionsFromStorage();
  
  // Adicionar nova transação
  transactions.push(transaction);
  
  // Atualizar LocalStorage
  localStorage.setItem('fastcripto_transactions', JSON.stringify(transactions));
  
  // Atualizar interface se estiver na seção de transações
  if (document.querySelector('.tab-nav[data-tab="transactions"]').classList.contains('active')) {
    loadUserTransactions();
  }
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
  
  if (transactions.length === 0) {
    // Mostrar estado vazio
    if (emptyState) emptyState.style.display = 'block';
    if (transactionsList) transactionsList.innerHTML = '';
    return;
  }
  
  // Esconder estado vazio e mostrar as transações
  if (emptyState) emptyState.style.display = 'none';
  if (transactionsList) {
    // Limpar lista atual
    transactionsList.innerHTML = '';
    
    // Ordenar transações do mais recente para o mais antigo
    const sortedTransactions = [...transactions].sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );
    
    // Criar elementos para cada transação
    sortedTransactions.forEach(transaction => {
      const transactionCard = createTransactionCard(transaction);
      transactionsList.appendChild(transactionCard);
    });
  }
}

// Criar elemento HTML para um card de transação
function createTransactionCard(transaction) {
  const card = document.createElement('div');
  card.className = 'transaction-card';
  card.dataset.id = transaction.id;
  
  // Determinar classe de status para estilização
  let statusClass = '';
  let statusText = '';
  
  switch(transaction.status) {
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
  
  const date = transaction.createdAt ? new Date(transaction.createdAt) : new Date();
  
  card.innerHTML = `
    <div class="transaction-header">
      <div class="transaction-id">${transaction.id}</div>
      <div class="transaction-status ${statusClass}">${statusText}</div>
    </div>
    <div class="transaction-body">
      <div class="transaction-details">
        <div class="transaction-amount">${formatCurrency(transaction.brlAmount, 'BRL')} → ${formatCurrency(transaction.finalCryptoAmount, transaction.currency)}</div>
        <div class="transaction-wallet">${truncateWalletAddress(transaction.walletAddress)}</div>
      </div>
      <div class="transaction-date">${formatDate(date)}</div>
    </div>
  `;
  
  return card;
}

// Truncar endereço de carteira para exibição
function truncateWalletAddress(address, startChars = 8, endChars = 8) {
  if (!address) return 'N/A';
  if (address.length <= startChars + endChars) return address;
  
  return `${address.substring(0, startChars)}...${address.substring(address.length - endChars)}`;
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
  
  const selectedCrypto = document.querySelector('input[name
