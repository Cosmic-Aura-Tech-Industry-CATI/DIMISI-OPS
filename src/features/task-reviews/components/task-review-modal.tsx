import React, { useState, useEffect } from "react";
import {
  CheckCircle2,
  XCircle,
  ShieldCheck,
  User,
  Mail,
  StickyNote,
  Trophy,
  Calendar,
  UploadCloud,
  FileText,
  FileImage,
  Eye,
  Download,
  Clock,
  ExternalLink,
  X,
  MessageSquare,
  CheckCheck,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TaskPriorityBadge, TaskStatusBadge } from "@/components/task-status-badge";
import { useReviewTaskMutation, type Task, type TaskProofFile } from "@/features/tasks";
import { getSubmission } from "@/lib/submission-store";
import { useAuth } from "@/lib/auth";

interface TaskReviewModalProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

function isImageProof(type?: string, name?: string): boolean {
  if (type && type.startsWith("image/")) return true;
  if (!name) return false;
  const ext = name.toLowerCase().slice(name.lastIndexOf("."));
  return ext === ".jpg" || ext === ".jpeg" || ext === ".png";
}

function isPdfProof(type?: string, name?: string): boolean {
  if (type === "application/pdf") return true;
  if (!name) return false;
  return name.toLowerCase().endsWith(".pdf");
}

