import { useCallback, useRef, useState, useEffect } from "react";
import {
  AlertCircle,
  Check,
  ExternalLink,
  FileText,
  FileImage,
  FileArchive,
  FileVideo,
  Loader2,
  RotateCw,
  UploadCloud,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  validateTaskProofFile,
  uploadTaskProof,
  extractCloudinaryPublicId,
  MAX_TASK_FILE_SIZE,
  ALLOWED_TASK_PROOF_EXTENSIONS,
} from "@/lib/cdn-upload";
import { useFileDropPaste } from "@/hooks/use-file-drop-paste";

export type ProofFile = {
  id: string;
  name: string;
  size: number;
  type: string;
  file?: File;
  url?: string;
  publicId?: string;
  previewUrl?: string;
  /** Inlined content for small files so reviewers can download the proof. */
  dataUrl?: string;
  isUploading?: boolean;
  uploadProgress?: number;
  error?: string;
};

const ACCEPTED =
  "image/png,image/jpeg,image/webp,.jpg,.jpeg,.png,.webp,application/pdf,.pdf,.doc,.docx,.zip,application/zip";

/** Hard cap per file aligned with backend upload rules for task.proof. */
export const MAX_FILE_BYTES = MAX_TASK_FILE_SIZE;
/** Files under this size get inlined so they can be downloaded later. */
const INLINE_LIMIT = 1.5 * 1024 * 1024;

