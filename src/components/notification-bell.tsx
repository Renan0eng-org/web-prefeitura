'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNotifications } from '@/hooks/use-notifications';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Bell, Check, CheckCheck, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function NotificationBell() {
  const router = useRouter();
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    archiveNotification,
    refresh,
  } = useNotifications({
    status: 'UNREAD',
    limit: 10,
    autoRefresh: true,
    refreshInterval: 30000, // 30s
  });

  const handleNotificationClick = async (notif: any) => {
    try {
      await markAsRead(notif.id);
      if (notif.data?.url) {
        router.push(notif.data.url);
      }
    } catch (err) {
      console.error('Erro ao marcar como lida:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
    } catch (err) {
      console.error('Erro ao marcar todas como lidas:', err);
    }
  };

  const handleArchive = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await archiveNotification(id);
    } catch (err) {
      console.error('Erro ao arquivar:', err);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
          <span className="sr-only">Notificações</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notificações</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-1 text-xs"
              onClick={handleMarkAllRead}
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Marcar todas
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-[400px] overflow-y-auto">
          {loading && notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Carregando...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Nenhuma notificação não lida
            </div>
          ) : (
            notifications.map((notif) => (
              <DropdownMenuItem
                key={notif.id}
                className="flex flex-col items-start gap-1 p-3 cursor-pointer hover:bg-accent"
                onClick={() => handleNotificationClick(notif)}
              >
                <div className="flex items-start justify-between w-full gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm line-clamp-1">{notif.title}</p>
                    {notif.body && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                        {notif.body}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(notif.createdAt), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead(notif.id);
                      }}
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive"
                      onClick={(e) => handleArchive(e, notif.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                {notif.category && (
                  <Badge variant="outline" className="text-xs">
                    {notif.category}
                  </Badge>
                )}
              </DropdownMenuItem>
            ))
          )}
        </div>
        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-center justify-center cursor-pointer"
              onClick={() => router.push('/admin/notifications')}
            >
              Ver todas
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
