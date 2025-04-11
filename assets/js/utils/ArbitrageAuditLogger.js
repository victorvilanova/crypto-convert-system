/**
 * Utilitário para registro e auditoria de operações de arbitragem
 */
export default class ArbitrageAuditLogger {
  constructor() {
    this.logs = [];
    this.maxLogSize = 100; // Limite de logs armazenados em memória
    
    // Recuperar logs do localStorage, se existirem
    this.loadLogsFromStorage();
  }
  
  /**
   * Carrega logs armazenados do localStorage
   */
  loadLogsFromStorage() {
    try {
      const savedLogs = localStorage.getItem('arbitrage_audit_logs');
      if (savedLogs) {
        this.logs = JSON.parse(savedLogs);
      }
    } catch (error) {
      console.error('Erro ao recuperar logs do localStorage:', error);
      this.logs = [];
    }
  }
  
  /**
   * Salva logs no localStorage
   */
  saveLogsToStorage() {
    try {
      localStorage.setItem('arbitrage_audit_logs', JSON.stringify(this.logs));
    } catch (error) {
      console.error('Erro ao salvar logs no localStorage:', error);
    }
  }
  
  /**
   * Registra uma oportunidade de arbitragem detectada
   * @param {object} opportunity - Dados da oportunidade
   * @param {string} type - Tipo de arbitragem ('triangular' ou 'exchange')
   */
  logOpportunityDetected(opportunity, type) {
    const logEntry = {
      id: this.generateLogId(),
      timestamp: new Date().toISOString(),
      action: 'opportunity_detected',
      type: type,
      data: opportunity,
      status: 'detected'
    };
    
    this.addLogEntry(logEntry);
    return logEntry.id;
  }
  
  /**
   * Registra uma decisão de execução de arbitragem
   * @param {string} opportunityId - ID da oportunidade
   * @param {string} decision - Decisão ('execute' ou 'ignore')
   * @param {string} reason - Motivo da decisão
   */
  logArbitrageDecision(opportunityId, decision, reason) {
    const logEntry = {
      id: this.generateLogId(),
      timestamp: new Date().toISOString(),
      action: 'decision',
      opportunityId: opportunityId,
      decision: decision,
      reason: reason
    };
    
    this.addLogEntry(logEntry);
    
    // Atualiza status da oportunidade relacionada
    this.updateOpportunityStatus(opportunityId, decision === 'execute' ? 'executing' : 'ignored');
    
    return logEntry.id;
  }
  
  /**
   * Registra o resultado de uma execução de arbitragem
   * @param {string} opportunityId - ID da oportunidade
   * @param {boolean} success - Se a execução foi bem-sucedida
   * @param {object} result - Resultado da execução
   */
  logArbitrageResult(opportunityId, success, result) {
    const logEntry = {
      id: this.generateLogId(),
      timestamp: new Date().toISOString(),
      action: 'result',
      opportunityId: opportunityId,
      success: success,
      data: result
    };
    
    this.addLogEntry(logEntry);
    
    // Atualiza status da oportunidade relacionada
    this.updateOpportunityStatus(opportunityId, success ? 'completed' : 'failed');
    
    return logEntry.id;
  }
  
  /**
   * Adiciona uma entrada ao log e mantém o tamanho máximo
   * @param {object} logEntry - Entrada de log
   */
  addLogEntry(logEntry) {
    this.logs.unshift(logEntry);
    
    // Limita o tamanho do log
    if (this.logs.length > this.maxLogSize) {
      this.logs = this.logs.slice(0, this.maxLogSize);
    }
    
    // Persiste no localStorage
    this.saveLogsToStorage();
  }
  
  /**
   * Atualiza o status de uma oportunidade
   * @param {string} opportunityId - ID da oportunidade
   * @param {string} status - Novo status
   */
  updateOpportunityStatus(opportunityId, status) {
    for (const log of this.logs) {
      if (log.action === 'opportunity_detected' && log.id === opportunityId) {
        log.status = status;
        this.saveLogsToStorage();
        break;
      }
    }
  }
  
  /**
   * Limpa todos os logs
   */
  clearLogs() {
    this.logs = [];
    this.saveLogsToStorage();
  }
  
  /**
   * Obtém todos os logs
   * @returns {Array} - Lista de logs
   */
  getAllLogs() {
    return [...this.logs];
  }
  
  /**
   * Obtém logs filtrados por tipo
   * @param {string} type - Tipo de arbitragem
   * @returns {Array} - Lista de logs filtrados
   */
  getLogsByType(type) {
    return this.logs.filter(log => 
      log.action === 'opportunity_detected' && log.type === type
    );
  }
  
  /**
   * Obtém logs filtrados por status
   * @param {string} status - Status da oportunidade
   * @returns {Array} - Lista de logs filtrados
   */
  getLogsByStatus(status) {
    return this.logs.filter(log => 
      log.action === 'opportunity_detected' && log.status === status
    );
  }
  
  /**
   * Gera um ID único para uma entrada de log
   * @returns {string} - ID único
   */
  generateLogId() {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}