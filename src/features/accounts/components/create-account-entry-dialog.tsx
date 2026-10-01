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
import { useCreateAccountEntry } from "../hooks/use-accounts";
import type { AccountEntry } from "../types";

interface CreateAccountEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (entry: AccountEntry) => void;
}

export function CreateAccountEntryDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateAccountEntryDialogProps) {
  const createMutation = useCreateAccountEntry();

  const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [name, setName] = useState<string>("");
  const [credit, setCredit] = useState<string>("");
  const [debit, setDebit] = useState<string>("");
  const [reason, setReason] = useState<string>("");

  const [errors, setErrors] = useState<Record<string, string>>({});

  const resetForm = () => {
    setDate(new Date().toISOString().split("T")[0]);
    setName("");
    setCredit("");
    setDebit("");
    setReason("");
    setErrors({});
  };

  const handleCreditChange = (val: string) => {
    setCredit(val);
    if (val && parseFloat(val) > 0) {
      setDebit("");
    }
    if (errors.credit || errors.debit) {
      setErrors((prev) => ({ ...prev, credit: "", debit: "" }));
    }
  };

  const handleDebitChange = (val: string) => {
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
    if (!date) errs.date = "Date is required";
    if (!name.trim()) errs.name = "Account/party name is required";
    if (!reason.trim()) errs.reason = "Reason/description is required";

    const cr = credit ? parseFloat(credit) : 0;
    const db = debit ? parseFloat(debit) : 0;

    if (isNaN(cr) || cr < 0) errs.credit = "Credit must be a valid positive number";
    if (isNaN(db) || db < 0) errs.debit = "Debit must be a valid positive number";

    if (cr > 0 && db > 0) {
      errs.credit = "An entry must have either Credit OR Debit, not both";
      errs.debit = "An entry must have either Credit OR Debit, not both";
    } else if (cr <= 0 && db <= 0) {
      errs.credit = "Specify either Credit or Debit amount";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const created = await createMutation.mutateAsync({
        date,
        name: name.trim(),
        credit: parseFloat(credit) || 0,
        debit: parseFloat(debit) || 0,
        reason: reason.trim(),
        isUploaded: false,
      });

      toast.success("Account entry created successfully");
      resetForm();
      onOpenChange(false);
      onSuccess?.(created);
    } catch (err: any) {
      toast.error(err?.message || "Failed to create account entry");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
              <PlusCircle className="h-4 w-4" />
            </div>
            <DialogTitle className="font-display text-xl">Create Account Entry</DialogTitle>
          </div>
          <DialogDescription>
            Record a new financial voucher, income credit, or expenditure debit into the ledger.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-1">
          {/* Date & Name */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="create-date" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Date <span className="text-primary">*</span>
              </Label>
              <Input
                id="create-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={errors.date ? "border-destructive" : ""}
                required
              />
              {errors.date && <p className="text-xs text-destructive">{errors.date}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="create-name" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Name / Party <span className="text-primary">*</span>
              </Label>
              <Input
                id="create-name"
                placeholder="e.g. Acme Corp, Client X, Vendor Y"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={errors.name ? "border-destructive" : ""}
                required
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>
          </div>

          {/* Credit & Debit (Either / Or) */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="create-credit" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Credit (+)
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
                  value={credit}
                  onChange={(e) => handleCreditChange(e.target.value)}
                  className={`pl-7 font-mono ${errors.credit ? "border-destructive" : ""}`}
                />
              </div>
              {errors.credit && <p className="text-xs text-destructive">{errors.credit}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="create-debit" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Debit (-)
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
                  value={debit}
                  onChange={(e) => handleDebitChange(e.target.value)}
                  className={`pl-7 font-mono ${errors.debit ? "border-destructive" : ""}`}
                />
              </div>
              {errors.debit && <p className="text-xs text-destructive">{errors.debit}</p>}
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-1.5">
            <Label htmlFor="create-reason" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Reason / Purpose <span className="text-primary">*</span>
            </Label>
            <Textarea
              id="create-reason"
              placeholder="e.g. Monthly cloud hosting invoice, Consulting milestone retainer..."
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
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending} className="shadow-glow">
              {createMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <PlusCircle className="mr-1.5 h-4 w-4" /> Save Entry
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
