module.exports = {
  // Ambiente de execução dos testes
  testEnvironment: 'jsdom',
  
  // Diretórios onde os testes estão localizados
  testMatch: ['**/tests/**/*.test.js'],
  
  // Arquivos a ignorar
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  
  // Cobertura de código
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/index.js',
    '!**/node_modules/**'
  ],
  coverageDirectory: 'coverage',
  
  // Transformadores para processar arquivos específicos
  transform: {
    '^.+\\.jsx?$': 'babel-jest'
  },
  
  // Módulos que devem ser considerados como CommonJS
  transformIgnorePatterns: [
    '/node_modules/(?!nome-do-pacote-que-precisa-transformacao)/'
  ],
  
  // Configurações adicionais
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
  // Módulos para mock automático
  automock: false,
  
  // Limpar os mocks após cada teste
  clearMocks: true,
  
  // Limpar as instâncias após cada teste
  resetMocks: false,
  
  // Restaurar os mocks após cada teste
  restoreMocks: true,
}