"use client"

import { MenuAcessoDialog } from "@/components/access-level/menu-acesso-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import ColumnsDropdown from '@/components/ui/columns-dropdown'
import ConfirmDialog from "@/components/ui/confirm-dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAlert } from "@/hooks/use-alert"
import { useAuth } from "@/hooks/use-auth"; // Importa
import api from "@/services/api"
import { MenuAcesso } from "@/types/access-level"
import { MoreHorizontal, PlusCircle, Settings2 } from "lucide-react"
import * as React from "react"

export function GerenciarMenusSistema() {
    const [menus, setMenus] = React.useState<MenuAcesso[]>([])
    const [isLoading, setIsLoading] = React.useState(true)
    const [isDialogOpen, setIsDialogOpen] = React.useState(false)
    const [editingMenu, setEditingMenu] = React.useState<MenuAcesso | null>(null)
    const [visibleColumns, setVisibleColumns] = React.useState<Record<string, boolean>>({ menu: true, permissoes: true, acoes: true })

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

    // Bloqueia a tela inteira se não tiver permissão de visualizar
    if (isLoading) {
        return (
            <div className="min-h-[240px]">
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
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Menus do Sistema</CardTitle>
                    <CardDescription>
                        Crie os menus e defina suas permissões base.
                    </CardDescription>
                </div>
                                <div className="flex items-center gap-2">
                                    <ColumnsDropdown
                                        columns={visibleColumns}
                                        onChange={(c: Record<string, boolean>) => setVisibleColumns(c as Record<string, boolean>)}
                                        labels={{ menu: 'Menu (Slug)', permissoes: 'Permissões Base', acoes: 'Ações' }}
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
                                                        {visibleColumns.menu && <TableHead>Menu (Slug)</TableHead>}
                                                        {visibleColumns.permissoes && <TableHead>Permissões Base</TableHead>}
                                                        {/* Controla a coluna de "Ações" */}
                                                        {visibleColumns.acoes && (permissions?.editar || permissions?.excluir) && (
                                                                <TableHead className="w-[64px] text-right">Ações</TableHead>
                                                        )}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {menus.map((menu) => (
                            <TableRow key={menu.idMenuAcesso}>
                                                                {visibleColumns.menu && (
                                                                    <TableCell>
                                                                        <div className="font-medium">{menu.nome}</div>
                                                                        <div className="text-xs text-muted-foreground">{menu.slug}</div>
                                                                    </TableCell>
                                                                )}
                                                                {visibleColumns.permissoes && (
                                                                    <TableCell>
                                                                        <div className="flex flex-wrap gap-1">
                                                                                {menu.visualizar && <Badge variant="outline">Ver</Badge>}
                                                                                {menu.criar && <Badge variant="outline">Criar</Badge>}
                                                                                {menu.relatorio && <Badge variant="outline">Relatório</Badge>}
                                                                                {menu.editar && <Badge variant="outline" className="border-blue-500 text-blue-600">Editar</Badge>}
                                                                                {menu.excluir && <Badge variant="outline" className="border-red-500 text-red-500">Excluir</Badge>}
                                                                        </div>
                                                                    </TableCell>
                                                                )}
                                                                {/* Controla a célula de "Ações" */}
                                                                {visibleColumns.acoes && (permissions?.editar || permissions?.excluir) && (
                                                                    <TableCell className="text-right">
                                                                        <DropdownMenu>
                                                                            <DropdownMenuTrigger asChild>
                                                                                <Button variant="ghost" size="icon">
                                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                                </Button>
                                                                            </DropdownMenuTrigger>
                                                                            <DropdownMenuContent align="end">
                                                                                {/* Controla cada item */}
                                                                                {permissions?.editar && (
                                                                                    <DropdownMenuItem onClick={() => handleEdit(menu)}>
                                                                                        Editar Permissões
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

            {/* Diálogo */}
            <MenuAcessoDialog
                isOpen={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                menu={editingMenu}
                onDataChanged={fetchData} // Apenas recarrega os menus
            />
            <ConfirmDialog
                open={confirmOpen}
                title="Excluir Menu"
                description="Tem certeza que deseja excluir este menu?"
                intent="destructive"
                confirmLabel="Excluir"
                cancelLabel="Cancelar"
                onConfirm={handleConfirmDelete}
                onCancel={() => { setConfirmOpen(false); setPendingMenuId(null) }}
            />
        </Card>
    )
}