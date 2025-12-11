"use client"

import { UserFormDialog } from "@/components/forms/usuarios/user-form-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import ColumnsDropdown from '@/components/ui/columns-dropdown'
import ConfirmDialog from "@/components/ui/confirm-dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Pagination from '@/components/ui/pagination'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAlert } from "@/hooks/use-alert"
import { useAuth } from "@/hooks/use-auth"
import api from "@/services/api"
import { NivelAcesso, UserComNivel } from "@/types/access-level"
import { Filter, MoreHorizontal, PlusCircle, RefreshCcw, Settings2 } from "lucide-react"
import * as React from "react"

export default function UsuariosPage() {
    const [users, setUsers] = React.useState<UserComNivel[]>([])
    const [niveis, setNiveis] = React.useState<NivelAcesso[]>([])
    const [isLoading, setIsLoading] = React.useState(true)
    const [isDialogOpen, setIsDialogOpen] = React.useState(false)
    const [editingUser, setEditingUser] = React.useState<UserComNivel | null>(null)
    const [showFilters, setShowFilters] = React.useState(false)
    const [filterName, setFilterName] = React.useState<string>('')
    const [filterAccessLevel, setFilterAccessLevel] = React.useState<string>('')
    const [filterType, setFilterType] = React.useState<string>('')
    const [filterActive, setFilterActive] = React.useState<boolean | null>(null)
    const [page, setPage] = React.useState(1)
    const [pageSize, setPageSize] = React.useState(10)
    
        const [loaderRefresh, setLoaderRefresh] = React.useState(false)

    const [visibleColumns, setVisibleColumns] = React.useState(() => {
        try {
            const raw = localStorage.getItem('usuarios_visible_columns')
            return raw ? JSON.parse(raw) : { usuario: true, nivel: true, tipo: true, status: true, acoes: true }
        } catch (e) {
            return { usuario: true, nivel: true, tipo: true, status: true, acoes: true }
        }
    })

    React.useEffect(() => {
        try {
            localStorage.setItem('usuarios_visible_columns', JSON.stringify(visibleColumns))
        } catch (e) { }
    }, [visibleColumns])

    const visibleCount = Object.values(visibleColumns).filter(Boolean).length || 1

    const { setAlert } = useAlert()
    const { getPermissions } = useAuth()

    const permissions = React.useMemo(
        () => getPermissions("gerenciar-usuarios"), // Use o slug correto
        [getPermissions]
    )

    const fetchData = React.useCallback(async () => {
        try {
            setLoaderRefresh(true)
            const params: any = {}
            
            if (filterName) params.name = filterName
            if (filterAccessLevel && filterAccessLevel !== 'all') params.accessLevel = filterAccessLevel
            if (filterType && filterType !== 'all') params.type = filterType
            if (filterActive !== null) params.active = filterActive
            
            const [usersResponse, niveisResponse] = await Promise.all([
                api.get('/admin/users', { params }),
                api.get('/admin/acesso/niveis')
            ])
            setUsers(usersResponse.data)
            setNiveis(niveisResponse.data)
        } catch (err: any) {
            console.error("Error fetching data:", err)
            setAlert(err.response?.data?.message || "Erro ao carregar dados.", "error")
        } finally {
            setLoaderRefresh(false)
            setIsLoading(false)
        }
    }, [filterName, filterAccessLevel, filterType, filterActive])

    React.useEffect(() => {
        if (permissions?.visualizar) {
            fetchData()
        }
    }, [permissions?.visualizar, fetchData])

    const paginatedUsers = React.useMemo(() => {
        const startIdx = (page - 1) * pageSize
        const endIdx = startIdx + pageSize
        return users.slice(startIdx, endIdx)
    }, [users, page, pageSize])

    const totalPages = Math.max(1, Math.ceil(users.length / pageSize))

    const applyFilters = React.useCallback(() => {
        setPage(1)
        fetchData()
    }, [fetchData])

    const clearFilters = React.useCallback(() => {
        setFilterName('')
        setFilterAccessLevel('all')
        setFilterType('all')
        setFilterActive(null)
        setPage(1)
    }, [])

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
            await api.delete(`/admin/users/${user.idUser}`)
            setAlert("Usuário excluído com sucesso!", "success")
            fetchData()
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

    const onDataChanged = () => {
        setIsDialogOpen(false)
        fetchData()
    }

    if (isLoading) {
        return (
            <div className="p-2 md:p-4 lg:p-8">
                <div className="mb-6">
                    <Skeleton className="h-8 w-1/3" />
                </div>
                <div className="rounded-lg overflow-hidden border">
                    <Table>
                        <TableHeader className="bg-muted sticky top-0 z-10">
                            <TableRow>
                                {visibleColumns.usuario && <TableHead>Usuário</TableHead>}
                                {visibleColumns.nivel && <TableHead>Nível</TableHead>}
                                {visibleColumns.tipo && <TableHead>Tipo</TableHead>}
                                {visibleColumns.status && <TableHead>Status</TableHead>}
                                {visibleColumns.acoes && <TableHead className="text-right">Ações</TableHead>}
                            </TableRow>
                        </TableHeader>
                        <TableBody className="bg-white">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <TableRow key={i}>
                                    {visibleColumns.usuario && (
                                        <TableCell>
                                            <Skeleton className="h-4 w-40" />
                                            <Skeleton className="h-3 w-56 mt-2" />
                                        </TableCell>
                                    )}
                                    {visibleColumns.nivel && (
                                        <TableCell>
                                            <Skeleton className="h-4 w-28" />
                                        </TableCell>
                                    )}
                                    {visibleColumns.tipo && (
                                        <TableCell>
                                            <Skeleton className="h-4 w-20" />
                                        </TableCell>
                                    )}
                                    {visibleColumns.status && (
                                        <TableCell>
                                            <Skeleton className="h-4 w-16" />
                                        </TableCell>
                                    )}
                                    {visibleColumns.acoes && (
                                        <TableCell className="text-right">
                                            <Skeleton className="h-8 w-8 ml-auto rounded-full" />
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
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
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Gerenciar Usuários</h1>
                <div className="flex items-center gap-2">
                    <ColumnsDropdown
                        columns={visibleColumns}
                        onChange={(c: Record<string, boolean>) => setVisibleColumns(c)}
                        labels={{ usuario: 'Usuário', nivel: 'Nível', tipo: 'Tipo', status: 'Status', acoes: 'Ações' }}
                        contentClassName="p-2"
                        buttonLabel={<><Settings2 className="h-4 w-4" /> Colunas</>}
                    />
                    <Button variant="outline" size="sm" onClick={() => fetchData()}>
                        <RefreshCcw className="h-4 w-4" />
                        Atualizar
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setShowFilters(v => !v)}>
                        <Filter className="h-4 w-4" />
                        Filtros
                    </Button>
                    {permissions?.criar && (
                        <Button onClick={handleAddNew}>
                            <PlusCircle className="w-4 h-4" />
                            Novo Usuário
                        </Button>
                    )}
                </div>
            </div>

            {showFilters && (
                <div className="mb-4 rounded-md bg-muted p-4">
                    <div className="grid grid-cols-1 lg:grid-cols-5 md:grid-cols-2 gap-3 items-end">
                        <div>
                            <Label htmlFor="filter-name">Nome</Label>
                            <Input
                                id="filter-name"
                                value={filterName}
                                onChange={(e) => setFilterName(e.target.value)}
                                placeholder="Nome do usuário"
                            />
                        </div>
                        <div>
                            <Label htmlFor="filter-access-level">Nível de Acesso</Label>
                            <Select
                                value={filterAccessLevel}
                                onValueChange={setFilterAccessLevel}
                            >
                                <SelectTrigger id="filter-access-level">
                                    <SelectValue placeholder="Selecione um nível..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos</SelectItem>
                                    {niveis.filter(nivel => nivel.idNivelAcesso !== 2).map(nivel => (
                                        <SelectItem key={nivel.idNivelAcesso} value={nivel.nome}>{nivel.nome}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="filter-type">Tipo</Label>
                            <Select
                                value={filterType}
                                onValueChange={setFilterType}
                                defaultValue=""
                            >
                                <SelectTrigger id="filter-type">
                                    <SelectValue placeholder="Selecione um tipo..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all" key="todos">Todos</SelectItem>
                                    <SelectItem value="PACIENTE" key="paciente">USUARIO</SelectItem>
                                    <SelectItem value="MEDICO" key="medico">MÉDICO</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex flex-col justify-between h-full pt-1">
                            <Label htmlFor="filter-active">Status Ativo</Label>
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="filter-active"
                                    checked={filterActive === true}
                                    onCheckedChange={(checked: boolean) => {
                                        if (checked === (filterActive === true)) {
                                            setFilterActive(null)
                                        } else {
                                            setFilterActive(checked)
                                        }
                                    }}
                                />
                                <Label htmlFor="filter-active" className="text-xs cursor-pointer">
                                    {filterActive === null ? 'Todos' : filterActive ? 'Ativos' : 'Inativos'}
                                </Label>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 justify-end">
                            <Button onClick={() => { applyFilters(); }}>Aplicar</Button>
                            <Button variant="outline" onClick={() => { clearFilters(); }}>Limpar</Button>
                        </div>
                    </div>
                </div>
            )}

            <div className="rounded-lg overflow-hidden border">
                <Table className="bg-white/40">
                    <TableHeader className="bg-muted sticky top-0 z-10">
                        <TableRow>
                            {visibleColumns.usuario && <TableHead>Usuário</TableHead>}
                            {visibleColumns.nivel && <TableHead>Nível</TableHead>}
                            {visibleColumns.tipo && <TableHead>Tipo</TableHead>}
                            {visibleColumns.status && <TableHead>Status</TableHead>}
                            {visibleColumns.acoes && (permissions?.editar || permissions?.excluir) && (
                                <TableHead className="w-[64px] text-right">Ações</TableHead>
                            )}
                        </TableRow>
                    </TableHeader>
                    {loaderRefresh ?
                        <TableBody className="bg-white">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <TableRow key={i}>
                                    {visibleColumns.usuario && (    
                                        <TableCell>
                                            <Skeleton className="h-4 w-40" />
                                            <Skeleton className="h-3 w-56 mt-2" />
                                        </TableCell>
                                    )}
                                    {visibleColumns.nivel && (
                                        <TableCell>
                                            <Skeleton className="h-4 w-28" />
                                        </TableCell>
                                    )}
                                    {visibleColumns.tipo && (
                                        <TableCell>
                                            <Skeleton className="h-4 w-20" />
                                        </TableCell>    
                                    )}
                                    {visibleColumns.status && (
                                        <TableCell>
                                            <Skeleton className="h-4 w-16" />
                                        </TableCell>
                                    )}
                                    {visibleColumns.acoes && (permissions?.editar || permissions?.excluir) && (
                                        <TableCell className="text-right">
                                            <Skeleton className="h-8 w-8 ml-auto rounded-full" />
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))}
                        </TableBody>
                    :<TableBody className="bg-white">
                        {paginatedUsers.map((user) => (
                            <TableRow key={user.idUser}>
                                {visibleColumns.usuario && (
                                    <TableCell>
                                        <div className="font-medium">{user.name}</div>
                                        <div className="text-xs text-muted-foreground">{user.email}</div>
                                    </TableCell>
                                )}
                                {visibleColumns.nivel && (
                                    <TableCell>
                                        <Badge variant="secondary">{user.nivel_acesso.nome}</Badge>
                                    </TableCell>
                                )}
                                {visibleColumns.tipo && (
                                    <TableCell>
                                        <Badge variant="outline">{user.type}</Badge>
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
                                {visibleColumns.acoes && (permissions?.editar || permissions?.excluir) && (
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
                                                        setTimeout(() => handleEdit(user), 50)
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
                        {users.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={visibleCount} className="text-center text-muted-foreground py-8">
                                    Nenhum usuário encontrado.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>}
                </Table>
                <div className="border-t border-gray-200">
                    <Pagination
                        page={page}
                        pageSize={pageSize}
                        total={users.length}
                        totalPages={totalPages}
                        onPageChange={(p) => setPage(p)}
                        onPageSizeChange={(size) => {
                            setPageSize(size)
                            setPage(1)
                        }}
                        selectedCount={0}
                    />
                </div>
            </div>

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
                description={pendingUser ? `Tem certeza que deseja excluir o usuário "${pendingUser.name}"?` : 'Tem certeza?'}
                intent="destructive"
                confirmLabel="Excluir"
                cancelLabel="Cancelar"
                onConfirm={handleConfirmDelete}
                onCancel={() => { setConfirmOpen(false); setPendingUser(null) }}
            />
        </div>
    )
}