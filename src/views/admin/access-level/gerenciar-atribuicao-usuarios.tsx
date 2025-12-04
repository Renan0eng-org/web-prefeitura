"use client"
// src/views/admin/access-level/gerenciar-atribuicao-usuarios.tsx

import { UsuarioNivelDialog } from "@/components/access-level/usuario-nivel-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import ColumnsDropdown from '@/components/ui/columns-dropdown'
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAlert } from "@/hooks/use-alert"
import { useAuth } from "@/hooks/use-auth"; // Importa
import api from "@/services/api"
import { NivelAcesso, UserComNivel } from "@/types/access-level"
import { Edit, Settings2 } from "lucide-react"
import * as React from "react"

export function GerenciarAtribuicaoUsuarios() {
    const [users, setUsers] = React.useState<UserComNivel[]>([])
    const [niveisDisponiveis, setNiveisDisponiveis] = React.useState<NivelAcesso[]>([])
    const [isLoading, setIsLoading] = React.useState(true)
    const [isDialogOpen, setIsDialogOpen] = React.useState(false)
    const [editingUser, setEditingUser] = React.useState<UserComNivel | null>(null)
    const [visibleColumns, setVisibleColumns] = React.useState<Record<string, boolean>>({ usuario: true, nivel: true, status: true, acoes: true })

    const { setAlert } = useAlert()
    const { getPermissions } = useAuth() // Pega a função

    // Define permissões
    const permissions = React.useMemo(
        () => getPermissions("acesso"),
        [getPermissions]
    )

    const fetchData = async () => {
        try {
            setIsLoading(true)
            const [usersResponse, niveisResponse] = await Promise.all([
                api.get('/admin/acesso/users'),
                api.get('/admin/acesso/niveis'),
            ])
            setUsers(usersResponse.data)
            setNiveisDisponiveis(niveisResponse.data)
        } catch (err: any) {
            setAlert(err.response?.data?.message || "Erro ao carregar dados.", "error")
        } finally {
            setIsLoading(false)
        }
    }

    React.useEffect(() => {
        fetchData()
    }, [])

    const handleEdit = (user: UserComNivel) => {
        setEditingUser(user)
        setIsDialogOpen(true)
    }

    const onDataChanged = () => {
        fetchData() // Re-busca os dados após a atualização
        setIsDialogOpen(false) // Fecha o diálogo
    }

    // Bloqueia a tela inteira se não tiver permissão de visualizar
    if (isLoading) {
        return (
            <div className="min-h-[240px]">
                <Card>
                    <CardHeader>
                        <div>
                            <Skeleton className="h-6 w-1/3" />
                            <Skeleton className="h-4 w-2/3 mt-2" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <Skeleton className="h-6 w-full" />
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="py-2">
                                    <Skeleton className="h-8 w-full" />
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (!permissions?.visualizar) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Acesso Negado</CardTitle>
                    <CardDescription>
                        Você não tem permissão para visualizar esta seção.
                    </CardDescription>
                </CardHeader>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader className="flex items-center justify-between flex-row">
                <div>
                    <CardTitle>Atribuição de Usuários</CardTitle>
                    <CardDescription>
                        Atribua um nível de acesso para cada usuário do sistema.
                    </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                    <ColumnsDropdown
                        columns={visibleColumns}
                        onChange={(c: Record<string, boolean>) => setVisibleColumns(c as Record<string, boolean>)}
                        labels={{ usuario: 'Usuário', nivel: 'Nível', status: 'Status', acoes: 'Ações' }}
                        contentClassName="p-2"
                        buttonLabel={<><Settings2 className="h-4 w-4" /> Colunas</>}
                    />
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            {visibleColumns.usuario && <TableHead>Usuário</TableHead>}
                            {visibleColumns.nivel && <TableHead>Nível de Acesso</TableHead>}
                            {visibleColumns.status && <TableHead>Status</TableHead>}
                            {/* Controla a coluna de "Ações" */}
                            {visibleColumns.acoes && permissions?.editar && (
                                <TableHead className="w-[64px] text-right">Ações</TableHead>
                            )}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((user) => (
                            <TableRow key={user.idUser}>
                                {visibleColumns.usuario && (
                                    <TableCell>
                                        <div className="font-medium">{user.name}</div>
                                        <div className="text-xs text-muted-foreground">{user.email}</div>
                                    </TableCell>
                                )}
                                {visibleColumns.nivel && (
                                    <TableCell>
                                        <Badge variant={user.nivel_acesso.nome === 'Administrador' ? 'default' : 'secondary'}>
                                            {user.nivel_acesso.nome}
                                        </Badge>
                                    </TableCell>
                                )}
                                {visibleColumns.status && (
                                    <TableCell>
                                        {user.active ? (
                                            <Badge variant="outline" className="border-green-500 text-green-600">Ativo</Badge>
                                        ) : (
                                            <Badge variant="destructive">Inativo</Badge>
                                        )}
                                    </TableCell>
                                )}
                                {/* Controla a célula de "Ações" */}
                                {visibleColumns.acoes && permissions?.editar && (
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => handleEdit(user)}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                )}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>

            {/* Diálogo */}
            {editingUser && (
                <UsuarioNivelDialog
                    isOpen={isDialogOpen}
                    onOpenChange={setIsDialogOpen}
                    user={editingUser as UserComNivel}
                    niveisDisponiveis={niveisDisponiveis}
                    onDataChanged={onDataChanged}
                />
            )}
        </Card>
    )
}