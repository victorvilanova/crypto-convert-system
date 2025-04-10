// Módulo de conversão

// Lógica de cálculo e processamento das conversões
export function convertCurrency(amount, rate) {
  return amount * rate;
}

export function formatCurrency(value, currency) {
  return `${currency} ${value.toFixed(2)}`;
}