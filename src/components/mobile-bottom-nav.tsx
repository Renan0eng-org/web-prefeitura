"use client"

import { data } from "@/lib/nav"
import { useAuth } from "@/hooks/use-auth"
import { useIsMobile } from "@/hooks/use-mobile"
import { usePathname } from "next/navigation"
import Link from "next/link"
import React from "react"
import { cn } from "@/lib/utils"
import { Menu } from "lucide-react"
import { useSidebar } from "@/components/ui/sidebar"

export function MobileBottomNav() {
  const isMobile = useIsMobile()
  const { user } = useAuth()
  const pathname = usePathname()

  const filteredItems = React.useMemo(() => {
    if (!user?.nivel_acesso?.menus) return [];

    const userPermissions = new Set(
      user.nivel_acesso.menus
        .filter((p: any) => p.visualizar)
        .map((p: any) => p.slug)
    );

    return data.bottomNav.filter(item => {
      const isPublic = !item.nivel_acesso;
      return isPublic || userPermissions.has(item.nivel_acesso);
    });
  }, [user]);

  if (!isMobile || filteredItems.length === 0) return null;

  const isActive = (url: string) => {
    if (url === "/admin") return pathname === "/admin";
    return pathname.startsWith(url);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background safe-area-bottom md:hidden">
      <div className="flex items-center justify-around h-16">
        {filteredItems.slice(0, 4).map((item) => {
          const Icon = item.icon;
          const active = isActive(item.url);
          return (
            <Link
              key={item.url}
              href={item.url}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 h-full px-1 transition-colors",
                active
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", active && "stroke-[2.5]")} />
              <span className={cn(
                "text-[10px] leading-tight truncate max-w-[64px] text-center",
                active && "font-semibold"
              )}>
                {item.title}
              </span>
            </Link>
          );
        })}
        <MobileMenuButton />
      </div>
    </nav>
  );
}

function MobileMenuButton() {
  const { setOpenMobile } = useSidebar();

  return (
    <button
      onClick={() => setOpenMobile(true)}
      className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full px-1 text-muted-foreground transition-colors"
    >
      <Menu className="h-5 w-5" />
      <span className="text-[10px] leading-tight">Menu</span>
    </button>
  );
}
