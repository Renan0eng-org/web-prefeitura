const CACHE_NAME = 'my-app-cache-v0.11'; // Incrementado para forçar atualização
const OFFLINE_URL = '/offline.html';
const CHECK_NOTIFICATIONS_INTERVAL = 5 * 60 * 1000; // 5 minutos
const LAST_CHECK_KEY = 'lastNotificationCheck';
const SEEN_NOTIFICATIONS_KEY = 'seenNotifications';
let cachedToken = null;
// let API_URL = 'http://localhost:4000'; // Padrão hardcoded, será atualizado pelo cliente
let API_URL = 'https://prefeitura.back.renannardi.com'; // Padrão hardcoded, será atualizado pelo cliente

// Variáveis globais do SW
let notificationCheckInterval = null;
let isCheckingNotifications = false;
let nextCheckAt = null;

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

async function broadcastNextCheck(timestamp) {
  nextCheckAt = timestamp;
  const clients = await self.clients.matchAll();
  clients.forEach((client) => {
    client.postMessage({ type: 'NEXT_CHECK', nextAt: nextCheckAt });
  });
}

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
      console.log('[SW] 🔔 Iniciando sistema de notificações em background...');
      // Inicia verificação periódica ao ativar
      startPeriodicNotificationCheck();
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

  if (data.type === 'GET_NEXT_CHECK') {
    if (nextCheckAt) {
      event.source?.postMessage({ type: 'NEXT_CHECK', nextAt: nextCheckAt });
    }
    return;
  }

  if (data.type === 'CHECK_NOTIFICATIONS_NOW') {
    console.log('[SW] 📥 Pedido de verificação imediata recebido');
    event.waitUntil(checkForNewNotifications());
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


// ========== NOTIFICAÇÕES PERIÓDICAS ==========

/**
 * Inicia verificação periódica de notificações
 * Busca a cada 5 minutos se há notificações não lidas
 */
function startPeriodicNotificationCheck() {
  console.log('[SW] 🔄 Iniciando verificação periódica (a cada ' + (CHECK_NOTIFICATIONS_INTERVAL / 60000) + ' min)');
  
  // Primeira verificação imediata após 5 segundos
  setTimeout(() => {
    console.log('[SW] ⏰ Primeira verificação automática...');
    checkForNewNotifications();
  }, 5000);
  
  // Para intervalo anterior se existir
  if (notificationCheckInterval) {
    clearInterval(notificationCheckInterval);
  }
  
  // Configura intervalo periódico
  notificationCheckInterval = setInterval(() => {
    console.log('[SW] ⏰ Verificação periódica automática disparada');
    checkForNewNotifications();
  }, CHECK_NOTIFICATIONS_INTERVAL);

  // Agenda e comunica próximo horário
  broadcastNextCheck(Date.now() + CHECK_NOTIFICATIONS_INTERVAL);

  console.log('[SW] ✅ Verificação periódica configurada com sucesso');
}

/**
 * Para a verificação periódica
 */
function stopPeriodicNotificationCheck() {
  if (notificationCheckInterval) {
    clearInterval(notificationCheckInterval);
    notificationCheckInterval = null;
    console.log('[SW] Verificação periódica parada');
  }
}

/**
 * Busca notificações não lidas do backend
 * Se houver novas, exibe notificação ao usuário
 */
async function checkForNewNotifications() {
  if (isCheckingNotifications) {
    console.log('[SW] ⏭️ Verificação já em andamento, pulando...');
    return;
  }
  
  isCheckingNotifications = true;
  console.log('[SW] 🔍 ========== VERIFICANDO NOTIFICAÇÕES ==========');
  console.log('[SW] 🕐 Timestamp:', new Date().toLocaleString());
  
  try {
    // Busca token do localStorage (salvo pelo frontend)
    const token = cachedToken || await getStoredToken();
    if (!token) {
      console.log('[SW] ⚠️ Sem token armazenado, usuário não autenticado');
      isCheckingNotifications = false;
      return;
    }
    
    console.log('[SW] ✅ Token obtido com sucesso');
    console.log('[SW] 🌐 URL da API:', API_URL);
    
    // Faz requisição ao backend buscando apenas notificações UNREAD
    // A API já filtra e retorna apenas não lidas com status=UNREAD
    const url = `${API_URL}/notifications?status=UNREAD&limit=20`;
    console.log('[SW] 📡 GET:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
    
    if (!response.ok) {
      console.warn('[SW] ❌ Erro HTTP:', response.status, response.statusText);
      isCheckingNotifications = false;
      return;
    }
    
    const data = await response.json();
    const notifications = data.items || [];
    
    console.log('[SW] 📬 Encontradas', notifications.length, 'notificações não lidas (UNREAD)');
    
    if (notifications.length === 0) {
      console.log('[SW] ✅ Nenhuma notificação nova');
      isCheckingNotifications = false;
      return;
    }
    
    // Lista títulos das notificações encontradas
    notifications.forEach((notif, index) => {
      console.log(`[SW] 📌 ${index + 1}. ${notif.title} (ID: ${notif.id.substring(0, 8)}...)`);
    });
    
    // Busca IDs já vistos (usado só para registrar persistência e evitar warnings)
    const seenIds = await getSeenNotificationIds();
    console.log('[SW] 👁️ IDs já exibidos nesta sessão:', seenIds.length);

    // Exibiremos todas as não lidas (API já retorna somente UNREAD)
    const newNotifications = notifications;
    console.log('[SW] 🆕 Novas para exibir:', newNotifications.length);
    
    // Notifica clientes sobre notificações encontradas
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'NOTIFICATIONS_FOUND',
        total: notifications.length,
        new: newNotifications.length,
        notifications: newNotifications.map(n => ({ id: n.id, title: n.title, body: n.body, category: n.category }))
      });
    });
    
    // Exibe cada notificação nova
    if (newNotifications.length > 0) {
      console.log('[SW] 🔔 Iniciando exibição de', newNotifications.length, 'notificações...');
      for (const notif of newNotifications) {
        console.log('[SW] 📨 Processando:', notif.title);
        await showBackgroundNotification(notif);
        seenIds.push(notif.id);
        // Pequeno delay entre notificações para não sobrecarregar
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Salva IDs vistos
      const uniqueIds = Array.from(new Set(seenIds));
      await saveSeenNotificationIds(uniqueIds);
      console.log('[SW] 💾 IDs salvos com sucesso');
    } else {
      console.log('[SW] ℹ️ Todas as notificações já foram exibidas anteriormente');
    }
    console.log('[SW] ✅ ========== VERIFICAÇÃO CONCLUÍDA ==========');
  } catch (err) {
    console.error('[SW] ❌ Erro ao verificar notificações:', err);
    console.error('[SW] ❌ Stack:', err.stack);
  } finally {
    isCheckingNotifications = false;
    // Sempre agenda próximo horário após uma verificação
    broadcastNextCheck(Date.now() + CHECK_NOTIFICATIONS_INTERVAL);
  }
}

