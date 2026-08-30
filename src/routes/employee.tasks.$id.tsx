import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  Eye,
  FileQuestion,
  FileText,
  MessageSquare,
  Paperclip,
  PlayCircle,
  RotateCcw,
  Send,
  StickyNote,
  Trophy,
  UserPlus,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { PriorityBadge, StatusBadge } from "@/components/status-badge";
import { Progress } from "@/components/ui/progress";
import { admins, type Task } from "@/lib/mock-data";
import { useTaskQuery, useStartTask } from "@/features/tasks";
import { toast } from "sonner";

export const Route = createFileRoute("/employee/tasks/$id")({
  head: () => ({ meta: [{ title: "Task details — Poll" }] }),
  component: EmployeeTaskDetail,
});

const taskId = (id: string) => `TSK-${id.replace(/\D/g, "").padStart(4, "0") || id.slice(-4)}`;

function EmployeeTaskDetail() {
  const { id } = useParams({ from: "/employee/tasks/$id" });
  const { data: task, isLoading } = useTaskQuery(id);
  const startTask = useStartTask({
    onSuccess: () => {
      toast.success("Task started", { description: "Task is now in progress." });
    },
    onError: (err) => {
      toast.error("Failed to start task", { description: err.message || "An error occurred." });
    },
  });

  if (isLoading) {
    return (
      <div className="glass flex flex-col items-center justify-center rounded-2xl py-20 text-muted-foreground">
        <p className="text-sm">Loading task details...</p>
      </div>
    );
  }

  if (!task) {
    return (
      <EmptyState
        icon={FileQuestion}
        title="Task not found"
        description="This task may have been reassigned or removed."
        action={<Button asChild><Link to="/employee/tasks">Back to my tasks</Link></Button>}
      />
    );
  }

  const days = task.dueDate ? Math.ceil((+new Date(task.dueDate) - Date.now()) / 86400000) : 0;
  const remaining =
    days < 0 ? { label: `${-days}d overdue`, tone: "text-destructive" }
    : days === 0 ? { label: "Due today", tone: "text-warning" }
    : days <= 3 ? { label: `${days}d left`, tone: "text-warning" }
    : { label: `${days}d left`, tone: "text-muted-foreground" };

  const progress =
    task.status === "completed" ? 100
    : task.status === "in_progress" ? 60
    : task.status === "overdue" ? 45
    : 15;

  const creator = task.createdBy || "Admin";

  const submissionState =
    task.reviewState === "approved" ? { label: "Approved", tone: "text-success", bg: "bg-success/15", ring: "ring-success/30" }
    : task.reviewState === "rejected" ? { label: "Rejected", tone: "text-destructive", bg: "bg-destructive/15", ring: "ring-destructive/30" }
    : task.reviewState === "in_review" ? { label: "In review", tone: "text-primary", bg: "bg-primary/15", ring: "ring-primary/30" }
    : { label: "Not submitted", tone: "text-muted-foreground", bg: "bg-muted", ring: "ring-border" };

  const timeline = buildTimeline(task, creator);

  const primaryAction =
    task.reviewState === "in_review"
      ? { icon: Eye, label: "View submission", variant: "outline" as const }
      : task.reviewState === "rejected"
      ? { icon: RotateCcw, label: "Resubmit task", variant: "default" as const }
      : task.status === "completed"
      ? { icon: CheckCircle2, label: "View details", variant: "outline" as const }
      : { icon: Send, label: "Submit for review", variant: "default" as const };

  const isAssignedNotStarted =
    (task.status === "assigned" || task.status === "pending" || task.rawStatus === "Assigned") &&
    !task.reviewState;

  return (
    <>
      <div>
        <Link to="/employee/tasks" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to my tasks
        </Link>
      </div>

      <PageHeader
        title={task.title}
        subtitle={`${task.category} · ${taskId(task.id)}`}
        actions={
          isAssignedNotStarted ? (
            <Button
              className="rounded-md shadow-glow"
              disabled={startTask.isPending}
              onClick={() => startTask.mutate(task.id || task._id || "")}
            >
              <PlayCircle className="mr-1.5 h-4 w-4" />
              {startTask.isPending ? "Starting…" : "Start task"}
            </Button>
          ) : primaryAction.variant === "default" ? (
            <Button asChild className="rounded-md shadow-glow">
              <Link to="/employee/tasks/$id/submit" params={{ id: task.id }}>
                <primaryAction.icon className="mr-1.5 h-4 w-4" /> {primaryAction.label}
              </Link>
            </Button>
          ) : (
            <Button variant="outline" className="rounded-md">
              <primaryAction.icon className="mr-1.5 h-4 w-4" /> {primaryAction.label}
            </Button>
          )
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {/* Task information + description */}
          <div className="glass rounded-2xl p-6">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={task.status} />
              <PriorityBadge priority={task.priority} />
              <span className="inline-flex items-center gap-1 rounded-sm bg-warning/15 px-2.5 py-0.5 text-xs font-medium text-warning">
                <Trophy className="h-3 w-3" /> {task.points} pts
              </span>
              <span className={`inline-flex items-center gap-1 rounded-sm px-2.5 py-0.5 text-xs font-medium ring-1 ${submissionState.bg} ${submissionState.tone} ${submissionState.ring}`}>
                {submissionState.label}
              </span>
            </div>

            <div className="mt-5 flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-display font-semibold">Description</h3>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{task.description}</p>

            {/* Progress */}
            <div className="mt-6">
              <div className="mb-2 flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 font-medium">
                  <PlayCircle className="h-3.5 w-3.5 text-primary" /> Progress
                </span>
                <span className="text-muted-foreground">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {task.notes && (
              <>
                <div className="mt-6 flex items-center gap-2 text-sm">
                  <StickyNote className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-display font-semibold">Notes</h3>
                </div>
                <p className="mt-2 rounded-xl border border-border/60 bg-card/40 p-3 text-sm text-muted-foreground">{task.notes}</p>
              </>
            )}

            {task.reviewState === "rejected" && task.rejectionReason && (
              <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 p-3">
                <div className="flex items-center gap-2 text-sm font-medium text-destructive">
                  <MessageSquare className="h-4 w-4" /> Reviewer feedback
                </div>
                <p className="mt-1 text-xs text-destructive/90">{task.rejectionReason}</p>
              </div>
            )}
          </div>

          {/* Timeline */}
          <div className="glass rounded-2xl p-6">
            <div className="mb-5 flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-display font-semibold">Activity timeline</h3>
            </div>
            <ol className="relative space-y-5 border-l border-border/60 pl-6">
              {timeline.map((t, i) => (
                <li key={i} className="animate-in fade-in slide-in-from-left-2" style={{ animationDelay: `${i * 60}ms` }}>
                  <span className={`absolute -left-[9px] grid h-4 w-4 place-items-center rounded-full ring-4 ring-background ${t.dotBg}`}>
                    <t.icon className={`h-2.5 w-2.5 ${t.dotIcon}`} />
                  </span>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="text-sm font-medium">{t.title}</p>
                    <span className="text-[11px] text-muted-foreground">{t.date}</span>
                  </div>
                  {t.note && <p className="mt-0.5 text-xs text-muted-foreground">{t.note}</p>}
                </li>
              ))}
            </ol>
          </div>

          {/* Attachments */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-2">
              <Paperclip className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-display font-semibold">Attachments</h3>
            </div>
            {task.attachments && task.attachments.length > 0 ? (
              <ul className="mt-3 space-y-2">
                {task.attachments.map((a, i) => (
                  <li key={i} className="flex items-center justify-between rounded-xl border border-border/60 bg-card/40 px-3 py-2 text-sm">
                    <span className="flex items-center gap-2"><Paperclip className="h-3.5 w-3.5" /> {a.name}</span>
                    <span className="text-xs text-muted-foreground">{a.size}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">No attachments shared for this task.</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="glass rounded-2xl p-6">
            <h3 className="font-display font-semibold">Deadline</h3>
            <div className="mt-3 flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/15 text-primary">
                <CalendarDays className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-medium">
                  {new Date(task.dueDate).toLocaleDateString(undefined, { dateStyle: "medium" })}
                </div>
                <div className={`text-xs ${remaining.tone}`}>{remaining.label}</div>
              </div>
            </div>
          </div>

          <div className="glass rounded-2xl p-6">
            <h3 className="font-display font-semibold">Reward</h3>
            <div className="mt-3 flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-warning/15 text-warning">
                <Trophy className="h-5 w-5" />
              </div>
              <div>
                <div className="text-lg font-semibold">{task.points} pts</div>
                <div className="text-xs text-muted-foreground">Awarded on approval</div>
              </div>
            </div>
          </div>

          <div className="glass rounded-2xl p-6">
            <h3 className="font-display font-semibold">Task info</h3>
            <dl className="mt-4 space-y-3 text-sm">
              <Row label="Task ID">{taskId(task.id)}</Row>
              <Row label="Category">{task.category}</Row>
              <Row label="Priority"><PriorityBadge priority={task.priority} /></Row>
              <Row label="Status"><StatusBadge status={task.status} /></Row>
              <Row label="Assigned by">{creator}</Row>
              <Row label="Created">{new Date(task.createdAt).toLocaleDateString(undefined, { dateStyle: "medium" })}</Row>
            </dl>
          </div>
        </div>
      </div>
    </>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-right text-sm">{children}</dd>
    </div>
  );
}

type TimelineItem = {
  title: string;
  date: string;
  note?: string;
  icon: React.ComponentType<{ className?: string }>;
  dotBg: string;
  dotIcon: string;
};

function buildTimeline(task: Task, creator: string): TimelineItem[] {
  const fmt = (d: string | Date) =>
    new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric" });

  const created = new Date(task.createdAt);
  const started = new Date(created.getTime() + 2 * 86400000);
  const submitted = new Date(task.dueDate);
  submitted.setDate(submitted.getDate() - 1);

  const items: TimelineItem[] = [
    {
      title: "Task assigned",
      date: fmt(created),
      note: `Assigned by ${creator}`,
      icon: UserPlus,
      dotBg: "bg-primary/20",
      dotIcon: "text-primary",
    },
    {
      title: "Work started",
      date: fmt(started),
      note: "Marked as in progress",
      icon: PlayCircle,
      dotBg: "bg-primary/20",
      dotIcon: "text-primary",
    },
  ];

  if (task.reviewState || task.status === "completed") {
    items.push({
      title: "Submitted for review",
      date: fmt(submitted),
      note: task.attachments?.length ? `${task.attachments.length} attachment(s) included` : "Awaiting reviewer",
      icon: Send,
      dotBg: "bg-primary/20",
      dotIcon: "text-primary",
    });
  }

  if (task.reviewState === "approved") {
    items.push({
      title: "Approved",
      date: fmt(task.dueDate),
      note: `+${task.points} points awarded`,
      icon: CheckCircle2,
      dotBg: "bg-success/20",
      dotIcon: "text-success",
    });
  } else if (task.reviewState === "rejected") {
    items.push({
      title: "Changes requested",
      date: fmt(task.dueDate),
      note: task.rejectionReason ?? "Reviewer left feedback",
      icon: MessageSquare,
      dotBg: "bg-destructive/20",
      dotIcon: "text-destructive",
    });
  } else if (task.reviewState === "in_review") {
    items.push({
      title: "In review",
      date: "Pending",
      note: "Awaiting reviewer decision",
      icon: Eye,
      dotBg: "bg-primary/20",
      dotIcon: "text-primary",
    });
  }

  return items;
}
