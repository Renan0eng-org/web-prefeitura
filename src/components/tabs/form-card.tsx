"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from '@/hooks/use-auth'
import AgendamentosTab from "@/views/form-builder/tabs/AgendamentosTab"
import EncaminhamentosTab from "@/views/form-builder/tabs/EncaminhamentosTab"
import EsteiraPacientesTab from "@/views/form-builder/tabs/EsteiraPacientesTab"
import FormulariosTab from "@/views/form-builder/tabs/FormulariosTab"
import { useEffect, useMemo, useState } from 'react'

type Props = {
  storage?: 'local' | 'session'
  storageKey?: string
}

export default function FormCard({ storage = 'local', storageKey = 'formCard.activeTab' }: Props) {
  const { getPermissions } = useAuth()
  const formularioPerm = useMemo(() => getPermissions ? getPermissions('formulario') : null, [getPermissions])
  const esteiraPaciente = useMemo(() => getPermissions ? getPermissions('esteira-pacientes') : null, [getPermissions])
  const agendamentoPerm = useMemo(() => getPermissions ? getPermissions('agendamento') : null, [getPermissions])
  const encaminhamentoPerm = useMemo(() => getPermissions ? getPermissions('encaminhamento') : null, [getPermissions])

  const defaultTab = formularioPerm?.visualizar ? 'forms' : 'esteira-pacientes'

  const [value, setValue] = useState<string>(() => {
    try {
      if (typeof window === 'undefined') return defaultTab
      const s = storage === 'session' ? window.sessionStorage : window.localStorage
      const stored = s.getItem(storageKey)
      return stored ?? defaultTab
    } catch (e) {
      return defaultTab
    }
  })

  useEffect(() => {
    try {
      const s = storage === 'session' ? window.sessionStorage : window.localStorage
      s.setItem(storageKey, value)
    } catch (e) {
      // swallow
    }
  }, [value, storage, storageKey])

  if(!formularioPerm && !esteiraPaciente && !agendamentoPerm && !encaminhamentoPerm) {
    return (<div>Você não tem permissão para visualizar este conteúdo.</div>)
  }

  return (
    <Tabs value={value} onValueChange={(v) => setValue(v)} className="flex w-full flex-col justify-start gap-6">
      <TabsList>
        {formularioPerm?.visualizar && <TabsTrigger value="forms">Formulários</TabsTrigger>}
        {esteiraPaciente?.visualizar && <TabsTrigger value="esteira-pacientes">Esteira de Pacientes</TabsTrigger>}
        {encaminhamentoPerm?.visualizar && <TabsTrigger value="encaminhamento">Encaminhamentos</TabsTrigger>}
        {agendamentoPerm?.visualizar && <TabsTrigger value="agendamentos">Agendamentos</TabsTrigger>}
      </TabsList>

      {formularioPerm?.visualizar && <TabsContent value="forms" className="mt-4">
        <FormulariosTab />
      </TabsContent>}

      <TabsContent value="esteira-pacientes" className="mt-4">
        <EsteiraPacientesTab />
      </TabsContent>

      {agendamentoPerm?.visualizar && <TabsContent value="agendamentos" className="mt-4">
        <AgendamentosTab />
      </TabsContent>}

      {encaminhamentoPerm?.visualizar && <TabsContent value="encaminhamento" className="mt-4">
        <EncaminhamentosTab />
      </TabsContent>}
    </Tabs>
  )
}
