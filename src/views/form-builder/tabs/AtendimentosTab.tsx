"use client"

import ExportExcelButton from "@/components/buttons/btn-export-excel"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import ColumnsDropdown from "@/components/ui/columns-dropdown"
import ConfirmDialog from "@/components/ui/confirm-dialog"
import { DateRangePicker } from "@/components/ui/date-range-piker"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Pagination from "@/components/ui/pagination"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAlert } from "@/hooks/use-alert"
import { useAuth } from "@/hooks/use-auth"
import api from "@/services/api"
import { Attendance, AttendanceStatus } from "@/types/attendance"

import { CheckCircle2, Edit, Eye, Filter, MoreVertical, Plus, RefreshCcw, Settings2, Trash, XCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { DateRange } from "react-day-picker"

export default function AtendimentosTab() {
  const router = useRouter()
  const [attendances, setAttendances] = useState<Attendance[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  

  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(() => {
    try {
      const raw = localStorage.getItem("atendimentos_visible_columns")
      return raw
        ? JSON.parse(raw)
        : {
            paciente: true,
            profissional: true,
            atendimento: true,
            queixa: true,
            diagnostico: true,
            criacao: true,
            status: true,
            actions: true,
          }
    } catch (e) {
      return {
        paciente: true,
        profissional: true,
        atendimento: true,
        queixa: true,
        diagnostico: true,
        criacao: true,
        status: true,
        actions: true,
      }
    }
  })
  const visibleCount = Object.values(visibleColumns).filter(Boolean).length || 1

  // persist preferences
  useEffect(() => {
    try {
      localStorage.setItem("atendimentos_visible_columns", JSON.stringify(visibleColumns))
    } catch (e) {
      // ignore
    }
  }, [visibleColumns])

  const { setAlert } = useAlert()

  // Filters
  const [showFilters, setShowFilters] = useState(false)
  const [filterPatientName, setFilterPatientName] = useState<string>("")
  const [filterProfessionalName, setFilterProfessionalName] = useState<string>("")
  const [filterAttendanceDateRange, setFilterAttendanceDateRange] = useState<DateRange | undefined>(undefined)
  const [filterCreatedDateRange, setFilterCreatedDateRange] = useState<DateRange | undefined>(undefined)
  const [filterStatus, setFilterStatus] = useState<string | undefined>(undefined)

  const { getPermissions } = useAuth()

  const atendimentoPerm = useMemo(() => {
    if (!getPermissions) return null
    return getPermissions("atendimentos") ?? getPermissions("atendimento") ?? null
  }, [getPermissions])

  const didFetchRef = useRef(false)

  const fetchAttendances = async (
    opts?: { page?: number; pageSize?: number },
    filters?: {
      patientName?: string
      professionalName?: string
      attendanceFrom?: string
      attendanceTo?: string
      createdFrom?: string
      createdTo?: string
      status?: string
    }
  ) => {
    try {
      setIsLoading(true)
      const p = opts?.page ?? page
      const ps = opts?.pageSize ?? pageSize
      const params: any = { page: p, pageSize: ps }

      if (filters) {
        if (filters.patientName) params.patientName = filters.patientName
        if (filters.professionalName) params.professionalName = filters.professionalName
        if (filters.attendanceFrom) params.attendanceFrom = filters.attendanceFrom
        if (filters.attendanceTo) params.attendanceTo = filters.attendanceTo
        if (filters.createdFrom) params.createdFrom = filters.createdFrom
        if (filters.createdTo) params.createdTo = filters.createdTo
        if (filters.status) params.status = filters.status
      }

      const res = await api.get("/attendances", { params })
      const data = res.data?.data ?? res.data ?? []
      setAttendances(Array.isArray(data) ? data : [])
      const t = res.data?.total ?? res.data?.totalItems ?? res.data?.totalCount ?? (Array.isArray(data) ? data.length : 0)
      setTotal(Number(t ?? 0))
    } catch (err) {
      console.error("Erro ao buscar atendimentos:", err)
      setAlert("Não foi possível carregar os atendimentos.", "error")
    } finally {
      setIsLoading(false)
    }
  }

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

  const performDelete = async (id: string) => {
    try {
      setIsLoading(true)
      await api.delete(`/attendances/${id}`)
      setAlert("Atendimento excluído com sucesso.", "success")
      await fetchAttendances({ page, pageSize })
    } catch (err) {
      console.error("Erro ao excluir atendimento:", err)
      setAlert("Erro ao excluir atendimento.", "error")
    } finally {
      setIsLoading(false)
    }
  }

  const handleConfirmDelete = () => {
    if (!pendingDeleteId) return
    performDelete(pendingDeleteId)
    setPendingDeleteId(null)
    setConfirmOpen(false)
  }

  const changeStatus = async (id: string, status: AttendanceStatus) => {
    try {
      setIsLoading(true)
      await api.put(`/attendances/${id}/status`, { status })
      setAlert(`Atendimento alterado para ${status.toLowerCase()} com sucesso.`, "success")
      await fetchAttendances({ page, pageSize })
    } catch (err) {
      console.error("Erro ao alterar status:", err)
      setAlert("Erro ao alterar status do atendimento.", "error")
    } finally {
      setIsLoading(false)
    }
  }

  const applyFilters = useCallback(() => {
    setPage(1)
  }, [])

  const clearFilters = useCallback(() => {
    setFilterPatientName("")
    setFilterProfessionalName("")
    setFilterAttendanceDateRange(undefined)
    setFilterCreatedDateRange(undefined)
    setFilterStatus(undefined)
    setPage(1)
  }, [])

  useEffect(() => {
    if (atendimentoPerm?.visualizar && !didFetchRef.current) {
      didFetchRef.current = true
      fetchAttendances()
    }
  }, [atendimentoPerm])

  useEffect(() => {
    if (atendimentoPerm?.visualizar) {
      const filters = {
        patientName: filterPatientName || undefined,
        professionalName: filterProfessionalName || undefined,
        attendanceFrom: filterAttendanceDateRange?.from ? filterAttendanceDateRange.from.toISOString() : undefined,
        attendanceTo: filterAttendanceDateRange?.to ? filterAttendanceDateRange.to.toISOString() : undefined,
        createdFrom: filterCreatedDateRange?.from ? filterCreatedDateRange.from.toISOString() : undefined,
        createdTo: filterCreatedDateRange?.to ? filterCreatedDateRange.to.toISOString() : undefined,
        status: filterStatus || undefined,
      }
      fetchAttendances({ page, pageSize }, filters)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    page,
    pageSize,
    filterPatientName,
    filterProfessionalName,
    filterAttendanceDateRange,
    filterCreatedDateRange,
    filterStatus,
  ])

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="text-3xl font-bold tracking-tight text-primary">Atendimentos</h2>
        <div className="flex items-center gap-2">
          <ColumnsDropdown
            columns={visibleColumns}
            onChange={(c: Record<string, boolean>) => setVisibleColumns(c)}
            labels={{
              paciente: "Paciente",
              profissional: "Profissional",
              atendimento: "Atendimento",
              queixa: "Queixa Principal",
              diagnostico: "Diagnóstico",
              criacao: "Criação",
              status: "Status",
              actions: "Ações",
            }}
            contentClassName="p-2"
            buttonLabel={
              <>
                <Settings2 className="h-4 w-4" /> Colunas
              </>
            }
          />
          {atendimentoPerm?.visualizar && (
            <Button variant="outline" size="sm" onClick={() => fetchAttendances()}>
              <RefreshCcw className="w-4 h-4" />
              Atualizar
            </Button>
          )}
          {atendimentoPerm?.criar && (
            <Button
              variant="default"
              size="sm"
              onClick={() => {
                router.push("/admin/atendimentos/criar")
              }}
            >
              <Plus className="w-4 h-4" />
              Novo Atendimento
            </Button>
          )}
          <ExportExcelButton
            data={attendances.map((item) => ({
              Paciente: item.patient?.name || "—",
              Profissional: item.professional?.name || "—",
              "Data de Atendimento": item.attendanceDate
                ? new Date(item.attendanceDate).toLocaleString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "—",
              "Queixa Principal": item.chiefComplaint || "—",
              Diagnóstico: item.diagnosis || "—",
              Criação: item.createdAt
                ? new Date(item.createdAt).toLocaleString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "—",
              Status: item.status ?? "Em Andamento",
            }))}
            filename="atendimentos.xlsx"
            sheetName="Atendimentos"
          />
          <Button variant="outline" size="sm" onClick={() => setShowFilters((v) => !v)}>
            <Filter className="h-4 w-4" />
            Filtros
          </Button>
        </div>
      </div>

      {showFilters && (
        <div className="mb-4 rounded-md bg-muted p-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 md:grid-cols-2 gap-3 items-end">
            <div>
              <Label htmlFor="filter-patient">Paciente</Label>
              <Input
                id="filter-patient"
                value={filterPatientName}
                onChange={(e) => setFilterPatientName(e.target.value)}
                placeholder="Nome do paciente"
              />
            </div>
            <div>
              <Label htmlFor="filter-professional">Profissional</Label>
              <Input
                id="filter-professional"
                value={filterProfessionalName}
                onChange={(e) => setFilterProfessionalName(e.target.value)}
                placeholder="Nome do profissional"
              />
            </div>
            <div>
              <Label>Data de Atendimento</Label>
              <DateRangePicker value={filterAttendanceDateRange} onChange={(r) => setFilterAttendanceDateRange(r)} />
            </div>
            <div>
              <Label>Data de Criação</Label>
              <DateRangePicker value={filterCreatedDateRange} onChange={(r) => setFilterCreatedDateRange(r)} />
            </div>
            <div>
              <Label>Status</Label>
              <div className="mt-2">
                <RadioGroup
                  className="flex flex-wrap gap-2"
                  value={filterStatus || "TODOS"}
                  onValueChange={(value) => {
                    if (value === "TODOS") setFilterStatus(undefined)
                    else setFilterStatus(value)
                  }}
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value={AttendanceStatus.EmAndamento} id="status-pending" />
                    <Label htmlFor="status-pending">Em Andamento</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value={AttendanceStatus.Concluido} id="status-completed" />
                    <Label htmlFor="status-completed">Concluído</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value={AttendanceStatus.Cancelado} id="status-cancelled" />
                    <Label htmlFor="status-cancelled">Cancelado</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="TODOS" id="status-todos" />
                    <Label htmlFor="status-todos">Todos</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={() => applyFilters()}>Aplicar</Button>
              <Button variant="outline" onClick={() => clearFilters()}>
                Limpar
              </Button>
            </div>
          </div>
        </div>
      )}

      {!atendimentoPerm?.visualizar && (
        <p className="text-muted-foreground">Você não tem permissão para visualizar atendimentos.</p>
      )}
      {atendimentoPerm?.visualizar && (
        <>
          <Table className="overflow-hidden rounded-t-lg">
            <TableHeader className="sticky top-0 z-10 bg-muted">
              <TableRow>
                {visibleColumns.paciente && <TableHead>Paciente</TableHead>}
                {visibleColumns.profissional && <TableHead>Profissional</TableHead>}
                {visibleColumns.atendimento && <TableHead>Atendimento</TableHead>}
                {visibleColumns.queixa && <TableHead>Queixa Principal</TableHead>}
                {visibleColumns.diagnostico && <TableHead>Diagnóstico</TableHead>}
                {visibleColumns.criacao && <TableHead>Criação</TableHead>}
                {visibleColumns.status && <TableHead>Status</TableHead>}
                {visibleColumns.actions && <TableHead className="text-center">Ações</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody className="bg-white/40">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={`sk-${i}`}>
                    {visibleColumns.paciente && <TableCell><Skeleton className="h-4 w-40" /></TableCell>}
                    {visibleColumns.profissional && <TableCell><Skeleton className="h-4 w-32" /></TableCell>}
                    {visibleColumns.atendimento && <TableCell><Skeleton className="h-4 w-36" /></TableCell>}
                    {visibleColumns.queixa && <TableCell><Skeleton className="h-4 w-40" /></TableCell>}
                    {visibleColumns.diagnostico && <TableCell><Skeleton className="h-4 w-36" /></TableCell>}
                    {visibleColumns.criacao && <TableCell><Skeleton className="h-4 w-36" /></TableCell>}
                    {visibleColumns.status && <TableCell><Skeleton className="h-4 w-20" /></TableCell>}
                    {visibleColumns.actions && <TableCell className="text-center"><Skeleton className="h-4 w-12 mx-auto" /></TableCell>}
                  </TableRow>
                ))
              ) : (
                attendances.map((a) => (
                  <TableRow key={a.id}>
                    {visibleColumns.paciente && <TableCell>{a.patient?.name || "—"}</TableCell>}
                    {visibleColumns.profissional && <TableCell>{a.professional?.name || "—"}</TableCell>}
                    {visibleColumns.atendimento && (
                      <TableCell>
                        {a.attendanceDate
                          ? new Date(a.attendanceDate).toLocaleString("pt-BR", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "—"}
                      </TableCell>
                    )}
                    {visibleColumns.queixa && <TableCell className="max-w-xs truncate">{a.chiefComplaint || "—"}</TableCell>}
                    {visibleColumns.diagnostico && <TableCell className="max-w-xs truncate">{a.diagnosis || "—"}</TableCell>}
                    {visibleColumns.criacao && (
                      <TableCell>
                        {a.createdAt
                          ? new Date(a.createdAt).toLocaleString("pt-BR", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "—"}
                      </TableCell>
                    )}
                    {visibleColumns.status && (
                      <TableCell>
                        <Badge
                          variant={
                            a.status === AttendanceStatus.Concluido
                              ? "secondary"
                              : a.status === AttendanceStatus.Cancelado
                                ? "destructive"
                                : "outline"
                          }
                        >
                          {a.status}
                        </Badge>
                      </TableCell>
                    )}
                    {visibleColumns.actions && (
                      <TableCell className="text-center p-0 justify-center items-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="rounded-full">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {atendimentoPerm?.visualizar && (
                              <DropdownMenuItem
                                onClick={() => {
                                  router.push(`/admin/atendimentos/editar/${a.id}?view=true`)
                                }}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                <span>Visualizar</span>
                              </DropdownMenuItem>
                            )}
                            {atendimentoPerm?.editar && (
                              <DropdownMenuItem
                                onClick={() => {
                                  router.push(`/admin/atendimentos/editar/${a.id}`)
                                }}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                <span>Editar</span>
                              </DropdownMenuItem>
                            )}
                            {atendimentoPerm?.editar && a.status !== AttendanceStatus.Concluido && (
                              <DropdownMenuItem onClick={() => changeStatus(a.id, AttendanceStatus.Concluido)}>
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                <span>Marcar Concluído</span>
                              </DropdownMenuItem>
                            )}
                            {atendimentoPerm?.editar && a.status !== AttendanceStatus.Cancelado && (
                              <DropdownMenuItem onClick={() => changeStatus(a.id, AttendanceStatus.Cancelado)}>
                                <XCircle className="mr-2 h-4 w-4" />
                                <span>Cancelar</span>
                              </DropdownMenuItem>
                            )}
                            {atendimentoPerm?.excluir && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() =>
                                    setTimeout(() => {
                                      setPendingDeleteId(a.id)
                                      setConfirmOpen(true)
                                    }, 50)
                                  }
                                >
                                  <Trash className="mr-2 h-4 w-4" />
                                  <span>Excluir</span>
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
              {attendances.length === 0 && !isLoading && (
                <TableRow>
                  <TableCell colSpan={visibleCount} className="text-center text-muted-foreground">
                    Nenhum atendimento encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          

          <ConfirmDialog
            open={confirmOpen}
            title="Excluir Atendimento"
            description="Tem certeza que deseja excluir este atendimento?"
            intent="destructive"
            confirmLabel="Excluir"
            cancelLabel="Cancelar"
            onConfirm={handleConfirmDelete}
            onCancel={() => {
              setConfirmOpen(false)
              setPendingDeleteId(null)
            }}
          />
        </>
      )}
      <Pagination
        page={page}
        pageSize={pageSize}
        total={total}
        totalPages={totalPages}
        onPageChange={(p) => setPage(p)}
        onPageSizeChange={(ps) => {
          setPageSize(ps)
          setPage(1)
        }}
      />
    </div>
  )
}
