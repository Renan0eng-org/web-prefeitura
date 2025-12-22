'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, Smartphone, Wifi } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function TestPeriodicNotificationsPage() {
  const CHECK_INTERVAL_MS = 5 * 60 * 1000;
  const [swActive, setSwActive] = useState(false);
  const [swCheckInterval, setSwCheckInterval] = useState('5 minutos');
  const [nextCheck, setNextCheck] = useState<Date | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    const checkSWStatus = async () => {
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        if (regs.length > 0 && regs[0].active) {
          setSwActive(true);
          addLog('✅ Service Worker ativo');
        }
      }
    };

    checkSWStatus();
    // Pede ao SW o próximo horário de checagem
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'GET_NEXT_CHECK' });
    }

    // Listener para mensagens do Service Worker
    const handleSWMessage = (event: MessageEvent) => {
      const { data } = event;
      if (!data || !data.type) return;

      if (data.type === 'NEXT_CHECK' && data.nextAt) {
        setNextCheck(new Date(data.nextAt));
        addLog(`⏰ Próxima verificação: ${new Date(data.nextAt).toLocaleTimeString()}`);
      }

      if (data.type === 'NOTIFICATIONS_FOUND') {
        addLog(`📬 ${data.total} notificações encontradas`);
        if (data.notifications && data.notifications.length > 0) {
          data.notifications.forEach((notif: any) => {
            addLog(`  📌 ${notif.title}`);
          });
        }
      }

      if (data.type === 'NOTIFICATION_SHOWN') {
        addLog(`🔔 Notificação exibida: ${data.title}`);
      }
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleSWMessage);
    }

    return () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleSWMessage);
      }
    };
  }, []);

  const addLog = (message: string) => {
    setLogs((prev) => [...prev.slice(-9), `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const handleForceCheck = async () => {
    addLog('🔍 Forçando verificação de notificações agora...');

    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'CHECK_NOTIFICATIONS_NOW',
      });
      addLog('📤 Mensagem enviada para o Service Worker');
    }
  };

  const handleSimulateNotification = async () => {
    addLog('🎭 Simulando notificação...');
    try {
      // Verifica permissão primeiro
      if (Notification.permission !== 'granted') {
        addLog('⚠️ Permissão de notificação não concedida: ' + Notification.permission);
        const permission = await Notification.requestPermission();
        addLog('📝 Nova permissão: ' + permission);
        if (permission !== 'granted') {
          addLog('❌ Usuário negou permissão');
          return;
        }
      }

      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification('Teste Periódico de Notificação', {
        body: 'Esta é uma notificação de teste para verificar se funciona em background.',
        icon: '/android/android-launchericon-96-96.png',
        data: { url: '/admin/notifications' },
        // vibrate: [200, 100, 200],
      });
      addLog('✅ Notificação simulada enviada');
    } catch (err) {
      addLog('❌ Erro ao simular: ' + (err as Error).message);
    }
  };

  const handleCheckPermission = async () => {
    if (!('Notification' in window)) {
      addLog('❌ Este navegador não suporta notificações');
      return;
    }

    addLog('📋 Verificando permissão...');
    addLog(`Status atual: ${Notification.permission}`);

    if (Notification.permission === 'default') {
      addLog('🔔 Solicitando permissão...');
      const permission = await Notification.requestPermission();
      addLog(`✅ Nova permissão: ${permission}`);
    } else if (Notification.permission === 'denied') {
      addLog('❌ Permissão negada. Vá em configurações do navegador para habilitar.');
    } else {
      addLog('✅ Permissão já concedida!');
    }
  };

  return (
    <div className="container mx-auto py-6 max-w-2xl space-y-6">
      {/* Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-6 w-6" />
            Notificações Periódicas (PWA)
          </CardTitle>
          <CardDescription>
            O Service Worker verifica notificações a cada {swCheckInterval} mesmo com o app fechado
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Service Worker Status */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-2">
              <Wifi className="h-4 w-4" />
              <span>Service Worker</span>
            </div>
            <Badge variant={swActive ? 'default' : 'destructive'}>
              {swActive ? '✅ Ativo' : '❌ Inativo'}
            </Badge>
          </div>

          {/* Verificação */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span>Próxima Verificação</span>
            </div>
            <span className="text-sm text-muted-foreground">
              {nextCheck ? nextCheck.toLocaleTimeString() : 'Em breve...'}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Instruções */}
      <Card>
        <CardHeader>
          <CardTitle>📱 Como Funciona em Mobile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <h4 className="font-semibold mb-2">Android:</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Abra o app no Chrome</li>
              <li>Menu (⋮) → "Instalar app"</li>
              <li>Faça login</li>
              <li>Feche o app (volte para home)</li>
              <li>Espere 5 minutos</li>
              <li>Você receberá notificação mesmo com app fechado! 🎉</li>
            </ol>
          </div>

          <div>
            <h4 className="font-semibold mb-2">iOS (Safari):</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Abra o app no Safari</li>
              <li>Compartilhar → "Adicionar à tela inicial"</li>
              <li>Abra como app instalado</li>
              <li>Faça login</li>
              <li>Feche o app</li>
              <li>Notificações funcionarão em background (iOS 16+)</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {/* Testes */}
      <Card>
        <CardHeader>
          <CardTitle>🧪 Testes Manuais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button onClick={handleCheckPermission} className="w-full" variant="default">
            🔔 Verificar Permissão de Notificações
          </Button>
          <p className="text-xs text-muted-foreground">
            Verifica se você concedeu permissão para notificações.
          </p>

          <Button onClick={handleForceCheck} className="w-full" variant="outline">
            🔍 Forçar Verificação Agora
          </Button>
          <p className="text-xs text-muted-foreground">
            Não espera os 5 minutos. Verifica imediatamente.
          </p>

          <Button onClick={handleSimulateNotification} className="w-full" variant="outline">
            🎭 Simular Notificação
          </Button>
          <p className="text-xs text-muted-foreground">
            Envia uma notificação de teste.
          </p>
        </CardContent>
      </Card>

      {/* Logs */}
      <Card>
        <CardHeader>
          <CardTitle>📋 Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-black text-green-400 p-3 rounded-lg font-mono text-xs h-48 overflow-y-auto">
            {logs.length === 0 ? (
              <div className="text-muted-foreground">Aguardando eventos...</div>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="mb-1">
                  {log}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* DevTools */}
      <Card>
        <CardHeader>
          <CardTitle>🔧 Debug no DevTools</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>1. Abra DevTools (F12)</p>
          <p>2. Vá em <strong>Application</strong> → <strong>Service Workers</strong></p>
          <p>3. Clique em <strong>Logs</strong> para ver mensagens do SW</p>
          <p>4. Você verá:</p>
          <code className="block bg-muted p-2 rounded mt-2 text-xs">
            [SW] 🔍 Buscando notificações não lidas...
            <br />
            [SW] 📬 Encontradas 2 notificações
            <br />
            [SW] 📢 Exibindo notificação: Título...
          </code>
        </CardContent>
      </Card>

      {/* Requisitos */}
      <Card>
        <CardHeader>
          <CardTitle>✅ Requisitos para Funcionar</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li>✅ Usuário deve estar logado</li>
            <li>✅ Permissão de notificações concedida</li>
            <li>✅ Service Worker ativo (veja acima)</li>
            <li>✅ Rota `/api/notifications` implementada no backend</li>
            <li>✅ PWA instalada (em mobile)</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
