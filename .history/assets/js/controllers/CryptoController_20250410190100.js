/**
 * CryptoController.js
 * Responsável por conectar o Model e a View, gerenciando a lógica da aplicação
 */
import CryptoModel from '../models/CryptoModel.js';
import CryptoView from '../views/CryptoView.js';
import PerformanceUtils from '../utils/PerformanceUtils.js';
import FavoritesManager from '../utils/FavoritesManager.js';

export default class CryptoController {
  constructor() {
    this.model = new CryptoModel();
    this.view = new CryptoView();
    this.updateInterval = null;
    this.favoritesManager = new FavoritesManager();

    // Usa o utilitário de performance para determinar o intervalo de atualização
    this.updateFrequencyMs = PerformanceUtils.getRecommendedUpdateInterval();

    // Aplica debounce na função de conversão
    this.debouncedConvert = PerformanceUtils.debounce(
      this.handleConvert.bind(this),
      500
    );

    // Estado para controle de exibição da tabela
    this.showAllCurrencies = false;
  }

  /**
   * Inicializa o controlador
   */
  init() {
    // Configura os event listeners com funções debounced
    this.view.initEventListeners(this.debouncedConvert);

    // Adiciona listener para o botão de atualização forçada
    this.setupForceUpdateButton();

    // Carrega os dados iniciais
    this.loadInitialData();

    // Configura atualização automática das taxas
    this.setupAutoUpdate();

    // Detecta modo offline/online
    this.setupConnectivityListener();

    // Configura os favoritos
    this.setupFavorites();

    // Configura o checkbox para mostrar todas as moedas
    this.setupShowAllCurrenciesCheckbox();
  }

  /**
   * Configura o listener para o botão de atualização forçada
   */
  setupForceUpdateButton() {
    const forceUpdateBtn = document.getElementById('forceUpdateBtn');
    if (forceUpdateBtn) {
      forceUpdateBtn.addEventListener('click', async () => {
        try {
          this.view.showLoading();
          // Limpa o cache antes de atualizar
          this.model.clearRatesCache();
          await this.updateRates();
          this.updateRatesTable();
          this.view.displayMessage('Taxas atualizadas com sucesso!', 'success');
        } catch (error) {
          this.view.displayError(error.message);
        } finally {
          this.view.hideLoading();
        }
      });
    }
  }

  /**
   * Configura listener para detectar conectividade
   */
  setupConnectivityListener() {
    window.addEventListener('online', () => {
      this.view.hideOfflineAlert();
      // Atualiza as taxas quando voltar a ficar online
      this.updateRates().then(() => this.updateRatesTable());
    });

    window.addEventListener('offline', () => {
      this.view.showOfflineAlert();
    });
  }

  /**
   * Carrega os dados iniciais da aplicação
   */
  async loadInitialData() {
    try {
      this.view.showLoading();

      // Popula os dropdowns com as opções disponíveis e valores padrão
      this.view.populateDropdowns(
        this.model.getSupportedCryptos(),
        this.model.getSupportedCurrencies(),
        this.model.getDefaultCurrency(),
        this.model.getDefaultCrypto()
      );

      // Busca as taxas iniciais
      await this.updateRates();

      // Atualiza a tabela de taxas
      this.updateRatesTable();

      // Define valor inicial do campo
      this.view.setInitialAmount(100);
    } catch (error) {
      this.view.displayError(error.message);
      console.error('Error loading initial data:', error);
    } finally {
      this.view.hideLoading();
    }
  }

  /**
   * Configura a atualização automática de taxas
   */
  setupAutoUpdate() {
    // Limpa qualquer intervalo existente
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    // Configura novo intervalo para atualização de taxas
    this.updateInterval = setInterval(async () => {
      try {
        // Não atualizamos se estiver offline
        if (!navigator.onLine) return;

        await this.updateRates();
        // Atualiza a tabela de taxas a cada atualização
        this.updateRatesTable();
        console.log('Taxas atualizadas automaticamente');
      } catch (error) {
        console.error('Erro ao atualizar taxas:', error);
      }
    }, this.updateFrequencyMs);
  }

  /**
   * Configura o checkbox para mostrar todas as moedas
   */
  setupShowAllCurrenciesCheckbox() {
    const showAllCheckbox = document.getElementById('showAllCurrencies');
    if (showAllCheckbox) {
      showAllCheckbox.addEventListener('change', (e) => {
        this.showAllCurrencies = e.target.checked;
        this.updateRatesTable();
      });
    }
  }

