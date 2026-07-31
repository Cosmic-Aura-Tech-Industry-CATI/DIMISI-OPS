import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Megaphone,
  Pin,
  PinOff,
  Copy,
  Trash2,
  Pencil,
  Eye,
  Search,
  Paperclip,
  Send,
  Save,
  Eraser,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/empty-state";
import { NoticeBadges, NoticeStatusBadge } from "@/components/notice-badges";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import {
  createNotice,
  deleteNotice,
  duplicateNotice,
  noticeAudiences,
  noticePriorities,
  noticePriorityMeta,
  noticeStatus,
  noticeTypeMeta,
  noticeTypes,
  pinNotice,
  updateNotice,
  useNotices,
  type Notice,
  type NoticePriority,
  type NoticeType,
} from "@/lib/notice-store";

export const Route = createFileRoute("/admin/notices")({
  head: () => ({
    meta: [
      { title: "Notice Board — Poll" },
      { name: "description", content: "Create and manage company announcements for every team." },
      { property: "og:title", content: "Notice Board — Poll" },
      { property: "og:description", content: "Create and manage company announcements for every team." },
    ],
  }),
  component: AdminNoticeBoard,
});

const today = () => new Date().toISOString().slice(0, 10);

interface FormState {
  headline: string;
  content: string;
  type: NoticeType;
  audience: string;
  priority: NoticePriority;
  publishDate: string;
  expiryDate: string;
  attachment?: { name: string; size: number; type: string };
}

const blankForm = (): FormState => ({
  headline: "",
  content: "",
  type: "announcement",
  audience: "Everyone",
  priority: "medium",
  publishDate: today(),
  expiryDate: "",
});

type FilterKey = "all" | "published" | "draft" | "expired" | "pinned";

