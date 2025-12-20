'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then(reg => {
          console.log('✅ Service Worker registrado:', reg);
          console.log('📍 Scope:', reg.scope);
          console.log('📦 State:', reg.installing ? 'installing' : reg.waiting ? 'waiting' : reg.active ? 'active' : 'unknown');
        })
        .catch(err => {
          console.error('❌ Erro ao registrar Service Worker:', err);
        });

      // Log estado atual
      navigator.serviceWorker.ready.then(reg => {
        console.log('✅ Service Worker ready:', reg);
      });
    } else {
      console.warn('⚠️ Service Workers não suportados neste navegador');
    }
  }, []);

  return null;
}
