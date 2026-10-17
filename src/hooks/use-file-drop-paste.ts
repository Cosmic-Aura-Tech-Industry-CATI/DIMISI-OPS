import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export interface UseFileDropPasteOptions {
  /**
   * Accepted mime types or extensions, comma-separated.
   * e.g. "image/*,.pdf,.doc,.docx"
   */
  accept?: string;
  /**
   * Maximum allowed file size in bytes per file.
   */
  maxSize?: number;
  /**
   * Whether multiple files can be added. Defaults to false.
   */
  multiple?: boolean;
  /**
   * Whether the upload zone is currently disabled or uploading.
   */
  disabled?: boolean;
  /**
   * Existing files already selected or uploaded.
   * Used for duplicate prevention.
   */
  existingFiles?: Array<{ name: string; size?: number } | File | { file?: File }>;
  /**
   * Custom validator for each file.
   */
  validateFile?: (file: File) => FileValidationResult;
  /**
   * Callback invoked with valid, non-duplicate files.
   */
  onFiles: (files: File[]) => void;
  /**
   * Whether to listen for paste globally on window when this dropzone is mounted.
   * Defaults to false so it doesn't conflict unless explicitly enabled (e.g. in modals or pages).
   */
  enableWindowPaste?: boolean;
  /**
   * Optional custom dropzone label/context for toast notifications (e.g. "statement PDF" or "avatar").
   */
  label?: string;
}

/**
 * Format bytes into human-readable string.
 */
