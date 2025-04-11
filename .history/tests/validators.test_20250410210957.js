import {
  isValidCPF,
  isValidCNPJ,
  isValidEmail,
  isValidPhone,
  isValidCEP,
  isValidNumber,
  isValidDate,
  isValidLength,
  isValidBitcoinAddress,
  isValidEthereumAddress
} from '../src/utils/validators';

describe('Validators', () => {
  // Testes para validação de CPF
  describe('isValidCPF', () => {
    test('deve validar CPFs corretos', () => {
      expect(isValidCPF('529.982.247-25')).toBe(true);
      expect(isValidCPF('52998224725')).toBe(true);
    });

    test('deve rejeitar CPFs inválidos', () => {
      expect(isValidCPF('111.111.111-11')).toBe(false); // Dígitos repetidos
      expect(isValidCPF('123.456.789-10')).toBe(false); // Dígito verificador incorreto
      expect(isValidCPF('529.982.247')).toBe(false); // Incompleto
      expect(isValidCPF('')).toBe(false); // Vazio
      expect(isValidCPF(null)).toBe(false); // Null
      expect(isValidCPF(undefined)).toBe(false); // Undefined
    });
  });

  // Testes para validação de CNPJ
  describe('isValidCNPJ', () => {
    test('deve validar CNPJs corretos', () => {
      expect(isValidCNPJ('11.444.777/0001-61')).toBe(true);
      expect(isValidCNPJ('11444777000161')).toBe(true);
    });

    test('deve rejeitar CNPJs inválidos', () => {
      expect(isValidCNPJ('11.111.111/1111-11')).toBe(false); // Dígitos repetidos
      expect(isValidCNPJ('11.444.777/0001-62')).toBe(false); // Dígito verificador incorreto
      expect(isValidCNPJ('11.444.777/0001')).toBe(false); // Incompleto
      expect(isValidCNPJ('')).toBe(false); // Vazio
      expect(isValidCNPJ(null)).toBe(false); // Null
      expect(isValidCNPJ(undefined)).toBe(false); // Undefined
    });
  });

  // Testes para validação de email
  describe('isValidEmail', () => {
    test('deve validar emails corretos', () => {
      expect(isValidEmail('usuario@dominio.com')).toBe(true);
      expect(isValidEmail('usuario.nome@empresa.com.br')).toBe(true);
      expect(isValidEmail('usuario+tag@gmail.com')).toBe(true);
    });

    test('deve rejeitar emails inválidos', () => {
      expect(isValidEmail('usuario@')).toBe(false);
      expect(isValidEmail('@dominio.com')).toBe(false);
      expect(isValidEmail('usuario@dominio')).toBe(false);
      expect(isValidEmail('usuario dominio.com')).toBe(false);
      expect(isValidEmail('')).toBe(false);
      expect(isValidEmail(null)).toBe(false);
      expect(isValidEmail(undefined)).toBe(false);
    });
  });

  // Testes para validação de telefone
  describe('isValidPhone', () => {
    test('deve validar telefones brasileiros corretos', () => {
      expect(isValidPhone('(11) 98765-4321')).toBe(true); // Celular
      expect(isValidPhone('11987654321')).toBe(true); // Celular sem formatação
      expect(isValidPhone('(11) 3456-7890')).toBe(true); // Fixo
      expect(isValidPhone('1134567890')).toBe(true); // Fixo sem formatação
    });

    test('deve rejeitar telefones inválidos', () => {
      expect(isValidPhone('(11) 8765-4321')).toBe(false); // Celular sem 9
      expect(isValidPhone('987654321')).toBe(false); // Sem DDD
      expect(isValidPhone('(00) 98765-4321')).toBe(false); // DDD inválido
      expect(isValidPhone('')).toBe(false);
      expect(isValidPhone(null)).toBe(false);
      expect(isValidPhone(undefined)).toBe(false);
    });
  });

  // Testes para validação de CEP
  describe('isValidCEP', () => {
    test('deve validar CEPs corretos', () => {
      expect(isValidCEP('01001-000')).toBe(true);
      expect(isValidCEP('01001000')).toBe(true);
    });

    test('deve rejeitar CEPs inválidos', () => {
      expect(isValidCEP('0100-000')).toBe(false); // Incompleto
      expect(isValidCEP('00000-000')).toBe(false); // CEP com todos os dígitos iguais
      expect(isValidCEP('')).toBe(false);
      expect(isValidCEP(null)).toBe(false);
      expect(isValidCEP(undefined)).toBe(false);
    });
  });

  // Testes para validação de números
  describe('isValidNumber', () => {
    test('deve validar números corretos', () => {
      expect(isValidNumber(10)).toBe(true);
      expect(isValidNumber('10')).toBe(true);
      expect(isValidNumber(10.5)).toBe(true);
      expect(isValidNumber('10.5')).toBe(true);
    });

    test('deve validar números com base em restrições', () => {
      expect(isValidNumber(10, { min: 5, max: 15 })).toBe(true);
      expect(isValidNumber(10, { min: 15 })).toBe(false); // Abaixo do mínimo
      expect(isValidNumber(10, { max: 5 })).toBe(false); // Acima do máximo
      expect(isValidNumber(10.5, { integer: true })).toBe(false); // Não é inteiro
      expect(isValidNumber(10, { integer: true })).toBe(true); // É inteiro
    });

    test('deve rejeitar valores não numéricos', () => {
      expect(isValidNumber('abc')).toBe(false);
      expect(isValidNumber('')).toBe(false);
      expect(isValidNumber(null)).toBe(false);
      expect(isValidNumber(undefined)).toBe(false);
      expect(isValidNumber(NaN)).toBe(false);
      expect(isValidNumber({})).toBe(false);
    });
  });

  // Testes para validação de data
  describe('isValidDate', () => {
    test('deve validar datas corretas', () => {
      expect(isValidDate(new Date())).toBe(true);
      expect(isValidDate('2021-03-01')).toBe(true);
    });

    test('deve validar datas com base em restrições', () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      expect(isValidDate(today, { minDate: yesterday })).toBe(true);
      expect(isValidDate(today, { maxDate: tomorrow })).toBe(true);
      expect(isValidDate(today, { minDate: tomorrow })).toBe(false); // Antes do mínimo
      expect(isValidDate(today, { maxDate: yesterday })).toBe(false); // Depois do máximo
    });

    test('deve rejeitar datas inválidas', () => {
      expect(isValidDate('2021-02-30')).toBe(false); // Data inexistente
      expect(isValidDate('')).toBe(false);
      expect(isValidDate('abc')).toBe(false);
    });
  });

  // Testes para validação de comprimento de string
  describe('isValidLength', () => {
    test('deve validar strings com comprimento correto', () => {
      expect(isValidLength('teste', { min: 3 })).toBe(true);
      expect(isValidLength('teste', { max: 10 })).toBe(true);
      expect(isValidLength('teste', { min: 3, max: 10 })).toBe(true);
    });

    test('deve rejeitar strings com comprimento incorreto', () => {
      expect(isValidLength('teste', { min: 10 })).toBe(false); // Muito curta
      expect(isValidLength('teste', { max: 3 })).toBe(false); // Muito longa
      expect(isValidLength('', { min: 1 })).toBe(false); // Vazia
      expect(isValidLength(123, { min: 1 })).toBe(false); // Não é string
      expect(isValidLength(null, { min: 1 })).toBe(false); // Null
      expect(isValidLength(undefined, { min: 1 })).toBe(false); // Undefined
    });
  });

  // Testes para validação de endereço Bitcoin
  describe('isValidBitcoinAddress', () => {
    test('deve validar endereços Bitcoin corretos', () => {
      expect(isValidBitcoinAddress('1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2')).toBe(true); // P2PKH
      expect(isValidBitcoinAddress('3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy')).toBe(true); // P2SH
      expect(isValidBitcoinAddress('bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq')).toBe(true); // Bech32
    });

    test('deve rejeitar endereços Bitcoin inválidos', () => {
      expect(isValidBitcoinAddress('1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN')).toBe(false); // Muito curto
      expect(isValidBitcoinAddress('1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2Z')).toBe(false); // Muito longo
      expect(isValidBitcoinAddress('XBvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2')).toBe(false); // Prefixo inválido
      expect(isValidBitcoinAddress('')).toBe(false);
      expect(isValidBitcoinAddress(null)).toBe(false);
      expect(isValidBitcoinAddress(undefined)).toBe(false);
    });
  });

  // Testes para validação de endereço Ethereum
  describe('isValidEthereumAddress', () => {
    test('deve validar endereços Ethereum corretos', () => {
      expect(isValidEthereumAddress('0x742d35Cc6634C0532925a3b844Bc454e4438f44e')).toBe(true);
      expect(isValidEthereumAddress('0xA324c2c1F0E675B83272B03151eAAee24336e093')).toBe(true);
    });

    test('deve rejeitar endereços Ethereum inválidos', () => {
      expect(isValidEthereumAddress('742d35Cc6634C0532925a3b844Bc454e4438f44e')).toBe(false); // Sem 0x
      expect(isValidEthereumAddress('0x742d35Cc6634C0532925a3b844Bc454e4438f44')).toBe(false); // Muito curto
      expect(isValidEthereumAddress('0x742d35Cc6634C0532925a3b844Bc454e4438f44eZ')).toBe(false); // Caractere inválido
      expect(isValidEthereumAddress('')).toBe(false);
      expect(isValidEthereumAddress(null)).toBe(false);
      expect(isValidEthereumAddress(undefined)).toBe(false);
    });
  });
});