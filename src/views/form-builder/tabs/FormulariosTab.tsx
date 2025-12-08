"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import ColumnsDropdown from '@/components/ui/columns-dropdown'
import ConfirmDialog from '@/components/ui/confirm-dialog'
import { DateRangePicker } from '@/components/ui/date-range-piker'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Pagination from '@/components/ui/pagination'
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAuth } from '@/hooks/use-auth'
import api from "@/services/api"
import { Edit, FilePlus, Filter, List, ListChecks, MoreVertical, RefreshCcw, Settings2, Trash2, UserPlus } from "lucide-react"
import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import { DateRange } from 'react-day-picker'

export default function FormulariosTab() {
    const [page, setPage] = useState(1)
    const [forms, setForms] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [pageSize, setPageSize] = useState(10)
    const [totalPages, setTotalPages] = useState(1)
    const [total, setTotal] = useState(0)

    const [columns, setColumns] = useState<Record<string, boolean>>(() => {
        try {
            const raw = localStorage.getItem('formularios_visible_columns')
            return raw ? JSON.parse(raw) : {
                title: true,
                description: true,
                isScreening: true,
                updatedAt: true,
                createdAt: true,
                responses: true,
                actions: true
            }
        } catch (e) {
            return {
                title: true,
                description: true,
                isScreening: true,
                updatedAt: true,
                createdAt: true,
                responses: true,
                actions: true
            }
        }
    })

    useEffect(() => {
        try { localStorage.setItem('formularios_visible_columns', JSON.stringify(columns)) } catch (e) { }
    }, [columns])

    // Filters
    const [showFilters, setShowFilters] = useState(false)
    const [filterTitle, setFilterTitle] = useState<string>('')
    const [filterDescription, setFilterDescription] = useState<string>('')
    const [filterDateRange, setFilterDateRange] = useState<DateRange | undefined>(undefined)
        const [filterCreatedDateRange, setFilterCreatedDateRange] = useState<DateRange | undefined>(undefined)
    const [filterScreening, setFilterScreening] = useState<boolean | undefined>(undefined)
    const [filterResponsesMin, setFilterResponsesMin] = useState<number | undefined>(undefined)
    const [filterResponsesMax, setFilterResponsesMax] = useState<number | undefined>(undefined)


    const fetchForms = async (overrides?: { page?: number; pageSize?: number }, filters?: {
        title?: string
        description?: string
        from?: string
        to?: string
            createdFrom?: string
            createdTo?: string
        isScreening?: boolean
        responsesMin?: number
        responsesMax?: number
    }) => {
        try {
            setIsLoading(true)
            const p = overrides?.page ?? page
            const psize = overrides?.pageSize ?? pageSize
            const params: any = { page: p, pageSize: psize }
            if (filters) {
                if (filters.title) params.title = filters.title
                if (filters.description) params.description = filters.description
                if (filters.from) params.from = filters.from
                if (filters.to) params.to = filters.to
                    if (filters.createdFrom) params.createdFrom = filters.createdFrom
                    if (filters.createdTo) params.createdTo = filters.createdTo
                if (typeof filters.isScreening === 'boolean') params.isScreening = filters.isScreening
                if (typeof filters.responsesMin === 'number') params.responsesMin = filters.responsesMin
                if (typeof filters.responsesMax === 'number') params.responsesMax = filters.responsesMax
            }
            const response = await api.get(`/forms`, { params })
            const payload = response.data
            const items = payload.forms || payload.data || payload || []
            setForms(items)
            const totalVal = payload.total ?? payload.totalItems ?? (payload.totalPages ? payload.totalPages * psize : (Array.isArray(payload) ? payload.length : 0))
            setTotal(typeof totalVal === 'number' ? totalVal : 0)
            const tPages = payload.totalPages ?? (psize ? Math.max(1, Math.ceil((totalVal || 0) / psize)) : 1)
            setTotalPages(tPages)
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
            fetchForms({ page, pageSize })
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
            const filters = {
                title: filterTitle || undefined,
                description: filterDescription || undefined,
                from: filterDateRange?.from ? filterDateRange.from.toISOString() : undefined,
                to: filterDateRange?.to ? filterDateRange.to.toISOString() : undefined,
                isScreening: typeof filterScreening === 'boolean' ? filterScreening : undefined,
                responsesMin: typeof filterResponsesMin === 'number' ? filterResponsesMin : undefined,
                responsesMax: typeof filterResponsesMax === 'number' ? filterResponsesMax : undefined,
            }
            fetchForms({ page, pageSize }, filters)
        } catch (err) {
            console.error("Erro ao alternar screening:", err)
        }
    }

    const { getPermissions, loading: authLoading } = useAuth()
    const permissions = useMemo(() => getPermissions('formulario'), [getPermissions])

    useEffect(() => {
        if (permissions?.visualizar) {
            const filters = {
                title: filterTitle || undefined,
                description: filterDescription || undefined,
                from: filterDateRange?.from ? filterDateRange.from.toISOString() : undefined,
                to: filterDateRange?.to ? filterDateRange.to.toISOString() : undefined,
                createdFrom: filterCreatedDateRange?.from ? filterCreatedDateRange.from.toISOString() : undefined,
                createdTo: filterCreatedDateRange?.to ? filterCreatedDateRange.to.toISOString() : undefined,
                isScreening: typeof filterScreening === 'boolean' ? filterScreening : undefined,
                responsesMin: typeof filterResponsesMin === 'number' ? filterResponsesMin : undefined,
                responsesMax: typeof filterResponsesMax === 'number' ? filterResponsesMax : undefined,
            }
            fetchForms({ page, pageSize }, filters)
        }
    }, [page, pageSize, permissions?.visualizar, filterTitle, filterDescription, filterDateRange, filterCreatedDateRange, filterScreening, filterResponsesMin, filterResponsesMax])
    const applyFilters = useCallback(() => {
        setPage(1)
        // fetch will be triggered by useEffect
    }, [])

    const clearFilters = useCallback(() => {
        setFilterTitle('')
        setFilterDescription('')
        setFilterDateRange(undefined)
        setFilterCreatedDateRange(undefined)
        setFilterScreening(undefined)
        setFilterResponsesMin(undefined)
        setFilterResponsesMax(undefined)
        setPage(1)
    }, [])

    return (
        <>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">

                <h1 className="text-3xl font-bold tracking-tight">Meus Formulários</h1>
                <div className="flex flex-wrap gap-2 items-center">
                    <ColumnsDropdown
                        columns={columns}
                        onChange={(c: Record<string, boolean>) => setColumns(c)}
                        labels={{ 
                            title: 'Título', 
                            description: 'Descrição', 
                            isScreening: 'Triagem', 
                            updatedAt: 'Atualizado em', 
                            createdAt: 'Criado em',
                            responses: 'Respostas', 
                            actions: 'Ações' 
                        }}
                        buttonLabel={<><Settings2 className="h-4 w-4" /> Colunas</>}
                        contentClassName="p-2"
                    />
                    <Button variant="outline" size="sm" onClick={() => fetchForms()}>
                        <RefreshCcw className="h-4 w-4" />
                        Atualizar
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setShowFilters(v => !v)}>
                        <Filter className="h-4 w-4" />
                        Filtros
                    </Button>
                    {permissions?.criar && (
                        <Link href={'/admin/criar-formulario'} >
                            <Button className="text-white">
                                <FilePlus className="h-4 w-4" />
                                Criar Novo Formulário
                            </Button>
                        </Link>
                    )}
                </div>
            </div>

            {/* filtros aqui entre a tabela e o header */}
            {showFilters && (
                <div className="mb-4 rounded-md bg-muted p-4">
                    <div className="grid grid-cols-1 lg:grid-cols-3 md:grid-cols-2 gap-3 items-end">
                        <div>
                            <Label htmlFor="filter-title">Título</Label>
                            <Input id="filter-title" value={filterTitle} onChange={(e) => setFilterTitle(e.target.value)} placeholder="Título" />
                        </div>
                        <div>
                            <Label htmlFor="filter-description">Descrição</Label>
                            <Input id="filter-description" value={filterDescription} onChange={(e) => setFilterDescription(e.target.value)} placeholder="Descrição" />
                        </div>
                        <div>
                            <Label>Atualizado em</Label>
                            <DateRangePicker value={filterDateRange} onChange={(r) => setFilterDateRange(r)} />
                        </div>
                        <div>
                            <Label>Criado em</Label>
                            <DateRangePicker value={filterCreatedDateRange} onChange={(r) => setFilterCreatedDateRange(r)} />
                        </div>
                        <div>
                            <Label>Triagem</Label>
                            <div className="mt-2">
                                {/* <Switch checked={Boolean(filterScreening)} onCheckedChange={(v) => setFilterScreening(v ? true : undefined)} />
                                <Button variant="ghost" size="sm" className="ml-2" onClick={() => setFilterScreening(undefined)}>Todos</Button> */}
                                {/* Radigrup */}
                                <RadioGroup
                                    className="flex flex-wrap gap-2"
                                    value={filterScreening === true ? 'ATIVA' : filterScreening === false ? 'INATIVA' : 'TODOS'}
                                    onValueChange={(value) => {
                                        if (value === 'ATIVA') setFilterScreening(true)
                                        else if (value === 'INATIVA') setFilterScreening(false)
                                        else setFilterScreening(undefined)
                                    }}
                                >

                                    <div className="flex items-center gap-2">
                                        <RadioGroupItem value="ATIVA" id="screening-ativa" onClick={() => setFilterScreening(true)} />
                                        <Label htmlFor="screening-ativa">Ativa</Label>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <RadioGroupItem value="INATIVA" id="screening-inativa" onClick={() => setFilterScreening(false)} />
                                        <Label htmlFor="screening-inativa">Inativa</Label>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <RadioGroupItem value="TODOS" id="screening-todos" onClick={() => setFilterScreening(undefined)} />
                                        <Label htmlFor="screening-todos">Todos</Label>
                                    </div>

                                </RadioGroup>
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="filter-responses">Respostas (mín / max)</Label>
                            <div className="flex space-x-2">
                                <Input id="filter-responses-min" type="number" value={filterResponsesMin ?? ''} onChange={(e) => setFilterResponsesMin(e.target.value ? Number(e.target.value) : undefined)} placeholder="0" />
                                <Input id="filter-responses-max" type="number" value={filterResponsesMax ?? ''} onChange={(e) => setFilterResponsesMax(e.target.value ? Number(e.target.value) : undefined)} placeholder="0" />
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button onClick={() => { applyFilters(); }}>Aplicar</Button>
                            <Button variant="outline" onClick={() => { clearFilters(); }}>Limpar</Button>
                        </div>
                    </div>
                </div>
            )}

            {error && <p className="text-red-500">{error}</p>}
            <div className="rounded-t-lg overflow-hidden">
                <Table className="scrollable overflow-auto">
                    <TableHeader className="sticky top-0 z-10 bg-muted">
                        <TableRow>
                            {columns.title && <TableHead className="min-w-52">Título</TableHead>}
                            {columns.description && <TableHead>Descrição</TableHead>}
                            {columns.updatedAt && <TableHead className="min-w-32">Atualizado em</TableHead>}
                            {columns.createdAt && <TableHead className="min-w-32">Criado em</TableHead>}
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
                                    {columns.createdAt && (
                                        <TableCell>
                                            {new Date(form.createdAt).toLocaleString("pt-BR", {
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

            <Pagination
                page={page}
                pageSize={pageSize}
                total={total}
                totalPages={totalPages}
                onPageChange={(p) => setPage(p)}
                onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
                selectedCount={0}
            />

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
