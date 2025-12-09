"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAlert } from "@/hooks/use-alert"
import api from "@/services/api"
import * as React from "react"

interface Professional {
    idUser: string
    name: string
    email: string
    type: string
}

interface ProfessionalSelectProps {
    value: string
    onChange: (idUser: string) => void
    disabled?: boolean
    filterFn?: (professionals: Professional[]) => Professional[]
    placeholder?: string
}

export const ProfessionalSelect = React.forwardRef<HTMLButtonElement, ProfessionalSelectProps>(
    ({ value, onChange, disabled = false, placeholder, filterFn }, ref) => {
        const [professionals, setProfessionals] = React.useState<Professional[]>([])
        const [loading, setLoading] = React.useState(false)
        const { setAlert } = useAlert()

        React.useEffect(() => {
            const fetchProfessionals = async () => {
                try {
                    setLoading(true)
                    const res = await api.get('/appointments/users/professional')
                    const list = res.data || []

                    let filtered = list
                    if (filterFn) {
                        filtered = filterFn(list)
                        setProfessionals(filtered)
                    } else {
                        setProfessionals(list)
                    }

                } catch (err) {
                    console.error('Erro ao buscar profissionais:', err)
                    setAlert('Não foi possível carregar lista de profissionais.', 'error')
                    setProfessionals([])
                } finally {
                    setLoading(false)
                }
            }

            fetchProfessionals()
        }, [filterFn, setAlert])

        return (
            <Select onValueChange={onChange} value={value} disabled={disabled || loading}>
                <SelectTrigger ref={ref}>
                    <SelectValue placeholder={loading ? 'Carregando...' : placeholder || 'Selecione um profissional'} />
                </SelectTrigger>
                <SelectContent>
                    {professionals.length === 0 && !loading && (
                        <SelectItem value="__no_professional" disabled>
                            Nenhum profissional disponível
                        </SelectItem>
                    )}
                    {professionals.map((professional) => (
                        <SelectItem key={professional.idUser} value={professional.idUser}>
                            {professional.name} - {professional.email}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        )
    }
)

ProfessionalSelect.displayName = "ProfessionalSelect"