/**
 * Exibe uma notificação no background
 */
async function showBackgroundNotification(notif) {
  try {
    console.log('[SW] 🔔 Preparando notificação:', notif.title);
    console.log('[SW] 📝 Corpo:', notif.body);
    console.log('[SW] 🏷️ Categoria:', notif.category || 'geral');
    console.log('[SW] ⚡ Prioridade:', notif.priority || 0);

    // Se o navegador não concedeu permissão, não tentar exibir para evitar erro
    if (typeof Notification !== 'undefined' && Notification.permission !== 'granted') {
      console.warn('[SW] ⚠️ Permissão de notificação não concedida, pulando exibição');
      const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      clients.forEach((client) => {
        client.postMessage({
          type: 'SW_LOG',
          level: 'warn',
          message: 'Permissão de notificação não concedida; abra o app e aceite para continuar',
        });
        client.postMessage({ type: 'REQUEST_PERMISSION' });
      });
      return;
    }

    const options = {
      body: notif.body || 'Você tem uma nova notificação',
      icon: '/android/android-launchericon-96-96.png',
      badge: '/android/android-launchericon-48-48.png',
      data: notif.data || { url: '/admin/notifications', notificationId: notif.id },
      tag: `notif-${notif.id}`,
      requireInteraction: (notif.priority && notif.priority > 0) || false,
      vibrate: [200, 100, 200],
      silent: false,
      timestamp: notif.createdAt ? new Date(notif.createdAt).getTime() : Date.now(),
    };
    
    console.log('[SW] 📢 Chamando showNotification...');
    
    await self.registration.showNotification(notif.title, options);
    
    console.log('[SW] ✅ Notificação exibida com sucesso!');
    
    // Marca a notificação como lida no backend
    await markNotificationAsRead(notif.id);
    
    // Notifica clientes que a notificação foi exibida
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'NOTIFICATION_SHOWN',
        id: notif.id,
        title: notif.title,
        body: notif.body,
        category: notif.category
      });
    });
    
  } catch (err) {
    console.error('[SW] ❌ ERRO ao exibir notificação:', err);
    console.error('[SW] ❌ Nome do erro:', err.name);
    console.error('[SW] ❌ Mensagem:', err.message);
    console.error('[SW] ❌ Stack:', err.stack);
  }
}

