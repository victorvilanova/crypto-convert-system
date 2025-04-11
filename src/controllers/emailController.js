/**
 * emailController.js
 * Controlador para as requisições relacionadas a envio de emails
 */

const emailService = require('../services/emailService');
const logger = require('../utils/logger');
const config = require('../config');

/**
 * Envia um email de verificação com código
 * @param {Object} req - Requisição Express
 * @param {Object} res - Resposta Express
 */
async function sendVerificationEmail(req, res) {
    try {
        const { email, name } = req.body;
        
        // Validar dados de entrada
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email é obrigatório'
            });
        }
        
        // Gerar código de verificação
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Armazenar o código (em produção, use um banco de dados)
        // Para desenvolvimento, vamos usar uma solução temporária em memória
        const codeExpiry = new Date();
        codeExpiry.setMinutes(codeExpiry.getMinutes() + config.email.verificationCodeExpiry);
        
        // Em produção, substitua por armazenamento em banco de dados
        if (!global.verificationCodes) {
            global.verificationCodes = {};
        }
        global.verificationCodes[email] = {
            code: verificationCode,
            expires: codeExpiry
        };
        
        // Enviar o email
        const result = await emailService.sendVerificationEmail(
            email,
            name || '',
            verificationCode
        );
        
        if (result.success) {
            // Registrar sucesso
            logger.logEmailSent(email, 'Verificação de Email - FastCripto', true, result.messageId);
            
            // Responder ao cliente (não revelar o código na resposta)
            return res.status(200).json({
                success: true,
                message: 'Email de verificação enviado com sucesso',
                expiresInMinutes: config.email.verificationCodeExpiry
            });
        } else {
            // Registrar falha
            logger.logEmailSent(email, 'Verificação de Email - FastCripto', false, null, new Error(result.message));
            
            return res.status(500).json({
                success: false,
                message: 'Falha ao enviar email de verificação. Tente novamente mais tarde.'
            });
        }
    } catch (error) {
        logger.error(`Erro no controlador de email: ${error.message}`, error);
        
        return res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
}

/**
 * Verifica o código enviado por email
 * @param {Object} req - Requisição Express
 * @param {Object} res - Resposta Express
 */
async function verifyEmailCode(req, res) {
    try {
        const { email, code } = req.body;
        
        // Validar dados de entrada
        if (!email || !code) {
            return res.status(400).json({
                success: false,
                message: 'Email e código são obrigatórios'
            });
        }
        
        // Verificar se existe um código para este email
        if (!global.verificationCodes || !global.verificationCodes[email]) {
            return res.status(400).json({
                success: false,
                message: 'Nenhum código de verificação encontrado para este email'
            });
        }
        
        const storedVerification = global.verificationCodes[email];
        
        // Verificar se o código expirou
        if (new Date() > storedVerification.expires) {
            // Remover código expirado
            delete global.verificationCodes[email];
            
            return res.status(400).json({
                success: false,
                message: 'Código de verificação expirado. Solicite um novo código.'
            });
        }
        
        // Verificar se o código é válido
        if (code !== storedVerification.code) {
            return res.status(400).json({
                success: false,
                message: 'Código de verificação inválido'
            });
        }
        
        // Código válido, remover após verificação
        delete global.verificationCodes[email];
        
        // Em produção, atualize o status do usuário no banco de dados
        
        return res.status(200).json({
            success: true,
            message: 'Email verificado com sucesso'
        });
    } catch (error) {
        logger.error(`Erro na verificação de código: ${error.message}`, error);
        
        return res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
}

module.exports = {
    sendVerificationEmail,
    verifyEmailCode
}; 