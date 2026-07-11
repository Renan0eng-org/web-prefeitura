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
import { Loader2, PhoneCall, PlusCircle, RefreshCcw } from "lucide-react"
import * as React from "react"

type Ticket = {
    id: string
    code: string
    setor: string
    priority: "Normal" | "Preferencial" | "Urgencia"
    status: "Aguardando" | "Chamado" | "EmAtendimento" | "Concluido" | "Cancelado" | "Faltou"
    patientName: string | null
    patient?: { idUser: string; name: string } | null
    doctor?: { idUser: string; name: string } | null
}
type Stats = { aguardando: number; chamado: number; emAtendimento: number; concluidos: number; avgWaitSeconds: number }

const PRIORITY: Record<string, { label: string; cls: string }> = {
    Urgencia: { label: "Urgência", cls: "bg-red-100 text-red-700" },
    Preferencial: { label: "Prefer.", cls: "bg-amber-100 text-amber-700" },
    Normal: { label: "Normal", cls: "bg-slate-100 text-slate-600" },
}

function fmtWait(s: number) {
    const m = Math.floor(s / 60), sec = s % 60
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
}

export default function FilaPage() {
    const [tickets, setTickets] = React.useState<Ticket[]>([])
    const [stats, setStats] = React.useState<Stats | null>(null)
    const [isLoading, setIsLoading] = React.useState(true)
    const [busy, setBusy] = React.useState<string | null>(null)

    const [dialogOpen, setDialogOpen] = React.useState(false)
    const [form, setForm] = React.useState({ patientName: "", setor: "Triagem", priority: "Normal" })
    const [saving, setSaving] = React.useState(false)

    const { setAlert } = useAlert()
    const { getPermissions } = useAuth()
    const permissions = React.useMemo(() => getPermissions("fila"), [getPermissions])

    const fetchData = React.useCallback(async () => {
        try {
            const [ticketsRes, statsRes] = await Promise.all([
                api.get("/admin/fila"),
                api.get("/admin/fila/stats"),
            ])
            setTickets(ticketsRes.data)
            setStats(statsRes.data)
        } catch (err: any) {
            setAlert(err.response?.data?.message || "Erro ao carregar fila.", "error")
        } finally {
            setIsLoading(false)
        }
    }, [setAlert])

    React.useEffect(() => {
        if (!permissions?.visualizar) { setIsLoading(false); return }
        fetchData()
        const t = setInterval(fetchData, 15000) // auto-refresh
        return () => clearInterval(t)
    }, [permissions?.visualizar, fetchData])

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

    const handleCreate = async () => {
        if (!form.patientName.trim()) return setAlert("Informe o nome do paciente.", "error")
        setSaving(true)
        try {
            await api.post("/admin/fila", { patientName: form.patientName.trim(), setor: form.setor, priority: form.priority })
            setAlert("Senha emitida!", "success")
            setForm({ patientName: "", setor: "Triagem", priority: "Normal" })
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
    }), [tickets])

    if (isLoading) {
        return <div className="p-2 md:p-4 lg:p-8"><Skeleton className="h-8 w-1/3 mb-6" /><div className="grid grid-cols-3 gap-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-64 rounded-xl" />)}</div></div>
    }
    if (!permissions?.visualizar) {
        return <div className="p-2 md:p-4 lg:p-8"><p className="text-muted-foreground">Você não tem permissão para visualizar esta seção.</p></div>
    }

    const nameOf = (t: Ticket) => t.patient?.name || t.patientName || "—"

    return (
        <div className="p-2 md:p-4 lg:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">Fila de Atendimento</h1>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={fetchData}><RefreshCcw className="w-4 h-4" />Atualizar</Button>
                    {permissions?.criar && <Button onClick={() => setDialogOpen(true)}><PlusCircle className="w-4 h-4" />Emitir Senha</Button>}
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Aguardando */}
                <div className="rounded-xl border bg-muted/30 p-3">
                    <div className="flex justify-between text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3"><span>Aguardando</span><span>{cols.Aguardando.length}</span></div>
                    <div className="space-y-2">
                        {cols.Aguardando.map(t => (
                            <Card key={t.id} className="p-3">
                                <div className="flex items-center justify-between">
                                    <span className="font-bold tabular-nums">{t.code}</span>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${PRIORITY[t.priority].cls}`}>{PRIORITY[t.priority].label}</span>
                                </div>
                                <div className="text-xs text-muted-foreground mt-0.5">{nameOf(t)} · {t.setor}</div>
                                {permissions?.editar && (
                                    <Button size="sm" className="w-full mt-2 h-8" disabled={busy === t.id} onClick={() => action(t.id, "chamar")}>
                                        {busy === t.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <PhoneCall className="w-3 h-3" />}Chamar
                                    </Button>
                                )}
                            </Card>
                        ))}
                        {cols.Aguardando.length === 0 && <p className="text-xs text-muted-foreground text-center py-6">Fila vazia.</p>}
                    </div>
                </div>

                {/* Chamado */}
                <div className="rounded-xl border bg-muted/30 p-3">
                    <div className="flex justify-between text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3"><span>Chamado</span><span>{cols.Chamado.length}</span></div>
                    <div className="space-y-2">
                        {cols.Chamado.map(t => (
                            <Card key={t.id} className="p-3">
                                <div className="flex items-center justify-between">
                                    <span className="font-bold tabular-nums">{t.code}</span>
                                    <Badge variant="outline" className="text-amber-600 border-amber-300 text-[10px]">Aguard. confirmação</Badge>
                                </div>
                                <div className="text-xs text-muted-foreground mt-0.5">{nameOf(t)}{t.doctor ? ` · ${t.doctor.name}` : ""}</div>
                                {permissions?.editar && (
                                    <div className="flex gap-1 mt-2">
                                        <Button size="sm" className="flex-1 h-8" disabled={busy === t.id} onClick={() => action(t.id, "confirmar")}>Confirmar</Button>
                                        <Button size="sm" variant="outline" className="h-8" disabled={busy === t.id} onClick={() => action(t.id, "faltou")}>Faltou</Button>
                                    </div>
                                )}
                            </Card>
                        ))}
                        {cols.Chamado.length === 0 && <p className="text-xs text-muted-foreground text-center py-6">Ninguém chamado.</p>}
                    </div>
                </div>

                {/* Em atendimento */}
                <div className="rounded-xl border bg-muted/30 p-3">
                    <div className="flex justify-between text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3"><span>Em atendimento</span><span>{cols.EmAtendimento.length}</span></div>
                    <div className="space-y-2">
                        {cols.EmAtendimento.map(t => (
                            <Card key={t.id} className="p-3">
                                <div className="flex items-center justify-between">
                                    <span className="font-bold tabular-nums">{t.code}</span>
                                    <Badge variant="secondary" className="text-emerald-700 bg-emerald-100 text-[10px]">Confirmado</Badge>
                                </div>
                                <div className="text-xs text-muted-foreground mt-0.5">{nameOf(t)}{t.doctor ? ` · ${t.doctor.name}` : ""}</div>
                                {permissions?.editar && (
                                    <Button size="sm" variant="outline" className="w-full mt-2 h-8" disabled={busy === t.id} onClick={() => action(t.id, "concluir")}>Concluir</Button>
                                )}
                            </Card>
                        ))}
                        {cols.EmAtendimento.length === 0 && <p className="text-xs text-muted-foreground text-center py-6">Nenhum atendimento.</p>}
                    </div>
                </div>
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Emitir Senha</DialogTitle>
                        <DialogDescription>Gera uma nova senha na fila com prioridade.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="grid gap-2">
                            <Label>Paciente</Label>
                            <Input value={form.patientName} onChange={(e) => setForm(f => ({ ...f, patientName: e.target.value }))} placeholder="Nome do paciente" />
                        </div>
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
        </div>
    )
}
