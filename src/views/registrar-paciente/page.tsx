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
  const [answersByForm, setAnswersByForm] = useState<Record<string, any>>({})

  const [isLoadingForms, setIsLoadingForms] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isFetchingPatient, setIsFetchingPatient] = useState(false)
  const { setAlert } = useAlert()

  useEffect(() => {
    const fetchScreening = async () => {
      try {
        setIsLoadingForms(true)
        const res = await api.get('/forms/screenings')
        console.log("screenings: ",res.data);
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
        console.log(res.data);
        
        const data = res.data || res

        form.reset({
          name: data.name || '',
          birthDate: data.birthDate || '',
          cpf: data.cpf || '',
          sexo: data.sexo || '',
          unidadeSaude: data.unidadeSaude || '',
          medicamentos: data.medicamentos || '',
          exames: Boolean(data.exames),
          examesDetalhes: data.examesDetalhes || '',
          alergias: data.alergias || '',
        })

        // prefill screening answers if present
        if (data.screeningAnswers) {
          setAnswersByForm(data.screeningAnswers || {})
          const selected: Record<string, boolean> = {}
          Object.keys(data.screeningAnswers).forEach((fid) => { selected[fid] = true })
          setSelectedFormIds(selected)
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
    setSelectedFormIds(prev => ({ ...prev, [id]: !prev[id] }))
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
    }

    for (const form of screeningForms || []) {
      if (selectedFormIds[form.idForm]) {
        payload.screeningAnswers[form.idForm] = answersByForm[form.idForm] || {}
      }
    }

    try {
      if (idUser) {
        await api.put(`/patients/${idUser}`, payload)
        // responde o formulario
        setAlert('Paciente atualizado com sucesso', 'success')
      } else {
        await api.post('/patients', payload)
        // responde o formulario
        setAlert('Paciente cadastrado com sucesso', 'success')
      }
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
                      <label className="inline-flex items-center gap-2">
                        <input type="checkbox" checked={!!selectedFormIds[form.idForm]} onChange={() => toggleSelectForm(form.idForm)} />
                        <span className="text-sm">Responder</span>
                      </label>
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
