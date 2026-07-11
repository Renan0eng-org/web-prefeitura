"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { useAlert } from "@/hooks/use-alert"
import { useAuth } from "@/hooks/use-auth"
import api from "@/services/api"
import { CalendarDays, ChevronLeft, ChevronRight, HandHelping, Loader2, LogIn, LogOut, PlusCircle, Trash2, Undo2 } from "lucide-react"
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

const START_HOUR = 6
const END_HOUR = 23
const HOUR_PX = 44
const DAYS = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"]

const STATUS_STYLE: Record<Status, { box: string; label: string; dot: string }> = {
    Aberto: { box: "bg-amber-50 border-l-4 border-amber-400 text-amber-900", label: "Disponível", dot: "bg-amber-400" },
    Agendado: { box: "bg-blue-50 border-l-4 border-blue-500 text-blue-900", label: "Atribuído", dot: "bg-blue-500" },
    EmAndamento: { box: "bg-emerald-50 border-l-4 border-emerald-500 text-emerald-900", label: "Em andamento", dot: "bg-emerald-500" },
    Concluido: { box: "bg-slate-100 border-l-4 border-slate-300 text-slate-500", label: "Concluído", dot: "bg-slate-300" },
    Cancelado: { box: "bg-red-50 border-l-4 border-red-400 text-red-800 line-through", label: "Cancelado", dot: "bg-red-400" },
}

const startOfWeek = (d: Date) => { const x = new Date(d); x.setDate(x.getDate() - x.getDay()); x.setHours(0, 0, 0, 0); return x }
const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x }
const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
const hourFloat = (iso: string) => { const d = new Date(iso); return d.getHours() + d.getMinutes() / 60 }
const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })

