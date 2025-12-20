# 🔔 Sistema de Notificações - Guia de Integração

## ✅ Arquivos Criados

### Frontend
- ✅ `.env.local` - VAPID keys configuradas
- ✅ `src/services/notifications.ts` - Funções para push e permissão
- ✅ `src/hooks/use-notifications.tsx` - Hook para gerenciar notificações
- ✅ `src/components/notification-bell.tsx` - Sino com badge e dropdown
- ✅ `src/components/push-notification-subscriber.tsx` - Auto-subscribe após login
- ✅ `src/app/admin/notifications/page.tsx` - Página completa de notificações
- ✅ `public/service-worker.js` - Listeners de push e click

### Documentação
- ✅ `NOTIFICATIONS_API.md` - Documentação completa da API
- ✅ `notifications-push.postman_collection.json` - Collection do Postman

---

## 🚀 Como Integrar no seu App

### 1. Adicionar o Sino no Layout/Header

Edite seu header/navbar (ex: `src/components/app-sidebar.tsx` ou `src/components/site-header.tsx`):

```tsx
import { NotificationBell } from '@/components/notification-bell';

export function SiteHeader() {
  return (
    <header className="...">
      {/* ... outros elementos */}
      <NotificationBell />
    </header>
  );
}
```

### 2. Adicionar Auto-Subscribe no Layout Admin

Edite `src/app/admin/layout.tsx`:

```tsx
import { PushNotificationSubscriber } from '@/components/push-notification-subscriber';

export default function AdminLayout({ children }) {
  return (
    <>
      <PushNotificationSubscriber />
      {/* ... resto do layout */}
      {children}
    </>
  );
}
```

### 3. Verificar Service Worker Registrado

O Service Worker já está registrado em `src/app/layout.tsx` via `<ServiceWorkerRegister />`.

---

## 🎯 Como Usar (Exemplos)

### Exibir Notificação Local (Feedback Imediato)

```tsx
import { showLocalNotification } from '@/services/notifications';

async function handleSave() {
  // ... salvar dados
  
  await showLocalNotification({
    title: 'Sucesso!',
    body: 'Dados salvos com sucesso.',
    data: { url: '/admin/dashboard' },
  });
}
```

### Listar Notificações em Qualquer Página

```tsx
import { useNotifications } from '@/hooks/use-notifications';

function MyComponent() {
  const { notifications, unreadCount, markAsRead } = useNotifications({
    status: 'UNREAD',
    limit: 10,
  });

  return (
    <div>
      <h2>Você tem {unreadCount} notificações</h2>
      {notifications.map(n => (
        <div key={n.id} onClick={() => markAsRead(n.id)}>
          {n.title}
        </div>
      ))}
    </div>
  );
}
```

### Enviar Notificação com Push (Backend)

```typescript
// Exemplo em Node.js/NestJS
await notificationsService.create({
  title: 'Consulta confirmada',
  body: 'Sua consulta foi agendada para amanhã às 10h.',
  data: { url: '/admin/agendamentos/123' },
  category: 'agendamento',
  priority: 1,
  targets: { userIds: ['user-123'] },
  sendPush: true, // Envia Web Push
});
```

---

## 🗄️ Backend - Próximos Passos

### 1. Criar Tabelas no Banco (Prisma)

Adicione ao `schema.prisma`:

```prisma
enum NotificationStatus {
  UNREAD
  READ
  ARCHIVED
}

model Notification {
  id          String   @id @default(uuid())
  title       String
  body        String?
  data        Json?
  category    String?
  priority    Int      @default(0)
  createdAt   DateTime @default(now())
  createdById String?

  createdBy         User?              @relation("NotificationCreatedBy", fields: [createdById], references: [id])
  userNotifications UserNotification[]
}

model UserNotification {
  id             String             @id @default(uuid())
  status         NotificationStatus @default(UNREAD)
  deliveredAt    DateTime?
  readAt         DateTime?
  muted          Boolean            @default(false)
  createdAt      DateTime           @default(now())

  notificationId String
  notification   Notification @relation(fields: [notificationId], references: [id], onDelete: Cascade)

  userId String
  user   User   @relation("UserNotifications", fields: [userId], references: [id], onDelete: Cascade)

  @@unique([notificationId, userId])
  @@index([userId, status, createdAt(sort: Desc)])
}

model PushSubscription {
  id            String    @id @default(uuid())
  endpoint      String    @unique
  p256dh        String
  auth          String
  userAgent     String?
  createdAt     DateTime  @default(now())
  lastSuccessAt DateTime?
  disabledAt    DateTime?

  userId String
  user   User   @relation("PushSubscriptions", fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([disabledAt])
}
```

Execute:
```bash
npx prisma migrate dev --name add_notifications
npx prisma generate
```

### 2. Instalar Web Push (Node.js)

```bash
npm install web-push
```

### 3. Implementar Rotas (Exemplo NestJS/Express)

Siga a documentação em `NOTIFICATIONS_API.md` para implementar:
- `POST /push/subscribe`
- `DELETE /push/subscribe`
- `POST /notifications`
- `GET /notifications`
- `GET /notifications/unread-count`
- `PATCH /notifications/:id/read`
- `PATCH /notifications/read-all`
- `DELETE /notifications/:id`

