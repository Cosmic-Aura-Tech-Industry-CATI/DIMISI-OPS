import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  Loader2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  pollDownloadJob,
  triggerUrlDownload,
} from "../services/accounts.api";
import type {
  DownloadJobStatus,
  DownloadJobStatusResult,
} from "../types/accounts.types";

interface DownloadProgressModalProps {
  open: boolean;
  jobId: string | null;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function DownloadProgressModal({
  open,
  jobId,
  onOpenChange,
  onSuccess,
}: DownloadProgressModalProps) {
  const [status, setStatus] = useState<DownloadJobStatus>("queued");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  // Ref to prevent duplicate polling and handle unmount cancellation
  const abortControllerRef = useRef<AbortController | null>(null);
  const isPollingRef = useRef<boolean>(false);

  useEffect(() => {
    if (!open || !jobId) {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      isPollingRef.current = false;
      return;
    }

    if (isPollingRef.current) return;
    isPollingRef.current = true;

    setStatus("queued");
    setErrorMessage(null);
    setDownloadUrl(null);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    pollDownloadJob(
      jobId,
      (update: DownloadJobStatusResult) => {
        setStatus(update.status);
        if (update.downloadUrl) {
          setDownloadUrl(update.downloadUrl);
        }
      },
      3000,
      120, // up to 6 minutes
      controller.signal,
    )
      .then((finalResult) => {
        setStatus("completed");
        if (finalResult.downloadUrl) {
          setDownloadUrl(finalResult.downloadUrl);
          const fileName = `Account_Data_${new Date().toISOString().slice(0, 10)}.pdf`;
          triggerUrlDownload(finalResult.downloadUrl, fileName);
          toast.success("Account PDF downloaded successfully");
          onSuccess?.();
          setTimeout(() => {
            onOpenChange(false);
          }, 1200);
        }
      })
      .catch((err: Error) => {
        if (controller.signal.aborted) return;
        setStatus("failed");
        setErrorMessage(err.message || "Background PDF export failed");
        toast.error(err.message || "PDF generation failed");
      })
      .finally(() => {
        isPollingRef.current = false;
      });

    return () => {
      controller.abort();
      abortControllerRef.current = null;
      isPollingRef.current = false;
    };
  }, [open, jobId, onOpenChange, onSuccess]);

  const handleManualDownload = () => {
    if (downloadUrl) {
      const fileName = `Account_Data_${new Date().toISOString().slice(0, 10)}.pdf`;
      triggerUrlDownload(downloadUrl, fileName);
      onOpenChange(false);
    }
  };

  const handleClose = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    isPollingRef.current = false;
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
              <FileText className="h-4 w-4" />
            </div>
            <DialogTitle className="font-display text-xl">Generating Account PDF</DialogTitle>
          </div>
          <DialogDescription>
            High-volume asynchronous report processor. Preparing financial vouchers in background.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {status === "queued" && (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-border/60 bg-secondary/30 p-6 text-center space-y-3">
              <Clock className="h-10 w-10 text-amber-500 animate-pulse" />
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-foreground">Preparing PDF...</h4>
                <p className="text-xs text-muted-foreground">
                  Job is in queue. Processing will begin shortly.
                </p>
              </div>
              <div className="w-full max-w-xs pt-2">
                <Progress value={20} className="h-2" />
              </div>
            </div>
          )}

          {status === "processing" && (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-primary/30 bg-primary/5 p-6 text-center space-y-3">
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-foreground">Processing PDF statement...</h4>
                <p className="text-xs text-muted-foreground">
                  Streaming ledger records and formatting table pages.
                </p>
              </div>
              <div className="w-full max-w-xs pt-2">
                <Progress value={65} className="h-2" />
              </div>
            </div>
          )}

          {status === "completed" && (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6 text-center space-y-3">
              <CheckCircle2 className="h-10 w-10 text-emerald-500" />
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-foreground">PDF Ready</h4>
                <p className="text-xs text-muted-foreground">
                  Your PDF report has been generated. The download has started automatically.
                </p>
              </div>
            </div>
          )}

          {status === "failed" && (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center space-y-3">
              <AlertCircle className="h-10 w-10 text-destructive" />
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-destructive">Generation Failed</h4>
                <p className="text-xs text-muted-foreground">
                  {errorMessage || "An error occurred while compiling the PDF export."}
                </p>
              </div>
            </div>
          )}

          {jobId && (
            <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-secondary/40 text-[11px] font-mono text-muted-foreground">
              <span>Job ID: {jobId}</span>
              <span className="uppercase font-semibold text-primary">{status}</span>
            </div>
          )}
        </div>

        <DialogFooter>
          {status === "completed" && downloadUrl ? (
            <Button onClick={handleManualDownload} className="shadow-glow gap-1.5">
              <Download className="h-4 w-4" /> Download Again
            </Button>
          ) : (
            <Button variant="outline" onClick={handleClose}>
              {status === "failed" ? "Close" : "Cancel"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
