import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowRight,
  CalendarClock,
  Eye,
  Globe,
  Hand,
  Loader2,
  RotateCw,
  Sparkles,
  Timer,
  Trophy,
  UserRound,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { PriorityBadge } from "@/components/status-badge";
import { TaskDetailDialog } from "@/components/task-detail-dialog";
import {
  useTasksQuery,
  useRequestTaskMutation,
  getCategoryLabel,
  type Task,
  type TasksResult,
} from "@/features/tasks";
import { taskKeys } from "@/api/client/query-keys";

export function PoolCard({
  task,
  index = 0,
  showCreatedBy = true,
  onAcquire,
  onRequest,
  isAcquiring,
  isRequesting,
}: {
  task: Task;
  index?: number;
  showCreatedBy?: boolean;
  onAcquire?: (task: Task) => void;
  onRequest?: (task: Task) => void;
  isAcquiring?: boolean;
  isRequesting?: boolean;
}) {
  const [detailOpen, setDetailOpen] = useState(false);
  const alreadyRequested = Boolean(task.isRequestedByMe);
  const isBusy = Boolean(isAcquiring || isRequesting);
  const isDisabled = alreadyRequested || isBusy;
  const categoryLabel = getCategoryLabel(task.category);

  const handleAction = () => {
    if (onAcquire) {
      onAcquire(task);
    } else if (onRequest) {
      onRequest(task);
    }
  };

  return (
    <article
      className="rounded-2xl border border-border/60 bg-card/40 p-4 transition-all hover:border-primary/40 hover:bg-secondary/30 animate-in fade-in slide-in-from-bottom-1"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <div className="flex flex-wrap items-center gap-1.5">
        <PriorityBadge priority={task.priority} />
        {alreadyRequested && (
          <span className="rounded-sm bg-info/15 px-2 py-0.5 text-[10px] font-medium text-info">
            Requested
          </span>
        )}
      </div>

      <h4 className="mt-2 font-display text-sm font-semibold leading-snug">{task.title}</h4>

      {/* Show the task category below the heading */}
      <div className="mt-1 flex items-center gap-1.5">
        <span className="rounded-sm bg-secondary/60 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          {categoryLabel}
        </span>
      </div>

      <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{task.description}</p>

      <dl className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
        <div>
          <dt className="flex items-center gap-1 text-muted-foreground">
            <Trophy className="h-3 w-3 text-warning" /> Reward
          </dt>
          <dd className="mt-0.5 font-medium">{task.points || task.rewardPoints || 0} pts</dd>
        </div>
        <div>
          <dt className="flex items-center gap-1 text-muted-foreground">
            <CalendarClock className="h-3 w-3" /> Deadline
          </dt>
          <dd className="mt-0.5 font-medium">
            {task.dueDate
              ? new Date(task.dueDate).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })
              : "—"}
          </dd>
        </div>
        {task.estimatedTime && (
          <div>
            <dt className="flex items-center gap-1 text-muted-foreground">
              <Timer className="h-3 w-3" /> Estimate
            </dt>
            <dd className="mt-0.5 font-medium">{task.estimatedTime}</dd>
          </div>
        )}
        {showCreatedBy && task.createdBy && (
          <div className="col-span-2 sm:col-span-3">
            <dt className="flex items-center gap-1 text-muted-foreground">
              <UserRound className="h-3 w-3" /> Created by
            </dt>
            <dd className="mt-0.5 font-medium">{task.createdBy}</dd>
          </div>
        )}
      </dl>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 rounded-md"
          onClick={() => setDetailOpen(true)}
        >
          <Eye className="mr-1.5 h-3.5 w-3.5" /> View details
        </Button>
        <Button
          size="sm"
          className="flex-1 rounded-md shadow-glow"
          disabled={isDisabled}
          onClick={handleAction}
        >
          {isBusy ? (
            <>
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              Acquiring…
            </>
          ) : alreadyRequested ? (
            <>
              <Hand className="mr-1.5 h-3.5 w-3.5" />
              Requested
            </>
          ) : (
            <>
              <Hand className="mr-1.5 h-3.5 w-3.5" />
              Acquire Task
            </>
          )}
        </Button>
      </div>

      <TaskDetailDialog task={task} open={detailOpen} onOpenChange={setDetailOpen} />
    </article>
  );
}

export function AvailableTasks() {
  const { data: allTasks = [], isLoading, isError, refetch } = useTasksQuery();

  const isAvailableStatus = (t: Task) => {
    // If the employee has already requested or acquired the task, it is no longer available to acquire
    if (t.isRequestedByMe) return false;
    // If task has an assigned employee, it cannot be acquired
    if (t.assigneeId || t.assignee || t.assignedTo) return false;

    const s = (t.status || "").toLowerCase().trim();
    const rs = (t.rawStatus || "").toLowerCase().trim();

    const unavailableStatuses = [
      "assigned",
      "in_progress",
      "in progress",
      "in_review",
      "in review",
      "completed",
      "overdue",
      "rejected",
      "cancelled",
    ];

    if (unavailableStatuses.includes(s) || unavailableStatuses.includes(rs)) {
      return false;
    }

    if (t.dueDate && new Date(t.dueDate).getTime() < Date.now()) {
      return false;
    }

    return true;
  };

  // Only universal tasks available for employees to acquire
  const universal = useMemo(() => {
    return allTasks.filter(
      (t) =>
        ((t.taskType || "").toLowerCase() === "universal" ||
          (t.rawStatus || "").toLowerCase() === "universal") &&
        isAvailableStatus(t),
    );
  }, [allTasks]);

  const count = universal.length;

  return (
    <section aria-labelledby="universal-tasks-summary-heading">
      <div className="glass relative overflow-hidden rounded-2xl p-5 sm:p-6 border border-border/60 hover:border-primary/40 transition-all shadow-sm">
        {/* Ambient gold glow matching DIMISI OPS dark theme */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-gradient-to-br from-primary/30 to-primary/5 blur-3xl opacity-60"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-10 -left-10 h-28 w-28 rounded-full bg-primary/10 blur-2xl opacity-40"
        />

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary border border-primary/20 shadow-glow">
              <Globe className="h-6 w-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h2
                  id="universal-tasks-summary-heading"
                  className="font-display text-xl sm:text-2xl font-semibold tracking-tight text-foreground"
                >
                  Universal Tasks Available
                </h2>
                {isLoading ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-0.5 text-xs font-medium text-primary">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Loading…</span>
                  </span>
                ) : isError ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-destructive/30 bg-destructive/10 px-3 py-0.5 text-xs font-medium text-destructive">
                    <AlertCircle className="h-3 w-3" />
                    <span>Unavailable</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/15 px-3 py-0.5 text-xs font-semibold text-primary shadow-glow">
                    <Sparkles className="h-3 w-3 text-primary" />
                    {count} Available
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Organization-wide open tasks ready to acquire, contribute to, and earn points for.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {isError && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => void refetch()}
                className="rounded-md text-xs border-border/60"
              >
                <RotateCw className="mr-1.5 h-3.5 w-3.5" />
                Retry
              </Button>
            )}
            <Button
              asChild
              className="rounded-md shadow-glow bg-primary text-primary-foreground hover:bg-primary/90 font-medium px-4"
            >
              <Link to="/employee/tasks" search={{ tab: "all" }}>
                View Universal Tasks
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

export const UniversalTasks = AvailableTasks;

