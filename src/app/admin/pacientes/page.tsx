"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import ConfirmDialog from "@/components/ui/confirm-dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Pagination from '@/components/ui/pagination'
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAlert } from "@/hooks/use-alert"
import { useAuth } from "@/hooks/use-auth"
import api from "@/services/api"
import { MoreHorizontal, Plus } from "lucide-react"
import Link from "next/link"
import * as React from "react"

export default function PatientsPage() {
    const [patients, setPatients] = React.useState<any[]>([])
    const [isLoading, setIsLoading] = React.useState(true)
    const [page, setPage] = React.useState(1)
    const [pageSize, setPageSize] = React.useState(10)
    const [total, setTotal] = React.useState(0)
    const totalPages = Math.max(1, Math.ceil(total / pageSize))
    const [error, setError] = React.useState<string | null>(null)
    const [serverPaged, setServerPaged] = React.useState(false)

    const [columns, setColumns] = React.useState({
        name: true,
        email: true,
        cpf: true,
        birthDate: true,
        sexo: true,
        unidadeSaude: true,
        medicamentos: true,
        exames: true,
        examesDetalhes: false,
        alergias: false,
        status: true,
        actions: true,
    })

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
            setIsLoading(true)
            const p = opts?.page ?? page
            const ps = opts?.pageSize ?? pageSize
            
            const res = await api.get('/patients', { params: { page: p, pageSize: ps, limit: ps, offset: (p - 1) * ps, skip: (p - 1) * ps } })
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
            setIsLoading(false)
        }
    }

    React.useEffect(() => {
        if (permissions?.visualizar) fetchPatients({ page, pageSize })
    }, [permissions?.visualizar, page, pageSize])


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
        <div className="p-4 md:p-6">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold tracking-tight">Pacientes</h1>
                <div className="flex flex-wrap gap-4 items-center">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">Colunas</Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="p-2">
                            {Object.entries(columns).map(([key, value]) => (
                                <div key={key} className="flex items-center justify-between px-2 py-1">
                                    <span>{getColumnLabel(key)}</span>
                                    <Switch checked={value} onCheckedChange={() => setColumns(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }))} />
                                </div>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
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

            {error && <p className="text-red-500">{error}</p>}

            <div className="rounded-t-lg overflow-hidden">
                <Table className="scrollable overflow-auto">
                    <TableHeader className="sticky top-0 z-10 bg-muted">
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
                    <TableBody className="bg-white/40">
                        {isLoading ? (
                            Array.from({ length: 6 }).map((_, i) => (
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
                            ))
                        ) : (
                            paged.map((u) => (
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
                onPageSizeChange={(ps) => { setPageSize(ps); setPage(1) }}
            />
        </div>
    )
}
