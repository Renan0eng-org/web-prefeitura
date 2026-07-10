
import { GlobalAlert } from "@/components/Alert";
import { AppSidebar } from "@/components/app-sidebar";
import { BreadcrumbDynamic } from "@/components/Breadcrumb";
import { EmailVerificationBanner } from "@/components/email-verification-banner";
import { ChatFloatButton } from "@/components/chat-float-button";
import { ChatSidebar } from "@/components/chat-sidebar";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AlertProvider } from "@/hooks/use-alert";
import { AuthProvider } from "@/hooks/use-auth";
import { ChatProvider } from "@/hooks/use-chat";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <>
      <AlertProvider>
        <AuthProvider>
          <ChatProvider>
            <GlobalAlert />
            <SidebarProvider>
              <AppSidebar />
              <SidebarInset>
                <EmailVerificationBanner />
                <header className="flex h-14 md:h-16 shrink-0 items-center gap-2 text-text">
                  <div className="flex items-center gap-2 px-3 md:px-4 w-full">
                    {/* Mobile: logo + trigger */}
                    <div className="flex items-center gap-2 md:hidden">
                      <SidebarTrigger className="-ml-1" />
                      <a href="/admin" className="flex items-center gap-2">
                        <img src="/logo.webp" alt="Logo" className="h-7 w-7" />
                        <span className="font-semibold text-sm">PVAI SEM DOR</span>
                      </a>
                    </div>
                    {/* Desktop: trigger + breadcrumb */}
                    <div className="hidden md:flex items-center gap-2">
                      <SidebarTrigger className="-ml-1" />
                      <Separator orientation="vertical" className="mr-2 h-4" />
                      <BreadcrumbDynamic />
                    </div>
                  </div>
                </header>
                <div className="w-full h-[calc(100vh-56px-64px)] md:h-[calc(100vh-84px)] overflow-auto scrollable">
                  {children}
                </div>
              </SidebarInset>
              <MobileBottomNav />
            </SidebarProvider>
            <ChatFloatButton />
            <ChatSidebar />
          </ChatProvider>
        </AuthProvider>
      </AlertProvider>
    </>
  )
}
