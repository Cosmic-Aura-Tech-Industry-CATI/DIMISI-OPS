import { useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Copy,
  FileCheck,
  FileText,
  FileUp,
  Loader2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUploadPdfMutation } from "../hooks/accounts.hooks";
import type { UploadPdfResponse } from "../types/accounts.types";

interface UploadEntriesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (response: UploadPdfResponse) => void;
}

const MAX_FILE_SIZE_MB = 25;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export function UploadEntriesDialog({
  open,
  onOpenChange,
  onSuccess,
}: UploadEntriesDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = useUploadPdfMutation();

  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<UploadPdfResponse | null>(null);

  const resetDialog = () => {
    setFile(null);
    setDragOver(false);
    setUploadProgress(0);
    setUploadResult(null);
  };

  const validateAndSetFile = (selectedFile: File) => {
    if (
      !selectedFile.name.toLowerCase().endsWith(".pdf") &&
      selectedFile.type !== "application/pdf"
    ) {
      toast.error("Invalid file format", {
        description: "Only PDF bank/ledger statements are supported.",
      });
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
      toast.error("File exceeds size limit", {
        description: `Max allowed file size is ${MAX_FILE_SIZE_MB}MB.`,
      });
      return;
    }

    setFile(selectedFile);
    setUploadResult(null);
    setUploadProgress(0);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a PDF file first");
      return;
    }

    try {
      setUploadProgress(10);
      const res = await uploadMutation.mutateAsync({
        file,
        onProgress: (percent) => {
          setUploadProgress(percent);
        },
      });

      setUploadProgress(100);
      setUploadResult(res);
      toast.success("PDF uploaded successfully and added to processing queue");
      onSuccess?.(res);
    } catch (err: any) {
      const msg = err?.message || err?.error || "Failed to upload statement PDF";
      toast.error(msg);
      setUploadProgress(0);
    }
  };

  const handleCopyJobId = (jobId: string) => {
    navigator.clipboard.writeText(jobId);
    toast.success("Job ID copied to clipboard");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) resetDialog();
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
              <FileUp className="h-4 w-4" />
            </div>
            <DialogTitle className="font-display text-xl">Upload PDF Statement</DialogTitle>
          </div>
          <DialogDescription>
            Upload bank statements or accounting ledgers in PDF format for automated transaction extraction.
          </DialogDescription>
        </DialogHeader>

        {uploadResult ? (
          /* Success State (202 Accepted) */
          <div className="space-y-4 py-2">
            <div className="flex flex-col items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6 text-center">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-emerald-500/20 text-emerald-500">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h4 className="mt-3 text-base font-semibold text-foreground">
                PDF Uploaded Successfully
              </h4>
              <p className="mt-1 text-xs text-muted-foreground">
                PDF uploaded successfully and added to processing queue
              </p>
            </div>

            {/* Job Metadata Card */}
            <div className="rounded-xl border border-border/60 bg-secondary/30 p-4 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground font-medium">Status</span>
                <Badge
                  variant="outline"
                  className="gap-1 border-primary/40 bg-primary/10 text-primary uppercase text-[10px]"
                >
                  <Clock className="h-3 w-3 animate-pulse" /> {uploadResult.status || "queued"}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground font-medium">Job Identifier</span>
                <div className="flex items-center gap-1.5 font-mono text-[11px] text-foreground">
                  <span>{uploadResult.jobId}</span>
                  <button
                    type="button"
                    onClick={() => handleCopyJobId(uploadResult.jobId)}
                    className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors"
                    title="Copy Job ID"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                </div>
              </div>

              {uploadResult.message && (
                <div className="pt-1 text-[11px] text-muted-foreground border-t border-border/40">
                  {uploadResult.message}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* File Selection / Dropzone */
          <div className="space-y-4 py-1">
            {!file ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
                  dragOver
                    ? "border-primary bg-primary/10"
                    : "border-border/70 hover:border-primary/60 hover:bg-secondary/20"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      validateAndSetFile(e.target.files[0]);
                    }
                  }}
                />
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-secondary text-primary">
                  <Upload className="h-6 w-6" />
                </div>
                <h4 className="mt-3 text-sm font-semibold text-foreground">
                  Click to select PDF or drag and drop
                </h4>
                <p className="mt-1 text-xs text-muted-foreground">
                  PDF format only (up to {MAX_FILE_SIZE_MB}MB)
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-xl border border-border/60 bg-secondary/30 p-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    <FileText className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium text-foreground truncate max-w-[240px]">
                        {file.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-muted-foreground hover:text-foreground"
                    onClick={resetDialog}
                    disabled={uploadMutation.isPending}
                  >
                    Change
                  </Button>
                </div>

                {uploadMutation.isPending && (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Uploading to queue...</span>
                      <span className="font-mono font-medium">{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-2" />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <DialogFooter className="pt-2">
          {uploadResult ? (
            <Button
              type="button"
              onClick={() => onOpenChange(false)}
              className="shadow-glow w-full sm:w-auto"
            >
              Done
            </Button>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={uploadMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={!file || uploadMutation.isPending}
                onClick={handleUpload}
                className="shadow-glow"
              >
                {uploadMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading ({uploadProgress}%)...
                  </>
                ) : (
                  <>
                    <Upload className="mr-1.5 h-4 w-4" /> Upload Statement
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { UploadEntriesDialog as UploadAccountPdfDialog };
