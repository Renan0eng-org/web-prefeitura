"use client"

import React, { useEffect, useState } from "react"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAlert } from "@/hooks/use-alert"
import api from "@/services/api"
import { Loader2 } from "lucide-react"

interface DateRange {
  from?: Date
  to?: Date
}

interface OriginData {
  name: string
  value: number
  [key: string]: string | number
}

interface FormsByOriginChartProps {
  title?: string
  description?: string
  dateRange?: DateRange
}

const COLORS = ["#0088fe", "#00c49f", "#ffbb28", "#ff7c7c", "#8884d8", "#82ca9d", "#ffc658", "#ff7f0e"]

export function FormsByOriginChart({
  title = "Formulários por Origem",
  description = "Distribuição dos formulários agrupados por origem",
  dateRange,
}: FormsByOriginChartProps) {
  const [data, setData] = useState<OriginData[]>([])
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

      const response = await api.get("/admin-dash/forms/statistics/by-origin", { params })
      const originData = response.data?.data ?? response.data ?? []

      const formattedData = Array.isArray(originData)
        ? originData.map((item: any) => ({
            name: item.origin || item.source || "Sem origem",
            value: item.count || item.total || 0,
          }))
        : []

      setData(formattedData)
    } catch (error) {
      console.error("Erro ao buscar dados de origem:", error)
      setAlert("Erro ao carregar estatísticas por origem", "error")
    } finally {
      setIsLoading(false)
    }
  }, [dateRange])

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
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={tooltipStyle}
                labelStyle={{ color: "#0f172a", fontWeight: 600 }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
