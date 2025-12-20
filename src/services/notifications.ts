/*
  Notification utilities for requesting permission, showing local notifications,
  and (optionally) managing Web Push subscriptions. Use these from client code.
*/

export type NotificationPayload = {
  title: string;
  body?: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  requireInteraction?: boolean;
};

function isNotificationSupported() {
  return typeof window !== 'undefined' && 'Notification' in window;
}

function isServiceWorkerSupported() {
  return typeof navigator !== 'undefined' && 'serviceWorker' in navigator;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) return 'denied';
  if (Notification.permission === 'granted') return 'granted';
  return await Notification.requestPermission();
}

export async function showLocalNotification(payload: NotificationPayload): Promise<void> {
  console.log('🔔 showLocalNotification called:', payload);
  
  if (!isNotificationSupported()) {
    console.warn('⚠️ Notifications não suportadas');
    return;
  }

  const permission = await requestNotificationPermission();
  console.log('🔐 Permission status:', permission);
  if (permission !== 'granted') {
    console.warn('⚠️ Permission denied');
    return;
  }

  // Prefer showing via the Service Worker so notifications work in background
  if (isServiceWorkerSupported()) {
    try {
      console.log('⏳ Aguardando Service Worker ready...');
      const reg = await navigator.serviceWorker.ready;
      console.log('✅ Service Worker ready:', reg);
      
      const options: any = {
        body: payload.body,
        icon: payload.icon || '/android/android-launchericon-96-96.png',
        badge: payload.badge || '/android/android-launchericon-48-48.png',
        data: payload.data,
        tag: payload.tag,
        requireInteraction: payload.requireInteraction,
      };
      
      console.log('📤 Showing notification via SW:', payload.title, options);
      await reg.showNotification(payload.title, options);
      console.log('✅ Notification showed successfully!');
      return;
    } catch (err) {
      console.error('❌ Erro ao mostrar notificação via SW:', err);
      // fall through to page notification
    }
  }

  // Fallback: show a page-level notification (only works while tab is open)
  try {
    console.log('📤 Showing page-level notification (fallback)');
    new Notification(payload.title, {
      body: payload.body,
      icon: payload.icon || '/android/android-launchericon-96-96.png',
      badge: payload.badge || '/android/android-launchericon-48-48.png',
      data: payload.data,
      tag: payload.tag,
      requireInteraction: payload.requireInteraction,
    });
    console.log('✅ Page notification showed!');
  } catch (err) {
    console.error('❌ Erro ao mostrar notificação de página:', err);
  }
}

// Optional: Web Push subscription management (requires backend to store subscriptions)
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function getPushSubscription(): Promise<PushSubscription | null> {
  if (!isServiceWorkerSupported()) return null;
  const reg = await navigator.serviceWorker.ready;
  return await reg.pushManager.getSubscription();
}

export async function subscribePush(vapidPublicKey: string): Promise<PushSubscription | null> {
  if (!isServiceWorkerSupported()) return null;
  const permission = await requestNotificationPermission();
  if (permission !== 'granted') return null;

  const reg = await navigator.serviceWorker.ready;
  const existing = await reg.pushManager.getSubscription();
  if (existing) return existing;

  try {
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });
    return sub;
  } catch (err) {
    console.error('Failed to subscribe to push', err);
    return null;
  }
}

/**
 * Auto-subscribe user to push notifications after login.
 * Sends the subscription to the backend.
 */
export async function autoSubscribePush(apiClient: any): Promise<boolean> {
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapidPublicKey) {
    console.warn('VAPID public key not configured');
    return false;
  }

  try {
    const subscription = await subscribePush(vapidPublicKey);
    if (!subscription) return false;

    // Convert keys to base64
    const p256dh = arrayBufferToBase64(subscription.getKey('p256dh'));
    const auth = arrayBufferToBase64(subscription.getKey('auth'));

    // Send to backend
    await apiClient.post('/push/subscribe', {
      endpoint: subscription.endpoint,
      keys: { p256dh, auth },
      userAgent: navigator.userAgent,
    });

    return true;
  } catch (err) {
    console.error('Failed to auto-subscribe push:', err);
    return false;
  }
}

function arrayBufferToBase64(buffer: ArrayBuffer | null): string {
  if (!buffer) return '';
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export async function unsubscribePush(): Promise<boolean> {
  try {
    const sub = await getPushSubscription();
    if (!sub) return true;
    const ok = await sub.unsubscribe();
    return ok;
  } catch (_) {
    return false;
  }
}
