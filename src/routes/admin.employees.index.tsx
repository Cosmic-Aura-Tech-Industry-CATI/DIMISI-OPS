import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { RecordCard } from "@/components/record-card";
import { IdBadge } from "@/components/id-badge";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useEmployeesQuery, useRevokeEmployeeAccess } from "@/features/employees";

export const Route = createFileRoute("/admin/employees/")({
  head: () => ({
    meta: [
      { title: "Employees — Dimisi" },
      { name: "description", content: "Manage employees, roles, and departments." },
      { property: "og:title", content: "Employees — Dimisi" },
      { property: "og:description", content: "Manage employees, roles, and departments." },
    ],
  }),
  component: EmployeesPage,
});

type SortKey = "name" | "department" | "points" | "joinedAt";
type SortDir = "asc" | "desc";

const PAGE_SIZE = 8;

function initials(name: string) {
  return (name || "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function EmployeesPage() {
  const navigate = useNavigate();
  const { data: responseData, isLoading, isError, error, refetch, isRefetching } = useEmployeesQuery();
  const revokeMutation = useRevokeEmployeeAccess();

  const rawEmployees = responseData?.employees || [];

  const all = useMemo(() => {
    return rawEmployees.map((e) => {
      const deptName =
        typeof e.department === "object" && e.department
          ? (e.department as { name?: string }).name || "General"
          : (e.department as string) || "General";

      const titleName =
        typeof e.designation === "object" && e.designation
          ? (e.designation as { name?: string }).name || "Employee"
          : (e.designation as string) || "Employee";

      return {
        id: e._id || e.id || "",
        code: e.empId || "—",
        name: e.name || "Employee",
        email: e.email || "",
        jobTitle: titleName,
        department: deptName,
        avatar: initials(e.name || "Employee"),
        points: e.points ?? 0,
        status: e.isActive ? "active" : "inactive",
        joinedAt: e.joinDate || e.createdAt || new Date().toISOString(),
        raw: e,
      };
    });
  }, [rawEmployees]);

  const departments = useMemo(
    () => Array.from(new Set(all.map((e) => e.department))).sort(),
    [all],
  );

  const jobTitles = useMemo(
    () => Array.from(new Set(all.map((e) => e.jobTitle))).sort(),
    [all],
  );

  const [query, setQuery] = useState("");
  const [dept, setDept] = useState("all");
  const [role, setRole] = useState("all");
  const [status, setStatus] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("joinedAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = all.filter((e) => {
      if (dept !== "all" && e.department !== dept) return false;
      if (role !== "all" && e.jobTitle !== role) return false;
      if (status !== "all" && e.status !== status) return false;
      if (!q) return true;
      return (
        e.name.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q) ||
        e.jobTitle.toLowerCase().includes(q) ||
        e.code.toLowerCase().includes(q) ||
        e.department.toLowerCase().includes(q)
      );
    });

    return list.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "name") cmp = a.name.localeCompare(b.name);
      else if (sortKey === "department") cmp = a.department.localeCompare(b.department);
      else if (sortKey === "points") cmp = a.points - b.points;
      else cmp = +new Date(a.joinedAt) - +new Date(b.joinedAt);
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [all, query, dept, role, status, sortKey, sortDir]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const slice = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(1);
  };

  const clearFilters = () => {
    setQuery("");
    setDept("all");
    setRole("all");
    setStatus("all");
    setPage(1);
  };

  const handleRevoke = () => {
    if (!pendingDelete) return;
    revokeMutation.mutate(pendingDelete.id, {
      onSuccess: () => {
        toast.success(`Access revoked for ${pendingDelete.name}`);
        setPendingDelete(null);
      },
      onError: (err) => {
        toast.error(err.message || "Failed to revoke access");
      },
    });
  };

  return (
    <>
      <PageHeader
        title="Employees"
        subtitle="Manage roles, departments, and access across your team."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="rounded-md"
              onClick={() => void refetch()}
              disabled={isLoading || isRefetching}
            >
              <RefreshCw className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`} />
            </Button>
            <Button asChild className="rounded-md shadow-glow">
              <Link to="/admin/employees/new">
                <UserPlus className="mr-1.5 h-4 w-4" /> Add employee
              </Link>
            </Button>
          </div>
        }
      />

      {/* Filters bar */}
      <div className="glass flex flex-col gap-3 rounded-2xl p-4 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search by name, ID, email, department…"
            className="h-10 rounded-full border-border/60 bg-background/50 pl-9"
          />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:flex lg:items-center">
          <Select
            value={dept}
            onValueChange={(v) => {
              setDept(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-10 rounded-full">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All departments</SelectItem>
              {departments.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={role}
            onValueChange={(v) => {
              setRole(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-10 rounded-full">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              {jobTitles.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={status}
            onValueChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-10 rounded-full">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" className="h-10 rounded-md" onClick={clearFilters}>
            Clear
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="glass space-y-3 rounded-2xl p-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-md" />
          ))}
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-8 text-center">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <h3 className="font-semibold text-destructive">Failed to load employees</h3>
          <p className="text-sm text-muted-foreground">{error?.message || "An unexpected error occurred."}</p>
          <Button variant="outline" onClick={() => void refetch()}>
            Retry
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title={query || dept !== "all" ? "No matching employees" : "No employees registered yet"}
          description={
            query || dept !== "all"
              ? "Try adjusting your search query or filters."
              : "Click 'Add employee' above to register your first team member."
          }
        />
      ) : (
        /* Table */
        <div className="glass overflow-hidden rounded-2xl">
          <div className="flex items-center justify-between border-b border-border/60 px-5 py-3 text-xs text-muted-foreground">
            <span>{filtered.length} results</span>
            <span>
              Page {current} of {pages}
            </span>
          </div>

          {/* Mobile cards */}
          <div className="space-y-3 p-3 lg:hidden">
            {slice.map((e, i) => (
              <RecordCard
                key={e.id}
                index={i}
                avatar={
                  <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-primary/30 to-accent text-xs font-semibold">
                    {e.avatar}
                  </div>
                }
                title={
                  <Link to="/admin/employees/$id" params={{ id: e.id }} className="hover:text-primary">
                    {e.name}
                  </Link>
                }
                subtitle={<IdBadge id={e.code} />}
                badges={
                  <>
                    <Badge variant="secondary" className="rounded-full">
                      {e.jobTitle}
                    </Badge>
                    <span
                      className={`inline-flex items-center rounded-sm px-2.5 py-0.5 text-xs font-medium ${
                        e.status === "active" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" />
                      {e.status}
                    </span>
                  </>
                }
                fields={[
                  { label: "ID", value: e.code },
                  { label: "Department", value: e.department },
                  { label: "Points", value: e.points.toLocaleString() },
                  {
                    label: "Joined",
                    value: new Date(e.joinedAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    }),
                  },
                ]}
                actions={
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-9 w-9 rounded-md">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem asChild>
                        <Link to="/admin/employees/$id" params={{ id: e.id }} className="flex items-center">
                          <Eye className="mr-2 h-4 w-4" /> View details
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/admin/employees/$id/edit" params={{ id: e.id }} className="flex items-center">
                          <Pencil className="mr-2 h-4 w-4" /> Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive cursor-pointer"
                        onSelect={() => setPendingDelete({ id: e.id, name: e.name })}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Revoke access
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                }
              />
            ))}
          </div>

          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[680px] whitespace-nowrap text-sm">
              <thead className="bg-secondary/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium">
                    <SortButton label="Employee" active={sortKey === "name"} dir={sortDir} onClick={() => toggleSort("name")} />
                  </th>
                  <th className="hidden px-5 py-3 font-medium xl:table-cell">ID</th>
                  <th className="px-5 py-3 font-medium">
                    <SortButton label="Department" active={sortKey === "department"} dir={sortDir} onClick={() => toggleSort("department")} />
                  </th>
                  <th className="px-5 py-3 font-medium">Role</th>
                  <th className="px-5 py-3 font-medium">
                    <SortButton label="Points" active={sortKey === "points"} dir={sortDir} onClick={() => toggleSort("points")} />
                  </th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">
                    <SortButton label="Joined" active={sortKey === "joinedAt"} dir={sortDir} onClick={() => toggleSort("joinedAt")} />
                  </th>
                  <th className="px-5 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {slice.map((e, i) => (
                  <tr
                    key={e.id}
                    className="border-t border-border/40 transition-colors hover:bg-muted/40 animate-in fade-in slide-in-from-bottom-1"
                    style={{ animationDelay: `${i * 20}ms` }}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-primary/30 to-accent text-xs font-semibold">
                          {e.avatar}
                        </div>
                        <div className="min-w-0">
                          <Link
                            to="/admin/employees/$id"
                            params={{ id: e.id }}
                            className="block truncate font-medium hover:text-primary"
                          >
                            {e.name}
                          </Link>
                          <IdBadge id={e.code} />
                        </div>
                      </div>
                    </td>
                    <td className="hidden px-5 py-3.5 font-mono text-xs text-muted-foreground xl:table-cell">{e.code}</td>
                    <td className="px-5 py-3.5">{e.department}</td>
                    <td className="px-5 py-3.5">
                      <Badge variant="secondary" className="whitespace-nowrap rounded-full">
                        {e.jobTitle}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 font-semibold">{e.points.toLocaleString()}</td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          e.status === "active" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" />
                        {e.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground">
                      {new Date(e.joinedAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem asChild>
                            <Link to="/admin/employees/$id" params={{ id: e.id }} className="flex items-center">
                              <Eye className="mr-2 h-4 w-4" /> View details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link to="/admin/employees/$id/edit" params={{ id: e.id }} className="flex items-center">
                              <Pencil className="mr-2 h-4 w-4" /> Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive cursor-pointer"
                            onSelect={() => setPendingDelete({ id: e.id, name: e.name })}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Revoke access
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between border-t border-border/60 px-5 py-3">
            <span className="text-xs text-muted-foreground">
              Showing {slice.length === 0 ? 0 : (current - 1) * PAGE_SIZE + 1}–
              {(current - 1) * PAGE_SIZE + slice.length} of {filtered.length}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-md"
                disabled={current === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: pages })
                .slice(0, 5)
                .map((_, i) => {
                  const n = i + 1;
                  return (
                    <Button
                      key={n}
                      variant={n === current ? "default" : "outline"}
                      size="sm"
                      className="h-8 w-8 rounded-full p-0"
                      onClick={() => setPage(n)}
                    >
                      {n}
                    </Button>
                  );
                })}
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-md"
                disabled={current === pages}
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      <AlertDialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke access for {pendingDelete?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will deactivate their account and prevent signing in.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={revokeMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevoke}
              disabled={revokeMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {revokeMutation.isPending ? (
                <>
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Revoking...
                </>
              ) : (
                <>
                  <Trash2 className="mr-1.5 h-4 w-4" /> Revoke access
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function SortButton({
  label,
  active,
  dir,
  onClick,
}: {
  label: string;
  active: boolean;
  dir: SortDir;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-md px-1 py-0.5 transition-colors hover:text-foreground ${
        active ? "text-foreground" : ""
      }`}
    >
      {label}
      <ArrowUpDown
        className={`h-3 w-3 transition-transform ${
          active && dir === "desc" ? "rotate-180" : ""
        } ${active ? "text-primary" : "opacity-50"}`}
      />
    </button>
  );
}
