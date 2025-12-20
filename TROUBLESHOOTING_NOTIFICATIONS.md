# 🔧 Troubleshooting - Notificações não aparecem

## ✅ Passos para Resolver

### 1. **Force Reload da Página**
O Service Worker pode estar em cache antigo.

```bash
# Windows/Linux
Ctrl + Shift + R

# Mac
Cmd + Shift + R
```

### 2. **Verificar Service Worker Ativo**

1. Abra DevTools (F12)
2. Vá em **Application** → **Service Workers**
3. Verifique se está **"activated and running"**
4. Se necessário, clique em **"Unregister"** e recarregue a página

### 3. **Verificar Permissões**

No Console do navegador:
```javascript
console.log('Permission:', Notification.permission);
```

Se for `denied`:
- **Chrome**: Configurações → Privacidade → Configurações do site → Notificações
- **Firefox**: Ícone do cadeado → Permissões → Notificações
- **Edge**: Similar ao Chrome

### 4. **Testar Manualmente no Console**

Abra o Console (F12) e execute:

```javascript
// 1. Verificar suporte
console.log('Notifications supported:', 'Notification' in window);
console.log('Service Worker supported:', 'serviceWorker' in navigator);

// 2. Pedir permissão
await Notification.requestPermission();

// 3. Testar notificação
const reg = await navigator.serviceWorker.ready;
console.log('SW Ready:', reg);

await reg.showNotification('Teste Manual', {
  body: 'Se você vê isso, está funcionando!',
  icon: '/android/android-launchericon-96-96.png',
  data: { url: '/admin' }
});
```

### 5. **Verificar Logs**

Com as melhorias que fiz, você deve ver logs como:
```
✅ Service Worker registrado: ServiceWorkerRegistration
📍 Scope: http://localhost:3000/
📦 State: active
🔔 showLocalNotification called: {title: "Teste", ...}
🔐 Permission status: granted
⏳ Aguardando Service Worker ready...
✅ Service Worker ready: ServiceWorkerRegistration
📤 Showing notification via SW: Teste {...}
✅ Notification showed successfully!
```

Se não ver esses logs, há um problema.

### 6. **Limpar Tudo e Recomeçar**

Se nada funcionar:

1. **Desregistrar Service Worker:**
   - DevTools → Application → Service Workers → Unregister

2. **Limpar Cache:**
   - DevTools → Application → Storage → Clear site data

3. **Recarregar:**
   - Ctrl+Shift+R (hard reload)

4. **Testar novamente:**
   - Vá em `/admin/test-notifications`
   - Solicite permissão
   - Envie teste rápido

## 🧪 Página de Teste

Criei uma página especial: **`/admin/test-notifications`**

Use ela para:
- ✅ Verificar permissão
- ✅ Solicitar permissão
- ✅ Enviar notificação de teste
- ✅ Ver instruções passo a passo

## 🚨 Problemas Comuns

### Notificação não aparece mesmo com permissão

**Causa:** Service Worker não está ativo.

**Solução:**
```javascript
// No console
navigator.serviceWorker.ready.then(reg => {
  console.log('SW State:', reg.active.state);
});
```

Se não for "activated", force reload.

### Erro: "ServiceWorker not ready"

**Causa:** Tentando mostrar notificação antes do SW estar pronto.

**Solução:** As correções que fiz agora usam `navigator.serviceWorker.ready` que espera automaticamente.

### Notificação aparece mas não tem ícone

**Causa:** Caminho do ícone inválido.

**Solução:** Verifique se existe `/android/android-launchericon-96-96.png` na pasta `public/`.

### Clique não abre a URL

**Causa:** Service Worker não está recebendo o evento de clique.

**Solução:** Veja os logs no console quando clicar. Deve aparecer:
```
[SW] Notification clicked: Notification {...}
[SW] Opening URL: http://localhost:3000/admin
```

## 📱 Testar em Diferentes Ambientes

### Localhost (Desenvolvimento)
✅ Funcionará normalmente (HTTPS não obrigatório)

### Production (Deploy)
⚠️ **OBRIGATÓRIO HTTPS** para Service Workers e Push

### Modo Privado/Anônimo
❌ Pode ter restrições dependendo do navegador

## 🔍 Debug Avançado

### Ver todos os Service Workers registrados
```javascript
navigator.serviceWorker.getRegistrations().then(regs => {
  console.log('Registrations:', regs);
  regs.forEach(reg => console.log('Scope:', reg.scope));
});
```

### Ver estado do Service Worker
```javascript
navigator.serviceWorker.ready.then(reg => {
  console.log('Installing:', reg.installing);
  console.log('Waiting:', reg.waiting);
  console.log('Active:', reg.active);
  console.log('State:', reg.active?.state);
});
```

### Forçar atualização do Service Worker
```javascript
navigator.serviceWorker.ready.then(reg => {
  reg.update().then(() => {
    console.log('SW updated!');
    window.location.reload();
  });
});
```

## ✨ Próximos Passos

Se tudo funcionar localmente:
1. ✅ Testar em `/admin/test-notifications`
2. ✅ Adicionar `<NotificationBell />` no header
3. ✅ Implementar as rotas do backend
4. ✅ Testar Web Push real

## 📞 Ainda não funciona?

Envie os seguintes dados:
1. Screenshot do DevTools → Application → Service Workers
2. Logs do Console (todos os logs com emoji que adicionei)
3. Navegador e versão
4. Resultado de `Notification.permission` no console
