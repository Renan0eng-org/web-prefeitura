"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Loader2, Pencil, PlusCircle, Power, Stethoscope } from "lucide-react"
import * as React from "react"

type Medico = {
    idUser: string
    name: string
    email: string
    cpf: string
    phone: string | null
    crm: string | null
    especialidade: string | null
    cargaHoraria: number | null
    medicoStatus: "Ativo" | "Afastado" | "Ferias" | "Inativo" | null
    active: boolean
    gruposMembro?: { grupo: { idGrupo: number; nome: string } }[]
}

const STATUS: Record<string, { label: string; variant: "secondary" | "outline" | "destructive" }> = {
    Ativo: { label: "Ativo", variant: "secondary" },
    Afastado: { label: "Afastado", variant: "outline" },
    Ferias: { label: "Férias", variant: "outline" },
    Inativo: { label: "Inativo", variant: "destructive" },
}

const emptyForm = { name: "", email: "", cpf: "", password: "", phone: "", crm: "", especialidade: "", grupoId: "", cargaHoraria: "", status: "Ativo" }

export default function MedicosPage() {
    const [medicos, setMedicos] = React.useState<Medico[]>([])
    const [grupos, setGrupos] = React.useState<any[]>([])
    const [isLoading, setIsLoading] = React.useState(true)

    const [dialogOpen, setDialogOpen] = React.useState(false)
    const [editing, setEditing] = React.useState<Medico | null>(null)
    const [form, setForm] = React.useState({ ...emptyForm })
    const [saving, setSaving] = React.useState(false)

    const [confirmOpen, setConfirmOpen] = React.useState(false)
    const [pendingDelete, setPendingDelete] = React.useState<Medico | null>(null)

    const { setAlert } = useAlert()
    const { getPermissions } = useAuth()
    const permissions = React.useMemo(() => getPermissions("medicos"), [getPermissions])

    const fetchData = React.useCallback(async () => {
        try {
            const [medicosRes, gruposRes] = await Promise.all([
                api.get("/admin/medicos"),
                api.get("/admin/grupos").catch(() => ({ data: [] })),
            ])
            setMedicos(medicosRes.data)
            setGrupos(gruposRes.data || [])
        } catch (err: any) {
            setAlert(err.response?.data?.message || "Erro ao carregar médicos.", "error")
        } finally {
            setIsLoading(false)
        }
    }, [setAlert])

    React.useEffect(() => {
        if (permissions?.visualizar) fetchData()
        else setIsLoading(false)
    }, [permissions?.visualizar, fetchData])

    const openCreate = () => {
        setEditing(null)
        setForm({ ...emptyForm })
        setDialogOpen(true)
    }

    const openEdit = (m: Medico) => {
        setEditing(m)
        setForm({
            name: m.name,
            email: m.email,
            cpf: m.cpf,
            password: "",
            phone: m.phone || "",
            crm: m.crm || "",
            especialidade: m.especialidade || "",
            grupoId: m.gruposMembro?.[0]?.grupo?.idGrupo ? String(m.gruposMembro[0].grupo.idGrupo) : "",
            cargaHoraria: m.cargaHoraria ? String(m.cargaHoraria) : "",
            status: m.medicoStatus || "Ativo",
        })
        setDialogOpen(true)
    }

    const handleSave = async () => {
        if (!form.crm.trim() || !form.especialidade.trim()) return setAlert("Preencha CRM e especialidade.", "error")
        const base: any = {
            crm: form.crm.trim(),
            especialidade: form.especialidade.trim(),
            phone: form.phone.trim() || undefined,
            grupoId: form.grupoId ? Number(form.grupoId) : undefined,
            cargaHoraria: form.cargaHoraria ? Number(form.cargaHoraria) : undefined,
            status: form.status,
        }
        setSaving(true)
        try {
            if (editing) {
                await api.put(`/admin/medicos/${editing.idUser}`, { ...base, name: form.name.trim() })
                setAlert("Médico atualizado!", "success")
            } else {
                if (!form.name.trim() || !form.email.trim() || !form.cpf.trim()) { setSaving(false); return setAlert("Preencha nome, e-mail e CPF.", "error") }
                if (form.password.length < 6) { setSaving(false); return setAlert("A senha deve ter ao menos 6 caracteres.", "error") }
                await api.post("/admin/medicos", { ...base, name: form.name.trim(), email: form.email.trim(), cpf: form.cpf.trim(), password: form.password })
                setAlert("Médico cadastrado! O login já está liberado.", "success")
            }
            setDialogOpen(false)
            fetchData()
        } catch (err: any) {
            setAlert(err.response?.data?.message || "Erro ao salvar médico.", "error")
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        if (!pendingDelete) return
        try {
            await api.delete(`/admin/medicos/${pendingDelete.idUser}`)
            setAlert("Médico desativado!", "success")
            fetchData()
        } catch (err: any) {
            setAlert(err.response?.data?.message || "Erro ao desativar.", "error")
        } finally {
            setConfirmOpen(false)
            setPendingDelete(null)
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
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">Corpo Clínico</h1>
                {permissions?.criar && <Button onClick={openCreate}><PlusCircle className="w-4 h-4" />Novo Médico</Button>}
            </div>
            <p className="text-sm text-muted-foreground mb-6">Cadastrar um médico cria um usuário do tipo <b>Médico</b> com acesso ao sistema (atendimentos, plantão e fila).</p>

            {medicos.length === 0 ? (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Nenhum médico cadastrado</CardTitle>
                        <CardDescription>Cadastre um médico para liberar o login e montar a escala e a fila.</CardDescription>
                    </CardHeader>
                </Card>
            ) : (
                <div className="rounded-lg border overflow-hidden">
                    <Table>
                        <TableHeader className="bg-muted">
                            <TableRow>
                                <TableHead>Médico</TableHead>
                                <TableHead>CRM</TableHead>
                                <TableHead>Especialidade</TableHead>
                                <TableHead>Hospital</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="w-[96px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {medicos.map(m => (
                                <TableRow key={m.idUser}>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-50 text-primary-600">
                                                <Stethoscope className="h-4 w-4" />
                                            </span>
                                            <div>
                                                <div className="font-medium text-sm">{m.name}</div>
                                                <div className="text-xs text-muted-foreground">{m.email}</div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="tabular-nums">{m.crm || "—"}</TableCell>
                                    <TableCell>{m.especialidade || "—"}</TableCell>
                                    <TableCell className="text-muted-foreground">{m.gruposMembro?.[0]?.grupo?.nome || "—"}</TableCell>
                                    <TableCell><Badge variant={STATUS[m.medicoStatus || "Ativo"]?.variant}>{STATUS[m.medicoStatus || "Ativo"]?.label}</Badge></TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1">
                                            {permissions?.editar && (
                                                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => openEdit(m)}>
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                            )}
                                            {permissions?.excluir && (
                                                <Button variant="outline" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => { setPendingDelete(m); setConfirmOpen(true) }} title="Desativar">
                                                    <Power className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{editing ? "Editar" : "Novo"} Médico</DialogTitle>
                        <DialogDescription>{editing ? "Atualize os dados do médico." : "Cria um usuário do tipo Médico com login liberado."}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="grid gap-2">
                            <Label>Nome</Label>
                            <Input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Dra. Ana Martins" />
                        </div>
                        {!editing && (
                            <div className="grid grid-cols-2 gap-3">
                                <div className="grid gap-2"><Label>E-mail (login)</Label><Input type="email" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} placeholder="ana@hospital.br" /></div>
                                <div className="grid gap-2"><Label>CPF</Label><Input value={form.cpf} onChange={(e) => setForm(f => ({ ...f, cpf: e.target.value }))} placeholder="000.000.000-00" /></div>
                            </div>
                        )}
                        {!editing && (
                            <div className="grid grid-cols-2 gap-3">
                                <div className="grid gap-2"><Label>Senha inicial</Label><Input type="password" value={form.password} onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))} placeholder="mín. 6 caracteres" /></div>
                                <div className="grid gap-2"><Label>Telefone</Label><Input value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="(00) 00000-0000" /></div>
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="grid gap-2"><Label>CRM</Label><Input value={form.crm} onChange={(e) => setForm(f => ({ ...f, crm: e.target.value }))} placeholder="PR-00000" /></div>
                            <div className="grid gap-2"><Label>Carga horária (h/sem)</Label><Input type="number" value={form.cargaHoraria} onChange={(e) => setForm(f => ({ ...f, cargaHoraria: e.target.value }))} placeholder="40" /></div>
                        </div>
                        <div className="grid gap-2">
                            <Label>Especialidade</Label>
                            <Input value={form.especialidade} onChange={(e) => setForm(f => ({ ...f, especialidade: e.target.value }))} placeholder="Clínica Geral" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="grid gap-2">
                                <Label>Hospital / Grupo</Label>
                                <Select value={form.grupoId} onValueChange={(v) => setForm(f => ({ ...f, grupoId: v }))}>
                                    <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                                    <SelectContent>
                                        {grupos.map((g: any) => <SelectItem key={g.idGrupo} value={String(g.idGrupo)}>{g.nome}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label>Status</Label>
                                <Select value={form.status} onValueChange={(v) => setForm(f => ({ ...f, status: v }))}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Ativo">Ativo</SelectItem>
                                        <SelectItem value="Afastado">Afastado</SelectItem>
                                        <SelectItem value="Ferias">Férias</SelectItem>
                                        <SelectItem value="Inativo">Inativo</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setDialogOpen(false)} disabled={saving}>Cancelar</Button>
                        <Button onClick={handleSave} disabled={saving}>{saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Salvar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={confirmOpen}
                title="Desativar Médico"
                description={pendingDelete ? `Desativar "${pendingDelete.name}"? O usuário deixa de ativo e sai da operação, mas o histórico é mantido.` : "Tem certeza?"}
                intent="destructive"
                confirmLabel="Desativar"
                cancelLabel="Cancelar"
                onConfirm={handleDelete}
                onCancel={() => { setConfirmOpen(false); setPendingDelete(null) }}
            />
        </div>
    )
}
