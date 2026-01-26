"use client"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Agent } from "@/types/trigger"
import { useEffect, useState } from "react"

const AI_MODELS = [
  { value: "gpt-4o-mini", label: "GPT-4o Mini (Recomendado)" },
  { value: "gpt-4o", label: "GPT-4o" },
  { value: "gpt-4-turbo", label: "GPT-4 Turbo" },
  { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo" },
  { value: "claude-3-5-sonnet-latest", label: "Claude 3.5 Sonnet" },
  { value: "claude-3-opus-latest", label: "Claude 3 Opus" },
]

interface AgentEditDialogProps {
  agent: Agent | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (data: Partial<Agent>) => void
  isCreating?: boolean
}

export function AgentEditDialog({
  agent,
  open,
  onOpenChange,
  onSave,
  isCreating = false,
}: AgentEditDialogProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [model, setModel] = useState("gpt-4o-mini")
  const [temperature, setTemperature] = useState(0.7)
  const [maxTokens, setMaxTokens] = useState(2048)
  const [systemPrompt, setSystemPrompt] = useState("")
  const [active, setActive] = useState(true)
  const [isDefault, setIsDefault] = useState(false)

  useEffect(() => {
    if (agent) {
      setName(agent.name)
      setDescription(agent.description || "")
      setModel(agent.model)
      setTemperature(agent.temperature)
      setMaxTokens(agent.maxTokens)
      setSystemPrompt(agent.systemPrompt || "")
      setActive(agent.active)
      setIsDefault(agent.isDefault)
    } else if (isCreating) {
      setName("")
      setDescription("")
      setModel("gpt-4o-mini")
      setTemperature(0.7)
      setMaxTokens(2048)
      setSystemPrompt("")
      setActive(true)
      setIsDefault(false)
    }
  }, [agent, isCreating])

  const handleSave = () => {
    onSave({
      name,
      description: description || undefined,
      model,
      temperature,
      maxTokens,
      systemPrompt: systemPrompt || undefined,
      active,
      isDefault,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isCreating ? "Criar Novo Agente" : `Editar Agente: ${agent?.name}`}
          </DialogTitle>
          <DialogDescription>
            Configure as propriedades do agente de IA.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Nome e Descrição */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nome do agente"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="model">Modelo de IA</Label>
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o modelo" />
                </SelectTrigger>
                <SelectContent>
                  {AI_MODELS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição do agente"
            />
          </div>

          {/* Parâmetros */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="temperature">
                Temperatura ({temperature})
              </Label>
              <Input
                id="temperature"
                type="range"
                min={0}
                max={2}
                step={0.1}
                value={temperature}
                onChange={(e) => setTemperature(Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">
                0 = mais determinístico, 2 = mais criativo
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxTokens">Max Tokens</Label>
              <Input
                id="maxTokens"
                type="number"
                min={100}
                max={32000}
                value={maxTokens}
                onChange={(e) => setMaxTokens(Number(e.target.value))}
              />
            </div>
          </div>

          {/* System Prompt */}
          <div className="space-y-2">
            <Label htmlFor="systemPrompt">Prompt Base do Agente</Label>
            <Textarea
              id="systemPrompt"
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="Prompt de sistema que será usado como base..."
              rows={6}
            />
            <p className="text-xs text-muted-foreground">
              Este prompt será combinado com o prompt das triggers quando ativadas.
            </p>
          </div>

          {/* Switches */}
          <div className="flex items-center justify-between border-t pt-4">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  id="active"
                  checked={active}
                  onCheckedChange={setActive}
                />
                <Label htmlFor="active">Ativo</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="isDefault"
                  checked={isDefault}
                  onCheckedChange={setIsDefault}
                />
                <Label htmlFor="isDefault">Agente Padrão</Label>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!name.trim()}>
            {isCreating ? "Criar Agente" : "Salvar Alterações"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
