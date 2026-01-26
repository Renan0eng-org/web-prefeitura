"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Agent } from "@/types/trigger"
import { Bot, Check, Pencil, Trash2 } from "lucide-react"

interface AgentCardProps {
  agent: Agent
  isSelected: boolean
  onSelect: () => void
  onEdit: () => void
  onDelete: () => void
}

export function AgentCard({
  agent,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
}: AgentCardProps) {
  return (
    <Card 
      className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
        isSelected ? 'ring-2 ring-primary' : ''
      } ${!agent.active ? 'opacity-60' : ''}`}
      onClick={onSelect}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">{agent.name}</CardTitle>
          </div>
          <div className="flex items-center gap-1">
            {agent.isDefault && (
              <Badge variant="secondary" className="text-xs">
                Padrão
              </Badge>
            )}
            {isSelected && (
              <Badge variant="default" className="text-xs">
                <Check className="h-3 w-3 mr-1" />
                Selecionado
              </Badge>
            )}
          </div>
        </div>
        {agent.description && (
          <CardDescription className="text-xs mt-1">
            {agent.description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <div className="flex gap-4 text-xs text-muted-foreground">
            <span>Modelo: <span className="font-mono">{agent.model}</span></span>
            <span>Triggers: {agent.triggers?.length || 0}</span>
          </div>
          <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit}>
              <Pencil className="h-3 w-3" />
            </Button>
            {!agent.isDefault && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 text-destructive" 
                onClick={onDelete}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
