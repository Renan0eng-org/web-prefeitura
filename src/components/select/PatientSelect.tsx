"use client"

import { Input } from "@/components/ui/input"
import { useAlert } from "@/hooks/use-alert"
import api from "@/services/api"
import * as React from "react"

interface Patient {
    idUser: string
    name: string
    email: string
    cpf: string
}

interface PatientSelectProps {
    value: string
    onChange: (idUser: string) => void
    disabled?: boolean
    placeholder?: string
}

export const PatientSelect = React.forwardRef<HTMLInputElement, PatientSelectProps>(
    ({ value, onChange, disabled = false, placeholder }, ref) => {
        const [patients, setPatients] = React.useState<Patient[]>([])
        const [loading, setLoading] = React.useState(false)
        const [search, setSearch] = React.useState("")
        const [open, setOpen] = React.useState(false)
        const { setAlert } = useAlert()
        const containerRef = React.useRef<HTMLDivElement>(null)

        const selectedPatient = patients.find(p => p.idUser === value)

        React.useEffect(() => {
            if (!search || search.length < 2) {
                setPatients([])
                return
            }

            const timeout = setTimeout(async () => {
                try {
                    setLoading(true)
                    const res = await api.get('/patients', { params: { name: search, pageSize: 20 } })
                    const data = res.data?.data ?? res.data ?? []
                    setPatients(Array.isArray(data) ? data : [])
                    setOpen(true)
                } catch (err) {
                    console.error('Erro ao buscar pacientes:', err)
                    setAlert('Não foi possível carregar lista de pacientes.', 'error')
                    setPatients([])
                } finally {
                    setLoading(false)
                }
            }, 300)

            return () => clearTimeout(timeout)
        }, [search])

        React.useEffect(() => {
            const handleClickOutside = (e: MouseEvent) => {
                if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                    setOpen(false)
                }
            }
            document.addEventListener("mousedown", handleClickOutside)
            return () => document.removeEventListener("mousedown", handleClickOutside)
        }, [])

        return (
            <div ref={containerRef} className="relative">
                <Input
                    ref={ref}
                    value={selectedPatient && !open ? `${selectedPatient.name} - ${selectedPatient.cpf}` : search}
                    onChange={(e) => {
                        setSearch(e.target.value)
                        if (value) onChange("")
                    }}
                    onFocus={() => {
                        if (selectedPatient) {
                            setSearch(selectedPatient.name)
                        }
                        if (patients.length > 0) setOpen(true)
                    }}
                    placeholder={loading ? "Buscando..." : placeholder || "Digite o nome do paciente..."}
                    disabled={disabled}
                    autoComplete="off"
                />
                {open && patients.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 max-h-48 overflow-y-auto rounded-md border bg-popover shadow-md">
                        {patients.map((patient) => (
                            <button
                                key={patient.idUser}
                                type="button"
                                className="w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                                onClick={() => {
                                    onChange(patient.idUser)
                                    setSearch(patient.name)
                                    setOpen(false)
                                }}
                            >
                                {patient.name} - {patient.cpf}
                            </button>
                        ))}
                    </div>
                )}
                {open && search.length >= 2 && patients.length === 0 && !loading && (
                    <div className="absolute z-50 w-full mt-1 rounded-md border bg-popover shadow-md px-3 py-2 text-sm text-muted-foreground">
                        Nenhum paciente encontrado
                    </div>
                )}
            </div>
        )
    }
)

PatientSelect.displayName = "PatientSelect"
