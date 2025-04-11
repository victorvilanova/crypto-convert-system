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