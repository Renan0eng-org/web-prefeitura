"use client"

import AgendarConsultaDialog from "@/components/appointments/AgendarConsultaDialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import ConfirmDialog from "@/components/ui/confirm-dialog"
import { DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import Pagination from "@/components/ui/pagination"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAlert } from "@/hooks/use-alert"
import { useAuth } from "@/hooks/use-auth"
import api from "@/services/api"
import { DropdownMenu, DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu"
import { Edit, Eye, MoreVertical, Trash } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"

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

    const fetchItems = async (opts?: { page?: number; pageSize?: number }) => {
        try {
            setIsLoading(true)
            const p = opts?.page ?? page
            const ps = opts?.pageSize ?? pageSize
            const res = await api.get('/appointments/referrals', { params: { page: p, pageSize: ps } })
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

    useEffect(() => {
        if (agendamentoPerm?.visualizar && !didFetchRef.current) {
            didFetchRef.current = true
            fetchItems()
        }
    }, [agendamentoPerm])

    useEffect(() => {
        if (agendamentoPerm?.visualizar) {
            fetchItems({ page, pageSize })
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, pageSize])

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold">Encaminhamentos</h2>
                <div>
                    {agendamentoPerm?.visualizar && (
                        <Button variant="outline" size="sm" onClick={() => fetchItems()}>Atualizar</Button>
                    )}
                </div>
            </div>

            {error && <p className="text-red-500">{error}</p>}
            {!agendamentoPerm?.visualizar && (
                <p className="text-muted-foreground">Você não tem permissão para visualizar encaminhamentos.</p>
            )}
            {agendamentoPerm?.visualizar && (
            <>
            <Table className="overflow-hidden rounded-t-lg">
                <TableHeader className="sticky top-0 z-10 bg-muted">
                    <TableRow>
                        <TableHead>Paciente</TableHead>
                        <TableHead>Profissional</TableHead>
                        <TableHead>Agendamento</TableHead>
                        <TableHead>Criação</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-center">Ações</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody className="bg-white/40">
                    {isLoading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                            <TableRow key={`sk-${i}`}>
                                <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                <TableCell className="text-center"><Skeleton className="h-4 w-12 mx-auto" /></TableCell>
                            </TableRow>
                        ))
                    ) : (
                        items.map((a) => (
                            <TableRow key={a.id}>
                                <TableCell>{a.patient?.name || a.patientName || 'Anônimo'}</TableCell>
                                <TableCell>{a.professional?.name || a.professionalName || '—'}</TableCell>
                                <TableCell>{a.scheduledAt ? new Date(a.scheduledAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}</TableCell>
                                <TableCell>{a.createdAt ? new Date(a.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}</TableCell>
                                <TableCell>
                                    <Badge variant={a.status === 'CONFIRMED' ? 'secondary' : a.status === 'CANCELLED' ? 'destructive' : 'outline'}>
                                        {a.status ?? 'PENDENTE'}
                                    </Badge>
                                </TableCell>
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
                                            {/* editar */}
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
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                    {items.length === 0 && !isLoading && (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center text-muted-foreground">Nenhum encaminhamento encontrado.</TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
            <Pagination
                page={page}
                pageSize={pageSize}
                total={total}
                totalPages={totalPages}
                onPageChange={(p) => setPage(p)}
                onPageSizeChange={(ps) => { setPageSize(ps); setPage(1) }}
            />
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
                        // refresh after scheduling/edit
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
        </div>
    )
}
