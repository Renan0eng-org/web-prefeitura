"use client"

import { FloatingCard } from "@/components/floating/floating-card"
import { AtendimentoViewer } from "@/components/admin/atendimentos/AtendimentoViewer"
import { useRouter } from "next/navigation"
import * as React from "react"

export function FloatingAtendimentoCard({ id, index = 0, z = 70, onFocus, onClose }: { id: string; index?: number; z?: number; onFocus?: () => void; onClose: () => void }) {
    const router = useRouter()
    return <FloatingCard storageKey={`atendimento_${id}`} index={index} z={z} title="Atendimento" subtitle="Visualização detalhada" onFocus={onFocus} onClose={onClose}>
        <AtendimentoViewer attendanceId={id} compact onEdit={() => router.push(`/admin/atendimentos/editar/${id}`)} />
    </FloatingCard>
}
