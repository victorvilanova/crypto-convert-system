/**
 * kycService.js
 * Serviço responsável pelo processo de KYC (Know Your Customer)
 */

/**
 * Níveis de verificação KYC
 */
const KYC_LEVELS = {
    NONE: 0,     // Não verificado
    BASIC: 1,    // Email verificado
    TIER1: 2,    // Documentos básicos (RG/CPF)
    TIER2: 3     // Comprovante de residência e selfie
};

/**
 * Status de verificação KYC
 */
const KYC_STATUS = {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected'
};

/**
 * Limites de transação por nível KYC (em BRL)
 */
const KYC_LIMITS = {
    [KYC_LEVELS.NONE]: 0,
    [KYC_LEVELS.BASIC]: 1000,
    [KYC_LEVELS.TIER1]: 10000,
    [KYC_LEVELS.TIER2]: 100000
};

// Simulando usuário atual com seu nível KYC
let currentUserKYC = {
    level: KYC_LEVELS.BASIC,
    status: KYC_STATUS.APPROVED,
    email: 'usuario@exemplo.com',
    documents: {
        idCard: null,
        cpf: null,
        addressProof: null,
        selfie: null
    },
    verifiedAt: null
};

/**
 * Verifica se o usuário tem verificação KYC suficiente para uma transação
 * @param {number} amount - Valor da transação em BRL
 * @returns {Object} Objeto com resultado da verificação
 */
function verifyKYCForTransaction(amount) {
    // Se o usuário está no nível zero, não pode fazer nenhuma transação
    if (currentUserKYC.level === KYC_LEVELS.NONE) {
        return {
            approved: false,
            reason: 'Verificação de email necessária',
            requiredLevel: KYC_LEVELS.BASIC,
            currentLevel: currentUserKYC.level
        };
    }
    
    // Verificar se o valor da transação está dentro do limite para o nível KYC atual
    const currentLimit = KYC_LIMITS[currentUserKYC.level];
    
    if (amount > currentLimit) {
        // Determinar qual nível de KYC é necessário para esta transação
        let requiredLevel = KYC_LEVELS.BASIC;
        
        Object.keys(KYC_LIMITS).forEach(level => {
            if (amount <= KYC_LIMITS[level] && level > currentUserKYC.level) {
                requiredLevel = parseInt(level);
            }
        });
        
        return {
            approved: false,
            reason: `Limite de transação excedido para seu nível KYC atual`,
            requiredLevel,
            currentLevel: currentUserKYC.level,
            limit: currentLimit
        };
    }
    
    return {
        approved: true,
        currentLevel: currentUserKYC.level,
        limit: currentLimit
    };
}

/**
 * Inicia o processo de upgrade do nível KYC
 * @param {number} targetLevel - Nível KYC desejado
 * @returns {Object} Status do processo de upgrade
 */
function startKYCUpgrade(targetLevel) {
    // Verificar se o nível solicitado é maior que o atual
    if (targetLevel <= currentUserKYC.level) {
        return {
            success: false,
            message: 'Você já possui este nível de verificação ou superior'
        };
    }
    
    // Simular início do processo de upgrade
    const requiredDocuments = getRequiredDocumentsForLevel(targetLevel);
    
    return {
        success: true,
        message: 'Processo de verificação iniciado',
        requiredDocuments,
        nextSteps: 'Envie os documentos necessários para completar a verificação'
    };
}

/**
 * Obtém os documentos necessários para um determinado nível KYC
 * @param {number} level - Nível KYC desejado
 * @returns {Array} Lista de documentos necessários
 */
function getRequiredDocumentsForLevel(level) {
    switch (level) {
        case KYC_LEVELS.BASIC:
            return ['Email válido'];
        case KYC_LEVELS.TIER1:
            return ['RG/CNH', 'CPF'];
        case KYC_LEVELS.TIER2:
            return ['Comprovante de Residência', 'Selfie com documento'];
        default:
            return [];
    }
}

/**
 * Obtém informações sobre o nível KYC atual do usuário
 * @returns {Object} Informações do KYC atual
 */
function getCurrentKYCInfo() {
    return {
        level: currentUserKYC.level,
        levelName: getLevelName(currentUserKYC.level),
        status: currentUserKYC.status,
        limit: KYC_LIMITS[currentUserKYC.level],
        verifiedAt: currentUserKYC.verifiedAt
    };
}

/**
 * Obtém o nome de um nível KYC
 * @param {number} level - Nível KYC
 * @returns {string} Nome do nível
 */
function getLevelName(level) {
    switch (level) {
        case KYC_LEVELS.NONE:
            return 'Não Verificado';
        case KYC_LEVELS.BASIC:
            return 'Básico';
        case KYC_LEVELS.TIER1:
            return 'Tier 1';
        case KYC_LEVELS.TIER2:
            return 'Tier 2';
        default:
            return 'Desconhecido';
    }
}

// Para fins de simulação - atualiza o nível KYC do usuário atual
function simulateKYCUpgrade(level) {
    currentUserKYC.level = level;
    currentUserKYC.status = KYC_STATUS.APPROVED;
    currentUserKYC.verifiedAt = new Date().toISOString();
    return getCurrentKYCInfo();
}

export {
    verifyKYCForTransaction,
    startKYCUpgrade,
    getCurrentKYCInfo,
    simulateKYCUpgrade,
    KYC_LEVELS,
    KYC_STATUS,
    KYC_LIMITS
};