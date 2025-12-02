"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import ConfirmDialog from '@/components/ui/confirm-dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAuth } from '@/hooks/use-auth'
import api from "@/services/api"
import { Edit, List, ListChecks, MoreVertical, Plus, Settings2, Trash2, UserPlus } from "lucide-react"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"

export default function FormulariosTab() {
    const [page, setPage] = useState(1)
    const [forms, setForms] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [limit] = useState(10)
    const [totalPages, setTotalPages] = useState(1)

    const [columns, setColumns] = useState({
        title: true,
        description: true,
        isScreening: true,
        updatedAt: true,
        responses: true,
        actions: true
    })

    const fetchForms = async () => {
        try {
            setIsLoading(true)
            const response = await api.get(`/forms?page=${page}&limit=${limit}`)
            console.log("Fetched forms:", response.data);
            setForms(response.data.forms || response.data)
            setTotalPages(response.data.totalPages || 1)
            setError(null)
        } catch (err) {
            console.error("Erro ao buscar formulários:", err)
            setError("Não foi possível carregar os formulários.")
        } finally {
            setIsLoading(false)
        }
    }
    const [confirmOpen, setConfirmOpen] = useState(false)
    const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

    const performDelete = async (id: string) => {
        try {
            await api.delete(`/forms/${id}`)
            fetchForms()
        } catch (err) {
            console.error("Erro ao excluir:", err)
        }
    }

    const handleConfirmDelete = () => {
        if (!pendingDeleteId) return
        performDelete(pendingDeleteId)
        setPendingDeleteId(null)
        setConfirmOpen(false)
    }

    const handleToggleScreening = async (id: string) => {
        try {
            await api.post(`/forms/${id}/toggle-screening`)
            fetchForms()
        } catch (err) {
            console.error("Erro ao alternar screening:", err)
        }
    }

    const { getPermissions, loading: authLoading } = useAuth()
    const permissions = useMemo(() => getPermissions('formulario'), [getPermissions])

    useEffect(() => {
        if (permissions?.visualizar) fetchForms()
    }, [page, permissions?.visualizar])

    return (
        <>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">

                <h1 className="text-3xl font-bold tracking-tight">Meus Formulários</h1>
                <div className="flex flex-wrap gap-4 items-center">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                                <Settings2 className="h-4 w-4" />
                                Colunas
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="p-2">
                            {Object.entries(columns).map(([key, value]) => (
                                <div key={key} className="flex items-center justify-between px-2 py-1">
                                    <span className="capitalize">{key}</span>
                                    <Switch
                                        checked={value}
                                        onCheckedChange={() =>
                                            setColumns((prev) => ({ ...prev, [key]: !prev[key as keyof typeof prev] }))
                                        }
                                    />
                                </div>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                    {permissions?.criar && (
                        <Link href={'/admin/criar-formulario'} >
                            <Button className="text-white">
                                <Plus size={18} className="mr-2" />
                                Criar Novo Formulário
                            </Button>
                        </Link>
                    )}
                </div>
            </div>

            {error && <p className="text-red-500">{error}</p>}
            <div className="rounded-lg border overflow-hidden">
                <Table className="scrollable overflow-auto">
                    <TableHeader className="sticky top-0 z-10 bg-muted">
                        <TableRow>
                            {columns.title && <TableHead className="min-w-52">Título</TableHead>}
                            {columns.description && <TableHead>Descrição</TableHead>}
                            {columns.updatedAt && <TableHead className="min-w-32">Atualizado em</TableHead>}
                            {columns.isScreening && <TableHead className="min-w-20">Triagem</TableHead>}
                            {columns.responses && <TableHead>Respostas</TableHead>}
                            {columns.actions && <TableHead className="min-w-20 flex justify-center items-center">Ações</TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody className="bg-white/40">
                        {isLoading ? (
                            // show skeleton rows while loading
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={`skeleton-${i}`}>
                                    {columns.title && <TableCell><Skeleton className="h-4 w-40" /></TableCell>}
                                    {columns.description && <TableCell><Skeleton className="h-4 w-60" /></TableCell>}
                                    {columns.updatedAt && <TableCell><Skeleton className="h-4 w-32" /></TableCell>}
                                    {columns.isScreening && <TableCell><Skeleton className="h-4 w-16" /></TableCell>}
                                    {columns.responses && <TableCell><Skeleton className="h-4 w-24" /></TableCell>}
                                    {columns.actions && <TableCell><Skeleton className="h-4 w-12 mx-auto" /></TableCell>}
                                </TableRow>
                            ))
                        ) : (
                            forms.map((form) => (
                                <TableRow key={form.idForm}>
                                    {columns.title && <TableCell>{form.title}</TableCell>}
                                    {columns.description && (
                                        <TableCell className="max-w-[200px] truncate">{form.description}</TableCell>
                                    )}
                                    {columns.updatedAt && (
                                        <TableCell>
                                            {new Date(form.updatedAt).toLocaleString("pt-BR", {
                                                day: "2-digit",
                                                month: "2-digit",
                                                year: "numeric",
                                                hour: "2-digit",
                                                minute: "2-digit"
                                            })}
                                        </TableCell>
                                    )}
                                    {columns.isScreening && (
                                        <TableCell>
                                            <Badge className={"px-2 py-1 " + (form.isScreening ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600')}>
                                                {form.isScreening ? 'Ativa' : 'Inativa'}
                                            </Badge>
                                        </TableCell>
                                    )}

                                    {columns.responses && (
                                        <TableCell className="max-w-[120px]">
                                            <Link href={`/admin/criar-formulario/${form.idForm}/respostas`}>
                                                <Badge className="inline-flex items-center gap-2 px-2 py-1 whitespace-nowrap">
                                                    <ListChecks className="h-3.5 w-3.5" />
                                                    <span>
                                                        {form.responses} {form.responses === 1 ? "Resposta" : "Respostas"}
                                                    </span>
                                                </Badge>
                                            </Link>
                                        </TableCell>
                                    )}
                                    {columns.actions && (
                                        <TableCell className="text-center p-0 justify-center items-center">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="rounded-full">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                                    <DropdownMenuSeparator />
                                                    {permissions?.editar && (
                                                        <DropdownMenuItem asChild>
                                                            <Link href={`/admin/criar-formulario/${form.idForm}`}>
                                                                <Edit className="mr-2 h-4 w-4" />
                                                                Editar Formulário
                                                            </Link>
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/admin/responder-formulario/${form.idForm}`}>
                                                            <List className="mr-2 h-4 w-4" />
                                                            Responder Formulário
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/admin/atribuir-usuarios/${form.idForm}`}>
                                                            <UserPlus className="mr-2 h-4 w-4" />
                                                            Atribuir Usuários
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/admin/criar-formulario/${form.idForm}/respostas`} className="cursor-pointer">
                                                            <ListChecks className="mr-2 h-4 w-4" />
                                                            <span>Ver Respostas</span>
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onSelect={() => handleToggleScreening(form.idForm)}
                                                    >
                                                        <Settings2 className="mr-2 h-4 w-4" />
                                                        {form.isScreening ? 'Desativar Triagem' : 'Ativar Triagem'}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    {permissions?.excluir && (
                                                        <DropdownMenuItem
                                                            className="text-destructive focus:bg-destructive focus:text-destructive-foreground cursor-pointer"
                                                            onSelect={() => setTimeout(() => { setPendingDeleteId(form.idForm); setConfirmOpen(true) }, 50)}
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Excluir
                                                        </DropdownMenuItem>
                                                    )}
                                                    </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="flex justify-end items-center mt-4 space-x-2">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                    Anterior
                </Button>
                <span>
                    Página {page} de {totalPages}
                </span>
                <Button
                    variant="outline"
                    size="sm"
                    disabled={page === totalPages}
                    onClick={() => setPage((p) => p + 1)}
                >
                    Próxima
                </Button>
            </div>

            <ConfirmDialog
                open={confirmOpen}
                onConfirm={handleConfirmDelete}
                onCancel={() => setConfirmOpen(false)}
                title="Excluir formulário"
                description="Tem certeza que deseja excluir este formulário? Esta ação não pode ser desfeita."
                confirmLabel="Excluir"
            />
        </>
    )
}
