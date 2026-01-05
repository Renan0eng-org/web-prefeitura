"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  FormResponsesChart,
  FormsByOriginChart,
  TopFormulariosChart,
  FormAverageScoresChart,
  AllResponsesChart,
} from "@/components/charts"

interface DateRange {
  from?: Date
  to?: Date
}

/**
 * Exemplo de página que utiliza os componentes de gráficos
 * Você pode copiar e adaptar este arquivo para usar em outras telas
 */
export function ExemploUsoGraficos() {
  const [selectedFormId, setSelectedFormId] = useState<string>("")
  const [dateRange, setDateRange] = useState<DateRange>()

  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-4xl font-bold mb-2">Exemplos de Uso dos Gráficos</h1>
        <p className="text-muted-foreground">
          Esta página demonstra como usar os componentes de gráficos em diferentes contextos
        </p>
      </div>

      {/* Exemplo 1: Gráfico Simples */}
      <Card>
        <CardHeader>
          <CardTitle>Exemplo 1: Gráfico Simples</CardTitle>
          <CardDescription>
            Usar um gráfico com configurações padrão
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 p-4 bg-muted rounded">
            <code className="text-sm">
              &lt;FormResponsesChart /&gt;
            </code>
          </div>
          <FormResponsesChart />
        </CardContent>
      </Card>

      {/* Exemplo 2: Gráfico com Interatividade */}
      <Card>
        <CardHeader>
          <CardTitle>Exemplo 2: Gráfico Interativo</CardTitle>
          <CardDescription>
            Clique no gráfico para selecionar um formulário
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 p-4 bg-muted rounded">
            <code className="text-sm">
              &lt;TopFormulariosChart onFormSelect=&#123;(id, name) =&gt; ...&#125; /&gt;
            </code>
          </div>
          {selectedFormId && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
              <p className="text-sm"><strong>Formulário selecionado:</strong> {selectedFormId}</p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setSelectedFormId("")}
                className="mt-2"
              >
                Limpar Seleção
              </Button>
            </div>
          )}
          <TopFormulariosChart
            onFormSelect={(id) => setSelectedFormId(id)}
          />
        </CardContent>
      </Card>

      {/* Exemplo 3: Gráfico com Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Exemplo 3: Gráfico com Período</CardTitle>
          <CardDescription>
            Passar intervalo de datas como filtro
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 p-4 bg-muted rounded">
            <code className="text-sm">
              &lt;AllResponsesChart dateRange=&#123;dateRange&#125; groupBy="week" /&gt;
            </code>
          </div>
          <AllResponsesChart
            dateRange={dateRange}
            groupBy="week"
          />
        </CardContent>
      </Card>

      {/* Exemplo 4: Gráfico Focado em Formulário */}
      <Card>
        <CardHeader>
          <CardTitle>Exemplo 4: Gráfico Focado</CardTitle>
          <CardDescription>
            Mostrar dados de um formulário específico
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 p-4 bg-muted rounded">
            <code className="text-sm">
              &lt;FormAverageScoresChart selectedFormId=&#123;formId&#125; /&gt;
            </code>
          </div>
          {selectedFormId && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded">
              <p className="text-sm">
                Exibindo dados do formulário: <strong>{selectedFormId}</strong>
              </p>
            </div>
          )}
          <FormAverageScoresChart
            selectedFormId={selectedFormId}
          />
        </CardContent>
      </Card>

      {/* Exemplo 5: Grid de Gráficos */}
      <Card>
        <CardHeader>
          <CardTitle>Exemplo 5: Grid de Gráficos</CardTitle>
          <CardDescription>
            Combinar múltiplos gráficos em uma grade
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <FormsByOriginChart title="Por Origem" />
            <FormAverageScoresChart title="Média de Notas" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ExemploUsoGraficos
