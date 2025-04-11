/**
 * Middleware de segurança para proteger a aplicação contra ataques comuns
 */

/**
 * Gera um token CSRF para proteger contra ataques Cross-Site Request Forgery
 * @returns {string} Token CSRF
 */
export function generateCSRFToken() {
  // Gerar um token aleatório
  const buffer = new Uint8Array(32);
  if (window.crypto && window.crypto.getRandomValues) {
    window.crypto.getRandomValues(buffer);
  } else {
    // Fallback para navegadores mais antigos
    for (let i = 0; i < buffer.length; i++) {
      buffer[i] = Math.floor(Math.random() * 256);
    }
  }

  // Converter para string base64
  const token = btoa(Array.from(buffer).map(b => String.fromCharCode(b)).join(''));
  
  // Armazenar o token (em cookie HttpOnly, em aplicações reais)
  localStorage.setItem('csrf_token', token);
  
  return token;
}

/**
 * Verifica se o token CSRF é válido
 * @param {string} token - Token a verificar
 * @returns {boolean} - Se o token é válido
 */
export function validateCSRFToken(token) {
  const storedToken = localStorage.getItem('csrf_token');
  return token === storedToken;
}

/**
 * Adiciona o token CSRF a todos os formulários da página
 */
export function protectForms() {
  const token = generateCSRFToken();
  
  // Adicionar campo hidden com o token a todos os formulários
  document.querySelectorAll('form').forEach(form => {
    // Verificar se já existe um campo CSRF
    if (!form.querySelector('input[name="csrf_token"]')) {
      const csrfInput = document.createElement('input');
      csrfInput.type = 'hidden';
      csrfInput.name = 'csrf_token';
      csrfInput.value = token;
      form.appendChild(csrfInput);
    }
  });
  
  // Interceptar submits de formulários para verificar token
  document.addEventListener('submit', function(e) {
    const form = e.target;
    const csrfInput = form.querySelector('input[name="csrf_token"]');
    
    if (!csrfInput || !validateCSRFToken(csrfInput.value)) {
      e.preventDefault();
      console.error('Erro de validação CSRF');
      // Adicionar notificação de erro ao usuário
      showSecurityError('Erro de segurança. Por favor, recarregue a página e tente novamente.');
    }
  });
}

/**
 * Adiciona token CSRF a requisições Ajax/Fetch
 * @param {Request|Object} request - Requisição a ser modificada
 * @returns {Request|Object} - Requisição com o token CSRF
 */
export function addCSRFToRequest(request) {
  const token = localStorage.getItem('csrf_token') || generateCSRFToken();
  
  // Se for um objeto Request
  if (request instanceof Request) {
    // Clone a requisição para não modificar o original
    const newRequest = new Request(request, {
      headers: new Headers(request.headers)
    });
    
    // Adicionar o token ao cabeçalho
    newRequest.headers.set('X-CSRF-Token', token);
    
    return newRequest;
  }
  
  // Se for um objeto de configuração para fetch
  if (request && typeof request === 'object') {
    const newRequest = { ...request };
    
    // Inicializar headers se não existir
    if (!newRequest.headers) {
      newRequest.headers = {};
    }
    
    // Adicionar o token ao cabeçalho
    newRequest.headers['X-CSRF-Token'] = token;
    
    return newRequest;
  }
  
  return request;
}

/**
 * Define a Content Security Policy (CSP) para a página
 * @param {boolean} reportOnly - Se deve apenas reportar violações sem bloquear
 */
export function setupCSP(reportOnly = false) {
  const cspValue = [
    "default-src 'self'",
    "script-src 'self' https://www.google-analytics.com https://ssl.google-analytics.com 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' https://www.google-analytics.com data: https://*.coingecko.com",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://api.coingecko.com https://www.google-analytics.com",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'"
  ].join('; ');

  // Definir meta tag CSP
  const meta = document.createElement('meta');
  meta.httpEquiv = reportOnly ? 'Content-Security-Policy-Report-Only' : 'Content-Security-Policy';
  meta.content = cspValue;
  document.head.appendChild(meta);
}

/**
 * Configurar outros cabeçalhos de segurança usando meta tags
 */
