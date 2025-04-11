/**
 * AuthService.js
 * Serviço responsável pela autenticação e autorização de usuários administrativos
 */
export default class AuthService {
  constructor() {
    this.tokenKey = 'admin_auth_token';
    this.userKey = 'admin_user';
    this.tokenExpiry = 8 * 60 * 60 * 1000; // 8 horas em milissegundos

    // Credenciais de demonstração (em um sistema real, isso estaria no backend)
    this.demoCredentials = {
      admin: 'senha123',
      manager: 'crypto2024',
    };
  }

  /**
   * Realiza login do usuário
   * @param {string} username - Nome de usuário
   * @param {string} password - Senha do usuário
   * @returns {Object} Resultado da operação de login
   */
  login(username, password) {
    // Verifica se as credenciais são válidas (simulação)
    if (!this.validateCredentials(username, password)) {
      return {
        success: false,
        message: 'Usuário ou senha inválidos',
      };
    }

    // Gera token (simulado para demonstração)
    const token = this.generateToken();
    const expiryTime = new Date().getTime() + this.tokenExpiry;

    // Salva dados de autenticação
    localStorage.setItem(this.tokenKey, token);
    localStorage.setItem(this.userKey, username);
    localStorage.setItem('token_expiry', expiryTime);

    return {
      success: true,
      user: username,
      token: token,
    };
  }

  /**
   * Verifica se o usuário está autenticado
   * @returns {boolean} True se autenticado, false caso contrário
   */
  isAuthenticated() {
    const token = localStorage.getItem(this.tokenKey);
    const expiry = localStorage.getItem('token_expiry');

    if (!token || !expiry) {
      return false;
    }

    // Verifica se o token expirou
    const now = new Date().getTime();
    if (now > parseInt(expiry, 10)) {
      this.logout(); // Limpa dados expirados
      return false;
    }

    return true;
  }

  /**
   * Realiza o logout do usuário
   */
  logout() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    localStorage.removeItem('token_expiry');
  }

  /**
   * Obtém o usuário atual
   * @returns {string|null} Nome do usuário ou null se não estiver autenticado
   */
  getCurrentUser() {
    if (!this.isAuthenticated()) {
      return null;
    }

    return localStorage.getItem(this.userKey);
  }

  /**
   * Valida as credenciais de usuário (simulação)
   * @private
   * @param {string} username - Nome de usuário
   * @param {string} password - Senha
   * @returns {boolean} True se válido, false caso contrário
   */
  validateCredentials(username, password) {
    // Verifica se o usuário existe e a senha coincide
    return this.demoCredentials[username] === password;
  }

  /**
   * Gera um token de autenticação simulado
   * @private
   * @returns {string} Token gerado
   */
  generateToken() {
    // Simulação de token para demonstração
    const tokenChars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';

    for (let i = 0; i < 64; i++) {
      token += tokenChars.charAt(Math.floor(Math.random() * tokenChars.length));
    }

    return token;
  }
}
