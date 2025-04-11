/**
 * ArbitrageController.js
 * Controlador responsável por gerenciar a funcionalidade de arbitragem
 */
class ArbitrageController {
    constructor() {
        this.logs = [];
        this.statuses = {
            PENDING: { text: 'Pendente', color: 'warning' },
            PROCESSING: { text: 'Processando', color: 'info' },
            COMPLETED: { text: 'Concluído', color: 'success' },
            FAILED: { text: 'Falhou', color: 'danger' },
            CANCELED: { text: 'Cancelado', color: 'secondary' }
        };
        
        this.initEventListeners();
    }

    /**
     * Inicializa os event listeners relacionados à arbitragem
     */
    initEventListeners() {
        // Botão "Ver Todos" na seção de arbitragem
        const viewAllBtn = document.querySelector('.arbitrage-logs-view-all');
        if (viewAllBtn) {
            viewAllBtn.addEventListener('click', () => this.showAllLogsModal());
        }
    }

    /**
     * Obtém as informações de status (texto e cor) com base no código de status
     * @param {string} status - Código do status (PENDING, PROCESSING, etc.)
     * @returns {Object} Objeto contendo texto e cor do status
     */
    getStatusInfo(status) {
        return this.statuses[status] || { text: 'Desconhecido', color: 'secondary' };
    }

    /**
     * Carrega os logs de arbitragem do servidor
     * @returns {Promise} Promise com os logs carregados
     */
    async loadLogs() {
        try {
            // Simulação de chamada à API (substituir por chamada real)
            // const response = await fetch('/api/arbitrage/logs');
            // this.logs = await response.json();
            
            // Simulação de dados para testes
            this.logs = [
                { id: 1, date: '2023-09-10 14:30', fromCurrency: 'BTC', toCurrency: 'ETH', amount: 0.5, profit: '2%', status: 'COMPLETED' },
                { id: 2, date: '2023-09-11 10:15', fromCurrency: 'ETH', toCurrency: 'BNB', amount: 5, profit: '1.5%', status: 'PROCESSING' },
                { id: 3, date: '2023-09-12 08:45', fromCurrency: 'BNB', toCurrency: 'BTC', amount: 2, profit: '3%', status: 'PENDING' },
                { id: 4, date: '2023-09-13 16:20', fromCurrency: 'SOL', toCurrency: 'AVAX', amount: 10, profit: '0.8%', status: 'FAILED' },
                { id: 5, date: '2023-09-14 12:00', fromCurrency: 'AVAX', toCurrency: 'SOL', amount: 8, profit: '1.2%', status: 'CANCELED' }
            ];
            
            return this.logs;
        } catch (error) {
            console.error('Erro ao carregar logs de arbitragem:', error);
            return [];
        }
    }

    /**
     * Exibe a modal com todos os logs de arbitragem
     */
    async showAllLogsModal() {
        await this.loadLogs();
        
        // Criar o elemento da modal
        const modalHtml = `
            <div class="modal fade" id="arbitrageLogsModal" tabindex="-1" aria-labelledby="arbitrageLogsModalLabel" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="arbitrageLogsModalLabel">Histórico de Arbitragem</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <div class="table-responsive">
                                <table class="table table-striped table-hover">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Data</th>
                                            <th>Origem</th>
                                            <th>Destino</th>
                                            <th>Valor</th>
                                            <th>Lucro</th>
                                            <th>Status</th>
                                            <th>Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${this.renderLogsTableRows()}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fechar</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Adicionar a modal ao DOM
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = modalHtml;
        document.body.appendChild(modalContainer);
        
        // Inicializar e mostrar a modal usando Bootstrap
        const modal = new bootstrap.Modal(document.getElementById('arbitrageLogsModal'));
        modal.show();
        
        // Adicionar listener para remover a modal do DOM quando for fechada
        const modalElement = document.getElementById('arbitrageLogsModal');
        modalElement.addEventListener('hidden.bs.modal', () => {
            document.body.removeChild(modalContainer);
        });
    }
    
    /**
     * Renderiza as linhas da tabela de logs de arbitragem
     * @returns {string} HTML das linhas da tabela
     */
    renderLogsTableRows() {
        return this.logs.map(log => {
            const statusInfo = this.getStatusInfo(log.status);
            return `
                <tr>
                    <td>${log.id}</td>
                    <td>${log.date}</td>
                    <td>${log.fromCurrency}</td>
                    <td>${log.toCurrency}</td>
                    <td>${log.amount}</td>
                    <td>${log.profit}</td>
                    <td><span class="badge bg-${statusInfo.color}">${statusInfo.text}</span></td>
                    <td>
                        <button class="btn btn-sm btn-info view-details" data-id="${log.id}">
                            <i class="bi bi-eye"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }
    
    /**
     * Exibe os detalhes de um log específico
     * @param {number} logId - ID do log a ser exibido
     */
    showLogDetails(logId) {
        const log = this.logs.find(l => l.id === logId);
        if (!log) return;
        
        // Implementar lógica para mostrar detalhes do log (modal ou outro formato)
        console.log('Detalhes do log:', log);
    }
}

// Exportar o controlador
export default ArbitrageController;