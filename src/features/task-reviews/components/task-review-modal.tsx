import React, { useState, useEffect } from "react";
import { CheckCircle2, XCircle, ShieldCheck, User, Mail, StickyNote, Trophy, Calendar } from "lucide-react";
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
import { useReviewTaskMutation, type Task } from "@/features/tasks";

interface TaskReviewModalProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function TaskReviewModal({
  task,
  open,
  onOpenChange,
  onSuccess,
}: TaskReviewModalProps) {
  const [feedback, setFeedback] = useState("");
  const [pendingAction, setPendingAction] = useState<"approve" | "reject" | null>(null);

  const reviewMutation = useReviewTaskMutation({
    onSuccess: () => {
      onOpenChange(false);
      setFeedback("");
      setPendingAction(null);
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
    }
  }, [open]);

  if (!task) return null;

  const handleReview = (isApproved: boolean) => {
    const trimmed = feedback.trim();
    if (!isApproved && trimmed.length < 5) {
      toast.error("Feedback required for rejection", {
        description: "Please enter at least 5 characters explaining what needs to be revised.",
      });
      return;
    }

    setPendingAction(isApproved ? "approve" : "reject");
    reviewMutation.mutate({
      id: task._id || task.id,
      isApproved,
      feedback: trimmed || undefined,
    });
  };

  const isRejectDisabled = feedback.trim().length < 5 || reviewMutation.isPending;
  const isApproveDisabled = reviewMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl sm:rounded-3xl border-border/60 bg-background/95 backdrop-blur-xl">
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
              Examine the employee&apos;s deliverables, award reward points, or request revisions.
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
                <TaskStatusBadge status={task.status || "IN_REVIEW"} />
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
                  <div className="font-medium truncate">{task.assignee || "Assigned Employee"}</div>
                  {task.assigneeEmail && (
                    <div className="text-[11px] text-muted-foreground truncate flex items-center gap-1">
                      <Mail className="h-2.5 w-2.5" /> {task.assigneeEmail}
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

          {/* Employee Submission Notes */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <StickyNote className="h-3.5 w-3.5 text-primary" /> Submitted Work & Notes
            </div>
            <div className="rounded-2xl border border-border/60 bg-muted/30 p-3.5 text-sm whitespace-pre-line text-foreground/90 max-h-48 overflow-y-auto">
              {task.notes || "No submission notes provided."}
            </div>
          </div>

          {/* Admin Feedback Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="admin-feedback" className="text-sm font-medium">
                Admin Feedback / Evaluation Remarks
              </Label>
              <span className="text-xs text-muted-foreground">
                (Required for rejection)
              </span>
            </div>
            <Textarea
              id="admin-feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={3}
              disabled={reviewMutation.isPending}
              placeholder="e.g. Excellent implementation. All acceptance criteria met."
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
  );
}
