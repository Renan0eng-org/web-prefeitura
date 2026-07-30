"use client"

import { LogOut, UserRoundCheck } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"

export function ImpersonationBanner() {
  const { user, isImpersonating, logout } = useAuth()

  if (!isImpersonating || !user) return null

  return (
    <div className="flex min-h-11 items-center justify-between gap-3 border-b border-amber-200 bg-amber-50 px-3 py-1.5 text-xs text-amber-800 px-4 py-2 text-sm font-medium dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
      <div className="flex min-w-0 items-center gap-2">
        <UserRoundCheck className="h-4 w-4 shrink-0" />
        <span className="truncate">
          Visualizando como <strong>{user.name}</strong> ({user.email})
        </span>
      </div>
      <button onClick={logout} className="inline-flex shrink-0 items-center gap-1 rounded-md border border-orange-300/70 px-2 py-1 text-xs hover:bg-orange-500/10">
        <LogOut className="h-3.5 w-3.5" />
        Sair da visualização
      </button>
    </div>
  )
}
