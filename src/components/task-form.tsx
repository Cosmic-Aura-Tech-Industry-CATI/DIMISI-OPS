import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  Archive,
  CalendarDays,
  Check,
  ExternalLink,
  FileUp,
  FolderKanban,
  FolderPlus,
  Globe,
  Loader2,
  Paperclip,
  Pencil,
  RotateCw,
  Save,
  Target,
  Timer,
  Trophy,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type Task, type TaskPriority, type TaskType, getCategoryLabel } from "@/features/tasks";
import { useEmployeesQuery, useEmployeeDetailsQuery } from "@/features/employees";
import type { AuthUser } from "@/auth/types/auth";
import { projectById } from "@/lib/projects";
import { useProjectsQuery } from "@/features/projects";
import {
  ArchiveProjectDialog,
  CreateProjectDialog,
  EditProjectDialog,
} from "@/components/project-dialogs";
import { cn } from "@/lib/utils";
import {
  validateTaskAttachmentFile,
  uploadTaskAttachment,
  extractCloudinaryPublicId,
  MAX_TASK_FILE_SIZE,
  ALLOWED_TASK_ATTACHMENT_EXTENSIONS,
} from "@/lib/cdn-upload";
import { useFileDropPaste } from "@/hooks/use-file-drop-paste";

const EMPLOYEE_PAGE_SIZE = 10;

export interface TaskAttachment {
  id?: string;
  name: string;
  size: string;
  file?: File;
  url?: string;
  publicId?: string;
  isUploading?: boolean;
  uploadProgress?: number;
  error?: string;
}

export interface TaskFormValues {
  title: string;
  description: string;
  category: string;
  priority: TaskPriority;
  assigneeId: string;
  points: number;
  dueDate: string;
  notes: string;
  attachments: TaskAttachment[];
  taskType: TaskType;
  projectId: string;
  template: string;
  estimatedTime: string;
}

export const taskCategories = [
  "Engineering",
  "Design",
  "Product",
  "Marketing",
  "Sales",
  "Support",
  "Operations",
];

export function emptyTaskValues(): TaskFormValues {
  return {
    title: "",
    description: "",
    category: "Engineering",
    priority: "medium",
    assigneeId: "",
    points: 50,
    dueDate: "",
    notes: "",
    attachments: [],
    taskType: "universal",
    projectId: "",
    template: "",
    estimatedTime: "",
  };
}

export function taskToValues(t: Task): TaskFormValues {
  const existingAttachments: TaskAttachment[] = (t.attachments || []).map((a, idx) => ({
    id: `existing-${idx}-${a.name}`,
    name: a.name,
    size: a.size,
    url: a.url,
    publicId: a.publicId || extractCloudinaryPublicId(a.url),
    isUploading: false,
    uploadProgress: 100,
  }));

  const formattedDueDate = t.dueDate
    ? (() => {
        try {
          const d = new Date(t.dueDate);
          return !isNaN(d.getTime()) ? d.toISOString().slice(0, 10) : t.dueDate.slice(0, 10);
        } catch {
          return t.dueDate.slice(0, 10);
        }
      })()
    : "";

  return {
    title: t.title || "",
    description: t.description || "",
    category:
      getCategoryLabel(t.category) !== "Uncategorized"
        ? getCategoryLabel(t.category)
        : taskCategories[0] || "Engineering",
    priority: t.priority || "medium",
    assigneeId:
      t.assigneeId ||
      (typeof t.assignedTo === "object" && t.assignedTo
        ? (t.assignedTo as any)._id
        : typeof t.assignedTo === "string"
          ? t.assignedTo
          : ""),
    points:
      typeof t.points === "number"
        ? t.points
        : typeof t.rewardPoints === "number"
          ? t.rewardPoints
          : 50,
    dueDate: formattedDueDate,
    notes: t.notes ?? "",
    attachments: existingAttachments,
    taskType: t.taskType ?? "direct",
    projectId: t.projectId ?? "",
    template: t.projectId ? t.title : "",
    estimatedTime: t.estimatedTime ?? "",
  };
}

