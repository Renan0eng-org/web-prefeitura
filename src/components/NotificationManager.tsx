'use client';

import { useEffect } from 'react';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export function NotificationManager() {
  const { isSubscribed, isLoading, error, subscribe, unsubscribe } = 
    usePushNotifications();

  // Escutar eventos customizados de notificações
  useEffect(() => {
    const handlePushNotification = (event: CustomEvent) => {
      const { title, body } = event.detail;
      
      // Aqui você pode disparar um toast, modal, etc
      console.log('Notificação recebida:', { title, body });
      
      // Exemplo com toast (se usar uma lib como sonner ou react-toastify):
      // toast.success(body, { title });
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('push-notification' as any, handlePushNotification);
      
      return () => {
        window.removeEventListener('push-notification' as any, handlePushNotification);
      };
    }
  }, []);

  return (
    <div className="p-4">
      <div className="mb-4">
        {error && (
          <div className="text-red-600 text-sm">
            Erro: {error}
          </div>
        )}
      </div>

      <button
        onClick={isSubscribed ? unsubscribe : subscribe}
        disabled={isLoading}
        className={`px-4 py-2 rounded font-medium transition ${
          isSubscribed
            ? 'bg-red-500 hover:bg-red-600 text-white'
            : 'bg-green-500 hover:bg-green-600 text-white'
        } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {isLoading ? (
          <>
            <span className="animate-spin inline-block mr-2">⏳</span>
            Carregando...
          </>
        ) : isSubscribed ? (
          '🔔 Desativar Notificações'
        ) : (
          '🔕 Ativar Notificações'
        )}
      </button>

      {isSubscribed && (
        <div className="mt-2 text-sm text-green-600">
          ✅ Notificações ativadas
        </div>
      )}
    </div>
  );
}
