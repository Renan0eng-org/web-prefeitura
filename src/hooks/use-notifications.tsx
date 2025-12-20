'use client';

import api from '@/services/api';
import { useEffect, useState } from 'react';

export type NotificationStatus = 'UNREAD' | 'READ' | 'ARCHIVED';

export interface Notification {
  id: string;
  title: string;
  body?: string;
  data?: {
    url?: string;
    [key: string]: any;
  };
  status: NotificationStatus;
  category?: string;
  priority?: number;
  createdAt: string;
  readAt?: string | null;
}

export interface NotificationsResponse {
  items: Notification[];
  nextCursor?: string;
}

export function useNotifications(options?: {
  status?: NotificationStatus;
  category?: string;
  limit?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | undefined>();

  const fetchNotifications = async (cursor?: string) => {
    try {
      setLoading(true);
      setError(null);

      const params: any = {
        limit: options?.limit || 20,
      };
      if (options?.status) params.status = options.status;
      if (options?.category) params.category = options.category;
      if (cursor) params.after = cursor;

      const { data } = await api.get<NotificationsResponse>('/notifications', { params });

      if (cursor) {
        setNotifications((prev) => [...prev, ...data.items]);
      } else {
        setNotifications(data.items);
      }
      setNextCursor(data.nextCursor);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao carregar notificações');
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const { data } = await api.get<{ count: number }>('/notifications/unread-count');
      setUnreadCount(data.count);
    } catch (err) {
      // Silent fail for count
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`, { read: true });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, status: 'READ', readAt: new Date().toISOString() } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Erro ao marcar como lida');
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all', {});
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, status: 'READ' as NotificationStatus, readAt: new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Erro ao marcar todas como lidas');
    }
  };

  const archiveNotification = async (id: string) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      // Recount unread
      await fetchUnreadCount();
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Erro ao arquivar notificação');
    }
  };

  const loadMore = () => {
    if (nextCursor && !loading) {
      fetchNotifications(nextCursor);
    }
  };

  const refresh = () => {
    fetchNotifications();
    fetchUnreadCount();
  };

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, [options?.status, options?.category, options?.limit]);

  useEffect(() => {
    if (options?.autoRefresh) {
      const interval = setInterval(() => {
        fetchUnreadCount();
        // Refresh only if showing unread
        if (options?.status === 'UNREAD' || !options?.status) {
          fetchNotifications();
        }
      }, options?.refreshInterval || 30000); // 30s default

      return () => clearInterval(interval);
    }
  }, [options?.autoRefresh, options?.refreshInterval, options?.status]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    hasMore: !!nextCursor,
    markAsRead,
    markAllAsRead,
    archiveNotification,
    loadMore,
    refresh,
  };
}
