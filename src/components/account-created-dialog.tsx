import { CheckCircle2 } from "lucide-react";
import { IdBadge } from "@/components/id-badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

export function AccountCreatedDialog({
  open,
  kind,
  name,
  code,
  email,
  onDone,
  onCreateAnother,
}: {
  open: boolean;
  kind: "Employee" | "Admin";
  name: string;
  code: string;
  email: string;
  onDone: () => void;
  onCreateAnother: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onDone()}>
      <DialogContent className="max-w-md rounded-md p-0">
        <div className="space-y-5 p-6 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-md border border-primary/30 bg-primary/10">
            <CheckCircle2 className="h-7 w-7 text-primary" />
          </div>
          <div className="space-y-1">
            <DialogTitle className="card-title text-lg font-semibold">
              {kind} Created Successfully
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {name} can now sign in through the {kind} Portal.
            </DialogDescription>
          </div>

          <div className="space-y-3 rounded-md border border-border/60 bg-card/50 p-4 text-left">
            <Row label={`${kind} ID`}>
              <IdBadge id={code} />
            </Row>
            <Row label="Login email">
              <span className="truncate text-sm">{email}</span>
            </Row>
          </div>

          <p className="text-xs text-muted-foreground">
            A temporary password has been created for this account. Ask them to change it after the
            first sign-in.
          </p>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" className="flex-1 rounded-md" onClick={onCreateAnother}>
              Create another
            </Button>
            <Button className="flex-1 rounded-md" onClick={onDone}>
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}
