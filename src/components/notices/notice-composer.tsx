import { useState } from "react";
import { toast } from "sonner";
import { Eraser, Paperclip, Save, Send, Loader2 } from "lucide-react";
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
  noticeAudiences,
  noticePriorities,
  noticePriorityMeta,
  noticeTypeMeta,
  noticeTypes,
  type NoticePriority,
  type NoticeType,
} from "@/lib/notice-store";
import { useCreateNotice } from "@/features/notices/hooks/use-notices-api";

const today = () => new Date().toISOString().slice(0, 10);

interface FormState {
  headline: string;
  content: string;
  type: NoticeType;
  audience: string;
  priority: NoticePriority;
  publishDate: string;
  expiryDate: string;
}

const blankForm = (): FormState => ({
  headline: "",
  content: "",
  type: "announcement",
  audience: "All Employees",
  priority: "medium",
  publishDate: today(),
  expiryDate: "",
});

/** Create-notice form: publish immediately or store as a draft. */
export function NoticeComposer() {
  const [form, setForm] = useState<FormState>(blankForm);
  const [attachmentFile, setAttachmentFile] = useState<File | undefined>();
  const [errors, setErrors] = useState<{ headline?: string; content?: string }>({});

  const createNoticeMutation = useCreateNotice();

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const submit = (status: "published" | "draft") => {
    const next: typeof errors = {};
    if (!form.headline.trim()) next.headline = "Headline is required";
    if (!form.content.trim()) next.content = "Content is required";
    setErrors(next);
    if (Object.keys(next).length) return;

    createNoticeMutation.mutate(
      {
        headline: form.headline.trim(),
        content: form.content.trim(),
        type: form.type,
        priority: form.priority,
        status,
        targetAll: form.audience === "Everyone" || form.audience === "All Employees",
        expiryDate: form.expiryDate ? new Date(form.expiryDate).toISOString() : undefined,
        attachments: attachmentFile ? [attachmentFile] : undefined,
      },
      {
        onSuccess: () => {
          setForm(blankForm());
          setAttachmentFile(undefined);
          toast.success(status === "published" ? "Notice published" : "Draft saved", {
            description:
              status === "published"
                ? "Every employee can now see it on their notice board."
                : "You can publish it later from the notice list.",
          });
        },
        onError: (err) => {
          toast.error("Failed to create notice", {
            description: err.message || "An unexpected error occurred.",
          });
        },
      },
    );
  };

  return (
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
            disabled={createNoticeMutation.isPending}
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
            disabled={createNoticeMutation.isPending}
          />
          {errors.content && <p className="text-xs text-destructive">{errors.content}</p>}
        </div>

        <div className="space-y-2">
          <Label>Notice Type</Label>
          <Select
            value={form.type}
            onValueChange={(v) => set("type", v as NoticeType)}
            disabled={createNoticeMutation.isPending}
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
          <Label>Target Audience</Label>
          <Select
            value={form.audience}
            onValueChange={(v) => set("audience", v)}
            disabled={createNoticeMutation.isPending}
          >
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
          <Select
            value={form.priority}
            onValueChange={(v) => set("priority", v as NoticePriority)}
            disabled={createNoticeMutation.isPending}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {noticePriorities.map((p) => (
                <SelectItem key={p} value={p}>{noticePriorityMeta[p]?.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="publish">Publish Date</Label>
            <Input
              id="publish"
              type="date"
              value={form.publishDate}
              onChange={(e) => set("publishDate", e.target.value)}
              disabled={createNoticeMutation.isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="expiry">Expiry Date</Label>
            <Input
              id="expiry"
              type="date"
              value={form.expiryDate}
              onChange={(e) => set("expiryDate", e.target.value)}
              disabled={createNoticeMutation.isPending}
            />
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
              {attachmentFile ? "Replace file" : "PDF, image or document"}
            </label>
            <input
              id="attachment"
              type="file"
              className="sr-only"
              accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
              disabled={createNoticeMutation.isPending}
              onChange={(e) => {
                const f = e.target.files?.[0];
                setAttachmentFile(f);
              }}
            />
            {attachmentFile && (
              <span className="inline-flex items-center gap-2 rounded-md border border-border/60 bg-background/40 px-3 py-1.5 text-xs">
                <Paperclip className="h-3.5 w-3.5 text-primary" />
                <span className="max-w-[220px] truncate">{attachmentFile.name}</span>
                <button
                  type="button"
                  onClick={() => setAttachmentFile(undefined)}
                  className="text-muted-foreground hover:text-destructive"
                  disabled={createNoticeMutation.isPending}
                >
                  Remove
                </button>
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <Button
          onClick={() => submit("published")}
          className="min-h-11"
          disabled={createNoticeMutation.isPending}
        >
          {createNoticeMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Send className="mr-2 h-4 w-4" />
          )}
          Publish Notice
        </Button>
        <Button
          variant="secondary"
          className="min-h-11"
          onClick={() => submit("draft")}
          disabled={createNoticeMutation.isPending}
        >
          <Save className="mr-2 h-4 w-4" /> Save Draft
        </Button>
        <Button
          variant="ghost"
          className="min-h-11"
          onClick={() => {
            setForm(blankForm());
            setAttachmentFile(undefined);
            setErrors({});
          }}
          disabled={createNoticeMutation.isPending}
        >
          <Eraser className="mr-2 h-4 w-4" /> Clear
        </Button>
      </div>
    </section>
  );
}
