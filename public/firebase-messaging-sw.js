importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app.compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

// Inicializar Firebase no Service Worker
firebase.initializeApp({
  apiKey: "AIzaSyD6A_4rN_QY2Tog_MqQWireTJCrwfORmsY",
  authDomain: "pvai-ab7eb.firebaseapp.com",
  projectId: "pvai-ab7eb",
  storageBucket: "pvai-ab7eb.firebasestorage.app",
  messagingSenderId: "84989376406",
  appId: "1:84989376406:web:2f7d595eca8543fd1e4fb7",
});

// Obter instância de messaging
const messaging = firebase.messaging();

// Handler para notificações em background
messaging.onBackgroundMessage(function(payload) {
  console.log('Notificação recebida em background:', payload);

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/notification-icon.png',
    badge: '/badge.png',
    tag: payload.data?.appointmentId || 'default',
    data: payload.data
  };

  // Exibir notificação
  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handler para click na notificação
self.addEventListener('notificationclick', function(event) {
  console.log('Notificação clicada:', event.notification);

  event.notification.close();

  // Redirecionar para página específica
  const urlToOpen = event.notification.data?.link || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(function(clientList) {
        // Procurar por janela existente
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // Abrir nova janela se não encontrar
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});
