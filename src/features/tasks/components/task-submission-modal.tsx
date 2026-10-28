import React, { useState, useEffect, useRef } from "react";
import {
  Send,
  FileText,
  AlertCircle,
  Trophy,
  Calendar,
  UploadCloud,
  FileImage,
  X,
  RefreshCw,
  Loader2,
  Paperclip,
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
import { TaskPriorityBadge } from "@/components/task-status-badge";
import { useSubmitTaskMutation } from "../hooks/use-tasks-api";
import type { Task } from "../types";
import { useAuth } from "@/lib/auth";
import { submitForReview } from "@/lib/submission-store";
import { useFileDropPaste } from "@/hooks/use-file-drop-paste";

interface TaskSubmissionModalProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const ALLOWED_EXTENSIONS = [".pdf", ".jpg", ".jpeg", ".png", ".doc", ".docx"];
const ACCEPT_FILE_TYPES =
  ".pdf,.jpg,.jpeg,.png,.doc,.docx,application/pdf,image/jpeg,image/png,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function isImageFile(type: string, name: string): boolean {
  if (type.startsWith("image/")) return true;
  const ext = name.toLowerCase().slice(name.lastIndexOf("."));
  return ext === ".jpg" || ext === ".jpeg" || ext === ".png";
}

function readFileAsDataUrl(file: File): Promise<string | undefined> {
  if (file.size > 2 * 1024 * 1024) return Promise.resolve(undefined);
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : undefined);
    reader.onerror = () => resolve(undefined);
    reader.readAsDataURL(file);
  });
}

