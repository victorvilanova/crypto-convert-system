// API cache utility for optimizing API requests
export class ApiCache {
  constructor(options = {}) {
    this.options = {
      defaultExpiration: 300000, // 5 minutes in milliseconds
      maxCacheSize: 100, // Maximum number of items to cache
      storage: 'memory', // 'memory' or 'local'
      ...options
    };
    
    this.cache = new Map();
    this.initialized = false;
    
    // Initialize cache
    this.init();
  }

  /**
   * Initialize the cache system
   */
  init() {
    if (this.initialized) return;
    
    // If using localStorage, load previously cached items
    if (this.options.storage === 'local') {
      try {
        const savedCache = localStorage.getItem('apiCache');
        if (savedCache) {
          const parsedCache = JSON.parse(savedCache);
          
          // Only restore items that haven't expired
          const now = Date.now();
          Object.keys(parsedCache).forEach(key => {
            const item = parsedCache[key];
            if (item.expiry > now) {
              this.cache.set(key, item);
            }
          });
        }
      } catch (error) {
        console.warn('Failed to restore cache from localStorage', error);
      }
    }
    
    this.initialized = true;
  }

  /**
   * Get an item from the cache
   * @param {string} key - Cache key
   * @returns {*} Cached value or undefined if not found or expired
   */
  get(key) {
    const item = this.cache.get(key);
    
    // Return undefined if item doesn't exist
    if (!item) return undefined;
    
    // Check if item has expired
    if (item.expiry <= Date.now()) {
      this.cache.delete(key);
      return undefined;
    }
    
    // Update last accessed time
    item.lastAccessed = Date.now();
    
    return item.value;
  }

  /**
   * Set a value in the cache
   * @param {string} key - Cache key
   * @param {*} value - Value to cache
   * @param {number} [ttl] - Time to live in milliseconds
   * @returns {boolean} Success status
   */
  set(key, value, ttl) {
    try {
      // Ensure cache doesn't grow too large
      if (this.cache.size >= this.options.maxCacheSize) {
        this.pruneCache();
      }
      
      const expiryTime = ttl || this.options.defaultExpiration;
      const now = Date.now();
      
      this.cache.set(key, {
        value,
        expiry: now + expiryTime,
        created: now,
        lastAccessed: now
      });
      
      // If using localStorage, update stored cache
      if (this.options.storage === 'local') {
        this.persistToLocalStorage();
      }
      
      return true;
    } catch (error) {
      console.warn('Failed to set cache item', error);
      return false;
    }
  }

  /**
   * Remove an item from the cache
   * @param {string} key - Cache key
   * @returns {boolean} Whether the item was removed
   */
  delete(key) {
    const result = this.cache.delete(key);
    
    // If using localStorage, update stored cache
    if (result && this.options.storage === 'local') {
      this.persistToLocalStorage();
    }
    
    return result;
  }

  /**
   * Clear all items from the cache
   */
  clear() {
    this.cache.clear();
    
    // If using localStorage, clear stored cache
    if (this.options.storage === 'local') {
      try {
        localStorage.removeItem('apiCache');
      } catch (error) {
        console.warn('Failed to clear localStorage cache', error);
      }
    }
  }

  /**
   * Check if a key exists in the cache and is not expired
   * @param {string} key - Cache key
   * @returns {boolean} Whether the key exists and is valid
   */
  has(key) {
    const item = this.cache.get(key);
    if (!item) return false;
    
    // Check if item has expired
    if (item.expiry <= Date.now()) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * Prune the cache when it gets too large by removing
   * least recently accessed or oldest items
   * @private
   */
  pruneCache() {
    // Convert to array for sorting
    const entries = [...this.cache.entries()];
    
    // Sort by last accessed time (oldest first)
    entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
    
    // Remove the oldest 20% of items
    const itemsToRemove = Math.max(1, Math.floor(this.cache.size * 0.2));
    for (let i = 0; i < itemsToRemove && i < entries.length; i++) {
      this.cache.delete(entries[i][0]);
    }
  }

  /**
   * Save the current cache to localStorage
   * @private
   */
  persistToLocalStorage() {
    if (this.options.storage !== 'local') return;
    
    try {
      // Convert Map to object for localStorage
      const cacheObject = {};
      for (const [key, value] of this.cache.entries()) {
        cacheObject[key] = value;
      }
      
      localStorage.setItem('apiCache', JSON.stringify(cacheObject));
    } catch (error) {
      console.warn('Failed to persist cache to localStorage', error);
    }
  }
}