export function TaskReviewModal({
  task,
  open,
  onOpenChange,
  onSuccess,
}: TaskReviewModalProps) {
  const { user } = useAuth();
  const [feedback, setFeedback] = useState("");
  const [pendingAction, setPendingAction] = useState<"approve" | "reject" | null>(null);
  const [previewFile, setPreviewFile] = useState<{ name: string; url: string; isImg: boolean; isPdf: boolean } | null>(null);

  const reviewMutation = useReviewTaskMutation({
    onSuccess: () => {
      toast.success("Feedback and task review saved successfully.");
      onOpenChange(false);
      setFeedback("");
      setPendingAction(null);
      setPreviewFile(null);
      onSuccess?.();
    },
    onError: () => {
      setPendingAction(null);
    },
  });

  useEffect(() => {
    if (open) {
      setFeedback("");
      setPendingAction(null);
      setPreviewFile(null);
    }
  }, [open]);

  if (!task) return null;

  const taskId = task._id || task.id;
  const localSub = taskId ? getSubmission(taskId) : undefined;

  // Resolve proof files (from API task.proofFiles, fallback to attachments, fallback to local submission store)
  const proofList: Array<{
    name: string;
    size?: string | number;
    url?: string;
    dataUrl?: string;
    mimeType?: string;
  }> = [];

  if (task.proofFiles && task.proofFiles.length > 0) {
    proofList.push(...task.proofFiles);
  } else if (localSub?.files && localSub.files.length > 0) {
    proofList.push(
      ...localSub.files.map((f) => ({
        name: f.name,
        size: typeof f.size === "number" ? `${Math.round(f.size / 1024)} KB` : String(f.size),
        url: f.dataUrl || "",
        dataUrl: f.dataUrl,
        mimeType: f.type,
      })),
    );
  } else if (task.attachments && task.attachments.length > 0) {
    proofList.push(
      ...task.attachments.map((a) => ({
        name: a.name,
        size: a.size,
        url: a.url,
      })),
    );
  }

  const submitterName =
    task.submittedBy || localSub?.employeeName || task.assignee || "Assigned Employee";
  const submitterCode = task.assigneeCode || localSub?.employeeCode;
  const submitterEmail = task.assigneeEmail;
  const submittedAt = task.submittedAt || localSub?.submittedAt;

  const handleReview = (isApproved: boolean) => {
    const trimmed = feedback.trim();
    if (!isApproved && trimmed.length < 5) {
      toast.error("Feedback required for rejection", {
        description: "Please enter at least 5 characters explaining what needs to be revised.",
      });
      return;
    }

    const feedbackMessage = trimmed || (isApproved ? "Approved by Admin" : "Revision requested by Admin");

    // Persist to local storage dimisi-task-reviews for optimistic persistence across refresh
    try {
      const cached = JSON.parse(localStorage.getItem("dimisi-task-reviews") || "{}");
      const existingReviews = Array.isArray(cached[taskId]?.reviews) ? cached[taskId].reviews : [];
      const newReviewItem = {
        reviewerName: user?.name || "Admin",
        reviewerEmail: user?.email || "",
        feedback: feedbackMessage,
        status: isApproved ? "approved" : "rejected",
        reviewedAt: new Date().toISOString(),
      };
      cached[taskId] = {
        feedback: feedbackMessage,
        reviewerName: user?.name || "Admin",
        reviewerEmail: user?.email || "",
        reviewedAt: new Date().toISOString(),
        reviewStatus: isApproved ? "approved" : "rejected",
        reviews: [...existingReviews, newReviewItem],
      };
      localStorage.setItem("dimisi-task-reviews", JSON.stringify(cached));
    } catch {
      // ignore
    }

    setPendingAction(isApproved ? "approve" : "reject");
    reviewMutation.mutate({
      id: taskId,
      isApproved,
      feedback: trimmed || undefined,
    });
  };

  const handleDownloadFile = (file: { name: string; url?: string; dataUrl?: string }) => {
    const downloadUrl = file.url || file.dataUrl;
    if (!downloadUrl) {
      toast.error("Download URL not available for this proof file.");
      return;
    }

    try {
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = file.name || "task-proof";
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success(`Downloading ${file.name}`);
    } catch {
      window.open(downloadUrl, "_blank");
    }
  };

  const handlePreviewFile = (file: { name: string; url?: string; dataUrl?: string; mimeType?: string }) => {
    const viewUrl = file.url || file.dataUrl;
    if (!viewUrl) {
      toast.error("Preview is not available for this file.");
      return;
    }

    const isImg = isImageProof(file.mimeType, file.name);
    const isPdf = isPdfProof(file.mimeType, file.name);

    if (isImg || isPdf) {
      setPreviewFile({
        name: file.name,
        url: viewUrl,
        isImg,
        isPdf,
      });
    } else {
      // For docs/others, trigger download or open in new tab
      window.open(viewUrl, "_blank");
    }
  };

  const isRejectDisabled = feedback.trim().length < 5 || reviewMutation.isPending;
  const isApproveDisabled = reviewMutation.isPending;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto sm:rounded-3xl border-border/60 bg-background/95 backdrop-blur-xl">
          <div className="space-y-5">
            <DialogHeader className="space-y-1.5 text-left">
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10 text-primary">
                  <ShieldCheck className="h-4 w-4" />
                </span>
                <DialogTitle className="font-display text-xl font-bold">
                  Review Task Submission
                </DialogTitle>
              </div>
              <DialogDescription className="text-xs text-muted-foreground">
                Examine the employee&apos;s deliverables, verify attached proof files, and award reward points.
              </DialogDescription>
            </DialogHeader>

            {/* Task & Assignee Details Card */}
            <div className="rounded-2xl border border-border/50 bg-card/40 p-4 space-y-4">
              {/* Header: Title & Badges */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="min-w-0">
                  <h4 className="font-semibold text-base leading-snug">{task.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1 whitespace-pre-line">{task.description}</p>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 shrink-0">
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
                  <TaskPriorityBadge priority={task.priority} />
                </div>
              </div>

              {/* Meta row: Assignee, Date, Points */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-3 border-t border-border/30 text-xs">
                <div className="flex items-center gap-2">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-primary/15 text-primary text-xs font-semibold">
                    <User className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0">
                    <div className="font-medium truncate">{submitterName}</div>
                    {submitterEmail && (
                      <div className="text-[11px] text-muted-foreground truncate flex items-center gap-1">
                        <Mail className="h-2.5 w-2.5" /> {submitterEmail}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary shrink-0" />
                  <div>
                    <div className="text-muted-foreground text-[11px]">Due Date</div>
                    <div className="font-medium">
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "No deadline"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-warning shrink-0" />
                  <div>
                    <div className="text-muted-foreground text-[11px]">Reward Points</div>
                    <div className="font-bold text-warning">
                      {task.points || task.rewardPoints || 0} pts
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* MANDATORY SUBMITTED PROOF SECTION */}
            <div className="rounded-2xl border border-border/60 bg-card/50 p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/15 text-primary">
                    <UploadCloud className="h-4 w-4" />
                  </span>
                  <div>
                    <h5 className="font-semibold text-sm leading-tight text-foreground">
                      Submitted Task Proof
                    </h5>
                    <p className="text-[11px] text-muted-foreground">
                      Attached by employee as evidence of completion
                    </p>
                  </div>
                </div>

                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  proofList.length > 0
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                    : "bg-destructive/15 text-destructive border border-destructive/30"
                }`}>
                  {proofList.length} proof file{proofList.length === 1 ? "" : "s"} attached
                </span>
              </div>

              {/* Attribution Line */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/30 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <User className="h-3 w-3 text-primary" />
                  Submitted by: <strong className="text-foreground">{submitterName}</strong> {submitterCode ? `(${submitterCode})` : ""}
                </span>
                {submittedAt && (
                  <span className="inline-flex items-center gap-1 text-[11px]">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    {new Date(submittedAt).toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                )}
              </div>

              {/* Proof Files List */}
              {proofList.length > 0 ? (
                <div className="space-y-2 pt-1">
                  {proofList.map((file, i) => {
                    const isImg = isImageProof(file.mimeType, file.name);
                    const isPdf = isPdfProof(file.mimeType, file.name);

                    return (
                      <div
                        key={`${file.name}-${i}`}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-border/60 bg-background/50 p-3 transition-colors hover:border-primary/40"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                            {isImg ? (
                              <FileImage className="h-5 w-5" />
                            ) : (
                              <FileText className="h-5 w-5" />
                            )}
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate text-foreground">
                              {file.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {file.size ? (typeof file.size === "number" ? `${Math.round(file.size / 1024)} KB` : String(file.size)) : "File"} · {file.name.slice(file.name.lastIndexOf(".")).toUpperCase() || "DOCUMENT"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => handlePreviewFile(file)}
                            className="h-8 gap-1.5 text-xs rounded-lg"
                          >
                            <Eye className="h-3.5 w-3.5" /> Preview
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={() => handleDownloadFile(file)}
                            className="h-8 gap-1.5 text-xs rounded-lg bg-secondary hover:bg-secondary/80"
                          >
                            <Download className="h-3.5 w-3.5" /> Download
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive flex items-center gap-2">
                  <XCircle className="h-4 w-4 shrink-0" />
                  <span>No proof file uploaded with this submission.</span>
                </div>
              )}
            </div>

            {/* Employee Submission Notes */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <StickyNote className="h-3.5 w-3.5 text-primary" /> Submitted Work & Notes
              </div>
              <div className="rounded-2xl border border-border/60 bg-muted/30 p-3.5 text-sm whitespace-pre-line text-foreground/90 max-h-40 overflow-y-auto">
                {task.notes || "No submission notes provided."}
              </div>
            </div>

            {/* Previous Review Feedback History (if any) */}
            {(task.feedback || (task.reviews && task.reviews.length > 0)) && (
              <div className="rounded-2xl border border-border/60 bg-muted/20 p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                  <span className="flex items-center gap-1.5 text-foreground/90 font-medium">
                    <MessageSquare className="h-3.5 w-3.5 text-primary" /> Previous Evaluation Feedback
                  </span>
                  {task.reviewedAt && (
                    <span className="text-[11px] font-normal text-muted-foreground">
                      {new Date(task.reviewedAt).toLocaleDateString(undefined, {
                        dateStyle: "medium",
                      })}
                    </span>
                  )}
                </div>
                {task.feedback && (
                  <div className="text-xs bg-background/50 border border-border/40 rounded-xl p-2.5 text-foreground/90 whitespace-pre-line">
                    "{task.feedback}"
                  </div>
                )}
                {task.reviewedBy && (
                  <p className="text-[11px] text-muted-foreground">
                    Reviewed by: <strong className="text-foreground">{task.reviewedBy}</strong>
                    {task.reviewStatus && (
                      <span className="ml-1.5 capitalize font-medium">
                        ({task.reviewStatus === "approved" ? "Approved" : "Revision Requested"})
                      </span>
                    )}
                  </p>
                )}
              </div>
            )}

            {/* Admin Feedback Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="admin-feedback" className="text-sm font-semibold flex items-center gap-1.5">
                  <MessageSquare className="h-4 w-4 text-primary" /> Written Feedback for Employee
                </Label>
                <span className="text-xs text-muted-foreground">
                  (Required for rejection, optional for approval)
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                This feedback will be saved against this submission and displayed to the employee on their task dashboard and details.
              </p>
              <Textarea
                id="admin-feedback"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={3}
                disabled={reviewMutation.isPending}
                placeholder="e.g. Excellent work on this task. Proof verified and meets all requirements."
                className="rounded-2xl resize-none font-sans text-sm"
              />
            </div>

            {/* Action Buttons */}
            <DialogFooter className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={reviewMutation.isPending}
                className="rounded-full"
              >
                Cancel
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleReview(false)}
                  disabled={isRejectDisabled}
                  className="rounded-full border-rose-500/40 text-rose-400 hover:bg-rose-500/10 hover:text-rose-400"
                >
                  {reviewMutation.isPending && pendingAction === "reject" ? (
                    "Rejecting…"
                  ) : (
                    <>
                      <XCircle className="mr-1.5 h-4 w-4" /> Reject & Request Changes
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  onClick={() => handleReview(true)}
                  disabled={isApproveDisabled}
                  className="rounded-full bg-emerald-600 text-white hover:bg-emerald-700 shadow-glow"
                >
                  {reviewMutation.isPending && pendingAction === "approve" ? (
                    "Approving…"
                  ) : (
                    <>
                      <CheckCircle2 className="mr-1.5 h-4 w-4" /> Approve & Award Points
                    </>
                  )}
                </Button>
              </div>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Lightbox / Preview Modal */}
      {previewFile && (
        <Dialog open={Boolean(previewFile)} onOpenChange={(open) => !open && setPreviewFile(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden sm:rounded-3xl border-border/60 bg-background/98 p-5">
            <DialogHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/40">
              <div className="min-w-0 pr-4">
                <DialogTitle className="text-base font-semibold truncate">
                  {previewFile.name}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Task Proof Preview
                </DialogDescription>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDownloadFile(previewFile)}
                className="h-8 gap-1.5 text-xs rounded-lg shrink-0"
              >
                <Download className="h-3.5 w-3.5" /> Download
              </Button>
            </DialogHeader>

            <div className="mt-3 flex items-center justify-center max-h-[70vh] overflow-auto rounded-2xl bg-black/20 p-2">
              {previewFile.isImg ? (
                <img
                  src={previewFile.url}
                  alt={previewFile.name}
                  className="max-h-[65vh] w-auto max-w-full rounded-xl object-contain shadow-md"
                />
              ) : previewFile.isPdf ? (
                <iframe
                  src={previewFile.url}
                  title={previewFile.name}
                  className="h-[65vh] w-full rounded-xl border-0"
                />
              ) : (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  <p>Preview not available for this file type.</p>
                  <Button
                    size="sm"
                    className="mt-3 gap-1.5 rounded-full"
                    onClick={() => handleDownloadFile(previewFile)}
                  >
                    <Download className="h-4 w-4" /> Download to view
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
