"use client"

import BtnVoltar from "@/components/buttons/btn-voltar"
import { MedicalNotesEditor, type MedicalNote } from "@/components/medical-notes-editor"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { SearchableSelect } from "@/components/ui/searchable-select"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useAlert } from "@/hooks/use-alert"
import { useAuth } from "@/hooks/use-auth"
import api from "@/services/api"
import { AttendanceStatus } from "@/types/attendance"
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

interface CriarAtendimentoViewProps {
    appointmentId?: string
    attendanceId?: string
}

export default function CriarAtendimentoView({ appointmentId, attendanceId }: CriarAtendimentoViewProps) {
    const router = useRouter()
    const { setAlert } = useAlert()
    const { user, getPermissions } = useAuth()

    // Form data
    const [formData, setFormData] = useState({
        patientId: "",
        professionalId: user?.idUser || "",
        attendanceDate: formatDateToLocal(new Date()),
        bloodPressure: "",
        heartRate: "",
        temperature: "",
        respiratoryRate: "",
        status: AttendanceStatus.EmAndamento,
    })

    /*
    {
        nome: string;
        idMenuAcesso: number;
        slug: string;
        visualizar: boolean;
        criar: boolean;
        editar: boolean;
        excluir: boolean;
        relatorio: boolean;
    }
    */
    const atendimentoPerm = useMemo(() => getPermissions ? getPermissions('atendimento') : null, [getPermissions])

    const [medicalNotes, setMedicalNotes] = useState<MedicalNote[]>([])
    const [patients, setPatients] = useState<any[]>([])
    const [screeningForms, setScreeningForms] = useState<ScreeningForm[]>([])
    const [selectedFormIds, setSelectedFormIds] = useState<Record<string, boolean>>({})
    const [assignedFormIds, setAssignedFormIds] = useState<Record<string, boolean>>({})
    // keep the originally-assigned forms (when editing) to detect removals
    const [originalAssignedFormIds, setOriginalAssignedFormIds] = useState<Record<string, boolean>>({})
    // map of existing response id by form id (when editing a patient who already answered)
    const [existingResponseIdByForm, setExistingResponseIdByForm] = useState<Record<string, string>>({})
    const [answersByForm, setAnswersByForm] = useState<Record<string, any>>({})

    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [appointmentData, setAppointmentData] = useState<any>(null)

    // Load initial data
    useEffect(() => {
        const loadData = async () => {
            try {
                setIsLoading(true)
                // If attendanceId provided, load attendance for editing
                if (attendanceId) {
                    const attRes = await api.get(`/attendances/${attendanceId}`)
                    const att = attRes.data || attRes.data.data || attRes.data
                    // Prefill main fields
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

                    // Carregar medical notes
                    if (att.medicalNotes && Array.isArray(att.medicalNotes) && att.medicalNotes.length > 0) {
                        setMedicalNotes(att.medicalNotes)
                    }

                    // merge assigned forms if provided
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

                    // merge any returned screening forms
                    if (Array.isArray(fromAssigned) && fromAssigned.length > 0) {
                        setScreeningForms(prev => {
                            const existing = prev || []
                            const existingIds = new Set(existing.map(e => e.idForm))
                            const merged = [...existing]
                            fromAssigned.forEach((f: any) => {
                                if (!existingIds.has(f.idForm)) merged.push(f)
                            })
                            return merged
                        })
                    }

                    // prefill form responses if present (normalize possible wrapping: item.response)
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
                    // Carrega agendamento se fornecido
                    const apptRes = await api.get(`/appointments/${appointmentId}`)
                    const appt = apptRes.data || apptRes.data.data
                    setAppointmentData(appt)
                    setFormData((prev) => ({
                        ...prev,
                        patientId: appt.patientId || "",
                        professionalId: user?.idUser || "",
                        attendanceDate: formatDateToLocal(new Date(appt.scheduledAt)),
                    }))

                    // If appointment contains assigned forms or responses, prefill similar to patient registration
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

                    // If appointment returned full assigned forms, merge them into screeningForms so UI shows details
                    if (Array.isArray(fromAssigned) && fromAssigned.length > 0) {
                        setScreeningForms(prev => {
                            const existing = prev || []
                            const existingIds = new Set(existing.map(e => e.idForm))
                            const merged = [...existing]
                            fromAssigned.forEach((f: any) => {
                                if (!existingIds.has(f.idForm)) merged.push(f)
                            })
                            return merged
                        })
                    }

                    // prefill screening answers/responses if present (formResponses contains submitted responses)
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

                // Carrega pacientes e formulários
                const [patientsRes, formsRes] = await Promise.all([
                    api.get("/patients?pageSize=1000"),
                    api.get("/forms/screenings"),
                ])

                const patientsList = patientsRes.data?.data ?? patientsRes.data ?? []
                const formsList = formsRes.data?.forms ?? formsRes.data ?? []

                setPatients(Array.isArray(patientsList) ? patientsList : [])
                setScreeningForms(Array.isArray(formsList) ? formsList : [])
            } catch (err: any) {
                console.error("Erro ao carregar dados:", err)
                if (err?.response.data.message && Array.isArray(err.message)) {
                    setAlert(err.message.join(' '), 'error')
                } else if (err?.response?.data?.message) {
                    setAlert(err.response.data.message, "error")
                } else if (err?.message) {
                    setAlert(err.message, "error")
                } else {
                    setAlert("Erro ao carregar dados.", "error")
                }
            } finally {
                setIsLoading(false)
            }
        }

        loadData()
    }, [appointmentId])

    const handleInputChange = (field: string, value: string) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }))
    }

    const toggleSelectForm = (formId: string) => {
        setSelectedFormIds(prev => {
            const next = { ...prev, [formId]: !prev[formId] }
            // if user chose to answer now, ensure it's not assigned
            if (next[formId]) {
                setAssignedFormIds(a => ({ ...a, [formId]: false }))
            }
            return next
        })
    }

    const toggleAssignForm = (formId: string) => {
        setAssignedFormIds(prev => {
            const next = { ...prev, [formId]: !prev[formId] }
            // if user assigned the form, ensure it's not selected to answer now
            if (next[formId]) {
                setSelectedFormIds(s => ({ ...s, [formId]: false }))
            }
            return next
        })
    }

    const setAnswer = (formId: string, questionId: string, value: any) => {
        setAnswersByForm(prev => ({
            ...prev,
            [formId]: {
                ...(prev[formId] || {}),
                [questionId]: value,
            }
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // Validar que há pelo menos uma nota com conteúdo
        const hasValidNote = medicalNotes.some(note => note.content && note.content.trim() !== "")
        if (!formData.patientId || !formData.professionalId || !formData.attendanceDate || !hasValidNote) {
            setAlert("Por favor, preencha todos os campos obrigatórios incluindo pelo menos uma nota médica.", "error")
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
                // update existing
                await api.put(`/attendances/${savedAttendanceId}`, payload)
                setAlert("Atendimento atualizado com sucesso.", "success")
            } else {
                const res = await api.post("/attendances", payload)
                savedAttendanceId = res.data?.id
                setAlert("Atendimento criado com sucesso.", "success")
            }

            // Prepare forms to respond and to assign
            const selectedForms = Object.keys(selectedFormIds).filter(k => selectedFormIds[k])
            const assignedForms = Object.keys(assignedFormIds).filter(k => assignedFormIds[k])

            // If we have existing responses that were unselected, delete them
            const responseFormIds = Object.keys(existingResponseIdByForm || {}).filter(k => existingResponseIdByForm[k])
            const toDeleteResponseFormIds = responseFormIds.filter(id => !selectedFormIds[id])
            if (toDeleteResponseFormIds.length > 0) {
                if (!formData.patientId) {
                    setAlert('Não foi possível obter o id do paciente para excluir respostas removidas.', 'warning')
                } else {
                    const deletePromises = toDeleteResponseFormIds.map((formId) => {
                        const respId = existingResponseIdByForm[formId]
                        return api.delete(`/forms/${formId}/responses/${respId}`)
                    })

                    const deleteResults = await Promise.allSettled(deletePromises)
                    const deleteFailed = deleteResults.filter(r => r.status === 'rejected')
                    if (deleteFailed.length > 0) {
                        setAlert(`${deleteFailed.length} exclusão(ões) de resposta falharam.`, 'warning')
                    }

                    setExistingResponseIdByForm(prev => {
                        const next = { ...(prev || {}) }
                        toDeleteResponseFormIds.forEach(id => delete next[id])
                        return next
                    })
                }
            }

            // Submit responses for selected forms
            const formsToRespond = (screeningForms || []).filter((f) => selectedFormIds[f.idForm])
            const invalidForms: string[] = []
            const validForms = formsToRespond.filter((form) => {
                const questions = form.questions || []
                const answersMap = answersByForm[form.idForm] || {}
                for (const q of questions) {
                    if (q.required) {
                        const val = answersMap[q.idQuestion]
                        if (val === undefined || val === null) {
                            invalidForms.push(form.title || form.idForm)
                            return false
                        }
                        if (Array.isArray(val) && val.length === 0) {
                            invalidForms.push(form.title || form.idForm)
                            return false
                        }
                        if (!Array.isArray(val) && String(val).trim() === '') {
                            invalidForms.push(form.title || form.idForm)
                            return false
                        }
                    }
                }
                return true
            })

            if (invalidForms.length > 0) {
                setAlert(`Os seguintes formulários possuem campos obrigatórios não preenchidos: ${invalidForms.join(', ')}. Preencha-os antes de responder.`, 'warning', 8000)
            }
            if (validForms.length > 0) {
                const submitPromises = validForms.map(async (form) => {
                    const answersMap = answersByForm[form.idForm] || {}
                    const answersPayload = Object.entries(answersMap).map(([questionId, answerValue]) => {
                        if (Array.isArray(answerValue)) return { questionId, values: answerValue }
                        return { questionId, value: answerValue }
                    })

                    const respPayload: any = { answers: answersPayload }
                    if (formData.patientId) respPayload.userId = formData.patientId
                    if (savedAttendanceId) respPayload.attendanceId = savedAttendanceId

                    const existingRespId = existingResponseIdByForm[form.idForm]
                    if (existingRespId) {
                        return api.put(`/forms/${form.idForm}/responses/${existingRespId}`, respPayload)
                    }

                    const r = await api.post(`/forms/${form.idForm}/responses`, respPayload)
                    const newId = r?.data?.idResponse || r?.data?.id || r?.data?.responseId
                    if (newId) setExistingResponseIdByForm(prev => ({ ...(prev || {}), [form.idForm]: newId }))
                    return r
                })

                const results = await Promise.allSettled(submitPromises)
                const failed = results.filter(r => r.status === 'rejected')
                if (failed.length > 0) {
                    setAlert(`${failed.length} formulário(s) não puderam ser respondidos automaticamente.`, 'warning')
                }
            }

            // Assign selected assigned forms to attendance
            const formsToAssign = (screeningForms || []).filter((f) => assignedFormIds[f.idForm])
            // detect which originally-assigned forms were removed in this edit
            const originalAssignedIds = Object.keys(originalAssignedFormIds || {}).filter(k => originalAssignedFormIds[k])
            const currentAssignedIds = Object.keys(assignedFormIds || {}).filter(k => assignedFormIds[k])
            const toUnassignIds = originalAssignedIds.filter(id => !currentAssignedIds.includes(id))
            if (formsToAssign.length > 0) {
                if (!savedAttendanceId) {
                    setAlert('Atendimento criado mas não foi possível obter o id para atribuir formulários.', 'warning')
                } else {
                    const assignPromises = formsToAssign.map((form) => api.post(`/attendances/${savedAttendanceId}/assign-forms`, { formIds: [form.idForm] }))
                    const assignResults = await Promise.allSettled(assignPromises)
                    const assignFailed = assignResults.filter(r => r.status === 'rejected')
                    if (assignFailed.length > 0) {
                        setAlert(`${assignFailed.length} atribuição(ões) falharam.`, 'warning')
                    }
                }
            }

            if (toUnassignIds.length > 0) {
                if (!savedAttendanceId) {
                    setAlert('Não foi possível obter o id do atendimento para desatribuir formulários.', 'warning')
                } else {
                    const unassignPromises = toUnassignIds.map((formId) => api.post(`/attendances/${savedAttendanceId}/unassign-forms`, { formIds: [formId] }))
                    const unassignResults = await Promise.allSettled(unassignPromises)
                    const unassignFailed = unassignResults.filter(r => r.status === 'rejected')
                    if (unassignFailed.length > 0) {
                        setAlert(`${unassignFailed.length} desatribuição(ões) falharam.`, 'warning')
                    }
                }
            }

            setTimeout(() => {
                router.back()
            }, 500)
        } catch (err: any) {
            console.error("Erro ao carregar dados:", err)
            if (err?.response.data.message && Array.isArray(err.message)) {
                setAlert(err.message.join(' '), 'error')
            } else if (err?.response?.data?.message) {
                setAlert(err.response.data.message, "error")
            } else if (err?.message) {
                setAlert(err.message, "error")
            } else {
                setAlert("Erro ao carregar dados.", "error")
            }
        } finally {
            setIsSubmitting(false)
        }
    }

    if((!atendimentoPerm?.editar && attendanceId) || 
        (!atendimentoPerm?.criar)) {
        router.push(`/admin`)
    }

    return (
        <div className="max-w-4xl mx-auto relative xxl:pt-9 mt-2 px-2 sm:px-6 pt-12">
            <BtnVoltar />
            <div className="flex items-center gap-2 mb-6">
                <h1 className="text-3xl font-bold tracking-tight text-primary">
                    {appointmentId ? "Atendimento do Agendamento" : "Novo Atendimento"}
                </h1>
            </div>

            {isLoading ? (
                <div className="space-y-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <Skeleton key={i} className="h-10 w-full" />
                    ))}
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-2 sm:space-y-6">
                    {/* Dados Básicos */}
                    <div className="bg-white rounded-lg border p-2 sm:p-6 space-y-4">
                        <h2 className="text-lg font-semibold">Dados Básicos</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="patient">Paciente *</Label>
                                <SearchableSelect
                                    items={patients.map((p) => ({
                                        value: p.idUser,
                                        label: p.name || p.nome || p.idUser,
                                    }))}
                                    value={formData.patientId}
                                    onValueChange={(value) => handleInputChange("patientId", value)}
                                    placeholder="Selecionar paciente"
                                    searchPlaceholder="Buscar paciente..."
                                />
                            </div>

                            <div>
                                <Label htmlFor="attendanceDate">Data do Atendimento *</Label>
                                <Input
                                    id="attendanceDate"
                                    type="datetime-local"
                                    value={formData.attendanceDate}
                                    className="text-sm"
                                    onChange={(e) => handleInputChange("attendanceDate", e.target.value)}
                                />
                            </div>

                            <div>
                                <Label htmlFor="status">Status</Label>
                                <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                                    <SelectTrigger id="status">
                                        <SelectValue placeholder="Selecionar status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={AttendanceStatus.EmAndamento}>{AttendanceStatus.EmAndamento}</SelectItem>
                                        <SelectItem value={AttendanceStatus.Concluido}>Concluído</SelectItem>
                                        <SelectItem value={AttendanceStatus.Cancelado}>{AttendanceStatus.Cancelado}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* Métricas Vitais */}
                    <div className="bg-white rounded-lg border p-2 sm:p-6 space-y-4">
                        <h2 className="text-lg font-semibold">Métricas Vitais</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="bloodPressure">Pressão Arterial (ex: 120/80)</Label>
                                <Input
                                    id="bloodPressure"
                                    type="text"
                                    value={formData.bloodPressure}
                                    onChange={(e) => handleInputChange("bloodPressure", e.target.value)}
                                />
                            </div>

                            <div>
                                <Label htmlFor="heartRate">Frequência Cardíaca (bpm)</Label>
                                <Input
                                    id="heartRate"
                                    type="number"
                                    value={formData.heartRate}
                                    onChange={(e) => handleInputChange("heartRate", e.target.value)}
                                />
                            </div>

                            <div>
                                <Label htmlFor="temperature">Temperatura (°C)</Label>
                                <Input
                                    id="temperature"
                                    type="number"
                                    step="0.1"
                                    value={formData.temperature}
                                    onChange={(e) => handleInputChange("temperature", e.target.value)}
                                />
                            </div>

                            <div>
                                <Label htmlFor="respiratoryRate">Frequência Respiratória (rpm)</Label>
                                <Input
                                    id="respiratoryRate"
                                    type="number"
                                    value={formData.respiratoryRate}
                                    onChange={(e) => handleInputChange("respiratoryRate", e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Informações Clínicas */}
                    <MedicalNotesEditor
                        medicalNotes={medicalNotes}
                        onChange={setMedicalNotes}
                    />

                    {/* Formulários */}
                    {screeningForms.length > 0 && (
                        <div className="bg-white rounded-lg border p-2 sm:p-6 space-y-4">
                            <h2 className="text-lg font-semibold">Formulários do Sistema</h2>
                            <p className="text-sm text-muted-foreground">Selecione os formulários que deseja associar a este atendimento</p>

                            <div className="space-y-3">
                                {screeningForms.map((form) => (
                                    <div key={form.idForm} className="border rounded-md p-3">
                                        <div className="flex items-center justify-between sm:flex-row flex-col sm:gap-0 gap-2">
                                            <div>
                                                <div className="font-semibold">{form.title}</div>
                                                {form.description && <div className="text-sm text-muted-foreground">{form.description}</div>}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-4">
                                                    <label className="inline-flex items-center gap-2">
                                                        <input type="checkbox" checked={!!selectedFormIds[form.idForm]} onChange={() => toggleSelectForm(form.idForm)} />
                                                        <span className="text-sm">Responder</span>
                                                    </label>
                                                    <label className="inline-flex items-center gap-2">
                                                        <input type="checkbox" checked={!!assignedFormIds[form.idForm]} onChange={() => toggleAssignForm(form.idForm)} />
                                                        <span className="text-sm">Atribuir</span>
                                                    </label>
                                                </div>
                                            </div>
                                        </div>

                                        {selectedFormIds[form.idForm] && (
                                            <div className="mt-3 space-y-2">
                                                {form.questions && form.questions.length > 0 ? (
                                                    form.questions.map((q: any) => (
                                                        <div key={q.idQuestion} className="flex flex-col">
                                                            <label className="font-medium">{q.text}</label>
                                                            {q.type === 'MULTIPLE_CHOICE' && (
                                                                <div className="flex flex-col gap-2 mt-1">
                                                                    <RadioGroup
                                                                        value={(answersByForm[form.idForm] || {})[q.idQuestion] || ''}
                                                                        onValueChange={(v) => setAnswer(form.idForm, q.idQuestion, v)}
                                                                    >
                                                                        {q.options?.map((opt: any) => (
                                                                            <div key={opt.idOption} className="flex items-center gap-2">
                                                                                <RadioGroupItem value={opt.text} id={`r-${form.idForm}-${q.idQuestion}-${opt.idOption}`} />
                                                                                <Label htmlFor={`r-${form.idForm}-${q.idQuestion}-${opt.idOption}`}>{opt.text}</Label>
                                                                            </div>
                                                                        ))}
                                                                    </RadioGroup>
                                                                </div>
                                                            )}

                                                            {(q.type === 'CHECKBOXES') && (
                                                                <div className="flex flex-col gap-2 mt-1">
                                                                    {q.options?.map((opt: any) => (
                                                                        <div key={opt.idOption} className="flex items-center gap-2">
                                                                            <Checkbox
                                                                                checked={((answersByForm[form.idForm] || {})[q.idQuestion] || []).includes(opt.text)}
                                                                                onCheckedChange={(checked) => {
                                                                                    const currentAnswers = (answersByForm[form.idForm] || {})[q.idQuestion] || []
                                                                                    let newAnswers = [...currentAnswers]
                                                                                    if (checked) {
                                                                                        newAnswers.push(opt.text)
                                                                                    } else {
                                                                                        newAnswers = newAnswers.filter((a) => a !== opt.text)
                                                                                    }
                                                                                    setAnswer(form.idForm, q.idQuestion, newAnswers)
                                                                                }}
                                                                            />
                                                                            <Label>{opt.text}</Label>
                                                                        </div>
                                                                    ))}
                                                                </div>
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
                        </div>
                    )}

                    {/* Botões */}
                    <div className="flex items-center gap-2">
                        <Button type="submit" disabled={isSubmitting} className="bg-primary">
                            {isSubmitting ? "Salvando..." : "Salvar Atendimento"}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.back()}
                            disabled={isSubmitting}
                        >
                            Cancelar
                        </Button>
                    </div>
                </form>
            )}
        </div>
    )
}
