import { ResponseDetailPage } from "@/views/form-builder/ResponseDetailPage";

export default async function ViewResponsePage(props: { params: Promise<{ responseId: string }> }) {
  const params = await props.params;
  // O formId está na URL, mas não é estritamente necessário para a API
  // Apenas o responseId é, mas mantemos o componente no mesmo lugar por organização
  return <ResponseDetailPage responseId={params.responseId} />;
}