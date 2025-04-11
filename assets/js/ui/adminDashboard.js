/**
 * Atualiza o dashboard com informações gerais do sistema
 */
function updateDashboardData() {
  // Carrega contadores
  updateCounters();
  
  // Carrega transações recentes
  loadRecentTransactions();
  
  // Carrega gráficos
  updateCharts();
  
  // Atualiza informações de KYC
  updateKYCWidget();
  
  // Atualiza informações de taxas
  updateRatesWidget();
  
  // Registra data e hora da atualização
  document.getElementById('lastUpdate').textContent = new Date().toLocaleString('pt-BR');
}

/**
 * Atualiza os contadores do dashboard
 */
function updateCounters() {
  // Em uma aplicação real, esses dados viriam de um backend
  const counters = {
    totalTransactions: 1248,
    totalUsers: 756,
    pendingKYC: 32,
    totalVolume: 1567890.45
  };
  
  // Atualiza contadores na UI
  document.getElementById('totalTransactionsCounter').textContent = counters.totalTransactions.toLocaleString('pt-BR');
  document.getElementById('totalUsersCounter').textContent = counters.totalUsers.toLocaleString('pt-BR');
  document.getElementById('pendingKYCCounter').textContent = counters.pendingKYC.toLocaleString('pt-BR');
  document.getElementById('totalVolumeCounter').textContent = counters.totalVolume.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

/**
 * Carrega as transações recentes para o dashboard
 */
function loadRecentTransactions() {
  const transactionsTable = document.getElementById('recentTransactionsTable');
  if (!transactionsTable) return;
  
  // Em uma aplicação real, esses dados viriam de um backend
  const transactions = [
    { id: 'TX12345', user: 'joao.silva', amount: 5000, crypto: 'BTC', date: '2023-08-15 14:32', status: 'completed' },
    { id: 'TX12344', user: 'maria.santos', amount: 2500, crypto: 'ETH', date: '2023-08-15 13:45', status: 'completed' },
    { id: 'TX12343', user: 'pedro.alves', amount: 10000, crypto: 'USDT', date: '2023-08-15 11:22', status: 'pending' },
    { id: 'TX12342', user: 'ana.costa', amount: 3500, crypto: 'ADA', date: '2023-08-15 10:18', status: 'completed' },
    { id: 'TX12341', user: 'carlos.oliveira', amount: 7500, crypto: 'SOL', date: '2023-08-15 09:55', status: 'failed' }
  ];
  
  // Limpa a tabela
  transactionsTable.innerHTML = '';
  
  // Popula a tabela com as transações
  transactions.forEach(tx => {
    const row = document.createElement('tr');
    
    // Status color class
    const statusClass = tx.status === 'completed' ? 'bg-success' : 
                        tx.status === 'pending' ? 'bg-warning' : 'bg-danger';
    
    row.innerHTML = `
      <td>${tx.id}</td>
      <td>${tx.user}</td>
      <td>${tx.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
      <td>${tx.crypto}</td>
      <td>${tx.date}</td>
      <td><span class="badge ${statusClass}">${tx.status}</span></td>
      <td>
        <button class="btn btn-sm btn-outline-primary view-transaction" data-id="${tx.id}">
          <i class="fas fa-eye"></i>
        </button>
      </td>
    `;
    
    transactionsTable.appendChild(row);
  });
  
  // Adiciona event listeners para os botões de visualização
  document.querySelectorAll('.view-transaction').forEach(button => {
    button.addEventListener('click', (e) => {
      const txId = e.currentTarget.getAttribute('data-id');
      showTransactionDetails(txId);
    });
  });
}

/**
 * Atualiza os gráficos do dashboard
 */
function updateCharts() {
  // Gráfico de volume de transações
  drawTransactionVolumeChart();
  
  // Gráfico de distribuição de criptomoedas
  drawCryptoDistributionChart();
}

/**
 * Desenha gráfico de volume de transações
 */
function drawTransactionVolumeChart() {
  const ctx = document.getElementById('transactionVolumeChart');
  if (!ctx) return;
  
  // Destruir gráfico existente se houver
  if (window.transactionVolumeChart) {
    window.transactionVolumeChart.destroy();
  }
  
  // Dados simulados para o gráfico
  const labels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago'];
  const data = [120000, 150000, 180000, 210000, 250000, 220000, 300000, 350000];
  
  // Cria novo gráfico
  window.transactionVolumeChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Volume de Transações (R$)',
        data: data,
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 2,
        tension: 0.3,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return 'R$ ' + value.toLocaleString('pt-BR');
            }
          }
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: function(context) {
              let label = context.dataset.label || '';
              if (label) {
                label += ': ';
              }
              label += 'R$ ' + context.parsed.y.toLocaleString('pt-BR');
              return label;
            }
          }
        }
      }
    }
  });
}

/**
 * Desenha gráfico de distribuição de criptomoedas
 */
function drawCryptoDistributionChart() {
  const ctx = document.getElementById('cryptoDistributionChart');
  if (!ctx) return;
  
  // Destruir gráfico existente se houver
  if (window.cryptoDistributionChart) {
    window.cryptoDistributionChart.destroy();
  }
  
  // Dados simulados para o gráfico
  const data = {
    labels: ['Bitcoin', 'Ethereum', 'USDT', 'BNB', 'Solana', 'Outras'],
    datasets: [{
      data: [45, 25, 15, 8, 5, 2],
      backgroundColor: [
        'rgba(255, 99, 132, 0.8)',
        'rgba(54, 162, 235, 0.8)',
        'rgba(255, 206, 86, 0.8)',
        'rgba(75, 192, 192, 0.8)',
        'rgba(153, 102, 255, 0.8)',
        'rgba(255, 159, 64, 0.8)'
      ],
      borderWidth: 1
    }]
  };
  
  // Cria novo gráfico
  window.cryptoDistributionChart = new Chart(ctx, {
    type: 'doughnut',
    data: data,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right'
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `${context.label}: ${context.parsed}%`;
            }
          }
        }
      }
    }
  });
}

