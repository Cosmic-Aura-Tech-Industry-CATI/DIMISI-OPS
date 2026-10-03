import { useState } from "react";
import { Loader2, PlusCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCreateTransactionMutation } from "../hooks/accounts.hooks";
import { validateCreateTransaction } from "../utils/accounts.utils";
import type { AccountTransaction } from "../types/accounts.types";

interface CreateAccountEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (entry: AccountTransaction) => void;
}

export function CreateAccountEntryDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateAccountEntryDialogProps) {
  const createMutation = useCreateTransactionMutation();

  const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [partyName, setPartyName] = useState<string>("");
  const [creditAmount, setCreditAmount] = useState<string>("");
  const [debitAmount, setDebitAmount] = useState<string>("");
  const [purpose, setPurpose] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const resetForm = () => {
    setDate(new Date().toISOString().split("T")[0]);
    setPartyName("");
    setCreditAmount("");
    setDebitAmount("");
    setPurpose("");
    setErrors({});
  };

  const handleCreditChange = (val: string) => {
    setCreditAmount(val);
    if (val && parseFloat(val) > 0) {
      setDebitAmount("");
    }
    if (errors.creditAmount || errors.debitAmount) {
      setErrors((prev) => ({ ...prev, creditAmount: "", debitAmount: "" }));
    }
  };

  const handleDebitChange = (val: string) => {
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

    const payload = {
      transactionDate: date,
      partyName: partyName.trim(),
      purpose: purpose.trim(),
      creditAmount: creditAmount ? parseFloat(creditAmount) : 0,
      debitAmount: debitAmount ? parseFloat(debitAmount) : 0,
    };

    const validationErrors = validateCreateTransaction(payload);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      const created = await createMutation.mutateAsync(payload);
      toast.success("Transaction created successfully");
      resetForm();
      onOpenChange(false);
      onSuccess?.(created);
    } catch (err: any) {
      const msg = err?.message || err?.error || "Failed to create transaction";
      toast.error(msg);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) resetForm();
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
              <PlusCircle className="h-4 w-4" />
            </div>
            <DialogTitle className="font-display text-xl">Create Transaction Voucher</DialogTitle>
          </div>
          <DialogDescription>
            Record a new financial entry in the ledger. Must have either a credit (inflow) or debit (outflow) amount.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-1">
          {/* Date & Party Name */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label
                htmlFor="create-date"
                className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
              >
                Date <span className="text-primary">*</span>
              </Label>
              <Input
                id="create-date"
                type="date"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  if (errors.transactionDate) {
                    setErrors((prev) => ({ ...prev, transactionDate: "" }));
                  }
                }}
                className={errors.transactionDate ? "border-destructive" : ""}
                required
              />
              {errors.transactionDate && (
                <p className="text-xs text-destructive">{errors.transactionDate}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="create-party"
                className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
              >
                Party Name <span className="text-primary">*</span>
              </Label>
              <Input
                id="create-party"
                placeholder="e.g. AWS Cloud, Client Acme, Vendor"
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

          {/* Credit & Debit (Mutually Exclusive) */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label
                htmlFor="create-credit"
                className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
              >
                Credit Amount (+)
              </Label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-muted-foreground">
                  ₹
                </span>
                <Input
                  id="create-credit"
                  type="number"
                  step="any"
                  min="0"
                  placeholder="0.00"
                  value={creditAmount}
                  onChange={(e) => handleCreditChange(e.target.value)}
                  className={`pl-7 font-mono ${errors.creditAmount ? "border-destructive" : ""}`}
                />
              </div>
              {errors.creditAmount && (
                <p className="text-xs text-destructive">{errors.creditAmount}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="create-debit"
                className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
              >
                Debit Amount (-)
              </Label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-muted-foreground">
                  ₹
                </span>
                <Input
                  id="create-debit"
                  type="number"
                  step="any"
                  min="0"
                  placeholder="0.00"
                  value={debitAmount}
                  onChange={(e) => handleDebitChange(e.target.value)}
                  className={`pl-7 font-mono ${errors.debitAmount ? "border-destructive" : ""}`}
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
              htmlFor="create-purpose"
              className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
            >
              Purpose / Description <span className="text-primary">*</span>
            </Label>
            <Textarea
              id="create-purpose"
              placeholder="e.g. Monthly cloud infrastructure billing, Q3 retainer payment..."
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
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="shadow-glow"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <PlusCircle className="mr-1.5 h-4 w-4" /> Save Voucher
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
