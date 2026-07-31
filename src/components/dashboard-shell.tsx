import type { ReactNode } from "react";
import { Search, Command } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { NotificationsMenu } from "@/components/notifications-menu";
import { ProfileMenu } from "@/components/profile-menu";
import type { Role } from "@/lib/auth";

export function DashboardShell({ role, children }: { role: Role; children: ReactNode }) {
  return (
    <SidebarProvider>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-full focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:shadow-glow"
      >
        Skip to content
      </a>
      <div className="flex min-h-screen w-full">
        <AppSidebar role={role} />
        <div className="flex min-w-0 flex-1 flex-col">
          <header
            className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-border/60 bg-background/70 px-3 backdrop-blur-xl sm:px-6"
            role="banner"
          >
            <SidebarTrigger className="rounded-full transition-colors hover:bg-accent" aria-label="Toggle navigation" />
            <Separator orientation="vertical" className="mx-1 hidden h-6 sm:block" />

            <div className="relative hidden max-w-md flex-1 md:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input
                aria-label="Search"
                placeholder="Search tasks, people, reports…"
                className="h-9 rounded-full border-border/60 bg-muted/40 pl-9 pr-16 transition-shadow focus-visible:ring-primary/30 focus-visible:shadow-glow"
              />
              <kbd className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 items-center gap-1 rounded-md border border-border/60 bg-background/80 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground lg:inline-flex">
                <Command className="h-3 w-3" /> K
              </kbd>
            </div>

            <button
              type="button"
              aria-label="Search"
              className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground md:hidden"
            >
              <Search className="h-4 w-4" />
            </button>

            <div className="ml-auto flex items-center gap-1 sm:gap-2">
              <NotificationsMenu />
              <ThemeToggle />
              <Separator orientation="vertical" className="mx-1 hidden h-6 sm:block" />
              <ProfileMenu />
            </div>
          </header>
          <main
            id="main-content"
            className="flex-1 p-4 pb-[calc(2rem+env(safe-area-inset-bottom))] sm:p-6 lg:p-8 lg:pb-10"
            role="main"
          >
            <div className="mx-auto w-full max-w-7xl space-y-6 animate-in fade-in slide-in-from-bottom-1 duration-300 motion-reduce:animate-none">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
