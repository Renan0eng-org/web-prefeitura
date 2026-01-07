const CACHE_NAME = 'my-app-cache-v0.11';
const OFFLINE_URL = '/offline.html';
let cachedToken = null;
let API_URL = 'http://localhost:4000';
const FALLBACK_ICON = '/android/android-launchericon-96-96.png';
const FALLBACK_BADGE = '/android/android-launchericon-48-48.png';

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

async function broadcastMessage(payload) {
  try {
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    clients.forEach((client) => client.postMessage(payload));
  } catch (e) {
    originalConsole.error('Failed to broadcast message', e);
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

// Push notifications handler
self.addEventListener('push', (event) => {
  event.waitUntil(handlePush(event));
});

async function handlePush(event) {
  try {
    const raw = event.data?.text() || '';
    let payload = {};

    if (raw) {
      try {
        payload = JSON.parse(raw);
      } catch (_) {
        payload = { title: raw };
      }
    }

    const title = payload.title || 'Nova notificação';
    const body = payload.body || '';
    const clickUrl = payload.clickUrl || payload.data?.url || payload.url;

    const options = {
      body,
      icon: payload.icon || FALLBACK_ICON,
      badge: payload.badge || FALLBACK_BADGE,
      data: { ...(payload.data || {}), clickUrl },
      tag: payload.tag,
      requireInteraction: payload.requireInteraction || false,
      actions: payload.actions,
    };

    await self.registration.showNotification(title, options);
    await broadcastLog('log', '[SW] 🔔 Notificação exibida a partir do push');
    await broadcastMessage({ type: 'PUSH_RECEIVED', payload });
  } catch (err) {
    await broadcastLog('error', '[SW] Falha ao processar push', err);
  }
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.clickUrl || '/';

  event.waitUntil(openWindowOrFocus(targetUrl));
});

async function openWindowOrFocus(url) {
  try {
    const clientList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of clientList) {
      const sameOrigin = url && client.url && client.url.startsWith(self.location.origin);
      if (sameOrigin) {
        await client.focus();
        if ('navigate' in client && url) {
          return client.navigate(url);
        }
        return;
      }
    }

    if (url) {
      await self.clients.openWindow(url);
    }
  } catch (err) {
    await broadcastLog('error', '[SW] Erro ao abrir/focar janela', err);
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
