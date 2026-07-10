"use client"

import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAlert } from "@/hooks/use-alert"
import api from "@/services/api"
import { MenuAcesso, NivelMenuPermissao } from "@/types/access-level"
import { Loader2, Save } from "lucide-react"
import * as React from "react"

const PERM_KEYS = ["visualizar", "criar", "editar", "excluir", "relatorio"] as const
type PermKey = typeof PERM_KEYS[number]

const PERM_LABELS: Record<PermKey, string> = {
    visualizar: "Visualizar",
    criar: "Criar",
    editar: "Editar",
    excluir: "Excluir",
    relatorio: "Relatório",
}

type PermState = Record<PermKey, boolean>

interface PermissaoMatrixProps {
    nivelId: number
    todosMenus: MenuAcesso[]
    permissoes: NivelMenuPermissao[]
    canEdit: boolean
    onSaved: () => void
}

export function PermissaoMatrix({ nivelId, todosMenus, permissoes, canEdit, onSaved }: PermissaoMatrixProps) {
    const { setAlert } = useAlert()
    const [isSaving, setIsSaving] = React.useState(false)

    const [state, setState] = React.useState<Map<number, PermState>>(new Map())

    React.useEffect(() => {
        const map = new Map<number, PermState>()
        for (const menu of todosMenus) {
            const existing = permissoes.find(p => p.menuAcessoId === menu.idMenuAcesso)
            map.set(menu.idMenuAcesso, {
                visualizar: existing?.visualizar ?? false,
                criar: existing?.criar ?? false,
                editar: existing?.editar ?? false,
                excluir: existing?.excluir ?? false,
                relatorio: existing?.relatorio ?? false,
            })
        }
        setState(map)
    }, [todosMenus, permissoes])

    const toggle = (menuId: number, key: PermKey) => {
        setState(prev => {
            const next = new Map(prev)
            const current = next.get(menuId)!
            next.set(menuId, { ...current, [key]: !current[key] })
            return next
        })
    }

    const toggleRow = (menuId: number) => {
        setState(prev => {
            const next = new Map(prev)
            const current = next.get(menuId)!
            const allOn = PERM_KEYS.every(k => current[k])
            const newVal = !allOn
            next.set(menuId, {
                visualizar: newVal,
                criar: newVal,
                editar: newVal,
                excluir: newVal,
                relatorio: newVal,
            })
            return next
        })
    }

    const toggleColumn = (key: PermKey) => {
        setState(prev => {
            const next = new Map(prev)
            const allOn = Array.from(next.values()).every(p => p[key])
            const newVal = !allOn
            for (const [menuId, perms] of next) {
                next.set(menuId, { ...perms, [key]: newVal })
            }
            return next
        })
    }

    const handleSave = async () => {
        setIsSaving(true)
        try {
            const permissoesPayload = Array.from(state.entries())
                .filter(([, perms]) => PERM_KEYS.some(k => perms[k]))
                .map(([menuAcessoId, perms]) => ({
                    menuAcessoId,
                    ...perms,
                }))

            await api.put(`/admin/acesso/niveis/${nivelId}/permissoes`, { permissoes: permissoesPayload })
            setAlert("Permissões salvas com sucesso!", "success")
            onSaved()
        } catch (err: any) {
            setAlert(err.response?.data?.message || "Erro ao salvar permissões.", "error")
        } finally {
            setIsSaving(false)
        }
    }

    if (todosMenus.length === 0) {
        return <p className="text-sm text-muted-foreground py-4">Nenhum menu cadastrado no sistema.</p>
    }

    return (
        <div className="space-y-4">
            <div className="rounded-md border overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="min-w-[180px]">Menu</TableHead>
                            {PERM_KEYS.map(key => (
                                <TableHead key={key} className="text-center w-[100px]">
                                    <button
                                        type="button"
                                        onClick={() => canEdit && toggleColumn(key)}
                                        className={`text-xs font-medium ${canEdit ? "cursor-pointer hover:underline" : ""}`}
                                        disabled={!canEdit}
                                    >
                                        {PERM_LABELS[key]}
                                    </button>
                                </TableHead>
                            ))}
                            {canEdit && (
                                <TableHead className="text-center w-[80px]">
                                    <span className="text-xs font-medium">Todos</span>
                                </TableHead>
                            )}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {todosMenus.map(menu => {
                            const perms = state.get(menu.idMenuAcesso)
                            if (!perms) return null
                            const allOn = PERM_KEYS.every(k => perms[k])

                            return (
                                <TableRow key={menu.idMenuAcesso}>
                                    <TableCell>
                                        <div className="font-medium text-sm">{menu.nome}</div>
                                        <div className="text-xs text-muted-foreground">{menu.slug}</div>
                                    </TableCell>
                                    {PERM_KEYS.map(key => (
                                        <TableCell key={key} className="text-center">
                                            <Switch
                                                checked={perms[key]}
                                                onCheckedChange={() => toggle(menu.idMenuAcesso, key)}
                                                disabled={!canEdit}
                                            />
                                        </TableCell>
                                    ))}
                                    {canEdit && (
                                        <TableCell className="text-center">
                                            <Switch
                                                checked={allOn}
                                                onCheckedChange={() => toggleRow(menu.idMenuAcesso)}
                                            />
                                        </TableCell>
                                    )}
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </div>

            {canEdit && (
                <div className="flex justify-end">
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        Salvar Permissões
                    </Button>
                </div>
            )}
        </div>
    )
}
