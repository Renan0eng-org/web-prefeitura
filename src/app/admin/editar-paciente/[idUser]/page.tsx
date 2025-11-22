import RegisterPatientPage from "@/views/registrar-paciente/page";

export default async function page(props: { params: Promise<{ idUser: string }> }) {
  const params = await props.params;
  const { idUser } = params;
  return <div>
    <RegisterPatientPage idUser={idUser} />
  </div>
}
