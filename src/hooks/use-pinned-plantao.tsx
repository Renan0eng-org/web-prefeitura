"use client"

import { FloatingPlantaoCard } from "@/components/escala/floating-plantao-card"
import * as React from "react"

type PinnedCtx = {
    pinnedId: string | null
    pin: (id: string) => void
    unpin: () => void
}

const Ctx = React.createContext<PinnedCtx>({ pinnedId: null, pin: () => { }, unpin: () => { } })

export function usePinnedPlantao() {
    return React.useContext(Ctx)
}

/**
 * Mantém um plantão "fixado" como card flutuante — persiste entre navegações
 * (o provider fica no layout do admin) e sobrevive a reload via localStorage.
 */
export function PinnedPlantaoProvider({ children }: { children: React.ReactNode }) {
    const [pinnedId, setPinnedId] = React.useState<string | null>(null)

    React.useEffect(() => {
        try {
            const v = localStorage.getItem("pinned_plantao_id")
            if (v) setPinnedId(v)
        } catch { /* ignore */ }
    }, [])

    const pin = React.useCallback((id: string) => {
        setPinnedId(id)
        try { localStorage.setItem("pinned_plantao_id", id) } catch { /* ignore */ }
    }, [])

    const unpin = React.useCallback(() => {
        setPinnedId(null)
        try { localStorage.removeItem("pinned_plantao_id") } catch { /* ignore */ }
    }, [])

    return (
        <Ctx.Provider value={{ pinnedId, pin, unpin }}>
            {children}
            {pinnedId && <FloatingPlantaoCard id={pinnedId} onClose={unpin} />}
        </Ctx.Provider>
    )
}
