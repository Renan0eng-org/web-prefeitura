"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useAlert } from "@/hooks/use-alert"
import api from "@/services/api"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import * as React from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

const agendamentoSchema = z.object({
    doctorId: z.string().min(1, "Selecione um médico."),
    scheduledAt: z.string().min(1, "Informe data e hora."),
    notes: z.string().optional(),
})
type AgendamentoFormValues = z.infer<typeof agendamentoSchema>

interface AgendarConsultaDialogProps {
    visibleOnly?: boolean
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    // either pass a response (existing behavior) or an appointment to edit/view
    response?: any // response object from EsteiraPacientesTab
    appointment?: any
    onScheduled?: () => void
    ferrals?: boolean
}

export default function AgendarConsultaDialog({ isOpen, onOpenChange, response, appointment, onScheduled, visibleOnly, ferrals }: AgendarConsultaDialogProps) {
    const [isSubmitting, setIsSubmitting] = React.useState(false)
    const [doctors, setDoctors] = React.useState<any[]>([])
    const [loadingDoctors, setLoadingDoctors] = React.useState(false)
    const [responseDetail, setResponseDetail] = React.useState<any | null>(null)
    const [showDetails, setShowDetails] = React.useState(false)
    const [loadingResponseDetail, setLoadingResponseDetail] = React.useState(false)
    const { setAlert } = useAlert()


    const form = useForm<AgendamentoFormValues>({
        resolver: zodResolver(agendamentoSchema),
        defaultValues: { doctorId: "", scheduledAt: "", notes: "" },
    })

    React.useEffect(() => {
        if (!isOpen) return
        const fetchDoctors = async () => {
            try {
                setLoadingDoctors(true)
                // endpoint returns users with access level info; filter by type 'USUARIO' (medicos)
                const res = await api.get('/appointments/users/professional')
                const list = res.data || []

                const doctor = list.filter((u: any) => u.type === 'MEDICO')
                const ferral = list.filter((u: any) => u.type === 'USUARIO')

                if (ferrals && ferrals === true) {
                    setDoctors(ferral)
                } else {
                    setDoctors(doctor)
                }
            } catch (err) {
                console.error('Erro ao buscar médicos:', err)
                setAlert('Não foi possível carregar lista de médicos.', 'error')
            } finally {
                setLoadingDoctors(false)
            }
        }
        fetchDoctors()
    }, [isOpen, setAlert])

    // Fetch response details on demand when user requests "Detalhes do formulário"
    const fetchResponseDetail = async () => {
        try {
            const provided = response || appointment?.response

            if (provided && provided.answers && provided.answers.length > 0) {
                setResponseDetail(provided)
                return
            }

            // try to infer formId/responseId from either response or appointment
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

        // If opened with an appointment, prefill form for editing
        if (appointment) {


            let doctorId = appointment.doctorId || ""
            
            if (ferrals && ferrals === true && appointment.professional) {
                doctorId = appointment.professionalId || ""
            }


            const initial = {
                doctorId,
                scheduledAt: appointment.scheduledAt ? new Date(appointment.scheduledAt).toISOString().slice(0, 16) : "",
                notes: appointment.notes || "",
            }
            
            
            
            
            form.reset(initial)
            // if appointment contains response embedded, set it
            fetchResponseDetail()
        } else if (response) {
            // if opened with a response directly, reset form defaults
            form.reset({ doctorId: "", scheduledAt: "", notes: "" })
        }
    }, [isOpen, appointment])

    const handleOpenChange = (open: boolean) => {
        if (!open) form.reset()
        onOpenChange(open)
    }

    async function onSubmit(data: AgendamentoFormValues) {
        setIsSubmitting(true)
        try {
            const payload: any = {
                patientId: response?.user?.idUser || appointment?.patientId || appointment?.patient?.idUser || null,
                responseId: response?.idResponse || appointment?.responseId || appointment?.response?.idResponse || null,
                scheduledAt: data.scheduledAt,
                notes: data.notes || '',
            }

            
                // doctorId: data.doctorId
            if (ferrals && ferrals === true) {
                payload['professionalId'] = data.doctorId
            } else {
                payload['doctorId'] = data.doctorId
            }

            // backend endpoint may vary; using /appointments as a reasonable default
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

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto scrollable">
                <DialogHeader>
                    <DialogTitle>{ferrals ? "Encaminhar" : "Agendar Consulta"}</DialogTitle>
                    <DialogDescription>
                        {
                            ferrals ? "Crie um encaminhamento para o paciente relacionado à resposta selecionada." :
                                "Crie um agendamento de consulta para o paciente relacionado à resposta selecionada."
                        }
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    {/* botão para exibir/ocultar detalhes do formulário (carrega sob demanda) */}
                    <div className="mb-3">
                        <button type="button" className="text-sm text-primary underline" onClick={handleToggleDetails}>
                            {showDetails ? 'Ocultar detalhes do formulário' : 'Detalhes do formulário'}
                        </button>
                    </div>

                    {/* Preview rápido da resposta (carregado apenas quando showDetails=true) */}
                    {showDetails && (
                        responseDetail ? (
                            <div className="bg-muted p-3 rounded-md border mb-4 overflow-auto scrollable">
                                <div className="mb-2">
                                    <div className="font-medium">{responseDetail.form?.title || response.form?.title || 'Formulário'}</div>
                                    <div className="text-xs text-muted-foreground">Enviado em: {new Date(responseDetail.submittedAt || response.submittedAt).toLocaleString('pt-BR')}</div>
                                    <div className="text-xs text-muted-foreground">Paciente: {responseDetail.user?.name || response.user?.name || 'Anônimo'}</div>
                                    <div className="text-xs text-primary-500 font-bold">Pontuação Total: {responseDetail.totalScore ?? response.totalScore ?? 0}</div>
                                </div>
                                <div className="space-y-2">
                                    {responseDetail.answers?.slice(0, 8).map((ans: any) => (
                                        <div key={ans.question?.idQuestion || ans.idQuestion} className="text-sm">
                                            <div className="flex justify-between items-start">
                                                <div className="font-semibold">{ans.question?.text || 'Pergunta sem título'}</div>
                                                <div className="text-xs text-muted-foreground">{ans.score !== undefined && ans.score !== null ? `Pontuação: ${ans.score}` : ''}</div>
                                            </div>
                                            <div className="text-[13px] text-muted-foreground">{(ans.value ?? (ans.values && ans.values.join(', ')) ?? '').toString()}</div>
                                        </div>
                                    ))}
                                    {responseDetail.answers && responseDetail.answers.length > 8 && (
                                        <div className="text-xs text-muted-foreground">...mais respostas ocultas</div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="p-3 mb-4 text-sm text-muted-foreground">{loadingResponseDetail ? 'Carregando detalhes...' : 'Detalhes da resposta não disponíveis.'}</div>
                        )
                    )}
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="doctorId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Profissional*</FormLabel>
                                    <FormControl>
                                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value} disabled={visibleOnly}>
                                            <SelectTrigger>
                                                <SelectValue placeholder={loadingDoctors ? 'Carregando...' : 'Selecione um profissional'} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {doctors.length === 0 && !loadingDoctors && (
                                                    // Radix Select requires non-empty value on items. Use a sentinel value and disable the item.
                                                    <SelectItem value="__no_doctor" disabled>Nenhum profissional disponível</SelectItem>
                                                )}
                                                {doctors?.map((d: any) => (
                                                    <SelectItem key={d.idUser} value={d.idUser}>{d.name} - {d.email}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
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
                                        {/* data minima hoje */}
                                        <Input type="datetime-local" {...field} min={new Date().toISOString().slice(0, 16)} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

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
                                {/* se tiver o id coloca editar */}
                                {appointment?.id ? 'Salvar Alterações' : 'Agendar'}
                            </Button>
                        </DialogFooter>}
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
