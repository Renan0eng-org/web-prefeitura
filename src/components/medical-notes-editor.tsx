"use client"

import { QuillEditor } from "@/components/quill-editor"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import {
    List,
    Plus,
    Sparkles,
    Wand2,
    X
} from "lucide-react"
import { useEffect, useRef, useState } from "react"

export interface MedicalNote {
    id?: string
    title: string
    content: string
    mode: "advanced" | "simple"
    order: number
}

interface MedicalNotesEditorProps {
    medicalNotes?: MedicalNote[]
    onChange: (notes: MedicalNote[]) => void
}

interface NoteTab {
    id: string
    title: string
    content: string
    isEditing: boolean
}

export function MedicalNotesEditor({ medicalNotes, onChange }: MedicalNotesEditorProps) {
    const [tabs, setTabs] = useState<NoteTab[]>([])
    const [activeTabId, setActiveTabId] = useState("")
    const [advancedMode, setAdvancedMode] = useState(true)
    const [selectedText, setSelectedText] = useState("")
    const [showAiMenu, setShowAiMenu] = useState(false)
    const textareaRef = useRef<HTMLTextAreaElement | null>(null)
    const tabInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({})
    const isInitialized = useRef(false)

    // Inicializar abas a partir de medicalNotes ou criar abas padrão
    useEffect(() => {
        if (medicalNotes && medicalNotes.length > 0 && !isInitialized.current) {
            // Carregar notas existentes apenas na primeira vez
            const loadedTabs: NoteTab[] = medicalNotes
                .sort((a, b) => a.order - b.order)
                .map((note, index) => ({
                    id: `tab-${index}`,
                    title: note.title,
                    content: note.content || "",
                    isEditing: false,
                }))
            setTabs(loadedTabs)
            setActiveTabId(loadedTabs[0]?.id || "")
            setAdvancedMode(medicalNotes[0]?.mode === "advanced")
            isInitialized.current = true
        } else if (tabs.length === 0 && !isInitialized.current) {
            // Criar abas padrão apenas se não houver nenhuma
            const defaultTabs: NoteTab[] = [
                { id: "tab-1", title: "Queixa Principal", content: "", isEditing: false },
                { id: "tab-2", title: "História Atual", content: "", isEditing: false },
                { id: "tab-3", title: "Exame Físico", content: "", isEditing: false },
            ]
            setTabs(defaultTabs)
            setActiveTabId(defaultTabs[0].id)
            isInitialized.current = true
        }
    }, [medicalNotes])

    // Notificar mudanças nas abas para o componente pai após render
    useEffect(() => {
        if (tabs.length > 0 && isInitialized.current) {
            const notes: MedicalNote[] = tabs.map((tab, index) => ({
                title: tab.title,
                content: tab.content,
                mode: advancedMode ? "advanced" : "simple",
                order: index,
            }))
            onChange(notes)
        }
    }, [tabs, advancedMode, onChange])

    const activeTab = tabs.find(tab => tab.id === activeTabId)

    const addNewTab = () => {
        const newTab: NoteTab = {
            id: `tab-${Date.now()}`,
            title: `Nova Nota ${tabs.length + 1}`,
            content: "",
            isEditing: false,
        }
        setTabs(prev => [...prev, newTab])
        setActiveTabId(newTab.id)
    }

    const removeTab = (tabId: string, e: React.MouseEvent) => {
        e.stopPropagation()
        if (tabs.length <= 1) return // Manter pelo menos uma aba

        const newTabs = tabs.filter(tab => tab.id !== tabId)
        setTabs(newTabs)

        if (activeTabId === tabId) {
            setActiveTabId(newTabs[0].id)
        }
    }

    const updateTabTitle = (tabId: string, newTitle: string) => {
        setTabs(prev => prev.map(tab =>
            tab.id === tabId ? { ...tab, title: newTitle } : tab
        ))
    }

    const startEditingTabTitle = (tabId: string, e: React.MouseEvent) => {
        e.stopPropagation()
        setTabs(prev => prev.map(tab =>
            tab.id === tabId ? { ...tab, isEditing: true } : tab
        ))
        setTimeout(() => {
            tabInputRefs.current[tabId]?.select()
        }, 0)
    }

    const finishEditingTabTitle = (tabId: string) => {
        setTabs(prev => prev.map(tab =>
            tab.id === tabId ? { ...tab, isEditing: false } : tab
        ))
    }

    const updateContent = (content: string) => {
        setTabs(prev => prev.map(tab =>
            tab.id === activeTabId ? { ...tab, content } : tab
        ))
    }

    const addTopic = () => {
        const currentContent = activeTab?.content || ""
        if (advancedMode) {
            // HTML topic
            const topicNumber = (currentContent.match(/<li/gi) || []).length + 1
            const addition = `<p>• Tópico ${topicNumber}: </p>`
            const newContent = currentContent ? `${currentContent}${addition}` : addition
            updateContent(newContent)
            setTimeout(() => textareaRef.current?.focus(), 0)
            return
        }
        const lines = currentContent.split('\n')
        const topicNumber = lines.filter(line => /^•\s/.test(line.trim())).length + 1
        const newContent = currentContent
            ? `${currentContent}\n\n• Tópico ${topicNumber}: `
            : `• Tópico ${topicNumber}: `
        updateContent(newContent)

        setTimeout(() => textareaRef.current?.focus(), 0)
    }

    const addSubtopic = () => {
        const currentContent = activeTab?.content || ""
        if (advancedMode) {
            const addition = `<p style="margin-left:20px">◦ Subtópico: </p>`
            const newContent = currentContent ? `${currentContent}${addition}` : addition
            updateContent(newContent)
            setTimeout(() => textareaRef.current?.focus(), 0)
            return
        }
        const newContent = currentContent
            ? `${currentContent}\n  ◦ Subtópico: `
            : `  ◦ Subtópico: `
        updateContent(newContent)

        setTimeout(() => textareaRef.current?.focus(), 0)
    }

    const handleTextSelection = () => {
        const textarea = textareaRef.current
        if (!textarea) return

        const selection = textarea.value.substring(
            textarea.selectionStart,
            textarea.selectionEnd
        )

        if (selection.length > 0) {
            setSelectedText(selection)
            setShowAiMenu(true)
        } else {
            setShowAiMenu(false)
        }
    }

    const aiActions = [
        {
            icon: Wand2,
            label: "Melhorar",
            action: () => {
                console.log("Melhorar:", selectedText)
                setShowAiMenu(false)
            },
        },
        {
            icon: Sparkles,
            label: "Simplificar",
            action: () => {
                console.log("Simplificar:", selectedText)
                setShowAiMenu(false)
            },
        },
        {
            icon: List,
            label: "Criar tópicos",
            action: () => {
                console.log("Criar tópicos:", selectedText)
                setShowAiMenu(false)
            },
        },
    ]

    return (
        <div className="bg-white rounded-lg border overflow-hidden">
            {/* Header estilo navegador */}
            <div className="overflow-x-auto scrollable">
                <div className="bg-gray-100 border-b px-1 pt-1 flex items-center gap-1 w-max min-w-full">
                    <div className="flex items-center  gap-1">
                        {tabs.map((tab) => (
                            <div
                                key={tab.id}
                                onClick={() => setActiveTabId(tab.id)}
                                className={cn(
                                    "group flex items-center gap-2 px-3 py-1.5 rounded-t-md cursor-pointer transition-colors min-w-[120px] max-w-[200px]",
                                    activeTabId === tab.id
                                        ? "bg-white border-t border-x"
                                        : "bg-gray-200 hover:bg-gray-300"
                                )}
                            >
                                {tab.isEditing ? (
                                    // {true ? (
                                    <input
                                        ref={(el) => { tabInputRefs.current[tab.id] = el }}
                                        type="text"
                                        value={tab.title}
                                        onChange={(e) => updateTabTitle(tab.id, e.target.value)}
                                        onBlur={() => finishEditingTabTitle(tab.id)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') finishEditingTabTitle(tab.id)
                                        }}
                                        className="flex-1 min-w-0 w-fit truncate bg-transparent border-0 border-b h-[20px]  border-gray-400 outline-none text-sm px-0 py-0 focus:border-blue-500"
                                        onClick={(e) => e.stopPropagation()}
                                        // passa a largura do texto
                                        style={{ width: `${tab.title.length + 1}ch` }}
                                    />
                                ) : (
                                    <span
                                        // pega a larguro do componente
                                        className="text-sm flex-1 truncate"
                                        onDoubleClick={(e) => startEditingTabTitle(tab.id, e)}
                                    >
                                        {tab.title}
                                    </span>
                                )}
                                <button
                                    onClick={(e) => removeTab(tab.id, e)}
                                    className={cn(
                                        "opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-300 rounded p-0.5",
                                        tabs.length <= 1 && "hidden"
                                    )}
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                    <button
                        onClick={(e) => { e.preventDefault(); addNewTab() }}
                        className="p-1 hover:bg-gray-300 rounded transition-colors"
                        title="Nova aba"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Conteúdo da aba ativa */}
            <div className="p-4 sm:p-6 space-y-3">
                <div className="flex items-center justify-between">
                    <input
                        className="w-full text-3xl border-b-2 border-gray-200 focus:border-primary outline-none pb-2 bg-transparent"
                        type="text"
                        placeholder="Título da nota"
                        value={activeTab?.title || ""}
                        onChange={(e) => updateTabTitle(activeTabId, e.target.value)}
                    />
                    <div className="flex items-center gap-2">
                        {/* <div className="flex rounded border overflow-hidden">
                            <button
                                type="button"
                                className={cn("px-2 py-1 text-xs", !advancedMode ? "bg-gray-200" : "bg-transparent hover:bg-gray-100")}
                                onClick={() => setAdvancedMode(false)}
                                title="Modo simples"
                            >Simples</button>
                            <button
                                type="button"
                                className={cn("px-2 py-1 text-xs", advancedMode ? "bg-gray-200" : "bg-transparent hover:bg-gray-100")}
                                onClick={() => setAdvancedMode(true)}
                                title="Modo avançado (Word)"
                            >Avançado</button>
                        </div> */}
                        {/* <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={addTopic}
                            className="h-7 px-2 text-xs gap-1"
                        >
                            <List className="w-3 h-3" />
                            Tópico
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={addSubtopic}
                            className="h-7 px-2 text-xs gap-1"
                        >
                            <IndentIncrease className="w-3 h-3" />
                            Subtópico
                        </Button> */}
                    </div>
                </div>

                <div className="relative">
                    {advancedMode ? (
                        <QuillEditor
                            key={activeTabId}
                            value={activeTab?.content || ""}
                            onChange={(html) => updateContent(html)}
                            height={380}
                            placeholder="Digite suas anotações aqui..."
                        />
                    ) : (
                        <Textarea
                            key={activeTabId}
                            ref={textareaRef}
                            value={activeTab?.content || ""}
                            onChange={(e) => updateContent(e.target.value)}
                            onMouseUp={handleTextSelection}
                            onKeyUp={handleTextSelection}
                            placeholder="Digite suas anotações aqui..."
                            className="min-h-[300px] font-mono text-sm resize-y"
                            style={{
                                lineHeight: "1.8",
                                padding: "12px",
                            }}
                        />
                    )}

                    {/* Menu de IA para texto selecionado */}
                    {showAiMenu && selectedText && (
                        <div className="fixed z-50 bg-white border rounded-md shadow-lg p-1 flex gap-1">
                            {aiActions.map((action, index) => (
                                <Button
                                    key={index}
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={action.action}
                                    className="h-7 px-2 text-xs gap-1"
                                >
                                    <action.icon className="w-3 h-3" />
                                    {action.label}
                                </Button>
                            ))}
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowAiMenu(false)}
                                className="h-7 px-2"
                            >
                                <X className="w-3 h-3" />
                            </Button>
                        </div>
                    )}
                </div>

                {/* Informações e dicas */}
                <div className="flex justify-between text-xs text-muted-foreground">
                    <span>
                        {activeTab?.content.split('\n').filter(line => /^•\s/.test(line.trim())).length || 0} tópico(s) • {' '}
                        {activeTab?.content.split('\n').filter(line => /^\s+◦\s/.test(line)).length || 0} subtópico(s)
                    </span>
                    <span>{activeTab?.content.length || 0} caracteres</span>
                </div>

                {!activeTab?.content && (
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-xs space-y-1">
                        <p className="font-medium text-blue-900">💡 Dicas rápidas:</p>
                        <ul className="list-disc list-inside space-y-1 text-blue-800">
                            <li>Clique duas vezes no nome da aba para renomeá-la</li>
                            <li>Use os botões para criar tópicos e subtópicos</li>
                            <li>Selecione texto para acessar ferramentas de IA (em breve)</li>
                            <li>Adicione quantas abas precisar com o botão +</li>
                        </ul>
                    </div>
                )}
            </div>
        </div>
    )
}
