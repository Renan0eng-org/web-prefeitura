"use client"

import { useAuth } from "@/hooks/use-auth"
import { useChat } from "@/hooks/use-chat"
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
      className={`fixed right-4 top-4 z-30 flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-all duration-300 ${
        isOpen
          ? "bg-red-500 hover:bg-red-600"
          : "bg-blue-600 hover:bg-blue-700 lg:bottom-6"
      } text-white`}
      title={isOpen ? "Fechar chat" : "Abrir chat"}
    >
      <MessageCircle className="h-6 w-6" />
    </button>
  )
}
