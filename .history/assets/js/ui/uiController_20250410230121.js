/**
 * uiController.js
 * Controlador responsável pela interface do usuário
 */

// DOM Elements for UI updates
const resultContainer = document.getElementById('result');
const errorContainer = document.getElementById('error');
const loadingContainer = document.getElementById('loading');
const ratesTableBody = document.getElementById('ratesTableBody');
const messageContainer = document.getElementById('message');

// Importando o serviço de taxas
import { calculateAllFeesAndTaxes } from '../services/taxesService.js';
import { verifyKYCForTransaction, startKYCUpgrade, KYC_LEVELS } from '../services/kycService.js';
import { 
    validateWalletAddress, 
    getSupportedNetworks, 
    getDefaultNetwork,
    saveWalletAddress,
    getWalletAddress
} from '../services/walletService.js';

/**
 * Mostra a área de carregamento
 */
function showLoading() {
    loadingContainer.style.display = 'block';
    resultContainer.style.display = 'none';
    errorContainer.style.display = 'none';
}

/**
 * Esconde a área de carregamento
 */
function hideLoading() {
    loadingContainer.style.display = 'none';
}

/**
 * Exibe uma mensagem de erro
 * @param {string} message - Mensagem de erro a ser exibida
 */
function showError(message) {
    errorContainer.style.display = 'block';
    errorContainer.innerHTML = `<div class="alert alert-danger">${message}</div>`;
    resultContainer.style.display = 'none';
}

/**
 * Exibe o resultado da conversão
 * @param {string} fromCurrency - Moeda de origem
 * @param {string} toCrypto - Criptomoeda de destino
 * @param {number} amount - Quantidade a converter
 * @param {number} result - Resultado da conversão
 */
function displayResult(fromCurrency, toCrypto, amount, result) {
    resultContainer.style.display = 'block';
    errorContainer.style.display = 'none';
    
    // Taxa para calcular o valor em USDT (para a taxa de rede)
    const cryptoRate = amount / result;
    
    // Obter a rede padrão para a criptomoeda
    const defaultNetwork = getDefaultNetwork(toCrypto);
    
    // Calcular taxas e impostos brasileiros
    const feesAndTaxes = calculateAllFeesAndTaxes(fromCurrency, toCrypto, amount, result, cryptoRate);
    
    const formattedAmount = amount.toLocaleString('pt-BR', { 
        style: 'currency', 
        currency: fromCurrency 
    });
    
    const formattedResult = result.toLocaleString('pt-BR', { 
        maximumFractionDigits: 8 
    });
    
    const formattedFinalAmount = feesAndTaxes.finalAmount.toLocaleString('pt-BR', { 
        maximumFractionDigits: 8 
    });
    
    let resultHTML = `
        <div class="alert alert-success">
            <h4 class="alert-heading">Resultado da Simulação</h4>
            <p class="mb-0">
                ${formattedAmount} = <strong>${formattedResult} ${toCrypto}</strong>
            </p>
            <hr>
            <p class="mb-0 small">
                Taxa de conversão: 1 ${toCrypto} = ${(amount / result).toLocaleString('pt-BR', { 
                    style: 'currency', 
                    currency: fromCurrency,
                    maximumFractionDigits: 2
                })}
            </p>
    `;
    
    // Adicionar seção de impostos e taxas apenas para conversões em BRL
    if (fromCurrency === 'BRL') {
        resultHTML += `
            <hr>
            <h5 class="text-dark">Impostos e Taxas</h5>
            <div class="table-responsive">
                <table class="table table-sm">
                    <tbody>
                        <tr>
                            <td>IOF (0,38%)</td>
                            <td class="text-end">${feesAndTaxes.iof.toLocaleString('pt-BR', { 
                                style: 'currency', 
                                currency: 'BRL' 
                            })}</td>
                        </tr>
                        <tr>
                            <td>Taxa de intermediação (6%)</td>
                            <td class="text-end">${feesAndTaxes.exchangeFee.toLocaleString('pt-BR', { 
                                style: 'currency', 
                                currency: 'BRL' 
                            })}</td>
                        </tr>
                        <tr>
                            <td>Taxa de rede (1 USDT na rede TRON)</td>
                            <td class="text-end">${feesAndTaxes.networkFee.toLocaleString('pt-BR', { 
                                style: 'currency', 
                                currency: 'BRL' 
                            })}</td>
                        </tr>
                        <tr class="table-warning">
                            <th>Total de taxas</th>
                            <th class="text-end">${feesAndTaxes.totalInBRL.toLocaleString('pt-BR', { 
                                style: 'currency', 
                                currency: 'BRL'
                            })}</th>
                        </tr>
                    </tbody>
                </table>
            </div>
            <hr>
            <p class="mb-0">
                <strong>Valor líquido recebido após taxas:</strong> ${formattedFinalAmount} ${toCrypto}
            </p>
            <p class="small text-muted mt-2">
                * Valores de IOF e taxas são aproximados e podem variar conforme a corretora.
                <br>
                * Imposto de Renda (15%) aplicável para vendas com lucro acima de R$ 35.000,00 mensais.
            </p>
            <hr>
            <div class="d-grid gap-2">
                <button id="confirmTransactionBtn" class="btn btn-primary btn-lg">
                    <i class="fas fa-wallet me-2"></i>Informar Endereço da Carteira
                </button>
            </div>
        `;
        
        // Verificar KYC
        const kycResult = verifyKYCForTransaction(amount);
        if (!kycResult.approved) {
            resultHTML += `
                <div class="alert alert-warning mt-3">
                    <h5><i class="fas fa-exclamation-triangle me-2"></i>Verificação KYC Necessária</h5>
                    <p>${kycResult.reason}</p>
                    <p>Seu limite atual é de ${kycResult.limit.toLocaleString('pt-BR', { 
                        style: 'currency', 
                        currency: 'BRL'
                    })}</p>
                    <button id="upgradeKycBtn" class="btn btn-warning" 
                        data-level="${kycResult.requiredLevel}">
                        Aumentar Nível de Verificação
                    </button>
                </div>
            `;
        }
    }
    
    resultHTML += `</div>`;
    resultContainer.innerHTML = resultHTML;
    
    // Adicionar listeners para os novos botões
    const confirmBtn = document.getElementById('confirmTransactionBtn');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', () => showWalletForm(fromCurrency, toCrypto, amount, feesAndTaxes.finalAmount, defaultNetwork));
    }
    
    const upgradeKycBtn = document.getElementById('upgradeKycBtn');
    if (upgradeKycBtn) {
        upgradeKycBtn.addEventListener('click', () => {
            const targetLevel = parseInt(upgradeKycBtn.getAttribute('data-level'));
            handleKycUpgrade(targetLevel);
        });
    }
}

