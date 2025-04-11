/**
 * Módulo de utilitários de segurança para a aplicação
 */
export const security = {
  /**
   * Mascara parte de um valor para exibição segura
   * @param {string} value - Valor a ser mascarado
   * @param {number} visibleChars - Quantidade de caracteres visíveis no final
   * @returns {string} - Valor mascarado
   */
  maskValue(value, visibleChars = 4) {
    if (!value) return '';

    const strValue = String(value);
    if (strValue.length <= visibleChars) {
      return '*'.repeat(strValue.length);
    }

    const maskedPart = '*'.repeat(strValue.length - visibleChars);
    const visiblePart = strValue.slice(-visibleChars);

    return maskedPart + visiblePart;
  },

  /**
   * Gera um ID único para uso na aplicação
   * @param {string} prefix - Prefixo opcional para o ID
   * @returns {string} - ID único
   */
  generateUniqueId(prefix = '') {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000000);
    const uniqueId = `${timestamp}${random}`;

    return prefix ? `${prefix}_${uniqueId}` : uniqueId;
  },

  /**
   * Verifica se o ambiente atual é seguro (HTTPS)
   * @returns {boolean} - Se o ambiente é seguro
   */
  isSecureContext() {
    return (
      typeof window !== 'undefined' &&
      (window.location.protocol === 'https:' ||
        window.location.hostname === 'localhost')
    );
  },

  /**
   * Utilitários para armazenamento seguro de dados
   */
  secureStore: {
    /**
     * Armazena um valor no localStorage com criptografia simples
     * @param {string} key - Chave para armazenamento
     * @param {any} value - Valor a ser armazenado
     * @returns {boolean} - Se a operação foi bem-sucedida
     */
    set(key, value) {
      try {
        // Usar Base64 como uma forma simples de ofuscar os dados
        // Para uma aplicação real, considerar usar a Web Crypto API
        const encryptedValue = btoa(JSON.stringify(value));
        localStorage.setItem(key, encryptedValue);
        return true;
      } catch (error) {
        console.error('Erro ao armazenar dados:', error);
        return false;
      }
    },

    /**
     * Recupera um valor do localStorage
     * @param {string} key - Chave para recuperação
     * @returns {any|null} - Valor recuperado ou null em caso de erro
     */
    get(key) {
      try {
        const encryptedValue = localStorage.getItem(key);
        if (!encryptedValue) return null;

        // Decodificar o valor armazenado
        return JSON.parse(atob(encryptedValue));
      } catch (error) {
        console.error('Erro ao recuperar dados:', error);
        return null;
      }
    },

    /**
     * Remove um valor do localStorage
     * @param {string} key - Chave para remoção
     */
    remove(key) {
      localStorage.removeItem(key);
    },

    /**
     * Limpa todos os dados armazenados pelo aplicativo
     * @param {string} prefix - Prefixo das chaves do aplicativo
     */
    clearAll(prefix = 'cryptoConverter_') {
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith(prefix)) {
          localStorage.removeItem(key);
        }
      });
    },
  },

  /**
   * Valida uma senha quanto à força
   * @param {string} password - Senha a ser validada
   * @returns {Object} - Resultado da validação
   */
  validatePassword(password) {
    if (!password) {
      return { valid: false, message: 'Senha não pode ser vazia' };
    }

    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChars = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(
      password
    );

    const valid =
      password.length >= minLength &&
      hasUpperCase &&
      hasLowerCase &&
      hasNumbers &&
      hasSpecialChars;

    let message = '';
    let strength = 'fraca';

    if (!valid) {
      const missing = [];
      if (password.length < minLength)
        missing.push(`pelo menos ${minLength} caracteres`);
      if (!hasUpperCase) missing.push('letra maiúscula');
      if (!hasLowerCase) missing.push('letra minúscula');
      if (!hasNumbers) missing.push('número');
      if (!hasSpecialChars) missing.push('caractere especial');

      message = `A senha deve conter ${missing.join(', ')}.`;
    } else {
      // Calcular força da senha
      let score = 0;
      score += password.length >= 10 ? 2 : 1;
      score += hasUpperCase ? 1 : 0;
      score += hasLowerCase ? 1 : 0;
      score += hasNumbers ? 1 : 0;
      score += hasSpecialChars ? 1 : 0;
      score +=
        hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChars ? 2 : 0;

      if (score >= 7) {
        strength = 'forte';
      } else if (score >= 5) {
        strength = 'média';
      }

      message = `Senha ${strength}`;
    }

    return {
      valid,
      message,
      strength,
      score: valid
        ? hasUpperCase +
          hasLowerCase +
          hasNumbers +
          hasSpecialChars +
          (password.length >= minLength)
        : 0,
    };
  },
};
