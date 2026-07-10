"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/hooks/use-auth"
import api from "@/services/api"
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Clock,
  Filter,
  MessageSquare,
  RefreshCw,
  Target,
  TrendingUp,
  Users,
  XCircle,
  Zap,
} from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

interface AnalyticsData {
  summary: {
    totalMessages: number
    totalTriggers: number
    totalErrors: number
    totalSuccess: number
    avgDuration: number
    errorRate: number
    successRate: number
  }
  triggerCounts: { name: string; count: number }[]
  markerCounts: { marker: string; count: number }[]
  dailyStats: {
    date: string
    messages: string
    triggers: string
    errors: string
    successes: string
  }[]
  topUsers: {
    user: { idUser: string; name: string; email: string }
    messageCount: number
  }[]
  logs: ChatLogEntry[]
}

interface ChatLogEntry {
  id: string
  chatId: string
  userId: string
  type: string
  triggerName: string | null
  triggerId: string | null
  score: number | null
  marker: string | null
  actionResult: string | null
  errorMessage: string | null
  userMessage: string | null
  aiResponse: string | null
  metadata: any
  duration: number | null
  createdAt: string
  user: { idUser: string; name: string; email: string }
  chat: { idChat: string; title: string }
}

const TYPE_LABELS: Record<string, string> = {
  TRIGGER_DETECTED: "Trigger Detectada",
  MARKER_PROCESSED: "Marcador Processado",
  ACTION_SUCCESS: "Ação Sucesso",
  ACTION_ERROR: "Ação Erro",
  MESSAGE_SENT: "Mensagem Enviada",
  MESSAGE_RECEIVED: "Mensagem Recebida",
}

const TYPE_COLORS: Record<string, string> = {
  TRIGGER_DETECTED: "bg-blue-500/20 text-blue-600",
  MARKER_PROCESSED: "bg-purple-500/20 text-purple-600",
  ACTION_SUCCESS: "bg-green-500/20 text-green-600",
  ACTION_ERROR: "bg-red-500/20 text-red-600",
  MESSAGE_SENT: "bg-slate-500/20 text-slate-600",
  MESSAGE_RECEIVED: "bg-teal-500/20 text-teal-600",
}

const PIE_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "#8884d8",
  "#82ca9d",
  "#ffc658",
]