export function TaskSubmissionModal({
  task,
  open,
  onOpenChange,
  onSuccess,
}: TaskSubmissionModalProps) {
  const auth = useAuth();
  const [notes, setNotes] = useState("");
  const [touched, setTouched] = useState(false);
  const [proofFiles, setProofFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [replaceIndex, setReplaceIndex] = useState<number | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const submitMutation = useSubmitTaskMutation({
    onSuccess: () => {
      onOpenChange(false);
      setNotes("");
      setProofFiles([]);
      setFileError(null);
      setTouched(false);
      setReplaceIndex(null);
      onSuccess?.();
    },
    onError: (err) => {
      const msg = err?.message || "Failed to submit task for review.";
      toast.error(msg);
    },
  });

  useEffect(() => {
    if (open && task) {
      setNotes(task.notes && !task.notes.includes("Admin Feedback:") ? task.notes : "");
      setProofFiles([]);
      setFileError(null);
      setTouched(false);
      setReplaceIndex(null);
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }, [open, task]);

  if (!task) return null;

  const trimmed = notes.trim();
  const isNotesValid = trimmed.length >= 10 && trimmed.length <= 5000;
  const isTooShort = touched && trimmed.length > 0 && trimmed.length < 10;
  const isTooLong = trimmed.length > 5000;
  const isNotesEmpty = touched && trimmed.length === 0;

  const handleFilesSelected = (filesList: FileList | File[] | null) => {
    if (!filesList) return;

    const incoming = Array.from(filesList);
    if (incoming.length === 0) return;
    const valid: File[] = [];

    for (const f of incoming) {
      // Prevent duplicate files unless replacing
      if (
        replaceIndex === null &&
        proofFiles.some((existing) => existing.name === f.name && existing.size === f.size)
      ) {
        toast.info(`"${f.name}" is already added.`);
        continue;
      }

      const ext = f.name.toLowerCase().slice(f.name.lastIndexOf("."));
      const isAllowedExt = ALLOWED_EXTENSIONS.includes(ext);
      const isAllowedMime =
        f.type.startsWith("image/") ||
        f.type === "application/pdf" ||
        f.type === "application/msword" ||
        f.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

      if (!isAllowedExt && !isAllowedMime) {
        toast.error(`Invalid file type: ${f.name}`, {
          description: "Allowed formats: PDF, JPG, JPEG, PNG, DOC, DOCX.",
        });
        continue;
      }

      if (f.size > MAX_FILE_SIZE_BYTES) {
        toast.error(`File too large: ${f.name}`, {
          description: "Maximum file size is 25 MB.",
        });
        continue;
      }

      valid.push(f);
    }

    if (valid.length === 0) {
      setReplaceIndex(null);
      return;
    }

    if (replaceIndex !== null && replaceIndex >= 0) {
      // Replace specific file
      const updated = [...proofFiles];
      updated[replaceIndex] = valid[0];
      setProofFiles(updated);
      setReplaceIndex(null);
    } else {
      // Append new files
      setProofFiles((prev) => [...prev, ...valid]);
    }

    setFileError(null);
  };

  const handleRemoveFile = (index: number) => {
    setProofFiles((prev) => prev.filter((_, i) => i !== index));
    if (proofFiles.length <= 1) {
      setFileError("Please upload proof of your completed task.");
    }
  };

  const {
    isDragging,
    inputRef: dropInputRef,
    openFileDialog,
    dragProps,
    pasteProps,
    keyboardProps,
  } = useFileDropPaste({
    accept: ACCEPT_FILE_TYPES,
    maxSize: MAX_FILE_SIZE_BYTES,
    multiple: true,
    disabled: submitMutation.isPending,
    existingFiles: proofFiles,
    enableWindowPaste: open,
    label: "proof file",
    onFiles: (incomingFiles) => {
      handleFilesSelected(incomingFiles);
    },
  });

  const handleTriggerReplace = (index: number) => {
    setReplaceIndex(index);
    if (dropInputRef.current) {
      dropInputRef.current.value = "";
      dropInputRef.current.click();
    }
  };

  const handleTriggerAddNew = () => {
    setReplaceIndex(null);
    openFileDialog();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);

    // 1. Mandatory Proof File Validation
    if (proofFiles.length === 0) {
      setFileError("Please upload proof of your completed task.");
      toast.error("Please upload proof of your completed task.");
      return;
    }

    // 2. Mandatory Notes Validation
    if (!trimmed) {
      toast.error("Submission notes required", {
        description: "Please describe your completed work or deliverables before submitting.",
      });
      textareaRef.current?.focus();
      return;
    }

    if (trimmed.length < 10) {
      toast.error("Submission notes too short", {
        description: "Please enter at least 10 characters describing your work.",
      });
      textareaRef.current?.focus();
      return;
    }

    if (trimmed.length > 5000) {
      toast.error("Submission notes too long", {
        description: "Character limit exceeded (maximum 5000 characters).",
      });
      return;
    }

    const taskId = task._id || task.id;
    if (!taskId) {
      toast.error("Unable to identify task ID for submission.");
      return;
    }

    // 3. Prepare fallback inlined payload for persistent preview & download
    try {
      const submissionFiles = await Promise.all(
        proofFiles.map(async (file) => ({
          id: `${file.name}-${file.size}-${Math.random().toString(36).slice(2, 7)}`,
          name: file.name,
          size: file.size,
          type: file.type || "application/octet-stream",
          dataUrl: await readFileAsDataUrl(file),
        })),
      );

      submitForReview({
        taskId,
        employeeId: auth.user?.id || auth.user?._id || "",
        employeeName: auth.user?.name || "Employee",
        employeeCode: auth.user?.empId || auth.user?.code || "",
        workSummary: trimmed,
        issues: "",
        files: submissionFiles,
        checklist: { completed: true, proof: true, verified: true },
      });
    } catch (storeErr) {
      console.warn("[TaskSubmissionModal] Local submission cache warning:", storeErr);
    }

    // 4. Submit to Backend API (enforced with multipart file proof)
    submitMutation.mutate({
      id: taskId,
      notes: trimmed,
      files: proofFiles,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto sm:rounded-3xl border-border/60 bg-background/95 backdrop-blur-xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          <DialogHeader className="space-y-1.5 text-left">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10 text-primary">
                <FileText className="h-4 w-4" />
              </span>
              <DialogTitle className="font-display text-xl font-bold">
                Submit Task For Review
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
              Attach proof of your completed work and summarize deliverables. An admin will review
              your submission to approve points.
            </DialogDescription>
          </DialogHeader>

          {/* Task Summary Banner */}
          <div className="rounded-2xl border border-border/50 bg-card/40 p-4 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h4 className="font-semibold text-sm line-clamp-1">{task.title}</h4>
                <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                  {task.description}
                </p>
              </div>
              <TaskPriorityBadge priority={task.priority} />
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-muted-foreground border-t border-border/30">
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3 w-3 text-primary" />
                Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "No deadline"}
              </span>
              <span className="inline-flex items-center gap-1 font-medium text-warning">
                <Trophy className="h-3 w-3" />
                {task.points || task.rewardPoints || 0} Reward Points
              </span>
            </div>
          </div>

          {/* Proof File Upload Field (MANDATORY) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <UploadCloud className="h-4 w-4 text-primary" />
                Proof File Upload <span className="text-destructive">*</span>
              </Label>
              <span className="text-xs text-muted-foreground">
                PDF, JPG, PNG, DOC, DOCX (Max 25MB)
              </span>
            </div>

            {/* Hidden file input */}
            <input
              ref={dropInputRef}
              type="file"
              accept={ACCEPT_FILE_TYPES}
              multiple
              disabled={submitMutation.isPending}
              className="sr-only"
              onChange={(e) => {
                handleFilesSelected(e.target.files);
                e.target.value = "";
              }}
            />

            {/* Drag & Drop Zone when empty */}
            {proofFiles.length === 0 ? (
              <div
                {...dragProps}
                {...pasteProps}
                {...keyboardProps}
                onClick={handleTriggerAddNew}
                className={`group flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-all outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                  isDragging
                    ? "border-primary bg-primary/10 shadow-glow scale-[1.01]"
                    : fileError
                      ? "border-destructive/80 bg-destructive/5 hover:border-destructive"
                      : "border-border/70 bg-card/40 hover:border-primary/60 hover:bg-primary/5"
                }`}
                aria-label="Upload task proof files. Drag and drop, paste with Ctrl+V, or press Enter to browse"
              >
                <div
                  className={`grid h-12 w-12 place-items-center rounded-xl transition-all ${
                    isDragging
                      ? "scale-110 bg-primary/20 text-primary shadow-md"
                      : fileError
                        ? "bg-destructive/15 text-destructive"
                        : "bg-primary/10 text-primary group-hover:scale-105"
                  }`}
                >
                  <UploadCloud className="h-6 w-6" />
                </div>
                <p className="mt-3 font-display text-sm font-semibold">
                  Drag and drop files, paste with Ctrl+V, or browse
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Allowed: PDF, JPG, JPEG, PNG, DOC, DOCX (Max 25 MB)
                </p>
                <p className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] text-muted-foreground/80">
                  <span>
                    Press{" "}
                    <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-foreground border border-border/70">
                      Ctrl+V
                    </kbd>{" "}
                    to paste screenshot or file
                  </span>
                  <span>•</span>
                  <span className="text-primary font-medium group-hover:underline">
                    Browse files
                  </span>
                </p>
              </div>
            ) : (
              /* Uploaded Files List */
              <div className="space-y-3">
                <div className="space-y-2">
                  {proofFiles.map((file, idx) => {
                    const isImg = isImageFile(file.type, file.name);
                    return (
                      <div
                        key={`${file.name}-${idx}`}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card/50 p-3 shadow-sm transition-colors hover:border-border"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
                            {isImg ? (
                              <FileImage className="h-5 w-5" />
                            ) : (
                              <FileText className="h-5 w-5" />
                            )}
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate text-foreground">
                              {file.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(file.size)} ·{" "}
                              {file.name.slice(file.name.lastIndexOf(".")).toUpperCase() || "FILE"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => handleTriggerReplace(idx)}
                            disabled={submitMutation.isPending}
                            className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground rounded-lg"
                            title="Replace this file"
                          >
                            <RefreshCw className="h-3.5 w-3.5 mr-1" /> Replace
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemoveFile(idx)}
                            disabled={submitMutation.isPending}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
                            title="Remove file"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Additional drop/paste zone when files already exist */}
                <div
                  {...dragProps}
                  {...pasteProps}
                  {...keyboardProps}
                  onClick={handleTriggerAddNew}
                  className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed p-3 text-center transition-all outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    isDragging
                      ? "border-primary bg-primary/10 shadow-glow scale-[1.01]"
                      : "border-border/60 bg-card/30 hover:border-primary/60 hover:bg-primary/5"
                  }`}
                  aria-label="Drag and drop more files, paste with Ctrl+V, or browse"
                >
                  <UploadCloud className="h-4 w-4 text-primary" />
                  <span className="text-xs font-medium text-foreground">
                    Drag and drop more files, paste with Ctrl+V, or browse
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1 text-xs">
                  <span className="text-muted-foreground">
                    {proofFiles.length} proof file{proofFiles.length === 1 ? "" : "s"} attached
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleTriggerAddNew}
                    disabled={submitMutation.isPending}
                    className="h-7 text-xs rounded-full gap-1"
                  >
                    <Paperclip className="h-3 w-3" /> Add another file
                  </Button>
                </div>
              </div>
            )}

            {/* File Validation Message */}
            {fileError && (
              <p className="flex items-center gap-1.5 text-xs text-destructive font-medium animate-in fade-in">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {fileError}
              </p>
            )}
          </div>

          {/* Submission Notes Field */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="submission-notes" className="text-sm font-medium">
                Work Summary & Deliverables <span className="text-destructive">*</span>
              </Label>
              <span
                className={`text-xs ${
                  trimmed.length > 5000 ? "text-destructive font-semibold" : "text-muted-foreground"
                }`}
              >
                {trimmed.length} / 5000 chars
              </span>
            </div>

            <Textarea
              id="submission-notes"
              ref={textareaRef}
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                setTouched(true);
              }}
              onBlur={() => setTouched(true)}
              rows={4}
              disabled={submitMutation.isPending}
              placeholder={`Describe your completed deliverables, changes, or pull requests...`}
              className={`rounded-2xl resize-none font-sans text-sm ${
                isTooShort || isTooLong || isNotesEmpty
                  ? "border-destructive focus-visible:ring-destructive"
                  : ""
              }`}
            />

            {/* Notes Validation Feedback */}
            {isNotesEmpty && (
              <p className="flex items-center gap-1 text-xs text-destructive">
                <AlertCircle className="h-3 w-3" /> Submission notes are required.
              </p>
            )}
            {isTooShort && (
              <p className="flex items-center gap-1 text-xs text-destructive">
                <AlertCircle className="h-3 w-3" /> Please enter at least 10 characters describing
                your completed work.
              </p>
            )}
            {isTooLong && (
              <p className="flex items-center gap-1 text-xs text-destructive">
                <AlertCircle className="h-3 w-3" /> Character limit exceeded (max 5000).
              </p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitMutation.isPending}
              className="rounded-full"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitMutation.isPending}
              className="rounded-full bg-primary text-primary-foreground shadow-glow hover:bg-primary/90"
            >
              {submitMutation.isPending ? (
                <>
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  Uploading Proof & Submitting…
                </>
              ) : (
                <>
                  <Send className="mr-1.5 h-4 w-4" /> Submit For Review
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
