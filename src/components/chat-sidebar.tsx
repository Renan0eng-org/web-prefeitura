"use client"

import { useAuth } from "@/hooks/use-auth"
import { useChat } from "@/hooks/use-chat"
import { cn } from "@/lib/utils"
import api from "@/services/api"
import { ChevronLeft, GripVertical, History, Loader, MessageCircle, Plus, Send, X } from "lucide-react"
import React, { useCallback, useEffect, useRef, useState } from "react"

interface Message {
  id: string
  text: string
  sender: "user" | "bot"
  timestamp: Date
}

interface ChatHistory {
  idChat: string
  title: string
  updatedAt: string
  messages: any[]
}

const renderMarkdown = (text: string) => {
  const elements: React.ReactNode[] = []
  let key = 0

  const lines = text.split('\n')

  lines.forEach((line, lineIndex) => {
    if (lineIndex > 0) {
      elements.push(<br key={`br-${key++}`} />)
    }

    const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*|https?:\/\/[^\s]+)/g
    let lastIndex = 0
    let match

    while ((match = pattern.exec(line)) !== null) {
      if (match.index > lastIndex) {
        elements.push(line.substring(lastIndex, match.index))
      }

      const matchText = match[0]

      if (matchText.startsWith('**') && matchText.endsWith('**')) {
        elements.push(
          <strong key={`bold-${key++}`} className="font-bold">
            {matchText.slice(2, -2)}
          </strong>
        )
      } else if (matchText.startsWith('*') && matchText.endsWith('*')) {
        elements.push(
          <em key={`italic-${key++}`}>
            {matchText.slice(1, -1)}
          </em>
        )
      } else if (matchText.startsWith('http')) {
        elements.push(
          <a
            key={`link-${key++}`}
            href={matchText}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-700 underline break-all"
            onClick={(e) => e.stopPropagation()}
          >
            {matchText}
          </a>
        )
      }

      lastIndex = match.index + matchText.length
    }

    if (lastIndex < line.length) {
      elements.push(line.substring(lastIndex))
    }
  })

  return elements
}

function useIsMobilChat() {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])
  return isMobile
}

