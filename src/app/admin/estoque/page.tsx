"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import ConfirmDialog from "@/components/ui/confirm-dialog"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAlert } from "@/hooks/use-alert"
import { useAuth } from "@/hooks/use-auth"
import api from "@/services/api"
import { ArrowDownCircle, ArrowUpCircle, Loader2, Pencil, PlusCircle, RotateCcw, Trash2 } from "lucide-react"
import * as React from "react"

type Supply = {
    id: string
    name: string
    unit: string
    balance: number
    minStock: number
    lot: string | null
    expiresAt: string | null
    status: "OK" | "Baixo" | "Critico"
}

const STATUS: Record<string, { label: string; cls: string }> = {
    OK: { label: "OK", cls: "bg-emerald-100 text-emerald-700" },
    Baixo: { label: "Baixo", cls: "bg-amber-100 text-amber-700" },
    Critico: { label: "Crítico", cls: "bg-red-100 text-red-700" },
}

export default function EstoquePage() {
    const [supplies, setSupplies] = React.useState<Supply[]>([])
    const [isLoading, setIsLoading] = React.useState(true)
    const [showDeleted, setShowDeleted] = React.useState(false)

    const [dialogOpen, setDialogOpen] = React.useState(false)
    const [editing, setEditing] = React.useState<Supply | null>(null)
    const [form, setForm] = React.useState({ name: "", unit: "un", balance: "", minStock: "", lot: "", expiresAt: "" })
    const [saving, setSaving] = React.useState(false)

    const [movOpen, setMovOpen] = React.useState<Supply | null>(null)
    const [mov, setMov] = React.useState({ type: "Entrada", quantity: "", reason: "" })
    const [moving, setMoving] = React.useState(false)

    const [confirmOpen, setConfirmOpen] = React.useState(false)
    const [pendingDelete, setPendingDelete] = React.useState<Supply | null>(null)

    const { setAlert } = useAlert()
    const { getPermissions } = useAuth()
    const permissions = React.useMemo(() => getPermissions("estoque"), [getPermissions])

    const fetchData = React.useCallback(async () => {
        try {
            const { data } = await api.get(`/admin/estoque${showDeleted ? "?deleted=true" : ""}`)
            setSupplies(data)
        } catch (err: any) {
            setAlert(err.response?.data?.message || "Erro ao carregar estoque.", "error")
        } finally {
            setIsLoading(false)
        }
    }, [setAlert, showDeleted])

    React.useEffect(() => {
        if (permissions?.visualizar) fetchData()
        else setIsLoading(false)
    }, [permissions?.visualizar, fetchData])

    const openCreate = () => {
        setEditing(null)
        setForm({ name: "", unit: "un", balance: "", minStock: "", lot: "", expiresAt: "" })
        setDialogOpen(true)
    }
    const openEdit = (s: Supply) => {
        setEditing(s)
        setForm({ name: s.name, unit: s.unit, balance: String(s.balance), minStock: String(s.minStock), lot: s.lot || "", expiresAt: s.expiresAt ? s.expiresAt.slice(0, 10) : "" })
        setDialogOpen(true)
    }

    const handleSave = async () => {
        if (!form.name.trim() || !form.unit.trim()) return setAlert("Preencha nome e unidade.", "error")
        setSaving(true)
        try {
            const payload: any = { name: form.name.trim(), unit: form.unit.trim(), minStock: form.minStock ? Number(form.minStock) : 0, lot: form.lot.trim() || undefined, expiresAt: form.expiresAt || undefined }
            if (editing) {
                await api.put(`/admin/estoque/${editing.id}`, payload)
                setAlert("Insumo atualizado!", "success")
            } else {
                await api.post("/admin/estoque", { ...payload, balance: form.balance ? Number(form.balance) : 0 })
                setAlert("Insumo cadastrado!", "success")
            }
            setDialogOpen(false)
            fetchData()
        } catch (err: any) {
            setAlert(err.response?.data?.message || "Erro ao salvar.", "error")
        } finally {
            setSaving(false)
        }
    }

    const handleMov = async () => {
        if (!movOpen) return
        const qty = Number(mov.quantity)
        if (!qty || qty <= 0) return setAlert("Informe uma quantidade válida.", "error")
        setMoving(true)
        try {
            await api.post(`/admin/estoque/${movOpen.id}/movimentar`, { type: mov.type, quantity: qty, reason: mov.reason.trim() || undefined })
            setAlert(`${mov.type} registrada!`, "success")
            setMovOpen(null)
            setMov({ type: "Entrada", quantity: "", reason: "" })
            fetchData()
        } catch (err: any) {
            setAlert(err.response?.data?.message || "Erro na movimentação.", "error")
        } finally {
            setMoving(false)
        }
    }

    const handleDelete = async () => {
        if (!pendingDelete) return
        try {
            await api.delete(`/admin/estoque/${pendingDelete.id}`)
            setAlert("Insumo removido!", "success")
            fetchData()
        } catch (err: any) {
            setAlert(err.response?.data?.message || "Erro ao remover.", "error")
        } finally {
            setConfirmOpen(false)
            setPendingDelete(null)
        }
    }

    const handleRestore = async (id: string) => {
        try {
            await api.post(`/admin/estoque/${id}/restaurar`)
            setAlert("Insumo restaurado!", "success")
            fetchData()
        } catch (err: any) {
            setAlert(err.response?.data?.message || "Erro ao restaurar.", "error")
        }
    }

    if (isLoading) {
        return <div className="p-2 md:p-4 lg:p-8"><Skeleton className="h-8 w-1/3 mb-6" /><Skeleton className="h-64 w-full rounded-xl" /></div>
    }
    if (!permissions?.visualizar) {
        return <div className="p-2 md:p-4 lg:p-8"><p className="text-muted-foreground">Você não tem permissão para visualizar esta seção.</p></div>
    }

    return (
        <div className="p-2 md:p-4 lg:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-3">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">Estoque de Insumos</h1>
                <div className="flex items-center gap-2">
                    {permissions?.excluir && (
                        <Button variant={showDeleted ? "default" : "outline"} size="sm" onClick={() => setShowDeleted(v => !v)}>
                            <Trash2 className="w-4 h-4" />{showDeleted ? "Ativos" : "Excluídos"}
                        </Button>
                    )}
                    {permissions?.criar && !showDeleted && <Button onClick={openCreate}><PlusCircle className="w-4 h-4" />Novo Insumo</Button>}
                </div>
            </div>
            <p className="text-sm text-muted-foreground mb-6">Saldo, lote e validade dos insumos, com entradas e saídas e alerta de estoque mínimo.</p>

            {supplies.length === 0 ? (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Nenhum insumo cadastrado</CardTitle>
                        <CardDescription>Cadastre insumos e registre entradas para controlar o estoque.</CardDescription>
                    </CardHeader>
                </Card>
            ) : (
                <div className="rounded-lg border overflow-hidden">
                    <Table>
                        <TableHeader className="bg-muted">
                            <TableRow>
                                <TableHead>Insumo</TableHead>
                                <TableHead>Lote</TableHead>
                                <TableHead>Validade</TableHead>
                                <TableHead className="text-right">Saldo</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="w-[150px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {supplies.map(s => (
                                <TableRow key={s.id}>
                                    <TableCell className="font-medium">{s.name}<div className="text-xs text-muted-foreground">mín. {s.minStock} {s.unit}</div></TableCell>
                                    <TableCell className="text-muted-foreground">{s.lot || "—"}</TableCell>
                                    <TableCell className="text-muted-foreground tabular-nums">{s.expiresAt ? new Date(s.expiresAt).toLocaleDateString("pt-BR") : "—"}</TableCell>
                                    <TableCell className="text-right tabular-nums font-medium">{s.balance} {s.unit}</TableCell>
                                    <TableCell><span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${STATUS[s.status].cls}`}>{STATUS[s.status].label}</span></TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1">
                                            {showDeleted ? (
                                                permissions?.excluir && (
                                                    <Button variant="outline" size="sm" onClick={() => handleRestore(s.id)}>
                                                        <RotateCcw className="h-4 w-4" />Restaurar
                                                    </Button>
                                                )
                                            ) : (
                                                <>
                                                    {permissions?.editar && (
                                                        <Button variant="outline" size="sm" className="h-8" onClick={() => { setMovOpen(s); setMov({ type: "Entrada", quantity: "", reason: "" }) }}>
                                                            Movimentar
                                                        </Button>
                                                    )}
                                                    {permissions?.editar && (
                                                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => openEdit(s)}><Pencil className="h-4 w-4" /></Button>
                                                    )}
                                                    {permissions?.excluir && (
                                                        <Button variant="outline" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => { setPendingDelete(s); setConfirmOpen(true) }}><Trash2 className="h-4 w-4" /></Button>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}

            {/* Criar/editar */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editing ? "Editar" : "Novo"} Insumo</DialogTitle>
                        <DialogDescription>{editing ? "Atualize os dados do insumo." : "Cadastre um insumo e o saldo inicial."}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="grid gap-2"><Label>Nome</Label><Input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Luva nitrílica M" /></div>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="grid gap-2"><Label>Unidade</Label><Input value={form.unit} onChange={(e) => setForm(f => ({ ...f, unit: e.target.value }))} placeholder="un" /></div>
                            {!editing && <div className="grid gap-2"><Label>Saldo inicial</Label><Input type="number" value={form.balance} onChange={(e) => setForm(f => ({ ...f, balance: e.target.value }))} placeholder="0" /></div>}
                            <div className="grid gap-2"><Label>Estoque mínimo</Label><Input type="number" value={form.minStock} onChange={(e) => setForm(f => ({ ...f, minStock: e.target.value }))} placeholder="0" /></div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="grid gap-2"><Label>Lote</Label><Input value={form.lot} onChange={(e) => setForm(f => ({ ...f, lot: e.target.value }))} placeholder="LN-0000" /></div>
                            <div className="grid gap-2"><Label>Validade</Label><Input type="date" value={form.expiresAt} onChange={(e) => setForm(f => ({ ...f, expiresAt: e.target.value }))} /></div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setDialogOpen(false)} disabled={saving}>Cancelar</Button>
                        <Button onClick={handleSave} disabled={saving}>{saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Salvar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Movimentar */}
            <Dialog open={!!movOpen} onOpenChange={(o) => { if (!o) setMovOpen(null) }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Movimentar — {movOpen?.name}</DialogTitle>
                        <DialogDescription>Saldo atual: {movOpen?.balance} {movOpen?.unit}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-2">
                            <Button type="button" variant={mov.type === "Entrada" ? "default" : "outline"} onClick={() => setMov(m => ({ ...m, type: "Entrada" }))}><ArrowUpCircle className="w-4 h-4" />Entrada</Button>
                            <Button type="button" variant={mov.type === "Saida" ? "default" : "outline"} onClick={() => setMov(m => ({ ...m, type: "Saida" }))}><ArrowDownCircle className="w-4 h-4" />Saída</Button>
                        </div>
                        <div className="grid gap-2"><Label>Quantidade</Label><Input type="number" value={mov.quantity} onChange={(e) => setMov(m => ({ ...m, quantity: e.target.value }))} placeholder="0" /></div>
                        <div className="grid gap-2"><Label>Motivo (opcional)</Label><Input value={mov.reason} onChange={(e) => setMov(m => ({ ...m, reason: e.target.value }))} placeholder="Compra, consumo, doação..." /></div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setMovOpen(null)} disabled={moving}>Cancelar</Button>
                        <Button onClick={handleMov} disabled={moving}>{moving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Registrar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={confirmOpen}
                title="Remover Insumo"
                description={pendingDelete ? `Remover "${pendingDelete.name}" e todo o histórico de movimentações?` : "Tem certeza?"}
                intent="destructive"
                confirmLabel="Remover"
                cancelLabel="Cancelar"
                onConfirm={handleDelete}
                onCancel={() => { setConfirmOpen(false); setPendingDelete(null) }}
            />
        </div>
    )
}
