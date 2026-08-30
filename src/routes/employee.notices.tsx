import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Megaphone, Pin, Paperclip, Search } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/empty-state";
import { NoticeBadges } from "@/components/notice-badges";
import { cn } from "@/lib/utils";
import { noticeTypeMeta, useEmployeeNotices, type NoticeType } from "@/lib/notice-store";

export const Route = createFileRoute("/employee/notices")({
  head: () => ({
    meta: [
      { title: "Notice Board — Poll" },
      { name: "description", content: "Company announcements, meetings, holidays and policy updates." },
      { property: "og:title", content: "Notice Board — Poll" },
      { property: "og:description", content: "Company announcements, meetings, holidays and policy updates." },
    ],
  }),
  component: EmployeeNoticeBoard,
});

function EmployeeNoticeBoard() {
  const notices = useEmployeeNotices();
  const [query, setQuery] = useState("");
  const [type, setType] = useState<"all" | NoticeType>("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return notices.filter((n) => {
      if (type !== "all" && n.type !== type) return false;
      if (!q) return true;
      const headlineStr = (n.headline || n.title || "").toLowerCase();
      const contentStr = (n.content || "").toLowerCase();
      return headlineStr.includes(q) || contentStr.includes(q);
    });
  }, [notices, query, type]);

  return (
    <>
      <PageHeader
        title="Notice Board"
        subtitle="Company announcements, straight from the leadership team."
        icon={Megaphone}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search notices"
            className="pl-9"
          />
        </div>
        <Tabs value={type} onValueChange={(v) => setType(v as typeof type)}>
          <TabsList className="flex-wrap">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="announcement">📢 News</TabsTrigger>
            <TabsTrigger value="important">⚠ Important</TabsTrigger>
            <TabsTrigger value="meeting">👥 Meetings</TabsTrigger>
            <TabsTrigger value="holiday">🎉 Holidays</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="No notices yet"
          description="New company announcements will appear here as soon as they're published."
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {filtered.map((n, i) => {
            const isPinned = n.status === "pinned" || Boolean(n.pinned);
            const noticeId = n._id || n.id || `notice-${i}`;
            const authorName =
              typeof n.createdBy === "object" && n.createdBy !== null
                ? n.createdBy.name || "Leadership"
                : typeof n.createdBy === "string"
                  ? n.createdBy
                  : "Leadership";
            const publishedDate = n.createdAt
              ? new Date(n.createdAt).toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
              })
              : "—";

            return (
              <article
                key={noticeId}
                style={{ animationDelay: `${i * 30}ms` }}
                className={cn(
                  "animate-in fade-in slide-in-from-bottom-1 rounded-md border bg-card/40 p-5 transition-colors motion-reduce:animate-none",
                  isPinned ? "border-primary/50 bg-primary/[0.04]" : "border-border/60 hover:border-primary/30",
                )}
              >
                {isPinned && (
                  <span className="mb-3 inline-flex items-center gap-1 rounded-sm bg-primary/15 px-2 py-0.5 text-[11px] font-medium text-primary">
                    <Pin className="h-3 w-3" /> Pinned
                  </span>
                )}
                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-border/60 bg-background/50 text-base">
                    <span aria-hidden>{noticeTypeMeta[n.type]?.icon || "📢"}</span>
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-display text-lg font-semibold leading-snug">
                      {n.headline || n.title}
                    </h2>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <NoticeBadges notice={n} />
                    </div>
                  </div>
                </div>

                <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                  {n.content}
                </p>

                {Array.isArray(n.attachments) && n.attachments.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {n.attachments.map((url, idx) => (
                      <a
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 rounded-md border border-border/60 bg-background/40 px-3 py-2 text-xs hover:border-primary/60 transition-colors"
                      >
                        <Paperclip className="h-3.5 w-3.5 text-primary" />
                        <span className="truncate">{url.split("/").pop() || `Attachment ${idx + 1}`}</span>
                        <span className="ml-auto text-muted-foreground">View</span>
                      </a>
                    ))}
                  </div>
                )}

                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border/50 pt-3 text-xs text-muted-foreground">
                  <span>
                    Posted by <span className="font-medium text-foreground">{authorName}</span>
                  </span>
                  <span>{publishedDate}</span>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
