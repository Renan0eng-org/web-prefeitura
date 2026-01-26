"use client"

import {
    AgentCard,
    AgentEditDialog,
    TriggerCard,
    TriggerEditDialog,
    TriggerLogsTerminal,
    TriggerStatsCards,
    TriggerTester,
} from "@/components/triggers"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAlert } from "@/hooks/use-alert"
import { useAuth } from "@/hooks/use-auth"
import api from "@/services/api"
import { Agent, Trigger, TriggerStats, TriggerTestResult } from "@/types/trigger"
import { Bot, Plus, RefreshCw } from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react"

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://prefeitura.back.renannardi.com'

export default function TriggersAdminPage() {
  // Agents state
  const [agents, setAgents] = useState<Agent[]>([])
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null)
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null)
  const [isAgentDialogOpen, setIsAgentDialogOpen] = useState(false)
  const [isCreatingAgent, setIsCreatingAgent] = useState(false)

  // Triggers state
  const [triggers, setTriggers] = useState<Trigger[]>([])
  const [stats, setStats] = useState<TriggerStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [expandedTriggers, setExpandedTriggers] = useState<Set<string>>(new Set())
  const [editingTrigger, setEditingTrigger] = useState<Trigger | null>(null)
  const [isTriggerDialogOpen, setIsTriggerDialogOpen] = useState(false)
  const [isCreatingTrigger, setIsCreatingTrigger] = useState(false)

  const { getPermissions, loading: authLoading } = useAuth()
  const { setAlert } = useAlert()

  const permissions = useMemo(
    () => getPermissions("chat-ai-admin"),
    [getPermissions]
  )

  const selectedAgent = useMemo(
    () => agents.find(a => a.id === selectedAgentId) || null,
    [agents, selectedAgentId]
  )

  // Fetch agents
  const fetchAgents = useCallback(async () => {
    try {
      const response = await api.get('/triggers/agents')
      setAgents(response.data)
      
      // Select default agent if none selected
      if (!selectedAgentId && response.data.length > 0) {
        const defaultAgent = response.data.find((a: Agent) => a.isDefault) || response.data[0]
        setSelectedAgentId(defaultAgent.id)
      }
    } catch (error) {
      console.error("Erro ao buscar agentes:", error)
      setAlert("Não foi possível carregar os agentes.", "error")
    }
  }, [selectedAgentId, setAlert])

  // Fetch triggers for selected agent
  const fetchTriggers = useCallback(async () => {
    if (!selectedAgentId) return
    
    try {
      setIsLoading(true)
      const [triggersRes, statsRes] = await Promise.all([
        api.get(`/triggers?agentId=${selectedAgentId}`),
        api.get(`/triggers/stats?agentId=${selectedAgentId}`),
      ])
      setTriggers(triggersRes.data)
      setStats(statsRes.data)
    } catch (error) {
      console.error("Erro ao buscar triggers:", error)
      setAlert("Não foi possível carregar as triggers.", "error")
    } finally {
      setIsLoading(false)
    }
  }, [selectedAgentId, setAlert])

  useEffect(() => {
    if (!authLoading && permissions?.visualizar) {
      fetchAgents()
    }
  }, [authLoading, permissions, fetchAgents])

  useEffect(() => {
    if (selectedAgentId) {
      fetchTriggers()
    }
  }, [selectedAgentId, fetchTriggers])

  // Agent handlers
  const handleCreateAgent = () => {
    setEditingAgent(null)
    setIsCreatingAgent(true)
    setIsAgentDialogOpen(true)
  }

  const handleEditAgent = (agent: Agent) => {
    setEditingAgent(agent)
    setIsCreatingAgent(false)
    setIsAgentDialogOpen(true)
  }

  const handleSaveAgent = async (data: Partial<Agent>) => {
    try {
      if (isCreatingAgent) {
        await api.post('/triggers/agents', data)
        setAlert("Agente criado com sucesso!", "success")
      } else if (editingAgent) {
        await api.patch(`/triggers/agents/${editingAgent.id}`, data)
        setAlert("Agente atualizado com sucesso!", "success")
      }
      await fetchAgents()
    } catch (error) {
      console.error("Erro ao salvar agente:", error)
      setAlert("Não foi possível salvar o agente.", "error")
    }
  }

  const handleDeleteAgent = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este agente? Todas as triggers serão removidas.")) {
      return
    }
    try {
      await api.delete(`/triggers/agents/${id}`)
      setAlert("Agente excluído com sucesso!", "success")
      if (selectedAgentId === id) {
        setSelectedAgentId(null)
      }
      await fetchAgents()
    } catch (error) {
      console.error("Erro ao excluir agente:", error)
      setAlert("Não foi possível excluir o agente.", "error")
    }
  }

  // Trigger handlers
  const handleCreateTrigger = () => {
    setEditingTrigger(null)
    setIsCreatingTrigger(true)
    setIsTriggerDialogOpen(true)
  }

  const handleToggleTrigger = async (triggerId: string) => {
    try {
      await api.post(`/triggers/${triggerId}/toggle`)
      await fetchTriggers()
      setAlert("Trigger atualizada com sucesso!", "success")
    } catch (error) {
      console.error("Erro ao alternar trigger:", error)
      setAlert("Não foi possível alterar a trigger.", "error")
    }
  }

  const handleEditTrigger = (trigger: Trigger) => {
    setEditingTrigger(trigger)
    setIsCreatingTrigger(false)
    setIsTriggerDialogOpen(true)
  }

  const handleSaveTrigger = async (id: string, data: Partial<Trigger>) => {
    try {
      if (isCreatingTrigger) {
        await api.post('/triggers', data)
        setAlert("Trigger criada com sucesso!", "success")
      } else {
        await api.patch(`/triggers/${id}`, data)
        setAlert("Trigger salva com sucesso!", "success")
      }
      await fetchTriggers()
    } catch (error) {
      console.error("Erro ao salvar trigger:", error)
      setAlert("Não foi possível salvar a trigger.", "error")
    }
  }

  const handleDeleteTrigger = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta trigger?")) {
      return
    }
    try {
      await api.delete(`/triggers/${id}`)
      setAlert("Trigger excluída com sucesso!", "success")
      await fetchTriggers()
    } catch (error) {
      console.error("Erro ao excluir trigger:", error)
      setAlert("Não foi possível excluir a trigger.", "error")
    }
  }

  const handleToggleExpand = (triggerId: string) => {
    setExpandedTriggers((prev) => {
      const next = new Set(prev)
      if (next.has(triggerId)) {
        next.delete(triggerId)
      } else {
        next.add(triggerId)
      }
      return next
    })
  }

  const handleTestTrigger = async (message: string): Promise<TriggerTestResult> => {
    const response = await api.post('/triggers/test', { 
      message,
      agentId: selectedAgentId 
    })
    return response.data
  }

  if (authLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
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

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gerenciamento de IA</h1>
          <p className="text-muted-foreground">
            Configure agentes e triggers do sistema de chat com IA.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => { fetchAgents(); fetchTriggers(); }} variant="outline" disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={handleCreateAgent}>
                <Bot className="h-4 w-4 mr-2" />
                Novo Agente
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleCreateTrigger} disabled={!selectedAgentId}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Trigger
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Agents Grid */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Agentes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              isSelected={selectedAgentId === agent.id}
              onSelect={() => setSelectedAgentId(agent.id)}
              onEdit={() => handleEditAgent(agent)}
              onDelete={() => handleDeleteAgent(agent.id)}
            />
          ))}
        </div>
      </div>

      {selectedAgent && (
        <>
          {/* Stats Cards */}
          <TriggerStatsCards stats={stats} isLoading={isLoading} />

          {/* Tabs */}
          <Tabs defaultValue="triggers" className="space-y-4">
            <TabsList>
              <TabsTrigger value="triggers">
                Triggers ({triggers.length})
              </TabsTrigger>
              <TabsTrigger value="tester">Testador</TabsTrigger>
              <TabsTrigger value="logs">Logs</TabsTrigger>
            </TabsList>

            <TabsContent value="triggers" className="space-y-4">
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-32" />
                  ))}
                </div>
              ) : triggers.length === 0 ? (
                <div className="text-center py-12 border rounded-lg">
                  <p className="text-muted-foreground mb-4">
                    Nenhuma trigger cadastrada para este agente.
                  </p>
                  <Button onClick={handleCreateTrigger}>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Trigger
                  </Button>
                </div>
              ) : (
                triggers
                  .sort((a, b) => a.priority - b.priority)
                  .map((trigger) => (
                    <TriggerCard
                      key={trigger.id}
                      trigger={trigger}
                      onToggle={handleToggleTrigger}
                      onEdit={handleEditTrigger}
                      onDelete={handleDeleteTrigger}
                      isExpanded={expandedTriggers.has(trigger.id)}
                      onToggleExpand={() => handleToggleExpand(trigger.id)}
                    />
                  ))
              )}
            </TabsContent>

            <TabsContent value="tester">
              <TriggerTester onTest={handleTestTrigger} />
            </TabsContent>

            <TabsContent value="logs">
              <TriggerLogsTerminal apiUrl={API_URL} />
            </TabsContent>
          </Tabs>
        </>
      )}

      {/* Agent Edit Dialog */}
      <AgentEditDialog
        agent={editingAgent}
        open={isAgentDialogOpen}
        onOpenChange={setIsAgentDialogOpen}
        onSave={handleSaveAgent}
        isCreating={isCreatingAgent}
      />

      {/* Trigger Edit Dialog */}
      <TriggerEditDialog
        trigger={editingTrigger}
        open={isTriggerDialogOpen}
        onOpenChange={setIsTriggerDialogOpen}
        onSave={handleSaveTrigger}
        isCreating={isCreatingTrigger}
        agentId={selectedAgentId || undefined}
      />
    </div>
  )
}
