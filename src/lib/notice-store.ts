import { useNoticesQuery } from "@/features/notices/hooks/use-notices-api";
import type {
  Notice,
  NoticePriority,
  NoticeStatus,
  NoticeType,
  NoticeFilters,
} from "@/features/notices/types";

export type { Notice, NoticePriority, NoticeStatus, NoticeType };

export interface NoticeAttachment {
  name: string;
  size?: number;
  type?: string;
  url?: string;
}

export const noticeTypeMeta: Record<NoticeType, { label: string; icon: string }> = {
  announcement: { label: "Announcement", icon: "📢" },
  important: { label: "Important", icon: "⚠" },
  meeting: { label: "Meeting", icon: "👥" },
  holiday: { label: "Holiday", icon: "🎉" },
  maintenance: { label: "Maintenance", icon: "🛠" },
  policy: { label: "Policy Update", icon: "📄" },
  policy_update: { label: "Policy Update", icon: "📄" },
  event: { label: "Event", icon: "📅" },
};

export const noticeTypes: NoticeType[] = [
  "announcement",
  "important",
  "meeting",
  "holiday",
  "maintenance",
  "policy_update",
  "event",
];

export const noticeAudiences = [
  "All Employees",
  "Engineering",
  "Sales",
  "Product",
  "QA",
  "HR",
  "Design",
];

export const noticePriorityMeta: Record<NoticePriority, { label: string; className: string }> = {
  low: { label: "Low", className: "bg-muted text-muted-foreground" },
  medium: { label: "Medium", className: "bg-info/15 text-info" },
  high: { label: "High", className: "bg-warning/15 text-warning" },
  urgent: { label: "Urgent", className: "bg-destructive/15 text-destructive" },
};

export const noticePriorities: NoticePriority[] = ["low", "medium", "high", "urgent"];

export function isExpired(n: Notice): boolean {
  if (!n.expiryDate) return false;
  return new Date(n.expiryDate) < new Date();
}

/** Returns the display status for a notice. */
export function noticeStatus(n: Notice): NoticeStatus {
  if (n.status === "draft") return "draft";
  if (n.status === "pinned") return "pinned";
  if (isExpired(n)) return "expired";
  return n.status || "published";
}

/** Hook returning all notices from backend API. */
export function useNotices(filters?: NoticeFilters): Notice[] {
  const { data } = useNoticesQuery(filters);
  return data ?? [];
}

/** Hook returning notices for employees from backend API. */
export function useEmployeeNotices(): Notice[] {
  const { data } = useNoticesQuery();
  return data ?? [];
}
