/**
 * Sistema de internacionalização (i18n) para suporte a múltiplos idiomas
 */

// Idiomas suportados
const SUPPORTED_LOCALES = ['pt-BR', 'en-US', 'es-ES'];

// Configurações padrão
const DEFAULT_LOCALE = 'pt-BR';
const STORAGE_KEY = 'fastcripto_locale';

// Armazenamento para as traduções
let translations = {};
let currentLocale = DEFAULT_LOCALE;

/**
 * Inicializa o sistema de internacionalização
 * @param {Object} options - Opções de configuração
 * @returns {Promise} - Promise que resolve quando as traduções são carregadas
 */
export async function initI18n(options = {}) {
  // Definir locale inicial
  currentLocale = _determineLocale(options.locale);
  
  // Carregar as traduções
  await loadTranslations(currentLocale);
  
  // Configurar observador de elementos para tradução automática
  _setupAutoTranslation();
  
  return { locale: currentLocale };
}

/**
 * Determina o locale a ser usado com base nas preferências
 * @private
 * @param {string} forcedLocale - Locale forçado (opcional)
 * @returns {string} - Locale selecionado
 */
function _determineLocale(forcedLocale) {
  // Se um locale foi forçado, tente usá-lo
  if (forcedLocale && SUPPORTED_LOCALES.includes(forcedLocale)) {
    return forcedLocale;
  }
  
  // Verificar locale armazenado
  const storedLocale = localStorage.getItem(STORAGE_KEY);
  if (storedLocale && SUPPORTED_LOCALES.includes(storedLocale)) {
    return storedLocale;
  }
  
  // Tentar detectar pelo navegador
  const browserLocales = navigator.languages || [navigator.language || navigator.userLanguage];
  
  for (const browserLocale of browserLocales) {
    // Verificar correspondência exata
    if (SUPPORTED_LOCALES.includes(browserLocale)) {
      return browserLocale;
    }
    
    // Verificar correspondência de idioma (sem região)
    const language = browserLocale.split('-')[0];
    const matchingLocale = SUPPORTED_LOCALES.find(locale => locale.startsWith(language + '-'));
    
    if (matchingLocale) {
      return matchingLocale;
    }
  }
  
  // Voltar para o padrão
  return DEFAULT_LOCALE;
}

/**
 * Carrega as traduções para um locale específico
 * @param {string} locale - Locale para carregar
 * @returns {Promise} - Promise que resolve quando as traduções são carregadas
 */
export async function loadTranslations(locale) {
  if (!SUPPORTED_LOCALES.includes(locale)) {
    console.warn(`Locale ${locale} não é suportado. Usando ${DEFAULT_LOCALE}.`);
    locale = DEFAULT_LOCALE;
  }
  
  try {
    // Se já tivermos carregado este locale, não precisamos buscá-lo novamente
    if (translations[locale]) {
      currentLocale = locale;
      localStorage.setItem(STORAGE_KEY, locale);
      return;
    }
    
    // Carregar arquivo de tradução
    const response = await fetch(`/assets/locales/${locale}.json`);
    
    if (!response.ok) {
      throw new Error(`Falha ao carregar traduções para ${locale}`);
    }
    
    const localeData = await response.json();
    
    // Armazenar traduções
    translations[locale] = localeData;
    
    // Atualizar locale atual
    currentLocale = locale;
    localStorage.setItem(STORAGE_KEY, locale);
    
    // Atualizar o atributo lang no HTML
    document.documentElement.setAttribute('lang', locale);
    
    // Aplicar traduções aos elementos existentes
    translatePage();
    
    // Disparar evento de mudança de idioma
    window.dispatchEvent(new CustomEvent('localechange', { 
      detail: { locale }
    }));
    
  } catch (error) {
    console.error('Erro ao carregar traduções:', error);
    
    // Em caso de erro, tentar carregar o locale padrão
    if (locale !== DEFAULT_LOCALE) {
      return loadTranslations(DEFAULT_LOCALE);
    }
  }
}

/**
 * Configura observador de DOM para tradução automática
 * @private
 */
function _setupAutoTranslation() {
  // Observar mudanças no DOM para traduzir novos elementos
  const observer = new MutationObserver((mutations) => {
    let shouldTranslate = false;
    
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        shouldTranslate = true;
      }
    });
    
    if (shouldTranslate) {
      translatePage();
    }
  });
  
  // Iniciar observação
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

/**
 * Traduz uma chave para o idioma atual
 * @param {string} key - Chave de tradução
 * @param {Object} params - Parâmetros para substituir na tradução
 * @returns {string} - Texto traduzido
 */
