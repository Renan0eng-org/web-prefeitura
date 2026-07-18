"use client"

import * as React from "react"

import { NavMain } from "@/components/nav-main"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useAuth } from "@/hooks/use-auth"
import { data, NavGroup } from "@/lib/nav"
import { NavUser } from "./nav-user"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth()

  const filteredGroups = React.useMemo(() => {
    if (!user?.nivel_acesso?.menus) {
      return [];
    }

    const userPermissions = new Set(
      user.nivel_acesso.menus
        .filter((permission: any) => permission.visualizar)
        .map((permission: any) => permission.slug)
    );

    return data.navGroups.reduce<NavGroup[]>((acc, group) => {
      const filteredItems = group.items.filter(item => {
        const isPublic = !item.nivel_acesso;
        return isPublic || userPermissions.has(item.nivel_acesso);
      });

      if (filteredItems.length > 0) {
        acc.push({ label: group.label, items: filteredItems });
      }

      return acc;
    }, []);
  }, [user]);

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/admin">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg text-text">
                  <img src="/logo.webp" alt="Logo" className="h-8 w-8" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">PVAI SEM DOR</span>
                  {
                    user?.nivel_acesso.nome ? (
                      <span className="truncate text-xs">{user?.nivel_acesso.nome}</span>
                    ) :
                      (
                        <div className="animate-pulse h-4 w-24 rounded-sm bg-white" />
                      )
                  }
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="scrollable">
        {filteredGroups.map((group) => (
          <NavMain key={group.label} items={group.items} title={group.label} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
