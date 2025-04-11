/**
 * PerformanceUtils.js
 * Utilitários para melhorar a performance da aplicação
 */
export default class PerformanceUtils {
  /**
   * Implementa função de debounce para limitar a frequência de execução
   * @param {Function} func - Função a ser executada
   * @param {number} wait - Tempo de espera em ms
   * @param {boolean} immediate - Se verdadeiro, executa no início em vez do final
   * @returns {Function} Função com debounce
   */
  static debounce(func, wait = 300, immediate = false) {
    let timeout;
    
    return function() {
      const context = this;
      const args = arguments;
      
      const later = function() {
        timeout = null;
        if (!immediate) func.apply(context, args);
      };
      
      const callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      
      if (callNow) func.apply(context, args);
    };
  }

  /**
   * Implementa função de throttle para limitar a frequência de execução
   * @param {Function} func - Função a ser executada
   * @param {number} limit - Limite de tempo em ms
   * @returns {Function} Função com throttle
   */
  static throttle(func, limit = 300) {
    let inThrottle;
    
    return function() {
      const args = arguments;
      const context = this;
      
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  /**
   * Detecta se a aplicação está rodando em um dispositivo com baixo poder de processamento
   * @returns {boolean} Verdadeiro se for um dispositivo de baixo desempenho
   */
  static isLowPowerDevice() {
    // Verificação básica baseada em características do hardware e navegador
    const maxTouchPoints = navigator.maxTouchPoints || 0;
    const memory = navigator.deviceMemory || 4; // Padrão é 4GB se não disponível
    const cpuCores = navigator.hardwareConcurrency || 4; // Padrão é 4 cores
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Considera um dispositivo de baixa potência se for mobile e tiver recursos limitados
    return isMobile && (memory < 4 || cpuCores < 4);
  }

  /**
   * Ajusta a frequência de atualizações com base nas capacidades do dispositivo
   * @returns {number} Intervalo recomendado em milissegundos
   */
  static getRecommendedUpdateInterval() {
    const isLowPower = this.isLowPowerDevice();
    
    // Em dispositivos de baixa potência, atualizamos com menos frequência
    return isLowPower ? 3 * 60 * 1000 : 60 * 1000; // 3 minutos vs 1 minuto
  }
}