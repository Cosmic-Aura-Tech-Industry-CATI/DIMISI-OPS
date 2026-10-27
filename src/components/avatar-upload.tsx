import { useRef, useState, useEffect, useCallback } from "react";
import { Upload, Trash2, Camera, Loader2, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { validateAvatarFile, uploadProfileAvatar, MAX_AVATAR_FILE_SIZE } from "@/lib/cdn-upload";
import { useFileDropPaste } from "@/hooks/use-file-drop-paste";

export interface AvatarUploadProps {
  value?: string | null;
  name?: string;
  /** Called when a local file is picked or cleared (ideal for dialogs/forms) */
  onChange?: (previewUrl: string | null, file: File | null) => void;
  /** Called when an auto-upload succeeds with the final CDN url and publicId */
  onUploadSuccess?: (result: { avatar: string; avatarPublicId: string }) => void | Promise<void>;
  /** Called when photo removal is requested */
  onRemove?: () => void | Promise<void>;
  /** Automatically trigger signature + direct CDN upload on file select */
  autoUpload?: boolean;
  /** Disables interactions while another action is saving */
  disabled?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function AvatarUpload({
  value,
  name = "User",
  onChange,
  onUploadSuccess,
  onRemove,
  autoUpload = false,
  disabled = false,
  className = "",
  size = "md",
}: AvatarUploadProps) {
  const [preview, setPreview] = useState<string | null>(value || null);
  const [isUploading, setIsUploading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const createdObjectUrlRef = useRef<string | null>(null);

  // Clean up object URLs on unmount or when a new preview is set
  const cleanupObjectUrl = useCallback(() => {
    if (createdObjectUrlRef.current) {
      URL.revokeObjectURL(createdObjectUrlRef.current);
      createdObjectUrlRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      cleanupObjectUrl();
    };
  }, [cleanupObjectUrl]);

  // Sync with value prop if value changes externally
  useEffect(() => {
    if (!isUploading) {
      setPreview(value || null);
    }
  }, [value, isUploading]);

  const initials = name
    ? name
        .trim()
        .split(/\s+/)
        .map((p) => p[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  const isImageAvatar =
    Boolean(preview) &&
    (preview!.startsWith("data:") ||
      preview!.startsWith("blob:") ||
      preview!.startsWith("http") ||
      preview!.startsWith("/") ||
      preview!.includes("/"));

  const onPickFile = async (file?: File) => {
    if (!file || disabled || isUploading || isRemoving) return;

    // 1. Pre-upload file validation (format and size)
    const validation = validateAvatarFile(file);
    if (!validation.valid) {
      toast.error(validation.error || "Invalid file.");
      if (dropInputRef.current) dropInputRef.current.value = "";
      return;
    }

    // 2. Generate local object URL preview
    cleanupObjectUrl();
    const objectUrl = URL.createObjectURL(file);
    createdObjectUrlRef.current = objectUrl;

    // 3. If not autoUpload, notify parent component of selected file and preview
    if (!autoUpload) {
      setPreview(objectUrl);
      onChange?.(objectUrl, file);
      if (dropInputRef.current) dropInputRef.current.value = "";
      return;
    }

    // 4. Auto-upload mode (standalone avatar settings card)
    // Retain previous valid preview in case replacement upload fails
    const previousPreview = preview;
    try {
      setIsUploading(true);
      setUploadProgress(10);

      const result = await uploadProfileAvatar(file, (percent) => {
        setUploadProgress(percent);
      });

      // Update preview to final public CDN URL only after success
      cleanupObjectUrl();
      setPreview(result.avatar);

      // Call success handler
      if (onUploadSuccess) {
        await onUploadSuccess(result);
      }
      onChange?.(result.avatar, null);
    } catch (err: unknown) {
      // Revert preview to previous valid attachment on failure
      cleanupObjectUrl();
      setPreview(previousPreview ?? value ?? null);
      const message =
        err instanceof Error
          ? err.message
          : typeof err === "object" && err !== null && "message" in err
            ? String((err as { message: unknown }).message)
            : "Failed to upload profile photo.";
      toast.error(message);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (dropInputRef.current) dropInputRef.current.value = "";
    }
  };

  const handleRemove = async () => {
    if (disabled || isUploading || isRemoving) return;

    cleanupObjectUrl();
    setPreview(null);
    if (dropInputRef.current) dropInputRef.current.value = "";

    try {
      setIsRemoving(true);
      if (onRemove) {
        await onRemove();
      }
      onChange?.(null, null);
    } catch (err: unknown) {
      setPreview(value || null);
      const message =
        err instanceof Error
          ? err.message
          : typeof err === "object" && err !== null && "message" in err
            ? String((err as { message: unknown }).message)
            : "Failed to remove avatar.";
      toast.error(message);
    } finally {
      setIsRemoving(false);
    }
  };

  const dimensionClasses =
    size === "sm"
      ? "h-16 w-16 text-lg"
      : size === "lg"
        ? "h-28 w-28 text-3xl"
        : "h-24 w-24 text-2xl";

  const isBusy = disabled || isUploading || isRemoving;

  const {
    isDragging,
    inputRef: dropInputRef,
    openFileDialog,
    dragProps,
    pasteProps,
    keyboardProps,
  } = useFileDropPaste({
    accept: "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp",
    maxSize: MAX_AVATAR_FILE_SIZE,
    multiple: false,
    disabled: isBusy,
    label: "profile photo",
    validateFile: validateAvatarFile,
    onFiles: (files) => {
      if (files[0]) void onPickFile(files[0]);
    },
  });

  return (
    <div {...pasteProps} className={`flex flex-col items-center gap-4 ${className}`}>
      <input
        ref={dropInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
        className="sr-only"
        disabled={isBusy}
        onChange={(e) => onPickFile(e.target.files?.[0])}
      />

      <div
        {...dragProps}
        {...keyboardProps}
        onClick={openFileDialog}
        className="relative group cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-full transition-transform"
        title="Click to browse, drag & drop image, or paste with Ctrl+V"
        aria-label="Upload profile photo. Drag and drop, paste with Ctrl+V, or press Enter to browse"
      >
        <div
          className={`grid ${dimensionClasses} shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-primary to-accent font-display font-bold shadow-glow ring-4 ring-background transition-all ${
            isBusy ? "opacity-75" : ""
          } ${isDragging ? "scale-110 ring-primary ring-8 shadow-xl" : "group-hover:scale-105"}`}
        >
          {isImageAvatar ? (
            <img
              src={preview!}
              alt={name}
              className="h-full w-full object-cover"
              onError={() => {
                // If the preview fails to load, gracefully fall back to initials
                setPreview(null);
              }}
            />
          ) : (
            <span>{initials}</span>
          )}

          {/* Dragging overlay */}
          {isDragging && (
            <div className="absolute inset-0 grid place-items-center bg-primary/50 text-white backdrop-blur-[1px]">
              <UploadCloud className="h-8 w-8 animate-bounce text-white" />
            </div>
          )}

          {/* Loading overlay when uploading directly */}
          {isBusy && !isDragging && (
            <div className="absolute inset-0 grid place-items-center bg-background/60 backdrop-blur-[1px]">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}
        </div>

        <button
          type="button"
          disabled={isBusy}
          onClick={(e) => {
            e.stopPropagation();
            openFileDialog();
          }}
          className="absolute bottom-0 right-0 grid h-7 w-7 place-items-center rounded-full bg-primary text-primary-foreground shadow-md transition-transform hover:scale-110 ring-2 ring-background disabled:pointer-events-none disabled:opacity-50"
          aria-label="Upload photo"
        >
          {isBusy ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Camera className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      {/* Upload Progress Indicator */}
      {isUploading && (
        <div className="w-full max-w-[200px] space-y-1">
          <div className="flex justify-between text-[11px] text-muted-foreground">
            <span>Uploading to CDN…</span>
            <span>{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} className="h-1.5" />
        </div>
      )}

      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-md"
          disabled={isBusy}
          onClick={openFileDialog}
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Uploading…
            </>
          ) : (
            <>
              <Upload className="mr-1.5 h-3.5 w-3.5" /> Upload photo
            </>
          )}
        </Button>

        {preview && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="rounded-md text-destructive hover:bg-destructive/10"
            disabled={isBusy}
            onClick={handleRemove}
          >
            {isRemoving ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Removing…
              </>
            ) : (
              <>
                <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Remove
              </>
            )}
          </Button>
        )}
      </div>

      <div className="text-center space-y-1">
        <p className="text-xs font-medium text-foreground">
          Drag and drop image, paste with{" "}
          <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-foreground border border-border/70">
            Ctrl+V
          </kbd>
          , or browse
        </p>
        <p className="text-[11px] text-muted-foreground">
          JPG, PNG, or WebP · square · up to {(MAX_AVATAR_FILE_SIZE / (1024 * 1024)).toFixed(0)}MB
        </p>
      </div>
    </div>
  );
}
