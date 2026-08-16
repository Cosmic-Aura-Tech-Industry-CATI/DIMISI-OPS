import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  AlertCircle,
  Archive,
  ArrowUpDown,
  FolderKanban,
  FolderPlus,
  Loader2,
  Pencil,
  RefreshCw,
  Search,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/empty-state";
import { IdBadge } from "@/components/id-badge";
import { RecordCard } from "@/components/record-card";
import {
  ArchiveProjectDialog,
  CreateProjectDialog,
  EditProjectDialog,
} from "@/components/project-dialogs";
import { projectStats } from "@/lib/projects";
import { useTasksQuery } from "@/features/tasks";
import { cn } from "@/lib/utils";
import {
  useProjectsQuery,
  projectStatusLabel,
  projectStatusStyles,
  type Project,
  type FrontendProjectStatus as ProjectStatus,
} from "@/features/projects";

export const Route = createFileRoute("/admin/projects")({
  head: () => ({
    meta: [
      { title: "Project Management — Dimisi" },
      { name: "description", content: "Create, edit, archive and track every project across the workspace." },
      { property: "og:title", content: "Project Management — Dimisi" },
      { property: "og:description", content: "Every project, its manager, status and live task counters." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProjectManagementPage,
});

type SortKey = "code" | "name" | "createdAt" | "status" | "manager";
const PAGE_SIZE = 8;

function ProjectManagementPage() {
  const {
    data: projects = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useProjectsQuery();

  const { data: tasks = [] } = useTasksQuery();

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "inactive" | "archived">("all");
  const [sortKey, setSortKey] = useState<SortKey>("code");
  const [asc, setAsc] = useState(true);
  const [page, setPage] = useState(1);

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Project | undefined>();
  const [removing, setRemoving] = useState<Project | undefined>();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return projects
      .filter((p) => {
        const pStatus = (p.status || "active").toLowerCase();
        if (status !== "all" && pStatus !== status.toLowerCase()) return false;
        if (!q) return true;
        return (
          p.name.toLowerCase().includes(q) ||
          p.code.toLowerCase().includes(q) ||
          (p.manager ?? "").toLowerCase().includes(q) ||
          (projectStatusLabel[p.status] || p.status).toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        const dir = asc ? 1 : -1;
        if (sortKey === "createdAt") {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return (dateA - dateB) * dir;
        }
        const valA = String(a[sortKey as keyof Project] || "");
        const valB = String(b[sortKey as keyof Project] || "");
        return valA.localeCompare(valB) * dir;
      });
  }, [projects, query, status, sortKey, asc]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const rows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) setAsc(!asc);
    else { setSortKey(key); setAsc(true); }
  };

  return (
    <>
      <PageHeader
        title="Project management"
        subtitle="Every project, its manager and live task counters."
        actions={
          <Button className="rounded-md shadow-glow" onClick={() => setCreateOpen(true)}>
            <FolderPlus className="mr-1.5 h-4 w-4" /> Add project
          </Button>
        }
      />

      {/* Top Stat Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {(["all", "active", "inactive", "archived"] as const).map((s) => {
          const count =
            s === "all"
              ? projects.length
              : projects.filter((p) => (p.status || "").toLowerCase() === s).length;

          return (
            <button
              key={s}
              type="button"
              onClick={() => { setStatus(s); setPage(1); }}
              className={cn(
                "glass rounded-2xl p-4 text-left transition-all hover:border-primary/40",
                status === s && "border-primary/60 shadow-glow",
              )}
            >
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                {s === "all" ? "All projects" : projectStatusLabel[s] || s}
              </p>
              <p className="mt-1 font-display text-2xl font-semibold">
                {isLoading ? "…" : count}
              </p>
            </button>
          );
        })}
      </div>

      {/* Search & Filter Bar */}
      <div className="glass flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            placeholder="Search by name, ID, manager or status…"
            className="h-10 rounded-full pl-9"
          />
        </div>
        <Select value={status} onValueChange={(v) => { setStatus(v as typeof status); setPage(1); }}>
          <SelectTrigger className="h-10 w-full rounded-full sm:w-44"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="glass flex flex-col items-center justify-center gap-3 rounded-2xl p-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading projects from server…</p>
        </div>
      )}

      {/* Error State */}
      {!isLoading && isError && (
        <div className="glass flex flex-col items-center justify-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-8 text-center">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <h3 className="font-display text-base font-semibold text-destructive">Failed to load projects</h3>
          <p className="max-w-md text-xs text-muted-foreground">
            {error?.message || "An unexpected error occurred while communicating with the server."}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-2 rounded-md"
            onClick={() => refetch()}
          >
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Try again
          </Button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isError && rows.length === 0 && (
        <EmptyState
          icon={FolderKanban}
          title="No projects found"
          description="Adjust your search or create a new project."
        />
      )}

      {/* Content State */}
      {!isLoading && !isError && rows.length > 0 && (
        <>
          {/* Mobile / tablet cards */}
          <div className="space-y-3 lg:hidden">
            {rows.map((p) => {
              const targetId = p._id || p.id;
              const s = projectStats(tasks, targetId);
              const totalTasks = p.analytics?.totalTasks ?? s.total;
              const completedTasks = p.analytics?.completedTasks ?? s.completed;

              return (
                <RecordCard
                  key={targetId}
                  title={p.name}
                  subtitle={p.code}
                  badges={
                    <span className={cn("rounded-sm px-2 py-0.5 text-[11px] font-medium", projectStatusStyles[p.status])}>
                      {projectStatusLabel[p.status] || p.status}
                    </span>
                  }
                  fields={[
                    { label: "Manager", value: p.manager ?? "Unassigned" },
                    { label: "Employees", value: String(s.employees) },
                    { label: "Available", value: String(s.available) },
                    { label: "Completed", value: `${completedTasks} / ${totalTasks}` },
                    { label: "Created", value: new Date(p.createdAt).toLocaleDateString() },
                  ]}
                  actions={
                    <>
                      <Button variant="outline" size="sm" className="rounded-md" onClick={() => setEditing(p)}>
                        <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit
                      </Button>
                      <Button variant="outline" size="sm" className="rounded-md" onClick={() => setRemoving(p)}>
                        <Archive className="mr-1.5 h-3.5 w-3.5" /> Archive
                      </Button>
                    </>
                  }
                />
              );
            })}
          </div>

          {/* Desktop table */}
          <div className="glass hidden overflow-hidden rounded-2xl lg:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border/60 bg-card/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <SortableTh label="Project ID" onClick={() => toggleSort("code")} />
                    <SortableTh label="Project" onClick={() => toggleSort("name")} />
                    <th className="px-5 py-3">Manager</th>
                    <SortableTh label="Status" onClick={() => toggleSort("status")} />
                    <th className="px-5 py-3">Employees</th>
                    <th className="px-5 py-3">Available</th>
                    <th className="px-5 py-3">Completed</th>
                    <SortableTh label="Created" onClick={() => toggleSort("createdAt")} />
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {rows.map((p) => {
                    const targetId = p._id || p.id;
                    const s = projectStats(tasks, targetId);
                    const totalTasks = p.analytics?.totalTasks ?? s.total;
                    const completedTasks = p.analytics?.completedTasks ?? s.completed;

                    return (
                      <tr key={targetId} className="transition-colors hover:bg-secondary/30">
                        <td className="px-5 py-3.5"><IdBadge id={p.code} /></td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            {p.color && <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: p.color }} />}
                            <div className="min-w-0">
                              <div className="truncate font-medium">{p.name}</div>
                              <div className="truncate text-xs text-muted-foreground">{p.description || "—"}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">{p.manager ?? <span className="text-muted-foreground">Unassigned</span>}</td>
                        <td className="px-5 py-3.5">
                          <span className={cn("rounded-sm px-2 py-0.5 text-[11px] font-medium", projectStatusStyles[p.status])}>
                            {projectStatusLabel[p.status] || p.status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">{s.employees}</td>
                        <td className="px-5 py-3.5">{s.available}</td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <span>{completedTasks}</span>
                            {totalTasks > 0 && (
                              <span className="text-xs text-muted-foreground">/ {totalTasks}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-muted-foreground">{new Date(p.createdAt).toLocaleDateString()}</td>
                        <td className="px-5 py-3.5">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md" title="Edit project" onClick={() => setEditing(p)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md" title="Archive or delete" onClick={() => setRemoving(p)}>
                              <Archive className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
            <p className="text-xs text-muted-foreground">
              Showing {(current - 1) * PAGE_SIZE + 1}–{Math.min(current * PAGE_SIZE, filtered.length)} of {filtered.length}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="rounded-md" disabled={current <= 1} onClick={() => setPage(current - 1)}>Previous</Button>
              <Button variant="outline" size="sm" className="rounded-md" disabled={current >= pages} onClick={() => setPage(current + 1)}>Next</Button>
            </div>
          </div>
        </>
      )}

      <CreateProjectDialog open={createOpen} onOpenChange={setCreateOpen} createdBy="Admin" />
      <EditProjectDialog open={!!editing} onOpenChange={(v) => !v && setEditing(undefined)} project={editing} />
      <ArchiveProjectDialog open={!!removing} onOpenChange={(v) => !v && setRemoving(undefined)} project={removing} />
    </>
  );
}

function SortableTh({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <th className="px-5 py-3">
      <button type="button" onClick={onClick} className="inline-flex items-center gap-1 uppercase tracking-wider hover:text-foreground">
        {label} <ArrowUpDown className="h-3 w-3" />
      </button>
    </th>
  );
}
