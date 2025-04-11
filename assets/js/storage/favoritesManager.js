/**
 * favoritesManager.js
 * Gerencia o armazenamento e exibição de conversões favoritas
 */
import { convertCurrency } from '../services/ratesService.js';

// DOM Element
const favoritesContainer = document.getElementById('favoritesContainer');

// Local Storage key
const FAVORITES_STORAGE_KEY = 'crypto_favorites';

/**
 * Salva uma conversão favorita
 * @param {string} fromCurrency - Moeda FIAT de origem
 * @param {string} toCrypto - Criptomoeda de destino
 * @param {number} amount - Quantidade a converter
 */
function saveFavorite(fromCurrency, toCrypto, amount) {
    const favorites = loadFavorites();
    
    // Create favorite object
    const favorite = {
        id: Date.now(), // Use timestamp as unique ID
        fromCurrency,
        toCrypto,
        amount,
        createdAt: new Date().toISOString()
    };
    
    // Add to favorites array
    favorites.push(favorite);
    
    // Save to localStorage
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
    
    return favorite;
}

/**
 * Carrega as conversões favoritas do localStorage
 * @returns {Array} Array com as conversões favoritas
 */
function loadFavorites() {
    const favoritesJson = localStorage.getItem(FAVORITES_STORAGE_KEY);
    return favoritesJson ? JSON.parse(favoritesJson) : [];
}

/**
 * Remove uma conversão favorita
 * @param {number} id - ID da conversão favorita a remover
 */
function removeFavorite(id) {
    const favorites = loadFavorites();
    const updatedFavorites = favorites.filter(fav => fav.id !== id);
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(updatedFavorites));
    renderFavorites();
}

/**
 * Renderiza as conversões favoritas na UI
 */
function renderFavorites() {
    const favorites = loadFavorites();
    
    if (favorites.length === 0) {
        favoritesContainer.innerHTML = '<p class="text-muted text-center">Nenhuma conversão favorita salva ainda.</p>';
        return;
    }
    
    favoritesContainer.innerHTML = '';
    const favsList = document.createElement('div');
    favsList.className = 'list-group';
    
    favorites.forEach(favorite => {
        try {
            // Try to calculate current value based on latest rates
            const currentResult = convertCurrency(
                favorite.fromCurrency, 
                favorite.toCrypto, 
                favorite.amount
            );
            
            const listItem = document.createElement('div');
            listItem.className = 'list-group-item list-group-item-action';
            
            const formattedAmount = favorite.amount.toLocaleString('pt-BR', { 
                style: 'currency', 
                currency: favorite.fromCurrency 
            });
            
            const formattedResult = currentResult.toLocaleString('pt-BR', { 
                maximumFractionDigits: 8 
            });
            
            listItem.innerHTML = `
                <div class="d-flex w-100 justify-content-between">
                    <h6 class="mb-1">${formattedAmount} → ${favorite.toCrypto}</h6>
                    <button class="btn btn-sm btn-outline-danger delete-favorite" 
                            data-id="${favorite.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <p class="mb-1">${formattedResult} ${favorite.toCrypto}</p>
                <small class="text-muted">
                    Adicionado em ${new Date(favorite.createdAt).toLocaleDateString('pt-BR')}
                </small>
            `;
            
            favsList.appendChild(listItem);
        } catch (error) {
            console.error('Error rendering favorite:', error);
        }
    });
    
    favoritesContainer.appendChild(favsList);
    
    // Add event listeners for delete buttons
    document.querySelectorAll('.delete-favorite').forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const id = parseInt(button.getAttribute('data-id'));
            removeFavorite(id);
        });
    });
}

export {
    saveFavorite,
    loadFavorites,
    removeFavorite,
    renderFavorites
};