export function t(key, params = {}) {
  // Verificar se temos traduções para o locale atual
  if (!translations[currentLocale]) {
    return key; // Retornar a chave se não temos traduções
  }
  
  // Buscar tradução recursivamente (suporta chaves aninhadas como 'menu.home')
  let translation = key.split('.').reduce((obj, k) => obj && obj[k], translations[currentLocale]);
  
  // Se não encontrou tradução, tentar no locale padrão
  if (!translation && currentLocale !== DEFAULT_LOCALE && translations[DEFAULT_LOCALE]) {
    translation = key.split('.').reduce((obj, k) => obj && obj[k], translations[DEFAULT_LOCALE]);
  }
  
  // Se ainda não encontrou, retornar a chave
  if (!translation) {
    return key;
  }
  
  // Substituir parâmetros
  return translation.replace(/\{\{(\w+)\}\}/g, (_, paramName) => {
    return params[paramName] !== undefined ? params[paramName] : `{{${paramName}}}`;
  });
}

/**
 * Traduz uma chave com pluralização
 * @param {string} key - Chave base de tradução
 * @param {number} count - Contagem para determinar a forma
 * @param {Object} params - Parâmetros adicionais
 * @returns {string} - Texto traduzido com pluralização
 */
export function tp(key, count, params = {}) {
  // Determinar a chave a usar baseado na contagem
  const pluralKey = count === 1 ? `${key}.one` : `${key}.other`;
  
  // Incluir a contagem nos parâmetros
  const paramsWithCount = {
    ...params,
    count
  };
  
  return t(pluralKey, paramsWithCount);
}

/**
 * Formata uma data de acordo com o locale atual
 * @param {Date|string|number} date - Data a formatar
 * @param {Object} options - Opções de formatação (como em Intl.DateTimeFormat)
 * @returns {string} - Data formatada
 */
export function formatDate(date, options = {}) {
  const dateObj = date instanceof Date ? date : new Date(date);
  
  return new Intl.DateTimeFormat(currentLocale, options).format(dateObj);
}

/**
 * Formata um número de acordo com o locale atual
 * @param {number} number - Número a formatar
 * @param {Object} options - Opções de formatação (como em Intl.NumberFormat)
 * @returns {string} - Número formatado
 */
export function formatNumber(number, options = {}) {
  return new Intl.NumberFormat(currentLocale, options).format(number);
}

/**
 * Formata uma moeda de acordo com o locale atual
 * @param {number} amount - Valor a formatar
 * @param {string} currency - Código da moeda (ex: 'BRL', 'USD')
 * @returns {string} - Valor formatado como moeda
 */
export function formatCurrency(amount, currency = 'BRL') {
  return new Intl.NumberFormat(currentLocale, {
    style: 'currency',
    currency
  }).format(amount);
}

/**
 * Traduz todos os elementos da página com atributos data-i18n
 */
export function translatePage() {
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const key = element.getAttribute('data-i18n');
    
    if (key) {
      // Buscar parâmetros
      const params = {};
      
      // Verificar atributos data-i18n-param-*
      [...element.attributes].forEach(attr => {
        const match = attr.name.match(/^data-i18n-param-(.+)$/);
        if (match) {
          params[match[1]] = attr.value;
        }
      });
      
      // Verificar se é pluralização
      if (element.hasAttribute('data-i18n-count')) {
        const count = parseInt(element.getAttribute('data-i18n-count'), 10);
        element.textContent = tp(key, count, params);
      } else {
        element.textContent = t(key, params);
      }
    }
  });
  
  // Traduzir atributos com data-i18n-attr-*
  document.querySelectorAll('[data-i18n-attr]').forEach(element => {
    const attrs = element.getAttribute('data-i18n-attr').split(',');
    
    attrs.forEach(attrPair => {
      const [attr, key] = attrPair.trim().split(':');
      
      if (attr && key) {
        element.setAttribute(attr, t(key));
      }
    });
  });
}

/**
 * Muda o idioma atual
 * @param {string} locale - Novo locale
 * @returns {Promise} - Promise que resolve quando as traduções são carregadas
 */
export async function changeLocale(locale) {
  if (!SUPPORTED_LOCALES.includes(locale)) {
    throw new Error(`Locale ${locale} não é suportado.`);
  }
  
  await loadTranslations(locale);
  translatePage();
  
  return { locale };
}

/**
 * Retorna o locale atual
 * @returns {string} - Locale atual
 */
export function getCurrentLocale() {
  return currentLocale;
}

/**
 * Retorna a lista de locales suportados
 * @returns {string[]} - Array de locales suportados
 */
export function getSupportedLocales() {
  return [...SUPPORTED_LOCALES];
}

// Exportar objeto com todas as funções
export default {
  initI18n,
  t,
  tp,
  formatDate,
  formatNumber,
  formatCurrency,
  translatePage,
  changeLocale,
  getCurrentLocale,
  getSupportedLocales
};