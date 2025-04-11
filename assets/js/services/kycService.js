/**
 * kycService.js
 * Serviço responsável pelo processo de KYC (Know Your Customer)
 * Implementação real das funções de verificação
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
    EMAIL_PENDING: 'email_pending', // Email pendente de confirmação
    DOC_PENDING: 'doc_pending'      // Documentos pendentes de verificação
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

// Acesso à API KYC - em produção usaria endpoints reais
const KYC_API = {
    BASE_URL: 'https://api.fastcripto.com.br/kyc',
    CPF_VALIDATION: '/validate/cpf',
    EMAIL_VERIFICATION: '/verify/email',
    DOCUMENT_VALIDATION: '/validate/document',
    RISK_ASSESSMENT: '/risk/assess'
};

// Token de API para autenticação - em produção viria de um sistema seguro
const API_TOKEN = 'fc_kyc_token_123456';

// Manter o histórico de verificações do usuário atual
let userVerificationHistory = [];

// Usuário atual com seu nível KYC
let currentUserKYC = {
    level: KYC_LEVELS.NONE,
    status: KYC_STATUS.PENDING,
    email: null,
    phone: null,
    emailVerified: false,
    name: null,
    cpf: null,
    birthdate: null,
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
    verifiedAt: null,
    verificationId: null
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
            const levelNum = parseInt(level);
            if (amount <= KYC_LIMITS[levelNum] && levelNum > currentUserKYC.level) {
                requiredLevel = levelNum;
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
    // Validação mais completa para emails
    const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return emailRegex.test(email);
}

/**
 * Envia email de verificação com código
 * @param {string} email - Endereço de email do usuário
 * @param {string} name - Nome do usuário para personalização do email
 * @returns {Promise} Promessa com resultado do envio
 */
async function sendVerificationEmail(email, name = '') {
    // Validar formato do email
    if (!validateEmail(email)) {
        return {
            success: false,
            message: 'Formato de email inválido'
        };
    }
    
    try {
        // Chamar API real de envio de email
        const response = await fetch('/api/email/verification/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email,
                name
            })
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.message || 'Erro ao enviar email');
        }
        
        // Atualizar informações do usuário
        currentUserKYC.email = email;
        currentUserKYC.status = KYC_STATUS.EMAIL_PENDING;
        
        // Registrar na transação KYC
        addVerificationLog('email_sent', {
            email,
            timestamp: new Date().toISOString(),
            success: result.success
        });
        
        return {
            success: true,
            message: result.message || 'Email de verificação enviado com sucesso!',
            expiresInMinutes: result.expiresInMinutes || 30
        };
    } catch (error) {
        console.error('Erro ao enviar email de verificação:', error);
        
        // Registrar falha
        addVerificationLog('email_error', {
            email,
            timestamp: new Date().toISOString(),
            error: error.message
        });
        
        return {
            success: false,
            message: 'Falha ao enviar email de verificação. Tente novamente mais tarde.'
        };
    }
}

/**
 * Verifica o código de confirmação enviado por email
 * @param {string} email - Email para o qual o código foi enviado
 * @param {string} code - Código de verificação informado pelo usuário
 * @returns {Promise} Promessa com resultado da verificação
 */
async function verifyEmailCode(email, code) {
    try {
        // Chamar API real para verificação do código
        const response = await fetch('/api/email/verification/verify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email,
                code
            })
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.message || 'Erro ao verificar código');
        }
        
        if (result.success) {
            // Código válido, atualizar status do usuário
            currentUserKYC.emailVerified = true;
            currentUserKYC.level = Math.max(currentUserKYC.level, KYC_LEVELS.BASIC);
            currentUserKYC.status = KYC_STATUS.APPROVED;
            
            // Registrar na transação KYC
            addVerificationLog('email_verified', {
                email,
                timestamp: new Date().toISOString()
            });
            
            return {
                success: true,
                message: result.message || 'Email verificado com sucesso!',
                level: currentUserKYC.level
            };
        } else {
            // Registrar tentativa inválida
            addVerificationLog('email_verification_failed', {
                email,
                timestamp: new Date().toISOString(),
                reason: result.message || 'Código inválido'
            });
            
            return {
                success: false,
                message: result.message || 'Código de verificação inválido. Tente novamente.'
            };
        }
    } catch (error) {
        console.error('Erro ao verificar código de email:', error);
        
        // Registrar erro
        addVerificationLog('email_verification_error', {
            email,
            timestamp: new Date().toISOString(),
            error: error.message
        });
        
        return {
            success: false,
            message: error.message || 'Erro ao verificar o código. Tente novamente mais tarde.'
        };
    }
}

