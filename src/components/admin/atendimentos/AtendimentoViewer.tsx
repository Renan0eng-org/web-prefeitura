"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/hooks/use-auth"
import api from "@/services/api"
import { Calendar, ClipboardList, Edit3, FileText, FlaskConical, HeartPulse, Pill, Stethoscope } from "lucide-react"
import { useRouter } from "next/navigation"
import * as React from "react"

const statusLabel: Record<string, string> = { EmAndamento: "Em andamento", Concluido: "Concluído", Cancelado: "Cancelado" }
const dateFmt = (value?: string) => value ? new Date(value).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "—"

export function AtendimentoViewer({ attendanceId, compact = false, onEdit }: { attendanceId: string; compact?: boolean; onEdit?: () => void }) {
    const router = useRouter(); const { getPermissions } = useAuth()
    const canEdit = !!getPermissions("atendimento")?.editar
    const [attendance, setAttendance] = React.useState<any>(null); const [loading, setLoading] = React.useState(true); const [error, setError] = React.useState(false)
    React.useEffect(() => { let active = true; setLoading(true); api.get(`/attendances/${attendanceId}`).then((r) => { if (active) setAttendance(r.data?.data ?? r.data) }).catch(() => active && setError(true)).finally(() => active && setLoading(false)); return () => { active = false } }, [attendanceId])
    if (loading) return <div className="space-y-3"><Skeleton className="h-8 w-2/3" /><Skeleton className="h-24 w-full" /><Skeleton className="h-24 w-full" /></div>
    if (error || !attendance) return <p className="text-sm text-muted-foreground text-center py-8">Atendimento não encontrado.</p>
    const patient = attendance.patient?.name || attendance.patient?.nome || attendance.patientId || "Paciente não informado"
    const notes = (attendance.medicalNotes || []).filter((n: any) => n.content?.trim())
    const section = (title: string, value: any, icon: React.ReactNode) => value ? <div className="space-y-1"><div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">{icon}{title}</div><div className="text-sm whitespace-pre-wrap break-words" dangerouslySetInnerHTML={{ __html: String(value).startsWith("<") ? value : String(value) }} /></div> : null
    return <div className={compact ? "space-y-3 overflow-y-auto pr-1" : "space-y-5 max-w-5xl mx-auto"}>
        <div className="flex items-start justify-between gap-3"><div><div className="flex items-center gap-2"><h1 className={compact ? "text-base font-semibold" : "text-2xl font-bold"}>{patient}</h1><Badge variant="outline">{statusLabel[attendance.status] || attendance.status || "—"}</Badge></div><p className="text-xs text-muted-foreground mt-1"><Calendar className="inline h-3 w-3 mr-1" />{dateFmt(attendance.attendanceDate)}</p></div>{canEdit && <Button size="sm" variant="outline" onClick={onEdit || (() => router.push(`/admin/atendimentos/editar/${attendanceId}`))}><Edit3 className="h-4 w-4 mr-1" />Editar</Button>}</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">{[["Pressão", attendance.bloodPressure], ["F. cardíaca", attendance.heartRate && `${attendance.heartRate} bpm`], ["Temperatura", attendance.temperature && `${attendance.temperature} °C`], ["F. respiratória", attendance.respiratoryRate && `${attendance.respiratoryRate} rpm`]].map(([k, v]) => <div key={String(k)} className="rounded-lg border bg-muted/20 p-2"><div className="text-[11px] text-muted-foreground">{k}</div><div className="font-medium text-sm">{v || "—"}</div></div>)}</div>
        <div className="space-y-4">{section("Queixa principal", attendance.chiefComplaint, <Stethoscope className="h-3.5 w-3.5" />)}{section("Histórico", attendance.medicalHistory, <ClipboardList className="h-3.5 w-3.5" />)}{section("Exame físico", attendance.physicalExamination, <HeartPulse className="h-3.5 w-3.5" />)}{section("Diagnóstico", attendance.diagnosis, <FileText className="h-3.5 w-3.5" />)}{section("Tratamento", attendance.treatment, <Stethoscope className="h-3.5 w-3.5" />)}</div>
        {notes.length > 0 && <div className="space-y-3"><h2 className="text-sm font-semibold flex items-center gap-2"><FileText className="h-4 w-4" />Notas médicas</h2>{notes.map((n: any) => <div key={n.id || n.order} className="rounded-lg border p-3"><div className="text-xs font-semibold text-muted-foreground mb-1">{n.title || "Nota"}</div><div className="text-sm whitespace-pre-wrap break-words" dangerouslySetInnerHTML={{ __html: n.content }} /></div>)}</div>}
        {(attendance.prescriptions?.length > 0 || attendance.examRequests?.length > 0) && <div className="grid md:grid-cols-2 gap-3">{attendance.prescriptions?.length > 0 && <div className="rounded-lg border p-3 space-y-2"><h2 className="text-sm font-semibold flex items-center gap-2"><Pill className="h-4 w-4" />Prescrições</h2>{attendance.prescriptions.map((p: any) => <div key={p.id} className="text-sm"><b>{p.medication}</b> — {p.dosage || "dose não informada"}<div className="text-xs text-muted-foreground">{p.frequency} {p.duration && `· ${p.duration}`}</div></div>)}</div>}{attendance.examRequests?.length > 0 && <div className="rounded-lg border p-3 space-y-2"><h2 className="text-sm font-semibold flex items-center gap-2"><FlaskConical className="h-4 w-4" />Exames</h2>{attendance.examRequests.map((e: any) => <div key={e.id} className="text-sm"><b>{e.name}</b>{e.instructions && <div className="text-xs text-muted-foreground">{e.instructions}</div>}</div>)}</div>}</div>}
    </div>
}