export function ChatSidebar() {
  const { isOpen, setIsOpen } = useChat()
  const { getPermissions, loading: authLoading } = useAuth()
  const isMobile = useIsMobilChat()

  const permissions = !authLoading && getPermissions
    ? getPermissions('chat-ai')
    : null

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Olá! Como posso ajudá-lo?",
      sender: "bot",
      timestamp: new Date(),
    },
  ])
  const [inputValue, setInputValue] = useState("")
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [sidebarWidth, setSidebarWidth] = useState(600)
  const [isResizing, setIsResizing] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [initError, setInitError] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const sidebarRef = useRef<HTMLDivElement>(null)
  const chatIdRef = useRef<string | null>(null)
  const hasInitialized = useRef(false)

  const MIN_WIDTH = 280
  const MAX_WIDTH = 600

  // Keep ref in sync with state
  useEffect(() => {
    chatIdRef.current = currentChatId
  }, [currentChatId])

  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = "auto"
      const maxHeight = 120
      const newHeight = Math.min(textarea.scrollHeight, maxHeight)
      textarea.style.height = `${newHeight}px`
    }
  }, [])

  useEffect(() => {
    adjustTextareaHeight()
  }, [inputValue, adjustTextareaHeight])

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && textareaRef.current && !showHistory) {
      setTimeout(() => textareaRef.current?.focus(), 300)
    }
  }, [isOpen, showHistory])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (isMobile) return
    e.preventDefault()
    setIsResizing(true)
  }, [isMobile])

  useEffect(() => {
    if (isMobile) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return
      const newWidth = window.innerWidth - e.clientX
      setSidebarWidth(Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, newWidth)))
    }

    const handleMouseUp = () => setIsResizing(false)

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
      document.body.style.cursor = "ew-resize"
      document.body.style.userSelect = "none"
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
    }
  }, [isResizing, isMobile])

  useEffect(() => {
    if (isMobile && isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => { document.body.style.overflow = "" }
  }, [isMobile, isOpen])

  // Initialize chat when opened
  useEffect(() => {
    if (isOpen && !hasInitialized.current) {
      hasInitialized.current = true
      loadLastChatOrCreate()
    }
  }, [isOpen])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadLastChatOrCreate = async () => {
    try {
      setLoadingHistory(true)
      setInitError(false)
      const response = await api.get("/chats")
      const chats = response.data as ChatHistory[]
      setChatHistory(chats)

      if (chats.length > 0) {
        await loadChat(chats[0].idChat)
      } else {
        await createNewChat()
      }
    } catch (error) {
      console.error("Erro ao carregar chats:", error)
      setInitError(true)
    } finally {
      setLoadingHistory(false)
    }
  }

  const loadChatHistory = async () => {
    try {
      setLoadingHistory(true)
      const response = await api.get("/chats")
      setChatHistory(response.data as ChatHistory[])
    } catch (error) {
      console.error("Erro ao carregar histórico:", error)
    } finally {
      setLoadingHistory(false)
    }
  }

  const loadChat = async (chatId: string) => {
    try {
      const response = await api.get(`/chats/${chatId}`)
      const chat = response.data as ChatHistory
      setCurrentChatId(chat.idChat)

      if (chat.messages && chat.messages.length > 0) {
        const loadedMessages: Message[] = chat.messages.map((msg: any) => ({
          id: msg.idMessage,
          text: msg.content,
          sender: msg.role === "USER" ? "user" : "bot",
          timestamp: new Date(msg.createdAt),
        }))
        setMessages(loadedMessages)
      } else {
        setMessages([{
          id: "1",
          text: "Olá! Como posso ajudá-lo?",
          sender: "bot",
          timestamp: new Date(),
        }])
      }
      setShowHistory(false)
      setInitError(false)
    } catch (error) {
      console.error("Erro ao carregar chat:", error)
    }
  }

  const createNewChat = async () => {
    try {
      const response = await api.post("/chats", { title: "Nova Conversa" })
      const newChatId = response.data.idChat
      setCurrentChatId(newChatId)
      setMessages([{
        id: "1",
        text: "Olá! Como posso ajudá-lo?",
        sender: "bot",
        timestamp: new Date(),
      }])
      setShowHistory(false)
      setInitError(false)
      loadChatHistory()
      return newChatId
    } catch (error) {
      console.error("Erro ao criar chat:", error)
      setInitError(true)
      return null
    }
  }

  const ensureChatId = async (): Promise<string | null> => {
    if (chatIdRef.current) return chatIdRef.current
    const newId = await createNewChat()
    return newId
  }

  const handleSendMessage = async () => {
    const text = inputValue.trim()
    if (text === "" || loading) return

    setLoading(true)

    const chatId = await ensureChatId()
    if (!chatId) {
      setLoading(false)
      return
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      text,
      sender: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")

    if (textareaRef.current) {
      textareaRef.current.style.height = "42px"
    }

    try {
      const response = await api.post(`/chats/${chatId}/messages`, {
        content: text,
      })

      const botMessage: Message = {
        id: response.data.assistantMessage.idMessage,
        text: response.data.assistantMessage.content,
        sender: "bot",
        timestamp: new Date(response.data.assistantMessage.createdAt),
      }
      setMessages((prev) => [...prev, botMessage])
      loadChatHistory()
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error)
      setMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(),
        text: "Desculpe, houve um erro ao processar sua mensagem. Tente novamente.",
        sender: "bot",
        timestamp: new Date(),
      }])
    } finally {
      setLoading(false)
      setTimeout(() => textareaRef.current?.focus(), 100)
    }
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSendMessage()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const toggleHistory = () => {
    if (!showHistory) {
      loadChatHistory()
    }
    setShowHistory(!showHistory)
  }

  const deleteChat = async (chatId: string) => {
    try {
      await api.delete(`/chats/${chatId}`)
      if (currentChatId === chatId) {
        setCurrentChatId(null)
        chatIdRef.current = null
        hasInitialized.current = false
        await loadLastChatOrCreate()
      } else {
        loadChatHistory()
      }
    } catch (error) {
      console.error("Erro ao deletar chat:", error)
    }
  }

  if (authLoading || !permissions?.visualizar) {
    return null
  }

  const canSend = inputValue.trim().length > 0 && !loading

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 md:bg-black/30"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Chat Sidebar */}
      <div
        ref={sidebarRef}
        style={isMobile ? undefined : { width: `${sidebarWidth}px` }}
        className={cn(
          "fixed flex flex-col bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-[60]",
          "inset-0 w-full h-full",
          "md:inset-auto md:right-0 md:top-0 md:h-screen",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Resize Handle - desktop only */}
        {!isMobile && (
          <div
            onMouseDown={handleMouseDown}
            className={cn(
              "absolute left-0 top-0 h-full w-3 cursor-ew-resize hover:bg-blue-500/20 transition-colors flex items-center justify-center group",
              isResizing && "bg-blue-500/20"
            )}
          >
            <GripVertical className={cn(
              "h-6 w-6 text-gray-300 group-hover:text-blue-500 transition-colors",
              isResizing && "text-blue-500"
            )} />
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between border-b p-3 md:p-4 shrink-0 bg-white">
          <div className="flex items-center gap-2">
            {showHistory ? (
              <button
                onClick={() => setShowHistory(false)}
                className="rounded-lg p-1.5 hover:bg-gray-100 active:bg-gray-200"
              >
                <ChevronLeft className="h-5 w-5 text-gray-600" />
              </button>
            ) : (
              <div className="rounded-full bg-blue-100 p-2">
                <MessageCircle className="h-5 w-5 text-blue-600" />
              </div>
            )}
            <div>
              <h2 className="font-semibold text-gray-900">
                {showHistory ? "Histórico" : "Assistente IA"}
              </h2>
              {!showHistory && (
                <div className="flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                  </span>
                  <p className="text-xs text-gray-500">Online</p>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            {!showHistory && (
              <>
                <button
                  onClick={createNewChat}
                  className="rounded-lg p-2 hover:bg-gray-100 active:bg-gray-200"
                  title="Novo chat"
                >
                  <Plus className="h-5 w-5 text-gray-600" />
                </button>
                <button
                  onClick={toggleHistory}
                  className="rounded-lg p-2 hover:bg-gray-100 active:bg-gray-200"
                  title="Histórico de conversas"
                >
                  <History className="h-5 w-5 text-gray-600" />
                </button>
              </>
            )}
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-2 hover:bg-gray-100 active:bg-gray-200"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* History Panel */}
        {showHistory ? (
          <div className="flex-1 overflow-y-auto scrollable min-h-0">
            {loadingHistory ? (
              <div className="flex items-center justify-center p-8">
                <Loader className="h-6 w-6 animate-spin text-blue-600" />
              </div>
            ) : chatHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-gray-500">
                <MessageCircle className="h-12 w-12 mb-2 opacity-50" />
                <p className="text-sm">Nenhuma conversa encontrada</p>
              </div>
            ) : (
              <div className="divide-y">
                {chatHistory.map((chat) => (
                  <div
                    key={chat.idChat}
                    className={cn(
                      "w-full flex items-center justify-between p-3 md:p-4 hover:bg-gray-50 active:bg-gray-100 transition-colors group",
                      currentChatId === chat.idChat && "bg-blue-50"
                    )}
                  >
                    <div
                      onClick={() => loadChat(chat.idChat)}
                      className="flex-1 text-left cursor-pointer min-w-0"
                    >
                      <p className="font-medium text-gray-900 truncate">
                        {chat.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(chat.updatedAt).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        deleteChat(chat.idChat)
                      }}
                      className="ml-2 p-2 rounded hover:bg-red-100 active:bg-red-200 text-gray-400 hover:text-red-600 transition-colors shrink-0"
                      title="Excluir conversa"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 md:space-y-4 scrollable min-h-0 bg-gray-50/50">
              {initError && (
                <div className="flex justify-center">
                  <button
                    onClick={() => { hasInitialized.current = false; loadLastChatOrCreate() }}
                    className="text-sm text-blue-600 hover:text-blue-800 underline"
                  >
                    Erro ao conectar. Toque para tentar novamente.
                  </button>
                </div>
              )}
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex",
                    message.sender === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[85%] md:max-w-[80%] px-3.5 py-2.5 rounded-2xl shadow-sm",
                      message.sender === "user"
                        ? "bg-blue-600 text-white rounded-br-md"
                        : "bg-white text-gray-900 rounded-bl-md border border-gray-100"
                    )}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                      {renderMarkdown(message.text)}
                    </p>
                    <span
                      className={cn(
                        "text-[10px] md:text-xs block mt-1 text-right",
                        message.sender === "user"
                          ? "text-blue-200"
                          : "text-gray-400"
                      )}
                    >
                      {message.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white text-gray-900 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <div className="border-t p-3 md:p-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:pb-4 shrink-0 bg-white">
              <form onSubmit={handleFormSubmit} className="flex items-end gap-2">
                <textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Digite sua mensagem..."
                  disabled={loading}
                  rows={1}
                  className="flex-1 min-w-0 rounded-xl border border-gray-300 px-3 py-2.5 text-base md:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 resize-none overflow-y-auto"
                  style={{ minHeight: "42px", maxHeight: "120px" }}
                />
                <button
                  type="submit"
                  disabled={!canSend}
                  className={cn(
                    "rounded-xl p-2.5 text-white shrink-0 touch-manipulation transition-colors h-[42px] w-[42px] flex items-center justify-center",
                    canSend
                      ? "bg-blue-600 hover:bg-blue-700 active:bg-blue-800"
                      : "bg-gray-300 cursor-not-allowed"
                  )}
                >
                  {loading ? (
                    <Loader className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </button>
              </form>
              <p className="text-[10px] text-gray-400 mt-1.5 text-center">
                Enter para enviar · Shift+Enter para nova linha
              </p>
            </div>
          </>
        )}
      </div>
    </>
  )
}
