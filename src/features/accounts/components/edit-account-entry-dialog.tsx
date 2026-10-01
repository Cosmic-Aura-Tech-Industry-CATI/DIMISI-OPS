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
import { useUpdateAccountEntry } from "../hooks/use-accounts";
import type { AccountEntry } from "../types";

interface EditAccountEntryDialogProps {
  open: boolean;
  entry: AccountEntry | null;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (entry: AccountEntry) => void;
}

export function EditAccountEntryDialog({
  open,
  entry,
  onOpenChange,
  onSuccess,
}: EditAccountEntryDialogProps) {
  const updateMutation = useUpdateAccountEntry();

  const [date, setDate] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [credit, setCredit] = useState<string>("");
  const [debit, setDebit] = useState<string>("");
  const [reason, setReason] = useState<string>("");

  const [errors, setErrors] = useState<Record<string, string>>({});

  const isUploaded = Boolean(entry?.isUploaded);

  useEffect(() => {
    if (open && entry) {
      setDate(entry.date || "");
      setName(entry.name || "");
      setCredit(entry.credit ? String(entry.credit) : "");
      setDebit(entry.debit ? String(entry.debit) : "");
      setReason(entry.reason || "");
      setErrors({});
    }
  }, [open, entry]);

  const handleCreditChange = (val: string) => {
    if (isUploaded) return;
    setCredit(val);
    if (val && parseFloat(val) > 0) {
      setDebit("");
    }
    if (errors.credit || errors.debit) {
      setErrors((prev) => ({ ...prev, credit: "", debit: "" }));
    }
  };

  const handleDebitChange = (val: string) => {
    if (isUploaded) return;
    setDebit(val);
    if (val && parseFloat(val) > 0) {
      setCredit("");
    }
    if (errors.credit || errors.debit) {
      setErrors((prev) => ({ ...prev, credit: "", debit: "" }));
    }
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Account/party name is required";
    if (!reason.trim()) errs.reason = "Reason/description is required";

    if (!isUploaded) {
      if (!date) errs.date = "Date is required";
      const cr = credit ? parseFloat(credit) : 0;
      const db = debit ? parseFloat(debit) : 0;
      if (isNaN(cr) || cr < 0) errs.credit = "Credit must be a valid non-negative number";
      if (isNaN(db) || db < 0) errs.debit = "Debit must be a valid non-negative number";

      if (cr > 0 && db > 0) {
        errs.credit = "An entry must have either Credit OR Debit, not both";
        errs.debit = "An entry must have either Credit OR Debit, not both";
      } else if (cr <= 0 && db <= 0) {
        errs.credit = "Specify either Credit or Debit amount";
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entry) return;
    if (!validate()) return;

    try {
      const payload = isUploaded
        ? {
            name: name.trim(),
            reason: reason.trim(),
          }
        : {
            name: name.trim(),
            reason: reason.trim(),
            date,
            credit: parseFloat(credit) || 0,
            debit: parseFloat(debit) || 0,
          };

      const updated = await updateMutation.mutateAsync({
        id: entry.id,
        payload,
      });

      toast.success("Account entry updated successfully");
      onOpenChange(false);
      onSuccess?.(updated);
    } catch (err: any) {
      toast.error(err?.message || "Failed to update account entry");
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
              <DialogTitle className="font-display text-xl">Edit Account Entry</DialogTitle>
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
              : "Update the transaction information, date, or credit/debit amounts."}
          </DialogDescription>
        </DialogHeader>

        {isUploaded && (
          <div className="flex items-start gap-2.5 rounded-lg border border-border/60 bg-secondary/30 p-3 text-xs text-muted-foreground">
            <Lock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div>
              <p className="font-medium text-foreground">Financial fields are read-only</p>
              <p className="mt-0.5">
                Date, Credit, and Debit originate from an uploaded statement and cannot be altered.
                You can edit the <strong>Name</strong> and <strong>Reason</strong>.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 py-1">
          {/* Date & Name */}
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
                tabIndex={isUploaded ? -1 : undefined}
                onChange={(e) => {
                  if (!isUploaded) setDate(e.target.value);
                }}
                onKeyDown={(e) => {
                  if (isUploaded) e.preventDefault();
                }}
                className={
                  isUploaded
                    ? "cursor-not-allowed bg-muted/40 opacity-80 select-none"
                    : errors.date
                      ? "border-destructive"
                      : ""
                }
                required={!isUploaded}
              />
              {errors.date && <p className="text-xs text-destructive">{errors.date}</p>}
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="edit-name"
                className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
              >
                Name / Party <span className="text-primary">*</span>
              </Label>
              <Input
                id="edit-name"
                placeholder="e.g. Acme Corporation, AWS, John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={errors.name ? "border-destructive" : ""}
                required
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
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
                  Credit (+)
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
                  value={credit}
                  disabled={isUploaded}
                  readOnly={isUploaded}
                  tabIndex={isUploaded ? -1 : undefined}
                  onChange={(e) => handleCreditChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (isUploaded) e.preventDefault();
                  }}
                  className={`pl-7 font-mono ${
                    isUploaded
                      ? "cursor-not-allowed bg-muted/40 opacity-80 select-none"
                      : errors.credit
                        ? "border-destructive"
                        : ""
                  }`}
                />
              </div>
              {errors.credit && <p className="text-xs text-destructive">{errors.credit}</p>}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="edit-debit"
                  className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
                >
                  Debit (-)
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
                  value={debit}
                  disabled={isUploaded}
                  readOnly={isUploaded}
                  tabIndex={isUploaded ? -1 : undefined}
                  onChange={(e) => handleDebitChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (isUploaded) e.preventDefault();
                  }}
                  className={`pl-7 font-mono ${
                    isUploaded
                      ? "cursor-not-allowed bg-muted/40 opacity-80 select-none"
                      : errors.debit
                        ? "border-destructive"
                        : ""
                  }`}
                />
              </div>
              {errors.debit && <p className="text-xs text-destructive">{errors.debit}</p>}
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-1.5">
            <Label
              htmlFor="edit-reason"
              className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
            >
              Reason / Purpose <span className="text-primary">*</span>
            </Label>
            <Textarea
              id="edit-reason"
              placeholder="e.g. Monthly cloud server infrastructure billing..."
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className={errors.reason ? "border-destructive" : ""}
              required
            />
            {errors.reason && <p className="text-xs text-destructive">{errors.reason}</p>}
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
            <Button type="submit" disabled={updateMutation.isPending} className="shadow-glow">
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Pencil className="mr-1.5 h-4 w-4" /> Update Entry
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
