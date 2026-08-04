import { useMemo, useState } from "react";
import { noticeStatus, noticeTypeMeta, useNotices, type Notice } from "@/lib/notice-store";

export type NoticeFilterKey = "all" | "published" | "draft" | "expired" | "pinned";

/** Search + status filtering for the admin notice list. */
export function useNoticeFilters() {
  const notices = useNotices();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<NoticeFilterKey>("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return notices.filter((n: Notice) => {
      const status = noticeStatus(n);
      if (filter === "pinned" && !n.pinned) return false;
      if (filter !== "all" && filter !== "pinned" && status !== filter) return false;
      if (!q) return true;
      return (
        n.headline.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q) ||
        noticeTypeMeta[n.type].label.toLowerCase().includes(q)
      );
    });
  }, [notices, query, filter]);

  const counts = useMemo(
    () => ({
      all: notices.length,
      published: notices.filter((n: Notice) => noticeStatus(n) === "published").length,
      draft: notices.filter((n: Notice) => noticeStatus(n) === "draft").length,
      expired: notices.filter((n: Notice) => noticeStatus(n) === "expired").length,
      pinned: notices.filter((n: Notice) => n.pinned).length,
    }),
    [notices],
  );

  return { filtered, counts, query, setQuery, filter, setFilter };
}
