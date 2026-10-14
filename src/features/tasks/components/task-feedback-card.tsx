import React from "react";
import {
  MessageSquareQuote,
  MessageSquareOff,
  User,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  History,
  Info,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Task, TaskReviewFeedback } from "../types";
import { useAuth } from "@/lib/auth";

interface TaskFeedbackCardProps {
  task: Task;
  className?: string;
  showTaskTitle?: boolean;
}

function formatReviewDate(dateStr?: string): string {
  if (!dateStr) return "Recently";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

export function TaskFeedbackCard({
  task,
  className = "",
  showTaskTitle = false,
}: TaskFeedbackCardProps) {
  const { user } = useAuth();
  const currentUserId = user?.id || user?._id || "";

  // Strict employee isolation: employees should only see feedback associated with their own tasks
  const isMyTask =
    !user ||
    user.role === "admin" ||
    user.role === "director" ||
    task.assigneeId === currentUserId ||
    task.submittedById === currentUserId ||
    (user.name && task.assignee?.toLowerCase() === user.name.toLowerCase()) ||
    (user.email && task.assigneeEmail?.toLowerCase() === user.email.toLowerCase()) ||
    (user.email && task.assignee?.toLowerCase() === user.email.toLowerCase());

  const hasFeedback = Boolean(isMyTask && task.feedback && task.feedback.trim().length > 0);
  const reviewer = task.reviewedBy || "Admin";
  const reviewDate = formatReviewDate(task.reviewedAt);

  const isApproved =
    task.reviewStatus === "approved" ||
    task.status === "completed" ||
    task.reviewState === "approved";

  const isRejected =
    task.reviewStatus === "rejected" ||
    task.reviewState === "rejected" ||
    Boolean(task.rejectionReason);

  const reviewHistory = Array.isArray(task.reviews) ? task.reviews : [];

  if (!hasFeedback) {
    return (
      <div
        className={`glass rounded-2xl p-6 text-center border border-dashed border-border/70 ${className}`}
      >
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-muted/40 text-muted-foreground/60 mb-3">
          <MessageSquareOff className="h-6 w-6" />
        </div>
        <h4 className="font-semibold text-sm text-foreground">
          No feedback available yet.
        </h4>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
          Feedback provided by the administrator will appear here once your submission has been reviewed.
        </p>
      </div>
    );
  }

  return (
    <div
      className={`glass rounded-2xl p-6 space-y-4 border border-border/60 transition-all ${className}`}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border/40">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10 text-primary">
            <MessageSquareQuote className="h-4 w-4" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display font-semibold text-sm leading-tight text-foreground">
                Feedback Received
              </h3>
              {task.isFeedbackTemporary && (
                <span className="inline-flex items-center gap-1 rounded-md bg-muted/60 border border-border/50 px-2 py-0.5 text-[10px] text-muted-foreground" title="Locally cached feedback preview">
                  <Info className="h-2.5 w-2.5" /> Temporary local preview
                </span>
              )}
            </div>
            {showTaskTitle && (
              <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                Task: <span className="font-medium text-foreground">{task.title}</span>
              </p>
            )}
          </div>
        </div>

        {/* Review Status Badge */}
        {isApproved ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 text-xs font-semibold text-emerald-400 shadow-sm">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Approved
          </span>
        ) : isRejected ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/15 border border-rose-500/30 px-3 py-1 text-xs font-semibold text-rose-400 shadow-sm">
            <AlertCircle className="h-3.5 w-3.5" />
            Revision Requested
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 px-3 py-1 text-xs font-semibold text-amber-400 shadow-sm">
            <Clock className="h-3.5 w-3.5" />
            Under Review
          </span>
        )}
      </div>

      {/* Reviewer & Date Metadata */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <User className="h-3.5 w-3.5 text-primary" />
          <span>
            Reviewed by:{" "}
            <strong className="text-foreground font-semibold">{reviewer}</strong>
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-primary" />
          <span>{reviewDate}</span>
        </div>
      </div>

      {/* Feedback Message Box */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm text-foreground/95 shadow-inner">
        <div className="text-[11px] uppercase tracking-wider text-primary font-semibold mb-1 flex items-center gap-1">
          <ShieldCheck className="h-3 w-3" /> Reviewer Remarks
        </div>
        <p className="whitespace-pre-line leading-relaxed font-sans">
          "{task.feedback}"
        </p>
      </div>

      {/* Review History (if more than one review recorded) */}
      {reviewHistory.length > 1 && (
        <div className="pt-2 border-t border-border/30 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <History className="h-3 w-3 text-muted-foreground" /> Review History ({reviewHistory.length})
          </div>
          <div className="space-y-2">
            {reviewHistory.map((rev, idx) => (
              <div
                key={rev._id || idx}
                className="rounded-lg border border-border/40 bg-card/40 p-2.5 text-xs space-y-1"
              >
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {rev.reviewerName || "Admin"} · {rev.status === "approved" ? "Approved" : "Revision Requested"}
                  </span>
                  <span>{formatReviewDate(rev.reviewedAt)}</span>
                </div>
                <p className="text-muted-foreground italic">"{rev.feedback}"</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
