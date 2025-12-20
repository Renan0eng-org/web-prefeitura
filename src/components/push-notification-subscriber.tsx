'use client';

import { useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { autoSubscribePush } from '@/services/notifications';
import api from '@/services/api';

/**
 * Component to auto-subscribe to push notifications after login.
 * Add this to your main layout or dashboard.
 */
export function PushNotificationSubscriber() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Wait a bit after login to request permission
    const timer = setTimeout(async () => {
      const subscribed = await autoSubscribePush(api);
      if (subscribed) {
        console.log('✅ Push notifications subscribed');
      }
    }, 2000); // 2s delay to avoid blocking UI

    return () => clearTimeout(timer);
  }, [user]);

  return null;
}
