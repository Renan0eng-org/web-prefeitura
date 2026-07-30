"use client"

import { PlantaoHistorico, type PlantaoAtendimento, type PlantaoEvent } from "@/components/escala/plantao-timeline"
import { Badge } from "@/components/ui/badge"
import { useEscalaRealtime } from "@/hooks/use-escala-realtime"
import { useAuth } from "@/hooks/use-auth"
import { useAlert } from "@/hooks/use-alert"
import { cn } from "@/lib/utils"
import api from "@/services/api"
import { BellRing, GripVertical, Loader2, Maximize2, Minus, X } from "lucide-react"
import * as React from "react"

type Plantao = {
    id: string
    setor: string
    startsAt: string
    endsAt: string
    status: "Aberto" | "Agendado" | "EmAndamento" | "Concluido" | "Cancelado"
    doctorId?: string | null
    doctor?: { idUser: string; name: string; especialidade?: string | null } | null
}

const STATUS: Record<string, { label: string; cls: string }> = {
    Aberto: { label: "Disponível", cls: "text-amber-600 border-amber-400" },
    Agendado: { label: "Atribuído", cls: "text-blue-600 border-blue-400" },
    EmAndamento: { label: "Em andamento", cls: "text-emerald-600 border-emerald-400" },
    Concluido: { label: "Concluído", cls: "text-slate-500 border-slate-300" },
    Cancelado: { label: "Cancelado", cls: "text-red-600 border-red-400" },
}

const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })

const MIN_W = 300, MIN_H = 260

type Rect = { x: number; y: number; w: number; h: number }

// Posição inicial: encostada à direita, com leve cascata por índice p/ não sobrepor.
function defaultRect(index = 0): Rect {
    const off = index * 28
    if (typeof window === "undefined") return { x: 80 + off, y: 90 + off, w: 380, h: 460 }
    const x = Math.max(16, window.innerWidth - 420 - off)
    const y = Math.min(90 + off, Math.max(16, window.innerHeight - 200))
    return { x, y, w: 380, h: 480 }
}