### 4. Configurar VAPID no Backend

No `.env` do backend:
```bash
VAPID_PUBLIC_KEY=BDjmo3HxvWSiIHXWpYx5bxpUkFd2h_vM8yOJVYiVCLBvCZ36Ey47g-NDn2p4fXRdxOAV9xpmKura43I73kKNWzQ
VAPID_PRIVATE_KEY=f-CaKjuizdskCX7X5UMpeFYJhjkovdeUK7PDSUZ4OoY
WEB_PUSH_SUBJECT=mailto:admin@prefeitura.renannardi.com
```

### 5. Exemplo de Envio de Push (Node.js)

```typescript
import webPush from 'web-push';

webPush.setVapidDetails(
  process.env.WEB_PUSH_SUBJECT!,
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

async function sendPush(subscription: PushSubscription, notification: Notification) {
  const payload = JSON.stringify({
    title: notification.title,
    body: notification.body,
    icon: '/android/android-launchericon-96-96.png',
    badge: '/android/android-launchericon-48-48.png',
    data: notification.data,
  });

  try {
    await webPush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
      },
      payload
    );
    // Atualizar deliveredAt
  } catch (err: any) {
    if (err.statusCode === 410 || err.statusCode === 404) {
      // Subscription inválida, desabilitar
      await prisma.pushSubscription.update({
        where: { id: subscription.id },
        data: { disabledAt: new Date() },
      });
    }
  }
}
```

---

## 🧪 Como Testar

### 1. Frontend - Pedir Permissão

Abra o console do navegador e execute:
```javascript
await Notification.requestPermission();
```

### 2. Frontend - Enviar Notificação Local

```javascript
import { showLocalNotification } from '@/services/notifications';

showLocalNotification({
  title: 'Teste',
  body: 'Esta é uma notificação de teste!',
  data: { url: '/admin' }
});
```

### 3. Backend - Criar Notificação via Postman

1. Importe `notifications-push.postman_collection.json`
2. Configure `{{baseUrl}}` e `{{authToken}}`
3. Execute `POST /notifications` com:
```json
{
  "title": "Teste Backend",
  "body": "Notificação criada pelo backend",
  "targets": { "userIds": ["seu-user-id"] },
  "sendPush": true
}
```

### 4. Verificar no Browser

- Veja a notificação aparecer (se permissão concedida)
- Clique → deve abrir o app na URL especificada em `data.url`
- Verifique o sino no header → badge com contagem
- Abra `/admin/notifications` → lista completa

---

## 📊 Fluxo Completo

```
1. Usuário faz login
   ↓
2. <PushNotificationSubscriber /> pede permissão
   ↓
3. Se concedida → cria PushSubscription
   ↓
4. Envia subscription para POST /push/subscribe
   ↓
5. Backend salva na tabela push_subscriptions
   ↓
6. Evento ocorre (agendamento, formulário, etc)
   ↓
7. Backend cria Notification + UserNotification
   ↓
8. Se sendPush=true → envia Web Push via web-push
   ↓
9. Service Worker recebe push → exibe notificação
   ↓
10. Usuário clica → notificationclick event
    ↓
11. Abre/focando app na URL de data.url
    ↓
12. Frontend marca como lida via PATCH /notifications/:id/read
```

---

## 🔧 Troubleshooting

### Notificação não aparece
- ✅ Verificar permissão: `Notification.permission === 'granted'`
- ✅ Verificar Service Worker registrado: DevTools → Application → Service Workers
- ✅ Verificar VAPID keys corretas no `.env.local` e backend
- ✅ Testar com notificação local primeiro (não precisa backend)

### Push não chega
- ✅ Verificar subscription salva no banco (`PushSubscription`)
- ✅ Verificar `disabledAt IS NULL`
- ✅ Verificar payload < 4KB
- ✅ Logs do backend ao enviar push

### Badge não atualiza
- ✅ Verificar rota `/notifications/unread-count` funcionando
- ✅ Verificar `autoRefresh: true` no hook
- ✅ Marcar como lida deve decrementar count

### Clique não abre URL
- ✅ Verificar `data.url` no payload da notificação
- ✅ Verificar listener `notificationclick` no Service Worker
- ✅ Testar com URL absoluta: `/admin/path`

---

## 📚 Recursos

- [Web Push API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Notifications API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API)
- [web-push (Node.js)](https://github.com/web-push-libs/web-push)
- [VAPID Keys Generator](https://vapidkeys.com/)

---

## ✨ Melhorias Futuras

- [ ] Agrupamento de notificações por categoria
- [ ] Ações inline nas notificações (aceitar/recusar)
- [ ] Som customizado por prioridade
- [ ] Vibração em dispositivos móveis
- [ ] Analytics de taxa de entrega/cliques
- [ ] Agendamento de notificações (cron)
- [ ] Templates de notificações
- [ ] Filtros avançados (roles, unidades de saúde)
- [ ] Notificações em tempo real via WebSocket
- [ ] Preview de imagem/anexo nas notificações

---

**Pronto para uso! 🎉**

Qualquer dúvida, consulte `NOTIFICATIONS_API.md` ou abra uma issue.