/**
 * Exibe o formulário para informar o endereço da carteira
 * @param {string} fromCurrency - Moeda de origem
 * @param {string} toCrypto - Criptomoeda de destino
 * @param {number} amount - Quantidade em moeda de origem
 * @param {number} finalAmount - Quantidade final em criptomoeda
 * @param {string} defaultNetwork - Rede blockchain padrão
 */
function showWalletForm(fromCurrency, toCrypto, amount, finalAmount, defaultNetwork) {
    // Verificar KYC antes de prosseguir
    if (fromCurrency === 'BRL') {
        const kycResult = verifyKYCForTransaction(amount);
        if (!kycResult.approved) {
            showError(`Não é possível completar a transação: ${kycResult.reason}`);
            return;
        }
    }
    
    // Obter redes suportadas para esta criptomoeda
    const supportedNetworks = getSupportedNetworks(toCrypto);
    
    // Obter endereço de carteira salvo, se houver
    const savedAddress = getWalletAddress(toCrypto, defaultNetwork);
    
    // Criar opções de rede
    let networkOptions = '';
    supportedNetworks.forEach(network => {
        const selected = network === defaultNetwork ? 'selected' : '';
        networkOptions += `<option value="${network}" ${selected}>${network}</option>`;
    });
    
    // Criar formulário
    const walletFormHTML = `
        <div class="card mb-4">
            <div class="card-header bg-primary text-white">
                <h5 class="mb-0">Informe sua carteira para receber ${toCrypto}</h5>
            </div>
            <div class="card-body">
                <form id="walletForm">
                    <div class="mb-3">
                        <label for="networkSelect" class="form-label">Rede de recebimento</label>
                        <select id="networkSelect" class="form-select" required ${toCrypto === 'USDT' ? 'disabled' : ''}>
                            ${networkOptions}
                        </select>
                        <div class="form-text">
                            ${toCrypto === 'USDT' ? 
                                '<div class="alert alert-danger mt-2 mb-0"><i class="fas fa-exclamation-triangle me-2"></i><strong>IMPORTANTE:</strong> Para USDT, utilizamos exclusivamente a rede <strong>TRON</strong>. Endereços de outras redes não são compatíveis e resultarão em perda de fundos.</div>' : 
                                'Selecione a rede blockchain para receber seus tokens.'}
                        </div>
                    </div>
                    
                    <div class="mb-3">
                        <label for="walletAddress" class="form-label">
                            <strong>${toCrypto === 'USDT' ? 'Endereço da carteira TRON (TRC20)' : 'Endereço da carteira'}</strong>
                        </label>
                        <input type="text" class="form-control ${toCrypto === 'USDT' ? 'border-danger' : ''}" id="walletAddress" 
                            placeholder="${toCrypto === 'USDT' ? 'Endereço TRON sempre começa com T... (Ex: TXo71H...)' : 'Endereço da carteira...'}" 
                            value="${savedAddress || ''}" required>
                        <div class="form-text ${toCrypto === 'USDT' ? 'text-danger' : 'text-muted'}">
                            ${toCrypto === 'USDT' ? 
                                '<strong>ATENÇÃO:</strong> Endereços TRON sempre começam com a letra T e têm 34 caracteres. Endereços de outras redes (como ETH ou BSC) NÃO são compatíveis!' : 
                                'Verifique cuidadosamente o endereço. Transações em blockchain são irreversíveis.'}
                        </div>
                    </div>
                    
                    ${toCrypto === 'USDT' ? `
                    <div class="alert alert-warning mb-3">
                        <h6 class="mb-2"><i class="fas fa-shield-alt me-2"></i>Confirme a compatibilidade do seu endereço:</h6>
                        <ul class="mb-2">
                            <li>O endereço <strong>COMEÇA com T</strong></li>
                            <li>O endereço <strong>TEM 34 caracteres</strong></li>
                            <li>O endereço é de uma <strong>carteira TRON (TRC20)</strong></li>
                            <li>NÃO é um endereço de exchange que não suporta TRC20</li>
                        </ul>
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" id="addressConfirmation" required>
                            <label class="form-check-label fw-bold" for="addressConfirmation">
                                Eu confirmo que este é um endereço TRON válido e estou ciente que endereços incorretos resultarão em perda permanente de fundos
                            </label>
                        </div>
                    </div>
                    ` : `
                    <div class="alert alert-warning mb-3">
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" id="addressConfirmation" required>
                            <label class="form-check-label fw-bold" for="addressConfirmation">
                                Eu confirmo que este endereço está correto e é um endereço ${defaultNetwork} válido
                            </label>
                        </div>
                    </div>
                    `}
                    
                    <div class="alert alert-info">
                        <p class="mb-1"><strong>Resumo da transação:</strong></p>
                        <p class="mb-1">Você receberá ${finalAmount.toLocaleString('pt-BR', { maximumFractionDigits: 8 })} ${toCrypto} na rede <span id="selectedNetworkDisplay">${defaultNetwork}</span></p>
                        <p class="mb-0">Valor enviado: ${amount.toLocaleString('pt-BR', { style: 'currency', currency: fromCurrency })}</p>
                    </div>
                    
                    <div class="d-grid gap-2">
                        <button type="submit" class="btn btn-success">
                            <i class="fas fa-paper-plane me-2"></i>Finalizar e Enviar
                        </button>
                        <button type="button" id="cancelWalletBtn" class="btn btn-outline-secondary">
                            <i class="fas fa-arrow-left me-2"></i>Voltar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    // Exibir o formulário
    resultContainer.innerHTML = walletFormHTML;
    
    // Adicionar eventos
    const walletForm = document.getElementById('walletForm');
    const networkSelect = document.getElementById('networkSelect');
    const selectedNetworkDisplay = document.getElementById('selectedNetworkDisplay');
    const cancelWalletBtn = document.getElementById('cancelWalletBtn');
    
    // Atualizar texto da rede quando ela mudar
    if (networkSelect && selectedNetworkDisplay) {
        networkSelect.addEventListener('change', () => {
            selectedNetworkDisplay.textContent = networkSelect.value;
            
            // Atualizar placeholder do endereço conforme a rede
            const walletAddressInput = document.getElementById('walletAddress');
            if (walletAddressInput) {
                if (networkSelect.value === 'TRON') {
                    walletAddressInput.placeholder = 'Exemplo: TXo71H...';
                } else if (['ETH', 'BSC', 'POLYGON'].includes(networkSelect.value)) {
                    walletAddressInput.placeholder = 'Exemplo: 0x71H...';
                }
                
                // Carregar endereço salvo para a rede selecionada, se houver
                const savedNetworkAddress = getWalletAddress(toCrypto, networkSelect.value);
                if (savedNetworkAddress) {
                    walletAddressInput.value = savedNetworkAddress;
                } else {
                    walletAddressInput.value = '';
                }
            }
        });
    }
    
    // Submissão do formulário
    if (walletForm) {
        walletForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const walletAddress = document.getElementById('walletAddress').value;
            const network = networkSelect.value;
            
            // Validar endereço
            const validation = validateWalletAddress(walletAddress, network);
            if (!validation.valid) {
                showError(validation.reason);
                return;
            }
            
            // Salvar endereço
            saveWalletAddress(toCrypto, network, walletAddress);
            
            // Processar a transação
            processTransaction(fromCurrency, toCrypto, amount, finalAmount, network, walletAddress);
        });
    }
    
    // Botão cancelar
    if (cancelWalletBtn) {
        cancelWalletBtn.addEventListener('click', () => {
            // Voltar para a tela de resultado
            displayResult(fromCurrency, toCrypto, amount, amount / (amount / finalAmount));
        });
    }
}

/**
 * Processa a transação após confirmação do endereço da carteira
 * @param {string} fromCurrency - Moeda de origem
 * @param {string} toCrypto - Criptomoeda de destino
 * @param {number} amount - Quantidade em moeda de origem
 * @param {number} finalAmount - Quantidade final em criptomoeda
 * @param {string} network - Rede blockchain
 * @param {string} walletAddress - Endereço da carteira
 */
function processTransaction(fromCurrency, toCrypto, amount, finalAmount, network, walletAddress) {
    // Exibir tela de carregamento
    showLoading();
    
    // Simulação de processamento (2 segundos)
    setTimeout(() => {
        hideLoading();
        
        // Abrir tela de KYC após verificação do endereço
        showKycVerificationScreen(fromCurrency, toCrypto, amount, finalAmount, network, walletAddress);
        
    }, 2000);
}

/**
 * Exibe a tela de verificação KYC após a confirmação do endereço
 * @param {string} fromCurrency - Moeda de origem
 * @param {string} toCrypto - Criptomoeda de destino
 * @param {number} amount - Quantidade em moeda de origem
 * @param {number} finalAmount - Quantidade final em criptomoeda
 * @param {string} network - Rede blockchain
 * @param {string} walletAddress - Endereço da carteira
 */
function showKycVerificationScreen(fromCurrency, toCrypto, amount, finalAmount, network, walletAddress) {
    // Formatar valores para exibição
    const formattedAmount = amount.toLocaleString('pt-BR', { 
        style: 'currency', 
        currency: fromCurrency 
    });
    
    const formattedFinalAmount = finalAmount.toLocaleString('pt-BR', { 
        maximumFractionDigits: 8 
    });
    
    const kycFormHTML = `
        <div class="card mb-4">
            <div class="card-header bg-primary text-white">
                <h5 class="mb-0">Verificação KYC (Know Your Customer)</h5>
            </div>
            <div class="card-body">
                <div class="alert alert-info mb-4">
                    <h6 class="alert-heading">Resumo da transação:</h6>
                    <p class="mb-1">Você vai receber ${formattedFinalAmount} ${toCrypto} na rede ${network}</p>
                    <p class="mb-1">Endereço da carteira: ${walletAddress}</p>
                    <p class="mb-0">Valor enviado: ${formattedAmount}</p>
                </div>
                
                <h6 class="mb-3">Para confirmar sua transação, precisamos verificar sua identidade:</h6>
                
                <form id="kycForm">
                    <div class="mb-3">
                        <label for="fullName" class="form-label">Nome Completo</label>
                        <input type="text" class="form-control" id="fullName" required>
                    </div>
                    
                    <div class="mb-3">
                        <label for="cpf" class="form-label">CPF</label>
                        <input type="text" class="form-control" id="cpf" placeholder="000.000.000-00" required>
                    </div>
                    
                    <div class="mb-3">
                        <label for="dateOfBirth" class="form-label">Data de Nascimento</label>
                        <input type="date" class="form-control" id="dateOfBirth" required>
                    </div>
                    
                    <div class="mb-3">
                        <label for="phoneNumber" class="form-label">Telefone</label>
                        <input type="tel" class="form-control" id="phoneNumber" placeholder="(00) 00000-0000" required>
                    </div>
                    
                    <div class="mb-3">
                        <label class="form-label">Documento de Identidade</label>
                        <div class="input-group mb-3">
                            <input type="file" class="form-control" id="idDocument" required>
                            <label class="input-group-text" for="idDocument">RG ou CNH (frente)</label>
                        </div>
                    </div>
                    
                    <div class="mb-3">
                        <label class="form-label">Selfie com Documento</label>
                        <div class="input-group mb-3">
                            <input type="file" class="form-control" id="selfieWithDocument" required>
                            <label class="input-group-text" for="selfieWithDocument">Selfie</label>
                        </div>
                        <div class="form-text">Tire uma selfie segurando seu documento de identidade.</div>
                    </div>
                    
                    <div class="mb-3">
                        <label class="form-label">Comprovante de Residência</label>
                        <div class="input-group mb-3">
                            <input type="file" class="form-control" id="addressProof" required>
                            <label class="input-group-text" for="addressProof">Comprovante</label>
                        </div>
                        <div class="form-text">Conta de água, luz ou telefone (últimos 3 meses).</div>
                    </div>
                    
                    <div class="form-check mb-3">
                        <input class="form-check-input" type="checkbox" id="termsAccepted" required>
                        <label class="form-check-label" for="termsAccepted">
                            Eu concordo com os <a href="#" data-bs-toggle="modal" data-bs-target="#termsModal">Termos e Condições</a> e confirmo que todas as informações são verdadeiras.
                        </label>
                    </div>
                    
                    <div class="d-grid gap-2">
                        <button type="submit" class="btn btn-success">
                            <i class="fas fa-user-check me-2"></i>Enviar Verificação
                        </button>
                        <button type="button" id="backToWalletBtn" class="btn btn-outline-secondary">
                            <i class="fas fa-arrow-left me-2"></i>Voltar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    resultContainer.innerHTML = kycFormHTML;
    
    // Adicionar evento de submissão do formulário
    const kycForm = document.getElementById('kycForm');
    if (kycForm) {
        kycForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Simulação de submissão do KYC
            showLoading();
            
            setTimeout(() => {
                hideLoading();
                
                // Finalizar a transação após aprovação do KYC
                finalizeTransaction(fromCurrency, toCrypto, amount, finalAmount, network, walletAddress);
                
            }, 3000);
        });
    }
    
    // Botão voltar
    const backToWalletBtn = document.getElementById('backToWalletBtn');
    if (backToWalletBtn) {
        backToWalletBtn.addEventListener('click', () => {
            // Voltar para o formulário de wallet
            showWalletForm(fromCurrency, toCrypto, amount, finalAmount, network);
        });
    }
}

