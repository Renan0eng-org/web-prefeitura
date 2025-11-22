import { FormBuilderPage } from "@/views/form-builder/FormBuilderPage";

export default async function EditFormPage(props: { params: Promise<{ formId: string }> }) {
    const params = await props.params;
    return (<FormBuilderPage formId={params.formId} />);
}