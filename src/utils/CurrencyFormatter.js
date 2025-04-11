/**
 * Utilitário para formatação de moedas e números
 * Oferece funções para formatar valores monetários e percentuais
 */

/**
 * Formata um valor para exibição como moeda
 * @param {number} value - Valor a ser formatado
 * @param {string} currency - Código da moeda (USD, BRL, BTC, ETH, etc.)
 * @param {string} locale - Localização para formatação (pt-BR, en-US, etc.)
 * @param {Object} options - Opções adicionais de formatação
 * @returns {string} - Valor formatado como moeda
 */
export function formatCurrency(value, currency = 'USD', locale = 'en-US', options = {}) {
  // Tratamento para valores indefinidos ou nulos
  if (value === undefined || value === null) {
    return '';
  }

  // Valores padrão para opções
  const defaultOptions = {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  };

  // Configurações especiais para criptomoedas
  const cryptoOptions = {
    BTC: { maximumFractionDigits: 8, minimumFractionDigits: 2 },
    ETH: { maximumFractionDigits: 6, minimumFractionDigits: 2 },
    XRP: { maximumFractionDigits: 6, minimumFractionDigits: 2 },
    LTC: { maximumFractionDigits: 5, minimumFractionDigits: 2 },
    BCH: { maximumFractionDigits: 5, minimumFractionDigits: 2 },
    ADA: { maximumFractionDigits: 6, minimumFractionDigits: 2 },
    DOT: { maximumFractionDigits: 4, minimumFractionDigits: 2 },
    XLM: { maximumFractionDigits: 7, minimumFractionDigits: 2 },
    LINK: { maximumFractionDigits: 4, minimumFractionDigits: 2 },
    DOGE: { maximumFractionDigits: 8, minimumFractionDigits: 2 }
  };

  // Aplicar configurações para criptomoedas
  if (cryptoOptions[currency]) {
    Object.assign(defaultOptions, cryptoOptions[currency]);
  }

  // Mesclar opções padrão com as passadas pelo usuário
  const formatOptions = { ...defaultOptions, ...options };

  try {
    // Usar o Intl.NumberFormat para formatação localizada
    const formatter = new Intl.NumberFormat(locale, formatOptions);
    return formatter.format(value);
  } catch (error) {
    console.error('Erro ao formatar moeda:', error);
    // Fallback simples em caso de erro
    return `${currency} ${Number(value).toFixed(formatOptions.maximumFractionDigits)}`;
  }
}

/**
 * Formata um número com separadores de milhar e casas decimais
 * @param {number} value - Valor a ser formatado
 * @param {number} decimals - Número de casas decimais
 * @param {string} locale - Localização para formatação
 * @returns {string} - Número formatado
 */
export function formatNumber(value, decimals = 2, locale = 'en-US') {
  if (value === undefined || value === null) {
    return '';
  }

  try {
    const formatter = new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
    return formatter.format(value);
  } catch (error) {
    console.error('Erro ao formatar número:', error);
    return Number(value).toFixed(decimals);
  }
}

/**
 * Formata um valor percentual
 * @param {number} value - Valor percentual (ex: 0.1 para 10%)
 * @param {number} decimals - Número de casas decimais
 * @param {string} locale - Localização para formatação
 * @returns {string} - Valor formatado como percentual
 */
