"use client"

import AgendarConsultaDialog from "@/components/appointments/AgendarConsultaDialog"
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
import { Edit, Eye, Filter, MoreVertical, RefreshCcw, Settings2, Trash } from "lucide-react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { DateRange } from 'react-day-picker'

export default function EncaminhamentosTab() {
    const [items, setItems] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const [total, setTotal] = useState(0)
    const totalPages = Math.max(1, Math.ceil(total / pageSize))
    const [selectedItem, setSelectedItem] = useState<any | null>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [visibleOnly, setVisibleOnly] = useState(false)
    const [visibleColumns, setVisibleColumns] = useState(() => {
        try {
            const raw = localStorage.getItem('encaminhamentos_visible_columns')
            return raw ? JSON.parse(raw) : {
                paciente: true,
                profissional: true,
                agendamento: true,
                criacao: true,
                status: true,
                actions: true,
            }
        } catch (e) {
            return {
                paciente: true,
                profissional: true,
                agendamento: true,
                criacao: true,
                status: true,
                actions: true,
            }
        }
    })
    const visibleCount = Object.values(visibleColumns).filter(Boolean).length || 1

    useEffect(() => {
        try {
            localStorage.setItem('encaminhamentos_visible_columns', JSON.stringify(visibleColumns))
        } catch (e) { }
    }, [visibleColumns])

    // Filters
    const [showFilters, setShowFilters] = useState(false)
    const [filterPatientName, setFilterPatientName] = useState<string>('')
    const [filterProfessionalName, setFilterProfessionalName] = useState<string>('')
    const [filterScheduledDateRange, setFilterScheduledDateRange] = useState<DateRange | undefined>(undefined)
    const [filterCreatedDateRange, setFilterCreatedDateRange] = useState<DateRange | undefined>(undefined)
    const [filterStatus, setFilterStatus] = useState<string | undefined>(undefined)

    const fetchItems = async (opts?: { page?: number; pageSize?: number }, filters?: {
        patientName?: string
        professionalName?: string
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
                if (filters.professionalName) params.professionalName = filters.professionalName
                if (filters.scheduledFrom) params.scheduledFrom = filters.scheduledFrom
                if (filters.scheduledTo) params.scheduledTo = filters.scheduledTo
                if (filters.createdFrom) params.createdFrom = filters.createdFrom
                if (filters.createdTo) params.createdTo = filters.createdTo
                if (filters.status) params.status = filters.status
            }
            const res = await api.get('/appointments/referrals', { params })
            const data = res.data?.data ?? res.data ?? []
            setItems(Array.isArray(data) ? data : [])
            const t = res.data?.total ?? res.data?.totalItems ?? res.data?.totalCount ?? (Array.isArray(data) ? data.length : 0)
            setTotal(Number(t ?? 0))
        } catch (err) {
            console.error('Erro ao buscar encaminhamentos:', err)
            setError('Não foi possível carregar os encaminhamentos.')
        } finally {
            setIsLoading(false)
        }
    }

    const { setAlert } = useAlert()

    const [confirmOpen, setConfirmOpen] = useState(false)
    const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

    const performDelete = async (id: string) => {
        try {
            setIsLoading(true)
            await api.delete(`/appointments/${id}`)
            setAlert('Encaminhamento excluído com sucesso.', 'success')
            await fetchItems({ page, pageSize })
        } catch (err) {
            console.error('Erro ao excluir encaminhamento:', err)
            setAlert('Erro ao excluir encaminhamento.', 'error')
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

    const { getPermissions } = useAuth()

    const agendamentoPerm = useMemo(() => {
        if (!getPermissions) return null
        return getPermissions('agendamentos') ?? getPermissions('agendamento') ?? null
    }, [getPermissions])

    const didFetchRef = useRef(false)

    const applyFilters = useCallback(() => {
        setPage(1)
    }, [])

    const clearFilters = useCallback(() => {
        setFilterPatientName('')
        setFilterProfessionalName('')
        setFilterScheduledDateRange(undefined)
        setFilterCreatedDateRange(undefined)
        setFilterStatus(undefined)
        setPage(1)
    }, [])

    useEffect(() => {
        if (agendamentoPerm?.visualizar && !didFetchRef.current) {
            didFetchRef.current = true
            fetchItems()
        }
    }, [agendamentoPerm])

    useEffect(() => {
        if (agendamentoPerm?.visualizar) {
            const filters = {
                patientName: filterPatientName || undefined,
                professionalName: filterProfessionalName || undefined,
                scheduledFrom: filterScheduledDateRange?.from ? filterScheduledDateRange.from.toISOString() : undefined,
                scheduledTo: filterScheduledDateRange?.to ? filterScheduledDateRange.to.toISOString() : undefined,
                createdFrom: filterCreatedDateRange?.from ? filterCreatedDateRange.from.toISOString() : undefined,
                createdTo: filterCreatedDateRange?.to ? filterCreatedDateRange.to.toISOString() : undefined,
                status: filterStatus || undefined,
            }
            fetchItems({ page, pageSize }, filters)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, pageSize, filterPatientName, filterProfessionalName, filterScheduledDateRange, filterCreatedDateRange, filterStatus])

    return (
        <div>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <h2 className="text-3xl font-bold tracking-tight">Encaminhamentos</h2>
                <div className="flex items-center gap-2">
                    <ColumnsDropdown
                        columns={visibleColumns}
                        onChange={(c: Record<string, boolean>) => setVisibleColumns(c)}
                        labels={{ paciente: 'Paciente', profissional: 'Profissional', agendamento: 'Agendamento', criacao: 'Criação', status: 'Status', actions: 'Ações' }}
                        contentClassName="p-2"
                        buttonLabel={<><Settings2 className="h-4 w-4" /> Colunas</>}
                    />
                    {agendamentoPerm?.visualizar && (
                        <Button variant="outline" size="sm" onClick={() => fetchItems()}>
                            <RefreshCcw className="w-4 h-4" />
                            Atualizar
                        </Button>
                    )}
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
                            <Label htmlFor="filter-professional">Profissional</Label>
                            <Input id="filter-professional" value={filterProfessionalName} onChange={(e) => setFilterProfessionalName(e.target.value)} placeholder="Nome do profissional" />
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
                <p className="text-muted-foreground">Você não tem permissão para visualizar encaminhamentos.</p>
            )}
            {agendamentoPerm?.visualizar && (
                <>
                    <Table className="overflow-hidden rounded-t-lg">
                        <TableHeader className="sticky top-0 z-10 bg-muted">
                            <TableRow>
                                {visibleColumns.paciente && <TableHead>Paciente</TableHead>}
                                {visibleColumns.profissional && <TableHead>Profissional</TableHead>}
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
                                        {visibleColumns.profissional && <TableCell><Skeleton className="h-4 w-32" /></TableCell>}
                                        {visibleColumns.agendamento && <TableCell><Skeleton className="h-4 w-36" /></TableCell>}
                                        {visibleColumns.criacao && <TableCell><Skeleton className="h-4 w-36" /></TableCell>}
                                        {visibleColumns.status && <TableCell><Skeleton className="h-4 w-20" /></TableCell>}
                                        {visibleColumns.actions && <TableCell className="text-center"><Skeleton className="h-4 w-12 mx-auto" /></TableCell>}
                                    </TableRow>
                                ))
                            ) : (
                                items.map((a) => (
                                    <TableRow key={a.id}>
                                        {visibleColumns.paciente && <TableCell>{a.patient?.name || a.patientName || 'Anônimo'}</TableCell>}
                                        {visibleColumns.profissional && <TableCell>{a.professional?.name || a.professionalName || '—'}</TableCell>}
                                        {visibleColumns.agendamento && <TableCell>{a.scheduledAt ? new Date(a.scheduledAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}</TableCell>}
                                        {visibleColumns.criacao && <TableCell>{a.createdAt ? new Date(a.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}</TableCell>}
                                        {visibleColumns.status && <TableCell>
                                            <Badge variant={a.status === 'CONFIRMED' ? 'secondary' : a.status === 'CANCELLED' ? 'destructive' : 'outline'}>
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
                                                            setSelectedItem(a)
                                                            setVisibleOnly(true)
                                                            setIsDialogOpen(true)
                                                        }}>
                                                            <Eye className="mr-2 h-4 w-4" />
                                                            <span>Visualizar Encaminhamento</span>
                                                        </DropdownMenuItem>
                                                    )}
                                                    {agendamentoPerm?.editar && (
                                                        <DropdownMenuItem onClick={() => {
                                                            setSelectedItem(a)
                                                            setIsDialogOpen(true)
                                                        }}>
                                                            <Edit className="mr-2 h-4 w-4" />
                                                            <span>Editar Encaminhamento</span>
                                                        </DropdownMenuItem>
                                                    )}
                                                    {agendamentoPerm?.excluir && (
                                                        <>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem className="text-destructive" onClick={() => setTimeout(() => { setPendingDeleteId(a.id); setConfirmOpen(true) }, 50)}>
                                                                <Trash className="mr-2 h-4 w-4" />
                                                                <span>Excluir Encaminhamento</span>
                                                            </DropdownMenuItem>
                                                        </>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>}
                                    </TableRow>
                                ))
                            )}
                            {items.length === 0 && !isLoading && (
                                <TableRow>
                                    <TableCell colSpan={visibleCount} className="text-center text-muted-foreground">Nenhum encaminhamento encontrado.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                    {selectedItem && (
                        <AgendarConsultaDialog
                            visibleOnly={visibleOnly}
                            isOpen={isDialogOpen}
                            onOpenChange={(open) => {
                                setIsDialogOpen(open)
                                if (!open) {
                                    setSelectedItem(null)
                                    setVisibleOnly(false)
                                }
                            }}
                            appointment={selectedItem}
                            onScheduled={() => {
                                fetchItems()
                            }}
                            ferrals={true}
                        />
                    )}
                    <ConfirmDialog
                        open={confirmOpen}
                        title="Excluir Encaminhamento"
                        description="Tem certeza que deseja excluir este encaminhamento?"
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

