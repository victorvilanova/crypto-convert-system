import { security } from '../utils/security';

/**
 * Serviço para gerenciar o histórico de conversões realizadas pelo usuário
 */
export class ConversionHistoryService {
  /**
   * @param {Object} options - Opções de configuração
   * @param {string} options.storageKey - Chave para armazenamento no localStorage
   * @param {number} options.maxItems - Número máximo de itens no histórico
   */
  constructor(options = {}) {
    const {
      storageKey = 'cryptoConverter_history',
      maxItems = 50
    } = options;
    
    this.storageKey = storageKey;
    this.maxItems = maxItems;
  }
  
  /**
   * Adiciona uma nova conversão ao histórico
   * @param {Object} conversion - Dados da conversão
   * @returns {string} - ID da conversão adicionada
   */
  addConversion(conversion) {
    if (!conversion) return null;
    
    const history = this.getHistory();
    const id = security.generateUniqueId('conv');
    
    // Adicionar metadados ao registro
    const historyItem = {
      id,
      ...conversion,
      timestamp: conversion.timestamp || new Date().toISOString(),
      userAgent: navigator.userAgent,
      device: this._getDeviceInfo()
    };
    
    // Adicionar no início da lista
    history.unshift(historyItem);
    
    // Manter apenas o número máximo de itens
    if (history.length > this.maxItems) {
      history.length = this.maxItems;
    }
    
    // Salvar no localStorage
    this._saveHistory(history);
    
    return id;
  }
  
  /**
   * Obtém o histórico completo de conversões
   * @returns {Array} - Lista de conversões
   */
  getHistory() {
    try {
      const storedHistory = localStorage.getItem(this.storageKey);
      return storedHistory ? JSON.parse(storedHistory) : [];
    } catch (error) {
      console.error('Erro ao recuperar histórico de conversões:', error);
      return [];
    }
  }
  
  /**
   * Limpa todo o histórico de conversões
   * @returns {boolean} - Se a operação foi bem-sucedida
   */
  clearHistory() {
    try {
      localStorage.removeItem(this.storageKey);
      return true;
    } catch (error) {
      console.error('Erro ao limpar histórico:', error);
      return false;
    }
  }
  
  /**
   * Remove uma conversão específica do histórico
   * @param {string} id - ID da conversão a ser removida
   * @returns {boolean} - Se a remoção foi bem-sucedida
   */
  removeConversion(id) {
    if (!id) return false;
    
    const history = this.getHistory();
    const initialLength = history.length;
    
    const filteredHistory = history.filter(item => item.id !== id);
    
    if (filteredHistory.length === initialLength) {
      return false; // Nenhum item foi removido
    }
    
    this._saveHistory(filteredHistory);
    return true;
  }
  
  /**
   * Busca conversões no histórico
   * @param {Object} filters - Filtros a serem aplicados
   * @returns {Array} - Conversões filtradas
   */
  searchConversions(filters = {}) {
    const history = this.getHistory();
    
    if (!filters || Object.keys(filters).length === 0) {
      return history;
    }
    
    return history.filter(item => {
      for (const [key, value] of Object.entries(filters)) {
        // Ignorar se o item não tem a propriedade
        if (!item.hasOwnProperty(key)) continue;
        
        // Para datas, comparar apenas a data (não a hora)
        if (key === 'date' && item.timestamp) {
          const itemDate = item.timestamp.split('T')[0];
          const filterDate = new Date(value).toISOString().split('T')[0];
          if (itemDate !== filterDate) return false;
          continue;
        }
        
        // Para outros campos, comparar diretamente
        if (item[key] !== value) return false;
      }
      
      return true;
    });
  }
  
  /**
   * Salva o histórico no localStorage
   * @param {Array} history - Histórico a ser salvo
   * @private
   */
  _saveHistory(history) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(history));
    } catch (error) {
      console.error('Erro ao salvar histórico:', error);
    }
  }
  
  /**
   * Obtém informações sobre o dispositivo atual
   * @returns {Object} - Informações do dispositivo
   * @private
   */
  _getDeviceInfo() {
    return {
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
      isDesktop: !/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    };
  }
}