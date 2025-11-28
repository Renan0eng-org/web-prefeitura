"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from '@/hooks/use-auth'
import AgendamentosTab from "@/views/form-builder/tabs/AgendamentosTab"
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

  return (
    <Tabs value={value} onValueChange={(v) => setValue(v)} className="flex w-full flex-col justify-start gap-6">
      <TabsList>
        {formularioPerm?.visualizar && <TabsTrigger value="forms">Formulários</TabsTrigger>}
        <TabsTrigger value="esteira-pacientes">Esteira de Pacientes</TabsTrigger>
        <TabsTrigger value="agendamentos">Agendamentos</TabsTrigger>
      </TabsList>

      {formularioPerm?.visualizar && <TabsContent value="forms" className="mt-4">
        <FormulariosTab />
      </TabsContent>}

      <TabsContent value="esteira-pacientes" className="mt-4">
        <EsteiraPacientesTab />
      </TabsContent>

      <TabsContent value="agendamentos" className="mt-4">
        <AgendamentosTab />
      </TabsContent>
    </Tabs>
  )
}
