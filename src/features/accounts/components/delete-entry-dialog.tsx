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
import { useDeleteAccountEntry } from "../hooks/use-accounts";
import type { AccountEntry } from "../types";

interface DeleteAccountEntryDialogProps {
  open: boolean;
  entry: AccountEntry | null;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function DeleteAccountEntryDialog({
  open,
  entry,
  onOpenChange,
  onSuccess,
}: DeleteAccountEntryDialogProps) {
  const deleteMutation = useDeleteAccountEntry();

  if (!entry) return null;

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(entry.id);
      toast.success("Account entry deleted successfully");
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete account entry");
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Account Entry?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the entry for <strong>{entry.name}</strong> (₹
            {Number(entry.credit || entry.debit).toLocaleString("en-IN")})?{" "}
            <span className="font-semibold text-foreground">This action can't be undone.</span>
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
