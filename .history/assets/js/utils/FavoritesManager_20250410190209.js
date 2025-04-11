/**
 * FavoritesManager.js
 * Gerencia o armazenamento e recuperação de conversões favoritas
 */
export default class FavoritesManager {
  constructor() {
    this.storageKey = 'crypto_convert_favorites';
    this.maxFavorites = 5;
  }

  /**
   * Obtém a lista de favoritos
   * @returns {Array} Lista de favoritos
   */
  getFavorites() {
    try {
      const favorites = localStorage.getItem(this.storageKey);
      return favorites ? JSON.parse(favorites) : [];
    } catch (error) {
      console.error('Erro ao recuperar favoritos:', error);
      return [];
    }
  }

  /**
   * Adiciona uma conversão aos favoritos
   * @param {Object} conversion - Dados da conversão a ser salva
   * @returns {boolean} Verdadeiro se salvo com sucesso
   */
  addFavorite(conversion) {
    try {
      // Valida os dados da conversão
      if (
        !conversion.fromCurrency ||
        !conversion.toCrypto ||
        !conversion.amount
      ) {
        return false;
      }

      const favorites = this.getFavorites();

      // Verifica se já existe um favorito igual
      const existingIndex = favorites.findIndex(
        (fav) =>
          fav.fromCurrency === conversion.fromCurrency &&
          fav.toCrypto === conversion.toCrypto
      );

      // Se existir, atualiza o valor
      if (existingIndex >= 0) {
        favorites[existingIndex] = conversion;
      } else {
        // Se atingiu o limite, remove o mais antigo
        if (favorites.length >= this.maxFavorites) {
          favorites.shift();
        }

        // Adiciona o novo favorito
        favorites.push(conversion);
      }

      localStorage.setItem(this.storageKey, JSON.stringify(favorites));
      return true;
    } catch (error) {
      console.error('Erro ao salvar favorito:', error);
      return false;
    }
  }

  /**
   * Remove um favorito da lista
   * @param {number} index - Índice do favorito a ser removido
   * @returns {boolean} Verdadeiro se removido com sucesso
   */
  removeFavorite(index) {
    try {
      const favorites = this.getFavorites();

      if (index < 0 || index >= favorites.length) {
        return false;
      }

      favorites.splice(index, 1);
      localStorage.setItem(this.storageKey, JSON.stringify(favorites));
      return true;
    } catch (error) {
      console.error('Erro ao remover favorito:', error);
      return false;
    }
  }

  /**
   * Limpa todos os favoritos
   * @returns {boolean} Verdadeiro se limpo com sucesso
   */
  clearFavorites() {
    try {
      localStorage.removeItem(this.storageKey);
      return true;
    } catch (error) {
      console.error('Erro ao limpar favoritos:', error);
      return false;
    }
  }
}
