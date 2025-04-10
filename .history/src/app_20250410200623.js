// Main application entry point
import { CryptoController } from './controllers/CryptoController.js';
import { CryptoService } from './services/CryptoService.js';
import { CryptoView } from './views/CryptoView.js';
import { StateManager } from './utils/StateManager.js';
import { ErrorHandler } from './utils/ErrorHandler.js';
import { ApiCache } from './utils/ApiCache.js';
import { ValidationService } from './services/ValidationService.js';
import { ConfigService } from './services/ConfigService.js';

class App {
  constructor() {
    // Initialize services
    this.configService = new ConfigService();
    this.errorHandler = new ErrorHandler();
    this.stateManager = new StateManager();
    this.apiCache = new ApiCache();
    this.validationService = new ValidationService();
    
    // Initialize main service with dependencies
    this.cryptoService = new CryptoService({
      apiCache: this.apiCache,
      errorHandler: this.errorHandler,
      configService: this.configService
    });
    
    // Initialize view
    this.cryptoView = new CryptoView({
      stateManager: this.stateManager,
      errorHandler: this.errorHandler
    });
    
    // Initialize controller with dependencies
    this.cryptoController = new CryptoController({
      service: this.cryptoService,
      view: this.cryptoView,
      stateManager: this.stateManager,
      validationService: this.validationService,
      errorHandler: this.errorHandler
    });
  }

  init() {
    try {
      // Initialize the application
      this.cryptoController.init();
      console.log('Application initialized successfully');
    } catch (error) {
      this.errorHandler.handleError(error, 'App initialization failed');
    }
  }
}

// Start the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
});

export default App;