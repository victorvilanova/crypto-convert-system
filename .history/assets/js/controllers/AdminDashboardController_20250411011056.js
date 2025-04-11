/**
 * AdminDashboardController.js
 * Controlador principal para o dashboard administrativo
 */
import AuthService from '../services/AuthService.js';
import CryptoModel from '../models/CryptoModel.js';

export default class AdminDashboardController {
    constructor() {
        // Serviços
        this.authService = new AuthService();
        this.cryptoModel = new CryptoModel();
        
        // Elementos da UI
        this.adminUserDisplay = document.getElementById('adminUsername');
        this.dashboardContent = document.getElementById('dashboardContent');
        this.transactionsList = document.getElementById('recentTransactions');
        this.userCountDisplay = document.getElementById('totalUsers');
        this.transactionCountDisplay = document.getElementById('totalTransactions');
        this.conversionVolumeDisplay = document.getElementById('conversionVolume');
        this.lastUpdateTimestamp = document.getElementById('lastUpdateTime');
        
        // Estado
        this.isInitialized = false;
        this.refreshInterval = null;
        this.refreshRate = 60000; // 1 minuto
    }
    
    /**
     * Inicializa o controlador do dashboard
     */
    init() {
        if (this.isInitialized) return;
        
        // Verifica autenticação
        if (!this.authService.isAuthenticated()) {
            window.location.href = 'login.html';
            return;
        }
        
        // Configura a exibição do nome de usuário
        this.setupUserDisplay();
        
        // Carrega dados iniciais
        this.loadDashboardData();
        
        // Configura eventos
        this.setupEventListeners();
        
        // Inicia atualizações automáticas
        this.startAutoRefresh();
        
        this.isInitialized = true;
    }
    
    /**
     * Configura a exibição do nome de usuário
     */
    setupUserDisplay() {
        if (this.adminUserDisplay) {
            const username = this.authService.getCurrentUser();
            this.adminUserDisplay.textContent = username || 'Admin';
        }
    }
    
