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
      const isPinned = n.status === "pinned" || Boolean(n.pinned);
      const status = noticeStatus(n);

      if (filter === "pinned" && !isPinned) return false;
      if (filter !== "all" && filter !== "pinned" && status !== filter) return false;
      if (!q) return true;

      const headlineMatch = (n.headline || n.title || "").toLowerCase().includes(q);
      const contentMatch = (n.content || "").toLowerCase().includes(q);
      const typeLabel = noticeTypeMeta[n.type]?.label.toLowerCase() || "";
      const typeMatch = typeLabel.includes(q);

      return headlineMatch || contentMatch || typeMatch;
    });
  }, [notices, query, filter]);

  const counts = useMemo(
    () => ({
      all: notices.length,
      published: notices.filter((n: Notice) => noticeStatus(n) === "published").length,
      draft: notices.filter((n: Notice) => noticeStatus(n) === "draft").length,
      expired: notices.filter((n: Notice) => noticeStatus(n) === "expired").length,
      pinned: notices.filter((n: Notice) => n.status === "pinned" || Boolean(n.pinned)).length,
    }),
    [notices],
  );

  return { filtered, counts, query, setQuery, filter, setFilter };
}
