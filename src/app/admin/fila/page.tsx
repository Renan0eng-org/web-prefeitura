"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useAlert } from "@/hooks/use-alert"
import { useAuth } from "@/hooks/use-auth"
import api from "@/services/api"
import { cn } from "@/lib/utils"
import {
    DndContext,
    DragOverlay,
    PointerSensor,
    TouchSensor,
    closestCorners,
    useDraggable,
    useDroppable,
    useSensor,
    useSensors,
    type DragEndEvent,
    type DragStartEvent,
} from "@dnd-kit/core"
import { CalendarClock, CheckCircle2, ChevronDown, ChevronRight, Clock, GripVertical, Loader2, PhoneCall, PlusCircle, RefreshCcw, RotateCcw, TicketCheck, Trash2 } from "lucide-react"
import * as React from "react"
import { PatientSelect } from "@/components/select/PatientSelect"

type QueueStatus = "Aguardando" | "Chamado" | "EmAtendimento" | "Concluido" | "Cancelado" | "Faltou"

type Ticket = {
    id: string
    code: string
    setor: string
    priority: "Normal" | "Preferencial" | "Urgencia"
    status: QueueStatus
    patientName: string | null
    patient?: { idUser: string; name: string } | null
    doctor?: { idUser: string; name: string } | null
    appointmentId?: string | null
    appointment?: { id: string; scheduledAt: string; status: string; modality?: string } | null
}
type Stats = { aguardando: number; chamado: number; emAtendimento: number; concluidos: number; avgWaitSeconds: number }
type Appointment = {
    id: string
    scheduledAt: string
    status: "Pendente" | "Confirmado" | "Cancelado" | string
    modality?: string
    patient?: { idUser: string; name: string } | null
    patientName?: string | null
    doctor?: { idUser: string; name: string } | null
}

const PRIORITY: Record<string, { label: string; cls: string }> = {
    Urgencia: { label: "Urgência", cls: "bg-red-100 text-red-700" },
    Preferencial: { label: "Prefer.", cls: "bg-amber-100 text-amber-700" },
    Normal: { label: "Normal", cls: "bg-slate-100 text-slate-600" },
}

const APPT_STATUS: Record<string, { label: string; cls: string }> = {
    Pendente: { label: "Pendente", cls: "text-amber-600 border-amber-300" },
    Confirmado: { label: "Confirmado", cls: "text-emerald-700 border-emerald-300" },
    Cancelado: { label: "Cancelado", cls: "text-red-600 border-red-300" },
}

// Colunas do kanban, na ordem do fluxo de atendimento.
const BOARD_COLUMNS: { key: QueueStatus; title: string }[] = [
    { key: "Aguardando", title: "Aguardando" },
    { key: "Chamado", title: "Chamado" },
    { key: "EmAtendimento", title: "Em atendimento" },
    { key: "Concluido", title: "Concluídos hoje" },
]

// Arrastar um card de uma coluna para outra dispara a ação correspondente no backend.
// Só permitimos os avanços válidos do fluxo (o backend valida o estado de origem).
const TRANSITIONS: Partial<Record<QueueStatus, Partial<Record<QueueStatus, string>>>> = {
    Aguardando: { Chamado: "chamar" },
    Chamado: { EmAtendimento: "confirmar" },
    EmAtendimento: { Concluido: "concluir" },
}

function fmtWait(s: number) {
    const m = Math.floor(s / 60), sec = s % 60
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
}

function fmtHour(dt: string) {
    return new Date(dt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
}

// Card arrastável. O card inteiro é a alça; a restrição de distância do sensor
// garante que cliques nos botões internos não iniciem um arraste.
function DraggableTicket({ ticket, disabled, children }: { ticket: Ticket; disabled?: boolean; children: React.ReactNode }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: ticket.id, disabled })
    const style: React.CSSProperties = {
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    }
    return (
        <div
            ref={setNodeRef}
            style={style}
            {...(disabled ? {} : { ...listeners, ...attributes })}
            className={cn(!disabled && "cursor-grab active:cursor-grabbing touch-none", isDragging && "opacity-40")}
        >
            {children}
        </div>
    )
}

