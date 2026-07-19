"use client"

import BtnVoltar from "@/components/buttons/btn-voltar"
import { MedicalNotesEditor, type MedicalNote } from "@/components/medical-notes-editor"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { SearchableSelect } from "@/components/ui/searchable-select"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { useAlert } from "@/hooks/use-alert"
import { useAuth } from "@/hooks/use-auth"
import api from "@/services/api"
import { AttendanceStatus } from "@/types/attendance"
import {
    Activity, AlertTriangle, Calendar, ClipboardCheck, ClipboardList,
    FlaskConical, Loader2, Pencil, Pill, Plus, Save, ShieldCheck, Trash2
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"

// Helper para formatar data no timezone local
const formatDateToLocal = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    const hours = String(date.getHours()).padStart(2, "0")
    const minutes = String(date.getMinutes()).padStart(2, "0")
    return `${year}-${month}-${day}T${hours}:${minutes}`
}

type ScreeningForm = {
    idForm: string
    title: string
    description?: string
    questions?: any[]
}

// Prescrição em edição (sem id = ainda não salva).
type PrescriptionItem = {
    id?: string
    medication: string
    dosage: string
    frequency: string
    duration: string
    instructions?: string
}
// Exame em edição (sem id = ainda não solicitado).
type ExamItem = {
    id?: string
    name: string
    instructions?: string
}

const emptyPrescription: PrescriptionItem = { medication: "", dosage: "", frequency: "", duration: "", instructions: "" }
const emptyExam: ExamItem = { name: "", instructions: "" }

// Formata a pressão arterial inserindo a "/" automaticamente (ex.: 12080 -> 120/80).
// Respeita a "/" digitada manualmente (ex.: 120/100).
function formatBloodPressure(raw: string): string {
    const digits = (raw || "").replace(/\D/g, "").slice(0, 6)

    if (digits.length <= 3) {
        return digits
    }

    const sys = digits.slice(0, 3)
    const dia = digits.slice(3)

    return `${Number(sys)}/${dia}`
}

// Extrai o número inicial de uma string (ex.: "8 em 8 h" -> "8", "7 dias" -> "7").
function leadingNumber(s: string): string {
    const m = (s || "").match(/\d+([.,]\d+)?/)
    return m ? m[0].replace(",", ".") : ""
}

interface CriarAtendimentoViewProps {
    appointmentId?: string
    attendanceId?: string
    /** Paciente pré-selecionado (ex.: senha avulsa da fila, sem agendamento). */
    patientId?: string
    /** Senha da fila de origem — ao salvar, a senha é concluída automaticamente. */
    ticketId?: string
}

