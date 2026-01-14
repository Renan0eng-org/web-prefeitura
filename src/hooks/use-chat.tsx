"use client"

import React, { createContext, useContext, useState, ReactNode } from "react"

type ChatContextType = {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  toggleChat: () => void
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

export function ChatProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)

  const toggleChat = () => {
    setIsOpen(!isOpen)
  }

  return (
    <ChatContext.Provider value={{ isOpen, setIsOpen, toggleChat }}>
      {children}
    </ChatContext.Provider>
  )
}

export function useChat() {
  const context = useContext(ChatContext)
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider")
  }
  return context
}
