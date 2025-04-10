// Centralized state manager for the application
export class StateManager {
  constructor() {
    this.state = {};
    this.subscribers = {};
  }

  /**
   * Get a value from state
   * @param {string} key - State key
   * @returns {*} The state value
   */
  getState(key) {
    return this.state[key];
  }

  /**
   * Get multiple values from state
   * @param {string[]} keys - Array of state keys
   * @returns {Object} Object containing requested state values
   */
  getMultipleStates(keys) {
    const result = {};
    keys.forEach(key => {
      result[key] = this.state[key];
    });
    return result;
  }

  /**
   * Set a value in state and notify subscribers
   * @param {string} key - State key
   * @param {*} value - New state value
   */
  setState(key, value) {
    const oldValue = this.state[key];
    this.state[key] = value;
    
    // Notify subscribers
    if (this.subscribers[key]) {
      this.subscribers[key].forEach(callback => {
        callback(value, oldValue);
      });
    }
    
    // Also notify global subscribers
    if (this.subscribers['*']) {
      this.subscribers['*'].forEach(callback => {
        callback({ [key]: value }, { [key]: oldValue });
      });
    }
  }

  /**
   * Set multiple state values at once
   * @param {Object} stateValues - Object with key-value pairs to update
   */
  setMultipleStates(stateValues) {
    const oldValues = {};
    
    // First collect old values for notification
    Object.keys(stateValues).forEach(key => {
      oldValues[key] = this.state[key];
    });
    
    // Update state
    Object.keys(stateValues).forEach(key => {
      this.state[key] = stateValues[key];
      
      // Notify individual subscribers
      if (this.subscribers[key]) {
        this.subscribers[key].forEach(callback => {
          callback(stateValues[key], oldValues[key]);
        });
      }
    });
    
    // Notify global subscribers with batch update
    if (this.subscribers['*']) {
      this.subscribers['*'].forEach(callback => {
        callback(stateValues, oldValues);
      });
    }
  }

  /**
   * Subscribe to changes in a specific state key
   * @param {string} key - State key or '*' for all changes
   * @param {Function} callback - Function to call when state changes
   * @returns {Function} Unsubscribe function
   */
  subscribe(key, callback) {
    if (!this.subscribers[key]) {
      this.subscribers[key] = [];
    }
    
    this.subscribers[key].push(callback);
    
    // Return unsubscribe function
    return () => {
      this.subscribers[key] = this.subscribers[key].filter(cb => cb !== callback);
      if (this.subscribers[key].length === 0) {
        delete this.subscribers[key];
      }
    };
  }

  /**
   * Clear all state
   */
  clearState() {
    const oldState = { ...this.state };
    this.state = {};
    
    // Notify global subscribers
    if (this.subscribers['*']) {
      this.subscribers['*'].forEach(callback => {
        callback({}, oldState);
      });
    }
  }

  /**
   * Save state to localStorage
   * @param {string} key - Local storage key to use
   */
  persistState(key = 'appState') {
    try {
      localStorage.setItem(key, JSON.stringify(this.state));
    } catch (error) {
      console.warn('Failed to persist state to localStorage', error);
    }
  }

  /**
   * Restore state from localStorage
   * @param {string} key - Local storage key to use
   * @returns {boolean} Success status
   */
  restoreState(key = 'appState') {
    try {
      const savedState = localStorage.getItem(key);
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        this.setMultipleStates(parsedState);
        return true;
      }
      return false;
    } catch (error) {
      console.warn('Failed to restore state from localStorage', error);
      return false;
    }
  }
}