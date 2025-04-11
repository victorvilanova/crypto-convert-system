/**
 * Gerenciador de consentimento de uso de cookies e privacidade
 */
import { analytics } from './Analytics';

/**
 * Classe para gerenciar consentimento de cookies e rastreamento
 */
export class ConsentManager {
  /**
   * @param {Object} options - Opções de configuração
   * @param {string} options.storageKey - Chave para salvar o consentimento
   * @param {number} options.expirationDays - Dias para expirar o consentimento
   * @param {boolean} options.autoShowBanner - Exibir banner automaticamente
   */
  constructor(options = {}) {
    const {
      storageKey = 'fastcripto_consent',
      expirationDays = 365,
      autoShowBanner = true
    } = options;
    
    this.storageKey = storageKey;
    this.expirationDays = expirationDays;
    this.autoShowBanner = autoShowBanner;
    this.initialized = false;
    
    // Verificar consentimento existente
    this.consentStatus = this._getStoredConsent();
    
    // Inicializar se configurado
    if (autoShowBanner) {
      this.init();
    }
  }
  
  /**
   * Inicializa o gerenciador de consentimento
   */
  init() {
    if (this.initialized) return;
    
    // Registrar ouvintes de eventos
    document.addEventListener('DOMContentLoaded', () => {
      // Mostrar banner se não houver consentimento
      if (this.consentStatus === null) {
        this._showConsentBanner();
      } else {
        // Aplicar preferências de consentimento salvas
        this._applyConsent(this.consentStatus);
      }
    });
    
    this.initialized = true;
  }
  
  /**
   * Obtém o consentimento armazenado
   * @private
   * @returns {Object|null} - Status de consentimento ou null se não existir
   */
  _getStoredConsent() {
    try {
      const storedData = localStorage.getItem(this.storageKey);
      if (!storedData) return null;
      
      const consentData = JSON.parse(storedData);
      
      // Verificar se expirou
      if (consentData.expiry && new Date() > new Date(consentData.expiry)) {
        this._removeConsent();
        return null;
      }
      
      return consentData.preferences || null;
    } catch (error) {
      console.error('Erro ao recuperar consentimento:', error);
      return null;
    }
  }
  
