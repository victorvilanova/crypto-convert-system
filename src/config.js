/**
 * config.js
 * Configurações gerais do sistema FastCripto
 */

const dotenv = require('dotenv');
const path = require('path');

// Carregar variáveis de ambiente do arquivo .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Configurações do sistema
const config = {
    // Ambiente da aplicação
    env: process.env.NODE_ENV || 'development',
    
    // Configurações do servidor
    server: {
        port: process.env.PORT || 3000,
        host: process.env.HOST || 'localhost'
    },
    
    // Configurações de banco de dados
    database: {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 27017,
        name: process.env.DB_NAME || 'fastcripto',
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD
    },
    
    // Configurações de JWT (autenticação)
    jwt: {
        secret: process.env.JWT_SECRET || 'fastcripto-secret-key',
        expiresIn: process.env.JWT_EXPIRES_IN || '1d'
    },
    
    // Configurações para serviço de email
    email: {
        from: process.env.EMAIL_FROM || 'compliance@fastcripto.com',
        smtp: {
            host: process.env.SMTP_HOST || 'smtp.fastcripto.com',
            port: parseInt(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_SECURE === 'true' || false,
            auth: {
                user: process.env.SMTP_USER || 'compliance@fastcripto.com',
                pass: process.env.SMTP_PASSWORD || ''
            }
        },
        // Tempo de expiração dos códigos de verificação (em minutos)
        verificationCodeExpiry: parseInt(process.env.EMAIL_CODE_EXPIRY) || 30
    },
    
    // Configurações para APIs externas
    apis: {
        kyc: {
            baseUrl: process.env.KYC_API_URL || 'https://api.fastcripto.com/kyc',
            token: process.env.KYC_API_TOKEN || ''
        }
    },
    
    // Configurações de criptografia
    crypto: {
        encryptionKey: process.env.ENCRYPTION_KEY || 'fastcripto-encryption-key'
    }
};

module.exports = config; 