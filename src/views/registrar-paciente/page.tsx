"use client"

import BtnVoltar from '@/components/buttons/btn-voltar'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Skeleton } from '@/components/ui/skeleton'
import { useAlert } from '@/hooks/use-alert'
import api from '@/services/api'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

type ScreeningForm = {
  idForm: string
  title: string
  description?: string
  questions?: any[]
}

export default function RegisterPatientPage({idUser}: {idUser?: string}) {
  type FormValues = {
    name: string
    birthDate: string
    cpf: string
    sexo: '' | 'FEMININO' | 'MASCULINO' | 'OUTRO'
    unidadeSaude: string
    medicamentos: string
    exames: boolean
    examesDetalhes: string
    alergias: string
  }

  const form = useForm<FormValues>({
    defaultValues: {
      name: '',
      birthDate: '',
      cpf: '',
      sexo: '',
      unidadeSaude: '',
      medicamentos: '',
      exames: false,
      examesDetalhes: '',
      alergias: '',
    }
  })

  const { watch, control } = form

  const [screeningForms, setScreeningForms] = useState<ScreeningForm[] | null>(null)
  const [selectedFormIds, setSelectedFormIds] = useState<Record<string, boolean>>({})
  const [assignedFormIds, setAssignedFormIds] = useState<Record<string, boolean>>({})
  // keep the originally-assigned forms (when editing) to detect removals
  const [originalAssignedFormIds, setOriginalAssignedFormIds] = useState<Record<string, boolean>>({})
  // map of existing response id by form id (when editing a patient who already answered)
  const [existingResponseIdByForm, setExistingResponseIdByForm] = useState<Record<string, string>>({})
  const [answersByForm, setAnswersByForm] = useState<Record<string, any>>({})

  const [isLoadingForms, setIsLoadingForms] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isFetchingPatient, setIsFetchingPatient] = useState(false)
  const { setAlert } = useAlert()

  const router = useRouter();

  useEffect(() => {
    const fetchScreening = async () => {
      try {
        setIsLoadingForms(true)
        const res = await api.get('/forms/screenings')
        
        setScreeningForms(res.data.forms || res.data || [])
      } catch (err) {
        console.error('Erro ao buscar formulários de screening', err)
        setScreeningForms([])
      } finally {
        setIsLoadingForms(false)
      }
    }

    fetchScreening()
  }, [])

  // If idUser provided, fetch patient data and populate form
  useEffect(() => {
    if (!idUser) return

    const fetchPatient = async () => {
      try {
        setIsFetchingPatient(true)
        const res = await api.get(`/patients/${idUser}`)
        
        
        const data = res.data || res

        const birthDate = data.birthDate ? new Date(data.birthDate) : null;

        form.reset({
          name: data.name || '',
          birthDate: birthDate ? birthDate.toISOString().substring(0, 10) : '',
          cpf: data.cpf || '',
          sexo: data.sexo || '',
          unidadeSaude: data.unidadeSaude || '',
          medicamentos: data.medicamentos || '',
          exames: Boolean(data.exames),
          examesDetalhes: data.examesDetalhes || '',
          alergias: data.alergias || '',
        })

        // prefill assigned forms (fromAssigned) returned by backend
        const assigned: Record<string, boolean> = {}
        const fromAssigned = data.fromAssigned || data.assignedForms || []
        if (Array.isArray(fromAssigned)) {
          fromAssigned.forEach((f: any) => {
            if (f && f.idForm) assigned[f.idForm] = true
          })
        }
        setAssignedFormIds(assigned)
        // record original assigned set for later delta (unassign) detection
        setOriginalAssignedFormIds(assigned)

        // If backend returned full assigned forms, merge them into screeningForms so UI shows details
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
        const formResponses = data.formResponses || []
        if (Array.isArray(formResponses) && formResponses.length > 0) {
          const answersMap: Record<string, Record<string, any>> = {}
          const selected: Record<string, boolean> = {}
          const existingMap: Record<string, string> = {}
          formResponses.forEach((resp: any) => {
            const formId = resp.form?.idForm || resp.formId || resp.form?.id
            if (!formId) return
            selected[formId] = true
            answersMap[formId] = answersMap[formId] || {}
            // try to capture an identifier for the existing response so we can update instead of creating
            const respId = resp.idResponse || resp.id || resp.responseId || resp._id
            if (respId) existingMap[formId] = respId
            ;(resp.answers || []).forEach((a: any) => {
              if (a.value !== null && a.value !== undefined) answersMap[formId][a.question?.idQuestion || a.questionId || a.questionId] = a.value
              else if (a.values !== null && a.values !== undefined) answersMap[formId][a.question?.idQuestion || a.questionId || a.questionId] = a.values
            })
          })
          // merge with any existing answersByForm
          setAnswersByForm(prev => ({ ...(prev || {}), ...(answersMap || {}) }))
          setExistingResponseIdByForm(prev => ({ ...(prev || {}), ...(existingMap || {}) }))
          // mark selected forms for which we have responses (do NOT suppress if also assigned)
          setSelectedFormIds(prev => ({ ...(prev || {}), ...(selected || {}) }))
        }
      } catch (err) {
        console.error('Erro ao buscar paciente', err)
        setAlert('Não foi possível carregar dados do paciente.', 'error')
      } finally {
        setIsFetchingPatient(false)
      }
    }

    fetchPatient()
  }, [idUser])

  const toggleSelectForm = (id: string) => {
    setSelectedFormIds(prev => {
      const next = { ...prev, [id]: !prev[id] }
      // if user chose to answer now, ensure it's not assigned
      if (next[id]) {
        setAssignedFormIds(a => ({ ...a, [id]: false }))
      }
      return next
    })
  }

  const toggleAssignForm = (id: string) => {
    setAssignedFormIds(prev => {
      const next = { ...prev, [id]: !prev[id] }
      // if user assigned the form, ensure it's not selected to answer now
      if (next[id]) {
        setSelectedFormIds(s => ({ ...s, [id]: false }))
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

  const onSubmit = async (data: FormValues) => {
    // clear previous alerts
    // (no-op: setAlert will show fresh notifications)
    setIsSubmitting(true)

    const payload: any = {
      email: `${data.cpf.replace(/\D/g,'')}@paciente.local`, // fallback email if none
      password: data.cpf.replace(/\D/g,''), // fallback password if none
      name: data.name,
      birthDate: data.birthDate,
      cpf: data.cpf,
      sexo: data.sexo,
      unidadeSaude: data.unidadeSaude,
      medicamentos: data.medicamentos,
      exames: data.exames,
      examesDetalhes: data.examesDetalhes,
      alergias: data.alergias,
      screeningAnswers: {},
      assignedForms: [],
    }

    // pre-submit: ensure all selected forms to RESPONDER have required questions answered
    const formsToRespondPrecheck = (screeningForms || []).filter((f) => selectedFormIds[f.idForm])
    const invalidPre: string[] = []
    for (const form of formsToRespondPrecheck) {
      const questions = form.questions || []
      const answersMap = answersByForm[form.idForm] || {}
      for (const q of questions) {
        if (q.required) {
          const val = answersMap[q.idQuestion]
          if (val === undefined || val === null) {
            invalidPre.push(form.title || form.idForm)
            break
          }
          if (Array.isArray(val) && val.length === 0) {
            invalidPre.push(form.title || form.idForm)
            break
          }
          if (!Array.isArray(val) && String(val).trim() === '') {
            invalidPre.push(form.title || form.idForm)
            break
          }
        }
      }
    }

    if (invalidPre.length > 0) {
      setAlert(`Preencha os campos obrigatórios dos formulários: ${invalidPre.join(', ')} antes de salvar.`, 'warning', 8000)
      setIsSubmitting(false)
      return
    }

    for (const form of screeningForms || []) {
      if (selectedFormIds[form.idForm]) {
        payload.screeningAnswers[form.idForm] = answersByForm[form.idForm] || {}
      }
      if (assignedFormIds[form.idForm]) {
        payload.assignedForms.push(form.idForm)
      }
    }

    try {
      let patientId = idUser

      if (idUser) {
        await api.put(`/patients/${idUser}`, payload)
        patientId = idUser
      } else {
        const res = await api.post('/patients', payload)
        // try to read created id from response
        patientId = res?.data?.idUser || res?.data?.id || res?.data?.user?.id || patientId
      }

      // If the user removed selection for forms that already had responses, delete those responses
      const responseFormIds = Object.keys(existingResponseIdByForm || {}).filter(k => existingResponseIdByForm[k])
      const toDeleteResponseFormIds = responseFormIds.filter(id => !selectedFormIds[id])
      if (toDeleteResponseFormIds.length > 0) {
        if (!patientId) {
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

          // remove deleted entries from local state
          setExistingResponseIdByForm(prev => {
            const next = { ...(prev || {}) }
            toDeleteResponseFormIds.forEach(id => delete next[id])
            return next
          })
        }
      }

      // For each form selected to RESPONDER, submit a response to the form endpoint
      const formsToRespond = (screeningForms || []).filter((f) => selectedFormIds[f.idForm])
      // validate required questions before sending responses
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
          if (patientId) respPayload.userId = patientId

          // if we have an existing response id for this form, update it instead of creating a new one
          const existingRespId = existingResponseIdByForm[form.idForm]
          if (existingRespId) {
            // try to update (PUT). If backend uses different method, adjust accordingly.
            return api.put(`/forms/${form.idForm}/responses/${existingRespId}`, respPayload)
          }

          const res = await api.post(`/forms/${form.idForm}/responses`, respPayload)
          // if created, try to capture the new response id to update state
          const newId = res?.data?.idResponse || res?.data?.id || res?.data?.responseId
          if (newId) setExistingResponseIdByForm(prev => ({ ...(prev || {}), [form.idForm]: newId }))
          return res
        })

        const results = await Promise.allSettled(submitPromises)
        const failed = results.filter(r => r.status === 'rejected')
        if (failed.length > 0) {
          setAlert(`${failed.length} formulário(s) não puderam ser respondidos automaticamente.`, 'warning')
        }
      }

      // For each form marked to ASSIGN, call the assign endpoint so backend registers the assignment
      const formsToAssign = (screeningForms || []).filter((f) => assignedFormIds[f.idForm])
      // detect which originally-assigned forms were removed in this edit
      const originalAssignedIds = Object.keys(originalAssignedFormIds || {}).filter(k => originalAssignedFormIds[k])
      const currentAssignedIds = Object.keys(assignedFormIds || {}).filter(k => assignedFormIds[k])
      const toUnassignIds = originalAssignedIds.filter(id => !currentAssignedIds.includes(id))
      if (formsToAssign.length > 0) {
        if (!patientId) {
          setAlert('Paciente criado mas não foi possível obter o id para atribuir formulários.', 'warning')
        } else {
          const assignPromises = formsToAssign.map((form) => api.post(`/forms/${form.idForm}/assign`, { userIds: [patientId] }))
          const assignResults = await Promise.allSettled(assignPromises)
          const assignFailed = assignResults.filter(r => r.status === 'rejected')
          if (assignFailed.length > 0) {
            setAlert(`${assignFailed.length} atribuição(ões) falharam.`, 'warning')
          }
        }
      }

      // For any forms that were previously assigned but now unmarked, call unassign endpoint
      if (toUnassignIds.length > 0) {
        if (!patientId) {
          setAlert('Não foi possível obter o id do paciente para desatribuir formulários.', 'warning')
        } else {
          const unassignPromises = toUnassignIds.map((formId) => api.post(`/forms/${formId}/unassign`, { userIds: [patientId] }))
          const unassignResults = await Promise.allSettled(unassignPromises)
          const unassignFailed = unassignResults.filter(r => r.status === 'rejected')
          if (unassignFailed.length > 0) {
            setAlert(`${unassignFailed.length} desatribuição(ões) falharam.`, 'warning')
          }
        }
      }

      // Additionally: any form that comes from /forms/screenings and is NOT in assignedFormIds
      // should be unassigned as well (per request). Avoid duplicating IDs already processed.
      const screeningFormIds = (screeningForms || []).map(f => f.idForm).filter(Boolean)
      const screeningNotAssigned = screeningFormIds.filter(id => !assignedFormIds[id])
      const extraToUnassign = screeningNotAssigned.filter(id => !toUnassignIds.includes(id))
      if (extraToUnassign.length > 0) {
        if (!patientId) {
          setAlert('Não foi possível obter o id do paciente para desatribuir formulários de screening.', 'warning')
        } else {
          const extraPromises = extraToUnassign.map((formId) => api.post(`/forms/${formId}/unassign`, { userIds: [patientId] }))
          const extraResults = await Promise.allSettled(extraPromises)
          const extraFailed = extraResults.filter(r => r.status === 'rejected')
          if (extraFailed.length > 0) {
            setAlert(`${extraFailed.length} desatribuição(ões) adicionais falharam.`, 'warning')
          }
        }
      }

      setAlert(idUser ? 'Paciente atualizado com sucesso' : 'Paciente cadastrado com sucesso', 'success')
      router.back()
    } catch (err: any) {
      console.error('Erro ao cadastrar paciente', err)
      const msg = err?.response?.data?.message || err?.message || 'Erro ao cadastrar'
      setAlert(msg, 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 relative xxl:pt-6 pt-12">
      <BtnVoltar />

      <h1 className="text-2xl font-semibold mb-4">{idUser ? 'Editar Paciente' : 'Cadastro de Paciente'}</h1>

      <section className="mb-6 bg-card p-4 rounded-md">
        <h2 className="font-medium mb-2">IDENTIFICAÇÃO</h2>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <FormField
              control={control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="birthDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data de Nascimento</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="cpf"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CPF</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="sexo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sexo</FormLabel>
                  <FormControl>
                    <RadioGroup value={field.value} onValueChange={field.onChange}>
                      <div className="flex items-center gap-4 mt-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="FEMININO" id="sexo-feminino" />
                          <Label htmlFor="sexo-feminino">Feminino</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="MASCULINO" id="sexo-masculino" />
                          <Label htmlFor="sexo-masculino">Masculino</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="OUTRO" id="sexo-outro" />
                          <Label htmlFor="sexo-outro">Outro</Label>
                        </div>
                      </div>
                    </RadioGroup>
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="unidadeSaude"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unidade de Saúde de origem</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="medicamentos"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Medicamentos em uso para dor</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="md:col-span-2">
              <FormField
                control={control}
                name="exames"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="flex items-center gap-3">
                        <Checkbox checked={field.value} onCheckedChange={(v) => field.onChange(Boolean(v))} />
                        <Label>Já realizou exames para a sua dor crônica?</Label>
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />

              {watch('exames') && (
                <FormField
                  control={control}
                  name="examesDetalhes"
                  render={({ field }) => (
                    <FormItem className="mt-3">
                      <FormControl>
                        <Input {...field} placeholder="Se sim, quais?" className="pt-4" />
                      </FormControl>
                    </FormItem>
                  )}
                />
              )}
            </div>

            <FormField
              control={control}
              name="alergias"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Possui alergia a alguma medicação ou outros?</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          </form>
        </Form>
      </section>

      {screeningForms && screeningForms.length > 0 && <section className="mb-6 bg-card p-4 rounded-md">
        <h2 className="font-medium mb-2">Formulários atribuídos ao pré-cadastro</h2>

        {(isLoadingForms || isFetchingPatient) ? (
          <div className="space-y-2">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : (
          <div className="space-y-4">
            {(screeningForms && screeningForms.length > 0) ? (
              screeningForms.map((form) => (
                <div key={form.idForm} className="border rounded-md p-3">
                  <div className="flex items-center justify-between">
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
                      {/* Simplified rendering of questions if available */}
                      {form.questions && form.questions.length > 0 ? (
                        form.questions.map((q: any) => (
                          <div key={q.idQuestion} className="flex flex-col">
                            <label className="font-medium">{q.text}</label>
                            {/* fallback: multiple choice / short text handling */}
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
              ))
            ) : (
              <div className="text-sm text-muted-foreground">Nenhum formulário de screening disponível.</div>
            )}
          </div>
        )}
      </section>}

      <div className="flex items-center gap-3">
        <Button variant="outline" onClick={() => window.history.back()}>Cancelar</Button>
        <Button onClick={form.handleSubmit(onSubmit)} disabled={isSubmitting || isFetchingPatient}>
          {isSubmitting ? 'Enviando...' : idUser ? 'Salvar alterações' : 'Confirmar pré-cadastro'}
        </Button>
      </div>

      
    </div>
  )
}
