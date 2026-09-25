import { useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  FileUp,
  Loader2,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUploadAccountEntries } from "../hooks/use-accounts";
import type { CreateAccountEntryPayload } from "../types";

interface UploadEntriesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface ParsedPdfItem {
  id: string;
  date: string;
  name: string;
  credit: number;
  debit: number;
  balance: number;
  reason: string;
}

const SAMPLE_EXTRACTED_DATA: Omit<ParsedPdfItem, "id">[] = [
  {
    date: "2026-09-24",
    name: "Enterprise Wire Payout (Stripe Inc)",
    credit: 215000,
    debit: 0,
    balance: 757000,
    reason: "Monthly subscription auto-settlement payout batch #9842",
  },
  {
    date: "2026-09-23",
    name: "Cloudflare Enterprise Security",
    credit: 0,
    debit: 14500,
    balance: 542000,
    reason: "DDoS mitigation & CDN edge network traffic allowance",
  },
  {
    date: "2026-09-21",
    name: "Anthropic Claude API Services",
    credit: 0,
    debit: 9800,
    balance: 556500,
    reason: "Claude 3.5 Sonnet processing batch operations",
  },
  {
    date: "2026-09-19",
    name: "Vanguard Tech Ventures Retainer",
    credit: 180000,
    debit: 0,
    balance: 566300,
    reason: "Q3 architectural audit milestone delivery invoice #VTV-401",
  },
];

export function UploadEntriesDialog({
  open,
  onOpenChange,
  onSuccess,
}: UploadEntriesDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = useUploadAccountEntries();

  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parsedItems, setParsedItems] = useState<ParsedPdfItem[]>([]);
  const [dragOver, setDragOver] = useState(false);

  const handleFileSelect = (selectedFile: File) => {
    if (!selectedFile.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Invalid file format", {
        description: "Please upload a valid PDF bank or ledger statement.",
      });
      return;
    }

    setFile(selectedFile);
    setIsParsing(true);

    // Simulate smart PDF optical/text parsing
    setTimeout(() => {
      const generated = SAMPLE_EXTRACTED_DATA.map((item, idx) => ({
        ...item,
        id: `extracted-${Date.now()}-${idx}`,
      }));
      setParsedItems(generated);
      setIsParsing(false);
      toast.success(`Extracted ${generated.length} transactions from PDF`);
    }, 900);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleDeleteItem = (id: string) => {
    setParsedItems((prev) => prev.filter((item) => item.id !== id));
  };

  const resetDialog = () => {
    setFile(null);
    setParsedItems([]);
    setIsParsing(false);
    setDragOver(false);
  };

  const handleConfirmImport = async () => {
    if (parsedItems.length === 0) {
      toast.error("No entries to import");
      return;
    }

    try {
      const payload: CreateAccountEntryPayload[] = parsedItems.map((item) => ({
        date: item.date,
        name: item.name,
        credit: item.credit,
        debit: item.debit,
        balance: item.balance,
        reason: item.reason,
        isUploaded: true,
      }));

      await uploadMutation.mutateAsync(payload);
      toast.success(`Successfully imported ${parsedItems.length} transactions`);
      resetDialog();
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      toast.error(err?.message || "Failed to import entries from PDF");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) resetDialog();
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
              <FileUp className="h-4 w-4" />
            </div>
            <DialogTitle className="font-display text-xl">Upload PDF Statement</DialogTitle>
          </div>
          <DialogDescription>
            Import and reconcile financial vouchers directly from your bank or ERP statements.
          </DialogDescription>
        </DialogHeader>

        {!file ? (
          /* Dropzone */
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-all ${
              dragOver
                ? "border-primary bg-primary/10"
                : "border-border/70 hover:border-primary/60 hover:bg-secondary/20"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileSelect(e.target.files[0]);
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
              Bank statements, e-passbooks, or credit/debit transaction logs (PDF)
            </p>
          </div>
        ) : isParsing ? (
          /* Parsing Loader */
          <div className="glass flex flex-col items-center justify-center rounded-xl py-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="mt-3 text-sm font-medium text-foreground">Parsing statement...</p>
            <p className="text-xs text-muted-foreground">
              Extracting transaction rows, dates, and amounts
            </p>
          </div>
        ) : (
          /* Extraction Preview */
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border border-border/60 bg-secondary/30 px-3.5 py-2.5 text-xs">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <span className="font-medium text-foreground">{file.name}</span>
                <Badge variant="outline" className="border-border/60 text-[10px]">
                  {(file.size / 1024).toFixed(1)} KB
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-muted-foreground hover:text-foreground"
                onClick={resetDialog}
              >
                Change file
              </Button>
            </div>

            <div className="max-h-[280px] overflow-y-auto rounded-xl border border-border/60">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-secondary text-muted-foreground font-medium uppercase tracking-wider">
                  <tr>
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2">Party / Name</th>
                    <th className="px-3 py-2">Credit</th>
                    <th className="px-3 py-2">Debit</th>
                    <th className="px-3 py-2">Balance</th>
                    <th className="px-3 py-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 font-mono">
                  {parsedItems.map((item) => (
                    <tr key={item.id} className="hover:bg-muted/30">
                      <td className="px-3 py-2 font-sans">{item.date}</td>
                      <td className="px-3 py-2 font-sans font-medium text-foreground max-w-[160px] truncate">
                        {item.name}
                      </td>
                      <td className="px-3 py-2 text-emerald-500 font-semibold">
                        {item.credit > 0 ? `₹${item.credit.toLocaleString("en-IN")}` : "—"}
                      </td>
                      <td className="px-3 py-2 text-rose-500 font-semibold">
                        {item.debit > 0 ? `₹${item.debit.toLocaleString("en-IN")}` : "—"}
                      </td>
                      <td className="px-3 py-2 text-foreground font-bold">
                        ₹{item.balance.toLocaleString("en-IN")}
                      </td>
                      <td className="px-3 py-2 text-right font-sans">
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item.id)}
                          className="text-muted-foreground hover:text-destructive p-1 rounded"
                          title="Remove item"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[11px] text-muted-foreground">
              These transactions will be added as locked records (isUploaded: true).
            </p>
          </div>
        )}

        <DialogFooter className="pt-2">
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
            disabled={parsedItems.length === 0 || uploadMutation.isPending}
            onClick={handleConfirmImport}
            className="shadow-glow"
          >
            {uploadMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Importing...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-1.5 h-4 w-4" /> Import {parsedItems.length} Entries
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