/**
 * Adiciona uma transação ao histórico de transações recentes
 * @param {Object} transaction - Detalhes da transação
 */
function addToRecentTransactions(transaction) {
    // Obter transações existentes
    const transactions = JSON.parse(localStorage.getItem('recent_transactions') || '[]');
    
    // Adicionar nova transação
    transactions.unshift(transaction);
    
    // Limitar a 10 transações recentes
    if (transactions.length > 10) {
        transactions.pop();
    }
    
    // Salvar de volta no localStorage
    localStorage.setItem('recent_transactions', JSON.stringify(transactions));
}

/**
 * Manipula a confirmação de transação
 * @param {string} fromCurrency - Moeda de origem
 * @param {string} toCrypto - Criptomoeda de destino
 * @param {number} amount - Quantidade em moeda de origem
 * @param {number} finalAmount - Quantidade final em criptomoeda
 */
function handleConfirmTransaction(fromCurrency, toCrypto, amount, finalAmount) {
    // Verificar KYC antes de confirmar
    if (fromCurrency === 'BRL') {
        const kycResult = verifyKYCForTransaction(amount);
        if (!kycResult.approved) {
            showError(`Não é possível completar a transação: ${kycResult.reason}`);
            return;
        }
    }
    
    // Simulação de confirmação de transação
    showLoading();
    
    setTimeout(() => {
        hideLoading();
        
        // Exibir modal de confirmação
        showMessage(`
            <h5>Transação Confirmada!</h5>
            <p>Você converteu ${amount.toLocaleString('pt-BR', { 
                style: 'currency', 
                currency: fromCurrency 
            })} para ${finalAmount.toLocaleString('pt-BR', { 
                maximumFractionDigits: 8 
            })} ${toCrypto}.</p>
            <p>O valor será creditado na sua carteira em instantes.</p>
        `, 'success', 6000);
        
        // Limpar o formulário e resultado
        document.getElementById('converterForm')?.reset();
        resultContainer.style.display = 'none';
    }, 2000);
}

