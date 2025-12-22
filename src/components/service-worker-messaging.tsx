'use client';

import { useServiceWorkerMessaging } from '@/hooks/use-service-worker-messaging';

/**
 * Componente que gerencia a comunicação com Service Worker
 * Deve estar dentro de AuthProvider
 */
export function ServiceWorkerMessaging() {
  useServiceWorkerMessaging();
  return null;
}
