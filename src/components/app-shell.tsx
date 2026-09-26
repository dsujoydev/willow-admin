"use client";

import { BedDouble, BookOpenCheck, Building2, ChevronRight, ClipboardList, Images, Loader2, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";

const navigation = [
  { label: "Enquiries", href: "/enquiries", icon: ClipboardList },
  { label: "Room categories", href: "/room-category", icon: BedDouble },
  { label: "Rooms", href: "/room", icon: Building2 },
  { label: "Bookings", href: "/bookings", icon: BookOpenCheck },
  { label: "Site media", href: "/site-media", icon: Images },
];

function titleForPath(pathname: string) {
  return navigation.find((item) => pathname.startsWith(item.href))?.label ?? "Admin";
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const isLogin = pathname === "/login";

  useEffect(() => {
    if (!loading && !user && !isLogin) router.replace("/login");
    if (!loading && user && isLogin) router.replace("/enquiries");
  }, [isLogin, loading, router, user]);

  if (isLogin) return children;

  if (loading || !user) {
    return (
      <main className="grid min-h-svh place-items-center bg-muted/30">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Checking your session…
        </div>
      </main>
    );
  }

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader className="px-3 py-4">
          <Link href="/enquiries" className="flex items-center gap-3 overflow-hidden rounded-md px-1">
            <span className="grid size-6 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
              <span className="font-semibold">W</span>
            </span>
            <span className="min-w-0 group-data-[collapsible=icon]:hidden">
              <span className="block truncate text-sm font-semibold">Willow Hotel</span>
              <span className="block truncate text-xs text-muted-foreground">Admin workspace</span>
            </span>
          </Link>
        </SidebarHeader>
        {/* <SidebarSeparator /> */}
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Operations</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navigation.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      render={<Link href={item.href} />}
                      isActive={pathname.startsWith(item.href)}
                      tooltip={item.label}
                    >
                      <item.icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" tooltip={user.email} className="cursor-default hover:bg-transparent">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-muted text-xs font-semibold">
                  {user.name.slice(0, 2).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{user.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">{user.role.replaceAll("_", " ")}</span>
                </span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
          <Button
            variant="ghost"
            className="w-full justify-start group-data-[collapsible=icon]:px-2"
            onClick={handleLogout}
          >
            <LogOut />
            <span className="group-data-[collapsible=icon]:hidden">Log out</span>
          </Button>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarInset>
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-background/90 px-4 backdrop-blur-sm">
          <SidebarTrigger />
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-1 text-sm">
            <span className="text-muted-foreground">Willow</span>
            <ChevronRight className="size-3.5 text-muted-foreground" />
            <span className="font-medium">{titleForPath(pathname)}</span>
          </div>
        </header>
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
