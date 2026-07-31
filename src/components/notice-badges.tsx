import {
  noticePriorityMeta,
  noticeStatus,
  noticeTypeMeta,
  type Notice,
} from "@/lib/notice-store";
import { cn } from "@/lib/utils";

const statusStyles: Record<"published" | "draft" | "expired", string> = {
  published: "bg-success/15 text-success",
  draft: "bg-muted text-muted-foreground",
  expired: "bg-destructive/15 text-destructive",
};

export function NoticeTypeBadge({ notice }: { notice: Notice }) {
  const meta = noticeTypeMeta[notice.type];
  return (
    <span className="inline-flex items-center gap-1 rounded-sm bg-primary/12 px-2 py-0.5 text-[11px] font-medium text-primary">
      <span aria-hidden>{meta.icon}</span>
      {meta.label}
    </span>
  );
}

export function NoticePriorityBadge({ notice }: { notice: Notice }) {
  const meta = noticePriorityMeta[notice.priority];
  return (
    <span className={cn("inline-flex items-center rounded-sm px-2 py-0.5 text-[11px] font-medium", meta.className)}>
      <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" />
      {meta.label}
    </span>
  );
}

export function NoticeStatusBadge({ notice }: { notice: Notice }) {
  const s = noticeStatus(notice);
  return (
    <span className={cn("inline-flex items-center rounded-sm px-2 py-0.5 text-[11px] font-medium capitalize", statusStyles[s])}>
      {s}
    </span>
  );
}

/** Type + priority pair, used across admin and employee boards. */
export function NoticeBadges({ notice }: { notice: Notice }) {
  return (
    <>
      <NoticeTypeBadge notice={notice} />
      <NoticePriorityBadge notice={notice} />
    </>
  );
}
