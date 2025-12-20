/**
 * Script de teste de notificações - Cole este código no Console do navegador (F12)
 * para diagnosticar problemas com notificações
 */

console.log('%c🔔 DIAGNÓSTICO DE NOTIFICAÇÕES', 'font-size: 20px; font-weight: bold; color: #4CAF50;');
console.log('');

async function diagnosticarNotificacoes() {
  console.log('%c1️⃣ Verificando suporte...', 'font-weight: bold; color: #2196F3;');
  
  const suporteNotifications = 'Notification' in window;
  const suporteSW = 'serviceWorker' in navigator;
  
  console.log(`   Notifications API: ${suporteNotifications ? '✅' : '❌'}`);
  console.log(`   Service Worker: ${suporteSW ? '✅' : '❌'}`);
  
  if (!suporteNotifications) {
    console.error('❌ Seu navegador não suporta Notifications API');
    return;
  }
  
  if (!suporteSW) {
    console.error('❌ Seu navegador não suporta Service Workers');
    return;
  }
  
  console.log('');
  console.log('%c2️⃣ Verificando permissão...', 'font-weight: bold; color: #2196F3;');
  console.log(`   Status atual: ${Notification.permission}`);
  
  if (Notification.permission === 'denied') {
    console.error('❌ Permissão NEGADA - Você precisa reativar nas configurações do navegador');
    console.log('   Chrome: Configurações → Privacidade → Notificações');
    console.log('   Firefox: Ícone do cadeado → Permissões');
    return;
  }
  
  if (Notification.permission !== 'granted') {
    console.log('   Solicitando permissão...');
    const perm = await Notification.requestPermission();
    console.log(`   Nova permissão: ${perm}`);
    
    if (perm !== 'granted') {
      console.error('❌ Permissão não foi concedida');
      return;
    }
  }
  
  console.log('   ✅ Permissão concedida!');
  
  console.log('');
  console.log('%c3️⃣ Verificando Service Worker...', 'font-weight: bold; color: #2196F3;');
  
  const registrations = await navigator.serviceWorker.getRegistrations();
  console.log(`   Service Workers registrados: ${registrations.length}`);
  
  registrations.forEach((reg, i) => {
    console.log(`   [${i}] Scope: ${reg.scope}`);
    console.log(`       Installing: ${reg.installing ? '⏳' : '❌'}`);
    console.log(`       Waiting: ${reg.waiting ? '⏳' : '❌'}`);
    console.log(`       Active: ${reg.active ? '✅' : '❌'}`);
    if (reg.active) {
      console.log(`       State: ${reg.active.state}`);
    }
  });
  
  if (registrations.length === 0) {
    console.error('❌ Nenhum Service Worker registrado!');
    console.log('   Recarregue a página (Ctrl+Shift+R)');
    return;
  }
  
  console.log('');
  console.log('%c4️⃣ Aguardando Service Worker ficar pronto...', 'font-weight: bold; color: #2196F3;');
  
  const reg = await navigator.serviceWorker.ready;
  console.log('   ✅ Service Worker pronto:', reg);
  
  console.log('');
  console.log('%c5️⃣ Enviando notificação de teste...', 'font-weight: bold; color: #2196F3;');
  
  try {
    await reg.showNotification('🎉 Teste de Notificação', {
      body: 'Se você está vendo isso, as notificações estão FUNCIONANDO! 🚀',
      icon: '/android/android-launchericon-96-96.png',
      badge: '/android/android-launchericon-48-48.png',
      data: { url: '/admin' },
      requireInteraction: false,
      tag: 'test-notification'
    });
    
    console.log('   ✅ Notificação enviada com sucesso!');
    console.log('   📱 Você deve ver a notificação agora!');
    
  } catch (err) {
    console.error('   ❌ Erro ao enviar notificação:', err);
    console.error('   Detalhes:', err.message);
  }
  
  console.log('');
  console.log('%c✅ DIAGNÓSTICO COMPLETO!', 'font-size: 16px; font-weight: bold; color: #4CAF50;');
  console.log('');
  console.log('Se a notificação não apareceu:');
  console.log('1. Verifique se o navegador não está silenciado (Do Not Disturb)');
  console.log('2. No Windows: Configurações → Sistema → Notificações');
  console.log('3. Tente desregistrar o SW e recarregar:');
  console.log('   - DevTools → Application → Service Workers → Unregister');
  console.log('   - Ctrl+Shift+R para hard reload');
}

// Executar diagnóstico
diagnosticarNotificacoes().catch(err => {
  console.error('❌ Erro fatal:', err);
});

// Funções auxiliares para debug manual
window.debugNotificacoes = {
  // Testar notificação rápida
  async testar() {
    const reg = await navigator.serviceWorker.ready;
    await reg.showNotification('🧪 Teste Rápido', {
      body: 'Teste manual de notificação',
      icon: '/android/android-launchericon-96-96.png',
    });
    console.log('✅ Notificação enviada!');
  },
  
  // Ver todas as registrations
  async verRegistrations() {
    const regs = await navigator.serviceWorker.getRegistrations();
    console.table(regs.map((r, i) => ({
      index: i,
      scope: r.scope,
      active: r.active?.state,
    })));
    return regs;
  },
  
  // Desregistrar todos os SWs
  async limparTudo() {
    const regs = await navigator.serviceWorker.getRegistrations();
    for (const reg of regs) {
      await reg.unregister();
      console.log('🗑️ Desregistrado:', reg.scope);
    }
    console.log('✅ Todos os Service Workers foram removidos');
    console.log('Recarregue a página com Ctrl+Shift+R');
  },
  
  // Forçar atualização do SW
  async atualizarSW() {
    const reg = await navigator.serviceWorker.ready;
    await reg.update();
    console.log('✅ Service Worker atualizado! Recarregue a página.');
  },
  
  // Ver permissão
  verPermissao() {
    console.log('Permissão atual:', Notification.permission);
    return Notification.permission;
  },
};

console.log('');
console.log('%c💡 Funções de debug disponíveis:', 'font-weight: bold;');
console.log('   debugNotificacoes.testar() - Enviar notificação de teste');
console.log('   debugNotificacoes.verRegistrations() - Ver Service Workers');
console.log('   debugNotificacoes.limparTudo() - Desregistrar todos os SWs');
console.log('   debugNotificacoes.atualizarSW() - Forçar atualização do SW');
console.log('   debugNotificacoes.verPermissao() - Ver status da permissão');
