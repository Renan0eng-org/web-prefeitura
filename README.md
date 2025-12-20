This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Notifications (PWA)

- Request permission from a user gesture and show a notification via the Service Worker:

```ts
import { requestNotificationPermission, showLocalNotification } from '@/services/notifications';

async function notifyExample() {
	const perm = await requestNotificationPermission();
	if (perm !== 'granted') return;
	await showLocalNotification({
		title: 'Olá!',
		body: 'Sua ação foi concluída.',
		data: { url: '/admin' }, // ao clicar, abre esta rota
	});
}
```

- Push support: o Service Worker em `public/service-worker.js` já escuta `push` e `notificationclick`. Para enviar push real, é necessário um backend que salve `PushSubscription` por usuário (via VAPID) e envie mensagens usando uma biblioteca como `web-push`.

- Sugestão de tabelas:
	- `notifications`: `id`, `user_id`, `title`, `body`, `data` (JSON), `status` (unread|read), `created_at`, `read_at`.
	- `push_subscriptions`: `id`, `user_id`, `endpoint`, `p256dh`, `auth`, `user_agent`, `created_at`, `last_success_at`.

Ao ocorrer um evento no backend, crie um registro em `notifications` (para o sino dentro do app) e opcionalmente dispare Web Push para as inscrições do usuário. O Service Worker exibirá a notificação e, ao clicar, abrirá/focará o app na rota passada em `data.url`.
