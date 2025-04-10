// Error handling utility for consistent error management
export class ErrorHandler {
  constructor(options = {}) {
    this.options = {
      logToConsole: true,
      logToServer: false,
      serverLogEndpoint: '/api/logs',
      ...options
    };
    
    this.errorListeners = [];
  }

  /**
   * Handle an error with consistent logging and reporting
   * @param {Error} error - The error object
   * @param {string} context - Description of where the error occurred
   * @param {Object} metadata - Additional data about the error context
   */
  handleError(error, context = '', metadata = {}) {
    const errorInfo = {
      message: error.message || 'Unknown error',
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
      metadata
    };
    
    // Log to console if enabled
    if (this.options.logToConsole) {
      console.error(`Error in ${context}: ${error.message}`, {
        error,
        metadata
      });
    }
    
    // Log to server if enabled
    if (this.options.logToServer) {
      this.logToServer(errorInfo);
    }
    
    // Notify listeners
    this.notifyListeners(errorInfo);
    
    return errorInfo;
  }

  /**
   * Log an error to the server
   * @param {Object} errorInfo - Information about the error
   * @private
   */
  logToServer(errorInfo) {
    try {
      fetch(this.options.serverLogEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(errorInfo),
        // Use keepalive to ensure the request completes even if page navigates away
        keepalive: true
      }).catch(err => {
        // Just log to console if server logging fails
        console.warn('Failed to send error log to server', err);
      });
    } catch (err) {
      console.warn('Failed to send error log to server', err);
    }
  }

  /**
   * Add an error listener
   * @param {Function} listener - Function to call when an error occurs
   * @returns {Function} Function to remove the listener
   */
  addListener(listener) {
    if (typeof listener !== 'function') {
      throw new Error('Error listener must be a function');
    }
    
    this.errorListeners.push(listener);
    
    // Return function to remove listener
    return () => {
      this.errorListeners = this.errorListeners.filter(l => l !== listener);
    };
  }

  /**
   * Notify all listeners about an error
   * @param {Object} errorInfo - Information about the error
   * @private
   */
  notifyListeners(errorInfo) {
    this.errorListeners.forEach(listener => {
      try {
        listener(errorInfo);
      } catch (err) {
        // Don't let listener errors affect other listeners
        console.warn('Error in error listener', err);
      }
    });
  }

  /**
   * Create a wrapped version of a function that catches and handles errors
   * @param {Function} fn - Function to wrap with error handling
   * @param {string} context - Description of the function's context
   * @returns {Function} Wrapped function with error handling
   */
  wrapWithErrorHandler(fn, context) {
    return (...args) => {
      try {
        const result = fn(...args);
        
        // Handle promise results
        if (result instanceof Promise) {
          return result.catch(error => {
            this.handleError(error, context, { args });
            throw error; // Re-throw to allow caller to also handle
          });
        }
        
        return result;
      } catch (error) {
        this.handleError(error, context, { args });
        throw error; // Re-throw to allow caller to also handle
      }
    };
  }

  /**
   * Create a custom error with additional metadata
   * @param {string} message - Error message
   * @param {string} code - Error code for categorization
   * @param {Object} metadata - Additional data about the error
   * @returns {Error} Enhanced error object
   */
  createError(message, code = 'UNKNOWN_ERROR', metadata = {}) {
    const error = new Error(message);
    error.code = code;
    error.metadata = metadata;
    error.timestamp = new Date().toISOString();
    return error;
  }
}