"use client"

import { useEffect, useState } from "react"
import api from "@/services/api"

export default function ImpersonarPage() {
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const userId = new URLSearchParams(window.location.search).get("userId")
    if (!userId) {
      setError("Usuário não informado.")
      return
    }

    let cancelled = false
    api.post(`/auth/impersonate/${encodeURIComponent(userId)}`)
      .then(({ data }) => {
        if (!cancelled) {
          window.location.replace(`/admin#impersonation=${encodeURIComponent(data.accessToken)}`)
        }
      })
      .catch((err: any) => {
        if (!cancelled) {
          setError(err.response?.data?.message || "Não foi possível abrir a visualização do usuário.")
        }
      })

    return () => { cancelled = true }
  }, [])

  return (
    <main className="flex min-h-[50vh] items-center justify-center p-6">
      <div className="text-center">
        {!error ? (
          <>
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
            <p className="text-sm text-muted-foreground">Abrindo a visão do usuário...</p>
          </>
        ) : (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </div>
    </main>
  )
}
