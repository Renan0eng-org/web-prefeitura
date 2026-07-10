"use client"

import { MenuAcessoDialog } from "@/components/access-level/menu-acesso-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import ColumnsDropdown from '@/components/ui/columns-dropdown'
import ConfirmDialog from "@/components/ui/confirm-dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAlert } from "@/hooks/use-alert"
import { useAuth } from "@/hooks/use-auth"
import api from "@/services/api"
import { MenuAcesso } from "@/types/access-level"
import { MoreHorizontal, PlusCircle, Settings2 } from "lucide-react"
import * as React from "react"

export function GerenciarMenusSistema() {
    const [menus, setMenus] = React.useState<MenuAcesso[]>([])
    const [isLoading, setIsLoading] = React.useState(true)
    const [isDialogOpen, setIsDialogOpen] = React.useState(false)
    const [editingMenu, setEditingMenu] = React.useState<MenuAcesso | null>(null)
    const [visibleColumns, setVisibleColumns] = React.useState<Record<string, boolean>>({ menu: true, slug: true, acoes: true })

    const { setAlert } = useAlert()
    const { getPermissions } = useAuth()

    const permissions = React.useMemo(
        () => getPermissions("acesso"),
        [getPermissions]
    )

    const fetchData = async () => {
        try {
            setIsLoading(true)
            const response = await api.get('/admin/acesso/menus')
            setMenus(response.data)
        } catch (err: any) {
            setAlert(err.response?.data?.message || "Erro ao carregar menus.", "error")
        } finally {
            setIsLoading(false)
        }
    }

    React.useEffect(() => {
        fetchData()
    }, [])

    const handleAddNew = () => {
        setEditingMenu(null)
        setIsDialogOpen(true)
    }

    const handleEdit = (menu: MenuAcesso) => {
        setEditingMenu(menu)
        setIsDialogOpen(true)
    }

    const [confirmOpen, setConfirmOpen] = React.useState(false)
    const [pendingMenuId, setPendingMenuId] = React.useState<number | null>(null)

    const performDelete = async (id: number) => {
        try {
            await api.delete(`/admin/acesso/menus/${id}`)
            setAlert("Menu excluído com sucesso!", "success")
            fetchData()
        } catch (err: any) {
            setAlert(err.response?.data?.message || "Erro ao excluir menu.", "error")
        }
    }

    const handleConfirmDelete = () => {
        if (!pendingMenuId) return
        performDelete(pendingMenuId)
        setPendingMenuId(null)
        setConfirmOpen(false)
    }

    if (isLoading) {
        return (
            <Card>
                <CardHeader className="flex items-center justify-between">
                    <div>
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-4 w-40 mt-2" />
                    </div>
                    <Skeleton className="h-9 w-28" />
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <Skeleton key={i} className="h-12 w-full" />
                        ))}
                    </div>
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
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Menus do Sistema</CardTitle>
                    <CardDescription>
                        Gerencie os menus (telas) disponíveis no sistema. As permissões são configuradas na aba "Permissões por Nível".
                    </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                    <ColumnsDropdown
                        columns={visibleColumns}
                        onChange={(c: Record<string, boolean>) => setVisibleColumns(c as Record<string, boolean>)}
                        labels={{ menu: 'Nome', slug: 'Slug', acoes: 'Ações' }}
                        contentClassName="p-2"
                        buttonLabel={<><Settings2 className="h-4 w-4" /> Colunas</>}
                    />
                    {permissions?.criar && (
                        <Button onClick={handleAddNew}>
                            <PlusCircle className="w-4 h-4 mr-2" />
                            Novo Menu
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            {visibleColumns.menu && <TableHead>Nome</TableHead>}
                            {visibleColumns.slug && <TableHead>Slug</TableHead>}
                            {visibleColumns.acoes && (permissions?.editar || permissions?.excluir) && (
                                <TableHead className="w-[64px] text-right">Ações</TableHead>
                            )}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {menus.map((menu) => (
                            <TableRow key={menu.idMenuAcesso}>
                                {visibleColumns.menu && (
                                    <TableCell className="font-medium">{menu.nome}</TableCell>
                                )}
                                {visibleColumns.slug && (
                                    <TableCell>
                                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{menu.slug}</code>
                                    </TableCell>
                                )}
                                {visibleColumns.acoes && (permissions?.editar || permissions?.excluir) && (
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                {permissions?.editar && (
                                                    <DropdownMenuItem onClick={() => handleEdit(menu)}>
                                                        Editar
                                                    </DropdownMenuItem>
                                                )}
                                                {permissions?.excluir && (
                                                    <DropdownMenuItem onClick={() => { setPendingMenuId(menu.idMenuAcesso); setConfirmOpen(true) }} className="text-destructive">
                                                        Excluir
                                                    </DropdownMenuItem>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                )}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>

            <MenuAcessoDialog
                isOpen={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                menu={editingMenu}
                onDataChanged={fetchData}
            />
            <ConfirmDialog
                open={confirmOpen}
                title="Excluir Menu"
                description="Tem certeza que deseja excluir este menu? As permissões vinculadas a ele serão removidas."
                intent="destructive"
                confirmLabel="Excluir"
                cancelLabel="Cancelar"
                onConfirm={handleConfirmDelete}
                onCancel={() => { setConfirmOpen(false); setPendingMenuId(null) }}
            />
        </Card>
    )
}
