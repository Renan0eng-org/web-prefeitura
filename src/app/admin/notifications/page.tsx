'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNotifications, type Notification } from '@/hooks/use-notifications';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Check, CheckCheck, Loader2, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function NotificationsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'UNREAD' | 'READ'>('UNREAD');

  const {
    notifications,
    unreadCount,
    loading,
    hasMore,
    markAsRead,
    markAllAsRead,
    archiveNotification,
    loadMore,
  } = useNotifications({
    status: activeTab,
    limit: 20,
  });

  const handleNotificationClick = async (notif: Notification) => {
    if (notif.status === 'UNREAD') {
      await markAsRead(notif.id);
    }
    if (notif.data?.url) {
      router.push(notif.data.url);
    }
  };

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              Notificações
              {unreadCount > 0 && (
                <Badge variant="destructive">{unreadCount} não lidas</Badge>
              )}
            </CardTitle>
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={markAllAsRead}>
                <CheckCheck className="h-4 w-4 mr-2" />
                Marcar todas como lidas
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="UNREAD">Não lidas</TabsTrigger>
              <TabsTrigger value="READ">Lidas</TabsTrigger>
            </TabsList>

            <TabsContent value="UNREAD" className="space-y-2 mt-4">
              {loading && notifications.length === 0 ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma notificação não lida
                </div>
              ) : (
                <>
                  {notifications.map((notif) => (
                    <NotificationCard
                      key={notif.id}
                      notification={notif}
                      onClick={handleNotificationClick}
                      onMarkRead={markAsRead}
                      onArchive={archiveNotification}
                    />
                  ))}
                  {hasMore && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={loadMore}
                      disabled={loading}
                    >
                      {loading ? 'Carregando...' : 'Carregar mais'}
                    </Button>
                  )}
                </>
              )}
            </TabsContent>

            <TabsContent value="READ" className="space-y-2 mt-4">
              {loading && notifications.length === 0 ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma notificação lida
                </div>
              ) : (
                <>
                  {notifications.map((notif) => (
                    <NotificationCard
                      key={notif.id}
                      notification={notif}
                      onClick={handleNotificationClick}
                      onArchive={archiveNotification}
                    />
                  ))}
                  {hasMore && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={loadMore}
                      disabled={loading}
                    >
                      {loading ? 'Carregando...' : 'Carregar mais'}
                    </Button>
                  )}
                </>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function NotificationCard({
  notification,
  onClick,
  onMarkRead,
  onArchive,
}: {
  notification: Notification;
  onClick: (n: Notification) => void;
  onMarkRead?: (id: string) => Promise<void>;
  onArchive: (id: string) => Promise<void>;
}) {
  return (
    <Card
      className={`cursor-pointer transition-colors hover:bg-accent ${
        notification.status === 'UNREAD' ? 'border-l-4 border-l-primary' : ''
      }`}
      onClick={() => onClick(notification)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2 mb-1">
              <h3 className="font-semibold text-sm">{notification.title}</h3>
              {notification.category && (
                <Badge variant="outline" className="text-xs shrink-0">
                  {notification.category}
                </Badge>
              )}
            </div>
            {notification.body && (
              <p className="text-sm text-muted-foreground mb-2">
                {notification.body}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(notification.createdAt), {
                addSuffix: true,
                locale: ptBR,
              })}
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            {onMarkRead && notification.status === 'UNREAD' && (
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkRead(notification.id);
                }}
              >
                <Check className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onArchive(notification.id);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
