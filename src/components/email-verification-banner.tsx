"use client"

import { Button } from "@/components/ui/button"
import { useAlert } from "@/hooks/use-alert"
import { useAuth } from "@/hooks/use-auth"
import api from "@/services/api"
import { Loader2, MailWarning, X } from "lucide-react"
import * as React from "react"

export function EmailVerificationBanner() {
    const { user } = useAuth()
    const { setAlert } = useAlert()
    const [dismissed, setDismissed] = React.useState(false)
    const [sending, setSending] = React.useState(false)
    const [sent, setSent] = React.useState(false)

    if (!user || user.emailVerified !== false || dismissed) return null

    const handleResend = async () => {
        setSending(true)
        try {
            await api.post("/auth/resend-verification")
            setSent(true)
            setAlert("E-mail de verificação enviado! Confira sua caixa de entrada.", "success")
        } catch (err: any) {
            setAlert(err.response?.data?.message || "Erro ao enviar e-mail de verificação.", "error")
        } finally {
            setSending(false)
        }
    }

    return (
        <div className="flex items-center gap-2 border-b border-amber-200 bg-amber-50 px-3 py-1.5 text-xs text-amber-800 md:px-4">
            <MailWarning className="h-3.5 w-3.5 shrink-0" />
            <span className="flex-1 truncate">
                Seu e-mail ainda não foi verificado.
            </span>
            {!sent && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleResend}
                    disabled={sending}
                    className="h-6 px-2 text-xs font-semibold text-amber-800 hover:bg-amber-100 hover:text-amber-900"
                >
                    {sending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Reenviar e-mail"}
                </Button>
            )}
            {sent && <span className="font-semibold">Enviado!</span>}
            <button
                onClick={() => setDismissed(true)}
                className="rounded p-0.5 hover:bg-amber-100"
                aria-label="Fechar aviso"
            >
                <X className="h-3.5 w-3.5" />
            </button>
        </div>
    )
}
