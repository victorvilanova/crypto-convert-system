/**
 * FastCripto - Aplicação Principal
 * Inicializa a aplicação e integra todos os módulos
 */

// Importar configurações e módulos
import { CONFIG } from './config.js';
import { initializeModules, showInAppNotification } from './modules/index.js';

// Variáveis globais
let currentConversion = null;

// Uma única inicialização quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', async function () {
  console.log(
    `Inicializando FastCripto - ${CONFIG.appName} v${CONFIG.version}`
  );
  console.log(`Ambiente: ${CONFIG.environment}`);

  try {
    // Inicializar todos os módulos
    await initializeModules();

    // Inicializar interface e eventos
    setupTabNavigation();
    setupConversionCalculator();
    setupEventListeners();
    setupTransactionHandling();

    // Verificação de autenticação
    if (isUserAuthenticated()) {
      loadUserTransactions();
    }

    // Configurar a navegação entre etapas
    setupStepsNavigation();

    console.log('FastCripto inicializada com sucesso!');
    showInAppNotification('FastCripto inicializada com sucesso!', 'success');
  } catch (error) {
    console.error('Erro ao inicializar a aplicação:', error);
    showAlert(
      'Ocorreu um erro ao inicializar a aplicação. Por favor, recarregue a página.',
      'error'
    );
  }
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
    BTC: CONFIG.initialRates?.BTC || 340000.00,
    ETH: CONFIG.initialRates?.ETH || 17500.00,
    USDT: CONFIG.initialRates?.USDT || 5.30,
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
    walletInput.addEventListener('blur', validateWalletAddressWithPrompt);
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
  const rate = getRateForCurrency(selectedCrypto);
  if (!rate) {
    showAlert(`Cotação para ${selectedCrypto} não disponível`, 'error');
    return;
  }

  // Calcular taxas
  const iofRate = CONFIG.iofRate;
  const serviceRate = CONFIG.serviceRate; // Taxa de serviço 6%

  const iofAmount = brlAmount * iofRate;
  const serviceAmount = brlAmount * serviceRate;

  // Calcular valor líquido (sem IR)
  const netAmount = brlAmount - iofAmount - serviceAmount;

  // Calcular valor em cripto
  const cryptoAmount = netAmount / rate;

  // Aplicar taxa de rede (em cripto)
  let networkFee = 0;

  // Determinar a taxa de rede correta com base na criptomoeda e rede selecionada
  if (selectedCrypto === 'USDT') {
    // USDT tem taxa fixa de 1 USDT para qualquer rede
    networkFee = 1;
  } else {
    // BTC e ETH têm taxa fixa
    networkFee = CONFIG.networkFees[selectedCrypto] || 0;
  }

  const finalCryptoAmount = cryptoAmount - networkFee;

  if (finalCryptoAmount <= 0) {
    showAlert(
      'Valor muito baixo para cobrir as taxas. Aumente o valor da transação.',
      'error'
    );
    return;
  }

  // Mostrar resultado
  const resultElement = document.getElementById('conversion-result');
  if (resultElement) {
    resultElement.style.display = 'block';

    // Preencher detalhes
    document.getElementById('result-brl-amount').textContent =
      formatCurrency(brlAmount);
    document.getElementById('result-iof').textContent =
      formatCurrency(iofAmount);
    document.getElementById('result-service-fee').textContent =
      formatCurrency(serviceAmount);
    document.getElementById('result-network-fee').textContent =
      networkFee + ' ' + selectedCrypto;
    document.getElementById('result-net-amount').textContent =
      formatCurrency(netAmount);
    document.getElementById('result-rate').textContent = formatCurrency(rate);
    document.getElementById('result-crypto-amount').textContent =
      finalCryptoAmount.toFixed(8) + ' ' + selectedCrypto;
  }

  // Rolar para o resultado
  resultElement.scrollIntoView({ behavior: 'smooth' });

  // Habilitar o botão para prosseguir
  const proceedButton = document.getElementById('btn-proceed');
  const proceedContainer = document.getElementById('btn-proceed-container');
  if (proceedButton && proceedContainer) {
    proceedButton.disabled = false;
    proceedContainer.classList.remove('hidden');
  }

  // Armazenar a conversão atual para uso na confirmação
  currentConversion = {
    brlAmount,
    iofAmount,
    serviceAmount,
    netAmount,
    cryptoAmount,
    finalCryptoAmount,
    rate,
    currency: selectedCrypto,
    network: selectedNetwork,
    networkFee,
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
  if (!validateWalletAddressWithPrompt()) {
    return; // A função validateWalletAddressWithPrompt já exibe o erro
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

// Função para atualizar as redes disponíveis com base na criptomoeda selecionada
function updateAvailableNetworks() {
  // Obter criptomoeda selecionada
  const selectedCrypto =
    document.querySelector('input[name="crypto-currency"]:checked')?.value ||
    'USDT'; // USDT como padrão agora

  // Obter opções de rede
  const btcNetworkOption =
    document.querySelector('.network-btc')?.parentElement;
  const ethNetworkOption =
    document.querySelector('.network-eth')?.parentElement;
  const bscNetworkOption =
    document.querySelector('.network-bsc')?.parentElement;
  const tronNetworkOption =
    document.querySelector('.network-tron')?.parentElement;

  if (
    !btcNetworkOption ||
    !ethNetworkOption ||
    !bscNetworkOption ||
    !tronNetworkOption
  )
    return;

  // Resetar todas as opções
  btcNetworkOption.style.display = 'none';
  ethNetworkOption.style.display = 'none';
  bscNetworkOption.style.display = 'none';
  tronNetworkOption.style.display = 'none';

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
      // Apenas TRON disponível para USDT
      tronNetworkOption.style.display = 'flex';
      document.querySelector('.network-tron').checked = true;
      
      // Adicionar o aviso sobre TRON como rede exclusiva para USDT
      const networkGroup = tronNetworkOption.closest('.form-group');
      const existingInfo = networkGroup.querySelector('.network-info-message');
      
      if (!existingInfo) {
        const infoMessage = document.createElement('div');
        infoMessage.className = 'network-info-message alert alert-info mt-2';
        infoMessage.style.fontSize = '0.9rem';
        infoMessage.style.padding = '10px';
        infoMessage.style.borderRadius = '6px';
        infoMessage.style.backgroundColor = '#e7f5ff';
        infoMessage.style.borderLeft = '4px solid #4c6ef5';
        infoMessage.innerHTML = '<i class="bi bi-info-circle-fill me-2"></i><strong>Importante:</strong> Para USDT, utilizamos exclusivamente a rede TRON (TRC20) por sua segurança e baixas taxas.';
        
        networkGroup.appendChild(infoMessage);
      }
      break;
    default:
      // Mostrar todas as redes para outras criptomoedas
      btcNetworkOption.style.display = 'flex';
      ethNetworkOption.style.display = 'flex';
      bscNetworkOption.style.display = 'flex';
      tronNetworkOption.style.display = 'flex';
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
  // Usar a nova função de modal KYC que criamos
  showKYCModal(function() {
    // Callback de sucesso
    showAlert(
      'Verificação KYC concluída com sucesso! Suas transações serão processadas em breve.',
      'success'
    );
    
    // Navegar para a página de transações
    const transactionsTab = document.querySelector(
      '.tab-nav[data-tab="transactions"]'
    );
    if (transactionsTab) transactionsTab.click();
  });
}

// Função para melhorar a confirmação de wallet e mostrar que está correto
function validateWalletAddressWithPrompt() {
  const walletInput = document.getElementById('wallet-address');
  const walletValue = walletInput.value.trim();
  const walletConfirm = document.getElementById('wallet-confirm');

  if (!walletValue) {
    showValidationError(walletInput, 'Endereço da carteira é obrigatório');
    return false;
  }

  // Obter a criptomoeda selecionada
  const selectedCrypto = document.querySelector(
    'input[name="crypto-currency"]:checked'
  );
  if (!selectedCrypto) {
    showValidationError(walletInput, 'Selecione uma criptomoeda primeiro');
    return false;
  }

  const cryptoType = selectedCrypto.value;
  let isValid = true;
  let validationMessage = '';

  // Validações específicas por tipo de criptomoeda
  switch (cryptoType) {
    case 'BTC':
      // Validação de carteira Bitcoin (começa com 1, 3, ou bc1)
      if (!/^(1|3|bc1)[a-zA-Z0-9]{25,34}$/.test(walletValue)) {
        validationMessage = 'Endereço de Bitcoin inválido';
        isValid = false;
      }
      break;

    case 'ETH':
      // Validação de carteira Ethereum (começa com 0x)
      if (!/^0x[a-fA-F0-9]{40}$/.test(walletValue)) {
        validationMessage = 'Endereço de Ethereum inválido';
        isValid = false;
      }
      break;

    case 'USDT':
      // USDT pode estar em múltiplas redes, verificar com base na rede selecionada
      const selectedNetwork = document.querySelector(
        'input[name="network"]:checked'
      );
      if (!selectedNetwork) {
        validationMessage = 'Selecione uma rede blockchain';
        isValid = false;
        break;
      }

      const network = selectedNetwork.value;

      if (network === 'ETH' && !/^0x[a-fA-F0-9]{40}$/.test(walletValue)) {
        validationMessage = 'Endereço de USDT na rede Ethereum inválido';
        isValid = false;
      } else if (
        network === 'BSC' &&
        !/^0x[a-fA-F0-9]{40}$/.test(walletValue)
      ) {
        validationMessage = 'Endereço de USDT na rede BSC inválido';
        isValid = false;
      } else if (
        network === 'TRON' &&
        !/^T[A-Za-z1-9]{33}$/.test(walletValue)
      ) {
        validationMessage = 'Endereço de USDT na rede TRON inválido (deve começar com T e ter 34 caracteres)';
        isValid = false;
      }
      break;

    default:
      // Para outros tipos de cripto, apenas verificar comprimento
      if (walletValue.length < 20) {
        validationMessage = 'Endereço de carteira muito curto';
        isValid = false;
      }
  }

  if (!isValid) {
    showValidationError(walletInput, validationMessage);
    walletConfirm.checked = false;
    return false;
  }

  // Se o endereço estiver válido, mostrar confirmação visual
  const warningBox = document.getElementById('wallet-address-warning');
  if (warningBox) {
    warningBox.innerHTML = `
      <div style="background-color: #d4edda; color: #155724; padding: 10px; border-radius: 6px; margin-top: 10px; border-left: 4px solid #28a745; display: flex; align-items: center;">
        <i class="bi bi-check-circle-fill" style="font-size: 1.2rem; margin-right: 10px; color: #28a745;"></i>
        <div>
          <strong>Endereço verificado!</strong><br>
          O formato do endereço ${walletValue.substring(0, 6)}...${walletValue.substring(walletValue.length - 6)} parece válido para ${cryptoType}.
          <br>Por favor, confirme que é seu endereço correto antes de prosseguir.
        </div>
      </div>
    `;
    warningBox.style.display = 'block';
  }

  // Adicionar animação para destacar que o endereço está correto
  walletInput.style.transition = 'all 0.3s ease';
  walletInput.style.borderColor = '#28a745';
  walletInput.style.backgroundColor = 'rgba(40, 167, 69, 0.05)';
  
  // Marcar o checkbox automaticamente, mas o usuário ainda pode desmarcar
  walletConfirm.checked = true;

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

// Funções utilitárias de formatação

// Formatação de moeda (BRL)
function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

// Formatação de data e hora
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

// Verificar se o usuário está autenticado (placeholder para futura implementação)
function isUserAuthenticated() {
  // Esta é uma implementação simplificada
  // Em uma aplicação real, verificaria tokens JWT, cookies, etc.
  return true;
}

// Adicionar o código de navegação entre etapas do conversor

// Função para gerenciar a navegação entre etapas
function setupStepsNavigation() {
  // Referências aos elementos
  const steps = document.querySelectorAll('.conversion-steps .step');
  const stepContents = document.querySelectorAll('.conversion-step');
  
  // Botões de navegação
  const btnCalculate = document.getElementById('btn-calculate');
  const btnBackToStep1 = document.getElementById('btn-back-to-step1');
  const btnProceedToStep3 = document.getElementById('btn-proceed-to-step3');
  const btnBackToStep2 = document.getElementById('btn-back-to-step2');
  const btnCompleteTransaction = document.getElementById('btn-complete-transaction');
  
  // Formulários
  const conversionForm = document.getElementById('conversion-form');
  const walletForm = document.getElementById('wallet-form');
  
  // Função para ir para uma etapa específica
  function goToStep(stepNumber) {
    // Atualizar os indicadores de etapas
    steps.forEach((step, index) => {
      if (index < stepNumber) {
        step.classList.add('completed');
        step.classList.remove('active');
      } else if (index === stepNumber) {
        step.classList.add('active');
        step.classList.remove('completed');
      } else {
        step.classList.remove('active', 'completed');
      }
    });
    
    // Mostrar o conteúdo da etapa correta
    stepContents.forEach((content, index) => {
      if (index === stepNumber) {
        content.classList.add('active');
      } else {
        content.classList.remove('active');
      }
    });
  }
  
  // Configuração dos botões de navegação
  if (btnCalculate) {
    btnCalculate.addEventListener('click', function() {
      // Validar o formulário da primeira etapa
      const amount = document.getElementById('brl-amount').value;
      if (!amount || parseFloat(amount) < 100) {
        alert('Por favor, informe um valor válido (mínimo de R$ 100,00).');
        return;
      }
      
      // Calcular e mostrar o resultado
      calculateAndDisplayResult();
      
      // Ir para a etapa 2 (índice 1)
      goToStep(1);
    });
  }
  
  if (btnBackToStep1) {
    btnBackToStep1.addEventListener('click', function() {
      goToStep(0);
    });
  }
  
  if (btnProceedToStep3) {
    btnProceedToStep3.addEventListener('click', function() {
      // Fazer verificação de KYC aqui se necessário
      const amount = document.getElementById('brl-amount').value;
      
      // Verificar KYC antes de prosseguir
      if (typeof verifyKYCForTransaction === 'function') {
        const kycResult = verifyKYCForTransaction(parseFloat(amount));
        if (!kycResult.approved) {
          // Se a verificação KYC falhar, chamar handleKycUpgrade
          if (typeof handleKycUpgrade === 'function') {
            handleKycUpgrade(kycResult.requiredLevel);
            return;
          }
        }
      }
      
      goToStep(2);
    });
  }
  
  if (btnBackToStep2) {
    btnBackToStep2.addEventListener('click', function() {
      goToStep(1);
    });
  }
  
  if (walletForm) {
    walletForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // Validar o endereço da carteira
      const walletAddress = document.getElementById('wallet-address').value;
      const selectedNetwork = document.querySelector('input[name="network"]:checked').value;
      const walletConfirm = document.getElementById('wallet-confirm').checked;
      const amount = parseFloat(document.getElementById('brl-amount').value);
      
      if (!walletAddress) {
        alert('Por favor, informe o endereço da sua carteira.');
        return;
      }
      
      if (!walletConfirm) {
        alert('Por favor, confirme que o endereço está correto.');
        return;
      }
      
      // Mostrar aviso sobre o endereço
      document.getElementById('wallet-address-warning').style.display = 'block';
      
      // Simular processamento
      btnCompleteTransaction.disabled = true;
      btnCompleteTransaction.innerHTML = '<i class="bi bi-hourglass-split"></i> Processando...';
      
      setTimeout(() => {
        // Mostrar o modal KYC obrigatório antes de completar a transação
        showKYCModal(function() {
          // Esta função será chamada após o KYC ser concluído com sucesso
          showTransactionSuccess();
        });
      }, 1000);
    });
  }
  
  // Adicionar eventos para verificação de endereço
  const walletAddress = document.getElementById('wallet-address');
  if (walletAddress) {
    walletAddress.addEventListener('input', function() {
      if (this.value.length > 0) {
        document.getElementById('wallet-address-warning').style.display = 'block';
      } else {
        document.getElementById('wallet-address-warning').style.display = 'none';
      }
    });
  }
  
  // Função para calcular e exibir o resultado
  function calculateAndDisplayResult() {
    const amount = parseFloat(document.getElementById('brl-amount').value);
    const selectedCrypto = document.querySelector('input[name="crypto-currency"]:checked').value;
    
    // Usar a função getRateForCurrency para obter a cotação consistente
    const rate = getRateForCurrency(selectedCrypto);
    
    // Exibir a cotação atual sendo usada
    console.log(`Usando cotação atual: 1 ${selectedCrypto} = R$ ${rate.toFixed(2)}`);
    
    const iof = amount * 0.0038;
    const serviceFee = amount * 0.06;
    
    // Definir a taxa de rede corretamente - 1 USDT fixo para USDT
    let networkFee;
    if (selectedCrypto === 'USDT') {
      networkFee = 1; // Exatamente 1 USDT
    } else {
      networkFee = selectedCrypto === 'BTC' ? 0.0001 : 0.005; // Valores mais realistas para BTC e ETH
    }
    
    // Calcular o valor líquido em reais
    // Para USDT, usar a mesma taxa obtida acima para consistência
    let networkFeeInBRL;
    if (selectedCrypto === 'USDT') {
      networkFeeInBRL = 1 * rate; // Usar a mesma cotação já obtida
    } else {
      networkFeeInBRL = networkFee * rate;
    }
    
    const totalFees = iof + serviceFee + networkFeeInBRL;
    const netAmount = amount - totalFees;
    const cryptoAmount = netAmount / rate;
    
    // Atualizar os elementos na interface
    document.getElementById('result-brl-amount').textContent = `R$ ${amount.toFixed(2)}`;
    document.getElementById('result-iof').textContent = `- R$ ${iof.toFixed(2)}`;
    document.getElementById('result-service-fee').textContent = `- R$ ${serviceFee.toFixed(2)}`;
    
    // Mostrar a taxa de rede no formato correto (1 USDT ou valor em cripto para outros)
    if (selectedCrypto === 'USDT') {
      document.getElementById('result-network-fee').textContent = `- 1 USDT (aprox. R$ ${networkFeeInBRL.toFixed(2)})`;
    } else {
      document.getElementById('result-network-fee').textContent = `- ${networkFee} ${selectedCrypto} (aprox. R$ ${networkFeeInBRL.toFixed(2)})`;
    }
    
    document.getElementById('result-net-amount').textContent = `R$ ${netAmount.toFixed(2)}`;
    document.getElementById('result-rate').textContent = `R$ ${rate.toFixed(2)}`;
    
    const formattedCryptoAmount = selectedCrypto === 'BTC' ? 
      cryptoAmount.toFixed(8) : 
      cryptoAmount.toFixed(selectedCrypto === 'USDT' ? 2 : 6);
    
    document.getElementById('result-crypto-amount').textContent = `${formattedCryptoAmount} ${selectedCrypto}`;
  }
  
  // Função para mostrar o sucesso da transação
  function showTransactionSuccess() {
    const amount = parseFloat(document.getElementById('brl-amount').value);
    const selectedCrypto = document.querySelector('input[name="crypto-currency"]:checked').value;
    const walletAddress = document.getElementById('wallet-address').value;
    const selectedNetwork = document.querySelector('input[name="network"]:checked').value;
    
    // Criar um elemento para exibir a confirmação
    const successElement = document.createElement('div');
    successElement.className = 'transaction-success';
    successElement.innerHTML = `
      <div class="alert alert-success">
        <h4><i class="bi bi-check-circle-fill"></i> Transação concluída com sucesso!</h4>
        <p>Sua compra foi processada e os fundos serão transferidos para sua carteira.</p>
        <hr>
        <div class="transaction-details">
          <p><strong>ID da transação:</strong> ${generateTransactionId()}</p>
          <p><strong>Valor:</strong> R$ ${amount.toFixed(2)}</p>
          <p><strong>Criptomoeda:</strong> ${selectedCrypto}</p>
          <p><strong>Rede:</strong> ${selectedNetwork}</p>
          <p><strong>Endereço da carteira:</strong> ${walletAddress}</p>
          <p><strong>Data/hora:</strong> ${new Date().toLocaleString('pt-BR')}</p>
        </div>
        <hr>
        <p>Você receberá um e-mail com os detalhes desta transação.</p>
        <div class="d-grid gap-2">
          <button id="btn-new-conversion" class="btn primary">Nova Conversão</button>
        </div>
      </div>
    `;
    
    // Substituir o conteúdo da etapa 3
    const step3Content = document.getElementById('step-pagamento');
    step3Content.innerHTML = '';
    step3Content.appendChild(successElement);
    
    // Adicionar evento para o botão de nova conversão
    document.getElementById('btn-new-conversion').addEventListener('click', function() {
      // Recarregar a página para começar novamente
      window.location.reload();
    });
  }
  
  // Função para gerar um ID de transação aleatório
  function generateTransactionId() {
    return 'TX' + Math.random().toString(36).substr(2, 9).toUpperCase();
  }
}

// Função para validar CPF
function validarCPF(cpf) {
  // Remover caracteres não numéricos
  cpf = cpf.replace(/[^\d]/g, '');
  
  // Verificar se tem 11 dígitos
  if (cpf.length !== 11) return false;
  
  // Verificar se todos os dígitos são iguais (CPF inválido, mas formalmente válido)
  if (/^(\d)\1{10}$/.test(cpf)) return false;
  
  // Validação do primeiro dígito verificador
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cpf.charAt(i)) * (10 - i);
  }
  let resto = 11 - (soma % 11);
  let digitoVerificador1 = resto === 10 || resto === 11 ? 0 : resto;
  
  if (digitoVerificador1 !== parseInt(cpf.charAt(9))) return false;
  
  // Validação do segundo dígito verificador
  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cpf.charAt(i)) * (11 - i);
  }
  resto = 11 - (soma % 11);
  let digitoVerificador2 = resto === 10 || resto === 11 ? 0 : resto;
  
  return digitoVerificador2 === parseInt(cpf.charAt(10));
}

