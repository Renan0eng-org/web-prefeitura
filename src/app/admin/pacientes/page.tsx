"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import ColumnsDropdown from '@/components/ui/columns-dropdown'
import ConfirmDialog from "@/components/ui/confirm-dialog"
import { DateRangePicker } from '@/components/ui/date-range-piker'
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
import { Filter, MoreHorizontal, Plus, RefreshCcw, Settings2 } from "lucide-react"
import Link from "next/link"
import * as React from "react"
import { DateRange } from "react-day-picker"

export default function PatientsPage() {
    const [patients, setPatients] = React.useState<any[]>([])
    const [isLoading, setIsLoading] = React.useState(true)
    const [loaderRefresh, setLoaderRefresh] = React.useState(false)
    const [showFilters, setShowFilters] = React.useState(false)
    const [filterName, setFilterName] = React.useState<string>('')
    const [filterEmail, setFilterEmail] = React.useState<string>('')
    const [filterCpf, setFilterCpf] = React.useState<string>('')
    const [filterBirthDateRange, setFilterBirthDateRange] = React.useState<DateRange | undefined>(undefined)
    const [filterSexo, setFilterSexo] = React.useState<string>('all')
    const [filterUnidade, setFilterUnidade] = React.useState<string>('')
    const [filterMedicamentos, setFilterMedicamentos] = React.useState<string>('')
    const [filterExames, setFilterExames] = React.useState<boolean | null>(null)
    const [filterExamesDetalhes, setFilterExamesDetalhes] = React.useState<string>('')
    const [filterAlergias, setFilterAlergias] = React.useState<string>('')
    const [filterActive, setFilterActive] = React.useState<boolean | null>(null)
    const [page, setPage] = React.useState(1)
    const [pageSize, setPageSize] = React.useState(10)
    const [total, setTotal] = React.useState(0)
    const totalPages = Math.max(1, Math.ceil(total / pageSize))
    const [error, setError] = React.useState<string | null>(null)
    const [serverPaged, setServerPaged] = React.useState(false)

    const [columns, setColumns] = React.useState(() => {
        try {
            const raw = localStorage.getItem('pacientes_visible_columns')
            return raw ? JSON.parse(raw) : {
                name: true,
                email: false,
                cpf: true,
                birthDate: true,
                sexo: false,
                unidadeSaude: true,
                medicamentos: true,
                exames: true,
                examesDetalhes: false,
                alergias: false,
                status: true,
                actions: true,
            }
        } catch (e) {
            return {
                name: true,
                email: false,
                cpf: true,
                birthDate: true,
                sexo: false,
                unidadeSaude: true,
                medicamentos: true,
                exames: true,
                examesDetalhes: false,
                alergias: false,
                status: true,
                actions: true,
            }
        }
    })

    React.useEffect(() => {
        try {
            localStorage.setItem('pacientes_visible_columns', JSON.stringify(columns))
        } catch (e) { }
    }, [columns])

    const columnLabels: Record<string, string> = {
        name: 'Nome',
        email: 'Email',
        cpf: 'CPF',
        birthDate: 'Data Nasc.',
        sexo: 'Sexo',
        unidadeSaude: 'Unidade',
        medicamentos: 'Medicamentos',
        exames: 'Exames',
        examesDetalhes: 'Exames Detalhes',
        alergias: 'Alergias',
        status: 'Status',
        actions: 'Ações',
    }

    const getColumnLabel = (key: string) => {
        if (columnLabels[key]) return columnLabels[key]
        // fallback: split camelCase into words and capitalize first letter
        return key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())
    }

    const { setAlert } = useAlert()
    const { getPermissions } = useAuth()

    const permissions = React.useMemo(() => getPermissions("paciente"), [getPermissions])

    const fetchPatients = async (opts?: { page?: number; pageSize?: number }) => {
        try {
            setLoaderRefresh(true)
            const p = opts?.page ?? page
            const ps = opts?.pageSize ?? pageSize
            
            const params: any = { page: p, pageSize: ps, limit: ps, offset: (p - 1) * ps, skip: (p - 1) * ps }
            
            if (filterName) params.name = filterName
            if (filterEmail) params.email = filterEmail
            if (filterCpf) params.cpf = filterCpf
            if (filterBirthDateRange?.from) params.birthDateFrom = filterBirthDateRange.from.toISOString()
            if (filterBirthDateRange?.to) params.birthDateTo = filterBirthDateRange.to.toISOString()
            if (filterSexo && filterSexo !== 'all') params.sexo = filterSexo
            if (filterUnidade) params.unidadeSaude = filterUnidade
            if (filterMedicamentos) params.medicamentos = filterMedicamentos
            if (filterExames !== null) params.exames = filterExames
            if (filterExamesDetalhes) params.examesDetalhes = filterExamesDetalhes
            if (filterAlergias) params.alergias = filterAlergias
            if (filterActive !== null) params.active = filterActive
            
            const res = await api.get('/patients', { params })
            const payload = res.data
            
            // API may return paged shape { data: [], total } or full array
            const list = Array.isArray(payload?.data) ? payload.data : (Array.isArray(payload) ? payload : [])
            const isServerPaged = !!(payload && !Array.isArray(payload) && (Array.isArray(payload.data) || payload.total != null || payload.page != null))
            setServerPaged(isServerPaged)

            setPatients(list)
            const totalVal = payload?.total ?? payload?.totalItems ?? (Array.isArray(list) ? list.length : 0)
            setTotal(Number(totalVal ?? 0))
            setError(null)
        } catch (err: any) {
            console.error('Erro ao carregar pacientes', err)
            setError(err.response?.data?.message || 'Erro ao carregar pacientes')
        } finally {
            setLoaderRefresh(false)
            setIsLoading(false)
        }
    }

    React.useEffect(() => {
        if (permissions?.visualizar) fetchPatients({ page, pageSize })
    }, [permissions?.visualizar, page, pageSize, filterName, filterEmail, filterCpf, filterBirthDateRange, filterSexo, filterUnidade, filterMedicamentos, filterExames, filterExamesDetalhes, filterAlergias, filterActive])

    const applyFilters = React.useCallback(() => {
        setPage(1)
        fetchPatients({ page: 1, pageSize })
    }, [pageSize])

    const clearFilters = React.useCallback(() => {
        setFilterName('')
        setFilterEmail('')
        setFilterCpf('')
        setFilterBirthDateRange(undefined)
        setFilterSexo('all')
        setFilterUnidade('')
        setFilterMedicamentos('')
        setFilterExames(null)
        setFilterExamesDetalhes('')
        setFilterAlergias('')
        setFilterActive(null)
        setPage(1)
    }, [])


    const handleDelete = async (user: any) => {
        setPendingPatient(user)
        setConfirmOpen(true)
    }

    const [confirmOpen, setConfirmOpen] = React.useState(false)
    const [pendingPatient, setPendingPatient] = React.useState<any | null>(null)

    const performDelete = async (user: any) => {
        try {
            await api.delete(`/patients/${user.idUser}`)
            setAlert('Paciente excluído com sucesso!', 'success')
            fetchPatients({ page, pageSize })
        } catch (err: any) {
            console.error('Erro ao excluir paciente', err)
            setAlert(err.response?.data?.message || 'Erro ao excluir paciente', 'error')
        }
    }

    const handleConfirmDelete = () => {
        if (!pendingPatient) return
        performDelete(pendingPatient)
        setPendingPatient(null)
        setConfirmOpen(false)
    }

    // pagination: if server returns paged data we display it directly,
    // otherwise fall back to client-side slicing of the full list
    const paged = React.useMemo(() => {
        if (serverPaged) return patients
        const start = (page - 1) * pageSize
        return patients.slice(start, start + pageSize)
    }, [patients, page, pageSize, serverPaged])

    return (
        <div className="p-2 md:p-4 lg:p-8">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Pacientes</h1>
                <div className="flex items-center gap-2 flex-wrap">
                    <ColumnsDropdown
                        columns={columns}
                        onChange={(c: Record<string, boolean>) => setColumns(c)}
                        labels={columnLabels}
                        contentClassName="p-2"
                        buttonLabel={<><Settings2 className="h-4 w-4" /> Colunas</>}
                    />
                    <Button variant="outline" size="sm" onClick={() => fetchPatients({ page, pageSize })}>
                        <RefreshCcw className="h-4 w-4" />
                        Atualizar
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setShowFilters(v => !v)}>
                        <Filter className="h-4 w-4" />
                        Filtros
                    </Button>
                    {permissions?.criar && (
                        <Link href="/admin/registrar-paciente">
                            <Button>
                                <Plus className="h-4 w-4" />
                                Novo Paciente
                            </Button>
                        </Link>
                    )}
                </div>
            </div>

            {showFilters && (
                <div className="mb-4 rounded-md bg-muted p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3 items-end">
                        <div>
                            <Label htmlFor="filter-name">Nome</Label>
                            <Input
                                id="filter-name"
                                value={filterName}
                                onChange={(e) => setFilterName(e.target.value)}
                                placeholder="Nome do paciente"
                            />
                        </div>
                        <div>
                            <Label htmlFor="filter-email">Email</Label>
                            <Input
                                id="filter-email"
                                value={filterEmail}
                                onChange={(e) => setFilterEmail(e.target.value)}
                                placeholder="Email"
                                type="email"
                            />
                        </div>
                        <div>
                            <Label htmlFor="filter-cpf">CPF</Label>
                            <Input
                                id="filter-cpf"
                                value={filterCpf}
                                onChange={(e) => setFilterCpf(e.target.value)}
                                placeholder="CPF"
                            />
                        </div>
                        <div>
                            <Label>Data Nasc.</Label>
                            <DateRangePicker value={filterBirthDateRange} onChange={(r) => setFilterBirthDateRange(r)} />
                        </div>
                        <div>
                            <Label htmlFor="filter-sexo">Sexo</Label>
                            <Select value={filterSexo} onValueChange={(val) => setFilterSexo(val)}>
                                <SelectTrigger id="filter-sexo">
                                    <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos</SelectItem>
                                    <SelectItem value="MASCULINO">Masculino</SelectItem>
                                    <SelectItem value="FEMININO">Feminino</SelectItem>
                                    <SelectItem value="OUTRO">Outro</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="filter-unidade">Unidade</Label>
                            <Input
                                id="filter-unidade"
                                value={filterUnidade}
                                onChange={(e) => setFilterUnidade(e.target.value)}
                                placeholder="Unidade de saúde"
                            />
                        </div>
                        <div>
                            <Label htmlFor="filter-medicamentos">Medicamentos</Label>
                            <Input
                                id="filter-medicamentos"
                                value={filterMedicamentos}
                                onChange={(e) => setFilterMedicamentos(e.target.value)}
                                placeholder="Medicamentos"
                            />
                        </div>
                        <div>
                            <Label htmlFor="filter-exames">Exames</Label>
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="filter-exames"
                                    checked={filterExames === true}
                                    onCheckedChange={(checked: boolean) => {
                                        if (checked === (filterExames === true)) {
                                            setFilterExames(null)
                                        } else {
                                            setFilterExames(checked)
                                        }
                                    }}
                                />
                                <span className="text-sm text-muted-foreground">
                                    {filterExames === null ? 'Todos' : filterExames ? 'Sim' : 'Não'}
                                </span>
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="filter-exames-detalhes">Detalhes Exames</Label>
                            <Input
                                id="filter-exames-detalhes"
                                value={filterExamesDetalhes}
                                onChange={(e) => setFilterExamesDetalhes(e.target.value)}
                                placeholder="Detalhes dos exames"
                            />
                        </div>
                        <div>
                            <Label htmlFor="filter-alergias">Alergias</Label>
                            <Input
                                id="filter-alergias"
                                value={filterAlergias}
                                onChange={(e) => setFilterAlergias(e.target.value)}
                                placeholder="Alergias"
                            />
                        </div>
                        <div>
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

            <ConfirmDialog
                open={confirmOpen}
                title="Excluir Paciente"
                description={pendingPatient ? `Tem certeza que deseja excluir o paciente "${pendingPatient.name}"?` : 'Tem certeza?' }
                intent="destructive"
                confirmLabel="Excluir"
                cancelLabel="Cancelar"
                onConfirm={handleConfirmDelete}
                onCancel={() => { setConfirmOpen(false); setPendingPatient(null) }}
            />

            {error && <p className="text-red-500 mb-4">{error}</p>}

            <div className="rounded-lg overflow-hidden border">
                <Table className="bg-white/40 scrollable overflow-auto">
                    <TableHeader className="bg-muted sticky top-0 z-10">
                        <TableRow>
                            {columns.name && <TableHead>Nome</TableHead>}
                            {columns.email && <TableHead>Email</TableHead>}
                            {columns.cpf && <TableHead>CPF</TableHead>}
                            {columns.birthDate && <TableHead>Data Nasc.</TableHead>}
                            {columns.sexo && <TableHead>Sexo</TableHead>}
                            {columns.unidadeSaude && <TableHead>Unidade</TableHead>}
                            {columns.medicamentos && <TableHead>Medicamentos</TableHead>}
                            {columns.exames && <TableHead>Exames</TableHead>}
                            {columns.examesDetalhes && <TableHead>Detalhes Exames</TableHead>}
                            {columns.alergias && <TableHead>Alergias</TableHead>}
                            {columns.status && <TableHead>Status</TableHead>}
                            {columns.actions && <TableHead className="w-[64px] text-right">Ações</TableHead>}
                        </TableRow>
                    </TableHeader>
                    {loaderRefresh ?
                        <TableBody className="bg-white">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <TableRow key={`skeleton-${i}`}>
                                    {columns.name && <TableCell><Skeleton className="h-4 w-40" /></TableCell>}
                                    {columns.email && <TableCell><Skeleton className="h-4 w-56" /></TableCell>}
                                    {columns.cpf && <TableCell><Skeleton className="h-4 w-32" /></TableCell>}
                                    {columns.birthDate && <TableCell><Skeleton className="h-4 w-32" /></TableCell>}
                                    {columns.sexo && <TableCell><Skeleton className="h-4 w-20" /></TableCell>}
                                    {columns.unidadeSaude && <TableCell><Skeleton className="h-4 w-40" /></TableCell>}
                                    {columns.medicamentos && <TableCell><Skeleton className="h-4 w-40" /></TableCell>}
                                    {columns.exames && <TableCell><Skeleton className="h-4 w-20" /></TableCell>}
                                    {columns.examesDetalhes && <TableCell><Skeleton className="h-4 w-48" /></TableCell>}
                                    {columns.alergias && <TableCell><Skeleton className="h-4 w-40" /></TableCell>}
                                    {columns.status && <TableCell><Skeleton className="h-4 w-20" /></TableCell>}
                                    {columns.actions && <TableCell><Skeleton className="h-4 w-12 mx-auto" /></TableCell>}
                                </TableRow>
                            ))}
                        </TableBody>
                    :<TableBody className="bg-white">
                            {paged.map((u) => (
                                <TableRow key={u.idUser}>
                                    {columns.name && <TableCell>
                                        <div className="font-medium">{u.name}</div>
                                        <div className="text-xs text-muted-foreground">{u.email}</div>
                                    </TableCell>}
                                    {columns.email && <TableCell>{u.email}</TableCell>}
                                    {columns.cpf && <TableCell>{u.cpf || '-'}</TableCell>}
                                    {columns.birthDate && <TableCell>{u.birthDate ? new Date(u.birthDate).toLocaleDateString('pt-BR') : '-'}</TableCell>}
                                    {columns.sexo && <TableCell>{u.sexo || '-'}</TableCell>}
                                    {columns.unidadeSaude && <TableCell className="max-w-[160px] truncate">{u.unidadeSaude || '-'}</TableCell>}
                                    {columns.medicamentos && <TableCell className="max-w-[160px] truncate">{u.medicamentos || '-'}</TableCell>}
                                    {columns.exames && <TableCell>{u.exames ? <Badge variant="secondary">Sim</Badge> : <Badge variant="destructive">Não</Badge>}</TableCell>}
                                    {columns.examesDetalhes && <TableCell className="max-w-[200px] truncate">{u.examesDetalhes || '-'}</TableCell>}
                                    {columns.alergias && <TableCell className="max-w-[160px] truncate">{u.alergias || '-'}</TableCell>}
                                    {columns.status && <TableCell>{u.active ? <Badge variant="secondary">Ativo</Badge> : <Badge variant="destructive">Inativo</Badge>}</TableCell>}
                                    {columns.actions && <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="rounded-full">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                {/* <DropdownMenuItem asChild>
                                                    <Link href={`/admin/patients/${u.idUser}`}>Visualizar</Link>
                                                </DropdownMenuItem> */}
                                                {permissions?.editar && (
                                                    <Link href={`/admin/editar-paciente/${u.idUser}`}>
                                                        <DropdownMenuItem>Editar</DropdownMenuItem>
                                                    </Link>
                                                )}
                                                    {permissions?.excluir && (
                                                    <DropdownMenuItem className="text-destructive" onSelect={() => setTimeout(() => { setPendingPatient(u); setConfirmOpen(true) }, 50)}>Excluir</DropdownMenuItem>
                                                    )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>}
                                </TableRow>
                            ))}
                        {patients.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={12} className="text-center text-muted-foreground py-8">
                                    Nenhum paciente encontrado.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>}
                </Table>
                <div className="border-t border-gray-200">
                    <Pagination
                        page={page}
                        pageSize={pageSize}
                        total={total}
                        totalPages={totalPages}
                        onPageChange={(p) => setPage(p)}
                        onPageSizeChange={(ps) => { setPageSize(ps); setPage(1) }}
                        selectedCount={0}
                    />
                </div>
            </div>

            <ConfirmDialog
                open={confirmOpen}
                title="Excluir Paciente"
                description={pendingPatient ? `Tem certeza que deseja excluir o paciente "${pendingPatient.name}"?` : 'Tem certeza?'}
                intent="destructive"
                confirmLabel="Excluir"
                cancelLabel="Cancelar"
                onConfirm={handleConfirmDelete}
                onCancel={() => { setConfirmOpen(false); setPendingPatient(null) }}
            />
        </div>
    )
}
