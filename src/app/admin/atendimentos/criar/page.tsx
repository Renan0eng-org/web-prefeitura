import CriarAtendimentoView from "@/views/admin/atendimentos/CriarAtendimentoView"

interface PageProps {
  searchParams: Promise<{ appointmentId?: string; patientId?: string; ticketId?: string }>
}

export default async function CriarAtendimentoPage({ searchParams }: PageProps) {
  const sp = await searchParams
  return (
    <CriarAtendimentoView
      appointmentId={sp.appointmentId}
      patientId={sp.patientId}
      ticketId={sp.ticketId}
    />
  )
}