    /**
     * Configura listeners de eventos
     */
    setupEventListeners() {
        // Botão de logout
        const logoutBtn = document.getElementById('adminLogoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.authService.logout();
                window.location.href = 'index.html';
            });
        }
        
        // Botão de atualização manual
        const refreshBtn = document.getElementById('refreshDashboardBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.loadDashboardData();
            });
        }
    }
    
    /**
     * Inicia a atualização automática do dashboard
     */
    startAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
        
        this.refreshInterval = setInterval(() => {
            this.loadDashboardData();
        }, this.refreshRate);
    }
    
    /**
     * Carrega os dados do dashboard
     */
    async loadDashboardData() {
        try {
            // Simula obtenção de dados - em produção, isso viria de APIs reais
            await this.loadStatistics();
            await this.loadRecentTransactions();
            
            // Atualizar timestamp
            this.updateLastRefreshTime();
        } catch (error) {
            console.error('Erro ao carregar dados do dashboard:', error);
            // Implementar tratamento de erro visual aqui
        }
    }
    
    /**
     * Carrega estatísticas gerais
     */
    async loadStatistics() {
        // Simulação de dados
        const stats = {
            userCount: Math.floor(Math.random() * 1000) + 500,
            transactionCount: Math.floor(Math.random() * 5000) + 1000,
            conversionVolumeBRL: Math.floor(Math.random() * 1000000) + 100000
        };
        
        // Atualiza a UI
        if (this.userCountDisplay) {
            this.userCountDisplay.textContent = stats.userCount.toLocaleString('pt-BR');
        }
        
        if (this.transactionCountDisplay) {
            this.transactionCountDisplay.textContent = stats.transactionCount.toLocaleString('pt-BR');
        }
        
        if (this.conversionVolumeDisplay) {
            this.conversionVolumeDisplay.textContent = stats.conversionVolumeBRL.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL'
            });
        }
    }
    
    /**
     * Carrega transações recentes
     */
    async loadRecentTransactions() {
        if (!this.transactionsList) return;
        
        // Simulação de transações recentes
        const transactions = this.generateMockTransactions(10);
        
        // Limpa a tabela
        this.transactionsList.innerHTML = '';
        
        // Preenche com novos dados
        transactions.forEach(tx => {
            const row = document.createElement('tr');
            
            const idCell = document.createElement('td');
            idCell.textContent = tx.id;
            
            const userCell = document.createElement('td');
            userCell.textContent = tx.user;
            
            const dateCell = document.createElement('td');
            dateCell.textContent = new Date(tx.date).toLocaleString('pt-BR');
            
            const amountCell = document.createElement('td');
            amountCell.textContent = `${tx.amount} ${tx.fromCurrency}`;
            
            const resultCell = document.createElement('td');
            resultCell.textContent = `${tx.result} ${tx.toCrypto}`;
            
            const statusCell = document.createElement('td');
            const statusBadge = document.createElement('span');
            statusBadge.className = `badge bg-${this.getStatusColor(tx.status)}`;
            statusBadge.textContent = this.formatStatus(tx.status);
            statusCell.appendChild(statusBadge);
            
            // Adiciona células à linha
            row.appendChild(idCell);
            row.appendChild(userCell);
            row.appendChild(dateCell);
            row.appendChild(amountCell);
            row.appendChild(resultCell);
            row.appendChild(statusCell);
            
            // Adiciona linha à tabela
            this.transactionsList.appendChild(row);
        });
    }
    
    /**
     * Gera transações fictícias para desenvolvimento
     * @param {number} count - Número de transações a gerar
     * @returns {Array} - Lista de transações
     */
    generateMockTransactions(count) {
        const currencies = ['BRL', 'USD', 'EUR'];
        const cryptos = ['BTC', 'ETH', 'USDT', 'ADA'];
        const statuses = ['completed', 'pending', 'failed'];
        const usernames = ['joao_silva', 'maria_santos', 'carlos_oliveira', 'ana_costa', 'pedro_almeida'];
        
        const transactions = [];
        
        for (let i = 0; i < count; i++) {
            const fromCurrency = currencies[Math.floor(Math.random() * currencies.length)];
            const toCrypto = cryptos[Math.floor(Math.random() * cryptos.length)];
            const amount = +(Math.random() * 5000 + 100).toFixed(2);
            const rate = +(Math.random() * 0.0001 + 0.00001).toFixed(8);
            const result = +(amount * rate).toFixed(8);
            
            transactions.push({
                id: Math.random().toString(36).substring(2, 10),
                user: usernames[Math.floor(Math.random() * usernames.length)],
                date: new Date(Date.now() - Math.floor(Math.random() * 86400000 * 7)).toISOString(),
                fromCurrency,
                toCrypto,
                amount,
                result,
                status: statuses[Math.floor(Math.random() * statuses.length)]
            });
        }
        
        // Ordenar por data (mais recente primeiro)
        return transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    }
    
    /**
     * Obtém a cor para o status da transação
     * @param {string} status - Status da transação
     * @returns {string} - Classe de cor Bootstrap
     */
    getStatusColor(status) {
        switch (status) {
            case 'completed': return 'success';
            case 'pending': return 'warning';
            case 'failed': return 'danger';
            default: return 'secondary';
        }
    }
    
    /**
     * Formata o status da transação para exibição
     * @param {string} status - Status da transação
     * @returns {string} - Texto formatado
     */
    formatStatus(status) {
        switch (status) {
            case 'completed': return 'Concluída';
            case 'pending': return 'Pendente';
            case 'failed': return 'Falha';
            default: return status;
        }
    }
    
    /**
     * Atualiza o timestamp da última atualização
     */
    updateLastRefreshTime() {
        if (this.lastUpdateTimestamp) {
            const now = new Date();
            this.lastUpdateTimestamp.textContent = now.toLocaleTimeString('pt-BR');
        }
    }
    
    /**
     * Limpa recursos ao destruir o controlador
     */
    destroy() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }
}
