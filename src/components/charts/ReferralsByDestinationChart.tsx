"use client"

import React from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAlert } from "@/hooks/use-alert"
import api from "@/services/api"
import { Loader2 } from "lucide-react"

interface DateRange {
  from?: Date
  to?: Date
}

interface TimelineData {
  date: string
  [destination: string]: string | number
}

interface ReferralsByDestinationChartProps {
  title?: string
  description?: string
  dateRange?: DateRange
  groupBy?: "day" | "week" | "month"
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#6366f1"]

export function ReferralsByDestinationChart({
  title = "Encaminhamentos por Destino",
  description = "Quantidade de pacientes encaminhados para cada setor",
  dateRange,
  groupBy = "day",
}: ReferralsByDestinationChartProps) {
  const [data, setData] = React.useState<TimelineData[]>([])
  const [destinations, setDestinations] = React.useState<string[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
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

      // Endpoint seguindo padrão admin-dash, retorna série temporal agrupada por destino
      const response = await api.get("/admin-dash/referrals/timeline", { params })
      const timelineData = response.data?.data ?? response.data ?? []

      if (Array.isArray(timelineData) && timelineData.length > 0) {
        // Extrair todos os destinos únicos
        const allDestinations = new Set<string>()
        timelineData.forEach((item: any) => {
          Object.keys(item).forEach(key => {
            if (key !== 'date' && key !== 'period') {
              allDestinations.add(key)
            }
          })
        })

        const destinationList = Array.from(allDestinations)
        setDestinations(destinationList)

        // Formatar dados para o gráfico
        const formattedData: TimelineData[] = timelineData.map((item: any) => {
          const dataPoint: TimelineData = {
            date: item.date || item.period || new Date().toISOString().split("T")[0]
          }
          destinationList.forEach(dest => {
            dataPoint[dest] = item[dest] || 0
          })
          return dataPoint
        })

        setData(formattedData)
      } else {
        setData([])
        setDestinations([])
      }
    } catch (error) {
      console.error("Erro ao buscar histórico de encaminhamentos:", error)
      setAlert("Erro ao carregar histórico de encaminhamentos", "error")
    } finally {
      setIsLoading(false)
    }
  }, [dateRange, groupBy, setAlert])

  React.useEffect(() => {
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
              <YAxis 
                allowDecimals={false}
                label={{ value: "Quantidade de Encaminhamentos", angle: -90, position: "insideLeft" }} 
              />
              <Tooltip
                contentStyle={tooltipStyle}
                labelStyle={{ color: "#0f172a", fontWeight: 600 }}
                labelFormatter={(value) => {
                  const date = new Date(value)
                  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
                }}
                formatter={(value: any) => (typeof value === "number" ? value.toString() : value)}
              />
              <Legend />
              {destinations.map((destination, index) => (
                <Line
                  key={destination}
                  type="monotone"
                  dataKey={destination}
                  stroke={COLORS[index % COLORS.length]}
                  name={destination}
                  strokeWidth={2}
                  dot={{ fill: COLORS[index % COLORS.length], r: 4 }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
