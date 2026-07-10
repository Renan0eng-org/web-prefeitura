"use client"

import {
  ChevronsUpDown,
  LogOut,
  UserPen
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"

export function NavUser() {

  const { user, logout } = useAuth();

  const { isMobile } = useSidebar()

  const router = useRouter();

  const firstName = user?.name?.split(" ")[0];
  const lastName = user?.name?.split(" ")[1] || "";

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user?.avatar || undefined} alt={user?.name} />
                <AvatarFallback className="rounded-lg">{firstName?.charAt(0)}{lastName.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                {user ? (
                  <>
                    <span className="truncate font-semibold">{user?.name}</span>
                    <span className="truncate text-xs text-muted-foreground">{user?.email}</span>
                  </>
                ) : (
                  <div className="animate-pulse space-y-1.5">
                    <div className="h-4 w-24 rounded-sm bg-white" />
                    <div className="h-3 w-32 rounded-sm bg-white" />
                  </div>
                )}
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user?.avatar || undefined} alt={user?.name} />
                  <AvatarFallback className="rounded-lg">{firstName?.charAt(0)}{lastName?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  {user ? (
                    <>
                      <span className="truncate font-semibold">{user?.name}</span>
                      <span className="truncate text-xs text-muted-foreground">{user?.email}</span>
                    </>
                  ) : (
                    <div className="animate-pulse space-y-1.5">
                      <div className="h-4 w-24 rounded-sm bg-white" />
                      <div className="h-3 w-32 rounded-sm bg-white" />
                    </div>
                  )}
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => router.push('/admin/minha-conta')}
            >
              <UserPen />
              Minha Conta
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                logout();
                router.refresh();
              }}
              className="font-bold justify-center"
            >
              <LogOut />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
