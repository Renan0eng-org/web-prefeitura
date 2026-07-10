import { GlobalAlert } from "@/components/Alert";
import { AlertProvider } from "@/hooks/use-alert";
import { AuthProvider } from "@/hooks/use-auth";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AlertProvider>
      <AuthProvider>
        <GlobalAlert />
        {children}
      </AuthProvider>
    </AlertProvider>
  );
}
