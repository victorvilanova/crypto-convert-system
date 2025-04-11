import React, { useState, useEffect } from 'react';
import { cryptoConverter } from '../services/CryptoConverter';
import { notificationManager } from '../services/NotificationManager';
import './CurrencyConverter.css';

const CurrencyConverter = () => {
  const [amount, setAmount] = useState('1');
  const [fromCurrency, setFromCurrency] = useState('BTC');
  const [toCurrency, setToCurrency] = useState('USD');
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [rate, setRate] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [cryptoList, setCryptoList] = useState([]);
  const [fiatList, setFiatList] = useState([]);
  const [apiStatus, setApiStatus] = useState({});
  
  // Inicialização
  useEffect(() => {
    // Carregar listas de moedas suportadas
    setCryptoList(cryptoConverter.getSupportedCryptos());
    setFiatList(cryptoConverter.getSupportedFiat());
    
    // Verificar status das APIs
    checkApiStatus();
    
    // Realizar conversão inicial
    handleConversion();
    
    // Configurar atualização periódica
    const interval = setInterval(() => {
      cryptoConverter.forceRateUpdate()
        .then(success => {
          if (success) {
            setLastUpdated(new Date().toLocaleTimeString());
            handleConversion(true);
          }
        });
    }, 60000); // Atualizar a cada minuto
    
    return () => clearInterval(interval);
  }, []);
  
  // Verificar status das APIs
  const checkApiStatus = async () => {
    try {
      const status = await cryptoConverter.checkApiStatus();
      setApiStatus(status);
    } catch (error) {
      console.error('Erro ao verificar status das APIs:', error);
    }
  };
  
  // Realizar conversão
  const handleConversion = async (silent = false) => {
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      notificationManager.warning('Por favor, insira um valor válido', 'Valor inválido');
      return;
    }
    
    try {
      if (!silent) setIsLoading(true);
      
      // Obter taxa atual
      const currentRate = await cryptoConverter.getExchangeRate(fromCurrency, toCurrency);
      setRate(currentRate);
      
      // Realizar conversão
      const convertedAmount = await cryptoConverter.convert(
        parseFloat(amount),
        fromCurrency,
        toCurrency
      );
      
      if (convertedAmount !== null) {
        setResult(convertedAmount);
        setLastUpdated(new Date().toLocaleTimeString());
      } else {
        throw new Error('Falha na conversão');
      }
    } catch (error) {
      console.error('Erro na conversão:', error);
      notificationManager.error(
        'Não foi possível realizar a conversão. Tente novamente.',
        'Erro'
      );
    } finally {
      if (!silent) setIsLoading(false);
    }
  };
  
  // Inverter moedas
  const handleSwapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
    // Atualizar conversão após um breve delay para permitir a atualização do estado
    setTimeout(() => handleConversion(), 100);
  };
  
  // Forçar atualização das taxas
  const handleForceUpdate = async () => {
    setIsLoading(true);
    notificationManager.info('Atualizando taxas de câmbio...', 'Atualizando');
    
    try {
      const success = await cryptoConverter.forceRateUpdate();
      
      if (success) {
        notificationManager.success('Taxas atualizadas com sucesso', 'Atualizado');
        setLastUpdated(new Date().toLocaleTimeString());
        handleConversion(true);
        checkApiStatus();
      } else {
        throw new Error('Falha ao atualizar taxas');
      }
    } catch (error) {
      notificationManager.error('Falha ao atualizar taxas', 'Erro');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Formatar resultado
  const formatCurrency = (value, currency) => {
    if (value === null) return 'Calculando...';
    
    let precision = 2;
    
    // Ajustar precisão para criptomoedas
    if (cryptoList.includes(currency)) {
      precision = 8;
    } else if (currency === 'BTC' || currency === 'ETH') {
      precision = 8;
    }
    
    // Valor abaixo de 0.01
    if (value > 0 && value < 0.01) {
      precision = 8;
    }
    
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: precision
    }).format(value);
  };

  return (
    <div className="converter-container">
      <h2>Conversor de Criptomoedas</h2>
      
      <div className="converter-form">
        <div className="form-group">
          <label htmlFor="amount">Valor:</label>
          <input
            id="amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="0"
            step="any"
            disabled={isLoading}
          />
        </div>
        
        <div className="currency-selectors">
          <div className="form-group">
            <label htmlFor="fromCurrency">De:</label>
            <select
              id="fromCurrency"
              value={fromCurrency}
              onChange={(e) => setFromCurrency(e.target.value)}
              disabled={isLoading}
            >
              <optgroup label="Criptomoedas">
                {cryptoList.map(crypto => (
                  <option key={`from-${crypto}`} value={crypto}>{crypto}</option>
                ))}
              </optgroup>
              <optgroup label="Moedas Fiduciárias">
                {fiatList.map(fiat => (
                  <option key={`from-${fiat}`} value={fiat}>{fiat}</option>
                ))}
              </optgroup>
            </select>
          </div>
          
          <button 
            className="swap-button" 
            onClick={handleSwapCurrencies}
            disabled={isLoading}
          >
            ⇄
          </button>
          
          <div className="form-group">
            <label htmlFor="toCurrency">Para:</label>
            <select
              id="toCurrency"
              value={toCurrency}
              onChange={(e) => setToCurrency(e.target.value)}
              disabled={isLoading}
            >
              <optgroup label="Criptomoedas">
                {cryptoList.map(crypto => (
                  <option key={`to-${crypto}`} value={crypto}>{crypto}</option>
                ))}
              </optgroup>
              <optgroup label="Moedas Fiduciárias">
                {fiatList.map(fiat => (
                  <option key={`to-${fiat}`} value={fiat}>{fiat}</option>
                ))}
              </optgroup>
            </select>
          </div>
        </div>
        
        <button 
          className="convert-button"
          onClick={() => handleConversion()}
          disabled={isLoading}
        >
          {isLoading ? 'Convertendo...' : 'Converter'}
        </button>
      </div>
      
      {result !== null && (
        <div className="result-container">
          <h3>Resultado:</h3>
          <div className="conversion-result">
            <div className="amount-display">
              {formatCurrency(parseFloat(amount), fromCurrency)} {fromCurrency}
            </div>
            <div className="equals">=</div>
            <div className="result-display">
              {formatCurrency(result, toCurrency)} {toCurrency}
            </div>
          </div>
          
          {rate !== null && (
            <div className="rate-info">
              1 {fromCurrency} = {formatCurrency(rate, toCurrency)} {toCurrency}
            </div>
          )}
          
          {lastUpdated && (
            <div className="update-info">
              <span>Última atualização: {lastUpdated}</span>
              <button 
                className="update-button"
                onClick={handleForceUpdate}
                disabled={isLoading}
              >
                ↻ Atualizar
              </button>
            </div>
          )}
        </div>
      )}
      
      <div className="api-status">
        <h4>Status das fontes de dados:</h4>
        <div className="status-indicators">
          {Object.keys(apiStatus).map(api => (
            <div 
              key={api} 
              className={`status-indicator ${apiStatus[api]?.available ? 'available' : 'unavailable'}`}
            >
              {api}
              <span className="status-dot"></span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CurrencyConverter;