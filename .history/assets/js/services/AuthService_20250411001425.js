/**
 * AuthService.js
 * Serviço de autenticação para o painel administrativo
 */
export default class AuthService {
  constructor() {
    this.tokenKey = 'admin_auth_token';
    this.userKey = 'admin_user_data';
  }

  /**
   * Autentica um usuário
   * @param {string} username - Nome de usuário
   * @param {string} password - Senha
   * @returns {Promise<boolean>} - Resultado da autenticação
   */
  async login(username, password) {
    // Para desenvolvimento, credenciais fixas
    // Em produção, isso seria substituído por uma chamada API
    const validUsername = 'admin';
    const validPassword = 'admin123';

    return new Promise((resolve) => {
      // Simula um atraso de rede
      setTimeout(() => {
        if (username === validUsername && password === validPassword) {
          // Cria um token simulado
          const token = btoa(`${username}:${new Date().getTime()}`);
          
          // Armazena token e dados do usuário
          localStorage.setItem(this.tokenKey, token);
          localStorage.setItem(this.userKey, JSON.stringify({
            username: username,
            role: 'administrator',
            lastLogin: new Date().toISOString()
          }));
          
          resolve(true);
        } else {
          resolve(false);
        }
      }, 300);
    });
  }

  /**
   * Verifica se o usuário está autenticado
   * @returns {boolean} - Verdadeiro se autenticado
   */
  isAuthenticated() {
    return !!localStorage.getItem(this.tokenKey);
  }

  /**
   * Obtém o usuário atual
   * @returns {object|null} - Dados do usuário ou null
   */
  getCurrentUser() {
    const userData = localStorage.getItem(this.userKey);
    if (userData) {
      try {
        return JSON.parse(userData).username;
      } catch (e) {
        console.error('Erro ao analisar dados do usuário:', e);
      }
    }
    return null;
  }

  /**
   * Obtém detalhes completos do usuário
   * @returns {object|null} - Objeto com detalhes do usuário
   */
  getUserDetails() {
    const userData = localStorage.getItem(this.userKey);
    if (userData) {
      try {
        return JSON.parse(userData);
      } catch (e) {
        console.error('Erro ao analisar dados do usuário:', e);
        return null;
      }
    }
    return null;
  }

  /**
   * Realiza logout do usuário
   */
  logout() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
  }
}
