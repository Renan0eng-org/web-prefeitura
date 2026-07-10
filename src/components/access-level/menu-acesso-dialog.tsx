"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useAlert } from "@/hooks/use-alert"
import api from "@/services/api"
import { MenuAcesso } from "@/types/access-level"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import * as React from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

const menuAcessoSchema = z.object({
    nome: z.string().min(3, "O nome é obrigatório."),
    slug: z.string().min(3, "O slug é obrigatório (ex: 'meu-menu')."),
})

type MenuAcessoFormValues = z.infer<typeof menuAcessoSchema>

interface MenuAcessoDialogProps {
    isOpen: boolean
    onOpenChange: (isOpen: boolean) => void
    menu: MenuAcesso | null
    onDataChanged: () => void
}

export function MenuAcessoDialog({
    isOpen,
    onOpenChange,
    menu,
    onDataChanged,
}: MenuAcessoDialogProps) {

    const [isSubmitting, setIsSubmitting] = React.useState(false)
    const { setAlert } = useAlert()

    const form = useForm<MenuAcessoFormValues>({
        resolver: zodResolver(menuAcessoSchema),
        defaultValues: { nome: "", slug: "" },
    })

    React.useEffect(() => {
        if (menu) {
            form.reset({ nome: menu.nome, slug: menu.slug })
        } else {
            form.reset({ nome: "", slug: "" })
        }
    }, [menu, form])

    async function onSubmit(data: MenuAcessoFormValues) {
        setIsSubmitting(true)
        try {
            if (menu) {
                await api.put(`/admin/acesso/menus/${menu.idMenuAcesso}`, data)
                setAlert("Menu atualizado!", "success")
            } else {
                await api.post('/admin/acesso/menus', data)
                setAlert("Menu criado!", "success")
            }
            onDataChanged()
            onOpenChange(false)
        } catch (err: any) {
            setAlert(err.response?.data?.message || "Erro ao salvar menu.", "error")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{menu ? "Editar" : "Novo"} Menu do Sistema</DialogTitle>
                    <DialogDescription>
                        {menu ? "Edite o nome e slug do menu." : "Crie um novo menu para o sistema."}
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="nome"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nome do Menu</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ex: Gerenciar Usuários" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="slug"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Slug</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ex: gerenciar-usuarios" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Salvar Menu
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
