// Service Worker para FastCripto PWA
const CACHE_NAME = 'fastcripto-v1';

// Recursos que serão cacheados para funcionamento offline
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/assets/css/theme.css',
  '/assets/css/styles.css',
  '/assets/js/main.js',
  '/assets/images/logo.png',
  '/assets/images/icon-192x192.png',
  '/assets/images/icon-512x512.png',
  '/assets/fonts/roboto-v30-latin-regular.woff2',
  '/assets/fonts/roboto-v30-latin-500.woff2',
  '/assets/fonts/roboto-v30-latin-700.woff2'
];

// API de Taxas para cache offline
const API_CACHE = [
  // Rotas da API que serão cacheadas usando estratégia stale-while-revalidate
  '/api/rates'
];

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache aberto');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Ativação do Service Worker
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Interceptação de requisições
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Tratamento especial para APIs
  if (isApiRequest(event.request)) {
    event.respondWith(handleApiRequest(event.request));
    return;
  }
  
  // Estratégia Cache First para arquivos estáticos
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Se encontrou no cache, retornar
      if (response) {
        return response;
      }
      
      // Clonar a requisição porque ela só pode ser usada uma vez
      const fetchRequest = event.request.clone();
      
      return fetch(fetchRequest)
        .then((response) => {
          // Se a resposta não é válida ou não é um GET, apenas retornar
          if (!response || response.status !== 200 || response.type !== 'basic' || event.request.method !== 'GET') {
            return response;
          }
          
          // Clonar a resposta porque ela só pode ser usada uma vez
          const responseToCache = response.clone();
          
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          
          return response;
        })
        .catch(() => {
          // Verificar se é uma página HTML
          if (event.request.headers.get('accept').includes('text/html')) {
            // Retornar a página offline para navegação HTML
            return caches.match('/offline.html');
          }
        });
    })
  );
});

// Verificar se é uma requisição para API
function isApiRequest(request) {
  const url = new URL(request.url);
  return API_CACHE.some(apiRoute => url.pathname.includes(apiRoute));
}

// Estratégia stale-while-revalidate para API
function handleApiRequest(request) {
  // Verificar cache primeiro
  return caches.open(CACHE_NAME).then((cache) => {
    return cache.match(request).then((cachedResponse) => {
      // Clonar a requisição pois só pode ser usada uma vez
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          // Atualizar o cache com a nova resposta
          if (networkResponse && networkResponse.status === 200) {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        })
        .catch((error) => {
          console.log('Falha ao buscar dados: ', error);
          // Retornar o último cache em caso de erro
          return cachedResponse;
        });
      
      // Retornar o cache imediatamente se disponível, enquanto atualiza em segundo plano
      return cachedResponse || fetchPromise;
    });
  });
}

// Sincronização em segundo plano quando online novamente
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-pending-transactions') {
    event.waitUntil(syncPendingTransactions());
  }
});

// Função para sincronizar transações pendentes
function syncPendingTransactions() {
  return self.clients.matchAll().then((clients) => {
    clients.forEach((client) => {
      client.postMessage({
        type: 'SYNC_COMPLETED'
      });
    });
  });
}

// Push notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data.text(),
    icon: '/assets/images/icon-192x192.png',
    badge: '/assets/images/notification-badge.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Ver Cotações',
        icon: '/assets/images/prices-icon.png'
      },
      {
        action: 'close',
        title: 'Fechar',
        icon: '/assets/images/close-icon.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('FastCripto', options)
  );
});

// Manipulação de cliques nas notificações
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/cotacoes.html')
    );
  }
});