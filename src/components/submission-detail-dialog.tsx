import { CalendarClock, CheckCircle2, Download, Paperclip, Trophy, User } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PriorityBadge, StatusBadge } from "@/components/status-badge";
import {
  downloadSubmissionFile,
  formatFileSize,
  useSubmission,
} from "@/lib/submission-store";
import type { Task } from "@/lib/mock-data";

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

export function SubmissionDetailDialog({
  task,
  open,
  onOpenChange,
}: {
  task: Task;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const submission = useSubmission(task.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="pr-6 text-left font-display text-lg leading-snug">
            Submission details
          </DialogTitle>
          <DialogDescription className="text-left">
            What you submitted for “{task.title}”.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={task.status} />
            <PriorityBadge priority={task.priority} />
            <span className="inline-flex items-center gap-1 rounded-sm bg-warning/15 px-2.5 py-0.5 text-xs font-medium text-warning">
              <Trophy className="h-3 w-3" /> {task.points} pts
            </span>
          </div>

          <section>
            <h3 className="text-sm font-medium">Description you submitted</h3>
            <p className="mt-2 whitespace-pre-line rounded-xl border border-border/60 bg-card/40 p-3 text-sm leading-relaxed text-muted-foreground">
              {submission?.issues?.trim() ||
                "No description or notes were added with this submission."}
            </p>
          </section>

          <section>
            <h3 className="flex items-center gap-2 text-sm font-medium">
              <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
              Submitted files ({submission?.files.length ?? 0})
            </h3>
            {submission?.files.length ? (
              <ul className="mt-2 space-y-2">
                {submission.files.map((f) => (
                  <li
                    key={f.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-card/40 px-3 py-2 text-sm"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <Paperclip className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <span className="truncate">{f.name}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {formatFileSize(f.size)}
                      </span>
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="shrink-0 rounded-md"
                      onClick={() => downloadSubmissionFile(f)}
                    >
                      <Download className="mr-1.5 h-3.5 w-3.5" /> Download
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">
                No proof files were attached to this submission.
              </p>
            )}
          </section>

          <section className="grid gap-3 rounded-xl border border-border/60 bg-card/40 p-3 text-sm sm:grid-cols-2">
            <Row icon={CalendarClock} label="Submitted at">
              {fmt(submission?.submittedAt ?? submission?.updatedAt)}
            </Row>
            <Row icon={User} label="Submitted by">
              {submission?.employeeName ?? task.assignee ?? "—"}
            </Row>
            <Row icon={User} label="Employee ID">
              {submission?.employeeCode ?? "—"}
            </Row>
            <Row icon={CheckCircle2} label="Status">
              {submission?.status === "draft" ? "Draft" : "Submitted"}
            </Row>
          </section>

          {submission && (
            <section>
              <h3 className="text-sm font-medium">Checklist</h3>
              <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                {[
                  ["Task completed", submission.checklist.completed],
                  ["Proof attached", submission.checklist.proof],
                  ["Information verified", submission.checklist.verified],
                ].map(([label, done]) => (
                  <li key={label as string} className="flex items-center gap-2">
                    <CheckCircle2
                      className={`h-4 w-4 ${done ? "text-success" : "text-muted-foreground/40"}`}
                    />
                    {label}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {task.rejectionReason && (
            <section className="rounded-xl border border-destructive/30 bg-destructive/10 p-3">
              <h3 className="text-sm font-medium text-destructive">Reviewer comment</h3>
              <p className="mt-1 text-sm text-destructive/90">{task.rejectionReason}</p>
            </section>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Row({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="h-3 w-3" /> {label}
      </dt>
      <dd className="text-right text-sm">{children}</dd>
    </div>
  );
}
