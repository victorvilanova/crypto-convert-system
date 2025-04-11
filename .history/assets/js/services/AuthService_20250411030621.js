/**
 * AuthService.js
 * Serviço para autenticação de usuários administradores
 */
export default class AuthService {
  constructor() {
    this.storageKey = 'admin_auth_data';
    this.tokenExpiryTime = 24 * 60 * 60 * 1000; // 24 horas em milissegundos
    
    // Usuários de teste (em produção, isso viria do backend)
    this.testUsers = [
      {
        username: 'admin',
        password: 'admin123', // Na produção deve ser hash
        role: 'administrator',
        name: 'Administrador'
      },
      {
        username: 'analista',
        password: 'analista123',
        role: 'analyst',
        name: 'Analista de Mercado'
      },
      {
        username: 'visualizador',
        password: 'visualizador123',
        role: 'viewer',
        name: 'Visualizador'
      }
    ];
  }
  
  /**
   * Autenticar usuário
   * @param {string} username - Nome de usuário
   * @param {string} password - Senha
   * @returns {boolean} - Sucesso da autenticação
   */
  login(username, password) {
    // Busca o usuário
    const user = this.testUsers.find(u => 
      u.username === username && u.password === password
    );
    
    if (!user) {
      return false;
    }
    
    // Gera token fictício (em produção seria JWT)
    const token = this.generateToken();
    
    // Cria objeto de autenticação
    const authData = {
      token,
      username: user.username,
      role: user.role,
      name: user.name,
      expiresAt: Date.now() + this.tokenExpiryTime
    };
    
    // Salva no localStorage
    localStorage.setItem(this.storageKey, JSON.stringify(authData));
    
    return true;
  }
  
  /**
   * Deslogar usuário
   */
  logout() {
    localStorage.removeItem(this.storageKey);
  }
  
  /**
   * Verificar se usuário está autenticado
   * @returns {boolean} - Status da autenticação
   */
  isAuthenticated() {
    const authData = this.getAuthData();
    
    if (!authData || !authData.token || !authData.expiresAt) {
      return false;
    }
    
    // Verifica se o token expirou
    if (authData.expiresAt < Date.now()) {
      this.logout(); // Remove token expirado
      return false;
    }
    
    return true;
  }
  
  /**
   * Obter dados de autenticação
   * @returns {Object|null} - Dados de autenticação ou null
   */
  getAuthData() {
    const dataStr = localStorage.getItem(this.storageKey);
    if (!dataStr) {
      return null;
    }
    
    try {
      return JSON.parse(dataStr);
    } catch (error) {
      console.error('Erro ao processar dados de autenticação:', error);
      return null;
    }
  }
  
  /**
   * Obter detalhes do usuário
   * @returns {Object|null} - Dados do usuário ou null
   */
  getUserDetails() {
    const authData = this.getAuthData();
    if (!authData) {
      return null;
    }
    
    return {
      username: authData.username,
      role: authData.role,
      name: authData.name
    };
  }
  
  /**
   * Obter nome do usuário atual
   * @returns {string} - Nome do usuário ou string vazia
   */
  getCurrentUser() {
    const details = this.getUserDetails();
    return details ? details.name : '';
  }
  
  /**
   * Verificar se o usuário tem permissão específica
   * @param {string} permission - Nome da permissão
   * @returns {boolean} - Se o usuário tem a permissão
   */
  hasPermission(permission) {
    const user = this.getUserDetails();
    
    if (!user) {
      return false;
    }
    
    // Mapa de permissões por papel/role
    const rolePermissions = {
      administrator: ['view_dashboard', 'manage_arbitrage', 'change_settings'],
      analyst: ['view_dashboard', 'manage_arbitrage'],
      viewer: ['view_dashboard']
    };
    
    // Verifica se o papel do usuário tem a permissão
    return rolePermissions[user.role]?.includes(permission) || false;
  }
  
  /**
   * Gerar token aleatório para autenticação
   * @returns {string} - Token gerado
   */
  generateToken() {
    // Gera string aleatória de 32 caracteres
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    
    for (let i = 0; i < 32; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      token += charset[randomIndex];
    }
    
    return token;
  }
  
  /**
   * Renovar token de autenticação
   * @returns {boolean} - Sucesso da renovação
   */
  renewToken() {
    const authData = this.getAuthData();
    
    if (!authData) {
      return false;
    }
    
    // Atualiza data de expiração
    authData.expiresAt = Date.now() + this.tokenExpiryTime;
    
    // Salva dados atualizados
    localStorage.setItem(this.storageKey, JSON.stringify(authData));
    
    return true;
  }
}
