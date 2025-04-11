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
    REJECTED: 'rejected',
    EMAIL_PENDING: 'email_pending' // Novo status para email pendente de confirmação
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
    level: KYC_LEVELS.NONE,
    status: KYC_STATUS.PENDING,
    email: null, // Email agora começa como null
    phone: null, // Adicionando campo de telefone
    emailVerified: false, // Campo para rastrear verificação de email
    documents: {
        idCard: null,
        cpf: null,
        addressProof: null,
        selfie: null
    },
    documentStatus: {
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
 * Valida o formato de um endereço de email
 * @param {string} email - Endereço de email a ser validado
 * @returns {boolean} Resultado da validação
 */
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Envia email de confirmação
 * @param {string} email - Endereço de email para enviar confirmação
 * @returns {Object} Status do envio de email
 */
function sendVerificationEmail(email) {
    // Simular envio de email de confirmação
    if (!validateEmail(email)) {
        return {
            success: false,
            message: 'Formato de email inválido'
        };
    }
    
    // Em produção, isso chamaria uma API para enviar um email real
    // Para simulação, apenas retornamos sucesso
    console.log(`Email de verificação enviado para: ${email}`);
    
    // Atualizar o email do usuário e status
    currentUserKYC.email = email;
    currentUserKYC.status = KYC_STATUS.EMAIL_PENDING;
    
    return {
        success: true,
        message: 'Email de verificação enviado com sucesso!',
        confirmationId: generateConfirmationCode()
    };
}

/**
 * Gera um código de confirmação para email
 * @returns {string} Código de confirmação de 6 dígitos
 */
function generateConfirmationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Confirma o email do usuário
 * @param {string} confirmationCode - Código de confirmação
 * @returns {Object} Resultado da confirmação
 */
function confirmEmail(confirmationCode) {
    // Simulação - em um ambiente real, verificaríamos o código contra um armazenado
    if (confirmationCode && confirmationCode.length === 6) {
        currentUserKYC.emailVerified = true;
        currentUserKYC.level = Math.max(currentUserKYC.level, KYC_LEVELS.BASIC);
        currentUserKYC.status = KYC_STATUS.APPROVED;
        
        return {
            success: true,
            message: 'Email verificado com sucesso!',
            level: currentUserKYC.level
        };
    }
    
    return {
        success: false,
        message: 'Código de confirmação inválido'
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
    
    // Verificar se o email foi verificado para níveis acima de BASIC
    if (targetLevel > KYC_LEVELS.BASIC && !currentUserKYC.emailVerified) {
        return {
            success: false,
            message: 'É necessário verificar seu email antes de avançar para este nível'
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
            return ['RG/CNH', 'CPF', 'Telefone válido'];
        case KYC_LEVELS.TIER2:
            return ['Comprovante de Residência', 'Selfie com documento'];
        default:
            return [];
    }
}

/**
 * Verifica autenticidade de documentos (simulação de análise)
 * @param {Object} documents - Objeto contendo os documentos enviados
 * @returns {Object} Resultado da verificação de documentos
 */
function verifyDocuments(documents) {
    // Em um sistema real, isso enviaria os documentos para uma API de verificação
    
    // Simulando verificação com resultados aleatórios para demonstração
    const results = {};
    const status = {};
    
    // Probabilidade alta de aprovação para simulação
    for (const docType in documents) {
        if (documents[docType]) {
            // Simular uma taxa de aprovação de 90%
            const isApproved = Math.random() < 0.9;
            
            results[docType] = {
                verified: isApproved,
                confidence: isApproved ? 
                    (Math.floor(Math.random() * 20) + 80) / 100 : // 80-99% se aprovado
                    (Math.floor(Math.random() * 30) + 50) / 100,  // 50-79% se rejeitado
                issues: isApproved ? [] : ['Documento ilegível ou qualidade baixa']
            };
            
            status[docType] = isApproved ? KYC_STATUS.APPROVED : KYC_STATUS.REJECTED;
        }
    }
    
    // Atualizar o status de documentos do usuário
    currentUserKYC.documentStatus = {...status};
    
    return {
        success: Object.values(status).every(s => s === KYC_STATUS.APPROVED),
        results,
        message: Object.values(status).every(s => s === KYC_STATUS.APPROVED) ? 
            'Todos os documentos foram verificados com sucesso' : 
            'Alguns documentos não puderam ser verificados'
    };
}

/**
 * Valida um número de telefone brasileiro
 * @param {string} phone - Número de telefone a ser validado
 * @returns {boolean} Resultado da validação
 */
function validateBrazilianPhone(phone) {
    // Remove caracteres não numéricos
    const phoneDigits = phone.replace(/\D/g, '');
    
    // Padrão brasileiro: (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
    // DDD válidos do Brasil começam com dígito entre 1 e 9
    return /^([1-9]{2})(9[0-9]{8}|[1-8][0-9]{7})$/.test(phoneDigits);
}

/**
 * Atualiza o telefone do usuário
 * @param {string} phone - Número de telefone
 * @returns {Object} Resultado da atualização
 */
function updateUserPhone(phone) {
    if (!validateBrazilianPhone(phone)) {
        return {
            success: false,
            message: 'Número de telefone inválido. Use o formato (XX) XXXXX-XXXX'
        };
    }
    
    currentUserKYC.phone = phone;
    
    return {
        success: true,
        message: 'Telefone atualizado com sucesso'
    };
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
        email: currentUserKYC.email,
        emailVerified: currentUserKYC.emailVerified,
        phone: currentUserKYC.phone,
        documents: currentUserKYC.documents,
        documentStatus: currentUserKYC.documentStatus,
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
    validateEmail,
    sendVerificationEmail,
    confirmEmail,
    verifyDocuments,
    validateBrazilianPhone,
    updateUserPhone,
    KYC_LEVELS,
    KYC_STATUS,
    KYC_LIMITS
};