"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAlert } from "@/hooks/use-alert"
import { useAuth } from "@/hooks/use-auth"; // Para permissões
import api from "@/services/api"
import { UserComNivel } from "@/types/access-level"; // Você já deve ter este tipo
import { Loader2 } from "lucide-react"
import * as React from "react"

export default function AtivacaoPacientesPage() {
    const [users, setUsers] = React.useState<UserComNivel[]>([])
    const [isLoading, setIsLoading] = React.useState(true)
    const [updatingId, setUpdatingId] = React.useState<string | null>(null)

    const { setAlert } = useAlert()
    const { getPermissions } = useAuth()

    const permissions = React.useMemo(
        () => getPermissions("ativacao-usuarios"),
        [getPermissions]
    )

    const fetchData = React.useCallback(async () => {
        try {
            setIsLoading(true)
            const usersResponse = await api.get('/admin/acesso/users')
            // filter to patients only
            const list = usersResponse.data || []
            const patientsOnly = list.filter((u: any) => u.type === 'PACIENTE')
            setUsers(patientsOnly)
        } catch (err: any) {
            setAlert(err.response?.data?.message || "Erro ao carregar usuários.", "error")
        } finally {
            setIsLoading(false)
        }
    }, [setAlert])

    React.useEffect(() => {
        if (permissions?.visualizar) {
            fetchData()
        }
    }, [permissions?.visualizar, fetchData])

    const handleToggleActive = async (user: UserComNivel, newStatus: boolean) => {
        setUpdatingId(user.idUser)
        try {
            await api.patch(`/admin/acesso/users/${user.idUser}/status`, {
                active: newStatus
            })

            setUsers(currentUsers =>
                currentUsers.map(u =>
                    u.idUser === user.idUser ? { ...u, active: newStatus } : u
                )
            )
            setAlert(`Usuário ${user.name} ${newStatus ? 'ativado' : 'desativado'}.`, "success")
        } catch (err: any) {
            setAlert(err.response?.data?.message || "Erro ao atualizar status.", "error")
        } finally {
            setUpdatingId(null)
        }

    }
    
    if (isLoading) {
        return (
            <div className="container mx-auto p-4 md:p-8">
                <div className="mb-6">
                    <Skeleton className="h-8 w-1/3" />
                </div>
                <Card>
                    <CardHeader>
                        <div>
                            <Skeleton className="h-5 w-48" />
                            <Skeleton className="h-4 w-2/3 mt-2" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Usuário</TableHead>
                                    <TableHead>Nível de Acesso</TableHead>
                                    <TableHead className="w-[120px] text-right">Status (Ativo)</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell>
                                            <Skeleton className="h-4 w-40" />
                                            <Skeleton className="h-3 w-56 mt-2" />
                                        </TableCell>
                                        <TableCell>
                                            <Skeleton className="h-4 w-28" />
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end items-center space-x-2">
                                                <Skeleton className="h-6 w-12" />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
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
                            Você não tem permissão para acessar esta seção.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        )
    }

    return (
        <div className="container mx-auto p-4 md:p-8">
            <h1 className="text-3xl font-bold tracking-tight mb-6">
                Ativação de Pacientes
            </h1>
            <Card>
                <CardHeader>
                    <CardTitle>Gerenciar Ativação de Contas (Pacientes)</CardTitle>
                    <CardDescription>
                        Ative ou desative o login de pacientes no sistema.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Usuário</TableHead>
                                <TableHead>Nível de Acesso</TableHead>
                                <TableHead className="w-[120px] text-right">Status (Ativo)</TableHead>
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
                                    <TableCell className="text-right">
                                        <div className="flex justify-end items-center space-x-2">
                                            {updatingId === user.idUser && (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            )}
                                            <Switch
                                                checked={user.active}
                                                onCheckedChange={(newStatus) => {
                                                    handleToggleActive(user, newStatus)
                                                }}
                                                disabled={!permissions?.editar || updatingId === user.idUser}
                                                aria-label={`Ativar/Desativar ${user.name}`}
                                            />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
