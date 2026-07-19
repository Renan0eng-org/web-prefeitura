"use client"

import { QuillEditor } from "@/components/quill-editor"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useAlert } from "@/hooks/use-alert"
import { cn } from "@/lib/utils"
import api from "@/services/api"
import {
    Loader2,
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
    allowFutureUse?: boolean
}

interface MedicalNotesEditorProps {
    medicalNotes?: MedicalNote[]
    onChange: (notes: MedicalNote[]) => void
    /** Habilita a melhoria de notas por IA (nível de acesso "atendimento-ia"). */
    aiEnabled?: boolean
}

interface NoteTab {
    id: string
    title: string
    content: string
    isEditing: boolean
    allowFutureUse: boolean
}

export function MedicalNotesEditor({ medicalNotes, onChange, aiEnabled = false }: MedicalNotesEditorProps) {
    const [tabs, setTabs] = useState<NoteTab[]>([])
    const [activeTabId, setActiveTabId] = useState("")
    const [advancedMode, setAdvancedMode] = useState(true)
    const [aiLoading, setAiLoading] = useState(false)
    const textareaRef = useRef<HTMLTextAreaElement | null>(null)
    const tabInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({})
    const quillRef = useRef<any>(null)
    const isInitialized = useRef(false)
    const { setAlert } = useAlert()

    // Inicializar abas a partir de medicalNotes ou criar abas padrão
    useEffect(() => {
        if (medicalNotes && medicalNotes.length > 0 && !isInitialized.current) {
            const loadedTabs: NoteTab[] = medicalNotes
                .sort((a, b) => a.order - b.order)
                .map((note, index) => ({
                    id: `tab-${index}`,
                    title: note.title,
                    content: note.content || "",
                    isEditing: false,
                    allowFutureUse: Boolean(note.allowFutureUse),
                }))
            setTabs(loadedTabs)
            setActiveTabId(loadedTabs[0]?.id || "")
            setAdvancedMode(medicalNotes[0]?.mode === "advanced")
            isInitialized.current = true
        } else if (tabs.length === 0 && !isInitialized.current) {
            const defaultTabs: NoteTab[] = [
                { id: "tab-1", title: "Queixa Principal", content: "", isEditing: false, allowFutureUse: false },
                { id: "tab-2", title: "História Atual", content: "", isEditing: false, allowFutureUse: false },
                { id: "tab-3", title: "Exame Físico", content: "", isEditing: false, allowFutureUse: false },
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
                allowFutureUse: tab.allowFutureUse,
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
            allowFutureUse: false,
        }
        setTabs(prev => [...prev, newTab])
        setActiveTabId(newTab.id)
    }

    const removeTab = (tabId: string, e: React.MouseEvent) => {
        e.stopPropagation()
        if (tabs.length <= 1) return

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

    const updateAllowFutureUse = (tabId: string, value: boolean) => {
        if (!tabId) return
        setTabs(prev => prev.map(tab =>
            tab.id === tabId ? { ...tab, allowFutureUse: value } : tab
        ))
    }

    // Melhoria por IA: se houver texto selecionado, melhora só a seleção;
    // caso contrário, melhora a nota inteira.
    const improveWithAI = async () => {
        if (!activeTab || aiLoading) return
        try {
            setAiLoading(true)
            const title = activeTab.title
            const content = activeTab.content || ""

            if (advancedMode) {
                const quill = quillRef.current
                if (quill) {
                    const sel = quill.getSelection()
                    if (sel && sel.length > 0) {
                        const text = String(quill.getText(sel.index, sel.length)).trim()
                        if (!text) { setAlert("Selecione um texto com conteúdo.", "warning"); return }
                        const { data } = await api.post("/attendances/ai/improve", { text, scope: "selection", format: "text", noteTitle: title })
                        quill.deleteText(sel.index, sel.length)
                        quill.insertText(sel.index, data.result)
                    } else {
                        if (!String(quill.getText()).trim()) { setAlert("Escreva algo na nota antes de melhorar.", "warning"); return }
                        const { data } = await api.post("/attendances/ai/improve", { text: content, scope: "whole", format: "html", noteTitle: title })
                        updateContent(data.result)
                    }
                } else {
                    if (!content.trim()) { setAlert("Escreva algo na nota antes de melhorar.", "warning"); return }
                    const { data } = await api.post("/attendances/ai/improve", { text: content, scope: "whole", format: "html", noteTitle: title })
                    updateContent(data.result)
                }
            } else {
                const ta = textareaRef.current
                if (ta && ta.selectionStart !== ta.selectionEnd) {
                    const start = ta.selectionStart, end = ta.selectionEnd
                    const text = content.substring(start, end)
                    const { data } = await api.post("/attendances/ai/improve", { text, scope: "selection", format: "text", noteTitle: title })
                    updateContent(content.substring(0, start) + data.result + content.substring(end))
                } else {
                    if (!content.trim()) { setAlert("Escreva algo na nota antes de melhorar.", "warning"); return }
                    const { data } = await api.post("/attendances/ai/improve", { text: content, scope: "whole", format: "text", noteTitle: title })
                    updateContent(data.result)
                }
            }
            setAlert("Nota melhorada com IA.", "success")
        } catch (err: any) {
            setAlert(err?.response?.data?.message || "Não foi possível melhorar a nota.", "error")
        } finally {
            setAiLoading(false)
        }
    }

    return (
        <div className="bg-card text-foreground rounded-lg border overflow-hidden">
            {/* Header estilo navegador */}
            <div className="overflow-x-auto scrollable">
                <div className="bg-muted border-b px-1 pt-1 flex items-center gap-1 w-max min-w-full">
                    <div className="flex items-center gap-1">
                        {tabs.map((tab) => (
                            <div
                                key={tab.id}
                                onClick={() => setActiveTabId(tab.id)}
                                className={cn(
                                    "group flex items-center gap-2 px-3 py-1.5 rounded-t-md cursor-pointer transition-colors min-w-[120px] max-w-[200px]",
                                    activeTabId === tab.id
                                        ? "bg-card border-t border-x"
                                        : "bg-muted/50 text-muted-foreground hover:bg-muted"
                                )}
                            >
                                {tab.isEditing ? (
                                    <input
                                        ref={(el) => { tabInputRefs.current[tab.id] = el }}
                                        type="text"
                                        value={tab.title}
                                        onChange={(e) => updateTabTitle(tab.id, e.target.value)}
                                        onBlur={() => finishEditingTabTitle(tab.id)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') finishEditingTabTitle(tab.id)
                                        }}
                                        className="flex-1 min-w-0 w-fit truncate bg-transparent border-0 border-b h-[20px] border-border outline-none text-sm px-0 py-0 focus:border-primary"
                                        onClick={(e) => e.stopPropagation()}
                                        style={{ width: `${tab.title.length + 1}ch` }}
                                    />
                                ) : (
                                    <span
                                        className="text-sm flex-1 truncate"
                                        onDoubleClick={(e) => startEditingTabTitle(tab.id, e)}
                                    >
                                        {tab.title}
                                    </span>
                                )}
                                <button
                                    onClick={(e) => removeTab(tab.id, e)}
                                    className={cn(
                                        "opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted-foreground/20 rounded p-0.5",
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
                        className="p-1 hover:bg-muted-foreground/20 rounded transition-colors"
                        title="Nova aba"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Conteúdo da aba ativa */}
            <div className="p-4 sm:p-6 space-y-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                    <input
                        className="flex-1 min-w-[180px] text-2xl sm:text-3xl border-b-2 border-border focus:border-primary outline-none pb-2 bg-transparent"
                        type="text"
                        placeholder="Título da nota"
                        value={activeTab?.title || ""}
                        onChange={(e) => updateTabTitle(activeTabId, e.target.value)}
                    />
                    <div className="flex items-center gap-3">
                        {aiEnabled && (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={improveWithAI}
                                disabled={aiLoading}
                                className="h-8 gap-1.5"
                                title="Melhora o texto selecionado, ou a nota inteira se nada estiver selecionado"
                            >
                                {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
                                Melhorar com IA
                            </Button>
                        )}
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                            <Switch
                                id={`allow-future-${activeTabId || "current"}`}
                                checked={Boolean(activeTab?.allowFutureUse)}
                                onCheckedChange={(checked) => updateAllowFutureUse(activeTabId, checked)}
                            />
                            <Label htmlFor={`allow-future-${activeTabId || "current"}`} className="cursor-pointer">
                                Permitir reutilização futura
                            </Label>
                        </div>
                    </div>
                </div>

                <div className="relative">
                    {advancedMode ? (
                        <QuillEditor
                            key={activeTabId}
                            value={activeTab?.content || ""}
                            onChange={(html) => updateContent(html)}
                            onReady={(q) => { quillRef.current = q }}
                            height={380}
                            placeholder="Digite suas anotações aqui..."
                        />
                    ) : (
                        <Textarea
                            key={activeTabId}
                            ref={textareaRef}
                            value={activeTab?.content || ""}
                            onChange={(e) => updateContent(e.target.value)}
                            placeholder="Digite suas anotações aqui..."
                            className="min-h-[300px] font-mono text-sm resize-y"
                            style={{ lineHeight: "1.8", padding: "12px" }}
                        />
                    )}
                </div>

                {/* Informações e dicas */}
                <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{activeTab?.content.length || 0} caracteres</span>
                    {aiEnabled && (
                        <span className="flex items-center gap-1"><Sparkles className="w-3 h-3" /> Selecione um trecho e clique em Melhorar com IA para refinar só ele</span>
                    )}
                </div>

                {!activeTab?.content && (
                    <div className="bg-muted/50 border rounded-md p-3 text-xs space-y-1 text-muted-foreground">
                        <p className="font-medium text-foreground">💡 Dicas rápidas:</p>
                        <ul className="list-disc list-inside space-y-1">
                            <li>Clique duas vezes no nome da aba para renomeá-la</li>
                            <li>Adicione quantas abas precisar com o botão +</li>
                            {aiEnabled && <li>Selecione um trecho e use “Melhorar com IA” para refinar apenas ele</li>}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    )
}