function AdminNoticeBoard() {
  const notices = useNotices();
  const { user } = useAuth();
  const [form, setForm] = useState<FormState>(blankForm);
  const [errors, setErrors] = useState<{ headline?: string; content?: string }>({});
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [viewing, setViewing] = useState<Notice | null>(null);
  const [editing, setEditing] = useState<Notice | null>(null);
  const [deleting, setDeleting] = useState<Notice | null>(null);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const submit = (status: "published" | "draft") => {
    const next: typeof errors = {};
    if (!form.headline.trim()) next.headline = "Headline is required";
    if (!form.content.trim()) next.content = "Content is required";
    setErrors(next);
    if (Object.keys(next).length) return;

    createNotice({
      headline: form.headline.trim(),
      content: form.content.trim(),
      type: form.type,
      audience: form.audience,
      priority: form.priority,
      publishDate: form.publishDate || today(),
      expiryDate: form.expiryDate || undefined,
      attachment: form.attachment,
      status,
      createdBy: user?.name ?? "Admin",
    });
    setForm(blankForm());
    toast.success(status === "published" ? "Notice published" : "Draft saved", {
      description:
        status === "published"
          ? "Every employee can now see it on their notice board."
          : "You can publish it later from the notice list.",
    });
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return notices.filter((n) => {
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
      published: notices.filter((n) => noticeStatus(n) === "published").length,
      draft: notices.filter((n) => noticeStatus(n) === "draft").length,
      expired: notices.filter((n) => noticeStatus(n) === "expired").length,
      pinned: notices.filter((n) => n.pinned).length,
    }),
    [notices],
  );

  return (
    <>
      <PageHeader
        title="Notice Board"
        subtitle="Create and manage company announcements."
        icon={Megaphone}
      />

      {/* Create notice */}
      <section className="rounded-md border border-border/60 bg-card/40 p-4 sm:p-6">
        <h2 className="font-display text-lg font-semibold">Create Notice</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Publish immediately, or keep it as a draft until you're ready.
        </p>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className="lg:col-span-2 space-y-2">
            <Label htmlFor="headline">Headline *</Label>
            <Input
              id="headline"
              value={form.headline}
              onChange={(e) => set("headline", e.target.value)}
              placeholder="e.g. Quarterly all-hands on Friday"
            />
            {errors.headline && <p className="text-xs text-destructive">{errors.headline}</p>}
          </div>

          <div className="lg:col-span-2 space-y-2">
            <Label htmlFor="content">Content *</Label>
            <Textarea
              id="content"
              rows={5}
              value={form.content}
              onChange={(e) => set("content", e.target.value)}
              placeholder="Write the announcement…"
            />
            {errors.content && <p className="text-xs text-destructive">{errors.content}</p>}
          </div>

          <div className="space-y-2">
            <Label>Notice Type</Label>
            <Select value={form.type} onValueChange={(v) => set("type", v as NoticeType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {noticeTypes.map((t) => (
                  <SelectItem key={t} value={t}>
                    {noticeTypeMeta[t].icon} {noticeTypeMeta[t].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Target Audience</Label>
            <Select value={form.audience} onValueChange={(v) => set("audience", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {noticeAudiences.map((a) => (
                  <SelectItem key={a} value={a}>{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Priority</Label>
            <Select value={form.priority} onValueChange={(v) => set("priority", v as NoticePriority)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {noticePriorities.map((p) => (
                  <SelectItem key={p} value={p}>{noticePriorityMeta[p].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="publish">Publish Date</Label>
              <Input id="publish" type="date" value={form.publishDate} onChange={(e) => set("publishDate", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiry">Expiry Date</Label>
              <Input id="expiry" type="date" value={form.expiryDate} onChange={(e) => set("expiryDate", e.target.value)} />
            </div>
          </div>

          <div className="lg:col-span-2 space-y-2">
            <Label htmlFor="attachment">Attachment (optional)</Label>
            <div className="flex flex-wrap items-center gap-3">
              <label
                htmlFor="attachment"
                className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-dashed border-border/70 bg-background/40 px-4 text-sm text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground"
              >
                <Paperclip className="h-4 w-4" />
                {form.attachment ? "Replace file" : "PDF, image or document"}
              </label>
              <input
                id="attachment"
                type="file"
                className="sr-only"
                accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  set("attachment", f ? { name: f.name, size: f.size, type: f.type || "file" } : undefined);
                }}
              />
              {form.attachment && (
                <span className="inline-flex items-center gap-2 rounded-md border border-border/60 bg-background/40 px-3 py-1.5 text-xs">
                  <Paperclip className="h-3.5 w-3.5 text-primary" />
                  <span className="max-w-[220px] truncate">{form.attachment.name}</span>
                  <button
                    type="button"
                    onClick={() => set("attachment", undefined)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    Remove
                  </button>
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <Button onClick={() => submit("published")} className="min-h-11">
            <Send className="mr-2 h-4 w-4" /> Publish Notice
          </Button>
          <Button variant="secondary" className="min-h-11" onClick={() => submit("draft")}>
            <Save className="mr-2 h-4 w-4" /> Save Draft
          </Button>
          <Button
            variant="ghost"
            className="min-h-11"
            onClick={() => { setForm(blankForm()); setErrors({}); }}
          >
            <Eraser className="mr-2 h-4 w-4" /> Clear
          </Button>
        </div>
      </section>

      {/* List */}
      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search headline, content or type"
              className="pl-9"
            />
          </div>
          <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterKey)}>
            <TabsList className="flex-wrap">
              {(["all", "published", "draft", "expired", "pinned"] as FilterKey[]).map((k) => (
                <TabsTrigger key={k} value={k} className="capitalize">
                  {k} <span className="ml-1 text-muted-foreground">{counts[k]}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={Megaphone}
            title="No notices found"
            description="Try a different search or filter, or publish a new notice above."
          />
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {filtered.map((n, i) => (
              <article
                key={n.id}
                style={{ animationDelay: `${i * 25}ms` }}
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
                  <div><dt className="text-[10px] uppercase tracking-wider text-muted-foreground">Created by</dt><dd className="mt-0.5 truncate font-medium">{n.createdBy}</dd></div>
                  <div><dt className="text-[10px] uppercase tracking-wider text-muted-foreground">Audience</dt><dd className="mt-0.5 truncate font-medium">{n.audience}</dd></div>
                  <div><dt className="text-[10px] uppercase tracking-wider text-muted-foreground">Published</dt><dd className="mt-0.5 font-medium">{n.publishDate}</dd></div>
                  <div><dt className="text-[10px] uppercase tracking-wider text-muted-foreground">Expires</dt><dd className="mt-0.5 font-medium">{n.expiryDate || "—"}</dd></div>
                </dl>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setViewing(n)}><Eye className="mr-1.5 h-3.5 w-3.5" /> View</Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditing(n)}><Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit</Button>
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
                  <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setDeleting(n)}>
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* View */}
      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-w-lg">
          {viewing && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span aria-hidden>{noticeTypeMeta[viewing.type].icon}</span> {viewing.headline}
                </DialogTitle>
                <DialogDescription>
                  {viewing.createdBy} · {viewing.publishDate}
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-wrap gap-2">
                <NoticeBadges notice={viewing} />
                <NoticeStatusBadge notice={viewing} />
              </div>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">{viewing.content}</p>
              {viewing.attachment && (
                <div className="flex items-center gap-2 rounded-md border border-border/60 bg-background/40 px-3 py-2 text-xs">
                  <Paperclip className="h-3.5 w-3.5 text-primary" />
                  <span className="truncate">{viewing.attachment.name}</span>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit */}
      <EditNoticeDialog notice={editing} onClose={() => setEditing(null)} />

      {/* Delete */}
      <Dialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete notice</DialogTitle>
            <DialogDescription>
              “{deleting?.headline}” will be removed from every notice board. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleting(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleting) deleteNotice(deleting.id);
                setDeleting(null);
                toast.success("Notice deleted");
              }}
            >
              Delete notice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function EditNoticeDialog({ notice, onClose }: { notice: Notice | null; onClose: () => void }) {
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
