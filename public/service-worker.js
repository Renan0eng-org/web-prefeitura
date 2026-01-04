const CACHE_NAME = 'my-app-cache-v0.11'; // Incrementado para forçar atualização
const OFFLINE_URL = '/offline.html';
let cachedToken = null;
let API_URL = 'https://prefeitura.back.renannardi.com'; // Padrão hardcoded, será atualizado pelo cliente

// Importar Firebase Messaging
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app.compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

// Logging helper: replica nos clientes e mantém console original
const originalConsole = {
  log: console.log.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console),
};

function formatArg(arg) {
  if (arg instanceof Error) return `${arg.name}: ${arg.message}`;
  if (typeof arg === 'object') {
    try {
      return JSON.stringify(arg);
    } catch (_) {
      return String(arg);
    }
  }
  return String(arg);
}

async function broadcastLog(level, ...args) {
  // Mantém log no console do SW
  originalConsole[level]?.(...args);
  const message = args.map(formatArg).join(' ');

  try {
    // includeUncontrolled garante entrega mesmo antes do claim em novas abas
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });

    if (clients.length === 0) return;

    clients.forEach((client) => {
      client.postMessage({ type: 'SW_LOG', level, message });
    });
  } catch (e) {
    originalConsole.error('Failed to broadcast log', e);
  }
}

console.log = (...args) => broadcastLog('log', ...args);
console.warn = (...args) => broadcastLog('warn', ...args);
console.error = (...args) => broadcastLog('error', ...args);

// INSTALAÇÃO (sem cache inicial)
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  self.skipWaiting(); // Ativa imediatamente
});

// ATIVAÇÃO: limpeza de caches antigos e claim clients
self.addEventListener('activate', (event) => {
  console.log('[SW] 🔄 Activating...');
  event.waitUntil(
    caches.keys().then((keyList) =>
      Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] 🗑️ Deleting old cache:', key);
            return caches.delete(key);
          }
        })
      )
    ).then(() => {
      console.log('[SW] 👥 Claiming clients...');
      return self.clients.claim();
    }).then(() => {
      console.log('[SW] 🚀 Service Worker ativo e pronto!');
      console.log('[SW] 🌐 API_URL configurada:', API_URL);
      console.log('[SW] 🔔 Firebase Messaging inicializado!');
      initializeFirebase();
    })
  );
});

// Push notifications handler
self.addEventListener('push', (event) => {
  console.log('[SW] Push received:', event);
  let payload = {};
  try {
    if (event.data) {
      const text = event.data.text();
      try {
        payload = JSON.parse(text);
      } catch (_) {
        payload = { title: 'Notificação', body: text };
      }
    }
  } catch (_) {}

  const title = payload.title || 'Notificação';
  const options = {
    body: payload.body || '',
    icon: payload.icon || '/android/android-launchericon-96-96.png',
    badge: payload.badge || '/android/android-launchericon-48-48.png',
    data: payload.data || {},
    tag: payload.tag,
    requireInteraction: payload.requireInteraction || false,
  };

  console.log('[SW] Showing notification:', title, options);
  event.waitUntil(self.registration.showNotification(title, options));
});

// Handle notification click to open/focus app
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.notification);
  event.notification.close();
  const data = event.notification && event.notification.data ? event.notification.data : {};
  const targetUrl = (data && (data.url || data.path)) ? (self.location.origin + (data.url || data.path)) : self.location.origin;

  console.log('[SW] Opening URL:', targetUrl);
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Try to focus an open tab with the same URL
      for (const client of clientList) {
        if ('url' in client && client.url && targetUrl && client.url === targetUrl && 'focus' in client) {
          console.log('[SW] Focusing existing window');
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        console.log('[SW] Opening new window');
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// Mensagens vindas do client
self.addEventListener('message', (event) => {
  const { data } = event;
  if (!data || !data.type) return;

  if (data.type === 'SKIP_WAITING') {
    console.log('[SW] 🔄 SKIP_WAITING recebido, ativando nova versão...');
    self.skipWaiting();
    return;
  }

  if (data.type === 'USER_AUTHENTICATED') {
    console.log('[SW] 🔑 Token recebido do app');
    cachedToken = data.token || null;
    console.log('[SW] Token armazenado:', cachedToken ? '✅ Presente' : '❌ Ausente');
    
    if (data.apiUrl) {
      API_URL = data.apiUrl;
      console.log('[SW] 🌐 API_URL atualizada para:', API_URL);
    } else {
      console.warn('[SW] ⚠️ apiUrl não recebida, usando padrão:', API_URL);
    }

    // Confirma recebimento ao cliente para depuração
    if (event.source) {
      event.source.postMessage({ 
        type: 'USER_AUTHENTICATED_ACK',
        apiUrl: API_URL,
        tokenReceived: !!cachedToken
      });
    }
  }
});

// ========== FIREBASE MESSAGING ==========

/**
 * Inicializa Firebase Messaging no Service Worker
 */
function initializeFirebase() {
  try {
    const firebaseConfig = {
      apiKey: "AIzaSyD6A_4rN_QY2Tog_MqQWireTJCrwfORmsY",
      authDomain: "pvai-ab7eb.firebaseapp.com",
      projectId: "pvai-ab7eb",
      storageBucket: "pvai-ab7eb.firebasestorage.app",
      messagingSenderId: "84989376406",
      appId: "1:84989376406:web:2f7d595eca8543fd1e4fb7"
    };

    // Inicializar Firebase
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
      console.log('[SW] ✅ Firebase inicializado com sucesso');
    }

    // Obter instância de messaging
    const messaging = firebase.messaging();
    console.log('[SW] 📬 Firebase Messaging ativado');

    // Handler para notificações em background
    messaging.onBackgroundMessage((payload) => {
      console.log('[SW] 🔔 Notificação Firebase em background:', payload);

      const notificationTitle = payload.notification?.title || 'Notificação';
      const notificationOptions = {
        body: payload.notification?.body || '',
        icon: payload.notification?.image || '/android/android-launchericon-96-96.png',
        badge: '/android/android-launchericon-48-48.png',
        tag: payload.data?.appointmentId || 'default',
        data: payload.data || {},
        requireInteraction: false,
      };

      console.log('[SW] 📢 Exibindo notificação:', notificationTitle);
      return self.registration.showNotification(notificationTitle, notificationOptions);
    });

    console.log('[SW] ✅ Handlers do Firebase configurados');
  } catch (error) {
    console.error('[SW] ❌ Erro ao inicializar Firebase:', error);
  }
}



// FETCH: Cacheia ao navegar, usa cache se offline
// self.addEventListener('fetch', (event) => {
//   // if (event.request.method !== 'GET') return;

//   event.respondWith(
//     fetch(event.request)
//       .then((response) => {
//         // Armazena em cache se for HTML
//         if (event.request.headers.get('accept')?.includes('text/html')) {
//           const responseClone = response.clone();
//           caches.open(CACHE_NAME).then((cache) => {
//             cache.put(event.request, responseClone);
//           });
//         }
//         return response;
//       })
//       .catch(() => {
//         // Tenta servir do cache se offline
//         return caches.match(event.request).then((cachedResponse) => {
//           if (cachedResponse) return cachedResponse;

//           // Se navegação e sem cache, mostra offline.html
//           if (event.request.mode === 'navigate') {
//             return caches.match(OFFLINE_URL);
//           }
//         });
//       })
//   );
// });