// Adicionar uma nova função para exibir o modal KYC
function showKYCModal(onSuccess) {
  // Remover qualquer modal existente primeiro
  const existingModal = document.querySelector('.kyc-modal');
  if (existingModal) {
    document.body.removeChild(existingModal);
  }

  // Criar o modal de KYC com design melhorado
  const modal = document.createElement('div');
  modal.className = 'kyc-modal';
  modal.style.position = 'fixed';
  modal.style.top = '0';
  modal.style.left = '0';
  modal.style.width = '100%';
  modal.style.height = '100%';
  modal.style.backgroundColor = 'rgba(0, 0, 0, 0.85)';
  modal.style.zIndex = '9999';
  modal.style.display = 'flex';
  modal.style.justifyContent = 'center';
  modal.style.alignItems = 'center';
  modal.style.overflow = 'auto';
  modal.style.padding = '20px 0';
  
  modal.innerHTML = `
    <div class="kyc-modal-content" style="background: white; border-radius: 12px; width: 90%; max-width: 650px; padding: 0; box-shadow: 0 10px 25px rgba(0,0,0,0.5); overflow: hidden; animation: modalFadeIn 0.3s ease;">
      <div class="kyc-modal-header" style="background: linear-gradient(135deg, #5d5fef, #4749d4); color: white; padding: 25px; display: flex; justify-content: space-between; align-items: center;">
        <h2 style="margin: 0; font-size: 1.7rem; font-weight: 600;">Verificação de Identidade (KYC)</h2>
        <button class="kyc-modal-close" style="background: rgba(255,255,255,0.2); border: none; color: white; font-size: 24px; cursor: pointer; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease;">&times;</button>
      </div>
      <div class="kyc-modal-body" style="padding: 30px; max-height: 70vh; overflow-y: auto;">
        <!-- Indicador de progresso do KYC -->
        <div id="kyc-progress" style="margin-bottom: 25px; display: flex; position: relative;">
          <div style="display: flex; width: 100%; justify-content: space-between; position: relative; z-index: 2;">
            <div class="progress-step" data-step="1" style="display: flex; flex-direction: column; align-items: center; position: relative; width: 25%;">
              <div style="width: 40px; height: 40px; border-radius: 50%; background: #5d5fef; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-bottom: 8px;">1</div>
              <span style="font-size: 0.9rem; text-align: center; font-weight: 500;">Dados Básicos</span>
            </div>
            <div class="progress-step" data-step="2" style="display: flex; flex-direction: column; align-items: center; position: relative; width: 25%;">
              <div style="width: 40px; height: 40px; border-radius: 50%; background: #e9ecef; color: #495057; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-bottom: 8px;">2</div>
              <span style="font-size: 0.9rem; text-align: center; color: #6c757d; font-weight: 500;">Verificação Email</span>
            </div>
            <div class="progress-step" data-step="3" style="display: flex; flex-direction: column; align-items: center; position: relative; width: 25%;">
              <div style="width: 40px; height: 40px; border-radius: 50%; background: #e9ecef; color: #495057; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-bottom: 8px;">3</div>
              <span style="font-size: 0.9rem; text-align: center; color: #6c757d; font-weight: 500;">Análise Docs</span>
            </div>
            <div class="progress-step" data-step="4" style="display: flex; flex-direction: column; align-items: center; position: relative; width: 25%;">
              <div style="width: 40px; height: 40px; border-radius: 50%; background: #e9ecef; color: #495057; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-bottom: 8px;">4</div>
              <span style="font-size: 0.9rem; text-align: center; color: #6c757d; font-weight: 500;">Aprovação</span>
            </div>
          </div>
          <div style="position: absolute; height: 4px; background: #e9ecef; top: 20px; width: 100%; z-index: 1;"></div>
          <div id="progress-bar" style="position: absolute; height: 4px; background: #5d5fef; top: 20px; width: 0%; z-index: 1; transition: width 0.3s ease;"></div>
        </div>

        <div class="alert alert-warning" style="background: #fff3cd; color: #856404; padding: 15px; border-radius: 8px; margin-bottom: 25px; border-left: 5px solid #ffc107; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
          <strong style="font-size: 1.1rem; display: block; margin-bottom: 5px;">Atenção:</strong>
          <p style="margin: 0;">Para finalizar sua transação, é necessário completar a verificação KYC conforme exigido pelas regulamentações brasileiras.</p>
        </div>
        
        <!-- Container para as etapas -->
        <div id="kyc-steps-container">
          <!-- Etapa 1: Formulário de dados -->
          <div id="kyc-step-1" class="kyc-step active">
            <form id="kyc-form" style="display: grid; grid-gap: 20px;">
              <!-- Email (NOVO) -->
              <div class="form-group">
                <label for="kyc-email" style="display: block; margin-bottom: 8px; font-weight: 600; color: #333;">Email</label>
                <input type="email" id="kyc-email" class="form-control" required style="width: 100%; padding: 12px 15px; border: 1px solid #ced4da; border-radius: 8px; font-size: 16px; transition: border-color 0.2s ease;">
                <div id="email-feedback" style="display: none; margin-top: 8px; font-size: 14px;"></div>
              </div>
              
              <!-- Dados pessoais -->
              <div class="form-group">
                <label for="kyc-name" style="display: block; margin-bottom: 8px; font-weight: 600; color: #333;">Nome Completo</label>
                <input type="text" id="kyc-name" class="form-control" required style="width: 100%; padding: 12px 15px; border: 1px solid #ced4da; border-radius: 8px; font-size: 16px; transition: border-color 0.2s ease;">
              </div>
              
              <div class="form-group">
                <label for="kyc-cpf" style="display: block; margin-bottom: 8px; font-weight: 600; color: #333;">CPF</label>
                <input type="text" id="kyc-cpf" placeholder="000.000.000-00" required style="width: 100%; padding: 12px 15px; border: 1px solid #ced4da; border-radius: 8px; font-size: 16px; transition: border-color 0.2s ease;">
                <div id="cpf-feedback" style="display: none; margin-top: 8px; font-size: 14px;"></div>
              </div>
              
              <div class="form-group">
                <label for="kyc-birthdate" style="display: block; margin-bottom: 8px; font-weight: 600; color: #333;">Data de Nascimento</label>
                <input type="date" id="kyc-birthdate" required style="width: 100%; padding: 12px 15px; border: 1px solid #ced4da; border-radius: 8px; font-size: 16px; transition: border-color 0.2s ease;">
              </div>
              
              <div class="form-group">
                <label for="kyc-phone" style="display: block; margin-bottom: 8px; font-weight: 600; color: #333;">Telefone</label>
                <input type="text" id="kyc-phone" placeholder="(00) 00000-0000" required style="width: 100%; padding: 12px 15px; border: 1px solid #ced4da; border-radius: 8px; font-size: 16px; transition: border-color 0.2s ease;">
                <div id="phone-feedback" style="display: none; margin-top: 8px; font-size: 14px;"></div>
              </div>
              
              <div class="form-group" style="background: #e7f5ff; padding: 15px; border-radius: 8px; margin-top: 10px;">
                <div style="margin-bottom: 5px;">
                  <input type="checkbox" id="kyc-terms" required style="margin-right: 10px; width: 18px; height: 18px; vertical-align: middle;">
                  <label for="kyc-terms" style="font-weight: 500; vertical-align: middle;">Confirmo que todas as informações são verdadeiras e concordo com os <a href="#" style="color: #5d5fef; text-decoration: none;">Termos e Condições</a></label>
                </div>
              </div>
              
              <div style="display: flex; justify-content: space-between; margin-top: 15px;">
                <button type="button" id="kyc-cancel" class="btn secondary" style="padding: 14px 24px; border-radius: 8px; background: #adb5bd; color: white; border: none; font-weight: 600; cursor: pointer; min-width: 120px;">Cancelar</button>
                <button type="submit" id="kyc-submit" class="btn primary" style="padding: 14px 24px; border-radius: 8px; background: #5d5fef; color: white; border: none; font-weight: 600; cursor: pointer; min-width: 180px; box-shadow: 0 4px 10px rgba(93, 95, 239, 0.3);">Continuar</button>
              </div>
            </form>
          </div>

          <!-- Etapa 2: Verificação de Email (NOVA) -->
          <div id="kyc-step-2" class="kyc-step" style="display: none;">
            <div style="text-align: center; padding: 20px 0 30px;">
              <div style="margin-bottom: 20px;">
                <img src="assets/img/email-verification.svg" alt="Verificação de Email" style="width: 120px; height: auto;" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMjAiIGhlaWdodD0iMTIwIiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzU3NWZlZiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxyZWN0IHg9IjIiIHk9IjQiIHdpZHRoPSIyMCIgaGVpZ2h0PSIxNiIgcng9IjIiPjwvcmVjdD48cGF0aCBkPSJtMjIgNy00IDQtNCAwLTItMi0yIDItNSAwLTMtNCI+PC9wYXRoPjwvc3ZnPg==';">
              </div>
              <h3 style="margin-bottom: 15px; color: #333; font-size: 1.5rem;">Verificação de Email</h3>
              <p style="color: #6c757d; margin-bottom: 20px; max-width: 450px; margin-left: auto; margin-right: auto;">Enviamos um código de 6 dígitos para o seu email. Por favor, confira sua caixa de entrada e insira o código abaixo para continuar.</p>
              
              <div style="max-width: 350px; margin: 0 auto; text-align: left;">
                <div style="display: flex; flex-direction: column; gap: 15px;">
                  <div id="verification-info" style="font-size: 0.9rem; color: #495057;">
                    <strong>Email:</strong> <span id="verification-email"></span>
                  </div>
                  
                  <div style="margin-bottom: 10px;">
                    <label for="email-code" style="display: block; margin-bottom: 8px; font-weight: 600; color: #333; text-align: left;">Código de Verificação</label>
                    <div style="display: flex; gap: 10px;">
                      <input type="text" id="email-code" class="form-control" required maxlength="6" placeholder="000000" pattern="[0-9]{6}" style="width: 100%; padding: 12px 15px; border: 1px solid #ced4da; border-radius: 8px; font-size: 16px; letter-spacing: 5px; text-align: center; transition: border-color 0.2s ease;">
                    </div>
                    <div id="code-feedback" style="display: none; margin-top: 8px; font-size: 14px;"></div>
                  </div>
                  
                  <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 5px;">
                    <button id="resend-code" style="background: none; border: none; color: #5d5fef; font-weight: 500; cursor: pointer; padding: 0; font-size: 0.9rem;">Reenviar código</button>
                    <div id="countdown" style="font-size: 0.9rem; color: #6c757d;">Aguarde: 02:00</div>
                  </div>
                </div>
              </div>
              
              <div style="display: flex; justify-content: space-between; margin-top: 30px;">
                <button type="button" id="email-back" class="btn secondary" style="padding: 14px 24px; border-radius: 8px; background: #adb5bd; color: white; border: none; font-weight: 600; cursor: pointer; min-width: 120px;">Voltar</button>
                <button type="button" id="email-verify" class="btn primary" style="padding: 14px 24px; border-radius: 8px; background: #5d5fef; color: white; border: none; font-weight: 600; cursor: pointer; min-width: 180px; box-shadow: 0 4px 10px rgba(93, 95, 239, 0.3);">Verificar</button>
              </div>
            </div>
          </div>

          <!-- Etapa 3: Análise Automática (era a etapa 2 antes) -->
          <div id="kyc-step-3" class="kyc-step" style="display: none;">
            <div style="text-align: center; padding: 30px 0;">
              <div id="analysis-animation" style="margin-bottom: 30px;">
                <div style="width: 80px; height: 80px; border: 4px solid rgba(93, 95, 239, 0.2); border-radius: 50%; border-top-color: #5d5fef; margin: 0 auto; animation: rotate 1s linear infinite;"></div>
              </div>
              <h3 style="margin-bottom: 15px; color: #333; font-size: 1.5rem;">Análise em Andamento</h3>
              <p style="color: #6c757d; margin-bottom: 25px;">Estamos verificando seus documentos e informações. Este processo pode levar alguns instantes.</p>
              
              <!-- Seleção do tipo de documento -->
              <div class="form-group" style="margin: 30px auto; max-width: 500px; text-align: left;">
                <label style="display: block; margin-bottom: 15px; font-weight: 600; color: #333; font-size: 1.1rem;">Tipo de Documento</label>
                <div style="display: flex; gap: 15px; flex-wrap: wrap;">
                  <label style="display: flex; align-items: center; padding: 12px 15px; border: 2px solid #e9ecef; border-radius: 8px; cursor: pointer; transition: all 0.2s ease; width: calc(50% - 8px);">
                    <input type="radio" name="document-type" value="rg" checked style="margin-right: 10px;">
                    <div>
                      <strong style="display: block;">RG (Identidade)</strong>
                      <span style="font-size: 0.85rem; color: #6c757d;">Frente e verso do documento</span>
                    </div>
                  </label>
                  
                  <label style="display: flex; align-items: center; padding: 12px 15px; border: 2px solid #e9ecef; border-radius: 8px; cursor: pointer; transition: all 0.2s ease; width: calc(50% - 8px);">
                    <input type="radio" name="document-type" value="cnh" style="margin-right: 10px;">
                    <div>
                      <strong style="display: block;">CNH (Habilitação)</strong>
                      <span style="font-size: 0.85rem; color: #6c757d;">Documento atual dentro da validade</span>
                    </div>
                  </label>
                </div>
              </div>
              
              <!-- Upload de documentos -->
              <div class="form-group" style="margin: 30px auto; max-width: 500px; text-align: left;">
                <label style="display: block; margin-bottom: 15px; font-weight: 600; color: #333; font-size: 1.1rem;">Envio de Documentos</label>
                <div style="border: 1px solid #ced4da; border-radius: 8px; padding: 20px; margin-bottom: 15px; background: #f8f9fa;">
                  <!-- Frente do documento (varia conforme seleção) -->
                  <div style="margin-bottom: 20px;">
                    <label id="front-doc-label" style="display: block; margin-bottom: 8px; font-weight: 500;">Frente do Documento</label>
                    <div style="display: flex; align-items: center;">
                      <input type="file" id="kyc-doc-front" required style="flex: 1; padding: 10px 0;">
                      <button type="button" style="background: #f1f3f5; border: 1px solid #ced4da; padding: 8px 12px; border-radius: 4px; margin-left: 10px; cursor: pointer;">Anexar</button>
                    </div>
                  </div>
                  
                  <!-- Verso do documento (varia conforme seleção) -->
                  <div style="margin-bottom: 20px;">
                    <label id="back-doc-label" style="display: block; margin-bottom: 8px; font-weight: 500;">Verso do Documento</label>
                    <div style="display: flex; align-items: center;">
                      <input type="file" id="kyc-doc-back" required style="flex: 1; padding: 10px 0;">
                      <button type="button" style="background: #f1f3f5; border: 1px solid #ced4da; padding: 8px 12px; border-radius: 4px; margin-left: 10px; cursor: pointer;">Anexar</button>
                    </div>
                  </div>
                </div>
                
                <button type="button" id="doc-submit" class="btn primary" style="width: 100%; padding: 14px 24px; border-radius: 8px; background: #5d5fef; color: white; border: none; font-weight: 600; cursor: pointer; box-shadow: 0 4px 10px rgba(93, 95, 239, 0.3); margin-top: 15px;">Enviar Documentos</button>
              </div>
              
              <div id="analysis-steps" style="text-align: left; max-width: 400px; margin: 0 auto; display: none;">
                <div class="analysis-step pending" data-step="verify-cpf" style="display: flex; align-items: center; margin-bottom: 15px;">
                  <div style="width: 24px; height: 24px; border-radius: 50%; border: 2px solid #adb5bd; margin-right: 15px; display: flex; align-items: center; justify-content: center;">
                    <span style="opacity: 0;">✓</span>
                  </div>
                  <span style="color: #495057;">Verificando CPF</span>
                </div>
                <div class="analysis-step pending" data-step="validate-document" style="display: flex; align-items: center; margin-bottom: 15px;">
                  <div style="width: 24px; height: 24px; border-radius: 50%; border: 2px solid #adb5bd; margin-right: 15px; display: flex; align-items: center; justify-content: center;">
                    <span style="opacity: 0;">✓</span>
                  </div>
                  <span style="color: #495057;">Validando documento</span>
                </div>
                <div class="analysis-step pending" data-step="check-age" style="display: flex; align-items: center; margin-bottom: 15px;">
                  <div style="width: 24px; height: 24px; border-radius: 50%; border: 2px solid #adb5bd; margin-right: 15px; display: flex; align-items: center; justify-content: center;">
                    <span style="opacity: 0;">✓</span>
                  </div>
                  <span style="color: #495057;">Verificando maioridade</span>
                </div>
                <div class="analysis-step pending" data-step="check-risk" style="display: flex; align-items: center; margin-bottom: 15px;">
                  <div style="width: 24px; height: 24px; border-radius: 50%; border: 2px solid #adb5bd; margin-right: 15px; display: flex; align-items: center; justify-content: center;">
                    <span style="opacity: 0;">✓</span>
                  </div>
                  <span style="color: #495057;">Verificando fatores de risco</span>
                </div>
                <div class="analysis-step pending" data-step="final-review" style="display: flex; align-items: center;">
                  <div style="width: 24px; height: 24px; border-radius: 50%; border: 2px solid #adb5bd; margin-right: 15px; display: flex; align-items: center; justify-content: center;">
                    <span style="opacity: 0;">✓</span>
                  </div>
                  <span style="color: #495057;">Revisão final</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Etapa 4: Aprovação (era a etapa 3 antes) -->
          <div id="kyc-step-4" class="kyc-step" style="display: none;">
            <div style="text-align: center; padding: 30px 0;">
              <div style="margin-bottom: 30px; animation: scaleIn 0.5s ease;">
                <div style="width: 100px; height: 100px; background-color: #10b981; border-radius: 50%; margin: 0 auto; display: flex; align-items: center; justify-content: center;">
                  <span style="color: white; font-size: 50px;">✓</span>
                </div>
              </div>
              <h3 style="margin-bottom: 15px; color: #333; font-size: 1.5rem;">Verificação Aprovada!</h3>
              <p style="color: #6c757d; margin-bottom: 25px;">Seu KYC foi verificado com sucesso. Você já pode continuar com suas transações.</p>
              
              <div style="background: #e7f5ff; padding: 20px; border-radius: 8px; text-align: left; margin-bottom: 25px;">
                <h4 style="margin-bottom: 15px; color: #1864ab; font-size: 1.1rem;">Detalhes da Verificação</h4>
                <div style="display: flex; margin-bottom: 10px;">
                  <div style="width: 150px; color: #1864ab; font-weight: 500;">Nome:</div>
                  <div id="verification-name" style="flex: 1;"></div>
                </div>
                <div style="display: flex; margin-bottom: 10px;">
                  <div style="width: 150px; color: #1864ab; font-weight: 500;">CPF:</div>
                  <div id="verification-cpf" style="flex: 1;"></div>
                </div>
                <div style="display: flex; margin-bottom: 10px;">
                  <div style="width: 150px; color: #1864ab; font-weight: 500;">Email:</div>
                  <div id="verification-email-confirmed" style="flex: 1;"></div>
                </div>
                <div style="display: flex; margin-bottom: 10px;">
                  <div style="width: 150px; color: #1864ab; font-weight: 500;">Nível de KYC:</div>
                  <div style="flex: 1;">Nível 2 - Verificado</div>
                </div>
                <div style="display: flex; margin-bottom: 10px;">
                  <div style="width: 150px; color: #1864ab; font-weight: 500;">Data de Aprovação:</div>
                  <div style="flex: 1;" id="verification-date"></div>
                </div>
                <div style="display: flex;">
                  <div style="width: 150px; color: #1864ab; font-weight: 500;">ID de Verificação:</div>
                  <div style="flex: 1;" id="verification-id"></div>
                </div>
              </div>
              
              <div style="display: flex; justify-content: center;">
                <button id="kyc-continue" class="btn primary" style="padding: 14px 24px; border-radius: 8px; background: #5d5fef; color: white; border: none; font-weight: 600; cursor: pointer; min-width: 220px; box-shadow: 0 4px 10px rgba(93, 95, 239, 0.3);">Continuar Transação</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Adicionar estilos para animação
  const style = document.createElement('style');
  style.textContent = `
    @keyframes modalFadeIn {
      from { opacity: 0; transform: translateY(-20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes rotate {
      to { transform: rotate(360deg); }
    }
    @keyframes scaleIn {
      from { transform: scale(0.8); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
    .kyc-modal-content {
      animation: modalFadeIn 0.3s ease;
    }
    .kyc-modal input:focus {
      outline: none;
      border-color: #5d5fef !important;
      box-shadow: 0 0 0 3px rgba(93, 95, 239, 0.25);
    }
    .kyc-modal-close:hover {
      background: rgba(255,255,255,0.3) !important;
    }
    #kyc-submit:hover {
      background: #4749d4 !important;
    }
    #kyc-cancel:hover {
      background: #868e96 !important;
    }
    #kyc-continue:hover {
      background: #4749d4 !important;
    }
    input[name="document-type"]:checked + div {
      color: #5d5fef;
    }
    input[name="document-type"]:checked + div strong {
      color: #5d5fef;
    }
    input[name="document-type"]:checked {
      accent-color: #5d5fef;
    }
    input[name="document-type"]:checked ~ label {
      border-color: #5d5fef;
      background-color: rgba(93, 95, 239, 0.05);
    }
    .analysis-step.complete .step-indicator {
      background-color: #10b981;
      border-color: #10b981;
    }
    .analysis-step.complete span {
      color: #047857;
      font-weight: 500;
    }
  `;
  document.head.appendChild(style);

  document.body.appendChild(modal);
  
  // Focar no primeiro campo ao abrir o modal
  setTimeout(() => {
    document.getElementById('kyc-name')?.focus();
  }, 300);
  
  // Configurar a validação do CPF
  const cpfInput = document.getElementById('kyc-cpf');
  if (cpfInput) {
    // Adicionar máscara
    cpfInput.addEventListener('input', function(e) {
      let value = e.target.value.replace(/\D/g, '');
      if (value.length > 11) value = value.substring(0, 11);
      if (value.length > 9) {
        e.target.value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
      } else if (value.length > 6) {
        e.target.value = value.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
      } else if (value.length > 3) {
        e.target.value = value.replace(/(\d{3})(\d{1,3})/, '$1.$2');
      } else {
        e.target.value = value;
      }
    });
    
    // Validar CPF quando o campo perder o foco
    cpfInput.addEventListener('blur', function() {
      const cpfValue = this.value.replace(/\D/g, '');
      const feedbackElement = document.getElementById('cpf-feedback');
      
      if (cpfValue.length === 11) {
        if (validarCPF(cpfValue)) {
          // CPF válido
          feedbackElement.style.display = 'block';
          feedbackElement.style.color = '#047857';
          feedbackElement.innerHTML = '<i class="bi bi-check-circle-fill" style="margin-right: 5px;"></i> CPF válido';
          this.style.borderColor = '#10b981';
          this.style.backgroundColor = 'rgba(16, 185, 129, 0.05)';
        } else {
          // CPF inválido
          feedbackElement.style.display = 'block';
          feedbackElement.style.color = '#e11d48';
          feedbackElement.innerHTML = '<i class="bi bi-exclamation-circle-fill" style="margin-right: 5px;"></i> CPF inválido';
          this.style.borderColor = '#ef4444';
          this.style.backgroundColor = 'rgba(239, 68, 68, 0.05)';
        }
      } else if (cpfValue.length > 0) {
        // CPF incompleto
        feedbackElement.style.display = 'block';
        feedbackElement.style.color = '#f59e0b';
        feedbackElement.innerHTML = '<i class="bi bi-exclamation-triangle-fill" style="margin-right: 5px;"></i> CPF incompleto';
        this.style.borderColor = '#f59e0b';
        this.style.backgroundColor = 'rgba(245, 158, 11, 0.05)';
      } else {
        // Campo vazio
        feedbackElement.style.display = 'none';
        this.style.borderColor = '#ced4da';
        this.style.backgroundColor = 'white';
      }
    });
  }
  
  // Controlar a seleção do tipo de documento
  const docTypeRadios = modal.querySelectorAll('input[name="document-type"]');
  docTypeRadios.forEach(radio => {
    radio.addEventListener('change', function() {
      // Atualizar os labels e instruções conforme o tipo de documento
      const frontLabel = document.getElementById('front-doc-label');
      const backLabel = document.getElementById('back-doc-label');
      
      if (this.value === 'rg') {
        if (frontLabel) frontLabel.textContent = 'RG - Frente';
        if (backLabel) backLabel.textContent = 'RG - Verso';
      } else if (this.value === 'cnh') {
        if (frontLabel) frontLabel.textContent = 'CNH - Frente';
        if (backLabel) backLabel.textContent = 'CNH - Verso';
      }
      
      // Destacar o selecionado visualmente
      docTypeRadios.forEach(r => {
        const parent = r.closest('label');
        if (parent) {
          if (r.checked) {
            parent.style.borderColor = '#5d5fef';
            parent.style.backgroundColor = 'rgba(93, 95, 239, 0.05)';
          } else {
            parent.style.borderColor = '#e9ecef';
            parent.style.backgroundColor = 'transparent';
          }
        }
      });
    });
    
    // Configurar o estado inicial
    if (radio.checked) {
      const parent = radio.closest('label');
      if (parent) {
        parent.style.borderColor = '#5d5fef';
        parent.style.backgroundColor = 'rgba(93, 95, 239, 0.05)';
      }
    }
  });
  
  // Não permitir fechar o modal (KYC obrigatório)
  const closeButton = modal.querySelector('.kyc-modal-close');
  const cancelButton = modal.querySelector('#kyc-cancel');
  
  closeButton.addEventListener('click', function() {
    // Apenas mostra uma mensagem, mas não permite fechar
    alert('É necessário completar a verificação KYC para prosseguir com a transação.');
  });
  
  cancelButton.addEventListener('click', function() {
    // Apenas mostra uma mensagem, mas não permite fechar
    alert('É necessário completar a verificação KYC para prosseguir com a transação.');
  });

  // Processar o formulário de KYC
  const kycForm = modal.querySelector('#kyc-form');
  kycForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Verificar se todos os campos foram preenchidos
    const email = document.getElementById('kyc-email').value.trim();
    const name = document.getElementById('kyc-name').value;
    const cpf = document.getElementById('kyc-cpf').value.replace(/\D/g, '');
    const birthdate = document.getElementById('kyc-birthdate').value;
    const phone = document.getElementById('kyc-phone').value;
    const terms = document.getElementById('kyc-terms').checked;
    
    // Validações
    if (!email || !name || !cpf || !birthdate || !phone || !terms) {
      alert('Por favor, preencha todos os campos.');
      return;
    }
    
    // Validar formato de email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      alert('Por favor, informe um email válido.');
      document.getElementById('kyc-email').focus();
      return;
    }
    
    // Validar CPF
    if (!validarCPF(cpf)) {
      alert('Por favor, informe um CPF válido.');
      document.getElementById('kyc-cpf').focus();
      return;
    }
    
    // Validar formato de telefone brasileiro
    const phoneDigits = phone.replace(/\D/g, '');
    if (!(/^([1-9]{2})(9[0-9]{8}|[1-8][0-9]{7})$/.test(phoneDigits))) {
      alert('Por favor, informe um número de telefone válido.');
      document.getElementById('kyc-phone').focus();
      return;
    }
    
    // Salvar email para uso posterior
    userEmail = email;
    
    // Gerar código aleatório para verificação (em produção, seria enviado por email)
    verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    console.log('Código de verificação:', verificationCode); // Apenas para desenvolvimento
    
    // Exibir email na tela de verificação
    document.getElementById('verification-email').textContent = email;
    
    // Avançar para a etapa 2 (Verificação Email)
    goToKYCStep(2);
    
    // Iniciar contador regressivo para reenvio
    startEmailVerificationCountdown();
  });
  
  // Função para iniciar contador de reenvio de código
  let countdownInterval = null;
  function startEmailVerificationCountdown() {
    // Limpar intervalo existente, se houver
    if (countdownInterval) {
      clearInterval(countdownInterval);
    }
    
    // Desativar botão de reenvio
    const resendButton = document.getElementById('resend-code');
    if (resendButton) {
      resendButton.disabled = true;
      resendButton.style.color = '#adb5bd';
      resendButton.style.cursor = 'not-allowed';
    }
    
    // Configurar contador regressivo de 2 minutos
    let timeLeft = 120; // 2 minutos em segundos
    const countdownElement = document.getElementById('countdown');
    
    countdownInterval = setInterval(() => {
      timeLeft--;
      const minutes = Math.floor(timeLeft / 60);
      const seconds = timeLeft % 60;
      
      if (countdownElement) {
        countdownElement.textContent = `Aguarde: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      }
      
      if (timeLeft <= 0) {
        clearInterval(countdownInterval);
        if (resendButton) {
          resendButton.disabled = false;
          resendButton.style.color = '#5d5fef';
          resendButton.style.cursor = 'pointer';
        }
        if (countdownElement) {
          countdownElement.textContent = 'Reenvio disponível';
        }
      }
    }, 1000);
  }
  
  // Configurar botão de reenvio de código
  const resendButton = document.getElementById('resend-code');
  if (resendButton) {
    resendButton.addEventListener('click', function() {
      if (this.disabled) return;
      
      // Gerar novo código
      verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      console.log('Novo código de verificação:', verificationCode); // Apenas para desenvolvimento
      
      // Mostrar mensagem de sucesso
      const codeFeedback = document.getElementById('code-feedback');
      if (codeFeedback) {
        codeFeedback.style.display = 'block';
        codeFeedback.style.color = '#047857';
        codeFeedback.innerHTML = '<i class="bi bi-check-circle-fill" style="margin-right: 5px;"></i> Novo código enviado para seu email';
        
        // Esconder após 5 segundos
        setTimeout(() => {
          codeFeedback.style.display = 'none';
        }, 5000);
      }
      
      // Reiniciar o contador
      startEmailVerificationCountdown();
    });
  }
  
  // Voltar para a etapa 1
  const emailBackButton = document.getElementById('email-back');
  if (emailBackButton) {
    emailBackButton.addEventListener('click', function() {
      goToKYCStep(1);
      
      // Limpar código e intervalo
      verificationCode = null;
      if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
      }
    });
  }
  
  // Verificar código de email
  const emailVerifyButton = document.getElementById('email-verify');
  if (emailVerifyButton) {
    emailVerifyButton.addEventListener('click', function() {
      const codeInput = document.getElementById('email-code');
      const enteredCode = codeInput.value.trim();
      const codeFeedback = document.getElementById('code-feedback');
      
      if (!enteredCode) {
        if (codeFeedback) {
          codeFeedback.style.display = 'block';
          codeFeedback.style.color = '#f59e0b';
          codeFeedback.innerHTML = '<i class="bi bi-exclamation-triangle-fill" style="margin-right: 5px;"></i> Por favor, digite o código de verificação';
        }
        return;
      }
      
      // Verificar se o código está correto
      if (enteredCode === verificationCode) {
        // Código correto
        if (codeFeedback) {
          codeFeedback.style.display = 'block';
          codeFeedback.style.color = '#047857';
          codeFeedback.innerHTML = '<i class="bi bi-check-circle-fill" style="margin-right: 5px;"></i> Código verificado com sucesso!';
        }
        
        // Avançar para a próxima etapa após um pequeno delay
        setTimeout(() => {
          goToKYCStep(3);
          
          // Limpar intervalo
          if (countdownInterval) {
            clearInterval(countdownInterval);
            countdownInterval = null;
          }
        }, 1000);
      } else {
        // Código incorreto
        if (codeFeedback) {
          codeFeedback.style.display = 'block';
          codeFeedback.style.color = '#e11d48';
          codeFeedback.innerHTML = '<i class="bi bi-exclamation-circle-fill" style="margin-right: 5px;"></i> Código incorreto. Verifique e tente novamente';
        }
        
        // Destacar campo com erro
        codeInput.style.borderColor = '#ef4444';
        codeInput.style.backgroundColor = 'rgba(239, 68, 68, 0.05)';
        
        // Limpar estilo após 2 segundos
        setTimeout(() => {
          codeInput.style.borderColor = '#ced4da';
          codeInput.style.backgroundColor = 'white';
        }, 2000);
      }
    });
  }
  
  // Configurar campo de código de verificação para aceitar apenas números
  const codeInput = document.getElementById('email-code');
  if (codeInput) {
    codeInput.addEventListener('input', function() {
      this.value = this.value.replace(/\D/g, '');
    });
    
    // Verificar automaticamente quando 6 dígitos forem digitados
    codeInput.addEventListener('input', function() {
      if (this.value.length === 6) {
        emailVerifyButton.click();
      }
    });
  }
  
  // Enviar documentos
  const docSubmitButton = document.getElementById('doc-submit');
  if (docSubmitButton) {
    docSubmitButton.addEventListener('click', function() {
      const frontDoc = document.getElementById('kyc-doc-front').files.length;
      const backDoc = document.getElementById('kyc-doc-back').files.length;
      
      if (!frontDoc || !backDoc) {
        alert('Por favor, anexe todos os documentos requeridos.');
        return;
      }
      
      // Esconder área de upload
      document.querySelector('.form-group').style.display = 'none';
      
      // Mostrar etapas de análise
      document.getElementById('analysis-steps').style.display = 'block';
      
      // Iniciar a simulação do processo de análise
      simulateKYCAnalysis(
        document.getElementById('kyc-name').value,
        document.getElementById('kyc-cpf').value,
        document.querySelector('input[name="document-type"]:checked').value,
        function() {
          // Atualizar dados na página de aprovação
          document.getElementById('verification-name').textContent = document.getElementById('kyc-name').value;
          document.getElementById('verification-cpf').textContent = document.getElementById('kyc-cpf').value;
          document.getElementById('verification-email-confirmed').textContent = userEmail;
          document.getElementById('verification-date').textContent = new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR');
          document.getElementById('verification-id').textContent = 'KYC-' + Math.random().toString(36).substring(2, 10).toUpperCase();
          
          // Chamar callback de sucesso quando o botão continuar for clicado
          const continueButton = document.getElementById('kyc-continue');
          if (continueButton) {
            continueButton.addEventListener('click', function() {
              // Remover o modal
              document.body.removeChild(modal);
              
              // Chamar o callback de sucesso
              if (typeof onSuccess === 'function') {
                onSuccess();
              }
            });
          }
        }
      );
    });
  }

  // ... existing code ...

  // Função para navegar entre etapas
  function goToKYCStep(step) {
    // Atualizar a barra de progresso
    const progressBar = document.getElementById('progress-bar');
    if (progressBar) {
      progressBar.style.width = ((step - 1) / 3 * 100) + '%';
    }
    
    // Atualizar indicadores de etapa
    const steps = document.querySelectorAll('.progress-step');
    
    steps.forEach((s, index) => {
      const stepNumber = index + 1;
      const circle = s.querySelector('div');
      const text = s.querySelector('span');
      
      if (stepNumber < step) {
        // Etapa anterior
        circle.style.backgroundColor = '#10b981';
        circle.innerHTML = '✓';
        text.style.color = '#333';
        text.style.fontWeight = '500';
      } else if (stepNumber === step) {
        // Etapa atual
        circle.style.backgroundColor = '#5d5fef';
        circle.innerHTML = stepNumber;
        text.style.color = '#333';
        text.style.fontWeight = '500';
      } else {
        // Etapa futura
        circle.style.backgroundColor = '#e9ecef';
        circle.innerHTML = stepNumber;
        text.style.color = '#6c757d';
      }
    });
    
    // Esconder todas as etapas e mostrar apenas a atual
    document.querySelectorAll('.kyc-step').forEach((stepElement, index) => {
      stepElement.style.display = index + 1 === step ? 'block' : 'none';
    });
  }

  // ... rest of the function ...
}

