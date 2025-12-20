'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { requestNotificationPermission, showLocalNotification } from '@/services/notifications';
import { Bell, Check, X } from 'lucide-react';
import { useState } from 'react';

export default function TestNotificationsPage() {
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );
  const [title, setTitle] = useState('Teste de Notificação');
  const [body, setBody] = useState('Esta é uma notificação de teste!');
  const [url, setUrl] = useState('/admin');
  const [loading, setLoading] = useState(false);

  const handleRequestPermission = async () => {
    setLoading(true);
    const perm = await requestNotificationPermission();
    setPermission(perm);
    setLoading(false);
  };

  const handleShowNotification = async () => {
    setLoading(true);
    try {
      await showLocalNotification({
        title,
        body,
        data: { url },
      });
      alert('✅ Notificação enviada! Verifique o console para logs detalhados.');
    } catch (err: any) {
      alert('❌ Erro: ' + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTestQuick = async () => {
    setLoading(true);
    try {
      await showLocalNotification({
        title: '🎉 Sucesso!',
        body: 'Suas notificações estão funcionando perfeitamente!',
        data: { url: '/admin/notifications' },
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getPermissionBadge = () => {
    switch (permission) {
      case 'granted':
        return (
          <div className="flex items-center gap-2 text-green-600">
            <Check className="h-4 w-4" />
            <span>Concedida</span>
          </div>
        );
      case 'denied':
        return (
          <div className="flex items-center gap-2 text-red-600">
            <X className="h-4 w-4" />
            <span>Negada (reative nas configurações do navegador)</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2 text-yellow-600">
            <Bell className="h-4 w-4" />
            <span>Não solicitada</span>
          </div>
        );
    }
  };

  return (
    <div className="container mx-auto py-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-6 w-6" />
            Testar Notificações PWA
          </CardTitle>
          <CardDescription>
            Use esta página para testar se as notificações estão funcionando corretamente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status de Permissão */}
          <div className="space-y-2">
            <Label>Status da Permissão</Label>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              {getPermissionBadge()}
              {permission !== 'granted' && (
                <Button onClick={handleRequestPermission} disabled={loading}>
                  Solicitar Permissão
                </Button>
              )}
            </div>
          </div>

          {/* Teste Rápido */}
          <div className="space-y-2">
            <Label>Teste Rápido</Label>
            <Button
              onClick={handleTestQuick}
              disabled={loading || permission !== 'granted'}
              className="w-full"
              size="lg"
            >
              🚀 Enviar Notificação de Teste Rápido
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Ou personalize
              </span>
            </div>
          </div>

          {/* Personalizar Notificação */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Digite o título..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="body">Mensagem</Label>
              <Textarea
                id="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Digite a mensagem..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="url">URL de Destino (ao clicar)</Label>
              <Input
                id="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="/admin/notifications"
              />
            </div>

            <Button
              onClick={handleShowNotification}
              disabled={loading || permission !== 'granted' || !title}
              className="w-full"
            >
              Enviar Notificação Personalizada
            </Button>
          </div>

          {/* Instruções */}
          <div className="space-y-2 pt-4 border-t">
            <h3 className="font-semibold">📝 Como Usar:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              <li>Clique em "Solicitar Permissão" se ainda não concedeu</li>
              <li>Aceite quando o navegador solicitar</li>
              <li>Clique em "Enviar Notificação de Teste Rápido"</li>
              <li>Você deve ver a notificação aparecer!</li>
              <li>Abra o Console (F12) para ver logs detalhados</li>
            </ol>
          </div>

          <div className="space-y-2 pt-2">
            <h3 className="font-semibold">🔍 Checklist de Debug:</h3>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>✅ Abra o DevTools → Console para ver logs</li>
              <li>✅ Verifique Application → Service Workers</li>
              <li>✅ O SW deve estar "activated and running"</li>
              <li>✅ Se não funcionar, force reload (Ctrl+Shift+R)</li>
              <li>✅ Verifique se não está em modo privado/anônimo</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
