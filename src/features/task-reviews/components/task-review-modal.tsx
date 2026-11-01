import React, { useState, useEffect, Component, type ErrorInfo } from "react";
import {
  CheckCircle2,
  XCircle,
  ShieldCheck,
  User,
  Mail,
  StickyNote,
  Trophy,
  Calendar,
  UploadCloud,
  FileText,
  FileImage,
  Eye,
  Download,
  Clock,
  ExternalLink,
  MessageSquare,
  Loader2,
  Paperclip,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { TaskPriorityBadge, TaskStatusBadge } from "@/components/task-status-badge";
import { useReviewTaskMutation, type Task, type ReviewAttachment } from "@/features/tasks";
import { getSubmission } from "@/lib/submission-store";
import { useAuth } from "@/lib/auth";
import {
  validateTaskAttachmentFile,
  uploadTaskAttachment,
  ALLOWED_TASK_ATTACHMENT_EXTENSIONS,
} from "@/lib/cdn-upload";
import { useFileDropPaste } from "@/hooks/use-file-drop-paste";

interface TaskReviewModalProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

/**
 * Safely extracts a display string from any unknown value (string, populated object, etc.)
 * Prevents React fatal crashes: "Objects are not valid as a React child".
 */
export function extractSafeString(val: unknown, fallback = ""): string {
  if (val === null || val === undefined) return fallback;
  if (typeof val === "string") return val.trim() || fallback;
  if (typeof val === "number" || typeof val === "boolean") return String(val);
  if (typeof val === "object") {
    const obj = val as Record<string, unknown>;
    if (typeof obj.name === "string" && obj.name.trim()) return obj.name.trim();
    if (typeof obj.text === "string" && obj.text.trim()) return obj.text.trim();
    if (typeof obj.title === "string" && obj.title.trim()) return obj.title.trim();
    if (typeof obj.summary === "string" && obj.summary.trim()) return obj.summary.trim();
    if (typeof obj.message === "string" && obj.message.trim()) return obj.message.trim();
    if (typeof obj.note === "string" && obj.note.trim()) return obj.note.trim();
    if (typeof obj.fullName === "string" && obj.fullName.trim()) return obj.fullName.trim();
    if (typeof obj.email === "string" && obj.email.trim()) return obj.email.trim();
  }
  return fallback;
}

function isImageProof(type?: unknown, name?: unknown): boolean {
  if (typeof type === "string" && type.startsWith("image/")) return true;
  if (!name || typeof name !== "string") return false;
  const ext = name.toLowerCase().slice(name.lastIndexOf("."));
  return ext === ".jpg" || ext === ".jpeg" || ext === ".png" || ext === ".webp" || ext === ".gif";
}

function isPdfProof(type?: unknown, name?: unknown): boolean {
  if (typeof type === "string" && type === "application/pdf") return true;
  if (!name || typeof name !== "string") return false;
  return name.toLowerCase().endsWith(".pdf");
}

function formatDateSafe(
  dateValue?: unknown,
  options?: Intl.DateTimeFormatOptions,
  fallback = "No deadline"
): string {
  if (!dateValue || (typeof dateValue === "object" && !(dateValue instanceof Date))) return fallback;
  try {
    const d = new Date(dateValue as string | number | Date);
    if (isNaN(d.getTime())) return fallback;
    return d.toLocaleDateString(undefined, options || { dateStyle: "medium" });
  } catch {
    return fallback;
  }
}

function formatDateTimeSafe(
  dateValue?: unknown,
  options?: Intl.DateTimeFormatOptions,
  fallback = "N/A"
): string {
  if (!dateValue || (typeof dateValue === "object" && !(dateValue instanceof Date))) return fallback;
  try {
    const d = new Date(dateValue as string | number | Date);
    if (isNaN(d.getTime())) return fallback;
    return d.toLocaleString(undefined, options || { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return fallback;
  }
}

function cleanTextContent(text?: string): string {
  if (!text || typeof text !== "string") return "";
  return text
    .replace(/Proof files attached[^\n]*\n[\s\S]*?(?=(?:\n\n|\n[A-Z][a-zA-Z\s]+:|$))/gi, "")
    .replace(/Proof files attached:[^\n]*/gi, "")
    .replace(/https?:\/\/res\.cloudinary\.com[^\s)]+/gi, "")
    .replace(/\[\s*\{[\s\S]*?\}\s*\]/g, "")
    .replace(/\{\s*"[^"]+"\s*:[\s\S]*?\}/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function parseSubmissionNotes(notes?: unknown) {
  if (!notes || typeof notes !== "string") return {};
  const sections: {
    workSummary?: string;
    deliverableLinks?: string;
    issues?: string;
    additionalRemarks?: string;
    generalNotes?: string;
  } = {};

  const hasHeaders = /Work Summary:|Deliverables & Links:|Issues & Blockers:|Additional Remarks:/i.test(notes);
  if (!hasHeaders) {
    sections.generalNotes = cleanTextContent(notes);
    return sections;
  }

  const workSummaryMatch = notes.match(/Work Summary:\s*([\s\S]*?)(?=(?:Deliverables & Links:|Proof files attached|Issues & Blockers:|Additional Remarks:|$))/i);
  if (workSummaryMatch && workSummaryMatch[1].trim()) {
    sections.workSummary = cleanTextContent(workSummaryMatch[1]);
  }

  const linksMatch = notes.match(/Deliverables & Links:\s*([\s\S]*?)(?=(?:Proof files attached|Issues & Blockers:|Additional Remarks:|$))/i);
  if (linksMatch && linksMatch[1].trim()) {
    sections.deliverableLinks = linksMatch[1].trim();
  }

  const issuesMatch = notes.match(/Issues & Blockers:\s*([\s\S]*?)(?=(?:Additional Remarks:|$))/i);
  if (issuesMatch && issuesMatch[1].trim()) {
    sections.issues = cleanTextContent(issuesMatch[1]);
  }

  const remarksMatch = notes.match(/Additional Remarks:\s*([\s\S]*?)$/i);
  if (remarksMatch && remarksMatch[1].trim()) {
    sections.additionalRemarks = cleanTextContent(remarksMatch[1]);
  }

  return sections;
}

/**
 * Internal Error Boundary to prevent any malformed submission record from crashing the entire app.
 */
interface ModalErrorBoundaryProps {
  children: React.ReactNode;
  onCancel: () => void;
}

interface ModalErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

class ModalErrorBoundary extends Component<ModalErrorBoundaryProps, ModalErrorBoundaryState> {
  constructor(props: ModalErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMessage: "" };
  }

  static getDerivedStateFromError(error: Error): ModalErrorBoundaryState {
    return { hasError: true, errorMessage: error?.message || "An unexpected error occurred." };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[TaskReviewModal caught error]:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 text-center space-y-4">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-destructive/15 text-destructive">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold text-foreground">
            Could not render submission details
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
            This submission contains non-standard data that could not be displayed. You can close this modal safely without affecting any records.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={this.props.onCancel}
              className="rounded-xl h-9 px-4 text-xs font-medium"
            >
              Close
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

/**
 * Main review dialog content
 */
function TaskReviewModalContent({
  task,
  open,
  onOpenChange,
  onSuccess,
}: TaskReviewModalProps) {
  const { user } = useAuth();
  const [feedback, setFeedback] = useState("");
  const [pendingAction, setPendingAction] = useState<"approve" | "reject" | null>(null);
  const [previewFile, setPreviewFile] = useState<{ name: string; url: string; isImg: boolean; isPdf: boolean } | null>(null);
  const [attachment, setAttachment] = useState<ReviewAttachment | null>(null);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const reviewMutation = useReviewTaskMutation({
    onSuccess: () => {
      toast.success("Feedback and task review saved successfully.");
      onOpenChange(false);
      setFeedback("");
      setPendingAction(null);
      setPreviewFile(null);
      setAttachment(null);
      setIsUploadingAttachment(false);
      setUploadProgress(0);
      onSuccess?.();
    },
    onError: () => {
      setPendingAction(null);
    },
  });

  useEffect(() => {
    if (open) {
      setFeedback("");
      setPendingAction(null);
      setPreviewFile(null);
      setAttachment(null);
      setIsUploadingAttachment(false);
      setUploadProgress(0);
    }
  }, [open]);

  const handleAttachmentFile = async (file: File) => {
    if (!file || isUploadingAttachment || !task) return;

    const validation = validateTaskAttachmentFile(file);
    if (!validation.valid) {
      toast.error(validation.error || "Invalid file for review attachment.");
      return;
    }

    // Preserve previous valid attachment in case new upload fails (Data safety requirement)
    const previousAttachment = attachment;

    try {
      setIsUploadingAttachment(true);
      setUploadProgress(10);

      const res = await uploadTaskAttachment(file, (percent) => {
        setUploadProgress(percent);
      });

      // Update state: completely supersede old attachment with new uploaded replacement
      setAttachment({
        name: res.name || file.name,
        url: res.url,
        publicId: res.publicId,
        size: res.size,
        mimeType: file.type,
      });
      toast.success(
        previousAttachment
          ? `Replaced attachment with "${res.name || file.name}".`
          : `Attached "${res.name || file.name}" to review.`
      );
    } catch (err: unknown) {
      // Retain previous valid attachment on failure
      setAttachment(previousAttachment);
      const message =
        err instanceof Error
          ? err.message
          : typeof err === "object" && err !== null && "message" in err
            ? String((err as { message: unknown }).message)
            : "Failed to upload review attachment.";
      toast.error(`Attachment upload failed: ${message}`);
    } finally {
      setIsUploadingAttachment(false);
      setUploadProgress(0);
      if (attachmentInputRef.current) {
        attachmentInputRef.current.value = "";
      }
    }
  };

  const handleRemoveAttachment = () => {
    if (isUploadingAttachment) return;
    setAttachment(null);
    if (attachmentInputRef.current) {
      attachmentInputRef.current.value = "";
    }
  };

  const handleCancel = () => {
    if (reviewMutation.isPending) return;
    setFeedback("");
    setAttachment(null);
    setPreviewFile(null);
    setPendingAction(null);
    setIsUploadingAttachment(false);
    if (attachmentInputRef.current) {
      attachmentInputRef.current.value = "";
    }
    onOpenChange(false);
  };

  const {
    isDragging: isAttachmentDragging,
    inputRef: attachmentInputRef,
    openFileDialog: openAttachmentDialog,
    dragProps: attachmentDragProps,
    pasteProps: attachmentPasteProps,
    keyboardProps: attachmentKeyboardProps,
  } = useFileDropPaste({
    accept: ALLOWED_TASK_ATTACHMENT_EXTENSIONS.map((e) => `.${e}`).join(","),
    maxSize: 10 * 1024 * 1024,
    multiple: false,
    disabled: !task || isUploadingAttachment || reviewMutation.isPending,
    label: "review attachment",
    validateFile: validateTaskAttachmentFile,
    onFiles: (files) => {
      if (files[0]) {
        void handleAttachmentFile(files[0]);
      }
    },
  });

  // ALL HOOKS EXECUTED UNCONDITIONALLY ABOVE.
  if (!task) return null;

  const taskId = extractSafeString(task._id || task.id, "");
  const localSub = (() => {
    try {
      return taskId ? getSubmission(taskId) : undefined;
    } catch {
      return undefined;
    }
  })();

  // Resolve proof files safely (from API task.proofFiles, fallback to attachments, fallback to local submission store, fallback to notes)
  const proofList: Array<{
    name: string;
    size?: string | number;
    url?: string;
    dataUrl?: string;
    mimeType?: string;
  }> = [];

  if (Array.isArray(task.proofFiles) && task.proofFiles.length > 0) {
    for (const p of (task.proofFiles as unknown[])) {
      if (!p) continue;
      if (typeof p === "string") {
        let name = "Proof File";
        try {
          const parts = p.split("/");
          const last = parts[parts.length - 1];
          if (last) name = decodeURIComponent(last.split("?")[0]);
        } catch (_err) {
          // ignore
        }
        proofList.push({ name, url: p, size: "File" });
      } else if (typeof p === "object" && p !== null) {
        const pObj = p as Record<string, unknown>;
        const fileUrl = extractSafeString(pObj.url || pObj.secure_url || pObj.path || pObj.dataUrl, "");
        let fileName = typeof pObj.name === "string" ? pObj.name : "";
        if (!fileName && fileUrl) {
          try {
            const parts = fileUrl.split("/");
            const last = parts[parts.length - 1];
            if (last) fileName = decodeURIComponent(last.split("?")[0]);
          } catch (_err) {
            // ignore
          }
        }
        proofList.push({
          name: fileName || "Proof File",
          size: typeof pObj.size === "number" || typeof pObj.size === "string" ? pObj.size : "File",
          url: fileUrl,
          dataUrl: typeof pObj.dataUrl === "string" ? (pObj.dataUrl as string) : undefined,
          mimeType: typeof pObj.mimeType === "string" ? pObj.mimeType : typeof pObj.type === "string" ? (pObj.type as string) : undefined,
        });
      }
    }
  } else if (localSub?.files && Array.isArray(localSub.files) && localSub.files.length > 0) {
    for (const f of localSub.files) {
      if (!f) continue;
      proofList.push({
        name: typeof f.name === "string" ? f.name : "Proof File",
        size: typeof f.size === "number" ? `${Math.round(f.size / 1024)} KB` : String(f.size || "File"),
        url: f.url || f.dataUrl || "",
        dataUrl: f.dataUrl,
        mimeType: typeof f.type === "string" ? f.type : undefined,
      });
    }
  }


  // Fallback: parse proof files from task.notes if list is still empty
  if (proofList.length === 0 && typeof task.notes === "string" && task.notes.includes("Proof files attached")) {
    const proofBlockMatch = task.notes.match(/Proof files attached[^\n]*\n([\s\S]*?)(?=(?:\n\n|\n[A-Z][a-zA-Z\s]+:|$))/i);
    if (proofBlockMatch && proofBlockMatch[1]) {
      const lines = proofBlockMatch[1].split("\n").map((l) => l.trim()).filter((l) => l.startsWith("-"));
      for (const line of lines) {
        const clean = line.replace(/^-\s*/, "");
        const separatorIdx = clean.indexOf(":");
        if (separatorIdx !== -1) {
          const name = clean.slice(0, separatorIdx).trim();
          const url = clean.slice(separatorIdx + 1).trim();
          if (url) {
            proofList.push({
              name: name || "Proof File",
              url,
              size: "File",
            });
          }
        }
      }
    }
  }

  const submitterName = extractSafeString(
    task.submittedBy || localSub?.employeeName || task.assignee,
    "Assigned Employee"
  );
  const submitterCode = extractSafeString(
    task.assigneeCode || localSub?.employeeCode,
    ""
  );
  const submitterEmail = extractSafeString(task.assigneeEmail, "");
  const submittedAt = task.submittedAt || localSub?.submittedAt;

  // Structured fields: workSummary, deliverableLinks, issues/submissionNotes, additionalRemarks
  const parsedNotes = parseSubmissionNotes(task.notes);
  const taskRecord = task as unknown as Record<string, unknown>;

  const workSummary = extractSafeString(
    taskRecord.workSummary || localSub?.workSummary || parsedNotes.workSummary,
    ""
  );

  const rawDeliverableLinks =
    taskRecord.deliverableLinks || localSub?.deliverableLinks || parsedNotes.deliverableLinks;

  const deliverableLinksList: string[] = Array.isArray(rawDeliverableLinks)
    ? rawDeliverableLinks
        .map((l: unknown) => {
          if (!l) return "";
          if (typeof l === "string") return l.trim();
          if (typeof l === "object" && l !== null) {
            const lObj = l as Record<string, unknown>;
            return extractSafeString(lObj.url || lObj.link || lObj.href, "");
          }
          return String(l).trim();
        })
        .filter(Boolean)
    : typeof rawDeliverableLinks === "string"
      ? rawDeliverableLinks
          .split(/[\n,]+/)
          .map((l) => l.trim())
          .filter(Boolean)
      : [];

  const submissionNotes = extractSafeString(
    taskRecord.issues ||
      localSub?.issues ||
      parsedNotes.issues ||
      parsedNotes.generalNotes ||
      (!workSummary && deliverableLinksList.length === 0 ? task.notes : undefined),
    ""
  );

  const additionalRemarks = extractSafeString(
    taskRecord.additionalRemarks || localSub?.additionalRemarks || parsedNotes.additionalRemarks,
    ""
  );

  const taskTitle = extractSafeString(task.title, "Untitled Task");
  const taskDesc = extractSafeString(task.description, "");
  const rewardPointsDisplay = Number(task.points ?? task.rewardPoints ?? 0) || 0;
  const previousFeedback = extractSafeString(task.feedback, "");
  const previousReviewerName = extractSafeString(task.reviewedBy, "Admin");

  const handleReview = (isApproved: boolean) => {
    if (!taskId) {
      toast.error("Task identifier is missing.");
      return;
    }
    if (isUploadingAttachment) {
      toast.info("Please wait for attachment upload to complete before submitting.");
      return;
    }

    const trimmed = feedback.trim();
    if (!isApproved && trimmed.length < 5) {
      toast.error("Feedback required for rejection", {
        description: "Please enter at least 5 characters explaining what needs to be revised.",
      });
      return;
    }

    const defaultMsg = isApproved ? "Approved by Admin" : "Revision requested by Admin";
    const feedbackBase = trimmed || defaultMsg;
    // Format feedback to include the attachment link in the notes/feedback string supported by the existing API
    const feedbackMessage = attachment
      ? `${feedbackBase}\n\nReview Attachment: ${attachment.name} (${attachment.url})`
      : feedbackBase;

    // Persist to local storage dimisi-task-reviews for optimistic persistence across refresh
    try {
      if (typeof window !== "undefined" && window.localStorage && taskId) {
        const cached = JSON.parse(localStorage.getItem("dimisi-task-reviews") || "{}");
        const existingReviews = Array.isArray(cached[taskId]?.reviews) ? cached[taskId].reviews : [];
        const newReviewItem = {
          reviewerName: user?.name || "Admin",
          reviewerEmail: user?.email || "",
          feedback: feedbackMessage,
          status: isApproved ? "approved" : "rejected",
          reviewedAt: new Date().toISOString(),
          attachment: attachment || undefined,
        };
        cached[taskId] = {
          feedback: feedbackMessage,
          reviewerName: user?.name || "Admin",
          reviewerEmail: user?.email || "",
          reviewedAt: new Date().toISOString(),
          reviewStatus: isApproved ? "approved" : "rejected",
          reviews: [...existingReviews, newReviewItem],
          attachment: attachment || undefined,
        };
        localStorage.setItem("dimisi-task-reviews", JSON.stringify(cached));
      }
    } catch {
      // ignore
    }

    setPendingAction(isApproved ? "approve" : "reject");
    reviewMutation.mutate({
      id: taskId,
      isApproved,
      feedback: feedbackMessage,
      attachment: attachment
        ? {
            name: attachment.name,
            url: attachment.url,
            publicId: attachment.publicId,
            size: attachment.size,
            mimeType: attachment.mimeType,
          }
        : undefined,
    });
  };

  const handleDownloadFile = (file: { name: string; url?: string; dataUrl?: string }) => {
    const downloadUrl = file.url || file.dataUrl;
    if (!downloadUrl) {
      toast.error("Download URL not available for this proof file.");
      return;
    }

    try {
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = file.name || "task-proof";
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success(`Downloading ${file.name || "task-proof"}`);
    } catch {
      window.open(downloadUrl, "_blank");
    }
  };

  const handlePreviewFile = (file: { name: string; url?: string; dataUrl?: string; mimeType?: string }) => {
    const viewUrl = file.url || file.dataUrl;
    if (!viewUrl) {
      toast.error("Preview is not available for this file.");
      return;
    }

    const isImg = isImageProof(file.mimeType, file.name);
    const isPdf = isPdfProof(file.mimeType, file.name);

    if (isImg || isPdf) {
      setPreviewFile({
        name: file.name || "Proof File",
        url: viewUrl,
        isImg,
        isPdf,
      });
    } else {
      window.open(viewUrl, "_blank");
    }
  };

  const isRejectDisabled = feedback.trim().length < 5 || reviewMutation.isPending || isUploadingAttachment;
  const isApproveDisabled = reviewMutation.isPending || isUploadingAttachment;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        {/* Explicit !p-0 !pb-0 to override dialog.tsx mobile bottom padding which caused footer clipping */}
        <DialogContent className="inset-x-auto bottom-auto left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(96vw,840px)] max-w-[min(96vw,840px)] sm:max-w-[840px] max-h-[90dvh] sm:max-h-[90dvh] flex flex-col !p-0 !pb-0 gap-0 overflow-hidden rounded-2xl sm:rounded-2xl border-border/60 bg-background/95 backdrop-blur-xl shadow-2xl">
          <ModalErrorBoundary onCancel={handleCancel}>
            {/* Fixed Header */}
            <DialogHeader className="p-5 pb-4 border-b border-border/50 shrink-0 pr-12 text-left space-y-1">
              <div className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  <ShieldCheck className="h-4 w-4" />
                </span>
                <DialogTitle className="font-display text-xl font-bold tracking-tight text-foreground">
                  Review Task Submission
                </DialogTitle>
              </div>
              <DialogDescription className="text-xs text-muted-foreground leading-normal">
                Examine the employee&apos;s deliverables, verify attached proof files, and award reward points.
              </DialogDescription>
            </DialogHeader>

            {/* Vertically Scrollable Body */}
            <div className="p-5 overflow-y-auto overflow-x-hidden space-y-4 flex-1 min-h-0 min-w-0 max-w-full">
              {/* Task & Assignee Details Card */}
              <div className="rounded-2xl border border-border/50 bg-card/40 p-4 space-y-3.5 min-w-0">
                {/* Header: Title & Badges */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 min-w-0">
                  <div className="min-w-0 flex-1">
                    <h4 className="font-semibold text-base leading-snug break-words [overflow-wrap:anywhere] text-foreground">
                      {taskTitle}
                    </h4>
                    {taskDesc && (
                      <p className="text-xs text-muted-foreground mt-1.5 whitespace-pre-line break-words [overflow-wrap:anywhere] leading-relaxed">
                        {taskDesc}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 shrink-0 sm:self-start">
                    <TaskStatusBadge
                      status={
                        task.reviewState === "in_review" ||
                        (typeof task.rawStatus === "string" && task.rawStatus.toLowerCase() === "in_review") ||
                        (typeof task.status === "string" && task.status.toLowerCase() === "in_review")
                          ? "IN_REVIEW"
                          : task.status || "IN_REVIEW"
                      }
                      reviewState={task.reviewState}
                    />
                    <TaskPriorityBadge priority={task.priority} />
                  </div>
                </div>

                {/* Meta row: Assignee, Date, Points */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-border/40 text-xs">
                  {/* Submitter Info */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary text-xs font-semibold">
                      <User className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] text-muted-foreground font-medium">Assigned To</div>
                      <div className="font-semibold truncate text-foreground">{submitterName}</div>
                      {submitterEmail && (
                        <div className="text-[11px] text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                          <Mail className="h-2.5 w-2.5 shrink-0" />
                          <span className="truncate">{submitterEmail}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Due Date */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-muted/60 text-primary">
                      <Calendar className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-muted-foreground text-[11px] font-medium">Due Date</div>
                      <div className="font-semibold truncate text-foreground">
                        {formatDateSafe(task.dueDate, { dateStyle: "medium" }, "No deadline")}
                      </div>
                    </div>
                  </div>

                  {/* Reward Points */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-warning/15 text-warning">
                      <Trophy className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-muted-foreground text-[11px] font-medium">Reward Points</div>
                      <div className="font-bold text-warning truncate">
                        {rewardPointsDisplay} pts
                      </div>
                    </div>
                  </div>
                </div>

                {/* Task Creation Attachments (provided by Admin upon creation) */}
                {Array.isArray(task.attachments) && task.attachments.length > 0 && (
                  <div className="pt-3 border-t border-border/40 space-y-2 min-w-0">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                      <Paperclip className="h-3.5 w-3.5 text-primary" /> Task Attachments ({task.attachments.length})
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {task.attachments.map((att, idx) => {
                        const attUrl = typeof att === "string" ? att : att?.url;
                        const attName = (typeof att === "object" && att?.name) || "Attachment";
                        const attSize = (typeof att === "object" && att?.size) || "File";
                        return (
                          <div
                            key={idx}
                            className="flex items-center justify-between gap-2 rounded-xl border border-border/50 bg-background/40 px-3 py-2 text-xs min-w-0"
                          >
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <Paperclip className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              <span className="truncate font-medium text-foreground">{attName}</span>
                              <span className="text-[10px] text-muted-foreground shrink-0">{attSize}</span>
                            </div>
                            {attUrl && (
                              <a
                                href={attUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline font-medium text-[11px] shrink-0"
                              >
                                View
                              </a>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* MANDATORY SUBMITTED PROOF SECTION */}
              <div className="rounded-2xl border border-border/60 bg-card/50 p-4 space-y-3 min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-2 min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary">
                      <UploadCloud className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <h5 className="font-semibold text-sm leading-tight text-foreground truncate">
                        Submitted Task Proof
                      </h5>
                      <p className="text-[11px] text-muted-foreground truncate">
                        Attached by employee as evidence of completion
                      </p>
                    </div>
                  </div>

                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold shrink-0 ${
                      proofList.length > 0
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                        : "bg-destructive/15 text-destructive border border-destructive/30"
                    }`}
                  >
                    {proofList.length} proof file{proofList.length === 1 ? "" : "s"} attached
                  </span>
                </div>

                {/* Attribution Line */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/30 text-xs text-muted-foreground min-w-0">
                  <span className="inline-flex items-center gap-1.5 min-w-0 truncate">
                    <User className="h-3 w-3 text-primary shrink-0" />
                    <span className="truncate">
                      Submitted by: <strong className="text-foreground">{submitterName}</strong> {submitterCode ? `(${submitterCode})` : ""}
                    </span>
                  </span>
                  {submittedAt && (
                    <span className="inline-flex items-center gap-1 text-[11px] shrink-0">
                      <Clock className="h-3 w-3 text-muted-foreground shrink-0" />
                      {formatDateTimeSafe(submittedAt, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </span>
                  )}
                </div>

                {/* Proof Files List */}
                {proofList.length > 0 ? (
                  <div className="space-y-2 pt-1 min-w-0">
                    {proofList.map((file, i) => {
                      const isImg = isImageProof(file.mimeType, file.name);

                      return (
                        <div
                          key={`${file.name}-${i}`}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-border/60 bg-background/50 p-3 transition-colors hover:border-primary/40 min-w-0"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                              {isImg ? (
                                <FileImage className="h-5 w-5" />
                              ) : (
                                <FileText className="h-5 w-5" />
                              )}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium truncate break-all sm:break-normal text-foreground">
                                {file.name}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {file.size ? (typeof file.size === "number" ? `${Math.round(file.size / 1024)} KB` : String(file.size)) : "File"} · {(() => {
                                  const fn = typeof file.name === "string" ? file.name : "";
                                  const dot = fn.lastIndexOf(".");
                                  return dot >= 0 ? fn.slice(dot).toUpperCase() : "DOCUMENT";
                                })()}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => handlePreviewFile(file)}
                              className="h-8 gap-1.5 text-xs rounded-lg flex-1 sm:flex-initial"
                            >
                              <Eye className="h-3.5 w-3.5" /> Preview
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              onClick={() => handleDownloadFile(file)}
                              className="h-8 gap-1.5 text-xs rounded-lg bg-secondary hover:bg-secondary/80 flex-1 sm:flex-initial"
                            >
                              <Download className="h-3.5 w-3.5" /> Download
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive flex items-center gap-2 min-w-0">
                    <XCircle className="h-4 w-4 shrink-0" />
                    <span className="truncate">No proof file uploaded with this submission.</span>
                  </div>
                )}
              </div>

              {/* WORK SUMMARY (if present) */}
              {workSummary && (
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <FileText className="h-3.5 w-3.5 text-primary" /> Work Summary
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-muted/20 p-3.5 text-sm text-foreground/90 whitespace-pre-line break-words [overflow-wrap:anywhere] leading-relaxed max-h-48 overflow-y-auto">
                    {workSummary}
                  </div>
                </div>
              )}

              {/* DELIVERABLE LINKS (if present) */}
              {deliverableLinksList.length > 0 && (
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <ExternalLink className="h-3.5 w-3.5 text-primary" /> Deliverables & Links
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-muted/20 p-3.5 space-y-2 min-w-0">
                    {deliverableLinksList.map((link: string, idx: number) => {
                      const isUrl = /^https?:\/\//i.test(link);
                      const href = isUrl ? link : `https://${link}`;
                      return (
                        <div key={idx} className="flex items-start gap-2 min-w-0 text-sm">
                          <ExternalLink className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          {isUrl || link.includes(".") ? (
                            <a
                              href={href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline font-medium break-all [overflow-wrap:anywhere] min-w-0 flex-1 leading-snug"
                            >
                              {link}
                            </a>
                          ) : (
                            <span className="text-foreground/90 break-words [overflow-wrap:anywhere] min-w-0 flex-1">
                              {link}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SUBMISSION NOTES / ISSUES & BLOCKERS */}
              {submissionNotes && (
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <StickyNote className="h-3.5 w-3.5 text-primary" />
                    {parsedNotes.issues || (localSub && localSub.issues) ? "Issues & Blockers" : "Submitted Work & Notes"}
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-muted/20 p-3.5 text-sm text-foreground/90 whitespace-pre-line break-words [overflow-wrap:anywhere] leading-relaxed max-h-40 overflow-y-auto">
                    {submissionNotes}
                  </div>
                </div>
              )}

              {/* ADDITIONAL REMARKS (if present) */}
              {additionalRemarks && (
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <MessageSquare className="h-3.5 w-3.5 text-primary" /> Additional Remarks
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-muted/20 p-3.5 text-sm text-foreground/90 whitespace-pre-line break-words [overflow-wrap:anywhere] leading-relaxed max-h-36 overflow-y-auto">
                    {additionalRemarks}
                  </div>
                </div>
              )}

              {/* Fallback if no submission notes or work summary at all */}
              {!workSummary && deliverableLinksList.length === 0 && !submissionNotes && !additionalRemarks && (
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <StickyNote className="h-3.5 w-3.5 text-primary" /> Submitted Work & Notes
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-muted/20 p-3.5 text-sm text-muted-foreground italic">
                    No submission notes provided.
                  </div>
                </div>
              )}

              {/* Previous Review Feedback History (if any) */}
              {(previousFeedback || (Array.isArray(task.reviews) && task.reviews.length > 0)) && (
                <div className="rounded-2xl border border-border/60 bg-muted/20 p-3.5 space-y-2.5 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-1.5 text-xs font-semibold text-muted-foreground min-w-0">
                    <span className="flex items-center gap-1.5 text-foreground/90 font-medium truncate">
                      <MessageSquare className="h-3.5 w-3.5 text-primary shrink-0" /> Previous Evaluation Feedback
                    </span>
                    {task.reviewedAt && (
                      <span className="text-[11px] font-normal text-muted-foreground shrink-0">
                        {formatDateSafe(task.reviewedAt, {
                          dateStyle: "medium",
                        })}
                      </span>
                    )}
                  </div>
                  {previousFeedback && (
                    <div className="text-xs bg-background/60 border border-border/40 rounded-xl p-3 text-foreground/90 whitespace-pre-line break-words [overflow-wrap:anywhere] leading-relaxed">
                      &ldquo;{previousFeedback}&rdquo;
                    </div>
                  )}
                  {previousReviewerName && (
                    <p className="text-[11px] text-muted-foreground truncate">
                      Reviewed by: <strong className="text-foreground">{previousReviewerName}</strong>
                      {task.reviewStatus && (
                        <span className="ml-1.5 capitalize font-medium">
                          ({task.reviewStatus === "approved" ? "Approved" : "Revision Requested"})
                        </span>
                      )}
                    </p>
                  )}
                </div>
              )}

              {/* Admin Feedback Input */}
              <div className="space-y-2 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 min-w-0">
                  <Label htmlFor="admin-feedback" className="text-sm font-semibold flex items-center gap-1.5 text-foreground">
                    <MessageSquare className="h-4 w-4 text-primary shrink-0" /> Written Feedback for Employee
                  </Label>
                  <span className="text-xs text-muted-foreground shrink-0">
                    (Required for rejection, optional for approval)
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-normal">
                  This feedback will be saved against this submission and displayed to the employee on their task dashboard and details.
                </p>
                <Textarea
                  id="admin-feedback"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={3}
                  disabled={reviewMutation.isPending}
                  placeholder="e.g. Excellent work on this task. Proof verified and meets all requirements."
                  className="rounded-xl resize-none font-sans text-sm border-border/60 bg-background/50 focus-visible:ring-primary/40 leading-relaxed"
                />
              </div>

              {/* Admin Review Attachment (Optional Single-File Replacement) */}
              <div className="space-y-2 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 min-w-0">
                  <Label className="text-sm font-semibold flex items-center gap-1.5 text-foreground">
                    <Paperclip className="h-4 w-4 text-primary shrink-0" /> Review Attachment (Optional)
                  </Label>
                  <span className="text-xs text-muted-foreground shrink-0">
                    (Single-file replacement up to 10 MB)
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-normal">
                  Attach feedback notes, annotated deliverables, or revision guidelines during acceptance or rejection.
                </p>

                {/* Hidden file input always mounted so Change button, browse, drop, and paste always function reliably */}
                <input
                  ref={attachmentInputRef}
                  type="file"
                  accept={ALLOWED_TASK_ATTACHMENT_EXTENSIONS.map((e) => `.${e}`).join(",")}
                  className="sr-only"
                  disabled={isUploadingAttachment || reviewMutation.isPending}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      void handleAttachmentFile(e.target.files[0]);
                      e.target.value = "";
                    }
                  }}
                />

                {attachment ? (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-border/70 bg-card/60 p-3 transition-colors shadow-sm min-w-0">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                        {attachment.mimeType?.startsWith("image/") ? (
                          <FileImage className="h-5 w-5" />
                        ) : (
                          <FileText className="h-5 w-5" />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold truncate text-foreground">
                          {attachment.name}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {attachment.size} · {isUploadingAttachment ? "Replacement uploading…" : "Attached to review"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setPreviewFile({
                            name: attachment.name,
                            url: attachment.url || "",
                            isImg: isImageProof(attachment.mimeType, attachment.name),
                            isPdf: isPdfProof(attachment.mimeType, attachment.name),
                          })
                        }
                        disabled={isUploadingAttachment}
                        className="h-8 gap-1 text-xs rounded-lg"
                      >
                        <Eye className="h-3.5 w-3.5" /> Preview
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={openAttachmentDialog}
                        disabled={isUploadingAttachment || reviewMutation.isPending}
                        className="h-8 px-2.5 text-xs text-foreground hover:bg-muted/60"
                        title="Replace current attachment with a new file"
                      >
                        Change
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={handleRemoveAttachment}
                        disabled={isUploadingAttachment || reviewMutation.isPending}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                        title="Remove attachment"
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    {...attachmentDragProps}
                    {...attachmentPasteProps}
                    {...attachmentKeyboardProps}
                    onClick={openAttachmentDialog}
                    className={`group relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-4 text-center transition-all outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                      isAttachmentDragging
                        ? "border-primary bg-primary/10 shadow-glow scale-[1.01]"
                        : "border-border/60 bg-background/40 hover:border-primary/50 hover:bg-primary/5"
                    } ${isUploadingAttachment ? "pointer-events-none opacity-60" : ""}`}
                  >
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <UploadCloud className="h-4 w-4 text-primary" />
                      <span>
                        Drag & drop file, paste (Ctrl+V), or{" "}
                        <strong className="text-primary hover:underline font-medium">browse</strong> to attach
                      </span>
                    </div>
                  </div>
                )}

                {isUploadingAttachment && (
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between text-[11px] text-muted-foreground">
                      <span>{attachment ? "Uploading replacement file to storage…" : "Uploading attachment to storage…"}</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-1.5" />
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons (Fixed Footer): Cancel clearly visible on desktop (left) and mobile (bottom), padded above bottom safe area */}
            <DialogFooter className="p-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))] border-t border-border/50 bg-background/95 backdrop-blur-md shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3">
              {/* Cancel Button */}
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={reviewMutation.isPending}
                className="rounded-xl h-10 px-5 text-sm font-medium border-border/70 hover:bg-muted/60 transition-colors w-full sm:w-auto order-3 sm:order-1 shrink-0"
              >
                Cancel
              </Button>

              {/* Review Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto order-1 sm:order-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleReview(false)}
                  disabled={isRejectDisabled}
                  className="rounded-xl h-10 px-4 text-sm font-medium border-rose-500/40 text-rose-400 hover:bg-rose-500/10 hover:text-rose-400 transition-colors disabled:opacity-50 w-full sm:w-auto order-2 sm:order-1 shrink-0"
                >
                  {reviewMutation.isPending && pendingAction === "reject" ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" /> Rejecting…
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <XCircle className="h-4 w-4" /> Reject & Request Changes
                    </span>
                  )}
                </Button>

                <Button
                  type="button"
                  onClick={() => handleReview(true)}
                  disabled={isApproveDisabled}
                  className="rounded-xl h-10 px-5 text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 shadow-glow transition-all disabled:opacity-50 w-full sm:w-auto order-1 sm:order-2 shrink-0"
                >
                  {reviewMutation.isPending && pendingAction === "approve" ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" /> Approving…
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" /> Approve & Award Points
                    </span>
                  )}
                </Button>
              </div>
            </DialogFooter>
          </ModalErrorBoundary>
        </DialogContent>
      </Dialog>

      {/* Lightbox / Preview Modal */}
      {previewFile && (
        <Dialog open={Boolean(previewFile)} onOpenChange={(open) => !open && setPreviewFile(null)}>
          <DialogContent className="inset-x-auto bottom-auto left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(96vw,860px)] max-w-[min(96vw,860px)] sm:max-w-[860px] max-h-[92dvh] sm:max-h-[92dvh] flex flex-col !p-0 !pb-0 gap-0 overflow-hidden rounded-2xl sm:rounded-2xl border-border/60 bg-background/98 shadow-2xl">
            <DialogHeader className="flex flex-row items-center justify-between p-4 pb-3 border-b border-border/50 shrink-0 pr-12 text-left">
              <div className="min-w-0 pr-2">
                <DialogTitle className="text-base font-semibold truncate">
                  {previewFile.name}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground truncate">
                  Task Proof Preview
                </DialogDescription>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => handleDownloadFile(previewFile)}
                className="h-8 gap-1.5 text-xs rounded-lg shrink-0"
              >
                <Download className="h-3.5 w-3.5" /> Download
              </Button>
            </DialogHeader>

            <div className="p-4 overflow-auto flex-1 flex items-center justify-center max-h-[72dvh] rounded-b-2xl bg-black/20">
              {previewFile.isImg ? (
                <img
                  src={previewFile.url}
                  alt={previewFile.name}
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    const parent = e.currentTarget.parentElement;
                    if (parent && !parent.querySelector(".img-error-fallback")) {
                      const fallback = document.createElement("div");
                      fallback.className = "img-error-fallback py-12 text-center text-sm text-muted-foreground";
                      fallback.innerHTML = "<p>Preview could not be loaded from remote storage.</p>";
                      parent.appendChild(fallback);
                    }
                  }}
                  className="max-h-[68dvh] w-auto max-w-full rounded-xl object-contain shadow-md"
                />
              ) : previewFile.isPdf ? (
                <iframe
                  src={previewFile.url}
                  title={previewFile.name}
                  className="h-[68dvh] w-full rounded-xl border-0"
                />
              ) : (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  <p>Preview not available for this file type.</p>
                  <Button
                    type="button"
                    size="sm"
                    className="mt-3 gap-1.5 rounded-full"
                    onClick={() => handleDownloadFile(previewFile)}
                  >
                    <Download className="h-4 w-4" /> Download to view
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

export function TaskReviewModal(props: TaskReviewModalProps) {
  return <TaskReviewModalContent {...props} />;
}
