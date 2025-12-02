"use client"

import { UserFormDialog } from "@/components/forms/usuarios/user-form-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import ConfirmDialog from "@/components/ui/confirm-dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAlert } from "@/hooks/use-alert"
import { useAuth } from "@/hooks/use-auth"
import api from "@/services/api"
import { NivelAcesso, UserComNivel } from "@/types/access-level"
import { Loader2, MoreHorizontal, PlusCircle } from "lucide-react"
import * as React from "react"

export default function UsuariosPage() {
    const [users, setUsers] = React.useState<UserComNivel[]>([])
    const [niveis, setNiveis] = React.useState<NivelAcesso[]>([]) // Para o dropdown no form
    const [isLoading, setIsLoading] = React.useState(true)
    const [isDialogOpen, setIsDialogOpen] = React.useState(false)
    const [editingUser, setEditingUser] = React.useState<UserComNivel | null>(null)

    const { setAlert } = useAlert()
    const { getPermissions } = useAuth()

    const permissions = React.useMemo(
        () => getPermissions("gerenciar-usuarios"), // Use o slug correto
        [getPermissions]
    )

    const fetchData = React.useCallback(async () => {
        try {
            setIsLoading(true)
            // Busca usuários e níveis de acesso (para o form)
            const [usersResponse, niveisResponse] = await Promise.all([
                api.get('/admin/users'), // Rota do UserController
                api.get('/admin/acesso/niveis') // Rota do AcessoController
            ])
            setUsers(usersResponse.data)
            setNiveis(niveisResponse.data)
        } catch (err: any) {
            console.error("Error fetching data:", err)
            setAlert(err.response?.data?.message || "Erro ao carregar dados.", "error")
        } finally {
            setIsLoading(false)
        }
    }, [setAlert])

    React.useEffect(() => {
        if (permissions?.visualizar) {
            fetchData()
        }
    }, [permissions?.visualizar, fetchData])

    const handleAddNew = () => {
        setEditingUser(null)
        setIsDialogOpen(true)
    }

    const handleEdit = (user: UserComNivel) => {
        setEditingUser(user)
        setIsDialogOpen(true)
    }

    const handleDelete = async (user: UserComNivel) => {
        setPendingUser(user)
        setConfirmOpen(true)
    }

    const [confirmOpen, setConfirmOpen] = React.useState(false)
    const [pendingUser, setPendingUser] = React.useState<UserComNivel | null>(null)

    const performDelete = async (user: UserComNivel) => {
        try {
            await api.delete(`/admin/users/${user.idUser}`) // Rota do UserController
            setAlert("Usuário excluído com sucesso!", "success")
            fetchData() // Recarrega a lista
        } catch (err: any) {
            setAlert(err.response?.data?.message || "Erro ao excluir usuário.", "error")
        }
    }

    const handleConfirmDelete = () => {
        if (!pendingUser) return
        performDelete(pendingUser)
        setPendingUser(null)
        setConfirmOpen(false)
    }

    // Callback para fechar o diálogo e recarregar dados após salvar
    const onDataChanged = () => {
        setIsDialogOpen(false)
        fetchData()
    }

    if (isLoading) { // Mostra loading enquanto busca permissões
        return (
            <div className="container mx-auto p-4 md:p-8 flex justify-center items-center h-[300px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }


    if (!permissions?.visualizar) {
        return (
            <div className="container mx-auto p-4 md:p-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Acesso Negado</CardTitle>
                        <CardDescription>
                            Você não tem permissão para gerenciar usuários.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        )
    }

    return (
        <div className="container mx-auto p-4 md:p-8">
            <h1 className="text-3xl font-bold tracking-tight mb-6">
                Gerenciar Usuários
            </h1>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Lista de Usuários</CardTitle>
                        <CardDescription>
                            Crie, edite ou exclua usuários do sistema.
                        </CardDescription>
                    </div>
                    {permissions?.criar && (
                        <Button onClick={handleAddNew}>
                            <PlusCircle className="w-4 h-4 mr-2" />
                            Novo Usuário
                        </Button>
                    )}
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center items-center py-10">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Usuário</TableHead>
                                    <TableHead>Nível</TableHead>
                                    <TableHead>Tipo</TableHead>
                                    <TableHead>Status</TableHead>
                                    {(permissions?.editar || permissions?.excluir) && (
                                        <TableHead className="w-[64px] text-right">Ações</TableHead>
                                    )}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map((user) => (
                                    <TableRow key={user.idUser}>
                                        <TableCell>
                                            <div className="font-medium">{user.name}</div>
                                            <div className="text-xs text-muted-foreground">{user.email}</div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary">{user.nivel_acesso.nome}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{user.type}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            {user.active ? (
                                                <Badge variant="outline" className="border-green-500 text-green-600">Ativo</Badge>
                                            ) : (
                                                <Badge variant="destructive">Inativo</Badge>
                                            )}
                                        </TableCell>
                                        {(permissions?.editar || permissions?.excluir) && (
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="rounded-full">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                                    <DropdownMenuItem
                                                                        onClick={() => {
                                                                            setTimeout(() => handleEdit(user), 50) // força fechamento do dropdown antes
                                                                        }}
                                                                    >
                                                                        Editar
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        onClick={() => {
                                                                            setTimeout(() => { setPendingUser(user); setConfirmOpen(true) }, 50)
                                                                        }}
                                                                        className="text-destructive"
                                                                    >
                                                                        Excluir
                                                                    </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>

                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* O Diálogo de Formulário (renderiza condicionalmente) */}
            <UserFormDialog
                isOpen={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                userToEdit={editingUser}
                niveisAcesso={niveis}
                onUserSaved={onDataChanged}
            />
            <ConfirmDialog
                open={confirmOpen}
                title="Excluir Usuário"
                description={pendingUser ? `Tem certeza que deseja excluir o usuário "${pendingUser.name}"?` : 'Tem certeza?' }
                intent="destructive"
                confirmLabel="Excluir"
                cancelLabel="Cancelar"
                onConfirm={handleConfirmDelete}
                onCancel={() => { setConfirmOpen(false); setPendingUser(null) }}
            />
        </div>
    )
}