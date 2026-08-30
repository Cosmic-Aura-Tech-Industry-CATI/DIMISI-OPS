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
  RefreshCw,
  Search,
  Shield,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { RecordCard } from "@/components/record-card";
import { IdBadge } from "@/components/id-badge";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
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
import { useAdminsQuery, useAdminStatsQuery, useRevokeAdminAccess } from "@/features/admins";

export const Route = createFileRoute("/admin/admins/")({
  head: () => ({
    meta: [
      { title: "Admins — Dimisi" },
      { name: "description", content: "Manage administrators and their access." },
      { property: "og:title", content: "Admins — Dimisi" },
      { property: "og:description", content: "Manage administrators and their access." },
    ],
  }),
  component: AdminsPage,
});

type SortKey = "name" | "department" | "joinedAt";
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

function AdminsPage() {
  const navigate = useNavigate();
  const { data: responseData, isLoading, isError, error, refetch, isRefetching } = useAdminsQuery();
  const { data: statsData } = useAdminStatsQuery();
  const revokeMutation = useRevokeAdminAccess();

  const rawAdmins = responseData?.admins || [];

  const admins = useMemo(() => {
    return rawAdmins.map((a) => {
      const deptName =
        typeof a.department === "object" && a.department
          ? (a.department as { name?: string }).name || "General"
          : (a.department as string) || "General";

      const titleName =
        typeof a.designation === "object" && a.designation
          ? (a.designation as { name?: string }).name || "Admin"
          : (a.designation as string) || "Admin";

      const roleStr = String(a.role || "").toLowerCase();
      const isDirector = roleStr === "director";

      return {
        id: a._id || a.id || "",
        code: a.empId || "—",
        name: a.name || "Administrator",
        email: a.email || "",
        jobTitle: titleName,
        department: deptName,
        avatar: initials(a.name || "Admin"),
        status: a.isActive ? "active" : "inactive",
        joinedAt: a.joinDate || a.createdAt || new Date().toISOString(),
        permanent: isDirector,
        role: roleStr,
        raw: a,
      };
    });
  }, [rawAdmins]);

  const departments = useMemo(
    () => Array.from(new Set(admins.map((a) => a.department))).sort(),
    [admins],
  );

  const [query, setQuery] = useState("");
  const [dept, setDept] = useState("all");
  const [status, setStatus] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("joinedAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null);

  const requestDelete = (a: { id: string; name: string; permanent?: boolean; code?: string }) => {
    if (a.permanent) {
      toast.error(`${a.name} is a permanent director`, {
        description: "Director accounts cannot be revoked.",
      });
      return;
    }
    setPendingDelete({ id: a.id, name: a.name });
  };

  const handleRevoke = () => {
    if (!pendingDelete) return;
    revokeMutation.mutate(pendingDelete.id, {
      onSuccess: () => {
        toast.success(`Access revoked for ${pendingDelete.name}`);
        setPendingDelete(null);
      },
      onError: (err) => {
        toast.error(err.message || "Failed to revoke admin access");
      },
    });
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = admins.filter((a) => {
      if (dept !== "all" && a.department !== dept) return false;
      if (status !== "all" && a.status !== status) return false;
      if (!q) return true;
      return (
        a.name.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q) ||
        a.jobTitle.toLowerCase().includes(q) ||
        a.code.toLowerCase().includes(q) ||
        a.department.toLowerCase().includes(q)
      );
    });

    return list.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "name") cmp = a.name.localeCompare(b.name);
      else if (sortKey === "department") cmp = a.department.localeCompare(b.department);
      else cmp = +new Date(a.joinedAt) - +new Date(b.joinedAt);
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [admins, query, dept, status, sortKey, sortDir]);

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
    setStatus("all");
    setPage(1);
  };

  const totalCount = typeof statsData?.totalAdmins === "number" ? statsData.totalAdmins : admins.length;
  const activeCount = typeof statsData?.activeAdmins === "number" ? statsData.activeAdmins : admins.filter((a) => a.status === "active").length;
  const deptCount = typeof statsData?.departmentsCount === "number" ? statsData.departmentsCount : departments.length;

  return (
    <>
      <PageHeader
        title="Admin management"
        subtitle="Trusted administrators with elevated access."
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
              <Link to="/admin/admins/new">
                <ShieldCheck className="mr-1.5 h-4 w-4" /> Add admin
              </Link>
            </Button>
          </div>
        }
      />

      {/* Summary strip */}
      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryCard label="Total admins" value={totalCount} />
        <SummaryCard label="Active" value={activeCount} />
        <SummaryCard label="Departments" value={deptCount} />
      </div>

      {/* Filters */}
      <div className="glass flex flex-col gap-3 rounded-2xl p-4 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search by name, email, ID, department…"
            className="h-10 rounded-full border-border/60 bg-background/50 pl-9"
          />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:flex lg:items-center">
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
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-md" />
          ))}
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-8 text-center">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <h3 className="font-semibold text-destructive">Failed to load admins</h3>
          <p className="text-sm text-muted-foreground">{error?.message || "An unexpected error occurred."}</p>
          <Button variant="outline" onClick={() => void refetch()}>
            Retry
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Shield}
          title={query || dept !== "all" ? "No matching admins" : "No admin accounts found"}
          description={
            query || dept !== "all"
              ? "Try adjusting your search query or filters."
              : "Click 'Add admin' above to register your first administrator."
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
            {slice.map((a, i) => (
              <RecordCard
                key={a.id}
                index={i}
                avatar={
                  <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-primary to-primary/60 text-xs font-semibold text-primary-foreground shadow-glow">
                    {a.avatar}
                  </div>
                }
                title={
                  <Link to="/admin/admins/$id" params={{ id: a.id }} className="hover:text-primary">
                    {a.name}
                  </Link>
                }
                subtitle={<IdBadge id={a.code} />}
                badges={
                  <>
                    <Badge variant="secondary" className="rounded-full bg-primary/15 text-primary">
                      <ShieldCheck className="mr-1 h-3 w-3" /> {a.permanent ? "Director" : "Admin"}
                    </Badge>
                    <span
                      className={`inline-flex items-center rounded-sm px-2.5 py-0.5 text-xs font-medium ${
                        a.status === "active" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" /> {a.status}
                    </span>
                  </>
                }
                fields={[
                  { label: "ID", value: a.code },
                  { label: "Department", value: a.department },
                  {
                    label: "Added",
                    value: new Date(a.joinedAt).toLocaleDateString(undefined, {
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
                        <Link to="/admin/admins/$id" params={{ id: a.id }} className="flex items-center">
                          <Eye className="mr-2 h-4 w-4" /> View details
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/admin/admins/$id/edit" params={{ id: a.id }} className="flex items-center">
                          <Pencil className="mr-2 h-4 w-4" /> Edit
                        </Link>
                      </DropdownMenuItem>
                      {!a.permanent && <DropdownMenuSeparator />}
                      {!a.permanent && (
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive cursor-pointer"
                          onSelect={() => requestDelete(a)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Revoke access
                        </DropdownMenuItem>
                      )}
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
                    <SortBtn label="Admin" active={sortKey === "name"} dir={sortDir} onClick={() => toggleSort("name")} />
                  </th>
                  <th className="hidden px-5 py-3 font-medium xl:table-cell">ID</th>
                  <th className="px-5 py-3 font-medium">
                    <SortBtn label="Department" active={sortKey === "department"} dir={sortDir} onClick={() => toggleSort("department")} />
                  </th>
                  <th className="px-5 py-3 font-medium">Role</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">
                    <SortBtn label="Added" active={sortKey === "joinedAt"} dir={sortDir} onClick={() => toggleSort("joinedAt")} />
                  </th>
                  <th className="px-5 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {slice.map((a, i) => (
                  <tr
                    key={a.id}
                    className="border-t border-border/40 transition-colors hover:bg-muted/40 animate-in fade-in slide-in-from-bottom-1"
                    style={{ animationDelay: `${i * 20}ms` }}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-primary to-primary/60 text-xs font-semibold text-primary-foreground shadow-glow">
                          {a.avatar}
                        </div>
                        <div className="min-w-0">
                          <Link
                            to="/admin/admins/$id"
                            params={{ id: a.id }}
                            className="block truncate font-medium hover:text-primary"
                          >
                            {a.name}
                          </Link>
                          <IdBadge id={a.code} />
                        </div>
                      </div>
                    </td>
                    <td className="hidden px-5 py-3.5 font-mono text-xs text-muted-foreground xl:table-cell">{a.code}</td>
                    <td className="px-5 py-3.5">{a.department}</td>
                    <td className="px-5 py-3.5">
                      <Badge variant="secondary" className="rounded-full bg-primary/15 text-primary">
                        <ShieldCheck className="mr-1 h-3 w-3" /> {a.permanent ? "Director" : "Admin"}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center rounded-sm px-2.5 py-0.5 text-xs font-medium ${
                          a.status === "active" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" /> {a.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground">
                      {new Date(a.joinedAt).toLocaleDateString(undefined, {
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
                            <Link to="/admin/admins/$id" params={{ id: a.id }} className="flex items-center">
                              <Eye className="mr-2 h-4 w-4" /> View details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link to="/admin/admins/$id/edit" params={{ id: a.id }} className="flex items-center">
                              <Pencil className="mr-2 h-4 w-4" /> Edit
                            </Link>
                          </DropdownMenuItem>
                          {!a.permanent && <DropdownMenuSeparator />}
                          {!a.permanent && (
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive cursor-pointer"
                              onSelect={() => requestDelete(a)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Revoke access
                            </DropdownMenuItem>
                          )}
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
                      className="h-8 w-8 rounded-md p-0"
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
              They will lose admin privileges immediately.
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

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex items-center gap-2">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/15 text-primary">
          <Shield className="h-4 w-4" />
        </div>
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      </div>
      <p className="mt-3 font-display text-2xl font-semibold">{value}</p>
    </div>
  );
}

function SortBtn({
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
