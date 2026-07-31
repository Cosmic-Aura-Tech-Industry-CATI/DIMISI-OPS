import { useCallback, useRef, useState } from "react";
import {
  FileText,
  FileImage,
  FileArchive,
  FileVideo,
  UploadCloud,
  X,
} from "lucide-react";
import { toast } from "sonner";

export type ProofFile = {
  id: string;
  name: string;
  size: number;
  type: string;
  previewUrl?: string;
  /** Inlined content for small files so reviewers can download the proof. */
  dataUrl?: string;
};

const ACCEPTED =
  "image/png,image/jpeg,image/jpg,image/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,video/*";

/** Hard cap per file. */
export const MAX_FILE_BYTES = 20 * 1024 * 1024;
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

  const addFiles = useCallback(
    async (list: FileList | null) => {
      if (!list) return;
      const incoming = Array.from(list);
      const tooBig = incoming.filter((f) => f.size > MAX_FILE_BYTES);
      tooBig.forEach((f) => toast.error(`${f.name} exceeds the 20 MB limit`));
      const ok = incoming.filter((f) => f.size <= MAX_FILE_BYTES);
      if (!ok.length) return;
      const next: ProofFile[] = await Promise.all(
        ok.map(async (f) => ({
          id: `${f.name}-${f.size}-${Math.random().toString(36).slice(2, 8)}`,
          name: f.name,
          size: f.size,
          type: f.type || "application/octet-stream",
          previewUrl: f.type.startsWith("image/") ? URL.createObjectURL(f) : undefined,
          dataUrl: await readAsDataUrl(f),
        })),
      );
      onChange([...files, ...next]);
    },
    [files, onChange],
  );

  const remove = (id: string) => {
    const f = files.find((x) => x.id === id);
    if (f?.previewUrl) URL.revokeObjectURL(f.previewUrl);
    onChange(files.filter((x) => x.id !== id));
  };

  const images = files.filter((f) => f.type.startsWith("image/"));
  const docs = files.filter((f) => !f.type.startsWith("image/"));

  return (
    <div className="space-y-4">
      <label
        htmlFor="proof-input"
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void addFiles(e.dataTransfer.files);
        }}
        className={`group flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed p-6 text-center transition-all sm:p-8 ${
          dragging
            ? "border-primary bg-primary/10 shadow-glow"
            : "border-border/70 bg-card/40 hover:border-primary/60 hover:bg-primary/5"
        }`}
      >
        <div className={`grid h-14 w-14 place-items-center rounded-md transition-transform ${dragging ? "scale-110 bg-primary/20 text-primary" : "bg-primary/10 text-primary group-hover:scale-105"}`}>
          <UploadCloud className="h-7 w-7" />
        </div>
        <p className="mt-4 font-display text-sm font-semibold">
          Drag & drop your proof here
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          or <span className="text-primary">browse files</span> — PNG, JPG, JPEG, PDF, ZIP, DOC, DOCX, Excel, video (max 20 MB each)
        </p>
        <input
          ref={inputRef}
          id="proof-input"
          type="file"
          multiple
          accept={ACCEPTED}
          className="sr-only"
          onChange={(e) => { void addFiles(e.target.files); e.target.value = ""; }}
        />
      </label>

      {images.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Image previews
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {images.map((f) => (
              <div key={f.id} className="group relative overflow-hidden rounded-md border border-border/60 bg-card/40">
                <img src={f.previewUrl ?? f.dataUrl} alt={f.name} className="aspect-square w-full object-cover" />
                <button
                  type="button"
                  onClick={() => remove(f.id)}
                  className="absolute right-1.5 top-1.5 grid h-8 w-8 place-items-center rounded-md bg-background/80 text-foreground backdrop-blur transition-colors hover:text-destructive"
                  aria-label={`Remove ${f.name}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
                <div className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/70 to-transparent px-2 py-1 text-[10px] text-primary-foreground">
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
              const isPdf = f.type === "application/pdf";
              return (
                <li
                  key={f.id}
                  className="flex items-center gap-3 rounded-md border border-border/60 bg-card/40 px-3 py-2.5"
                >
                  <div className={`grid h-9 w-9 place-items-center rounded-md ${isPdf ? "bg-destructive/15 text-destructive" : "bg-primary/15 text-primary"}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{f.name}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {isPdf ? "PDF" : (f.type.split("/")[1] || "file").toUpperCase()} · {formatSize(f.size)}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(f.id)}
                    className="grid h-9 w-9 place-items-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    aria-label={`Remove ${f.name}`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
