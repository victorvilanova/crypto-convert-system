# Guia de Gerenciamento de Event Handlers

## Introdução

O gerenciamento adequado de event handlers é crucial para evitar memory leaks e garantir a estabilidade da aplicação, especialmente em aplicações de longa duração ou SPAs. Este documento fornece diretrizes para o correto uso e limpeza de event handlers no projeto Crypto Convert System.

## Boas Práticas

### 1. Armazenar Referências aos Event Handlers

Sempre armazene referências aos event handlers para facilitar a remoção posterior:

```javascript
// Ruim - Difícil de remover posteriormente
element.addEventListener('click', function() {
  // lógica aqui
});

// Bom - Armazena referência para remoção posterior
this.clickHandler = this.handleClick.bind(this);
element.addEventListener('click', this.clickHandler);
```

### 2. Utilizar o Método Bind Corretamente

Ao criar event handlers que precisam acessar o contexto (`this`), use o método `bind`:

```javascript
constructor() {
  // Fazer o binding uma única vez, geralmente no construtor
  this._boundHandleStorageEvent = this._handleStorageEvent.bind(this);
}

init() {
  // Usar a referência com binding
  window.addEventListener('storage', this._boundHandleStorageEvent);
}
```

### 3. Implementar Método de Cleanup/Destroy

Cada classe que adiciona event listeners deve fornecer um método para remover esses listeners:

```javascript
destroy() {
  // Remover event listeners
  if (typeof window !== 'undefined' && window.removeEventListener) {
    window.removeEventListener('storage', this._boundHandleStorageEvent);
  }
  
  // Limpar referências
  this._boundHandleStorageEvent = null;
  
  // Parar temporizadores/intervalos
  if (this.timerId) {
    clearInterval(this.timerId);
    this.timerId = null;
  }
  
  // Registrar a destruição
  logger.info('Recurso destruído com sucesso');
}
```

### 4. Limpar Event Listeners para Elementos que Serão Removidos

Antes de remover elementos DOM, certifique-se de remover seus event listeners:

```javascript
// Ao fechar um modal, por exemplo
function closeModal() {
  // Remover event listeners
  modalCloseBtn.removeEventListener('click', this.closeHandler);
  
  // Remover o elemento do DOM
  modal.parentNode.removeChild(modal);
}
```

### 5. Usar Delegação de Eventos Quando Apropriado

Para elementos dinâmicos que são criados/destruídos frequentemente, considere usar delegação de eventos:

```javascript
// Ao invés de adicionar um listener para cada item em uma lista
document.getElementById('lista').addEventListener('click', (e) => {
  // Verificar se o clique foi em um botão de item
  if (e.target.matches('.item-button')) {
    const itemId = e.target.dataset.id;
    // Processar o item
  }
});
```

### 6. Usar um Sistema de Rastreamento de Event Listeners

Para aplicações complexas, considere manter um registro central de todos os event listeners para facilitar a limpeza:

```javascript
class Component {
  constructor() {
    this.eventListeners = new Map();
  }
  
  addListener(element, event, handler) {
    const key = `${event}-${Date.now()}`;
    element.addEventListener(event, handler);
    this.eventListeners.set(key, { element, event, handler });
    return key;
  }
  
  removeListener(key) {
    const listener = this.eventListeners.get(key);
    if (listener) {
      const { element, event, handler } = listener;
      element.removeEventListener(event, handler);
      this.eventListeners.delete(key);
    }
  }
  
  destroy() {
    // Limpar todos os event listeners registrados
    this.eventListeners.forEach((listener) => {
      const { element, event, handler } = listener;
      element.removeEventListener(event, handler);
    });
    this.eventListeners.clear();
  }
}
```

## Exemplos Implementados

### 1. Padrão de Cleanup em Serviços

As seguintes classes já implementam o padrão de cleanup de event handlers:

- `PriceAlertService` - Implementa `destroy()` para limpar o event listener de storage e intervalos
- `UserSettings` - Implementa `destroy()` para limpar listeners e subscribers
- `MobileOptimizer` - Implementa `cleanup()` para remover listeners de orientação e toque
- `NotificationManager` - Implementa `destroy()` com sistema de rastreamento de event listeners
- `FormManager` - Implementa `destroy()` com sistema centralizado de gerenciamento de event listeners

### 2. Exemplo Completo: PriceAlertService

