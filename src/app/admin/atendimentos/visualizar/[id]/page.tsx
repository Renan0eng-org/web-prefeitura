import { AtendimentoViewer } from "@/components/admin/atendimentos/AtendimentoViewer"

export default async function VisualizarAtendimentoPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    return <div className="p-4 md:p-6"><AtendimentoViewer attendanceId={id} /></div>
}
