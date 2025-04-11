// Este arquivo contém configurações que serão executadas antes dos testes

// Configurar extensões do Jest para testes mais expressivos
import '@testing-library/jest-dom';

// Silenciar logs de console durante os testes (opcional)
// Descomente para desabilitar logs de console durante a execução dos testes
/*
console.error = jest.fn();
console.warn = jest.fn();
console.log = jest.fn();
*/

// Mock global para localStorage
global.localStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn()
};

// Mock para CustomEvent
global.CustomEvent = class CustomEvent extends Event {
  constructor(name, options = {}) {
    super(name, options);
    this.detail = options.detail || {};
  }
};

// Adicionar funções globais úteis para os testes
global.flushPromises = () => new Promise(resolve => setTimeout(resolve, 0));

// Reset todos os mocks entre testes
beforeEach(() => {
  jest.clearAllMocks();
});