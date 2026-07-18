"use client"

import * as React from "react"
import { io, type Socket } from "socket.io-client"

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://prefeitura.back.renannardi.com"

/**
 * Conecta ao gateway em tempo real da Escala de Plantão.
 *
 * Ao receber o sinal `escala:changed`, chama `onChange` (com debounce) para o
 * componente refazer o fetch autenticado — nenhum dado sensível trafega pelo socket.
 *
 * Retorna se o socket está conectado (para exibir um indicador "ao vivo").
 */
export function useEscalaRealtime(onChange: () => void, enabled = true): boolean {
    const cbRef = React.useRef(onChange)
    cbRef.current = onChange
    const [connected, setConnected] = React.useState(false)

    React.useEffect(() => {
        if (!enabled) return

        const socket: Socket = io(`${BASE_URL}/escala`, {
            withCredentials: true,
            transports: ["websocket", "polling"],
        })

        let timer: ReturnType<typeof setTimeout> | undefined
        const onChanged = () => {
            if (timer) clearTimeout(timer)
            timer = setTimeout(() => cbRef.current(), 250) // coalesce rajadas de mudanças
        }

        socket.on("connect", () => setConnected(true))
        socket.on("disconnect", () => setConnected(false))
        socket.on("escala:changed", onChanged)

        return () => {
            if (timer) clearTimeout(timer)
            socket.off("escala:changed", onChanged)
            socket.disconnect()
        }
    }, [enabled])

    return connected
}