export default function CriarAtendimentoView({ appointmentId, attendanceId, patientId, ticketId }: CriarAtendimentoViewProps) {
    const router = useRouter()
    const { setAlert } = useAlert()
    const { user, getPermissions } = useAuth()

    // Form data
    const [formData, setFormData] = useState({
        patientId: patientId || "",
        professionalId: user?.idUser || "",
        attendanceDate: formatDateToLocal(new Date()),
        bloodPressure: "",
        heartRate: "",
        temperature: "",
        respiratoryRate: "",
        status: AttendanceStatus.EmAndamento,
    })

    const atendimentoPerm = useMemo(() => getPermissions ? getPermissions('atendimento') : null, [getPermissions])
    // Nível de acesso próprio para melhoria de notas por IA.
    const aiEnabled = useMemo(() => !!(getPermissions && getPermissions('atendimento-ia')?.visualizar), [getPermissions])

    const [medicalNotes, setMedicalNotes] = useState<MedicalNote[]>([])
    const [patients, setPatients] = useState<any[]>([])
    const [screeningForms, setScreeningForms] = useState<ScreeningForm[]>([])
    const [selectedFormIds, setSelectedFormIds] = useState<Record<string, boolean>>({})
    const [assignedFormIds, setAssignedFormIds] = useState<Record<string, boolean>>({})
    const [originalAssignedFormIds, setOriginalAssignedFormIds] = useState<Record<string, boolean>>({})
    const [existingResponseIdByForm, setExistingResponseIdByForm] = useState<Record<string, string>>({})
    const [answersByForm, setAnswersByForm] = useState<Record<string, any>>({})

    // Prescrições e exames (novas seções).
    const [prescriptions, setPrescriptions] = useState<PrescriptionItem[]>([])
    const [originalPrescriptions, setOriginalPrescriptions] = useState<PrescriptionItem[]>([])
    const [exams, setExams] = useState<ExamItem[]>([])
    const [originalExams, setOriginalExams] = useState<ExamItem[]>([])

    // Dialogs de prescrição/exame.
    const [prescDialog, setPrescDialog] = useState<{ open: boolean; index: number | null; draft: PrescriptionItem }>({ open: false, index: null, draft: emptyPrescription })
    const [examDialog, setExamDialog] = useState<{ open: boolean; index: number | null; draft: ExamItem }>({ open: false, index: null, draft: emptyExam })

    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [appointmentData, setAppointmentData] = useState<any>(null)

    // Load initial data
    useEffect(() => {
        const loadData = async () => {
            try {
                setIsLoading(true)
                if (attendanceId) {
                    const attRes = await api.get(`/attendances/${attendanceId}`)
                    const att = attRes.data?.data ?? attRes.data
                    setFormData((prev) => ({
                        ...prev,
                        patientId: att.patientId || att.userId || prev.patientId || "",
                        professionalId: att.professionalId || prev.professionalId || "",
                        attendanceDate: att.attendanceDate ? formatDateToLocal(new Date(att.attendanceDate)) : prev.attendanceDate,
                        bloodPressure: att.bloodPressure || prev.bloodPressure || "",
                        heartRate: att.heartRate ? String(att.heartRate) : prev.heartRate || "",
                        temperature: att.temperature ? String(att.temperature) : prev.temperature || "",
                        respiratoryRate: att.respiratoryRate ? String(att.respiratoryRate) : prev.respiratoryRate || "",
                        status: att.status || prev.status,
                    }))

                    if (att.medicalNotes && Array.isArray(att.medicalNotes) && att.medicalNotes.length > 0) {
                        setMedicalNotes(att.medicalNotes)
                    }

                    // Prescrições já salvas
                    const presc: PrescriptionItem[] = Array.isArray(att.prescriptions)
                        ? att.prescriptions.map((p: any) => ({
                            id: p.id, medication: p.medication ?? "", dosage: p.dosage ?? "",
                            frequency: p.frequency ?? "", duration: p.duration ?? "", instructions: p.instructions ?? "",
                        }))
                        : []
                    setPrescriptions(presc)
                    setOriginalPrescriptions(presc)

                    // Exames já solicitados vinculados a este atendimento
                    try {
                        const exRes = await api.get('/exam-requests', { params: { attendanceId } })
                        const exList = (Array.isArray(exRes.data) ? exRes.data : exRes.data?.data ?? [])
                            .map((e: any) => ({ id: e.id, name: e.name ?? "", instructions: e.instructions ?? "" }))
                        setExams(exList)
                        setOriginalExams(exList)
                    } catch { /* exames são secundários no carregamento */ }

                    const fromAssigned = att.assignedForms || att.fromAssigned || []
                    const assigned: Record<string, boolean> = {}
                    if (Array.isArray(fromAssigned)) {
                        fromAssigned.forEach((f: any) => {
                            if (f && f.idForm) assigned[f.idForm] = true
                            else if (typeof f === 'string') assigned[f] = true
                        })
                    }
                    setAssignedFormIds(assigned)
                    setOriginalAssignedFormIds(assigned)

                    if (Array.isArray(fromAssigned) && fromAssigned.length > 0) {
                        setScreeningForms(prev => {
                            const existing = prev || []
                            const existingIds = new Set(existing.map(e => e.idForm))
                            const merged = [...existing]
                            fromAssigned.forEach((f: any) => { if (!existingIds.has(f.idForm)) merged.push(f) })
                            return merged
                        })
                    }

                    const formResponsesRaw = att.formResponses || att.responses || []
                    if (Array.isArray(formResponsesRaw) && formResponsesRaw.length > 0) {
                        const answersMap: Record<string, Record<string, any>> = {}
                        const selected: Record<string, boolean> = {}
                        const existingMap: Record<string, string> = {}
                        formResponsesRaw.forEach((item: any) => {
                            const resp = item?.response ? item.response : item
                            const formId = resp.form?.idForm || resp.formId || resp.form?.id
                            if (!formId) return
                            selected[formId] = true
                            answersMap[formId] = answersMap[formId] || {}
                            const respId = resp.id || resp.idResponse || resp.responseId || resp._id
                            if (respId) existingMap[formId] = respId
                                ; (resp.answers || []).forEach((a: any) => {
                                    const qKey = a.question?.idQuestion || a.question?.id || a.questionId
                                    if (qKey === undefined || qKey === null) return
                                    if (a.value !== null && a.value !== undefined) answersMap[formId][qKey] = a.value
                                    else if (a.values !== null && a.values !== undefined) answersMap[formId][qKey] = a.values
                                })
                        })
                        setAnswersByForm(prev => ({ ...(prev || {}), ...(answersMap || {}) }))
                        setExistingResponseIdByForm(prev => ({ ...(prev || {}), ...(existingMap || {}) }))
                        setSelectedFormIds(prev => ({ ...(prev || {}), ...(selected || {}) }))
                    }
                } else if (appointmentId) {
                    const apptRes = await api.get(`/appointments/${appointmentId}`)
                    const appt = apptRes.data?.data ?? apptRes.data
                    setAppointmentData(appt)
                    setFormData((prev) => ({
                        ...prev,
                        patientId: appt.patientId || prev.patientId || "",
                        professionalId: user?.idUser || prev.professionalId || "",
                        attendanceDate: appt.scheduledAt ? formatDateToLocal(new Date(appt.scheduledAt)) : prev.attendanceDate,
                    }))

                    const fromAssigned = appt.fromAssigned || appt.assignedForms || []
                    const assigned: Record<string, boolean> = {}
                    if (Array.isArray(fromAssigned)) {
                        fromAssigned.forEach((f: any) => {
                            if (f && f.idForm) assigned[f.idForm] = true
                            else if (typeof f === 'string') assigned[f] = true
                        })
                    }
                    setAssignedFormIds(assigned)
                    setOriginalAssignedFormIds(assigned)

                    if (Array.isArray(fromAssigned) && fromAssigned.length > 0) {
                        setScreeningForms(prev => {
                            const existing = prev || []
                            const existingIds = new Set(existing.map(e => e.idForm))
                            const merged = [...existing]
                            fromAssigned.forEach((f: any) => { if (!existingIds.has(f.idForm)) merged.push(f) })
                            return merged
                        })
                    }

                    const formResponsesRaw = appt.formResponses || []
                    if (Array.isArray(formResponsesRaw) && formResponsesRaw.length > 0) {
                        const answersMap: Record<string, Record<string, any>> = {}
                        const selected: Record<string, boolean> = {}
                        const existingMap: Record<string, string> = {}
                        formResponsesRaw.forEach((item: any) => {
                            const resp = item?.response ? item.response : item
                            const formId = resp.form?.idForm || resp.formId || resp.form?.id
                            if (!formId) return
                            selected[formId] = true
                            answersMap[formId] = answersMap[formId] || {}
                            const respId = resp.id || resp.idResponse || resp.responseId || resp._id
                            if (respId) existingMap[formId] = respId
                                ; (resp.answers || []).forEach((a: any) => {
                                    const qKey = a.question?.idQuestion || a.question?.id || a.questionId
                                    if (qKey === undefined || qKey === null) return
                                    if (a.value !== null && a.value !== undefined) answersMap[formId][qKey] = a.value
                                    else if (a.values !== null && a.values !== undefined) answersMap[formId][qKey] = a.values
                                })
                        })
                        setAnswersByForm(prev => ({ ...(prev || {}), ...(answersMap || {}) }))
                        setExistingResponseIdByForm(prev => ({ ...(prev || {}), ...(existingMap || {}) }))
                        setSelectedFormIds(prev => ({ ...(prev || {}), ...(selected || {}) }))
                    }
                }

                const [patientsRes, formsRes] = await Promise.all([
                    api.get("/patients?pageSize=1000"),
                    api.get("/forms/screenings"),
                ])
                const patientsList = patientsRes.data?.data ?? patientsRes.data ?? []
                const formsList = formsRes.data?.forms ?? formsRes.data ?? []
                setPatients(Array.isArray(patientsList) ? patientsList : [])
                setScreeningForms(prev => {
                    const base = Array.isArray(formsList) ? formsList : []
                    const existingIds = new Set(prev.map(e => e.idForm))
                    const merged = [...prev]
                    base.forEach((f: any) => { if (!existingIds.has(f.idForm)) merged.push(f) })
                    return merged.length ? merged : base
                })
            } catch (err: any) {
                if (err?.response?.data?.message && Array.isArray(err.response.data.message)) {
                    setAlert(err.response.data.message.join(' '), 'error')
                } else if (err?.response?.data?.message) {
                    setAlert(err.response.data.message, "error")
                } else {
                    setAlert("Erro ao carregar dados.", "error")
                }
            } finally {
                setIsLoading(false)
            }
        }
        loadData()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [appointmentId, attendanceId])

    const handleInputChange = (field: string, value: string) => setFormData((prev) => ({ ...prev, [field]: value }))

    const toggleSelectForm = (formId: string) => {
        setSelectedFormIds(prev => {
            const next = { ...prev, [formId]: !prev[formId] }
            if (next[formId]) setAssignedFormIds(a => ({ ...a, [formId]: false }))
            return next
        })
    }
    const toggleAssignForm = (formId: string) => {
        setAssignedFormIds(prev => {
            const next = { ...prev, [formId]: !prev[formId] }
            if (next[formId]) setSelectedFormIds(s => ({ ...s, [formId]: false }))
            return next
        })
    }
    const setAnswer = (formId: string, questionId: string, value: any) => {
        setAnswersByForm(prev => ({ ...prev, [formId]: { ...(prev[formId] || {}), [questionId]: value } }))
    }

    // ---- Prescrições ----
    const openNewPresc = () => setPrescDialog({ open: true, index: null, draft: { ...emptyPrescription } })
    const openEditPresc = (i: number) => setPrescDialog({ open: true, index: i, draft: { ...prescriptions[i] } })
    const savePresc = () => {
        const d = prescDialog.draft
        if (!d.medication.trim() || !d.dosage.trim() || !d.frequency.trim() || !d.duration.trim()) {
            return setAlert("Preencha medicamento, quantidade, frequência e duração.", "error")
        }
        setPrescriptions(prev => {
            const next = [...prev]
            if (prescDialog.index === null) next.push(d)
            else next[prescDialog.index] = d
            return next
        })
        setPrescDialog({ open: false, index: null, draft: emptyPrescription })
    }
    const removePresc = (i: number) => setPrescriptions(prev => prev.filter((_, idx) => idx !== i))

    // ---- Exames ----
    const openNewExam = () => setExamDialog({ open: true, index: null, draft: { ...emptyExam } })
    const openEditExam = (i: number) => setExamDialog({ open: true, index: i, draft: { ...exams[i] } })
    const saveExam = () => {
        const d = examDialog.draft
        if (!d.name.trim()) return setAlert("Informe o nome do exame.", "error")
        setExams(prev => {
            const next = [...prev]
            if (examDialog.index === null) next.push(d)
            else next[examDialog.index] = d
            return next
        })
        setExamDialog({ open: false, index: null, draft: emptyExam })
    }
    const removeExam = (i: number) => setExams(prev => prev.filter((_, idx) => idx !== i))

    // Persiste prescrições (create/update/delete) contra o backend.
    const syncPrescriptions = async (attId: string) => {
        const currentIds = new Set(prescriptions.filter(p => p.id).map(p => p.id))
        const toDelete = originalPrescriptions.filter(p => p.id && !currentIds.has(p.id))
        const ops: Promise<any>[] = []
        for (const p of prescriptions) {
            const body = { medication: p.medication, dosage: p.dosage, frequency: p.frequency, duration: p.duration, instructions: p.instructions || undefined }
            if (!p.id) ops.push(api.post(`/attendances/${attId}/prescriptions`, body))
            else {
                const orig = originalPrescriptions.find(o => o.id === p.id)
                const changed = orig && (orig.medication !== p.medication || orig.dosage !== p.dosage || orig.frequency !== p.frequency || orig.duration !== p.duration || (orig.instructions || "") !== (p.instructions || ""))
                if (changed) ops.push(api.put(`/attendances/${attId}/prescriptions/${p.id}`, body))
            }
        }
        for (const p of toDelete) ops.push(api.delete(`/attendances/${attId}/prescriptions/${p.id}`))
        const results = await Promise.allSettled(ops)
        const failed = results.filter(r => r.status === 'rejected').length
        if (failed > 0) setAlert(`${failed} prescrição(ões) não puderam ser salvas.`, 'warning')
    }

    // Persiste exames: cria os novos em lote, remove os retirados.
    const syncExams = async (attId: string) => {
        const currentIds = new Set(exams.filter(e => e.id).map(e => e.id))
        const toDelete = originalExams.filter(e => e.id && !currentIds.has(e.id))
        const toCreate = exams.filter(e => !e.id)
        const ops: Promise<any>[] = []
        if (toCreate.length > 0) {
            ops.push(api.post('/exam-requests', {
                patientId: formData.patientId,
                attendanceId: attId,
                appointmentId: appointmentId || undefined,
                items: toCreate.map(e => ({ name: e.name, instructions: e.instructions || undefined })),
            }))
        }
        for (const e of toDelete) ops.push(api.delete(`/exam-requests/${e.id}`))
        const results = await Promise.allSettled(ops)
        const failed = results.filter(r => r.status === 'rejected').length
        if (failed > 0) setAlert(`${failed} solicitação(ões) de exame não puderam ser salvas.`, 'warning')
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const hasValidNote = medicalNotes.some(note => note.content && note.content.trim() !== "")
        if (!formData.patientId || !formData.professionalId || !formData.attendanceDate || !hasValidNote) {
            setAlert("Preencha paciente, data e ao menos uma nota clínica.", "error")
            return
        }

        try {
            setIsSubmitting(true)
            const payload = {
                patientId: formData.patientId,
                professionalId: formData.professionalId,
                attendanceDate: formData.attendanceDate,
                bloodPressure: formData.bloodPressure || undefined,
                heartRate: formData.heartRate ? parseInt(formData.heartRate) : undefined,
                temperature: formData.temperature ? parseFloat(formData.temperature) : undefined,
                respiratoryRate: formData.respiratoryRate ? parseInt(formData.respiratoryRate) : undefined,
                status: formData.status,
                medicalNotes: medicalNotes.filter(note => note.content && note.content.trim() !== ""),
            }

            let savedAttendanceId = attendanceId
            if (savedAttendanceId) {
                await api.put(`/attendances/${savedAttendanceId}`, payload)
            } else {
                const res = await api.post("/attendances", payload)
                savedAttendanceId = res.data?.id ?? res.data?.data?.id
            }
            if (!savedAttendanceId) throw new Error("Não foi possível obter o atendimento salvo.")

            // Prescrições e exames
            await syncPrescriptions(savedAttendanceId)
            await syncExams(savedAttendanceId)

            // ----- Formulários (responder / atribuir) -----
            const responseFormIds = Object.keys(existingResponseIdByForm || {}).filter(k => existingResponseIdByForm[k])
            const toDeleteResponseFormIds = responseFormIds.filter(id => !selectedFormIds[id])
            if (toDeleteResponseFormIds.length > 0 && formData.patientId) {
                const deleteResults = await Promise.allSettled(
                    toDeleteResponseFormIds.map((formId) => api.delete(`/forms/${formId}/responses/${existingResponseIdByForm[formId]}`))
                )
                const deleteFailed = deleteResults.filter(r => r.status === 'rejected')
                if (deleteFailed.length > 0) setAlert(`${deleteFailed.length} exclusão(ões) de resposta falharam.`, 'warning')
                setExistingResponseIdByForm(prev => {
                    const next = { ...(prev || {}) }
                    toDeleteResponseFormIds.forEach(id => delete next[id])
                    return next
                })
            }

            const formsToRespond = (screeningForms || []).filter((f) => selectedFormIds[f.idForm])
            const invalidForms: string[] = []
            const validForms = formsToRespond.filter((form) => {
                const questions = form.questions || []
                const answersMap = answersByForm[form.idForm] || {}
                for (const q of questions) {
                    if (q.required) {
                        const val = answersMap[q.idQuestion]
                        if (val === undefined || val === null) { invalidForms.push(form.title || form.idForm); return false }
                        if (Array.isArray(val) && val.length === 0) { invalidForms.push(form.title || form.idForm); return false }
                        if (!Array.isArray(val) && String(val).trim() === '') { invalidForms.push(form.title || form.idForm); return false }
                    }
                }
                return true
            })
            if (invalidForms.length > 0) {
                setAlert(`Formulários com campos obrigatórios não preenchidos: ${invalidForms.join(', ')}.`, 'warning', 8000)
            }
            if (validForms.length > 0) {
                const submitResults = await Promise.allSettled(validForms.map(async (form) => {
                    const answersMap = answersByForm[form.idForm] || {}
                    const answersPayload = Object.entries(answersMap).map(([questionId, answerValue]) =>
                        Array.isArray(answerValue) ? { questionId, values: answerValue } : { questionId, value: answerValue })
                    const respPayload: any = { answers: answersPayload }
                    if (formData.patientId) respPayload.userId = formData.patientId
                    if (savedAttendanceId) respPayload.attendanceId = savedAttendanceId
                    const existingRespId = existingResponseIdByForm[form.idForm]
                    if (existingRespId) return api.put(`/forms/${form.idForm}/responses/${existingRespId}`, respPayload)
                    return api.post(`/forms/${form.idForm}/responses`, respPayload)
                }))
                const failed = submitResults.filter(r => r.status === 'rejected')
                if (failed.length > 0) setAlert(`${failed.length} formulário(s) não puderam ser respondidos.`, 'warning')
            }

            const formsToAssign = (screeningForms || []).filter((f) => assignedFormIds[f.idForm])
            const originalAssignedIds = Object.keys(originalAssignedFormIds || {}).filter(k => originalAssignedFormIds[k])
            const currentAssignedIds = Object.keys(assignedFormIds || {}).filter(k => assignedFormIds[k])
            const toUnassignIds = originalAssignedIds.filter(id => !currentAssignedIds.includes(id))
            if (formsToAssign.length > 0 && savedAttendanceId) {
                const assignResults = await Promise.allSettled(formsToAssign.map((form) => api.post(`/attendances/${savedAttendanceId}/assign-forms`, { formIds: [form.idForm] })))
                const assignFailed = assignResults.filter(r => r.status === 'rejected')
                if (assignFailed.length > 0) setAlert(`${assignFailed.length} atribuição(ões) falharam.`, 'warning')
            }
            if (toUnassignIds.length > 0 && savedAttendanceId) {
                const unassignResults = await Promise.allSettled(toUnassignIds.map((formId) => api.post(`/attendances/${savedAttendanceId}/unassign-forms`, { formIds: [formId] })))
                const unassignFailed = unassignResults.filter(r => r.status === 'rejected')
                if (unassignFailed.length > 0) setAlert(`${unassignFailed.length} desatribuição(ões) falharam.`, 'warning')
            }

            // ----- Concluir a senha da fila de origem (auto-mover para "Concluídos hoje") -----
            if (ticketId) {
                try {
                    await api.post(`/admin/fila/${ticketId}/concluir`, {})
                } catch {
                    setAlert("Atendimento salvo, mas não foi possível concluir a senha da fila.", "warning")
                }
                setAlert("Atendimento concluído e senha movida para Concluídos.", "success")
                setTimeout(() => router.push("/admin/fila"), 500)
                return
            }

            setAlert(attendanceId ? "Atendimento atualizado com sucesso." : "Atendimento criado com sucesso.", "success")
            setTimeout(() => router.back(), 500)
        } catch (err: any) {
            if (err?.response?.data?.message && Array.isArray(err.response.data.message)) {
                setAlert(err.response.data.message.join(' '), 'error')
            } else if (err?.response?.data?.message) {
                setAlert(err.response.data.message, "error")
            } else {
                setAlert(err?.message || "Erro ao salvar atendimento.", "error")
            }
        } finally {
            setIsSubmitting(false)
        }
    }

    if ((!atendimentoPerm?.editar && attendanceId) || (!atendimentoPerm?.criar && !attendanceId)) {
        router.push(`/admin`)
    }

    const selectedPatient = patients.find(p => (p.idUser || p.id) === formData.patientId)
    const patientName = selectedPatient?.name || selectedPatient?.nome || appointmentData?.patient?.name || "Selecione o paciente"
    const initials = (patientName || "?").split(" ").filter(Boolean).slice(0, 2).map((s: string) => s[0]).join("").toUpperCase() || "?"
    const notesFilled = medicalNotes.filter(n => n.content && n.content.trim() !== "").length
    const respondCount = Object.values(selectedFormIds).filter(Boolean).length
    const assignCount = Object.values(assignedFormIds).filter(Boolean).length
    const primaryLabel = ticketId ? "Salvar e concluir senha" : attendanceId ? "Salvar alterações" : "Salvar atendimento"

    if (isLoading) {
        return (
            <div className="mx-auto max-w-6xl px-3 sm:px-6 pt-10 pb-16">
                <Skeleton className="h-8 w-56 mb-6" />
                <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-6">
                    <div className="space-y-5">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-40 w-full rounded-xl" />)}</div>
                    <Skeleton className="h-64 w-full rounded-xl" />
                </div>
            </div>
        )
    }

    return (
        <div className="mx-auto max-w-6xl px-3 sm:px-6 pt-8 pb-16">
            <BtnVoltar />
            <div className="mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{attendanceId ? "Editar atendimento" : "Novo atendimento"}</h1>
                {appointmentData && (
                    <p className="text-sm text-muted-foreground mt-1">
                        A partir do agendamento de{" "}
                        <span className="text-foreground font-medium">
                            {new Date(appointmentData.scheduledAt).toLocaleString("pt-BR", { weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </span>
                        {appointmentData.modality ? ` · ${appointmentData.modality}` : ""}
                    </p>
                )}
                {ticketId && !appointmentData && (
                    <p className="text-sm text-muted-foreground mt-1">Ao salvar, a senha da fila será concluída automaticamente.</p>
                )}
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-6 items-start">
                {/* ===================== COLUNA PRINCIPAL ===================== */}
                <div className="flex flex-col gap-5 min-w-0">

                    {/* Contexto do paciente */}
                    <section className="bg-card rounded-xl border shadow-sm p-4 sm:p-5">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-full bg-primary/10 text-primary grid place-items-center font-bold text-lg shrink-0">{initials}</div>
                            <div className="min-w-0">
                                <h3 className="text-base font-bold truncate">{patientName}</h3>
                                <div className="text-xs text-muted-foreground mt-0.5 flex flex-wrap gap-x-3 gap-y-1">
                                    {selectedPatient?.cpf && <span>CPF {selectedPatient.cpf}</span>}
                                    {selectedPatient?.email && <span className="truncate">{selectedPatient.email}</span>}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Dados do atendimento */}
                    <SectionCard icon={<Calendar className="w-4 h-4" />} title="Dados do atendimento" desc="Paciente, data e situação">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="grid gap-1.5">
                                <Label>Paciente <span className="text-destructive">*</span></Label>
                                <SearchableSelect
                                    items={patients.map((p) => ({ value: p.idUser || p.id, label: p.name || p.nome || p.idUser }))}
                                    value={formData.patientId}
                                    onValueChange={(value) => handleInputChange("patientId", value)}
                                    placeholder="Selecionar paciente"
                                    searchPlaceholder="Buscar paciente..."
                                />
                            </div>
                            <div className="grid gap-1.5">
                                <Label htmlFor="attendanceDate">Data e hora <span className="text-destructive">*</span></Label>
                                <Input id="attendanceDate" type="datetime-local" value={formData.attendanceDate} className="text-sm" onChange={(e) => handleInputChange("attendanceDate", e.target.value)} />
                            </div>
                            <div className="grid gap-1.5">
                                <Label htmlFor="status">Status</Label>
                                <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                                    <SelectTrigger id="status"><SelectValue placeholder="Selecionar status" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={AttendanceStatus.EmAndamento}>Em andamento</SelectItem>
                                        <SelectItem value={AttendanceStatus.Concluido}>Concluído</SelectItem>
                                        <SelectItem value={AttendanceStatus.Cancelado}>Cancelado</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </SectionCard>

                    {/* Sinais vitais */}
                    <SectionCard icon={<Activity className="w-4 h-4" />} title="Sinais vitais" desc="Aferições desta consulta">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <VitalInput label="Pressão arterial" unit="mmHg" placeholder="120/80" value={formData.bloodPressure} onChange={(v) => handleInputChange("bloodPressure", formatBloodPressure(v))} />
                            <VitalInput label="Freq. cardíaca" unit="bpm" type="number" placeholder="—" value={formData.heartRate} onChange={(v) => handleInputChange("heartRate", v)} />
                            <VitalInput label="Temperatura" unit="°C" type="number" step="0.1" placeholder="—" value={formData.temperature} onChange={(v) => handleInputChange("temperature", v)} />
                            <VitalInput label="Freq. respiratória" unit="rpm" type="number" placeholder="—" value={formData.respiratoryRate} onChange={(v) => handleInputChange("respiratoryRate", v)} />
                        </div>
                    </SectionCard>

                    {/* Avaliação clínica (notas médicas em abas) */}
                    <MedicalNotesEditor medicalNotes={medicalNotes} onChange={setMedicalNotes} aiEnabled={aiEnabled} />

                    {/* Prescrição de medicamentos */}
                    <SectionCard
                        icon={<Pill className="w-4 h-4" />}
                        title="Prescrição de medicamentos"
                        desc="Enviado ao app do paciente com lembretes de dose"
                        right={<Badge variant="secondary">{prescriptions.length} {prescriptions.length === 1 ? "item" : "itens"}</Badge>}
                    >
                        {prescriptions.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Nenhum medicamento adicionado.</p>
                        ) : (
                            <div className="space-y-3">
                                {prescriptions.map((p, i) => (
                                    <div key={p.id || i} className="rounded-lg border p-3.5">
                                        <div className="flex items-start gap-2">
                                            <div className="min-w-0">
                                                <div className="font-semibold">{p.medication}</div>
                                            </div>
                                            <div className="ml-auto flex items-center gap-1">
                                                {p.duration && <Badge variant="secondary" className="text-red-700 bg-red-100 dark:text-red-300 dark:bg-red-950">{p.duration}</Badge>}
                                                <Button type="button" size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEditPresc(i)}><Pencil className="w-3.5 h-3.5" /></Button>
                                                <Button type="button" size="icon" variant="ghost" className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive" onClick={() => removePresc(i)}><Trash2 className="w-3.5 h-3.5" /></Button>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3">
                                            <KV k="Quantidade" v={p.dosage} />
                                            <KV k="Frequência" v={p.frequency} />
                                            <KV k="Duração" v={p.duration} />
                                            {p.instructions && <div className="col-span-2 sm:col-span-3"><KV k="Modo de uso" v={p.instructions} /></div>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <Button type="button" variant="outline" className="w-full mt-3 border-dashed" onClick={openNewPresc}><Plus className="w-4 h-4" />Adicionar medicamento</Button>
                    </SectionCard>

                    {/* Solicitação de exames */}
                    <SectionCard
                        icon={<FlaskConical className="w-4 h-4" />}
                        title="Solicitação de exames"
                        desc="O paciente anexa os resultados até o retorno"
                        right={<Badge variant="secondary">{exams.length} {exams.length === 1 ? "item" : "itens"}</Badge>}
                    >
                        {exams.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Nenhum exame solicitado.</p>
                        ) : (
                            <div className="space-y-2.5">
                                {exams.map((ex, i) => (
                                    <div key={ex.id || i} className="flex items-center gap-3 rounded-lg border p-3">
                                        <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary grid place-items-center shrink-0"><FlaskConical className="w-4 h-4" /></div>
                                        <div className="min-w-0">
                                            <div className="text-sm font-semibold truncate">{ex.name}</div>
                                            {ex.instructions && <div className="text-xs text-muted-foreground truncate">{ex.instructions}</div>}
                                        </div>
                                        <div className="ml-auto flex items-center gap-1">
                                            {ex.id && <Badge variant="outline" className="text-[10px]">Solicitado</Badge>}
                                            <Button type="button" size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEditExam(i)}><Pencil className="w-3.5 h-3.5" /></Button>
                                            <Button type="button" size="icon" variant="ghost" className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive" onClick={() => removeExam(i)}><Trash2 className="w-3.5 h-3.5" /></Button>
                                        </div>
                                    </div>
                                ))}
                                </div>
                        )}
                        <Button type="button" variant="outline" className="w-full mt-3 border-dashed" onClick={openNewExam}><Plus className="w-4 h-4" />Adicionar exame</Button>
                    </SectionCard>

                    {/* Formulários do sistema */}
                    {screeningForms.length > 0 && (
                        <SectionCard icon={<ClipboardCheck className="w-4 h-4" />} title="Formulários do sistema" desc="Responder agora ou atribuir para o paciente responder">
                            <div className="space-y-3">
                                {screeningForms.map((form) => (
                                    <div key={form.idForm} className="border rounded-lg p-3">
                                        <div className="flex items-center justify-between sm:flex-row flex-col sm:gap-0 gap-2">
                                            <div>
                                                <div className="font-semibold">{form.title}</div>
                                                {form.description && <div className="text-sm text-muted-foreground">{form.description}</div>}
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                                                    <Checkbox checked={!!selectedFormIds[form.idForm]} onCheckedChange={() => toggleSelectForm(form.idForm)} />
                                                    Responder
                                                </label>
                                                <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                                                    <Checkbox checked={!!assignedFormIds[form.idForm]} onCheckedChange={() => toggleAssignForm(form.idForm)} />
                                                    Atribuir
                                                </label>
                                            </div>
                                        </div>
                                        {selectedFormIds[form.idForm] && (
                                            <div className="mt-3 space-y-2 border-t pt-3">
                                                {form.questions && form.questions.length > 0 ? (
                                                    form.questions.map((q: any) => (
                                                        <div key={q.idQuestion} className="flex flex-col">
                                                            <label className="font-medium text-sm">{q.text}{q.required && <span className="text-destructive"> *</span>}</label>
                                                            {q.type === 'MULTIPLE_CHOICE' && (
                                                                <RadioGroup className="mt-1" value={(answersByForm[form.idForm] || {})[q.idQuestion] || ''} onValueChange={(v) => setAnswer(form.idForm, q.idQuestion, v)}>
                                                                    {q.options?.map((opt: any) => (
                                                                        <div key={opt.idOption} className="flex items-center gap-2">
                                                                            <RadioGroupItem value={opt.text} id={`r-${form.idForm}-${q.idQuestion}-${opt.idOption}`} />
                                                                            <Label htmlFor={`r-${form.idForm}-${q.idQuestion}-${opt.idOption}`}>{opt.text}</Label>
                                                                        </div>
                                                                    ))}
                                                                </RadioGroup>
                                                            )}
                                                            {q.type === 'CHECKBOXES' && (
                                                                <div className="flex flex-col gap-2 mt-1">
                                                                    {q.options?.map((opt: any) => (
                                                                        <div key={opt.idOption} className="flex items-center gap-2">
                                                                            <Checkbox
                                                                                checked={((answersByForm[form.idForm] || {})[q.idQuestion] || []).includes(opt.text)}
                                                                                onCheckedChange={(checked) => {
                                                                                    const current = (answersByForm[form.idForm] || {})[q.idQuestion] || []
                                                                                    let next = [...current]
                                                                                    if (checked) next.push(opt.text)
                                                                                    else next = next.filter((a) => a !== opt.text)
                                                                                    setAnswer(form.idForm, q.idQuestion, next)
                                                                                }}
                                                                            />
                                                                            <Label>{opt.text}</Label>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                            {(q.type === 'SHORT_TEXT' || q.type === 'PARAGRAPH') && (
                                                                <Textarea className="mt-1" rows={q.type === 'PARAGRAPH' ? 3 : 1}
                                                                    value={(answersByForm[form.idForm] || {})[q.idQuestion] || ''}
                                                                    onChange={(e) => setAnswer(form.idForm, q.idQuestion, e.target.value)} />
                                                            )}
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="text-sm text-muted-foreground">Nenhuma pergunta configurada neste formulário.</div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </SectionCard>
                    )}
                </div>

                {/* ===================== PAINEL LATERAL ===================== */}
                <aside className="lg:sticky lg:top-6 flex flex-col gap-4">
                    <section className="bg-card rounded-xl border shadow-sm">
                        <div className="px-4 py-3 border-b"><h2 className="text-sm font-semibold">Resumo do atendimento</h2></div>
                        <div className="p-4 divide-y">
                            <SummaryRow icon={<ClipboardList className="w-3.5 h-3.5" />} k="Notas clínicas" v={`${notesFilled} ${notesFilled === 1 ? "preenchida" : "preenchidas"}`} />
                            <SummaryRow icon={<Pill className="w-3.5 h-3.5" />} k="Medicamentos" v={String(prescriptions.length)} />
                            <SummaryRow icon={<FlaskConical className="w-3.5 h-3.5" />} k="Exames" v={String(exams.length)} />
                            <SummaryRow icon={<ClipboardCheck className="w-3.5 h-3.5" />} k="Formulários" v={`${respondCount} responder · ${assignCount} atribuir`} />
                        </div>
                    </section>

                    <section className="bg-card rounded-xl border shadow-sm p-4 flex flex-col gap-3">
                        <div className="flex gap-2.5 rounded-lg bg-muted/50 border p-3">
                            <ShieldCheck className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                            <p className="text-xs text-muted-foreground leading-relaxed"><span className="text-foreground font-semibold">Acesso restrito.</span> As notas clínicas ficam visíveis apenas a profissionais autorizados.</p>
                        </div>
                        {notesFilled === 0 && (
                            <div className="flex gap-2 items-start text-xs text-amber-600 dark:text-amber-500">
                                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                Preencha ao menos uma nota clínica para salvar.
                            </div>
                        )}
                        <Button type="submit" disabled={isSubmitting} className="w-full">
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}{primaryLabel}
                        </Button>
                        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting} className="w-full">Cancelar</Button>
                    </section>
                </aside>
            </form>

            {/* Dialog: prescrição */}
            <Dialog open={prescDialog.open} onOpenChange={(o) => setPrescDialog((s) => ({ ...s, open: o }))}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {prescDialog.index === null ? "Novo medicamento" : "Editar medicamento"}
                        </DialogTitle>
                        <DialogDescription>
                            Os campos com * são obrigatórios.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="grid gap-1.5">
                            <Label>
                                Medicamento e concentração{" "}
                                <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                placeholder="Ibuprofeno 600 mg"
                                value={prescDialog.draft.medication}
                                onChange={(e) =>
                                    setPrescDialog((s) => ({
                                        ...s,
                                        draft: {
                                            ...s.draft,
                                            medication: e.target.value,
                                        },
                                    }))
                                }
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Quantidade */}
                            <div className="grid gap-1.5">
                                <Label>
                                    Quantidade por dose{" "}
                                    <span className="text-destructive">*</span>
                                </Label>

                                <div className="relative">
                                    <Input
                                        type="number"
                                        min="0"
                                        step="0.5"
                                        inputMode="decimal"
                                        placeholder="1"
                                        className="pr-20 no-arrows"
                                        value={leadingNumber(prescDialog.draft.dosage)}
                                        onChange={(e) =>
                                            setPrescDialog((s) => ({
                                                ...s,
                                                draft: {
                                                    ...s.draft,
                                                    dosage: e.target.value.replace(/[^\d.,]/g, ""),
                                                },
                                            }))
                                        }
                                    />

                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                                        dose(s)
                                    </span>
                                </div>
                            </div>

                            {/* Frequência */}
                            <div className="grid gap-1.5">
                                <Label>
                                    Frequência <span className="text-destructive">*</span>
                                </Label>

                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                                        A cada
                                    </span>

                                    <Input
                                        type="number"
                                        min="1"
                                        step="1"
                                        inputMode="numeric"
                                        placeholder="8"
                                        className="pl-16 pr-14 no-arrows"
                                        value={leadingNumber(prescDialog.draft.frequency)}
                                        onChange={(e) => {
                                            const n = e.target.value.replace(/\D/g, "");

                                            setPrescDialog((s) => ({
                                                ...s,
                                                draft: {
                                                    ...s.draft,
                                                    frequency: n,
                                                },
                                            }));
                                        }}
                                    />

                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                                        horas
                                    </span>
                                </div>
                            </div>

                            {/* Duração */}
                            <div className="grid gap-1.5">
                                <Label>
                                    Duração <span className="text-destructive">*</span>
                                </Label>

                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                                        Por
                                    </span>

                                    <Input
                                        type="number"
                                        min="1"
                                        step="1"
                                        inputMode="numeric"
                                        placeholder="7"
                                        className="pl-10 pr-12 no-arrows"
                                        value={leadingNumber(prescDialog.draft.duration)}
                                        onChange={(e) => {
                                            const n = e.target.value.replace(/\D/g, "");

                                            setPrescDialog((s) => ({
                                                ...s,
                                                draft: {
                                                    ...s.draft,
                                                    duration: n,
                                                },
                                            }));
                                        }}
                                    />

                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                                        dias
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-1.5">
                            <Label>Modo de uso (opcional)</Label>
                            <Textarea
                                rows={2}
                                placeholder="Via oral, após as refeições"
                                value={prescDialog.draft.instructions}
                                onChange={(e) =>
                                    setPrescDialog((s) => ({
                                        ...s,
                                        draft: {
                                            ...s.draft,
                                            instructions: e.target.value,
                                        },
                                    }))
                                }
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="ghost"
                            onClick={() =>
                                setPrescDialog({
                                    open: false,
                                    index: null,
                                    draft: emptyPrescription,
                                })
                            }
                        >
                            Cancelar
                        </Button>

                        <Button onClick={savePresc}>
                            <Plus className="w-4 h-4 mr-2" />
                            {prescDialog.index === null ? "Adicionar" : "Salvar"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Dialog: exame */}
            <Dialog open={examDialog.open} onOpenChange={(o) => setExamDialog(s => ({ ...s, open: o }))}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{examDialog.index === null ? "Solicitar exame" : "Editar exame"}</DialogTitle>
                        <DialogDescription>Informe o exame e, se necessário, instruções de preparo.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3">
                        <div className="grid gap-1.5">
                            <Label>Nome do exame <span className="text-destructive">*</span></Label>
                            <Input placeholder="Raio-X lombar" value={examDialog.draft.name} onChange={(e) => setExamDialog(s => ({ ...s, draft: { ...s.draft, name: e.target.value } }))} />
                        </div>
                        <div className="grid gap-1.5">
                            <Label>Instruções (opcional)</Label>
                            <Textarea rows={2} placeholder="Ex.: em jejum de 8 horas" value={examDialog.draft.instructions} onChange={(e) => setExamDialog(s => ({ ...s, draft: { ...s.draft, instructions: e.target.value } }))} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setExamDialog({ open: false, index: null, draft: emptyExam })}>Cancelar</Button>
                        <Button onClick={saveExam}><Plus className="w-4 h-4" />{examDialog.index === null ? "Adicionar" : "Salvar"}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

// ---- Componentes auxiliares locais ----

function SectionCard({ icon, title, desc, right, children }: { icon: React.ReactNode; title: string; desc?: string; right?: React.ReactNode; children: React.ReactNode }) {
    return (
        <section className="bg-card rounded-xl border shadow-sm">
            <div className="flex items-center gap-3 p-4 sm:p-5 border-b">
                <div className="h-9 w-9 rounded-lg bg-muted border grid place-items-center text-muted-foreground shrink-0">{icon}</div>
                <div className="min-w-0">
                    <h2 className="text-[15px] font-semibold leading-tight">{title}</h2>
                    {desc && <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>}
                </div>
                {right && <div className="ml-auto">{right}</div>}
            </div>
            <div className="p-4 sm:p-5">{children}</div>
        </section>
    )
}

function VitalInput({ label, unit, value, onChange, placeholder, type = "text", step }: { label: string; unit: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; step?: string }) {
    return (
        <div className="rounded-lg border bg-muted/30 p-3">
            <div className="text-[11px] font-medium text-muted-foreground">{label}</div>
            <div className="flex items-baseline gap-1 mt-1">
                <input
                    type={type} step={step} inputMode={type === "number" ? "decimal" : undefined}
                    className="w-full bg-transparent outline-none text-xl font-bold tabular-nums placeholder:text-muted-foreground/40 placeholder:font-normal no-arrows"
                    value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)}
                />
                <span className="text-xs text-muted-foreground font-medium shrink-0">{unit}</span>
            </div>
        </div>
    )
}

function KV({ k, v }: { k: string; v: string }) {
    return (
        <div className="rounded-md bg-muted/40 border px-2.5 py-1.5">
            <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{k}</div>
            <div className="text-[13px] font-semibold mt-0.5 break-words">{v || "—"}</div>
        </div>
    )
}

function SummaryRow({ icon, k, v }: { icon: React.ReactNode; k: string; v: string }) {
    return (
        <div className="flex items-center justify-between py-2 first:pt-0 last:pb-0">
            <span className="text-sm text-muted-foreground flex items-center gap-2">{icon}{k}</span>
            <span className="text-sm font-semibold tabular-nums">{v}</span>
        </div>
    )
}
