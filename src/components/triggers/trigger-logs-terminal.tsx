"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TriggerLogEvent } from "@/types/trigger"
import { Circle, Pause, Play, Terminal, Trash2 } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"

interface TriggerLogsTerminalProps {
  apiUrl: string
}

export function TriggerLogsTerminal({ apiUrl }: TriggerLogsTerminalProps) {
  const [logs, setLogs] = useState<{ message: string; timestamp: string }[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const logsEndRef = useRef<HTMLDivElement>(null)
  const eventSourceRef = useRef<EventSource | null>(null)

  const scrollToBottom = useCallback(() => {
    if (!isPaused) {
      logsEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [isPaused])

  useEffect(() => {
    scrollToBottom()
  }, [logs, scrollToBottom])

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    // Obter token de autenticação
    const token = document.cookie
      .split('; ')
      .find(row => row.startsWith('accessToken='))
      ?.split('=')[1]

    // SSE com autenticação via query param (SSE não suporta headers customizados)
    const url = `${apiUrl}/triggers/logs/stream${token ? `?token=${token}` : ''}`
    
    const eventSource = new EventSource(url, { withCredentials: true })
    eventSourceRef.current = eventSource

    eventSource.onopen = () => {
      setIsConnected(true)
      setLogs(prev => [...prev, {
        message: "[Sistema] Conectado ao stream de logs",
        timestamp: new Date().toISOString()
      }])
    }

    eventSource.onmessage = (event) => {
      try {
        const data: TriggerLogEvent = JSON.parse(event.data)
        if (data.type === 'log' && data.message) {
          setLogs(prev => [...prev.slice(-500), {
            message: data.message!,
            timestamp: data.timestamp
          }])
        }
      } catch (error) {
        console.error("Erro ao processar evento SSE:", error)
      }
    }

    eventSource.onerror = () => {
      setIsConnected(false)
      setLogs(prev => [...prev, {
        message: "[Sistema] Conexão perdida. Tentando reconectar...",
        timestamp: new Date().toISOString()
      }])
      
      // Tentar reconectar após 3 segundos
      setTimeout(() => {
        if (eventSourceRef.current?.readyState === EventSource.CLOSED) {
          connect()
        }
      }, 3000)
    }

    return () => {
      eventSource.close()
    }
  }, [apiUrl])

  useEffect(() => {
    connect()
    
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
    }
  }, [connect])

  const handleClearLogs = () => {
    setLogs([])
  }

  const handleTogglePause = () => {
    setIsPaused(!isPaused)
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      fractionalSecondDigits: 3
    })
  }

  const getLogColor = (message: string) => {
    if (message.includes('[Sistema]')) return 'text-blue-400'
    if (message.includes('Trigger selecionada')) return 'text-green-400'
    if (message.includes('Nenhuma trigger')) return 'text-yellow-400'
    if (message.includes('score=')) return 'text-cyan-400'
    if (message.includes('ativada') || message.includes('desativada')) return 'text-purple-400'
    if (message.includes('atualizada')) return 'text-orange-400'
    return 'text-gray-300'
  }

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="h-5 w-5" />
            <CardTitle className="text-lg">Logs em Tempo Real</CardTitle>
            <div className="flex items-center gap-1.5 ml-2">
              <Circle 
                className={`h-2.5 w-2.5 ${isConnected ? 'fill-green-500 text-green-500' : 'fill-red-500 text-red-500'}`} 
              />
              <span className="text-xs text-muted-foreground">
                {isConnected ? 'Conectado' : 'Desconectado'}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleTogglePause}
            >
              {isPaused ? (
                <>
                  <Play className="h-4 w-4 mr-1" />
                  Retomar
                </>
              ) : (
                <>
                  <Pause className="h-4 w-4 mr-1" />
                  Pausar
                </>
              )}
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleClearLogs}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Limpar
            </Button>
          </div>
        </div>
        <CardDescription>
          Visualize os logs do TriggerService em tempo real.
          {isPaused && <span className="text-yellow-500 ml-2">(Pausado - scroll manual ativado)</span>}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <div className="bg-zinc-950 rounded-b-lg font-mono text-sm h-80 overflow-y-auto p-4">
          {logs.length === 0 ? (
            <div className="text-gray-500 text-center py-8">
              Aguardando logs...
            </div>
          ) : (
            logs.map((log, idx) => (
              <div key={idx} className="py-0.5 flex gap-2">
                <span className="text-gray-500 flex-shrink-0">
                  [{formatTimestamp(log.timestamp)}]
                </span>
                <span className={getLogColor(log.message)}>
                  {log.message}
                </span>
              </div>
            ))
          )}
          <div ref={logsEndRef} />
        </div>
      </CardContent>
    </Card>
  )
}
