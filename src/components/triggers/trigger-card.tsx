"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Trigger } from "@/types/trigger"
import { ChevronDown, ChevronUp, Code, Settings2, Trash2 } from "lucide-react"

interface TriggerCardProps {
  trigger: Trigger
  onToggle: (id: string) => void
  onEdit: (trigger: Trigger) => void
  onDelete?: (id: string) => void
  isExpanded: boolean
  onToggleExpand: () => void
}

export function TriggerCard({ 
  trigger, 
  onToggle, 
  onEdit,
  onDelete,
  isExpanded, 
  onToggleExpand 
}: TriggerCardProps) {
  return (
    <Card className={`transition-all duration-200 ${!trigger.active ? 'opacity-60' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                {trigger.name}
                <Badge variant={trigger.active ? "default" : "secondary"}>
                  {trigger.active ? "Ativa" : "Inativa"}
                </Badge>
                {trigger.markers && trigger.markers.length > 0 && (
                  <Badge variant="outline" className="text-xs">
                    <Code className="h-3 w-3 mr-1" />
                    {trigger.markers.length} marker{trigger.markers.length > 1 ? 's' : ''}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="mt-1">
                {trigger.description || `ID: ${trigger.triggerId}`}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={trigger.active}
              onCheckedChange={() => onToggle(trigger.id)}
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(trigger)}
            >
              <Settings2 className="h-4 w-4" />
            </Button>
            {onDelete && trigger.triggerId !== 'default' && (
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive"
                onClick={() => onDelete(trigger.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleExpand}
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
            <div className="text-sm">
              <span className="text-muted-foreground">ID:</span>
              <p className="font-mono text-xs">{trigger.triggerId}</p>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Score Mínimo:</span>
              <p className="font-semibold">{trigger.minScore}</p>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Prioridade:</span>
              <p className="font-semibold">{trigger.priority}</p>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Pode Empilhar:</span>
              <p className="font-semibold">{trigger.canStack ? "Sim" : "Não"}</p>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Temperatura:</span>
              <p className="font-semibold">{trigger.temperature ?? "Herdada"}</p>
            </div>
          </div>
          
          {/* Keywords */}
          <div className="mb-4">
            <p className="text-sm text-muted-foreground mb-2">
              Palavras-chave ({trigger.keywords.length}):
            </p>
            <div className="flex flex-wrap gap-2">
              {trigger.keywords.slice(0, 15).map((kw, idx) => (
                <Badge 
                  key={idx} 
                  variant="outline"
                  className="text-xs"
                >
                  {kw.word} 
                  <span className="ml-1 text-muted-foreground">({kw.weight})</span>
                </Badge>
              ))}
              {trigger.keywords.length > 15 && (
                <Badge variant="outline" className="text-xs">
                  +{trigger.keywords.length - 15} mais
                </Badge>
              )}
            </div>
          </div>

          {/* Markers */}
          {trigger.markers && trigger.markers.length > 0 && (
            <div className="mb-4">
              <p className="text-sm text-muted-foreground mb-2">
                Marcadores:
              </p>
              <div className="flex flex-wrap gap-2">
                {trigger.markers.map((marker, idx) => (
                  <Badge 
                    key={idx} 
                    variant="secondary"
                    className="text-xs font-mono"
                  >
                    {marker}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Prompt preview */}
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              Prompt (preview):
            </p>
            <div className="bg-muted/50 rounded p-3 text-xs font-mono max-h-32 overflow-y-auto">
              {trigger.systemPrompt.substring(0, 300)}
              {trigger.systemPrompt.length > 300 && "..."}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