export function setupSecurityHeaders() {
  // X-XSS-Protection
  const xssProtection = document.createElement('meta');
  xssProtection.httpEquiv = 'X-XSS-Protection';
  xssProtection.content = '1; mode=block';
  document.head.appendChild(xssProtection);
  
  // X-Content-Type-Options
  const contentTypeOptions = document.createElement('meta');
  contentTypeOptions.httpEquiv = 'X-Content-Type-Options';
  contentTypeOptions.content = 'nosniff';
  document.head.appendChild(contentTypeOptions);
  
  // Referrer-Policy
  const referrerPolicy = document.createElement('meta');
  referrerPolicy.name = 'referrer';
  referrerPolicy.content = 'strict-origin-when-cross-origin';
  document.head.appendChild(referrerPolicy);
  
  // Permissions-Policy (anteriormente Feature-Policy)
  const permissionsPolicy = document.createElement('meta');
  permissionsPolicy.httpEquiv = 'Permissions-Policy';
  permissionsPolicy.content = 'geolocation=(), microphone=(), camera=()';
  document.head.appendChild(permissionsPolicy);
}

/**
 * Exibir mensagem de erro de segurança
 * @param {string} message - Mensagem de erro
 */
function showSecurityError(message) {
  const errorContainer = document.createElement('div');
  errorContainer.className = 'security-error';
  errorContainer.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background-color: #f44336;
    color: white;
    padding: 15px;
    border-radius: 4px;
    z-index: 1000;
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
  `;
  
  errorContainer.textContent = message;
  
  // Botão para fechar
  const closeButton = document.createElement('button');
  closeButton.innerHTML = '&times;';
  closeButton.style.cssText = `
    margin-left: 10px;
    background: none;
    border: none;
    color: white;
    font-size: 20px;
    cursor: pointer;
  `;
  
  closeButton.addEventListener('click', () => {
    document.body.removeChild(errorContainer);
  });
  
  errorContainer.appendChild(closeButton);
  document.body.appendChild(errorContainer);
  
  // Auto-remover após 5 segundos
  setTimeout(() => {
    if (document.body.contains(errorContainer)) {
      document.body.removeChild(errorContainer);
    }
  }, 5000);
}

/**
 * Protege contra clickjacking
 */
export function preventClickjacking() {
  // Impedir que a página seja carregada em um iframe
  if (window.self !== window.top) {
    window.top.location = window.self.location;
    throw new Error('Esta página não pode ser carregada em um iframe.');
  }
}

/**
 * Inicializa todas as proteções de segurança
 */
export function initSecurity() {
  // Prevenir clickjacking
  preventClickjacking();
  
  // Configurar Content Security Policy
  setupCSP();
  
  // Configurar outros cabeçalhos de segurança
  setupSecurityHeaders();
  
  // Proteger formulários com CSRF tokens
  protectForms();
  
  // Monitorar mudanças no DOM para proteger novos formulários
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.addedNodes && mutation.addedNodes.length > 0) {
        // Verificar se novos formulários foram adicionados
        let forms = [];
        for (let i = 0; i < mutation.addedNodes.length; i++) {
          const node = mutation.addedNodes[i];
          
          // Verificar se o próprio nó é um formulário
          if (node.nodeName === 'FORM') {
            forms.push(node);
          }
          
          // Verificar filhos do nó
          if (node.querySelectorAll) {
            const childForms = node.querySelectorAll('form');
            if (childForms.length) {
              forms = [...forms, ...childForms];
            }
          }
        }
        
        // Proteger os novos formulários
        if (forms.length) {
          protectForms();
        }
      }
    });
  });
  
  // Iniciar observação do DOM
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// Função para interceptar fetch e adicionar token CSRF
const originalFetch = window.fetch;
window.fetch = function(url, options = {}) {
  // Adicionar CSRF token à requisição
  const secureOptions = addCSRFToRequest(options);
  
  // Chamar o fetch original
  return originalFetch.call(this, url, secureOptions);
};

// Exportar objetos e funções úteis
export default {
  generateCSRFToken,
  validateCSRFToken,
  protectForms,
  addCSRFToRequest,
  setupCSP,
  setupSecurityHeaders,
  preventClickjacking,
  initSecurity
};