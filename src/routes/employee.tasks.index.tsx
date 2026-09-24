import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ListTodo,
  Search,
  PlayCircle,
  Send,
  Calendar,
  Trophy,
  Filter,
  CheckCircle2,
  LayoutGrid,
  List,
  Eye,
  Clock,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { TableSkeleton } from "@/components/skeletons";
import { TaskStatusBadge, TaskPriorityBadge } from "@/components/task-status-badge";
import { PriorityBadge } from "@/components/status-badge";
import { TaskSubmissionModal } from "@/features/tasks/components/task-submission-modal";
import {
  useAssignedTasks,
  useTasksQuery,
  useStartTaskMutation,
  type Task,
  type TaskPriority,
} from "@/features/tasks";

export const Route = createFileRoute("/employee/tasks/")({
  head: () => ({
    meta: [
      { title: "Assigned Tasks — Poll" },
      { name: "description", content: "Everything currently on your plate." },
      { property: "og:title", content: "Assigned Tasks — Poll" },
      { property: "og:description", content: "Active work assigned to you." },
    ],
  }),
  component: AssignedTasksPage,
});

function AssignedTasksPage() {
  const [query, setQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [submissionTask, setSubmissionTask] = useState<Task | null>(null);
  const [startingTaskId, setStartingTaskId] = useState<string | null>(null);

  const {
    data: assignedTasks = [],
    isLoading: isLoadingAssigned,
    isError: isErrorAssigned,
    error: errorAssigned,
    refetch: refetchAssigned,
  } = useAssignedTasks();

  const {
    data: allTasks = [],
    isLoading: isLoadingAll,
    isError: isErrorAll,
    error: errorAll,
    refetch: refetchAll,
  } = useTasksQuery();

  const startTaskMutation = useStartTaskMutation({
    onSettled: () => {
      setStartingTaskId(null);
    },
  });

  const handleStartTask = (task: Task) => {
    const id = task._id || task.id;
    setStartingTaskId(id);
    startTaskMutation.mutate(id);
  };

  // Merge explicitly assigned tasks and available/open tasks
  const combinedTasks = useMemo(() => {
    const map = new Map<string, Task>();
    for (const t of assignedTasks) {
      const id = t._id || t.id;
      if (id) map.set(id, t);
    }
    for (const t of allTasks) {
      const id = t._id || t.id;
      if (!id) continue;
      if (!map.has(id)) {
        const s = (t.status || "").toLowerCase().trim();
        const rs = (t.rawStatus || "").toLowerCase().trim();
        if (
          s !== "completed" &&
          rs !== "completed" &&
          t.reviewState !== "in_review" &&
          t.reviewState !== "approved"
        ) {
          map.set(id, t);
        }
      }
    }
    return Array.from(map.values());
  }, [assignedTasks, allTasks]);

  const filteredTasks = useMemo(() => {
    return combinedTasks.filter((t) => {
      const q = query.trim().toLowerCase();
      const matchesQuery =
        !q ||
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        (t.category && t.category.toLowerCase().includes(q));

      const matchesPriority =
        priorityFilter === "all" ||
        t.priority.toLowerCase() === priorityFilter.toLowerCase();

      const normalizedStatus = (t.status || "").toLowerCase().trim();
      const rawStatus = (t.rawStatus || "").toLowerCase().trim();
      const isInProgress =
        normalizedStatus === "in_progress" ||
        normalizedStatus === "in progress" ||
        rawStatus === "in_progress" ||
        rawStatus === "in progress";

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "in_progress" && isInProgress) ||
        (statusFilter === "assigned" && !isInProgress);

      return matchesQuery && matchesPriority && matchesStatus;
    });
  }, [combinedTasks, query, priorityFilter, statusFilter]);

  const isLoading = isLoadingAssigned && isLoadingAll;
  const isError = isErrorAssigned && isErrorAll && combinedTasks.length === 0;

  if (isLoading) {
    return (
      <>
        <PageHeader
          title="Assigned Tasks"
          subtitle="Active work assigned to you — submit for review when completed."
        />
        <div className="space-y-4">
          <div className="h-14 w-full rounded-2xl bg-card/40 animate-pulse" />
          <TableSkeleton rows={6} cols={6} />
        </div>
      </>
    );
  }

  if (isError) {
    return (
      <>
        <PageHeader
          title="Assigned Tasks"
          subtitle="Active work assigned to you — submit for review when completed."
        />
        <ErrorState
          title="Could not load assigned tasks"
          description={
            errorAssigned?.message ||
            errorAll?.message ||
            "There was a problem communicating with the server."
          }
          onRetry={() => {
            void refetchAssigned();
            void refetchAll();
          }}
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Assigned tasks"
        subtitle="Active work assigned to you — submit for review when done."
      />

      {/* Filter and Search Toolbar */}
      <div className="glass flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tasks…"
            className="h-10 rounded-full pl-9"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="h-10 w-full sm:w-36 rounded-full">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All priorities</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-10 w-full sm:w-36 rounded-full">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All States</SelectItem>
              <SelectItem value="assigned">Available / Assigned</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
            </SelectContent>
          </Select>

          {/* View Toggle */}
          <div className="flex items-center rounded-full border border-border/60 bg-muted/30 p-0.5">
            <button
              type="button"
              onClick={() => setViewMode("cards")}
              className={`rounded-full p-2 transition-colors ${
                viewMode === "cards"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Card Grid View"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`rounded-full p-2 transition-colors ${
                viewMode === "table"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Table View"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {filteredTasks.length === 0 ? (
        <EmptyState
          icon={ListTodo}
          title="Inbox zero"
          description="No active tasks matching your criteria — enjoy the calm."
        />
      ) : viewMode === "cards" ? (
        /* Card Grid View */
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredTasks.map((task, idx) => {
            const taskId = task._id || task.id;
            const normalizedStatus = (task.status || "").toLowerCase().trim();
            const rawStatus = (task.rawStatus || "").toLowerCase().trim();
            const isInProgress =
              normalizedStatus === "in_progress" ||
              normalizedStatus === "in progress" ||
              rawStatus === "in_progress" ||
              rawStatus === "in progress";

            const isStarting = startTaskMutation.isPending && startingTaskId === taskId;

            const days = task.dueDate ? Math.ceil((+new Date(task.dueDate) - Date.now()) / 86400000) : 0;
            const remaining =
              days < 0
                ? { label: `${-days}d overdue`, tone: "text-destructive" }
                : days === 0
                  ? { label: "Due today", tone: "text-warning" }
                  : days <= 3
                    ? { label: `${days}d left`, tone: "text-warning" }
                    : { label: `${days}d left`, tone: "text-muted-foreground" };

            const statusPillLabel = isInProgress
              ? "In Progress"
              : normalizedStatus === "assigned" || rawStatus === "assigned"
                ? "Assigned"
                : "Available";

            const statusPillClass = isInProgress
              ? "bg-amber-500/15 text-amber-400"
              : normalizedStatus === "assigned" || rawStatus === "assigned"
                ? "bg-info/15 text-info"
                : "bg-primary/15 text-primary";

            return (
              <article
                key={taskId || idx}
                className="glass group flex h-full flex-col rounded-2xl p-5 transition-all hover:-translate-y-0.5 hover:shadow-glow animate-in fade-in slide-in-from-bottom-2"
                style={{ animationDelay: `${idx * 40}ms` }}
              >
                <header className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                      <PriorityBadge priority={task.priority} />
                      <span className="rounded-sm bg-secondary/60 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                        {task.category || "General"}
                      </span>
                    </div>
                    <Link
                      to="/employee/tasks/$id"
                      params={{ id: taskId }}
                      className="line-clamp-2 font-display text-base font-semibold leading-snug hover:text-primary transition-colors cursor-pointer"
                    >
                      {task.title}
                    </Link>
                  </div>
                  <span className={`shrink-0 rounded-sm px-2.5 py-1 text-[11px] font-medium ${statusPillClass}`}>
                    {statusPillLabel}
                  </span>
                </header>

                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                  {task.description || "No description provided."}
                </p>

                <dl className="mt-4 grid grid-cols-3 gap-2 rounded-xl border border-border/60 bg-card/40 p-3 text-xs">
                  <div>
                    <dt className="flex items-center gap-1 text-muted-foreground">
                      <Calendar className="h-3 w-3 text-primary" /> Deadline
                    </dt>
                    <dd className="mt-0.5 font-medium">
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "No deadline"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Remaining</dt>
                    <dd className={`mt-0.5 font-medium ${remaining.tone}`}>{remaining.label}</dd>
                  </div>
                  <div>
                    <dt className="flex items-center gap-1 text-muted-foreground">
                      <Trophy className="h-3 w-3 text-warning" /> Reward
                    </dt>
                    <dd className="mt-0.5 font-medium">{task.points || task.rewardPoints || 0} pts</dd>
                  </div>
                </dl>

                <div className="mt-auto flex flex-col gap-2 pt-4 lg:flex-row">
                  <Button
                    asChild
                    variant="outline"
                    className="w-full min-w-0 rounded-md lg:flex-1"
                  >
                    <Link to="/employee/tasks/$id" params={{ id: taskId }}>
                      <Eye className="mr-1.5 h-4 w-4" /> View Task
                    </Link>
                  </Button>

                  <div className="w-full min-w-0 lg:flex-1">
                    {!isInProgress ? (
                      <Button
                        disabled={isStarting}
                        onClick={() => handleStartTask(task)}
                        className="w-full rounded-md shadow-glow bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        <PlayCircle className="mr-1.5 h-4 w-4" />
                        {isStarting ? "Starting…" : "Start Task"}
                      </Button>
                    ) : (
                      <Button
                        onClick={() => setSubmissionTask(task)}
                        className="w-full rounded-md shadow-glow bg-indigo-600 hover:bg-indigo-700 text-white"
                      >
                        <Send className="mr-1.5 h-4 w-4" />
                        Submit for review
                      </Button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="glass overflow-hidden rounded-2xl border border-border/60">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border/60 bg-muted/20 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-3.5 font-semibold">Title & Description</th>
                  <th className="px-5 py-3.5 font-semibold">Priority</th>
                  <th className="px-5 py-3.5 font-semibold">Due Date</th>
                  <th className="px-5 py-3.5 font-semibold">Reward</th>
                  <th className="px-5 py-3.5 font-semibold">Status</th>
                  <th className="px-5 py-3.5 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filteredTasks.map((task, idx) => {
                  const taskId = task._id || task.id;
                  const normalizedStatus = (task.status || "").toLowerCase().trim();
                  const rawStatus = (task.rawStatus || "").toLowerCase().trim();
                  const isInProgress =
                    normalizedStatus === "in_progress" ||
                    normalizedStatus === "in progress" ||
                    rawStatus === "in_progress" ||
                    rawStatus === "in progress";

                  const isStarting = startTaskMutation.isPending && startingTaskId === taskId;

                  return (
                    <tr
                      key={taskId || idx}
                      className="transition-colors hover:bg-muted/30 animate-in fade-in"
                    >
                      {/* Title & Category */}
                      <td className="px-5 py-4 max-w-sm">
                        <Link
                          to="/employee/tasks/$id"
                          params={{ id: taskId }}
                          className="font-semibold text-foreground line-clamp-1 hover:text-primary transition-colors cursor-pointer"
                        >
                          {task.title}
                        </Link>
                        <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                          {task.description || "No description provided."}
                        </div>
                        {task.category && (
                          <span className="mt-1.5 inline-block rounded-md bg-secondary/50 px-2 py-0.5 text-[10px] font-medium text-muted-foreground uppercase">
                            {task.category}
                          </span>
                        )}
                      </td>

                      {/* Priority */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <TaskPriorityBadge priority={task.priority} />
                      </td>

                      {/* Due Date */}
                      <td className="px-5 py-4 whitespace-nowrap text-muted-foreground">
                        <div className="inline-flex items-center gap-1.5 text-xs">
                          <Calendar className="h-3.5 w-3.5 text-primary" />
                          <span>
                            {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "No deadline"}
                          </span>
                        </div>
                      </td>

                      {/* Reward Points */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 font-semibold text-xs text-warning">
                          <Trophy className="h-3.5 w-3.5" />
                          {task.points || task.rewardPoints || 0} pts
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <TaskStatusBadge status={isInProgress ? "IN_PROGRESS" : task.status} />
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        {!isInProgress ? (
                          <Button
                            size="sm"
                            disabled={isStarting}
                            onClick={() => handleStartTask(task)}
                            className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                          >
                            <PlayCircle className="mr-1.5 h-3.5 w-3.5" />
                            {isStarting ? "Starting…" : "Start Task"}
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => setSubmissionTask(task)}
                            className="rounded-full bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
                          >
                            <Send className="mr-1.5 h-3.5 w-3.5" />
                            Submit For Review
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Task Submission Modal */}
      <TaskSubmissionModal
        task={submissionTask}
        open={Boolean(submissionTask)}
        onOpenChange={(open) => {
          if (!open) setSubmissionTask(null);
        }}
      />
    </>
  );
}

