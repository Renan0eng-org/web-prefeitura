"use client"

import { FloatingPlantaoCard } from "@/components/escala/floating-plantao-card"
import { FloatingAtendimentoCard } from "@/components/escala/floating-atendimento-card"
import * as React from "react"

type PinnedCtx = {
    pinnedIds: string[]
    pin: (id: string) => void
    unpin: (id: string) => void
    attendanceIds: string[]
    floatAttendance: (id: string) => void
    unfloatAttendance: (id: string) => void
}

const Ctx = React.createContext<PinnedCtx>({ pinnedIds: [], pin: () => { }, unpin: () => { }, attendanceIds: [], floatAttendance: () => { }, unfloatAttendance: () => { } })

export function usePinnedPlantao() {
    return React.useContext(Ctx)
}

const STORAGE_KEY = "pinned_plantao_ids"
const ATTENDANCE_STORAGE_KEY = "floating_attendance_ids"

/**
 * Mantém plantões "fixados" como cards flutuantes — persistem entre navegações
 * (o provider fica no layout do admin) e sobrevivem a reload na mesma aba via sessionStorage.
 * Suporta VÁRIOS cards abertos ao mesmo tempo.
 */
const Z_BASE = 60

export function PinnedPlantaoProvider({ children }: { children: React.ReactNode }) {
    const [pinnedIds, setPinnedIds] = React.useState<string[]>([])
    const [attendanceIds, setAttendanceIds] = React.useState<string[]>([])
    // z-index por card p/ o "traga para frente" ao clicar (window manager simples).
    const [zById, setZById] = React.useState<Record<string, number>>({})
    const zCounter = React.useRef(Z_BASE)

    const bringToFront = React.useCallback((id: string) => {
        zCounter.current += 1
        const z = zCounter.current
        setZById((prev) => (prev[id] === z ? prev : { ...prev, [id]: z }))
    }, [])

    React.useEffect(() => {
        try {
            const raw = sessionStorage.getItem(STORAGE_KEY)
            if (raw) {
                const arr = JSON.parse(raw)
                if (Array.isArray(arr)) setPinnedIds(arr.filter((x) => typeof x === "string"))
            } else {
                // Migra o formato antigo (um único id).
                const legacy = sessionStorage.getItem("pinned_plantao_id")
                if (legacy) {
                    setPinnedIds([legacy])
                    sessionStorage.setItem(STORAGE_KEY, JSON.stringify([legacy]))
                    sessionStorage.removeItem("pinned_plantao_id")
                }
            }
        } catch { /* ignore */ }
    }, [])

    React.useEffect(() => {
        try { const raw = sessionStorage.getItem(ATTENDANCE_STORAGE_KEY); if (raw) { const arr = JSON.parse(raw); if (Array.isArray(arr)) setAttendanceIds(arr.filter((x) => typeof x === "string")) } } catch { /* ignore */ }
    }, [])

    const persist = (ids: string[]) => {
        try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(ids)) } catch { /* ignore */ }
    }

    const pin = React.useCallback((id: string) => {
        setPinnedIds((prev) => {
            if (prev.includes(id)) return prev
            const next = [...prev, id]
            persist(next)
            return next
        })
        // Card novo (ou já aberto) vem para a frente.
        bringToFront(id)
    }, [bringToFront])

    const unpin = React.useCallback((id: string) => {
        setPinnedIds((prev) => {
            const next = prev.filter((x) => x !== id)
            persist(next)
            return next
        })
    }, [])

    const floatAttendance = React.useCallback((id: string) => setAttendanceIds((prev) => { if (prev.includes(id)) return prev; const next = [...prev, id]; try { sessionStorage.setItem(ATTENDANCE_STORAGE_KEY, JSON.stringify(next)) } catch { /* ignore */ }; bringToFront(`attendance:${id}`); return next }), [bringToFront])
    const unfloatAttendance = React.useCallback((id: string) => setAttendanceIds((prev) => { const next = prev.filter((x) => x !== id); try { sessionStorage.setItem(ATTENDANCE_STORAGE_KEY, JSON.stringify(next)) } catch { /* ignore */ }; return next }), [])

    return (
        <Ctx.Provider value={{ pinnedIds, pin, unpin, attendanceIds, floatAttendance, unfloatAttendance }}>
            {children}
            {pinnedIds.map((id, i) => (
                <FloatingPlantaoCard
                    key={id}
                    id={id}
                    index={i}
                    z={zById[id] ?? Z_BASE}
                    onFocus={() => bringToFront(id)}
                    onClose={() => unpin(id)}
                    onAttendanceLongPress={floatAttendance}
                />
            ))}
            {attendanceIds.map((id, i) => <FloatingAtendimentoCard key={`attendance-${id}`} id={id} index={i} z={zById[`attendance:${id}`] ?? Z_BASE + 1} onFocus={() => bringToFront(`attendance:${id}`)} onClose={() => unfloatAttendance(id)} />)}
        </Ctx.Provider>
    )
}
