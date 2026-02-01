"use client"

import { Badge } from "@/components/ui/badge"
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
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useAlert } from "@/hooks/use-alert"
import api from "@/services/api"
import { Trigger, TriggerKeyword } from "@/types/trigger"
import { Loader2, Plus, Sparkles, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"


interface TriggerEditDialogProps {
  trigger: Trigger | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (id: string, data: Partial<Trigger>) => void
  isCreating?: boolean
  agentId?: string
}

export function TriggerEditDialog({
  trigger,
  open,
  onOpenChange,
  onSave,
  isCreating = false,
  agentId,
}: TriggerEditDialogProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [minScore, setMinScore] = useState(5)
  const [priority, setPriority] = useState(10)
  const [active, setActive] = useState(true)
  const [canStack, setCanStack] = useState(false)
  const [systemPrompt, setSystemPrompt] = useState("")
  const [temperature, setTemperature] = useState<number | null>(null)
  const [maxTokens, setMaxTokens] = useState<number | null>(null)
  const [markers, setMarkers] = useState<string[]>([])
  const [keywords, setKeywords] = useState<TriggerKeyword[]>([])
  const [newWord, setNewWord] = useState("")
  const [newWeight, setNewWeight] = useState(5)
  const [newMarker, setNewMarker] = useState("")
  const [isGeneratingKeywords, setIsGeneratingKeywords] = useState(false)

  const { setAlert } = useAlert()


  useEffect(() => {
    if (trigger) {
      setName(trigger.name)
      setDescription(trigger.description || "")
      setMinScore(trigger.minScore)
      setPriority(trigger.priority)
      setActive(trigger.active)
      setCanStack(trigger.canStack)
      setSystemPrompt(trigger.systemPrompt)
      setTemperature(trigger.temperature)
      setMaxTokens(trigger.maxTokens)
      setMarkers(trigger.markers || [])
      setKeywords([...trigger.keywords])
    } else if (isCreating) {
      setName("")
      setDescription("")
      setMinScore(5)
      setPriority(10)
      setActive(true)
      setCanStack(false)
      setSystemPrompt("")
      setTemperature(null)
      setMaxTokens(null)
      setMarkers([])
      setKeywords([])
    }
  }, [trigger, isCreating])

  const handleAddKeyword = () => {
    if (newWord.trim()) {
      setKeywords([...keywords, { word: newWord.trim(), weight: newWeight }])
      setNewWord("")
      setNewWeight(5)
    }
  }

  const handleRemoveKeyword = (index: number) => {
    setKeywords(keywords.filter((_, i) => i !== index))
  }

  const handleUpdateKeywordWeight = (index: number, weight: number) => {
    const updated = [...keywords]
    updated[index].weight = weight
    setKeywords(updated)
  }

  const handleAddMarker = () => {
    if (newMarker.trim() && !markers.includes(newMarker.trim())) {
      setMarkers([...markers, newMarker.trim()])
      setNewMarker("")
    }
  }

  const handleRemoveMarker = (index: number) => {
    setMarkers(markers.filter((_, i) => i !== index))
  }

  const handleGenerateKeywords = async () => {
    if (!name.trim()) {
      setAlert("Preencha o nome da trigger antes de gerar keywords", "warning")
      return
    }

    setIsGeneratingKeywords(true)
    try {
      const response = await api.post('/triggers/generate-keywords', {
        name,
        description,
        systemPrompt,
      })

      const generatedKeywords = response.data.keywords as TriggerKeyword[]

      // Filtrar keywords que já existem
      const existingWords = new Set(keywords.map(k => k.word.toLowerCase()))
      const newKeywords = generatedKeywords.filter(
        k => !existingWords.has(k.word.toLowerCase())
      )

      if (newKeywords.length > 0) {
        setKeywords([...keywords, ...newKeywords])
        setAlert(`${newKeywords.length} keywords geradas com sucesso!`, "success")
      } else {
        setAlert("Nenhuma keyword nova foi gerada", "info")
      }
    } catch (error) {
      console.error("Erro ao gerar keywords:", error)
      setAlert("Erro ao gerar keywords com IA", "error")
    } finally {
      setIsGeneratingKeywords(false)
    }
  }

  const handleSave = () => {
    const data: any = {
      name,
      description: description || undefined,
      minScore,
      priority,
      active,
      canStack,
      systemPrompt,
      temperature,
      maxTokens,
      markers,
      keywords: keywords.map(k => ({ word: k.word, weight: k.weight })),
    }

    if (isCreating) {
      data.agentId = agentId
    }

    onSave(trigger?.id || "", data)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isCreating ? "Criar Nova Trigger" : `Editar Trigger: ${trigger?.name}`}
          </DialogTitle>
          <DialogDescription>
            Configure os parâmetros de ativação e comportamento da trigger.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Básico</TabsTrigger>
            <TabsTrigger value="keywords">Keywords</TabsTrigger>
            <TabsTrigger value="prompt">Prompt</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4 mt-4">
            {/* Identificação */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nome da trigger"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descrição da trigger"
              />
            </div>

            {/* Configurações */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minScore">Score Mínimo</Label>
                <Input
                  id="minScore"
                  type="number"
                  min={0}
                  value={minScore}
                  onChange={(e) => setMinScore(Number(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">
                  Soma dos pesos necessária para ativar
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Prioridade</Label>
                <Input
                  id="priority"
                  type="number"
                  min={0}
                  value={priority}
                  onChange={(e) => setPriority(Number(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">
                  Menor = maior prioridade
                </p>
              </div>
            </div>

            {/* Switches */}
            <div className="flex items-center gap-6 border-t pt-4">
              <div className="flex items-center gap-2">
                <Switch checked={active} onCheckedChange={setActive} />
                <Label>Ativa</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={canStack} onCheckedChange={setCanStack} />
                <Label>Pode Empilhar</Label>
              </div>
            </div>

            {/* Marcadores */}
            <div className="space-y-2">
              <Label>Marcadores Especiais</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Ex: GERAR-FORM-159753"
                  value={newMarker}
                  onChange={(e) => setNewMarker(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddMarker()}
                />
                <Button onClick={handleAddMarker} size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {markers.map((marker, idx) => (
                  <Badge key={idx} variant="secondary" className="flex items-center gap-1">
                    <span className="font-mono text-xs">{marker}</span>
                    <button
                      onClick={() => handleRemoveMarker(idx)}
                      className="ml-1 hover:text-destructive"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Marcadores que indicam ações especiais na resposta da IA
              </p>
            </div>
          </TabsContent>

          <TabsContent value="keywords" className="space-y-4 mt-4">
            {/* Adicionar nova keyword */}
            <div className="flex gap-2">
              <Input
                placeholder="Nova palavra-chave"
                value={newWord}
                onChange={(e) => setNewWord(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddKeyword()}
                className="flex-1"
              />
              <Input
                type="number"
                min={1}
                max={20}
                value={newWeight}
                onChange={(e) => setNewWeight(Number(e.target.value))}
                className="w-20"
                placeholder="Peso"
              />
              <Button onClick={handleAddKeyword} size="icon">
                <Plus className="h-4 w-4" />
              </Button>
              <Button
                onClick={handleGenerateKeywords}
                variant="secondary"
                disabled={isGeneratingKeywords}
                title="Gerar keywords com IA"
              >
                {isGeneratingKeywords ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                <span className="ml-2 hidden sm:inline">Gerar com IA</span>
              </Button>
            </div>


            {/* Lista de keywords */}
            <div className="border rounded-lg p-3 max-h-72 overflow-y-auto space-y-2">
              {keywords.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma palavra-chave definida
                </p>
              ) : (
                keywords.map((kw, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 p-2 bg-muted/50 rounded"
                  >
                    <Badge variant="secondary" className="flex-1">
                      {kw.word}
                    </Badge>
                    <Input
                      type="number"
                      min={1}
                      max={20}
                      value={kw.weight}
                      onChange={(e) => handleUpdateKeywordWeight(idx, Number(e.target.value))}
                      className="w-20 h-8"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => handleRemoveKeyword(idx)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Total: {keywords.length} keywords |
              Soma máxima: {keywords.reduce((sum, k) => sum + k.weight, 0)}
            </p>
          </TabsContent>

          <TabsContent value="prompt" className="space-y-4 mt-4">
            {/* Parâmetros do modelo */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="temperature">
                  Temperatura {temperature !== null ? `(${temperature})` : "(herdado)"}
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="temperature"
                    type="number"
                    min={0}
                    max={2}
                    step={0.1}
                    value={temperature ?? ""}
                    onChange={(e) => setTemperature(e.target.value ? Number(e.target.value) : null)}
                    placeholder="Herdar do agente"
                  />
                  {temperature !== null && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setTemperature(null)}
                    >
                      Herdar
                    </Button>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxTokens">
                  Max Tokens {maxTokens !== null ? `(${maxTokens})` : "(herdado)"}
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="maxTokens"
                    type="number"
                    min={100}
                    max={32000}
                    value={maxTokens ?? ""}
                    onChange={(e) => setMaxTokens(e.target.value ? Number(e.target.value) : null)}
                    placeholder="Herdar do agente"
                  />
                  {maxTokens !== null && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setMaxTokens(null)}
                    >
                      Herdar
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* System Prompt */}
            <div className="space-y-2">
              <Label htmlFor="systemPrompt">System Prompt</Label>
              <Textarea
                id="systemPrompt"
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder="Prompt de sistema específico desta trigger..."
                rows={12}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Este prompt será usado quando a trigger for ativada.
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={!name.trim() || !systemPrompt.trim()}
          >
            {isCreating ? "Criar Trigger" : "Salvar Alterações"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