// ... existing code ...

// Disponibilizar a função globalmente
window.showKYCModal = showKYCModal;

// Função para obter a taxa de câmbio para uma moeda específica
function getRateForCurrency(currency) {
  // Primeiro verificar se temos as cotações globais disponíveis
  if (window.cryptoRates && window.cryptoRates[currency]) {
    return window.cryptoRates[currency];
  }
  
  // Para o USDT, tentar pegar diretamente do elemento de exibição de taxa na interface
  if (currency === 'USDT') {
    const usdtRateElement = document.getElementById('usdt-rate');
    if (usdtRateElement) {
      // Extrair o valor numérico do texto "R$ X,XX"
      const rateText = usdtRateElement.textContent;
      const rateValue = parseFloat(rateText.replace(/[^\d,]/g, '').replace(',', '.'));
      if (!isNaN(rateValue) && rateValue > 0) {
        // Armazenar no objeto global para uso futuro
        if (!window.cryptoRates) {
          window.cryptoRates = {};
        }
        window.cryptoRates.USDT = rateValue;
        return rateValue;
      }
    }
  }
  
  // Valores padrão como último recurso
  const defaultRates = {
    BTC: 340000.00,
    ETH: 17500.00,
    USDT: 5.30
  };
  
  return defaultRates[currency] || null;
}

