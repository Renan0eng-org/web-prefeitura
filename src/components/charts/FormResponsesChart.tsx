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

interface FormResponseData {
  name: string
  responses: number
  averageScore: number
  [key: string]: string | number
}

interface FormResponsesChartProps {
  title?: string
  description?: string
  dateRange?: DateRange
  formId?: string
}

export function FormResponsesChart({
  title = "Distribuição de Respostas e Notas",
  description = "Visualize o número de respostas e média de notas por formulário",
  dateRange,
  formId,
}: FormResponsesChartProps) {
  const [data, setData] = useState<FormResponseData[]>([])
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
      if (formId) {
        params.formId = formId
      }

      const response = await api.get("/admin-dash/forms/responses/statistics", { params })
      const statistics = response.data?.data ?? response.data ?? []

      const formattedData = Array.isArray(statistics)
        ? statistics.map((item: any) => ({
            name: item.formTitle || item.title || `Formulário ${item.formId}`,
            responses: item.responseCount || item.count || 0,
            averageScore: item.averageScore ? parseFloat(item.averageScore.toFixed(2)) : 0,
          }))
        : []

      setData(formattedData)
    } catch (error) {
      console.error("Erro ao buscar dados de respostas:", error)
      setAlert("Erro ao carregar estatísticas de respostas", "error")
    } finally {
      setIsLoading(false)
    }
  }, [dateRange, formId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const COLORS = ["#3b82f6", "#10b981"]

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
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={100}
                interval={0}
                tick={{ fontSize: 12 }}
              />
              <YAxis yAxisId="left" label={{ value: "Respostas", angle: -90, position: "insideLeft" }} />
              <YAxis
                yAxisId="right"
                orientation="right"
                label={{ value: "Média de Notas", angle: 90, position: "insideRight" }}
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
              />
              <Legend />
              <Bar yAxisId="left" dataKey="responses" fill={COLORS[0]} name="Total de Respostas" />
              <Bar yAxisId="right" dataKey="averageScore" fill={COLORS[1]} name="Média de Notas" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