  /**
   * Salva as preferências de consentimento
   * @private
   * @param {Object} preferences - Preferências de consentimento
   */
  _storeConsent(preferences) {
    try {
      // Calcular data de expiração
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + this.expirationDays);
      
      const consentData = {
        preferences,
        timestamp: new Date().toISOString(),
        expiry: expiry.toISOString()
      };
      
      localStorage.setItem(this.storageKey, JSON.stringify(consentData));
      this.consentStatus = preferences;
    } catch (error) {
      console.error('Erro ao salvar consentimento:', error);
    }
  }
  
  /**
   * Remove o consentimento armazenado
   * @private
   */
  _removeConsent() {
    localStorage.removeItem(this.storageKey);
    this.consentStatus = null;
  }
  
  /**
   * Exibe o banner de consentimento
   * @private
   */
  _showConsentBanner() {
    // Verificar se o banner já existe
    if (document.getElementById('consent-banner')) return;
    
    // Criar o banner
    const banner = document.createElement('div');
    banner.id = 'consent-banner';
    banner.className = 'consent-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-labelledby', 'consent-title');
    banner.setAttribute('aria-describedby', 'consent-description');
    
    banner.innerHTML = `
      <div class="consent-content">
        <h2 id="consent-title">Cookies e Privacidade</h2>
        <p id="consent-description">
          Usamos cookies para melhorar sua experiência e analisar o uso do site. 
          Você pode personalizar quais tipos de cookies aceita.
        </p>
        
        <div class="consent-options">
          <div class="consent-option">
            <input type="checkbox" id="consent-necessary" checked disabled>
            <label for="consent-necessary">Necessários (obrigatórios)</label>
            <small>Essenciais para o funcionamento do site</small>
          </div>
          
          <div class="consent-option">
            <input type="checkbox" id="consent-analytics" checked>
            <label for="consent-analytics">Analytics</label>
            <small>Nos ajudam a entender como você usa o site</small>
          </div>
          
          <div class="consent-option">
            <input type="checkbox" id="consent-preferences" checked>
            <label for="consent-preferences">Preferências</label>
            <small>Permitem salvar suas configurações</small>
          </div>
        </div>
        
        <div class="consent-actions">
          <button id="consent-accept-all" class="btn btn-primary">Aceitar Todos</button>
          <button id="consent-save" class="btn btn-secondary">Salvar Preferências</button>
          <button id="consent-reject-all" class="btn btn-text">Rejeitar Não-Essenciais</button>
        </div>
        
        <div class="consent-footer">
          <a href="/privacidade.html">Política de Privacidade</a>
        </div>
      </div>
    `;
    
    // Estilos inline para o banner
    const style = document.createElement('style');
    style.textContent = `
      .consent-banner {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background-color: var(--bg-card);
        box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
        z-index: 1000;
        border-top: 1px solid var(--border-color);
        font-size: 14px;
      }
      
      .consent-content {
        max-width: 800px;
        margin: 0 auto;
        padding: 1.5rem;
      }
      
      .consent-options {
        margin: 1.5rem 0;
      }
      
      .consent-option {
        margin-bottom: 0.75rem;
        display: flex;
        flex-direction: column;
      }
      
      .consent-option small {
        color: var(--text-muted);
        margin-left: 1.5rem;
      }
      
      .consent-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin-bottom: 1rem;
      }
      
      .consent-footer {
        text-align: center;
        margin-top: 1rem;
        font-size: 0.8rem;
      }
      
      .btn-text {
        background: none;
        border: none;
        color: var(--text-secondary);
        cursor: pointer;
        padding: 0.5rem;
        text-decoration: underline;
      }
      
      @media (min-width: 768px) {
        .consent-option {
          flex-direction: row;
          align-items: center;
        }
        
        .consent-option small {
          margin-left: 0.5rem;
        }
      }
    `;
    
    // Adicionar o banner e estilos ao documento
    document.head.appendChild(style);
    document.body.appendChild(banner);
    
    // Configurar listeners
    document.getElementById('consent-accept-all').addEventListener('click', () => {
      this.acceptAll();
      this._removeConsentBanner();
    });
    
    document.getElementById('consent-save').addEventListener('click', () => {
      const preferences = {
        necessary: true, // Sempre obrigatório
        analytics: document.getElementById('consent-analytics').checked,
        preferences: document.getElementById('consent-preferences').checked
      };
      
      this.savePreferences(preferences);
      this._removeConsentBanner();
    });
    
    document.getElementById('consent-reject-all').addEventListener('click', () => {
      this.rejectAll();
      this._removeConsentBanner();
    });
  }
  
  /**
   * Remove o banner de consentimento
   * @private
   */
  _removeConsentBanner() {
    const banner = document.getElementById('consent-banner');
    if (banner) {
      banner.remove();
    }
  }
  
  /**
   * Aplica as preferências de consentimento
   * @private
   * @param {Object} preferences - Preferências de consentimento
   */
  _applyConsent(preferences) {
    if (!preferences) return;
    
    // Aplicar configurações de analytics
    if (analytics && typeof analytics.setTrackingAllowed === 'function') {
      analytics.setTrackingAllowed(preferences.analytics === true);
    }
  }
  
  /**
   * Aceita todos os tipos de cookies
   */
  acceptAll() {
    const preferences = {
      necessary: true,
      analytics: true,
      preferences: true
    };
    
    this._storeConsent(preferences);
    this._applyConsent(preferences);
  }
  
  /**
   * Rejeita todos os cookies não essenciais
   */
  rejectAll() {
    const preferences = {
      necessary: true,
      analytics: false,
      preferences: false
    };
    
    this._storeConsent(preferences);
    this._applyConsent(preferences);
  }
  
  /**
   * Salva preferências específicas
   * @param {Object} preferences - Preferências de consentimento
   */
  savePreferences(preferences) {
    // Garantir que necessary seja sempre true
    const updatedPreferences = {
      ...preferences,
      necessary: true
    };
    
    this._storeConsent(updatedPreferences);
    this._applyConsent(updatedPreferences);
  }
  
  /**
   * Retorna o status atual do consentimento
   * @returns {Object|null} - Preferências de consentimento ou null se não houver
   */
  getConsent() {
    return this.consentStatus;
  }
  
  /**
   * Verifica se um tipo específico de consentimento foi dado
   * @param {string} type - Tipo de consentimento ('necessary', 'analytics', 'preferences')
   * @returns {boolean} - Se o consentimento foi dado
   */
  hasConsent(type) {
    // Necessary é sempre true
    if (type === 'necessary') return true;
    
    // Se não houver consentimento registrado, retornar false para todos os outros tipos
    if (!this.consentStatus) return false;
    
    return this.consentStatus[type] === true;
  }
  
  /**
   * Abre o diálogo de gerenciamento de consentimento
   */
  openPreferences() {
    // Remover banner existente, se houver
    this._removeConsentBanner();
    
    // Mostrar o banner
    this._showConsentBanner();
    
    // Se já houver consentimento, preencher os checkboxes
    if (this.consentStatus) {
      const analyticsCheckbox = document.getElementById('consent-analytics');
      const preferencesCheckbox = document.getElementById('consent-preferences');
      
      if (analyticsCheckbox) analyticsCheckbox.checked = this.consentStatus.analytics === true;
      if (preferencesCheckbox) preferencesCheckbox.checked = this.consentStatus.preferences === true;
    }
  }
}

// Exportar instância padrão
export const consentManager = new ConsentManager();
export default consentManager;