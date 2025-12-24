"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import ColumnsDropdown from '@/components/ui/columns-dropdown'
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
import { UserComNivel } from "@/types/access-level"
import { Filter, Loader2, RefreshCcw, Settings2 } from "lucide-react"
import * as React from "react"
import { useCallback, useEffect, useMemo, useState } from "react"

export default function AtivacaoPacientesPage() {
    const [users, setUsers] = React.useState<UserComNivel[]>([])
    const [isLoading, setIsLoading] = React.useState(true)
    const [updatingId, setUpdatingId] = React.useState<string | null>(null)
    const [showFilters, setShowFilters] = useState(false)
    const [filterName, setFilterName] = useState<string>('')
    const [filterAccessLevel, setFilterAccessLevel] = useState<string>('')
    const [filterActive, setFilterActive] = useState<boolean | null>(null)
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)

    const [loaderRefresh, setLoaderRefresh] = useState(false)

    const [visibleColumns, setVisibleColumns] = useState(() => {
        try {
            const raw = localStorage.getItem('ativacao_pacientes_visible_columns')
            return raw ? JSON.parse(raw) : {
                usuario: true,
                nivel: true,
                status: true,
            }
        } catch (e) {
            return {
                usuario: true,
                nivel: true,
                status: true,
            }
        }
    })

    const visibleCount = Object.values(visibleColumns).filter(Boolean).length || 1

    useEffect(() => {
        try {
            localStorage.setItem('ativacao_pacientes_visible_columns', JSON.stringify(visibleColumns))
        } catch (e) { }
    }, [visibleColumns])

    const { setAlert } = useAlert()
    const { getPermissions } = useAuth()

    const permissions = useMemo(
        () => getPermissions("ativacao-usuarios"),
        [getPermissions]
    )

    const fetchData = useCallback(async () => {
        try {
            setLoaderRefresh(true)
            const params: any = {
                type: 'PACIENTE'
            }

            if (filterName) params.name = filterName
            if (filterAccessLevel) params.accessLevel = filterAccessLevel
            if (filterActive !== null) params.active = filterActive

            const usersResponse = await api.get('/admin/acesso/users', { params })
            setUsers(usersResponse.data || [])
        } catch (err: any) {
            setAlert(err.response?.data?.message || "Erro ao carregar usuários.", "error")
        } finally {
            setLoaderRefresh(false)
            setIsLoading(false)
        }
    }, [filterName, filterAccessLevel, filterActive])

    const [accessLevels, setAccessLevels] = useState<any[]>([])

    useEffect(() => {
        const fetchAccessLevels = async () => {
            try {
                const response = await api.get('/admin/acesso/niveis')
                const levels = response.data
                setAccessLevels(levels.sort())
            } catch (err) {
                console.error('Erro ao carregar níveis de acesso:', err)
            }
        }
        fetchAccessLevels()
    }, [])
    const paginatedUsers = useMemo(() => {
        const startIdx = (page - 1) * pageSize
        const endIdx = startIdx + pageSize
        return users.slice(startIdx, endIdx)
    }, [users, page, pageSize])

    const totalPages = Math.max(1, Math.ceil(users.length / pageSize))

    useEffect(() => {
        if (permissions?.visualizar) {
            fetchData()
        }
    }, [permissions?.visualizar, fetchData, filterName, filterAccessLevel, filterActive])

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
            fetchData()
        } catch (err: any) {
            setAlert(err.response?.data?.message || "Erro ao atualizar status.", "error")
        } finally {
            setUpdatingId(null)
        }
    }

    const applyFilters = useCallback(() => {
        setPage(1)
        fetchData()
    }, [fetchData])

    const clearFilters = useCallback(() => {
        setFilterName('')
        setFilterAccessLevel('')
        setFilterActive(null)
        setPage(1)
    }, [])

    if (isLoading) {
        return (
            <div className="p-2 md:p-4 lg:p-8">
                <div className="mb-6 flex items-center justify-between">
                    <Skeleton className="h-8 w-1/3" />
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-8 w-24 inline-block" />
                        <Skeleton className="h-8 w-24 inline-block" />
                        <Skeleton className="h-8 w-24 inline-block" />
                    </div>
                </div>
                <div className="rounded-lg overflow-hidden border">
                    <Table>
                        <TableHeader className="bg-muted sticky top-0 z-10">
                            <TableRow>
                                {visibleColumns.usuario && <TableHead><Skeleton className="h-4 w-32 bg-white" /></TableHead>}
                                {visibleColumns.nivel && <TableHead><Skeleton className="h-4 w-28 bg-white" /></TableHead>}
                                {visibleColumns.status && <TableHead className="flex justify-end items-center"><Skeleton className="h-4 w-24 bg-white" /></TableHead>}
                            </TableRow>
                        </TableHeader>
                        <TableBody className="bg-white/40">
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
                                    {visibleColumns.status && (
                                        <TableCell className="text-right">
                                            <Skeleton className="h-6 w-12 ml-auto" />
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
                <h1 className="text-3xl font-bold tracking-tight">Ativação de Pacientes</h1>
                <div className="flex items-center gap-2 flex-wrap">
                    <ColumnsDropdown
                        columns={visibleColumns}
                        onChange={(c: Record<string, boolean>) => setVisibleColumns(c)}
                        labels={{ usuario: 'Usuário', nivel: 'Nível de Acesso', status: 'Status' }}
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
                </div>
            </div>

            {showFilters && (
                <div className="mb-4 rounded-md bg-muted p-4">
                    <div className="grid grid-cols-1 lg:grid-cols-4 md:grid-cols-2 gap-3 items-end">
                        <div>
                            <Label htmlFor="filter-name">Usuário</Label>
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
                                onValueChange={setFilterAccessLevel}
                                defaultValue={filterAccessLevel}
                                value={filterAccessLevel}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {accessLevels.filter(nivel => nivel.idNivelAcesso !== 2).map(nivel => (
                                        <SelectItem key={nivel.idNivelAcesso} value={String(nivel.idNivelAcesso)}>
                                            {nivel.nome}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="filter-active">Status Ativo</Label>
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="filter-active"
                                    checked={filterActive === true}
                                    onCheckedChange={(checked) => {
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
                <Table className="bg-white">
                    <TableHeader className="bg-muted sticky top-0 z-10">
                        <TableRow>
                            {visibleColumns.usuario && <TableHead>Usuário</TableHead>}
                            {visibleColumns.nivel && <TableHead>Nível de Acesso</TableHead>}
                            {visibleColumns.status && <TableHead className="text-right">Status (Ativo)</TableHead>}
                        </TableRow>
                    </TableHeader>
                    {loaderRefresh ?
                        <TableBody className="bg-white">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <TableRow key={i}>
                                    {visibleColumns.usuario && <TableCell className="flex flex-col gap-2">
                                        <Skeleton className="h-4 w-32" />
                                        <Skeleton className="h-2 w-44" />
                                    </TableCell>}
                                    {visibleColumns.nivel && <TableCell><Skeleton className="h-4 w-28" /></TableCell>}
                                    {visibleColumns.status && <TableCell className="text-right"><Skeleton className="h-6 w-12 ml-auto" /></TableCell>}
                                </TableRow>
                            ))}
                        </TableBody> :
                        <TableBody className="bg-white/40">
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
                                    {visibleColumns.status && (
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
                        onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
                        selectedCount={0}
                    />
                </div>
            </div>

        </div>
    )
}