/**
 * Manipula o processo de upgrade de KYC
 * @param {number} targetLevel - Nível KYC desejado
 */
function handleKycUpgrade(targetLevel) {
    // Aqui seria iniciado o processo de upgrade do KYC
    const upgradeResult = startKYCUpgrade(targetLevel);
    
    if (upgradeResult.success) {
        // Exibir modal de instruções para o upgrade
        showMessage(`
            <h5>Processo de Verificação Iniciado</h5>
            <p>Para completar sua verificação, você precisará enviar os seguintes documentos:</p>
            <ul>
                ${upgradeResult.requiredDocuments.map(doc => `<li>${doc}</li>`).join('')}
            </ul>
            <p><strong>Próximos passos:</strong> ${upgradeResult.nextSteps}</p>
        `, 'info', 0);  // 0 para não desaparecer automaticamente
    } else {
        showMessage(upgradeResult.message, 'warning');
    }
}

/**
 * Mostra uma mensagem temporária ao usuário
 * @param {string} text - Texto a ser exibido
 * @param {string} type - Tipo da mensagem (success, danger, warning, info)
 * @param {number} duration - Duração em ms para a mensagem desaparecer (opcional)
 */
function showMessage(text, type = 'info', duration = 3000) {
    messageContainer.innerHTML = `<div class="alert alert-${type} alert-dismissible fade show" role="alert">
        ${text}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>`;
    messageContainer.style.display = 'block';
    
    if (duration) {
        setTimeout(() => {
            messageContainer.style.display = 'none';
        }, duration);
    }
}

