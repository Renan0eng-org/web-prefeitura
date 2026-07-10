"use client"

import { NivelAcessoDialog } from "@/components/access-level/nivel-acesso-dialog"
import { PermissaoMatrix } from "@/components/access-level/permissao-matrix"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import ConfirmDialog from "@/components/ui/confirm-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useAlert } from "@/hooks/use-alert"
import { useAuth } from "@/hooks/use-auth"
import api from "@/services/api"
import { MenuAcesso, NivelAcesso, NivelAcessoComPermissoes } from "@/types/access-level"
import { Edit, PlusCircle, Trash2 } from "lucide-react"
import * as React from "react"

export function GerenciarNiveisAcesso() {
    const [niveis, setNiveis] = React.useState<NivelAcessoComPermissoes[]>([])
    const [todosMenus, setTodosMenus] = React.useState<MenuAcesso[]>([])
    const [isLoading, setIsLoading] = React.useState(true)
    const [selectedNivelId, setSelectedNivelId] = React.useState<string>("")
    const [isNivelDialogOpen, setIsNivelDialogOpen] = React.useState(false)
    const [editingNivel, setEditingNivel] = React.useState<NivelAcesso | null>(null)
    const [confirmOpen, setConfirmOpen] = React.useState(false)

    const { setAlert } = useAlert()
    const { getPermissions } = useAuth()

    const permissions = React.useMemo(
        () => getPermissions("acesso"),
        [getPermissions]
    )

    const fetchData = async () => {
        try {
            setIsLoading(true)
            const [niveisResponse, menusResponse] = await Promise.all([
                api.get('/admin/acesso/niveis'),
                api.get('/admin/acesso/menus'),
            ])
            setNiveis(niveisResponse.data)
            setTodosMenus(menusResponse.data)

            if (!selectedNivelId && niveisResponse.data.length > 0) {
                setSelectedNivelId(String(niveisResponse.data[0].idNivelAcesso))
            }
        } catch (err: any) {
            setAlert(err.response?.data?.message || "Erro ao carregar dados.", "error")
        } finally {
            setIsLoading(false)
        }
    }

    React.useEffect(() => {
        fetchData()
    }, [])

    const selectedNivel = React.useMemo(
        () => niveis.find(n => String(n.idNivelAcesso) === selectedNivelId) || null,
        [niveis, selectedNivelId]
    )

    const handleAddNew = () => {
        setEditingNivel(null)
        setIsNivelDialogOpen(true)
    }

    const handleEdit = () => {
        if (selectedNivel) {
            setEditingNivel(selectedNivel)
            setIsNivelDialogOpen(true)
        }
    }

    const performDelete = async () => {
        if (!selectedNivel) return
        try {
            await api.delete(`/admin/acesso/niveis/${selectedNivel.idNivelAcesso}`)
            setAlert("Nível excluído com sucesso!", "success")
            setSelectedNivelId("")
            fetchData()
        } catch (err: any) {
            setAlert(err.response?.data?.message || "Erro ao excluir nível.", "error")
        }
    }

    const onNivelDialogDataChanged = () => {
        fetchData()
        setIsNivelDialogOpen(false)
    }

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-1/3" />
                    <Skeleton className="h-4 w-2/3 mt-2" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-64 w-full" />
                </CardContent>
            </Card>
        )
    }

    if (!permissions?.visualizar) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Acesso Negado</CardTitle>
                    <CardDescription>Você não tem permissão para visualizar esta seção.</CardDescription>
                </CardHeader>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col gap-1">
                    <CardTitle>Permissões por Nível</CardTitle>
                    <CardDescription>
                        Selecione um nível de acesso e configure as permissões para cada menu do sistema.
                    </CardDescription>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <Select value={selectedNivelId} onValueChange={setSelectedNivelId}>
                        <SelectTrigger className="w-full sm:w-[280px]">
                            <SelectValue placeholder="Selecione um nível..." />
                        </SelectTrigger>
                        <SelectContent>
                            {niveis.map(nivel => (
                                <SelectItem key={nivel.idNivelAcesso} value={String(nivel.idNivelAcesso)}>
                                    {nivel.nome}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <div className="flex items-center gap-2 flex-wrap">
                        {permissions?.criar && (
                            <Button variant="outline" size="sm" onClick={handleAddNew}>
                                <PlusCircle className="w-4 h-4 mr-1" />
                                Novo Nível
                            </Button>
                        )}
                        {permissions?.editar && selectedNivel && (
                            <Button variant="outline" size="sm" onClick={handleEdit}>
                                <Edit className="w-4 h-4 mr-1" />
                                Editar
                            </Button>
                        )}
                        {permissions?.excluir && selectedNivel && (
                            <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => setConfirmOpen(true)}>
                                <Trash2 className="w-4 h-4 mr-1" />
                                Excluir
                            </Button>
                        )}
                    </div>
                </div>

                {selectedNivel ? (
                    <>
                        {selectedNivel.descricao && (
                            <p className="text-sm text-muted-foreground">{selectedNivel.descricao}</p>
                        )}
                        <PermissaoMatrix
                            nivelId={selectedNivel.idNivelAcesso}
                            todosMenus={todosMenus}
                            permissoes={selectedNivel.permissoes}
                            canEdit={!!permissions?.editar}
                            onSaved={fetchData}
                        />
                    </>
                ) : (
                    <div className="py-8 text-center text-muted-foreground">
                        <p>Selecione um nível de acesso para configurar suas permissões.</p>
                    </div>
                )}
            </CardContent>

            <NivelAcessoDialog
                isOpen={isNivelDialogOpen}
                onOpenChange={setIsNivelDialogOpen}
                nivel={editingNivel}
                onDataChanged={onNivelDialogDataChanged}
            />
            <ConfirmDialog
                open={confirmOpen}
                title="Excluir Nível"
                description={`Tem certeza que deseja excluir o nível "${selectedNivel?.nome}"? Usuários vinculados perderão esse nível.`}
                intent="destructive"
                confirmLabel="Excluir"
                cancelLabel="Cancelar"
                onConfirm={() => { performDelete(); setConfirmOpen(false) }}
                onCancel={() => setConfirmOpen(false)}
            />
        </Card>
    )
}