const categoryOptions: {
  value: TaskType;
  icon: typeof Globe;
  emoji: string;
  title: string;
  hint: string;
}[] = [
  {
    value: "universal",
    icon: Globe,
    emoji: "🌐",
    title: "Universal Tasks",
    hint: "Visible to every employee — anyone can voluntarily pick it up. Best for docs, testing, bug fixing, research and small features.",
  },
  {
    value: "project",
    icon: FolderKanban,
    emoji: "📁",
    title: "Project Tasks",
    hint: "Belongs to a specific project. Appears in that project's section on every employee dashboard.",
  },
  {
    value: "direct",
    icon: Target,
    emoji: "🎯",
    title: "Direct Assignment",
    hint: "Assigned immediately to one employee. Nobody else can see or claim it.",
  },
];

export function TaskForm({
  initial,
  submitLabel = "Save task",
  isSubmitting = false,
  apiError,
  onCancel,
  onSubmit,
}: {
  initial: TaskFormValues;
  submitLabel?: string;
  isSubmitting?: boolean;
  apiError?: string;
  onCancel: () => void;
  onSubmit: (values: TaskFormValues) => void;
}) {
  const [form, setForm] = useState<TaskFormValues>(initial);
  const [pointsInput, setPointsInput] = useState<string>(
    initial.points !== undefined && initial.points !== null ? String(initial.points) : "50",
  );
  const [replacingAttachmentId, setReplacingAttachmentId] = useState<string | null>(null);
  const replaceFileInputRef = useRef<HTMLInputElement>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dialog, setDialog] = useState<"create" | "edit" | "archive" | null>(null);
  const { data: allProjectList = [] } = useProjectsQuery();
  const [employeePage, setEmployeePage] = useState(1);
  const [employeeList, setEmployeeList] = useState<AuthUser[]>([]);
  const [hasOpenedEmployeeSelect, setHasOpenedEmployeeSelect] = useState(false);
  const [isEmployeeSelectOpen, setIsEmployeeSelectOpen] = useState(false);
  const [hasMoreEmployees, setHasMoreEmployees] = useState(true);
  const isFetchingMoreRef = useRef(false);
  const sentinelObserverRef = useRef<IntersectionObserver | null>(null);

  const isEmployeeQueryEnabled = hasOpenedEmployeeSelect || Boolean(form.assigneeId);
  const {
    data: employeeData,
    isFetching: isEmployeesFetching,
    error: employeeError,
  } = useEmployeesQuery(
    {
      page: employeePage,
      limit: EMPLOYEE_PAGE_SIZE,
    },
    {
      enabled: isEmployeeQueryEnabled,
    },
  );

  const { data: initialAssigneeData } = useEmployeeDetailsQuery(form.assigneeId, {
    enabled: Boolean(form.assigneeId),
  });

  useEffect(() => {
    if (!initialAssigneeData) return;
    setEmployeeList((current) => {
      const id = initialAssigneeData._id || initialAssigneeData.id;
      if (!id || current.some((e) => (e._id || e.id) === id)) return current;
      return [initialAssigneeData, ...current];
    });
  }, [initialAssigneeData]);

  useEffect(() => {
    if (!employeeData) return;
    setEmployeeList((current) => {
      const seenIds = new Set(current.map((employee) => employee._id || employee.id));
      const incoming = employeeData.employees.filter((employee) => {
        const id = employee._id || employee.id;
        if (!id || seenIds.has(id)) return false;
        seenIds.add(id);
        return true;
      });
      return [...current, ...incoming];
    });

    if (employeeData.pagination) {
      const { currentPage, totalPages } = employeeData.pagination;
      setHasMoreEmployees(currentPage < totalPages);
    } else {
      setHasMoreEmployees(employeeData.employees.length >= EMPLOYEE_PAGE_SIZE);
    }

    isFetchingMoreRef.current = false;
  }, [employeeData]);

  useEffect(() => {
    if (employeeError) {
      isFetchingMoreRef.current = false;
    }
  }, [employeeError]);

  const loadMoreEmployees = useCallback(() => {
    if (isEmployeesFetching || isFetchingMoreRef.current || !hasMoreEmployees) return;
    isFetchingMoreRef.current = true;
    setEmployeePage((page) => page + 1);
  }, [isEmployeesFetching, hasMoreEmployees]);

  const handleScroll = (event: React.UIEvent<HTMLElement>) => {
    const target = event.target as HTMLElement;
    const currentTarget = event.currentTarget as HTMLElement;
    const el =
      target && target.scrollHeight > target.clientHeight
        ? target
        : currentTarget && currentTarget.scrollHeight > currentTarget.clientHeight
          ? currentTarget
          : target || currentTarget;

    if (!el) return;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 48) {
      loadMoreEmployees();
    }
  };

  const handleWheel = (event: React.WheelEvent<HTMLElement>) => {
    const target = event.target as HTMLElement;
    const el =
      target.closest("[data-radix-select-viewport]") ||
      target.closest("[role='listbox']") ||
      (event.currentTarget as HTMLElement);

    if (el && el.scrollHeight - el.scrollTop - el.clientHeight < 48) {
      loadMoreEmployees();
    }
  };

  const sentinelCallback = useCallback(
    (node: HTMLDivElement | null) => {
      if (sentinelObserverRef.current) {
        sentinelObserverRef.current.disconnect();
      }
      if (!node || typeof IntersectionObserver === "undefined") return;
      sentinelObserverRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting) {
            loadMoreEmployees();
          }
        },
        { rootMargin: "48px" },
      );
      sentinelObserverRef.current.observe(node);
    },
    [loadMoreEmployees],
  );
  const activeProjects = allProjectList.filter((p) => (p.status || "").toLowerCase() === "active");
  const selectedProject = allProjectList.find(
    (p) => p.id === form.projectId || p._id === form.projectId,
  );

  const set = <K extends keyof TaskFormValues>(k: K, v: TaskFormValues[K]) =>
    setForm({ ...form, [k]: v });

  const handlePointsChange = (raw: string) => {
    // Allow empty string or numbers only
    if (raw !== "" && !/^\d+$/.test(raw)) return;
    setPointsInput(raw);
    const parsed = raw === "" ? 0 : parseInt(raw, 10);
    setForm((prev) => ({ ...prev, points: parsed }));
  };

  const uploadSingleFile = async (item: TaskAttachment) => {
    if (!item.file) return;

    setForm((prev) => ({
      ...prev,
      attachments: prev.attachments.map((att) =>
        att.id === item.id
          ? { ...att, isUploading: true, uploadProgress: 10, error: undefined }
          : att,
      ),
    }));

    try {
      const res = await uploadTaskAttachment(item.file, (percent) => {
        setForm((prev) => ({
          ...prev,
          attachments: prev.attachments.map((att) =>
            att.id === item.id ? { ...att, uploadProgress: percent } : att,
          ),
        }));
      });

      setForm((prev) => ({
        ...prev,
        attachments: prev.attachments.map((att) =>
          att.id === item.id
            ? {
                ...att,
                url: res.url,
                publicId: res.publicId,
                name: res.name || att.name,
                size: res.size || att.size,
                isUploading: false,
                uploadProgress: 100,
                error: undefined,
              }
            : att,
        ),
      }));
      toast.success(`${item.name} uploaded to storage.`);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : typeof err === "object" && err !== null && "message" in err
            ? String((err as { message: unknown }).message)
            : "Failed to upload file.";

      setForm((prev) => ({
        ...prev,
        attachments: prev.attachments.map((att) =>
          att.id === item.id ? { ...att, isUploading: false, error: message } : att,
        ),
      }));
      toast.error(`Upload failed for ${item.name}: ${message}`);
    }
  };

  const handleTriggerReplace = (id?: string) => {
    if (!id || busy) return;
    setReplacingAttachmentId(id);
    if (replaceFileInputRef.current) {
      replaceFileInputRef.current.value = "";
      replaceFileInputRef.current.click();
    }
  };

  const handleReplaceFile = async (file: File) => {
    if (!file || !replacingAttachmentId) return;

    const validation = validateTaskAttachmentFile(file);
    if (!validation.valid) {
      toast.error(`${file.name}: ${validation.error || "Invalid file"}`);
      setReplacingAttachmentId(null);
      return;
    }

    const targetId = replacingAttachmentId;
    const targetItem = form.attachments.find((a) => a.id === targetId);
    if (!targetItem) {
      setReplacingAttachmentId(null);
      return;
    }

    // Retain previous attachment in case replacement upload fails
    const previousItem = { ...targetItem };

    const formattedSize =
      file.size < 1024 * 1024
        ? `${(file.size / 1024).toFixed(0)} KB`
        : `${(file.size / (1024 * 1024)).toFixed(1)} MB`;

    // Keep previous attachment visible while uploading replacement
    setForm((prev) => ({
      ...prev,
      attachments: prev.attachments.map((att) =>
        att.id === targetId
          ? {
              ...att,
              isUploading: true,
              uploadProgress: 10,
              error: undefined,
            }
          : att,
      ),
    }));

    try {
      const res = await uploadTaskAttachment(file, (percent) => {
        setForm((prev) => ({
          ...prev,
          attachments: prev.attachments.map((att) =>
            att.id === targetId ? { ...att, uploadProgress: percent } : att,
          ),
        }));
      });

      // Update state: REPLACE the old attachment completely with the new replacement
      setForm((prev) => ({
        ...prev,
        attachments: prev.attachments.map((att) =>
          att.id === targetId
            ? {
                id: `replaced-${Date.now()}-${res.name || file.name}`,
                name: res.name || file.name,
                size: res.size || formattedSize,
                url: res.url,
                publicId: res.publicId,
                file,
                isUploading: false,
                uploadProgress: 100,
                error: undefined,
              }
            : att,
        ),
      }));

      toast.success(`Replaced "${previousItem.name}" with "${res.name || file.name}".`);
    } catch (err: unknown) {
      // Retain previous valid attachment on failure
      setForm((prev) => ({
        ...prev,
        attachments: prev.attachments.map((att) =>
          att.id === targetId ? previousItem : att,
        ),
      }));
      const message =
        err instanceof Error
          ? err.message
          : typeof err === "object" && err !== null && "message" in err
            ? String((err as { message: unknown }).message)
            : "Replacement upload failed.";
      toast.error(`Failed to replace ${previousItem.name}: ${message}`);
    } finally {
      setReplacingAttachmentId(null);
      if (replaceFileInputRef.current) {
        replaceFileInputRef.current.value = "";
      }
    }
  };

  const handleFiles = (files: FileList | File[] | null) => {
    if (!files) return;
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    const itemsToAdd: TaskAttachment[] = [];

    for (const f of fileArray) {
      // Prevent duplicate attachments
      const isDuplicate = form.attachments.some(
        (att) =>
          att.name === f.name &&
          (att.file?.size === f.size || att.size?.includes(String(Math.round(f.size / 1024)))),
      );
      if (isDuplicate) {
        toast.info(`"${f.name}" is already attached.`);
        continue;
      }

      const validation = validateTaskAttachmentFile(f);
      if (!validation.valid) {
        toast.error(`${f.name}: ${validation.error || "Invalid file"}`);
        continue;
      }

      const id = `${f.name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const formattedSize =
        f.size < 1024 * 1024
          ? `${(f.size / 1024).toFixed(0)} KB`
          : `${(f.size / (1024 * 1024)).toFixed(1)} MB`;

      const newItem: TaskAttachment = {
        id,
        name: f.name,
        size: formattedSize,
        file: f,
        isUploading: true,
        uploadProgress: 10,
      };

      itemsToAdd.push(newItem);
    }

    if (itemsToAdd.length === 0) return;

    // Add files to state
    setForm((prev) => ({
      ...prev,
      attachments: [...prev.attachments, ...itemsToAdd],
    }));

    // Start direct CDN upload for each file immediately
    itemsToAdd.forEach((item) => {
      void uploadSingleFile(item);
    });
  };

  const isUploadingAny = form.attachments.some((a) => a.isUploading);
  const busy = isSubmitting || isUploadingAny;

  const attachmentAccept = ALLOWED_TASK_ATTACHMENT_EXTENSIONS.map((e) => `.${e}`).join(",");

  const {
    isDragging: isAttachmentDragging,
    inputRef: attachmentInputRef,
    openFileDialog: openAttachmentDialog,
    dragProps: attachmentDragProps,
    pasteProps: attachmentPasteProps,
    keyboardProps: attachmentKeyboardProps,
  } = useFileDropPaste({
    accept: attachmentAccept,
    maxSize: MAX_TASK_FILE_SIZE,
    multiple: true,
    disabled: busy,
    existingFiles: form.attachments,
    validateFile: validateTaskAttachmentFile,
    label: "task attachment",
    onFiles: (newFiles) => {
      handleFiles(newFiles);
    },
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!form.title.trim()) errs.title = "Title is required";
    if (!form.description.trim()) errs.description = "Add a short description";
    if (!form.dueDate) errs.dueDate = "Pick a deadline";
    const numericPoints = pointsInput.trim() === "" ? 0 : Number(pointsInput);
    if (numericPoints <= 0 || isNaN(numericPoints)) errs.points = "Points must be greater than 0";
    if (form.taskType === "project" && !form.projectId) errs.projectId = "Pick a project";
    if (form.taskType === "direct" && !form.assigneeId) errs.assigneeId = "Pick an employee";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    // Check if any attachments are actively uploading
    const isUploading = form.attachments.some((a) => a.isUploading);
    if (isUploading) {
      toast.error("Please wait for all attachments to finish uploading to storage.");
      return;
    }

    const hasFailed = form.attachments.some((a) => Boolean(a.error) && !a.url);
    if (hasFailed) {
      toast.error("Please retry or remove failed attachments before saving.");
      return;
    }

    onSubmit({ ...form, points: numericPoints });
  };

  return (
    <form onSubmit={submit} className="grid gap-5 lg:grid-cols-3">
      <div className="glass space-y-5 rounded-2xl p-6 lg:col-span-2">
        {apiError && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
            {apiError}
          </div>
        )}

        <Field label="Title" error={errors.title}>
          <Input
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="e.g. Migrate to new analytics SDK"
            className="h-11"
          />
        </Field>

        <Field label="Description" error={errors.description}>
          <Textarea
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="What needs to be done and why…"
            rows={4}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Category">
            <Select value={form.category} onValueChange={(v) => set("category", v)}>
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from(new Set([form.category, ...taskCategories].filter(Boolean))).map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Priority">
            <Select value={form.priority} onValueChange={(v) => set("priority", v as TaskPriority)}>
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>

        <Field label="Notes (optional)">
          <Textarea
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            placeholder="Internal context for reviewers…"
            rows={3}
          />
        </Field>

        <div>
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Attachments (Direct CDN Upload)
            </Label>
            <span className="text-[11px] text-muted-foreground">
              Up to {(MAX_TASK_FILE_SIZE / (1024 * 1024)).toFixed(0)} MB per file
            </span>
          </div>

          <div
            {...attachmentDragProps}
            {...attachmentPasteProps}
            {...attachmentKeyboardProps}
            onClick={openAttachmentDialog}
            className={`mt-2 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 text-center transition-all outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
              isAttachmentDragging
                ? "border-primary bg-primary/10 shadow-glow scale-[1.01]"
                : "border-border/70 bg-card/40 hover:border-primary/60 hover:bg-primary/5"
            } ${busy ? "pointer-events-none opacity-50" : ""}`}
            aria-label="Upload task attachments. Drag and drop files, paste with Ctrl+V, or press Enter to browse"
          >
            <div
              className={`grid h-12 w-12 place-items-center rounded-xl transition-all ${
                isAttachmentDragging
                  ? "scale-110 bg-primary/20 text-primary shadow-md"
                  : "bg-primary/15 text-primary group-hover:scale-105"
              }`}
            >
              <FileUp className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold text-foreground">
              Drag and drop files, paste with Ctrl+V, or browse
            </p>
            <p className="text-xs text-muted-foreground">
              {ALLOWED_TASK_ATTACHMENT_EXTENSIONS.join(", ").toUpperCase()} (max 10 MB each, direct
              CDN upload)
            </p>
            <p className="mt-1 inline-flex items-center gap-1.5 text-[11px] text-muted-foreground/80">
              <span>
                Press{" "}
                <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-foreground border border-border/70">
                  Ctrl+V
                </kbd>{" "}
                to paste screenshot or file
              </span>
              <span>•</span>
              <span className="text-primary font-medium hover:underline">Browse files</span>
            </p>
            <input
              ref={attachmentInputRef}
              id="task-attachment"
              type="file"
              multiple
              accept={attachmentAccept}
              disabled={busy}
              className="sr-only"
              onChange={(e) => {
                handleFiles(e.target.files);
                e.target.value = "";
              }}
            />
            {/* Dedicated input for single attachment replacement */}
            <input
              ref={replaceFileInputRef}
              type="file"
              accept={attachmentAccept}
              disabled={busy}
              className="sr-only"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  void handleReplaceFile(e.target.files[0]);
                  e.target.value = "";
                }
              }}
            />
          </div>

          {form.attachments.length > 0 && (
            <ul className="mt-3 space-y-2.5">
              {form.attachments.map((a, i) => (
                <li
                  key={a.id || i}
                  className="rounded-xl border border-border/60 bg-card/40 p-3 text-sm transition-colors"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex min-w-0 items-center gap-2">
                      <Paperclip className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <span className="truncate font-medium">{a.name}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">{a.size}</span>
                    </span>

                    <div className="flex shrink-0 items-center gap-2">
                      {a.isUploading && (
                        <span className="inline-flex items-center gap-1.5 text-xs text-primary font-medium">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span>{a.uploadProgress || 0}%</span>
                        </span>
                      )}

                      {!a.isUploading && a.url && (
                        <span className="inline-flex items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 rounded-sm bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                            <Check className="h-3 w-3" /> Uploaded
                          </span>
                          <a
                            href={a.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="grid h-7 w-7 place-items-center rounded-md border border-border/60 text-muted-foreground hover:text-primary hover:border-primary/40"
                            title="Preview file"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground rounded-lg"
                            onClick={() => handleTriggerReplace(a.id)}
                            disabled={busy}
                            title="Replace this attachment with a different file"
                          >
                            <RotateCw className="mr-1 h-3 w-3" /> Replace
                          </Button>
                        </span>
                      )}

                      {!a.isUploading && a.error && (
                        <div className="inline-flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 text-[11px] text-destructive">
                            <AlertCircle className="h-3.5 w-3.5 shrink-0" /> Failed
                          </span>
                          {a.file && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-6 px-2 text-[11px]"
                              onClick={() => void uploadSingleFile(a)}
                            >
                              <RotateCw className="mr-1 h-3 w-3" /> Retry
                            </Button>
                          )}
                        </div>
                      )}

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-md hover:bg-destructive/10 hover:text-destructive"
                        onClick={() =>
                          set(
                            "attachments",
                            form.attachments.filter((_, idx) => idx !== i),
                          )
                        }
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {a.isUploading && (
                    <div className="mt-2 space-y-1">
                      <Progress value={a.uploadProgress || 10} className="h-1.5" />
                      <p className="text-[10px] text-muted-foreground">
                        Uploading directly to CDN…
                      </p>
                    </div>
                  )}

                  {!a.isUploading && a.error && (
                    <p className="mt-1 text-[11px] text-destructive">{a.error}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="glass space-y-5 rounded-2xl p-6">
        {/* Task Category — mutually exclusive radio cards */}
        <div className="space-y-3">
          <div>
            <h3 className="font-display text-base font-semibold">Task Category</h3>
            <p className="text-xs text-muted-foreground">Choose how this task reaches employees.</p>
          </div>
          <div role="radiogroup" aria-label="Task Category" className="grid gap-2.5">
            {categoryOptions.map((opt) => {
              const active = form.taskType === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setForm({ ...form, taskType: opt.value })}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-md border p-3.5 text-left transition-all",
                    active
                      ? "border-primary/60 bg-primary/10 shadow-glow"
                      : "border-border/60 bg-card/40 hover:border-primary/40 hover:bg-secondary/40",
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-md text-base",
                      active
                        ? "bg-primary/20 text-primary"
                        : "bg-secondary/60 text-muted-foreground",
                    )}
                  >
                    <opt.icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 text-sm font-semibold">
                      <span aria-hidden>{opt.emoji}</span> {opt.title}
                    </span>
                    <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                      {opt.hint}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "mt-1 grid h-4 w-4 shrink-0 place-items-center rounded-full border",
                      active ? "border-primary" : "border-border",
                    )}
                  >
                    {active && <span className="h-2 w-2 rounded-full bg-primary" />}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {form.taskType === "project" && (
          <>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Project
                </Label>
                <div className="flex items-center gap-1">
                  <IconAction label="Add project" onClick={() => setDialog("create")}>
                    <FolderPlus className="h-3.5 w-3.5" />
                  </IconAction>
                  <IconAction
                    label="Rename project"
                    disabled={!selectedProject}
                    onClick={() => setDialog("edit")}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </IconAction>
                  <IconAction
                    label="Archive or delete project"
                    disabled={!selectedProject}
                    onClick={() => setDialog("archive")}
                  >
                    <Archive className="h-3.5 w-3.5" />
                  </IconAction>
                </div>
              </div>
              <Select
                value={form.projectId}
                onValueChange={(v) => setForm({ ...form, projectId: v, template: "" })}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {activeProjects.length === 0 ? (
                    <div className="px-2 py-3 text-xs text-muted-foreground">
                      No active projects — add one.
                    </div>
                  ) : (
                    activeProjects.map((p) => {
                      const targetId = p._id || p.id;
                      return (
                        <SelectItem key={targetId} value={targetId}>
                          <span className="inline-flex items-center gap-2">
                            {p.color && (
                              <span
                                className="h-2.5 w-2.5 rounded-sm"
                                style={{ backgroundColor: p.color }}
                              />
                            )}
                            {p.name}
                            <span className="font-mono text-[10px] tracking-wider text-muted-foreground">
                              {p.code}
                            </span>
                          </span>
                        </SelectItem>
                      );
                    })
                  )}
                </SelectContent>
              </Select>
              {errors.projectId && <p className="text-xs text-destructive">{errors.projectId}</p>}
            </div>

            <CreateProjectDialog
              open={dialog === "create"}
              onOpenChange={(v) => setDialog(v ? "create" : null)}
              onCreated={(p) => setForm((f) => ({ ...f, projectId: p._id || p.id, template: "" }))}
            />
            <EditProjectDialog
              open={dialog === "edit"}
              onOpenChange={(v) => setDialog(v ? "edit" : null)}
              project={selectedProject}
            />
            <ArchiveProjectDialog
              open={dialog === "archive"}
              onOpenChange={(v) => setDialog(v ? "archive" : null)}
              project={selectedProject}
              onRemoved={() => setForm((f) => ({ ...f, projectId: "", template: "" }))}
            />

            {form.projectId && (
              <Field label="Task template">
                <Select
                  value={form.template}
                  onValueChange={(v) =>
                    setForm({ ...form, template: v, title: form.title.trim() ? form.title : v })
                  }
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select a task template" />
                  </SelectTrigger>
                  <SelectContent>
                    {(selectedProject?.templates ?? []).map((t: string) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}
          </>
        )}

        {form.taskType === "direct" && (
          <Field label="Assign employee" error={errors.assigneeId}>
            <Select
              value={form.assigneeId}
              onValueChange={(v) => set("assigneeId", v)}
              open={isEmployeeSelectOpen}
              onOpenChange={(open) => {
                setIsEmployeeSelectOpen(open);
                if (open) {
                  setHasOpenedEmployeeSelect(true);
                }
              }}
            >
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Select an employee" />
              </SelectTrigger>
              <SelectContent
                className="max-h-60 overflow-y-auto"
                style={{ maxHeight: "240px", overflowY: "auto" }}
                onScrollCapture={handleScroll}
                onScroll={handleScroll}
                onWheelCapture={handleWheel}
              >
                {employeeList.map((e) => {
                  const targetId = e._id || e.id || "";
                  const code = e.empId || e.code || "";
                  const avatar = e.name ? e.name.slice(0, 2).toUpperCase() : "EM";
                  return (
                    <SelectItem key={targetId} value={targetId}>
                      <span className="inline-flex items-center gap-2">
                        <span className="grid h-5 w-5 place-items-center rounded-full bg-primary/20 text-[10px] font-semibold text-primary">
                          {avatar}
                        </span>
                        {e.name}
                        {code && (
                          <span className="font-mono text-[10px] tracking-wider text-muted-foreground">
                            {code}
                          </span>
                        )}
                      </span>
                    </SelectItem>
                  );
                })}
                {isEmployeesFetching && employeeList.length > 0 && (
                  <SelectItem disabled value="__employees-loading-more">
                    <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                      Loading more employees…
                    </span>
                  </SelectItem>
                )}
                {isEmployeesFetching && employeeList.length === 0 && (
                  <SelectItem disabled value="__employees-loading">
                    <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                      Loading employees…
                    </span>
                  </SelectItem>
                )}
                {!isEmployeesFetching && employeeList.length === 0 && !employeeError && (
                  <SelectItem disabled value="__employees-empty">
                    No employees found.
                  </SelectItem>
                )}
                {employeeError && employeeList.length === 0 && (
                  <SelectItem disabled value="__employees-error">
                    <span className="text-xs text-destructive">
                      Failed to load employees.
                    </span>
                  </SelectItem>
                )}
                <div ref={sentinelCallback} className="h-px w-full pointer-events-none" aria-hidden="true" />
              </SelectContent>
            </Select>
          </Field>
        )}

        <Field label="Estimated time (optional)">
          <div className="relative">
            <Timer className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={form.estimatedTime}
              onChange={(e) => set("estimatedTime", e.target.value)}
              placeholder="e.g. 4h or 2 days"
              className="h-11 pl-9"
            />
          </div>
        </Field>

        <Field label="Reward points">
          <div className="relative">
            <Trophy className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-warning" />
            <Input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="e.g. 50"
              value={pointsInput}
              onChange={(e) => handlePointsChange(e.target.value)}
              className="h-11 pl-9"
            />
          </div>
          {errors.points && <p className="text-xs text-destructive">{errors.points}</p>}
        </Field>

        <Field label="Deadline" error={errors.dueDate}>
          <div className="relative">
            <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="date"
              value={form.dueDate}
              onChange={(e) => set("dueDate", e.target.value)}
              className="h-11 pl-9"
            />
          </div>
        </Field>

        <div className="rounded-xl border border-border/60 bg-card/40 p-4 text-xs text-muted-foreground">
          <p className="font-medium text-foreground">Preview</p>
          <p className="mt-1">{form.title || "Untitled task"}</p>
          <p className="mt-0.5">
            {form.taskType === "direct"
              ? `${employeeList.find((e) => (e._id || e.id) === form.assigneeId)?.name ?? "Unassigned"} · ${employeeList.find((e) => (e._id || e.id) === form.assigneeId)?.empId ?? "—"}`
              : form.taskType === "project"
                ? `Open to all · ${selectedProject?.name ?? "No project"}`
                : "Open to all employees"}
            {" · "}
            {form.priority} priority · {form.points} pts
          </p>
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            className="rounded-md"
            disabled={isSubmitting}
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} className="rounded-md shadow-glow">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Save className="mr-1.5 h-4 w-4" /> {submitLabel}
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}

function IconAction({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="h-7 w-7 rounded-md border-border/60 bg-card/40 text-muted-foreground hover:border-primary/50 hover:text-primary"
    >
      {children}
    </Button>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
