"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { PlantaoTimeline, TimelineIcon, type PlantaoEvent } from "@/components/escala/plantao-timeline"
import { useAlert } from "@/hooks/use-alert"
import { useAuth } from "@/hooks/use-auth"
import { useEscalaRealtime } from "@/hooks/use-escala-realtime"
import { usePinnedPlantao } from "@/hooks/use-pinned-plantao"
import api from "@/services/api"
import { CalendarDays, ChevronLeft, ChevronRight, HandHelping, Loader2, LogIn, LogOut, Pencil, Pin, PlusCircle, Trash2, Undo2 } from "lucide-react"
import * as React from "react"

type Status = "Aberto" | "Agendado" | "EmAndamento" | "Concluido" | "Cancelado"
type Plantao = {
    id: string
    setor: string
    startsAt: string
    endsAt: string
    status: Status
    checkinAt: string | null
    checkoutAt: string | null
    doctorId: string | null
    doctor: { idUser: string; name: string; especialidade?: string | null } | null
}

const START_HOUR = 0
const END_HOUR = 24
const HOUR_PX = 44
const DAYS = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"]

const STATUS_STYLE: Record<Status, { box: string; label: string; dot: string }> = {
    Aberto: { box: "bg-amber-50 dark:bg-amber-950/40 border-l-4 border-amber-400 text-amber-900 dark:text-amber-200", label: "Disponível", dot: "bg-amber-400" },
    Agendado: { box: "bg-blue-50 dark:bg-blue-950/40 border-l-4 border-blue-500 text-blue-900 dark:text-blue-200", label: "Atribuído", dot: "bg-blue-500" },
    EmAndamento: { box: "bg-emerald-50 dark:bg-emerald-950/40 border-l-4 border-emerald-500 text-emerald-900 dark:text-emerald-200", label: "Em andamento", dot: "bg-emerald-500" },
    Concluido: { box: "bg-slate-100 dark:bg-slate-800/50 border-l-4 border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400", label: "Concluído", dot: "bg-slate-300" },
    Cancelado: { box: "bg-red-50 dark:bg-red-950/40 border-l-4 border-red-400 text-red-800 dark:text-red-300 line-through", label: "Cancelado", dot: "bg-red-400" },
}

const startOfWeek = (d: Date) => { const x = new Date(d); x.setDate(x.getDate() - x.getDay()); x.setHours(0, 0, 0, 0); return x }
const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x }
const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
const hourFloat = (iso: string) => { const d = new Date(iso); return d.getHours() + d.getMinutes() / 60 }
const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })

