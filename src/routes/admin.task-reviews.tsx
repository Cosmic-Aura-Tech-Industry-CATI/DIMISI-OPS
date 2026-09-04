import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  CalendarClock,
  CheckCircle2,
  Download,
  ClipboardCheck,
  FileText,
  Filter,
  MessageSquarePlus,
  Paperclip,
  Search,
  StickyNote,
  Trophy,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { IdBadge } from "@/components/id-badge";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { PriorityBadge } from "@/components/status-badge";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { employees, type Task } from "@/lib/mock-data";
import { logAudit } from "@/lib/audit-log";
import { useProjectsQuery } from "@/features/projects";
import { useTasksQuery, useReviewTask } from "@/features/tasks";
import {
  applySubmissions,
  downloadSubmissionFile,
  formatFileSize,
  useSubmissionMap,
  type Submission,
} from "@/lib/submission-store";

export const Route = createFileRoute("/admin/task-reviews")({
  head: () => ({
    meta: [
      { title: "Review Center — Poll Admin" },
      { name: "description", content: "Approve, reject, or comment on employee task submissions." },
      { property: "og:title", content: "Review Center — Poll Admin" },
      { property: "og:description", content: "Approve, reject, or comment on employee task submissions." },
    ],
  }),
  component: ReviewCenter,
});

type ReviewAction = "approve" | "reject" | "remarks";

const mockProofs: Record<string, { name: string; size: string; type: "image" | "pdf" | "doc" }[]> = {
  t11: [
    { name: "rate-limit-dashboard.png", size: "842 KB", type: "image" },
    { name: "runbook.pdf", size: "1.2 MB", type: "pdf" },
  ],
  t12: [
    { name: "retry-flow.pdf", size: "620 KB", type: "pdf" },
    { name: "dlq-metrics.png", size: "480 KB", type: "image" },
    { name: "postmortem.docx", size: "88 KB", type: "doc" },
  ],
  t13: [{ name: "cleanup-diff.txt", size: "12 KB", type: "doc" }],
  t14: [
    { name: "q2-uptime.pdf", size: "2.1 MB", type: "pdf" },
    { name: "incident-timeline.png", size: "710 KB", type: "image" },
  ],
};

const mockNotes: Record<string, string> = {
  t11: "Dashboard live at /internal/rate-limits. Grafana source pushed. Requires SRE alert wiring next sprint.",
  t12: "Backoff steps: 30s, 2m, 10m then DLQ. Load-tested at 3× peak; no drops.",
  t13: "Removed 7 crons, kept 2 with README references for finance exports.",
  t14: "Draft report attached. Waiting on final numbers from infra for the June 14 outage.",
};

