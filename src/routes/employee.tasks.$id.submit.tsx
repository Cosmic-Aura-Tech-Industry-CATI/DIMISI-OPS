import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  FileQuestion,
  FolderKanban,
  Loader2,
  Save,
  Send,
  ShieldCheck,
  Trophy,
  UploadCloud,
} from "lucide-react";
import { toast } from "sonner";
import { pushAdminNotif } from "@/lib/admin-notification-store";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PriorityBadge } from "@/components/status-badge";
import { ProofUploader, type ProofFile } from "@/components/proof-uploader";
import { type Task } from "@/features/tasks";
import { useTaskQuery, useSubmitTaskForReview, useStartTask } from "@/features/tasks";
import { useProjectsQuery } from "@/features/projects";
import { saveDraft, submitForReview, useSubmission } from "@/lib/submission-store";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/employee/tasks/$id/submit")({
  head: () => ({
    meta: [
      { title: "Task Submission — Dimisi" },
      { name: "description", content: "Complete your task submission before sending it for admin review." },
      { property: "og:title", content: "Task Submission — Dimisi" },
      { property: "og:description", content: "Attach proof, note issues, and send your task for admin review." },
    ],
  }),
  component: SubmitProofPage,
});

const taskTypeLabel: Record<string, string> = {
  universal: "Universal",
  project: "Project",
  direct: "Direct",
};

const statusLabel: Record<Task["status"], string> = {
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
  overdue: "Overdue",
  available: "Available",
  assigned: "Assigned",
};

const fmtDate = (v?: string) =>
  v ? new Date(v).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "—";

