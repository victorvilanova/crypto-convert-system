/**
 * FastCripto - Módulo de Conversão
 * Lógica de cálculo e processamento das conversões
 */

// Realiza a conversão de BRL para a criptomoeda selecionada
export function convertCurrency(amountBRL, cryptoRate, fees) {
  // Calcular deduções
  const iofAmount = amountBRL * fees.iof;
  const incomeTaxAmount = amountBRL * fees.incomeTax;
  const serviceAmount = amountBRL * fees.service;

  // Calcular valor líquido após taxas
  const netAmount = amountBRL - iofAmount - incomeTaxAmount - serviceAmount;

  // Calcular valor em cripto (sem taxa de rede)
  const cryptoAmount = netAmount / cryptoRate;

  return {
    brlAmount: amountBRL,
    iofAmount,
    incomeTaxAmount,
    serviceAmount,
    netAmount,
    cryptoAmount,
    cryptoRate,
  };
}

// Aplica taxa de rede à conversão
export function applyNetworkFee(conversion, networkFee) {
  // Clonar o objeto de conversão
  const result = { ...conversion };

  // Converter networkFee para BRL (taxa de rede é expressa em cripto)
  const networkFeeBRL = networkFee * result.cryptoRate;

  // Adicionar taxa de rede
  result.networkFeeBRL = networkFeeBRL;
  result.networkFee = networkFee;

  // Ajustar valor em cripto final
  result.finalCryptoAmount = result.cryptoAmount - networkFee;

  return result;
}

// Formata valores monetários
export function formatCurrency(value, currency = 'BRL') {
  if (typeof value !== 'number') {
    return 'N/A';
  }

  if (currency === 'BRL') {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  } else {
    // Para criptomoedas, usamos formato com mais casas decimais
    const precision = getCryptoPrecision(currency);
    return `${value.toFixed(precision)} ${currency}`;
  }
}

// Determina a precisão adequada para cada criptomoeda
function getCryptoPrecision(currency) {
  switch (currency) {
    case 'BTC':
      return 8;
    case 'ETH':
      return 6;
    case 'USDT':
      return 2;
    case 'BNB':
      return 6;
    case 'XRP':
      return 2;
    default:
      return 4;
  }
}

// Formata data para exibição
export function formatDate(date) {
  if (!date) return 'N/A';

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

// Valida o montante de conversão
export function validateConversionAmount(amount, minAmount) {
  if (!amount || isNaN(amount)) {
    return { valid: false, message: 'Valor inválido' };
  }

  if (amount < minAmount) {
    return {
      valid: false,
      message: `Valor mínimo de conversão é R$ ${minAmount.toFixed(2)}`,
    };
  }

  return { valid: true };
}
