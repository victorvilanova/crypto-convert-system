/**
 * logger.js
 * Utilitário para registrar logs do sistema
 */

const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Criar diretório de logs se não existir
const logDir = path.resolve(__dirname, '../../logs');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

// Formato personalizado para os logs
const customFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
        return `[${timestamp}] ${level.toUpperCase()}: ${message} ${metaStr}`;
    })
);

// Configurar os transportes (destinos) dos logs
const logger = winston.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: customFormat,
    transports: [
        // Logs de erro são salvos em um arquivo separado
        new winston.transports.File({ 
            filename: path.join(logDir, 'error.log'), 
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5
        }),
        // Todos os logs são salvos neste arquivo
        new winston.transports.File({ 
            filename: path.join(logDir, 'combined.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 10
        }),
        // Logs específicos de email
        new winston.transports.File({
            filename: path.join(logDir, 'email.log'),
            level: 'info',
            maxsize: 5242880, // 5MB
            maxFiles: 5
        })
    ]
});

// Em desenvolvimento, também mostrar logs no console
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            customFormat
        )
    }));
}

/**
 * Registra um log específico de envio de email
 * @param {string} to - Destinatário do email
 * @param {string} subject - Assunto do email
 * @param {boolean} success - Se o envio foi bem-sucedido
 * @param {string} messageId - ID da mensagem (se sucesso)
 * @param {Error} error - Erro (se falha)
 */
logger.logEmailSent = (to, subject, success, messageId, error) => {
    const level = success ? 'info' : 'error';
    const message = success 
        ? `Email enviado para ${to} com assunto "${subject}" (ID: ${messageId})` 
        : `Falha ao enviar email para ${to} com assunto "${subject}"`;
    
    logger.log({
        level,
        message,
        module: 'email',
        to,
        subject,
        success,
        ...(messageId && { messageId }),
        ...(error && { error: error.message, stack: error.stack })
    });
};

module.exports = logger;