// --- Interações de arraste no calendário ---
const SNAP_MIN = 15
// No touch, exige um "toque e segure" (long press) para iniciar a interação —
// assim o toque normal continua rolando a tela e só o long press inicia o arraste.
const LONG_PRESS_MS = 320
const LONG_PRESS_MOVE_TOL = 12 // px: se o dedo mover mais que isso antes do long press, é scroll
const MAX_MIN = (END_HOUR - START_HOUR) * 60
const clampMin = (m: number) => Math.max(0, Math.min(MAX_MIN, m))
const snapMin = (m: number) => Math.round(m / SNAP_MIN) * SNAP_MIN
const minToTime = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`
const startMinOf = (iso: string) => { const d = new Date(iso); return d.getHours() * 60 + d.getMinutes() }
const isoAt = (day: Date, min: number) => new Date(day.getFullYear(), day.getMonth(), day.getDate(), Math.floor(min / 60), min % 60, 0).toISOString()
const dateInput = (day: Date) => `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`
const isEditableStatus = (s: Status) => s === "Aberto" || s === "Agendado"

// Layout de colunas para eventos que se sobrepõem no mesmo dia (estilo Google Calendar/Teams):
// eventos concorrentes ficam lado a lado, cada um em sua coluna.
function layoutDayEvents(events: Plantao[]): Map<string, { col: number; cols: number }> {
    const res = new Map<string, { col: number; cols: number }>()
    const sorted = [...events].sort(
        (a, b) => startMinOf(a.startsAt) - startMinOf(b.startsAt) || startMinOf(a.endsAt) - startMinOf(b.endsAt),
    )
    let columns: Plantao[][] = []
    let lastEnd = -1

    const pack = () => {
        const n = columns.length
        columns.forEach((col, i) => col.forEach((ev) => res.set(ev.id, { col: i, cols: n })))
        columns = []
    }

    for (const ev of sorted) {
        const s = startMinOf(ev.startsAt)
        const e = startMinOf(ev.endsAt)
        // Sem sobreposição com o grupo atual -> fecha o grupo.
        if (lastEnd !== -1 && s >= lastEnd) { pack(); lastEnd = -1 }
        let placed = false
        for (const col of columns) {
            const last = col[col.length - 1]
            if (startMinOf(last.endsAt) <= s) { col.push(ev); placed = true; break }
        }
        if (!placed) columns.push([ev])
        if (lastEnd === -1 || e > lastEnd) lastEnd = e
    }
    pack()
    return res
}

type DragKind = "create" | "move" | "duplicate" | "resize-top" | "resize-bottom"
type DragState = {
    kind: DragKind
    plantao?: Plantao
    originDay: number
    anchorMin: number      // create: min do pointerdown | move/resize: início original
    durationMin: number    // move/duplicate: duração do evento
    grabOffsetMin: number  // move/duplicate: (min do ponteiro - início) no momento do grab
    curDay: number
    curStartMin: number
    curEndMin: number
    moved: boolean
}

export default function EscalaPage() {
    const [weekStart, setWeekStart] = React.useState(() => startOfWeek(new Date()))
    const [plantoes, setPlantoes] = React.useState<Plantao[]>([])
    const [medicos, setMedicos] = React.useState<any[]>([])
    const [isLoading, setIsLoading] = React.useState(true)
    const [busy, setBusy] = React.useState<string | null>(null)

    const [createOpen, setCreateOpen] = React.useState(false)
    const [form, setForm] = React.useState({ open: false, doctorId: "", setor: "Triagem", date: "", start: "07:00", end: "13:00" })
    const [saving, setSaving] = React.useState(false)

    const [editOpen, setEditOpen] = React.useState(false)
    const [editForm, setEditForm] = React.useState({ id: "", open: false, doctorId: "", setor: "Triagem", date: "", start: "07:00", end: "13:00" })
    const [savingEdit, setSavingEdit] = React.useState(false)

    const [detail, setDetail] = React.useState<Plantao | null>(null)
    const [showDeleted, setShowDeleted] = React.useState(false)

    // Histórico (timeline) do plantão selecionado.
    const [history, setHistory] = React.useState<PlantaoEvent[]>([])
    const [loadingHistory, setLoadingHistory] = React.useState(false)
    const historyScrollRef = React.useRef<HTMLDivElement | null>(null)

    // Grade de interação (arraste para criar/mover/redimensionar/duplicar).
    const gridRef = React.useRef<HTMLDivElement | null>(null)
    const [drag, setDrag] = React.useState<DragState | null>(null)
    const dragRef = React.useRef<DragState | null>(null)
    const setDragState = (d: DragState | null) => { dragRef.current = d; setDrag(d) }
    // Long-press pendente (touch): guarda a interação até o toque ser mantido.
    const pendingRef = React.useRef<{ desc: DragState; startX: number; startY: number; timer: number } | null>(null)
    const [longPressing, setLongPressing] = React.useState(false)

    const { setAlert } = useAlert()
    const { getPermissions, user } = useAuth()
    const permissions = React.useMemo(() => getPermissions("escala"), [getPermissions])
    const escalaAdminPerm = React.useMemo(() => getPermissions("escala-admin"), [getPermissions])
    const isMedico = (user as any)?.type === "MEDICO"
    // "Escala de Plantão Admin": pode criar/editar/excluir e gerir qualquer plantão.
    const isEscalaAdmin = !!escalaAdminPerm?.visualizar
    const canView = !!permissions?.visualizar || isEscalaAdmin
    // Check-in / check-out / devolução: só o médico do próprio plantão ou um admin da escala.
    const canManageShift = React.useCallback(
        (p: Plantao) => isEscalaAdmin || (!!p.doctorId && p.doctorId === (user as any)?.idUser),
        [isEscalaAdmin, user],
    )

    const days = React.useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart])
    const hours = React.useMemo(() => Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i), [])

    const fetchData = React.useCallback(async () => {
        try {
            const from = weekStart.toISOString()
            const to = addDays(weekStart, 7).toISOString()
            const [pRes, mRes] = await Promise.all([
                api.get(`/admin/escala?from=${from}&to=${to}${showDeleted ? "&deleted=true" : ""}`),
                api.get("/admin/medicos").catch(() => ({ data: [] })),
            ])
            setPlantoes(pRes.data)
            setMedicos(mRes.data || [])
        } catch (err: any) {
            setAlert(err.response?.data?.message || "Erro ao carregar escala.", "error")
        } finally {
            setIsLoading(false)
        }
    }, [weekStart, setAlert, showDeleted])

    React.useEffect(() => {
        if (canView) fetchData()
        else setIsLoading(false)
    }, [canView, fetchData])

    const { pin } = usePinnedPlantao()

    const loadHistory = React.useCallback(async (plantaoId: string, showLoader = false) => {
        if (showLoader) setLoadingHistory(true)
        try {
            const res = await api.get(`/admin/escala/${plantaoId}/historico`)
            setHistory(Array.isArray(res.data) ? res.data : [])
        } catch {
            setHistory([])
        } finally {
            setLoadingHistory(false)
        }
    }, [])

    // Atualização em tempo real: refaz a lista e, se o detalhe estiver aberto, seu histórico.
    const liveConnected = useEscalaRealtime(() => {
        fetchData()
        if (detail?.id) loadHistory(detail.id)
    }, canView)

    // Carrega a timeline de histórico ao abrir o detalhe de um plantão.
    React.useEffect(() => {
        if (!detail?.id) { setHistory([]); return }
        loadHistory(detail.id, true)
    }, [detail?.id, loadHistory])

    // Mantém a visão no evento mais recente (rola para o fim ao mudar o histórico).
    React.useEffect(() => {
        const el = historyScrollRef.current
        if (el) requestAnimationFrame(() => el.scrollTo({ top: el.scrollHeight, behavior: "smooth" }))
    }, [history])

    // Permissões das interações de calendário.
    const canCreateShift = !!escalaAdminPerm?.criar && !showDeleted
    const canEditShift = !!escalaAdminPerm?.editar && !showDeleted

    const pointerToGrid = (clientX: number, clientY: number) => {
        const rect = gridRef.current?.getBoundingClientRect()
        if (!rect) return { day: 0, min: 0 }
        const colW = rect.width / 7
        const day = Math.max(0, Math.min(6, Math.floor((clientX - rect.left) / colW)))
        const min = clampMin(snapMin(((clientY - rect.top) / HOUR_PX) * 60))
        return { day, min }
    }

    const clearPending = () => {
        if (pendingRef.current) { clearTimeout(pendingRef.current.timer); pendingRef.current = null }
        setLongPressing(false)
    }

    // Mouse: inicia na hora. Touch/caneta: exige long-press (evita conflito com o scroll).
    const beginInteraction = (e: React.PointerEvent, desc: DragState) => {
        if (e.pointerType === "mouse") {
            setDragState(desc)
            return
        }
        const timer = window.setTimeout(() => {
            pendingRef.current = null
            setLongPressing(false)
            setDragState(desc)
            if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(15)
        }, LONG_PRESS_MS)
        pendingRef.current = { desc, startX: e.clientX, startY: e.clientY, timer }
        setLongPressing(true)
    }

    // Arrastar em área vazia -> criar plantão (abre modal com o horário selecionado).
    const startCreateDrag = (e: React.PointerEvent) => {
        if (!canCreateShift || e.button !== 0) return
        if ((e.target as HTMLElement).closest("[data-plantao]")) return
        const { day, min } = pointerToGrid(e.clientX, e.clientY)
        beginInteraction(e, { kind: "create", originDay: day, anchorMin: min, durationMin: 0, grabOffsetMin: 0, curDay: day, curStartMin: min, curEndMin: min, moved: false })
    }

    // Arrastar o corpo do evento -> mover (ou duplicar com Alt).
    const startEventDrag = (e: React.PointerEvent, p: Plantao, di: number) => {
        if (!canEditShift || !isEditableStatus(p.status) || e.button !== 0) return
        e.stopPropagation()
        const { min } = pointerToGrid(e.clientX, e.clientY)
        const s = startMinOf(p.startsAt), en = startMinOf(p.endsAt)
        const duplicate = e.altKey && !!escalaAdminPerm?.criar
        beginInteraction(e, { kind: duplicate ? "duplicate" : "move", plantao: p, originDay: di, anchorMin: s, durationMin: en - s, grabOffsetMin: min - s, curDay: di, curStartMin: s, curEndMin: en, moved: false })
    }

    // Arrastar as bordas -> redimensionar o tempo.
    const startResizeDrag = (e: React.PointerEvent, p: Plantao, di: number, edge: "top" | "bottom") => {
        if (!canEditShift || !isEditableStatus(p.status) || e.button !== 0) return
        e.stopPropagation()
        const s = startMinOf(p.startsAt), en = startMinOf(p.endsAt)
        beginInteraction(e, { kind: edge === "top" ? "resize-top" : "resize-bottom", plantao: p, originDay: di, anchorMin: s, durationMin: en - s, grabOffsetMin: 0, curDay: di, curStartMin: s, curEndMin: en, moved: false })
    }

    // Listeners globais durante um arraste (move + up).
    React.useEffect(() => {
        const onMove = (e: PointerEvent) => {
            // Long-press pendente: se o dedo mover antes de ativar, é scroll → cancela.
            if (pendingRef.current) {
                const dx = e.clientX - pendingRef.current.startX
                const dy = e.clientY - pendingRef.current.startY
                if (Math.hypot(dx, dy) > LONG_PRESS_MOVE_TOL) clearPending()
                return
            }
            const d = dragRef.current
            if (!d) return
            e.preventDefault()
            const rect = gridRef.current?.getBoundingClientRect()
            if (!rect) return
            const colW = rect.width / 7
            const day = Math.max(0, Math.min(6, Math.floor((e.clientX - rect.left) / colW)))
            const min = clampMin(snapMin(((e.clientY - rect.top) / HOUR_PX) * 60))
            let next: DragState
            if (d.kind === "create") {
                next = { ...d, curDay: d.originDay, curStartMin: Math.min(d.anchorMin, min), curEndMin: Math.max(d.anchorMin, min), moved: Math.abs(min - d.anchorMin) >= SNAP_MIN }
            } else if (d.kind === "move" || d.kind === "duplicate") {
                const ns = Math.max(0, Math.min(clampMin(min - d.grabOffsetMin), MAX_MIN - d.durationMin))
                next = { ...d, curDay: day, curStartMin: ns, curEndMin: ns + d.durationMin, moved: d.moved || day !== d.originDay || Math.abs(ns - d.anchorMin) >= SNAP_MIN }
            } else if (d.kind === "resize-top") {
                next = { ...d, curStartMin: Math.max(0, Math.min(min, d.curEndMin - SNAP_MIN)), moved: true }
            } else {
                next = { ...d, curEndMin: Math.min(MAX_MIN, Math.max(min, d.curStartMin + SNAP_MIN)), moved: true }
            }
            dragRef.current = next
            setDrag(next)
        }
        const finalizeDrag = async (d: DragState) => {
            if (!d.moved) {
                // Clique simples (sem arraste): abre o detalhe.
                if ((d.kind === "move" || d.kind === "duplicate") && d.plantao) setDetail(d.plantao)
                return
            }
            if (d.kind === "create") {
                setForm({ open: false, doctorId: "", setor: "Triagem", date: dateInput(days[d.originDay]), start: minToTime(d.curStartMin), end: minToTime(d.curEndMin) })
                setCreateOpen(true)
                return
            }
            const startsAt = isoAt(days[d.curDay], d.curStartMin)
            const endsAt = isoAt(days[d.curDay], d.curEndMin)
            try {
                if (d.plantao) setBusy(d.plantao.id)
                if (d.kind === "duplicate" && d.plantao) {
                    await api.post("/admin/escala", { doctorId: d.plantao.doctorId || undefined, setor: d.plantao.setor, startsAt, endsAt })
                    setAlert("Plantão duplicado!", "success")
                } else if (d.plantao) {
                    await api.put(`/admin/escala/${d.plantao.id}`, { startsAt, endsAt })
                    setAlert("Plantão atualizado!", "success")
                }
                await fetchData()
            } catch (err: any) {
                setAlert(err.response?.data?.message || "Erro ao salvar o plantão.", "error")
            } finally {
                setBusy(null)
            }
        }
        const onUp = () => {
            // Toque solto antes do long-press ativar: trata como toque simples.
            if (pendingRef.current) {
                const desc = pendingRef.current.desc
                clearPending()
                if ((desc.kind === "move" || desc.kind === "duplicate") && desc.plantao) setDetail(desc.plantao)
                return
            }
            const d = dragRef.current
            if (!d) return
            dragRef.current = null
            setDrag(null)
            void finalizeDrag(d)
        }
        // Bloqueia o scroll do navegador apenas enquanto há um arraste ativo.
        const onTouchMove = (e: TouchEvent) => { if (dragRef.current) e.preventDefault() }
        window.addEventListener("pointermove", onMove)
        window.addEventListener("pointerup", onUp)
        window.addEventListener("pointercancel", onUp)
        window.addEventListener("touchmove", onTouchMove, { passive: false })
        return () => {
            window.removeEventListener("pointermove", onMove)
            window.removeEventListener("pointerup", onUp)
            window.removeEventListener("pointercancel", onUp)
            window.removeEventListener("touchmove", onTouchMove)
        }
    }, [days, fetchData, setAlert])

    const doAction = async (id: string, path: string) => {
        setBusy(id)
        try {
            await api.post(`/admin/escala/${id}/${path}`)
            setDetail(null)
            await fetchData()
        } catch (err: any) {
            setAlert(err.response?.data?.message || "Erro na ação.", "error")
        } finally {
            setBusy(null)
        }
    }

    const removePlantao = async (id: string) => {
        setBusy(id)
        try {
            await api.delete(`/admin/escala/${id}`)
            setDetail(null)
            await fetchData()
        } catch (err: any) {
            setAlert(err.response?.data?.message || "Erro ao remover.", "error")
        } finally {
            setBusy(null)
        }
    }

    const openEdit = (p: Plantao) => {
        const s = new Date(p.startsAt), e = new Date(p.endsAt)
        const hhmm = (d: Date) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
        setEditForm({ id: p.id, open: !p.doctorId, doctorId: p.doctorId || "", setor: p.setor, date: dateInput(s), start: hhmm(s), end: hhmm(e) })
        setDetail(null)
        setEditOpen(true)
    }

    const handleEdit = async () => {
        if (!editForm.open && !editForm.doctorId) return setAlert("Selecione o médico ou deixe em aberto.", "error")
        if (!editForm.date) return setAlert("Selecione a data.", "error")
        setSavingEdit(true)
        try {
            const startsAt = new Date(`${editForm.date}T${editForm.start}:00`).toISOString()
            const endsAt = new Date(`${editForm.date}T${editForm.end}:00`).toISOString()
            await api.put(`/admin/escala/${editForm.id}`, {
                doctorId: editForm.open ? "" : editForm.doctorId,
                setor: editForm.setor, startsAt, endsAt,
            })
            setAlert("Plantão atualizado!", "success")
            setEditOpen(false)
            fetchData()
        } catch (err: any) {
            setAlert(err.response?.data?.message || "Erro ao editar plantão.", "error")
        } finally {
            setSavingEdit(false)
        }
    }

    const handleCreate = async () => {
        if (!form.open && !form.doctorId) return setAlert("Selecione o médico ou deixe em aberto.", "error")
        if (!form.date) return setAlert("Selecione a data.", "error")
        setSaving(true)
        try {
            const startsAt = new Date(`${form.date}T${form.start}:00`).toISOString()
            const endsAt = new Date(`${form.date}T${form.end}:00`).toISOString()
            await api.post("/admin/escala", {
                doctorId: form.open ? undefined : form.doctorId,
                setor: form.setor, startsAt, endsAt,
            })
            setAlert(form.open ? "Plantão publicado no mercado!" : "Plantão atribuído!", "success")
            setCreateOpen(false)
            fetchData()
        } catch (err: any) {
            setAlert(err.response?.data?.message || "Erro ao criar plantão.", "error")
        } finally {
            setSaving(false)
        }
    }

    const abertos = React.useMemo(() => plantoes.filter(p => p.status === "Aberto"), [plantoes])
    const monthLabel = weekStart.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })

    // posição de um evento dentro da coluna do dia
    const eventStyle = (p: Plantao) => {
        const top = Math.max(0, (hourFloat(p.startsAt) - START_HOUR)) * HOUR_PX
        const rawH = (hourFloat(p.endsAt) - hourFloat(p.startsAt)) * HOUR_PX
        return { top, height: Math.max(22, rawH) }
    }

    const now = new Date()
    const nowTop = (now.getHours() + now.getMinutes() / 60 - START_HOUR) * HOUR_PX

    if (isLoading) {
        return <div className="p-2 md:p-4 lg:p-8"><Skeleton className="h-8 w-1/3 mb-6" /><Skeleton className="h-[600px] w-full rounded-xl" /></div>
    }
    if (!canView) {
        return <div className="p-2 md:p-4 lg:p-8"><p className="text-muted-foreground">Você não tem permissão para visualizar esta seção.</p></div>
    }

    return (
        <div className="p-2 md:p-4 lg:p-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                    <CalendarDays className="h-6 w-6 text-primary" />
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Escala de Plantão</h1>
                    <span
                        className={`flex items-center gap-1.5 text-[11px] font-medium ${liveConnected ? "text-emerald-600" : "text-muted-foreground"}`}
                        title={liveConnected ? "Atualizando em tempo real" : "Sem conexão em tempo real"}
                    >
                        <span className={`h-2 w-2 rounded-full ${liveConnected ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground/40"}`} />
                        {liveConnected ? "Ao vivo" : "Offline"}
                    </span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <Button variant="outline" size="sm" onClick={() => setWeekStart(startOfWeek(new Date()))}>Hoje</Button>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setWeekStart(addDays(weekStart, -7))}><ChevronLeft className="h-4 w-4" /></Button>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setWeekStart(addDays(weekStart, 7))}><ChevronRight className="h-4 w-4" /></Button>
                    <span className="text-sm font-semibold capitalize min-w-[130px] text-center">{monthLabel}</span>
                    {escalaAdminPerm?.excluir && (
                        <Button variant={showDeleted ? "default" : "outline"} size="sm" onClick={() => setShowDeleted(v => !v)}>
                            <Trash2 className="h-4 w-4" />{showDeleted ? "Ativos" : "Excluídos"}
                        </Button>
                    )}
                    {escalaAdminPerm?.criar && !showDeleted && <Button size="sm" onClick={() => { setForm(f => ({ ...f, date: days[0].toISOString().slice(0, 10) })); setCreateOpen(true) }}><PlusCircle className="h-4 w-4" />Novo Plantão</Button>}
                </div>
            </div>

            {/* Mercado de plantões abertos */}
            {!showDeleted && abertos.length > 0 && (
                <div className="mb-4 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/60 dark:bg-amber-950/30 p-3">
                    <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-amber-800 dark:text-amber-300">
                        <HandHelping className="h-4 w-4" /> Plantões disponíveis ({abertos.length})
                        <span className="font-normal text-amber-700 dark:text-amber-400/80">— qualquer médico do grupo pode pegar</span>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                        {abertos.map(p => (
                            <div key={p.id} className="shrink-0 rounded-lg border border-amber-300 dark:border-amber-900/60 bg-card px-3 py-2 text-xs">
                                <div className="font-semibold">{p.setor}</div>
                                <div className="text-muted-foreground">{new Date(p.startsAt).toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit" })} · {fmtTime(p.startsAt)}–{fmtTime(p.endsAt)}</div>
                                {isMedico && (
                                    <Button size="sm" className="h-7 mt-1 w-full" disabled={busy === p.id} onClick={() => doAction(p.id, "pegar")}>
                                        {busy === p.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <HandHelping className="h-3 w-3" />}Pegar
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Legenda */}
            <div className="flex flex-wrap gap-3 mb-2 text-xs">
                {(Object.keys(STATUS_STYLE) as Status[]).map(s => (
                    <span key={s} className="flex items-center gap-1.5 text-muted-foreground">
                        <span className={`h-2.5 w-2.5 rounded-sm ${STATUS_STYLE[s].dot}`} />{STATUS_STYLE[s].label}
                    </span>
                ))}
            </div>
            {(canCreateShift || canEditShift) && (
                <p className="text-xs text-muted-foreground mb-3">
                    Arraste em um espaço livre para criar um plantão. Arraste um plantão pelo meio para movê-lo de dia/horário, pelas bordas para esticar ou encurtar, e segure <kbd className="px-1 rounded border bg-muted">Alt</kbd> ao arrastar para duplicar. No celular, <strong>toque e segure</strong> para começar a criar ou editar (o toque comum continua rolando a tela).
                </p>
            )}

            {/* Calendário */}
            <div className="rounded-xl border bg-card overflow-hidden">
                <div className="overflow-x-auto">
                    <div className="min-w-[760px]">
                        {/* cabeçalho dos dias */}
                        <div className="flex border-b bg-muted/40">
                            <div className="w-14 shrink-0" />
                            {days.map((d, i) => {
                                const today = sameDay(d, now)
                                return (
                                    <div key={i} className={`flex-1 px-2 py-2 text-center border-l ${today ? "bg-primary/5" : ""}`}>
                                        <div className={`text-lg font-semibold ${today ? "text-primary" : ""}`}>{String(d.getDate()).padStart(2, "0")}</div>
                                        <div className={`text-[11px] ${today ? "text-primary font-medium" : "text-muted-foreground"}`}>{DAYS[i]}</div>
                                    </div>
                                )
                            })}
                        </div>

                        {/* corpo */}
                        <div className={`flex ${drag ? "select-none" : ""}`} style={{ height: (END_HOUR - START_HOUR) * HOUR_PX }}>
                            {/* gutter de horas */}
                            <div className="w-14 shrink-0 relative">
                                {hours.map((h, i) => (
                                    <div key={h} className="absolute right-1 -translate-y-1/2 text-[11px] text-muted-foreground tabular-nums" style={{ top: i * HOUR_PX }}>
                                        {i > 0 ? `${String(h).padStart(2, "0")}:00` : ""}
                                    </div>
                                ))}
                            </div>

                            {/* grade dos dias (área de interação por arraste) */}
                            <div ref={gridRef} className={`flex flex-1 relative transition ${longPressing ? "ring-2 ring-inset ring-primary/50" : ""}`} onPointerDown={startCreateDrag}>
                            {days.map((d, di) => {
                                const eventos = plantoes.filter(p => sameDay(new Date(p.startsAt), d))
                                const layout = layoutDayEvents(eventos)
                                const today = sameDay(d, now)
                                return (
                                    <div key={di} className={`flex-1 relative border-l ${canCreateShift ? "cursor-crosshair" : ""}`}
                                        style={{ backgroundImage: `repeating-linear-gradient(to bottom, transparent 0, transparent ${HOUR_PX - 1}px, hsl(var(--border)) ${HOUR_PX - 1}px, hsl(var(--border)) ${HOUR_PX}px)` }}>
                                        {today && nowTop >= 0 && nowTop <= (END_HOUR - START_HOUR) * HOUR_PX && (
                                            <div className="absolute left-0 right-0 z-20 pointer-events-none" style={{ top: nowTop }}>
                                                <div className="h-[2px] bg-red-500" />
                                            </div>
                                        )}
                                        {eventos.map(p => {
                                            const st = eventStyle(p)
                                            const style = STATUS_STYLE[p.status]
                                            const interactive = canEditShift && isEditableStatus(p.status)
                                            const dimmed = !!drag && drag.plantao?.id === p.id && drag.kind !== "duplicate"
                                            // Posição horizontal: eventos sobrepostos ficam lado a lado.
                                            const lay = layout.get(p.id) || { col: 0, cols: 1 }
                                            const wPct = 100 / lay.cols
                                            const posStyle = { left: `calc(${lay.col * wPct}% + 2px)`, width: `calc(${wPct}% - 4px)` }
                                            if (interactive) {
                                                return (
                                                    <div key={p.id} data-plantao
                                                        className={`absolute z-10 rounded-md overflow-hidden shadow-sm hover:shadow transition ${style.box} ${dimmed ? "opacity-30" : ""}`}
                                                        style={{ top: st.top, height: st.height, cursor: "grab", ...posStyle }}
                                                        onPointerDown={(e) => startEventDrag(e, p, di)}
                                                        title="Arraste para mover · bordas p/ redimensionar · Alt p/ duplicar">
                                                        <div className="absolute top-0 left-0 right-0 h-2 z-20 cursor-ns-resize" onPointerDown={(e) => startResizeDrag(e, p, di, "top")} />
                                                        <div className="px-1.5 py-1 pointer-events-none">
                                                            <div className="text-[11px] font-semibold leading-tight truncate">{p.doctor?.name || style.label}</div>
                                                            <div className="text-[10px] leading-tight truncate opacity-80">{p.setor} · {fmtTime(p.startsAt)}–{fmtTime(p.endsAt)}</div>
                                                        </div>
                                                        <div className="absolute bottom-0 left-0 right-0 h-2 z-20 cursor-ns-resize" onPointerDown={(e) => startResizeDrag(e, p, di, "bottom")} />
                                                    </div>
                                                )
                                            }
                                            return (
                                                <button key={p.id} data-plantao onClick={() => setDetail(p)}
                                                    className={`absolute z-10 rounded-md px-1.5 py-1 text-left overflow-hidden shadow-sm hover:shadow transition ${style.box}`}
                                                    style={{ top: st.top, height: st.height, ...posStyle }}>
                                                    <div className="text-[11px] font-semibold leading-tight truncate">{p.doctor?.name || style.label}</div>
                                                    <div className="text-[10px] leading-tight truncate opacity-80">{p.setor} · {fmtTime(p.startsAt)}–{fmtTime(p.endsAt)}</div>
                                                </button>
                                            )
                                        })}
                                        {/* preview do arraste (criar/mover/redimensionar/duplicar) */}
                                        {drag && drag.curDay === di && (
                                            <div className="absolute left-0.5 right-0.5 z-30 rounded-md border-2 border-dashed border-primary bg-primary/10 pointer-events-none"
                                                style={{ top: (drag.curStartMin / 60) * HOUR_PX, height: Math.max(14, ((drag.curEndMin - drag.curStartMin) / 60) * HOUR_PX) }}>
                                                <div className="text-[10px] px-1 text-primary font-semibold leading-tight">
                                                    {minToTime(drag.curStartMin)}–{minToTime(drag.curEndMin)}{drag.kind === "duplicate" ? " (cópia)" : ""}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Dialog de detalhe/ações */}
            <Dialog open={!!detail} onOpenChange={(o) => { if (!o) setDetail(null) }}>
                <DialogContent className="max-h-[88vh] !flex flex-col overflow-hidden gap-0 p-0">
                    {detail && (
                        <>
                            <div className="p-3 bg-card/70">

                            {/* Fixar como card flutuante (ao lado do X) */}
                            <button
                                type="button"
                                onClick={() => { pin(detail.id); setDetail(null) }}
                                className="absolute right-11 top-4 rounded-sm opacity-70 hover:opacity-100 transition-opacity z-10"
                                title="Fixar na tela (card flutuante)"
                                aria-label="Fixar na tela"
                            >
                                <Pin className="h-4 w-4" />
                            </button>
                            {/* Header fixo */}
                            <DialogHeader className="shrink-0">
                                <DialogTitle className="flex items-center gap-2">
                                    <span className={`h-3 w-3 rounded-sm ${STATUS_STYLE[detail.status].dot}`} />
                                    {detail.doctor?.name || "Plantão disponível"}
                                </DialogTitle>
                                <DialogDescription>
                                    {detail.setor} · {new Date(detail.startsAt).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })} · {fmtTime(detail.startsAt)}–{fmtTime(detail.endsAt)}
                                </DialogDescription>
                            </DialogHeader>
                            <div className="flex items-center gap-2 shrink-0 mt-3">
                                <Badge variant="outline">{STATUS_STYLE[detail.status].label}</Badge>
                                {detail.doctor?.especialidade && <span className="text-sm text-muted-foreground">{detail.doctor.especialidade}</span>}
                            </div>
                            </div>

                            <hr className="bg-card" />

                            {/* Histórico / timeline — painel branco, meio scrollável */}
                            <div className="flex-1 min-h-0 flex flex-col bg-card text-card-foreground p-3">
                                <div className="flex items-center justify-between mb-1 shrink-0">
                                    <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                                        <TimelineIcon className="h-4 w-4" /> Histórico
                                    </div>
                                    {history.length > 0 && <span className="text-xs text-muted-foreground">{history.length} evento{history.length > 1 ? "s" : ""}</span>}
                                </div>
                                <div ref={historyScrollRef} className="flex-1 min-h-0 overflow-y-auto scrollable pr-1">
                                    {loadingHistory ? (
                                        <p className="text-sm text-muted-foreground text-center py-6">Carregando histórico...</p>
                                    ) : (
                                        <PlantaoTimeline events={history} />
                                    )}
                                </div>
                            </div>

                            <hr className="bg-card" />

                            <DialogFooter className="flex-wrap gap-2 shrink-0 border-t p-3 bg-card/70">
                                {showDeleted ? (
                                    escalaAdminPerm?.excluir && (
                                        <Button disabled={busy === detail.id} onClick={() => doAction(detail.id, "restaurar")}>
                                            <Undo2 className="h-4 w-4" />Restaurar
                                        </Button>
                                    )
                                ) : (
                                  <>
                                {escalaAdminPerm?.editar && isEditableStatus(detail.status) && (
                                    <Button variant="outline" onClick={() => openEdit(detail)}>
                                        <Pencil className="h-4 w-4" />Editar
                                    </Button>
                                )}
                                {detail.status === "Aberto" && isMedico && (
                                    <Button disabled={busy === detail.id} onClick={() => doAction(detail.id, "pegar")}>
                                        <HandHelping className="h-4 w-4" />Pegar plantão
                                    </Button>
                                )}
                                {detail.status === "Agendado" && canManageShift(detail) && (
                                    <Button disabled={busy === detail.id} onClick={() => doAction(detail.id, "checkin")}>
                                        <LogIn className="h-4 w-4" />Check-in
                                    </Button>
                                )}
                                {detail.status === "EmAndamento" && canManageShift(detail) && (
                                    <Button variant="outline" disabled={busy === detail.id} onClick={() => doAction(detail.id, "checkout")}>
                                        <LogOut className="h-4 w-4" />Check-out
                                    </Button>
                                )}
                                {(detail.status === "Agendado" || detail.status === "EmAndamento") && canManageShift(detail) && (
                                    <Button variant="outline" disabled={busy === detail.id} onClick={() => doAction(detail.id, "liberar")}>
                                        <Undo2 className="h-4 w-4" />Devolver ao mercado
                                    </Button>
                                )}
                                {escalaAdminPerm?.excluir && (
                                    <Button variant="outline" className="text-destructive hover:text-destructive" disabled={busy === detail.id} onClick={() => removePlantao(detail.id)}>
                                        <Trash2 className="h-4 w-4" />Remover
                                    </Button>
                                )}
                                  </>
                                )}
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* Dialog criar */}
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Novo Plantão</DialogTitle>
                        <DialogDescription>Publique no mercado (qualquer médico pega) ou atribua direto a um médico.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between rounded-lg border p-3">
                            <div>
                                <Label className="text-sm">Deixar em aberto</Label>
                                <p className="text-xs text-muted-foreground">Publica no mercado para o grupo pegar.</p>
                            </div>
                            <Switch checked={form.open} onCheckedChange={(v) => setForm(f => ({ ...f, open: v }))} />
                        </div>
                        {!form.open && (
                            <div className="grid gap-2">
                                <Label>Médico</Label>
                                <Select value={form.doctorId} onValueChange={(v) => setForm(f => ({ ...f, doctorId: v }))}>
                                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                    <SelectContent>
                                        {medicos.map((m: any) => <SelectItem key={m.idUser} value={m.idUser}>{m.name} — {m.especialidade}</SelectItem>)}
                                        {medicos.length === 0 && <div className="px-2 py-1.5 text-sm text-muted-foreground">Cadastre médicos primeiro</div>}
                                    </SelectContent>
                                </Select>
                            </div>
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
                            <div className="grid gap-2"><Label>Data</Label><Input type="date" value={form.date} onChange={(e) => setForm(f => ({ ...f, date: e.target.value }))} /></div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="grid gap-2"><Label>Início</Label><Input type="time" value={form.start} onChange={(e) => setForm(f => ({ ...f, start: e.target.value }))} /></div>
                            <div className="grid gap-2"><Label>Fim</Label><Input type="time" value={form.end} onChange={(e) => setForm(f => ({ ...f, end: e.target.value }))} /></div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setCreateOpen(false)} disabled={saving}>Cancelar</Button>
                        <Button onClick={handleCreate} disabled={saving}>{saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}{form.open ? "Publicar" : "Atribuir"}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Dialog editar */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Editar Plantão</DialogTitle>
                        <DialogDescription>Altere o médico, o setor ou o horário do plantão.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between rounded-lg border p-3">
                            <div>
                                <Label className="text-sm">Deixar em aberto</Label>
                                <p className="text-xs text-muted-foreground">Remove o médico e devolve ao mercado.</p>
                            </div>
                            <Switch checked={editForm.open} onCheckedChange={(v) => setEditForm(f => ({ ...f, open: v }))} />
                        </div>
                        {!editForm.open && (
                            <div className="grid gap-2">
                                <Label>Médico</Label>
                                <Select value={editForm.doctorId} onValueChange={(v) => setEditForm(f => ({ ...f, doctorId: v }))}>
                                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                    <SelectContent>
                                        {medicos.map((m: any) => <SelectItem key={m.idUser} value={m.idUser}>{m.name} — {m.especialidade}</SelectItem>)}
                                        {medicos.length === 0 && <div className="px-2 py-1.5 text-sm text-muted-foreground">Cadastre médicos primeiro</div>}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="grid gap-2">
                                <Label>Setor</Label>
                                <Select value={editForm.setor} onValueChange={(v) => setEditForm(f => ({ ...f, setor: v }))}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Triagem">Triagem</SelectItem>
                                        <SelectItem value="Ambulatorio">Ambulatório</SelectItem>
                                        <SelectItem value="Urgencia">Urgência</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2"><Label>Data</Label><Input type="date" value={editForm.date} onChange={(e) => setEditForm(f => ({ ...f, date: e.target.value }))} /></div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="grid gap-2"><Label>Início</Label><Input type="time" value={editForm.start} onChange={(e) => setEditForm(f => ({ ...f, start: e.target.value }))} /></div>
                            <div className="grid gap-2"><Label>Fim</Label><Input type="time" value={editForm.end} onChange={(e) => setEditForm(f => ({ ...f, end: e.target.value }))} /></div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setEditOpen(false)} disabled={savingEdit}>Cancelar</Button>
                        <Button onClick={handleEdit} disabled={savingEdit}>{savingEdit && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Salvar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
