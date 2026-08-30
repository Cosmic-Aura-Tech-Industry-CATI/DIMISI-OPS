import { Link } from "@tanstack/react-router";
import {
  CalendarClock,
  CheckCircle2,
  Eye,
  PlayCircle,
  RotateCcw,
  Send,
  Trophy,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PriorityBadge } from "@/components/status-badge";
import { TaskDetailDialog } from "@/components/task-detail-dialog";
import { SubmissionDetailDialog } from "@/components/submission-detail-dialog";
import type { TaskReviewState } from "@/lib/mock-data";
import { type Task, useStartTask } from "@/features/tasks";

type Bucket = "assigned" | "review" | "completed" | "rejected";

const reviewLabel: Record<TaskReviewState, { label: string; className: string }> = {
  in_review: { label: "Pending review", className: "bg-primary/15 text-primary" },
  approved: { label: "Approved", className: "bg-success/15 text-success" },
  rejected: { label: "Rejected", className: "bg-destructive/15 text-destructive" },
};

const statusPill: Record<Task["status"], { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-muted text-muted-foreground" },
  in_progress: { label: "In progress", className: "bg-primary/15 text-primary" },
  completed: { label: "Completed", className: "bg-success/15 text-success" },
  overdue: { label: "Overdue", className: "bg-destructive/15 text-destructive" },
  available: { label: "Available", className: "bg-primary/15 text-primary" },
  assigned: { label: "Assigned", className: "bg-info/15 text-info" },
};

export function TaskCard({ task, bucket, index = 0 }: { task: Task; bucket: Bucket; index?: number }) {
  const [detailOpen, setDetailOpen] = useState(false);
  const [submissionOpen, setSubmissionOpen] = useState(false);
  const days = Math.ceil((+new Date(task.dueDate) - Date.now()) / 86400000);
  const remaining =
    days < 0 ? { label: `${-days}d overdue`, tone: "text-destructive" }
    : days === 0 ? { label: "Due today", tone: "text-warning" }
    : days <= 3 ? { label: `${days}d left`, tone: "text-warning" }
    : { label: `${days}d left`, tone: "text-muted-foreground" };

  const pill = task.reviewState ? reviewLabel[task.reviewState] : statusPill[task.status];

  return (
    <article
      className="glass group flex h-full flex-col rounded-2xl p-5 transition-all hover:-translate-y-0.5 hover:shadow-glow animate-in fade-in slide-in-from-bottom-2"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
            <PriorityBadge priority={task.priority} />
            <span className="rounded-sm bg-secondary/60 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              {task.category}
            </span>
          </div>
          <Link
            to="/employee/tasks/$id"
            params={{ id: task.id }}
            className="line-clamp-2 font-display text-base font-semibold leading-snug hover:text-primary"
          >
            {task.title}
          </Link>
        </div>
        <span className={`shrink-0 rounded-sm px-2.5 py-1 text-[11px] font-medium ${pill.className}`}>
          {pill.label}
        </span>
      </header>

      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{task.description}</p>

      {task.assignedAt && (
        <p className="mt-2 text-xs text-muted-foreground">
          Assigned{" "}
          <span className="font-medium text-foreground">
            {new Date(task.assignedAt).toLocaleString(undefined, {
              month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
            })}
          </span>
        </p>
      )}

      {task.reviewState === "rejected" && task.rejectionReason && (
        <p className="mt-3 rounded-xl border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive">
          {task.rejectionReason}
        </p>
      )}

      <dl className="mt-4 grid grid-cols-3 gap-2 rounded-xl border border-border/60 bg-card/40 p-3 text-xs">
        <div>
          <dt className="flex items-center gap-1 text-muted-foreground">
            <CalendarClock className="h-3 w-3" /> Deadline
          </dt>
          <dd className="mt-0.5 font-medium">
            {new Date(task.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
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
          <dd className="mt-0.5 font-medium">{task.points} pts</dd>
        </div>
      </dl>

      <div className="mt-auto flex flex-col gap-2 pt-4 lg:flex-row">
        <Button
          variant="outline"
          className="w-full min-w-0 rounded-md lg:flex-1"
          onClick={() => setDetailOpen(true)}
        >
          <Eye className="mr-1.5 h-4 w-4" /> View Task
        </Button>
        <div className="w-full min-w-0 lg:flex-1">
          <ActionButton bucket={bucket} task={task} onViewSubmission={() => setSubmissionOpen(true)} />
        </div>
      </div>

      <TaskDetailDialog task={task} open={detailOpen} onOpenChange={setDetailOpen} />
      <SubmissionDetailDialog task={task} open={submissionOpen} onOpenChange={setSubmissionOpen} />
    </article>
  );
}


function ActionButton({
  bucket,
  task,
  onViewSubmission,
}: {
  bucket: Bucket;
  task: Task;
  onViewSubmission: () => void;
}) {
  const startTask = useStartTask({
    onSuccess: () => {
      toast.success("Task started successfully", {
        description: "Task is now in progress. You can submit your work when ready.",
      });
    },
    onError: (err) => {
      toast.error("Failed to start task", {
        description: err.message || "An error occurred while starting the task.",
      });
    },
  });

  if (bucket === "assigned") {
    const isAssignedNotStarted =
      task.status === "assigned" ||
      task.status === "pending" ||
      task.rawStatus === "Assigned";

    if (isAssignedNotStarted) {
      return (
        <Button
          className="w-full rounded-md shadow-glow"
          disabled={startTask.isPending}
          onClick={() => startTask.mutate(task.id || task._id || "")}
        >
          <PlayCircle className="mr-1.5 h-4 w-4" />
          {startTask.isPending ? "Starting…" : "Start task"}
        </Button>
      );
    }

    return (
      <Button asChild className="w-full rounded-md shadow-glow">
        <Link to="/employee/tasks/$id/submit" params={{ id: task.id }}>
          <Send className="mr-1.5 h-4 w-4" /> Submit for review
        </Link>
      </Button>
    );
  }
  if (bucket === "review") {
    return (
      <Button variant="outline" className="w-full rounded-md" onClick={onViewSubmission}>
        <Eye className="mr-1.5 h-4 w-4" /> View submission
      </Button>
    );
  }
  if (bucket === "rejected") {
    return (
      <Button asChild className="w-full rounded-md shadow-glow">
        <Link to="/employee/tasks/$id/submit" params={{ id: task.id }}>
          <RotateCcw className="mr-1.5 h-4 w-4" /> Resubmit
        </Link>
      </Button>
    );
  }
  return (
    <Button variant="outline" className="w-full rounded-md" onClick={onViewSubmission}>
      <CheckCircle2 className="mr-1.5 h-4 w-4" /> View details
    </Button>
  );
}


export function TaskCardGrid({ tasks, bucket }: { tasks: Task[]; bucket: Bucket }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {tasks.map((t, i) => <TaskCard key={t.id} task={t} bucket={bucket} index={i} />)}
    </div>
  );
}
