'use client';

import { useAuth } from '@/hooks/use-auth';
import { useEffect, useRef } from 'react';

/**
 * Hook para manter comunicação com Service Worker
 * Compartilha token e IDs de notificações vistas
 */
export function useServiceWorkerMessaging() {
  const { user, accessToken } = useAuth();
  const seenNotificationIdsRef = useRef<Set<string>>(new Set());
  const sharedTokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const handleSWMessage = async (event: any) => {
      const { data } = event || {};
      if (!data || !data.type) return;

      const reply = (payload: any) => {
        // MessageChannel first, fallback to source.postMessage
        if (event?.ports?.[0]) {
          event.ports[0].postMessage(payload);
          return;
        }
        if (event?.source?.postMessage) {
          event.source.postMessage(payload);
          return;
        }
        console.warn('⚠️ Não foi possível responder ao SW (sem porta/source)');
      };

      if (data.type === 'GET_TOKEN') {
        console.log('💬 SW pediu token');
        
        reply({
          type: 'GET_TOKEN_RESPONSE',
          token: sharedTokenRef.current || null,
        });
      }

      if (data.type === 'GET_SEEN_IDS') {
        console.log('💬 SW pediu IDs vistos');
        reply({
          type: 'GET_SEEN_IDS_RESPONSE',
          ids: Array.from(seenNotificationIdsRef.current),
        });
      }

      if (data.type === 'SAVE_SEEN_IDS') {
        console.log('💬 SW enviou IDs para salvar:', data.ids);
        // Salva IDs vistos no frontend
        seenNotificationIdsRef.current = new Set(data.ids);
        // Opcionalmente salva no localStorage também
        localStorage.setItem('seenNotificationIds', JSON.stringify(data.ids));
      }
    };

    // Listener para mensagens do Service Worker
    navigator.serviceWorker.addEventListener('message', handleSWMessage);

    // Log ACK do SW quando receber confirmação
    const ackHandler = (event: any) => {
      if (event?.data?.type === 'USER_AUTHENTICATED_ACK') {
        console.log('✅ SW confirmou recebimento do token');
      }
    };
    navigator.serviceWorker.addEventListener('message', ackHandler);

    // Se o usuário se autenticou, notifica o SW
    if (user && accessToken) {
      console.log('✅ Usuário autenticado, notificando SW...');
      sharedTokenRef.current = accessToken;
      
      // Obtém API URL - tenta env var primeiro, depois parse manual
      let apiUrl = typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL 
        ? process.env.NEXT_PUBLIC_API_URL 
        : 'http://localhost:4000';
      
      console.log('🌐 API URL enviada para SW:', apiUrl);
      
      navigator.serviceWorker.ready.then((reg) => {
        if (reg.active) {
          reg.active.postMessage({
            type: 'USER_AUTHENTICATED',
            token: accessToken,
            userId: user.idUser,
            apiUrl: apiUrl,
          });
          console.log('📤 Mensagem USER_AUTHENTICATED enviada:', { apiUrl, token: '***' });
        }
      });
    } else {
      sharedTokenRef.current = null;
    }

    // Recupera IDs salvos
    const saved = localStorage.getItem('seenNotificationIds');
    if (saved) {
      seenNotificationIdsRef.current = new Set(JSON.parse(saved));
    }

    return () => {
      navigator.serviceWorker.removeEventListener('message', handleSWMessage);
      navigator.serviceWorker.removeEventListener('message', ackHandler);
    };
  }, [user, accessToken]);

  const addSeenNotificationId = (id: string) => {
    seenNotificationIdsRef.current.add(id);
  };

  // Persistir token para fallback do SW
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (accessToken) {
      localStorage.setItem('accessToken', accessToken);
      sharedTokenRef.current = accessToken;
    } else {
      localStorage.removeItem('accessToken');
      sharedTokenRef.current = null;
    }
  }, [accessToken]);

  return { addSeenNotificationId };
}
