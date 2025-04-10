/**
 * FastCripto - Módulo de Transações
 * Gerenciamento do histórico de transações e armazenamento
 */

// Adicionar uma nova transação ao histórico
export function addTransaction(transaction) {
  // Obter transações existentes
  const transactions = getTransactionHistory();

  // Adicionar nova transação
  transactions.push(transaction);

  // Salvar no armazenamento local
  saveTransactions(transactions);

  return transaction;
}

// Obter o histórico completo de transações
export function getTransactionHistory() {
  const stored = localStorage.getItem('fastcripto_transactions');
  return stored ? JSON.parse(stored) : [];
}

// Salvar transações no armazenamento local
export function saveTransactions(transactions) {
  localStorage.setItem('fastcripto_transactions', JSON.stringify(transactions));
}

// Obter uma transação específica pelo ID
export function getTransactionById(id) {
  const transactions = getTransactionHistory();
  return transactions.find((t) => t.id === id);
}

// Atualizar o status de uma transação
export function updateTransactionStatus(id, status) {
  const transactions = getTransactionHistory();
  const index = transactions.findIndex((t) => t.id === id);

  if (index !== -1) {
    transactions[index].status = status;
    transactions[index].updatedAt = new Date();

    // Disparar evento de mudança de status
    const event = new CustomEvent('transactionStatusChanged', {
      detail: {
        transaction: transactions[index],
        oldStatus: transactions[index].status,
        newStatus: status,
      },
    });
    document.dispatchEvent(event);

    // Salvar alterações
    saveTransactions(transactions);
    return true;
  }

  return false;
}

// Converter string de data para objeto Date
export function parseDateString(dateString) {
  return dateString ? new Date(dateString) : null;
}

// Exportar localmente para uso global
window.transactionsModule = {
  addTransaction,
  getTransactionHistory,
  getTransactionById,
  updateTransactionStatus,
};
