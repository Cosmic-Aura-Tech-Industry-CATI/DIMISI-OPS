import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  MoreHorizontal,
  Pencil,
  Search,
  Shield,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { RecordCard } from "@/components/record-card";
import { IdBadge } from "@/components/id-badge";
import { isPermanentAdmin, joiningYears } from "@/lib/ids";
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
import { useAllAdmins } from "@/lib/accounts";

export const Route = createFileRoute("/admin/admins/")({
  head: () => ({
    meta: [
      { title: "Admins — Poll" },
      { name: "description", content: "Manage administrators and their access." },
      { property: "og:title", content: "Admins — Poll" },
      { property: "og:description", content: "Manage administrators and their access." },
    ],
  }),
  component: AdminsPage,
});

type SortKey = "name" | "department" | "joinedAt";
type SortDir = "asc" | "desc";

const PAGE_SIZE = 8;


function AdminsPage() {
  const navigate = useNavigate();
  const admins: Employee[] = useAllAdmins();
  const years = useMemo(() => joiningYears(admins), [admins]);
  const departments = useMemo(() => Array.from(new Set(admins.map((a) => a.department))).sort(), [admins]);

  const [query, setQuery] = useState("");
  const [dept, setDept] = useState("all");
  const [status, setStatus] = useState("all");
  const [year, setYear] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("joinedAt");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);
  const [pendingDelete, setPendingDelete] = useState<Employee | null>(null);

  const requestDelete = (a: Employee) => {
    if (a.permanent || isPermanentAdmin(a.code)) {
      toast.error(`${a.name} (${a.code}) is a permanent administrator`, {
        description: "Director accounts cannot be removed.",
      });
      return;
    }
    setPendingDelete(a);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = admins.filter((a) => {
      if (dept !== "all" && a.department !== dept) return false;
      if (status !== "all" && a.status !== status) return false;
      if (year !== "all" && String(new Date(a.joinedAt).getFullYear()) !== year) return false;
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
  }, [admins, query, dept, status, year, sortKey, sortDir]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const slice = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
    setPage(1);
  };

  const clearFilters = () => { setQuery(""); setDept("all"); setStatus("all"); setYear("all"); setPage(1); };

  return (
    <>
      <PageHeader
        title="Admin management"
        subtitle="Trusted administrators with elevated access."
        actions={
          <Button asChild className="rounded-md shadow-glow">
            <Link to="/admin/admins/new">
              <ShieldCheck className="mr-1.5 h-4 w-4" /> Add admin
            </Link>
          </Button>
        }
      />

      {/* Summary strip */}
      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryCard label="Total admins" value={admins.length} />
        <SummaryCard label="Active" value={admins.filter((a) => a.status === "active").length} />
        <SummaryCard label="Departments" value={departments.length} />
      </div>

      {/* Filters */}
      <div className="glass flex flex-col gap-3 rounded-2xl p-4 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            placeholder="Search by name, email, ID, department…"
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
            <p className="px-2 py-10 text-center text-sm text-muted-foreground">No admins match those filters.</p>
          )}
          {slice.map((a, i) => (
            <RecordCard
              key={a.id}
              index={i}
              avatar={
                <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-primary to-primary/60 text-xs font-semibold text-primary-foreground shadow-glow">
                  {a.avatar}
                </div>
              }
              title={<Link to="/admin/admins/$id" params={{ id: a.id }} className="hover:text-primary">{a.name}</Link>}
              subtitle={<IdBadge id={a.code} />}
              badges={
                <>
                  <Badge variant="secondary" className="rounded-full bg-primary/15 text-primary">
                    <ShieldCheck className="mr-1 h-3 w-3" /> {a.permanent ? "Director" : "Admin"}
                  </Badge>
                  <span className={`inline-flex items-center rounded-sm px-2.5 py-0.5 text-xs font-medium ${a.status === "active" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>
                    <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" /> {a.status}
                  </span>
                </>
              }
              fields={[
                { label: "ID", value: a.code },
                { label: "Department", value: a.department },
                { label: "Added", value: new Date(a.joinedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) },
              ]}
              actions={
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-md"><MoreHorizontal className="h-4 w-4" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuItem onClick={() => navigate({ to: "/admin/admins/$id", params: { id: a.id } })}>
                      <Eye className="mr-2 h-4 w-4" /> View details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate({ to: "/admin/admins/$id/edit", params: { id: a.id } })}>
                      <Pencil className="mr-2 h-4 w-4" /> Edit
                    </DropdownMenuItem>
                    {!a.permanent && <DropdownMenuSeparator />}
                    {!a.permanent && <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => requestDelete(a)}>
                      <Trash2 className="mr-2 h-4 w-4" /> Revoke access
                    </DropdownMenuItem>}
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
              {slice.length === 0 && (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-sm text-muted-foreground">No admins match those filters.</td></tr>
              )}
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
                        <Link to="/admin/admins/$id" params={{ id: a.id }} className="block truncate font-medium hover:text-primary">
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
                    <span className={`inline-flex items-center rounded-sm px-2.5 py-0.5 text-xs font-medium ${a.status === "active" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>
                      <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" /> {a.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground">
                    {new Date(a.joinedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem onClick={() => navigate({ to: "/admin/admins/$id", params: { id: a.id } })}>
                          <Eye className="mr-2 h-4 w-4" /> View details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate({ to: "/admin/admins/$id/edit", params: { id: a.id } })}>
                          <Pencil className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        {!a.permanent && <DropdownMenuSeparator />}
                        {!a.permanent && <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => requestDelete(a)}>
                          <Trash2 className="mr-2 h-4 w-4" /> Revoke access
                        </DropdownMenuItem>}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

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
                <Button key={n} variant={n === current ? "default" : "outline"} size="sm" className="h-8 w-8 rounded-md p-0" onClick={() => setPage(n)}>
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
            <AlertDialogTitle>Revoke {pendingDelete?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              They will lose admin privileges immediately. You can re-invite them later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                toast.success(`${pendingDelete?.name} removed`);
                setPendingDelete(null);
              }}
            >
              <Trash2 className="mr-1.5 h-4 w-4" /> Revoke
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
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/15 text-primary"><Shield className="h-4 w-4" /></div>
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      </div>
      <p className="mt-3 font-display text-2xl font-semibold">{value}</p>
    </div>
  );
}

function SortBtn({ label, active, dir, onClick }: { label: string; active: boolean; dir: SortDir; onClick: () => void }) {
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
