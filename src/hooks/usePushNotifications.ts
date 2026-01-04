import { useEffect, useState, useCallback } from 'react';
import {
  requestNotificationPermission,
  registerDeviceOnBackend,
  setupForegroundMessageListener
} from '@/lib/firebase';

interface UsePushNotificationsReturn {
  isSubscribed: boolean;
  isLoading: boolean;
  error: string | null;
  subscribe: () => Promise<void>;
  unsubscribe: () => Promise<void>;
}

export function usePushNotifications(): UsePushNotificationsReturn {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Verificar se já está inscrito
  useEffect(() => {
    const checkSubscription = () => {
      const subscriptionId = localStorage.getItem('push_subscription_id');
      setIsSubscribed(!!subscriptionId);
    };

    checkSubscription();
  }, []);

  // Inscrever em notificações
  const subscribe = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Registrar Service Worker
      if ('serviceWorker' in navigator) {
        await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        console.log('✅ Service Worker registrado');
      }

      // Solicitar permissão
      const token = await requestNotificationPermission();

      if (token) {
        // Obter token de autenticação
        const authToken = localStorage.getItem('authToken');

        if (!authToken) {
          setError('Você precisa estar autenticado');
          return;
        }

        // Registrar no backend
        const registered = await registerDeviceOnBackend(token, authToken);

        if (registered) {
          setIsSubscribed(true);
          await setupForegroundMessageListener();
        } else {
          setError('Falha ao registrar dispositivo');
        }
      } else {
        setError('Falha ao obter token de notificação');
      }
    } catch (err) {
      console.error('Erro ao inscrever:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Desinscrever
  const unsubscribe = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const subscriptionId = localStorage.getItem('push_subscription_id');
      const authToken = localStorage.getItem('authToken');

      if (!subscriptionId || !authToken) {
        setError('Nenhuma inscrição encontrada');
        return;
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/push/subscribe`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (response.ok) {
        localStorage.removeItem('push_subscription_id');
        setIsSubscribed(false);
        console.log('✅ Inscrição removida');
      } else {
        setError('Falha ao remover inscrição');
      }
    } catch (err) {
      console.error('Erro ao desinscrever:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { isSubscribed, isLoading, error, subscribe, unsubscribe };
}
