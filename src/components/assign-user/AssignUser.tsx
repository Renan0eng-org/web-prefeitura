'use client'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import Pagination from '@/components/ui/pagination'
import { Skeleton } from '@/components/ui/skeleton'
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import api from '@/services/api'
import { AlertTriangle, Save } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

type User = {
    idUser: string
    name: string
    email: string
    active: boolean
}

export default function AssignUser({idForm}: {idForm: string}) {
    const [users, setUsers] = useState<User[]>([])
    const [selectedUsers, setSelectedUsers] = useState<string[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)
    const [search, setSearch] = useState('')
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)

    const router = useRouter()

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true)
                const [usersRes, assignedRes] = await Promise.all([
                    api.get('/forms/users/toAssign'),
                    api.get(`/forms/${idForm}/assigned`)
                ])

                console.log(assignedRes.data);                

                setUsers(usersRes.data)
                setSelectedUsers(assignedRes.data.map((u: User) => u.idUser))
            } catch (err) {
                console.error(err)
                setError('Não foi possível carregar os dados.')
            } finally {
                setIsLoading(false)
            }
        }
        fetchData()
    }, [idForm])

    const filteredUsers = useMemo(() => {
        return users.filter(u =>
            u.name.toLowerCase().includes(search.toLowerCase())
        )
    }, [users, search])

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
                    <Input
                        placeholder="Buscar por nome..."
                        value={search}
                        onChange={e => {
                            setSearch(e.target.value)
                            setPage(1)
                        }}
                    />

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
