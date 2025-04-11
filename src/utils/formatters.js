/**
 * Utilitários de formatação para a aplicação
 */

/**
 * Formata um valor numérico como moeda
 * @param {number} value - Valor a ser formatado
 * @param {string} currency - Código da moeda (ex: BRL, USD, BTC)
 * @param {string} locale - Localidade para formatação (padrão: pt-BR)
 * @returns {string} - Valor formatado como moeda
 */
export function formatCurrency(value, currency = 'BRL', locale = 'pt-BR') {
  if (value === undefined || value === null || isNaN(value)) {
    return '-';
  }

  // Verificar se é uma criptomoeda
  const isCrypto = ['BTC', 'ETH', 'USDT', 'BNB', 'XRP'].includes(currency);

  // Definir casas decimais com base no tipo de moeda
  const decimalPlaces = isCrypto ? 8 : 2;

  try {
    // Usar Intl.NumberFormat para moedas fiduciárias
    if (!isCrypto) {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value);
    }

    // Formatação personalizada para criptomoedas
    const formattedValue = new Intl.NumberFormat(locale, {
      minimumFractionDigits: value < 0.01 ? decimalPlaces : 2,
      maximumFractionDigits: value < 0.01 ? decimalPlaces : 6,
    }).format(value);

    return `${formattedValue} ${currency}`;
  } catch (error) {
    console.error('Erro ao formatar moeda:', error);
    // Fallback em caso de erro
    return `${value.toFixed(decimalPlaces)} ${currency}`;
  }
}

/**
 * Formata um valor percentual
 * @param {number} value - Valor a ser formatado (0.1 para 10%)
 * @param {number} decimalPlaces - Número de casas decimais
 * @param {string} locale - Localidade para formatação
 * @returns {string} - Valor formatado como percentual
 */
export function formatPercentage(value, decimalPlaces = 2, locale = 'pt-BR') {
  if (value === undefined || value === null || isNaN(value)) {
    return '-';
  }

  try {
    return new Intl.NumberFormat(locale, {
      style: 'percent',
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces,
    }).format(value);
  } catch (error) {
    console.error('Erro ao formatar percentual:', error);
    // Fallback em caso de erro
    return `${(value * 100).toFixed(decimalPlaces)}%`;
  }
}

/**
 * Formata uma data para exibição
 * @param {Date|string|number} date - Data a ser formatada
 * @param {Object} options - Opções de formatação
 * @param {string} locale - Localidade para formatação
 * @returns {string} - Data formatada
 */
export function formatDate(date, options = {}, locale = 'pt-BR') {
  if (!date) return '-';

  try {
    const dateObj = date instanceof Date ? date : new Date(date);

    if (isNaN(dateObj.getTime())) {
      return 'Data inválida';
    }

    // Opções padrão
    const defaultOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    };

    const mergedOptions = { ...defaultOptions, ...options };

    return new Intl.DateTimeFormat(locale, mergedOptions).format(dateObj);
  } catch (error) {
    console.error('Erro ao formatar data:', error);
    return String(date);
  }
}

/**
 * Formata uma data e hora completa
 * @param {Date|string|number} dateTime - Data e hora a serem formatadas
 * @param {boolean} includeSeconds - Se deve incluir segundos na formatação
 * @param {string} locale - Localidade para formatação
 * @returns {string} - Data e hora formatadas
 */
export function formatDateTime(
  dateTime,
  includeSeconds = false,
  locale = 'pt-BR'
) {
  if (!dateTime) return '-';

  const options = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };

  if (includeSeconds) {
    options.second = '2-digit';
  }

  return formatDate(dateTime, options, locale);
}

/**
 * Formata um número para exibição
 * @param {number} value - Valor a ser formatado
 * @param {number} decimalPlaces - Casas decimais
 * @param {string} locale - Localidade para formatação
 * @returns {string} - Número formatado
 */
export function formatNumber(value, decimalPlaces = 2, locale = 'pt-BR') {
  if (value === undefined || value === null || isNaN(value)) {
    return '-';
  }

  try {
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces,
    }).format(value);
  } catch (error) {
    console.error('Erro ao formatar número:', error);
    return value.toFixed(decimalPlaces);
  }
}

/**
 * Formata um número de telefone brasileiro
 * @param {string} phone - Número de telefone
 * @returns {string} - Telefone formatado
 */
export function formatPhone(phone) {
  if (!phone) return '';

  // Remover caracteres não numéricos
  const numbers = phone.replace(/\D/g, '');

  // Formatar conforme o número de dígitos
  if (numbers.length === 11) {
    // Celular: (XX) 9XXXX-XXXX
    return `(${numbers.substring(0, 2)}) ${numbers.substring(
      2,
      7
    )}-${numbers.substring(7)}`;
  } else if (numbers.length === 10) {
    // Fixo: (XX) XXXX-XXXX
    return `(${numbers.substring(0, 2)}) ${numbers.substring(
      2,
      6
    )}-${numbers.substring(6)}`;
  }

  // Se não for um formato conhecido, retornar como está
  return phone;
}

/**
 * Formata um CPF
 * @param {string} cpf - CPF a ser formatado
 * @returns {string} - CPF formatado
 */
export function formatCPF(cpf) {
  if (!cpf) return '';

  // Remover caracteres não numéricos
  const numbers = cpf.replace(/\D/g, '');

  if (numbers.length !== 11) {
    return cpf;
  }

  return `${numbers.substring(0, 3)}.${numbers.substring(
    3,
    6
  )}.${numbers.substring(6, 9)}-${numbers.substring(9)}`;
}

/**
 * Formata um CNPJ
 * @param {string} cnpj - CNPJ a ser formatado
 * @returns {string} - CNPJ formatado
 */
export function formatCNPJ(cnpj) {
  if (!cnpj) return '';

  // Remover caracteres não numéricos
  const numbers = cnpj.replace(/\D/g, '');

  if (numbers.length !== 14) {
    return cnpj;
  }

  return `${numbers.substring(0, 2)}.${numbers.substring(
    2,
    5
  )}.${numbers.substring(5, 8)}/${numbers.substring(8, 12)}-${numbers.substring(
    12
  )}`;
}

/**
 * Trunca um texto longo e adiciona reticências
 * @param {string} text - Texto a ser truncado
 * @param {number} maxLength - Tamanho máximo
 * @returns {string} - Texto truncado
 */
export function truncateText(text, maxLength = 100) {
  if (!text) return '';

  if (text.length <= maxLength) {
    return text;
  }

  return text.substring(0, maxLength) + '...';
}
