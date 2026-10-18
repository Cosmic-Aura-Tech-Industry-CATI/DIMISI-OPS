import React from "react";
import { UploadCloud, FileText, X, Image as ImageIcon, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useFileDropPaste,
  formatBytes,
  type FileValidationResult,
} from "@/hooks/use-file-drop-paste";

export interface FileDropzoneProps {
  id?: string;
  accept?: string;
  maxSize?: number;
  multiple?: boolean;
  disabled?: boolean;
  existingFiles?: Array<{ name: string; size?: number } | File>;
  validateFile?: (file: File) => FileValidationResult;
  onFiles: (files: File[]) => void;
  enableWindowPaste?: boolean;
  label?: string;
  hint?: string;
  className?: string;
  /**
   * For single file display mode: if a file is already selected, display it nicely with a remove button.
   */
  selectedFile?: File | null;
  onClearFile?: () => void;
  icon?: React.ReactNode;
}

export function FileDropzone({
  id = "file-dropzone-input",
  accept,
  maxSize,
  multiple = false,
  disabled = false,
  existingFiles = [],
  validateFile,
  onFiles,
  enableWindowPaste = false,
  label,
  hint,
  className = "",
  selectedFile,
  onClearFile,
  icon,
}: FileDropzoneProps) {
  const { isDragging, inputRef, openFileDialog, dragProps, pasteProps, keyboardProps } =
    useFileDropPaste({
      accept,
      maxSize,
      multiple,
      disabled,
      existingFiles,
      validateFile,
      onFiles,
      enableWindowPaste,
      label: multiple ? "files" : "file",
    });

  const isImage = selectedFile?.type.startsWith("image/");

  if (selectedFile && !multiple) {
    return (
      <div
        className={`flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-card/50 p-3.5 transition-all shadow-sm ${className}`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
            {isImage ? (
              <ImageIcon className="h-5 w-5" />
            ) : selectedFile.type === "application/pdf" ? (
              <FileText className="h-5 w-5" />
            ) : (
              <Paperclip className="h-5 w-5" />
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-foreground">{selectedFile.name}</p>
            <p className="text-[11px] text-muted-foreground">{formatBytes(selectedFile.size)}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={openFileDialog}
            disabled={disabled}
            className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground"
          >
            Change
          </Button>
          {onClearFile && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onClearFile}
              disabled={disabled}
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              title="Remove file"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <input
          ref={inputRef}
          id={id}
          type="file"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          className="sr-only"
          onChange={(e) => {
            if (e.target.files) {
              onFiles(Array.from(e.target.files));
              e.target.value = "";
            }
          }}
        />
      </div>
    );
  }

  const defaultTitle = multiple
    ? "Drag and drop files, paste with Ctrl+V, or browse"
    : "Drag and drop file, paste with Ctrl+V, or browse";

  return (
    <div
      {...dragProps}
      {...pasteProps}
      {...keyboardProps}
      onClick={openFileDialog}
      className={`group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-all outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:p-7 ${
        isDragging
          ? "border-primary bg-primary/10 shadow-glow scale-[1.01]"
          : "border-border/70 bg-card/40 hover:border-primary/60 hover:bg-primary/5"
      } ${disabled ? "pointer-events-none opacity-50" : ""} ${className}`}
    >
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        className="sr-only"
        onChange={(e) => {
          if (e.target.files) {
            onFiles(Array.from(e.target.files));
            e.target.value = "";
          }
        }}
      />

      <div
        className={`grid h-12 w-12 place-items-center rounded-xl transition-all ${
          isDragging
            ? "scale-110 bg-primary/20 text-primary shadow-md"
            : "bg-primary/10 text-primary group-hover:scale-105"
        }`}
      >
        {icon || <UploadCloud className="h-6 w-6" />}
      </div>

      <p className="mt-3 font-display text-sm font-semibold text-foreground">
        {label || defaultTitle}
      </p>

      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}

      <p className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] text-muted-foreground/90">
        <span>
          Press{" "}
          <kbd className="rounded bg-muted px-1 py-0.5 font-mono text-[10px] text-foreground border border-border/70">
            Ctrl+V
          </kbd>{" "}
          to paste
        </span>
        <span>•</span>
        <span className="text-primary font-medium group-hover:underline">Browse files</span>
      </p>
    </div>
  );
}