  /**
   * Atualiza as taxas de câmbio
   */
  async updateRates() {
    try {
      await this.model.fetchRates();
      this.view.updateLastUpdateTime();
      return true;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  /**
   * Atualiza a tabela de taxas de câmbio na view
   */
  updateRatesTable() {
    let ratesTable;
    
    if (this.showAllCurrencies) {
      // Mostra todas as taxas de câmbio
      ratesTable = this.model.getAllRates();
    } else {
      // Mostra apenas as taxas para a moeda FIAT atualmente selecionada
      const currentFiat = this.view.getFormValues().fromCurrency;
      ratesTable = this.model.getFilteredRates(currentFiat);
    }
    
    this.view.updateRatesTable(ratesTable);
  }

  /**
   * Manipula o evento de conversão
   */
  async handleConvert() {
    try {
      this.view.showLoading();

      // Obtem os valores do formulário
      const { fromCurrency, toCrypto, amount } = this.view.getFormValues();

      // Atualiza a tabela de taxas para mostrar a moeda atual
      if (!this.showAllCurrencies) {
        this.updateRatesTable();
      }

      // Realiza a conversão de FIAT para cripto
      const convertedAmount = this.model.convert(
        fromCurrency,
        toCrypto,
        amount
      );

      // Exibe o resultado
      this.view.displayResult({
        fromCurrency,
        toCrypto,
        amount,
        convertedAmount,
      });
    } catch (error) {
      this.view.displayError(error.message);
      console.error('Conversion error:', error);
    } finally {
      this.view.hideLoading();
    }
  }

  /**
   * Configura a funcionalidade de favoritos
   */
  setupFavorites() {
    // Carrega os favoritos salvos
    this.loadFavorites();

    // Configura os botões de favoritos
    this.view.setupFavoriteButtons((index) => this.applyFavorite(index), 
                                   (index) => this.removeFavorite(index));

    // Configura o botão de adicionar favorito
    const addFavButton = document.getElementById('addFavoriteBtn');
    if (addFavButton) {
      addFavButton.addEventListener('click', () => this.saveCurrentAsFavorite());
    }
  }

  /**
   * Carrega os favoritos salvos
   */
  loadFavorites() {
    const favorites = this.favoritesManager.getFavorites();
    this.view.displayFavorites(favorites);
  }

  /**
   * Salva a conversão atual como favorita
   */
  saveCurrentAsFavorite() {
    try {
      const values = this.view.getFormValues();

      // Verifica se os valores são válidos
      if (!values.fromCurrency || !values.toCrypto || !values.amount) {
        this.view.displayError('Preencha todos os campos para salvar como favorito');
        return;
      }

      const favorite = {
        fromCurrency: values.fromCurrency,
        toCrypto: values.toCrypto,
        amount: values.amount,
        label: `${values.amount} ${values.fromCurrency} → ${values.toCrypto}`
      };

      const success = this.favoritesManager.addFavorite(favorite);

      if (success) {
        this.loadFavorites(); // Recarrega a lista
        this.view.displayMessage('Conversão salva nos favoritos', 'success');
      } else {
        this.view.displayError('Não foi possível salvar nos favoritos');
      }
    } catch (error) {
      console.error('Erro ao salvar favorito:', error);
      this.view.displayError('Erro ao salvar favorito');
    }
  }

  /**
   * Aplica um favorito aos campos do formulário
   * @param {number} index - Índice do favorito a ser aplicado
   */
  applyFavorite(index) {
    try {
      const favorites = this.favoritesManager.getFavorites();
      if (index >= 0 && index < favorites.length) {
        const favorite = favorites[index];
        this.view.setFormValues(favorite);
        this.debouncedConvert();
      }
    } catch (error) {
      console.error('Erro ao aplicar favorito:', error);
    }
  }

  /**
   * Remove um favorito da lista
   * @param {number} index - Índice do favorito a ser removido
   */
  removeFavorite(index) {
    try {
      const success = this.favoritesManager.removeFavorite(index);
      if (success) {
        this.loadFavorites(); // Recarrega a lista
        this.view.displayMessage('Favorito removido', 'info');
      }
    } catch (error) {
      console.error('Erro ao remover favorito:', error);
    }
  }

  /**
   * Limpa recursos ao destruir o controlador
   */
  destroy() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    // Remove event listeners
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
  }
}