/**
 * Simula o processo de análise KYC
 * @param {string} name - Nome do usuário
 * @param {string} cpf - CPF do usuário
 * @param {string} docType - Tipo de documento (rg ou cnh)
 * @param {Function} callback - Callback para chamar após conclusão
 */
function simulateKYCAnalysis(name, cpf, docType, callback) {
  // Referências para elementos de análise
  const analysisSteps = document.querySelectorAll('.analysis-step');
  const analysisAnimation = document.getElementById('analysis-animation');
  
  // Ocultar interface de upload de documentos
  const docUploadInterface = document.querySelector('.form-group');
  if (docUploadInterface) {
    docUploadInterface.style.display = 'none';
  }
  
  // Mostrar interface de análise
  const analysisStepsContainer = document.getElementById('analysis-steps');
  if (analysisStepsContainer) {
    analysisStepsContainer.style.display = 'block';
  }
  
  // Função para atualizar o status de uma etapa
  function updateStepStatus(stepId, status) {
    const step = document.querySelector(`.analysis-step[data-step="${stepId}"]`);
    if (!step) return;
    
    const indicator = step.querySelector('div');
    const text = step.querySelector('span');
    
    // Remover classes anteriores
    step.classList.remove('pending', 'processing', 'complete', 'failed');
    
    // Adicionar nova classe
    step.classList.add(status);
    
    // Atualizar estilo conforme o status
    switch (status) {
      case 'processing':
        indicator.style.borderColor = '#5d5fef';
        indicator.style.backgroundColor = 'rgba(93, 95, 239, 0.1)';
        text.style.color = '#5d5fef';
        break;
      case 'complete':
        indicator.style.borderColor = '#10b981';
        indicator.style.backgroundColor = '#10b981';
        indicator.innerHTML = '✓';
        indicator.style.color = 'white';
        text.style.color = '#047857';
        text.style.fontWeight = '500';
        break;
      case 'failed':
        indicator.style.borderColor = '#ef4444';
        indicator.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
        indicator.innerHTML = '!';
        indicator.style.color = '#ef4444';
        text.style.color = '#e11d48';
        break;
      default:
        // Estilo para pendente
        indicator.style.borderColor = '#adb5bd';
        indicator.style.backgroundColor = 'transparent';
        text.style.color = '#495057';
    }
  }
  
  // Função para processar cada etapa em sequência
  let currentStep = 0;
  const steps = ['verify-cpf', 'validate-document', 'check-age', 'check-risk', 'final-review'];
  
  // Resultados da análise
  const analysisResults = {
    cpf: { valid: false, confidence: 0 },
    document: { valid: false, confidence: 0, issues: [] },
    ageCheck: { valid: false },
    riskFactors: { valid: false, factors: [] },
    finalVerdict: { approved: false, tier: 0 }
  };
  
  function processNextStep() {
    if (currentStep >= steps.length) {
      finishAnalysis();
      return;
    }
    
    const stepId = steps[currentStep];
    updateStepStatus(stepId, 'processing');
    
    // Tempos variáveis para cada etapa para parecer mais realista
    const processingTimes = {
      'verify-cpf': 1500,
      'validate-document': 3500,
      'check-age': 1000,
      'check-risk': 2500,
      'final-review': 2000
    };
    
    // Simulação de processamento de cada etapa
    setTimeout(() => {
      let success = Math.random() < 0.95; // 95% de chance de sucesso em cada etapa
      
      switch (stepId) {
        case 'verify-cpf':
          // Verificação de CPF
          success = validarCPF(cpf.replace(/\D/g, ''));
          analysisResults.cpf = { 
            valid: success,
            confidence: success ? 0.99 : 0.2,
            message: success ? 'CPF válido' : 'CPF inválido ou com problemas'
          };
          break;
          
        case 'validate-document':
          // Simulação de validação de documento mais realista
          const docIssues = [];
          
          // Simular 85% de chance do documento estar OK
          const isDocValid = Math.random() < 0.85;
          
          // Se não for válido, gerar possíveis problemas
          if (!isDocValid) {
            const possibleIssues = [
              'Documento ilegível',
              'Foto com baixa qualidade',
              'Documento parece alterado',
              'Dados incompletos'
            ];
            
            // Adicionar 1 ou 2 problemas aleatórios
            const numIssues = Math.floor(Math.random() * 2) + 1;
            for (let i = 0; i < numIssues; i++) {
              const issueIndex = Math.floor(Math.random() * possibleIssues.length);
              docIssues.push(possibleIssues[issueIndex]);
              possibleIssues.splice(issueIndex, 1);
            }
          }
          
          analysisResults.document = {
            valid: isDocValid,
            confidence: isDocValid ? 
              (Math.floor(Math.random() * 15) + 85) / 100 : // 85-99% se aprovado
              (Math.floor(Math.random() * 30) + 50) / 100,  // 50-79% se rejeitado
            issues: docIssues
          };
          
          success = isDocValid;
          break;
          
        case 'check-age':
          // Verificação de idade baseada na data de nascimento
          const birthDateInput = document.getElementById('kyc-birthdate');
          if (birthDateInput && birthDateInput.value) {
            const birthDate = new Date(birthDateInput.value);
            const today = new Date();
            const age = today.getFullYear() - birthDate.getFullYear();
            
            // Ajustar se o aniversário ainda não ocorreu este ano
            const monthDiff = today.getMonth() - birthDate.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
              age--;
            }
            
            success = age >= 18;
            analysisResults.ageCheck = { 
              valid: success, 
              age: age,
              message: success ? 'Idade verificada' : 'Usuário menor de idade'
            };
          } else {
            success = false;
            analysisResults.ageCheck = { 
              valid: false, 
              message: 'Data de nascimento não fornecida'
            };
          }
          break;
          
        case 'check-risk':
          // Verificação de fatores de risco
          const riskFactors = [];
          
          // Lista de possíveis fatores de risco para simular
          const possibleRiskFactors = [
            'Histórico de fraudes',
            'Múltiplas contas associadas',
            'Documento em lista de alerta',
            'Endereço suspeito',
            'Perfil de alto risco'
          ];
          
          // 90% de chance de não ter fatores de risco
          if (Math.random() < 0.90) {
            success = true;
          } else {
            // Adicionar 1 ou 2 fatores de risco
            const numFactors = Math.floor(Math.random() * 2) + 1;
            for (let i = 0; i < numFactors; i++) {
              const factorIndex = Math.floor(Math.random() * possibleRiskFactors.length);
              riskFactors.push(possibleRiskFactors[factorIndex]);
              possibleRiskFactors.splice(factorIndex, 1);
            }
            success = false;
          }
          
          analysisResults.riskFactors = {
            valid: success,
            factors: riskFactors
          };
          break;
          
        case 'final-review':
          // Decisão final baseada em todos os resultados anteriores
          const allValid = 
            analysisResults.cpf.valid && 
            analysisResults.document.valid &&
            analysisResults.ageCheck.valid &&
            analysisResults.riskFactors.valid;
          
          success = allValid;
          
          // Determinar o nível KYC
          let tier = 0;
          if (allValid) {
            // Classificar como Tier 1 ou Tier 2
            // Em produção, isso seria baseado em mais fatores
            tier = Math.random() < 0.7 ? 2 : 1; // 70% chance de Tier 2
          }
          
          analysisResults.finalVerdict = {
            approved: success,
            tier: tier,
            message: success ? 
              `Verificação aprovada com nível Tier ${tier}` : 
              'Verificação não aprovada'
          };
          
          // Logs para debug (remover em produção)
          console.log('Resultados da análise KYC:', analysisResults);
          break;
      }
      
      // Atualizar status da etapa
      updateStepStatus(stepId, success ? 'complete' : 'failed');
      
      // Se uma etapa falhar, interromper o processo após um tempo
      if (!success) {
        setTimeout(() => {
          alert('Falha na verificação: ' + (
            stepId === 'verify-cpf' ? 'CPF inválido ou não encontrado.' :
            stepId === 'validate-document' ? 'Problemas com os documentos enviados.' :
            stepId === 'check-age' ? 'Verificação de idade falhou. Você precisa ter mais de 18 anos.' :
            stepId === 'check-risk' ? 'Fatores de risco identificados.' :
            'Não foi possível completar a verificação.'
          ));
          
          // Reset do processo para tentar novamente
          resetKYCAnalysis();
        }, 1000);
        return;
      }
      
      // Ir para a próxima etapa
      currentStep++;
      if (currentStep < steps.length) {
        processNextStep();
      } else {
        // Todas as etapas foram concluídas com sucesso
        setTimeout(finishAnalysis, 1000);
      }
    }, processingTimes[stepId]);
  }
  
  // Função para resetar o processo de análise
  function resetKYCAnalysis() {
    // Limpar status das etapas
    steps.forEach(stepId => {
      updateStepStatus(stepId, 'pending');
    });
    
    // Reiniciar variáveis
    currentStep = 0;
    
    // Exibir novamente a interface de upload
    if (docUploadInterface) {
      docUploadInterface.style.display = 'block';
    }
    
    // Ocultar interface de análise
    if (analysisStepsContainer) {
      analysisStepsContainer.style.display = 'none';
    }
  }
  
  // Função para finalizar a análise
  function finishAnalysis() {
    // Ocultar a animação de loading
    if (analysisAnimation) {
      analysisAnimation.style.display = 'none';
    }
    
    // Exibir mensagem de sucesso
    const analysisContainer = document.getElementById('kyc-step-3');
    if (analysisContainer) {
      const successMessage = document.createElement('div');
      successMessage.style.textAlign = 'center';
      successMessage.style.padding = '30px 0';
      successMessage.style.animation = 'fadeIn 0.5s ease';
      
      successMessage.innerHTML = `
        <div style="margin-bottom: 20px; animation: scaleIn 0.5s ease;">
          <div style="width: 80px; height: 80px; background-color: #10b981; border-radius: 50%; margin: 0 auto; display: flex; align-items: center; justify-content: center;">
            <span style="color: white; font-size: 40px;">✓</span>
          </div>
        </div>
        <h3 style="margin-bottom: 15px; color: #333; font-size: 1.5rem;">Documentos Verificados!</h3>
        <p style="color: #6c757d; margin-bottom: 25px;">Seus documentos foram verificados com sucesso.</p>
        
        <button id="continue-to-approval" class="btn primary" style="padding: 14px 24px; border-radius: 8px; background: #5d5fef; color: white; border: none; font-weight: 600; cursor: pointer; min-width: 220px; box-shadow: 0 4px 10px rgba(93, 95, 239, 0.3);">Continuar</button>
      `;
      
      // Substituir o conteúdo da etapa atual
      analysisContainer.innerHTML = '';
      analysisContainer.appendChild(successMessage);
      
      // Adicionar evento ao botão de continuar
      const continueButton = document.getElementById('continue-to-approval');
      if (continueButton) {
        continueButton.addEventListener('click', function() {
          // Prosseguir para a última etapa
          goToKYCStep(4);
          
          // Preencher os detalhes de verificação
          document.getElementById('verification-name').textContent = name;
          document.getElementById('verification-cpf').textContent = cpf;
          document.getElementById('verification-email-confirmed').textContent = userEmail || 'Não informado';
          document.getElementById('verification-date').textContent = new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR');
          document.getElementById('verification-id').textContent = 'KYC-' + Math.random().toString(36).substring(2, 10).toUpperCase();
        });
      }
    }
    
    // Botão para finalizar o processo inteiro
    const continueKycButton = document.getElementById('kyc-continue');
    if (continueKycButton) {
      continueKycButton.addEventListener('click', function() {
        // Remover o modal
        const modal = document.querySelector('.kyc-modal');
        if (modal) {
          document.body.removeChild(modal);
        }
        
        // Executar callback de sucesso
        if (typeof callback === 'function') {
          callback();
        }
      });
    }
  }
  
  // Iniciar o processamento
  processNextStep();
}
