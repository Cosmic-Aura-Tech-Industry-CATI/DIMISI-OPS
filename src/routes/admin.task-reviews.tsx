import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ClipboardCheck,
  Search,
  Filter,
  StickyNote,
  Calendar,
  Trophy,
  ShieldCheck,
  User,
  Mail,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { StatCardsSkeleton, TableSkeleton } from "@/components/skeletons";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TaskStatusBadge, TaskPriorityBadge } from "@/components/task-status-badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TaskReviewModal } from "@/features/task-reviews/components/task-review-modal";
import { useReviewCenter, type Task, getCategoryLabel } from "@/features/tasks";

export const Route = createFileRoute("/admin/task-reviews")({
  head: () => ({
    meta: [
      { title: "Review Center — Poll Admin" },
      { name: "description", content: "Approve, reject, or comment on employee task submissions." },
      { property: "og:title", content: "Review Center — Poll Admin" },
      { property: "og:description", content: "Approve, reject, or comment on employee task submissions." },
    ],
  }),
  component: ReviewCenterPage,
  errorComponent: ReviewCenterError,
});

function ReviewCenterError({ error, reset }: { error: any; reset: () => void }) {
  return (
    <>
      <PageHeader
        title="Review Center"
        subtitle="Evaluate employee task submissions, approve points, or request changes."
      />
      <ErrorState
        title="Could not load Review Center"
        description={error?.message || "An unexpected error occurred while loading task reviews."}
        onRetry={reset}
      />
    </>
  );
}

