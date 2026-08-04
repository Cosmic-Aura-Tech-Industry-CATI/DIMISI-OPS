import { useState } from "react";
import { toast } from "sonner";
import { Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { NoticeBadges, NoticeStatusBadge } from "@/components/notice-badges";
import {
  deleteNotice,
  noticeAudiences,
  noticePriorities,
  noticePriorityMeta,
  noticeTypeMeta,
  noticeTypes,
  updateNotice,
  type Notice,
  type NoticePriority,
  type NoticeType,
} from "@/lib/notice-store";

/** Read-only preview of a notice exactly as employees see it. */
export function ViewNoticeDialog({
  notice,
  onClose,
}: {
  notice: Notice | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={!!notice} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        {notice && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <span aria-hidden>{noticeTypeMeta[notice.type].icon}</span> {notice.headline}
              </DialogTitle>
              <DialogDescription>
                {notice.createdBy} · {notice.publishDate}
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-wrap gap-2">
              <NoticeBadges notice={notice} />
              <NoticeStatusBadge notice={notice} />
            </div>
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">{notice.content}</p>
            {notice.attachment && (
              <div className="flex items-center gap-2 rounded-md border border-border/60 bg-background/40 px-3 py-2 text-xs">
                <Paperclip className="h-3.5 w-3.5 text-primary" />
                <span className="truncate">{notice.attachment.name}</span>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** Delete confirmation for a notice. */
export function DeleteNoticeDialog({
  notice,
  onClose,
}: {
  notice: Notice | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={!!notice} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Delete notice</DialogTitle>
          <DialogDescription>
            “{notice?.headline}” will be removed from every notice board. This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            variant="destructive"
            onClick={() => {
              if (notice) deleteNotice(notice.id);
              onClose();
              toast.success("Notice deleted");
            }}
          >
            Delete notice
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Inline editor for an existing notice. */
export function EditNoticeDialog({
  notice,
  onClose,
}: {
  notice: Notice | null;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<Notice | null>(notice);
  const current = draft?.id === notice?.id ? draft : notice;

  if (notice && (!draft || draft.id !== notice.id)) {
    // keep local draft in sync when a different notice is opened
    setDraft(notice);
  }

  const set = <K extends keyof Notice>(key: K, value: Notice[K]) =>
    setDraft((d) => (d ? { ...d, [key]: value } : d));

  return (
    <Dialog open={!!notice} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        {current && (
          <>
            <DialogHeader>
              <DialogTitle>Edit notice</DialogTitle>
              <DialogDescription>Changes apply everywhere immediately.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="e-headline">Headline</Label>
                <Input id="e-headline" value={current.headline} onChange={(e) => set("headline", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="e-content">Content</Label>
                <Textarea id="e-content" rows={5} value={current.content} onChange={(e) => set("content", e.target.value)} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={current.type} onValueChange={(v) => set("type", v as NoticeType)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {noticeTypes.map((t) => (
                        <SelectItem key={t} value={t}>{noticeTypeMeta[t].icon} {noticeTypeMeta[t].label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select value={current.priority} onValueChange={(v) => set("priority", v as NoticePriority)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {noticePriorities.map((p) => (
                        <SelectItem key={p} value={p}>{noticePriorityMeta[p].label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Audience</Label>
                  <Select value={current.audience} onValueChange={(v) => set("audience", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {noticeAudiences.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={current.status} onValueChange={(v) => set("status", v as Notice["status"])}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="e-publish">Publish date</Label>
                  <Input id="e-publish" type="date" value={current.publishDate} onChange={(e) => set("publishDate", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="e-expiry">Expiry date</Label>
                  <Input id="e-expiry" type="date" value={current.expiryDate ?? ""} onChange={(e) => set("expiryDate", e.target.value || undefined)} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={onClose}>Cancel</Button>
              <Button
                onClick={() => {
                  const { id, ...patch } = current;
                  updateNotice(id, patch);
                  onClose();
                  toast.success("Notice updated");
                }}
              >
                Save changes
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
