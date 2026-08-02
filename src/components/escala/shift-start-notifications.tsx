"use client"

import { X, Bell, CheckCircle2, Clock3 } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import { useEscalaRealtime, type CheckinReminder, type QueueNotification } from "@/hooks/use-escala-realtime"
import api from "@/services/api"
import { Button } from "@/components/ui/button"

type ScheduledShift = {
  id: string
  startsAt: string
  endsAt: string
  status: string
  doctorId?: string | null
  doctor?: { idUser: string; name: string } | null
  setor: string
}

type Notice = { id: string; kind: "15" | "5"; shift: ScheduledShift } | { id: string; kind: "queue"; queue: QueueNotification }

const POLL_MS = 30_000
const CHECKIN_REPEAT_MS = 15 * 60 * 1000

function playNotificationSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioContextClass) return
    const context = new AudioContextClass()
    const start = () => {
      const oscillator = context.createOscillator()
      const gain = context.createGain()
      oscillator.type = "sine"
      oscillator.frequency.setValueAtTime(880, context.currentTime)
      oscillator.frequency.setValueAtTime(660, context.currentTime + 0.12)
      gain.gain.setValueAtTime(0.0001, context.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.22, context.currentTime + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.35)
      oscillator.connect(gain)
      gain.connect(context.destination)
      oscillator.start()
      oscillator.stop(context.currentTime + 0.36)
      oscillator.addEventListener("ended", () => context.close())
    }

    if (context.state === "suspended") {
      void context.resume().then(start).catch(() => undefined)
    } else {
      start()
    }
  } catch {
    // O navegador pode bloquear áudio até que haja uma interação do usuário.
  }
}

function playQueueNotificationSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioContextClass) return
    const context = new AudioContextClass()
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    oscillator.type = "triangle"
    oscillator.frequency.setValueAtTime(520, context.currentTime)
    oscillator.frequency.setValueAtTime(740, context.currentTime + 0.14)
    gain.gain.setValueAtTime(0.0001, context.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.18, context.currentTime + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.42)
    oscillator.connect(gain); gain.connect(context.destination)
    oscillator.start(); oscillator.stop(context.currentTime + 0.43)
    oscillator.addEventListener("ended", () => context.close())
  } catch { /* áudio pode estar bloqueado pelo navegador */ }
}

