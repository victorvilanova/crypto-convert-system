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

  // Validação mais rigorosa para formato brasileiro:
  // - DDD precisa começar com dígito entre 1-9
  // - Para celular: 11 dígitos total (com o 9 na frente)
  // - Para telefone fixo: 10 dígitos total
  if (phone.length < 10 || phone.length > 11) {
    showValidationError(phoneInput, 'Telefone deve ter 10 ou 11 dígitos');
    return false;
  }
  
  // Verificar se o DDD começa com um dígito válido
  if (!/^[1-9]/.test(phone)) {
    showValidationError(phoneInput, 'DDD inválido');
    return false;
  }
  
  // Se for celular (11 dígitos), o primeiro dígito após DDD deve ser 9
  if (phone.length === 11 && phone.charAt(2) !== '9') {
    showValidationError(phoneInput, 'Celular deve começar com 9 após o DDD');
    return false;
  }
  
  // Padrão final: (XX) XXXXX-XXXX para celular ou (XX) XXXX-XXXX para fixo
  if (!/^([1-9]{2})(9[0-9]{8}|[1-8][0-9]{7})$/.test(phone)) {
    showValidationError(phoneInput, 'Formato de telefone inválido');
    return false;
  }

  clearValidationError(phoneInput);
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
  
  // Verificar enquanto digita se o primeiro dígito após DDD é 9 (para celular)
  if (value.length >= 3 && value.length <= 11) {
    if (value.length === 11 && value.charAt(2) !== '9') {
      // Mostrar dica visual
      input.style.borderColor = '#f59e0b';
      const parent = input.parentNode;
      
      // Verificar se já existe um aviso, se não, criar um
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
    } else {
      // Remover a dica visual
      input.style.borderColor = '';
      const warningElement = input.parentNode.querySelector('.phone-warning');
      if (warningElement) {
        warningElement.remove();
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
