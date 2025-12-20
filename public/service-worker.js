const CACHE_NAME = 'my-app-cache-v2';
const OFFLINE_URL = '/offline.html';

// INSTALAÇÃO (sem cache inicial)
self.addEventListener('install', (event) => {
  self.skipWaiting(); // opcional: ativa imediatamente
});

// ATIVAÇÃO: limpeza de caches antigos
// self.addEventListener('activate', (event) => {
//   event.waitUntil(
//     caches.keys().then((keyList) =>
//       Promise.all(
//         keyList.map((key) => {
//           if (key !== CACHE_NAME) {
//             return caches.delete(key);
//           }
//         })
//       )
//     )
//   );
//   return self.clients.claim();
// });

// Push notifications handler
self.addEventListener('push', (event) => {
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
    actions: payload.actions || []
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Handle notification click to open/focus app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const data = event.notification && event.notification.data ? event.notification.data : {};
  const targetUrl = (data && (data.url || data.path)) ? (self.location.origin + (data.url || data.path)) : self.location.origin;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Try to focus an open tab with the same URL
      for (const client of clientList) {
        if ('url' in client && client.url && targetUrl && client.url === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});


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
