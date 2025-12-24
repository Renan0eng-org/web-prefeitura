"use client"

import CriarAtendimentoView from "@/views/admin/atendimentos/CriarAtendimentoView"
import { useParams } from "next/navigation"

export default function EditarAtendimentoPage() {
  const params = useParams()
  const id = (params as any)?.id

  return <CriarAtendimentoView attendanceId={id} />
}
