import { CacheManager } from '../src/utils/CacheManager';

// Mock para o Date.now para poder controlar o tempo nos testes
const originalDateNow = Date.now;
let mockTime = 0;

beforeEach(() => {
  // Definir um tempo base para cada teste
  mockTime = 1614556800000; // 01/03/2021 00:00:00
  Date.now = jest.fn(() => mockTime);
});

afterEach(() => {
  // Restaurar a implementação original após os testes
  Date.now = originalDateNow;
});

describe('CacheManager', () => {
  test('deve armazenar e recuperar um valor do cache', () => {
    const cache = new CacheManager(60); // 60 minutos de TTL
    const testKey = 'test-key';
    const testValue = { name: 'Test Value', number: 42 };
    
    // Armazenar no cache
    cache.set(testKey, testValue);
    
    // Recuperar do cache
    const retrieved = cache.get(testKey);
    
    // Verificar se os valores são iguais
    expect(retrieved).toEqual(testValue);
  });
  
  test('deve retornar null para chaves não existentes', () => {
    const cache = new CacheManager();
    const result = cache.get('non-existent-key');
    expect(result).toBeNull();
  });
  
  test('deve respeitar o TTL e retornar null após expiração', () => {
    const cache = new CacheManager(10); // 10 minutos de TTL
    const testKey = 'expiry-test';
    
    // Armazenar no cache
    cache.set(testKey, 'value');
    
    // Verificar que o valor está disponível inicialmente
    expect(cache.get(testKey)).toBe('value');
    
    // Avançar o tempo para além do TTL (10 minutos = 600.000 ms)
    mockTime += 600001;
    
    // Agora o valor deve ter expirado
    expect(cache.get(testKey)).toBeNull();
  });
  
  test('deve permitir definir TTL personalizado por item', () => {
    const cache = new CacheManager(60); // 60 minutos padrão
    
    // Armazenar com TTL personalizado de 5 minutos
    cache.set('short-ttl', 'expires quickly', 5);
    
    // Armazenar com TTL padrão (60 minutos)
    cache.set('long-ttl', 'expires later');
    
    // Avançar 6 minutos
    mockTime += 360000;
    
    // O item com TTL curto deve ter expirado
    expect(cache.get('short-ttl')).toBeNull();
    
    // O item com TTL longo ainda deve existir
    expect(cache.get('long-ttl')).toBe('expires later');
  });
  
  test('deve remover um item específico do cache', () => {
    const cache = new CacheManager();
    
    cache.set('item1', 'value1');
    cache.set('item2', 'value2');
    
    // Remover um item
    cache.remove('item1');
    
    // Verificar que o item foi removido
    expect(cache.get('item1')).toBeNull();
    
    // Outros itens não devem ser afetados
    expect(cache.get('item2')).toBe('value2');
  });
  
  test('deve limpar todo o cache', () => {
    const cache = new CacheManager();
    
    cache.set('item1', 'value1');
    cache.set('item2', 'value2');
    
    // Limpar o cache
    cache.clear();
    
    // Verificar que todos os itens foram removidos
    expect(cache.get('item1')).toBeNull();
    expect(cache.get('item2')).toBeNull();
    expect(cache.size()).toBe(0);
  });
  
  test('deve limpar apenas itens expirados', () => {
    const cache = new CacheManager();
    
    // Item com 5 minutos de TTL
    cache.set('short-ttl', 'expires quickly', 5);
    
    // Item com TTL padrão (15 minutos)
    cache.set('long-ttl', 'expires later');
    
    // Avançar 6 minutos
    mockTime += 360000;
    
    // Limpar expirados
    cache.cleanExpired();
    
    // Verificar que apenas o item expirado foi removido
    expect(cache.get('short-ttl')).toBeNull();
    expect(cache.get('long-ttl')).toBe('expires later');
    expect(cache.size()).toBe(1);
  });
  
  test('deve retornar o tamanho correto do cache', () => {
    const cache = new CacheManager();
    
    expect(cache.size()).toBe(0);
    
    cache.set('item1', 'value1');
    expect(cache.size()).toBe(1);
    
    cache.set('item2', 'value2');
    expect(cache.size()).toBe(2);
    
    cache.remove('item1');
    expect(cache.size()).toBe(1);
    
    cache.clear();
    expect(cache.size()).toBe(0);
  });
});