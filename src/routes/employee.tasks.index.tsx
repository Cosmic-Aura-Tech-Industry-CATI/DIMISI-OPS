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
  UserCheck,
  Layers,
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  useRequestTaskMutation,
  type Task,
  type TaskPriority,
} from "@/features/tasks";

export const Route = createFileRoute("/employee/tasks/")({
  head: () => ({
    meta: [
      { title: "Tasks — Dimisi Operations" },
      { name: "description", content: "View assigned work and available organization tasks." },
      { property: "og:title", content: "Tasks — Dimisi Operations" },
      { property: "og:description", content: "Active and available tasks." },
    ],
  }),
  component: EmployeeTasksPage,
});

function EmployeeTasksPage() {
  const [activeTab, setActiveTab] = useState<"assigned" | "all">("assigned");
  const [query, setQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [submissionTask, setSubmissionTask] = useState<Task | null>(null);
  const [startingTaskId, setStartingTaskId] = useState<string | null>(null);
  const [requestingTaskId, setRequestingTaskId] = useState<string | null>(null);

  // Endpoint 1: GET /api/v1/tasks/assigned
  const {
    data: assignedTasks = [],
    isLoading: isLoadingAssigned,
    isError: isErrorAssigned,
    error: errorAssigned,
    refetch: refetchAssigned,
  } = useAssignedTasks();

  // Endpoint 2: GET /api/v1/tasks
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

  const requestTaskMutation = useRequestTaskMutation({
    onSettled: () => {
      setRequestingTaskId(null);
    },
  });

  const handleStartTask = (task: Task) => {
    const id = task._id || task.id;
    setStartingTaskId(id);
    startTaskMutation.mutate(id);
  };

  const handleRequestTask = (task: Task) => {
    const id = task._id || task.id;
    setRequestingTaskId(id);
    requestTaskMutation.mutate(id);
  };

  // Switch active dataset strictly based on tab selected
  const activeRawTasks = activeTab === "assigned" ? assignedTasks : allTasks;
  const isLoading = activeTab === "assigned" ? isLoadingAssigned : isLoadingAll;
  const isError = activeTab === "assigned" ? isErrorAssigned : isErrorAll;
  const error = activeTab === "assigned" ? errorAssigned : errorAll;
  const refetch = activeTab === "assigned" ? refetchAssigned : refetchAll;

  const filteredTasks = useMemo(() => {
    return activeRawTasks.filter((t) => {
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
  }, [activeRawTasks, query, priorityFilter, statusFilter]);

  if (isLoading) {
    return (
      <>
        <PageHeader
          title={activeTab === "assigned" ? "Assigned Tasks" : "All Tasks"}
          subtitle={
            activeTab === "assigned"
              ? "Active work assigned directly to you — submit for review when completed."
              : "All organization tasks available across departments."
          }
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
          title={activeTab === "assigned" ? "Assigned Tasks" : "All Tasks"}
          subtitle={
            activeTab === "assigned"
              ? "Active work assigned directly to you — submit for review when completed."
              : "All organization tasks available across departments."
          }
        />
        <ErrorState
          title={activeTab === "assigned" ? "Could not load assigned tasks" : "Could not load all tasks"}
          description={error?.message || "There was a problem communicating with the server."}
          onRetry={() => {
            void refetch();
          }}
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={activeTab === "assigned" ? "Assigned Tasks" : "All Tasks"}
        subtitle={
          activeTab === "assigned"
            ? "Active work assigned directly to you — submit for review when done."
            : "All organization tasks available across departments."
        }
      />

      {/* Tabs Bar for switching between Assigned Tasks (/api/v1/tasks/assigned) & All Tasks (/api/v1/tasks) */}
      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as "assigned" | "all")} className="w-full">
        <TabsList className="glass h-12 w-full max-w-md justify-start rounded-2xl p-1 bg-card/60 border border-border/60">
          <TabsTrigger
            value="assigned"
            className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2 text-sm font-medium transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
          >
            <UserCheck className="h-4 w-4" />
            <span>Assigned Tasks</span>
            <span className="ml-1 rounded-full bg-primary-foreground/20 px-2 py-0.5 text-xs font-semibold">
              {assignedTasks.length}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="all"
            className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2 text-sm font-medium transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
          >
            <Layers className="h-4 w-4" />
            <span>All Tasks</span>
            <span className="ml-1 rounded-full bg-primary-foreground/20 px-2 py-0.5 text-xs font-semibold">
              {allTasks.length}
            </span>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Filter and Search Toolbar */}
      <div className="glass flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={activeTab === "assigned" ? "Search assigned tasks…" : "Search all tasks…"}
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
          icon={activeTab === "assigned" ? ListTodo : Layers}
          title={activeTab === "assigned" ? "No assigned tasks" : "No tasks found"}
          description={
            activeTab === "assigned"
              ? "No tasks currently assigned to you matching your filter criteria."
              : "No organization tasks found matching your filter criteria."
          }
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
            const isRequesting = requestTaskMutation.isPending && requestingTaskId === taskId;

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
                      activeTab === "all" ? (
                        <Button
                          disabled={isRequesting}
                          onClick={() => handleRequestTask(task)}
                          className="w-full rounded-md shadow-glow bg-violet-600 hover:bg-violet-700 text-white"
                        >
                          <CheckCircle2 className="mr-1.5 h-4 w-4" />
                          {isRequesting ? "Requesting…" : "Request Task"}
                        </Button>
                      ) : (
                        <Button
                          disabled={isStarting}
                          onClick={() => handleStartTask(task)}
                          className="w-full rounded-md shadow-glow bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                          <PlayCircle className="mr-1.5 h-4 w-4" />
                          {isStarting ? "Starting…" : "Start Task"}
                        </Button>
                      )
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
                  const isRequesting = requestTaskMutation.isPending && requestingTaskId === taskId;

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
                          activeTab === "all" ? (
                            <Button
                              size="sm"
                              disabled={isRequesting}
                              onClick={() => handleRequestTask(task)}
                              className="rounded-full bg-violet-600 text-white hover:bg-violet-700 shadow-sm"
                            >
                              <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                              {isRequesting ? "Requesting…" : "Request Task"}
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              disabled={isStarting}
                              onClick={() => handleStartTask(task)}
                              className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                            >
                              <PlayCircle className="mr-1.5 h-3.5 w-3.5" />
                              {isStarting ? "Starting…" : "Start Task"}
                            </Button>
                          )
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