function ReviewCenter() {
  const [query, setQuery] = useState("");
  const [priority, setPriority] = useState<string>("all");
  const [action, setAction] = useState<{ type: ReviewAction; task: Task } | null>(null);
  const [remarks, setRemarks] = useState("");

  const subs = useSubmissionMap();
  const { data: projects = [] } = useProjectsQuery();
  const { data: allTasks = [], isLoading } = useTasksQuery();
  const reviewMutation = useReviewTask({
    onSuccess: (updated, variables) => {
      const label = variables.isApproved ? "Submission approved" : "Submission rejected";
      toast.success(label, { description: updated.title });
      setAction(null);
      setRemarks("");
    },
    onError: (err) => {
      toast.error("Failed to submit review", {
        description: err.message || "Please try again.",
      });
    },
  });

  const submissions = useMemo(
    () => applySubmissions(allTasks, subs).filter((t) => t.reviewState === "in_review" || (t.status as string) === "In Review"),
    [allTasks, subs],
  );

  const filtered = submissions.filter((t) => {
    const q = query.trim().toLowerCase();
    const matchesQ = !q || t.title.toLowerCase().includes(q) || t.assignee.toLowerCase().includes(q) || (employees.find((e) => e.id === t.assigneeId)?.code.toLowerCase().includes(q) ?? false);
    const matchesP = priority === "all" || t.priority === priority;
    return matchesQ && matchesP;
  });

  const totalPoints = submissions.reduce((s, t) => s + t.points, 0);
  const highPriority = submissions.filter((t) => t.priority === "high").length;

  const handleAction = () => {
    if (!action) return;
    const isApproved = action.type === "approve";
    logAudit({
      category: "task",
      action:
        action.type === "approve" ? "Approved Submission"
        : action.type === "reject" ? "Rejected Submission"
        : "Sent Review Remarks",
      target: action.task.title,
      targetId: action.task.assigneeId || undefined,
      details: remarks.trim() || (action.type === "approve" ? `Submission approved — ${action.task.points} points awarded.` : "Reviewed submission."),
      status: action.type === "reject" ? "warning" : "success",
    });

    reviewMutation.mutate({
      id: action.task.id || action.task._id || "",
      isApproved,
      feedback: remarks.trim() || undefined,
    });
  };

  return (
    <>
      <PageHeader
        title="Review Center"
        subtitle="Approve, reject, or leave remarks on employee task submissions."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Pending review" value={submissions.length} icon={ClipboardCheck} accent="primary" />
        <StatCard label="High priority" value={highPriority} icon={Trophy} accent="warning" />
        <StatCard label="Points at stake" value={totalPoints} icon={Trophy} accent="success" />
      </div>

      <div className="glass flex flex-wrap items-center gap-2 rounded-2xl p-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by task or employee…"
            className="rounded-full pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger className="w-[160px] rounded-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All priorities</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="Nothing to review"
          description="You're all caught up. New submissions will appear here as employees send them for review."
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {filtered.map((task, i) => (
            <ReviewCard
              key={task.id}
              task={task}
              index={i}
              submission={subs[task.id]}
              projectName={task.projectId ? projects.find((p) => p.id === task.projectId || p._id === task.projectId)?.name : undefined}
              onAction={(type) => setAction({ type, task })}
            />
          ))}
        </div>
      )}

      <Dialog open={!!action} onOpenChange={(o) => { if (!o) { setAction(null); setRemarks(""); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {action?.type === "approve" && "Approve submission"}
              {action?.type === "reject" && "Reject submission"}
              {action?.type === "remarks" && "Add remarks"}
            </DialogTitle>
            <DialogDescription>
              {action?.task.title}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="remarks">
              {action?.type === "reject" ? "Reason (required)" : "Remarks (optional)"}
            </Label>
            <Textarea
              id="remarks"
              rows={4}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder={
                action?.type === "approve" ? "Great work! Anything to highlight?"
                : action?.type === "reject" ? "Explain what needs to change before resubmission…"
                : "Share a note with the employee…"
              }
              className="resize-none rounded-xl"
            />
            {action?.type === "approve" && (
              <p className="rounded-lg bg-success/10 px-3 py-2 text-xs text-success">
                {action.task.points} points will be awarded to {action.task.assignee}.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-md" onClick={() => setAction(null)}>Cancel</Button>
            <Button
              className={`rounded-full ${action?.type === "reject" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : action?.type === "approve" ? "bg-success text-success-foreground hover:bg-success/90" : "shadow-glow"}`}
              disabled={action?.type === "reject" && remarks.trim().length < 5}
              onClick={handleAction}
            >
              {action?.type === "approve" && <><CheckCircle2 className="mr-1.5 h-4 w-4" /> Approve</>}
              {action?.type === "reject" && <><XCircle className="mr-1.5 h-4 w-4" /> Reject</>}
              {action?.type === "remarks" && <><MessageSquarePlus className="mr-1.5 h-4 w-4" /> Send remarks</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ReviewCard({
  task,
  index,
  submission,
  projectName,
  onAction,
}: {
  task: Task;
  index: number;
  submission?: Submission;
  projectName?: string;
  onAction: (type: ReviewAction) => void;
}) {
  const emp = employees.find((e) => e.id === task.assigneeId);
  const days = Math.ceil((+new Date(task.dueDate) - Date.now()) / 86400000);
  const submittedOn = submission?.submittedAt
    ? new Date(submission.submittedAt)
    : new Date(new Date(task.dueDate).getTime() - 86400000);
  const proofs =
    task.attachments && task.attachments.length > 0
      ? task.attachments.map((a) => ({
          name: a.name,
          size: a.size,
          type: (a.name.endsWith(".png") || a.name.endsWith(".jpg") || a.name.endsWith(".jpeg") ? "image" : a.name.endsWith(".pdf") ? "pdf" : "doc") as "image" | "pdf" | "doc",
        }))
      : submission?.files && submission.files.length > 0
        ? submission.files.map((f) => ({
            name: f.name,
            size: formatFileSize(f.size),
            type: (f.type.startsWith("image/") ? "image" : f.type.includes("pdf") ? "pdf" : "doc") as "image" | "pdf" | "doc",
          }))
        : [];
  const note =
    submission?.issues?.trim() || task.notes || "Submitted for review — see details.";

  const deadlineTone =
    days < 0 ? "text-destructive"
    : days <= 3 ? "text-warning"
    : "text-muted-foreground";

  return (
    <article
      className="glass flex flex-col rounded-2xl p-5 transition-all hover:-translate-y-0.5 hover:shadow-glow animate-in fade-in slide-in-from-bottom-2"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Header: employee + task */}
      <header className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
            {emp?.avatar ?? "?"}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-sm font-medium">{emp?.name ?? task.assignee}</span>
              {emp && <IdBadge id={emp.code} />}
              <span className="text-[11px] text-muted-foreground">· {emp?.department ?? "—"}</span>
            </div>
            <h3 className="mt-0.5 line-clamp-1 font-display text-base font-semibold">{task.title}</h3>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <PriorityBadge priority={task.priority} />
              <span className="rounded-sm bg-secondary/60 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                {task.category}
              </span>
              <span className="inline-flex items-center gap-1 rounded-sm bg-warning/15 px-2 py-0.5 text-[10px] font-medium text-warning">
                <Trophy className="h-2.5 w-2.5" /> {task.points} pts
              </span>
            </div>
          </div>
        </div>
        <span className="shrink-0 rounded-sm bg-primary/15 px-2.5 py-1 text-[11px] font-medium text-primary">
          Pending review
        </span>
      </header>

      {/* Meta rows */}
      <dl className="mt-4 grid grid-cols-2 gap-2 rounded-xl border border-border/60 bg-card/40 p-3 text-xs">
        <div>
          <dt className="flex items-center gap-1 text-muted-foreground">
            <FileText className="h-3 w-3" /> Submission
          </dt>
          <dd className="mt-0.5 font-medium">
            {submittedOn.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
          </dd>
        </div>
        <div>
          <dt className="flex items-center gap-1 text-muted-foreground">
            <CalendarClock className="h-3 w-3" /> Deadline
          </dt>
          <dd className={`mt-0.5 font-medium ${deadlineTone}`}>
            {new Date(task.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
            <span className="ml-1 text-[10px]">
              ({days < 0 ? `${-days}d late` : days === 0 ? "today" : `${days}d left`})
            </span>
          </dd>
        </div>
        <div>
          <dt className="flex items-center gap-1 text-muted-foreground">
            <FileText className="h-3 w-3" /> Project
          </dt>
          <dd className="mt-0.5 font-medium">{projectName ?? "General"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Status</dt>
          <dd className="mt-0.5 font-medium text-primary">Submitted</dd>
        </div>
      </dl>

      {/* Notes */}
      <div className="mt-3">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <StickyNote className="h-3 w-3" /> Issues faced
        </div>
        <p className="mt-1 line-clamp-2 text-sm">{note}</p>
      </div>

      {/* Proof */}
      <div className="mt-3">
        <div className="mb-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Paperclip className="h-3 w-3" /> Proof ({submission?.files?.length ?? proofs.length})
        </div>
        {submission?.files?.length ? (
          <ul className="grid gap-1.5 sm:grid-cols-2">
            {submission.files.map((f) => {
              const tone =
                f.type === "application/pdf" ? "bg-destructive/15 text-destructive"
                : f.type.startsWith("image/") ? "bg-primary/15 text-primary"
                : "bg-secondary/70 text-foreground";
              return (
                <li key={f.id} className="flex items-center gap-2 rounded-md border border-border/60 bg-card/40 px-2.5 py-1.5 text-xs">
                  <span className={`grid h-6 w-6 place-items-center rounded-md ${tone}`}>
                    <FileText className="h-3 w-3" />
                  </span>
                  <span className="min-w-0 flex-1 truncate">{f.name}</span>
                  <span className="shrink-0 text-[10px] text-muted-foreground">{formatFileSize(f.size)}</span>
                  <button
                    type="button"
                    onClick={() => downloadSubmissionFile(f)}
                    className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-primary/10 hover:text-primary"
                    aria-label={`Download ${f.name}`}
                  >
                    <Download className="h-3.5 w-3.5" />
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
        <ul className="grid gap-1.5 sm:grid-cols-2">
          {proofs.map((p, i) => {
            const tone =
              p.type === "pdf" ? "bg-destructive/15 text-destructive"
              : p.type === "image" ? "bg-primary/15 text-primary"
              : "bg-secondary/70 text-foreground";
            return (
              <li key={i} className="flex items-center gap-2 rounded-lg border border-border/60 bg-card/40 px-2.5 py-1.5 text-xs">
                <span className={`grid h-6 w-6 place-items-center rounded-md ${tone}`}>
                  <FileText className="h-3 w-3" />
                </span>
                <span className="min-w-0 flex-1 truncate">{p.name}</span>
                <span className="shrink-0 text-[10px] text-muted-foreground">{p.size}</span>
              </li>
            );
          })}
        </ul>
        )}
      </div>

      {/* Actions */}
      <div className="mt-4 grid grid-cols-3 gap-2">
        <Button
          className="rounded-full bg-success text-success-foreground hover:bg-success/90"
          onClick={() => onAction("approve")}
        >
          <CheckCircle2 className="mr-1.5 h-4 w-4" /> Approve
        </Button>
        <Button
          variant="outline"
          className="rounded-full border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={() => onAction("reject")}
        >
          <XCircle className="mr-1.5 h-4 w-4" /> Reject
        </Button>
        <Button
          variant="outline"
          className="rounded-full"
          onClick={() => onAction("remarks")}
        >
          <MessageSquarePlus className="mr-1.5 h-4 w-4" /> Remarks
        </Button>
      </div>
    </article>
  );
}
