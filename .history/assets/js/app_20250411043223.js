/**
 * app.js
 * Ponto de entrada principal da aplicação
 */
import CryptoController from './controllers/CryptoController.js';

// Inicializa a aplicação quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
  // Cria e inicializa o controlador principal
  const cryptoApp = new CryptoController();
  
  // Inicializa a aplicação
  cryptoApp.init();
  
  // Armazena a instância do controlador no objeto window para depuração (opcional)
  window.cryptoApp = cryptoApp;
  
  console.log('Crypto Convert System inicializado com sucesso!');
});