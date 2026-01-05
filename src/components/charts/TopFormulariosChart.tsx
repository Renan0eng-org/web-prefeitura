"use client"

import React, { useEffect, useState } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAlert } from "@/hooks/use-alert"
import api from "@/services/api"
import { Loader2 } from "lucide-react"

interface DateRange {
  from?: Date
  to?: Date
}

interface TopFormData {
  id: string
  name: string
  responseCount: number
  [key: string]: string | number
}

interface TopFormulariosChartProps {
  title?: string
  description?: string
  limit?: number
  dateRange?: DateRange
}

export function TopFormulariosChart({
  title = "Formulários Mais Respondidos",
  description = "Top 10 formulários com mais respostas",
  limit = 10,
  dateRange,
}: TopFormulariosChartProps) {
  const [data, setData] = useState<TopFormData[]>([])
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
      const params: any = { limit }

      if (dateRange?.from) {
        params.from = dateRange.from.toISOString()
      }
      if (dateRange?.to) {
        params.to = dateRange.to.toISOString()
      }

      const response = await api.get("/admin-dash/forms/statistics/top-forms", { params })
      const topForms = response.data?.data ?? response.data ?? []

      const formattedData = Array.isArray(topForms)
        ? topForms.map((item: any) => ({
            id: item.id || item.formId || "",
            name: item.title || item.name || `Formulário ${item.formId}`,
            responseCount: item.responseCount || item.count || 0,
          }))
        : []

      setData(formattedData)
    } catch (error) {
      console.error("Erro ao buscar top formulários:", error)
      setAlert("Erro ao carregar formulários mais respondidos", "error")
    } finally {
      setIsLoading(false)
    }
  }, [limit, dateRange])

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
              <YAxis label={{ value: "Número de Respostas", angle: -90, position: "insideLeft" }} />
              <Tooltip
                contentStyle={tooltipStyle}
                labelStyle={{ color: "#0f172a", fontWeight: 600 }}
                cursor={{ fill: "rgba(0, 0, 0, 0.1)" }}
              />
              <Bar dataKey="responseCount" fill="#3b82f6" name="Respostas" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