// Load currency options
function loadCurrencyOptions() {
    // FIAT currencies
    const fiatCurrencies = [
        { code: 'BRL', name: 'Real Brasileiro' },
        { code: 'USD', name: 'Dólar Americano' },
        { code: 'EUR', name: 'Euro' },
        { code: 'GBP', name: 'Libra Esterlina' },
        { code: 'JPY', name: 'Iene Japonês' }
    ];
    
    // Cryptocurrencies
    const cryptoCurrencies = [
        { code: 'USDT', name: 'Tether' },
        { code: 'BTC', name: 'Bitcoin' },
        { code: 'ETH', name: 'Ethereum' },
        { code: 'ADA', name: 'Cardano' },
        { code: 'SOL', name: 'Solana' },
        { code: 'DOT', name: 'Polkadot' }
    ];
    
    // Populate selects
    populateSelect(fromCurrencySelect, fiatCurrencies);
    populateSelect(toCryptoSelect, cryptoCurrencies);
    
    // Set default values to BRL and USDT
    if (fromCurrencySelect) fromCurrencySelect.value = 'BRL';
    if (toCryptoSelect) toCryptoSelect.value = 'USDT';
}

/**
 * Atualiza a tabela de taxas na UI
 * @param {Object} rates - Objeto com as taxas de câmbio
 * @param {boolean} showAll - Se deve mostrar todas as moedas ou apenas as principais
 */