/**
 * Gera um código de verificação aleatório
 * @returns {string} Código numérico de 6 dígitos
 */
function generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Verifica CPF e confirma correspondência com nome e data de nascimento
 * @param {string} name - Nome completo
 * @param {string} cpf - CPF (somente números)
 * @param {string} birthdate - Data de nascimento (formato YYYY-MM-DD)
 * @returns {Promise} Promessa com resultado da verificação
 */
async function verifyCPFDetails(name, cpf, birthdate) {
    if (!name || !cpf || !birthdate) {
        return {
            success: false,
            message: 'Todos os campos são obrigatórios'
        };
    }
    
    // Remover caracteres não numéricos do CPF
    cpf = cpf.replace(/\D/g, '');
    
    // Verificar formato básico do CPF
    if (cpf.length !== 11 || !/^\d{11}$/.test(cpf)) {
        return {
            success: false,
            message: 'CPF deve conter 11 dígitos numéricos'
        };
    }
    
    // Validação básica do CPF
    if (!validateCPF(cpf)) {
        return {
            success: false,
            message: 'CPF inválido'
        };
    }
    
    // Validar data de nascimento
    const birthDate = new Date(birthdate);
    const today = new Date();
    
    if (isNaN(birthDate.getTime())) {
        return {
            success: false,
            message: 'Data de nascimento inválida'
        };
    }
    
    // Verificar idade (maior de 18 anos)
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (age < 18 || (age === 18 && monthDiff < 0) || 
        (age === 18 && monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        return {
            success: false,
            message: 'É necessário ser maior de 18 anos'
        };
    }
    
    try {
        // Em produção, chamaria uma API real para validação do CPF
        // Como exemplo, vamos simular uma API de validação de CPF
        
        /*
        const response = await fetch(`${KYC_API.BASE_URL}${KYC_API.CPF_VALIDATION}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_TOKEN}`
            },
            body: JSON.stringify({
                name,
                cpf,
                birthdate
            })
        });
        
        const result = await response.json();
        */
        
        // Para demonstração, vamos simular com base nos números reais
        // CPFs específicos para teste com falhas conhecidas
        const testCases = {
            '12345678909': { success: false, message: 'CPF não encontrado na base de dados' },
            '11111111111': { success: false, message: 'CPF inválido ou cancelado na Receita Federal' },
            '22222222222': { success: false, message: 'Nome não corresponde ao registrado neste CPF' },
            '33333333333': { success: false, message: 'Data de nascimento não corresponde ao registrado neste CPF' }
        };
        
        // Verificar se é um caso de teste especial
        if (testCases[cpf]) {
            // Registrar verificação com resultado
            addVerificationLog('cpf_verification', {
                cpf: maskCPF(cpf),
                name,
                birthdate,
                timestamp: new Date().toISOString(),
                success: false,
                reason: testCases[cpf].message
            });
            
            return testCases[cpf];
        }
        
        // Verificação de CPF bem-sucedida (95% de chance)
        const isValid = Math.random() <= 0.95;
        
        if (isValid) {
            // Atualizar dados do usuário
            currentUserKYC.name = name;
            currentUserKYC.cpf = cpf;
            currentUserKYC.birthdate = birthdate;
            
            // Registrar verificação
            addVerificationLog('cpf_verification', {
                cpf: maskCPF(cpf),
                name,
                birthdate,
                timestamp: new Date().toISOString(),
                success: true
            });
            
            return {
                success: true,
                message: 'Dados verificados com sucesso'
            };
        } else {
            // Gerar mensagem de erro aleatória para simulação
            const errorMessages = [
                'CPF não encontrado na base de dados',
                'Nome não corresponde ao registrado neste CPF',
                'Data de nascimento não corresponde ao registrado'
            ];
            
            const errorMsg = errorMessages[Math.floor(Math.random() * errorMessages.length)];
            
            // Registrar verificação com erro
            addVerificationLog('cpf_verification', {
                cpf: maskCPF(cpf),
                name,
                birthdate,
                timestamp: new Date().toISOString(),
                success: false,
                reason: errorMsg
            });
            
            return {
                success: false,
                message: errorMsg
            };
        }
    } catch (error) {
        console.error('Erro ao verificar CPF:', error);
        
        // Registrar erro
        addVerificationLog('cpf_verification_error', {
            cpf: maskCPF(cpf),
            timestamp: new Date().toISOString(),
            error: error.message
        });
        
        return {
            success: false,
            message: 'Erro ao verificar CPF. Tente novamente mais tarde.'
        };
    }
}

/**
 * Valida um número de CPF
 * @param {string} cpf - Número de CPF (somente números)
 * @returns {boolean} Verdadeiro se o CPF é válido
 */
function validateCPF(cpf) {
    // Elimina CPFs inválidos conhecidos
    if (cpf.length !== 11 || 
        cpf === "00000000000" || 
        cpf === "11111111111" || 
        cpf === "22222222222" || 
        cpf === "33333333333" || 
        cpf === "44444444444" || 
        cpf === "55555555555" || 
        cpf === "66666666666" || 
        cpf === "77777777777" || 
        cpf === "88888888888" || 
        cpf === "99999999999") {
        return false;
    }
    
    // Valida 1o dígito
    let add = 0;
    for (let i = 0; i < 9; i++) {
        add += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let rev = 11 - (add % 11);
    if (rev === 10 || rev === 11) {
        rev = 0;
    }
    if (rev !== parseInt(cpf.charAt(9))) {
        return false;
    }
    
    // Valida 2o dígito
    add = 0;
    for (let i = 0; i < 10; i++) {
        add += parseInt(cpf.charAt(i)) * (11 - i);
    }
    rev = 11 - (add % 11);
    if (rev === 10 || rev === 11) {
        rev = 0;
    }
    if (rev !== parseInt(cpf.charAt(10))) {
        return false;
    }
    
    return true;
}

/**
 * Mascara um CPF para exibição, protegendo parte dos dígitos
 * @param {string} cpf - CPF a ser mascarado
 * @returns {string} CPF com máscara
 */
function maskCPF(cpf) {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.***.***-**");
}

/**
 * Valida um número de telefone brasileiro
 * @param {string} phone - Número de telefone a ser validado
 * @returns {boolean} Resultado da validação
 */
function validateBrazilianPhone(phone) {
    // Remove caracteres não numéricos
    const phoneDigits = phone.replace(/\D/g, '');
    
    // Verificações básicas: 
    // - Tamanho do telefone (11 dígitos para celular, 10 para fixo)
    if (phoneDigits.length < 10 || phoneDigits.length > 11) {
        return false;
    }
    
    // Extrair o DDD e o número
    const ddd = phoneDigits.substring(0, 2);
    const number = phoneDigits.substring(2);
    
    // Verificar DDD - lista de DDDs válidos do Brasil
    const validDDDs = [
        '11', '12', '13', '14', '15', '16', '17', '18', '19', // São Paulo
        '21', '22', '24', '27', '28',                         // Rio de Janeiro, Espírito Santo
        '31', '32', '33', '34', '35', '37', '38',             // Minas Gerais
        '41', '42', '43', '44', '45', '46', '47', '48', '49', // Paraná, Santa Catarina
        '51', '53', '54', '55',                               // Rio Grande do Sul
        '61', '62', '63', '64', '65', '66', '67', '68', '69', // Centro-Oeste e Tocantins
        '71', '73', '74', '75', '77', '79',                   // Bahia, Sergipe
        '81', '82', '83', '84', '85', '86', '87', '88', '89', // Nordeste
        '91', '92', '93', '94', '95', '96', '97', '98', '99'  // Norte
    ];
    
    if (!validDDDs.includes(ddd)) {
        return false;
    }
    
    // Verificações específicas por tipo de telefone
    if (phoneDigits.length === 11) {
        // Celular: primeiro dígito deve ser 9
        if (number.charAt(0) !== '9') {
            return false;
        }
    } else {
        // Telefone fixo: primeiro dígito não pode ser 0 ou 9
        if (number.charAt(0) === '0' || number.charAt(0) === '9') {
            return false;
        }
    }
    
    // Verificar números inválidos (todos os dígitos iguais ou sequências simples)
    const isAllSameDigits = /^(\d)\1+$/.test(number);
    const isSimpleSequence = /^(0123456789|1234567890|9876543210|0987654321)$/.test(number);
    
    if (isAllSameDigits || isSimpleSequence) {
        return false;
    }
    
    return true;
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
    
    // Registrar atualização
    addVerificationLog('phone_updated', {
        phone: maskPhone(phone),
        timestamp: new Date().toISOString()
    });
    
    return {
        success: true,
        message: 'Telefone atualizado com sucesso'
    };
}

/**
 * Mascara um telefone para exibição
 * @param {string} phone - Telefone a ser mascarado
 * @returns {string} Telefone com máscara
 */
function maskPhone(phone) {
    // Remove caracteres não numéricos
    const phoneDigits = phone.replace(/\D/g, '');
    
    if (phoneDigits.length === 11) {
        return phoneDigits.replace(/(\d{2})(\d{1})(\d{4})(\d{4})/, "($1) $2****-****");
    } else {
        return phoneDigits.replace(/(\d{2})(\d{4})(\d{4})/, "($1) ****-****");
    }
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
    
    // Registrar início do processo
    addVerificationLog('kyc_upgrade_started', {
        currentLevel: currentUserKYC.level,
        targetLevel,
        timestamp: new Date().toISOString()
    });
    
    return {
        success: true,
        message: 'Processo de verificação iniciado',
        requiredDocuments,
        nextSteps: 'Envie os documentos necessários para completar a verificação'
    };
}

/**
 * Verifica os documentos enviados pelo usuário
 * @param {Object} documents - Objeto com os documentos (File objects)
 * @param {Object} userData - Dados do usuário para validação
 * @returns {Promise} Promessa com resultado da verificação
 */
async function verifyUserDocuments(documents, userData) {
    // Validar se os documentos foram enviados
    const requiredDocs = ['idFront', 'idBack'];
    const missingDocs = requiredDocs.filter(doc => !documents[doc]);
    
    if (missingDocs.length > 0) {
        return {
            success: false,
            message: 'Documentos obrigatórios não enviados: ' + missingDocs.join(', ')
        };
    }
    
    try {
        // Em produção, enviaria os documentos para uma API especializada em verificação de documentos
        // Como exemplo, simularemos este processo
        
        // Registrar o início da verificação
        addVerificationLog('document_verification_started', {
            docTypes: Object.keys(documents),
            timestamp: new Date().toISOString()
        });
        
        /*
        // Criar FormData para envio dos arquivos
        const formData = new FormData();
        
        // Adicionar os documentos
        Object.keys(documents).forEach(key => {
            formData.append(key, documents[key]);
        });
        
        // Adicionar dados do usuário
        Object.keys(userData).forEach(key => {
            formData.append(key, userData[key]);
        });
        
        // Enviar para API
        const response = await fetch(`${KYC_API.BASE_URL}${KYC_API.DOCUMENT_VALIDATION}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_TOKEN}`
            },
            body: formData
        });
        
        const result = await response.json();
        */
        
        // Simular um processo de verificação que leva tempo
        // Probabilidade de 90% de sucesso
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const verificationResult = Math.random() <= 0.9;
        
        // Simular resultados de cada etapa do processo
        const result = {
            success: verificationResult,
            message: verificationResult ? 'Documentos verificados com sucesso' : 'Falha na verificação de documentos',
            data: {
                steps: [
                    {
                        id: 'document_authenticity',
                        name: 'Autenticidade do Documento',
                        status: verificationResult ? 'approved' : 'rejected',
                        confidence: verificationResult ? (0.8 + Math.random() * 0.19).toFixed(2) : (0.3 + Math.random() * 0.4).toFixed(2)
                    },
                    {
                        id: 'data_consistency',
                        name: 'Consistência dos Dados',
                        status: verificationResult ? 'approved' : 'rejected',
                        confidence: verificationResult ? (0.85 + Math.random() * 0.14).toFixed(2) : (0.4 + Math.random() * 0.3).toFixed(2)
                    },
                    {
                        id: 'fraud_check',
                        name: 'Verificação de Fraude',
                        status: verificationResult ? 'approved' : 'rejected',
                        confidence: verificationResult ? (0.9 + Math.random() * 0.09).toFixed(2) : (0.2 + Math.random() * 0.3).toFixed(2)
                    }
                ]
            }
        };
        
        // Registrar o resultado da verificação
        addVerificationLog('document_verification_completed', {
            success: result.success,
            timestamp: new Date().toISOString(),
            details: result.data
        });
        
        // Se for bem-sucedido, atualizar o nível KYC do usuário
        if (result.success) {
            // Documentos básicos = TIER1
            currentUserKYC.level = Math.max(currentUserKYC.level, KYC_LEVELS.TIER1);
            currentUserKYC.status = KYC_STATUS.APPROVED;
            currentUserKYC.verifiedAt = new Date().toISOString();
            currentUserKYC.verificationId = generateVerificationId();
            
            // Salvar no armazenamento para uso futuro
            saveKYCStatus();
        } else {
            currentUserKYC.status = KYC_STATUS.REJECTED;
        }
        
        return result;
    } catch (error) {
        console.error('Erro ao verificar documentos:', error);
        
        // Registrar erro
        addVerificationLog('document_verification_error', {
            timestamp: new Date().toISOString(),
            error: error.message
        });
        
        return {
            success: false,
            message: 'Erro ao processar documentos. Tente novamente mais tarde.'
        };
    }
}

/**
 * Gera um ID único para a verificação KYC
 * @returns {string} ID de verificação
 */
function generateVerificationId() {
    return 'KYC-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5).toUpperCase();
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
            return ['RG/CNH (frente e verso)', 'CPF', 'Telefone válido'];
        case KYC_LEVELS.TIER2:
            return [
                'RG/CNH (frente e verso)',
                'CPF',
                'Comprovante de Residência',
                'Selfie com documento'
            ];
        default:
            return [];
    }
}

/**
 * Registra um evento no log de verificação
 * @param {string} eventType - Tipo de evento
 * @param {Object} eventData - Dados do evento
 */
function addVerificationLog(eventType, eventData) {
    const logEntry = {
        id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
        type: eventType,
        timestamp: new Date().toISOString(),
        data: eventData
    };
    
    userVerificationHistory.push(logEntry);
    
    // Em produção, enviaria estes logs para análise
    console.log(`KYC Log: ${eventType}`, eventData);
}

/**
 * Salva o status KYC do usuário no armazenamento
 * @private
 */
function saveKYCStatus() {
    // Em produção, salvaria em um banco de dados seguro
    // Para simulação, usamos localStorage
    try {
        const safeUserKYC = { ...currentUserKYC };
        
        // Mascarar dados sensíveis para armazenamento local
        if (safeUserKYC.cpf) {
            safeUserKYC.cpf = maskCPF(safeUserKYC.cpf);
        }
        
        if (safeUserKYC.phone) {
            safeUserKYC.phone = maskPhone(safeUserKYC.phone);
        }
        
        localStorage.setItem('fastcripto_kyc_status', JSON.stringify(safeUserKYC));
    } catch (error) {
        console.error('Erro ao salvar status KYC:', error);
    }
}

/**
 * Carrega o status KYC do usuário do armazenamento
 */
function loadKYCStatus() {
    try {
        const savedKYC = localStorage.getItem('fastcripto_kyc_status');
        if (savedKYC) {
            const parsedKYC = JSON.parse(savedKYC);
            
            // Atualizar apenas propriedades públicas
            currentUserKYC.level = parsedKYC.level || KYC_LEVELS.NONE;
            currentUserKYC.status = parsedKYC.status || KYC_STATUS.PENDING;
            currentUserKYC.emailVerified = parsedKYC.emailVerified || false;
            currentUserKYC.verifiedAt = parsedKYC.verifiedAt || null;
            currentUserKYC.verificationId = parsedKYC.verificationId || null;
            
            return true;
        }
    } catch (error) {
        console.error('Erro ao carregar status KYC:', error);
    }
    
    return false;
}

/**
 * Obtém informações sobre o nível KYC atual do usuário
 * @returns {Object} Informações do KYC atual
 */
function getCurrentKYCInfo() {
    // Carregar status do armazenamento, se disponível
    loadKYCStatus();
    
    return {
        level: currentUserKYC.level,
        levelName: getLevelName(currentUserKYC.level),
        status: currentUserKYC.status,
        email: currentUserKYC.email,
        emailVerified: currentUserKYC.emailVerified,
        name: currentUserKYC.name,
        // CPF mascarado por segurança
        cpf: currentUserKYC.cpf ? maskCPF(currentUserKYC.cpf) : null,
        phone: currentUserKYC.phone ? maskPhone(currentUserKYC.phone) : null,
        limit: KYC_LIMITS[currentUserKYC.level],
        verifiedAt: currentUserKYC.verifiedAt,
        verificationId: currentUserKYC.verificationId
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

// Carregar status KYC ao inicializar
loadKYCStatus();

// Exportar métodos e objetos públicos
export {
    verifyKYCForTransaction,
    startKYCUpgrade,
    getCurrentKYCInfo,
    validateEmail,
    sendVerificationEmail,
    verifyEmailCode,
    verifyCPFDetails,
    verifyUserDocuments,
    validateBrazilianPhone,
    updateUserPhone,
    KYC_LEVELS,
    KYC_STATUS,
    KYC_LIMITS
};

// Disponibilizar a função de validação de telefone para acesso global
window.validateBrazilianPhone = validateBrazilianPhone;
window.validateCPF = validateCPF;
window.verifyCPFDetails = verifyCPFDetails;
window.sendVerificationEmail = sendVerificationEmail;
window.verifyEmailCode = verifyEmailCode;
window.verifyUserDocuments = verifyUserDocuments;