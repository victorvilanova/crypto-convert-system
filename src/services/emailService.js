/**
 * emailService.js
 * Serviço para envio de emails utilizando SMTP
 */

const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const config = require('../config');
const logger = require('../utils/logger');

// Configuração do transporte SMTP
const transporter = nodemailer.createTransport({
    host: config.email.smtp.host,
    port: config.email.smtp.port,
    secure: config.email.smtp.secure, // true para 465, false para outras portas
    auth: {
        user: config.email.smtp.auth.user, // compliance@fastcripto.com
        pass: config.email.smtp.auth.pass
    }
});

// Template de email padrão para verificação
const getVerificationEmailTemplate = (name, code) => {
    return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
            <img src="https://fastcripto.com/assets/images/logo.png" alt="FastCripto" style="max-width: 150px;">
        </div>
        <h2 style="color: #333;">Verificação de Email</h2>
        <p>Olá ${name || 'Cliente'},</p>
        <p>Obrigado por escolher a FastCripto! Por favor, utilize o código abaixo para verificar seu email:</p>
        <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 24px; letter-spacing: 5px; margin: 20px 0; border-radius: 5px;">
            <strong>${code}</strong>
        </div>
        <p>Este código expira em 30 minutos.</p>
        <p>Se você não solicitou este código, por favor ignore este email ou entre em contato com nosso suporte.</p>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #777; font-size: 12px;">
            <p>Este é um email automático, por favor não responda.</p>
            <p>&copy; ${new Date().getFullYear()} FastCripto. Todos os direitos reservados.</p>
        </div>
    </div>
    `;
};

/**
 * Enviar email de verificação com código
 * @param {string} email - Endereço de email do destinatário
 * @param {string} name - Nome do destinatário
 * @param {string} code - Código de verificação
 * @returns {Promise<Object>} Resultado do envio
 */
async function sendVerificationEmail(email, name, code) {
    try {
        // Configuração do email
        const mailOptions = {
            from: `"FastCripto Compliance" <${config.email.from || 'compliance@fastcripto.com'}>`,
            to: email,
            subject: 'Verificação de Email - FastCripto',
            html: getVerificationEmailTemplate(name, code)
        };

        // Enviar o email
        const info = await transporter.sendMail(mailOptions);

        logger.info(`Email enviado para ${email}: ${info.messageId}`);
        
        return {
            success: true,
            messageId: info.messageId,
            message: 'Email enviado com sucesso'
        };
    } catch (error) {
        logger.error(`Erro ao enviar email para ${email}:`, error);
        
        return {
            success: false,
            message: `Falha ao enviar email: ${error.message}`,
            error: error
        };
    }
}

/**
 * Enviar email com template personalizado
 * @param {Object} options - Opções de email
 * @param {string} options.to - Destinatário do email
 * @param {string} options.subject - Assunto do email
 * @param {string} options.template - Nome do template a ser utilizado
 * @param {Object} options.data - Dados para preencher o template
 * @returns {Promise<Object>} Resultado do envio
 */
async function sendTemplateEmail(options) {
    try {
        // Implementação futura para emails com templates mais complexos
        // Você poderia usar um sistema de templates como Handlebars ou EJS
        
        return {
            success: false,
            message: 'Função ainda não implementada'
        };
    } catch (error) {
        logger.error('Erro ao enviar email com template:', error);
        
        return {
            success: false,
            message: `Falha ao enviar email: ${error.message}`
        };
    }
}

module.exports = {
    sendVerificationEmail,
    sendTemplateEmail
}; 