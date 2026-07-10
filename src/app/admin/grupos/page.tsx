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
import { Grupo, UserComNivel } from "@/types/access-level"
import { Loader2, Pencil, PlusCircle, Trash2, UserPlus, Users, X } from "lucide-react"
import * as React from "react"

export default function GruposPage() {
    const [grupos, setGrupos] = React.useState<Grupo[]>([])
    const [users, setUsers] = React.useState<UserComNivel[]>([])
    const [isLoading, setIsLoading] = React.useState(true)

    // dialog state
    const [dialogOpen, setDialogOpen] = React.useState(false)
    const [editing, setEditing] = React.useState<Grupo | null>(null)
    const [nome, setNome] = React.useState("")
    const [descricao, setDescricao] = React.useState("")
    const [saving, setSaving] = React.useState(false)

    // membros dialog
    const [membrosGrupo, setMembrosGrupo] = React.useState<Grupo | null>(null)
    const [selectedUserId, setSelectedUserId] = React.useState("")
    const [addingMember, setAddingMember] = React.useState(false)

    // delete confirm
    const [confirmOpen, setConfirmOpen] = React.useState(false)
    const [pendingDelete, setPendingDelete] = React.useState<Grupo | null>(null)

    const { setAlert } = useAlert()
    const { getPermissions } = useAuth()

    const permissions = React.useMemo(() => getPermissions("grupos"), [getPermissions])

    const fetchData = React.useCallback(async () => {
        try {
            const [gruposRes, usersRes] = await Promise.all([
                api.get("/admin/grupos"),
                api.get("/admin/users"),
            ])
            setGrupos(gruposRes.data)
            setUsers(Array.isArray(usersRes.data) ? usersRes.data : usersRes.data.data || [])
        } catch (err: any) {
            setAlert(err.response?.data?.message || "Erro ao carregar grupos.", "error")
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
        setNome("")
        setDescricao("")
        setDialogOpen(true)
    }

    const openEdit = (grupo: Grupo) => {
        setEditing(grupo)
        setNome(grupo.nome)
        setDescricao(grupo.descricao || "")
        setDialogOpen(true)
    }

    const handleSave = async () => {
        if (!nome.trim() || nome.trim().length < 3) {
            setAlert("O nome do grupo deve ter ao menos 3 caracteres.", "error")
            return
        }
        setSaving(true)
        try {
            if (editing) {
                await api.put(`/admin/grupos/${editing.idGrupo}`, { nome: nome.trim(), descricao: descricao.trim() || undefined })
                setAlert("Grupo atualizado!", "success")
            } else {
                await api.post("/admin/grupos", { nome: nome.trim(), descricao: descricao.trim() || undefined })
                setAlert("Grupo criado!", "success")
            }
            setDialogOpen(false)
            fetchData()
        } catch (err: any) {
            setAlert(err.response?.data?.message || "Erro ao salvar grupo.", "error")
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        if (!pendingDelete) return
        try {
            await api.delete(`/admin/grupos/${pendingDelete.idGrupo}`)
            setAlert("Grupo excluído!", "success")
            if (membrosGrupo?.idGrupo === pendingDelete.idGrupo) setMembrosGrupo(null)
            fetchData()
        } catch (err: any) {
            setAlert(err.response?.data?.message || "Erro ao excluir grupo.", "error")
        } finally {
            setConfirmOpen(false)
            setPendingDelete(null)
        }
    }

    const handleAddMember = async () => {
        if (!membrosGrupo || !selectedUserId) return
        setAddingMember(true)
        try {
            const { data } = await api.post(`/admin/grupos/${membrosGrupo.idGrupo}/membros`, { userIds: [selectedUserId] })
            setMembrosGrupo(data)
            setSelectedUserId("")
            setGrupos(prev => prev.map(g => (g.idGrupo === data.idGrupo ? data : g)))
            setAlert("Membro adicionado!", "success")
        } catch (err: any) {
            setAlert(err.response?.data?.message || "Erro ao adicionar membro.", "error")
        } finally {
            setAddingMember(false)
        }
    }

    const handleRemoveMember = async (userId: string) => {
        if (!membrosGrupo) return
        try {
            const { data } = await api.delete(`/admin/grupos/${membrosGrupo.idGrupo}/membros/${userId}`)
            setMembrosGrupo(data)
            setGrupos(prev => prev.map(g => (g.idGrupo === data.idGrupo ? data : g)))
            setAlert("Membro removido!", "success")
        } catch (err: any) {
            setAlert(err.response?.data?.message || "Erro ao remover membro.", "error")
        }
    }

    const availableUsers = React.useMemo(() => {
        if (!membrosGrupo) return []
        const memberIds = new Set(membrosGrupo.membros.map(m => m.userId))
        return users.filter(u => !memberIds.has(u.idUser))
    }, [users, membrosGrupo])

    if (isLoading) {
        return (
            <div className="p-2 md:p-4 lg:p-8">
                <Skeleton className="h-8 w-1/3 mb-6" />
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-40 w-full rounded-xl" />
                    ))}
                </div>
            </div>
        )
    }

    if (!permissions?.visualizar) {
        return (
            <div className="p-2 md:p-4 lg:p-8">
                <p className="text-muted-foreground">Você não tem permissão para visualizar esta seção.</p>
            </div>
        )
    }

    return (
        <div className="p-2 md:p-4 lg:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-3">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">Grupos</h1>
                {permissions?.criar && (
                    <Button onClick={openCreate}>
                        <PlusCircle className="w-4 h-4" />
                        Novo Grupo
                    </Button>
                )}
            </div>
            <p className="text-sm text-muted-foreground mb-6">
                Membros de um mesmo grupo compartilham a visualização de formulários e pacientes entre si.
            </p>

            {grupos.length === 0 ? (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Nenhum grupo criado</CardTitle>
                        <CardDescription>
                            Crie um grupo e adicione profissionais para que eles compartilhem seus dados.
                        </CardDescription>
                    </CardHeader>
                </Card>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {grupos.map((grupo) => (
                        <Card key={grupo.idGrupo} className="flex flex-col">
                            <CardHeader className="pb-2">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <CardTitle className="text-base truncate">{grupo.nome}</CardTitle>
                                            {grupo.isDefault && (
                                                <Badge variant="outline" className="shrink-0 border-primary-300 text-primary-600 text-[10px]">Padrão</Badge>
                                            )}
                                        </div>
                                        {grupo.descricao && (
                                            <CardDescription className="line-clamp-2 mt-1">{grupo.descricao}</CardDescription>
                                        )}
                                    </div>
                                    <Badge variant="secondary" className="shrink-0">
                                        <Users className="h-3 w-3 mr-1" />
                                        {grupo.membros.length}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="flex flex-col flex-1 justify-end gap-3 pt-2">
                                <div className="flex flex-wrap gap-1">
                                    {grupo.membros.slice(0, 4).map((m) => (
                                        <Badge key={m.id} variant="outline" className="max-w-[140px] truncate font-normal">
                                            {m.user.name}
                                        </Badge>
                                    ))}
                                    {grupo.membros.length > 4 && (
                                        <Badge variant="outline" className="font-normal">+{grupo.membros.length - 4}</Badge>
                                    )}
                                    {grupo.membros.length === 0 && (
                                        <span className="text-xs text-muted-foreground">Sem membros</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    {permissions?.editar && (
                                        <>
                                            <Button variant="outline" size="sm" className="flex-1" onClick={() => setMembrosGrupo(grupo)}>
                                                <UserPlus className="h-4 w-4" />
                                                Membros
                                            </Button>
                                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => openEdit(grupo)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                        </>
                                    )}
                                    {permissions?.excluir && !grupo.isDefault && (
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-8 w-8 text-destructive hover:text-destructive"
                                            onClick={() => { setPendingDelete(grupo); setConfirmOpen(true) }}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Dialog criar/editar grupo */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editing ? "Editar" : "Novo"} Grupo</DialogTitle>
                        <DialogDescription>
                            {editing ? "Altere o nome e a descrição do grupo." : "Crie um grupo para compartilhar dados entre profissionais."}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="grupo-nome">Nome</Label>
                            <Input
                                id="grupo-nome"
                                placeholder="Ex: Equipe UBS Central"
                                value={nome}
                                onChange={(e) => setNome(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="grupo-descricao">Descrição (opcional)</Label>
                            <Input
                                id="grupo-descricao"
                                placeholder="Ex: Profissionais da unidade central"
                                value={descricao}
                                onChange={(e) => setDescricao(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setDialogOpen(false)} disabled={saving}>
                            Cancelar
                        </Button>
                        <Button onClick={handleSave} disabled={saving}>
                            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Salvar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Dialog gerenciar membros */}
            <Dialog open={!!membrosGrupo} onOpenChange={(open) => { if (!open) setMembrosGrupo(null) }}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Membros — {membrosGrupo?.nome}</DialogTitle>
                        <DialogDescription>
                            Adicione ou remova profissionais deste grupo.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex items-end gap-2">
                        <div className="flex-1 grid gap-2">
                            <Label>Adicionar usuário</Label>
                            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione um usuário..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableUsers.map((u) => (
                                        <SelectItem key={u.idUser} value={u.idUser}>
                                            {u.name} — {u.email}
                                        </SelectItem>
                                    ))}
                                    {availableUsers.length === 0 && (
                                        <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                            Nenhum usuário disponível
                                        </div>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button onClick={handleAddMember} disabled={!selectedUserId || addingMember}>
                            {addingMember ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                            Adicionar
                        </Button>
                    </div>

                    <div className="rounded-lg border overflow-hidden max-h-72 overflow-y-auto">
                        <Table>
                            <TableHeader className="bg-muted sticky top-0">
                                <TableRow>
                                    <TableHead>Usuário</TableHead>
                                    <TableHead>Nível</TableHead>
                                    <TableHead className="w-[48px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {membrosGrupo?.membros.map((m) => (
                                    <TableRow key={m.id}>
                                        <TableCell>
                                            <div className="font-medium text-sm">{m.user.name}</div>
                                            <div className="text-xs text-muted-foreground">{m.user.email}</div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className="text-xs">{m.user.nivel_acesso.nome}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 text-destructive hover:text-destructive"
                                                onClick={() => handleRemoveMember(m.userId)}
                                                aria-label="Remover membro"
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {membrosGrupo?.membros.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center text-sm text-muted-foreground py-6">
                                            Nenhum membro neste grupo.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={confirmOpen}
                title="Excluir Grupo"
                description={pendingDelete ? `Tem certeza que deseja excluir o grupo "${pendingDelete.nome}"? Os membros deixarão de compartilhar dados.` : "Tem certeza?"}
                intent="destructive"
                confirmLabel="Excluir"
                cancelLabel="Cancelar"
                onConfirm={handleDelete}
                onCancel={() => { setConfirmOpen(false); setPendingDelete(null) }}
            />
        </div>
    )
}
