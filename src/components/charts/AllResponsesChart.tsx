"use client"

import React, { useEffect, useState } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAlert } from "@/hooks/use-alert"
import api from "@/services/api"
import { Loader2 } from "lucide-react"

interface DateRange {
  from?: Date
  to?: Date
}

interface AllResponsesData {
  date: string
  totalResponses: number
  averageScore: number
  [key: string]: string | number
}

interface AllResponsesChartProps {
  title?: string
  description?: string
  dateRange?: DateRange
  groupBy?: "day" | "week" | "month"
}

export function AllResponsesChart({
  title = "Histórico de Todas as Respostas",
  description = "Evolução do número de respostas e média de notas ao longo do tempo",
  dateRange,
  groupBy = "day",
}: AllResponsesChartProps) {
  const [data, setData] = useState<AllResponsesData[]>([])
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
      const params: any = { groupBy }

      if (dateRange?.from) {
        params.from = dateRange.from.toISOString()
      }
      if (dateRange?.to) {
        params.to = dateRange.to.toISOString()
      }

      const response = await api.get("/admin-dash/forms/responses/timeline", { params })
      const timelineData = response.data?.data ?? response.data ?? []

      const formattedData = Array.isArray(timelineData)
        ? timelineData.map((item: any) => ({
            date: item.date || item.period || new Date().toISOString().split("T")[0],
            totalResponses: item.totalResponses || item.count || 0,
            averageScore: item.averageScore ? parseFloat(item.averageScore.toFixed(2)) : 0,
          }))
        : []

      setData(formattedData)
    } catch (error) {
      console.error("Erro ao buscar histórico de respostas:", error)
      setAlert("Erro ao carregar histórico de respostas", "error")
    } finally {
      setIsLoading(false)
    }
  }, [dateRange, groupBy])

  useEffect(() => {
    fetchData()
  }, [fetchData])

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
            <LineChart
              data={data}
              margin={{ top: 20, right: 30, left: 0, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                angle={-45}
                textAnchor="end"
                height={100}
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => {
                  const date = new Date(value)
                  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
                }}
              />
              <YAxis yAxisId="left" label={{ value: "Total de Respostas", angle: -90, position: "insideLeft" }} />
              <YAxis
                yAxisId="right"
                orientation="right"
                domain={[0, 10]}
                label={{ value: "Média de Notas", angle: 90, position: "insideRight" }}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                labelStyle={{ color: "#0f172a", fontWeight: 600 }}
                labelFormatter={(value) => {
                  const date = new Date(value)
                  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
                }}
                formatter={(value: any) => {
                  if (typeof value === "number") {
                    return value.toFixed(2)
                  }
                  return value
                }}
              />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="totalResponses"
                stroke="#3b82f6"
                name="Total de Respostas"
                strokeWidth={2}
                dot={{ fill: "#3b82f6", r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="averageScore"
                stroke="#10b981"
                name="Média de Notas"
                strokeWidth={2}
                dot={{ fill: "#10b981", r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
