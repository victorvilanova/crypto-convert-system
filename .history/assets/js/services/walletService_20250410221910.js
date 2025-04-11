/**
 * walletService.js
 * Serviço responsável pelo gerenciamento de carteiras (wallets) e endereços blockchain
 */

// Lista de redes suportadas
const SUPPORTED_NETWORKS = {
    TRON: {
        name: 'TRON',
        symbol: 'TRX',
        addressPrefix: 'T',
        addressLength: 34,
        explorerUrl: 'https://tronscan.org/#/address/'
    },
    ETH: {
        name: 'Ethereum',
        symbol: 'ETH',
        addressPrefix: '0x',
        addressLength: 42,
        explorerUrl: 'https://etherscan.io/address/'
    },
    BSC: {
        name: 'Binance Smart Chain',
        symbol: 'BNB',
        addressPrefix: '0x',
        addressLength: 42,
        explorerUrl: 'https://bscscan.com/address/'
    },
    POLYGON: {
        name: 'Polygon',
        symbol: 'MATIC',
        addressPrefix: '0x',
        addressLength: 42,
        explorerUrl: 'https://polygonscan.com/address/'
    }
};

// Mapeamento de criptomoedas para redes suportadas
const CRYPTO_NETWORKS = {
    USDT: ['TRON', 'ETH', 'BSC', 'POLYGON'],
    BTC: ['BTC'],
    ETH: ['ETH'],
    ADA: ['ADA'],
    SOL: ['SOL'],
    DOT: ['DOT']
};

// Rede padrão para cada criptomoeda
const DEFAULT_NETWORKS = {
    USDT: 'TRON',
    BTC: 'BTC',
    ETH: 'ETH',
    ADA: 'ADA',
    SOL: 'SOL',
    DOT: 'DOT'
};

/**
 * Verifica se um endereço de carteira é válido para a rede especificada
 * @param {string} address - Endereço da carteira
 * @param {string} network - Rede blockchain (ex: TRON, ETH)
 * @returns {Object} Resultado da validação
 */
function validateWalletAddress(address, network) {
    if (!address || !network) {
        return {
            valid: false,
            reason: 'Endereço ou rede não especificados'
        };
    }
    
    // Obter configuração da rede
    const networkConfig = SUPPORTED_NETWORKS[network];
    if (!networkConfig) {
        return {
            valid: false,
            reason: `Rede ${network} não suportada`
        };
    }
    
    // Validações básicas por rede
    if (network === 'TRON') {
        // Endereços TRON começam com T e têm 34 caracteres
        if (!address.startsWith('T') || address.length !== 34) {
            return {
                valid: false,
                reason: 'Endereço TRON inválido. Deve começar com T e ter 34 caracteres.'
            };
        }
    } else if (['ETH', 'BSC', 'POLYGON'].includes(network)) {
        // Endereços ETH/BSC/POLYGON começam com 0x e têm 42 caracteres
        if (!address.startsWith('0x') || address.length !== 42) {
            return {
                valid: false,
                reason: `Endereço ${network} inválido. Deve começar com 0x e ter 42 caracteres.`
            };
        }
    }
    
    // Se chegou aqui, passou nas validações básicas
    return {
        valid: true,
        network: networkConfig
    };
}

/**
 * Obtém as redes suportadas para uma criptomoeda
 * @param {string} crypto - Símbolo da criptomoeda (ex: USDT, BTC)
 * @returns {Array} Lista de redes suportadas
 */
function getSupportedNetworks(crypto) {
    return CRYPTO_NETWORKS[crypto] || [];
}

/**
 * Obtém a rede padrão para uma criptomoeda
 * @param {string} crypto - Símbolo da criptomoeda (ex: USDT, BTC)
 * @returns {string} Rede padrão
 */
function getDefaultNetwork(crypto) {
    return DEFAULT_NETWORKS[crypto] || '';
}

/**
 * Salva o endereço da carteira do usuário
 * @param {string} crypto - Símbolo da criptomoeda
 * @param {string} network - Rede blockchain
 * @param {string} address - Endereço da carteira
 * @returns {Object} Resultado da operação
 */
function saveWalletAddress(crypto, network, address) {
    // Validar o endereço primeiro
    const validationResult = validateWalletAddress(address, network);
    if (!validationResult.valid) {
        return {
            success: false,
            reason: validationResult.reason
        };
    }
    
    // Estrutura para armazenar endereços de carteiras
    const wallets = loadWallets();
    
    // Adicionar/atualizar o endereço
    if (!wallets[crypto]) {
        wallets[crypto] = {};
    }
    
    wallets[crypto][network] = {
        address: address,
        addedAt: new Date().toISOString(),
        lastUsed: new Date().toISOString()
    };
    
    // Salvar no localStorage
    localStorage.setItem('crypto_wallets', JSON.stringify(wallets));
    
    return {
        success: true,
        wallet: wallets[crypto][network]
    };
}

/**
 * Carrega as carteiras salvas do usuário
 * @returns {Object} Carteiras salvas
 */
function loadWallets() {
    const walletsJson = localStorage.getItem('crypto_wallets');
    return walletsJson ? JSON.parse(walletsJson) : {};
}

/**
 * Busca um endereço de carteira específico
 * @param {string} crypto - Símbolo da criptomoeda
 * @param {string} network - Rede blockchain
 * @returns {string|null} Endereço da carteira ou null se não encontrado
 */
function getWalletAddress(crypto, network) {
    const wallets = loadWallets();
    return wallets[crypto] && wallets[crypto][network] ? 
        wallets[crypto][network].address : null;
}

export {
    validateWalletAddress,
    getSupportedNetworks,
    getDefaultNetwork,
    saveWalletAddress,
    loadWallets,
    getWalletAddress,
    SUPPORTED_NETWORKS
};