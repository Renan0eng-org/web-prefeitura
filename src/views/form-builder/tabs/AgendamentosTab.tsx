"use client"

import AgendarConsultaDialog from "@/components/appointments/AgendarConsultaDialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import ColumnsDropdown from '@/components/ui/columns-dropdown'
import ConfirmDialog from "@/components/ui/confirm-dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Pagination from "@/components/ui/pagination"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAlert } from "@/hooks/use-alert"
import { useAuth } from "@/hooks/use-auth"
import api from "@/services/api"
 
import { Edit, Eye, MoreVertical, RefreshCcw, Settings2, Trash } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"

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

    const { getPermissions } = useAuth()

        const agendamentoPerm = useMemo(() => {
                if (!getPermissions) return null
                // try both plural and singular keys to be tolerant
                return getPermissions('agendamentos') ?? getPermissions('agendamento') ?? null
        }, [getPermissions])

    const didFetchRef = useRef(false)

    const fetchAppointments = async (opts?: { page?: number; pageSize?: number }) => {
        try {
            setIsLoading(true)
            const p = opts?.page ?? page
            const ps = opts?.pageSize ?? pageSize
            const res = await api.get('/appointments', { params: { page: p, pageSize: ps } })
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

    useEffect(() => {
        if (agendamentoPerm?.visualizar && !didFetchRef.current) {
            didFetchRef.current = true
            fetchAppointments()
        }
    }, [agendamentoPerm])

    useEffect(() => {
        // when page or pageSize changes, reload
        if (agendamentoPerm?.visualizar) {
            fetchAppointments({ page, pageSize })
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, pageSize])

    return (
        <div>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <h2 className="text-2xl font-semibold">Agendamentos</h2>
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
                </div>
            </div>
            
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
