"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { useAlert } from "@/hooks/use-alert"
import api from "@/services/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  FormResponsesChart,
  FormsByOriginChart,
  TopFormulariosChart,
  FormAverageScoresChart,
  AllResponsesChart,
  ReferralsByDestinationChart,
} from "@/components/charts"
import { RefreshCcw, Filter, X } from "lucide-react"

interface DateRange {
  from?: Date
  to?: Date
}

interface FormData {
  id: string
  title: string
  [key: string]: any
}

export default function DashAdmin() {
  const router = useRouter()
  const { getPermissions } = useAuth()
  const { setAlert } = useAlert()

  // Filters
  const [showFilters, setShowFilters] = useState(false)
  const [filterDateRange, setFilterDateRange] = useState<DateRange | undefined>(undefined)
  const [groupBy, setGroupBy] = useState<"day" | "week" | "month">("day")

  // Permissions
  const formularioPerm = useMemo(() => {
    if (!getPermissions) return null
    return getPermissions("formulario") ?? null
  }, [getPermissions])

  const didFetchRef = useRef(false)

  // Effect para verificar permissões
  useEffect(() => {
    if (formularioPerm && !formularioPerm.visualizar) {
      setAlert("Você não tem permissão para acessar este dashboard.", "error")
      router.push("/admin")
    }
  }, [formularioPerm, setAlert, router])

  const clearFilters = useCallback(() => {
    setFilterDateRange(undefined)
    setGroupBy("day")
  }, [])

  const refreshAll = useCallback(() => {
    // Força re-render dos gráficos
  }, [])

  if (!formularioPerm?.visualizar) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-2 sm:p-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">
            Dashboard de Análises
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Análise completa de formulários e respostas
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshAll}
          >
            <RefreshCcw className="w-4 h-4" />
            Atualizar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4" />
            Filtros
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="rounded-lg border border-border bg-card p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="space-y-2">
              <label htmlFor="groupBy" className="text-sm font-medium">
                Agrupar Por
              </label>
              <Select value={groupBy} onValueChange={(value: any) => setGroupBy(value)}>
                <SelectTrigger id="groupBy">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Diário</SelectItem>
                  <SelectItem value="week">Semanal</SelectItem>
                  <SelectItem value="month">Mensal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
            >
              Limpar Filtros
            </Button>
          </div>
        </div>
      )}

      {/* Charts Grid 2 colunas*/}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="rounded-lg border border-border bg-card p-4 col-span-1 xl:col-span-2">
          <p className="text-sm text-muted-foreground">
            <strong>Respostas :</strong> Distribuição e análise das respostas dos formulários.
          </p>
        </div>
        {/* Top Formulários */}
        <div className="col-span-1">
          <TopFormulariosChart
            title="Formulários Mais Respondidos"
            description="Top 10 formulários com maior número de respostas"
            dateRange={filterDateRange}
          />
        </div>

        {/* Distribuição por Origem */}
        <div className="col-span-1">
          <FormsByOriginChart
            title="Distribuição por Origem"
            description="Número de formulários agrupados por origem"
            dateRange={filterDateRange}
          />
        </div>

        {/* Respostas e Notas */}
        <div className="col-span-1">
          <FormResponsesChart
            title="Respostas e Notas dos Formulários"
            description="Visualize o número de respostas e média de notas por formulário"
            dateRange={filterDateRange}
          />
        </div>

        {/* Média de Notas com Interatividade */}
        <div className="col-span-1">
          <FormAverageScoresChart
            title="Média de Notas"
            description="Pontuação média de cada formulário (verde ≥8, amarelo ≥6, vermelho <6)"
            dateRange={filterDateRange}
          />
        </div>

        <div className="rounded-lg border border-border bg-card p-4 col-span-1 xl:col-span-2">
          <p className="text-sm text-muted-foreground">
            <strong>Encaminhamentos :</strong> Visão geral dos destinos.
          </p>
        </div>

        {/* Histórico de Respostas */}
        <div className="col-span-1">
          <AllResponsesChart
            title="Histórico de Todas as Respostas"
            description="Evolução do número de respostas e média de notas ao longo do tempo"
            dateRange={filterDateRange}
            groupBy={groupBy}
          />
        </div>

        <div className="col-span-1">
          <ReferralsByDestinationChart
            title="Encaminhamentos por Destino"
            description="Quantidade de pacientes encaminhados para cada setor"
            dateRange={filterDateRange}
            groupBy={groupBy}
          />
        </div>
      </div>

      {/* Divisor de assuntos dos gráficos */}
    </div>
  )
}