import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import { RecordCard } from "@/components/record-card";
import { IdBadge } from "@/components/id-badge";
import { joiningYears } from "@/lib/ids";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { type Employee } from "@/lib/mock-data";
import { useAllEmployees } from "@/lib/accounts";

export const Route = createFileRoute("/admin/employees/")({
  head: () => ({
    meta: [
      { title: "Employees — Poll" },
      { name: "description", content: "Manage employees, roles, and departments." },
      { property: "og:title", content: "Employees — Poll" },
      { property: "og:description", content: "Manage employees, roles, and departments." },
    ],
  }),
  component: EmployeesPage,
});



type SortKey = "name" | "department" | "points" | "joinedAt";
type SortDir = "asc" | "desc";

const PAGE_SIZE = 6;



function EmployeesPage() {
  const navigate = useNavigate();
  const all: Employee[] = useAllEmployees();
  const years = useMemo(() => joiningYears(all), [all]);
  const departments = useMemo(
    () => Array.from(new Set(all.map((e) => e.department))).sort(),
    [all],
  );

  const [query, setQuery] = useState("");
  const [dept, setDept] = useState("all");

  const [status, setStatus] = useState("all");
  const [year, setYear] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("joinedAt");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);
  const [pendingDelete, setPendingDelete] = useState<Employee | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = all.filter((e) => {
      if (dept !== "all" && e.department !== dept) return false;
      if (status !== "all" && e.status !== status) return false;
      if (year !== "all" && String(new Date(e.joinedAt).getFullYear()) !== year) return false;
      if (!q) return true;
      return (
        e.name.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q) ||
        e.jobTitle.toLowerCase().includes(q) ||
        e.code.toLowerCase().includes(q)
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
  }, [all, query, dept, status, year, sortKey, sortDir]);

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
    setYear("all");
    setPage(1);
  };

  const confirmDelete = () => {
    if (!pendingDelete) return;
    toast.success(`${pendingDelete.name} removed`, { description: "Changes are mocked — no data persisted." });
    setPendingDelete(null);
  };

  return (
    <>
      <PageHeader
        title="Employees"
        subtitle="Manage roles, departments, and access across your team."
        actions={
          <Button asChild className="rounded-md shadow-glow">
            <Link to="/admin/employees/new">
              <UserPlus className="mr-1.5 h-4 w-4" /> Add employee
            </Link>
          </Button>
        }
      />

      {/* Filters bar */}
      <div className="glass flex flex-col gap-3 rounded-2xl p-4 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            placeholder="Search by name, ID, email…"
            className="h-10 rounded-full border-border/60 bg-background/50 pl-9"
          />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:flex lg:items-center">
          <Select value={dept} onValueChange={(v) => { setDept(v); setPage(1); }}>
            <SelectTrigger className="h-10 rounded-full"><SelectValue placeholder="Department" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All departments</SelectItem>
              {departments.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
            <SelectTrigger className="h-10 rounded-full"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Select value={year} onValueChange={(v) => { setYear(v); setPage(1); }}>
            <SelectTrigger className="h-10 rounded-full"><SelectValue placeholder="Joining year" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All years</SelectItem>
              {years.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" className="h-10 rounded-md" onClick={clearFilters}>Clear</Button>
        </div>
      </div>

      {/* Table */}
      <div className="glass overflow-hidden rounded-2xl">
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-3 text-xs text-muted-foreground">
          <span>{filtered.length} results</span>
          <span>Page {current} of {pages}</span>
        </div>
        {/* Mobile: cards instead of horizontal scrolling */}
        <div className="space-y-3 p-3 lg:hidden">
          {slice.length === 0 && (
            <p className="px-2 py-10 text-center text-sm text-muted-foreground">No employees match those filters.</p>
          )}
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
                <Link to="/admin/employees/$id" params={{ id: e.id }} className="hover:text-primary">{e.name}</Link>
              }
              subtitle={<IdBadge id={e.code} />}
              badges={
                <>
                  <Badge variant="secondary" className="rounded-full">{e.jobTitle}</Badge>
                  <span className={`inline-flex items-center rounded-sm px-2.5 py-0.5 text-xs font-medium ${e.status === "active" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>
                    <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" />
                    {e.status}
                  </span>
                </>
              }
              fields={[
                { label: "ID", value: e.code },
                { label: "Department", value: e.department },
                { label: "Points", value: e.points.toLocaleString() },
                { label: "Joined", value: new Date(e.joinedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) },
              ]}
              actions={
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-md">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuItem onClick={() => navigate({ to: "/admin/employees/$id", params: { id: e.id } })}>
                      <Eye className="mr-2 h-4 w-4" /> View details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate({ to: "/admin/employees/$id/edit", params: { id: e.id } })}>
                      <Pencil className="mr-2 h-4 w-4" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setPendingDelete(e)}>
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
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
              {slice.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-sm text-muted-foreground">
                    No employees match those filters.
                  </td>
                </tr>
              )}
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
                    {new Date(e.joinedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem onClick={() => navigate({ to: "/admin/employees/$id", params: { id: e.id } })}>
                          <Eye className="mr-2 h-4 w-4" /> View details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate({ to: "/admin/employees/$id/edit", params: { id: e.id } })}>
                          <Pencil className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setPendingDelete(e)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
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
            Showing {slice.length === 0 ? 0 : (current - 1) * PAGE_SIZE + 1}–{(current - 1) * PAGE_SIZE + slice.length} of {filtered.length}
          </span>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-8 w-8 rounded-md" disabled={current === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: pages }).slice(0, 5).map((_, i) => {
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
            <Button variant="outline" size="icon" className="h-8 w-8 rounded-md" disabled={current === pages} onClick={() => setPage((p) => Math.min(pages, p + 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <AlertDialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {pendingDelete?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will revoke access and archive their history. This action can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <Trash2 className="mr-1.5 h-4 w-4" /> Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function SortButton({
  label, active, dir, onClick,
}: { label: string; active: boolean; dir: SortDir; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-md px-1 py-0.5 transition-colors hover:text-foreground ${active ? "text-foreground" : ""}`}
    >
      {label}
      <ArrowUpDown className={`h-3 w-3 transition-transform ${active && dir === "desc" ? "rotate-180" : ""} ${active ? "text-primary" : "opacity-50"}`} />
    </button>
  );
}