/**
 * Marca uma notificação como lida no backend
 */
async function markNotificationAsRead(notificationId) {
  try {
    console.log('[SW] 📝 Marcando notificação como lida:', notificationId);
    
    const token = cachedToken || await getStoredToken();
    if (!token) {
      console.warn('[SW] ⚠️ Sem token para marcar como lida');
      return;
    }

    const url = `${API_URL}/notifications/${notificationId}/read`;
    console.log('[SW] 📡 PATCH:', url);

    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ read: true }),
      credentials: 'include',
    });

    if (response.ok) {
      console.log('[SW] ✅ Notificação marcada como lida:', notificationId);
    } else {
      console.warn('[SW] ⚠️ Erro ao marcar como lida:', response.status, response.statusText);
    }
  } catch (err) {
    console.error('[SW] ❌ Erro ao marcar notificação como lida:', err);
  }
}

/**
 * Busca token armazenado (será salvo pelo frontend)
 */
async function getStoredToken() {
  // 1. Verifica cache em memória
  if (cachedToken) {
    console.log('[SW] 🔐 Token encontrado em cache de memória');
    return cachedToken;
  }

  try {
    // 2. Tenta solicitar do cliente via MessageChannel
    console.log('[SW] 📡 Solicitando token do cliente...');
    const clients = await self.clients.matchAll();
    
    if (clients.length === 0) {
      console.log('[SW] ⚠️ Nenhum cliente ativo para solicitar token');
    }

    for (const client of clients) {
      const token = await new Promise((resolve) => {
        const channel = new MessageChannel();
        let responded = false;

        const timeoutId = setTimeout(() => {
          if (!responded) {
            console.log('[SW] ⏱️ Timeout esperando resposta do cliente');
            channel.port1.onmessage = null;
            resolve(null);
          }
        }, 5000); // Aumentado para 5 segundos

        channel.port1.onmessage = (event) => {
          if (event.data && event.data.type === 'GET_TOKEN_RESPONSE') {
            responded = true;
            clearTimeout(timeoutId);
            const token = event.data.token;
            console.log('[SW] ✅ Token recebido do cliente:', token ? '(token presente)' : '(sem token)');
            resolve(token || null);
          }
        };

        console.log('[SW] 📤 Enviando GET_TOKEN para cliente');
        client.postMessage({ type: 'GET_TOKEN' }, [channel.port2]);
      });

      if (token) {
        // cachedToken = token;
        console.log('[SW] 💾 Token armazenado em cache');
        return token;
      }
    }
  } catch (err) {
    console.error('[SW] ❌ Erro ao buscar token:', err);
  }

  console.log('[SW] ℹ️ Nenhum token obtido');
  return null;
}

/**
 * Busca IDs de notificações já vistas
 */
async function getSeenNotificationIds() {
  try {
    // Tenta buscar de clientes ativos via MessageChannel
    const clients = await self.clients.matchAll();
    for (const client of clients) {
      const ids = await new Promise((resolve) => {
        const channel = new MessageChannel();

        const timeoutId = setTimeout(() => {
          channel.port1.onmessage = null;
          resolve([]);
        }, 2000);

        channel.port1.onmessage = (event) => {
          if (event.data && event.data.type === 'GET_SEEN_IDS_RESPONSE') {
            clearTimeout(timeoutId);
            resolve(event.data.ids || []);
          }
        };

        client.postMessage({ type: 'GET_SEEN_IDS' }, [channel.port2]);
      });

      if (ids.length > 0) return ids;
    }
  } catch (err) {
    console.log('[SW] Info: Sem cache de IDs vistos');
  }
  return [];
}

/**
 * Salva IDs de notificações já vistas
 */
async function saveSeenNotificationIds(ids) {
  try {
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SAVE_SEEN_IDS',
        ids: ids.slice(-50) // Mantém apenas os últimos 50
      });
    });
  } catch (err) {
    console.log('[SW] Info: Não foi possível salvar IDs vistos');
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
