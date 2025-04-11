/**
 * Utilitários para otimização de performance
 */

/**
 * Implementa o padrão debounce, que limita a frequência de execução de uma função
 * @param {Function} func - Função a ser executada
 * @param {number} wait - Tempo de espera em milissegundos
 * @returns {Function} - Função com debounce aplicado
 */
export function debounce(func, wait = 300) {
  let timeout;
  
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Implementa o padrão throttle, que garante que uma função não seja executada
 * mais do que uma vez em um período especificado
 * @param {Function} func - Função a ser executada
 * @param {number} limit - Limite de tempo em milissegundos
 * @returns {Function} - Função com throttle aplicado
 */
export function throttle(func, limit = 300) {
  let inThrottle;
  
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Executa uma função quando o navegador estiver ocioso
 * @param {Function} func - Função a ser executada
 * @param {Object} options - Opções para requestIdleCallback
 * @returns {number} - ID da solicitação
 */
export function runWhenIdle(func, options = { timeout: 1000 }) {
  if ('requestIdleCallback' in window) {
    return window.requestIdleCallback(func, options);
  } else {
    // Fallback para navegadores que não suportam requestIdleCallback
    return setTimeout(() => {
      const start = Date.now();
      func({ didTimeout: false, timeRemaining: () => Math.max(0, 50 - (Date.now() - start)) });
    }, 1);
  }
}

/**
 * Cancela uma função agendada com runWhenIdle
 * @param {number} id - ID retornado por runWhenIdle
 */
export function cancelIdleCallback(id) {
  if ('cancelIdleCallback' in window) {
    window.cancelIdleCallback(id);
  } else {
    clearTimeout(id);
  }
}

/**
 * Mede o tempo de execução de uma função
 * @param {Function} func - Função a ser medida
 * @param {string} label - Rótulo para identificação no console
 * @returns {Function} - Função com medição de tempo
 */
export function measureExecutionTime(func, label = 'Execution time') {
  return function(...args) {
    const start = performance.now();
    const result = func.apply(this, args);
    const end = performance.now();
    console.log(`${label}: ${(end - start).toFixed(2)}ms`);
    return result;
  };
}