// Card de agendamento arrastável — soltar no board gera a senha.
function DraggableAppointment({ appointment, disabled, children }: { appointment: Appointment; disabled?: boolean; children: React.ReactNode }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: `appt:${appointment.id}`, data: { type: "appointment" }, disabled })
    const style: React.CSSProperties = {
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    }
    return (
        <div
            ref={setNodeRef}
            style={style}
            {...(disabled ? {} : { ...listeners, ...attributes })}
            className={cn(!disabled && "cursor-grab active:cursor-grabbing touch-none", isDragging && "opacity-40")}
        >
            {children}
        </div>
    )
}

// Lixeira: solte uma senha aqui para excluí-la; clique para abrir os excluídos.
function TrashDropZone({ count, onClick }: { count: number; onClick: () => void }) {
    const { setNodeRef, isOver } = useDroppable({ id: "trash" })
    return (
        <button
            ref={setNodeRef}
            type="button"
            onClick={onClick}
            className={cn(
                "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition",
                isOver
                    ? "border-destructive bg-destructive/10 text-destructive ring-2 ring-destructive/40"
                    : "border-dashed text-muted-foreground hover:bg-muted",
            )}
        >
            <Trash2 className="w-4 h-4" />
            Lixeira
            {count > 0 && <Badge variant="secondary">{count}</Badge>}
        </button>
    )
}

// Coluna que aceita o drop de um card.
function DroppableColumn({ id, disabled, className, children }: { id: string; disabled?: boolean; className?: string; children: React.ReactNode }) {
    const { setNodeRef, isOver } = useDroppable({ id, disabled })
    return (
        <div ref={setNodeRef} className={cn(className, isOver && !disabled && "ring-2 ring-primary/50 bg-primary/5 rounded-lg")}>
            {children}
        </div>
    )
}

