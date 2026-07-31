import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Download,
  FileQuestion,
  FileText,
  Paperclip,
  Trophy,
  User,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { PriorityBadge, StatusBadge } from "@/components/status-badge";
import { useAllTasks } from "@/lib/task-store";
import {
  downloadSubmissionFile,
  formatFileSize,
  useSubmission,
} from "@/lib/submission-store";

export const Route = createFileRoute("/employee/tasks/$id/submission")({
  head: () => ({
    meta: [
      { title: "Submission Details — Dimisi" },
      {
        name: "description",
        content: "Review the files and description you submitted for this task.",
      },
      { property: "og:title", content: "Submission Details — Dimisi" },
      {
        property: "og:description",
        content: "Files and notes attached to your task submission.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SubmissionDetailsPage,
});

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

function SubmissionDetailsPage() {
  const { id } = useParams({ from: "/employee/tasks/$id/submission" });
  const task = useAllTasks().find((t) => t.id === id);
  const submission = useSubmission(id);

  if (!task) {
    return (
      <EmptyState
        icon={FileQuestion}
        title="Task not found"
        description="This task may have been reassigned or removed."
        action={
          <Button asChild>
            <Link to="/employee/tasks">Back to my tasks</Link>
          </Button>
        }
      />
    );
  }

  return (
    <>
      <div>
        <Link
          to="/employee/completed"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </Link>
      </div>

      <PageHeader
        title="Submission details"
        subtitle={`What you submitted for “${task.title}”.`}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <section className="glass rounded-2xl p-6">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={task.status} />
              <PriorityBadge priority={task.priority} />
              <span className="inline-flex items-center gap-1 rounded-sm bg-warning/15 px-2.5 py-0.5 text-xs font-medium text-warning">
                <Trophy className="h-3 w-3" /> {task.points} pts
              </span>
            </div>

            <div className="mt-5 flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <h2 className="font-display font-semibold">Description you submitted</h2>
            </div>
            <p className="mt-2 whitespace-pre-line rounded-xl border border-border/60 bg-card/40 p-3 text-sm leading-relaxed text-muted-foreground">
              {submission?.issues?.trim() ||
                "No description or notes were added with this submission."}
            </p>

            <div className="mt-6 flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <h2 className="font-display font-semibold">Task description</h2>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {task.description}
            </p>
          </section>

          <section className="glass rounded-2xl p-6">
            <div className="flex items-center gap-2">
              <Paperclip className="h-4 w-4 text-muted-foreground" />
              <h2 className="font-display font-semibold">
                Submitted files ({submission?.files.length ?? 0})
              </h2>
            </div>
            {submission?.files.length ? (
              <ul className="mt-3 space-y-2">
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

          {task.rejectionReason && (
            <section className="rounded-2xl border border-destructive/30 bg-destructive/10 p-5">
              <h2 className="text-sm font-medium text-destructive">Reviewer comment</h2>
              <p className="mt-1 text-sm text-destructive/90">{task.rejectionReason}</p>
            </section>
          )}
        </div>

        <aside className="space-y-4">
          <div className="glass rounded-2xl p-6">
            <h2 className="font-display font-semibold">Submission info</h2>
            <dl className="mt-4 space-y-3 text-sm">
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
              <Row icon={Trophy} label="Reward">
                {task.points} pts
              </Row>
            </dl>
          </div>

          {submission && (
            <div className="glass rounded-2xl p-6">
              <h2 className="font-display font-semibold">Checklist</h2>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
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
            </div>
          )}
        </aside>
      </div>
    </>
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
