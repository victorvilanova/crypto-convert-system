// Módulo de transações

// Gestão do histórico de transações
export function addTransaction(history, transaction) {
  history.push(transaction);
  return history;
}

export function getTransactionHistory(history) {
  return history;
}
