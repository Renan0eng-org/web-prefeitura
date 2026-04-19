"use client"

import { useAuth } from "@/hooks/use-auth"
import { useChat } from "@/hooks/use-chat"
import { cn } from "@/lib/utils"
import { MessageCircle } from "lucide-react"

export function ChatFloatButton() {
  const { isOpen, toggleChat } = useChat()
  const { getPermissions, loading: authLoading } = useAuth()

  const permissions = !authLoading && getPermissions
    ? getPermissions('chat-ai')
    : null

  // Só mostra o botão se o usuário tiver permissão de visualizar
  if (authLoading || !permissions?.visualizar) {
    return null
  }

  return (
    <button
      onClick={toggleChat}
      className={cn(
        "fixed z-30 flex items-center justify-center rounded-full shadow-lg transition-all duration-300 text-white touch-manipulation",
        isOpen
          ? "right-4 top-4 h-10 w-10 bg-red-500 hover:bg-red-600 active:bg-red-700 md:h-12 md:w-12 md:right-4 md:top-4 hidden"
          : "right-4 bottom-6 h-14 w-14 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 md:h-12 md:w-12 md:right-6 md:bottom-6"
      )}
      title={isOpen ? "Fechar chat" : "Abrir chat"}
    >
      <MessageCircle className={cn("h-6 w-6", !isOpen && "h-7 w-7 md:h-6 md:w-6")} />
    </button>
  )
}
