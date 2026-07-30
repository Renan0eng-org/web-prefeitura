"use client"

import { cn } from "@/lib/utils"
import { BellRing, ChevronRight, HandHelping, History, Hourglass, LogIn, LogOut, Pencil, PlusCircle, RotateCcw, Stethoscope, Timer, Trash2, Undo2, UserPlus, type LucideIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import * as React from "react"

export type PlantaoEvent = {
    id: string
    type: "Criado" | "Atribuido" | "Pegou" | "Devolvido" | "Editado" | "CheckIn" | "CheckOut" | "NotificacaoCheckIn" | "Removido" | "Restaurado"
    actorId: string | null
    actorName: string | null
    actorRole: string | null
    detail: string | null
    createdAt: string
    actor?: { idUser: string; name: string; avatar: string | null; type: string | null } | null
}

export type PlantaoAtendimento = {
    id: string
    code: string
    patientName: string
    doctorName: string | null
    setor: string
    status: "Aguardando" | "Chamado" | "EmAtendimento" | "Concluido" | "Cancelado" | "Faltou"
    attendanceId: string | null
    issuedAt: string
    calledAt: string | null
    confirmedAt: string | null
    closedAt: string | null
    waitSeconds: number | null
    consultSeconds: number | null
    attendance: {
        id: string
        diagnosis: string | null
        treatment: string | null
        chiefComplaint: string | null
        status: string
        createdAt: string
        updatedAt: string
    } | null
}

const ICON: Record<PlantaoEvent["type"], LucideIcon> = {
    Criado: PlusCircle,
    Atribuido: UserPlus,
    Pegou: HandHelping,
    Devolvido: Undo2,
    Editado: Pencil,
    CheckIn: LogIn,
    CheckOut: LogOut,
    NotificacaoCheckIn: BellRing,
    Removido: Trash2,
    Restaurado: RotateCcw,
}

function title(e: PlantaoEvent): string {
    switch (e.type) {
        case "Criado": return e.detail ? `Criou o plantão atribuído a ${e.detail}` : "Criou o plantão no mercado"
        case "Atribuido": return `Atribuiu a ${e.detail || "um médico"}`
        case "Pegou": return "Pegou o plantão"
        case "Devolvido": return "Devolveu ao mercado"
        case "Editado": return "Editou o plantão"
        case "CheckIn": return "Fez check-in"
        case "CheckOut": return "Fez check-out"
        case "NotificacaoCheckIn": return "Solicitou check-in ao médico"
        case "Removido": return "Removeu o plantão"
        case "Restaurado": return "Restaurou o plantão"
        default: return "Alterou o plantão"
    }
}

const isMedico = (e: PlantaoEvent) => e.actorRole === "Médico" || e.actor?.type === "MEDICO"

// Paleta por papel — verde para médicos, azul para admin/equipe, violeta para atendimentos.
// Funciona em claro e escuro.
const PALETTE = {
    medico: {
        avatar: "bg-emerald-600",
        dot: "bg-emerald-500",
        border: "border-l-emerald-500",
        card: "bg-emerald-50/60 dark:bg-emerald-500/10",
        badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
    },
    admin: {
        avatar: "bg-blue-600",
        dot: "bg-blue-500",
        border: "border-l-blue-500",
        card: "bg-blue-50/60 dark:bg-blue-500/10",
        badge: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
    },
    atendimento: {
        avatar: "bg-violet-600",
        dot: "bg-violet-500",
        border: "border-l-violet-500",
        card: "bg-violet-50/60 dark:bg-violet-500/10",
        badge: "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300",
    },
}

type Pal = typeof PALETTE.admin

function initials(name?: string | null) {
    const parts = (name || "?").trim().split(/\s+/).slice(0, 2)
    return parts.map((w) => w[0]?.toUpperCase() || "").join("") || "?"
}

function fmt(iso: string) {
    const d = new Date(iso)
    const day = String(d.getDate()).padStart(2, "0")
    const mon = d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")
    const time = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    return `${day} ${mon} · ${time}`
}

/** Duração legível a partir de segundos (ex.: "45 s", "12 min", "1 h 05 min"). */
function fmtDuration(seconds: number | null): string {
    if (seconds == null) return "—"
    if (seconds < 60) return `${seconds} s`
    const m = Math.round(seconds / 60)
    if (m < 60) return `${m} min`
    const h = Math.floor(m / 60)
    const rem = m % 60
    return `${h} h ${String(rem).padStart(2, "0")} min`
}

// --- Blocos de "pessoa" e "card" reutilizados pela timeline ---

function PersonBlock({ name, avatar, role, pal }: { name?: string | null; avatar?: string | null; role?: string | null; pal: Pal }) {
    return (
        <div className="flex flex-col items-center text-center gap-1">
            {avatar ? (
                <img src={avatar} alt={name || ""} className="h-12 w-12 rounded-full object-cover" />
            ) : (
                <div className={cn("h-12 w-12 rounded-full flex items-center justify-center text-white font-bold text-sm", pal.avatar)}>
                    {initials(name)}
                </div>
            )}
            <div className="text-sm font-semibold leading-tight">{name || "Sistema"}</div>
            {role && <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium", pal.badge)}>{role}</span>}
        </div>
    )
}

function EventCard({ e, pal, align }: { e: PlantaoEvent; pal: Pal; align: "left" | "right" }) {
    const Icon = ICON[e.type]
    return (
        <div className={cn("rounded-lg border-l-4 p-3 w-full", pal.border, pal.card, align === "right" ? "text-right" : "text-left")}>
            <div className={cn("flex items-center gap-2 text-sm font-medium", align === "right" && "flex-row-reverse")}>
                <Icon className="h-4 w-4 shrink-0" />
                <span>{title(e)}</span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">{fmt(e.createdAt)}</div>
        </div>
    )
}

const AT_STATUS: Record<PlantaoAtendimento["status"], { label: string; cls: string }> = {
    Aguardando: { label: "Aguardando", cls: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300" },
    Chamado: { label: "Chamado", cls: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300" },
    EmAtendimento: { label: "Em atendimento", cls: "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300" },
    Concluido: { label: "Concluído", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300" },
    Cancelado: { label: "Cancelado", cls: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300" },
    Faltou: { label: "Faltou", cls: "bg-slate-200 text-slate-600 dark:bg-slate-600/30 dark:text-slate-300" },
}

function AtendimentoCard({ a, pal, align }: { a: PlantaoAtendimento; pal: Pal; align: "left" | "right" }) {
    const router = useRouter()
    const diagnosis = a.attendance?.diagnosis?.trim()
    const st = AT_STATUS[a.status] ?? { label: a.status, cls: pal.badge }
    const right = align === "right"
    // Clicável apenas quando há um atendimento vinculado (abre a tela de visualização).
    const clickable = !!a.attendanceId
    const open = () => { if (a.attendanceId) router.push(`/admin/atendimentos/editar/${a.attendanceId}?view=true`) }
    return (
        <div
            role={clickable ? "button" : undefined}
            tabIndex={clickable ? 0 : undefined}
            onClick={clickable ? open : undefined}
            onKeyDown={clickable ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open() } } : undefined}
            title={clickable ? "Ver detalhes do atendimento" : undefined}
            className={cn(
                "rounded-lg border-l-4 p-3 w-full transition-shadow",
                pal.border, pal.card,
                right ? "text-right" : "text-left",
                clickable && "cursor-pointer hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400",
            )}
        >
            <div className={cn("flex items-center gap-2 text-sm font-medium", right && "flex-row-reverse")}>
                <Stethoscope className="h-4 w-4 shrink-0" />
                <span>Senha {a.code}</span>
                <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-medium", st.cls)}>{st.label}</span>
                {clickable && <ChevronRight className={cn("h-4 w-4 text-muted-foreground shrink-0", right ? "mr-auto" : "ml-auto")} />}
            </div>
            <div className={cn("flex flex-wrap gap-x-3 gap-y-1 mt-1.5 text-xs text-muted-foreground", right && "justify-end")}>
                <span className={cn("inline-flex items-center gap-1", right && "flex-row-reverse")} title="Tempo de espera (emissão → chamada)">
                    <Hourglass className="h-3 w-3" />Espera {fmtDuration(a.waitSeconds)}
                </span>
                <span className={cn("inline-flex items-center gap-1", right && "flex-row-reverse")} title="Tempo de consulta (início → fim)">
                    <Timer className="h-3 w-3" />Consulta {fmtDuration(a.consultSeconds)}
                </span>
            </div>
            {diagnosis && (
                <div className={cn("text-xs mt-1.5", right && "text-right")}>
                    <span className="text-muted-foreground">Diagnóstico: </span>
                    <span className="font-medium">{diagnosis}</span>
                </div>
            )}
            <div className="text-xs text-muted-foreground mt-1" title="Senha gerada em">{fmt(a.issuedAt)}</div>
        </div>
    )
}

/** Linha da timeline: pessoa de um lado, card do outro, bolinha central. */
function TimelineRow({ person, card, dot, personSide }: { person: React.ReactNode; card: React.ReactNode; dot: string; personSide: "left" | "right" }) {
    return (
        <div className="relative grid grid-cols-[1fr_2rem_1fr] items-center gap-1">
            <div className="flex justify-end">{personSide === "left" ? person : card}</div>
            <div className="relative flex justify-center">
                <span className={cn("h-4 w-4 rounded-full border-2 border-card shadow-sm z-10", dot)} />
            </div>
            <div className="flex justify-start">{personSide === "left" ? card : person}</div>
        </div>
    )
}

// --- Nós unificados (evento ou atendimento) ordenados por tempo ---

type TimelineNode =
    | { kind: "event"; at: number; e: PlantaoEvent }
    | { kind: "atendimento"; at: number; a: PlantaoAtendimento }

function buildNodes(events: PlantaoEvent[], atendimentos: PlantaoAtendimento[], mode: HistoryFilter): TimelineNode[] {
    const nodes: TimelineNode[] = []
    if (mode !== "atendimentos") {
        for (const e of events) nodes.push({ kind: "event", at: new Date(e.createdAt).getTime(), e })
    }
    if (mode !== "plantao") {
        // Posiciona no momento da GERAÇÃO da senha (entra no histórico desde então).
        for (const a of atendimentos) nodes.push({ kind: "atendimento", at: new Date(a.issuedAt).getTime(), a })
    }
    return nodes.sort((x, y) => x.at - y.at)
}

function TimelineList({ nodes, emptyLabel }: { nodes: TimelineNode[]; emptyLabel: string }) {
    if (nodes.length === 0) {
        return <p className="text-sm text-muted-foreground text-center py-6">{emptyLabel}</p>
    }
    return (
        <div className="relative py-2">
            {/* barra vertical central, contínua, ligando as bolinhas */}
            <div className="absolute left-1/2 top-3 bottom-3 w-[3px] -translate-x-1/2 rounded-full bg-border" />
            <div className="space-y-6">
                {nodes.map((n) => {
                    if (n.kind === "event") {
                        const medico = isMedico(n.e)
                        const pal = medico ? PALETTE.medico : PALETTE.admin
                        // Médicos à direita, admin/equipe à esquerda (como no design).
                        const personSide: "left" | "right" = medico ? "right" : "left"
                        return (
                            <TimelineRow
                                key={`e-${n.e.id}`}
                                dot={pal.dot}
                                personSide={personSide}
                                person={<PersonBlock name={n.e.actorName} avatar={n.e.actor?.avatar} role={n.e.actorRole} pal={pal} />}
                                card={<EventCard e={n.e} pal={pal} align={personSide === "left" ? "left" : "right"} />}
                            />
                        )
                    }
                    // Atendimento: paciente à direita, card à esquerda (violeta).
                    const pal = PALETTE.atendimento
                    return (
                        <TimelineRow
                            key={`a-${n.a.id}`}
                            dot={pal.dot}
                            personSide="right"
                            person={<PersonBlock name={n.a.patientName} role="Paciente" pal={pal} />}
                            card={<AtendimentoCard a={n.a} pal={pal} align="left" />}
                        />
                    )
                })}
            </div>
        </div>
    )
}

// --- Filtro + bloco de histórico autocontido ---

export type HistoryFilter = "tudo" | "plantao" | "atendimentos"

const FILTERS: { key: HistoryFilter; label: string }[] = [
    { key: "tudo", label: "Tudo" },
    { key: "plantao", label: "Plantão" },
    { key: "atendimentos", label: "Atendimentos" },
]

const EMPTY_LABEL: Record<HistoryFilter, string> = {
    tudo: "Nada registrado ainda.",
    plantao: "Nenhum evento registrado ainda.",
    atendimentos: "Nenhuma senha no setor durante o período ativo do plantão.",
}

/**
 * Bloco completo de histórico do plantão: cabeçalho com filtro
 * (Tudo | Plantão | Atendimentos), lista rolável e rolagem automática
 * para o evento mais recente. Preenche a altura do contêiner pai.
 */
export function PlantaoHistorico({
    events,
    atendimentos,
    loading = false,
    className,
}: {
    events: PlantaoEvent[]
    atendimentos: PlantaoAtendimento[]
    loading?: boolean
    className?: string
}) {
    const [filter, setFilter] = React.useState<HistoryFilter>("tudo")
    const scrollRef = React.useRef<HTMLDivElement | null>(null)

    const nodes = React.useMemo(() => buildNodes(events, atendimentos, filter), [events, atendimentos, filter])

    // Mantém a visão no item mais recente (rola para o fim quando muda a lista).
    React.useEffect(() => {
        const el = scrollRef.current
        if (el) requestAnimationFrame(() => el.scrollTo({ top: el.scrollHeight, behavior: "smooth" }))
    }, [nodes])

    const count = filter === "tudo" ? events.length + atendimentos.length : filter === "plantao" ? events.length : atendimentos.length

    return (
        <div className={cn("flex flex-col min-h-0 h-full", className)}>
            <div className="flex items-center justify-between gap-2 mb-2 shrink-0 flex-wrap">
                <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                    <History className="h-4 w-4" /> Histórico
                    {count > 0 && <span className="text-xs font-normal">· {count}</span>}
                </div>
                <div className="inline-flex rounded-md border bg-muted/40 p-0.5 text-xs">
                    {FILTERS.map((f) => (
                        <button
                            key={f.key}
                            type="button"
                            onClick={() => setFilter(f.key)}
                            className={cn(
                                "px-2 py-1 rounded-[5px] font-medium transition-colors",
                                filter === f.key ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground",
                            )}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>
            <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto scrollable pr-1">
                {loading ? (
                    <p className="text-sm text-muted-foreground text-center py-6">Carregando histórico...</p>
                ) : (
                    <TimelineList nodes={nodes} emptyLabel={EMPTY_LABEL[filter]} />
                )}
            </div>
        </div>
    )
}

/** Timeline simples só de eventos (mantida para compatibilidade). */
export function PlantaoTimeline({ events }: { events: PlantaoEvent[] }) {
    const nodes = React.useMemo(() => buildNodes(events, [], "plantao"), [events])
    return <TimelineList nodes={nodes} emptyLabel={EMPTY_LABEL.plantao} />
}

export { History as TimelineIcon }
