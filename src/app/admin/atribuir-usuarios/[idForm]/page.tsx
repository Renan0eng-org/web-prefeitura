import AssignUserPage from "@/views/assign-user/AssignUserPage";

export default async function ViewAssignUserPage(props: { params: Promise<{ idForm: string }> }) {
  const params = await props.params;
  const { idForm } = params;

  if (!idForm) {
    return <div>ID do formulário não encontrado.</div>;
  }

  return (
      <AssignUserPage idForm={idForm} />
  );
}