export function FloatingPlantaoCard({ id, index = 0, z = 60, onFocus, onClose }: { id: string; index?: number; z?: number; onFocus?: () => void; onClose: () => void }) {
    const { getPermissions } = useAuth()
    const { setAlert } = useAlert()
    const [plantao, setPlantao] = React.useState<Plantao | null>(null)
    const [history, setHistory] = React.useState<PlantaoEvent[]>([])
    const [atendimentos, setAtendimentos] = React.useState<PlantaoAtendimento[]>([])
    const [loading, setLoading] = React.useState(true)
    const [notFound, setNotFound] = React.useState(false)
    const [notifying, setNotifying] = React.useState(false)
    const isEscalaAdmin = !!getPermissions("escala-admin")?.visualizar

    // Rect e estado minimizado persistidos POR plantão (cada card lembra o seu).
    const rectKey = `pinned_plantao_rect_${id}`
    const minKey = `pinned_plantao_min_${id}`

    const [rect, setRect] = React.useState<Rect>(() => {
        try {
            const raw = sessionStorage.getItem(rectKey)
            if (raw) return JSON.parse(raw)
        } catch { /* ignore */ }
        return defaultRect(index)
    })
    const [minimized, setMinimized] = React.useState<boolean>(() => {
            try { return sessionStorage.getItem(minKey) === "1" } catch { return false }
    })

    const rectRef = React.useRef(rect)
    rectRef.current = rect
    const setRectPersist = (r: Rect) => {
        rectRef.current = r
        setRect(r)
        try { sessionStorage.setItem(rectKey, JSON.stringify(r)) } catch { /* ignore */ }
    }

    const toggleMinimized = () => {
        setMinimized((m) => {
            const next = !m
            try { sessionStorage.setItem(minKey, next ? "1" : "0") } catch { /* ignore */ }
            return next
        })
    }

    const load = React.useCallback(async () => {
        try {
            const [pRes, hRes, aRes] = await Promise.all([
                api.get(`/admin/escala/${id}`),
                api.get(`/admin/escala/${id}/historico`),
                api.get(`/admin/escala/${id}/atendimentos`).catch(() => ({ data: [] })),
            ])
            setPlantao(pRes.data)
            setHistory(Array.isArray(hRes.data) ? hRes.data : [])
            setAtendimentos(Array.isArray(aRes.data) ? aRes.data : [])
            setNotFound(false)
        } catch (err: any) {
            if (err?.response?.status === 404) setNotFound(true)
        } finally {
            setLoading(false)
        }
    }, [id])

    React.useEffect(() => { setLoading(true); load() }, [load])

    const canNotifyCheckin = !!plantao && isEscalaAdmin && plantao.status === "Agendado" && !!plantao.doctorId &&
        new Date() >= new Date(plantao.startsAt) && new Date() < new Date(plantao.endsAt)

    const notifyCheckin = async () => {
        if (!plantao) return
        setNotifying(true)
        try {
            await api.post(`/admin/escala/${plantao.id}/notificar-checkin`)
            setAlert("Solicitação de check-in enviada ao médico.", "success")
            await load()
        } catch (err: any) {
            setAlert(err.response?.data?.message || "Não foi possível solicitar o check-in.", "error")
        } finally {
            setNotifying(false)
        }
    }

    // Atualização em tempo real do plantão fixado.
    useEscalaRealtime(load, true)

    // Drag (pelo cabeçalho) e resize (canto inferior direito).
    const dragRef = React.useRef<{ mode: "move" | "resize"; startX: number; startY: number; base: Rect } | null>(null)

    React.useEffect(() => {
        const onMove = (e: PointerEvent) => {
            const d = dragRef.current
            if (!d) return
            e.preventDefault()
            const dx = e.clientX - d.startX
            const dy = e.clientY - d.startY
            if (d.mode === "move") {
                const x = Math.min(Math.max(0, d.base.x + dx), window.innerWidth - 80)
                const y = Math.min(Math.max(0, d.base.y + dy), window.innerHeight - 40)
                setRectPersist({ ...rectRef.current, x, y })
            } else {
                const w = Math.max(MIN_W, Math.min(d.base.w + dx, window.innerWidth - d.base.x - 8))
                const h = Math.max(MIN_H, Math.min(d.base.h + dy, window.innerHeight - d.base.y - 8))
                setRectPersist({ ...rectRef.current, w, h })
            }
        }
        const onUp = () => { dragRef.current = null }
        window.addEventListener("pointermove", onMove)
        window.addEventListener("pointerup", onUp)
        return () => {
            window.removeEventListener("pointermove", onMove)
            window.removeEventListener("pointerup", onUp)
        }
    }, [])

    const startDrag = (e: React.PointerEvent, mode: "move" | "resize") => {
        if (e.button !== 0) return
        e.preventDefault()
        dragRef.current = { mode, startX: e.clientX, startY: e.clientY, base: { ...rectRef.current } }
    }

    const st = plantao ? (STATUS[plantao.status] ?? { label: plantao.status, cls: "" }) : null

    return (
        <div
            className="fixed rounded-xl border bg-card text-card-foreground shadow-2xl flex flex-col overflow-hidden"
            style={{ left: rect.x, top: rect.y, width: rect.w, height: minimized ? "auto" : rect.h, zIndex: z }}
            onPointerDownCapture={onFocus}
        >
            {/* Cabeçalho (alça de arraste) — status + a quem está atribuído */}
            <div
                className={cn("flex items-start gap-2 px-3 py-2 bg-muted/50 cursor-grab active:cursor-grabbing touch-none", !minimized && "border-b")}
                onPointerDown={(e) => startDrag(e, "move")}
                onDoubleClick={toggleMinimized}
            >
                <GripVertical className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold truncate">{plantao?.doctor?.name || "Não atribuído"}</span>
                        {st && <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 shrink-0", st.cls)}>{st.label}</Badge>}
                    </div>
                    {plantao && (
                        <div className="text-[11px] text-muted-foreground truncate">
                            {plantao.doctor?.especialidade ? `${plantao.doctor.especialidade} · ` : ""}{plantao.setor} · {fmtTime(plantao.startsAt)}–{fmtTime(plantao.endsAt)}
                        </div>
                    )}
                </div>
                {canNotifyCheckin && (
                    <button
                        className="rounded-md p-1 text-amber-600 hover:bg-accent hover:text-amber-700 shrink-0 disabled:opacity-50"
                        onClick={() => void notifyCheckin()}
                        onPointerDown={(e) => e.stopPropagation()}
                        disabled={notifying}
                        aria-label="Solicitar check-in"
                        title="Solicitar check-in"
                    >
                        <BellRing className="h-4 w-4" />
                    </button>
                )}
                <button
                    className="rounded-md p-1 hover:bg-accent shrink-0"
                    onClick={toggleMinimized}
                    onPointerDown={(e) => e.stopPropagation()}
                    aria-label={minimized ? "Expandir" : "Minimizar"}
                    title={minimized ? "Expandir" : "Minimizar"}
                >
                    {minimized ? <Maximize2 className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
                </button>
                <button
                    className="rounded-md p-1 hover:bg-accent shrink-0"
                    onClick={onClose}
                    onPointerDown={(e) => e.stopPropagation()}
                    aria-label="Fechar"
                    title="Fechar"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>

            {/* Corpo (oculto quando minimizado) */}
            {!minimized && (
                <div className="flex-1 min-h-0 flex flex-col p-3">
                    {loading ? (
                        <div className="flex items-center justify-center py-10 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>
                    ) : notFound ? (
                        <p className="text-sm text-muted-foreground text-center py-10">Plantão não encontrado (pode ter sido excluído).</p>
                    ) : (
                        <PlantaoHistorico events={history} atendimentos={atendimentos} />
                    )}
                </div>
            )}

            {/* Alça de redimensionamento (só quando expandido) */}
            {!minimized && (
                <div
                    className={cn("absolute bottom-0 right-0 h-4 w-4 cursor-nwse-resize touch-none")}
                    onPointerDown={(e) => startDrag(e, "resize")}
                >
                    <div className="absolute bottom-1 right-1 h-2 w-2 border-b-2 border-r-2 border-muted-foreground/50" />
                </div>
            )}
        </div>
    )
}
