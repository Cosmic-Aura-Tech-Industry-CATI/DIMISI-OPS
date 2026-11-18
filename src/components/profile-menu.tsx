import {
  ChevronsUpDown,
  LogOut,
  Settings,
  User as UserIcon,
  LifeBuoy,
  Download,
} from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth";
import { usePwaInstall } from "@/hooks/use-pwa-install";
import { UserAvatar } from "@/components/user-avatar";

export function ProfileMenu({ compact = false }: { compact?: boolean }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { canPromptNative, promptInstall } = usePwaInstall();
  if (!user) return null;

  const isAdmin = user.role === "admin" || user.role === "director";

  const profilePath = isAdmin ? "/admin/profile" : "/employee/profile";
  const settingsPath = isAdmin ? "/admin/settings" : "/employee/settings";
  const supportPath = isAdmin ? "/admin/support" : "/employee/support";

  const isImageAvatar =
    Boolean(user.avatar) &&
    (user.avatar.startsWith("data:") ||
      user.avatar.startsWith("http") ||
      user.avatar.startsWith("/") ||
      user.avatar.includes("/"));

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="group flex items-center gap-2 rounded-full border border-border/60 bg-background/60 py-1 pl-1 pr-2 transition-colors hover:bg-accent/60"
          aria-label="Open profile menu"
        >
          <UserAvatar
            user={user}
            name={user.name}
            className="h-7 w-7 text-[11px] shadow-glow"
            fallbackClassName="text-[11px] bg-gradient-to-br from-primary to-[oklch(0.65_0.22_320)] text-primary-foreground font-semibold"
          />
          {!compact && (
            <div className="hidden min-w-0 flex-col text-left sm:flex">
              <span className="truncate text-xs font-medium leading-none">{user.name}</span>
              <span className="mt-0.5 truncate font-mono text-[10px] tracking-wider text-muted-foreground">
                {user.code}
              </span>
            </div>
          )}
          <ChevronsUpDown className="hidden h-3.5 w-3.5 text-muted-foreground sm:block" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60 rounded-2xl p-1.5">
        <DropdownMenuLabel className="flex items-center gap-3 rounded-xl p-2">
          <UserAvatar
            user={user}
            name={user.name}
            className="h-9 w-9 text-xs"
            fallbackClassName="text-xs bg-gradient-to-br from-primary to-[oklch(0.65_0.22_320)] text-primary-foreground font-semibold"
          />
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">{user.name}</div>
            <div className="truncate font-mono text-xs font-normal tracking-wider text-muted-foreground">
              {user.code}
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="cursor-pointer rounded-lg">
          <Link to={profilePath as "/admin/settings"}>
            <UserIcon className="mr-2 h-4 w-4" /> Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="cursor-pointer rounded-lg">
          <Link to={settingsPath as "/admin/settings"}>
            <Settings className="mr-2 h-4 w-4" /> Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="cursor-pointer rounded-lg">
          <Link to={supportPath as "/admin/settings"}>
            <LifeBuoy className="mr-2 h-4 w-4" /> Help & support
          </Link>
        </DropdownMenuItem>
        {canPromptNative && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={promptInstall}
              className="cursor-pointer rounded-lg text-primary focus:text-primary font-medium"
            >
              <Download className="mr-2 h-4 w-4" /> Install DIMISI OPS
            </DropdownMenuItem>
          </>
        )}
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
