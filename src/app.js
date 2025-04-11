/**
 * app.js
 * Arquivo principal da aplicação FastCripto
 */

const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const logger = require('./utils/logger');

// Rotas
const emailRoutes = require('./routes/emailRoutes');
// Importe outras rotas aqui

// Inicializar aplicação Express
const app = express();

// Middleware para logs de requisições
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.url}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent')
    });
    next();
});

// Configurações de segurança
app.use(helmet());

// Habilitar CORS
app.use(cors());

// Compressão para melhorar performance
app.use(compression());

// Parsear requisições JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, '../public')));

// Rotas da API
app.use('/api/email', emailRoutes);
// Configure outras rotas aqui

// Middleware para tratamento de erros
app.use((err, req, res, next) => {
    logger.error('Erro na aplicação:', err);
    
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Erro interno do servidor'
    });
});

// Middleware para rotas não encontradas
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Rota não encontrada'
    });
});

// Exportar app para uso em server.js
module.exports = app;
