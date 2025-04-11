/**
 * server.js
 * Inicia o servidor da aplicação FastCripto
 */

const http = require('http');
const app = require('./app');
const config = require('./config');
const logger = require('./utils/logger');

// Criar servidor HTTP
const server = http.createServer(app);

// Definir porta
const port = config.server.port;
app.set('port', port);

// Iniciar servidor
server.listen(port);

// Listener para erros
server.on('error', (error) => {
    if (error.syscall !== 'listen') {
        throw error;
    }
    
    const bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;
    
    // Mensagens de erro específicas para erros comuns
    switch (error.code) {
        case 'EACCES':
            logger.error(`${bind} requer privilégios elevados`);
            process.exit(1);
            break;
        case 'EADDRINUSE':
            logger.error(`${bind} já está em uso`);
            process.exit(1);
            break;
        default:
            throw error;
    }
});

// Listener para quando o servidor estiver escutando
server.on('listening', () => {
    const addr = server.address();
    const bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;
    logger.info(`Servidor FastCripto escutando em ${bind}`);
});

// Lidar com erros não tratados
process.on('uncaughtException', (error) => {
    logger.error('Exceção não tratada:', error);
    // Em produção, pode ser melhor reiniciar o servidor
    // process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Rejeição de promessa não tratada:', reason);
}); 