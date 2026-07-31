import { ChevronsUpDown, LogOut, Settings, User as UserIcon, LifeBuoy } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth";

export function ProfileMenu({ compact = false }: { compact?: boolean }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  if (!user) return null;

  const settingsPath = user.role === "admin" ? "/admin/settings" : "/employee/profile";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="group flex items-center gap-2 rounded-full border border-border/60 bg-background/60 py-1 pl-1 pr-2 transition-colors hover:bg-accent/60"
          aria-label="Open profile menu"
        >
          <div className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-primary to-[oklch(0.65_0.22_320)] text-[11px] font-semibold text-primary-foreground shadow-glow">
            {user.avatar}
          </div>
          {!compact && (
            <div className="hidden min-w-0 flex-col text-left sm:flex">
              <span className="truncate text-xs font-medium leading-none">{user.name}</span>
              <span className="mt-0.5 truncate font-mono text-[10px] tracking-wider text-muted-foreground">{user.code}</span>
            </div>
          )}
          <ChevronsUpDown className="hidden h-3.5 w-3.5 text-muted-foreground sm:block" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60 rounded-2xl p-1.5">
        <DropdownMenuLabel className="flex items-center gap-3 rounded-xl p-2">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-primary to-[oklch(0.65_0.22_320)] text-xs font-semibold text-primary-foreground">
            {user.avatar}
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">{user.name}</div>
            <div className="truncate font-mono text-xs font-normal tracking-wider text-muted-foreground">{user.code}</div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate({ to: settingsPath })} className="cursor-pointer rounded-lg">
          <UserIcon className="mr-2 h-4 w-4" /> Profile
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate({ to: settingsPath })} className="cursor-pointer rounded-lg">
          <Settings className="mr-2 h-4 w-4" /> Settings
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer rounded-lg">
          <LifeBuoy className="mr-2 h-4 w-4" /> Help & support
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            logout();
            navigate({ to: "/login" });
          }}
          className="cursor-pointer rounded-lg text-destructive focus:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
