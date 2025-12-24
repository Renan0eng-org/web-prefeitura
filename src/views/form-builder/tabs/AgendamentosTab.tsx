"use client"

import AgendarConsultaDialog from "@/components/appointments/AgendarConsultaDialog"
import ExportExcelButton from "@/components/buttons/btn-export-excel"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import ColumnsDropdown from '@/components/ui/columns-dropdown'
import ConfirmDialog from "@/components/ui/confirm-dialog"
import { DateRangePicker } from '@/components/ui/date-range-piker'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Pagination from "@/components/ui/pagination"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAlert } from "@/hooks/use-alert"
import { useAuth } from "@/hooks/use-auth"
import api from "@/services/api"

import { Check, Edit, Eraser, Eye, Filter, MoreVertical, RefreshCcw, Settings2, Stethoscope, Trash } from "lucide-react"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { DateRange } from 'react-day-picker'

export default function AgendamentosTab() {
    const [appointments, setAppointments] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const [total, setTotal] = useState(0)
    const totalPages = Math.max(1, Math.ceil(total / pageSize))
    const [selectedAppointment, setSelectedAppointment] = useState<any | null>(null)
    const [isAgendarOpen, setIsAgendarOpen] = useState(false)
    const [visibleOnly, setVisibleOnly] = useState(false)
    const router = useRouter()
    const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(() => {
        try {
            const raw = localStorage.getItem('agendamentos_visible_columns')
            return raw ? JSON.parse(raw) : {
                paciente: true,
                medico: true,
                agendamento: true,
                criacao: true,
                status: true,
                actions: true,
            }
        } catch (e) {
            return {
                paciente: true,
                medico: true,
                agendamento: true,
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
            localStorage.setItem('agendamentos_visible_columns', JSON.stringify(visibleColumns))
        } catch (e) {
            // ignore
        }
    }, [visibleColumns])
    const { setAlert } = useAlert()

    // Filters
    const [showFilters, setShowFilters] = useState(false)
    const [filterPatientName, setFilterPatientName] = useState<string>('')
    const [filterDoctorName, setFilterDoctorName] = useState<string>('')
    const [filterScheduledDateRange, setFilterScheduledDateRange] = useState<DateRange | undefined>(undefined)
    const [filterCreatedDateRange, setFilterCreatedDateRange] = useState<DateRange | undefined>(undefined)
    const [filterStatus, setFilterStatus] = useState<string | undefined>(undefined)

    const { getPermissions } = useAuth()

    const agendamentoPerm = useMemo(() => {
        if (!getPermissions) return null
        // try both plural and singular keys to be tolerant
        return getPermissions('agendamentos') ?? getPermissions('agendamento') ?? null
    }, [getPermissions])

    const didFetchRef = useRef(false)

    const fetchAppointments = async (opts?: { page?: number; pageSize?: number }, filters?: {
        patientName?: string
        doctorName?: string
        scheduledFrom?: string
        scheduledTo?: string
        createdFrom?: string
        createdTo?: string
        status?: string
    }) => {
        try {
            setIsLoading(true)
            const p = opts?.page ?? page
            const ps = opts?.pageSize ?? pageSize
            const params: any = { page: p, pageSize: ps }
            if (filters) {
                if (filters.patientName) params.patientName = filters.patientName
                if (filters.doctorName) params.doctorName = filters.doctorName
                if (filters.scheduledFrom) params.scheduledFrom = filters.scheduledFrom
                if (filters.scheduledTo) params.scheduledTo = filters.scheduledTo
                if (filters.createdFrom) params.createdFrom = filters.createdFrom
                if (filters.createdTo) params.createdTo = filters.createdTo
                if (filters.status) params.status = filters.status
            }
            const res = await api.get('/appointments', { params })
            const data = res.data?.data ?? res.data ?? []
            setAppointments(Array.isArray(data) ? data : [])
            const t = res.data?.total ?? res.data?.totalItems ?? res.data?.totalCount ?? (Array.isArray(data) ? data.length : 0)
            setTotal(Number(t ?? 0))
        } catch (err) {
            console.error('Erro ao buscar agendamentos:', err)
            setAlert('Não foi possível carregar os agendamentos.', 'error')
        } finally {
            setIsLoading(false)
        }
    }

    const [confirmOpen, setConfirmOpen] = useState(false)
    const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

    const performDelete = async (id: string) => {
        try {
            setIsLoading(true)
            await api.delete(`/appointments/${id}`)
            setAlert('Agendamento excluído com sucesso.', 'success')
            await fetchAppointments({ page, pageSize })
        } catch (err) {
            console.error('Erro ao excluir agendamento:', err)
            setAlert('Erro ao excluir agendamento.', 'error')
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

    const confirmAppointment = async (id: string) => {
        try {
            setIsLoading(true)
            await api.put(`/appointments/${id}/status`, {
                status: 'Confirmado'
            })
            setAlert('Agendamento confirmado com sucesso.', 'success')
            await fetchAppointments({ page, pageSize })
        } catch (err) {
            console.error('Erro ao confirmar agendamento:', err)
            setAlert('Erro ao confirmar agendamento.', 'error')
        } finally {
            setIsLoading(false)
        }
    }

    const changeToPending = async (id: string) => {
        try {
            setIsLoading(true)
            await api.put(`/appointments/${id}/status`, {
                status: 'Pendente'
            })
            setAlert('Agendamento alterado para pendente com sucesso.', 'success')
            await fetchAppointments({ page, pageSize })
        } catch (err) {
            console.error('Erro ao alterar agendamento para pendente:', err)
            setAlert('Erro ao alterar agendamento para pendente.', 'error')
        } finally {
            setIsLoading(false)
        }
    }

    const applyFilters = useCallback(() => {
        setPage(1)
    }, [])

    const clearFilters = useCallback(() => {
        setFilterPatientName('')
        setFilterDoctorName('')
        setFilterScheduledDateRange(undefined)
        setFilterCreatedDateRange(undefined)
        setFilterStatus(undefined)
        setPage(1)
    }, [])

    useEffect(() => {
        if (agendamentoPerm?.visualizar && !didFetchRef.current) {
            didFetchRef.current = true
            fetchAppointments()
        }
    }, [agendamentoPerm])

    useEffect(() => {
        // when page or pageSize changes, reload
        if (agendamentoPerm?.visualizar) {
            const filters = {
                patientName: filterPatientName || undefined,
                doctorName: filterDoctorName || undefined,
                scheduledFrom: filterScheduledDateRange?.from ? filterScheduledDateRange.from.toISOString() : undefined,
                scheduledTo: filterScheduledDateRange?.to ? filterScheduledDateRange.to.toISOString() : undefined,
                createdFrom: filterCreatedDateRange?.from ? filterCreatedDateRange.from.toISOString() : undefined,
                createdTo: filterCreatedDateRange?.to ? filterCreatedDateRange.to.toISOString() : undefined,
                status: filterStatus || undefined,
            }
            fetchAppointments({ page, pageSize }, filters)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, pageSize, filterPatientName, filterDoctorName, filterScheduledDateRange, filterCreatedDateRange, filterStatus])

    return (
        <div>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <h2 className="text-3xl font-bold tracking-tight text-primary">Agendamentos</h2>
                <div className="flex items-center gap-2">
                    <ColumnsDropdown
                        columns={visibleColumns}
                        onChange={(c: Record<string, boolean>) => setVisibleColumns(c)}
                        labels={{ paciente: 'Paciente', medico: 'Médico', agendamento: 'Agendamento', criacao: 'Criação', status: 'Status', actions: 'Ações' }}
                        contentClassName="p-2"
                        buttonLabel={<><Settings2 className="h-4 w-4" /> Colunas</>}
                    />
                    {agendamentoPerm?.visualizar && (
                        <Button variant="outline" size="sm" onClick={() => fetchAppointments()}>
                            <RefreshCcw className="w-4 h-4" />
                            Atualizar
                        </Button>
                    )}
                    <ExportExcelButton
                        data={appointments.map(item => ({
                            'Paciente': item.patient?.name || item.patientName || 'Anônimo',
                            'Médico': item.doctor?.name || item.professionalName || '—',
                            'Agendamento': item.scheduledAt ? new Date(item.scheduledAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—',
                            'Criação': item.createdAt ? new Date(item.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—',
                            'Status': item.status ?? 'PENDENTE'
                        }))}
                        filename="agendamentos.xlsx"
                        sheetName="Agendamentos"
                    />
                    <Button variant="outline" size="sm" onClick={() => setShowFilters(v => !v)}>
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
                            <Input id="filter-patient" value={filterPatientName} onChange={(e) => setFilterPatientName(e.target.value)} placeholder="Nome do paciente" />
                        </div>
                        <div>
                            <Label htmlFor="filter-doctor">Médico</Label>
                            <Input id="filter-doctor" value={filterDoctorName} onChange={(e) => setFilterDoctorName(e.target.value)} placeholder="Nome do médico" />
                        </div>
                        <div>
                            <Label>Data de Agendamento</Label>
                            <DateRangePicker value={filterScheduledDateRange} onChange={(r) => setFilterScheduledDateRange(r)} />
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
                                    value={filterStatus || 'TODOS'}
                                    onValueChange={(value) => {
                                        if (value === 'TODOS') setFilterStatus(undefined)
                                        else setFilterStatus(value)
                                    }}
                                >
                                    <div className="flex items-center gap-2">
                                        <RadioGroupItem value="Pendente" id="status-pending" />
                                        <Label htmlFor="status-pending">Pendente</Label>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <RadioGroupItem value="Confirmado" id="status-confirmed" />
                                        <Label htmlFor="status-confirmed">Confirmado</Label>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <RadioGroupItem value="Cancelado" id="status-cancelled" />
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
                            <Button onClick={() => { applyFilters(); }}>Aplicar</Button>
                            <Button variant="outline" onClick={() => { clearFilters(); }}>Limpar</Button>
                        </div>
                    </div>
                </div>
            )}

            {!agendamentoPerm?.visualizar && (
                <p className="text-muted-foreground">Você não tem permissão para visualizar agendamentos.</p>
            )}
            {agendamentoPerm?.visualizar && (
                <>
                    <Table className="overflow-hidden rounded-t-lg">
                        <TableHeader className="sticky top-0 z-10 bg-muted">
                            <TableRow>
                                {visibleColumns.paciente && <TableHead>Paciente</TableHead>}
                                {visibleColumns.medico && <TableHead>Médico</TableHead>}
                                {visibleColumns.agendamento && <TableHead>Agendamento</TableHead>}
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
                                        {visibleColumns.medico && <TableCell><Skeleton className="h-4 w-32" /></TableCell>}
                                        {visibleColumns.agendamento && <TableCell><Skeleton className="h-4 w-36" /></TableCell>}
                                        {visibleColumns.criacao && <TableCell><Skeleton className="h-4 w-36" /></TableCell>}
                                        {visibleColumns.status && <TableCell><Skeleton className="h-4 w-20" /></TableCell>}
                                        {visibleColumns.actions && <TableCell className="text-center"><Skeleton className="h-4 w-12 mx-auto" /></TableCell>}
                                    </TableRow>
                                ))
                            ) : (
                                appointments.map((a) => (
                                    <TableRow key={a.id}>
                                        {visibleColumns.paciente && <TableCell>{a.patient?.name || a.patientName || 'Anônimo'}</TableCell>}
                                        {visibleColumns.medico && <TableCell>{a.doctor?.name || a.professionalName || '—'}</TableCell>}
                                        {visibleColumns.agendamento && <TableCell>{a.scheduledAt ? new Date(a.scheduledAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}</TableCell>}
                                        {visibleColumns.criacao && <TableCell>{a.createdAt ? new Date(a.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}</TableCell>}
                                        {visibleColumns.status && <TableCell>
                                            <Badge variant={a.status === 'Confirmado' ? 'secondary' : a.status === 'Cancelado' ? 'destructive' : 'outline'}>
                                                {a.status ?? 'PENDENTE'}
                                            </Badge>
                                        </TableCell>}
                                        {visibleColumns.actions && <TableCell className="text-center p-0 justify-center items-center">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="rounded-full">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                                    <DropdownMenuSeparator />
                                                    {agendamentoPerm?.visualizar && (
                                                        <DropdownMenuItem onClick={() => {
                                                            setSelectedAppointment(a)
                                                            setVisibleOnly(true)
                                                            setIsAgendarOpen(true)
                                                        }}>
                                                            <Eye className="mr-2 h-4 w-4" />
                                                            <span>Visualizar Agendamento</span>
                                                        </DropdownMenuItem>
                                                    )}
                                                    {/* editar */}
                                                    {agendamentoPerm?.editar && (
                                                        <DropdownMenuItem onClick={() => {
                                                            setSelectedAppointment(a)
                                                            setIsAgendarOpen(true)
                                                        }}>
                                                            <Edit className="mr-2 h-4 w-4" />
                                                            <span>Editar Agendamento</span>
                                                        </DropdownMenuItem>
                                                    )}
                                                    {agendamentoPerm?.editar && a.status !== 'Confirmado' && (
                                                        <DropdownMenuItem onClick={() => confirmAppointment(a.id)}>
                                                            <Check className="mr-2 h-4 w-4" />
                                                            <span>Confirmar Agendamento</span>
                                                        </DropdownMenuItem>
                                                    )}
                                                    {agendamentoPerm?.editar && a.status === 'Confirmado' && (
                                                        <DropdownMenuItem onClick={() => changeToPending(a.id)}>
                                                            <Eraser className="mr-2 h-4 w-4" />
                                                            <span>Mudar para Pendente</span>
                                                        </DropdownMenuItem>
                                                    )}
                                                    {a.status === 'Confirmado' && (
                                                        <DropdownMenuItem onClick={() => {
                                                            router.push(`/admin/atendimentos/criar?appointmentId=${a.id}`)
                                                        }}>
                                                            <Stethoscope className="mr-2 h-4 w-4" />
                                                            <span>Criar Atendimento</span>
                                                        </DropdownMenuItem>
                                                    )}
                                                    {agendamentoPerm?.excluir && (
                                                        <>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem className="text-destructive" onClick={() => setTimeout(() => { setPendingDeleteId(a.id); setConfirmOpen(true) }, 50)}>
                                                                <Trash className="mr-2 h-4 w-4" />
                                                                <span>Excluir Agendamento</span>
                                                            </DropdownMenuItem>
                                                        </>
                                                    )}

                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>}
                                    </TableRow>
                                ))
                            )}
                            {appointments.length === 0 && !isLoading && (
                                <TableRow>
                                    <TableCell colSpan={visibleCount} className="text-center text-muted-foreground">Nenhum agendamento encontrado.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                    {selectedAppointment && (
                        <AgendarConsultaDialog
                            visibleOnly={visibleOnly}
                            isOpen={isAgendarOpen}
                            onOpenChange={(open) => {
                                setIsAgendarOpen(open)
                                if (!open) {
                                    setSelectedAppointment(null)
                                    setVisibleOnly(false)
                                }
                            }}
                            appointment={selectedAppointment}
                            onScheduled={() => {
                                // refresh appointments after scheduling/edit
                                fetchAppointments()
                            }}
                        />
                    )}
                    <ConfirmDialog
                        open={confirmOpen}
                        title="Excluir Agendamento"
                        description="Tem certeza que deseja excluir este agendamento?"
                        intent="destructive"
                        confirmLabel="Excluir"
                        cancelLabel="Cancelar"
                        onConfirm={handleConfirmDelete}
                        onCancel={() => { setConfirmOpen(false); setPendingDeleteId(null) }}
                    />
                </>
            )}
            <Pagination
                page={page}
                pageSize={pageSize}
                total={total}
                totalPages={totalPages}
                onPageChange={(p) => setPage(p)}
                onPageSizeChange={(ps) => { setPageSize(ps); setPage(1) }}
            />
        </div>
    )
}