export function ShiftStartNotifications() {
  const { user } = useAuth()
  const [notices, setNotices] = useState<Notice[]>([])
  const [checkinShift, setCheckinShift] = useState<ScheduledShift | null>(null)
  const [checkingIn, setCheckingIn] = useState(false)
  const lastPromptRef = useRef<Record<string, number>>({})
  const notifiedRef = useRef<Set<string>>(new Set())

  const addNotice = useCallback((kind: "15" | "5", shift: ScheduledShift) => {
    const id = `${shift.id}-${kind}`
    const storageKey = `plantao-notificacao-${id}`
    if (notifiedRef.current.has(id)) return
    try {
      if (sessionStorage.getItem(storageKey) === "1") {
        notifiedRef.current.add(id)
        return
      }
      sessionStorage.setItem(storageKey, "1")
    } catch {
      // A memória local continua evitando duplicação durante a página atual.
    }
    notifiedRef.current.add(id)
    setNotices((current) => [...current, { id, kind, shift }].slice(-3))
    playNotificationSound()
    window.setTimeout(() => setNotices((current) => current.filter((notice) => notice.id !== id)), 10_000)
  }, [])

  const addQueueNotice = useCallback((queue: QueueNotification) => {
    const id = `fila-${queue.ticketId}-${queue.status}`
    setNotices((current) => {
      if (current.some((notice) => notice.id === id)) return current
      return [...current, { id, kind: "queue" as const, queue }].slice(-3)
    })
    playQueueNotificationSound()
    window.setTimeout(() => setNotices((current) => current.filter((notice) => notice.id !== id)), 10_000)
  }, [])

  const fetchAndEvaluate = useCallback(async () => {
    if (!user?.idUser) return

    const now = new Date()
    try {
      const response = await api.get<ScheduledShift[]>("/admin/escala", {
        params: {
          from: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
          to: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
        },
      })
      const shifts = (Array.isArray(response.data) ? response.data : [])
        .filter((shift) => (shift.doctorId || shift.doctor?.idUser) === user.idUser)
        .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())

      const activeShiftIds = new Set(shifts.map((shift) => shift.id))
      Object.keys(lastPromptRef.current).forEach((id) => {
        if (!activeShiftIds.has(id)) delete lastPromptRef.current[id]
      })

      for (const shift of shifts) {
        const startsAt = new Date(shift.startsAt).getTime()
        const endsAt = new Date(shift.endsAt).getTime()
        const minutesUntilStart = (startsAt - now.getTime()) / 60_000
        const isFinished = now.getTime() >= endsAt || ["Concluido", "Cancelado"].includes(shift.status)

        if (isFinished) continue
        if (minutesUntilStart > 5 && minutesUntilStart <= 15) addNotice("15", shift)
        if (minutesUntilStart > 0 && minutesUntilStart <= 5) addNotice("5", shift)

        const needsCheckin = minutesUntilStart <= 0 && shift.status === "Agendado"
        if (needsCheckin) {
          const lastPrompt = lastPromptRef.current[shift.id] || 0
          if (!checkinShift && now.getTime() - lastPrompt >= CHECKIN_REPEAT_MS) {
            lastPromptRef.current[shift.id] = now.getTime()
            setCheckinShift(shift)
            playNotificationSound()
          }
        } else if (checkinShift?.id === shift.id) {
          setCheckinShift(null)
        }
      }

      if (checkinShift && !shifts.some((shift) => shift.id === checkinShift.id && shift.status === "Agendado")) {
        setCheckinShift(null)
      }
    } catch {
      // A falha temporária de rede não interrompe as próximas verificações.
    }
  }, [addNotice, checkinShift, user?.idUser])

  const handleCheckinReminder = useCallback(async (reminder: CheckinReminder) => {
    if (!user?.idUser || reminder.doctorId !== user.idUser) return
    try {
      const { data: shift } = await api.get<ScheduledShift>(`/admin/escala/${reminder.id}`)
      if (shift.doctorId === user.idUser && shift.status === "Agendado") {
        lastPromptRef.current[shift.id] = Date.now()
        setCheckinShift(shift)
        playNotificationSound()
      }
    } catch {
      // A próxima atualização periódica tentará carregar o plantão novamente.
    }
  }, [user?.idUser])

  const handleQueueNotification = useCallback((notification: QueueNotification) => {
    if (!user?.idUser || notification.doctorId !== user.idUser) return
    addQueueNotice(notification)
  }, [addQueueNotice, user?.idUser])

  useEscalaRealtime(fetchAndEvaluate, !!user?.idUser, handleCheckinReminder, handleQueueNotification)

  useEffect(() => {
    if (!user?.idUser) return
    fetchAndEvaluate()
    const timer = window.setInterval(fetchAndEvaluate, POLL_MS)
    return () => window.clearInterval(timer)
  }, [fetchAndEvaluate, user?.idUser])

  const handleCheckin = async () => {
    if (!checkinShift) return
    setCheckingIn(true)
    try {
      await api.post(`/admin/escala/${checkinShift.id}/checkin`)
      setCheckinShift(null)
      await fetchAndEvaluate()
    } finally {
      setCheckingIn(false)
    }
  }

  return (
    <>
      <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-3">
        {notices.map((notice) => (
          <div key={notice.id} className="pointer-events-auto rounded-lg border border-primary/20 bg-card p-4 text-card-foreground shadow-xl">
            <button
              type="button"
              className="absolute right-6 mt-[-4px] rounded-sm p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              onClick={() => setNotices((current) => current.filter((item) => item.id !== notice.id))}
              aria-label="Fechar notificação"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="flex gap-3 pr-5">
              <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div>
                {notice.kind === "queue" ? <><p className="font-semibold">Nova senha na fila</p><p className="mt-1 text-sm text-muted-foreground">A senha <strong>{notice.queue.code}</strong> entrou em <strong>{notice.queue.setor}</strong> ({notice.queue.status}).</p></> : <><p className="font-semibold">Plantão se aproximando</p><p className="mt-1 text-sm text-muted-foreground">Faltam <strong>{notice.kind} minutos</strong> para o início do plantão de {notice.shift.setor}.</p></>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {checkinShift && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="shift-checkin-title">
          <div className="relative w-full max-w-md rounded-xl border bg-card p-6 text-card-foreground shadow-2xl">
            <button
              type="button"
              className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              onClick={() => setCheckinShift(null)}
              aria-label="Fechar aviso de check-in"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex items-start gap-3 pr-8">
              <Bell className="mt-0.5 h-6 w-6 shrink-0 text-primary" />
              <div>
                <h2 id="shift-checkin-title" className="text-lg font-semibold">Hora de iniciar o plantão</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Seu plantão em <strong>{checkinShift.setor}</strong> já começou. Faça o check-in para iniciar o atendimento.
                </p>
              </div>
            </div>
            <Button className="mt-6 w-full" onClick={handleCheckin} disabled={checkingIn}>
              <CheckCircle2 className="h-4 w-4" />
              {checkingIn ? "Registrando check-in..." : "Fazer check-in"}
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