export function formatBytes(bytes: number): string {
  if (bytes <= 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Checks whether a file matches the provided `accept` string.
 */
export function isFileTypeAccepted(file: File, accept?: string): boolean {
  if (!accept || !accept.trim()) return true;

  const fileName = file.name.toLowerCase();
  const fileType = (file.type || "").toLowerCase();
  const tokens = accept
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);

  if (tokens.length === 0) return true;

  return tokens.some((token) => {
    // Extension match: e.g. ".pdf", ".png"
    if (token.startsWith(".")) {
      return fileName.endsWith(token);
    }
    // Wildcard MIME match: e.g. "image/*", "video/*"
    if (token.endsWith("/*")) {
      const typePrefix = token.slice(0, -1);
      return fileType.startsWith(typePrefix);
    }
    // Exact MIME match: e.g. "application/pdf"
    return fileType === token;
  });
}

/**
 * Normalizes clipboard items and files, returning a list of File objects.
 * Supports both OS file copy-paste (e.g. Ctrl+C on a file in Explorer)
 * and screenshot / clipboard image copy-paste (PrintScreen, Snipping tool, etc.).
 */
export function extractFilesFromClipboard(e: ClipboardEvent | React.ClipboardEvent): File[] {
  const clipboardData = "clipboardData" in e ? e.clipboardData : null;
  if (!clipboardData) return [];

  const files: File[] = [];

  // 1. Direct files in clipboard
  if (clipboardData.files && clipboardData.files.length > 0) {
    for (let i = 0; i < clipboardData.files.length; i++) {
      const file = clipboardData.files[i];
      if (file) files.push(file);
    }
  }

  // 2. Clipboard items (screenshots, copied image bitmap data)
  if (clipboardData.items && clipboardData.items.length > 0) {
    for (let i = 0; i < clipboardData.items.length; i++) {
      const item = clipboardData.items[i];
      if (item.kind === "file") {
        const file = item.getAsFile();
        if (file) {
          // If already added by clipboardData.files with same name and size, avoid duplicate
          const alreadyAdded = files.some(
            (f) => f.name === file.name && f.size === file.size && f.type === file.type,
          );
          if (!alreadyAdded) {
            // If the screenshot has generic name like "image.png", give it a readable timestamped name
            if (file.name === "image.png" || !file.name) {
              const ext = file.type.split("/")[1] || "png";
              const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
              const renamedFile = new File([file], `screenshot-${timestamp}.${ext}`, {
                type: file.type,
              });
              files.push(renamedFile);
            } else {
              files.push(file);
            }
          }
        }
      }
    }
  }

  return files;
}

export function useFileDropPaste({
  accept,
  maxSize,
  multiple = false,
  disabled = false,
  existingFiles = [],
  validateFile,
  onFiles,
  enableWindowPaste = false,
  label = "file",
}: UseFileDropPasteOptions) {
  const [isDragging, setIsDragging] = useState(false);
  const dragCounterRef = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement | HTMLLabelElement | null>(null);

  /**
   * Helper to open system file picker
   */
  const openFileDialog = useCallback(() => {
    if (disabled) return;
    if (inputRef.current) {
      inputRef.current.value = "";
      inputRef.current.click();
    }
  }, [disabled]);

  /**
   * Check if a file is already present in existingFiles
   */
  const isDuplicate = useCallback(
    (file: File) => {
      return existingFiles.some((item) => {
        if (!item) return false;
        if (item instanceof File) {
          return item.name === file.name && item.size === file.size;
        }
        if ("file" in item && item.file instanceof File) {
          return item.file.name === file.name && item.file.size === file.size;
        }
        if ("name" in item && typeof item.name === "string") {
          if (typeof item.size === "number") {
            return item.name === file.name && item.size === file.size;
          }
          return item.name === file.name;
        }
        return false;
      });
    },
    [existingFiles],
  );

  /**
   * Filter and validate candidate files
   */
  const processFiles = useCallback(
    (incoming: File[] | FileList | null | undefined) => {
      if (disabled || !incoming) return;

      const fileList = Array.from(incoming);
      if (fileList.length === 0) return;

      const validFiles: File[] = [];

      for (const file of fileList) {
        // 1. Duplicate check
        if (isDuplicate(file)) {
          toast.info(`"${file.name}" is already added.`);
          continue;
        }

        // 2. Format / Accept check
        if (accept && !isFileTypeAccepted(file, accept)) {
          toast.error(`Unsupported format: ${file.name}`, {
            description: `Allowed file types: ${accept}`,
          });
          continue;
        }

        // 3. Max size check
        if (maxSize && file.size > maxSize) {
          toast.error(`File too large: ${file.name}`, {
            description: `Maximum allowed size is ${formatBytes(maxSize)} (file is ${formatBytes(file.size)}).`,
          });
          continue;
        }

        // 4. Custom validation callback
        if (validateFile) {
          const result = validateFile(file);
          if (!result.valid) {
            toast.error(result.error || `Invalid file: ${file.name}`);
            continue;
          }
        }

        validFiles.push(file);

        // If single file mode, stop after first valid file
        if (!multiple) {
          if (fileList.length > 1) {
            toast.info(`Single ${label} upload: Selected "${file.name}".`);
          }
          break;
        }
      }

      if (validFiles.length > 0) {
        onFiles(validFiles);
      }
    },
    [disabled, isDuplicate, accept, maxSize, validateFile, multiple, label, onFiles],
  );

  // Drag event handlers
  const handleDragEnter = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (disabled) return;
      dragCounterRef.current += 1;
      if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) {
        setIsDragging(true);
      }
    },
    [disabled],
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (disabled) return;
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = "copy";
      }
    },
    [disabled],
  );

  const handleDragLeave = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (disabled) return;
      dragCounterRef.current -= 1;
      if (dragCounterRef.current <= 0) {
        dragCounterRef.current = 0;
        setIsDragging(false);
      }
    },
    [disabled],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current = 0;
      setIsDragging(false);
      if (disabled) return;

      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        processFiles(e.dataTransfer.files);
      }
    },
    [disabled, processFiles],
  );

  // Paste handler for the container
  const handlePaste = useCallback(
    (e: React.ClipboardEvent | ClipboardEvent) => {
      if (disabled) return;

      const files = extractFilesFromClipboard(e);
      if (files.length > 0) {
        e.preventDefault();
        e.stopPropagation();
        processFiles(files);
      } else {
        // If container itself was focused and paste contained no files, inform the user
        const target = e.target as HTMLElement | null;
        const isTextInput =
          target instanceof HTMLInputElement ||
          target instanceof HTMLTextAreaElement ||
          target?.isContentEditable;

        if (!isTextInput) {
          toast.info("No supported file in clipboard. Copy a file or screenshot and press Ctrl+V.");
        }
      }
    },
    [disabled, processFiles],
  );

  // Keyboard accessibility handler for focusable dropzone
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (disabled) return;
      // Trigger file dialog on Enter or Space
      if (e.key === "Enter" || e.key === " ") {
        // If target is a button or input inside the dropzone, let it handle its own click
        const target = e.target as HTMLElement;
        if (target.tagName === "BUTTON" || target.tagName === "INPUT" || target.tagName === "A") {
          return;
        }
        e.preventDefault();
        openFileDialog();
      }
    },
    [disabled, openFileDialog],
  );

  // Window-level paste listener
  useEffect(() => {
    if (!enableWindowPaste || disabled) return;

    const onWindowPaste = (e: ClipboardEvent) => {
      // Check activeElement: if the user is typing in a text field, do not hijack text paste
      const activeEl = document.activeElement as HTMLElement | null;
      const isTypingText =
        activeEl instanceof HTMLInputElement && activeEl.type !== "file"
          ? true
          : activeEl instanceof HTMLTextAreaElement
            ? true
            : activeEl?.isContentEditable;

      const files = extractFilesFromClipboard(e);

      // If user is typing text and clipboard has NO files, let normal text paste happen!
      if (isTypingText && files.length === 0) {
        return;
      }

      // If clipboard HAS files:
      if (files.length > 0) {
        e.preventDefault();
        processFiles(files);
      }
    };

    window.addEventListener("paste", onWindowPaste);
    return () => {
      window.removeEventListener("paste", onWindowPaste);
    };
  }, [enableWindowPaste, disabled, processFiles]);

  return {
    isDragging,
    inputRef,
    containerRef,
    openFileDialog,
    processFiles,
    dragProps: {
      onDragEnter: handleDragEnter,
      onDragOver: handleDragOver,
      onDragLeave: handleDragLeave,
      onDrop: handleDrop,
    },
    pasteProps: {
      onPaste: handlePaste,
    },
    keyboardProps: {
      tabIndex: disabled ? -1 : 0,
      role: "button" as const,
      onKeyDown: handleKeyDown,
    },
  };
}