export default function ChatAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [triggerNames, setTriggerNames] = useState<string[]>([])
  const [expandedLog, setExpandedLog] = useState<string | null>(null)

  // Filters
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [filterTrigger, setFilterTrigger] = useState("all")
  const [filterType, setFilterType] = useState("all")

  const { getPermissions, loading: authLoading } = useAuth()
  const permissions = useMemo(
    () => getPermissions("chat-ai-admin"),
    [getPermissions]
  )

  const fetchAnalytics = useCallback(async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      if (startDate) params.set("startDate", startDate)
      if (endDate) params.set("endDate", endDate)
      if (filterTrigger !== "all") params.set("triggerName", filterTrigger)
      if (filterType !== "all") params.set("type", filterType)

      const [analyticsRes, triggersRes] = await Promise.all([
        api.get(`/chats/analytics?${params.toString()}`),
        api.get("/chats/analytics/triggers"),
      ])
      setData(analyticsRes.data)
      setTriggerNames(triggersRes.data)
    } catch (error) {
      console.error("Erro ao buscar analytics:", error)
    } finally {
      setIsLoading(false)
    }
  }, [startDate, endDate, filterTrigger, filterType])

  useEffect(() => {
    if (!authLoading && permissions?.visualizar) {
      fetchAnalytics()
    }
  }, [authLoading, permissions, fetchAnalytics])

  if (authLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  if (!permissions?.visualizar) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-destructive">Acesso Negado</h2>
          <p className="text-muted-foreground mt-2">
            Você não tem permissão para acessar esta página.
          </p>
        </div>
      </div>
    )
  }

  const dailyChartData = (data?.dailyStats || [])
    .map(d => ({
      date: new Date(d.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      Mensagens: Number(d.messages),
      Triggers: Number(d.triggers),
      Erros: Number(d.errors),
      Sucessos: Number(d.successes),
    }))
    .reverse()

  const triggerPieData = (data?.triggerCounts || []).map(t => ({
    name: t.name || "default",
    value: t.count,
  }))

  return (
    <div className="container mx-auto px-3 md:px-6 py-4 md:py-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Analytics do Chat IA
          </h1>
          <p className="text-sm text-muted-foreground">
            Análise de triggers, ações, respostas e erros do sistema de chat.
          </p>
        </div>
        <Button onClick={fetchAnalytics} variant="outline" disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex items-center gap-1 text-sm font-medium text-muted-foreground">
              <Filter className="h-4 w-4" />
              Filtros:
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">De</label>
              <Input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-40 h-9"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Até</label>
              <Input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-40 h-9"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Trigger</label>
              <Select value={filterTrigger} onValueChange={setFilterTrigger}>
                <SelectTrigger className="w-48 h-9">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {triggerNames.map(t => (
                    <SelectItem key={t} value={t!}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Tipo</label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-48 h-9">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {Object.entries(TYPE_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={fetchAnalytics} size="sm" className="h-9">
              Aplicar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
          {[1, 2, 3, 4, 5, 6, 7].map(i => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : data && (
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
          <SummaryCard
            title="Mensagens"
            value={data.summary.totalMessages}
            icon={<MessageSquare className="h-5 w-5 text-blue-500" />}
          />
          <SummaryCard
            title="Triggers"
            value={data.summary.totalTriggers}
            icon={<Target className="h-5 w-5 text-purple-500" />}
          />
          <SummaryCard
            title="Ações OK"
            value={data.summary.totalSuccess}
            icon={<CheckCircle2 className="h-5 w-5 text-green-500" />}
          />
          <SummaryCard
            title="Erros"
            value={data.summary.totalErrors}
            icon={<XCircle className="h-5 w-5 text-red-500" />}
          />
          <SummaryCard
            title="Taxa Sucesso"
            value={`${data.summary.successRate}%`}
            icon={<TrendingUp className="h-5 w-5 text-emerald-500" />}
          />
          <SummaryCard
            title="Taxa Erro"
            value={`${data.summary.errorRate}%`}
            icon={<AlertTriangle className="h-5 w-5 text-orange-500" />}
          />
          <SummaryCard
            title="Tempo Médio"
            value={`${(data.summary.avgDuration / 1000).toFixed(1)}s`}
            icon={<Clock className="h-5 w-5 text-cyan-500" />}
          />
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="overview">
            <Activity className="h-4 w-4 mr-1" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="logs">
            <Zap className="h-4 w-4 mr-1" />
            Logs ({data?.logs.length || 0})
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="h-4 w-4 mr-1" />
            Usuários
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Daily Chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Atividade Diária (30 dias)</CardTitle>
                <CardDescription>Mensagens, triggers e erros por dia</CardDescription>
              </CardHeader>
              <CardContent>
                {dailyChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={dailyChartData}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="date" fontSize={11} />
                      <YAxis fontSize={11} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="Mensagens" fill="hsl(var(--chart-1))" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="Triggers" fill="hsl(var(--chart-2))" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="Sucessos" fill="hsl(var(--chart-3))" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="Erros" fill="hsl(var(--destructive))" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    Nenhum dado disponível
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Trigger Distribution */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Distribuição de Triggers</CardTitle>
                <CardDescription>Quais triggers foram mais ativadas</CardDescription>
              </CardHeader>
              <CardContent>
                {triggerPieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={triggerPieData}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        dataKey="value"
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        labelLine={false}
                        fontSize={11}
                      >
                        {triggerPieData.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    Nenhum dado disponível
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Markers and Triggers table */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Triggers mais ativadas</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Trigger</TableHead>
                      <TableHead className="text-right">Vezes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(data?.triggerCounts || []).map(t => (
                      <TableRow key={t.name}>
                        <TableCell className="font-medium">{t.name}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="secondary">{t.count}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(data?.triggerCounts || []).length === 0 && (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center text-muted-foreground py-8">
                          Nenhuma trigger registrada
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Marcadores processados</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Marcador</TableHead>
                      <TableHead className="text-right">Vezes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(data?.markerCounts || []).map(m => (
                      <TableRow key={m.marker}>
                        <TableCell className="font-mono text-xs">{m.marker}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="secondary">{m.count}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(data?.markerCounts || []).length === 0 && (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center text-muted-foreground py-8">
                          Nenhum marcador registrado
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Logs de Atividade</CardTitle>
              <CardDescription>Histórico detalhado de todas as interações do chat</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-auto max-h-[600px]">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                      <TableHead className="w-[140px]">Data/Hora</TableHead>
                      <TableHead className="w-[130px]">Tipo</TableHead>
                      <TableHead>Trigger</TableHead>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Detalhes</TableHead>
                      <TableHead className="w-[80px] text-right">Tempo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(data?.logs || []).map(log => (
                      <TableRow
                        key={log.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                      >
                        <TableCell className="text-xs whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleDateString("pt-BR")}{" "}
                          {new Date(log.createdAt).toLocaleTimeString("pt-BR")}
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${TYPE_COLORS[log.type] || "bg-gray-100 text-gray-600"}`}>
                            {TYPE_LABELS[log.type] || log.type}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm">{log.triggerName || "-"}</TableCell>
                        <TableCell className="text-sm">{log.user?.name || "-"}</TableCell>
                        <TableCell className="text-sm max-w-[300px] truncate">
                          {log.errorMessage
                            ? <span className="text-red-500">{log.errorMessage.substring(0, 80)}</span>
                            : log.actionResult
                              ? log.actionResult.substring(0, 80)
                              : log.userMessage
                                ? log.userMessage.substring(0, 80)
                                : "-"
                          }
                        </TableCell>
                        <TableCell className="text-right text-xs">
                          {log.duration ? `${(log.duration / 1000).toFixed(1)}s` : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                    {(data?.logs || []).length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                          Nenhum log registrado ainda. Os logs começam a ser coletados após enviar mensagens no chat.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Expanded Log Detail */}
          {expandedLog && data?.logs && (() => {
            const log = data.logs.find(l => l.id === expandedLog)
            if (!log) return null
            return (
              <Card className="mt-4 border-primary/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    Detalhes do Log
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${TYPE_COLORS[log.type]}`}>
                      {TYPE_LABELS[log.type]}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <span className="font-medium text-muted-foreground">Chat:</span>{" "}
                      {log.chat?.title || log.chatId}
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">Usuário:</span>{" "}
                      {log.user?.name} ({log.user?.email})
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">Trigger:</span>{" "}
                      {log.triggerName || "Nenhuma"}
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">Score:</span>{" "}
                      {log.score ?? "N/A"}
                    </div>
                    {log.marker && (
                      <div>
                        <span className="font-medium text-muted-foreground">Marcador:</span>{" "}
                        <code className="bg-muted px-1 rounded text-xs">{log.marker}</code>
                      </div>
                    )}
                    {log.duration && (
                      <div>
                        <span className="font-medium text-muted-foreground">Duração:</span>{" "}
                        {(log.duration / 1000).toFixed(2)}s
                      </div>
                    )}
                  </div>
                  {log.userMessage && (
                    <div>
                      <span className="font-medium text-muted-foreground block mb-1">Mensagem do usuário:</span>
                      <div className="bg-muted rounded-lg p-3 text-sm whitespace-pre-wrap max-h-40 overflow-auto">
                        {log.userMessage}
                      </div>
                    </div>
                  )}
                  {log.aiResponse && (
                    <div>
                      <span className="font-medium text-muted-foreground block mb-1">Resposta da IA:</span>
                      <div className="bg-muted rounded-lg p-3 text-sm whitespace-pre-wrap max-h-40 overflow-auto">
                        {log.aiResponse}
                      </div>
                    </div>
                  )}
                  {log.actionResult && (
                    <div>
                      <span className="font-medium text-muted-foreground block mb-1">Resultado da ação:</span>
                      <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-sm whitespace-pre-wrap max-h-40 overflow-auto">
                        {log.actionResult}
                      </div>
                    </div>
                  )}
                  {log.errorMessage && (
                    <div>
                      <span className="font-medium text-muted-foreground block mb-1">Erro:</span>
                      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm whitespace-pre-wrap max-h-40 overflow-auto">
                        {log.errorMessage}
                      </div>
                    </div>
                  )}
                  {log.metadata && Object.keys(log.metadata).length > 0 && (
                    <div>
                      <span className="font-medium text-muted-foreground block mb-1">Metadata:</span>
                      <pre className="bg-muted rounded-lg p-3 text-xs overflow-auto max-h-40">
                        {JSON.stringify(log.metadata, null, 2)}
                      </pre>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })()}
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Top Usuários</CardTitle>
              <CardDescription>Usuários que mais utilizam o chat</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-right">Mensagens</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(data?.topUsers || []).map((u, i) => (
                    <TableRow key={u.user.idUser}>
                      <TableCell className="font-medium">{i + 1}</TableCell>
                      <TableCell>{u.user.name}</TableCell>
                      <TableCell className="text-muted-foreground">{u.user.email}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary">{u.messageCount}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(data?.topUsers || []).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        Nenhum dado de usuário disponível
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function SummaryCard({
  title,
  value,
  icon,
}: {
  title: string
  value: string | number
  icon: React.ReactNode
}) {
  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center justify-between mb-1">
          {icon}
        </div>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{title}</p>
      </CardContent>
    </Card>
  )
}