function updateUIWithRates(rates, showAll = false) {
    if (!ratesTableBody) return;
    
    ratesTableBody.innerHTML = '';
    
    // By default, only show BRL
    let currenciesToShow = ['BRL'];
    
    // If showAll is true, show all currencies
    if (showAll) {
        currenciesToShow = Object.keys(rates);
    }
    
    // By default, show these main cryptos
    let cryptosToShow = ['USDT', 'BTC', 'ETH'];
    
    // If showAll is true, show all cryptos
    if (showAll) {
        cryptosToShow = ['BTC', 'ETH', 'USDT', 'ADA', 'SOL', 'DOT'];
    }
    
    // Create table rows
    cryptosToShow.forEach(crypto => {
        currenciesToShow.forEach(currency => {
            if (rates[currency] && rates[currency][crypto]) {
                const rate = rates[currency][crypto];
                const tr = document.createElement('tr');
                
                // Calculate equivalence (how much crypto equals 1 unit of currency)
                const equivalence = 1 / rate;
                
                // Use font awesome icons as fallback if image not available
                const iconMap = {
                    'BTC': '<i class="fab fa-bitcoin text-warning"></i>',
                    'ETH': '<i class="fab fa-ethereum text-primary"></i>',
                    'USDT': '<i class="fas fa-dollar-sign text-success"></i>',
                    'ADA': '<i class="fas fa-coin text-info"></i>',
                    'SOL': '<i class="fas fa-sun text-warning"></i>',
                    'DOT': '<i class="fas fa-circle text-danger"></i>'
                };
                
                const icon = iconMap[crypto] || `<i class="fas fa-coins"></i>`;
                
                tr.innerHTML = `
                    <td>${icon} ${crypto}</td>
                    <td>${currency}</td>
                    <td>${rate.toLocaleString('pt-BR', { 
                        style: 'currency', 
                        currency: currency,
                        maximumFractionDigits: 2
                    })}</td>
                    <td>${equivalence.toLocaleString('pt-BR', { 
                        maximumFractionDigits: 8 
                    })} ${crypto}</td>
                `;
                ratesTableBody.appendChild(tr);
            }
        });
    });
}

