import { Link, useRouterState } from "@tanstack/react-router";
import dimisiMark from "@/assets/dimisi-mark.png.asset.json";
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  ListTodo,
  FolderKanban,
  ClipboardCheck,
  Trophy,
  Activity,
  BarChart3,
  Settings,
  CheckCircle2,
  Clock,
  Sparkles,
  LineChart,
  History,
  UserCircle,
  Bell,
  LogOut,
  XCircle,
  Megaphone,
  ScrollText,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useAuth, type Role } from "@/lib/auth";
import { cn } from "@/lib/utils";

const adminNav = {
  main: [
    { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
    { title: "Employees", url: "/admin/employees", icon: Users },
    { title: "Admins", url: "/admin/admins", icon: ShieldCheck },
  ],
  work: [
    { title: "Tasks", url: "/admin/tasks", icon: ListTodo },
    { title: "Project Management", url: "/admin/projects", icon: FolderKanban },
    { title: "Task Reviews", url: "/admin/task-reviews", icon: ClipboardCheck },
    { title: "Leaderboard", url: "/admin/leaderboard", icon: Trophy },
  ],
  insights: [
    { title: "Notice Board", url: "/admin/notices", icon: Megaphone },
    { title: "Notifications", url: "/admin/notifications", icon: Bell },
    { title: "Audit Logs", url: "/admin/audit-logs", icon: ScrollText },
    { title: "Activity", url: "/admin/activity", icon: Activity },
    { title: "Reports", url: "/admin/reports", icon: BarChart3 },
    { title: "Settings", url: "/admin/settings", icon: Settings },
  ],
};

const employeeNav = {
  main: [
    { title: "Dashboard", url: "/employee", icon: LayoutDashboard },
    { title: "Assigned Tasks", url: "/employee/tasks", icon: ListTodo },
    { title: "Pending Review", url: "/employee/pending-review", icon: ClipboardCheck },
    { title: "Completed Tasks", url: "/employee/completed", icon: CheckCircle2 },
    { title: "Rejected Tasks", url: "/employee/rejected", icon: XCircle },
  ],
  insights: [
    { title: "Statistics", url: "/employee/statistics", icon: LineChart },
    { title: "Leaderboard", url: "/employee/leaderboard", icon: Trophy },
    { title: "Notice Board", url: "/employee/notices", icon: Megaphone },
    { title: "Activity", url: "/employee/history", icon: History },
    { title: "Notifications", url: "/employee/notifications", icon: Bell },
  ],
  account: [
    { title: "Profile", url: "/employee/profile", icon: UserCircle },
    { title: "Settings", url: "/employee/settings", icon: Settings },
  ],
};

export function AppSidebar({ role }: { role: Role }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user, logout } = useAuth();

  const isActive = (url: string) => (url === `/${role}` ? pathname === url : pathname.startsWith(url));

  const groups =
    role === "admin"
      ? [
          { label: "Main", items: adminNav.main },
          { label: "Work", items: adminNav.work },
          { label: "Insights", items: adminNav.insights },
        ]
      : [
          { label: "Main", items: employeeNav.main },
          { label: "Insights", items: employeeNav.insights },
          { label: "Account", items: employeeNav.account },
        ];


  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border/60">
      <SidebarHeader className="border-b border-sidebar-border/60">
        <Link
          to={role === "admin" ? "/admin" : "/employee"}
          className="group/logo flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors"
          aria-label="Dimisi home"
        >
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-background/60 border border-border transition-transform duration-300 group-hover/logo:scale-105">
            <img src={dimisiMark.url} alt="Dimisi" className="h-6 w-6 object-contain" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="font-display text-lg font-bold leading-none tracking-tight">Dimisi</span>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{role}</span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {groups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground/80">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const active = isActive(item.url);
                  return (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
                        <Link
                          to={item.url}
                          aria-current={active ? "page" : undefined}
                          className={cn(
                            "group/nav relative flex items-center gap-2 rounded-lg transition-all duration-200",
                            active
                              ? "bg-primary text-primary-foreground shadow-[0_2px_10px_-4px_rgb(0_0_0/0.6)] hover:bg-primary hover:text-primary-foreground"
                              : "hover:bg-sidebar-accent/60 hover:translate-x-0.5",
                          )}
                        >
                          <span
                            aria-hidden
                            className={cn(
                              "absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-foreground transition-all",
                              active ? "opacity-0" : "opacity-0 group-hover/nav:opacity-30",
                            )}
                          />
                          <item.icon
                            className={cn(
                              "h-4 w-4 transition-colors",
                              active ? "text-primary-foreground" : "text-muted-foreground group-hover/nav:text-foreground",
                            )}
                          />

                          <span className="truncate">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>


      <SidebarFooter className="border-t border-sidebar-border/60">
        <div className="flex items-center gap-2 px-1 py-1">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary/40 to-accent text-xs font-semibold">
            {user?.avatar}
          </div>
          <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <div className="truncate text-xs font-medium">{user?.name}</div>
            <div className="truncate font-mono text-[10px] tracking-wider text-muted-foreground">{user?.code}</div>
          </div>
          <button
            onClick={logout}
            className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground group-data-[collapsible=icon]:hidden"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
