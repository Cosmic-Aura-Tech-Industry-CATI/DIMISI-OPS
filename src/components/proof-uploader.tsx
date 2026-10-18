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
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const objectUrlsRef = useRef<Set<string>>(new Set());

  // Clean up object URLs on unmount
  useEffect(() => {
    const currentUrls = objectUrlsRef.current;
    return () => {
      currentUrls.forEach((url) => URL.revokeObjectURL(url));
      currentUrls.clear();
    };
  }, []);

  const uploadSingleProof = async (item: ProofFile) => {
    if (!item.file) return;

    onChange(
      files.map((f) =>
        f.id === item.id ? { ...f, isUploading: true, uploadProgress: 10, error: undefined } : f,
      ),
    );

    try {
      const res = await uploadTaskProof(item.file, (percent) => {
        onChange(files.map((f) => (f.id === item.id ? { ...f, uploadProgress: percent } : f)));
      });

      onChange(
        files.map((f) =>
          f.id === item.id
            ? {
                ...f,
                url: res.url,
                publicId: res.publicId,
                isUploading: false,
                uploadProgress: 100,
                error: undefined,
              }
            : f,
        ),
      );
      toast.success(`${item.name} uploaded to storage.`);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : typeof err === "object" && err !== null && "message" in err
            ? String((err as { message: unknown }).message)
            : "Upload failed.";

      onChange(files.map((f) => (f.id === item.id ? { ...f, isUploading: false, error: msg } : f)));
      toast.error(`Failed to upload ${item.name}: ${msg}`);
    }
  };

  const addFiles = useCallback(
    async (list: FileList | File[] | null) => {
      if (!list) return;
      const incoming = Array.from(list);
      if (incoming.length === 0) return;

      const itemsToAdd: ProofFile[] = [];

      for (const f of incoming) {
        // Prevent duplicate file addition
        const isDuplicate = files.some(
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

      const updatedList = [...files, ...itemsToAdd];
      onChange(updatedList);

      // Perform direct CDN upload for each new file
      for (const item of itemsToAdd) {
        if (!item.file) continue;
        try {
          const res = await uploadTaskProof(item.file, (percent) => {
            onChange(
              updatedList.map((f) => (f.id === item.id ? { ...f, uploadProgress: percent } : f)),
            );
          });

          onChange(
            updatedList.map((f) =>
              f.id === item.id
                ? {
                    ...f,
                    url: res.url,
                    publicId: res.publicId,
                    isUploading: false,
                    uploadProgress: 100,
                    error: undefined,
                  }
                : f,
            ),
          );
          toast.success(`${item.name} uploaded to storage.`);
        } catch (err: unknown) {
          const msg =
            err instanceof Error
              ? err.message
              : typeof err === "object" && err !== null && "message" in err
                ? String((err as { message: unknown }).message)
                : "Upload failed.";

          onChange(
            updatedList.map((f) =>
              f.id === item.id ? { ...f, isUploading: false, error: msg } : f,
            ),
          );
          toast.error(`Failed to upload ${item.name}: ${msg}`);
        }
      }
    },
    [files, onChange],
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
    const f = files.find((x) => x.id === id);
    if (f?.previewUrl) {
      URL.revokeObjectURL(f.previewUrl);
      objectUrlsRef.current.delete(f.previewUrl);
    }
    onChange(files.filter((x) => x.id !== id));
  };

  const images = files.filter((f) => f.type.startsWith("image/"));
  const docs = files.filter((f) => !f.type.startsWith("image/"));

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
      </div>

      {images.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Image previews
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {images.map((f) => (
              <div
                key={f.id}
                className="group relative overflow-hidden rounded-md border border-border/60 bg-card/40"
              >
                <img
                  src={f.url ?? f.previewUrl ?? f.dataUrl}
                  alt={f.name}
                  className="aspect-square w-full object-cover"
                />

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
                    title="Uploaded directly to CDN"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </span>
                )}

                {/* Error Overlay */}
                {!f.isUploading && f.error && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-destructive/80 p-2 text-center text-white">
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

                <button
                  type="button"
                  onClick={() => remove(f.id)}
                  className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-md bg-background/80 text-foreground backdrop-blur transition-colors hover:text-destructive shadow-sm"
                  aria-label={`Remove ${f.name}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
                <div className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/80 to-transparent px-2 py-1 text-[10px] text-white">
                  {f.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {docs.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Documents
          </p>
          <ul className="space-y-2">
            {docs.map((f) => {
              const Icon = iconFor(f.type);
              const isPdf = f.type === "application/pdf" || f.name.endsWith(".pdf");
              return (
                <li
                  key={f.id}
                  className="rounded-md border border-border/60 bg-card/40 p-3 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`grid h-9 w-9 shrink-0 place-items-center rounded-md ${isPdf ? "bg-destructive/15 text-destructive" : "bg-primary/15 text-primary"}`}
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
                        {isPdf ? "PDF" : (f.type.split("/")[1] || "file").toUpperCase()} ·{" "}
                        {formatSize(f.size)}
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5">
                      {f.isUploading && (
                        <span className="inline-flex items-center gap-1 text-xs text-primary font-medium mr-2">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" /> {f.uploadProgress || 10}%
                        </span>
                      )}

                      {!f.isUploading && f.url && (
                        <a
                          href={f.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="grid h-7 w-7 place-items-center rounded-md border border-border/60 text-muted-foreground hover:text-primary hover:border-primary/40"
                          title="View file"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}

                      {!f.isUploading && f.error && f.file && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-6 px-2 text-[11px]"
                          onClick={() => void uploadSingleProof(f)}
                        >
                          <RotateCw className="mr-1 h-2.5 w-2.5" /> Retry
                        </Button>
                      )}

                      <button
                        type="button"
                        onClick={() => remove(f.id)}
                        className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        aria-label={`Remove ${f.name}`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {f.isUploading && (
                    <div className="mt-2 space-y-1">
                      <Progress value={f.uploadProgress || 10} className="h-1.5" />
                      <p className="text-[10px] text-muted-foreground">
                        Uploading directly to CDN…
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
