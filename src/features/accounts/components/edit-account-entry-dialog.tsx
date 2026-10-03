import { useEffect, useState } from "react";
import { FileText, Loader2, Lock, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUpdateTransactionMutation } from "../hooks/accounts.hooks";
import {
  toInputDateFormat,
  validateUpdateTransaction,
} from "../utils/accounts.utils";
import type { AccountTransaction } from "../types/accounts.types";

interface EditAccountEntryDialogProps {
  open: boolean;
  entry: AccountTransaction | null;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (entry: AccountTransaction) => void;
}

export function EditAccountEntryDialog({
  open,
  entry,
  onOpenChange,
  onSuccess,
}: EditAccountEntryDialogProps) {
  const updateMutation = useUpdateTransactionMutation();

  const [date, setDate] = useState<string>("");
  const [partyName, setPartyName] = useState<string>("");
  const [creditAmount, setCreditAmount] = useState<string>("");
  const [debitAmount, setDebitAmount] = useState<string>("");
  const [purpose, setPurpose] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isUploaded = Boolean(entry?.isUploaded);

  useEffect(() => {
    if (open && entry) {
      setDate(toInputDateFormat(entry.transactionDate));
      setPartyName(entry.partyName || "");
      setCreditAmount(entry.creditAmount ? String(entry.creditAmount) : "");
      setDebitAmount(entry.debitAmount ? String(entry.debitAmount) : "");
      setPurpose(entry.purpose || "");
      setErrors({});
    }
  }, [open, entry]);

  const handleCreditChange = (val: string) => {
    if (isUploaded) return;
    setCreditAmount(val);
    if (val && parseFloat(val) > 0) {
      setDebitAmount("");
    }
    if (errors.creditAmount || errors.debitAmount) {
      setErrors((prev) => ({ ...prev, creditAmount: "", debitAmount: "" }));
    }
  };

  const handleDebitChange = (val: string) => {
    if (isUploaded) return;
    setDebitAmount(val);
    if (val && parseFloat(val) > 0) {
      setCreditAmount("");
    }
    if (errors.creditAmount || errors.debitAmount) {
      setErrors((prev) => ({ ...prev, creditAmount: "", debitAmount: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entry) return;

    const id = entry._id || entry.id;
    if (!id) {
      toast.error("Transaction identifier missing");
      return;
    }

    const payload = isUploaded
      ? {
          partyName: partyName.trim(),
          purpose: purpose.trim(),
        }
      : {
          transactionDate: date,
          partyName: partyName.trim(),
          purpose: purpose.trim(),
          creditAmount: creditAmount ? parseFloat(creditAmount) : 0,
          debitAmount: debitAmount ? parseFloat(debitAmount) : 0,
        };

    const validationErrors = validateUpdateTransaction(payload, isUploaded);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      const updated = await updateMutation.mutateAsync({
        id,
        payload,
      });

      toast.success("Transaction updated successfully");
      onOpenChange(false);
      onSuccess?.(updated);
    } catch (err: any) {
      const msg = err?.message || err?.error || "Failed to update transaction";
      toast.error(msg);
    }
  };

  if (!entry) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
                <Pencil className="h-4 w-4" />
              </div>
              <DialogTitle className="font-display text-xl">Edit Transaction Voucher</DialogTitle>
            </div>
            {isUploaded ? (
              <Badge
                variant="outline"
                className="gap-1 border-primary/40 bg-primary/10 text-primary text-[11px]"
              >
                <FileText className="h-3 w-3" /> Uploaded PDF
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1 text-muted-foreground text-[11px]">
                Manual Voucher
              </Badge>
            )}
          </div>
          <DialogDescription>
            {isUploaded
              ? "This transaction was imported from a PDF statement. Financial amounts and date are locked to protect ledger integrity."
              : "Update the voucher information, date, or credit/debit amounts."}
          </DialogDescription>
        </DialogHeader>

        {isUploaded && (
          <div className="flex items-start gap-2.5 rounded-lg border border-border/60 bg-secondary/30 p-3 text-xs text-muted-foreground">
            <Lock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div>
              <p className="font-medium text-foreground">Financial fields are locked</p>
              <p className="mt-0.5">
                Date, Credit, and Debit were extracted from a verified statement. You may update the{" "}
                <strong>Party Name</strong> and <strong>Purpose</strong>.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 py-1">
          {/* Date & Party Name */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="edit-date"
                  className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
                >
                  Date
                </Label>
                {isUploaded && (
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Lock className="h-2.5 w-2.5" /> Locked
                  </span>
                )}
              </div>
              <Input
                id="edit-date"
                type="date"
                value={date}
                disabled={isUploaded}
                readOnly={isUploaded}
                onChange={(e) => {
                  if (!isUploaded) setDate(e.target.value);
                  if (errors.transactionDate) {
                    setErrors((prev) => ({ ...prev, transactionDate: "" }));
                  }
                }}
                className={
                  isUploaded
                    ? "cursor-not-allowed bg-muted/40 opacity-80 select-none"
                    : errors.transactionDate
                      ? "border-destructive"
                      : ""
                }
                required={!isUploaded}
              />
              {errors.transactionDate && (
                <p className="text-xs text-destructive">{errors.transactionDate}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="edit-party"
                className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
              >
                Party Name <span className="text-primary">*</span>
              </Label>
              <Input
                id="edit-party"
                placeholder="e.g. Acme Corporation, AWS, John Doe"
                value={partyName}
                onChange={(e) => {
                  setPartyName(e.target.value);
                  if (errors.partyName) {
                    setErrors((prev) => ({ ...prev, partyName: "" }));
                  }
                }}
                className={errors.partyName ? "border-destructive" : ""}
                maxLength={100}
                required
              />
              {errors.partyName && (
                <p className="text-xs text-destructive">{errors.partyName}</p>
              )}
            </div>
          </div>

          {/* Credit & Debit */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="edit-credit"
                  className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
                >
                  Credit Amount (+)
                </Label>
                {isUploaded && <Lock className="h-2.5 w-2.5 text-muted-foreground" />}
              </div>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-muted-foreground">
                  ₹
                </span>
                <Input
                  id="edit-credit"
                  type="number"
                  step="any"
                  min="0"
                  placeholder="0.00"
                  value={creditAmount}
                  disabled={isUploaded}
                  readOnly={isUploaded}
                  onChange={(e) => handleCreditChange(e.target.value)}
                  className={`pl-7 font-mono ${
                    isUploaded
                      ? "cursor-not-allowed bg-muted/40 opacity-80 select-none"
                      : errors.creditAmount
                        ? "border-destructive"
                        : ""
                  }`}
                />
              </div>
              {errors.creditAmount && (
                <p className="text-xs text-destructive">{errors.creditAmount}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="edit-debit"
                  className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
                >
                  Debit Amount (-)
                </Label>
                {isUploaded && <Lock className="h-2.5 w-2.5 text-muted-foreground" />}
              </div>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-muted-foreground">
                  ₹
                </span>
                <Input
                  id="edit-debit"
                  type="number"
                  step="any"
                  min="0"
                  placeholder="0.00"
                  value={debitAmount}
                  disabled={isUploaded}
                  readOnly={isUploaded}
                  onChange={(e) => handleDebitChange(e.target.value)}
                  className={`pl-7 font-mono ${
                    isUploaded
                      ? "cursor-not-allowed bg-muted/40 opacity-80 select-none"
                      : errors.debitAmount
                        ? "border-destructive"
                        : ""
                  }`}
                />
              </div>
              {errors.debitAmount && (
                <p className="text-xs text-destructive">{errors.debitAmount}</p>
              )}
            </div>
          </div>

          {/* Purpose */}
          <div className="space-y-1.5">
            <Label
              htmlFor="edit-purpose"
              className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
            >
              Purpose / Description <span className="text-primary">*</span>
            </Label>
            <Textarea
              id="edit-purpose"
              placeholder="e.g. Monthly cloud server infrastructure billing..."
              rows={3}
              value={purpose}
              onChange={(e) => {
                setPurpose(e.target.value);
                if (errors.purpose) {
                  setErrors((prev) => ({ ...prev, purpose: "" }));
                }
              }}
              className={errors.purpose ? "border-destructive" : ""}
              maxLength={500}
              required
            />
            {errors.purpose && (
              <p className="text-xs text-destructive">{errors.purpose}</p>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updateMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateMutation.isPending}
              className="shadow-glow"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...
                </>
              ) : (
                <>
                  <Pencil className="mr-1.5 h-4 w-4" /> Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