function ReviewCenterPage() {
  const [query, setQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useReviewCenter();

  const kpis = data?.kpis ?? {
    pendingReview: 0,
    highPriority: 0,
    pointsAtStake: 0,
  };
  const tasks = useMemo(() => data?.tasks ?? [], [data?.tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (!t) return false;
      // Ensure only tasks actively pending review are displayed
      const raw = (t.rawStatus || "").toLowerCase().trim();
      const st = (t.status || "").toLowerCase().trim();
      const rev = (t.reviewState || "").toLowerCase().trim();
      if (raw === "completed" || st === "completed" || rev === "approved") return false;
      if (rev === "rejected" || Boolean(t.rejectionReason)) return false;
      if (raw === "in_progress" && rev !== "in_review") return false;

      const q = query.trim().toLowerCase();
      const titleStr = (t.title || "").toLowerCase();
      const assigneeStr = (t.assignee || "").toLowerCase();
      const emailStr = (t.assigneeEmail || "").toLowerCase();
      const notesStr = (t.notes || "").toLowerCase();
      const catStr = getCategoryLabel(t.category).toLowerCase();

      const matchesQuery =
        !q ||
        titleStr.includes(q) ||
        assigneeStr.includes(q) ||
        emailStr.includes(q) ||
        notesStr.includes(q) ||
        catStr.includes(q);

      const taskPriority = (t.priority || "").toLowerCase();
      const matchesPriority =
        priorityFilter === "all" ||
        taskPriority === priorityFilter.toLowerCase();

      return matchesQuery && matchesPriority;
    });
  }, [tasks, query, priorityFilter]);

  if (isLoading) {
    return (
      <>
        <PageHeader
          title="Review Center"
          subtitle="Evaluate employee task submissions, approve points, or request changes."
        />
        <div className="space-y-5">
          <StatCardsSkeleton count={3} />
          <div className="h-12 w-full rounded-2xl bg-card/40 animate-pulse" />
          <TableSkeleton rows={5} cols={7} />
        </div>
      </>
    );
  }

  if (isError) {
    return (
      <>
        <PageHeader
          title="Review Center"
          subtitle="Evaluate employee task submissions, approve points, or request changes."
        />
        <ErrorState
          title="Could not load Review Center"
          description={error?.message || "Failed to fetch task submissions awaiting review."}
          onRetry={() => refetch()}
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Review Center"
        subtitle="Evaluate employee task submissions, approve points, or request changes."
      />

      {/* KPI Dashboard Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Pending Reviews"
          value={kpis.pendingReview}
          icon={ClipboardCheck}
          accent="primary"
        />
        <StatCard
          label="High Priority Reviews"
          value={kpis.highPriority}
          icon={Trophy}
          accent="warning"
        />
        <StatCard
          label="Points At Stake"
          value={kpis.pointsAtStake}
          icon={Trophy}
          accent="success"
        />
      </div>

      {/* Search and Filters Toolbar */}
      <div className="glass flex flex-col sm:flex-row items-stretch sm:items-center gap-3 rounded-2xl p-4">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by task title, employee name, or submission notes…"
            className="h-10 rounded-full pl-9"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="h-10 w-40 rounded-full">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="high">High Priority</SelectItem>
              <SelectItem value="medium">Medium Priority</SelectItem>
              <SelectItem value="low">Low Priority</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Review Table */}
      {filteredTasks.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="No Tasks Pending Review"
          description="You're all caught up! New employee submissions will appear here for verification."
        />
      ) : (
        <div className="glass overflow-hidden rounded-2xl border border-border/60">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border/60 bg-muted/20 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-3.5 font-semibold">Task Name</th>
                  <th className="px-5 py-3.5 font-semibold">Employee</th>
                  <th className="px-5 py-3.5 font-semibold">Priority</th>
                  <th className="px-5 py-3.5 font-semibold">Reward Points</th>
                  <th className="px-5 py-3.5 font-semibold">Submitted Notes</th>
                  <th className="px-5 py-3.5 font-semibold">Date</th>
                  <th className="px-5 py-3.5 font-semibold">Status</th>
                  <th className="px-5 py-3.5 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filteredTasks.map((task, idx) => {
                  const taskId = task._id || task.id || "";
                  const isIdValid = Boolean(taskId);
                  return (
                    <tr
                      key={taskId || idx}
                      className="transition-colors hover:bg-muted/30 animate-in fade-in"
                    >
                      {/* Task Name */}
                      <td className="px-5 py-4 max-w-[280px] min-w-[180px] whitespace-normal">
                        <TooltipProvider delayDuration={200}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              {isIdValid ? (
                                <Link
                                  to="/admin/tasks/$id"
                                  params={{ id: taskId }}
                                  className="font-semibold text-foreground line-clamp-2 hover:text-primary transition-colors cursor-pointer break-words leading-snug"
                                  title={task.title || "Untitled Task"}
                                >
                                  {task.title || "Untitled Task"}
                                </Link>
                              ) : (
                                <span
                                  className="font-semibold text-foreground line-clamp-2 break-words leading-snug"
                                  title={task.title || "Untitled Task"}
                                >
                                  {task.title || "Untitled Task"}
                                </span>
                              )}
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs break-words">
                              <p>{task.title || "Untitled Task"}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        {getCategoryLabel(task.category) !== "Uncategorized" && (
                          <span className="mt-1 inline-block rounded-md bg-secondary/50 px-2 py-0.5 text-[10px] font-medium text-muted-foreground uppercase">
                            {getCategoryLabel(task.category)}
                          </span>
                        )}
                      </td>

                      {/* Employee */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="grid h-7 w-7 place-items-center rounded-full bg-primary/15 text-primary text-xs font-semibold">
                            <User className="h-3.5 w-3.5" />
                          </div>
                          <div>
                            <div className="font-medium text-xs text-foreground">
                              {task.assignee || "Assigned Employee"}
                            </div>
                            {task.assigneeEmail && (
                              <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                                <Mail className="h-2.5 w-2.5" /> {task.assigneeEmail}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Priority */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <TaskPriorityBadge priority={task.priority || "medium"} />
                      </td>

                      {/* Reward Points */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 font-bold text-xs text-warning">
                          <Trophy className="h-3.5 w-3.5" />
                          {task.points || task.rewardPoints || 0} pts
                        </span>
                      </td>

                      {/* Submitted Notes */}
                      <td className="px-5 py-4 max-w-xs">
                        <div className="flex items-start gap-1.5 text-xs text-foreground/90 bg-muted/40 p-2 rounded-xl border border-border/40">
                          <StickyNote className="h-3 w-3 text-primary shrink-0 mt-0.5" />
                          <span className="line-clamp-2">
                            {task.notes || "No notes provided."}
                          </span>
                        </div>
                      </td>

                      {/* Submitted / Due Date */}
                      <td className="px-5 py-4 whitespace-nowrap text-muted-foreground">
                        <div className="inline-flex items-center gap-1.5 text-xs">
                          <Calendar className="h-3.5 w-3.5 text-primary" />
                          <span>
                            {task.dueDate ? (
                              (() => {
                                try {
                                  const d = new Date(task.dueDate);
                                  return !isNaN(d.getTime()) ? d.toLocaleDateString() : "Pending";
                                } catch {
                                  return "Pending";
                                }
                              })()
                            ) : (
                              "Pending"
                            )}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <TaskStatusBadge
                          status={
                            task.reviewState === "in_review" ||
                            (task.rawStatus || "").toLowerCase() === "in_review" ||
                            (task.status || "").toLowerCase() === "in_review"
                              ? "IN_REVIEW"
                              : task.status || "IN_REVIEW"
                          }
                          reviewState={task.reviewState}
                        />
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <Button
                          size="sm"
                          onClick={() => setSelectedTask(task)}
                          className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                        >
                          <ShieldCheck className="mr-1.5 h-3.5 w-3.5" /> Review
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Task Review Modal */}
      {selectedTask && (
        <TaskReviewModal
          task={selectedTask}
          open={Boolean(selectedTask)}
          onOpenChange={(open) => {
            if (!open) setSelectedTask(null);
          }}
          onSuccess={() => {
            setSelectedTask(null);
            void refetch();
          }}
        />
      )}
    </>
  );
}
