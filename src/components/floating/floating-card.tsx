"use client"

import { cn } from "@/lib/utils"
import { GripVertical, Maximize2, Minus, X } from "lucide-react"
import * as React from "react"

export type FloatingRect = { x: number; y: number; w: number; h: number }

function initialRect(index = 0): FloatingRect {
    const off = index * 28
    if (typeof window === "undefined") return { x: 80 + off, y: 90 + off, w: 380, h: 480 }
    return { x: Math.max(16, window.innerWidth - 420 - off), y: Math.min(90 + off, Math.max(16, window.innerHeight - 200)), w: 380, h: 480 }
}

export function FloatingCard({
    storageKey, index = 0, z = 60, title, subtitle, actions, children, onFocus, onClose, className,
}: {
    storageKey: string; index?: number; z?: number; title: React.ReactNode; subtitle?: React.ReactNode
    actions?: React.ReactNode; children: React.ReactNode; onFocus?: () => void; onClose: () => void; className?: string
}) {
    const rectKey = `floating_card_rect_${storageKey}`
    const minKey = `floating_card_min_${storageKey}`
    const [rect, setRect] = React.useState<FloatingRect>(() => {
        try { const raw = sessionStorage.getItem(rectKey); if (raw) return JSON.parse(raw) } catch { /* ignore */ }
        return initialRect(index)
    })
    const [minimized, setMinimized] = React.useState(() => {
        try { return sessionStorage.getItem(minKey) === "1" } catch { return false }
    })
    const rectRef = React.useRef(rect)
    rectRef.current = rect
    const dragRef = React.useRef<{ mode: "move" | "resize"; startX: number; startY: number; base: FloatingRect } | null>(null)

    const saveRect = (next: FloatingRect) => { rectRef.current = next; setRect(next); try { sessionStorage.setItem(rectKey, JSON.stringify(next)) } catch { /* ignore */ } }
    const toggle = () => setMinimized((value) => { const next = !value; try { sessionStorage.setItem(minKey, next ? "1" : "0") } catch { /* ignore */ } return next })

    React.useEffect(() => {
        const move = (e: PointerEvent) => {
            const d = dragRef.current; if (!d) return
            e.preventDefault()
            const dx = e.clientX - d.startX, dy = e.clientY - d.startY
            if (d.mode === "move") saveRect({ ...rectRef.current, x: Math.min(Math.max(0, d.base.x + dx), window.innerWidth - 80), y: Math.min(Math.max(0, d.base.y + dy), window.innerHeight - 40) })
            else saveRect({ ...rectRef.current, w: Math.max(300, Math.min(d.base.w + dx, window.innerWidth - d.base.x - 8)), h: Math.max(260, Math.min(d.base.h + dy, window.innerHeight - d.base.y - 8)) })
        }
        const up = () => { dragRef.current = null }
        window.addEventListener("pointermove", move); window.addEventListener("pointerup", up)
        return () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up) }
    }, [])

    const start = (e: React.PointerEvent, mode: "move" | "resize") => {
        if (e.button !== 0) return
        e.preventDefault(); dragRef.current = { mode, startX: e.clientX, startY: e.clientY, base: { ...rectRef.current } }
    }

    return <div className={cn("fixed rounded-xl border bg-card text-card-foreground shadow-2xl flex flex-col overflow-hidden", className)} style={{ left: rect.x, top: rect.y, width: rect.w, height: minimized ? "auto" : rect.h, zIndex: z }} onPointerDownCapture={onFocus}>
        <div className={cn("flex items-start gap-2 px-3 py-2 bg-muted/50 cursor-grab active:cursor-grabbing touch-none", !minimized && "border-b")} onPointerDown={(e) => start(e, "move")} onDoubleClick={toggle}>
            <GripVertical className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1"><div className="text-sm font-semibold truncate">{title}</div>{subtitle && <div className="text-[11px] text-muted-foreground truncate">{subtitle}</div>}</div>
            <div className="flex items-center gap-1" onPointerDown={(e) => e.stopPropagation()}>{actions}</div>
            <button className="rounded-md p-1 hover:bg-accent shrink-0" onClick={toggle} aria-label={minimized ? "Expandir" : "Minimizar"} title={minimized ? "Expandir" : "Minimizar"}>{minimized ? <Maximize2 className="h-4 w-4" /> : <Minus className="h-4 w-4" />}</button>
            <button className="rounded-md p-1 hover:bg-accent shrink-0" onClick={onClose} aria-label="Fechar" title="Fechar"><X className="h-4 w-4" /></button>
        </div>
        {!minimized && <div className="flex-1 min-h-0 flex flex-col p-3">{children}</div>}
        {!minimized && <div className="absolute bottom-0 right-0 h-4 w-4 cursor-nwse-resize touch-none" onPointerDown={(e) => start(e, "resize")}><div className="absolute bottom-1 right-1 h-2 w-2 border-b-2 border-r-2 border-muted-foreground/50" /></div>}
    </div>
}
