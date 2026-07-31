"use client"

import { FloatingCard } from "@/components/floating/floating-card"
import { PlantaoHistorico, type PlantaoAtendimento, type PlantaoEvent } from "@/components/escala/plantao-timeline"
import { Badge } from "@/components/ui/badge"
import { useAlert } from "@/hooks/use-alert"
import { useAuth } from "@/hooks/use-auth"
import { useEscalaRealtime } from "@/hooks/use-escala-realtime"
import api from "@/services/api"
import { BellRing, Loader2 } from "lucide-react"
import * as React from "react"

type Plantao = { id: string; setor: string; startsAt: string; endsAt: string; status: string; doctorId?: string | null; doctor?: { idUser: string; name: string; especialidade?: string | null } | null }
const STATUS: Record<string, { label: string; cls: string }> = { Aberto: { label: "Disponível", cls: "text-amber-600 border-amber-400" }, Agendado: { label: "Atribuído", cls: "text-blue-600 border-blue-400" }, EmAndamento: { label: "Em andamento", cls: "text-emerald-600 border-emerald-400" }, Concluido: { label: "Concluído", cls: "text-slate-500 border-slate-300" }, Cancelado: { label: "Cancelado", cls: "text-red-600 border-red-400" } }
const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })

export function FloatingPlantaoCard({ id, index = 0, z = 60, onFocus, onClose, onAttendanceLongPress }: { id: string; index?: number; z?: number; onFocus?: () => void; onClose: () => void; onAttendanceLongPress?: (id: string) => void }) {
    const { getPermissions } = useAuth(); const { setAlert } = useAlert()
    const [plantao, setPlantao] = React.useState<Plantao | null>(null); const [history, setHistory] = React.useState<PlantaoEvent[]>([]); const [atendimentos, setAtendimentos] = React.useState<PlantaoAtendimento[]>([]); const [loading, setLoading] = React.useState(true); const [notFound, setNotFound] = React.useState(false); const [notifying, setNotifying] = React.useState(false)
    const isAdmin = !!getPermissions("escala-admin")?.visualizar
    const load = React.useCallback(async () => { try { const [p, h, a] = await Promise.all([api.get(`/admin/escala/${id}`), api.get(`/admin/escala/${id}/historico`), api.get(`/admin/escala/${id}/atendimentos`).catch(() => ({ data: [] }))]); setPlantao(p.data); setHistory(Array.isArray(h.data) ? h.data : []); setAtendimentos(Array.isArray(a.data) ? a.data : []); setNotFound(false) } catch (e: any) { if (e?.response?.status === 404) setNotFound(true) } finally { setLoading(false) } }, [id])
    React.useEffect(() => { setLoading(true); void load() }, [load]); useEscalaRealtime(load, true)
    const canNotify = !!plantao && isAdmin && plantao.status === "Agendado" && !!plantao.doctorId && new Date() >= new Date(plantao.startsAt) && new Date() < new Date(plantao.endsAt)
    const notify = async () => { if (!plantao) return; setNotifying(true); try { await api.post(`/admin/escala/${plantao.id}/notificar-checkin`); setAlert("Solicitação de check-in enviada ao médico.", "success"); await load() } catch (e: any) { setAlert(e.response?.data?.message || "Não foi possível solicitar o check-in.", "error") } finally { setNotifying(false) } }
    const status = plantao ? (STATUS[plantao.status] || { label: plantao.status, cls: "" }) : null
    return <FloatingCard storageKey={`plantao_${id}`} index={index} z={z} title={<span className="flex items-center gap-2">{plantao?.doctor?.name || "Não atribuído"}{status && <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${status.cls}`}>{status.label}</Badge>}</span>} subtitle={plantao && `${plantao.doctor?.especialidade ? `${plantao.doctor.especialidade} · ` : ""}${plantao.setor} · ${fmtTime(plantao.startsAt)}–${fmtTime(plantao.endsAt)}`} actions={canNotify && <button className="rounded-md p-1 text-amber-600 hover:bg-accent disabled:opacity-50" onClick={() => void notify()} disabled={notifying} aria-label="Solicitar check-in" title="Solicitar check-in"><BellRing className="h-4 w-4" /></button>} onFocus={onFocus} onClose={onClose}>
        {loading ? <div className="flex items-center justify-center py-10 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div> : notFound ? <p className="text-sm text-muted-foreground text-center py-10">Plantão não encontrado.</p> : <PlantaoHistorico events={history} atendimentos={atendimentos} onAttendanceLongPress={onAttendanceLongPress} />}
    </FloatingCard>
}
