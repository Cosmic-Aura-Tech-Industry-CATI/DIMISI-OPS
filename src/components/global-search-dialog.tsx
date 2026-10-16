import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Search,
  FolderKanban,
  CheckSquare,
  User,
  Shield,
  Briefcase,
  Loader2,
  ArrowRight,
  Sparkles,
  Layers,
  Users,
  Compass,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useDebounce } from "@/hooks/use-debounce";
import { useGlobalSearch } from "@/features/search";
import type { Role } from "@/lib/auth";

interface GlobalSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role?: Role;
}

function getInitials(name?: string): string {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function GlobalSearchDialog({
  open,
  onOpenChange,
  role = "employee",
}: GlobalSearchDialogProps) {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 250);
  const navigate = useNavigate();

  const { data, isFetching } = useGlobalSearch(debouncedQuery, 5, {
    enabled: open && debouncedQuery.trim().length > 0,
  });

  // Reset query when dialog closes
  useEffect(() => {
    if (!open) {
      setQuery("");
    }
  }, [open]);

  const handleSelect = useCallback(
    (action: () => void) => {
      onOpenChange(false);
      action();
    },
    [onOpenChange],
  );

  const isAdmin = role === "admin" || role === "director";
  const results = data?.data;
  const hasProjects = (results?.projects?.length ?? 0) > 0;
  const hasTasks = (results?.tasks?.length ?? 0) > 0;
  const hasUsers = (results?.users?.length ?? 0) > 0;
  const hasAnyResults = hasProjects || hasTasks || hasUsers;
  const hasQuery = debouncedQuery.trim().length > 0;

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <div className="relative">
        <CommandInput
          placeholder="Search projects, tasks, employees, and more…"
          value={query}
          onValueChange={setQuery}
          className="pr-10"
        />
        {isFetching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          </div>
        )}
      </div>

      <CommandList className="max-h-[70vh] p-2">
        {hasQuery && !isFetching && !hasAnyResults && (
          <CommandEmpty className="py-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted/50 mb-3">
              <Search className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">No results found for &ldquo;{debouncedQuery}&rdquo;</p>
            <p className="text-xs text-muted-foreground mt-1">
              Try searching by title, name, ID code, or keyword.
            </p>
          </CommandEmpty>
        )}

        {/* --- Quick Navigation When Input is Empty --- */}
        {!hasQuery && (
          <CommandGroup heading="Quick Navigation">
            <CommandItem
              onSelect={() =>
                handleSelect(() => {
                  navigate({ to: isAdmin ? "/admin/tasks" : "/employee/tasks" });
                })
              }
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 cursor-pointer"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                <CheckSquare className="h-4 w-4" />
              </div>
              <div className="flex flex-1 items-center justify-between">
                <span className="font-medium text-sm">Tasks Workspace</span>
                <span className="text-xs text-muted-foreground">Manage and track work</span>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
            </CommandItem>

            {isAdmin && (
              <CommandItem
                onSelect={() =>
                  handleSelect(() => {
                    navigate({ to: "/admin/projects" });
                  })
                }
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 cursor-pointer"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-500/10 text-blue-500">
                  <FolderKanban className="h-4 w-4" />
                </div>
                <div className="flex flex-1 items-center justify-between">
                  <span className="font-medium text-sm">Projects Catalogue</span>
                  <span className="text-xs text-muted-foreground">All active project initiatives</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
              </CommandItem>
            )}

            {isAdmin && (
              <CommandItem
                onSelect={() =>
                  handleSelect(() => {
                    navigate({ to: "/admin/employees" });
                  })
                }
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 cursor-pointer"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-500">
                  <Users className="h-4 w-4" />
                </div>
                <div className="flex flex-1 items-center justify-between">
                  <span className="font-medium text-sm">Employee Directory</span>
                  <span className="text-xs text-muted-foreground">Team members and designations</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
              </CommandItem>
            )}

            {isAdmin && (
              <CommandItem
                onSelect={() =>
                  handleSelect(() => {
                    navigate({ to: "/admin/admins" });
                  })
                }
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 cursor-pointer"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-500/10 text-amber-500">
                  <Shield className="h-4 w-4" />
                </div>
                <div className="flex flex-1 items-center justify-between">
                  <span className="font-medium text-sm">Admin Management</span>
                  <span className="text-xs text-muted-foreground">Privileged access accounts</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
              </CommandItem>
            )}

            <CommandItem
              onSelect={() =>
                handleSelect(() => {
                  navigate({ to: isAdmin ? "/admin/leaderboard" : "/employee/leaderboard" });
                })
              }
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 cursor-pointer"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-purple-500/10 text-purple-500">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="flex flex-1 items-center justify-between">
                <span className="font-medium text-sm">Leaderboard & Rankings</span>
                <span className="text-xs text-muted-foreground">Performance and badges</span>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
            </CommandItem>
          </CommandGroup>
        )}

        {/* --- Projects Group --- */}
        {hasProjects && (
          <>
            <CommandGroup heading={`Projects (${results!.projects.length})`}>
              {results!.projects.map((proj) => (
                <CommandItem
                  key={proj._id}
                  value={`project ${proj.name} ${proj.code || ""}`}
                  onSelect={() =>
                    handleSelect(() => {
                      if (isAdmin) {
                        navigate({ to: "/admin/projects" });
                      } else {
                        navigate({ to: "/employee/tasks" });
                      }
                    })
                  }
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 cursor-pointer"
                >
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-white"
                    style={{ backgroundColor: proj.color || "#C9A961" }}
                  >
                    <FolderKanban className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate">{proj.name}</p>
                      {proj.code && (
                        <Badge variant="outline" className="text-[10px] uppercase font-mono px-1.5 py-0">
                          {proj.code}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {typeof proj.managerId === "object" && proj.managerId?.name
                        ? `Manager: ${proj.managerId.name}`
                        : "Active initiative"}
                    </p>
                  </div>
                  <Badge
                    variant="secondary"
                    className="capitalize text-[11px] font-normal"
                  >
                    {proj.status}
                  </Badge>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator className="my-1" />
          </>
        )}

        {/* --- Tasks Group --- */}
        {hasTasks && (
          <>
            <CommandGroup heading={`Tasks (${results!.tasks.length})`}>
              {results!.tasks.map((task) => (
                <CommandItem
                  key={task._id}
                  value={`task ${task.title} ${task.type || ""}`}
                  onSelect={() =>
                    handleSelect(() => {
                      if (isAdmin) {
                        navigate({ to: `/admin/tasks/${task._id}` as any });
                      } else {
                        navigate({ to: `/employee/tasks/${task._id}` as any });
                      }
                    })
                  }
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 cursor-pointer"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <CheckSquare className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{task.title}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {typeof task.projectId === "object" && task.projectId?.name && (
                        <span className="truncate">📂 {task.projectId.name}</span>
                      )}
                      {typeof task.assignedTo === "object" && task.assignedTo?.name && (
                        <span className="truncate">👤 {task.assignedTo.name}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Badge
                      variant="outline"
                      className="capitalize text-[10px] font-normal"
                    >
                      {task.priority}
                    </Badge>
                    <Badge
                      variant="secondary"
                      className="capitalize text-[10px] font-normal"
                    >
                      {task.status?.replace(/_/g, " ")}
                    </Badge>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator className="my-1" />
          </>
        )}

        {/* --- Users Group --- */}
        {hasUsers && (
          <CommandGroup heading={`People (${results!.users.length})`}>
            {results!.users.map((u) => {
              const deptName =
                typeof u.department === "object" && u.department
                  ? u.department.name
                  : (u.department as string) || "";
              const desigName =
                typeof u.designation === "object" && u.designation
                  ? u.designation.name
                  : (u.designation as string) || "";

              const isUserAdmin = u.role === "admin" || u.role === "director";

              return (
                <CommandItem
                  key={u._id}
                  value={`user ${u.name} ${u.email} ${u.empId || ""}`}
                  onSelect={() =>
                    handleSelect(() => {
                      if (isAdmin) {
                        if (isUserAdmin) {
                          navigate({ to: `/admin/admins/${u._id}` as any });
                        } else {
                          navigate({ to: `/admin/employees/${u._id}` as any });
                        }
                      } else {
                        navigate({ to: "/employee/leaderboard" });
                      }
                    })
                  }
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 cursor-pointer"
                >
                  <Avatar className="h-8 w-8">
                    {u.avatar ? <AvatarImage src={u.avatar} alt={u.name} /> : null}
                    <AvatarFallback className="text-xs bg-muted font-medium">
                      {getInitials(u.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate">{u.name}</p>
                      {u.empId && (
                        <span className="text-[10px] font-mono text-muted-foreground">
                          {u.empId}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {[desigName, deptName, u.email].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <Badge
                    variant={isUserAdmin ? "default" : "outline"}
                    className="capitalize text-[10px] font-normal"
                  >
                    {u.role}
                  </Badge>
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}
      </CommandList>

      <div className="flex items-center justify-between border-t border-border/40 px-3 py-2 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-3">
          <span>
            <kbd className="rounded border bg-muted px-1 py-0.5 font-mono text-[10px]">↑</kbd>{" "}
            <kbd className="rounded border bg-muted px-1 py-0.5 font-mono text-[10px]">↓</kbd> navigate
          </span>
          <span>
            <kbd className="rounded border bg-muted px-1 py-0.5 font-mono text-[10px]">↵</kbd> select
          </span>
          <span>
            <kbd className="rounded border bg-muted px-1 py-0.5 font-mono text-[10px]">esc</kbd> close
          </span>
        </div>
        <span className="text-[10px] text-muted-foreground/70">Powered by Dimisi Search</span>
      </div>
    </CommandDialog>
  );
}