```javascript
constructor() {
  // Armazenar referência para o handler com binding
  this._boundHandleStorageEvent = this._handleStorageEvent.bind(this);
  window.addEventListener('storage', this._boundHandleStorageEvent);
}

destroy() {
  // Parar serviço
  this.stop();
  
  // Remover event listeners
  if (typeof window !== 'undefined' && window.removeEventListener) {
    window.removeEventListener('storage', this._boundHandleStorageEvent);
    this._boundHandleStorageEvent = null;
  }
  
  // Limpar referências
  this.notificationCallback = null;
  this.fetchPriceCallback = null;
}
```

### 3. Exemplo de Rastreamento Avançado: NotificationManager

Este exemplo mostra como implementar um sistema de rastreamento de event listeners para gerenciar múltiplos event listeners dinâmicos:

```javascript
constructor() {
  // ...
  this.eventListeners = new Map();
}

_renderNotification(notification) {
  // ...
  const closeBtn = element.querySelector('.notification-close');
  
  if (closeBtn) {
    const closeHandler = () => this.close(notification.id);
    closeBtn.addEventListener('click', closeHandler);
    
    // Armazenar referência do handler para limpeza posterior
    this.eventListeners.set(`close-${notification.id}`, {
      element: closeBtn,
      event: 'click',
      handler: closeHandler
    });
  }
}

_removeEventListener(key) {
  const listener = this.eventListeners.get(key);
  if (listener) {
    const { element, event, handler } = listener;
    if (element) {
      element.removeEventListener(event, handler);
    }
    this.eventListeners.delete(key);
  }
}

close(id) {
  // ...
  // Remover event listeners específicos desta notificação
  this._removeEventListener(`close-${id}`);
  this._removeEventListener(`click-${id}`);
  // ...
}

destroy() {
  // Fechar todas as notificações existentes
  this.closeAll();
  
  // Limpar todos os event listeners registrados
  this.eventListeners.forEach((listener, key) => {
    const { element, event, handler } = listener;
    if (element) {
      element.removeEventListener(event, handler);
    }
  });
  this.eventListeners.clear();
  
  // Remover elementos DOM
  if (this.container && this.container.parentNode) {
    this.container.parentNode.removeChild(this.container);
  }
  
  // Limpar propriedades
  this.container = null;
  this.notifications = [];
  this.initialized = false;
}
```

### 4. Exemplo de API Simplificada: FormManager

Este exemplo mostra como implementar uma API simplificada para gerenciamento de event listeners, facilitando seu uso em componentes de formulário:

```javascript
// Inicialização
constructor() {
  // ...
  this.eventListeners = new Map();
}

// API para adicionar event listeners com registro automático
addEventListenerToElement(element, event, handler, options) {
  if (!element || !event || !handler) return null;
  
  const key = `${event}-${Date.now()}`;
  element.addEventListener(event, handler, options);
  this.eventListeners.set(key, { element, event, handler, options });
  
  return key;
}

// API para remover um event listener específico
removeEventListener(key) {
  const listener = this.eventListeners.get(key);
  if (listener) {
    const { element, event, handler, options } = listener;
    if (element) {
      element.removeEventListener(event, handler, options);
    }
    this.eventListeners.delete(key);
  }
}

// Cleanup completo
destroy() {
  // Limpar todos os event listeners registrados
  this.eventListeners.forEach((listener, key) => {
    this.removeEventListener(key);
  });
  
  // Limpar referências
  this.onSubmit = null;
  this.onChange = null;
  
  // Limpar dados
  this.values = {};
  this.errors = {};
  this.touched = {};
}
```

## Melhorias Pendentes

As seguintes classes ainda precisam de implementação adequada de limpeza de event handlers:

1. `ConfigManager` 
2. Todos os controllers em `/controllers` e `/ui`

## Como Detectar Vazamentos de Memória

Para detectar potenciais vazamentos de memória relacionados a event handlers não liberados:

1. Use o DevTools > Memory > Take Heap Snapshot
2. Realize operações que criam/destroem componentes
3. Tome outra snapshot e compare
4. Procure por EventListeners retidos que deveriam ter sido liberados

## Conclusão

O gerenciamento adequado de event handlers é essencial para a estabilidade e performance do Crypto Convert System. Seguindo estas diretrizes, podemos garantir que nossa aplicação utilize os recursos do navegador de forma eficiente e evite vazamentos de memória. 