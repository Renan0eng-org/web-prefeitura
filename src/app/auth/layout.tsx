import { GlobalAlert } from "@/components/Alert";
import { AlertProvider } from "@/hooks/use-alert";
import { AuthProvider } from "@/hooks/use-auth";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AlertProvider>
          <AuthProvider>
            <GlobalAlert />
            {children}
          </AuthProvider>
        </AlertProvider>
      </body>
    </html>
  );
}