export function formatPercent(value, decimals = 2, locale = 'en-US') {
  if (value === undefined || value === null) {
    return '';
  }

  try {
    const formatter = new Intl.NumberFormat(locale, {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
    return formatter.format(value);
  } catch (error) {
    console.error('Erro ao formatar percentual:', error);
    return `${(value * 100).toFixed(decimals)}%`;
  }
}

/**
 * Formata um valor grande de forma compacta (ex: 1.5M, 2.3K)
 * @param {number} value - Valor a ser formatado
 * @param {string} locale - Localização para formatação
 * @returns {string} - Valor formatado de forma compacta
 */
export function formatCompact(value, locale = 'en-US') {
  if (value === undefined || value === null) {
    return '';
  }

  try {
    const formatter = new Intl.NumberFormat(locale, {
      notation: 'compact',
      compactDisplay: 'short'
    });
    return formatter.format(value);
  } catch (error) {
    console.error('Erro ao formatar valor compacto:', error);
    // Fallback simples
    if (Math.abs(value) >= 1_000_000_000) {
      return `${(value / 1_000_000_000).toFixed(1)}B`;
    } else if (Math.abs(value) >= 1_000_000) {
      return `${(value / 1_000_000).toFixed(1)}M`;
    } else if (Math.abs(value) >= 1_000) {
      return `${(value / 1_000).toFixed(1)}K`;
    }
    return value.toString();
  }
}

/**
 * Formata um valor de criptomoeda com unidades apropriadas
 * Ex: 0.00000123 BTC pode ser formatado como 1.23 Satoshis
 * @param {number} value - Valor a ser formatado
 * @param {string} currency - Código da criptomoeda
 * @param {boolean} useSmallestUnit - Se deve usar a menor unidade quando o valor for pequeno
 * @returns {string} - Valor formatado com unidade apropriada
 */
export function formatCryptoUnits(value, currency = 'BTC', useSmallestUnit = true) {
  if (value === undefined || value === null) {
    return '';
  }

  // Definição das menores unidades para criptomoedas populares
  const smallestUnits = {
    BTC: { unit: 'Satoshi', factor: 100000000 },
    ETH: { unit: 'Gwei', factor: 1000000000 },
    XRP: { unit: 'Drop', factor: 1000000 },
    LTC: { unit: 'Litoshi', factor: 100000000 },
    BCH: { unit: 'Satoshi', factor: 100000000 },
    DOGE: { unit: '', factor: 100000000 }
  };

  // Verificar se temos informações sobre a menor unidade desta criptomoeda
  if (useSmallestUnit && smallestUnits[currency] && Math.abs(value) < 0.000001) {
    const { unit, factor } = smallestUnits[currency];
    const smallUnitValue = value * factor;
    
    if (Math.abs(smallUnitValue) < 0.01) {
      return `< 0.01 ${unit}`;
    }
    
    return `${formatNumber(smallUnitValue, 2)} ${unit}`;
  }

  // Caso contrário, usar formatação para a unidade principal
  return formatCurrency(value, currency, 'en-US', {
    // Ajustar casas decimais com base no tamanho do valor
    maximumFractionDigits: Math.abs(value) < 1 ? 8 : (Math.abs(value) < 100 ? 6 : 4),
    minimumFractionDigits: 2
  });
}

/**
 * Converte valor de texto para número, tratando diferentes formatos de entrada
 * @param {string} value - Valor em formato de texto
 * @param {string} locale - Localização do formato de entrada
 * @returns {number} - Valor convertido para número
 */
export function parseNumber(value, locale = 'en-US') {
  if (!value) return null;
  
  // Remover formatação de moeda
  let processedValue = value.toString()
    .replace(/[^\d.,\-]/g, '') // Remover tudo exceto dígitos, ponto, vírgula e sinal negativo
    .trim();
  
  // Tratar locales que usam vírgula como separador decimal (ex: pt-BR, de-DE)
  const commaLocales = ['pt-BR', 'de-DE', 'es-ES', 'fr-FR', 'it-IT'];
  
  if (commaLocales.includes(locale)) {
    // Substituir pontos (separadores de milhar) por nada e vírgulas por pontos
    processedValue = processedValue.replace(/\./g, '').replace(/,/g, '.');
  } else {
    // Remover vírgulas (separadores de milhar) para locales que usam ponto como decimal
    processedValue = processedValue.replace(/,/g, '');
  }
  
  // Converter para número
  const number = parseFloat(processedValue);
  return isNaN(number) ? null : number;
}

export default {
  formatCurrency,
  formatNumber,
  formatPercent,
  formatCompact,
  formatCryptoUnits,
  parseNumber
};