/**
 * Finaliza o processo da transação após verificação KYC
 * @param {string} fromCurrency - Moeda de origem
 * @param {string} toCrypto - Criptomoeda de destino
 * @param {number} amount - Quantidade em moeda de origem
 * @param {number} finalAmount - Quantidade final em criptomoeda
 * @param {string} network - Rede blockchain
 * @param {string} walletAddress - Endereço da carteira
 */
function finalizeTransaction(fromCurrency, toCrypto, amount, finalAmount, network, walletAddress) {
    // Gerar ID de transação simulado
    const txId = Math.random().toString(36).substring(2, 15) + 
               Math.random().toString(36).substring(2, 15);
    
    // Formatar valores para exibição
    const formattedAmount = amount.toLocaleString('pt-BR', { 
        style: 'currency', 
        currency: fromCurrency 
    });
    
    const formattedFinalAmount = finalAmount.toLocaleString('pt-BR', { 
        maximumFractionDigits: 8 
    });
    
    // Exibir confirmação de transação concluída
    const successHTML = `
        <div class="alert alert-success">
            <h4 class="alert-heading"><i class="fas fa-check-circle me-2"></i>Verificação Concluída com Sucesso!</h4>
            <p>Seus documentos foram verificados e a transação foi processada.</p>
            <hr>
            <div class="mb-3">
                <p class="mb-1"><strong>Detalhes da transação:</strong></p>
                <ul class="list-unstyled">
                    <li><strong>ID da transação:</strong> ${txId}</li>
                    <li><strong>Data:</strong> ${new Date().toLocaleString('pt-BR')}</li>
                    <li><strong>Valor enviado:</strong> ${formattedAmount}</li>
                    <li><strong>Valor recebido:</strong> ${formattedFinalAmount} ${toCrypto}</li>
                    <li><strong>Rede:</strong> ${network}</li>
                    <li><strong>Endereço da carteira:</strong> ${walletAddress}</li>
                    <li><strong>Status:</strong> <span class="badge bg-success">Confirmado</span></li>
                </ul>
            </div>
            <p class="mb-0">O valor foi creditado na sua carteira com sucesso!</p>
            <div class="d-grid gap-2 mt-3">
                <button id="newTransactionBtn" class="btn btn-primary">
                    <i class="fas fa-plus-circle me-2"></i>Nova Simulação
                </button>
            </div>
        </div>
    `;
    
    resultContainer.innerHTML = successHTML;
    
    // Adicionar evento para nova transação
    const newTransactionBtn = document.getElementById('newTransactionBtn');
    if (newTransactionBtn) {
        newTransactionBtn.addEventListener('click', () => {
            // Limpar formulário e resultado
            document.getElementById('converterForm')?.reset();
            resultContainer.style.display = 'none';
        });
    }
    
    // Adicionar à lista de transações recentes
    addToRecentTransactions({
        id: txId,
        fromCurrency,
        toCrypto,
        amount,
        finalAmount,
        network,
        walletAddress,
        date: new Date().toISOString(),
        status: 'completed'
    });
}

export {
    showLoading,
    hideLoading,
    showError,
    displayResult,
    showMessage,
    updateUIWithRates
};