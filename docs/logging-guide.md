# Guia de Logging para o projeto Crypto Convert System

## Introdução

Este documento descreve o sistema de logging implementado no projeto Crypto Convert System. O objetivo é padronizar o registro de logs em todo o projeto, facilitando a depuração e monitoramento da aplicação.

## Sistema de Logging

O sistema de logging utiliza a biblioteca Winston para fornecer recursos avançados:

- Diferentes níveis de log (debug, info, warn, error)
- Formatação consistente de mensagens
- Configuração baseada no ambiente (desenvolvimento/produção)
- Possibilidade de integração com serviços de monitoramento externos

## Como usar o Logger

### 1. Importe o Logger no seu arquivo

```javascript
import { getLogger } from '../utils/Logger';

// Crie uma instância com o nome do seu módulo
const logger = getLogger('NomeDoModulo');
```

### 2. Use os métodos de logging

```javascript
// Para informações gerais
logger.info('Operação concluída com sucesso', { dados: resultado });

// Para mensagens de depuração (visíveis apenas em ambiente de desenvolvimento)
logger.debug('Detalhes da requisição', { params, headers });

// Para avisos não críticos
logger.warn('Cache expirado, buscando dados novamente');

// Para erros
logger.error('Falha ao processar transação', erro);
```

### 3. Substitua os console.log existentes

Em vez de:

```javascript
console.log('Inicializando módulo...');
console.error('Erro ao processar:', erro);
```

Use:

```javascript
logger.info('Inicializando módulo...');
logger.error('Erro ao processar:', erro);
```

## Níveis de Log

- **DEBUG**: Informações detalhadas para depuração (visíveis apenas em desenvolvimento)
- **INFO**: Informações gerais sobre o funcionamento normal da aplicação
- **WARN**: Situações potencialmente problemáticas que não impedem o funcionamento
- **ERROR**: Erros que afetam a funcionalidade e precisam de atenção

## Configuração

A configuração do logger é feita no arquivo `src/utils/Logger.js`. Em produção, os logs de nível DEBUG são automaticamente filtrados.

## Boas práticas

1. **Seja específico**: Inclua informações suficientes para entender o contexto
2. **Evite dados sensíveis**: Não logue informações sensíveis como senhas, tokens ou chaves privadas
3. **Use estruturação**: Passe objetos como segundo parâmetro para ter logs estruturados
4. **Seja consistente**: Use o mesmo nível de log para situações similares

## Exemplos de uso

### Logging de eventos do ciclo de vida:

```javascript
class MeuServico {
  constructor() {
    this.logger = getLogger('MeuServico');
    this.logger.info('Serviço inicializado');
  }
  
  iniciar() {
    this.logger.info('Serviço iniciado');
  }
  
  parar() {
    this.logger.info('Serviço parado');
  }
}
```

### Logging de erros com contexto:

```javascript
try {
  // Código que pode falhar
} catch (erro) {
  logger.error('Falha ao processar pagamento', {
    erro: {
      mensagem: erro.message,
      stack: erro.stack
    },
    contexto: {
      transacaoId: id,
      valor: valor
    }
  });
}
```

## Migração gradual

O sistema de logging está sendo implementado gradualmente. Arquivos que já foram migrados:

- `src/utils/Logger.js` - Implementação do sistema
- `src/services/Analytics.js` - Primeiro serviço migrado
- `src/services/PriceAlertService.js` - Segundo serviço migrado

## Próximos passos

- Migrar todos os arquivos que usam `console.log` para o sistema de logging
- Integrar com um serviço de monitoramento de erros (Sentry, LogRocket, etc.)
- Adicionar transporte para logging em arquivo em ambiente de produção 