/**
 * Atualiza o widget de KYC com informações sobre verificações pendentes
 */
function updateKYCWidget() {
  const kycTable = document.getElementById('pendingKYCTable');
  if (!kycTable) return;
  
  // Dados simulados de KYC pendentes
  const pendingKYCs = [
    { id: 'KYC8765', user: 'amanda.silva', submitDate: '2023-08-14', status: 'pending' },
    { id: 'KYC8764', user: 'bruno.santos', submitDate: '2023-08-14', status: 'pending' },
    { id: 'KYC8763', user: 'carla.ferreira', submitDate: '2023-08-14', status: 'review' },
    { id: 'KYC8762', user: 'daniel.souza', submitDate: '2023-08-13', status: 'pending' },
    { id: 'KYC8761', user: 'eduardo.lima', submitDate: '2023-08-13', status: 'review' }
  ];
  
  // Limpa a tabela
  kycTable.innerHTML = '';
  
  // Popula a tabela com KYCs pendentes
  pendingKYCs.forEach(kyc => {
    const row = document.createElement('tr');
    
    // Status color and text
    const statusClass = kyc.status === 'pending' ? 'bg-warning' : 'bg-info';
    const statusText = kyc.status === 'pending' ? 'Pendente' : 'Em Análise';
    
    row.innerHTML = `
      <td>${kyc.id}</td>
      <td>${kyc.user}</td>
      <td>${kyc.submitDate}</td>
      <td><span class="badge ${statusClass}">${statusText}</span></td>
      <td>
        <button class="btn btn-sm btn-primary review-kyc" data-id="${kyc.id}">
          <i class="fas fa-search me-1"></i>Revisar
        </button>
      </td>
    `;
    
    kycTable.appendChild(row);
  });
  
  // Adiciona event listeners para os botões de revisão
  document.querySelectorAll('.review-kyc').forEach(button => {
    button.addEventListener('click', (e) => {
      const kycId = e.currentTarget.getAttribute('data-id');
      openKYCReview(kycId);
    });
  });
}

/**
 * Abre tela de revisão de KYC
 * @param {string} kycId - ID do KYC a ser revisado
 */
function openKYCReview(kycId) {
  console.log(`Abrindo revisão do KYC: ${kycId}`);
  
  // Aqui seria implementada a abertura do modal de revisão
  // ou redirecionamento para a página de revisão
  alert(`Abrindo revisão do KYC: ${kycId}`);
}

/**
 * Atualiza o widget de taxas de câmbio
 */
function updateRatesWidget() {
  const ratesTable = document.getElementById('currentRatesTable');
  if (!ratesTable) return;
  
  // Dados simulados de taxas
  const rates = [
    { crypto: 'Bitcoin (BTC)', price: 270000.00, change: 2.5 },
    { crypto: 'Ethereum (ETH)', price: 9800.00, change: 1.3 },
    { crypto: 'Tether (USDT)', price: 5.01, change: 0.1 },
    { crypto: 'BNB (BNB)', price: 1250.00, change: -0.8 },
    { crypto: 'Solana (SOL)', price: 450.00, change: 5.7 }
  ];
  
  // Limpa a tabela
  ratesTable.innerHTML = '';
  
  // Popula a tabela com as taxas
  rates.forEach(rate => {
    const row = document.createElement('tr');
    
    // Formata variação com cores
    const changeClass = rate.change >= 0 ? 'text-success' : 'text-danger';
    const changePrefix = rate.change >= 0 ? '+' : '';
    
    row.innerHTML = `
      <td>${rate.crypto}</td>
      <td>R$ ${rate.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
      <td class="${changeClass}">${changePrefix}${rate.change}%</td>
      <td>
        <button class="btn btn-sm btn-outline-secondary edit-rate" data-crypto="${rate.crypto.split(' ')[0]}">
          <i class="fas fa-edit"></i>
        </button>
      </td>
    `;
    
    ratesTable.appendChild(row);
  });
  
  // Adiciona event listeners para os botões de edição
  document.querySelectorAll('.edit-rate').forEach(button => {
    button.addEventListener('click', (e) => {
      const crypto = e.currentTarget.getAttribute('data-crypto');
      editExchangeRate(crypto);
    });
  });
}

/**
 * Abre formulário para editar taxa de câmbio
 * @param {string} crypto - Nome da criptomoeda
 */
function editExchangeRate(crypto) {
  console.log(`Editando taxa para: ${crypto}`);
  
  // Aqui seria implementada a abertura do modal de edição
  alert(`Editando taxa para: ${crypto}`);
}

/**
 * Exibe detalhes de uma transação
 * @param {string} transactionId - ID da transação
 */
function showTransactionDetails(transactionId) {
  console.log(`Exibindo detalhes da transação: ${transactionId}`);
  
  // Aqui seria implementada a abertura do modal de detalhes
  alert(`Detalhes da transação: ${transactionId}`);
}

// Inicializar dashboard quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  updateDashboardData();
  
  // Atualizar dashboard a cada 60 segundos
  setInterval(updateDashboardData, 60000);
  
  // Configura botão de atualização manual
  const refreshBtn = document.getElementById('refreshDashboard');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      updateDashboardData();
    });
  }
});