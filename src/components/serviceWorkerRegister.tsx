'use client';

import { useServiceWorkerMessaging } from '@/hooks/use-service-worker-messaging';
import { useEffect } from 'react';

export function ServiceWorkerRegister() {
  // Mantém a comunicação SW <-> app (token, IDs vistos)
  useServiceWorkerMessaging();

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then(reg => {
          console.log('✅ Service Worker registrado:', reg);
          console.log('📍 Scope:', reg.scope);
          console.log('📦 State:', reg.installing ? 'installing' : reg.waiting ? 'waiting' : reg.active ? 'active' : 'unknown');
          
          // Força atualização se houver SW esperando
          if (reg.waiting) {
            console.log('🔄 Há um SW esperando, ativando nova versão...');
            reg.waiting.postMessage({ type: 'SKIP_WAITING' });
            window.location.reload();
          }

          // Verifica atualizações a cada 30 segundos
          setInterval(() => {
            reg.update().then(() => {
              if (reg.waiting) {
                console.log('🔄 Nova versão do SW detectada, ativando...');
                reg.waiting.postMessage({ type: 'SKIP_WAITING' });
                window.location.reload();
              }
            });
          }, 30000);
        })
        .catch(err => {
          console.error('❌ Erro ao registrar Service Worker:', err);
        });

      // Log estado atual
      navigator.serviceWorker.ready.then(reg => {
        console.log('✅ Service Worker ready:', reg);
      });

      // Listener para quando novo SW tomar controle
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('🔄 Novo Service Worker ativado!');
      });
    } else {
      console.warn('⚠️ Service Workers não suportados neste navegador');
    }
  }, []);

  return null;
}
