/**
 * FastCripto - Módulo de Segurança
 * Responsável por validações e verificações de segurança
 */

// Inicialização do módulo
function initializeSecurityModule() {
  // Adicionar listeners para formulários que precisam de validação
  setupFormValidations();

  if (CONFIG.debugMode) {
    console.log('FastCripto: Módulo de segurança inicializado');
  }
}

// Configurar validações de formulários
function setupFormValidations() {
  // Validação de carteira
  const walletInput = document.getElementById('wallet-address');
  if (walletInput) {
    walletInput.addEventListener('blur', validateWalletAddress);
  }

  // Validação de CPF no KYC
  const cpfInput = document.getElementById('kyc-cpf');
  if (cpfInput) {
    cpfInput.addEventListener('blur', validateCPF);
    cpfInput.addEventListener('input', formatCPF);
  }

  // Validação de telefone no KYC
  const phoneInput = document.getElementById('kyc-phone');
  if (phoneInput) {
    phoneInput.addEventListener('blur', validatePhone);
    phoneInput.addEventListener('input', formatPhone);
  }
}

// Validar endereço de carteira baseado na criptomoeda selecionada
function validateWalletAddress() {
  const walletInput = document.getElementById('wallet-address');
  const cryptoSelect = document.getElementById('crypto-currency');
  const walletValue = walletInput.value.trim();
  const cryptoValue = cryptoSelect.value;

  if (!walletValue) {
    showValidationError(walletInput, 'Endereço da carteira é obrigatório');
    return false;
  }

  let isValid = false;
  const networkRadios = document.querySelectorAll('input[name="network"]');
  let selectedNetwork = '';

  // Identificar a rede selecionada
  for (const radio of networkRadios) {
    if (radio.checked) {
      selectedNetwork = radio.value;
      break;
    }
  }

  // Validações específicas por tipo de criptomoeda e rede
  if (cryptoValue === 'BTC' && selectedNetwork === 'BTC') {
    // Validação para endereços Bitcoin (simplificada)
    isValid =
      /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[ac-hj-np-z02-9]{39,59}$/.test(
        walletValue
      );
    if (!isValid) {
      showValidationError(walletInput, 'Endereço Bitcoin inválido');
    }
  } else if (
    (cryptoValue === 'ETH' || cryptoValue === 'USDT') &&
    selectedNetwork === 'ETH'
  ) {
    // Validação para endereços Ethereum
    isValid = /^0x[a-fA-F0-9]{40}$/.test(walletValue);
    if (!isValid) {
      showValidationError(walletInput, 'Endereço Ethereum inválido');
    }
  } else if (
    (cryptoValue === 'BNB' || cryptoValue === 'USDT') &&
    selectedNetwork === 'BSC'
  ) {
    // Validação para endereços BSC (mesmo formato do Ethereum)
    isValid = /^0x[a-fA-F0-9]{40}$/.test(walletValue);
    if (!isValid) {
      showValidationError(walletInput, 'Endereço BSC inválido');
    }
  } else if (cryptoValue === 'XRP') {
    // Validação para endereços Ripple
    isValid = /^r[0-9a-zA-Z]{24,34}$/.test(walletValue);
    if (!isValid) {
      showValidationError(walletInput, 'Endereço Ripple inválido');
    }
  } else {
    // Verificação de compatibilidade entre moeda e rede
    showValidationError(
      walletInput,
      `A rede ${selectedNetwork} não é compatível com ${cryptoValue}`
    );
    isValid = false;
  }

  if (isValid) {
    clearValidationError(walletInput);
  }

  return isValid;
}

// Validar CPF
function validateCPF() {
  const cpfInput = document.getElementById('kyc-cpf');
  const cpf = cpfInput.value.replace(/[^\d]/g, '');

  if (cpf.length !== 11) {
    showValidationError(cpfInput, 'CPF deve conter 11 dígitos');
    return false;
  }

  // Verificar se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(cpf)) {
    showValidationError(cpfInput, 'CPF inválido');
    return false;
  }

  // Algoritmo de validação de CPF
  let sum = 0;
  let remainder;

  for (let i = 1; i <= 9; i++) {
    sum += parseInt(cpf.substring(i - 1, i)) * (11 - i);
  }

  remainder = (sum * 10) % 11;

  if (remainder === 10 || remainder === 11) {
    remainder = 0;
  }

  if (remainder !== parseInt(cpf.substring(9, 10))) {
    showValidationError(cpfInput, 'CPF inválido');
    return false;
  }

  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(cpf.substring(i - 1, i)) * (12 - i);
  }

  remainder = (sum * 10) % 11;

  if (remainder === 10 || remainder === 11) {
    remainder = 0;
  }

  if (remainder !== parseInt(cpf.substring(10, 11))) {
    showValidationError(cpfInput, 'CPF inválido');
    return false;
  }

  clearValidationError(cpfInput);
  return true;
}

