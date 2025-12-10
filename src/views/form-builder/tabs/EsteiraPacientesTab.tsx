"use client"

import AgendarConsultaDialog from "@/components/appointments/AgendarConsultaDialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import ColumnsDropdown from '@/components/ui/columns-dropdown'
import { DateRangePicker } from '@/components/ui/date-range-piker'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Pagination from "@/components/ui/pagination"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAlert } from "@/hooks/use-alert"
import api from "@/services/api"
import axios, { AxiosError } from "axios"
import { ArrowUpFromDot, Calendar, Eye, Filter, MoreVertical, RefreshCcw, Settings2 } from "lucide-react"
import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import { DateRange } from 'react-day-picker'

export default function EsteiraPacientesTab() {
    const [formsResponses, setFormsResponses] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const [total, setTotal] = useState(0)
    const totalPages = Math.max(1, Math.ceil(total / pageSize))
    const [visibleColumnsEsteira, setVisibleColumnsEsteira] = useState(() => {
        try {
            const raw = localStorage.getItem('esteira_visible_columns')
            return raw ? JSON.parse(raw) : { form: true, paciente: true, dataEnvio: true, isScreening: true, pontuacao: true, actions: true }
        } catch (e) {
            return { form: true, paciente: true, dataEnvio: true, isScreening: true, pontuacao: true, actions: true }
        }
    })
    const visibleCount = Object.values(visibleColumnsEsteira).filter(Boolean).length || 1

    useEffect(() => {
        try { localStorage.setItem('esteira_visible_columns', JSON.stringify(visibleColumnsEsteira)) } catch (e) { }
    }, [visibleColumnsEsteira])
    const [isAgendarOpen, setIsAgendarOpen] = useState(false)
    const [selectedResponse, setSelectedResponse] = useState<any | null>(null)
    const [ferrals, setFerrals] = useState(false)

    const { setAlert } = useAlert();

    // Filters
    const [showFilters, setShowFilters] = useState(false)
    const [filterFormTitle, setFilterFormTitle] = useState<string>('')
    const [filterPatientName, setFilterPatientName] = useState<string>('')
    const [filterDateRange, setFilterDateRange] = useState<DateRange | undefined>(undefined)
    const [filterScreening, setFilterScreening] = useState<boolean | undefined>(undefined)
    const [filterScoreMin, setFilterScoreMin] = useState<number | undefined>(undefined)
    const [filterScoreMax, setFilterScoreMax] = useState<number | undefined>(undefined)

    const fetchResponses = async (opts?: { page?: number; pageSize?: number }, filters?: {
        formTitle?: string
        patientName?: string
        from?: string
        to?: string
        isScreening?: boolean
        scoreMin?: number
        scoreMax?: number
    }) => {
        try {
            setIsLoading(true)
            const p = opts?.page ?? page
            const ps = opts?.pageSize ?? pageSize
            const params: any = { page: p, pageSize: ps }
            if (filters) {
                if (filters.formTitle) params.formTitle = filters.formTitle
                if (filters.patientName) params.patientName = filters.patientName
                if (filters.from) params.from = filters.from
                if (filters.to) params.to = filters.to
                if (typeof filters.isScreening === 'boolean') params.isScreening = filters.isScreening
                if (typeof filters.scoreMin === 'number') params.scoreMin = filters.scoreMin
                if (typeof filters.scoreMax === 'number') params.scoreMax = filters.scoreMax
            }
            const res = await api.get("/forms/responses/list", { params })
            const data = res.data?.data ?? res.data ?? []
            setFormsResponses(Array.isArray(data) ? data : [])
            const t = res.data?.total ?? res.data?.totalItems ?? res.data?.totalCount ?? (Array.isArray(data) ? data.length : 0)
            setTotal(Number(t ?? 0))
            setIsLoading(false)
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                const axiosErr = error as AxiosError<{ message?: string }>
                const serverMessage = axiosErr.response?.data?.message
                console.error('Erro ao buscar respostas (axios):', axiosErr)
                setAlert(serverMessage ?? axiosErr.message ?? 'Não foi possível carregar as respostas.', 'error')
            } else {
                console.error('Erro ao buscar respostas (não-axios):', error)
                const msg = error instanceof Error ? error.message : String(error)
                setAlert(msg ?? 'Não foi possível carregar as respostas.', 'error')
            }
        }
    }

    const applyFilters = useCallback(() => {
        setPage(1)
    }, [])

    const clearFilters = useCallback(() => {
        setFilterFormTitle('')
        setFilterPatientName('')
        setFilterDateRange(undefined)
        setFilterScreening(undefined)
        setFilterScoreMin(undefined)
        setFilterScoreMax(undefined)
        setPage(1)
    }, [])

    useEffect(() => {
        const filters = {
            formTitle: filterFormTitle || undefined,
            patientName: filterPatientName || undefined,
            from: filterDateRange?.from ? filterDateRange.from.toISOString() : undefined,
            to: filterDateRange?.to ? filterDateRange.to.toISOString() : undefined,
            isScreening: typeof filterScreening === 'boolean' ? filterScreening : undefined,
            scoreMin: typeof filterScoreMin === 'number' ? filterScoreMin : undefined,
            scoreMax: typeof filterScoreMax === 'number' ? filterScoreMax : undefined,
        }
        fetchResponses({ page, pageSize }, filters)
    }, [page, pageSize, filterFormTitle, filterPatientName, filterDateRange, filterScreening, filterScoreMin, filterScoreMax])

    return (
        <>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <h2 className="text-3xl font-bold tracking-tight">Esteira de Pacientes</h2>
                <div className="flex space-x-2">
                    <ColumnsDropdown
                        columns={visibleColumnsEsteira}
                        onChange={(c: Record<string, boolean>) => setVisibleColumnsEsteira(c)}
                        labels={{ form: 'Formulário', paciente: 'Paciente', dataEnvio: 'Data de Envio', isScreening: 'Triagem', pontuacao: 'Pontuação Total', actions: 'Ações' }}
                        contentClassName="p-2"
                        buttonLabel={<><Settings2 className="h-4 w-4" /> Colunas</>}
                    />
                    <Button variant="outline" size="sm" onClick={() => fetchResponses()}>
                        <RefreshCcw className="w-4 h-4" />
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
                    <div className="grid grid-cols-1 lg:grid-cols-3 md:grid-cols-2 gap-3 items-end">
                        <div>
                            <Label htmlFor="filter-form-title">Formulário</Label>
                            <Input id="filter-form-title" value={filterFormTitle} onChange={(e) => setFilterFormTitle(e.target.value)} placeholder="Nome do formulário" />
                        </div>
                        <div>
                            <Label htmlFor="filter-patient-name">Paciente</Label>
                            <Input id="filter-patient-name" value={filterPatientName} onChange={(e) => setFilterPatientName(e.target.value)} placeholder="Nome do paciente" />
                        </div>
                        <div>
                            <Label>Data de Envio</Label>
                            <DateRangePicker value={filterDateRange} onChange={(r) => setFilterDateRange(r)} />
                        </div>
                        <div>
                            <Label>Origem</Label>
                            <div className="mt-2">
                                <RadioGroup
                                    className="flex flex-wrap gap-2"
                                    value={filterScreening === true ? 'TRIAGEM' : filterScreening === false ? 'APP' : 'TODOS'}
                                    onValueChange={(value) => {
                                        if (value === 'TRIAGEM') setFilterScreening(true)
                                        else if (value === 'APP') setFilterScreening(false)
                                        else setFilterScreening(undefined)
                                    }}
                                >
                                    <div className="flex items-center gap-2">
                                        <RadioGroupItem value="TRIAGEM" id="screening-triagem" />
                                        <Label htmlFor="screening-triagem">Triagem</Label>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <RadioGroupItem value="APP" id="screening-app" />
                                        <Label htmlFor="screening-app">App</Label>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <RadioGroupItem value="TODOS" id="screening-todos" />
                                        <Label htmlFor="screening-todos">Todos</Label>
                                    </div>
                                </RadioGroup>
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="filter-score">Pontuação (mín / max)</Label>
                            <div className="flex space-x-2">
                                <Input id="filter-score-min" type="number" value={filterScoreMin ?? ''} onChange={(e) => setFilterScoreMin(e.target.value ? Number(e.target.value) : undefined)} placeholder="0" />
                                <Input id="filter-score-max" type="number" value={filterScoreMax ?? ''} onChange={(e) => setFilterScoreMax(e.target.value ? Number(e.target.value) : undefined)} placeholder="0" />
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
            <Table className="overflow-hidden rounded-t-lg">
                <TableHeader className="sticky top-0 z-10 bg-muted">
                        <TableRow>
                        {visibleColumnsEsteira.form && <TableHead>Formulário</TableHead>}
                        {visibleColumnsEsteira.paciente && <TableHead>Paciente</TableHead>}
                        {visibleColumnsEsteira.dataEnvio && <TableHead>Data de Envio</TableHead>}
                        {visibleColumnsEsteira.isScreening && <TableHead className="min-w-20">Origen</TableHead>}
                        {visibleColumnsEsteira.pontuacao && <TableHead>Pontuação Total</TableHead>}
                        {visibleColumnsEsteira.actions && <TableHead className="max-w-12 text-center">Ações</TableHead>}
                    </TableRow>
                </TableHeader>
                <TableBody className="bg-white/40">
                    {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                            <TableRow key={`skel-${i}`}>
                                {visibleColumnsEsteira.form && <TableCell><Skeleton className="h-4 w-48" /></TableCell>}
                                {visibleColumnsEsteira.paciente && <TableCell><Skeleton className="h-4 w-32" /></TableCell>}
                                {visibleColumnsEsteira.dataEnvio && <TableCell><Skeleton className="h-4 w-36" /></TableCell>}
                                {visibleColumnsEsteira.isScreening && <TableCell><Skeleton className="h-4 w-20" /></TableCell>}
                                {visibleColumnsEsteira.pontuacao && <TableCell><Skeleton className="h-4 w-20" /></TableCell>}
                                {visibleColumnsEsteira.actions && <TableCell className="text-center"><Skeleton className="h-4 w-12 mx-auto" /></TableCell>}
                            </TableRow>
                        ))
                    ) : (
                        formsResponses.map((response) => (
                            <TableRow key={response.idResponse}>
                                {visibleColumnsEsteira.form && (
                                    <TableCell title={response.form?.title || "Sem título"}>
                                        {response.form?.title || "Sem título"}
                                    </TableCell>
                                )}
                                {visibleColumnsEsteira.paciente && (
                                    <TableCell title={response.user?.name || "Anônimo"}>
                                        {response.user?.name || "Anônimo"}
                                    </TableCell>
                                )}
                                {visibleColumnsEsteira.dataEnvio && (
                                    <TableCell>
                                        {new Date(response.submittedAt).toLocaleString("pt-BR", {
                                            day: "2-digit",
                                            month: "2-digit",
                                            year: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </TableCell>
                                )}
                                {visibleColumnsEsteira.isScreening && (
                                    <TableCell>
                                        <Badge className={"px-2 py-1 " + (response.form?.isScreening ? 'bg-green-100 text-green-800 hover:bg-green-800 hover:text-green-100' : 'bg-primary-100 text-primary-600')}>
                                            {response.form?.isScreening ? 'Triagem' : 'App'}
                                        </Badge>
                                    </TableCell>
                                )}
                                {visibleColumnsEsteira.pontuacao && (
                                    <TableCell>
                                        <Badge className="items-center w-fit min-w-20 justify-center flex">Score: {response.totalScore ?? 0}</Badge>
                                    </TableCell>
                                )}
                                {visibleColumnsEsteira.actions && <TableCell className="text-center p-0 justify-center items-center">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="rounded-full">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem asChild>
                                                <Link
                                                    href={`/admin/criar-formulario/${response.form?.idForm}/respostas/${response.idResponse}`}
                                                    className="cursor-pointer"
                                                >
                                                    <Eye className="mr-2 h-4 w-4" />
                                                    <span>Visualizar Resposta</span>
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onSelect={() => { setSelectedResponse(response); setIsAgendarOpen(true); }}>
                                                <button className="flex items-center w-full text-left">
                                                    <Calendar className="mr-2 h-4 w-4" />
                                                    <span>Agendar Consulta</span>
                                                </button>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onSelect={() => {
                                                setSelectedResponse(response);
                                                setIsAgendarOpen(true);
                                                setFerrals(true);
                                            }}>
                                                <button className="flex items-center w-full text-left">
                                                    <ArrowUpFromDot className="mr-2 h-4 w-4" />
                                                    <span>Encaminhar</span>
                                                </button>
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>}
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
            <Pagination
                page={page}
                pageSize={pageSize}
                total={total}
                totalPages={totalPages}
                onPageChange={(p) => setPage(p)}
                onPageSizeChange={(size) => {
                    setPageSize(size)
                    setPage(1)
                }}
                selectedCount={0}
            />
            {/* Agendamento dialog */}
            {selectedResponse && (
                <AgendarConsultaDialog
                    isOpen={isAgendarOpen}
                    onOpenChange={(open) => {
                        setIsAgendarOpen(open)
                        if (!open) {
                            setSelectedResponse(null)
                            setFerrals(false)
                        }
                    }}
                    response={selectedResponse}
                    onScheduled={() => {
                        // refresh responses after scheduling if needed
                        fetchResponses()
                    }}
                    ferrals={ferrals}
                />
            )}
        </>
    )
}
