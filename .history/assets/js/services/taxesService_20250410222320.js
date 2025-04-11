/**
 * taxesService.js
 * Serviço responsável por calcular impostos e taxas brasileiras para operações com criptomoedas
 */

/**
 * Calcula o IOF para operações com criptomoedas
 * @param {number} amount - Valor da operação em BRL
 * @returns {number} Valor do IOF
 */
function calculateIOF(amount) {
    // IOF para operações com moeda estrangeira é de 0.38% para a maioria das transações
    const iofRate = 0.0038;
    return amount * iofRate;
}

/**
 * Calcula o Imposto de Renda sobre o lucro em operações com criptomoedas
 * @param {number} amount - Valor da operação em BRL
 * @param {boolean} isProfit - Se é uma operação com lucro
 * @param {number} profitAmount - Valor do lucro (se aplicável)
 * @returns {number} Valor do IR ou 0 se isProfit for falso
 */
function calculateIR(amount, isProfit = false, profitAmount = 0) {
    // Se não for lucro, não há IR
    if (!isProfit) return 0;
    
    // IR sobre lucro em criptomoedas é isento até R$ 35.000,00 mensais
    // Acima disso, é de 15% sobre o lucro
    if (amount <= 35000) {
        return 0;
    }
    
    const irRate = 0.15;
    return profitAmount * irRate;
}

/**
 * Calcula a taxa de intermediação (6%)
 * @param {number} amount - Valor da operação em BRL
 * @returns {number} Valor da taxa de intermediação
 */
function calculateExchangeFee(amount) {
    // Taxa de 6%
    const feeRate = 0.06;
    return amount * feeRate;
}

/**
 * Calcula a taxa de rede (simulada)
 * @param {string} crypto - Criptomoeda da operação
 * @param {string} network - Rede da criptomoeda (ex: TRON, ETH)
 * @param {string} fromCurrency - Moeda de origem
 * @param {number} cryptoRate - Taxa da criptomoeda na moeda de origem
 * @returns {number} Valor da taxa de rede em BRL
 */
function calculateNetworkFee(crypto, network, fromCurrency, cryptoRate) {
    // Taxas fixas por rede
    const networkFees = {
        'TRON': 1,      // 1 USDT
        'ETH': 5,       // 5 USDT (rede mais cara)
        'BSC': 0.5,     // 0.5 USDT
        'POLYGON': 0.1  // 0.1 USDT
    };
    
    // Taxa padrão (se a rede não for especificada)
    const defaultFee = 1; // 1 USDT
    
    // Obter a taxa para a rede especificada ou usar a padrão
    const usdtFee = networkFees[network] || defaultFee;
    
    // Converter para a moeda de origem
    return fromCurrency === 'USD' ? usdtFee : usdtFee * cryptoRate;
}

/**
 * Calcula todas as taxas e impostos para uma operação
 * @param {string} fromCurrency - Moeda de origem
 * @param {string} toCrypto - Criptomoeda de destino
 * @param {number} amount - Valor em moeda de origem
 * @param {number} convertedAmount - Valor convertido em criptomoeda
 * @param {number} cryptoRate - Taxa da criptomoeda na moeda de origem
 * @returns {Object} Objeto com todas as taxas e impostos calculados
 */
function calculateAllFeesAndTaxes(fromCurrency, toCrypto, amount, convertedAmount, cryptoRate) {
    // Se não for BRL, retorna objeto vazio (só calculamos impostos brasileiros)
    if (fromCurrency !== 'BRL') {
        return {
            iof: 0,
            ir: 0,
            exchangeFee: 0,
            networkFee: 0,
            total: 0,
            totalInBRL: 0,
            finalAmount: convertedAmount
        };
    }
    
    // Calcula IOF
    const iof = calculateIOF(amount);
    
    // Calcula taxa de intermediação
    const exchangeFee = calculateExchangeFee(amount);
    
    // Calcula taxa de rede
    const networkFee = calculateNetworkFee(toCrypto, fromCurrency, cryptoRate);
    
    // Total em BRL
    const totalInBRL = iof + exchangeFee + networkFee;
    
    // Calcula a redução proporcional na quantidade de cripto
    // (quanto o usuário vai receber a menos por causa das taxas)
    const proportionalReduction = totalInBRL / amount;
    const finalAmount = convertedAmount * (1 - proportionalReduction);
    
    return {
        iof,
        ir: 0, // IR só é aplicado em vendas com lucro
        exchangeFee,
        networkFee,
        total: totalInBRL,
        totalInBRL,
        finalAmount
    };
}

export {
    calculateIOF,
    calculateIR,
    calculateExchangeFee,
    calculateNetworkFee,
    calculateAllFeesAndTaxes
};