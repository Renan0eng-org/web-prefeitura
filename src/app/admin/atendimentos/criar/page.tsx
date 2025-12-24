import CriarAtendimentoView from "@/views/admin/atendimentos/CriarAtendimentoView"

interface PageProps {
  searchParams?: { [key: string]: string | string[] | undefined }
}

export default function CriarAtendimentoPage({ searchParams }: PageProps) {
  const appointmentId = Array.isArray(searchParams?.appointmentId) ? String(searchParams?.appointmentId[0]) : (searchParams?.appointmentId as string | undefined)
  return <CriarAtendimentoView appointmentId={appointmentId || undefined} />
}
