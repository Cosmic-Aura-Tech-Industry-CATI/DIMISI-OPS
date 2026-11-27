import { MetricValue, localizedNumber } from "@/components/metric-value";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/api/client/query-keys";
import type { AuthUser } from "@/auth/types/auth";
import { EmployeeTaskPicker } from "@/features/tasks/components/employee-task-picker";
import {
  AlertCircle,
  ArrowUpDown,
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
  UserCheck,
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
import {
  type TaskPriority,
  type TaskStatus,
  type TaskType,
} from "@/lib/mock-data";
import {
  useTasksQuery,
  tasksService,
  type Task,
  useTaskStatsQuery,
  useDeleteTask,
  mapTaskResponse,
  getCategoryLabel,
  formatTaskSubtitle,
} from "@/features/tasks";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ReassignTaskDialog } from "@/components/reassign-task-dialog";
import { TaskTypeBadge } from "@/components/status-badge";
import { projectName } from "@/lib/projects";
import { IdBadge } from "@/components/id-badge";
import { UserAvatar } from "@/components/user-avatar";
import { useDebounce } from "@/hooks/use-debounce";
import { useSearchTasks } from "@/features/search";

export const Route = createFileRoute("/admin/tasks/")({
  head: () => ({
    meta: [
      { title: "Task Management — Poll" },
      {
        name: "description",
        content: "Create, assign, and track every task across the organization.",
      },
      { property: "og:title", content: "Task Management — Poll" },
      { property: "og:description", content: "Create, assign, and track tasks." },
    ],
  }),
  component: TasksPage,
});

type SortKey = "title" | "priority" | "points" | "dueDate";
type SortDir = "asc" | "desc";

const sortOptions = [
  ["title", "Title"],
  ["priority", "Priority"],
  ["points", "Points"],
  ["dueDate", "Deadline"],
] as const satisfies ReadonlyArray<readonly [SortKey, string]>;

const DEFAULT_PAGE_SIZE = 10;
const taskId = (id: string) => id;
const priorityRank: Record<TaskPriority, number> = { low: 0, medium: 1, high: 2 };
const createdByFor = (t: Task) => t.createdBy || "Admin";

function getVisiblePages(current: number, total: number) {
  if (total <= 5) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  if (current <= 3) {
    return [1, 2, 3, 4, 5];
  }
  if (current >= total - 2) {
    return [total - 4, total - 3, total - 2, total - 1, total];
  }
  return [current - 2, current - 1, current, current + 1, current + 2];
}

export function isTaskOverdue(t: Task): boolean {
  if (t.status === "overdue" || (t as any).rawStatus === "overdue") return true;
  if (t.status === "completed" || (t as any).rawStatus === "completed") return false;
  if (t.dueDate) {
    const dueTime = new Date(t.dueDate).getTime();
    if (!isNaN(dueTime) && dueTime < Date.now()) return true;
  }
  return false;
}

export function isTaskCompleted(t: Task): boolean {
  return (
    t.status === "completed" ||
    (t as any).rawStatus === "completed" ||
    (t.status as string) === "Completed"
  );
}

function TasksPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const pageSize = DEFAULT_PAGE_SIZE;

  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);
  const [employee, setEmployee] = useState<AuthUser | null>(null);
  const [showInProgressFirst, setShowInProgressFirst] = useState(true);
  const employeeId = employee?._id || employee?.id;
  const isSearchActive = !employeeId && debouncedQuery.trim().length > 0;

  const [status, setStatus] = useState<"all" | TaskStatus | "submitted" | "rejected">("all");
  const [priority, setPriority] = useState<"all" | TaskPriority>("all");
  const [category, setCategory] = useState("all");
  const [taskType, setTaskType] = useState<"all" | TaskType>("all");
  const [sortKey, setSortKey] = useState<SortKey>("dueDate");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [pendingDelete, setPendingDelete] = useState<Task | null>(null);
  const [pendingReassign, setPendingReassign] = useState<Task | null>(null);
  const [deletedTaskIds, setDeletedTaskIds] = useState<Set<string>>(new Set());

  // Derive backend-compatible filter values:
  // "available" -> "open", "submitted" -> "in_review", "rejected" -> handled client-side
  const backendStatusFilter = useMemo(() => {
    if (status === "all" || status === "rejected") return undefined;
    if (status === "available") return "open";
    if (status === "submitted") return "in_review";
    if (status === "pending") return "in_review";
    return status;
  }, [status]);

  const backendPriorityFilter = priority !== "all" ? priority : undefined;
  const backendTypeFilter = taskType !== "all" ? taskType : undefined;

  const taskFilters = useMemo(
    () => ({
      page,
      limit: 10,
      status: backendStatusFilter,
      priority: backendPriorityFilter,
      type: backendTypeFilter,
    }),
    [page, backendStatusFilter, backendPriorityFilter, backendTypeFilter],
  );

  const {
    data: generalTasks = [],
    isLoading: isBaseLoading,
    isError: generalError,
    refetch: refetchGeneral,
  } = useTasksQuery(taskFilters, { enabled: !employeeId });
  const employeeTasks = useQuery({
    queryKey: queryKeys.tasks.list({ assignedTo: employeeId, allPages: true }),
    enabled: Boolean(employeeId),
    queryFn: async ({ signal }) => {
      const first = await tasksService.getTasks({ assignedTo: employeeId, page: 1 });
      const items = [...first];
      for (let n = 2; n <= (first.pagination?.totalPages ?? 1); n++) {
        signal.throwIfAborted();
        items.push(...await tasksService.getTasks({ assignedTo: employeeId, page: n }));
      }
      return items.filter((task) => task.assigneeId === employeeId);
    },
  });
  const tasks = employeeId ? employeeTasks.data ?? [] : generalTasks;
  const isError = employeeId ? employeeTasks.isError : generalError;
  const refetch = employeeId ? employeeTasks.refetch : refetchGeneral;
  const { data: statsData, isLoading: isStatsLoading, isError: isStatsError } = useTaskStatsQuery();
  const deleteTask = useDeleteTask({
    onSuccess: () => {
      toast.success("Overdue task deleted successfully.");
      if (pendingDelete) {
        const id1 = pendingDelete.id;
        const id2 = (pendingDelete as any)._id;
        setDeletedTaskIds((prev) => new Set([...prev, id1, id2].filter(Boolean)));
      }
      setPendingDelete(null);
    },
    onError: (err) => {
      toast.error("Failed to delete task", {
        description: err.message || "An error occurred while deleting the task.",
      });
    },
  });

  const { data: searchResponse, isFetching: isSearching } = useSearchTasks(
    debouncedQuery,
    {
      status: backendStatusFilter,
      priority: backendPriorityFilter,
      page,
      limit: 10,
    },
    { enabled: isSearchActive },
  );

  const searchTasksList = useMemo(() => {
    if (!searchResponse?.tasks) return [];
    return searchResponse.tasks.map((t) => mapTaskResponse(t));
  }, [searchResponse]);

  const rawTaskPool = isSearchActive ? searchTasksList : tasks;
  const activeTaskPool = useMemo(() => {
    return rawTaskPool.filter(
      (t: any) =>
        t &&
        t.isActive !== false &&
        !deletedTaskIds.has(t.id) &&
        !deletedTaskIds.has(t._id),
    );
  }, [rawTaskPool, deletedTaskIds]);
  const isLoading = employeeId ? employeeTasks.isLoading : isSearchActive ? isSearching && !searchResponse : isBaseLoading;

  const categories = useMemo(
    () => Array.from(new Set(tasks.map((t) => getCategoryLabel(t.category)))).sort(),
    [tasks],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const localFilters = Boolean(employeeId) || isSearchActive;
    const matches = activeTaskPool.filter((t) => {
      if (status === "rejected") {
        if (t.reviewState !== "rejected") return false;
      } else if (localFilters) {
        if (status === "submitted" || status === "pending") {
          if (t.reviewState !== "in_review") return false;
        } else if (status !== "all" && t.status !== status) {
          return false;
        }
      }
      if (localFilters && priority !== "all" && t.priority !== priority) return false;
      if (category !== "all" && getCategoryLabel(t.category) !== category) return false;
      if (localFilters && taskType !== "all" && (t.taskType ?? "direct") !== taskType)
        return false;
      if (!q || isSearchActive) return true;
      return (
        t.title.toLowerCase().includes(q) ||
        t.assignee.toLowerCase().includes(q) ||
        taskId(t.id).toLowerCase().includes(q) ||
        getCategoryLabel(t.category).toLowerCase().includes(q)
      );
    });
    if (employeeId) {
      matches.sort((a, b) => {
        if (status === "all" && showInProgressFirst) {
          const progressOrder = Number(b.status === "in_progress") - Number(a.status === "in_progress");
          if (progressOrder !== 0) return progressOrder;
        }
        const order = sortKey === "title" ? a.title.localeCompare(b.title)
          : sortKey === "points" ? a.points - b.points
          : sortKey === "priority" ? priorityRank[a.priority] - priorityRank[b.priority]
          : new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        return sortDir === "asc" ? order : -order;
      });
    }
    return matches;
  }, [activeTaskPool, query, employeeId, isSearchActive, status, priority, category, taskType, sortKey, sortDir, showInProgressFirst]);

  const isServerPaginated = isSearchActive
    ? Boolean(searchResponse?.pagination)
    : Boolean((tasks as any)?.pagination);

  const totalRecords = isSearchActive
    ? (searchResponse?.pagination?.totalItems ?? searchResponse?.total ?? filtered.length)
    : ((tasks as any)?.pagination?.totalRecords ?? filtered.length);

  const pages = Math.max(
    1,
    isSearchActive
      ? (searchResponse?.pagination?.totalPages ?? Math.ceil(totalRecords / pageSize))
      : ((tasks as any)?.pagination?.totalPages ?? Math.ceil(totalRecords / pageSize)),
  );
  const current = Math.min(page, pages);

  const slice = isServerPaginated
    ? filtered
    : filtered.slice((current - 1) * pageSize, current * pageSize);

  const toggleSort = (key: SortKey) => {
    if (employeeId) setShowInProgressFirst(false);
    if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(1);
  };

  const clearFilters = () => {
    setQuery("");
    setStatus("all");
    setPriority("all");
    setCategory("all");
    setTaskType("all");
    setPage(1);
  };

  return (
    <>
      <PageHeader
        title="Task management"
        subtitle="Every task in one place — assign, prioritize, and reward."
        actions={
          <Button asChild className="rounded-md shadow-glow">
            <Link to="/admin/tasks/new">
              <Plus className="mr-1.5 h-4 w-4" /> New task
            </Link>
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        <SummaryCard
          label="Total"
          value={statsData?.total}
          tone="text-foreground"
          isLoading={isStatsLoading}
          isError={isStatsError}
        />
        <SummaryCard
          label="Available"
          value={statsData?.available}
          tone="text-primary"
          isLoading={isStatsLoading}
          isError={isStatsError}
        />
        <SummaryCard
          label="Assigned"
          value={statsData?.assigned}
          tone="text-info"
          isLoading={isStatsLoading}
          isError={isStatsError}
        />
        <SummaryCard
          label="In progress"
          value={statsData?.inProgress}
          tone="text-primary"
          isLoading={isStatsLoading}
          isError={isStatsError}
        />
        <SummaryCard
          label="Overdue"
          value={statsData?.overdue}
          tone="text-destructive"
          isLoading={isStatsLoading}
          isError={isStatsError}
        />
        <SummaryCard
          label="In review"
          value={statsData?.inReview}
          tone="text-warning"
          isLoading={isStatsLoading}
          isError={isStatsError}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <EmployeeTaskPicker onSelect={(person) => {
          clearFilters();
          setShowInProgressFirst(true);
          setEmployee(person);
        }} />
        {employee && <>
          <h2 className="font-medium">{employee.name}’s tasks</h2>
          <Button variant="ghost" size="sm" onClick={() => { clearFilters(); setEmployee(null); }}>Show all tasks</Button>
        </>}
      </div>
      <div className="glass flex flex-col gap-3 rounded-2xl p-4 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search by title, assignee, ID, category…"
            className="h-10 rounded-full border-border/60 bg-background/50 pl-9 pr-9"
          />
          {isSearching && (
            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-primary" />
          )}
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:flex lg:items-center">
          <Select
            value={status}
            onValueChange={(v) => {
              setStatus(v as typeof status);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-10 rounded-full">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
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
          <Select
            value={priority}
            onValueChange={(v) => {
              setPriority(v as typeof priority);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-10 rounded-full">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All priorities</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={category}
            onValueChange={(v) => {
              setCategory(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-10 rounded-full">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={taskType}
            onValueChange={(v) => {
              setTaskType(v as typeof taskType);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-10 rounded-full">
              <SelectValue placeholder="Task type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All task types</SelectItem>
              <SelectItem value="universal">🌐 Universal</SelectItem>
              <SelectItem value="project">📁 Project</SelectItem>
              <SelectItem value="direct">🎯 Direct</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="h-10 rounded-md" onClick={clearFilters}>
            Clear
          </Button>
        </div>
      </div>

      {isError && (
        <div className="flex items-center justify-between rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>Failed to load tasks from server. Please check your connection.</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void refetch()}
            className="border-destructive/30 hover:bg-destructive/15"
          >
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
            <span>
              Page {current} of {pages}
            </span>
          </div>
          <div
            role="group"
            aria-label="Sort tasks"
            className="flex flex-wrap items-center gap-2 px-5 pt-3 text-xs text-muted-foreground"
          >
            <span>Sort by</span>
            {sortOptions.map(([key, label]) => (
              <SortBtn
                key={key}
                label={label}
                active={sortKey === key}
                dir={sortDir}
                onClick={() => toggleSort(key)}
              />
            ))}
          </div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,18rem),1fr))] gap-4 p-4 [&_dd]:whitespace-normal [&_dd]:break-words">
            {slice.length === 0 && (
              <div className="col-span-full">
                <EmptyState
                  icon={ListTodo}
                  title={employee && tasks.length === 0 ? "No tasks assigned" : "No tasks match"}
                  description={employee && tasks.length === 0 ? `${employee.name} has no tasks to display.` : "Try clearing filters or creating a new task."}
                />
              </div>
            )}
            {slice.map((t, i) => (
              <RecordCard
                key={t.id}
                index={i}
                avatar={
                  <UserAvatar
                    name={t.assignee || "—"}
                    className="h-9 w-9 text-[11px]"
                    fallbackClassName="text-[11px] bg-gradient-to-br from-primary/30 to-primary/60 text-primary-foreground font-semibold"
                  />
                }
                title={
                  <TooltipProvider delayDuration={200}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link
                          to="/admin/tasks/$id"
                          params={{ id: t.id }}
                          className="block font-medium hover:text-primary line-clamp-2 whitespace-normal break-words leading-snug"
                          title={t.title}
                        >
                          {t.title}
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-md break-words">
                        <p>{t.title}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                }
                subtitle={formatTaskSubtitle(t.category, t.id)}
                badges={
                  <>
                    <TaskTypeBadge type={t.taskType} />
                    <StatusBadge status={t.status} />
                    {employeeId && t.status !== "rejected" && t.reviewState === "rejected" && <StatusBadge status="rejected" />}
                    <PriorityBadge priority={t.priority} />
                  </>
                }
                fields={[
                  {
                    label: "Employee",
                    value: t.assignee ? (
                      <span className="inline-flex flex-wrap items-center gap-1.5">
                        {t.assignee}
                        {t.assigneeCode && <IdBadge id={t.assigneeCode} />}
                      </span>
                    ) : t.taskType === "project" ? (
                      "Open"
                    ) : (
                      "Unassigned"
                    ),
                  },
                  ...(t.taskType === "project"
                    ? [{ label: "Project", value: projectName(t.projectId) }]
                    : []),
                  ...(t.assignedAt
                    ? [
                        {
                          label: "Assigned",
                          value: new Date(t.assignedAt).toLocaleString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          }),
                        },
                      ]
                    : []),
                  {
                    label: "Points",
                    value: (
                      <span className="inline-flex items-center gap-1">
                        <Trophy className="h-3 w-3 text-warning" /> <MetricValue value={t.points} />
                      </span>
                    ),
                  },
                  {
                    label: "Deadline",
                    value: new Date(t.dueDate).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    }),
                  },
                  { label: "Created by", value: createdByFor(t) },
                ]}
                actions={(() => {
                  const isOverdue = isTaskOverdue(t);
                  const isCompleted = isTaskCompleted(t);

                  return (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Actions for ${t.title}`}
                          className="h-9 w-9 rounded-md"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem
                          onClick={() =>
                            navigate({
                              to: "/admin/tasks/$id",
                              params: { id: t.id || (t as any)._id },
                            })
                          }
                        >
                          <Eye className="mr-2 h-4 w-4" /> View
                        </DropdownMenuItem>

                        {/* Editing is only for overdue task or on process task, not for completed task */}
                        {!isCompleted && (
                          <DropdownMenuItem
                            onClick={() =>
                              navigate({
                                to: "/admin/tasks/$id/edit",
                                params: { id: t.id || (t as any)._id },
                              })
                            }
                          >
                            <Pencil className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                        )}

                        {/* Reassign is available when task is overdue */}
                        {isOverdue && (
                          <DropdownMenuItem onClick={() => setPendingReassign(t)}>
                            <UserCheck className="mr-2 h-4 w-4 text-warning" /> Reassign
                          </DropdownMenuItem>
                        )}

                        {/* Delete is ONLY available for overdue tasks */}
                        {isOverdue && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setPendingDelete(t)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  );
                })()}
              />
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 px-5 py-3">
            <span className="text-xs text-muted-foreground">
              Showing {slice.length === 0 ? 0 : (current - 1) * pageSize + 1}–
              {Math.min((current - 1) * pageSize + slice.length, totalRecords)} of {totalRecords}{" "}
              tasks
              {pages > 1 && ` (Page ${current} of ${pages})`}
            </span>
            {pages > 1 && (
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-md"
                  disabled={current === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  title="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {getVisiblePages(current, pages).map((n) => (
                  <Button
                    key={n}
                    variant={n === current ? "default" : "outline"}
                    size="sm"
                    className="h-8 w-8 rounded-md p-0"
                    onClick={() => setPage(n)}
                  >
                    {n}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-md"
                  disabled={current === pages}
                  onClick={() => setPage((p) => Math.min(pages, p + 1))}
                  title="Next page"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      <AlertDialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{pendingDelete?.title}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This task and its history will be removed. This action can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteTask.isPending}
              onClick={() => {
                if (pendingDelete) {
                  const idToDelete = pendingDelete.id || (pendingDelete as any)._id || "";
                  setDeletedTaskIds(
                    (prev) =>
                      new Set(
                        [...prev, idToDelete, pendingDelete.id, (pendingDelete as any)._id].filter(
                          Boolean,
                        ) as string[],
                      ),
                  );
                  deleteTask.mutate(idToDelete);
                }
              }}
            >
              <Trash2 className="mr-1.5 h-4 w-4" /> Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ReassignTaskDialog
        task={pendingReassign}
        open={Boolean(pendingReassign)}
        onOpenChange={(o) => !o && setPendingReassign(null)}
      />
    </>
  );
}

function SummaryCard({
  label,
  value,
  tone,
  isLoading,
  isError,
}: {
  label: string;
  value?: number;
  tone: string;
  isLoading?: boolean;
  isError?: boolean;
}) {
  return (
    <div className="glass rounded-2xl p-4 transition-all">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      {isLoading ? (
        <div className="mt-2.5 h-7 w-16 animate-pulse rounded-md bg-muted/50" />
      ) : isError ? (
        <p className="mt-2 font-display text-sm font-medium text-destructive">Error</p>
      ) : value !== undefined && value !== null ? (
        <p className={`mt-2 font-display text-2xl font-semibold ${tone}`}>
          <MetricValue value={value} formatNumber={localizedNumber} />
        </p>
      ) : (
        <p
          className="mt-2 font-display text-sm font-medium text-muted-foreground"
          title="Count missing in API response"
        >
          N/A
        </p>
      )}
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
      aria-pressed={active}
      aria-label={active ? `Sort by ${label}, currently ${dir === "asc" ? "ascending" : "descending"}` : `Sort by ${label}`}
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-md px-1 py-0.5 hover:text-foreground ${active ? "text-foreground" : ""}`}
    >
      {label}
      <ArrowUpDown
        className={`h-3 w-3 transition-transform ${active && dir === "desc" ? "rotate-180" : ""} ${active ? "text-primary" : "opacity-50"}`}
      />
    </button>
  );
}
