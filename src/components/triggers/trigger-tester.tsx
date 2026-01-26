"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { TriggerTestResult } from "@/types/trigger"
import { FlaskConical, Loader2 } from "lucide-react"
import { useState } from "react"

interface TriggerTesterProps {
  onTest: (message: string) => Promise<TriggerTestResult>
}

export function TriggerTester({ onTest }: TriggerTesterProps) {
  const [testMessage, setTestMessage] = useState("")
  const [testResult, setTestResult] = useState<TriggerTestResult | null>(null)
  const [isTesting, setIsTesting] = useState(false)

  const handleTest = async () => {
    if (!testMessage.trim()) return
    
    setIsTesting(true)
    try {
      const result = await onTest(testMessage)
      setTestResult(result)
    } catch (error) {
      console.error("Erro ao testar trigger:", error)
    } finally {
      setIsTesting(false)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <FlaskConical className="h-5 w-5" />
          Testar Detecção de Trigger
        </CardTitle>
        <CardDescription>
          Digite uma mensagem para ver qual trigger seria ativada.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <Input
            placeholder="Digite uma mensagem de teste..."
            value={testMessage}
            onChange={(e) => setTestMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleTest()}
            className="flex-1"
          />
          <Button onClick={handleTest} disabled={isTesting || !testMessage.trim()}>
            {isTesting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Testar"
            )}
          </Button>
        </div>

        {testResult && (
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium">Resultado:</span>
              {testResult.trigger ? (
                <Badge variant="default">{testResult.trigger.name}</Badge>
              ) : (
                <Badge variant="secondary">Nenhuma trigger ativada</Badge>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              <span>Score: </span>
              <span className="font-mono">{testResult.score}</span>
            </div>
            {testResult.stackedTriggers && testResult.stackedTriggers.length > 0 && (
              <div className="mt-2">
                <span className="text-sm text-muted-foreground">Triggers empilhadas: </span>
                <div className="flex gap-1 mt-1">
                  {testResult.stackedTriggers.map((t) => (
                    <Badge key={t.id} variant="outline" className="text-xs">
                      {t.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
