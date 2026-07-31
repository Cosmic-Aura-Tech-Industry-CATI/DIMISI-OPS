import { cn } from "@/lib/utils";
import type { TaskPriority, TaskStatus, TaskType } from "@/lib/mock-data";

const statusStyles: Record<TaskStatus, string> = {
  pending: "bg-muted text-muted-foreground",
  in_progress: "bg-info/15 text-info",
  completed: "bg-success/15 text-success",
  overdue: "bg-destructive/15 text-destructive",
  available: "bg-primary/15 text-primary",
  assigned: "bg-info/15 text-info",
};
const statusLabel: Record<TaskStatus, string> = {
  pending: "Pending",
  in_progress: "In progress",
  completed: "Completed",
  overdue: "Overdue",
  available: "Available",
  assigned: "Assigned",
};
const priorityStyles: Record<TaskPriority, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-warning/15 text-warning-foreground dark:text-warning",
  high: "bg-destructive/15 text-destructive",
};

export function StatusBadge({ status }: { status: TaskStatus }) {
  return (
    <span className={cn("inline-flex items-center rounded-sm px-2.5 py-0.5 text-xs font-medium", statusStyles[status])}>
      <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" />
      {statusLabel[status]}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  return (
    <span className={cn("inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-medium capitalize", priorityStyles[priority])}>
      {priority}
    </span>
  );
}

const typeStyles: Record<TaskType, string> = {
  universal: "bg-primary/15 text-primary",
  project: "bg-info/15 text-info",
  direct: "bg-success/15 text-success",
};
const typeLabel: Record<TaskType, string> = {
  universal: "🌐 Universal",
  project: "📁 Project",
  direct: "🎯 Direct",
};

export function TaskTypeBadge({ type = "direct" }: { type?: TaskType }) {
  return (
    <span className={cn("inline-flex items-center rounded-sm px-2 py-0.5 text-[11px] font-medium", typeStyles[type])}>
      {typeLabel[type]}
    </span>
  );
}
