/**
 * Constantes globais utilizadas em toda a aplicação
 * Centralizar as constantes facilita manutenção e previne erros de digitação
 */

// API e configurações de rede
export const API = {
  BASE_URL: 'https://api.cryptodata.example.com/v1',
  DEFAULT_TIMEOUT: 10000, // 10 segundos
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 segundo
};

// Intervalos de tempo (em milissegundos)
export const TIME = {
  DEBOUNCE_INPUT: 500,       // Debounce para campos de entrada
  RATE_REFRESH: 300000,      // Atualização de taxas (5 minutos)
  ERROR_NOTIFICATION: 5000,  // Duração da notificação de erro (5 segundos)
  CACHE_CURRENCIES: 86400000, // Cache de moedas (24 horas)
  CACHE_RATES: 300000,       // Cache de taxas (5 minutos)
};

// Valores padrão
export const DEFAULTS = {
  FROM_CURRENCY: 'BTC',
  TO_CURRENCY: 'USD',
  AMOUNT: 1,
  THEME: 'light',
  DECIMAL_PLACES: {
    CRYPTO: 8,
    FIAT: 2,
  },
  HISTORY_ITEMS: 10,
};

// Tipos de moeda
export const CURRENCY_TYPES = {
  CRYPTO: 'crypto',
  FIAT: 'fiat',
};

// Nomes de eventos personalizados
export const EVENTS = {
  CONVERSION_COMPLETE: 'app:conversionComplete',
  RATES_UPDATED: 'app:ratesUpdated',
  ERROR: 'app:error',
  CONFIG_CHANGED: 'app:configChanged',
  THEME_CHANGED: 'app:themeChanged',
};

// Nomes das chaves para localStorage
export const STORAGE_KEYS = {
  THEME: 'cryptoConverter_theme',
  HISTORY: 'cryptoConverter_history',
  LAST_RATES: 'cryptoConverter_lastRates',
  SETTINGS: 'cryptoConverter_settings',
  CACHE: 'cryptoConverter_cache',
};

// URLs para recursos externos
export const RESOURCES = {
  ICONS: {
    BTC: '/assets/icons/btc.svg',
    ETH: '/assets/icons/eth.svg',
    USD: '/assets/icons/usd.svg',
    EUR: '/assets/icons/eur.svg',
  },
  DOCS: 'https://docs.cryptoconverter.example.com',
  SUPPORT: 'https://support.cryptoconverter.example.com',
};