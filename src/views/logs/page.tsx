"use client"

import Calendar23 from "@/components/calendar-23"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Settings2 } from "lucide-react"

import { useAuth } from "@/hooks/use-auth"
import api from "@/services/api"
import { useEffect, useMemo, useState } from "react"

import {
    Area,
    AreaChart,
    CartesianGrid,
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip as ReTooltip,
    XAxis,
} from "recharts"

export default function LogsPage() {
    const [page, setPage] = useState(1)
    const [pageSize] = useState(10)
    const [logs, setLogs] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [totalPages, setTotalPages] = useState(1)

    const [filterUser, setFilterUser] = useState("")
    const [filterRoute, setFilterRoute] = useState("")
    const [filterStatus, setFilterStatus] = useState("")
    const [filterCreatedFrom, setFilterCreatedFrom] = useState("")
    const [filterCreatedTo, setFilterCreatedTo] = useState("")

    const { getPermissions } = useAuth()
    const permissions = useMemo(() => getPermissions("log"), [getPermissions])

    const [columns, setColumns] = useState({
        id: true,
        createdAt: true,
        route: true,
        method: true,
        statusCode: true,
        userId: false,
        userName: true,
        userEmail: true,
        message: true,
        stack: true,
        file: false,
        line: false,
        column: false,
        metadata: false,
    })

    const fetchLogs = async (overrides?: {
        page?: number
        userId?: string
        route?: string
        statusCode?: string
        createdFrom?: string
        createdTo?: string
    }) => {
        if (!permissions?.visualizar) return

        try {
            setIsLoading(true)

            const p = overrides?.page ?? page
            const user = overrides?.userId ?? filterUser
            const routeFilter = overrides?.route ?? filterRoute
            const status = overrides?.statusCode ?? filterStatus
            const createdFrom = overrides?.createdFrom ?? filterCreatedFrom
            const createdTo = overrides?.createdTo ?? filterCreatedTo

            const params = new URLSearchParams()
            params.set("page", String(p))
            params.set("pageSize", String(pageSize))
            if (user) params.set("userId", user)
            if (routeFilter) params.set("route", routeFilter)
            if (status) params.set("statusCode", status)
            if (createdFrom) params.set("createdFrom", createdFrom)
            if (createdTo) params.set("createdTo", createdTo)

            const response = await api.get(`/logs?${params.toString()}`)
            const payload = response.data

            // Normalize API envelope: support both { data: { logs, totalPages } } and direct { logs, totalPages }
            const data = payload?.data ?? payload

            setLogs(data.logs || data || [])
            setTotalPages(data.totalPages || 1)
            setError(null)
        } catch (err) {
            setError("Erro ao buscar logs")
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchLogs()
    }, [page, permissions?.visualizar])

    const logsByDay = useMemo(() => {
        const map = new Map<string, number>()

        for (const l of logs) {
            const created = l.created || l.createdAt || l.timestamp || Date.now()
            const d = new Date(created).toLocaleDateString()
            map.set(d, (map.get(d) || 0) + 1)
        }

        return [...map.entries()].map(([date, count]) => ({ date, count }))
    }, [logs])

    const statusDistribution = useMemo(() => {
        const map = new Map<number, number>()

        for (const l of logs) {
            const s = Number(l.statusCode || l.status || 0)
            map.set(s, (map.get(s) || 0) + 1)
        }

        return [...map.entries()].map(([statusCode, value]) => ({ statusCode, value }))
    }, [logs])

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (!active || !payload?.length) return null

        return (
            <div className="rounded-md bg-white shadow-md border px-3 py-2 text-sm">
                <p className="font-semibold">{label}</p>
                <p className="text-primary">count: {payload[0].value}</p>
            </div>
        )
    }

    const COLORS = ['#23518C', '#306EBF', '#6ab0f9']

    return (
        <div className="space-y-6 px-2 md:px-8 lg:px-12 pb-8">
            <h1 className="text-3xl font-bold tracking-tight">Logs</h1>

            <Card className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-2 items-end">
                    <div className="col-span-1">
                        <label className="text-xs text-muted-foreground">User ID</label>
                        <Input placeholder="User ID" value={filterUser} onChange={(e) => setFilterUser(e.target.value)} />
                    </div>

                    <div className="col-span-1">
                        <label className="text-xs text-muted-foreground">Rota</label>
                        <Input placeholder="Rota" value={filterRoute} onChange={(e) => setFilterRoute(e.target.value)} />
                    </div>

                    <div className="col-span-1">
                        <label className="text-xs text-muted-foreground">Status code</label>
                        <Input placeholder="Status code" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} />
                    </div>

                    <div className="col-span-1">
                        <Calendar23
                            className="w-full"
                            onRangeChange={(range) => {
                                if (!range) {
                                    setFilterCreatedFrom("")
                                    setFilterCreatedTo("")
                                    return
                                }
                                const from = range.from ? range.from.toISOString().slice(0, 10) : ""
                                const to = range.to ? range.to.toISOString().slice(0, 10) : ""
                                setFilterCreatedFrom(from)
                                setFilterCreatedTo(to)
                            }}
                        />
                    </div>

                    <div className="col-span-1"/>

                    <div className="col-span-1 flex gap-2 justify-end">
                        <Button
                            className="w-full"
                            onClick={() => {
                                setPage(1)
                                fetchLogs({ page: 1 })
                            }}
                        >
                            Filtrar
                        </Button>
                        <Button
                            variant="outline"
                            className="hover:text-white w-full"
                            onClick={() => {
                                // Reset state immediately for UI
                                setFilterUser("")
                                setFilterRoute("")
                                setFilterStatus("")
                                setFilterCreatedFrom("")
                                setFilterCreatedTo("")
                                setPage(1)
                                // Call fetchLogs with cleared overrides so it doesn't rely on state updates
                                fetchLogs({ page: 1, userId: "", route: "", statusCode: "", createdFrom: "", createdTo: "" })
                            }}
                        >
                            Limpar
                        </Button>
                    </div>
                </div>
            </Card>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <Card className="col-span-2">
                    <CardHeader>
                        <CardTitle>Erros por dia</CardTitle>
                    </CardHeader>
                    <CardContent className="h-60">
                        {isLoading ? (
                            <Skeleton className="h-full w-full" />
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={logsByDay} margin={{ top: 0, right: 40, left: 40, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#23518C" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#306EBF" stopOpacity={0.1} />
                                        </linearGradient>
                                    </defs>

                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey="date"
                                        interval={0}
                                        tick={{ fontSize: 12 }}
                                    />
                                    <ReTooltip content={<CustomTooltip />} />
                                    <Area type="monotone" dataKey="count" stroke="#23518C" fill="url(#grad)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Distribuição por status</CardTitle>
                    </CardHeader>
                    <CardContent className="h-60 flex justify-center">
                        {isLoading ? (
                            <Skeleton className="h-full w-full" />
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={statusDistribution}
                                        dataKey="value"
                                        nameKey="statusCode"
                                        outerRadius={80}
                                        label={(entry) => entry.statusCode}
                                    >
                                        {statusDistribution.map((_, i) => (
                                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>
            </div>

            {error && <p className="text-red-500">{error}</p>}


            <div className="mt-2">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                            <Settings2 className="h-4 w-4 mr-2" />
                            Colunas
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="p-2">
                        <DropdownMenuLabel className="mb-2">Colunas da Tabela</DropdownMenuLabel>
                        <div className="grid gap-2">
                            {Object.entries(columns).map(([key, value]) => (
                                <div key={key} className="flex items-center justify-between px-2 py-1">
                                    <span className="capitalize">{key}</span>
                                    <Switch
                                        checked={Boolean(value)}
                                        onCheckedChange={() => setColumns((prev) => ({ ...prev, [key]: !prev[key as keyof typeof prev] }))}
                                    />
                                </div>
                            ))}
                        </div>
                        <DropdownMenuSeparator className="my-2" />
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <div className="rounded-lg border h-[460px] overflow-auto">
                <Table>
                    <TableHeader className="sticky top-0 bg-muted z-10">
                        <TableRow>
                            {columns.id && <TableHead className="min-w-28">ID</TableHead>}
                            {columns.createdAt && <TableHead>Data</TableHead>}
                            {columns.route && <TableHead>Rota</TableHead>}
                            {columns.method && <TableHead>Método</TableHead>}
                            {columns.statusCode && <TableHead>Status</TableHead>}
                            {columns.userId && <TableHead>Usuário (ID)</TableHead>}
                            {columns.userName && <TableHead>Usuário</TableHead>}
                            {columns.userEmail && <TableHead>Email</TableHead>}
                            {columns.message && <TableHead>Mensagem</TableHead>}
                            {columns.stack && <TableHead>Stack</TableHead>}
                            {columns.file && <TableHead>Arquivo</TableHead>}
                            {columns.line && <TableHead>Linha</TableHead>}
                            {columns.column && <TableHead>Coluna</TableHead>}
                            {columns.metadata && <TableHead>Metadata</TableHead>}
                        </TableRow>
                    </TableHeader>

                    <TableBody className="bg-white/40">
                        {isLoading
                            ? [...Array(8)].map((_, i) => (
                                <TableRow key={i}>
                                    {columns.id && <TableCell><Skeleton className="h-4 w-32" /></TableCell>}
                                    {columns.createdAt && <TableCell><Skeleton className="h-4 w-24" /></TableCell>}
                                    {columns.route && <TableCell><Skeleton className="h-4 w-40" /></TableCell>}
                                    {columns.method && <TableCell><Skeleton className="h-4 w-20" /></TableCell>}
                                    {columns.statusCode && <TableCell><Skeleton className="h-4 w-12" /></TableCell>}
                                    {columns.userId && <TableCell><Skeleton className="h-4 w-20" /></TableCell>}
                                    {columns.userName && <TableCell><Skeleton className="h-4 w-24" /></TableCell>}
                                    {columns.userEmail && <TableCell><Skeleton className="h-4 w-32" /></TableCell>}
                                    {columns.message && <TableCell><Skeleton className="h-4 w-60" /></TableCell>}
                                    {columns.stack && <TableCell><Skeleton className="h-4 w-48" /></TableCell>}
                                    {columns.file && <TableCell><Skeleton className="h-4 w-40" /></TableCell>}
                                    {columns.line && <TableCell><Skeleton className="h-4 w-12" /></TableCell>}
                                    {columns.column && <TableCell><Skeleton className="h-4 w-12" /></TableCell>}
                                    {columns.metadata && <TableCell><Skeleton className="h-4 w-40" /></TableCell>}
                                </TableRow>
                            ))
                            : logs.map((l: any) => (
                                <TableRow key={l.id || l._id || l.logId}>
                                    {columns.id && <TableCell className="max-w-[220px] truncate">{l.id || l._id || l.logId || '-'}</TableCell>}
                                    {columns.createdAt && <TableCell className="min-w-[180px] text-center">{new Date(l.created || l.createdAt || l.timestamp || Date.now()).toLocaleString()}</TableCell>}
                                    {columns.route && <TableCell className="max-w-[240px] truncate">{l.route || l.url || l.path || '-'}</TableCell>}
                                    {columns.method && <TableCell>{l.method || l.httpMethod || '-'}</TableCell>}
                                    {columns.statusCode && <TableCell><Badge>{l.statusCode ?? l.status ?? '-'}</Badge></TableCell>}
                                    {columns.userId && <TableCell>{l.userId || l.user?.idUser || l.user?.id || '-'}</TableCell>}
                                    {columns.userName && <TableCell>{l.user?.name || l.userName || '-'}</TableCell>}
                                    {columns.userEmail && <TableCell>{l.user?.email || l.userEmail || '-'}</TableCell>}
                                    {columns.message && <TableCell className="max-w-[400px] truncate">{l.message || l.error || l.detail || '-'}</TableCell>}
                                    {columns.stack && <TableCell className="max-w-[400px] truncate">{l.stack || '-'}</TableCell>}
                                    {columns.file && <TableCell>{l.file || '-'}</TableCell>}
                                    {columns.line && <TableCell>{l.line ?? '-'}</TableCell>}
                                    {columns.column && <TableCell>{l.column ?? '-'}</TableCell>}
                                    {columns.metadata && <TableCell className="max-w-[400px] truncate">{JSON.stringify(l.metadata || l.meta || l.data || {}).slice(0, 300)}</TableCell>}
                                </TableRow>
                            ))}
                    </TableBody>
                </Table>
            </div>

            <div className="flex justify-between items-center">
                <span>
                    Página {page} de {totalPages}
                </span>

                <div className="space-x-2">
                    <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(page - 1)}>
                        Anterior
                    </Button>
                    <Button size="sm" variant="outline" disabled={page === totalPages} onClick={() => setPage(page + 1)}>
                        Próxima
                    </Button>
                </div>
            </div>
        </div>
    )
}
