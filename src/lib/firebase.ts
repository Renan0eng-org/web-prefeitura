import { initializeApp } from 'firebase/app';
import type { Messaging } from 'firebase/messaging';
import { getMessaging, getToken, isSupported, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar Cloud Messaging apenas no browser
let messaging: Messaging | null = null;

export const getMessagingInstance = async (): Promise<Messaging | null> => {
  // Verificar se está no browser e se está suportado
  if (typeof window !== 'undefined' && await isSupported()) {
    if (!messaging) {
      messaging = getMessaging(app);
    }
    return messaging;
  }
  return null;
};

// Solicitar permissão e obter token
export const requestNotificationPermission = async (): Promise<string | null> => {
  try {
    const permission = await Notification.requestPermission();

    if (permission === 'granted') {
      console.log('✅ Permissão de notificação concedida');

      const messagingInstance = await getMessagingInstance();
      if (!messagingInstance) {
        console.error('Firebase Messaging não suportado neste navegador');
        return null;
      }

      const token = await getToken(messagingInstance, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
      });

      if (token) {
        console.log('📱 Token do dispositivo:', token);
        return token;
      } else {
        console.error('Falha ao obter token');
        return null;
      }
    } else {
      console.log('❌ Permissão de notificação negada');
      return null;
    }
  } catch (error) {
    console.error('Erro ao solicitar permissão:', error);
    return null;
  }
};

// Registrar dispositivo no backend
export const registerDeviceOnBackend = async (
  deviceToken: string,
  authToken: string
): Promise<boolean> => {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    
    const response = await fetch(`${apiUrl}/push/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        deviceToken,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : ''
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Dispositivo registrado:', data);
      localStorage.setItem('push_subscription_id', data.id);
      return true;
    } else {
      const error = await response.json();
      console.error('❌ Erro ao registrar dispositivo:', error);
      return false;
    }
  } catch (error) {
    console.error('❌ Erro ao registrar dispositivo:', error);
    return false;
  }
};

// Setup do listener para notificações em foreground
export const setupForegroundMessageListener = async () => {
  const messagingInstance = await getMessagingInstance();
  if (!messagingInstance) return;

  onMessage(messagingInstance, (payload) => {
    console.log('📬 Notificação recebida em foreground:', payload);

    // Exibir notificação nativa mesmo em foreground
    if (Notification.permission === 'granted') {
      new Notification(payload.notification?.title || 'Notificação', {
        body: payload.notification?.body,
        icon: '/notification-icon.png',
        tag: payload.data?.appointmentId || 'default',
        data: payload.data
      });
    }

    // Disparar evento customizado para componentes React
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('push-notification', {
          detail: {
            title: payload.notification?.title,
            body: payload.notification?.body,
            data: payload.data
          }
        })
      );
    }
  });
};

export default app;
