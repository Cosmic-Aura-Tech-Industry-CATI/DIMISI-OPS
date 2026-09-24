import React from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, Clock, PlayCircle, AlertCircle, XCircle, Sparkles } from "lucide-react";

export type TaskStatusType =
  | "OPEN"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "IN_REVIEW"
  | "COMPLETED"
  | "REJECTED"
  | "OVERDUE"
  | "CANCELLED"
  | "open"
  | "assigned"
  | "in_progress"
  | "in_review"
  | "completed"
  | "rejected"
  | "overdue"
  | "cancelled"
  | "available"
  | "pending";

interface TaskStatusBadgeProps {
  status: TaskStatusType | string;
  className?: string;
  showIcon?: boolean;
}

export function normalizeTaskStatus(status?: string): {
  key: "OPEN" | "ASSIGNED" | "IN_PROGRESS" | "IN_REVIEW" | "COMPLETED" | "REJECTED" | "OVERDUE";
  label: string;
} {
  const s = (status || "").toLowerCase().trim().replace(/[\s_-]+/g, "_");

  switch (s) {
    case "open":
    case "available":
      return { key: "OPEN", label: "Open" };
    case "assigned":
      return { key: "ASSIGNED", label: "Assigned" };
    case "in_progress":
      return { key: "IN_PROGRESS", label: "In Progress" };
    case "in_review":
    case "pending_review":
    case "review":
      return { key: "IN_REVIEW", label: "In Review" };
    case "completed":
    case "approved":
      return { key: "COMPLETED", label: "Completed" };
    case "rejected":
      return { key: "REJECTED", label: "Rejected" };
    case "overdue":
    case "cancelled":
      return { key: "OVERDUE", label: "Overdue" };
    default:
      return { key: "ASSIGNED", label: status ? status.replace(/_/g, " ") : "Assigned" };
  }
}

const statusConfig: Record<
  "OPEN" | "ASSIGNED" | "IN_PROGRESS" | "IN_REVIEW" | "COMPLETED" | "REJECTED" | "OVERDUE",
  { style: string; dot: string; icon: React.ComponentType<{ className?: string }> }
> = {
  OPEN: {
    style: "bg-primary/15 text-primary border-primary/20",
    dot: "bg-primary",
    icon: Sparkles,
  },
  ASSIGNED: {
    style: "bg-sky-500/15 text-sky-400 border-sky-500/20",
    dot: "bg-sky-400",
    icon: Clock,
  },
  IN_PROGRESS: {
    style: "bg-indigo-500/15 text-indigo-400 border-indigo-500/20",
    dot: "bg-indigo-400 animate-pulse",
    icon: PlayCircle,
  },
  IN_REVIEW: {
    style: "bg-amber-500/15 text-amber-400 border-amber-500/20",
    dot: "bg-amber-400 animate-ping",
    icon: Clock,
  },
  COMPLETED: {
    style: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    dot: "bg-emerald-400",
    icon: CheckCircle2,
  },
  REJECTED: {
    style: "bg-rose-500/15 text-rose-400 border-rose-500/20",
    dot: "bg-rose-400",
    icon: XCircle,
  },
  OVERDUE: {
    style: "bg-red-500/15 text-red-400 border-red-500/20",
    dot: "bg-red-400",
    icon: AlertCircle,
  },
};

export function TaskStatusBadge({ status, className, showIcon = true }: TaskStatusBadgeProps) {
  const { key, label } = normalizeTaskStatus(status);
  const cfg = statusConfig[key];
  const IconComponent = cfg.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide transition-colors",
        cfg.style,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)} />
      {showIcon && <IconComponent className="h-3 w-3 shrink-0" />}
      <span>{label}</span>
    </span>
  );
}

export function TaskPriorityBadge({ priority, className }: { priority?: string; className?: string }) {
  const p = (priority || "").toLowerCase().trim();
  let style = "bg-muted text-muted-foreground border-border";

  if (p === "high" || p === "urgent") {
    style = "bg-rose-500/15 text-rose-400 border-rose-500/20";
  } else if (p === "medium") {
    style = "bg-amber-500/15 text-amber-400 border-amber-500/20";
  } else if (p === "low") {
    style = "bg-emerald-500/15 text-emerald-400 border-emerald-500/20";
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize",
        style,
        className,
      )}
    >
      {p || "medium"}
    </span>
  );
}
