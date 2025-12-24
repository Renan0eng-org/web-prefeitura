import CriarAtendimentoView from "@/views/admin/atendimentos/CriarAtendimentoView";

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditarAtendimentoPage(props: PageProps) {
const { params } = props;
  const { id } = await params;
  return <CriarAtendimentoView attendanceId={id} />
}
