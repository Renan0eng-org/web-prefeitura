"use client"

import { cn } from "@/lib/utils"
import { HandHelping, History, LogIn, LogOut, Pencil, PlusCircle, RotateCcw, Trash2, Undo2, UserPlus, type LucideIcon } from "lucide-react"

export type PlantaoEvent = {
    id: string
    type: "Criado" | "Atribuido" | "Pegou" | "Devolvido" | "Editado" | "CheckIn" | "CheckOut" | "Removido" | "Restaurado"
    actorId: string | null
    actorName: string | null
    actorRole: string | null
    detail: string | null
    createdAt: string
    actor?: { idUser: string; name: string; avatar: string | null; type: string | null } | null
}

const ICON: Record<PlantaoEvent["type"], LucideIcon> = {
    Criado: PlusCircle,
    Atribuido: UserPlus,
    Pegou: HandHelping,
    Devolvido: Undo2,
    Editado: Pencil,
    CheckIn: LogIn,
    CheckOut: LogOut,
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
        case "Removido": return "Removeu o plantão"
        case "Restaurado": return "Restaurou o plantão"
        default: return "Alterou o plantão"
    }
}

const isMedico = (e: PlantaoEvent) => e.actorRole === "Médico" || e.actor?.type === "MEDICO"

// Paleta por papel — verde para médicos, azul para admin/equipe. Funciona em claro e escuro.
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
}

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

function Person({ e, pal }: { e: PlantaoEvent; pal: typeof PALETTE.admin }) {
    return (
        <div className="flex flex-col items-center text-center gap-1">
            {e.actor?.avatar ? (
                <img src={e.actor.avatar} alt={e.actorName || ""} className="h-12 w-12 rounded-full object-cover" />
            ) : (
                <div className={cn("h-12 w-12 rounded-full flex items-center justify-center text-white font-bold text-sm", pal.avatar)}>
                    {initials(e.actorName)}
                </div>
            )}
            <div className="text-sm font-semibold leading-tight">{e.actorName || "Sistema"}</div>
            {e.actorRole && <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium", pal.badge)}>{e.actorRole}</span>}
        </div>
    )
}

function EventCard({ e, pal, align }: { e: PlantaoEvent; pal: typeof PALETTE.admin; align: "left" | "right" }) {
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

export function PlantaoTimeline({ events }: { events: PlantaoEvent[] }) {
    if (events.length === 0) {
        return <p className="text-sm text-muted-foreground text-center py-6">Nenhum evento registrado ainda.</p>
    }
    return (
        <div className="relative py-2">
            {/* barra vertical central, contínua, ligando as bolinhas */}
            <div className="absolute left-1/2 top-3 bottom-3 w-[3px] -translate-x-1/2 rounded-full bg-border" />
            <div className="space-y-6">
                {events.map((e) => {
                    const medico = isMedico(e)
                    const pal = medico ? PALETTE.medico : PALETTE.admin
                    // Médicos à direita, admin/equipe à esquerda (como no design).
                    const personSide: "left" | "right" = medico ? "right" : "left"
                    return (
                        <div key={e.id} className="relative grid grid-cols-[1fr_2rem_1fr] items-center gap-1">
                            <div className="flex justify-end">
                                {personSide === "left" ? <Person e={e} pal={pal} /> : <EventCard e={e} pal={pal} align="right" />}
                            </div>
                            <div className="relative flex justify-center">
                                <span className={cn("h-4 w-4 rounded-full border-2 border-card shadow-sm z-10", pal.dot)} />
                            </div>
                            <div className="flex justify-start">
                                {personSide === "left" ? <EventCard e={e} pal={pal} align="left" /> : <Person e={e} pal={pal} />}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

export { History as TimelineIcon }