// Formatar CPF enquanto digita (000.000.000-00)
function formatCPF(e) {
  const input = e.target;
  let value = input.value.replace(/\D/g, '');

  if (value.length > 11) {
    value = value.substring(0, 11);
  }

  if (value.length > 9) {
    input.value = value.replace(
      /(\d{3})(\d{3})(\d{3})(\d{1,2})/,
      '$1.$2.$3-$4'
    );
  } else if (value.length > 6) {
    input.value = value.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
  } else if (value.length > 3) {
    input.value = value.replace(/(\d{3})(\d{1,3})/, '$1.$2');
  } else {
    input.value = value;
  }
}

// Validar telefone
function validatePhone() {
  const phoneInput = document.getElementById('kyc-phone');
  const phone = phoneInput.value.replace(/\D/g, '');
  const feedbackElement = document.getElementById('phone-feedback');

  // Verificar comprimento básico
  if (phone.length < 10 || phone.length > 11) {
    showValidationError(phoneInput, 'Telefone deve ter 10 ou 11 dígitos');
    
    if (feedbackElement) {
      feedbackElement.style.display = 'block';
      feedbackElement.style.color = '#e11d48';
      feedbackElement.innerHTML = '<i class="bi bi-exclamation-circle-fill" style="margin-right: 5px;"></i> Formato inválido. Use (XX) XXXXX-XXXX para celular ou (XX) XXXX-XXXX para fixo.';
    }
    
    return false;
  }
  
  // Extrair DDD e número
  const ddd = phone.substring(0, 2);
  const number = phone.substring(2);
  
  // Lista de DDDs válidos do Brasil
  const validDDDs = [
    '11', '12', '13', '14', '15', '16', '17', '18', '19', // São Paulo
    '21', '22', '24', '27', '28',                         // Rio de Janeiro, Espírito Santo
    '31', '32', '33', '34', '35', '37', '38',             // Minas Gerais
    '41', '42', '43', '44', '45', '46', '47', '48', '49', // Paraná, Santa Catarina
    '51', '53', '54', '55',                               // Rio Grande do Sul
    '61', '62', '63', '64', '65', '66', '67', '68', '69', // Centro-Oeste e Tocantins
    '71', '73', '74', '75', '77', '79',                   // Bahia, Sergipe
    '81', '82', '83', '84', '85', '86', '87', '88', '89', // Nordeste
    '91', '92', '93', '94', '95', '96', '97', '98', '99'  // Norte
  ];
  
  // Verificar se o DDD é válido
  if (!validDDDs.includes(ddd)) {
    showValidationError(phoneInput, 'DDD inválido');
    
    if (feedbackElement) {
      feedbackElement.style.display = 'block';
      feedbackElement.style.color = '#e11d48';
      feedbackElement.innerHTML = '<i class="bi bi-exclamation-circle-fill" style="margin-right: 5px;"></i> DDD ' + ddd + ' não é um código de área válido no Brasil.';
    }
    
    return false;
  }
  
  // Verificar tipo de telefone (celular ou fixo)
  if (phone.length === 11) {
    // Celular: deve começar com 9 após o DDD
    if (number.charAt(0) !== '9') {
      showValidationError(phoneInput, 'Celular deve começar com 9 após o DDD');
      
      if (feedbackElement) {
        feedbackElement.style.display = 'block';
        feedbackElement.style.color = '#e11d48';
        feedbackElement.innerHTML = '<i class="bi bi-exclamation-circle-fill" style="margin-right: 5px;"></i> Celulares no Brasil devem começar com 9 após o DDD.';
      }
      
      return false;
    }
  } else {
    // Telefone fixo: não pode começar com 0 ou 9
    if (number.charAt(0) === '0' || number.charAt(0) === '9') {
      showValidationError(phoneInput, 'Número fixo inválido');
      
      if (feedbackElement) {
        feedbackElement.style.display = 'block';
        feedbackElement.style.color = '#e11d48';
        feedbackElement.innerHTML = '<i class="bi bi-exclamation-circle-fill" style="margin-right: 5px;"></i> Telefones fixos não podem começar com 0 ou 9 após o DDD.';
      }
      
      return false;
    }
  }
  
  // Verificar números repetidos ou sequências óbvias
  const isAllSameDigits = /^(\d)\1+$/.test(number);
  const isSimpleSequence = /^(0123456789|1234567890|9876543210|0987654321)$/.test(number);
  
  if (isAllSameDigits || isSimpleSequence) {
    showValidationError(phoneInput, 'Número de telefone inválido');
    
    if (feedbackElement) {
      feedbackElement.style.display = 'block';
      feedbackElement.style.color = '#e11d48';
      feedbackElement.innerHTML = '<i class="bi bi-exclamation-circle-fill" style="margin-right: 5px;"></i> Este número de telefone parece ser inválido.';
    }
    
    return false;
  }
  
  // Se chegou até aqui, o telefone é válido
  clearValidationError(phoneInput);
  
  if (feedbackElement) {
    feedbackElement.style.display = 'block';
    feedbackElement.style.color = '#047857';
    feedbackElement.innerHTML = '<i class="bi bi-check-circle-fill" style="margin-right: 5px;"></i> Número de telefone válido';
  }
  
  // Destacar positivamente o campo
  phoneInput.style.borderColor = '#10b981';
  phoneInput.style.backgroundColor = 'rgba(16, 185, 129, 0.05)';
  
  return true;
}

