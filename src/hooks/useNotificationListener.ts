import { useEffect } from 'react';

interface NotificationData {
  title: string;
  body: string;
  data?: Record<string, string>;
}

export function useNotificationListener(
  onNotification: (data: NotificationData) => void
) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleNotification = (event: Event) => {
      const customEvent = event as CustomEvent;
      onNotification(customEvent.detail);
    };

    window.addEventListener('push-notification', handleNotification);

    return () => {
      window.removeEventListener('push-notification', handleNotification);
    };
  }, [onNotification]);
}
