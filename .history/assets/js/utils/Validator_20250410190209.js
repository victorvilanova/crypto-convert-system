/**
 * Validator.js
 * Utilitário para validação de entradas do usuário
 */
export default class Validator {
  /**
   * Valida um valor de conversão
   * @param {number} amount - Valor a ser validado
   * @throws {Error} Se o valor for inválido
   */
  static validateAmount(amount) {
    // Verifica se é um número
    if (isNaN(amount)) {
      throw new Error('O valor precisa ser um número válido');
    }

    // Verifica valor positivo
    if (amount <= 0) {
      throw new Error('O valor precisa ser maior que zero');
    }

    // Verifica valor máximo para evitar problemas
    if (amount > 1000000000) {
      throw new Error('O valor é muito alto para conversão');
    }

    return true;
  }

  /**
   * Sanitiza uma string para evitar XSS
   * @param {string} input - String para sanitizar
   * @returns {string} String sanitizada
   */
  static sanitizeString(input) {
    if (typeof input !== 'string') {
      return '';
    }

    // Remove tags HTML e caracteres potencialmente perigosos
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/`/g, '&#96;')
      .replace(/\$/g, '&#36;');
  }

  /**
   * Valida uma moeda ou criptomoeda
   * @param {string} code - Código da moeda/cripto
   * @param {string[]} allowedValues - Valores permitidos
   * @throws {Error} Se o código for inválido
   */
  static validateCurrencyCode(code, allowedValues) {
    // Verifica se é string
    if (typeof code !== 'string') {
      throw new Error('Código de moeda inválido');
    }

    // Sanitiza o código
    const sanitizedCode = this.sanitizeString(code);

    // Verifica se está na lista de valores permitidos
    if (!allowedValues.includes(sanitizedCode)) {
      throw new Error(`Moeda "${sanitizedCode}" não é suportada`);
    }

    return true;
  }
}
