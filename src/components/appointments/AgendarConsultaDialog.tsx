"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useAlert } from "@/hooks/use-alert"
import api from "@/services/api"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import * as React from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { PatientSelect } from "../select/PatientSelect"
import { ProfessionalSelect } from "../select/ProfessionalSelect"

const agendamentoSchema = z.object({
    patientId: z.string().optional(),
    doctorId: z.string().min(1, "Selecione um profissional."),
    scheduledAt: z.string().min(1, "Informe data e hora."),
    notes: z.string().optional(),
    modality: z.enum(["Presencial", "Remoto"]),
    location: z.string().optional(),
    meetingUrl: z.string().optional(),
})
type AgendamentoFormValues = z.infer<typeof agendamentoSchema>

interface AgendarConsultaDialogProps {
    visibleOnly?: boolean
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    response?: any
    appointment?: any
    /** Paciente pré-selecionado (ex.: agendamento a partir da listagem de pacientes). */
    patient?: any
    onScheduled?: () => void
    ferrals?: boolean
}

export default function AgendarConsultaDialog({ isOpen, onOpenChange, response, appointment, patient, onScheduled, visibleOnly, ferrals }: AgendarConsultaDialogProps) {
    const [isSubmitting, setIsSubmitting] = React.useState(false)
    const [responseDetail, setResponseDetail] = React.useState<any | null>(null)
    const [showDetails, setShowDetails] = React.useState(false)
    const [loadingResponseDetail, setLoadingResponseDetail] = React.useState(false)
    // Locais de atendimento do profissional selecionado (para o campo Local / Unidade).
    const [professionalLocais, setProfessionalLocais] = React.useState<string[]>([])
    const { setAlert } = useAlert()

    const isStandalone = !response && !appointment

    const filterProfessionals = React.useCallback((professionals: any[]) => {
        const doctors = professionals.filter((u: any) => u.type === 'MEDICO')
        const referrals = professionals.filter((u: any) => u.type === 'USUARIO')
        return ferrals ? referrals : doctors
    }, [ferrals])

    const form = useForm<AgendamentoFormValues>({
        resolver: zodResolver(agendamentoSchema),
        defaultValues: { patientId: "", doctorId: "", scheduledAt: "", notes: "", modality: "Presencial", location: "", meetingUrl: "" },
    })

    const watchModality = form.watch("modality")

    React.useEffect(() => {
        if (!isOpen) return
    }, [isOpen, setAlert])

    const fetchResponseDetail = async () => {
        try {
            const provided = response || appointment?.response

            if (provided && provided.answers && provided.answers.length > 0) {
                setResponseDetail(provided)
                return
            }

            const formId = provided?.form?.idForm || provided?.formId || appointment?.formId || appointment?.form?.idForm || null
            const responseId = provided?.idResponse || provided?.responseId || appointment?.responseId || null

            if (!formId || !responseId) return
            setLoadingResponseDetail(true)
            const res = await api.get(`/forms/${formId}/responses/${responseId}`)
            setResponseDetail(res.data)
        } catch (err) {
            console.warn('Não foi possível carregar detalhes da resposta:', err)
            setAlert('Não foi possível carregar os detalhes da resposta.', 'error')
        } finally {
            setLoadingResponseDetail(false)
        }
    }

    const handleToggleDetails = async () => {
        const newState = !showDetails
        setShowDetails(newState)
        if (newState && !responseDetail) {
            await fetchResponseDetail()
        }
    }

    React.useEffect(() => {
        if (!isOpen) {
            form.reset()
            setResponseDetail(null)
            setShowDetails(false)
            return
        }

        if (appointment) {
            let doctorId = appointment.doctorId || ""
            if (ferrals && ferrals === true && appointment.professional) {
                doctorId = appointment.professionalId || ""
            }

            const initial: AgendamentoFormValues = {
                patientId: appointment.patientId || appointment.patient?.idUser || "",
                doctorId,
                scheduledAt: appointment.scheduledAt ? new Date(appointment.scheduledAt).toISOString().slice(0, 16) : "",
                notes: appointment.notes || "",
                modality: appointment.modality || "Presencial",
                location: appointment.location || "",
                meetingUrl: appointment.meetingUrl || "",
            }
            form.reset(initial)
            fetchResponseDetail()
        } else if (response) {
            form.reset({ patientId: "", doctorId: "", scheduledAt: "", notes: "", modality: "Presencial", location: "", meetingUrl: "" })
        } else {
            form.reset({ patientId: patient?.idUser || "", doctorId: "", scheduledAt: "", notes: "", modality: "Presencial", location: "", meetingUrl: "" })
        }
    }, [isOpen, appointment, patient])

    const handleOpenChange = (open: boolean) => {
        if (!open) form.reset()
        onOpenChange(open)
    }

    async function onSubmit(data: AgendamentoFormValues) {
        const patientId = response?.user?.idUser || appointment?.patientId || appointment?.patient?.idUser || data.patientId || patient?.idUser || null

        if (!patientId) {
            setAlert('Selecione um paciente.', 'error')
            return
        }

        setIsSubmitting(true)
        try {
            const payload: any = {
                patientId,
                responseId: response?.idResponse || appointment?.responseId || appointment?.response?.idResponse || null,
                scheduledAt: data.scheduledAt,
                notes: data.notes || '',
                modality: data.modality,
            }

            if (data.modality === 'Presencial') {
                payload.location = data.location || ''
            } else {
                payload.meetingUrl = data.meetingUrl || ''
            }

            if (ferrals && ferrals === true) {
                payload['professionalId'] = data.doctorId
            } else {
                payload['doctorId'] = data.doctorId
            }

            if (appointment?.id) {
                await api.put(`/appointments/${appointment.id}`, payload)
                setAlert('Consulta atualizada com sucesso!', 'success')
            } else {
                await api.post('/appointments', payload)
                setAlert('Consulta agendada com sucesso!', 'success')
            }
            if (onScheduled) onScheduled()
            handleOpenChange(false)
        } catch (err: any) {
            console.error('Erro ao agendar consulta:', err)
            setAlert(err.response?.data?.message || 'Erro ao agendar consulta.', 'error')
        } finally {
            setIsSubmitting(false)
        }
    }

    const hasResponseContext = !!(response || appointment?.responseId || appointment?.response)

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto scrollable">
                <DialogHeader>
                    <DialogTitle>{ferrals ? "Encaminhar" : "Agendar Consulta"}</DialogTitle>
                    <DialogDescription>
                        {isStandalone
                            ? "Crie um novo agendamento de consulta selecionando o paciente e o profissional."
                            : ferrals
                                ? "Crie um encaminhamento para o paciente relacionado à resposta selecionada."
                                : "Crie um agendamento de consulta para o paciente relacionado à resposta selecionada."
                        }
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    {hasResponseContext && (
                        <div className="mb-3">
                            <button type="button" className="text-sm text-primary underline" onClick={handleToggleDetails}>
                                {showDetails ? 'Ocultar detalhes do formulário' : 'Detalhes do formulário'}
                            </button>
                        </div>
                    )}

                    {showDetails && (
                        responseDetail ? (
                            <div className="bg-muted p-3 rounded-md border mb-4 overflow-auto scrollable">
                                <div className="mb-2">
                                    <div className="font-medium">{responseDetail.form?.title || response?.form?.title || 'Formulário'}</div>
                                    <div className="text-sm">{responseDetail.form?.description || response?.form?.description || ''}</div>
                                    <div className="text-xs text-muted-foreground">Enviado em: {new Date(responseDetail.submittedAt || response?.submittedAt).toLocaleString('pt-BR')}</div>
                                    <div className="text-xs text-muted-foreground">Paciente: {responseDetail.user?.name || response?.user?.name || 'Anônimo'}</div>
                                    <div className="text-xs text-primary-500 font-bold">Pontuação Total: {responseDetail.totalScore ?? response?.totalScore ?? 0}</div>
                                </div>
                                <div className="space-y-2">
                                    {responseDetail.answers?.map((ans: any) => (
                                        <div key={ans.question?.idQuestion || ans.idQuestion} className="text-sm">
                                            <div className="flex justify-between items-start">
                                                <div className="font-semibold">{ans.question?.text || 'Pergunta sem título'}</div>
                                                <div className="text-xs text-muted-foreground">{ans.score !== undefined && ans.score !== null ? `Pontuação: ${ans.score}` : ''}</div>
                                            </div>
                                            <div className="text-[13px] text-muted-foreground">{(ans.value ?? (ans.values && ans.values.join(', ')) ?? '').toString()}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="p-3 mb-4 text-sm text-muted-foreground">{loadingResponseDetail ? 'Carregando detalhes...' : 'Detalhes da resposta não disponíveis.'}</div>
                        )
                    )}
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        {isStandalone && (
                            patient ? (
                                <div className="space-y-2">
                                    <Label>Paciente*</Label>
                                    <Input value={`${patient.name}${patient.cpf ? ` - ${patient.cpf}` : ''}`} disabled readOnly />
                                </div>
                            ) : (
                                <FormField
                                    control={form.control}
                                    name="patientId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Paciente*</FormLabel>
                                            <FormControl>
                                                <PatientSelect
                                                    value={field.value || ""}
                                                    onChange={field.onChange}
                                                    disabled={visibleOnly}
                                                    placeholder="Digite o nome do paciente..."
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )
                        )}

                        <FormField
                            control={form.control}
                            name="doctorId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Profissional*</FormLabel>
                                    <FormControl>
                                        <ProfessionalSelect
                                            value={field.value}
                                            onChange={field.onChange}
                                            disabled={visibleOnly}
                                            filterFn={filterProfessionals}
                                            placeholder="Selecione um profissional"
                                            onProfessionalChange={(prof) => setProfessionalLocais(prof?.locaisAtendimento ?? [])}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="scheduledAt"
                            disabled={visibleOnly}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Data e Hora*</FormLabel>
                                    <FormControl>
                                        <Input type="datetime-local" {...field} min={new Date().toISOString().slice(0, 16)} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="modality"
                            disabled={visibleOnly}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Modalidade*</FormLabel>
                                    <FormControl>
                                        <RadioGroup
                                            className="flex gap-4"
                                            value={field.value}
                                            onValueChange={field.onChange}
                                            disabled={visibleOnly}
                                        >
                                            <div className="flex items-center gap-2">
                                                <RadioGroupItem value="Presencial" id="modality-presencial" />
                                                <Label htmlFor="modality-presencial">Presencial</Label>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <RadioGroupItem value="Remoto" id="modality-remoto" />
                                                <Label htmlFor="modality-remoto">Remoto</Label>
                                            </div>
                                        </RadioGroup>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {watchModality === 'Presencial' && (
                            <FormField
                                control={form.control}
                                name="location"
                                disabled={visibleOnly}
                                render={({ field }) => {
                                    // União dos locais do profissional + valor atual (caso venha de dado antigo).
                                    const options = Array.from(new Set([
                                        ...professionalLocais,
                                        ...(field.value ? [field.value] : []),
                                    ]))
                                    return (
                                        <FormItem>
                                            <FormLabel>Local / Unidade</FormLabel>
                                            <FormControl>
                                                {professionalLocais.length > 0 ? (
                                                    <Select
                                                        value={field.value || ""}
                                                        onValueChange={field.onChange}
                                                        disabled={visibleOnly}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Selecione o local de atendimento" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {options.map((loc) => (
                                                                <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                ) : (
                                                    <Input placeholder="Endereço ou unidade de saúde" {...field} />
                                                )}
                                            </FormControl>
                                            {professionalLocais.length === 0 && (
                                                <p className="text-xs text-muted-foreground">
                                                    O profissional selecionado não possui locais de atendimento cadastrados.
                                                </p>
                                            )}
                                            <FormMessage />
                                        </FormItem>
                                    )
                                }}
                            />
                        )}

                        {watchModality === 'Remoto' && (
                            <FormField
                                control={form.control}
                                name="meetingUrl"
                                disabled={visibleOnly}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Link da Teleconsulta</FormLabel>
                                        <FormControl>
                                            <Input placeholder="https://meet.google.com/..." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        <FormField
                            control={form.control}
                            name="notes"
                            disabled={visibleOnly}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Observações</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Motivo / observações (opcional)" {...field} />
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        {visibleOnly ? <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)} disabled={isSubmitting}>
                                Fechar
                            </Button>
                        </DialogFooter> : <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)} disabled={isSubmitting}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                {appointment?.id ? 'Salvar Alterações' : 'Agendar'}
                            </Button>
                        </DialogFooter>}
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
