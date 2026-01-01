
import { GlobalAlert } from "@/components/Alert";
import { AppSidebar } from "@/components/app-sidebar";
import { BreadcrumbDynamic } from "@/components/Breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AlertProvider } from "@/hooks/use-alert";
import { AuthProvider } from "@/hooks/use-auth";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <>
      <AlertProvider>
        <AuthProvider>
          <GlobalAlert />
          <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
              <header className="flex h-16 shrink-0 items-center gap-2 text-text">
                <div className="flex items-center gap-2 px-4">
                  <SidebarTrigger className="-ml-1" />
                  <Separator orientation="vertical" className="mr-2 h-4" />
                  <BreadcrumbDynamic />
                </div>
              </header>
              <div className="w-full h-[calc(100vh-84px)] overflow-auto scrollable">
                {children}
              </div>
            </SidebarInset>
          </SidebarProvider>
        </AuthProvider>
      </AlertProvider>
    </>
  )
}
