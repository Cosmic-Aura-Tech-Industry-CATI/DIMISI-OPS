import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useDeleteTransactionMutation } from "../hooks/accounts.hooks";
import { formatCurrency, formatDate } from "../utils/accounts.utils";
import type { AccountTransaction } from "../types/accounts.types";

interface DeleteAccountEntryDialogProps {
  open: boolean;
  entry: AccountTransaction | null;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function DeleteAccountEntryDialog({
  open,
  entry,
  onOpenChange,
  onSuccess,
}: DeleteAccountEntryDialogProps) {
  const deleteMutation = useDeleteTransactionMutation();

  if (!entry) return null;

  const id = entry._id || entry.id;
  const amount = entry.creditAmount > 0 ? entry.creditAmount : entry.debitAmount;
  const amountType = entry.creditAmount > 0 ? "Credit" : "Debit";

  const handleDelete = async () => {
    if (!id) {
      toast.error("Transaction identifier missing");
      return;
    }

    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Transaction voucher deleted successfully");
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      const msg = err?.message || err?.error || "Failed to delete transaction";
      toast.error(msg);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Transaction Voucher?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <span>
              Are you sure you want to delete the voucher for{" "}
              <strong className="text-foreground">{entry.partyName || "Unnamed Party"}</strong>{" "}
              dated <strong className="text-foreground">{formatDate(entry.transactionDate)}</strong>{" "}
              ({amountType}: <strong className="text-foreground">{formatCurrency(amount)}</strong>)?
            </span>
            <span className="block text-xs text-muted-foreground">
              This will update the ledger running balance and soft-delete the record from active view.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              void handleDelete();
            }}
            disabled={deleteMutation.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteMutation.isPending ? (
              <>
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Deleting...
              </>
            ) : (
              <>
                <Trash2 className="mr-1.5 h-4 w-4" /> Confirm Delete
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export { DeleteAccountEntryDialog as DeleteEntryDialog };