function SubmitProofPage() {
  const { id } = useParams({ from: "/employee/tasks/$id/submit" });
  const navigate = useNavigate();
  const auth = useAuth();
  const { data: task, isLoading } = useTaskQuery(id);
  const { data: projects = [] } = useProjectsQuery();
  const existing = useSubmission(id);

  const currentUserId = auth.user?.id || auth.user?._id || "";
  const currentUserName = auth.user?.name || "Employee";
  const currentUserCode = auth.user?.empId || auth.user?.code || "";

  const [files, setFiles] = useState<ProofFile[]>(existing?.files ?? []);
  const [workSummary, setWorkSummary] = useState(existing?.workSummary ?? "");
  const [deliverableLinks, setDeliverableLinks] = useState(existing?.deliverableLinks ?? "");
  const [issues, setIssues] = useState(existing?.issues ?? "");
  const [additionalRemarks, setAdditionalRemarks] = useState(existing?.additionalRemarks ?? "");
  const [checks, setChecks] = useState({
    completed: existing?.checklist.completed ?? true,
    proof: existing?.checklist.proof ?? true,
    verified: existing?.checklist.verified ?? true,
  });
  const [confirmOpen, setConfirmOpen] = useState(false);

  const startTaskMutation = useStartTask();
  const submitMutation = useSubmitTaskForReview({
    onSuccess: (updated) => {
      submitForReview({
        taskId: updated.id || id,
        employeeId: currentUserId,
        employeeName: currentUserName,
        employeeCode: currentUserCode,
        workSummary: workSummary.trim(),
        deliverableLinks: deliverableLinks.trim(),
        issues: issues.trim(),
        additionalRemarks: additionalRemarks.trim(),
        files: files.map((f) => ({ id: f.id, name: f.name, size: f.size, type: f.type, dataUrl: f.dataUrl })),
        checklist: checks,
      });
      toast.success("Task submitted for review successfully.");
      setConfirmOpen(false);
      navigate({ to: "/employee/pending-review" });
    },
    onError: (err) => {
      setConfirmOpen(false);
      toast.error(err.message || "Failed to submit task for review.");
    },
  });

  if (isLoading) {
    return (
      <div className="glass flex flex-col items-center justify-center rounded-2xl py-20 text-muted-foreground">
        <p className="text-sm">Loading task...</p>
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

  const project = task.projectId ? projects.find((p) => p.id === task.projectId || p._id === task.projectId) : undefined;
  const assignedBy = task.createdBy || "Admin";
  const currentStatus = task.reviewState === "in_review" ? "Pending Review" : statusLabel[task.status];

  const packageInput = () => ({
    taskId: task.id || task._id || id,
    employeeId: currentUserId,
    employeeName: currentUserName,
    employeeCode: currentUserCode,
    workSummary: workSummary.trim(),
    deliverableLinks: deliverableLinks.trim(),
    issues: issues.trim(),
    additionalRemarks: additionalRemarks.trim(),
    files: files.map((f) => ({ id: f.id, name: f.name, size: f.size, type: f.type, dataUrl: f.dataUrl })),
    checklist: checks,
  });

  const allChecked = checks.completed && checks.proof && checks.verified;
  const isPending = submitMutation.isPending || startTaskMutation.isPending;

  const handleOpenConfirm = () => {
    if (!workSummary.trim() && !deliverableLinks.trim() && files.length === 0) {
      toast.error("Proof or Work Summary required", {
        description: "Please enter a work summary, deliverable link, or attach proof files before submitting.",
      });
      return;
    }
    setConfirmOpen(true);
  };

  const handleSaveDraft = () => {
    saveDraft(packageInput());
    toast.success("Draft saved", { description: "Your progress is stored — task remains In Progress." });
  };

  const handleSubmit = async () => {
    if (!task) return;
    const fileSummary = files.length > 0 ? `Proof files attached (${files.length}): ${files.map((f) => f.name).join(", ")}` : "";
    const formattedNotes = [
      workSummary.trim() ? `Work Summary:\n${workSummary.trim()}` : "",
      deliverableLinks.trim() ? `Deliverables & Links:\n${deliverableLinks.trim()}` : "",
      fileSummary ? fileSummary : "",
      issues.trim() ? `Issues & Blockers:\n${issues.trim()}` : "",
      additionalRemarks.trim() ? `Additional Remarks:\n${additionalRemarks.trim()}` : "",
    ].filter(Boolean).join("\n\n") || "Task completed and submitted for review.";

    const targetId = task.id || task._id || id;
    const normStatus = (task.rawStatus || task.status || "").toLowerCase();

    try {
      // Step 1: Ensure task transitions to IN_PROGRESS on backend if ASSIGNED
      if (
        normStatus === "assigned" ||
        normStatus === "pending" ||
        normStatus === "open"
      ) {
        try {
          await startTaskMutation.mutateAsync(targetId);
        } catch (startErr) {
          console.warn("[submit] Auto-start step error:", startErr);
        }
      }

      // Step 2: Submit task for review (IN_PROGRESS -> IN_REVIEW)
      await submitMutation.mutateAsync({
        id: targetId,
        notes: formattedNotes,
      });
    } catch (err: any) {
      // Handled via submitMutation onError callback
    }
  };

  const info: { label: string; value: React.ReactNode; icon?: typeof Trophy }[] = [
    { label: "Task Name", value: task.title },
    { label: "Project Name", value: project?.name ?? (task.taskType === "project" ? "—" : "General"), icon: FolderKanban },
    { label: "Task Category", value: `${task.category} · ${taskTypeLabel[task.taskType ?? "direct"]}` },
    { label: "Priority", value: <PriorityBadge priority={task.priority} /> },
    { label: "Reward Points", value: `${task.points} pts`, icon: Trophy },
    { label: "Assigned Date", value: fmtDate(task.assignedAt ?? task.createdAt) },
    { label: "Deadline", value: fmtDate(task.dueDate), icon: CalendarClock },
    { label: "Current Status", value: currentStatus },
    { label: "Assigned By", value: assignedBy },
  ];

  return (
    <>
      <div>
        <Link
          to="/employee/tasks/$id"
          params={{ id: task.id }}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to task
        </Link>
      </div>

      <PageHeader
        title="Task Submission"
        subtitle="Complete your task proof submission before sending it for admin review."
      />

      {task.rejectionReason && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 shadow-sm animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center gap-2">
            <span className="grid h-5 w-5 place-items-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">!</span>
            <p className="text-xs font-bold uppercase tracking-wider text-destructive">Revision Required</p>
          </div>
          <p className="mt-2 text-sm font-medium text-destructive">
            <span className="font-semibold">Admin Feedback:</span> {task.rejectionReason}
          </p>
          <p className="mt-1 text-xs text-destructive/80">Please review the feedback above, update your proof or notes, and resubmit.</p>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {/* Section 1 — Task information */}
          <section className="glass rounded-md p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-primary" />
              <h2 className="font-display text-base font-semibold">Task Information</h2>
              <span className="rounded-sm bg-secondary/60 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Read only
              </span>
            </div>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {info.map((row) => (
                <div key={row.label} className="rounded-md border border-border/60 bg-card/40 p-3">
                  <dt className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
                    {row.icon && <row.icon className="h-3 w-3" />} {row.label}
                  </dt>
                  <dd className="mt-1 text-sm font-medium">{row.value}</dd>
                </div>
              ))}
            </dl>
          </section>

          {/* Section 2 — Description */}
          <section className="glass rounded-md p-5 sm:p-6">
            <h2 className="font-display text-base font-semibold">Task Description</h2>
            <p className="mt-3 whitespace-pre-line rounded-md border border-border/60 bg-card/40 p-4 text-sm leading-relaxed text-muted-foreground">
              {task.description || "No description provided."}
            </p>
            {task.notes && (
              <p className="mt-3 whitespace-pre-line rounded-md border border-border/60 bg-card/40 p-4 text-sm leading-relaxed text-muted-foreground">
                {task.notes}
              </p>
            )}
          </section>

          {/* Section 3 — Work Summary */}
          <section className="glass rounded-md p-5 sm:p-6">
            <Label htmlFor="workSummary" className="font-display text-base font-semibold">
              Work Summary <span className="text-xs font-normal text-muted-foreground">(key deliverables & results)</span>
            </Label>
            <Textarea
              id="workSummary"
              value={workSummary}
              onChange={(e) => setWorkSummary(e.target.value)}
              placeholder="Summarize the work completed, key features implemented, or technical changes made..."
              rows={4}
              className="mt-3 resize-none rounded-md"
            />
          </section>

          {/* Section 4 — Deliverables & Links */}
          <section className="glass rounded-md p-5 sm:p-6">
            <Label htmlFor="deliverableLinks" className="font-display text-base font-semibold">
              Deliverables & Links <span className="text-xs font-normal text-muted-foreground">(URLs, PRs, docs, live previews)</span>
            </Label>
            <Textarea
              id="deliverableLinks"
              value={deliverableLinks}
              onChange={(e) => setDeliverableLinks(e.target.value)}
              placeholder="Paste links to Pull Requests, GitHub repos, Figma designs, staging deployments, or documentation..."
              rows={3}
              className="mt-3 resize-none rounded-md"
            />
          </section>

          {/* Section 5 — Issues Faced */}
          <section className="glass rounded-md p-5 sm:p-6">
            <Label htmlFor="issues" className="font-display text-base font-semibold">
              Issues Faced <span className="text-xs font-normal text-muted-foreground">(optional challenges/blockers)</span>
            </Label>
            <Textarea
              id="issues"
              value={issues}
              onChange={(e) => setIssues(e.target.value)}
              placeholder="Describe any challenges, blockers, technical debt, or edge cases encountered during development..."
              rows={3}
              className="mt-3 resize-none rounded-md"
            />
          </section>

          {/* Section 6 — Additional Remarks */}
          <section className="glass rounded-md p-5 sm:p-6">
            <Label htmlFor="additionalRemarks" className="font-display text-base font-semibold">
              Additional Remarks <span className="text-xs font-normal text-muted-foreground">(optional notes for reviewer)</span>
            </Label>
            <Textarea
              id="additionalRemarks"
              value={additionalRemarks}
              onChange={(e) => setAdditionalRemarks(e.target.value)}
              placeholder="Any extra comments, handover instructions, or notes for the reviewer..."
              rows={3}
              className="mt-3 resize-none rounded-md"
            />
          </section>

          {/* Section 7 — Proof Attachments */}
          <section className="glass rounded-md p-5 sm:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <UploadCloud className="h-4 w-4 text-primary" />
                <h2 className="font-display text-base font-semibold">Upload Proof Files</h2>
              </div>
              <span className="rounded-sm bg-secondary/60 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                {files.length} file{files.length === 1 ? "" : "s"} attached
              </span>
            </div>
            <ProofUploader files={files} onChange={setFiles} />
          </section>

          {/* Section 8 — Checklist */}
          <section className="glass rounded-md p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <h2 className="font-display text-base font-semibold">Submission Checklist</h2>
            </div>
            <div className="mt-4 space-y-2">
              {[
                { key: "completed" as const, label: "Task completed according to requirements." },
                { key: "proof" as const, label: "Proof files or deliverable links provided." },
                { key: "verified" as const, label: "Deliverables tested and verified before submission." },
              ].map((row) => (
                <label
                  key={row.key}
                  className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md border border-border/60 bg-card/40 px-3 py-2.5 text-sm transition-colors hover:border-primary/50"
                >
                  <Checkbox
                    checked={checks[row.key]}
                    onCheckedChange={(v) => setChecks((c) => ({ ...c, [row.key]: v === true }))}
                    disabled={row.key === "proof" && files.length === 0 && !deliverableLinks.trim()}
                  />
                  <span>{row.label}</span>
                </label>
              ))}
            </div>
            {!allChecked && (
              <p className="mt-3 text-xs text-muted-foreground">
                All checklist items must be confirmed before you can submit for review.
              </p>
            )}
          </section>

          {/* Section 9 — Buttons */}
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button asChild type="button" variant="outline" className="rounded-md">
              <Link to="/employee/tasks">Cancel</Link>
            </Button>
            <Button type="button" variant="outline" className="rounded-md" onClick={handleSaveDraft}>
              <Save className="mr-1.5 h-4 w-4" /> Save Draft
            </Button>
            <Button
              type="button"
              disabled={isPending}
              className="rounded-md shadow-glow"
              onClick={handleOpenConfirm}
            >
              <Send className="mr-1.5 h-4 w-4" /> Submit for Review
            </Button>
          </div>
        </div>

        {/* Summary rail */}
        <aside className="space-y-4">
          <div className="glass rounded-md p-5 sm:p-6">
            <h3 className="font-display font-semibold">Submission summary</h3>
            <dl className="mt-3 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-xs text-muted-foreground">Proof files</dt>
                <dd className="font-medium">{files.length}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-xs text-muted-foreground">Checklist</dt>
                <dd className="font-medium">{Object.values(checks).filter(Boolean).length}/3</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Trophy className="h-3.5 w-3.5 text-warning" /> Reward
                </dt>
                <dd className="font-medium">{task.points} pts</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-xs text-muted-foreground">Draft saved</dt>
                <dd className="font-medium">
                  {existing ? new Date(existing.updatedAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "—"}
                </dd>
              </div>
            </dl>
          </div>

          <div className="glass rounded-md p-5 sm:p-6">
            <h3 className="font-display font-semibold">Status flow</h3>
            <ol className="mt-3 space-y-2 text-sm">
              {["Assigned", "In Progress", "Submitted", "Pending Review"].map((s, i) => (
                <li key={s} className="flex items-center gap-2">
                  <CheckCircle2 className={`h-3.5 w-3.5 ${i < 2 ? "text-success" : "text-muted-foreground"}`} />
                  <span className={i < 2 ? "" : "text-muted-foreground"}>{s}</span>
                </li>
              ))}
            </ol>
          </div>
        </aside>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Submit Task for Review?</DialogTitle>
            <DialogDescription>
              After submission you cannot edit the uploaded proof until an Admin reviews this task.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" className="rounded-md" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button className="rounded-md shadow-glow" disabled={submitMutation.isPending || startTaskMutation.isPending} onClick={handleSubmit}>
              {submitMutation.isPending || startTaskMutation.isPending ? <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Submitting…</> : <><Send className="mr-1.5 h-4 w-4" /> Submit for Review</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
