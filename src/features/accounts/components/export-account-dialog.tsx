import { useState, useEffect } from "react";
import {
  AlertCircle,
  Calendar,
  Clock,
  Download,
  FileDown,
  FileText,
  Info,
  Layers,
  Loader2,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  createAsyncDownloadJob,
  exportSyncPdf,
  getAccountEstimate,
  triggerBlobDownload,
} from "../services/accounts.api";
import { DownloadProgressModal } from "./download-progress-modal";
import type {
  AccountEstimateData,
  TimeframeFilter,
} from "../types/accounts.types";

interface ExportAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExportAccountDialog({
  open,
  onOpenChange,
}: ExportAccountDialogProps) {
  const [timeframe, setTimeframe] = useState<TimeframeFilter>("monthly");
  const [useCustomDates, setUseCustomDates] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [estimate, setEstimate] = useState<AccountEstimateData | null>(null);
  const [isEstimating, setIsEstimating] = useState(false);
  const [estimateError, setEstimateError] = useState<string | null>(null);

  const [isExportingSync, setIsExportingSync] = useState(false);
  const [asyncJobId, setAsyncJobId] = useState<string | null>(null);
  const [asyncModalOpen, setAsyncModalOpen] = useState(false);

  // Fetch estimate whenever filter parameters change while dialog is open
  useEffect(() => {
    if (!open) {
      setEstimate(null);
      setEstimateError(null);
      setIsEstimating(false);
      return;
    }

    let isMounted = true;
    setIsEstimating(true);
    setEstimateError(null);

    const params = {
      format: "pdf" as const,
      timeframe: useCustomDates ? undefined : timeframe,
      fromDate: useCustomDates && fromDate ? fromDate : undefined,
      toDate: useCustomDates && toDate ? toDate : undefined,
    };

    getAccountEstimate(params)
      .then((data) => {
        if (isMounted) {
          setEstimate(data);
          setIsEstimating(false);
        }
      })
      .catch((err: Error) => {
        if (isMounted) {
          setEstimateError(err.message || "Failed to calculate export estimate.");
          setIsEstimating(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [open, timeframe, useCustomDates, fromDate, toDate]);

  const handleExport = async () => {
    if (!estimate) {
      toast.error("Please wait for estimate estimation.");
      return;
    }

    const params = {
      format: "pdf" as const,
      timeframe: useCustomDates ? undefined : timeframe,
      fromDate: useCustomDates && fromDate ? fromDate : undefined,
      toDate: useCustomDates && toDate ? toDate : undefined,
      isLogo: true,
    };

    if (estimate.recommended === "sync") {
      // Synchronous PDF stream download
      try {
        setIsExportingSync(true);
        const blob = await exportSyncPdf(params);
        const stamp = new Date().toISOString().slice(0, 10);
        triggerBlobDownload(blob, `Account_Data_${stamp}.pdf`);
        toast.success("Account PDF downloaded successfully");
        onOpenChange(false);
      } catch (err: any) {
        const msg = err?.message || "Failed to download PDF export.";
        toast.error(msg);
      } finally {
        setIsExportingSync(false);
      }
    } else {
      // Asynchronous background job creation
      try {
        setIsExportingSync(true);
        const res = await createAsyncDownloadJob(params);
        if (!res.jobId) {
          throw new Error("Job ID was not returned by the server.");
        }
        setAsyncJobId(res.jobId);
        onOpenChange(false);
        setAsyncModalOpen(true);
      } catch (err: any) {
        const msg = err?.message || "Failed to start background export job.";
        toast.error(msg);
      } finally {
        setIsExportingSync(false);
      }
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
                <FileDown className="h-4 w-4" />
              </div>
              <DialogTitle className="font-display text-xl">Export Ledger to PDF</DialogTitle>
            </div>
            <DialogDescription>
              Export account transactions and running balances into a branded PDF document.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Range Configuration */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Timeframe Filter
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs text-primary hover:text-primary/80 px-1"
                  onClick={() => setUseCustomDates((prev) => !prev)}
                >
                  {useCustomDates ? "Use Preset Timeframes" : "Custom Date Range"}
                </Button>
              </div>

              {!useCustomDates ? (
                <Select
                  value={timeframe}
                  onValueChange={(val: TimeframeFilter) => setTimeframe(val)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select timeframe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly (Last 7 Days)</SelectItem>
                    <SelectItem value="monthly">Monthly (Last 30 Days)</SelectItem>
                    <SelectItem value="quarterly">Quarterly (Last 90 Days)</SelectItem>
                    <SelectItem value="yearly">Yearly (Last 365 Days)</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="from-date" className="text-[11px] text-muted-foreground">
                      From Date
                    </Label>
                    <Input
                      id="from-date"
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="to-date" className="text-[11px] text-muted-foreground">
                      To Date
                    </Label>
                    <Input
                      id="to-date"
                      type="date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Estimation Results Panel */}
            <div className="rounded-2xl border border-border/60 bg-secondary/30 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span>Export Engine Analysis</span>
                </div>
                {isEstimating ? (
                  <Badge variant="outline" className="gap-1 border-primary/40 bg-primary/10 text-primary text-[10px]">
                    <Loader2 className="h-2.5 w-2.5 animate-spin" /> Calculating...
                  </Badge>
                ) : estimate ? (
                  <Badge
                    variant="outline"
                    className={`gap-1 text-[10px] uppercase font-semibold ${
                      estimate.recommended === "sync"
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-500"
                        : "border-amber-500/40 bg-amber-500/10 text-amber-500"
                    }`}
                  >
                    {estimate.recommended === "sync" ? "Instant Stream" : "Background Queue"}
                  </Badge>
                ) : null}
              </div>

              {isEstimating ? (
                <div className="py-4 text-center">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
                  <p className="mt-2 text-xs text-muted-foreground">Estimating records and compilation time...</p>
                </div>
              ) : estimateError ? (
                <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-2.5 text-xs text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{estimateError}</span>
                </div>
              ) : estimate ? (
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded-xl bg-background/60 p-2.5 border border-border/40">
                    <p className="text-[10px] text-muted-foreground">Matched Records</p>
                    <p className="mt-0.5 font-mono text-base font-bold text-foreground">
                      {(estimate.rows ?? 0).toLocaleString()}
                    </p>
                  </div>

                  <div className="rounded-xl bg-background/60 p-2.5 border border-border/40">
                    <p className="text-[10px] text-muted-foreground">Sync Threshold</p>
                    <p className="mt-0.5 font-mono text-base font-bold text-muted-foreground">
                      {(estimate.threshold ?? 0).toLocaleString()}
                    </p>
                  </div>

                  <div className="rounded-xl bg-background/60 p-2.5 border border-border/40">
                    <p className="text-[10px] text-muted-foreground">Est. Time</p>
                    <p className="mt-0.5 font-mono text-base font-bold text-foreground">
                      ~{estimate.estimatedSeconds || 1}s
                    </p>
                  </div>
                </div>
              ) : null}

              {estimate && (
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {estimate.recommended === "sync"
                    ? "Dataset size is within threshold (< 3,000 rows). PDF will download instantly directly in your browser."
                    : `High-volume dataset detected (${(estimate.rows ?? 0).toLocaleString()} rows). PDF will compile asynchronously in background to ensure zero server memory bottlenecks.`}
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isExportingSync}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!estimate || isEstimating || isExportingSync}
              onClick={handleExport}
              className="shadow-glow gap-1.5"
            >
              {isExportingSync ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Preparing Export...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  {estimate?.recommended === "async" ? "Start Background Export" : "Download PDF"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Async Download Polling Progress Modal */}
      <DownloadProgressModal
        open={asyncModalOpen}
        jobId={asyncJobId}
        onOpenChange={setAsyncModalOpen}
      />
    </>
  );
}
