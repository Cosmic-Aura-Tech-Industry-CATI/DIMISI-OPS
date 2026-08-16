import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowUpDown,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Eye,
  ListTodo,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  RotateCw,
  Search,
  Trash2,
  Trophy,
} from "lucide-react";
import { toast } from "sonner";
import { RecordCard } from "@/components/record-card";
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
import { PriorityBadge, StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { admins, type Task, type TaskPriority, type TaskStatus, type TaskType } from "@/lib/mock-data";
import { useTasksQuery, useDeleteTask } from "@/features/tasks";
import { TaskTypeBadge } from "@/components/status-badge";
import { projectName } from "@/lib/projects";
import { IdBadge } from "@/components/id-badge";

export const Route = createFileRoute("/admin/tasks/")({
  head: () => ({
    meta: [
      { title: "Task Management — Poll" },
      { name: "description", content: "Create, assign, and track every task across the organization." },
      { property: "og:title", content: "Task Management — Poll" },
      { property: "og:description", content: "Create, assign, and track tasks." },
    ],
  }),
  component: TasksPage,
});

type SortKey = "title" | "priority" | "points" | "dueDate";
type SortDir = "asc" | "desc";

const PAGE_SIZE = 8;
const taskId = (id: string) => `TSK-${id.replace(/\D/g, "").padStart(4, "0") || id.slice(-4)}`;
const priorityRank: Record<TaskPriority, number> = { low: 0, medium: 1, high: 2 };
const createdByFor = (t: Task) => t.createdBy || "Admin";

function TasksPage() {
  const navigate = useNavigate();
  const { data: tasks = [], isLoading, isError, refetch } = useTasksQuery();
  const deleteTask = useDeleteTask({
    onSuccess: () => {
      toast.success("Task deleted");
      setPendingDelete(null);
    },
    onError: (err) => {
      toast.error("Failed to delete task", {
        description: err.message || "An error occurred while deleting the task.",
      });
    },
  });
  const categories = useMemo(() => Array.from(new Set(tasks.map((t) => t.category))).sort(), [tasks]);

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | TaskStatus | "submitted" | "rejected">("all");
  const [priority, setPriority] = useState<"all" | TaskPriority>("all");
  const [category, setCategory] = useState("all");
  const [taskType, setTaskType] = useState<"all" | TaskType>("all");
  const [sortKey, setSortKey] = useState<SortKey>("dueDate");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);
  const [pendingDelete, setPendingDelete] = useState<Task | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = tasks.filter((t) => {
      if (status === "submitted") {
        if (t.reviewState !== "in_review") return false;
      } else if (status === "rejected") {
        if (t.reviewState !== "rejected") return false;
      } else if (status !== "all" && t.status !== status) return false;
      if (priority !== "all" && t.priority !== priority) return false;
      if (category !== "all" && t.category !== category) return false;
      if (taskType !== "all" && (t.taskType ?? "direct") !== taskType) return false;
      if (!q) return true;
      return (
        t.title.toLowerCase().includes(q) ||
        t.assignee.toLowerCase().includes(q) ||
        taskId(t.id).toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
      );
    });
    return list.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "title") cmp = a.title.localeCompare(b.title);
      else if (sortKey === "priority") cmp = priorityRank[a.priority] - priorityRank[b.priority];
      else if (sortKey === "points") cmp = a.points - b.points;
      else cmp = +new Date(a.dueDate) - +new Date(b.dueDate);
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [tasks, query, status, priority, category, taskType, sortKey, sortDir]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const slice = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
    setPage(1);
  };

  const clearFilters = () => {
    setQuery(""); setStatus("all"); setPriority("all"); setCategory("all"); setTaskType("all"); setPage(1);
  };

  return (
    <>
      <PageHeader
        title="Task management"
        subtitle="Every task in one place — assign, prioritize, and reward."
        actions={
          <Button asChild className="rounded-md shadow-glow">
            <Link to="/admin/tasks/new"><Plus className="mr-1.5 h-4 w-4" /> New task</Link>
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <SummaryCard label="Total" value={tasks.length} tone="text-foreground" />
        <SummaryCard label="Available" value={tasks.filter((t) => t.status === "available").length} tone="text-primary" />
        <SummaryCard label="Assigned" value={tasks.filter((t) => t.status === "assigned" || t.status === "pending").length} tone="text-info" />
        <SummaryCard label="In progress" value={tasks.filter((t) => t.status === "in_progress").length} tone="text-primary" />
        <SummaryCard label="Overdue" value={tasks.filter((t) => t.status === "overdue").length} tone="text-destructive" />
      </div>

      <div className="glass flex flex-col gap-3 rounded-2xl p-4 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            placeholder="Search by title, assignee, ID, category…"
            className="h-10 rounded-full border-border/60 bg-background/50 pl-9"
          />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:flex lg:items-center">
          <Select value={status} onValueChange={(v) => { setStatus(v as typeof status); setPage(1); }}>
            <SelectTrigger className="h-10 rounded-full"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="assigned">Assigned</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In progress</SelectItem>
              <SelectItem value="submitted">Submitted / under review</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priority} onValueChange={(v) => { setPriority(v as typeof priority); setPage(1); }}>
            <SelectTrigger className="h-10 rounded-full"><SelectValue placeholder="Priority" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All priorities</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
          <Select value={category} onValueChange={(v) => { setCategory(v); setPage(1); }}>
            <SelectTrigger className="h-10 rounded-full"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={taskType} onValueChange={(v) => { setTaskType(v as typeof taskType); setPage(1); }}>
            <SelectTrigger className="h-10 rounded-full"><SelectValue placeholder="Task type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All task types</SelectItem>
              <SelectItem value="universal">🌐 Universal</SelectItem>
              <SelectItem value="project">📁 Project</SelectItem>
              <SelectItem value="direct">🎯 Direct</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="h-10 rounded-md" onClick={clearFilters}>Clear</Button>
        </div>
      </div>

      {isError && (
        <div className="flex items-center justify-between rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>Failed to load tasks from server. Please check your connection.</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => void refetch()} className="border-destructive/30 hover:bg-destructive/15">
            <RotateCw className="mr-1.5 h-3.5 w-3.5" /> Retry
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="glass flex flex-col items-center justify-center rounded-2xl py-16 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-3 text-sm">Loading tasks from database...</p>
        </div>
      ) : (
        <div className="glass overflow-hidden rounded-2xl">
          <div className="flex items-center justify-between border-b border-border/60 px-5 py-3 text-xs text-muted-foreground">
            <span>{filtered.length} results</span>
            <span>Page {current} of {pages}</span>
          </div>
        {/* Mobile: cards instead of horizontal scrolling */}
        <div className="space-y-3 p-3 lg:hidden">
          {slice.length === 0 && (
            <EmptyState icon={ListTodo} title="No tasks match" description="Try clearing filters or creating a new task." />
          )}
          {slice.map((t, i) => (
            <RecordCard
              key={t.id}
              index={i}
              avatar={
                <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-primary/30 to-primary/60 text-[11px] font-semibold text-primary-foreground">
                  {(t.assignee || "—").split(" ").map((n) => n[0]).join("")}
                </div>
              }
              title={
                <Link to="/admin/tasks/$id" params={{ id: t.id }} className="hover:text-primary">{t.title}</Link>
              }
              subtitle={`${t.category} · ${taskId(t.id)}`}
              badges={<><TaskTypeBadge type={t.taskType} /><StatusBadge status={t.status} /><PriorityBadge priority={t.priority} /></>}
              fields={[
                {
                  label: "Employee",
                  value: t.assignee
                    ? `${t.assignee}${t.assigneeCode ? ` · ${t.assigneeCode}` : ""}`
                    : t.taskType === "project" ? `Open · ${projectName(t.projectId)}` : "Unassigned",
                },
                ...(t.assignedAt
                  ? [{ label: "Assigned", value: new Date(t.assignedAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) }]
                  : []),
                { label: "Points", value: <span className="inline-flex items-center gap-1"><Trophy className="h-3 w-3 text-warning" /> {t.points}</span> },
                { label: "Deadline", value: new Date(t.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) },
                { label: "Created by", value: createdByFor(t) },
              ]}
              actions={
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-md"><MoreHorizontal className="h-4 w-4" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuItem onClick={() => navigate({ to: "/admin/tasks/$id", params: { id: t.id } })}>
                      <Eye className="mr-2 h-4 w-4" /> View
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate({ to: "/admin/tasks/$id/edit", params: { id: t.id } })}>
                      <Pencil className="mr-2 h-4 w-4" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setPendingDelete(t)}>
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              }
            />
          ))}
        </div>

        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full min-w-[760px] whitespace-nowrap text-sm xl:min-w-[900px]">
            <thead className="bg-secondary/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium"><SortBtn label="Title" active={sortKey === "title"} dir={sortDir} onClick={() => toggleSort("title")} /></th>
                <th className="px-5 py-3 font-medium">Type</th>
                <th className="px-5 py-3 font-medium">Employee</th>
                <th className="px-5 py-3 font-medium"><SortBtn label="Priority" active={sortKey === "priority"} dir={sortDir} onClick={() => toggleSort("priority")} /></th>
                <th className="px-5 py-3 font-medium"><SortBtn label="Points" active={sortKey === "points"} dir={sortDir} onClick={() => toggleSort("points")} /></th>
                <th className="px-5 py-3 font-medium"><SortBtn label="Deadline" active={sortKey === "dueDate"} dir={sortDir} onClick={() => toggleSort("dueDate")} /></th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="hidden px-5 py-3 font-medium xl:table-cell">Created by</th>
                <th className="px-5 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {slice.length === 0 && (
                <tr><td colSpan={9} className="p-0">
                  <EmptyState icon={ListTodo} title="No tasks match" description="Try clearing filters or creating a new task." />
                </td></tr>
              )}
              {slice.map((t, i) => (
                <tr
                  key={t.id}
                  className="border-t border-border/40 transition-colors hover:bg-muted/40 animate-in fade-in slide-in-from-bottom-1"
                  style={{ animationDelay: `${i * 20}ms` }}
                >
                  <td className="px-5 py-3.5">
                    <Link to="/admin/tasks/$id" params={{ id: t.id }} className="block font-medium hover:text-primary">{t.title}</Link>
                    <div className="text-xs text-muted-foreground">{t.category} · {taskId(t.id)}</div>
                  </td>
                  <td className="px-5 py-3.5">
                    <TaskTypeBadge type={t.taskType} />
                    {t.taskType === "project" && (
                      <div className="mt-1 text-xs text-muted-foreground">{projectName(t.projectId)}</div>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    {t.assignee ? (
                      <div className="flex items-center gap-2">
                        <div className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-primary/30 to-primary/60 text-[11px] font-semibold text-primary-foreground">
                          {(t.assignee || "—").split(" ").map((n) => n[0]).join("")}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate">{t.assignee}</div>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            {t.assigneeCode && <IdBadge id={t.assigneeCode} />}
                            {t.assignedAt && (
                              <span>
                                {new Date(t.assignedAt).toLocaleString(undefined, {
                                  month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
                                })}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Unassigned</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5"><PriorityBadge priority={t.priority} /></td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center gap-1 font-medium">
                      <Trophy className="h-3.5 w-3.5 text-warning" /> {t.points}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="inline-flex items-center gap-1.5 text-muted-foreground">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {new Date(t.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                    </div>
                  </td>
                  <td className="px-5 py-3.5"><StatusBadge status={t.status} /></td>
                  <td className="hidden px-5 py-3.5 text-muted-foreground xl:table-cell">{createdByFor(t)}</td>
                  <td className="px-5 py-3.5 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem onClick={() => navigate({ to: "/admin/tasks/$id", params: { id: t.id } })}>
                          <Eye className="mr-2 h-4 w-4" /> View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate({ to: "/admin/tasks/$id/edit", params: { id: t.id } })}>
                          <Pencil className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setPendingDelete(t)}>
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

        <div className="flex items-center justify-between border-t border-border/60 px-5 py-3">
          <span className="text-xs text-muted-foreground">
            Showing {slice.length === 0 ? 0 : (current - 1) * PAGE_SIZE + 1}–{(current - 1) * PAGE_SIZE + slice.length} of {filtered.length}
          </span>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-8 w-8 rounded-md" disabled={current === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}><ChevronLeft className="h-4 w-4" /></Button>
            {Array.from({ length: pages }).slice(0, 5).map((_, i) => {
              const n = i + 1;
              return (
                <Button key={n} variant={n === current ? "default" : "outline"} size="sm" className="h-8 w-8 rounded-md p-0" onClick={() => setPage(n)}>{n}</Button>
              );
            })}
            <Button variant="outline" size="icon" className="h-8 w-8 rounded-md" disabled={current === pages} onClick={() => setPage((p) => Math.min(pages, p + 1))}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      </div>
      )}

      <AlertDialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{pendingDelete?.title}"?</AlertDialogTitle>
            <AlertDialogDescription>This task and its history will be removed. This action can't be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteTask.isPending}
              onClick={() => {
                if (pendingDelete) {
                  deleteTask.mutate(pendingDelete.id || pendingDelete._id || "");
                }
              }}
            >
              <Trash2 className="mr-1.5 h-4 w-4" /> Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function SummaryCard({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="glass rounded-2xl p-4">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`mt-2 font-display text-2xl font-semibold ${tone}`}>{value}</p>
    </div>
  );
}

function SortBtn({ label, active, dir, onClick }: { label: string; active: boolean; dir: SortDir; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`inline-flex items-center gap-1 rounded-md px-1 py-0.5 hover:text-foreground ${active ? "text-foreground" : ""}`}>
      {label}
      <ArrowUpDown className={`h-3 w-3 transition-transform ${active && dir === "desc" ? "rotate-180" : ""} ${active ? "text-primary" : "opacity-50"}`} />
    </button>
  );
}
