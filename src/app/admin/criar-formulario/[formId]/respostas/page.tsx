import { ResponseListPage } from "@/views/form-builder/ResponseListPage";

export default async function ListResponsesPage(props: { params: Promise<{ formId: string }> }) {
    const params = await props.params;
    return <ResponseListPage formId={params.formId} />;
}