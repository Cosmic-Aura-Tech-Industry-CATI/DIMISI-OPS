import {
  CalendarClock,
  Clock,
  ExternalLink,
  FileText,
  Paperclip,
  Tag,
  Trophy,
  User,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PriorityBadge } from "@/components/status-badge";
import type { Task } from "@/lib/mock-data";

const statusLabel: Record<Task["status"], string> = {
  pending: "Pending",
  in_progress: "In progress",
  completed: "Completed",
  overdue: "Overdue",
  available: "Available",
  assigned: "Assigned",
};

function Row({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-md border border-border/60 bg-card/40 p-3">
      <dt className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3 w-3" /> {label}
      </dt>
      <dd className="mt-1 break-words text-sm font-medium">{value}</dd>
    </div>
  );
}

export function TaskDetailDialog({
  task,
  open,
  onOpenChange,
}: {
  task: Task;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const fmt = (d?: string) =>
    d
      ? new Date(d).toLocaleString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
        })
      : "—";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            <PriorityBadge priority={task.priority} />
            <span className="rounded-sm bg-secondary/60 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              {task.category}
            </span>
            <span className="rounded-sm bg-primary/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-primary">
              {statusLabel[task.status]}
            </span>
          </div>
          <DialogTitle className="text-left font-display text-xl leading-snug">
            {task.title}
          </DialogTitle>
          <DialogDescription className="text-left">{task.id}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="mb-1 text-[11px] uppercase tracking-wider text-muted-foreground">
              Description
            </p>
            <p className="whitespace-pre-line text-sm text-muted-foreground">
              {task.description}
            </p>
          </div>

          <dl className="grid gap-3 sm:grid-cols-2">
            <Row
              icon={CalendarClock}
              label="Deadline"
              value={new Date(task.dueDate).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            />
            <Row icon={Trophy} label="Reward" value={`${task.points} pts`} />
            <Row icon={User} label="Assignee" value={task.assignee || "Unassigned"} />
            <Row icon={Tag} label="Task type" value={task.taskType ?? "direct"} />
            <Row icon={Clock} label="Estimated time" value={task.estimatedTime ?? "—"} />
            <Row icon={CalendarClock} label="Assigned at" value={fmt(task.assignedAt)} />
            <Row icon={FileText} label="Created" value={fmt(task.createdAt)} />
            <Row icon={User} label="Created by" value={task.createdBy ?? "—"} />
          </dl>

          {task.notes && (
            <div className="rounded-md border border-border/60 bg-card/40 p-3">
              <p className="mb-1 text-[11px] uppercase tracking-wider text-muted-foreground">
                Notes
              </p>
              <p className="text-sm text-muted-foreground">{task.notes}</p>
            </div>
          )}

          {task.rejectionReason && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3">
              <p className="mb-1 text-[11px] uppercase tracking-wider text-destructive">
                Rejection reason
              </p>
              <p className="text-sm text-destructive">{task.rejectionReason}</p>
            </div>
          )}

          {task.attachments && task.attachments.length > 0 && (
            <div>
              <p className="mb-2 text-[11px] uppercase tracking-wider text-muted-foreground">
                Attachments
              </p>
              <ul className="space-y-2">
                {task.attachments.map((a, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between gap-3 rounded-md border border-border/60 bg-card/40 px-3 py-2 text-sm"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <Paperclip className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <span className="truncate">{a.name}</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="shrink-0 text-xs text-muted-foreground">{a.size}</span>
                      {(a as { url?: string }).url && (
                        <a
                          href={(a as { url?: string }).url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" /> View
                        </a>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
