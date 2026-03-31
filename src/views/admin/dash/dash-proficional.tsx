import PatientsPage from "@/app/admin/pacientes/page";
import FormCard from "@/components/tabs/form-card";
import { useAuth } from "@/hooks/use-auth";
import React from "react";

export default function DashProfessional() {
    const { getPermissions } = useAuth()

    const permissions = React.useMemo(() => getPermissions("dash-professional-paciente"), [getPermissions])
    return (
        <div className="p-2 sm:p-8">
            <FormCard />
            {permissions?.visualizar &&
                <PatientsPage className="mt-8 p-0 md:p-0 lg:p-0" initialPageSize={5} />}
        </div>
    )
}