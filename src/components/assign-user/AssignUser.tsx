'use client'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { DateRangePicker } from '@/components/ui/date-range-piker'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Pagination from '@/components/ui/pagination'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Skeleton } from '@/components/ui/skeleton'
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import api from '@/services/api'
import { AlertTriangle, Filter, Save } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { DateRange } from 'react-day-picker'

type User = {
    idUser: string
    name: string
    email: string
    active: boolean
    birthDate: string | null
    sexo: string | null
    unidadeSaude: string | null
    medicamentos: string | null
    exames: boolean | null
    alergias: string | null
}

export default function AssignUser({idForm}: {idForm: string}) {
    const [users, setUsers] = useState<User[]>([])
    const [selectedUsers, setSelectedUsers] = useState<string[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)

    // Filters
    const [showFilters, setShowFilters] = useState(false)
    const [filterName, setFilterName] = useState('')
    const [filterEmail, setFilterEmail] = useState('')
    const [filterActive, setFilterActive] = useState<boolean | undefined>(undefined)
    const [filterSelection, setFilterSelection] = useState<'ALL' | 'SELECTED' | 'UNSELECTED'>('ALL')
    const [filterSexo, setFilterSexo] = useState<string | undefined>(undefined)
    const [filterUnidadeSaude, setFilterUnidadeSaude] = useState('')
    const [filterMedicamentos, setFilterMedicamentos] = useState('')
    const [filterExames, setFilterExames] = useState<boolean | undefined>(undefined)
    const [filterAlergias, setFilterAlergias] = useState('')
    const [filterAgeMin, setFilterAgeMin] = useState<number | undefined>(undefined)
    const [filterAgeMax, setFilterAgeMax] = useState<number | undefined>(undefined)
    const [filterBirthDateRange, setFilterBirthDateRange] = useState<DateRange | undefined>(undefined)

    const router = useRouter()

    const fetchUsers = useCallback(async () => {
        try {
            setIsLoading(true)
            const params: Record<string, string> = {}
            if (filterName) params.name = filterName
            if (filterEmail) params.email = filterEmail
            if (filterSexo) params.sexo = filterSexo
            if (filterUnidadeSaude) params.unidadeSaude = filterUnidadeSaude
            if (filterMedicamentos) params.medicamentos = filterMedicamentos
            if (typeof filterExames === 'boolean') params.exames = String(filterExames)
            if (filterAlergias) params.alergias = filterAlergias
            if (filterBirthDateRange?.from) params.birthDateFrom = filterBirthDateRange.from.toISOString()
            if (filterBirthDateRange?.to) params.birthDateTo = filterBirthDateRange.to.toISOString()
            if (typeof filterAgeMin === 'number') params.ageMin = String(filterAgeMin)
            if (typeof filterAgeMax === 'number') params.ageMax = String(filterAgeMax)

            const [usersRes, assignedRes] = await Promise.all([
                api.get('/forms/users/toAssign', { params }),
                api.get(`/forms/${idForm}/assigned`)
            ])

            setUsers(usersRes.data)
            setSelectedUsers(assignedRes.data.map((u: User) => u.idUser))
        } catch (err) {
            console.error(err)
            setError('Não foi possível carregar os dados.')
        } finally {
            setIsLoading(false)
        }
    }, [idForm, filterName, filterEmail, filterSexo, filterUnidadeSaude, filterMedicamentos, filterExames, filterAlergias, filterBirthDateRange, filterAgeMin, filterAgeMax])

    useEffect(() => {
        fetchUsers()
    }, [fetchUsers])

    const filteredUsers = useMemo(() => {
        return users.filter(u => {
            if (typeof filterActive === 'boolean' && u.active !== filterActive) return false
            if (filterSelection === 'SELECTED' && !selectedUsers.includes(u.idUser)) return false
            if (filterSelection === 'UNSELECTED' && selectedUsers.includes(u.idUser)) return false
            return true
        })
    }, [users, filterActive, filterSelection, selectedUsers])

    const clearFilters = useCallback(() => {
        setFilterName('')
        setFilterEmail('')
        setFilterActive(undefined)
        setFilterSelection('ALL')
        setFilterSexo(undefined)
        setFilterUnidadeSaude('')
        setFilterMedicamentos('')
        setFilterExames(undefined)
        setFilterAlergias('')
        setFilterAgeMin(undefined)
        setFilterAgeMax(undefined)
        setFilterBirthDateRange(undefined)
        setPage(1)
    }, [])

    const total = filteredUsers.length
    const totalPages = Math.ceil(total / pageSize)
    const paginatedUsers = filteredUsers.slice((page - 1) * pageSize, page * pageSize)

    const handleToggle = (userId: string) => {
        setSelectedUsers(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        )
    }

    const handleToggleAll = () => {
        const allIds = paginatedUsers.map(u => u.idUser)
        const allSelected = allIds.every(id => selectedUsers.includes(id))
        if (allSelected) {
            setSelectedUsers(prev => prev.filter(id => !allIds.includes(id)))
        } else {
            setSelectedUsers(prev => Array.from(new Set([...prev, ...allIds])))
        }
    }

    const handleSave = async () => {
        try {
            setSaving(true)
            await api.post(`/forms/${idForm}/assign`, { userIds: selectedUsers })
            router.back()
        } catch (err) {
            console.error(err)
            setError('Erro ao salvar atribuições.')
        } finally {
            setSaving(false)
        }
    }

    if (isLoading) {
        return (
            <div className="max-w-4xl mx-auto p-8">
                <div className="space-y-4">
                    <Skeleton className="h-8 w-1/3" />
                    <Skeleton className="h-4 w-2/3" />

                    <div className="bg-background-foreground p-4 rounded-lg mt-4">
                        <Skeleton className="h-6 w-full mb-2" />
                        <Skeleton className="h-40 w-full" />
                    </div>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="p-8 max-w-4xl mx-auto">
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Erro</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            </div>
        )
    }

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Atribuir Usuários ao Formulário</CardTitle>
                </CardHeader>

                <CardContent className="space-y-4">
                    <div className="flex items-center justify-end">
                        <Button variant="outline" size="sm" onClick={() => setShowFilters(v => !v)}>
                            <Filter className="h-4 w-4" />
                            Filtros
                        </Button>
                    </div>

                    {showFilters && (
                        <div className="mb-4 rounded-md bg-muted p-4">
                            <div className="grid grid-cols-1 lg:grid-cols-3 md:grid-cols-2 gap-3 items-end">
                                <div>
                                    <Label htmlFor="filter-name">Nome</Label>
                                    <Input id="filter-name" value={filterName} onChange={(e) => { setFilterName(e.target.value); setPage(1) }} placeholder="Buscar por nome..." />
                                </div>
                                <div>
                                    <Label htmlFor="filter-email">Email</Label>
                                    <Input id="filter-email" value={filterEmail} onChange={(e) => { setFilterEmail(e.target.value); setPage(1) }} placeholder="Buscar por email..." />
                                </div>
                                <div>
                                    <Label>Sexo</Label>
                                    <div className="mt-2">
                                        <RadioGroup
                                            className="flex flex-wrap gap-2"
                                            value={filterSexo ?? 'TODOS'}
                                            onValueChange={(value) => {
                                                setFilterSexo(value === 'TODOS' ? undefined : value)
                                                setPage(1)
                                            }}
                                        >
                                            <div className="flex items-center gap-2">
                                                <RadioGroupItem value="TODOS" id="sexo-todos" />
                                                <Label htmlFor="sexo-todos">Todos</Label>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <RadioGroupItem value="FEMININO" id="sexo-fem" />
                                                <Label htmlFor="sexo-fem">Feminino</Label>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <RadioGroupItem value="MASCULINO" id="sexo-masc" />
                                                <Label htmlFor="sexo-masc">Masculino</Label>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <RadioGroupItem value="OUTRO" id="sexo-outro" />
                                                <Label htmlFor="sexo-outro">Outro</Label>
                                            </div>
                                        </RadioGroup>
                                    </div>
                                </div>
                                <div>
                                    <Label htmlFor="filter-age">Idade (mín / máx)</Label>
                                    <div className="flex space-x-2">
                                        <Input id="filter-age-min" type="number" value={filterAgeMin ?? ''} onChange={(e) => { setFilterAgeMin(e.target.value ? Number(e.target.value) : undefined); setPage(1) }} placeholder="Mín" />
                                        <Input id="filter-age-max" type="number" value={filterAgeMax ?? ''} onChange={(e) => { setFilterAgeMax(e.target.value ? Number(e.target.value) : undefined); setPage(1) }} placeholder="Máx" />
                                    </div>
                                </div>
                                <div>
                                    <Label>Data de Nascimento</Label>
                                    <DateRangePicker value={filterBirthDateRange} onChange={(r) => { setFilterBirthDateRange(r); setPage(1) }} />
                                </div>
                                <div>
                                    <Label htmlFor="filter-unidade">Unidade de Saúde</Label>
                                    <Input id="filter-unidade" value={filterUnidadeSaude} onChange={(e) => { setFilterUnidadeSaude(e.target.value); setPage(1) }} placeholder="Buscar unidade..." />
                                </div>
                                <div>
                                    <Label htmlFor="filter-medicamentos">Medicamentos</Label>
                                    <Input id="filter-medicamentos" value={filterMedicamentos} onChange={(e) => { setFilterMedicamentos(e.target.value); setPage(1) }} placeholder="Buscar medicamento..." />
                                </div>
                                <div>
                                    <Label>Exames para dor crônica</Label>
                                    <div className="mt-2">
                                        <RadioGroup
                                            className="flex flex-wrap gap-2"
                                            value={filterExames === true ? 'SIM' : filterExames === false ? 'NAO' : 'TODOS'}
                                            onValueChange={(value) => {
                                                if (value === 'SIM') setFilterExames(true)
                                                else if (value === 'NAO') setFilterExames(false)
                                                else setFilterExames(undefined)
                                                setPage(1)
                                            }}
                                        >
                                            <div className="flex items-center gap-2">
                                                <RadioGroupItem value="TODOS" id="exames-todos" />
                                                <Label htmlFor="exames-todos">Todos</Label>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <RadioGroupItem value="SIM" id="exames-sim" />
                                                <Label htmlFor="exames-sim">Sim</Label>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <RadioGroupItem value="NAO" id="exames-nao" />
                                                <Label htmlFor="exames-nao">Não</Label>
                                            </div>
                                        </RadioGroup>
                                    </div>
                                </div>
                                <div>
                                    <Label htmlFor="filter-alergias">Alergias</Label>
                                    <Input id="filter-alergias" value={filterAlergias} onChange={(e) => { setFilterAlergias(e.target.value); setPage(1) }} placeholder="Buscar alergia..." />
                                </div>
                                <div>
                                    <Label>Status</Label>
                                    <div className="mt-2">
                                        <RadioGroup
                                            className="flex flex-wrap gap-2"
                                            value={filterActive === true ? 'ATIVO' : filterActive === false ? 'INATIVO' : 'TODOS'}
                                            onValueChange={(value) => {
                                                if (value === 'ATIVO') setFilterActive(true)
                                                else if (value === 'INATIVO') setFilterActive(false)
                                                else setFilterActive(undefined)
                                                setPage(1)
                                            }}
                                        >
                                            <div className="flex items-center gap-2">
                                                <RadioGroupItem value="TODOS" id="active-todos" />
                                                <Label htmlFor="active-todos">Todos</Label>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <RadioGroupItem value="ATIVO" id="active-ativo" />
                                                <Label htmlFor="active-ativo">Ativo</Label>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <RadioGroupItem value="INATIVO" id="active-inativo" />
                                                <Label htmlFor="active-inativo">Inativo</Label>
                                            </div>
                                        </RadioGroup>
                                    </div>
                                </div>
                                <div>
                                    <Label>Seleção</Label>
                                    <div className="mt-2">
                                        <RadioGroup
                                            className="flex flex-wrap gap-2"
                                            value={filterSelection}
                                            onValueChange={(value) => {
                                                setFilterSelection(value as 'ALL' | 'SELECTED' | 'UNSELECTED')
                                                setPage(1)
                                            }}
                                        >
                                            <div className="flex items-center gap-2">
                                                <RadioGroupItem value="ALL" id="sel-todos" />
                                                <Label htmlFor="sel-todos">Todos</Label>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <RadioGroupItem value="SELECTED" id="sel-selecionados" />
                                                <Label htmlFor="sel-selecionados">Selecionados</Label>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <RadioGroupItem value="UNSELECTED" id="sel-nao-selecionados" />
                                                <Label htmlFor="sel-nao-selecionados">Não Selecionados</Label>
                                            </div>
                                        </RadioGroup>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" onClick={() => { clearFilters(); }}>Limpar</Button>
                                </div>
                            </div>
                        </div>
                    )}

                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>
                                    <Checkbox
                                        checked={
                                            paginatedUsers.length > 0 &&
                                            paginatedUsers.every(u => selectedUsers.includes(u.idUser))
                                        }
                                        onCheckedChange={handleToggleAll}
                                    />
                                </TableHead>
                                <TableHead>Nome</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Ativo</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedUsers.map(user => (
                                <TableRow key={user.idUser}>
                                    <TableCell>
                                        <Checkbox
                                            checked={selectedUsers.includes(user.idUser)}
                                            onCheckedChange={() => handleToggle(user.idUser)}
                                        />
                                    </TableCell>
                                    <TableCell>{user.name}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>{user.active ? 'Sim' : 'Não'}</TableCell>
                                </TableRow>
                            ))}
                            {paginatedUsers.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                                        Nenhum usuário encontrado.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>

                    <Pagination
                        page={page}
                        pageSize={pageSize}
                        total={total}
                        totalPages={totalPages || 1}
                        onPageChange={(p) => setPage(p)}
                        onPageSizeChange={(ps) => { setPageSize(ps); setPage(1) }}
                        selectedCount={selectedUsers.length}
                    />
                </CardContent>

                <CardFooter className="flex justify-end">
                    <Button onClick={handleSave} disabled={saving}>
                        <Save className="h-4 w-4 mr-2" />
                        {saving ? 'Salvando...' : 'Salvar Atribuições'}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}
