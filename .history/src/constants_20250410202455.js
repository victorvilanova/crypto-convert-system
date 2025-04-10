/**
 * Constantes utilizadas em todo o sistema
 */

/**
 * Chaves para armazenamento em localStorage
 */
export const STORAGE_KEYS = {
  THEME: 'crypto_convert_theme',
  SETTINGS: 'crypto_convert_settings',
  LAST_RATES: 'crypto_convert_last_rates',
  HISTORY: 'crypto_convert_history',
  CACHE: 'crypto_convert_cache',
  FAVORITES: 'crypto_convert_favorites'
};

/**
 * Valores padrão para diversas funcionalidades
 */
export const DEFAULTS = {
  THEME: 'light',
  FROM_CURRENCY: 'BTC',
  TO_CURRENCY: 'USD',
  AMOUNT: 1,
  API_TIMEOUT: 10000,
  HISTORY_LIMIT: 10,
  DECIMAL_PLACES: {
    FIAT: 2,
    CRYPTO: 8
  }
};

/**
 * Tempos em milissegundos para diversas operações
 */
export const TIME = {
  CACHE_CURRENCIES: 24 * 60 * 60 * 1000, // 24 horas
  CACHE_RATES: 15 * 60 * 1000, // 15 minutos
  RATE_REFRESH: 5 * 60 * 1000, // 5 minutos
  DEBOUNCE_INPUT: 300, // 300ms
  ANIMATION_DURATION: 500, // 500ms
  ERROR_NOTIFICATION: 5000 // 5 segundos
};

/**
 * Eventos personalizados para comunicação entre componentes
 */
export const EVENTS = {
  RATES_UPDATED: 'crypto-convert:rates-updated',
  CONVERSION_COMPLETE: 'crypto-convert:conversion-complete',
  ERROR: 'crypto-convert:error',
  USER_NOTIFICATION: 'crypto-convert:user-notification',
  THEME_CHANGED: 'crypto-convert:theme-changed',
  CONFIG_CHANGED: 'crypto-convert:config-changed',
  APP_READY: 'crypto-convert:app-ready'
};

/**
 * Configurações de API
 */
export const API = {
  DEFAULT_BASE_URL: 'https://api.exchangerate-api.com/v4',
  ENDPOINTS: {
    RATES: '/latest',
    CURRENCIES: '/currencies'
  },
  FALLBACK_URLS: [
    'https://api.exchangeratesapi.io/latest',
    'https://openexchangerates.org/api/latest.json'
  ]
};

/**
 * Configurações de formatação
 */
export const FORMAT = {
  DATE: {
    SHORT: { day: '2-digit', month: '2-digit', year: 'numeric' },
    LONG: { day: '2-digit', month: 'long', year: 'numeric' },
    TIME: { hour: '2-digit', minute: '2-digit', second: '2-digit' },
    DATETIME: { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit', 
      minute: '2-digit'
    }
  }
};

/**
 * Configurações de UI
 */
export const UI = {
  MAX_MOBILE_WIDTH: 768,
  ANIMATION_CLASS: 'animated',
  THEMES: ['light', 'dark', 'system']
};