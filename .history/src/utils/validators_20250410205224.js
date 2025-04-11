/**
 * Conjunto de funções para validação de dados
 */

/**
 * Verifica se um CPF é válido
 * @param {string} cpf - CPF a ser validado
 * @returns {boolean} - Se o CPF é válido
 */
export function isValidCPF(cpf) {
  if (!cpf) return false;

  // Remover caracteres não numéricos
  const numbers = cpf.replace(/\D/g, '');
  
  // Verificar tamanho
  if (numbers.length !== 11) return false;
  
  // Verificar se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(numbers)) return false;
  
  // Algoritmo de validação do CPF
  let sum = 0;
  let remainder;
  
  // Primeiro dígito verificador
  for (let i = 1; i <= 9; i++) {
    sum += parseInt(numbers.substring(i - 1, i)) * (11 - i);
  }
  
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(numbers.substring(9, 10))) return false;
  
  // Segundo dígito verificador
  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(numbers.substring(i - 1, i)) * (12 - i);
  }
  
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(numbers.substring(10, 11))) return false;
  
  return true;
}

/**
 * Verifica se um CNPJ é válido
 * @param {string} cnpj - CNPJ a ser validado
 * @returns {boolean} - Se o CNPJ é válido
 */
export function isValidCNPJ(cnpj) {
  if (!cnpj) return false;
  
  // Remover caracteres não numéricos
  const numbers = cnpj.replace(/\D/g, '');
  
  // Verificar tamanho
  if (numbers.length !== 14) return false;
  
  // Verificar se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(numbers)) return false;
  
  // Algoritmo de validação do CNPJ
  let size = numbers.length - 2;
  let numbers_array = numbers.substring(0, size);
  const digits = numbers.substring(size);
  let sum = 0;
  let pos = size - 7;
  
  // Primeiro dígito verificador
  for (let i = size; i >= 1; i--) {
    sum += numbers_array.charAt(size - i) * pos--;
    if (pos < 2) pos = 9;
  }
  
  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) return false;
  
  // Segundo dígito verificador
  size += 1;
  numbers_array = numbers.substring(0, size);
  sum = 0;
  pos = size - 7;
  
  for (let i = size; i >= 1; i--) {
    sum += numbers_array.charAt(size - i) * pos--;
    if (pos < 2) pos = 9;
  }
  
  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(1))) return false;
  
  return true;
}

/**
 * Verifica se um e-mail é válido
 * @param {string} email - E-mail a ser validado
 * @returns {boolean} - Se o e-mail é válido
 */
export function isValidEmail(email) {
  if (!email) return false;
  
  // Regex para validação básica de e-mail
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Verifica se um telefone brasileiro é válido
 * @param {string} phone - Telefone a ser validado
 * @returns {boolean} - Se o telefone é válido
 */
export function isValidPhone(phone) {
  if (!phone) return false;
  
  // Remover caracteres não numéricos
  const numbers = phone.replace(/\D/g, '');
  
  // Verificar se é um telefone fixo (10 dígitos) ou celular (11 dígitos)
  if (numbers.length !== 10 && numbers.length !== 11) return false;
  
  // Para celular, verificar se começa com 9
  if (numbers.length === 11 && numbers.charAt(2) !== '9') return false;
  
  // Verificar DDD válido (de 11 a 99)
  const ddd = parseInt(numbers.substring(0, 2));
  if (ddd < 11 || ddd > 99) return false;
  
  return true;
}

/**
 * Verifica se um CEP brasileiro é válido
 * @param {string} cep - CEP a ser validado
 * @returns {boolean} - Se o CEP é válido
 */
export function isValidCEP(cep) {
  if (!cep) return false;
  
  // Remover caracteres não numéricos
  const numbers = cep.replace(/\D/g, '');
  
  // CEP deve ter 8 dígitos
  if (numbers.length !== 8) return false;
  
  // Verificar se não são todos os dígitos iguais
  if (/^(\d)\1+$/.test(numbers)) return false;
  
  return true;
}

/**
 * Verifica se um valor é um número válido
 * @param {any} value - Valor a ser validado
 * @param {Object} options - Opções de validação
 * @returns {boolean} - Se o valor é um número válido
 */
export function isValidNumber(value, options = {}) {
  const { min, max, integer } = options;
  
  // Converter para número
  const num = Number(value);
  
  // Verificar se é um número
  if (isNaN(num)) return false;
  
  // Verificar se é inteiro quando necessário
  if (integer && !Number.isInteger(num)) return false;
  
  // Verificar mínimo
  if (min !== undefined && num < min) return false;
  
  // Verificar máximo
  if (max !== undefined && num > max) return false;
  
  return true;
}

/**
 * Verifica se uma data é válida
 * @param {string|Date} date - Data a ser validada
 * @param {Object} options - Opções de validação
 * @returns {boolean} - Se a data é válida
 */
export function isValidDate(date, options = {}) {
  const { minDate, maxDate } = options;
  
  // Se for uma string, tentar converter para Date
  const dateObj = date instanceof Date ? date : new Date(date);
  
  // Verificar se a data é válida
  if (isNaN(dateObj.getTime())) return false;
  
  // Verificar mínimo
  if (minDate && dateObj < new Date(minDate)) return false;
  
  // Verificar máximo
  if (maxDate && dateObj > new Date(maxDate)) return false;
  
  return true;
}

/**
 * Verifica se uma string tem o tamanho adequado
 * @param {string} str - String a ser validada
 * @param {Object} options - Opções de validação
 * @returns {boolean} - Se a string tem o tamanho adequado
 */
export function isValidLength(str, options = {}) {
  const { min, max } = options;
  
  if (typeof str !== 'string') return false;
  
  // Verificar mínimo
  if (min !== undefined && str.length < min) return false;
  
  // Verificar máximo
  if (max !== undefined && str.length > max) return false;
  
  return true;
}

/**
 * Verifica se um endereço de Bitcoin é válido
 * @param {string} address - Endereço a ser validado
 * @returns {boolean} - Se o endereço é válido
 */
export function isValidBitcoinAddress(address) {
  if (!address) return false;
  
  // Regex para endereços Bitcoin comuns (P2PKH, P2SH e Bech32)
  const btcRegex = /^(1[a-km-zA-HJ-NP-Z1-9]{25,34}|3[a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[a-zA-HJ-NP-Z0-9]{25,90})$/;
  return btcRegex.test(address);
}

/**
 * Verifica se um endereço Ethereum é válido
 * @param {string} address - Endereço a ser validado
 * @returns {boolean} - Se o endereço é válido
 */
export function isValidEthereumAddress(address) {
  if (!address) return false;
  
  // Regex para endereços Ethereum
  const ethRegex = /^0x[a-fA-F0-9]{40}$/;
  return ethRegex.test(address);
}