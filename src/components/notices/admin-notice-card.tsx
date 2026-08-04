import { toast } from "sonner";
import { Copy, Eye, Pencil, Pin, PinOff, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NoticeBadges, NoticeStatusBadge } from "@/components/notice-badges";
import { cn } from "@/lib/utils";
import { duplicateNotice, noticeTypeMeta, pinNotice, type Notice } from "@/lib/notice-store";

function MetaField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 truncate font-medium">{value}</dd>
    </div>
  );
}

/** Single notice in the admin list, with its inline management actions. */
export function AdminNoticeCard({
  notice,
  index,
  onView,
  onEdit,
  onDelete,
}: {
  notice: Notice;
  index: number;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const n = notice;
  return (
    <article
      style={{ animationDelay: `${index * 25}ms` }}
      className={cn(
        "animate-in fade-in slide-in-from-bottom-1 rounded-md border bg-card/40 p-4 transition-colors motion-reduce:animate-none",
        n.pinned ? "border-primary/50" : "border-border/60 hover:border-primary/30",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span aria-hidden className="text-base">{noticeTypeMeta[n.type].icon}</span>
            <h3 className="truncate font-display text-base font-semibold">{n.headline}</h3>
          </div>
          <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{n.content}</p>
        </div>
        {n.pinned && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-sm bg-primary/15 px-2 py-0.5 text-[11px] font-medium text-primary">
            <Pin className="h-3 w-3" /> Pinned
          </span>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <NoticeBadges notice={n} />
        <NoticeStatusBadge notice={n} />
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-border/50 pt-3 text-xs sm:grid-cols-4">
        <MetaField label="Created by" value={n.createdBy} />
        <MetaField label="Audience" value={n.audience} />
        <MetaField label="Published" value={n.publishDate} />
        <MetaField label="Expires" value={n.expiryDate || "—"} />
      </dl>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button size="sm" variant="ghost" onClick={onView}>
          <Eye className="mr-1.5 h-3.5 w-3.5" /> View
        </Button>
        <Button size="sm" variant="ghost" onClick={onEdit}>
          <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => { duplicateNotice(n.id); toast.success("Notice duplicated as draft"); }}
        >
          <Copy className="mr-1.5 h-3.5 w-3.5" /> Duplicate
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => { pinNotice(n.id); toast.success(n.pinned ? "Notice unpinned" : "Notice pinned to the top"); }}
        >
          {n.pinned ? <PinOff className="mr-1.5 h-3.5 w-3.5" /> : <Pin className="mr-1.5 h-3.5 w-3.5" />}
          {n.pinned ? "Unpin" : "Pin"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="text-destructive hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete
        </Button>
      </div>
    </article>
  );
}