export default function FilaPage() {
    // Fila integrada com agendamentos do dia (drag-and-drop).
    const [tickets, setTickets] = React.useState<Ticket[]>([])
    const [stats, setStats] = React.useState<Stats | null>(null)
    const [appointments, setAppointments] = React.useState<Appointment[]>([])
    const [isLoading, setIsLoading] = React.useState(true)
    const [busy, setBusy] = React.useState<string | null>(null)
    const [activeId, setActiveId] = React.useState<string | null>(null)

    const [dialogOpen, setDialogOpen] = React.useState(false)
    const [form, setForm] = React.useState({ patientId: "", patientName: "", setor: "Triagem", priority: "Normal" })
    // Agendamento de origem quando a senha é gerada a partir de um agendamento do dia.
    const [fromAppointment, setFromAppointment] = React.useState<Appointment | null>(null)
    const [saving, setSaving] = React.useState(false)

    // Lixeira / senhas excluídas (soft delete).
    const [deletedOpen, setDeletedOpen] = React.useState(false)
    const [deletedTickets, setDeletedTickets] = React.useState<Ticket[]>([])
    const [loadingDeleted, setLoadingDeleted] = React.useState(false)

    // Estado de recolhido/expandido de cada lista (persistido).
    const [collapsed, setCollapsed] = React.useState<Record<string, boolean>>(() => {
        try { return JSON.parse(localStorage.getItem("fila_collapsed_cols") || "{}") } catch { return {} }
    })
    React.useEffect(() => {
        try { localStorage.setItem("fila_collapsed_cols", JSON.stringify(collapsed)) } catch { }
    }, [collapsed])
    const toggleCollapse = (key: string) => setCollapsed(c => ({ ...c, [key]: !c[key] }))

    const { setAlert } = useAlert()
    const { getPermissions } = useAuth()
    const permissions = React.useMemo(() => getPermissions("fila"), [getPermissions])
    const agendamentoPerm = React.useMemo(() => getPermissions("agendamentos") ?? getPermissions("agendamento"), [getPermissions])

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
    )

    const fetchData = React.useCallback(async () => {
        try {
            const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0)
            const endOfDay = new Date(); endOfDay.setHours(23, 59, 59, 999)

            const requests: Promise<any>[] = [
                api.get("/admin/fila"),
                api.get("/admin/fila/stats"),
            ]
            if (agendamentoPerm?.visualizar) {
                requests.push(api.get("/appointments", {
                    params: {
                        scheduledFrom: startOfDay.toISOString(),
                        scheduledTo: endOfDay.toISOString(),
                        pageSize: 200,
                    },
                }))
            }

            const [ticketsRes, statsRes, apptsRes] = await Promise.all(requests)
            setTickets(ticketsRes.data)
            setStats(statsRes.data)
            if (apptsRes) {
                const data = apptsRes.data?.data ?? apptsRes.data ?? []
                const list: Appointment[] = Array.isArray(data) ? data : []
                list.sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
                setAppointments(list)
            }
        } catch (err: any) {
            setAlert(err.response?.data?.message || "Erro ao carregar fila.", "error")
        } finally {
            setIsLoading(false)
        }
    }, [setAlert, agendamentoPerm?.visualizar])

    const refreshDeleted = React.useCallback(async () => {
        try {
            setLoadingDeleted(true)
            const res = await api.get("/admin/fila", { params: { deleted: true } })
            setDeletedTickets(Array.isArray(res.data) ? res.data : [])
        } catch {
            // silencioso — a contagem da lixeira é secundária
        } finally {
            setLoadingDeleted(false)
        }
    }, [])

    React.useEffect(() => {
        if (!permissions?.visualizar) { setIsLoading(false); return }
        fetchData()
        if (permissions?.excluir) refreshDeleted()
        const t = setInterval(fetchData, 15000) // auto-refresh
        return () => clearInterval(t)
    }, [permissions?.visualizar, permissions?.excluir, fetchData, refreshDeleted])

    const action = async (id: string, path: string, body?: any) => {
        setBusy(id)
        try {
            await api.post(`/admin/fila/${id}/${path}`, body || {})
            await fetchData()
        } catch (err: any) {
            setAlert(err.response?.data?.message || "Erro na ação.", "error")
        } finally {
            setBusy(null)
        }
    }

    // Soft delete via arraste para a lixeira (remoção otimista + rollback no erro).
    const softDeleteTicket = async (ticket: Ticket) => {
        setTickets(prev => prev.filter(t => t.id !== ticket.id))
        try {
            await api.delete(`/admin/fila/${ticket.id}`)
            setAlert(`Senha ${ticket.code} excluída.`, "success")
            refreshDeleted()
        } catch (err: any) {
            setAlert(err.response?.data?.message || "Erro ao excluir senha.", "error")
        } finally {
            fetchData()
        }
    }

    const restoreTicket = async (ticket: Ticket) => {
        setBusy(ticket.id)
        try {
            await api.post(`/admin/fila/${ticket.id}/restaurar`)
            setAlert(`Senha ${ticket.code} restaurada.`, "success")
            await Promise.all([fetchData(), refreshDeleted()])
        } catch (err: any) {
            setAlert(err.response?.data?.message || "Não foi possível restaurar a senha.", "error")
        } finally {
            setBusy(null)
        }
    }

    // Mover senha por drag-and-drop entre colunas (atualização otimista + rollback no erro).
    const moveTicket = async (ticket: Ticket, targetStatus: QueueStatus) => {
        if (ticket.status === targetStatus) return
        const path = TRANSITIONS[ticket.status]?.[targetStatus]
        if (!path) {
            setAlert("Não é possível mover esta senha para essa coluna.", "error")
            return
        }
        setTickets(prev => prev.map(t => t.id === ticket.id ? { ...t, status: targetStatus } : t))
        try {
            await api.post(`/admin/fila/${ticket.id}/${path}`, {})
            fetchData()
        } catch (err: any) {
            setAlert(err.response?.data?.message || "Erro ao mover senha.", "error")
            fetchData() // reverte para o estado real
        }
    }

    // Arrastar um agendamento para o board cria a senha direto (vinculada ao agendamento).
    const createTicketFromAppointment = async (appt: Appointment) => {
        if (ticketByAppointment.get(appt.id)) {
            setAlert("Este agendamento já possui senha na fila.", "error")
            return
        }
        setBusy(appt.id)
        try {
            await api.post("/admin/fila", { appointmentId: appt.id, setor: "Ambulatorio", priority: "Normal" })
            setAlert("Senha emitida a partir do agendamento!", "success")
            await fetchData()
        } catch (err: any) {
            setAlert(err.response?.data?.message || "Erro ao emitir senha.", "error")
        } finally {
            setBusy(null)
        }
    }

    const handleDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id))
    const handleDragEnd = (e: DragEndEvent) => {
        setActiveId(null)
        const { active, over } = e
        if (!over) return
        const activeIdStr = String(active.id)
        // Card de agendamento (id prefixado com "appt:") -> gera senha direto.
        if (activeIdStr.startsWith("appt:")) {
            if (over.id === "trash") return // agendamento não é excluído aqui
            const appt = appointments.find(a => a.id === activeIdStr.slice(5))
            if (appt) createTicketFromAppointment(appt)
            return
        }
        const ticket = tickets.find(t => t.id === activeIdStr)
        if (!ticket) return
        // Solto na lixeira -> soft delete.
        if (over.id === "trash") {
            softDeleteTicket(ticket)
            return
        }
        moveTicket(ticket, over.id as QueueStatus)
    }

    const openNewTicketDialog = () => {
        setFromAppointment(null)
        setForm({ patientId: "", patientName: "", setor: "Triagem", priority: "Normal" })
        setDialogOpen(true)
    }

    const openTicketFromAppointment = (appt: Appointment) => {
        setFromAppointment(appt)
        setForm({ patientId: "", patientName: "", setor: "Ambulatorio", priority: "Normal" })
        setDialogOpen(true)
    }

    const handleCreate = async () => {
        if (!fromAppointment && !form.patientId && !form.patientName.trim()) {
            return setAlert("Selecione um paciente cadastrado ou informe o nome.", "error")
        }
        setSaving(true)
        try {
            const payload: any = { setor: form.setor, priority: form.priority }
            if (fromAppointment) {
                payload.appointmentId = fromAppointment.id
            } else if (form.patientId) {
                payload.patientId = form.patientId
            } else {
                payload.patientName = form.patientName.trim()
            }
            await api.post("/admin/fila", payload)
            setAlert("Senha emitida!", "success")
            setForm({ patientId: "", patientName: "", setor: "Triagem", priority: "Normal" })
            setFromAppointment(null)
            setDialogOpen(false)
            fetchData()
        } catch (err: any) {
            setAlert(err.response?.data?.message || "Erro ao emitir senha.", "error")
        } finally {
            setSaving(false)
        }
    }

    const cols = React.useMemo(() => ({
        Aguardando: tickets.filter(t => t.status === "Aguardando"),
        Chamado: tickets.filter(t => t.status === "Chamado"),
        EmAtendimento: tickets.filter(t => t.status === "EmAtendimento"),
        Concluido: tickets.filter(t => t.status === "Concluido"),
    }) as Record<QueueStatus, Ticket[]>, [tickets])

    // Senha do dia por agendamento — para marcar na lista de agendamentos.
    const ticketByAppointment = React.useMemo(() => {
        const map = new Map<string, Ticket>()
        for (const t of tickets) {
            if (t.appointmentId) map.set(t.appointmentId, t)
        }
        return map
    }, [tickets])

    const isApptDrag = !!activeId && activeId.startsWith("appt:")
    const activeTicket = activeId && !isApptDrag ? tickets.find(t => t.id === activeId) : null
    const activeAppointment = isApptDrag ? appointments.find(a => a.id === activeId!.slice(5)) : null

    if (isLoading) {
        return <div className="p-2 md:p-4 lg:p-8"><Skeleton className="h-8 w-1/3 mb-6" /><div className="grid grid-cols-3 gap-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-64 rounded-xl" />)}</div></div>
    }
    if (!permissions?.visualizar) {
        return <div className="p-2 md:p-4 lg:p-8"><p className="text-muted-foreground">Você não tem permissão para visualizar esta seção.</p></div>
    }

    const nameOf = (t: Ticket) => t.patient?.name || t.patientName || "—"
    const apptPatientName = (a: Appointment) => a.patient?.name || a.patientName || "Anônimo"

    const ticketMeta = (t: Ticket) => (
        <>
            <div className="text-xs text-muted-foreground mt-0.5">{nameOf(t)} · {t.setor}{t.doctor ? ` · ${t.doctor.name}` : ""}</div>
            {t.appointment && (
                <div className="flex items-center gap-1 text-[10px] text-primary mt-1">
                    <CalendarClock className="w-3 h-3" />
                    Agendado às {fmtHour(t.appointment.scheduledAt)}
                </div>
            )}
        </>
    )

    // Conteúdo interno de um card conforme a coluna.
    const renderTicketCard = (t: Ticket) => (
        <Card className="p-3">
            {t.status === "Aguardando" && (
                <>
                    <div className="flex items-center justify-between">
                        <span className="font-bold tabular-nums flex items-center gap-1"><GripVertical className="w-3.5 h-3.5 text-muted-foreground/50" />{t.code}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${PRIORITY[t.priority].cls}`}>{PRIORITY[t.priority].label}</span>
                    </div>
                    {ticketMeta(t)}
                    {permissions?.editar && (
                        <Button size="sm" className="w-full mt-2 h-8" disabled={busy === t.id} onClick={() => action(t.id, "chamar")}>
                            {busy === t.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <PhoneCall className="w-3 h-3" />}Chamar
                        </Button>
                    )}
                </>
            )}
            {t.status === "Chamado" && (
                <>
                    <div className="flex items-center justify-between">
                        <span className="font-bold tabular-nums flex items-center gap-1"><GripVertical className="w-3.5 h-3.5 text-muted-foreground/50" />{t.code}</span>
                        <Badge variant="outline" className="text-amber-600 border-amber-300 text-[10px]">Aguard. confirmação</Badge>
                    </div>
                    {ticketMeta(t)}
                    {permissions?.editar && (
                        <div className="flex gap-1 mt-2">
                            <Button size="sm" className="flex-1 h-8" disabled={busy === t.id} onClick={() => action(t.id, "confirmar")}>Confirmar</Button>
                            <Button size="sm" variant="outline" className="h-8" disabled={busy === t.id} onClick={() => action(t.id, "faltou")}>Faltou</Button>
                        </div>
                    )}
                </>
            )}
            {t.status === "EmAtendimento" && (
                <>
                    <div className="flex items-center justify-between">
                        <span className="font-bold tabular-nums flex items-center gap-1"><GripVertical className="w-3.5 h-3.5 text-muted-foreground/50" />{t.code}</span>
                        <Badge variant="secondary" className="text-emerald-700 bg-emerald-100 text-[10px]">Confirmado</Badge>
                    </div>
                    {ticketMeta(t)}
                    {permissions?.editar && (
                        <Button size="sm" variant="outline" className="w-full mt-2 h-8" disabled={busy === t.id} onClick={() => action(t.id, "concluir")}>Concluir</Button>
                    )}
                </>
            )}
            {t.status === "Concluido" && (
                <>
                    <div className="flex items-center justify-between">
                        <span className="font-bold tabular-nums flex items-center gap-1"><GripVertical className="w-3.5 h-3.5 text-muted-foreground/50" />{t.code}</span>
                        <Badge variant="secondary" className="text-emerald-700 bg-emerald-100 text-[10px]"><CheckCircle2 className="w-3 h-3 mr-1" />Concluído</Badge>
                    </div>
                    {ticketMeta(t)}
                </>
            )}
        </Card>
    )

    return (
        <div className="p-2 md:p-4 lg:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">Fila de Atendimento</h1>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={fetchData}><RefreshCcw className="w-4 h-4" />Atualizar</Button>
                    {permissions?.criar && <Button onClick={openNewTicketDialog}><PlusCircle className="w-4 h-4" />Emitir Senha</Button>}
                </div>
            </div>

            {/* stats */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                    <Card className="p-4"><div className="text-2xl font-bold tabular-nums">{stats.aguardando}</div><div className="text-xs text-muted-foreground">Aguardando</div></Card>
                    <Card className="p-4"><div className="text-2xl font-bold tabular-nums text-amber-600">{fmtWait(stats.avgWaitSeconds)}</div><div className="text-xs text-muted-foreground">Espera média</div></Card>
                    <Card className="p-4"><div className="text-2xl font-bold tabular-nums text-emerald-600">{stats.emAtendimento}</div><div className="text-xs text-muted-foreground">Em atendimento</div></Card>
                    <Card className="p-4"><div className="text-2xl font-bold tabular-nums">{stats.concluidos}</div><div className="text-xs text-muted-foreground">Concluídos hoje</div></Card>
                </div>
            )}

            <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <p className="text-xs text-muted-foreground">Dica: arraste um agendamento para o board para gerar a senha, arraste uma senha para a próxima coluna para avançar, ou solte-a na lixeira para excluir.</p>
                {permissions?.excluir && (
                    <TrashDropZone count={deletedTickets.length} onClick={() => { setDeletedOpen(true); refreshDeleted() }} />
                )}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 items-start">
                {/* Agendamentos de hoje */}
                {agendamentoPerm?.visualizar && (
                    <div className="rounded-xl border bg-muted/30 p-3 xl:col-span-1">
                        <button
                            type="button"
                            onClick={() => toggleCollapse("Agendamentos")}
                            className="w-full flex justify-between items-center text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3"
                        >
                            <span className="flex items-center gap-1">
                                {collapsed["Agendamentos"] ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                <CalendarClock className="w-3.5 h-3.5" />Agendamentos de hoje
                            </span>
                            <span>{appointments.length}</span>
                        </button>
                        {!collapsed["Agendamentos"] && (
                            <div className="space-y-2 max-h-[70vh] overflow-y-auto scrollable pr-1">
                                {appointments.map(a => {
                                    const ticket = ticketByAppointment.get(a.id)
                                    const st = APPT_STATUS[a.status] ?? { label: a.status, cls: "" }
                                    // Arrastável quando ainda não virou senha, não está cancelado e há permissão.
                                    const canDrag = !ticket && a.status !== "Cancelado" && !!permissions?.criar
                                    return (
                                        <DraggableAppointment key={a.id} appointment={a} disabled={!canDrag}>
                                            <Card className="p-3">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-bold tabular-nums flex items-center gap-1">
                                                        {canDrag && <GripVertical className="w-3.5 h-3.5 text-muted-foreground/50" />}
                                                        <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                                                        {fmtHour(a.scheduledAt)}
                                                    </span>
                                                    <Badge variant="outline" className={`text-[10px] ${st.cls}`}>{st.label}</Badge>
                                                </div>
                                                <div className="text-xs mt-1 font-medium">{apptPatientName(a)}</div>
                                                <div className="text-xs text-muted-foreground">{a.doctor?.name || "Sem médico definido"}</div>
                                                {ticket ? (
                                                    <div className="flex items-center gap-1 mt-2 text-xs text-emerald-700">
                                                        <TicketCheck className="w-3.5 h-3.5" />
                                                        Na fila · senha <span className="font-bold tabular-nums">{ticket.code}</span>
                                                        {ticket.status === "Concluido" && <Badge variant="secondary" className="text-[10px] ml-1 bg-emerald-100">Concluído</Badge>}
                                                        {ticket.status === "Faltou" && <Badge variant="destructive" className="text-[10px] ml-1 bg-destructive-100">Faltou</Badge>}
                                                    </div>
                                                ) : (
                                                    permissions?.criar && a.status !== "Cancelado" && (
                                                        <Button size="sm" variant="outline" className="w-full mt-2 h-8" disabled={busy === a.id} onClick={() => openTicketFromAppointment(a)}>
                                                            {busy === a.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <PlusCircle className="w-3 h-3" />}Gerar senha
                                                        </Button>
                                                    )
                                                )}
                                                {canDrag && (
                                                    <p className="text-[10px] text-muted-foreground/70 mt-1 text-center">ou arraste para a fila</p>
                                                )}
                                            </Card>
                                        </DraggableAppointment>
                                    )
                                })}
                                {appointments.length === 0 && <p className="text-xs text-muted-foreground text-center py-6">Nenhum agendamento para hoje.</p>}
                            </div>
                        )}
                    </div>
                )}

                {/* Kanban da fila */}
                <div className={agendamentoPerm?.visualizar ? "xl:col-span-4" : "xl:col-span-5"}>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
                            {BOARD_COLUMNS.map(({ key, title }) => {
                                const list = cols[key]
                                const isCollapsed = !!collapsed[key]
                                return (
                                    <DroppableColumn key={key} id={key} className="rounded-xl border bg-muted/30 p-3">
                                        <button
                                            type="button"
                                            onClick={() => toggleCollapse(key)}
                                            className="w-full flex justify-between items-center text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3"
                                        >
                                            <span className="flex items-center gap-1">
                                                {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                                {title}
                                            </span>
                                            <span>{list.length}</span>
                                        </button>
                                        {!isCollapsed && (
                                            <div className="space-y-2 min-h-[80px] max-h-[65vh] overflow-y-auto scrollable pr-1">
                                                {list.map(t => (
                                                    <DraggableTicket key={t.id} ticket={t}>
                                                        {renderTicketCard(t)}
                                                    </DraggableTicket>
                                                ))}
                                                {list.length === 0 && (
                                                    <p className="text-xs text-muted-foreground text-center py-6">
                                                        {key === "Aguardando" ? "Fila vazia." : key === "Concluido" ? "Nada concluído ainda." : "—"}
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </DroppableColumn>
                                )
                            })}
                        </div>
                </div>
            </div>
            <DragOverlay>
                {activeTicket ? (
                    <Card className="p-3 shadow-lg cursor-grabbing">
                        <div className="flex items-center justify-between">
                            <span className="font-bold tabular-nums">{activeTicket.code}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${PRIORITY[activeTicket.priority].cls}`}>{PRIORITY[activeTicket.priority].label}</span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">{nameOf(activeTicket)}</div>
                    </Card>
                ) : activeAppointment ? (
                    <Card className="p-3 shadow-lg cursor-grabbing border-primary">
                        <div className="flex items-center gap-1 font-bold tabular-nums">
                            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                            {fmtHour(activeAppointment.scheduledAt)}
                        </div>
                        <div className="text-xs mt-1 font-medium">{apptPatientName(activeAppointment)}</div>
                        <div className="text-[10px] text-primary mt-1">Soltar na fila para gerar senha</div>
                    </Card>
                ) : null}
            </DragOverlay>
            </DndContext>

            <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setFromAppointment(null) }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Emitir Senha</DialogTitle>
                        <DialogDescription>
                            {fromAppointment
                                ? "Gera uma senha na fila a partir do agendamento selecionado."
                                : "Gera uma nova senha na fila com prioridade. A senha pode ser avulsa, sem vínculo com agendamento."}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        {fromAppointment ? (
                            <div className="rounded-md border bg-muted p-3 text-sm">
                                <div className="font-medium">{apptPatientName(fromAppointment)}</div>
                                <div className="text-xs text-muted-foreground">
                                    Agendado às {fmtHour(fromAppointment.scheduledAt)}
                                    {fromAppointment.doctor?.name ? ` · ${fromAppointment.doctor.name}` : ""}
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="grid gap-2">
                                    <Label>Paciente cadastrado</Label>
                                    <PatientSelect
                                        value={form.patientId}
                                        onChange={(idUser) => setForm(f => ({ ...f, patientId: idUser }))}
                                        placeholder="Buscar paciente cadastrado..."
                                    />
                                </div>
                                {!form.patientId && (
                                        <div className="grid gap-2">
                                            <Label>Ou nome avulso (sem cadastro)</Label>
                                            <Input value={form.patientName} onChange={(e) => setForm(f => ({ ...f, patientName: e.target.value }))} placeholder="Nome do paciente" />
                                        </div>
                                )}
                            </>
                        )}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="grid gap-2">
                                <Label>Setor</Label>
                                <Select value={form.setor} onValueChange={(v) => setForm(f => ({ ...f, setor: v }))}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Triagem">Triagem</SelectItem>
                                        <SelectItem value="Ambulatorio">Ambulatório</SelectItem>
                                        <SelectItem value="Urgencia">Urgência</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label>Prioridade</Label>
                                <Select value={form.priority} onValueChange={(v) => setForm(f => ({ ...f, priority: v }))}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Normal">Normal</SelectItem>
                                        <SelectItem value="Preferencial">Preferencial</SelectItem>
                                        <SelectItem value="Urgencia">Urgência</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setDialogOpen(false)} disabled={saving}>Cancelar</Button>
                        <Button onClick={handleCreate} disabled={saving}>{saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Emitir</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal de senhas excluídas (lixeira) */}
            <Dialog open={deletedOpen} onOpenChange={setDeletedOpen}>
                <DialogContent className="max-h-[85vh] overflow-y-auto scrollable">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2"><Trash2 className="w-4 h-4" />Senhas excluídas (hoje)</DialogTitle>
                        <DialogDescription>
                            Restaure uma senha para devolvê-la à fila. Se o agendamento já tiver outra senha ativa, a restauração é bloqueada.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2">
                        {loadingDeleted && deletedTickets.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-6">Carregando...</p>
                        )}
                        {!loadingDeleted && deletedTickets.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-6">Nenhuma senha excluída hoje.</p>
                        )}
                        {deletedTickets.map(t => (
                            <Card key={t.id} className="p-3">
                                <div className="flex items-center justify-between">
                                    <span className="font-bold tabular-nums">{t.code}</span>
                                    <Badge variant="outline" className="text-[10px]">{t.status}</Badge>
                                </div>
                                <div className="text-xs text-muted-foreground mt-0.5">{nameOf(t)} · {t.setor}{t.doctor ? ` · ${t.doctor.name}` : ""}</div>
                                {t.appointment && (
                                    <div className="flex items-center gap-1 text-[10px] text-primary mt-1">
                                        <CalendarClock className="w-3 h-3" />
                                        Agendado às {fmtHour(t.appointment.scheduledAt)}
                                    </div>
                                )}
                                <Button size="sm" variant="outline" className="w-full mt-2 h-8" disabled={busy === t.id} onClick={() => restoreTicket(t)}>
                                    {busy === t.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}Restaurar
                                </Button>
                            </Card>
                        ))}
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setDeletedOpen(false)}>Fechar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