export default function EscalaPage() {
    const [weekStart, setWeekStart] = React.useState(() => startOfWeek(new Date()))
    const [plantoes, setPlantoes] = React.useState<Plantao[]>([])
    const [medicos, setMedicos] = React.useState<any[]>([])
    const [isLoading, setIsLoading] = React.useState(true)
    const [busy, setBusy] = React.useState<string | null>(null)

    const [createOpen, setCreateOpen] = React.useState(false)
    const [form, setForm] = React.useState({ open: true, doctorId: "", setor: "Triagem", date: "", start: "07:00", end: "13:00" })
    const [saving, setSaving] = React.useState(false)

    const [detail, setDetail] = React.useState<Plantao | null>(null)

    const { setAlert } = useAlert()
    const { getPermissions, user } = useAuth()
    const permissions = React.useMemo(() => getPermissions("escala"), [getPermissions])
    const isMedico = (user as any)?.type === "MEDICO"

    const days = React.useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart])
    const hours = React.useMemo(() => Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i), [])

    const fetchData = React.useCallback(async () => {
        try {
            const from = weekStart.toISOString()
            const to = addDays(weekStart, 7).toISOString()
            const [pRes, mRes] = await Promise.all([
                api.get(`/admin/escala?from=${from}&to=${to}`),
                api.get("/admin/medicos").catch(() => ({ data: [] })),
            ])
            setPlantoes(pRes.data)
            setMedicos(mRes.data || [])
        } catch (err: any) {
            setAlert(err.response?.data?.message || "Erro ao carregar escala.", "error")
        } finally {
            setIsLoading(false)
        }
    }, [weekStart, setAlert])

    React.useEffect(() => {
        if (permissions?.visualizar) fetchData()
        else setIsLoading(false)
    }, [permissions?.visualizar, fetchData])

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
    if (!permissions?.visualizar) {
        return <div className="p-2 md:p-4 lg:p-8"><p className="text-muted-foreground">Você não tem permissão para visualizar esta seção.</p></div>
    }

    return (
        <div className="p-2 md:p-4 lg:p-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                    <CalendarDays className="h-6 w-6 text-primary" />
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Escala de Plantão</h1>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <Button variant="outline" size="sm" onClick={() => setWeekStart(startOfWeek(new Date()))}>Hoje</Button>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setWeekStart(addDays(weekStart, -7))}><ChevronLeft className="h-4 w-4" /></Button>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setWeekStart(addDays(weekStart, 7))}><ChevronRight className="h-4 w-4" /></Button>
                    <span className="text-sm font-semibold capitalize min-w-[130px] text-center">{monthLabel}</span>
                    {permissions?.criar && <Button size="sm" onClick={() => { setForm(f => ({ ...f, date: days[0].toISOString().slice(0, 10) })); setCreateOpen(true) }}><PlusCircle className="h-4 w-4" />Novo Plantão</Button>}
                </div>
            </div>

            {/* Mercado de plantões abertos */}
            {abertos.length > 0 && (
                <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50/60 p-3">
                    <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-amber-800">
                        <HandHelping className="h-4 w-4" /> Plantões disponíveis ({abertos.length})
                        <span className="font-normal text-amber-700">— qualquer médico do grupo pode pegar</span>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                        {abertos.map(p => (
                            <div key={p.id} className="shrink-0 rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs">
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
            <div className="flex flex-wrap gap-3 mb-3 text-xs">
                {(Object.keys(STATUS_STYLE) as Status[]).map(s => (
                    <span key={s} className="flex items-center gap-1.5 text-muted-foreground">
                        <span className={`h-2.5 w-2.5 rounded-sm ${STATUS_STYLE[s].dot}`} />{STATUS_STYLE[s].label}
                    </span>
                ))}
            </div>

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
                        <div className="flex" style={{ height: (END_HOUR - START_HOUR) * HOUR_PX }}>
                            {/* gutter de horas */}
                            <div className="w-14 shrink-0 relative">
                                {hours.map((h, i) => (
                                    <div key={h} className="absolute right-1 -translate-y-1/2 text-[11px] text-muted-foreground tabular-nums" style={{ top: i * HOUR_PX }}>
                                        {i > 0 ? `${String(h).padStart(2, "0")}:00` : ""}
                                    </div>
                                ))}
                            </div>

                            {/* colunas dos dias */}
                            {days.map((d, di) => {
                                const eventos = plantoes.filter(p => sameDay(new Date(p.startsAt), d))
                                const today = sameDay(d, now)
                                return (
                                    <div key={di} className="flex-1 relative border-l"
                                        style={{ backgroundImage: `repeating-linear-gradient(to bottom, transparent 0, transparent ${HOUR_PX - 1}px, var(--border, #e5e7eb) ${HOUR_PX - 1}px, var(--border, #e5e7eb) ${HOUR_PX}px)` }}>
                                        {today && nowTop >= 0 && nowTop <= (END_HOUR - START_HOUR) * HOUR_PX && (
                                            <div className="absolute left-0 right-0 z-20 pointer-events-none" style={{ top: nowTop }}>
                                                <div className="h-[2px] bg-red-500" />
                                            </div>
                                        )}
                                        {eventos.map(p => {
                                            const st = eventStyle(p)
                                            const style = STATUS_STYLE[p.status]
                                            return (
                                                <button key={p.id} onClick={() => setDetail(p)}
                                                    className={`absolute left-0.5 right-0.5 z-10 rounded-md px-1.5 py-1 text-left overflow-hidden shadow-sm hover:shadow transition ${style.box}`}
                                                    style={{ top: st.top, height: st.height }}>
                                                    <div className="text-[11px] font-semibold leading-tight truncate">{p.doctor?.name || style.label}</div>
                                                    <div className="text-[10px] leading-tight truncate opacity-80">{p.setor} · {fmtTime(p.startsAt)}–{fmtTime(p.endsAt)}</div>
                                                </button>
                                            )
                                        })}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Dialog de detalhe/ações */}
            <Dialog open={!!detail} onOpenChange={(o) => { if (!o) setDetail(null) }}>
                <DialogContent>
                    {detail && (
                        <>
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    <span className={`h-3 w-3 rounded-sm ${STATUS_STYLE[detail.status].dot}`} />
                                    {detail.doctor?.name || "Plantão disponível"}
                                </DialogTitle>
                                <DialogDescription>
                                    {detail.setor} · {new Date(detail.startsAt).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })} · {fmtTime(detail.startsAt)}–{fmtTime(detail.endsAt)}
                                </DialogDescription>
                            </DialogHeader>
                            <div className="flex items-center gap-2">
                                <Badge variant="outline">{STATUS_STYLE[detail.status].label}</Badge>
                                {detail.doctor?.especialidade && <span className="text-sm text-muted-foreground">{detail.doctor.especialidade}</span>}
                            </div>
                            <DialogFooter className="flex-wrap gap-2">
                                {detail.status === "Aberto" && isMedico && (
                                    <Button disabled={busy === detail.id} onClick={() => doAction(detail.id, "pegar")}>
                                        <HandHelping className="h-4 w-4" />Pegar plantão
                                    </Button>
                                )}
                                {detail.status === "Agendado" && permissions?.editar && (
                                    <Button disabled={busy === detail.id} onClick={() => doAction(detail.id, "checkin")}>
                                        <LogIn className="h-4 w-4" />Check-in
                                    </Button>
                                )}
                                {detail.status === "EmAndamento" && permissions?.editar && (
                                    <Button variant="outline" disabled={busy === detail.id} onClick={() => doAction(detail.id, "checkout")}>
                                        <LogOut className="h-4 w-4" />Check-out
                                    </Button>
                                )}
                                {(detail.status === "Agendado" || detail.status === "EmAndamento") && permissions?.editar && (
                                    <Button variant="outline" disabled={busy === detail.id} onClick={() => doAction(detail.id, "liberar")}>
                                        <Undo2 className="h-4 w-4" />Devolver ao mercado
                                    </Button>
                                )}
                                {permissions?.excluir && (
                                    <Button variant="outline" className="text-destructive hover:text-destructive" disabled={busy === detail.id} onClick={() => removePlantao(detail.id)}>
                                        <Trash2 className="h-4 w-4" />Remover
                                    </Button>
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
        </div>
    )
}
