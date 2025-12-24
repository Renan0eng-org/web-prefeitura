"use client"

import CriarAtendimentoView from "@/views/admin/atendimentos/CriarAtendimentoView"
import { useSearchParams } from "next/navigation"

export default function CriarAtendimentoPage() {
  const searchParams = useSearchParams()
  const appointmentId = searchParams.get("appointmentId")

  return <CriarAtendimentoView appointmentId={appointmentId || undefined} />
}