function iconFor(type: string) {
  if (type.startsWith("image/")) return FileImage;
  if (type.startsWith("video/")) return FileVideo;
  if (type === "application/pdf") return FileText;
  return FileArchive;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function readAsDataUrl(file: File): Promise<string | undefined> {
  if (file.size > INLINE_LIMIT) return Promise.resolve(undefined);
  return new Promise((resolve) => {
    const r = new FileReader();
    r.onload = () => resolve(typeof r.result === "string" ? r.result : undefined);
    r.onerror = () => resolve(undefined);
    r.readAsDataURL(file);
  });
}

export function ProofUploader({
  files,
  onChange,
}: {
  files: ProofFile[];
  onChange: (files: ProofFile[]) => void;
}) {
  const objectUrlsRef = useRef<Set<string>>(new Set());
  const [replacingProofId, setReplacingProofId] = useState<string | null>(null);
  const replaceProofInputRef = useRef<HTMLInputElement>(null);
  const cancelledIdsRef = useRef<Set<string>>(new Set());

  // Keep a synchronous ref of files so async callbacks never overwrite with stale state
  const filesRef = useRef<ProofFile[]>(files);

  // Sync ref whenever parent updates files prop
  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  // Clean up object URLs on unmount
  useEffect(() => {
    const currentUrls = objectUrlsRef.current;
    return () => {
      currentUrls.forEach((url) => URL.revokeObjectURL(url));
      currentUrls.clear();
    };
  }, []);

  // Centralized state updater that updates filesRef.current synchronously AND notifies parent
  const updateFiles = useCallback(
    (updater: (prev: ProofFile[]) => ProofFile[]) => {
      const next = updater(filesRef.current);
      filesRef.current = next;
      onChange(next);
      return next;
    },
    [onChange],
  );

  const uploadSingleProof = useCallback(
    async (item: ProofFile) => {
      if (!item.file || cancelledIdsRef.current.has(item.id)) return;

      updateFiles((current) =>
        current.map((f) =>
          f.id === item.id ? { ...f, isUploading: true, uploadProgress: 10, error: undefined } : f,
        ),
      );

      try {
        const res = await uploadTaskProof(item.file, (percent) => {
          if (cancelledIdsRef.current.has(item.id)) return;
          updateFiles((current) =>
            current.map((f) => (f.id === item.id ? { ...f, uploadProgress: percent } : f)),
          );
        });

        if (cancelledIdsRef.current.has(item.id)) return;

        updateFiles((current) =>
          current.map((f) =>
            f.id === item.id
              ? {
                  ...f,
                  url: res.url,
                  publicId: res.publicId || extractCloudinaryPublicId(res.url),
                  name: res.name || f.name,
                  size: res.size || f.size,
                  type: res.type || f.type,
                  isUploading: false,
                  uploadProgress: 100,
                  error: undefined,
                }
              : f,
          ),
        );
        toast.success(`${item.name} uploaded to storage.`);
      } catch (err: unknown) {
        if (cancelledIdsRef.current.has(item.id)) return;
        const msg =
          err instanceof Error
            ? err.message
            : typeof err === "object" && err !== null && "message" in err
              ? String((err as { message: unknown }).message)
              : "Upload failed.";

        updateFiles((current) =>
          current.map((f) => (f.id === item.id ? { ...f, isUploading: false, error: msg } : f)),
        );
        toast.error(`Failed to upload ${item.name}: ${msg}`);
      }
    },
    [updateFiles],
  );

  const handleTriggerReplace = (id: string) => {
    if (isAnyUploading) return;
    setReplacingProofId(id);
    if (replaceProofInputRef.current) {
      replaceProofInputRef.current.value = "";
      replaceProofInputRef.current.click();
    }
  };

  const handleReplaceProof = async (file: File) => {
    if (!file || !replacingProofId) return;

    const validation = validateTaskProofFile(file);
    if (!validation.valid) {
      toast.error(`${file.name}: ${validation.error || "Invalid file"}`);
      setReplacingProofId(null);
      return;
    }

    const targetId = replacingProofId;
    const targetItem = filesRef.current.find((f) => f.id === targetId);
    if (!targetItem) {
      setReplacingProofId(null);
      return;
    }

    const previousItem = { ...targetItem };

    let previewUrl: string | undefined;
    if (file.type.startsWith("image/")) {
      previewUrl = URL.createObjectURL(file);
      objectUrlsRef.current.add(previewUrl);
    }
    const dataUrl = await readAsDataUrl(file);

    // Keep previous valid proof visible while uploading replacement
    updateFiles((current) =>
      current.map((f) =>
        f.id === targetId
          ? {
              ...f,
              isUploading: true,
              uploadProgress: 10,
              error: undefined,
            }
          : f,
      ),
    );

    try {
      const res = await uploadTaskProof(file, (percent) => {
        if (cancelledIdsRef.current.has(targetId)) return;
        updateFiles((current) =>
          current.map((f) => (f.id === targetId ? { ...f, uploadProgress: percent } : f)),
        );
      });

      if (cancelledIdsRef.current.has(targetId)) {
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
          objectUrlsRef.current.delete(previewUrl);
        }
        return;
      }

      if (previousItem.previewUrl) {
        URL.revokeObjectURL(previousItem.previewUrl);
        objectUrlsRef.current.delete(previousItem.previewUrl);
      }

      // Replace old proof completely with newly uploaded proof
      updateFiles((current) =>
        current.map((f) =>
          f.id === targetId
            ? {
                id: `${file.name}-${file.size}-${Math.random().toString(36).slice(2, 8)}`,
                name: res.name || file.name,
                size: res.size || file.size,
                type: res.type || file.type || "application/octet-stream",
                file,
                url: res.url,
                publicId: res.publicId || extractCloudinaryPublicId(res.url),
                previewUrl,
                dataUrl,
                isUploading: false,
                uploadProgress: 100,
                error: undefined,
              }
            : f,
        ),
      );

      toast.success(`Replaced "${previousItem.name}" with "${res.name || file.name}".`);
    } catch (err: unknown) {
      if (cancelledIdsRef.current.has(targetId)) return;
      // Retain previous valid proof on failure
      updateFiles((current) => current.map((f) => (f.id === targetId ? previousItem : f)));
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        objectUrlsRef.current.delete(previewUrl);
      }
      const msg =
        err instanceof Error
          ? err.message
          : typeof err === "object" && err !== null && "message" in err
            ? String((err as { message: unknown }).message)
            : "Upload failed.";
      toast.error(`Failed to replace ${previousItem.name}: ${msg}`);
    } finally {
      setReplacingProofId(null);
      if (replaceProofInputRef.current) {
        replaceProofInputRef.current.value = "";
      }
    }
  };

  const addFiles = useCallback(
    async (list: FileList | File[] | null) => {
      if (!list) return;
      const incoming = Array.from(list);
      if (incoming.length === 0) return;

      const itemsToAdd: ProofFile[] = [];

      for (const f of incoming) {
        // Prevent duplicate file addition against latest filesRef
        const isDuplicate = filesRef.current.some(
          (existing) => existing.name === f.name && existing.size === f.size,
        );
        if (isDuplicate) {
          toast.info(`"${f.name}" is already attached.`);
          continue;
        }

        const validation = validateTaskProofFile(f);
        if (!validation.valid) {
          toast.error(`${f.name}: ${validation.error || "Invalid file"}`);
          continue;
        }

        let previewUrl: string | undefined;
        if (f.type.startsWith("image/")) {
          previewUrl = URL.createObjectURL(f);
          objectUrlsRef.current.add(previewUrl);
        }

        const dataUrl = await readAsDataUrl(f);

        itemsToAdd.push({
          id: `${f.name}-${f.size}-${Math.random().toString(36).slice(2, 8)}`,
          name: f.name,
          size: f.size,
          type: f.type || "application/octet-stream",
          file: f,
          previewUrl,
          dataUrl,
          isUploading: true,
          uploadProgress: 10,
        });
      }

      if (itemsToAdd.length === 0) return;

      // Clear any prior cancelled status for newly added items
      itemsToAdd.forEach((item) => cancelledIdsRef.current.delete(item.id));

      // Synchronously update filesRef.current and notify parent
      updateFiles((current) => [...current, ...itemsToAdd]);

      // Perform direct CDN upload for each new file independently
      for (const item of itemsToAdd) {
        if (!item.file) continue;
        void uploadSingleProof(item);
      }
    },
    [updateFiles, uploadSingleProof],
  );

  const isAnyUploading = files.some((f) => f.isUploading);

  const {
    isDragging,
    inputRef: dropInputRef,
    openFileDialog,
    dragProps,
    pasteProps,
    keyboardProps,
  } = useFileDropPaste({
    accept: ACCEPTED,
    maxSize: MAX_FILE_BYTES,
    multiple: true,
    disabled: isAnyUploading,
    existingFiles: files,
    validateFile: validateTaskProofFile,
    onFiles: (newFiles) => {
      void addFiles(newFiles);
    },
    enableWindowPaste: true,
    label: "proof file",
  });

  const remove = (id: string) => {
    cancelledIdsRef.current.add(id);
    const f = filesRef.current.find((x) => x.id === id);
    if (f?.previewUrl) {
      URL.revokeObjectURL(f.previewUrl);
      objectUrlsRef.current.delete(f.previewUrl);
    }
    if (dropInputRef.current) {
      dropInputRef.current.value = "";
    }
    if (replaceProofInputRef.current) {
      replaceProofInputRef.current.value = "";
    }
    updateFiles((current) => current.filter((x) => x.id !== id));
  };

  const isImageFile = (f: ProofFile) =>
    (typeof f.type === "string" && f.type.startsWith("image/")) ||
    /\.(jpe?g|png|webp|gif|svg)$/i.test(f.name);

  const images = files.filter(isImageFile);
  const docs = files.filter((f) => !isImageFile(f));

  return (
    <div className="space-y-4">
      <div
        {...dragProps}
        {...pasteProps}
        {...keyboardProps}
        onClick={openFileDialog}
        className={`group flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-all outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:p-8 ${
          isDragging
            ? "border-primary bg-primary/10 shadow-glow scale-[1.01]"
            : "border-border/70 bg-card/40 hover:border-primary/60 hover:bg-primary/5"
        } ${isAnyUploading ? "pointer-events-none opacity-60" : ""}`}
        aria-label="Upload task proof files. Drag and drop, paste with Ctrl+V, or press Enter to browse"
      >
        <div
          className={`grid h-14 w-14 place-items-center rounded-xl transition-all ${
            isDragging
              ? "scale-110 bg-primary/20 text-primary shadow-md"
              : "bg-primary/10 text-primary group-hover:scale-105"
          }`}
        >
          <UploadCloud className="h-7 w-7" />
        </div>
        <p className="mt-4 font-display text-sm font-semibold">
          Drag and drop files, paste with Ctrl+V, or browse
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {ALLOWED_TASK_PROOF_EXTENSIONS.join(", ").toUpperCase()} (max 10 MB each, direct CDN
          upload)
        </p>
        <p className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-muted-foreground/80">
          <span>
            Press{" "}
            <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-foreground border border-border/70">
              Ctrl+V
            </kbd>{" "}
            to paste screenshot or file
          </span>
          <span>•</span>
          <span className="text-primary font-medium group-hover:underline">Browse files</span>
        </p>
        <input
          ref={dropInputRef}
          id="proof-input"
          type="file"
          multiple
          accept={ACCEPTED}
          className="sr-only"
          disabled={isAnyUploading}
          onChange={(e) => {
            void addFiles(e.target.files);
            e.target.value = "";
          }}
        />
        {/* Dedicated input for single proof replacement */}
        <input
          ref={replaceProofInputRef}
          type="file"
          accept={ACCEPTED}
          className="sr-only"
          disabled={isAnyUploading}
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              void handleReplaceProof(e.target.files[0]);
              e.target.value = "";
            }
          }}
        />
      </div>

      {images.length > 0 && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Images ({images.length})
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {images.map((f) => {
              const displaySrc = f.previewUrl || f.url || f.dataUrl;
              const openUrl = f.url || f.previewUrl || f.dataUrl;
              return (
                <div
                  key={f.id}
                  className="group relative overflow-hidden rounded-xl border border-border/60 bg-card/40 transition-all hover:border-primary/50 shadow-sm"
                >
                  {displaySrc ? (
                    <img
                      src={displaySrc}
                      alt={f.name}
                      className="aspect-square w-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="aspect-square w-full grid place-items-center bg-muted/30">
                      <FileImage className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}

                  {/* Uploading Overlay */}
                  {f.isUploading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-black/60 p-2 text-center text-white backdrop-blur-[2px]">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      <span className="text-[11px] font-semibold">{f.uploadProgress || 10}%</span>
                      <Progress value={f.uploadProgress || 10} className="h-1 w-4/5" />
                    </div>
                  )}

                  {/* Success Indicator */}
                  {!f.isUploading && f.url && (
                    <span
                      className="absolute left-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-emerald-500 text-white shadow-md ring-2 ring-background"
                      title="Uploaded to storage"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </span>
                  )}

                  {/* Error Overlay */}
                  {!f.isUploading && f.error && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-destructive/90 p-2 text-center text-white">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-[10px] leading-tight line-clamp-2">{f.error}</span>
                      {f.file && (
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          className="mt-1 h-5 px-1.5 text-[10px]"
                          onClick={() => void uploadSingleProof(f)}
                        >
                          <RotateCw className="mr-1 h-2.5 w-2.5" /> Retry
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Top action buttons: View/Open, Replace, Remove */}
                  <div className="absolute right-1.5 top-1.5 flex items-center gap-1 z-10">
                    {openUrl && (
                      <a
                        href={openUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="grid h-7 w-7 place-items-center rounded-md bg-background/90 text-foreground backdrop-blur transition-colors hover:text-primary shadow-sm"
                        title="View / open full image"
                        aria-label={`View full ${f.name}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => handleTriggerReplace(f.id)}
                      disabled={isAnyUploading}
                      className="grid h-7 w-7 place-items-center rounded-md bg-background/90 text-foreground backdrop-blur transition-colors hover:text-primary shadow-sm"
                      title="Replace this image"
                      aria-label={`Replace ${f.name}`}
                    >
                      <RotateCw className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(f.id)}
                      className="grid h-7 w-7 place-items-center rounded-md bg-background/90 text-foreground backdrop-blur transition-colors hover:text-destructive shadow-sm"
                      title="Remove image"
                      aria-label={`Remove ${f.name}`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/85 via-black/50 to-transparent px-2 py-1.5 text-[11px] text-white">
                    <p className="truncate font-medium">{f.name}</p>
                    <p className="text-[10px] text-white/70">{formatSize(f.size)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {docs.length > 0 && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Documents ({docs.length})
            </p>
          </div>
          <ul className="space-y-2">
            {docs.map((f) => {
              const Icon = iconFor(f.type || "");
              const isPdf = f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf");
              const openUrl = f.url || f.dataUrl;

              return (
                <li
                  key={f.id}
                  className="rounded-xl border border-border/60 bg-card/40 p-3 transition-colors hover:border-border"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${
                        isPdf ? "bg-destructive/15 text-destructive" : "bg-primary/15 text-primary"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium">{f.name}</span>
                        {!f.isUploading && f.url && (
                          <span className="inline-flex items-center gap-1 rounded-sm bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                            <Check className="h-2.5 w-2.5" /> Uploaded
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-muted-foreground">
                        {isPdf
                          ? "PDF"
                          : (f.type ? f.type.split("/")[1] : "file")?.toUpperCase() ||
                            "DOCUMENT"}{" "}
                        · {formatSize(f.size)}
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5">
                      {f.isUploading && (
                        <span className="inline-flex items-center gap-1 text-xs text-primary font-medium mr-2">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" /> {f.uploadProgress || 10}%
                        </span>
                      )}

                      {!f.isUploading && openUrl && (
                        <a
                          href={openUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="grid h-8 w-8 place-items-center rounded-lg border border-border/60 text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors"
                          title="View / open file"
                          aria-label={`Open ${f.name}`}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}

                      {!f.isUploading && f.url && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground rounded-lg"
                          onClick={() => handleTriggerReplace(f.id)}
                          disabled={isAnyUploading}
                          title="Replace this file"
                        >
                          <RotateCw className="mr-1 h-3.5 w-3.5" /> Replace
                        </Button>
                      )}

                      {!f.isUploading && f.error && f.file && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 px-2 text-[11px]"
                          onClick={() => void uploadSingleProof(f)}
                        >
                          <RotateCw className="mr-1 h-2.5 w-2.5" /> Retry
                        </Button>
                      )}

                      <button
                        type="button"
                        onClick={() => remove(f.id)}
                        className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                        aria-label={`Remove ${f.name}`}
                        title="Remove file"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {f.isUploading && (
                    <div className="mt-2 space-y-1">
                      <Progress value={f.uploadProgress || 10} className="h-1.5" />
                      <p className="text-[10px] text-muted-foreground">
                        Uploading directly to storage…
                      </p>
                    </div>
                  )}

                  {!f.isUploading && f.error && (
                    <p className="mt-1 text-[11px] text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 shrink-0" /> {f.error}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
