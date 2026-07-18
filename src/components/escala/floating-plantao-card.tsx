"use client"

import { PlantaoTimeline, TimelineIcon, type PlantaoEvent } from "@/components/escala/plantao-timeline"
import { Badge } from "@/components/ui/badge"
import { useEscalaRealtime } from "@/hooks/use-escala-realtime"
import { cn } from "@/lib/utils"
import api from "@/services/api"
import { GripVertical, Loader2, X } from "lucide-react"
import * as React from "react"

type Plantao = {
    id: string
    setor: string
    startsAt: string
    endsAt: string
    status: "Aberto" | "Agendado" | "EmAndamento" | "Concluido" | "Cancelado"
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

function defaultRect(): Rect {
    if (typeof window === "undefined") return { x: 80, y: 90, w: 380, h: 460 }
    return { x: Math.max(16, window.innerWidth - 420), y: 90, w: 380, h: 480 }
}

export function FloatingPlantaoCard({ id, onClose }: { id: string; onClose: () => void }) {
    const [plantao, setPlantao] = React.useState<Plantao | null>(null)
    const [history, setHistory] = React.useState<PlantaoEvent[]>([])
    const [loading, setLoading] = React.useState(true)
    const [notFound, setNotFound] = React.useState(false)

    const [rect, setRect] = React.useState<Rect>(() => {
        try {
            const raw = localStorage.getItem("pinned_plantao_rect")
            if (raw) return JSON.parse(raw)
        } catch { /* ignore */ }
        return defaultRect()
    })
    const rectRef = React.useRef(rect)
    rectRef.current = rect
    const setRectPersist = (r: Rect) => {
        rectRef.current = r
        setRect(r)
        try { localStorage.setItem("pinned_plantao_rect", JSON.stringify(r)) } catch { /* ignore */ }
    }

    const bodyRef = React.useRef<HTMLDivElement | null>(null)

    const load = React.useCallback(async () => {
        try {
            const [pRes, hRes] = await Promise.all([
                api.get(`/admin/escala/${id}`),
                api.get(`/admin/escala/${id}/historico`),
            ])
            setPlantao(pRes.data)
            setHistory(Array.isArray(hRes.data) ? hRes.data : [])
            setNotFound(false)
        } catch (err: any) {
            if (err?.response?.status === 404) setNotFound(true)
        } finally {
            setLoading(false)
        }
    }, [id])

    React.useEffect(() => { setLoading(true); load() }, [load])

    // Mantém a visão no evento mais recente (rola para o fim quando o histórico muda).
    React.useEffect(() => {
        const el = bodyRef.current
        if (el) requestAnimationFrame(() => el.scrollTo({ top: el.scrollHeight, behavior: "smooth" }))
    }, [history])

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
            className="fixed z-[60] rounded-xl border bg-card text-card-foreground shadow-2xl flex flex-col overflow-hidden"
            style={{ left: rect.x, top: rect.y, width: rect.w, height: rect.h }}
        >
            {/* Cabeçalho (alça de arraste) — status + a quem está atribuído */}
            <div
                className="flex items-start gap-2 px-3 py-2 border-b bg-muted/50 cursor-grab active:cursor-grabbing touch-none"
                onPointerDown={(e) => startDrag(e, "move")}
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
                <button
                    className="rounded-md p-1 hover:bg-accent shrink-0"
                    onClick={onClose}
                    onPointerDown={(e) => e.stopPropagation()}
                    aria-label="Fechar"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>

            {/* Corpo */}
            <div ref={bodyRef} className="flex-1 overflow-y-auto scrollable p-3">
                {loading ? (
                    <div className="flex items-center justify-center py-10 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>
                ) : notFound ? (
                    <p className="text-sm text-muted-foreground text-center py-10">Plantão não encontrado (pode ter sido excluído).</p>
                ) : (
                    <>
                        <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-1">
                            <TimelineIcon className="h-4 w-4" /> Histórico
                            {history.length > 0 && <span className="text-xs font-normal ml-auto">{history.length} evento{history.length > 1 ? "s" : ""}</span>}
                        </div>
                        <PlantaoTimeline events={history} />
                    </>
                )}
            </div>

            {/* Alça de redimensionamento */}
            <div
                className={cn("absolute bottom-0 right-0 h-4 w-4 cursor-nwse-resize touch-none")}
                onPointerDown={(e) => startDrag(e, "resize")}
            >
                <div className="absolute bottom-1 right-1 h-2 w-2 border-b-2 border-r-2 border-muted-foreground/50" />
            </div>
        </div>
    )
}
