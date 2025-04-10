// Módulo de taxas

// Obtenção e gerenciamento de taxas de câmbio
export async function fetchExchangeRates(apiUrl) {
  const response = await fetch(`${apiUrl}/exchange-rates`);
  return response.json();
}

export function getRateForCurrency(rates, currency) {
  return rates[currency] || null;
}