// Formatar telefone enquanto digita ((00) 00000-0000)
function formatPhone(e) {
  const input = e.target;
  let value = input.value.replace(/\D/g, '');

  if (value.length > 11) {
    value = value.substring(0, 11);
  }

  if (value.length > 10) {
    // Formato para celular (11 dígitos)
    input.value = value.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  } else if (value.length > 6) {
    // Formato para telefone fixo (10 dígitos) ou celular incompleto
    input.value = value.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
  } else if (value.length > 2) {
    // Apenas DDD
    input.value = value.replace(/(\d{2})(\d{0,5})/, '($1) $2');
  } else {
    input.value = value;
  }
  
  // Verificação em tempo real
  if (value.length > 2) {
    const ddd = value.substring(0, 2);
    const validDDDs = [
      '11', '12', '13', '14', '15', '16', '17', '18', '19',
      '21', '22', '24', '27', '28',
      '31', '32', '33', '34', '35', '37', '38',
      '41', '42', '43', '44', '45', '46', '47', '48', '49',
      '51', '53', '54', '55',
      '61', '62', '63', '64', '65', '66', '67', '68', '69',
      '71', '73', '74', '75', '77', '79',
      '81', '82', '83', '84', '85', '86', '87', '88', '89',
      '91', '92', '93', '94', '95', '96', '97', '98', '99'
    ];
    
    // Verificar DDD
    if (!validDDDs.includes(ddd)) {
      input.style.borderColor = '#f59e0b';
      const parent = input.parentNode;
      
      let warningElement = parent.querySelector('.phone-warning');
      if (!warningElement) {
        warningElement = document.createElement('div');
        warningElement.className = 'phone-warning';
        warningElement.style.color = '#f59e0b';
        warningElement.style.fontSize = '0.8rem';
        warningElement.style.marginTop = '5px';
        parent.appendChild(warningElement);
      }
      
      warningElement.textContent = 'DDD ' + ddd + ' parece não ser válido no Brasil';
      return;
    }
    
    // Verificar se é celular (11 dígitos) e começa com 9
    if (value.length === 11 && value.charAt(2) !== '9') {
      input.style.borderColor = '#f59e0b';
      const parent = input.parentNode;
      
      let warningElement = parent.querySelector('.phone-warning');
      if (!warningElement) {
        warningElement = document.createElement('div');
        warningElement.className = 'phone-warning';
        warningElement.style.color = '#f59e0b';
        warningElement.style.fontSize = '0.8rem';
        warningElement.style.marginTop = '5px';
        parent.appendChild(warningElement);
      }
      
      warningElement.textContent = 'Celular deve começar com 9 após o DDD';
    } else if (value.length === 10 && (value.charAt(2) === '0' || value.charAt(2) === '9')) {
      // Verificar telefone fixo (10 dígitos)
      input.style.borderColor = '#f59e0b';
      const parent = input.parentNode;
      
      let warningElement = parent.querySelector('.phone-warning');
      if (!warningElement) {
        warningElement = document.createElement('div');
        warningElement.className = 'phone-warning';
        warningElement.style.color = '#f59e0b';
        warningElement.style.fontSize = '0.8rem';
        warningElement.style.marginTop = '5px';
        parent.appendChild(warningElement);
      }
      
      warningElement.textContent = 'Telefone fixo não deve começar com 0 ou 9 após o DDD';
    } else {
      // Remover a dica visual se tudo está ok
      input.style.borderColor = '';
      const warningElement = input.parentNode.querySelector('.phone-warning');
      if (warningElement) {
        warningElement.remove();
      }
      
      // Adicionando feedback visual positivo se o número estiver completo
      if ((value.length === 10 && value.charAt(2) !== '0' && value.charAt(2) !== '9') || 
          (value.length === 11 && value.charAt(2) === '9')) {
        input.style.borderColor = '#10b981';
        input.style.backgroundColor = 'rgba(16, 185, 129, 0.05)';
      }
    }
  }
}

// Exibir mensagem de erro de validação
function showValidationError(inputElement, message) {
  clearValidationError(inputElement);

  const errorElement = document.createElement('div');
  errorElement.className = 'validation-error';
  errorElement.textContent = message;

  inputElement.classList.add('input-error');
  inputElement.parentNode.appendChild(errorElement);
}

// Limpar mensagem de erro de validação
function clearValidationError(inputElement) {
  const parent = inputElement.parentNode;
  const errorElement = parent.querySelector('.validation-error');

  if (errorElement) {
    errorElement.remove();
  }

  inputElement.classList.remove('input-error');
}

// Exportar funções para uso global
window.validateWalletAddress = validateWalletAddress;
window.validateCPF = validateCPF;
window.validatePhone = validatePhone;
