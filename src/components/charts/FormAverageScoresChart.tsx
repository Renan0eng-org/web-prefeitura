"use client"

import React, { useEffect, useState } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAlert } from "@/hooks/use-alert"
import api from "@/services/api"
import { Loader2 } from "lucide-react"

interface DateRange {
  from?: Date
  to?: Date
}

interface FormAverageData {
  id: string
  name: string
  averageScore: number
  minScore: number
  maxScore: number
  responseCount: number
  [key: string]: string | number
}

interface FormAverageScoresChartProps {
  title?: string
  description?: string
  dateRange?: DateRange
}

export function FormAverageScoresChart({
  title = "Média de Notas por Formulário",
  description = "Visualize a média, mínima e máxima de notas de cada formulário",
  dateRange,
}: FormAverageScoresChartProps) {
  const [data, setData] = useState<FormAverageData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { setAlert } = useAlert()

  const tooltipStyle = {
    backgroundColor: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: 8,
    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
    color: "#0f172a",
  }

  const fetchData = React.useCallback(async () => {
    try {
      setIsLoading(true)
      const params: any = {}

      if (dateRange?.from) {
        params.from = dateRange.from.toISOString()
      }
      if (dateRange?.to) {
        params.to = dateRange.to.toISOString()
      }

      const response = await api.get("/admin-dash/forms/statistics/average-scores", { params })
      const scoreData = response.data?.data ?? response.data ?? []

      const formattedData = Array.isArray(scoreData)
        ? scoreData.map((item: any) => ({
            id: item.id || item.formId || "",
            name: item.title || item.name || `Formulário ${item.formId}`,
            averageScore: item.averageScore ? parseFloat(item.averageScore.toFixed(2)) : 0,
            minScore: item.minScore ? parseFloat(item.minScore.toFixed(2)) : 0,
            maxScore: item.maxScore ? parseFloat(item.maxScore.toFixed(2)) : 0,
            responseCount: item.responseCount || item.count || 0,
          }))
        : []

      setData(formattedData)
    } catch (error) {
      console.error("Erro ao buscar médias de notas:", error)
      setAlert("Erro ao carregar estatísticas de notas", "error")
    } finally {
      setIsLoading(false)
    }
  }, [dateRange])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const getBarColor = (score: number) => {
    if (score >= 8) return "#10b981" // verde
    if (score >= 6) return "#f59e0b" // amarelo
    return "#ef4444" // vermelho
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    )
  }
  return (
    <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-96 text-muted-foreground">
            Nenhum dado disponível
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={data}
                margin={{ top: 20, right: 30, left: 0, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  interval={0}
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  domain={[0, 10]}
                  label={{ value: "Pontuação (0-10)", angle: -90, position: "insideLeft" }}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  labelStyle={{ color: "#0f172a", fontWeight: 600 }}
                  formatter={(value: any) => {
                    if (typeof value === "number") {
                      return value.toFixed(2)
                    }
                    return value
                  }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload
                      return (
                        <div className="bg-white text-slate-900 p-3 rounded-lg border border-slate-200 shadow-lg">
                          <p className="font-semibold">{data.name}</p>
                          <p className="text-sm">Média: {data.averageScore}</p>
                          <p className="text-sm">Mín: {data.minScore}</p>
                          <p className="text-sm">Máx: {data.maxScore}</p>
                          <p className="text-sm">Respostas: {data.responseCount}</p>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Legend />
                <Bar
                  dataKey="averageScore"
                  fill="#3b82f6"
                  name="Média de Notas"
                  radius={[8, 8, 0, 0]}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getBarColor(entry.averageScore)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </>
        )}
      </CardContent>
    </Card>
  )
}
