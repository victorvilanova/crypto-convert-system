/**
 * FastCripto - Configurações da aplicação
 */

export const CONFIG = {
  appName: 'FastCripto',
  version: '1.0.0',
  environment: 'development', // 'development', 'test', ou 'production'

  // Configurações de conversão
  minConversionAmount: 100, // Valor mínimo para conversão em BRL
  maxConversionAmount: 100000, // Valor máximo para conversão em BRL

  // Configurações de taxas
  refreshRatesInterval: 60, // Intervalo de atualização de taxas em segundos
  usdToBrlRate: 5.05, // Taxa de conversão USD para BRL (fallback)

  // Taxas iniciais (fallback caso a API falhe)
  initialRates: {
    BTC: 254871.35,
    ETH: 14875.22,
    USDT: 5.04,
  },

  // API endpoints
  apiEndpoints: {
    rates:
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tether&vs_currencies=brl',
    kyc: 'https://api.fastcripto.example/kyc',
    notifications: 'https://api.fastcripto.example/notifications',
  },

  // Taxas e impostos
  iofRate: 0.0038, // IOF: 0.38%
  incomeTaxRate: 0.15, // Imposto de Renda: 15%
  serviceRate: 0.1, // Taxa de serviço: 10%

  // Taxas de rede (valores médios em suas respectivas moedas)
  networkFees: {
    BTC: 0.0005,
    ETH: 0.003,
    USDT: {
      ETH: 10,
      BSC: 0.5,
      TRON: 1
    }
  },

  // Redes suportadas por criptomoeda
  supportedNetworks: {
    BTC: ['BTC'],
    ETH: ['ETH'],
    USDT: ['ETH', 'BSC', 'TRON']
  },

  // Debug
  debugMode: true,
};
