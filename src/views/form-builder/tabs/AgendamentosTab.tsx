"use client"

import AgendarConsultaDialog from "@/components/appointments/AgendarConsultaDialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import ConfirmDialog from "@/components/ui/confirm-dialog"
import { DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAlert } from "@/hooks/use-alert"
import { useAuth } from "@/hooks/use-auth"
import api from "@/services/api"
import { DropdownMenu, DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu"
import { Edit, Eye, MoreVertical, Trash } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"

export default function AgendamentosTab() {
    const [appointments, setAppointments] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [selectedAppointment, setSelectedAppointment] = useState<any | null>(null)
    const [isAgendarOpen, setIsAgendarOpen] = useState(false)
    const [visibleOnly, setVisibleOnly] = useState(false)
    const { setAlert } = useAlert()

    const { getPermissions } = useAuth()

        const agendamentoPerm = useMemo(() => {
                if (!getPermissions) return null
                // try both plural and singular keys to be tolerant
                return getPermissions('agendamentos') ?? getPermissions('agendamento') ?? null
        }, [getPermissions])

    const didFetchRef = useRef(false)

    const fetchAppointments = async () => {
        try {
            setIsLoading(true)
            const res = await api.get('/appointments')
            setAppointments(res.data || [])
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
            await fetchAppointments()
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

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold">Agendamentos</h2>
                <div>
                    {agendamentoPerm?.visualizar && (
                        <Button variant="outline" size="sm" onClick={fetchAppointments}>Atualizar</Button>
                    )}
                </div>
            </div>
            
            {!agendamentoPerm?.visualizar && (
                <p className="text-muted-foreground">Você não tem permissão para visualizar agendamentos.</p>
            )}
            {agendamentoPerm?.visualizar && (
            <>
            <Table className="overflow-hidden rounded-lg border">
                <TableHeader className="sticky top-0 z-10 bg-muted">
                    <TableRow>
                        <TableHead>Paciente</TableHead>
                        <TableHead>Médico</TableHead>
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
                        appointments.map((a) => (
                            <TableRow key={a.id}>
                                <TableCell>{a.patient?.name || a.patientName || 'Anônimo'}</TableCell>
                                <TableCell>{a.doctor?.name || a.professionalName || '—'}</TableCell>
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
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                    {appointments.length === 0 && !isLoading && (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center text-muted-foreground">Nenhum agendamento encontrado.</TableCell>
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
        </div>
    )
}
