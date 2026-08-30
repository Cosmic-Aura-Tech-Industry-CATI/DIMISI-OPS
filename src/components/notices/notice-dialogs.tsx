import { useState } from "react";
import { toast } from "sonner";
import { Paperclip, Loader2 } from "lucide-react";
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
  noticeAudiences,
  noticePriorities,
  noticePriorityMeta,
  noticeTypeMeta,
  noticeTypes,
  type Notice,
  type NoticePriority,
  type NoticeStatus,
  type NoticeType,
} from "@/lib/notice-store";
import { useDeleteNotice, useUpdateNotice } from "@/features/notices/hooks/use-notices-api";

/** Read-only preview of a notice exactly as employees see it. */
export function ViewNoticeDialog({
  notice,
  onClose,
}: {
  notice: Notice | null;
  onClose: () => void;
}) {
  const createdByName =
    typeof notice?.createdBy === "object" && notice?.createdBy !== null
      ? notice.createdBy.name || "Admin"
      : typeof notice?.createdBy === "string"
        ? notice.createdBy
        : "Admin";

  const formattedDate = notice?.createdAt
    ? new Date(notice.createdAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "—";

  return (
    <Dialog open={!!notice} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        {notice && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <span aria-hidden>{noticeTypeMeta[notice.type]?.icon || "📢"}</span>{" "}
                {notice.headline || notice.title}
              </DialogTitle>
              <DialogDescription>
                {createdByName} · {formattedDate}
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-wrap gap-2">
              <NoticeBadges notice={notice} />
              <NoticeStatusBadge notice={notice} />
            </div>
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">{notice.content}</p>
            {Array.isArray(notice.attachments) && notice.attachments.length > 0 && (
              <div className="space-y-1.5 pt-2">
                <p className="text-xs font-semibold text-foreground">Attachments</p>
                <div className="flex flex-wrap gap-2">
                  {notice.attachments.map((url, i) => (
                    <a
                      key={i}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-md border border-border/60 bg-background/40 px-3 py-2 text-xs hover:border-primary/60"
                    >
                      <Paperclip className="h-3.5 w-3.5 text-primary" />
                      <span className="max-w-[200px] truncate">
                        {url.split("/").pop() || `Attachment ${i + 1}`}
                      </span>
                    </a>
                  ))}
                </div>
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
  const deleteNoticeMutation = useDeleteNotice();

  const handleDelete = () => {
    if (!notice) return;
    const noticeId = notice._id || notice.id || "";
    deleteNoticeMutation.mutate(noticeId, {
      onSuccess: () => {
        onClose();
        toast.success("Notice deleted permanently");
      },
      onError: (err) => {
        toast.error("Failed to delete notice", { description: err.message });
      },
    });
  };

  return (
    <Dialog open={!!notice} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Delete notice</DialogTitle>
          <DialogDescription>
            “{notice?.headline || notice?.title}” will be removed from every notice board. This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={deleteNoticeMutation.isPending}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteNoticeMutation.isPending}
          >
            {deleteNoticeMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
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
  const [headline, setHeadline] = useState(notice?.headline || notice?.title || "");
  const [content, setContent] = useState(notice?.content || "");
  const [type, setType] = useState<NoticeType>(notice?.type || "announcement");
  const [priority, setPriority] = useState<NoticePriority>(notice?.priority || "medium");
  const [status, setStatus] = useState<NoticeStatus>(notice?.status || "published");
  const [targetAll, setTargetAll] = useState<boolean>(notice?.targetAll ?? true);
  const [expiryDate, setExpiryDate] = useState<string>(
    notice?.expiryDate ? new Date(notice.expiryDate).toISOString().slice(0, 10) : "",
  );
  const [newAttachment, setNewAttachment] = useState<File | undefined>();
  const [existingAttachments, setExistingAttachments] = useState<string[]>(
    notice?.attachments || [],
  );

  const updateNoticeMutation = useUpdateNotice();

  // Keep state synced when notice changes
  const prevId = notice?._id || notice?.id;
  useState(() => {
    if (notice) {
      setHeadline(notice.headline || notice.title || "");
      setContent(notice.content || "");
      setType(notice.type || "announcement");
      setPriority(notice.priority || "medium");
      setStatus(notice.status || "published");
      setTargetAll(notice.targetAll ?? true);
      setExpiryDate(notice.expiryDate ? new Date(notice.expiryDate).toISOString().slice(0, 10) : "");
      setExistingAttachments(notice.attachments || []);
    }
  });

  const handleSave = () => {
    if (!notice) return;
    const noticeId = notice._id || notice.id || "";

    updateNoticeMutation.mutate(
      {
        id: noticeId,
        input: {
          headline: headline.trim(),
          content: content.trim(),
          type,
          priority,
          status,
          targetAll,
          expiryDate: expiryDate ? new Date(expiryDate).toISOString() : undefined,
          existingAttachments,
          attachments: newAttachment ? [newAttachment] : undefined,
        },
      },
      {
        onSuccess: () => {
          onClose();
          toast.success("Notice updated");
        },
        onError: (err) => {
          toast.error("Failed to update notice", { description: err.message });
        },
      },
    );
  };

  return (
    <Dialog open={!!notice} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        {notice && (
          <>
            <DialogHeader>
              <DialogTitle>Edit notice</DialogTitle>
              <DialogDescription>Changes apply everywhere immediately.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="e-headline">Headline</Label>
                <Input
                  id="e-headline"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  disabled={updateNoticeMutation.isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="e-content">Content</Label>
                <Textarea
                  id="e-content"
                  rows={5}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  disabled={updateNoticeMutation.isPending}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={type}
                    onValueChange={(v) => setType(v as NoticeType)}
                    disabled={updateNoticeMutation.isPending}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {noticeTypes.map((t) => (
                        <SelectItem key={t} value={t}>
                          {noticeTypeMeta[t]?.icon} {noticeTypeMeta[t]?.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select
                    value={priority}
                    onValueChange={(v) => setPriority(v as NoticePriority)}
                    disabled={updateNoticeMutation.isPending}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {noticePriorities.map((p) => (
                        <SelectItem key={p} value={p}>{noticePriorityMeta[p]?.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={status}
                    onValueChange={(v) => setStatus(v as NoticeStatus)}
                    disabled={updateNoticeMutation.isPending}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="pinned">Pinned</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="e-expiry">Expiry date</Label>
                  <Input
                    id="e-expiry"
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    disabled={updateNoticeMutation.isPending}
                  />
                </div>
              </div>

              {existingAttachments.length > 0 && (
                <div className="space-y-1.5">
                  <Label>Existing Attachments</Label>
                  <div className="flex flex-wrap gap-2">
                    {existingAttachments.map((url, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-2 rounded-md border border-border/60 bg-background/40 px-2.5 py-1 text-xs"
                      >
                        <Paperclip className="h-3.5 w-3.5 text-primary" />
                        <span className="max-w-[160px] truncate">{url.split("/").pop()}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setExistingAttachments((prev) => prev.filter((_, idx) => idx !== i))
                          }
                          className="text-muted-foreground hover:text-destructive"
                          disabled={updateNoticeMutation.isPending}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="e-new-file">Add New Attachment (optional)</Label>
                <Input
                  id="e-new-file"
                  type="file"
                  disabled={updateNoticeMutation.isPending}
                  onChange={(e) => setNewAttachment(e.target.files?.[0])}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={onClose} disabled={updateNoticeMutation.isPending}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={updateNoticeMutation.isPending}>
                {updateNoticeMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Save changes
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
