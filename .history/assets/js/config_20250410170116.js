/**
 * FastCripto - Configurações da aplicação
 */

export const CONFIG = {
  appName: 'FastCripto',
  version: '1.0.0',
  environment: 'development', // 'development', 'test', or 'production'
  
  // Configurações de conversão
  minConversionAmount: 100, // Valor mínimo para conversão em BRL
  maxConversionAmount: 100000, // Valor máximo para conversão em BRL
  
  // Configurações de taxas
  refreshRatesInterval: 60, // Intervalo de atualização de taxas em segundos
  usdToBrlRate: 5.05, // Taxa de conversão USD para BRL (fallback)
  
  // Taxas e impostos
  iofRate: 0.0038, // IOF: 0.38%
  incomeTaxRate: 0.15, // Imposto de Renda: 15%
  serviceRate: 0.10, // Taxa de serviço: 10%
  
  // Taxas de rede (valores médios em suas respectivas moedas)
  networkFees: {
    BTC: 0.0005,
    ETH: 0.003,
    USDT: 5
  },
  
  // Debug
  debugMode: true
};